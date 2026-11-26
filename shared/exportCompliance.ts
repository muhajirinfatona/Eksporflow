import type { Shipment } from "./shipment";

export type PermitStatusSeverity = "valid" | "expiring_soon" | "expired" | "missing";

export type ExportPermitRecord = {
  quarantineNumber?: string;
  quarantineExpiry?: string;
  cooNumber?: string;
  cooExpiry?: string;
  lartasLicenseNumber?: string;
  lartasExpiry?: string;
  halalOrBpomNumber?: string;
  halalOrBpomExpiry?: string;
  dheEscrowNumber?: string;
  dheBankName?: string;
  dheRetentionStatus?: "valid" | "pending" | "exempt" | "overdue";
};

export type DheSdaRecord = {
  ppePebValueUsd: number;
  isMandatoryDhe: boolean;
  minRetentionUsd: number;
  retentionMonths: number;
  escrowBankName?: string;
  escrowAccountNumber?: string;
  depositDate?: string;
  complianceStatus: "valid" | "pending" | "exempt" | "overdue";
  regulatoryBasis: string;
};

export type PreShipmentSchedule = {
  etdDate?: string;
  pebClosingDate?: string;
  completedIds?: string[];
};

export type AuditVaultFolderId =
  | "01_pra_transaksi"
  | "02_komersial"
  | "03_kepabeanan_lartas"
  | "04_logistik_bl"
  | "05_pembayaran_tt";

export type AuditVaultCustomDoc = {
  id: string;
  folder: AuditVaultFolderId;
  title: string;
  docNumber?: string;
  addedAt: string;
  source: "manual" | "auto";
};

export type PreTransactionDraftData = {
  docType?: "inquiry" | "quotation" | "negotiation";
  tone?: "formal" | "semi_formal" | "casual";
  prospectCompany?: string;
  prospectCountry?: string;
  prospectEmail?: string;
  customNotes?: string;
  buyerVerifiedChecklist?: string[];
  customSubject?: string;
  customBody?: string;
  attachments?: string[];
  referenceNumber?: string;
};

export interface HsTariffOption {
  hsCode: string;
  title: string;
  category: string;
  keywords: string[];
  baseTariffNote: string;
  ftaBenefitNote: string;
  lartasCategory: "Bebas Ekspor (Non-Lartas)" | "Lartas Terbatas / Persyaratan Mutu" | "Wajib Izin Khusus / PE";
  requiredPermits: string[];
  alternativeHsCode?: string;
  alternativeReason?: string;
  estimatedDutySavings?: string;
}

export const HS_REFERENCE_CATALOG: HsTariffOption[] = [
  {
    hsCode: "1702.90.91",
    title: "Gula Aren / Gula Kelapa Organik Granulasi (Palm / Coconut Sugar)",
    category: "Pangan Olahan & Pemanis Alami",
    keywords: ["palm sugar", "coconut sugar", "gula aren", "gula semut", "gula kelapa", "1702.90", "170290"],
    baseTariffNote: "MFN Uni Emirat Arab 5% · Uni Eropa 8% · Jepang 12%",
    ftaBenefitNote: "0% dengan IUAE-CEPA (UAE) atau IJ-EPA / RCEP (Jepang) menggunakan e-SKA Form",
    lartasCategory: "Bebas Ekspor (Non-Lartas)",
    requiredPermits: ["Phytosanitary / Sertifikat Karantina Tumbuhan", "e-SKA / Certificate of Origin (COO)", "COA / Lab Uji Kadar Air & Mikrobiologi"],
    alternativeHsCode: "1702.90.99",
    alternativeReason: "Jika produk diformulasi dengan bahan tambahan lain atau kemasan ritel < 1kg (pastikan uji komposisi lab bersama PPJK).",
    estimatedDutySavings: "Hemat 5% – 12% bea masuk negara tujuan dengan e-SKA / CEPA",
  },
  {
    hsCode: "0901.11.10",
    title: "Biji Kopi Arabika / Robusta Mentah (Unroasted Green Beans)",
    category: "Hasil Perkebunan",
    keywords: ["kopi", "coffee", "arabica", "robusta", "green bean", "0901"],
    baseTariffNote: "ASEAN ATIGA 0% · Jepang 0% · Uni Eropa 0% (Green Bean) vs 7.5% (Roasted)",
    ftaBenefitNote: "Bebas bea masuk 0% di hampir seluruh pasar untuk green bean non-decaffeinated",
    lartasCategory: "Lartas Terbatas / Persyaratan Mutu",
    requiredPermits: ["Eksportir Terdaftar Kopi (ETK) / SPEK jika berlaku kuota ICO", "Phytosanitary Certificate (Karantina Pertanian)", "e-SKA / COO (Form ICO + Form D/E/CEPA)"],
    alternativeHsCode: "0901.21.10",
    alternativeReason: "Untuk kopi sangrai (roasted) nilai tambah lebih tinggi, namun perhatikan tarif impor negara tujuan yang umumnya lebih tinggi daripada green bean.",
    estimatedDutySavings: "Selisih tarif Green Bean vs Roasted hingga 7.5% di pasar UE",
  },
  {
    hsCode: "1513.11.00",
    title: "Minyak Kelapa Murni / Virgin Coconut Oil (VCO & Crude Coconut Oil)",
    category: "Turunan Kelapa",
    keywords: ["vco", "virgin coconut", "coconut oil", "minyak kelapa", "kopra", "1513"],
    baseTariffNote: "RCEP / ASEAN 0% · Timur Tengah 5% (0% via IUAE-CEPA) · Eropa 2.5%–6.4%",
    ftaBenefitNote: "Manfaatkan RCEP / Form AK / Form E untuk pembebasan bea masuk di Asia Pasifik",
    lartasCategory: "Lartas Terbatas / Persyaratan Mutu",
    requiredPermits: ["Sertifikat Karantina / Health Certificate (BPOM / Barantin)", "Certificate of Analysis (COA)", "e-SKA / Certificate of Origin"],
    alternativeHsCode: "1513.19.10",
    alternativeReason: "Untuk fraksi VCO food-grade olahan siap konsumsi (refined) agar klasifikasi mutu pangan lebih tepat di negara tujuan.",
    estimatedDutySavings: "Tarif preferensial 0% di blok ASEAN+3 & UAE CEPA",
  },
  {
    hsCode: "4402.90.10",
    title: "Briket Arang Tempurung Kelapa (Coconut Shell Charcoal Briquettes)",
    category: "Biomassa & Energi Terbarukan",
    keywords: ["charcoal", "briquette", "briket", "arang", "kelapa", "4402"],
    baseTariffNote: "Timur Tengah 5% · Uni Eropa 0% · AS 0%",
    ftaBenefitNote: "Tarif 0% dengan IUAE-CEPA & Form COO untuk pasar Timur Tengah/Shisha",
    lartasCategory: "Wajib Izin Khusus / PE",
    requiredPermits: ["V-Legal / SVLK (atau Pernyataan Khusus Arang Tempurung Non-Kayu Hutan)", "SHT / Self-Heating Test Certificate (IMDG Code Class 4.2)", "MSDS (Material Safety Data Sheet) & Laporan Uji Vanadium/Ash", "Laporan Surveyor (bila dipersyaratkan rute khusus)"],
    alternativeHsCode: "4402.20.10",
    alternativeReason: "Khusus arang tempurung kelapa murni (Shell Charcoal HS 4402.20 pada HS 2022) membedakannya secara tegas dari arang kayu hutan sehingga memudahkan verifikasi non-SVLK kayu.",
    estimatedDutySavings: "Penghindaran penahanan DG di pelabuhan & penghematan 5% via CEPA",
  },
  {
    hsCode: "0306.17.11",
    title: "Udang Beku / Produk Perikanan Laut Ekspor (Frozen Shrimp / Seafood)",
    category: "Perikanan & Kelautan",
    keywords: ["shrimp", "udang", "tuna", "ikan", "fish", "seafood", "0306", "0304"],
    baseTariffNote: "Jepang 1% (0% IJ-EPA) · AS 0% (pantau Anti-Dumping) · Eropa 4.2%–12%",
    ftaBenefitNote: "0% dengan Surat Keterangan Asal (e-SKA IJ-EPA / RCEP)",
    lartasCategory: "Lartas Terbatas / Persyaratan Mutu",
    requiredPermits: ["Health Certificate (HC) BKIPM / KKP", "Sertifikat Hasil Tangkapan Ikan (SHTI) / Catch Certificate", "HACCP / Sertifikat Pengolahan Ikan (UPI)"],
    alternativeHsCode: "1605.21.00",
    alternativeReason: "Untuk produk udang olahan / breaded / siap saji (HS Bab 16) bila melalui pemrosesan bernilai tambah.",
    estimatedDutySavings: "Optimasi tarif IJ-EPA hingga 1% – 4.2%",
  },
  {
    hsCode: "0908.11.00",
    title: "Rempah Pala, Cengkeh & Lada (Nutmeg, Cloves & Spices)",
    category: "Rempah Nusantara",
    keywords: ["nutmeg", "pala", "clove", "cengkeh", "pepper", "lada", "spices", "rempah", "0904", "0907", "0908"],
    baseTariffNote: "Eropa 0% (whole) vs 4% (crushed) · AS 0% · India 30%–70% (AIFTA preferensi)",
    ftaBenefitNote: "Form AI (ASEAN-India FTA) atau Form D menurunkan bea masuk rempah secara signifikan",
    lartasCategory: "Lartas Terbatas / Persyaratan Mutu",
    requiredPermits: ["Phytosanitary Certificate (Barantin)", "Laporan Uji Aflatoxin & Mikotoksin (khusus ekspor UE)", "e-SKA / COO"],
    alternativeHsCode: "0908.12.00",
    alternativeReason: "Pembeda antara biji pala utuh (0908.11 = 0% di beberapa pasar) dengan bubuk/hancuran (0908.12).",
    estimatedDutySavings: "Selisih tarif whole vs crushed hingga 4% di Uni Eropa",
  },
  {
    hsCode: "9403.60.90",
    title: "Furnitur Kayu & Kerajinan Rotan Ekspor (Wooden & Rattan Furniture)",
    category: "Manufaktur & Kerajinan",
    keywords: ["furniture", "mebel", "kayu", "wood", "rotan", "rattan", "teak", "jati", "9403", "4418"],
    baseTariffNote: "AS 0% · Eropa 0% · Australia 0% (IA-CEPA) · Jepang 0%",
    ftaBenefitNote: "FLEGT V-Legal wajib untuk masuk Uni Eropa/UK tanpa kendala EUDR",
    lartasCategory: "Wajib Izin Khusus / PE",
    requiredPermits: ["Dokumen V-Legal / SVLK (SILK Kementerian LHK)", "Phytosanitary & Fumigasi ISPM-15 (Kemasan Kayu)", "e-SKA / Certificate of Origin"],
    alternativeHsCode: "9403.82.00",
    alternativeReason: "Jika bahan dominan bambu atau rotan, gunakan pos HS 9403.82/83 yang memiliki perlakuan regulasi kayu hutan berbeda.",
    estimatedDutySavings: "Akses jalur hijau FLEGT Uni Eropa bebas denda tahanan",
  },
];

export interface HsVerificationResult {
  matchedEntry: HsTariffOption | null;
  alignmentStatus: "Sesuai Katalog" | "Perlu Verifikasi Manual" | "Disarankan Tinjau HS Code";
  alignmentTone: "green" | "amber" | "red";
  summaryNote: string;
  destinationDutyHint: string;
  lartasStatus: HsTariffOption["lartasCategory"];
  lartasRequired: boolean;
  requiredPermits: string[];
  alternativeHsCode?: string;
  alternativeReason?: string;
  estimatedDutySavings?: string;
}

export function verifyHsCodeAndLartas(
  productName: string,
  hsCode: string,
  buyerCountry: string,
): HsVerificationResult {
  const cleanProduct = (productName || "").trim().toLowerCase();
  const cleanHs = (hsCode || "").replace(/\s+/g, "").toLowerCase();
  const cleanCountry = (buyerCountry || "").trim();

  const hsMatch = cleanHs
    ? HS_REFERENCE_CATALOG.find(
        (entry) =>
          entry.hsCode.toLowerCase().startsWith(cleanHs.slice(0, 7)) ||
          cleanHs.startsWith(entry.hsCode.slice(0, 7).toLowerCase()) ||
          entry.keywords.some((kw) => cleanHs.includes(kw)),
      )
    : undefined;

  const productMatch = cleanProduct
    ? HS_REFERENCE_CATALOG.find((entry) =>
        entry.keywords.some((kw) => cleanProduct.includes(kw)),
      )
    : undefined;

  const matchedEntry = hsMatch || productMatch || null;

  if (!matchedEntry) {
    return {
      matchedEntry: null,
      alignmentStatus: cleanHs ? "Perlu Verifikasi Manual" : "Disarankan Tinjau HS Code",
      alignmentTone: cleanHs ? "amber" : "red",
      summaryNote: cleanHs
        ? `HS Code ${hsCode} belum ada di database simulasi cepat UMKM. Pastikan 6–8 digit BTKI 2022 sesuai uraian barang di PEB.`
        : "HS Code belum diisi. Klasifikasi HS wajib dicantumkan untuk cek Lartas dan tarif negara tujuan.",
      destinationDutyHint: cleanCountry
        ? `Periksa skema FTA/CEPA aktif Indonesia → ${cleanCountry} di portal INSW.`
        : "Isi negara tujuan untuk rekomendasi skema pembebasan bea masuk (FTA/CEPA).",
      lartasStatus: "Lartas Terbatas / Persyaratan Mutu",
      lartasRequired: true,
      requiredPermits: [
        "Pengecekan BTKI / INSW Lartas",
        "e-SKA / Certificate of Origin (COO)",
        "Sertifikat Karantina / Mutu Produk (sesuai komoditas)",
      ],
    };
  }

  const productMatchesEntry =
    !cleanProduct || matchedEntry.keywords.some((kw) => cleanProduct.includes(kw));
  const hsMatchesEntry =
    Boolean(cleanHs) &&
    (cleanHs.startsWith(matchedEntry.hsCode.slice(0, 4).toLowerCase()) ||
      matchedEntry.hsCode.toLowerCase().startsWith(cleanHs.slice(0, 4)));

  let alignmentStatus: HsVerificationResult["alignmentStatus"] = "Sesuai Katalog";
  let alignmentTone: HsVerificationResult["alignmentTone"] = "green";
  let summaryNote = `Klasifikasi HS ${hsCode || matchedEntry.hsCode} konsisten dengan kategori ${matchedEntry.category}.`;

  if (!cleanHs) {
    alignmentStatus = "Disarankan Tinjau HS Code";
    alignmentTone = "red";
    summaryNote = `HS Code kosong. Berdasarkan komoditas "${productName}", direkomendasikan memakai ${matchedEntry.hsCode}.`;
  } else if (!hsMatchesEntry || !productMatchesEntry) {
    alignmentStatus = "Disarankan Tinjau HS Code";
    alignmentTone = "amber";
    summaryNote = `Uraian "${productName}" dan HS "${hsCode}" mengarah ke pos yang berbeda. Referensi terdekat: ${matchedEntry.hsCode} (${matchedEntry.title}).`;
  }

  const destinationDutyHint = cleanCountry
    ? `Tujuan ${cleanCountry}: ${matchedEntry.baseTariffNote}. ${matchedEntry.ftaBenefitNote}.`
    : `${matchedEntry.baseTariffNote}. ${matchedEntry.ftaBenefitNote}.`;

  return {
    matchedEntry,
    alignmentStatus,
    alignmentTone,
    summaryNote,
    destinationDutyHint,
    lartasStatus: matchedEntry.lartasCategory,
    lartasRequired: matchedEntry.lartasCategory !== "Bebas Ekspor (Non-Lartas)",
    requiredPermits: matchedEntry.requiredPermits,
    alternativeHsCode: matchedEntry.alternativeHsCode,
    alternativeReason: matchedEntry.alternativeReason,
    estimatedDutySavings: matchedEntry.estimatedDutySavings,
  };
}

export interface PermitExpiryEvaluationItem {
  key: keyof ExportPermitRecord;
  label: string;
  numberValue: string;
  expiryDate: string;
  daysLeft: number | null;
  severity: PermitStatusSeverity;
  statusLabel: string;
}

export function evaluatePermitExpiries(
  permits: ExportPermitRecord | undefined,
  referenceDate: Date = new Date(),
): PermitExpiryEvaluationItem[] {
  const safe = permits || {};
  const fields: {
    numKey: keyof ExportPermitRecord;
    expKey: keyof ExportPermitRecord;
    label: string;
  }[] = [
    { numKey: "quarantineNumber", expKey: "quarantineExpiry", label: "Sertifikat Karantina / Phytosanitary" },
    { numKey: "cooNumber", expKey: "cooExpiry", label: "e-SKA / Certificate of Origin (COO)" },
    { numKey: "lartasLicenseNumber", expKey: "lartasExpiry", label: "Izin Lartas / PE / SVLK" },
    { numKey: "halalOrBpomNumber", expKey: "halalOrBpomExpiry", label: "Sertifikat Halal / BPOM / COA" },
  ];

  const startOfToday = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  ).getTime();

  return fields.map((item) => {
    const numVal = (safe[item.numKey] || "").trim();
    const expVal = (safe[item.expKey] || "").trim();

    if (!expVal) {
      return {
        key: item.expKey,
        label: item.label,
        numberValue: numVal,
        expiryDate: "",
        daysLeft: null,
        severity: numVal ? "valid" : "missing",
        statusLabel: numVal ? "Tercatat (Tanpa Tgl Kedaluwarsa)" : "Belum Diisi",
      };
    }

    const parsed = new Date(`${expVal}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      return {
        key: item.expKey,
        label: item.label,
        numberValue: numVal,
        expiryDate: expVal,
        daysLeft: null,
        severity: "missing",
        statusLabel: "Format Tanggal Tidak Valid",
      };
    }

    const diffDays = Math.round((parsed.getTime() - startOfToday) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      return {
        key: item.expKey,
        label: item.label,
        numberValue: numVal,
        expiryDate: expVal,
        daysLeft: diffDays,
        severity: "expired",
        statusLabel: `Kedaluwarsa ${Math.abs(diffDays)} hari lalu`,
      };
    }
    if (diffDays <= 30) {
      return {
        key: item.expKey,
        label: item.label,
        numberValue: numVal,
        expiryDate: expVal,
        daysLeft: diffDays,
        severity: "expiring_soon",
        statusLabel: diffDays === 0 ? "Berakhir Hari Ini!" : `Peringatan Dini: H-${diffDays}`,
      };
    }

    return {
      key: item.expKey,
      label: item.label,
      numberValue: numVal,
      expiryDate: expVal,
      daysLeft: diffDays,
      severity: "valid",
      statusLabel: `Aktif (${diffDays} hari lagi)`,
    };
  });
}

export interface TimelineMilestone {
  id: string;
  dayOffsetFromEtd: number;
  tag: string;
  title: string;
  detail: string;
  targetScreen: "documents" | "compliance" | "cargo" | "scrutiny" | "shipment";
  dueDateIso: string;
  daysUntilDue: number;
  completed: boolean;
  urgency: "completed" | "overdue" | "due_soon" | "upcoming";
}

function toLocalYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function buildPreShipmentTimeline(
  schedule: PreShipmentSchedule | undefined,
  referenceDate: Date = new Date(),
): {
  etdDate: string;
  pebClosingDate: string;
  milestones: TimelineMilestone[];
  completedCount: number;
  completionPercent: number;
} {
  const baseDay = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );

  const defaultEtd = toLocalYmd(new Date(baseDay.getTime() + 7 * 86400000));
  const etdDate = (schedule?.etdDate || "").trim() || defaultEtd;
  const etdTime = new Date(`${etdDate}T00:00:00`);
  const validEtd = Number.isNaN(etdTime.getTime()) ? new Date(baseDay.getTime() + 7 * 86400000) : etdTime;

  const defaultPeb = toLocalYmd(new Date(validEtd.getTime() - 2 * 86400000));
  const pebClosingDate = (schedule?.pebClosingDate || "").trim() || defaultPeb;
  const completedSet = new Set(schedule?.completedIds || []);

  const defs: Omit<TimelineMilestone, "dueDateIso" | "daysUntilDue" | "completed" | "urgency">[] = [
    {
      id: "h7_contract_dp",
      dayOffsetFromEtd: -7,
      tag: "H-7 ETD",
      title: "Finalisasi PI, Sales Contract & Konfirmasi DP Buyer",
      detail: "Kunci harga Incoterms, spesifikasi barang, dan jadwal terima DP sebelum booking kontainer.",
      targetScreen: "documents",
    },
    {
      id: "h5_lartas_permits",
      dayOffsetFromEtd: -5,
      tag: "H-5 ETD",
      title: "Verifikasi HS Code, Izin Lartas & Pengajuan Karantina",
      detail: "Pastikan Sertifikat Karantina/COA aktif (>30 hari) dan izin Lartas tidak terlewat.",
      targetScreen: "compliance",
    },
    {
      id: "h4_stuffing_si",
      dayOffsetFromEtd: -4,
      tag: "H-4 ETD",
      title: "Stuffing Kontainer, Cek Segel & Kirim Shipping Instruction (SI)",
      detail: "Catat nomor kontainer/seal dan kirim instruksi B/L ke forwarder sebelum cutoff SI.",
      targetScreen: "cargo",
    },
    {
      id: "h3_ocr_scrutiny",
      dayOffsetFromEtd: -3,
      tag: "H-3 ETD",
      title: "Validasi Silang (OCR Scrutiny) Draft B/L vs CI & Packing List",
      detail: "Deteksi selisih berat, kuantitas, HS Code, dan consignee sebelum final B/L dikunci.",
      targetScreen: "scrutiny",
    },
    {
      id: "h2_peb_closing",
      dayOffsetFromEtd: -2,
      tag: "Closing PEB (H-2)",
      title: "Submit PEB & Terbitkan NPE Sebelum Closing Time Pelabuhan",
      detail: "Ajukan Pemberitahuan Ekspor Barang via CEISA / PPJK agar kontainer tidak terkena demurrage.",
      targetScreen: "shipment",
    },
    {
      id: "h1_coo_tt_billing",
      dayOffsetFromEtd: -1,
      tag: "H-1 / Gate In",
      title: "Terbitkan e-SKA / COO, Cap Scanned Copy & Penagihan TT",
      detail: "Kirim salinan B/L + dokumen berstempel Scanned Copy ke buyer untuk pelunasan T/T.",
      targetScreen: "documents",
    },
  ];

  const milestones: TimelineMilestone[] = defs.map((def) => {
    const dueDateObj =
      def.id === "h2_peb_closing" && !Number.isNaN(new Date(`${pebClosingDate}T00:00:00`).getTime())
        ? new Date(`${pebClosingDate}T00:00:00`)
        : new Date(
            validEtd.getFullYear(),
            validEtd.getMonth(),
            validEtd.getDate() + def.dayOffsetFromEtd,
          );
    const dueDateIso = toLocalYmd(dueDateObj);
    const daysUntilDue = Math.round((dueDateObj.getTime() - baseDay.getTime()) / 86400000);
    const completed = completedSet.has(def.id);
    const urgency: TimelineMilestone["urgency"] = completed
      ? "completed"
      : daysUntilDue < 0
        ? "overdue"
        : daysUntilDue <= 2
          ? "due_soon"
          : "upcoming";

    return {
      ...def,
      dueDateIso,
      daysUntilDue,
      completed,
      urgency,
    };
  });

  const completedCount = milestones.filter((m) => m.completed).length;
  const completionPercent = Math.round((completedCount / milestones.length) * 100);

  return {
    etdDate,
    pebClosingDate,
    milestones,
    completedCount,
    completionPercent,
  };
}

export interface DemurrageSimulationInput {
  containerCount: number;
  delayedDays: number;
  dailyRateUsd: number;
  exchangeRateIdr: number;
  planId?: "personal" | "growth" | "enterprise";
}

export interface DemurrageSimulationResult {
  totalLossUsd: number;
  totalLossIdr: number;
  subscriptionMonthlyIdr: number;
  netSavingsIdr: number;
  roiMultiple: number;
}

export interface SubscriptionPlanSpec {
  id: "personal" | "growth" | "enterprise";
  name: string;
  tagline: string;
  monthlyPriceIdr: number;
  monthlyDocQuota: number;
  overagePricePerDocIdr: number;
  maxUsers: number;
  features: string[];
  highlighted?: boolean;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlanSpec[] = [
  {
    id: "personal",
    name: "Personal",
    tagline: "Untuk eksportir pemula / perorangan UMKM",
    monthlyPriceIdr: 149000,
    monthlyDocQuota: 15,
    overagePricePerDocIdr: 15000,
    maxUsers: 1,
    features: [
      "Generator 5 Dokumen Inti (PI, SC, CI, PL, SI)",
      "Kalkulator Harga 7 Incoterms & Kubikasi 3D",
      "Verifikator HS Code & Peringatan Lartas Dasar",
      "Ekstra kuota hibrida Rp 15.000 / dokumen tambahan",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    tagline: "Paling populer untuk UMKM ekspor aktif",
    monthlyPriceIdr: 349000,
    monthlyDocQuota: 60,
    overagePricePerDocIdr: 10000,
    maxUsers: 5,
    highlighted: true,
    features: [
      "Semua fitur Personal + Generator Pra-Transaksi",
      "AI OCR Scrutiny B/L + Notifikasi Revisi Otomatis",
      "Timeline Checkpoint H-7 hingga Closing PEB",
      "Arsip Digital Siap Audit DJBC + Mid-Sea Tracking",
      "Ekstra kuota hibrida Rp 10.000 / dokumen tambahan",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Untuk eksportir volume tinggi & tim multi-divisi",
    monthlyPriceIdr: 799000,
    monthlyDocQuota: 250,
    overagePricePerDocIdr: 6000,
    maxUsers: 25,
    features: [
      "Semua fitur Growth dengan kuota 250 dokumen/bulan",
      "Role-Based Access Control (RBAC) & Persetujuan Berlapis",
      "Multi-company Kop Surat & Paket Audit DJBC Lengkap",
      "Ekstra kuota hibrida Rp 6.000 / dokumen tambahan",
    ],
  },
];

export function calculatePlanBilling(
  planId: SubscriptionPlanSpec["id"],
  billingCycle: "monthly" | "annual",
  monthlyDocumentsUsed: number,
): {
  plan: SubscriptionPlanSpec;
  baseMonthlyIdr: number;
  effectiveMonthlyIdr: number;
  annualTotalIdr: number;
  annualDiscountSavedIdr: number;
  extraDocsCount: number;
  overageChargeIdr: number;
  totalEstimatedMonthlyIdr: number;
} {
  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId) ?? SUBSCRIPTION_PLANS[1];
  const baseMonthlyIdr = plan.monthlyPriceIdr;
  const discountRate = billingCycle === "annual" ? 0.1 : 0;
  const effectiveMonthlyIdr = Math.round(baseMonthlyIdr * (1 - discountRate));
  const annualTotalIdr = effectiveMonthlyIdr * 12;
  const annualDiscountSavedIdr = baseMonthlyIdr * 12 - annualTotalIdr;
  const extraDocsCount = Math.max(0, Math.round(monthlyDocumentsUsed) - plan.monthlyDocQuota);
  const overageChargeIdr = extraDocsCount * plan.overagePricePerDocIdr;
  const totalEstimatedMonthlyIdr = effectiveMonthlyIdr + overageChargeIdr;

  return {
    plan,
    baseMonthlyIdr,
    effectiveMonthlyIdr,
    annualTotalIdr,
    annualDiscountSavedIdr,
    extraDocsCount,
    overageChargeIdr,
    totalEstimatedMonthlyIdr,
  };
}

export function calculateDemurrageSimulation(
  input: DemurrageSimulationInput,
): DemurrageSimulationResult {
  const containers = Math.max(1, Number(input.containerCount) || 1);
  const days = Math.max(1, Number(input.delayedDays) || 1);
  const rateUsd = Math.max(10, Number(input.dailyRateUsd) || 120);
  const fx = Math.max(1000, Number(input.exchangeRateIdr) || 16200);

  const totalLossUsd = containers * days * rateUsd;
  const totalLossIdr = Math.round(totalLossUsd * fx);
  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === (input.planId || "growth")) ?? SUBSCRIPTION_PLANS[1];
  const subscriptionMonthlyIdr = plan.monthlyPriceIdr;
  const netSavingsIdr = Math.max(0, totalLossIdr - subscriptionMonthlyIdr);
  const roiMultiple = Number((totalLossIdr / Math.max(1, subscriptionMonthlyIdr)).toFixed(1));

  return {
    totalLossUsd,
    totalLossIdr,
    subscriptionMonthlyIdr,
    netSavingsIdr,
    roiMultiple,
  };
}

export interface Onboarding30DayStep {
  id: string;
  phase: string;
  daysWindow: string;
  title: string;
  detail: string;
  autoCompleted: boolean;
  targetScreen: "products" | "partners" | "pre_transaction" | "pricing" | "compliance" | "documents" | "risk" | "audit_vault";
}

export function buildOnboarding30Days(
  shipment: Shipment,
  counts: { productsCount: number; partnersCount: number },
  manualDoneIds: string[] = [],
): {
  steps: Onboarding30DayStep[];
  completedCount: number;
  totalCount: number;
  progressPercent: number;
} {
  const manualSet = new Set(manualDoneIds);
  const permits = shipment.exportPermits || {};
  const timelineDoneCount = shipment.preShipmentSchedule?.completedIds?.length || 0;

  const rawSteps: Omit<Onboarding30DayStep, "autoCompleted">[] = [
    {
      id: "day1_catalog",
      phase: "Fase 1 · Pondasi Produk",
      daysWindow: "Hari 1–3",
      title: "Setup Katalog Produk & Profil Perusahaan",
      detail: "Lengkapi nama eksportir, kop surat resmi, dan minimal 1 item komoditas di Katalog Produk.",
      targetScreen: "products",
    },
    {
      id: "day4_buyer",
      phase: "Fase 2 · Buyer & Pra-Transaksi",
      daysWindow: "Hari 4–7",
      title: "Siapkan Database Buyer & Surat Penawaran",
      detail: "Catat data buyer tujuan & buat Inquiry/Quotation Letter pada modul Pra-Transaksi.",
      targetScreen: "pre_transaction",
    },
    {
      id: "day8_pricing_hs",
      phase: "Fase 3 · Harga & Regulasi",
      daysWindow: "Hari 8–14",
      title: "Kunci Harga Incoterms & Verifikasi HS / Lartas",
      detail: "Hitung FOB/CIF beserta cek status Lartas & masa berlaku izin karantina/SKA.",
      targetScreen: "compliance",
    },
    {
      id: "day15_docs_container",
      phase: "Fase 4 · Dokumen & Muatan",
      daysWindow: "Hari 15–21",
      title: "Terbitkan 5 Dokumen Inti & Rencana Kontainer",
      detail: "Verifikasi PI, Sales Contract, Commercial Invoice, Packing List, dan Shipping Instruction.",
      targetScreen: "documents",
    },
    {
      id: "day22_h7_audit",
      phase: "Fase 5 · Pengapalan Perdana",
      daysWindow: "Hari 22–30",
      title: "Jalankan Checklist H-7 PEB & Simpan Audit Vault DJBC",
      detail: "Validasi silang B/L, submit PEB tepat waktu, dan kunci arsip audit Bea Cukai.",
      targetScreen: "audit_vault",
    },
  ];

  const autoChecks: Record<string, boolean> = {
    day1_catalog: Boolean(shipment.exporter.trim() && (counts.productsCount > 0 || shipment.product.trim())),
    day4_buyer: Boolean(
      counts.partnersCount > 0 ||
        shipment.buyer.trim() ||
        shipment.preTransactionData?.prospectCompany?.trim(),
    ),
    day8_pricing_hs: Boolean(
      shipment.hsCode.trim() &&
        shipment.unitPrice > 0 &&
        (permits.quarantineNumber || permits.cooNumber || permits.lartasLicenseNumber),
    ),
    day15_docs_container: Boolean(shipment.documentReviewed || (shipment.quantity > 0 && shipment.letterheadText.trim())),
    day22_h7_audit: Boolean(timelineDoneCount >= 2 || (shipment.auditVaultDocs?.length || 0) > 0),
  };

  const steps: Onboarding30DayStep[] = rawSteps.map((s) => ({
    ...s,
    autoCompleted: Boolean(autoChecks[s.id] || manualSet.has(s.id)),
  }));

  const completedCount = steps.filter((s) => s.autoCompleted).length;
  return {
    steps,
    completedCount,
    totalCount: steps.length,
    progressPercent: Math.round((completedCount / steps.length) * 100),
  };
}

export interface AuditVaultItem {
  id: string;
  folder: AuditVaultFolderId;
  title: string;
  reference: string;
  status: "Tersedia" | "Perlu Dilengkapi";
  source: "Sistem Otomatis" | "Lampiran Transaksi" | "Arsip Manual";
  timestamp: string;
}

export function buildAuditVaultSummary(
  shipment: Shipment,
  context: {
    version: number;
    approvalStatus: string;
    dpConfirmed: boolean;
    settlementConfirmed: boolean;
  },
): {
  folders: { id: AuditVaultFolderId; label: string; description: string; items: AuditVaultItem[] }[];
  readyCount: number;
  totalItems: number;
  readinessPercent: number;
} {
  const permits = shipment.exportPermits || {};
  const customDocs = shipment.auditVaultDocs || [];
  const attachments = shipment.attachments || [];
  const nowStr = new Date().toISOString().slice(0, 10);

  const items: AuditVaultItem[] = [
    {
      id: "sys_po",
      folder: "01_pra_transaksi",
      title: "Purchase Order / LOI Buyer & Penawaran Awal",
      reference: shipment.poNumber || "Belum ada No. PO",
      status: shipment.poNumber?.trim() ? "Tersedia" : "Perlu Dilengkapi",
      source: "Sistem Otomatis",
      timestamp: nowStr,
    },
    {
      id: "sys_pi_sc",
      folder: "02_komersial",
      title: "Proforma Invoice (PI) & Sales Contract (SC)",
      reference: `${shipment.reference || "Draft"} · Revisi v${context.version} (${context.approvalStatus})`,
      status: shipment.product.trim() && shipment.buyer.trim() ? "Tersedia" : "Perlu Dilengkapi",
      source: "Sistem Otomatis",
      timestamp: nowStr,
    },
    {
      id: "sys_ci_pl",
      folder: "02_komersial",
      title: "Commercial Invoice (CI) & Packing List (PL)",
      reference: shipment.documentReviewed ? "Terverifikasi" : "Draft Aktif",
      status: shipment.documentReviewed || shipment.quantity > 0 ? "Tersedia" : "Perlu Dilengkapi",
      source: "Sistem Otomatis",
      timestamp: nowStr,
    },
    {
      id: "sys_lartas_karantina",
      folder: "03_kepabeanan_lartas",
      title: "Sertifikat Karantina / Phytosanitary & e-SKA (COO)",
      reference:
        [permits.quarantineNumber, permits.cooNumber].filter(Boolean).join(" / ") ||
        "Belum diinput di Kepatuhan Lartas",
      status: permits.quarantineNumber || permits.cooNumber ? "Tersedia" : "Perlu Dilengkapi",
      source: "Sistem Otomatis",
      timestamp: nowStr,
    },
    {
      id: "sys_peb_npe",
      folder: "03_kepabeanan_lartas",
      title: "Dokumen Kepabeanan PEB & NPE Bea Cukai (DJBC)",
      reference: permits.lartasLicenseNumber || `HS ${shipment.hsCode || "Belum terisi"}`,
      status:
        permits.lartasLicenseNumber || customDocs.some((d) => d.folder === "03_kepabeanan_lartas")
          ? "Tersedia"
          : "Perlu Dilengkapi",
      source: "Sistem Otomatis",
      timestamp: nowStr,
    },
    {
      id: "sys_bl_si",
      folder: "04_logistik_bl",
      title: "Shipping Instruction (SI) & Draft/Final Bill of Lading (B/L)",
      reference:
        [shipment.blNumber, shipment.bookingNumber, shipment.containerNumber]
          .filter(Boolean)
          .join(" · ") || "Belum ada nomor B/L / Booking",
      status: shipment.blNumber?.trim() && shipment.containerNumber?.trim() ? "Tersedia" : "Perlu Dilengkapi",
      source: "Sistem Otomatis",
      timestamp: nowStr,
    },
    {
      id: "sys_payment_tt",
      folder: "05_pembayaran_tt",
      title: "Rekening Bank & Bukti Penerimaan DP / Pelunasan T/T",
      reference: `DP: ${context.dpConfirmed ? "Diterima" : "Menunggu"} | Pelunasan: ${
        context.settlementConfirmed ? "Lunas" : "Menunggu"
      }`,
      status: context.dpConfirmed || context.settlementConfirmed ? "Tersedia" : "Perlu Dilengkapi",
      source: "Sistem Otomatis",
      timestamp: nowStr,
    },
  ];

  // Kelompokkan lampiran filename dari shipment.attachments ke folder relevan
  attachments.forEach((fileName, idx) => {
    const lower = fileName.toLowerCase();
    let folder: AuditVaultFolderId = "01_pra_transaksi";
    if (/peb|npe|lartas|karantina|phyto|ska|coo|svlk/.test(lower)) {
      folder = "03_kepabeanan_lartas";
    } else if (/bl|b\/l|bill|container|seal|si|stuffing/.test(lower)) {
      folder = "04_logistik_bl";
    } else if (/tt|swift|bank|transfer|bukti|bayar|payment/.test(lower)) {
      folder = "05_pembayaran_tt";
    } else if (/invoice|packing|contract|pi|ci|pl|sc/.test(lower)) {
      folder = "02_komersial";
    }
    items.push({
      id: `att_${idx}_${fileName}`,
      folder,
      title: fileName,
      reference: "File Lampiran Transaksi",
      status: "Tersedia",
      source: "Lampiran Transaksi",
      timestamp: nowStr,
    });
  });

  customDocs.forEach((doc) => {
    items.push({
      id: doc.id,
      folder: doc.folder,
      title: doc.title,
      reference: doc.docNumber || "Tercatat di Vault",
      status: "Tersedia",
      source: "Arsip Manual",
      timestamp: doc.addedAt,
    });
  });

  const folderMeta: { id: AuditVaultFolderId; label: string; description: string }[] = [
    {
      id: "01_pra_transaksi",
      label: "01 · Pra-Transaksi & PO Buyer",
      description: "Purchase Order, LOI, korespondensi email, & penawaran awal.",
    },
    {
      id: "02_komersial",
      label: "02 · Dokumen Komersial & Riwayat Revisi",
      description: "Proforma Invoice, Sales Contract, Commercial Invoice, Packing List & log revisi.",
    },
    {
      id: "03_kepabeanan_lartas",
      label: "03 · Kepabeanan (PEB, NPE, Karantina & SKA)",
      description: "Dokumen ekspor DJBC, e-SKA/COO, Karantina, dan izin Lartas.",
    },
    {
      id: "04_logistik_bl",
      label: "04 · Logistik, B/L & Kontainer",
      description: "Shipping Instruction, Draft/Final B/L, bukti segel & container manifest.",
    },
    {
      id: "05_pembayaran_tt",
      label: "05 · Pembayaran T/T & Rekonsiliasi Bank",
      description: "Bukti transfer uang muka (DP), pelunasan TT, dan konfirmasi kas masuk.",
    },
  ];

  const folders = folderMeta.map((f) => ({
    ...f,
    items: items.filter((item) => item.folder === f.id),
  }));

  const readyCount = items.filter((i) => i.status === "Tersedia").length;
  const totalItems = items.length;
  const readinessPercent = totalItems > 0 ? Math.round((readyCount / totalItems) * 100) : 0;

  return { folders, readyCount, totalItems, readinessPercent };
}
