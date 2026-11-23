import {
  HS_REFERENCE_CATALOG,
  verifyHsCodeAndLartas,
  type HsVerificationResult,
} from "@shared/exportCompliance";

export interface GuardrailCheckResult {
  shouldAbstain: boolean;
  abstainReason?: "unverified_hs_code" | "unsupported_destination" | "legal_advice_disclaimer";
  responseMessage?: string;
  extractedHsCode?: string;
  isVerified?: boolean;
  verificationData?: HsVerificationResult | null;
}

const REGULATION_INTENT_PATTERNS = [
  /\b(?:regulasi|lartas|izin\s+ekspor|legalitas|kepabeanan|bea\s+cukai|larangan|pembatasan|syarat\s+ekspor|pebe|dokumen\s+ekspor)\b/i,
  /\b(?:regulation|compliance|customs|prohibition|restriction|export\s+permit|legality)\b/i,
];

const HS_CODE_PATTERN = /\b(?:HS\s*(?:Code)?|Kode\s*HS)\s*[:=]?\s*([0-9]{4}(?:\.[0-9]{2,4}){1,2}|[0-9]{4,10})\b/i;
const BARE_HS_PATTERN = /\b([0-9]{4}(?:\.[0-9]{2,4}){1,2})\b/;

/**
 * Mengekstrak kode HS dari teks pertanyaan atau snapshot transaksi.
 */
export function extractHsCode(text: string): string | null {
  if (!text) return null;
  const match = text.match(HS_CODE_PATTERN);
  if (match?.[1]) {
    return match[1].trim();
  }
  const bareMatch = text.match(BARE_HS_PATTERN);
  if (bareMatch?.[1]) {
    return bareMatch[1].trim();
  }
  return null;
}

/**
 * Memeriksa apakah pertanyaan pengguna berkaitan dengan regulasi/legalitas kepabeanan ekspor.
 */
export function isRegulationQuery(question: string): boolean {
  if (!question) return false;
  return REGULATION_INTENT_PATTERNS.some((p) => p.test(question));
}

/**
 * Guardrail Kepatuhan Regulasi Ekspor:
 * Memeriksa apakah kode HS atau regulasi negara tujuan terdaftar di database resmi terverifikasi.
 * Jika tidak ditemukan di database terverifikasi, AI WAJIB menyatakan
 * "Data regulasi resmi untuk kode HS tersebut belum terverifikasi" dan menolak berspekulasi.
 */
export function evaluateExportGuardrails(
  question: string,
  snapshotText: string = "",
): GuardrailCheckResult {
  const isRegQuery = isRegulationQuery(question);
  const hsCode = extractHsCode(question) || extractHsCode(snapshotText);

  // Jika bukan pertanyaan regulasi dan tidak menyebutkan kode HS spesifik, izinkan flow normal
  if (!isRegQuery && !hsCode) {
    return { shouldAbstain: false };
  }

  // Jika menyebutkan kode HS atau menanyakan regulasi:
  if (hsCode) {
    const cleanHs = hsCode.replace(/\s+/g, "").toLowerCase();
    
    // Cari kecocokan di katalog resmi yang telah diverifikasi
    const catalogMatch = HS_REFERENCE_CATALOG.find((entry) => {
      const entryHsClean = entry.hsCode.replace(/\s+/g, "").toLowerCase();
      return (
        cleanHs.startsWith(entryHsClean.slice(0, 4)) ||
        entryHsClean.startsWith(cleanHs.slice(0, 4))
      );
    });

    if (!catalogMatch) {
      // Kode HS tidak terdaftar di database resmi terverifikasi -> WAJIB ABSTAIN
      const responseMessage = [
        `Data regulasi resmi untuk kode HS tersebut belum terverifikasi (${hsCode}).`,
        `Sesuai standar kepatuhan ekspor Eksporflow, kami tidak berspekulasi terkait legalitas kepabeanan, ketentuan lartas (larangan dan pembatasan), maupun persyaratan dokumen izin ekspor untuk kode HS yang belum masuk database terverifikasi.`,
        `Langkah Verifikasi Resmi yang Wajib Dilakukan:`,
        `1. Kunjungi portal INSW (Indonesia National Single Window) di https://insw.go.id/intr untuk cek BTKI dan status Lartas ekspor.`,
        `2. Konsultasikan dengan Kantor Pelayanan Bea dan Cukai (KPPBC) tempat pemuatan kargo atau forwarder berlisensi PPJK.`,
        `3. Pastikan klasifikasi 8-digit HS Code sesuai uraian barang pada draft Pemberitahuan Ekspor Barang (PEB).`,
      ].join("\n\n");

      return {
        shouldAbstain: true,
        abstainReason: "unverified_hs_code",
        responseMessage,
        extractedHsCode: hsCode,
        isVerified: false,
        verificationData: null,
      };
    }

    // Kode HS terverifikasi
    const verification = verifyHsCodeAndLartas("", hsCode, "");
    return {
      shouldAbstain: false,
      extractedHsCode: hsCode,
      isVerified: true,
      verificationData: verification,
    };
  }

  // Jika menanyakan regulasi kepabeanan tetapi tanpa kode HS sama sekali:
  if (isRegQuery && !hsCode) {
    // Minta spesifikasi kode HS agar tidak berspekulasi
    return {
      shouldAbstain: false, // Boleh dijawab tetapi di-grounding dengan permintaan kode HS
    };
  }

  return { shouldAbstain: false };
}
