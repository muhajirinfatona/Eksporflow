import type { Incoterm } from "./shipment";

export interface DocumentTradeMetadata {
  documentType?: "Purchase Order" | "Proforma Invoice" | "Sales Contract";
  reference?: string;
  incoterm?: Incoterm | string;
  namedPlace?: string;
  currency?: string;
  netWeightKg?: number;
  grossWeightKg?: number;
  quantity?: number;
  unitPrice?: number;
  totalAmount?: number;
  paymentTerms?: string;
  buyerName?: string;
  destinationPort?: string;
}

export type DiscrepancySeverity = "error" | "warning" | "info";

export interface CrossDocumentDiscrepancy {
  id: string;
  field: "incoterms" | "weights" | "currency" | "totalAmount" | "paymentTerms" | "parties";
  severity: DiscrepancySeverity;
  title: string;
  description: string;
  poValue?: string;
  piValue?: string;
  contractValue?: string;
  recommendation: string;
}

export interface CrossDocumentScreeningReport {
  score: number; // 0 - 100
  status: "verified" | "warning" | "high_risk";
  hasErrors: boolean;
  discrepancies: CrossDocumentDiscrepancy[];
  summary: string;
  screenedAt: string;
}

/**
 * Normalisasi kode Incoterm ke 3 huruf kapital standar ICC Incoterms 2020.
 */
function normalizeIncoterm(term?: string): string {
  if (!term) return "";
  const match = term.toUpperCase().match(/\b(FOB|CIF|CFR|EXW|FCA|CPT|CIP|DAP|DPU|DDP|FAS)\b/);
  return match ? match[1] : term.trim().toUpperCase();
}

/**
 * Normalisasi valuta asing (USD, EUR, IDR, JPY, SGD, AUD, GBP, dsb).
 */
function normalizeCurrency(curr?: string): string {
  if (!curr) return "";
  const cleaned = curr.trim().toUpperCase();
  if (cleaned.includes("$") || cleaned.includes("USD")) return "USD";
  if (cleaned.includes("€") || cleaned.includes("EUR")) return "EUR";
  if (cleaned.includes("¥") || cleaned.includes("JPY")) return "JPY";
  if (cleaned.includes("£") || cleaned.includes("GBP")) return "GBP";
  if (cleaned.includes("RP") || cleaned.includes("IDR")) return "IDR";
  return cleaned;
}

/**
 * Mengekstrak metadata dagang dari teks mentah dokumen jika belum berbentuk terstruktur.
 */
export function extractTradeMetadataFromText(
  text: string,
  docType?: DocumentTradeMetadata["documentType"],
): DocumentTradeMetadata {
  const metadata: DocumentTradeMetadata = { documentType: docType };
  if (!text) return metadata;

  // 1. Incoterm
  const incoMatch = text.match(/\b(FOB|CIF|CFR|EXW|FCA|CPT|CIP|DAP|DPU|DDP|FAS)\b/i);
  if (incoMatch) metadata.incoterm = incoMatch[1].toUpperCase();

  // 2. Currency
  const currMatch = text.match(/\b(USD|EUR|JPY|GBP|IDR|SGD|AUD)\b|\$|€|¥/i);
  if (currMatch) metadata.currency = normalizeCurrency(currMatch[0]);

  // 3. Total Amount
  const amountMatch = text.match(/(?:Total\s*(?:Amount|Value)?|Nilai\s*Total)\s*[:=]?\s*(?:[A-Z]{3}|\$)?\s*([\d,]+\.?\d*)/i);
  if (amountMatch) {
    const rawNum = amountMatch[1].replace(/,/g, "");
    const parsed = parseFloat(rawNum);
    if (!isNaN(parsed)) metadata.totalAmount = parsed;
  }

  // 4. Net & Gross Weight
  const netMatch = text.match(/(?:Net\s*Weight|Berat\s*Bersih|Netto)\s*[:=]?\s*([\d,]+\.?\d*)\s*(?:KGS?|MT|TON)/i);
  if (netMatch) {
    const raw = netMatch[1].replace(/,/g, "");
    metadata.netWeightKg = parseFloat(raw);
  }

  const grossMatch = text.match(/(?:Gross\s*Weight|Berat\s*Kotor|Bruto)\s*[:=]?\s*([\d,]+\.?\d*)\s*(?:KGS?|MT|TON)/i);
  if (grossMatch) {
    const raw = grossMatch[1].replace(/,/g, "");
    metadata.grossWeightKg = parseFloat(raw);
  }

  return metadata;
}

/**
 * Melakukan screening inkonsistensi silang (cross-document) antara
 * Purchase Order (PO), Proforma Invoice (PI), dan Sales Contract (SC).
 */
export function screenCrossDocumentInconsistencies(params: {
  po?: DocumentTradeMetadata | string;
  pi?: DocumentTradeMetadata | string;
  contract?: DocumentTradeMetadata | string;
  tolerancePercent?: number; // Default 2% sesuai standar ICC
}): CrossDocumentScreeningReport {
  const discrepancies: CrossDocumentDiscrepancy[] = [];
  const tolerance = params.tolerancePercent ?? 2.0;

  const poMeta = typeof params.po === "string" ? extractTradeMetadataFromText(params.po, "Purchase Order") : (params.po || {});
  const piMeta = typeof params.pi === "string" ? extractTradeMetadataFromText(params.pi, "Proforma Invoice") : (params.pi || {});
  const scMeta = typeof params.contract === "string" ? extractTradeMetadataFromText(params.contract, "Sales Contract") : (params.contract || {});

  // -------------------------------------------------------------
  // 1. INCOTERMS 2020 MISMATCH
  // -------------------------------------------------------------
  const poInco = normalizeIncoterm(poMeta.incoterm);
  const piInco = normalizeIncoterm(piMeta.incoterm);
  const scInco = normalizeIncoterm(scMeta.incoterm);

  if (poInco && piInco && poInco !== piInco) {
    discrepancies.push({
      id: "err-incoterm-po-pi-mismatch",
      field: "incoterms",
      severity: "error",
      title: "Inkonsistensi Incoterms 2020 (PO vs Proforma Invoice)",
      description: `Purchase Order mensyaratkan '${poInco}', namun Proforma Invoice mencantumkan '${piInco}'. Perbedaan ini menyebabkan perselisihan tanggung jawab ongkos angkut (freight) dan asuransi kargo.`,
      poValue: poInco,
      piValue: piInco,
      contractValue: scInco || undefined,
      recommendation: `Klarifikasi dengan buyer dan terbitkan revisi Proforma Invoice agar klausul Incoterms seragam '${poInco}'.`,
    });
  }

  if (poInco && scInco && poInco !== scInco) {
    discrepancies.push({
      id: "err-incoterm-po-sc-mismatch",
      field: "incoterms",
      severity: "error",
      title: "Inkonsistensi Incoterms 2020 (PO vs Sales Contract)",
      description: `Purchase Order menetapkan '${poInco}', tetapi Sales Contract mengikat '${scInco}'. Bank koresponden dan bea cukai dapat menolak dokumen ekspor karena diskrepansi ini.`,
      poValue: poInco,
      contractValue: scInco,
      recommendation: `Pastikan Sales Contract mencerminkan persetujuan penyerahan barang yang sama dengan PO.`,
    });
  }

  // -------------------------------------------------------------
  // 2. TOLERANSI BOBOT KOTOR & BOBOT BERSIH (WEIGHTS & PACKAGING)
  // -------------------------------------------------------------
  const checkWeights = (meta: DocumentTradeMetadata, docName: string) => {
    if (meta.netWeightKg && meta.grossWeightKg) {
      if (meta.grossWeightKg <= meta.netWeightKg) {
        discrepancies.push({
          id: `err-weight-gross-le-net-${docName.toLowerCase().replace(/\s+/g, "-")}`,
          field: "weights",
          severity: "error",
          title: `Berat Kotor Tidak Logis pada ${docName}`,
          description: `Berat kotor (${meta.grossWeightKg.toLocaleString()} kg) lebih kecil atau sama dengan berat bersih (${meta.netWeightKg.toLocaleString()} kg). Berat kemasan (tare weight) wajib bernilai positif.`,
          recommendation: `Koreksi berat bruto pada ${docName} agar memperhitungkan bobot kemasan, karung/karton, dan pallet.`,
        });
      }
    }
  };

  checkWeights(poMeta, "Purchase Order");
  checkWeights(piMeta, "Proforma Invoice");
  checkWeights(scMeta, "Sales Contract");

  // Toleransi berat antar dokumen (PO vs Contract)
  if (poMeta.netWeightKg && scMeta.netWeightKg) {
    const diffKg = Math.abs(poMeta.netWeightKg - scMeta.netWeightKg);
    const diffPct = (diffKg / poMeta.netWeightKg) * 100;
    if (diffPct > tolerance) {
      discrepancies.push({
        id: "warn-weight-tolerance-exceeded",
        field: "weights",
        severity: "warning",
        title: "Perbedaan Berat Bersih Melebihi Batas Toleransi",
        description: `Berat bersih PO (${poMeta.netWeightKg.toLocaleString()} kg) berbeda ${diffPct.toFixed(2)}% dari Kontrak (${scMeta.netWeightKg.toLocaleString()} kg). Batas toleransi standar komoditas ekspor adalah +/- ${tolerance}%.`,
        poValue: `${poMeta.netWeightKg.toLocaleString()} kg`,
        contractValue: `${scMeta.netWeightKg.toLocaleString()} kg`,
        recommendation: `Sesuaikan jumlah koli pengapalan atau pastikan klausul toleransi kuantitas (+/- ${Math.ceil(diffPct)}%) telah disetujui kedua pihak.`,
      });
    }
  }

  // -------------------------------------------------------------
  // 3. VALUTA ASING / CURRENCY MISMATCH
  // -------------------------------------------------------------
  const poCurr = normalizeCurrency(poMeta.currency);
  const piCurr = normalizeCurrency(piMeta.currency);
  const scCurr = normalizeCurrency(scMeta.currency);

  if (poCurr && piCurr && poCurr !== piCurr) {
    discrepancies.push({
      id: "err-currency-po-pi-mismatch",
      field: "currency",
      severity: "error",
      title: "Ketidaksesuaian Valuta Asing (PO vs Proforma Invoice)",
      description: `Purchase Order menggunakan mata uang '${poCurr}', sedangkan Proforma Invoice mencantumkan '${piCurr}'. Hal ini menimbulkan risiko selisih kurs dan hambatan penerbitan L/C.`,
      poValue: poCurr,
      piValue: piCurr,
      recommendation: `Gunakan mata uang pembayaran yang identik antara dokumen PO dan faktur komersial.`,
    });
  }

  if (poCurr && scCurr && poCurr !== scCurr) {
    discrepancies.push({
      id: "err-currency-po-sc-mismatch",
      field: "currency",
      severity: "error",
      title: "Ketidaksesuaian Valuta Asing (PO vs Sales Contract)",
      description: `Mata uang pada PO (${poCurr}) berbeda dengan mata uang di Sales Contract (${scCurr}).`,
      poValue: poCurr,
      contractValue: scCurr,
      recommendation: `Selaraskan valuta kontrak ekspor dengan Purchase Order resmi.`,
    });
  }

  // -------------------------------------------------------------
  // 4. TOTAL AMOUNT DISCREPANCY
  // -------------------------------------------------------------
  if (poMeta.totalAmount && piMeta.totalAmount && poCurr === piCurr && poCurr !== "") {
    const diff = Math.abs(poMeta.totalAmount - piMeta.totalAmount);
    if (diff > 1) {
      discrepancies.push({
        id: "err-total-amount-mismatch",
        field: "totalAmount",
        severity: "error",
        title: "Selisih Total Nilai Finansial (PO vs Proforma Invoice)",
        description: `Total nilai PO (${poCurr} ${poMeta.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}) tidak sama dengan Proforma Invoice (${piCurr} ${piMeta.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}). Selisih: ${poCurr} ${diff.toFixed(2)}.`,
        poValue: `${poCurr} ${poMeta.totalAmount.toFixed(2)}`,
        piValue: `${piCurr} ${piMeta.totalAmount.toFixed(2)}`,
        recommendation: `Periksa rincian biaya muatan, harga satuan, atau diskon agar total nilai sinkron hingga digit sen.`,
      });
    }
  }

  // Hitung Skor
  const errorCount = discrepancies.filter((d) => d.severity === "error").length;
  const warningCount = discrepancies.filter((d) => d.severity === "warning").length;

  let score = 100 - errorCount * 30 - warningCount * 10;
  score = Math.max(10, Math.min(100, score));

  let status: "verified" | "warning" | "high_risk" = "verified";
  if (errorCount > 0 || score < 70) {
    status = "high_risk";
  } else if (warningCount > 0 || score < 90) {
    status = "warning";
  }

  let summary = "";
  if (status === "verified") {
    summary = "Pemeriksaan konsistensi silang dokumen 100% sinkron (Incoterms 2020, bobot, valuta, dan nilai finansial cocok).";
  } else if (status === "warning") {
    summary = `Ditemukan ${warningCount} peringatan toleransi teknis yang disarankan untuk diklarifikasi dengan buyer.`;
  } else {
    summary = `Perhatian Kritis: Ditemukan ${errorCount} ketidaksesuaian antar dokumen (PO, PI, SC) yang berisiko memicu sengketa dagang atau diskrepansi perbankan L/C.`;
  }

  return {
    score,
    status,
    hasErrors: errorCount > 0,
    discrepancies,
    summary,
    screenedAt: new Date().toISOString(),
  };
}
