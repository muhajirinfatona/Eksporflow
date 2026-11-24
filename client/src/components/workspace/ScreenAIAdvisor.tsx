import { trpc } from "@/lib/trpc";
import { formatMoney, formatNumber } from "@shared/format";
import type { Pricing } from "@shared/pricing";
import type { ScreenId } from "@shared/risk";
import type { ContainerCalc, Shipment } from "@shared/shipment";
import type { WorkspaceFlow } from "@/hooks/useWorkspaceFlow";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Info,
  Loader2,
  Maximize2,
  MessageSquare,
  Minimize2,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  User,
  X,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

export interface ScreenAdvisorInsight {
  screenId: ScreenId;
  riskLevel: "danger" | "warning" | "info" | "success";
  badgeText: string;
  title: string;
  mitigationText: string;
  suggestedQuestions: string[];
  initialPrompt: string;
  welcomeGreeting: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  interactionId?: string | null;
  feedbackGiven?: "up" | "down" | null;
  detectedPii?: string[];
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
            `Bagaimana cara mengamankan margin bersih ${shipment.margin}% dari kenaikan biaya tak terduga?`,
            "Klausul apa yang bisa melindungi eksportir jika biaya freight tiba-tiba naik?",
            "Kapan batas waktu aman konfirmasi booking kapal ke freight forwarder?",
            "Apa saja dokumen wajib yang harus siap sebelum kontainer masuk pelabuhan?",
          ],
          initialPrompt: `Analisis risiko margin tipis ${shipment.margin}% pada transaksi ${shipment.reference} dan berikan rekomendasi mitigasinya.`,
          welcomeGreeting: `Halo! Saya memantau margin bersih transaksi saat ini (${shipment.margin}%) yang berada di bawah target aman.\n\nAda yang ingin Anda konsultasikan untuk mengamankan margin dari lonjakan biaya freight atau klausul perlindungan penawaran?`,
        };
      }
      return {
        screenId: screen,
        riskLevel: "info",
        badgeText: "Monitoring Operasional Aktif",
        title:
          shipment.reference && !shipment.reference.startsWith("EXP-")
            ? `Ringkasan Ekspor (${shipment.reference}): ${shipment.incoterm || "FOB"} · ${formatMoney(pricing.active.offer, shipment.currency)}`
            : `Ringkasan Ekspor: ${shipment.incoterm || "FOB"} · ${formatMoney(pricing.active.offer, shipment.currency)}`,
        mitigationText: `Seluruh parameter inti tersinkronisasi dengan kalkulator 7 Incoterms, muatan 3D, dan dokumen ekspor. Verifikasi klausul pembayaran dan jadwal closing kapal.`,
        suggestedQuestions: [
          shipment.reference && !shipment.reference.startsWith("EXP-")
            ? `Ringkas evaluasi risiko menyeluruh transaksi ${shipment.reference}`
            : "Ringkas risiko terbesar pada transaksi ekspor ini saat ini",
          "Kapan batas waktu aman konfirmasi booking kapal ke forwarder?",
          "Apa saja dokumen yang wajib siap sebelum kontainer masuk pelabuhan?",
          "Bagaimana ringkasan alur pemenuhan ekspor dari penawaran hingga rilis B/L?",
        ],
        initialPrompt: `Bantu tinjau kesiapan menyeluruh transaksi ekspor ke ${shipment.destination || "pelabuhan tujuan"} dan mitigasi risiko operasionalnya.`,
        welcomeGreeting: "Halo! Saya siap membantu memantau operasional ekspor Anda hari ini.\n\nSilakan pilih topik konsultasi di atas atau tanyakan kesiapan transaksi, jadwal kapal, maupun mitigasi dokumen.",
      };

    case "readiness":
      return {
        screenId: screen,
        riskLevel: "info",
        badgeText: "Audit Legalitas & Mutu Komoditas",
        title: `Asesmen Kesiapan Ekspor: ${shipment.product || "Komoditas Ekspor"}`,
        mitigationText: `Evaluasi izin berusaha (NIB, standardisasi), kesiapan sertifikat karantina/analisis mutu, serta kelayakan kemasan untuk pasar ${shipment.buyerCountry || "internasional"}.`,
        suggestedQuestions: [
          "Dokumen perizinan dasar apa saja yang wajib aktif untuk legalitas ekspor perusahaan?",
          `Sertifikasi mutu atau karantina apa yang disyaratkan untuk ${shipment.product || "komoditas ini"}?`,
          "Bagaimana cara melakukan audit kesiapan kapasitas suplai agar terhindar dari wanprestasi?",
          "Apa standar packaging & labeling yang wajib dipenuhi untuk pasar tujuan ekspor?",
        ],
        initialPrompt: `Jelaskan persyaratan izin ekspor, sertifikasi karantina, dan uji laboratorium untuk produk ${shipment.product || "komoditas kami"}.`,
        welcomeGreeting: `Halo! Saya siap mendampingi asesmen kesiapan komoditas **${shipment.product || "ekspor"}** Anda.\n\nAda aspek legalitas, sertifikasi karantina/mutu, atau standar kemasan yang ingin Anda konsultasikan?`,
      };

    case "transactions":
      return {
        screenId: screen,
        riskLevel: "info",
        badgeText: "Siklus Pemenuhan Pesanan",
        title: "Workspace Pesanan Ekspor & Pemantauan Status Kontrak",
        mitigationText: "Pantau siklus pemenuhan dari Draft, Confirmed, In Transit, hingga Completed. Pastikan setiap amandemen PO dicatat dalam versi dokumen resmi.",
        suggestedQuestions: [
          "Bagaimana alur perubahan status pesanan dari Draft hingga pesanan selesai?",
          "Kapan saat yang tepat mengunci (lock) pesanan agar tidak terjadi perubahan spesifikasi?",
          "Bagaimana cara menangani amandemen kontrak jika buyer meminta penundaan jadwal kirim?",
          "Apa indikator utama bahwa suatu pesanan telah siap dilanjutkan ke proses booking kargo?",
        ],
        initialPrompt: "Bantu tinjau alur pemenuhan pesanan ekspor dan langkah validasi sebelum beralih ke tahap logistik.",
        welcomeGreeting: "Halo! Saya siap membantu mengawal alur pesanan dan siklus kontrak ekspor Anda.\n\nApakah ada kendala status pesanan, jadwal pemenuhan kargo, atau amandemen PO yang perlu dibahas?",
      };

    case "po_intake":
      return {
        screenId: screen,
        riskLevel: shipment.buyer ? "info" : "warning",
        badgeText: "Skrining Buyer & Kontrak",
        title: shipment.buyer
          ? `Verifikasi Purchase Order Buyer: ${shipment.buyer}`
          : "Verifikasi Dokumen Purchase Order / LOI Buyer",
        mitigationText: "Validasi keabsahan entitas legal pembeli luar negeri, riwayat dagang, sanksi internasional, dan kejelasan syarat pembayaran sebelum penawaran dikunci.",
        suggestedQuestions: [
          "Bagaimana cara memverifikasi keabsahan legalitas dan alamat entitas buyer luar negeri?",
          "Klausul pembayaran apa yang paling aman dicantumkan saat merespons LOI / PO buyer baru?",
          "Apa saja tanda bahaya (red flags) indikasi penipuan dalam dokumen pesanan internasional?",
          "Poin apa saja yang wajib dicocokkan antara PO dari buyer dengan Proforma Invoice kita?",
        ],
        initialPrompt: `Bantu tinjau keabsahan dokumen PO/LOI dari ${shipment.buyer || "buyer"} dan rekomendasi klausul proteksi pembayarannya.`,
        welcomeGreeting: shipment.buyer
          ? `Halo! Saya siap membantu validasi Purchase Order dari **${shipment.buyer}**.\n\nAda klausul pembayaran, kelayakan legalitas entitas, atau syarat dokumen yang ingin ditinjau?`
          : "Halo! Saya siap membantu verifikasi dokumen Purchase Order (PO) / LOI buyer.\n\nSilakan pilih topik pertanyaan di atas atau tanyakan hal spesifik terkait validasi pesanan.",
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
            "Bagaimana menetapkan formula margin aman dari modal kerja?",
          ],
          initialPrompt: `Ada error pada kalkulasi harga transaksi ${shipment.reference}: ${pricing.validationErrors[0]}. Tolong jelaskan solusinya.`,
          welcomeGreeting: "Halo! Terdeteksi ketidaksesuaian pada komponen kalkulasi biaya harga jual Anda.\n\nSilakan pilih pertanyaan di atas agar kita bisa memperbaiki komponen biaya sebelum quotation dikirim ke buyer.",
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
            "Bagaimana cara membebankan potensi demurrage di pelabuhan tujuan jika pakai term DDP?",
          ],
          initialPrompt: `Saya menggunakan Incoterms DDP untuk pengiriman ke ${shipment.buyerCountry || "negara tujuan"}. Apa saja risiko pajak impor dan clearance yang wajib diwaspadai?`,
          welcomeGreeting: `Halo! Penawaran menggunakan Incoterms DDP ke **${shipment.buyerCountry || "negara tujuan"}**.\n\nAda yang ingin dikonsultasikan mengenai tanggung jawab bea masuk, pajak impor, atau perizinan clearance di negara tujuan?`,
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
            "Bagaimana cara menambahkan buffer contingency freight dalam penawaran resmi?",
          ],
          initialPrompt: `Jelaskan titik peralihan risiko dan klausul asuransi laut yang wajib dicantumkan pada penawaran ${shipment.incoterm} untuk ${shipment.product}.`,
          welcomeGreeting: `Halo! Penawaran menggunakan skenario Incoterms ${shipment.incoterm}.\n\nAda yang ingin dipastikan mengenai masa berlaku tarif ocean freight atau klausul polis asuransi laut (Institute Cargo Clauses)?`,
        };
      }
      return {
        screenId: screen,
        riskLevel: "info",
        badgeText: "Struktur Biaya 7 Incoterms",
        title: `Kalkulasi 7 Incoterms®: Penawaran ${shipment.incoterm} (Margin ${shipment.margin}%)`,
        mitigationText: `Penawaran resmi ${formatMoney(pricing.active.offer, shipment.currency)}. Periksa biaya penanganan lokal (trucking pelabuhan & THC) dan pastikan menyertakan buffer contingency minimal 3-5%.`,
        suggestedQuestions: [
          `Apakah estimasi margin ${shipment.margin}% aman terhadap lonjakan freight & demurrage?`,
          "Berapa persentase buffer kontinjensi biaya lokal yang disarankan untuk pengiriman ini?",
          `Apa titik kritis peralihan biaya & risiko pada Incoterm ${shipment.incoterm}?`,
          "Bagaimana cara melindungi margin dari risiko fluktuasi kurs mata uang asing (forex)?",
        ],
        initialPrompt: `Evaluasi struktur harga penawaran ${formatMoney(pricing.active.offer, shipment.currency)} (${shipment.incoterm}) untuk ${shipment.quantity} ${shipment.unit} ${shipment.product}.`,
        welcomeGreeting: `Halo! Saya siap membantu kalkulasi penawaran resmi (${shipment.incoterm || "FOB"}) dan simulasi 7 Incoterms®.\n\nIngin mengevaluasi ketahanan margin ${shipment.margin}%, buffer kontinjensi freight, atau perlindungan kurs valas?`,
      };

    case "approvals":
      return {
        screenId: screen,
        riskLevel: flow.effectiveApprovalStatus === "Tercatat direview" ? "success" : "warning",
        badgeText: "Tata Kelola & Segregation of Duties (SoD)",
        title: `Otorisasi Penawaran & Kontrak: ${flow.effectiveApprovalStatus}`,
        mitigationText: `Pimpinan memvalidasi kelayakan margin (${shipment.margin}%), kepatuhan regulasi ekspor, dan toleransi risiko buyer sebelum Sales Contract resmi ditandatangani.`,
        suggestedQuestions: [
          "Apa dasar evaluasi pimpinan sebelum memberikan dispensasi harga atau margin di bawah target?",
          "Bagaimana pembagian kewenangan (SoD) antara Sales PIC dan Approver Pimpinan?",
          "Klausul proteksi apa saja yang wajib dipastikan ada sebelum kontrak disetujui direksi?",
          "Bagaimana mekanisme pencatatan revisi (Minta Revisi) kepada tim sales secara terstruktur?",
        ],
        initialPrompt: `Bantu tinjau klausul kunci dalam Sales Contract ekspor untuk mencegah sengketa kualitas atau wanprestasi pembayaran.`,
        welcomeGreeting: `Halo! Saya siap mendampingi proses peninjauan dan otorisasi kontrak ekspor (${shipment.reference || "Transaksi Ekspor"}).\n\nAda yang ingin dikonsultasikan mengenai kelayakan margin (${shipment.margin}%), klausul proteksi wanprestasi, atau pembagian wewenang persetujuan (SoD)?`,
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
            `Bagaimana prosedur pengajuan Certificate of Origin (COO / Form AK / Form D) untuk ${shipment.buyerCountry || "negara tujuan"}?`,
            "Apa konsekuensi jika terjadi perbedaan deskripsi barang di dokumen ekspor vs data PEB?",
            "Kapan Commercial Invoice dan Packing List harus diserahkan ke broker bea cukai?",
          ],
          initialPrompt: `Tolong jelaskan langkah verifikasi 3-way match antara Commercial Invoice, Packing List, dan B/L untuk transaksi ${shipment.reference}.`,
          welcomeGreeting: "Halo! Dokumen ekspor transaksi ini masih berstatus draft dan belum diverifikasi.\n\nAda yang ingin ditanyakan seputar checklist 3-way match antara Commercial Invoice, Packing List, dan Bill of Lading?",
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
          "Kapan dokumen asli (Original Documents) wajib dikirim via kurir vs cukup Telex Release?",
        ],
        initialPrompt: `Dokumen ekspor ${shipment.reference} sudah valid. Apa saja dokumen kepabeanan tambahan yang mungkin diminta negara ${shipment.buyerCountry}?`,
        welcomeGreeting: `Halo! 4 dokumen ekspor utama transaksi ini telah tervalidasi legal (R${shipment.documentRevision}).\n\nAda dokumen tambahan seperti COO e-SKA, sertifikat mutu, atau legalisasi yang ingin Anda pastikan?`,
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
            "Bagaimana cara menghitung CBM muatan curah dibanding kargo dalam pallet?",
          ],
          initialPrompt: `Kargo saya overload (${container.volumeUtilization.toFixed(0)}% volume, ${container.weightUtilization.toFixed(0)}% berat). Berikan rekomendasi penataan atau jumlah kontainer yang tepat.`,
          welcomeGreeting: `Halo! Muatan kontainer saat ini terdeteksi melebihi batas kapasitas (${container.volumeUtilization.toFixed(0)}% Vol / ${container.weightUtilization.toFixed(0)}% Berat).\n\nIngin membahas solusi penataan ulang muatan, estimasi jumlah kontainer, atau deklarasi berat VGM?`,
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
            "Berapa batas berat per axle yang diizinkan untuk truk angkut kontainer pelabuhan?",
          ],
          initialPrompt: `Utilisasi kontainer baru ${container.volumeUtilization.toFixed(0)}%. Apakah lebih efisien pakai FCL atau LCL untuk rute ke ${shipment.destination}?`,
          welcomeGreeting: `Halo! Utilisasi muatan kontainer ${shipment.containerType} saat ini masih rendah (${container.volumeUtilization.toFixed(0)}% CBM).\n\nIngin mengevaluasi perbandingan efisiensi FCL vs LCL, atau strategi penambahan kuantiti pesanan buyer?`,
        };
      }
      return {
        screenId: screen,
        riskLevel: "info",
        badgeText: "Standar Kemasan & ISPM-15",
        title: `Utilisasi Muatan Optimal: ${container.volumeUtilization.toFixed(0)}% Vol · ${container.containers} × ${shipment.containerType}`,
        mitigationText: `Pastikan pallet kayu memiliki sertifikat fumigasi/heat-treatment standar ISPM-15 dengan stempel IPPC resmi untuk mencegah penolakan karantina di pelabuhan tujuan (${shipment.destination || "tujuan"}).`,
        suggestedQuestions: [
          `Bagaimana cara mengoptimalkan penataan muatan agar utilisasi kontainer ${shipment.containerType} > 85%?`,
          "Apa standar fumigasi dan sertifikat ISPM-15 untuk pallet kayu ekspor?",
          "Bagaimana tata cara penimbangan dan pelaporan Verified Gross Mass (VGM) ke terminal pelabuhan?",
          "Alat pengikat kargo (lashing/strapping) apa yang disyaratkan untuk pengapalan ini?",
        ],
        initialPrompt: `Jelaskan checklist verifikasi kemasan ekspor, fumigasi pallet kayu ISPM-15, dan penimbangan berat kotor VGM untuk kontainer ini.`,
        welcomeGreeting: `Halo! Muatan kontainer ${shipment.containerType} terpantau optimal (${container.volumeUtilization.toFixed(0)}% CBM).\n\nAda yang ingin dikonsultasikan mengenai sertifikasi fumigasi pallet kayu ISPM-15 atau prosedur deklarasi VGM?`,
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
            "Informasi apa saja yang wajib dicantumkan dalam Shipping Instruction (SI)?",
            "Kapan batas waktu aman memasukkan kontainer ke pelabuhan (closing time)?",
            "Bagaimana cara memitigasi risiko demurrage dan detention di pelabuhan?",
            "Apa yang harus dilakukan jika terjadi blank sailing atau keterlambatan kapal?",
          ],
          initialPrompt: `Bantu susun prosedur pengajuan Shipping Instruction (SI) yang aman ke forwarder untuk rute ke ${shipment.destination}.`,
          welcomeGreeting: "Halo! Nomor booking kapal belum tercatat pada pengiriman ini.\n\nAda yang ingin Anda konsultasikan terkait pengajuan Shipping Instruction (SI) ke forwarder atau mengamankan jadwal closing time pelabuhan?",
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
          "Apa risiko menerbitkan Telex Release jika pelunasan pembayaran belum 100% diterima?",
          "Apa langkah darurat jika kontainer mengalami penundaan jadwal kapal (delay)?",
        ],
        initialPrompt: `Jelaskan risiko penggunaan Telex Release vs Original B/L jika pembayaran buyer belum 100% lunas.`,
        welcomeGreeting: `Halo! Booking kapal (${shipment.bookingNumber}) telah terdaftar dengan rute tujuan ${shipment.destination || "pelabuhan"}.\n\nAda pertanyaan seputar pengamanan Bill of Lading (Original vs Telex Release) atau mitigasi keterlambatan kapal?`,
      };

    case "finance":
      if (flow.remainingReceivable > 0 && !flow.finance.dpConfirmed) {
        return {
          screenId: screen,
          riskLevel: "warning",
          badgeText: "Risiko Piutang Dagang (Credit Risk)",
          title: `Piutang ${formatMoney(flow.remainingReceivable, shipment.currency)} Tanpa Konfirmasi Uang Muka (DP)`,
          mitigationText: `Memulai produksi atau memuat kargo tanpa DP minimal 30% atau L/C berisiko tinggi terhadap pembatalan sepihak oleh buyer asing. Pastikan dana efektif masuk rekening giro devisa sebelum stuffing.`,
          suggestedQuestions: [
            `Bagaimana strategi mengamankan sisa piutang ${formatMoney(flow.remainingReceivable, shipment.currency)} dari buyer?`,
            "Apa kelebihan dan risiko metode pembayaran T/T 30% DP vs Irrevocable L/C at Sight?",
            "Bagaimana cara membuat jadwal penagihan (payment milestones) yang aman bagi cash flow?",
            "Kapan eksportir berhak menahan rilis dokumen kargo jika pelunasan tertunda?",
          ],
          initialPrompt: `Saya memiliki sisa piutang ${formatMoney(flow.remainingReceivable, shipment.currency)} belum terkonfirmasi DP. Bagaimana strategi mitigasi risiko pembayarannya?`,
          welcomeGreeting: `Halo! Terpantau sisa piutang dagang sebesar ${formatMoney(flow.remainingReceivable, shipment.currency)} yang belum terkonfirmasi uang muka (DP).\n\nIngin mendiskusikan klausul pembayaran yang lebih aman, mitigasi risiko wanprestasi, atau jadwal penagihan?`,
        };
      }
      return {
        screenId: screen,
        riskLevel: "success",
        badgeText: "Arus Kas & Piutang Dagang",
        title: `Status Keuangan: ${flow.finance.arStatus} (Kas Masuk: ${formatMoney(flow.paidAmount, shipment.currency)})`,
        mitigationText: `Penerimaan kas berjalan lancar. Rekonsiliasi nomor PEB dengan rekening giro devisa untuk memastikan kepatuhan pelaporan devisa ekspor nasional.`,
        suggestedQuestions: [
          "Bagaimana cara memproteksi transaksi dari risiko gagal bayar buyer internasional?",
          "Apa instrumen pembayaran ekspor yang paling aman selain T/T Cash in Advance?",
          "Bagaimana cara menghitung DSO (Days Sales Outstanding) untuk transaksi ekspor?",
          "Kapan saat yang tepat menerbitkan commercial invoice final untuk pelunasan?",
        ],
        initialPrompt: `Jelaskan strategi manajemen piutang dagang ekspor dan kepatuhan penerimaan kas valas untuk transaksi ini.`,
        welcomeGreeting: `Halo! Saya siap mendampingi pengelolaan kas dan piutang ekspor Anda (${flow.finance.arStatus}).\n\nAda yang ingin dikonsultasikan terkait pelunasan piutang atau rekonsiliasi penerimaan kas masuk?`,
      };

    case "bank":
      return {
        screenId: screen,
        riskLevel: "info",
        badgeText: "Perbankan Devisa & Valas",
        title: "Rekonsiliasi Bank Devisa & Penerimaan Valuta Asing",
        mitigationText: "Verifikasi penerimaan dana valas melalui rekening Giro Devisa perbankan nasional. Tinjau potongan biaya koresponden bank internasional dan kurs realisasi sebelum posting buku besar.",
        suggestedQuestions: [
          "Bagaimana cara memverifikasi keabsahan bukti transfer SWIFT MT103 dari buyer?",
          "Kapan eksportir perlu melakukan lindung nilai (hedging) valuta asing?",
          "Berapa lama estimasi transfer valas lintas negara tiba di rekening giro devisa?",
          "Bagaimana cara meminimalkan potongan biaya koresponden bank (intermediary charges)?",
        ],
        initialPrompt: "Jelaskan langkah verifikasi transfer valas SWIFT MT103 dan mitigasi selisih kurs perbankan.",
        welcomeGreeting: "Halo! Saya siap membantu rekonsiliasi penerimaan devisa valas dan perbankan.\n\nIngin memverifikasi bukti transfer SWIFT MT103, lindung nilai valas (*hedging*), atau potongan biaya bank?",
      };

    case "journals":
      return {
        screenId: screen,
        riskLevel: "info",
        badgeText: "Akuntansi & Pembukuan Ekspor",
        title: "Pencatatan Jurnal Akuntansi & Selisih Kurs (Forex Gain/Loss)",
        mitigationText: "Pastikan jurnal pembukuan double-entry mencatat pengakuan piutang, kas masuk valas, serta selisih kurs yang terealisasi (Realized Forex Gain/Loss) sesuai standar PSAK.",
        suggestedQuestions: [
          "Kapan titik pengakuan pendapatan (revenue recognition) ekspor dicatat menurut PSAK?",
          "Bagaimana jurnal akuntansi penerimaan uang muka (DP) valas dan saat pelunasan akhir?",
          "Bagaimana perlakuan akuntansi untuk selisih kurs yang belum terealisasi (unrealized forex)?",
          "Bagaimana pencatatan biaya logistik lokal (THC, freight, fumigasi) yang ditalangi perusahaan?",
        ],
        initialPrompt: "Jelaskan standar jurnal akuntansi ekspor untuk pengakuan pendapatan dan pencatatan selisih kurs valuta asing.",
        welcomeGreeting: "Halo! Saya siap membantu standardisasi jurnal akuntansi ekspor dan selisih kurs.\n\nAda pertanyaan mengenai pengakuan pendapatan (PSAK), jurnal penerimaan valas, atau pencatatan biaya talangan?",
      };

    case "reports":
      return {
        screenId: screen,
        riskLevel: "info",
        badgeText: "Kepatuhan Regulasi DHE BI",
        title: "Laporan Ekspor & Kepatuhan Devisa Hasil Ekspor (DHE BI)",
        mitigationText: "Sesuai PP No. 36/2023, eksportir komoditas sumber daya alam dengan nilai PEB >= USD 250,000 wajib menempatkan DHE minimal 30% dalam rekening khusus perbankan nasional selama 3 bulan.",
        suggestedQuestions: [
          "Apa kewajiban dan kriteria pelaporan Devisa Hasil Ekspor (DHE) ke Bank Indonesia?",
          "Berapa ambang batas nilai ekspor yang terkena kewajiban penempatan DHE 30%?",
          "Bagaimana cara melakukan rekonsiliasi data PEB bea cukai dengan pelaporan devisa di SiMoDIS BI?",
          "Apa sanksi administratif dan denda jika pelaporan devisa ekspor terlambat dilakukan?",
        ],
        initialPrompt: "Jelaskan regulasi Devisa Hasil Ekspor (DHE) Bank Indonesia dan prosedur rekonsiliasi PEB bea cukai.",
        welcomeGreeting: "Halo! Saya siap mendampingi kepatuhan laporan devisa ekspor dan regulasi DHE BI.\n\nIngin meninjau kewajiban penempatan DHE SDA (PP 36/2023) atau rekonsiliasi data PEB di SiMoDIS?",
      };

    case "risk":
      return {
        screenId: screen,
        riskLevel: flow.riskEvaluation.readinessPercent >= 80 ? "success" : "warning",
        badgeText: `Kesiapan Regulasi: ${flow.riskEvaluation.readinessPercent}%`,
        title: `Evaluasi Risk Center: Tingkat Risiko ${flow.riskEvaluation.riskLevel.toUpperCase()}`,
        mitigationText: `Evaluasi kesiapan mencakup kepatuhan regulasi larangan terbatas (Lartas), sanksi embargo negara tujuan (${shipment.buyerCountry || "tujuan"}), dan kelengkapan izin eksportir (NIB/Eksportir Terdaftar).`,
        suggestedQuestions: [
          `Apa saja lartas ekspor yang berlaku untuk produk ${shipment.product}?`,
          `Apakah ada sanksi perdagangan atau embargo yang berlaku di negara ${shipment.buyerCountry}?`,
          "Bagaimana menaikkan skor kesiapan transaksi agar menjadi 100% aman?",
          "Bagaimana cara memproteksi kargo dari risiko politis dan gagal transfer devisa?",
        ],
        initialPrompt: `Bantu evaluasi seluruh poin risiko pada Risk Center transaksi ${shipment.reference} dan berikan panduan mitigasi kepatuhannya.`,
        welcomeGreeting: "Halo! Saya siap membantu evaluasi kepatuhan dan mitigasi risiko transaksi ekspor Anda.\n\nIngin meninjau kepatuhan Lartas komoditas, pengecekan sanksi negara tujuan, atau proteksi gagal bayar?",
      };

    case "partners":
      return {
        screenId: screen,
        riskLevel: "info",
        badgeText: "Verifikasi Rekanan & Vendor",
        title: "Direktori Rekanan & Due Diligence Mitra Dagang Internasional",
        mitigationText: `Lakukan verifikasi legalitas, referensi perbankan, dan trade credit check sebelum memberikan fasilitas pembayaran berjangka (Open Account) kepada buyer baru.`,
        suggestedQuestions: [
          "Bagaimana cara memverifikasi kredibilitas dan reputasi buyer luar negeri baru?",
          "Kriteria apa yang harus diperhatikan dalam memilih freight forwarder terpercaya untuk rute ini?",
          "Kapan perusahaan perlu menyewa jasa independent pre-shipment surveyor (SGS/Sucofindo)?",
          "Apa tanda-tanda indikasi penipuan (scam) dalam perdagangan ekspor internasional?",
        ],
        initialPrompt: `Berikan checklist due diligence untuk memverifikasi reputasi buyer internasional baru sebelum kontrak disepakati.`,
        welcomeGreeting: "Halo! Saya siap membantu *due diligence* mitra buyer dan rekanan logistik internasional.\n\nAda hal yang ingin diperiksa mengenai reputasi dagang buyer baru atau evaluasi vendor forwarder?",
      };

    case "products":
      return {
        screenId: screen,
        riskLevel: "info",
        badgeText: "Harmonized System (HS)",
        title: `Katalog Produk & Klasifikasi HS Code (${shipment.product || "Komoditas Ekspor"})`,
        mitigationText: `Penetapan HS Code 8-10 digit yang akurat menentukan ada/tidaknya bea keluar Indonesia serta eligibilitas tarif preferensial Certificate of Origin (COO / Form AK / Form D) di negara tujuan.`,
        suggestedQuestions: [
          `Bagaimana cara memastikan HS Code untuk produk ${shipment.product || "ini"} sudah benar?`,
          "Skema FTA apa yang memberikan fasilitas bea masuk 0% di negara tujuan?",
          "Dokumen uji laboratorium atau COA apa yang lazim disyaratkan untuk produk ini?",
          "Apakah komoditas ini dikenakan Bea Keluar (export duty) oleh pemerintah Indonesia?",
        ],
        initialPrompt: `Bantu verifikasi klasifikasi HS Code produk ${shipment.product || "ini"} dan potensi pemanfaatan fasilitas Free Trade Agreement (FTA).`,
        welcomeGreeting: `Halo! Saya siap membantu klasifikasi HS Code dan verifikasi tarif preferensi FTA untuk komoditas **${shipment.product || "ekspor"}**.\n\nAda ketentuan izin ekspor, sertifikat mutu, atau fasilitas tarif yang ingin ditanyakan?`,
      };

    case "knowledge":
      return {
        screenId: screen,
        riskLevel: "info",
        badgeText: "SOP & Regulasi Tim",
        title: "Basis Pengetahuan SOP & Panduan Operasional Ekspor",
        mitigationText: `Gunakan basis pengetahuan tim untuk menyeragamkan penanganan kargo, standar kemasan, dan toleransi risiko ekspor antar seluruh anggota operasional perusahaan.`,
        suggestedQuestions: [
          "Bagaimana cara menyusun SOP penanganan kargo ekspor yang efektif?",
          "Materi kepatuhan apa yang wajib dipahami tim operasional ekspor baru?",
          "Bagaimana tata cara pengarsipan audit log transaksi ekspor sesuai standar audit?",
          "Apa referensi regulasi ekspor terkini yang relevan untuk operasional perusahaan?",
        ],
        initialPrompt: `Berikan rekomendasi penyusunan SOP mitigasi risiko operasional ekspor untuk tim internal perusahaan.`,
        welcomeGreeting: "Halo! Saya siap membantu penelusuran SOP dan regulasi operasional ekspor tim Anda.\n\nSilakan pilih panduan yang ingin dipelajari atau tanyakan materi kepatuhan ekspor tertentu.",
      };

    case "settings":
      return {
        screenId: screen,
        riskLevel: "info",
        badgeText: "Profil & Keamanan Organisasi",
        title: "Pengaturan Profil Perusahaan & Tata Kelola Workspace",
        mitigationText: "Pastikan data legalitas eksportir, kop surat resmi, stempel digital, dan hak akses pengguna terkonfigurasi dengan aman untuk mendukung kolaborasi tim.",
        suggestedQuestions: [
          "Data profil legalitas apa saja yang wajib dilengkapi untuk penerbitan dokumen ekspor resmi?",
          "Bagaimana cara mengatur hak akses (Role-Based Access) tim internal (Sales, Approver, Finance)?",
          "Bagaimana cara menghubungkan penyimpanan cloud dan sinkronisasi database perusahaan?",
          "Bagaimana memastikan keamanan data transaksi dan kontrak ekspor perusahaan tersimpan aman?",
        ],
        initialPrompt: "Jelaskan langkah pengaturan profil perusahaan dan tata kelola hak akses tim pada sistem EksporFlow.",
        welcomeGreeting: "Halo! Saya siap membantu konfigurasi profil perusahaan dan tata kelola akun Anda.\n\nAda pengaturan legalitas eksportir, hak akses tim, atau sinkronisasi database yang ingin dikonsultasikan?",
      };

    case "advisor":
      return {
        screenId: screen,
        riskLevel: "info",
        badgeText: "AI Export Advisor Workspace",
        title: "Konsultasi Strategis Ekspor Komprehensif",
        mitigationText: `AI Advisor membaca parameter aktif transaksi ${shipment.reference || "EksporFlow"} untuk membantu negosiasi kontrak, kepatuhan pabean, dan efisiensi biaya.`,
        suggestedQuestions: [
          `Ringkas evaluasi risiko menyeluruh untuk transaksi ${shipment.reference}`,
          "Bagaimana strategi negosiasi term pembayaran yang aman bagi eksportir dan buyer?",
          "Jelaskan langkah mitigasi risiko klaim kualitas (quality dispute) dari buyer asing",
          "Apa rekomendasi terbaik untuk mengamankan margin bersih transaksi ini?",
        ],
        initialPrompt: `Saya membutuhkan panduan operasional dan mitigasi risiko untuk transaksi ekspor ${shipment.reference}.`,
        welcomeGreeting: "Halo! Saya siap membantu konsultasi strategis ekspor komprehensif untuk transaksi Anda.\n\nSilakan ajukan pertanyaan seputar negosiasi kontrak, mitigasi risiko, atau efisiensi biaya.",
      };

    case "pre_transaction":
      return {
        screenId: screen,
        riskLevel: "info",
        badgeText: "Strategi Akuisisi & Validasi Buyer",
        title: `Penawaran Pra-Transaksi untuk ${shipment.buyer || "Calon Importir"}`,
        mitigationText: `Gunakan gaya bahasa sesuai profil buyer, kunci skema DP minimal 30% T/T sebelum stuffing, dan lakukan verifikasi domain email korporat serta legalitas perusahaan.`,
        suggestedQuestions: [
          "Bagaimana menyusun email penawaran ekspor pertama agar direspons importir?",
          "Apa tanda bahaya (red flags) calon buyer luar negeri yang berisiko wanprestasi?",
          "Kapan waktu tepat mengirim Quotation vs Proforma Invoice?",
        ],
        initialPrompt: `Bantu strategi penawaran pra-transaksi dan verifikasi calon buyer untuk produk ${shipment.product || "ekspor"}.`,
        welcomeGreeting: "Halo! Saya siap membantu menyusun strategi pra-transaksi dan verifikasi calon buyer Anda.",
      };

    case "compliance":
      return {
        screenId: screen,
        riskLevel: "info",
        badgeText: "Kepatuhan BTKI, Lartas & Izin",
        title: `Pemeriksaan HS Code ${shipment.hsCode || "(Belum Diisi)"} & Izin Ekspor`,
        mitigationText: `Pastikan kesesuaian uraian barang dengan BTKI, manfaatkan e-SKA / CEPA untuk efisiensi tarif legal di negara tujuan, dan perbarui Karantina/SVLK minimal 30 hari sebelum expired.`,
        suggestedQuestions: [
          `Dokumen Lartas dan karantina apa yang wajib untuk HS Code ${shipment.hsCode || "ini"}?`,
          `Skema FTA / e-SKA mana yang paling menguntungkan menuju ${shipment.buyerCountry || "negara tujuan"}?`,
          "Apa konsekuensi jika Sertifikat Karantina atau SVLK habis masa berlakunya saat stuffing?",
        ],
        initialPrompt: `Analisis kepatuhan Lartas, kelengkapan izin karantina/e-SKA, dan alternatif tarif HS Code untuk ${shipment.product || "komoditas ini"}.`,
        welcomeGreeting: "Halo! Saya siap memandu verifikasi HS Code, persyaratan Lartas, dan pengurusan izin ekspor Anda.",
      };

    case "audit_vault":
      return {
        screenId: screen,
        riskLevel: "success",
        badgeText: "Kesiapan Pemeriksaan DJBC",
        title: "Panduan Kelengkapan Audit Vault Bea Cukai",
        mitigationText: `Pastikan kelima folder (Pra-Transaksi, Komersial/Revisi, PEB/NPE/Lartas, B/L Kontainer, dan Bukti T/T) terindeks lengkap minimal selama masa retensi audit kepabeanan.`,
        suggestedQuestions: [
          "Dokumen apa saja yang paling sering diperiksa saat audit post-clearance DJBC?",
          "Bagaimana mengaitkan nomor PEB/NPE dengan bukti penerimaan devisa T/T?",
          "Mengapa riwayat revisi Proforma hingga Commercial Invoice wajib diarsipkan?",
        ],
        initialPrompt: `Tinjau kelengkapan arsip Audit Vault DJBC untuk transaksi ${shipment.reference || "ekspor aktif"} dan tandai celah dokumen yang perlu dilengkapi.`,
        welcomeGreeting: "Halo! Saya siap membantu memastikan arsip digital ekspor Anda lengkap dan siap hadapi pemeriksaan audit DJBC.",
      };

    default:
      return {
        screenId: screen,
        riskLevel: "info",
        badgeText: "AI Advisor EksporFlow",
        title: "Konsultasi Cerdas Berbasis Transaksi Aktif",
        mitigationText: `AI Advisor membaca parameter transaksi ${shipment.reference || "EksporFlow"} secara langsung untuk membantu memitigasi potensi risiko operasional, kepabeanan, dan keuangan.`,
        suggestedQuestions: [
          `Tanyakan apa saja tentang transaksi ${shipment.reference || "ekspor ini"}`,
          "Apa risiko terbesar yang perlu saya selesaikan hari ini?",
          "Jelaskan alur ekspor dari proforma invoice hingga pencairan kas",
          "Bagaimana cara memvalidasi kelengkapan dokumen kepabeanan?",
        ],
        initialPrompt: `Saya membutuhkan panduan operasional dan mitigasi risiko untuk transaksi ekspor ${shipment.reference || "ini"}.`,
        welcomeGreeting: "Halo! Saya siap mendampingi operasional ekspor Anda.\n\nSilakan pilih pertanyaan rekomendasi di atas atau ajukan pertanyaan spesifik terkait transaksi ini.",
      };
  }
}

/**
 * Intelligent Customer Support & System Troubleshooting Engine
 * Melayani pertanyaan operasional ekspor dan kendala teknis sistem EksporFlow
 */
export function getCustomerSupportAnswer(
  question: string,
  context: {
    screen: ScreenId;
    screenTitle: string;
    shipment: Shipment;
    pricing: Pricing;
    container: ContainerCalc;
    flow?: Partial<WorkspaceFlow>;
  }
): string {
  const q = question.toLowerCase();
  const { shipment, pricing, container, flow, screenTitle } = context;

  // 1. Simpan data / Sandbox / Cloud / Save / Data Hilang
  if (
    q.includes("simpan") ||
    q.includes("save") ||
    q.includes("hilang") ||
    q.includes("tersimpan") ||
    q.includes("refresh") ||
    q.includes("muat ulang")
  ) {
    return `### 💾 Panduan Penyimpanan Data di EksporFlow

1. **Mode Demo (Sandbox Browser Lokal):**
   - Transaksi Anda tersimpan di memori browser lokal (*LocalStorage*).
   - Selalu klik tombol **"Simpan Sandbox"** di pojok kanan atas sebelum menutup atau merefresh halaman agar perubahan tidak hilang.
   - Sesi demo aktif selama **3 hari**.

2. **Mode Akun Cloud (Permanen):**
   - Untuk penyimpanan data permanen di cloud, kolaborasi tim, dan sinkronisasi lintas perangkat tanpa khawatir data terhapus, silakan klik tombol **"Daftar Akun / Masuk"** di bilah atas.
   - Perubahan data otomatis terlindungi dengan *Optimistic Locking* dan *Audit Vault*.`;
  }

  // 2. Konflik versi / Sync
  if (
    q.includes("konflik") ||
    q.includes("conflict") ||
    q.includes("versi") ||
    q.includes("timpa") ||
    q.includes("sinkron")
  ) {
    return `### ⚠️ Penanganan Banner Konflik Versi

Banner **"Konflik versi terdeteksi"** muncul saat sistem mendeteksi pembaruan data transaksi dari tab lain atau perangkat anggota tim Anda:

**Langkah Solusi:**
1. Klik tombol **"Muat Versi Terbaru"** pada banner kuning untuk menarik versi termutakhir tanpa menimpa kerja tim.
2. Jika ada perubahan lokal yang belum tersimpan, tinjau kembali nilai kontrak dan klik **"Simpan"** setelah versi terbaru dimuat.`;
  }

  // 3. Scan PO / Upload Dokumen / OCR
  if (
    q.includes("scan") ||
    q.includes("ocr") ||
    q.includes("input po") ||
    q.includes("upload") ||
    q.includes("unggah") ||
    q.includes("ekstrak")
  ) {
    return `### 📄 Panduan Fitur Scan PO & Input Order

1. **Cara Menggunakan AI Scan PO:**
   - Masuk ke menu **Penjualan > Input PO**.
   - Klik tombol **"Scan PO / OCR"** di bagian atas tabel.
   - Unggah berkas Purchase Order dari buyer (format **PDF, JPG, atau PNG** maksimal 10 MB).
   - Sistem akan mengekstrak otomatis: Nomor PO, nama buyer, komoditas, kuantitas, dan nilai kontrak.

2. **Input Manual:**
   - Anda juga dapat mengisi formulir PO secara langsung di halaman tersebut jika dokumen fisik buyer tidak tersedia dalam bentuk digital.
   - Klik **"Simpan & Sinkronkan ke Transaksi"** untuk menerapkan ke transaksi aktif.`;
  }

  // 4. Incoterms & Kalkulasi Harga
  if (
    q.includes("incoterm") ||
    q.includes("cif") ||
    q.includes("fob") ||
    q.includes("exw") ||
    q.includes("harga") ||
    q.includes("margin") ||
    q.includes("kalkulator") ||
    q.includes("penawaran")
  ) {
    return `### 🚢 Panduan Incoterms® 2020 & Matriks Harga

1. **Cara Mengubah Skenario Incoterm:**
   - Buka menu **Penjualan > Harga & Order**.
   - Pada tabel **Perbandingan Skenario Incoterms® 2020**, klik tombol **"Pilih"** di samping term yang diinginkan (misal **FOB** atau **CIF**).
   - Term aktif saat ini adalah **${shipment.incoterm}** dengan penawaran **${formatMoney(pricing.active.offer, shipment.currency)}** (margin **${shipment.margin}%**).

2. **Perbedaan Tanggung Jawab Utama:**
   - **EXW (Ex Works):** Pembeli menanggung seluruh ongkos kirim dan risiko dari gudang Anda.
   - **FOB (Free on Board):** Eksportir menanggung biaya hingga barang naik ke atas kapal di pelabuhan muat.
   - **CIF (Cost, Insurance & Freight):** Eksportir menanggung biaya logistik dan asuransi laut hingga pelabuhan bongkar tujuan.`;
  }

  // 5. Cetak Dokumen Ekspor / Download PDF
  if (
    q.includes("cetak") ||
    q.includes("print") ||
    q.includes("pdf") ||
    q.includes("dokumen") ||
    q.includes("download") ||
    q.includes("unduh") ||
    q.includes("peb") ||
    q.includes("coo") ||
    q.includes("invoice") ||
    q.includes("packing list")
  ) {
    return `### 📑 Cara Download & Cetak Dokumen Ekspor

1. Buka menu **Operasional Ekspor > Dokumen Ekspor**.
2. Pilih tab dokumen yang ingin Anda proses:
   - **Commercial Invoice (CI)**
   - **Packing List (PL)**
   - **Sales Contract (SC)**
   - **Proforma Invoice (PI)**
   - **Shipping Instruction (SI)**
3. Periksa kelengkapan klausul kontrak dan data kontainer.
4. Klik tombol **"Download PDF"** atau **"Cetak Dokumen"** di panel atas. Dokumen otomatis siap cetak dengan format standar kepabeanan internasional.`;
  }

  // 6. Muatan Kontainer 3D / CBM / Stuffing
  if (
    q.includes("kontainer") ||
    q.includes("container") ||
    q.includes("cbm") ||
    q.includes("stuffing") ||
    q.includes("muatan") ||
    q.includes("kubikasi")
  ) {
    return `### 📦 Optimasi Muatan Kontainer 3D

1. Buka menu **Operasional Ekspor > Muatan Kontainer 3D**.
2. Status kalkulasi saat ini:
   - Tipe Kontainer: **${shipment.containerType}** (${container.containers} unit kontainer).
   - Utilisasi Volume: **${container.volumeUtilization}%** (${formatNumber(container.totalVolume)} m³).
   - Utilisasi Berat: **${container.weightUtilization}%** (${formatNumber(container.totalWeight)} kg).
3. **Saran Efisiensi:**
   - Jika utilisasi volume di bawah 75%, Anda dapat menambah jumlah karton pesanan agar kapasitas kontainer terpakai optimal dan menghemat ongkir per satuan barang.`;
  }

  // 7. Verifikasi Buyer / Legalitas / Fraud
  if (
    q.includes("buyer") ||
    q.includes("pembeli") ||
    q.includes("legalitas") ||
    q.includes("verifikasi") ||
    q.includes("fraud") ||
    q.includes("eori") ||
    q.includes("vat")
  ) {
    return `### 🛡️ Verifikasi Legalitas & Anti-Fraud Buyer

1. Buka menu **Penjualan > Pra-Transaksi & Buyer**.
2. Evaluasi 5 kriteria verifikasi untuk **${shipment.buyer || "Buyer"}**:
   - ✅ Nomor Registrasi Bisnis / VAT / EORI valid.
   - ✅ Domain email resmi perusahaan (bukan email gratisan).
   - ✅ Pelabuhan tujuan (${shipment.destination || "Tujuan"}) bebas sanksi & embargo.
   - ✅ Metode pembayaran aman (Letter of Credit L/C At Sight atau DP minimal 30%).
   - ✅ Rekam jejak transaksi dan reputasi bisnis terverifikasi.`;
  }

  // 8. Tampilan Layar / Terpotong / Zoom / UI
  if (
    q.includes("terpotong") ||
    q.includes("geser") ||
    q.includes("layar") ||
    q.includes("tampilan") ||
    q.includes("zoom") ||
    q.includes("sidebar") ||
    q.includes("lebar")
  ) {
    return `### 🖥️ Penyesuaian Tampilan & Tata Letak Layar

1. **Resolusi & Skala Layar:**
   - Jika tabel atau panel samping terasa terpotong di laptop, tekan tombol keyboard **Ctrl + 0** untuk mereset zoom browser ke standar 100%.
   - Gunakan **Ctrl + Minus (-)** untuk tampilan lebih luas.

2. **Lipat / Buka Menu Sidebar:**
   - Klik ikon panel di sudut kiri bilah atas untuk menyembunyikan (*collapse*) sidebar agar area kerja menjadi lebih leluasa.

3. **Geser Horizontal (Horizontal Scroll):**
   - Pada tabel bertingkat banyak kolom, geser mouse atau gunakan trackpad dua jari ke samping untuk melihat kolom status dan tombol aksi.`;
  }

  // 9. Akun Demo / Upgrade / Masa Aktif
  if (
    q.includes("demo") ||
    q.includes("akun") ||
    q.includes("daftar") ||
    q.includes("login") ||
    q.includes("masuk") ||
    q.includes("berbayar") ||
    q.includes("gratis")
  ) {
    return `### 👤 Informasi Akun Demo & Pendaftaran

1. **Fitur Mode Demo (3 Hari):**
   - Anda dapat mencoba seluruh modul EksporFlow secara gratis tanpa kartu kredit.
   - Data disimpan aman di memori lokal browser Anda.

2. **Keuntungan Akun Resmi:**
   - Penyimpanan Cloud permanen aman di database Supabase.
   - Kolaborasi multi-pengguna & multi-perangkat antar tim.
   - Konsultasi AI live tanpa batas dengan sensor PII otomatis.
   - Klik tombol **"Daftar Akun"** di bilah atas untuk membuat akun Anda.`;
  }

  // 10. Kontak Customer Support / Bantuan Tim
  if (
    q.includes("cs") ||
    q.includes("support") ||
    q.includes("bantuan") ||
    q.includes("hubungi") ||
    q.includes("kontak") ||
    q.includes("wa") ||
    q.includes("whatsapp") ||
    q.includes("telepon") ||
    q.includes("email") ||
    q.includes("kendala")
  ) {
    return `### 📞 Layanan Bantuan & Customer Support EksporFlow

Jika Anda mengalami kendala pada sistem atau butuh panduan langsung dari tim spesialis ekspor kami:

- 💬 **WhatsApp Priority Support:** +62 812-9800-3344 *(Senin – Jumat, 08.00 – 18.00 WIB)*
- ✉️ **Email Dukungan Teknis:** support@eksporflow.com
- 🌐 **Pusat Panduan SOP:** Buka menu **Bantuan & Panduan** di navigasi samping.

Silakan sampaikan pesan error atau kendala yang dialami, tim kami akan merespons dengan cepat!`;
  }

  // 11. Fallback Respons Cerdas Kontekstual
  return `### 💡 Panduan Cerdas EksporFlow untuk ${screenTitle}

Pertanyaan Anda mengenai **"${question}"** dianalisis berdasarkan konteks transaksi **${shipment.reference}**:

- **Konteks Operasional:** Komoditas **${shipment.product}** (${formatNumber(shipment.quantity)} ${shipment.unit}) dengan rute **${shipment.exporter || "Indonesia"}** menuju **${shipment.destination}**.
- **Kondisi Finansial:** Ketentuan **${shipment.incoterm}** sebesar **${formatMoney(pricing.active.offer, shipment.currency)}** dengan estimasi margin **${shipment.margin}%**.
- **Tingkat Kesiapan:** Kesiapan alur operasional berada pada level **${flow?.riskEvaluation?.readinessPercent ?? 75}%**.

**Saran Langkah Selanjutnya:**
1. Pastikan seluruh dokumen legalitas buyer dan izin karantina/e-SKA sudah lengkap sebelum booking kapal.
2. Jika ada kendala sistem, Anda dapat menanyakan langsung:
   - *"Bagaimana cara simpan data?"*
   - *"Bagaimana cara scan PO?"*
   - *"Bagaimana cara ganti Incoterm?"*
   - *"Bagaimana cara cetak dokumen ekspor?"*`;
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
          <Sparkles size={14} />
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAnsweringLocal, setIsAnsweringLocal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const assistantMutation = trpc.assistant.ask.useMutation();
  const feedbackMutation = trpc.assistant.feedback.useMutation();

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

    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setInputQuestion("");

    if (isAuthenticated) {
      assistantMutation.mutate(
        {
          question: q,
          snapshot,
        },
        {
          onSuccess: (data) => {
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: data.answer,
                interactionId: data.interactionId,
                detectedPii: data.detectedPii,
              },
            ]);
          },
          onError: () => {
            const fallbackAns = getCustomerSupportAnswer(q, {
              screen,
              screenTitle,
              shipment,
              pricing,
              container,
              flow,
            });
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: fallbackAns,
              },
            ]);
          },
        },
      );
      return;
    }

    // Unauthenticated or Demo user: layani dengan cerdas tanpa memblokir
    setIsAnsweringLocal(true);
    setTimeout(() => {
      const answer = getCustomerSupportAnswer(q, {
        screen,
        screenTitle,
        shipment,
        pricing,
        container,
        flow,
      });
      const footnote = "\n\n---\n*💡 Tips: Anda sedang menggunakan Mode Demo (Bantuan Sistem Cepat). Masuk akun untuk sinkronisasi cloud.*";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `${answer}${footnote}`,
        },
      ]);
      setIsAnsweringLocal(false);
    }, 400);
  };

  const handleFeedback = (interactionId: string, rating: "up" | "down", msgIndex: number) => {
    feedbackMutation.mutate(
      { interactionId, rating },
      {
        onSuccess: () => {
          toast.success(rating === "up" ? "Terima kasih atas ulasan positif Anda!" : "Ulasan tercatat untuk audit evaluasi model.");
          setMessages((prev) =>
            prev.map((m, idx) => (idx === msgIndex ? { ...m, feedbackGiven: rating } : m))
          );
        },
        onError: () => {
          toast.error("Gagal mengirim umpan balik.");
        },
      }
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
              <Sparkles size={18} />
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

        {/* Citations & Trust Bar */}
        <div className="ai-citations-bar">
          <span className="ai-badge-citation">
            <ShieldCheck size={11} style={{ color: "#10b981" }} /> PII Terproteksi
          </span>
          <span className="ai-badge-citation">INSW/BTKI 2022</span>
          <span className="ai-badge-citation">Incoterms® 2020</span>
          <span className="ai-badge-citation">ISO 668</span>
        </div>

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
                {m.role === "assistant" ? <Sparkles size={12} strokeWidth={2.4} /> : <User size={12} strokeWidth={2.4} />}
              </div>
              <div className="bubble-text">
                {m.role === "assistant" ? (
                  <>
                    <Streamdown>{m.content}</Streamdown>
                    {m.interactionId && (
                      <div className="ai-msg-actions">
                        {m.detectedPii && m.detectedPii.length > 0 && (
                          <span className="ai-pii-tag" title={`Data sensitif disensor: ${m.detectedPii.join(", ")}`}>
                            <ShieldCheck size={10} /> Disensor ({m.detectedPii.length})
                          </span>
                        )}
                        <div className="ai-feedback-group">
                          <button
                            type="button"
                            className={`ai-feedback-btn ${m.feedbackGiven === "up" ? "active" : ""}`}
                            onClick={() => handleFeedback(m.interactionId!, "up", index)}
                            title="Jawaban akurat & membantu"
                            disabled={feedbackMutation.isPending || !!m.feedbackGiven}
                          >
                            <ThumbsUp size={11} />
                          </button>
                          <button
                            type="button"
                            className={`ai-feedback-btn ${m.feedbackGiven === "down" ? "active" : ""}`}
                            onClick={() => handleFeedback(m.interactionId!, "down", index)}
                            title="Kurang relevan / ada koreksi"
                            disabled={feedbackMutation.isPending || !!m.feedbackGiven}
                          >
                            <ThumbsDown size={11} />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{m.content}</p>
                )}
              </div>
            </div>
          ))}

          {(assistantMutation.isPending || isAnsweringLocal) && (
            <div className="ai-drawer-bubble assistant loading">
              <div className="bubble-avatar">
                <Sparkles size={12} strokeWidth={2.4} />
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
              <span>Mode Bantuan Sistem Aktif (Mode Demo). Masuk akun untuk sinkronisasi cloud.</span>
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
              disabled={assistantMutation.isPending || isAnsweringLocal}
            />
            <button
              type="submit"
              className="ai-drawer-send-btn"
              disabled={!inputQuestion.trim() || assistantMutation.isPending || isAnsweringLocal}
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

export function ScreenAIFloatingWidget({
  isOpen,
  onToggle,
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
  onToggle: () => void;
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnsweringLocal, setIsAnsweringLocal] = useState(false);
  const [messages, setMessages] = useState<
    Array<{
      role: "user" | "assistant";
      content: string;
      interactionId?: string | null;
      feedbackGiven?: "up" | "down" | null;
      detectedPii?: string[];
    }>
  >([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevScreenRef = useRef<ScreenId>(screen);

  const assistantMutation = trpc.assistant.ask.useMutation();
  const feedbackMutation = trpc.assistant.feedback.useMutation();

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

  // Muat pesan awal saat popup dibuka
  useEffect(() => {
    if (isOpen) {
      if (messages.length === 0 || prevScreenRef.current !== screen) {
        prevScreenRef.current = screen;
        setMessages([
          {
            role: "assistant",
            content: `Halo! Saya **AI Advisor & Assistant EksporFlow**.\n\nSaya siap membantu analisis regulasi ekspor transaksi **${shipment.reference || "EksporFlow"}** maupun membantu saat Anda mengalami **kendala dalam sistem** (cara simpan data, scan PO, cetak dokumen, ganti Incoterm, dll).\n\nAda yang bisa saya bantu hari ini?`,
          },
        ]);
      }
    }
  }, [isOpen, screen, messages.length, shipment.reference]);

  // Pantau perpindahan layar saat popup sedang terbuka
  useEffect(() => {
    if (!isOpen) {
      prevScreenRef.current = screen;
      return;
    }

    if (prevScreenRef.current !== screen && messages.length > 0) {
      prevScreenRef.current = screen;
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `📍 **Beralih ke Layar ${screenTitle}**\n\n${insight.welcomeGreeting}`,
        },
      ]);
    }
  }, [isOpen, screen, screenTitle, insight.welcomeGreeting, messages.length]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Tutup dengan Escape
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

    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setInputQuestion("");

    if (isAuthenticated) {
      assistantMutation.mutate(
        {
          question: q,
          snapshot,
        },
        {
          onSuccess: (data) => {
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: data.answer,
                interactionId: data.interactionId,
                detectedPii: data.detectedPii,
              },
            ]);
          },
          onError: () => {
            const fallbackAns = getCustomerSupportAnswer(q, {
              screen,
              screenTitle,
              shipment,
              pricing,
              container,
              flow,
            });
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: fallbackAns,
              },
            ]);
          },
        },
      );
      return;
    }

    // Unauthenticated or Demo user: layani langsung dengan cerdas
    setIsAnsweringLocal(true);
    setTimeout(() => {
      const answer = getCustomerSupportAnswer(q, {
        screen,
        screenTitle,
        shipment,
        pricing,
        container,
        flow,
      });
      const footnote = "\n\n---\n*💡 Tips: Anda sedang menggunakan Mode Demo (Bantuan Cepat). Masuk akun untuk konsultasi live AI cloud.*";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `${answer}${footnote}`,
        },
      ]);
      setIsAnsweringLocal(false);
    }, 400);
  };

  const handleFeedback = (interactionId: string, rating: "up" | "down", msgIndex: number) => {
    feedbackMutation.mutate(
      { interactionId, rating },
      {
        onSuccess: () => {
          toast.success(rating === "up" ? "Terima kasih atas ulasan positif Anda!" : "Ulasan tercatat untuk audit evaluasi model.");
          setMessages((prev) =>
            prev.map((m, idx) => (idx === msgIndex ? { ...m, feedbackGiven: rating } : m))
          );
        },
        onError: () => {
          toast.error("Gagal mengirim umpan balik.");
        },
      }
    );
  };

  return (
    <>
      {/* Floating Action Button (Sleek Enterprise AI Advisor) - Hanya tampil saat popup tertutup */}
      {!isOpen && (
        <button
          type="button"
          className="ai-float-trigger-btn"
          onClick={onToggle}
          aria-label="Bantuan Sistem & AI Advisor Ekspor"
          title="Bantuan Sistem & AI Advisor Ekspor"
        >
          <Sparkles size={16} />
          <span className="ai-float-trigger-label">Bantuan &amp; AI Advisor</span>
          <span
            className={`ai-float-trigger-badge ${
              insight.riskLevel === "danger"
                ? "risk-danger"
                : insight.riskLevel === "warning"
                ? "risk-warning"
                : ""
            }`}
          />
        </button>
      )}

      {/* Floating Chat Popup (Sleek Enterprise Panel) */}
      {isOpen && (
        <div className={`ai-float-popup ${isExpanded ? "expanded" : ""}`} role="dialog" aria-label="Tanya AI Advisor Ekspor">
          <div className="ai-float-header">
            <div className="ai-float-header-top">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="ai-float-pill-btn">
                  <Sparkles size={12} strokeWidth={2.4} /> AI Advisor
                </span>
                <span className="ai-float-screen-tag">{screenTitle}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <button
                  type="button"
                  className="ai-float-header-expand"
                  onClick={() => setIsExpanded(!isExpanded)}
                  aria-label={isExpanded ? "Perkecil panel" : "Perbesar panel"}
                  title={isExpanded ? "Perkecil panel" : "Perbesar panel"}
                  style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", padding: "4px", display: "inline-flex", alignItems: "center", borderRadius: "4px" }}
                >
                  {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                </button>
                <button
                  type="button"
                  className="ai-float-header-close"
                  onClick={onClose}
                  aria-label="Tutup"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            <div style={{ marginTop: "6px" }}>
              <h4>Konsultasi Regulasi &amp; Bantuan Sistem</h4>
              <p>
                <span className="ai-float-dot" /> Asisten real-time · {shipment.reference || "EksporFlow"}
              </p>
            </div>
          </div>

          {/* Citations & Trust Bar */}
          <div className="ai-citations-bar">
            <span className="ai-badge-citation">
              <ShieldCheck size={11} style={{ color: "#10b981" }} /> PII Terproteksi
            </span>
            <span className="ai-badge-citation">INSW/BTKI 2022</span>
            <span className="ai-badge-citation">Incoterms® 2020</span>
            <span className="ai-badge-citation">ISO 668</span>
          </div>

          {/* Isi Pesan Konsultasi */}
          <div className="ai-float-body">
            {/* Kartu Insight Temuan Risiko Menu Saat Ini */}
            <div className={`ai-float-insight ${insight.riskLevel}`}>
              <div className="ai-float-insight-head">
                <span>{insight.badgeText}</span>
              </div>
              <h5>{insight.title}</h5>
              <p>{insight.mitigationText}</p>
            </div>

            {/* Pilihan Tanya Cepat */}
            <div className="ai-float-chips-wrap">
              <span className="ai-float-chips-title">PILIHAN TANYA CEPAT:</span>
              {insight.suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="ai-float-chip"
                  onClick={() => handleSend(q)}
                  disabled={assistantMutation.isPending || isAnsweringLocal}
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Pilihan Bantuan Kendala Sistem */}
            <div className="ai-float-chips-wrap" style={{ marginTop: "4px" }}>
              <span className="ai-float-chips-title">BANTUAN SISTEM &amp; KENDALA:</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                <button
                  type="button"
                  className="ai-float-chip"
                  onClick={() => handleSend("Bagaimana cara simpan data transaksi agar tidak hilang?")}
                  disabled={assistantMutation.isPending || isAnsweringLocal}
                >
                  💾 Simpan Data
                </button>
                <button
                  type="button"
                  className="ai-float-chip"
                  onClick={() => handleSend("Bagaimana cara cetak atau download dokumen ekspor PDF?")}
                  disabled={assistantMutation.isPending || isAnsweringLocal}
                >
                  📄 Cetak Dokumen
                </button>
                <button
                  type="button"
                  className="ai-float-chip"
                  onClick={() => handleSend("Bagaimana cara mengubah Incoterm dan cek harga penawaran?")}
                  disabled={assistantMutation.isPending || isAnsweringLocal}
                >
                  🚢 Ganti Incoterm
                </button>
                <button
                  type="button"
                  className="ai-float-chip"
                  onClick={() => handleSend("Bagaimana cara menghubungi customer support jika ada kendala sistem?")}
                  disabled={assistantMutation.isPending || isAnsweringLocal}
                >
                  📞 Kontak CS Support
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            {messages.map((m, index) => (
              <div key={index} className={`ai-drawer-bubble ${m.role}`}>
                <div className="bubble-avatar">
                  {m.role === "assistant" ? <Sparkles size={12} strokeWidth={2.4} /> : <User size={12} strokeWidth={2.4} />}
                </div>
                <div className="bubble-text">
                  {m.role === "assistant" ? (
                    <>
                      <Streamdown>{m.content}</Streamdown>
                      {m.interactionId && (
                        <div className="ai-msg-actions">
                          {m.detectedPii && m.detectedPii.length > 0 && (
                            <span className="ai-pii-tag" title={`Data sensitif disensor: ${m.detectedPii.join(", ")}`}>
                              <ShieldCheck size={10} /> Disensor ({m.detectedPii.length})
                            </span>
                          )}
                          <div className="ai-feedback-group">
                            <button
                              type="button"
                              className={`ai-feedback-btn ${m.feedbackGiven === "up" ? "active" : ""}`}
                              onClick={() => handleFeedback(m.interactionId!, "up", index)}
                              title="Jawaban akurat & membantu"
                              disabled={feedbackMutation.isPending || !!m.feedbackGiven}
                            >
                              <ThumbsUp size={11} />
                            </button>
                            <button
                              type="button"
                              className={`ai-feedback-btn ${m.feedbackGiven === "down" ? "active" : ""}`}
                              onClick={() => handleFeedback(m.interactionId!, "down", index)}
                              title="Kurang relevan / ada koreksi"
                              disabled={feedbackMutation.isPending || !!m.feedbackGiven}
                            >
                              <ThumbsDown size={11} />
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{m.content}</p>
                  )}
                </div>
              </div>
            ))}

            {(assistantMutation.isPending || isAnsweringLocal) && (
              <div className="ai-drawer-bubble assistant loading">
                <div className="bubble-avatar">
                  <Sparkles size={12} strokeWidth={2.4} />
                </div>
                <div className="bubble-text">
                  <span className="ai-typing-indicator">
                    <Loader2 size={13} className="spin" />
                    AI Advisor sedang menyiapkan jawaban...
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Area Matching Gambar 1 */}
          <div className="ai-float-footer">
            {!isAuthenticated && (
              <div className="ai-drawer-auth-warning" style={{ marginBottom: "6px" }}>
                <span>Mode Bantuan Sistem Aktif (Mode Demo). Masuk akun untuk sinkronisasi cloud.</span>
                <button type="button" onClick={onLogin}>
                  Masuk Sekarang
                </button>
              </div>
            )}

            <form
              className="ai-float-input-box"
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
            >
              <input
                type="text"
                value={inputQuestion}
                onChange={(e) => setInputQuestion(e.target.value)}
                placeholder="Tulis pesan atau pilih pertanyaan di atas..."
                disabled={assistantMutation.isPending || isAnsweringLocal}
              />
              <button
                type="submit"
                className="ai-float-send-btn"
                disabled={!inputQuestion.trim() || assistantMutation.isPending || isAnsweringLocal}
                aria-label="Kirim pesan"
              >
                <Send size={14} />
              </button>
            </form>

            <button
              type="button"
              className="ai-float-fullscreen-link"
              onClick={() => {
                onClose();
                onNavigateFullAdvisor();
              }}
            >
              Buka Layar Penuh AI Advisor →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
