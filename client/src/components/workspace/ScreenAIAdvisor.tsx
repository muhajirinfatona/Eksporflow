import { trpc } from "@/lib/trpc";
import { formatMoney, formatNumber } from "@shared/format";
import type { Pricing } from "@shared/pricing";
import type { ScreenId } from "@shared/risk";
import type { ContainerCalc, Shipment } from "@shared/shipment";
import type { WorkspaceFlow } from "@/hooks/useWorkspaceFlow";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Info,
  Loader2,
  Send,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

export interface ScreenAdvisorInsight {
  screenId: ScreenId;
  riskLevel: "danger" | "warning" | "info" | "success";
  badgeText: string;
  title: string;
  mitigationText: string;
  suggestedQuestions: string[];
  initialPrompt: string;
}

export function getScreenAdvisorInsight(
  screen: ScreenId,
  shipment: Shipment,
  pricing: Pricing,
  container: ContainerCalc,
  flow: WorkspaceFlow,
): ScreenAdvisorInsight {
  switch (screen) {
    case "dashboard":
      if (shipment.margin <= 10) {
        return {
          screenId: screen,
          riskLevel: "warning",
          badgeText: "Risiko Margin Tipis",
          title: `Margin Bersih Rendah (${shipment.margin}%) Menghadapi Fluktuasi Biaya Freight`,
          mitigationText: `Margin di bawah 10% rentan tergerus fluktuasi ocean freight atau demurrage pelabuhan. Pertimbangkan menaikkan buffer contingency atau tawarkan opsi FOB ke buyer.`,
          suggestedQuestions: [
            `Bagaimana cara mengamankan margin bersih ${shipment.margin}% dari fluktuasi biaya?`,
            "Klausul apa yang bisa melindungi eksportir jika biaya freight tiba-tiba naik?",
            "Apakah lebih aman beralih ke term FOB untuk transaksi ini?",
          ],
          initialPrompt: `Analisis risiko margin tipis ${shipment.margin}% pada transaksi ${shipment.reference} dan berikan rekomendasi mitigasinya.`,
        };
      }
      return {
        screenId: screen,
        riskLevel: "info",
        badgeText: "Kesiapan Operasional Terpantau",
        title:
          shipment.reference && !shipment.reference.startsWith("EXP-")
            ? `Transaksi Aktif (${shipment.reference}): ${shipment.incoterm} · ${formatMoney(pricing.active.offer, shipment.currency)}`
            : `Transaksi Aktif: ${shipment.incoterm} · ${formatMoney(pricing.active.offer, shipment.currency)}`,
        mitigationText: `Seluruh parameter inti terhubung dengan modul kalkulator harga, kargo 3D, dan dokumen ekspor. Verifikasi klausul pembayaran dan izin ekspor sebelum jadwal closing kapal.`,
        suggestedQuestions: [
          shipment.reference && !shipment.reference.startsWith("EXP-")
            ? `Ringkas risiko terbesar pada transaksi ${shipment.reference} saat ini`
            : "Ringkas risiko terbesar pada transaksi ekspor ini saat ini",
          "Kapan batas waktu aman konfirmasi booking kapal ke forwarder?",
          "Apa saja dokumen yang wajib siap sebelum kontainer masuk pelabuhan?",
        ],
        initialPrompt: `Bantu tinjau kesiapan menyeluruh transaksi ekspor ke ${shipment.destination || "pelabuhan tujuan"} dan mitigasi risiko operasionalnya.`,
      };

    case "pricing":
      if (pricing.validationErrors.length > 0) {
        return {
          screenId: screen,
          riskLevel: "danger",
          badgeText: "Validasi Harga Perlu Koreksi",
          title: "Terdapat Ketidaksesuaian Komponen Biaya Kalkulasi",
          mitigationText: `${pricing.validationErrors[0]}. Perbaiki sebelum quotation dikirim agar eksportir tidak menanggung selisih biaya dari margin sendiri.`,
          suggestedQuestions: [
            "Kenapa validasi harga mendeteksi error ini?",
            "Bagaimana cara menghitung komponen biaya yang benar?",
            "Apa dampak salah hitung freight terhadap tagihan buyer?",
          ],
          initialPrompt: `Ada error pada kalkulasi harga transaksi ${shipment.reference}: ${pricing.validationErrors[0]}. Tolong jelaskan solusinya.`,
        };
      }
      if (shipment.incoterm === "DDP") {
        return {
          screenId: screen,
          riskLevel: "warning",
          badgeText: "Risiko Bea Masuk & Pajak Impor",
          title: "Incoterms® DDP Membebankan Pajak Impor & Customs Clearance Tujuan ke Eksportir",
          mitigationText: `Term DDP mewajibkan eksportir membayar import duty & VAT di ${shipment.buyerCountry || "negara tujuan"}. Tanpa izin importir lokal, kargo bisa tertahan di pabean tujuan. Pertimbangkan beralih ke DAP atau CIF.`,
          suggestedQuestions: [
            `Apa saja risiko tersembunyi menggunakan term DDP ke ${shipment.buyerCountry}?`,
            "Bagaimana perbandingan tanggung jawab DDP vs DAP vs CIF?",
            "Apakah eksportir Indonesia bisa mengurus clearance di negara tujuan tanpa entitas lokal?",
          ],
          initialPrompt: `Saya menggunakan Incoterms DDP untuk pengiriman ke ${shipment.buyerCountry || "negara tujuan"}. Apa saja risiko pajak impor dan clearance yang wajib diwaspadai?`,
        };
      }
      if (shipment.incoterm === "CIF" || shipment.incoterm === "CFR") {
        return {
          screenId: screen,
          riskLevel: "info",
          badgeText: "Kewajiban Ocean Freight",
          title: `Skenario ${shipment.incoterm}: Freight Terkunci pada Penawaran Eksportir`,
          mitigationText: `Pastikan masa berlaku penawaran ocean freight dari shipping line sejalan dengan quotation Anda. Pada CIF, pastikan polis marine cargo insurance memakai Institute Cargo Clauses (A) all-risk.`,
          suggestedQuestions: [
            `Klausul asuransi apa yang wajib dipenuhi dalam skenario CIF?`,
            "Bagaimana jika tarif freight kapal naik setelah quotation disetujui buyer?",
            "Kapan titik peralihan risiko (risk transfer) terjadi pada Incoterm CIF?",
          ],
          initialPrompt: `Jelaskan titik peralihan risiko dan klausul asuransi laut yang wajib dicantumkan pada penawaran ${shipment.incoterm} untuk ${shipment.product}.`,
        };
      }
      return {
        screenId: screen,
        riskLevel: "info",
        badgeText: "Struktur Biaya 7 Incoterms",
        title: `Penawaran Aktif ${shipment.incoterm} dengan Margin Bersih ${shipment.margin}%`,
        mitigationText: `Periksa selisih biaya dari basis EXW hingga ${shipment.incoterm}. Pastikan biaya penanganan lokal (trucking pelabuhan & THC) telah menyertakan buffer contingency minimal 3-5%.`,
        suggestedQuestions: [
          `Apakah margin ${shipment.margin}% sudah ideal untuk produk ${shipment.product}?`,
          "Berapa rata-rata contingency cost yang lazim untuk ekspor kontainer?",
          "Bagaimana cara memproteksi harga dari fluktuasi kurs mata uang asing?",
        ],
        initialPrompt: `Evaluasi struktur harga penawaran ${formatMoney(pricing.active.offer, shipment.currency)} (${shipment.incoterm}) untuk ${shipment.quantity} ${shipment.unit} ${shipment.product}.`,
      };

    case "cargo":
      if (container.volumeUtilization > 100 || container.weightUtilization > 100) {
        return {
          screenId: screen,
          riskLevel: "danger",
          badgeText: "Kapasitas Kontainer Overload",
          title: `Muatan Melebihi Batas Maksimal Kontainer (${container.volumeUtilization.toFixed(0)}% Vol / ${container.weightUtilization.toFixed(0)}% Berat)`,
          mitigationText: `Kargo melebihi batas standar kontainer ${shipment.containerType}. Shipping line akan menolak stuffing atau mengenakan denda overload pada timbangan pelabuhan (VGM). Solusi: Tambah jumlah kontainer atau sesuaikan volume muat.`,
          suggestedQuestions: [
            "Berapa kontainer yang dibutuhkan untuk menampung seluruh kargo ini?",
            "Apa sanksi pelabuhan jika berat muatan melebihi batas deklarasi VGM?",
            "Bagaimana cara menyusun packing agar muatan muat dalam 1 kontainer?",
          ],
          initialPrompt: `Kargo saya overload (${container.volumeUtilization.toFixed(0)}% volume, ${container.weightUtilization.toFixed(0)}% berat). Berikan rekomendasi penataan atau jumlah kontainer yang tepat.`,
        };
      }
      if (container.volumeUtilization < 60) {
        return {
          screenId: screen,
          riskLevel: "warning",
          badgeText: "Kapasitas Kontainer Rendah",
          title: `Utilisasi Ruang Rendah (${container.volumeUtilization.toFixed(0)}% CBM Terpakai)`,
          mitigationText: `Anda membayar freight penuh 1 kontainer FCL (${shipment.containerType}) namun hanya ${container.volumeUtilization.toFixed(0)}% terisi. Pertimbangkan opsi konsolidasi LCL atau tawarkan buyer menambah kuantiti pesanan untuk efisiensi ongkos kirim per unit.`,
          suggestedQuestions: [
            "Apakah pengiriman ini lebih hemat menggunakan LCL dibanding FCL?",
            "Berapa tambahan kuantiti barang agar kontainer terisi optimal di atas 85%?",
            "Bagaimana cara menahan barang (lashing & dunnage) agar tidak bergeser saat kontainer tidak penuh?",
          ],
          initialPrompt: `Utilisasi kontainer baru ${container.volumeUtilization.toFixed(0)}%. Apakah lebih efisien pakai FCL atau LCL untuk rute ke ${shipment.destination}?`,
        };
      }
      return {
        screenId: screen,
        riskLevel: "info",
        badgeText: "Standar Kemasan & ISPM-15",
        title: `Utilisasi Muatan Optimal: ${container.volumeUtilization.toFixed(0)}% Vol · ${container.containers} × ${shipment.containerType}`,
        mitigationText: `Pastikan pallet kayu memiliki sertifikat fumigasi/heat-treatment standar ISPM-15 dengan stempel IPPC resmi untuk mencegah penolakan karantina di pelabuhan tujuan (${shipment.destination || "tujuan"}).`,
        suggestedQuestions: [
          "Apa standar ISPM-15 yang wajib ada pada pallet kayu ekspor?",
          "Bagaimana cara mendeklarasikan Verified Gross Mass (VGM) ke shipping line?",
          "Alat pengikat kargo (lashing/strapping) apa yang disyaratkan untuk kargo ini?",
        ],
        initialPrompt: `Jelaskan checklist verifikasi kemasan ekspor, fumigasi pallet kayu ISPM-15, dan penimbangan berat kotor VGM untuk kontainer ini.`,
      };

    case "documents":
      if (!shipment.documentReviewed) {
        return {
          screenId: screen,
          riskLevel: "warning",
          badgeText: "Verifikasi 3-Way Belum Selesai",
          title: "Dokumen Masih Berstatus Draft — Belum Diverifikasi Konsistensi",
          mitigationText: `Commercial Invoice, Packing List, dan draft B/L belum direview. Perbedaan 1 karakter nama buyer atau selisih 1 kg berat kotor dapat menyebabkan penahanan pabean (Customs Hold) di pelabuhan tujuan.`,
          suggestedQuestions: [
            "Apa saja poin kritis yang harus dicocokkan antara Invoice, Packing List, dan B/L?",
            "Bagaimana jika nama consignee di invoice berbeda dengan di B/L?",
            "Kapan Commercial Invoice dan Packing List harus diserahkan ke broker bea cukai?",
          ],
          initialPrompt: `Tolong jelaskan langkah verifikasi 3-way match antara Commercial Invoice, Packing List, dan B/L untuk transaksi ${shipment.reference}.`,
        };
      }
      return {
        screenId: screen,
        riskLevel: "success",
        badgeText: "Dokumen Tervalidasi Legal",
        title: `4 Dokumen Ekspor Tervalidasi Legal (Revisi R${shipment.documentRevision})`,
        mitigationText: `Data invoice dan packing list sinkron. Pastikan dokumen dicetak di atas kop surat resmi perusahaan bertanda tangan basah dan stempel legal sebelum diserahkan ke bank atau agen pelayaran.`,
        suggestedQuestions: [
          `Dokumen tambahan apa (seperti COO / Form AK, Phytosanitary, atau Halal) yang wajib untuk ${shipment.buyerCountry}?`,
          "Bagaimana prosedur legalisasi dokumen jika diminta oleh buyer luar negeri?",
          "Berapa rangkap dokumen asli (Original) dan salinan (Copy) yang lazim disiapkan?",
        ],
        initialPrompt: `Dokumen ekspor ${shipment.reference} sudah valid. Apa saja dokumen kepabeanan tambahan yang mungkin diminta negara ${shipment.buyerCountry}?`,
      };

    case "shipment":
      if (!shipment.bookingNumber.trim()) {
        return {
          screenId: screen,
          riskLevel: "warning",
          badgeText: "Booking Kapal Belum Tercatat",
          title: "Nomor Booking & Jadwal Closing Time Belum Dikonfirmasi",
          mitigationText: `Segera konfirmasi Shipping Instruction (SI) ke freight forwarder untuk mengamankan slot kontainer sebelum masa peak season atau risiko penundaan jadwal kapal (blank sailing).`,
          suggestedQuestions: [
            "Data apa saja yang wajib dicantumkan dalam Shipping Instruction (SI)?",
            "Apa yang terjadi jika kargo terlambat masuk sebelum closing time pelabuhan?",
            "Bagaimana cara memitigasi risiko blank sailing atau keterlambatan kapal?",
          ],
          initialPrompt: `Bantu susun prosedur pengajuan Shipping Instruction (SI) yang aman ke forwarder untuk rute ke ${shipment.destination}.`,
        };
      }
      return {
        screenId: screen,
        riskLevel: "info",
        badgeText: "Proteksi Kepemilikan Kargo (B/L)",
        title: `Booking Terdaftar: ${shipment.bookingNumber} (${shipment.destination})`,
        mitigationText: `Perhatikan jenis B/L: Jangan menerbitkan Telex Release / Express Surrender jika pelunasan pembayaran buyer belum 100% diterima. Tahan Original B/L 3/3 sebagai jaminan hak kepemilikan kargo.`,
        suggestedQuestions: [
          "Kapan aman menggunakan Telex Release dibanding Original Bill of Lading?",
          "Bagaimana cara mengurus B/L jika menggunakan pembayaran Letter of Credit (LC)?",
          "Apa yang harus dilakukan jika kontainer tertahan demurrage di pelabuhan tujuan?",
        ],
        initialPrompt: `Jelaskan risiko penggunaan Telex Release vs Original B/L jika pembayaran buyer belum 100% lunas.`,
      };

    case "finance":
    case "bank":
    case "journals":
    case "reports":
      if (flow.remainingReceivable > 0 && !flow.finance.dpConfirmed) {
        return {
          screenId: screen,
          riskLevel: "warning",
          badgeText: "Risiko Piutang Dagang (Credit Risk)",
          title: `Piutang ${formatMoney(flow.remainingReceivable, shipment.currency)} Tanpa Konfirmasi Uang Muka (DP)`,
          mitigationText: `Memulai produksi atau memuat kargo tanpa DP minimal 30% atau L/C berisiko tinggi terhadap pembatalan pesanan sepihak oleh buyer asing. Pastikan dana efektif masuk rekening giro devisa sebelum stuffing.`,
          suggestedQuestions: [
            `Bagaimana cara menegosiasikan uang muka (DP) minimal 30% ke buyer baru?`,
            "Apa instrumen pembayaran ekspor yang paling aman selain T/T Cash in Advance?",
            "Bagaimana cara memproteksi transaksi dari risiko gagal bayar buyer internasional?",
          ],
          initialPrompt: `Saya memiliki sisa piutang ${formatMoney(flow.remainingReceivable, shipment.currency)} belum terkonfirmasi DP. Bagaimana strategi mitigasi risiko pembayarannya?`,
        };
      }
      return {
        screenId: screen,
        riskLevel: "success",
        badgeText: "Kepatuhan Devisa & AR",
        title: `Status Keuangan: ${flow.finance.arStatus} (Kas Masuk: ${formatMoney(flow.paidAmount, shipment.currency)})`,
        mitigationText: `Penerimaan devisa hasil ekspor wajib dicocokkan dengan nomor PEB pada sistem Devisa Hasil Ekspor (DHE) Bank Indonesia untuk mematuhi regulasi penempatan devisa SDA.`,
        suggestedQuestions: [
          "Apa kewajiban pelaporan Devisa Hasil Ekspor (DHE) ke Bank Indonesia?",
          "Berapa lama devisa hasil ekspor wajib ditempatkan di perbankan nasional?",
          "Bagaimana pencatatan jurnal akuntansi selisih kurs saat pembayaran diterima?",
        ],
        initialPrompt: `Jelaskan regulasi Devisa Hasil Ekspor (DHE) Bank Indonesia dan pencatatan akuntansi penerimaan valuta asing untuk transaksi ini.`,
      };

    case "risk":
      return {
        screenId: screen,
        riskLevel: flow.riskEvaluation.readinessPercent >= 80 ? "success" : "warning",
        badgeText: `Kesiapan Regulasi: ${flow.riskEvaluation.readinessPercent}%`,
        title: `Tingkat Risiko Transaksi: ${flow.riskEvaluation.riskLevel.toUpperCase()}`,
        mitigationText: `Evaluasi kesiapan mencakup kepatuhan regulasi larangan terbatas (Lartas), sanksi embargo negara tujuan (${shipment.buyerCountry || "tujuan"}), dan kelengkapan izin eksportir (NIB/Eksportir Terdaftar).`,
        suggestedQuestions: [
          `Apa saja lartas ekspor yang berlaku untuk produk ${shipment.product}?`,
          `Apakah ada sanksi perdagangan atau embargo yang berlaku di negara ${shipment.buyerCountry}?`,
          "Bagaimana menaikkan skor kesiapan transaksi agar menjadi 100% aman?",
        ],
        initialPrompt: `Bantu evaluasi seluruh poin risiko pada Risk Center transaksi ${shipment.reference} dan berikan panduan mitigasi kepatuhannya.`,
      };

    case "transactions":
      return {
        screenId: screen,
        riskLevel: "info",
        badgeText: "Sinkron Otomatis",
        title: "Data Transaksi Terhubung",
        mitigationText: "Data buyer, tujuan, dan HS Code otomatis tersinkron ke kalkulator harga, rencana muatan, dan dokumen legal.",
        suggestedQuestions: [
          "Bagaimana cara memverifikasi legalitas buyer baru?",
          "Apa dampak perubahan HS Code terhadap dokumen ekspor?",
        ],
        initialPrompt: "Bantu tinjau data transaksi ekspor ini agar sesuai dengan regulasi negara tujuan.",
      };

    case "approvals":
      return {
        screenId: screen,
        riskLevel: flow.effectiveApprovalStatus === "Tercatat direview" ? "success" : "warning",
        badgeText: "Audit Kontrol Penjualan",
        title: `Status Persetujuan Kontrak: ${flow.effectiveApprovalStatus}`,
        mitigationText: `Tinjau setiap deviasi margin, klausul tanggung jawab kerusakan kargo, dan batas toleransi selisih kuantiti muatan (+/- 5%) sebelum penandatanganan Sales Contract resmi.`,
        suggestedQuestions: [
          "Klausul proteksi apa saja yang wajib ada di Sales Contract ekspor?",
          "Bagaimana menetapkan klausul force majeure yang aman untuk eksportir?",
          "Siapa saja pihak internal yang wajib memberikan persetujuan sebelum kontrak diteken?",
        ],
        initialPrompt: `Bantu tinjau klausul kunci dalam Sales Contract ekspor untuk mencegah klaim sepihak dari buyer saat kargo tiba.`,
      };

    case "partners":
      return {
        screenId: screen,
        riskLevel: "info",
        badgeText: "Verifikasi Rekanan Dagang",
        title: "Due Diligence Mitra Buyer & Freight Forwarder",
        mitigationText: `Lakukan trade credit check dan minta referensi perbankan sebelum memberikan fasilitas pembayaran berjangka (Open Account) kepada buyer internasional baru.`,
        suggestedQuestions: [
          "Bagaimana cara memverifikasi kredibilitas dan reputasi buyer luar negeri?",
          "Kriteria apa yang harus diperhatikan dalam memilih freight forwarder terpercaya?",
          "Apa tanda-tanda indikasi penipuan (scam) dalam perdagangan ekspor internasional?",
        ],
        initialPrompt: `Berikan checklist due diligence untuk memverifikasi reputasi buyer internasional baru sebelum kontrak disepakati.`,
      };

    case "products":
      return {
        screenId: screen,
        riskLevel: "info",
        badgeText: "Harmonized System (HS)",
        title: "Ketepatan HS Code & Skema Tarif Preferensial (FTA)",
        mitigationText: `Penetapan HS Code 8-10 digit yang akurat menentukan ada/tidaknya bea keluar Indonesia serta eligibilitas tarif preferensial Certificate of Origin (COO / Form AK / Form D) di negara tujuan.`,
        suggestedQuestions: [
          `Bagaimana cara memastikan HS Code untuk produk ${shipment.product} sudah benar?`,
          "Skema FTA apa yang memberikan fasilitas bea masuk 0% di negara tujuan?",
          "Dokumen uji laboratorium apa yang lazim disyaratkan untuk produk ini?",
        ],
        initialPrompt: `Bantu verifikasi klasifikasi HS Code produk ${shipment.product} dan potensi pemanfaatan fasilitas Free Trade Agreement (FTA).`,
      };

    case "readiness":
      return {
        screenId: screen,
        riskLevel: "info",
        badgeText: "Kesiapan Sertifikasi Teknis",
        title: "Peta Kesiapan Komoditas & Dokumen Karantina",
        mitigationText: `Komoditas hasil pertanian, pangan, dan mineral memerlukan sertifikat khusus (Phytosanitary, Certificate of Analysis, Sertifikat Halal/HACCP) dari instansi berwenang sebelum pengajuan PEB.`,
        suggestedQuestions: [
          `Sertifikat karantina dan mutu apa saja yang diwajibkan untuk ${shipment.product}?`,
          "Berapa lama masa berlaku Phytosanitary Certificate atau Certificate of Analysis?",
          "Kapan permohonan pemeriksaan karantina harus diajukan ke instansi terkait?",
        ],
        initialPrompt: `Jelaskan persyaratan izin ekspor, sertifikasi karantina, dan uji laboratorium untuk produk ${shipment.product}.`,
      };

    case "knowledge":
      return {
        screenId: screen,
        riskLevel: "info",
        badgeText: "Standard Operating Procedure",
        title: "Basis Pengetahuan SOP & Regulasi Internal Tim",
        mitigationText: `Gunakan basis pengetahuan tim untuk menyeragamkan penanganan kargo, standar kemasan, dan toleransi risiko ekspor antar seluruh anggota operasional perusahaan.`,
        suggestedQuestions: [
          "Bagaimana cara menyusun SOP penanganan kargo ekspor yang efektif?",
          "Materi kepatuhan apa yang wajib dipahami tim operasional ekspor baru?",
          "Bagaimana cara mengarsipkan audit log transaksi ekspor sesuai standar audit?",
        ],
        initialPrompt: `Berikan rekomendasi penyusunan SOP mitigasi risiko operasional ekspor untuk tim internal perusahaan.`,
      };

    default:
      return {
        screenId: screen,
        riskLevel: "info",
        badgeText: "AI Advisor EksporFlow",
        title: "Konsultasi Cerdas Berbasis Transaksi Aktif",
        mitigationText: `AI Advisor membaca parameter transaksi ${shipment.reference} secara langsung untuk membantu memitigasi potensi risiko operasional, kepabeanan, dan keuangan.`,
        suggestedQuestions: [
          `Tanyakan apa saja tentang transaksi ${shipment.reference}`,
          "Apa risiko terbesar yang perlu saya selesaikan hari ini?",
          "Jelaskan alur ekspor dari proforma invoice hingga pencairan kas",
        ],
        initialPrompt: `Saya membutuhkan panduan operasional dan mitigasi risiko untuk transaksi ekspor ${shipment.reference}.`,
      };
  }
}

export function ScreenAIAdvisorBanner({
  screen,
  shipment,
  pricing,
  container,
  flow,
  onOpenConsultation,
}: {
  screen: ScreenId;
  shipment: Shipment;
  pricing: Pricing;
  container: ContainerCalc;
  flow: WorkspaceFlow;
  onOpenConsultation: (prompt: string) => void;
}) {
  // Jangan tampilkan banner jika user sudah berada di layar AI Advisor penuh
  if (screen === "advisor") return null;

  const insight = useMemo(() => {
    return getScreenAdvisorInsight(screen, shipment, pricing, container, flow);
  }, [screen, shipment, pricing, container, flow]);

  const riskIcon = useMemo(() => {
    switch (insight.riskLevel) {
      case "danger":
        return <AlertTriangle size={15} />;
      case "warning":
        return <ShieldAlert size={15} />;
      case "success":
        return <CheckCircle2 size={15} />;
      default:
        return <Sparkles size={15} />;
    }
  }, [insight.riskLevel]);

  return (
    <div className={`screen-ai-banner ${insight.riskLevel}`}>
      <div className="screen-ai-banner-left">
        <div className="screen-ai-banner-eyebrow">
          <span className="screen-ai-spark-icon">
            <Sparkles size={12} />
          </span>
          <span className="eyebrow-text">AI ADVISOR · MITIGASI RISIKO</span>
          <span className={`screen-ai-risk-tag ${insight.riskLevel}`}>
            {riskIcon}
            <span>{insight.badgeText}</span>
          </span>
        </div>
        <h4 className="screen-ai-banner-title">{insight.title}</h4>
        <p className="screen-ai-banner-desc">{insight.mitigationText}</p>
      </div>

      <div className="screen-ai-banner-right">
        <button
          type="button"
          className="screen-ai-ask-btn"
          onClick={() => onOpenConsultation(insight.initialPrompt)}
          title="Buka konsultasi mendalam dengan AI Advisor"
        >
          <Bot size={15} />
          <span>Tanya AI Advisor</span>
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}

export function ScreenAIAdvisorDrawer({
  isOpen,
  onClose,
  initialPrompt,
  screen,
  screenTitle,
  shipment,
  pricing,
  container,
  flow,
  isAuthenticated,
  onLogin,
  onNavigateFullAdvisor,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt: string;
  screen: ScreenId;
  screenTitle: string;
  shipment: Shipment;
  pricing: Pricing;
  container: ContainerCalc;
  flow: WorkspaceFlow;
  isAuthenticated: boolean;
  onLogin: () => void;
  onNavigateFullAdvisor: () => void;
}) {
  const insight = useMemo(() => {
    return getScreenAdvisorInsight(screen, shipment, pricing, container, flow);
  }, [screen, shipment, pricing, container, flow]);

  const [inputQuestion, setInputQuestion] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const assistantMutation = trpc.assistant.ask.useMutation();

  // Snapshot transaksi aktif untuk dikirim ke LLM
  const snapshot = useMemo(() => {
    return JSON.stringify({
      activeScreen: screen,
      screenTitle,
      reference: shipment.reference,
      buyer: shipment.buyer,
      country: shipment.buyerCountry,
      destination: shipment.destination,
      incoterm: shipment.incoterm,
      currency: shipment.currency,
      product: shipment.product,
      hsCode: shipment.hsCode,
      quantity: shipment.quantity,
      unit: shipment.unit,
      offer: pricing.active.offer,
      cost: pricing.active.cost,
      profit: pricing.active.profit,
      margin: shipment.margin,
      containerType: shipment.containerType,
      containersCount: container.containers,
      volumeUtilization: container.volumeUtilization,
      weightUtilization: container.weightUtilization,
      documentReviewed: shipment.documentReviewed,
      remainingReceivable: flow.remainingReceivable,
      paidAmount: flow.paidAmount,
      riskLevel: flow.riskEvaluation.riskLevel,
      readinessPercent: flow.riskEvaluation.readinessPercent,
      activeInsightTitle: insight.title,
      activeMitigationText: insight.mitigationText,
    }).slice(0, 8000);
  }, [screen, screenTitle, shipment, pricing, container, flow, insight]);

  // Reset percakapan awal saat drawer dibuka pada menu tertentu
  useEffect(() => {
    if (isOpen) {
      setMessages([
        {
          role: "assistant",
          content: `Halo! Saya **AI Advisor EksporFlow**.\n\nSaya sedang membaca konteks menu **${screenTitle}** untuk transaksi **${shipment.reference}** (${shipment.buyer || "Mitra Buyer"} · ${shipment.incoterm}).\n\n**Temuan & Mitigasi Risiko Terkini:**\n> **${insight.title}**\n${insight.mitigationText}\n\nAda yang ingin Anda konsultasikan lebih mendalam mengenai risiko atau klausul pada menu ini?`,
        },
      ]);
    }
  }, [isOpen, screen, screenTitle, shipment.reference, insight.title, insight.mitigationText]);

  // Auto scroll ke bawah pesan terbaru
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Menutup drawer dengan tombol Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleSend = (textToSend?: string) => {
    const q = (textToSend || inputQuestion).trim();
    if (!q) return;

    if (!isAuthenticated) {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: q },
        {
          role: "assistant",
          content: "Silakan **masuk akun terlebih dahulu** melalui tombol di atas agar sesi konsultasi AI Advisor dapat dihubungkan ke server dengan aman.",
        },
      ]);
      setInputQuestion("");
      return;
    }

    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setInputQuestion("");

    assistantMutation.mutate(
      {
        question: q,
        snapshot,
      },
      {
        onSuccess: (data) => {
          setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
        },
        onError: (err) => {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `Maaf, terjadi kendala saat memproses jawaban: ${err.message || "Periksa koneksi jaringan atau kuota AI."}`,
            },
          ]);
        },
      },
    );
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="ai-drawer-backdrop" onClick={onClose} aria-hidden="true" />
      <aside className="ai-drawer-panel" role="dialog" aria-label="Konsultasi AI Advisor">
        <header className="ai-drawer-header">
          <div className="ai-drawer-header-brand">
            <div className="ai-drawer-icon-wrap">
              <Bot size={18} />
            </div>
            <div>
              <h3>Konsultasi AI Advisor</h3>
              <p>
                Konteks: <strong>{screenTitle}</strong> · {shipment.reference}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="ai-drawer-close-btn"
            onClick={onClose}
            aria-label="Tutup konsultasi AI"
          >
            <X size={16} />
          </button>
        </header>

        {/* Kartu Ringkasan Rekomendasi Modul Aktif */}
        <div className={`ai-drawer-insight-card ${insight.riskLevel}`}>
          <div className="ai-drawer-card-head">
            <Sparkles size={13} />
            <span>{insight.badgeText}</span>
          </div>
          <strong>{insight.title}</strong>
          <p>{insight.mitigationText}</p>
        </div>

        {/* Pertanyaan Cepat yang Sering Diajukan */}
        <div className="ai-drawer-quick-prompts">
          <span className="quick-prompt-label">PILIHAN TANYA CEPAT:</span>
          <div className="quick-prompt-chips">
            {insight.suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                className="quick-prompt-chip"
                onClick={() => handleSend(q)}
                disabled={assistantMutation.isPending}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Area Percakapan Interaktif */}
        <div className="ai-drawer-messages">
          {messages.map((m, index) => (
            <div key={index} className={`ai-drawer-bubble ${m.role}`}>
              <div className="bubble-avatar">
                {m.role === "assistant" ? <Bot size={13} /> : "Anda"}
              </div>
              <div className="bubble-text">
                {m.content.split("\n\n").map((para, pIdx) => (
                  <p key={pIdx}>{para}</p>
                ))}
              </div>
            </div>
          ))}

          {assistantMutation.isPending && (
            <div className="ai-drawer-bubble assistant loading">
              <div className="bubble-avatar">
                <Bot size={13} />
              </div>
              <div className="bubble-text">
                <span className="ai-typing-indicator">
                  <Loader2 size={13} className="spin" />
                  Menganalisis mitigasi risiko transaksi...
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Pesan Konsultasi */}
        <footer className="ai-drawer-footer">
          {!isAuthenticated && (
            <div className="ai-drawer-auth-warning">
              <span>Sesi login diperlukan untuk konsultasi AI live.</span>
              <button type="button" onClick={onLogin}>
                Masuk Sekarang
              </button>
            </div>
          )}
          <form
            className="ai-drawer-input-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
              type="text"
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              placeholder="Tanyakan risiko, klausul kontrak, atau regulasi..."
              disabled={assistantMutation.isPending}
            />
            <button
              type="submit"
              className="ai-drawer-send-btn"
              disabled={!inputQuestion.trim() || assistantMutation.isPending}
              aria-label="Kirim pertanyaan"
            >
              <Send size={15} />
            </button>
          </form>

          <div className="ai-drawer-bottom-link">
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateFullAdvisor();
              }}
            >
              Buka Halaman Penuh AI Advisor <ExternalLink size={12} />
            </button>
          </div>
        </footer>
      </aside>
    </>
  );
}
