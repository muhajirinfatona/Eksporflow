import type { Incoterm } from "./shipment";

export type CostFactorItem = {
  id: string;
  name: string;
  category: "goods" | "logistics" | "strategy";
  field: "packaging" | "inlandTransport" | "originHandling" | "customs" | "freight" | "insurance" | "destinationHandling" | "importDuty" | "lastMile" | "contingency" | "margin";
  description: string;
  amountIdr: number; // default baseline dalam IDR
  isMandatoryForIncoterm?: boolean;
};

export type IncotermTemplate = {
  term: Incoterm;
  name: string;
  description: string;
  sellerResponsibility: string[];
  buyerResponsibility: string[];
  defaultCostsIdr: {
    packaging: number;
    inlandTransport: number;
    originHandling: number;
    customs: number;
    freight: number;
    insurance: number;
    destinationHandling: number;
    importDuty: number;
    lastMile: number;
  };
  recommendedContingency: number; // %
};

export const INCOTERM_TEMPLATES: Record<Incoterm, IncotermTemplate> = {
  EXW: {
    term: "EXW",
    name: "Ex Works (Gudang Penjual)",
    description: "Penjual hanya menyerahkan barang di gudang/pabrik. Seluruh biaya pengangkutan, customs ekspor, freight, asuransi, dan impor ditanggung buyer.",
    sellerResponsibility: ["Produksi barang", "Pengemasan dasar ekspor (Packaging)"],
    buyerResponsibility: ["Pick up gudang", "Trucking origin", "Customs ekspor Indonesia", "Ocean freight", "Asuransi", "Customs impor", "Last mile"],
    defaultCostsIdr: {
      packaging: 750000,
      inlandTransport: 0,
      originHandling: 0,
      customs: 0,
      freight: 0,
      insurance: 0,
      destinationHandling: 0,
      importDuty: 0,
      lastMile: 0,
    },
    recommendedContingency: 2,
  },
  FCA: {
    term: "FCA",
    name: "Free Carrier (Titik Penyerahan Origin)",
    description: "Penjual mengantar barang dan menyelesaikan kepabeanan ekspor (PEB) ke titik carrier yang ditunjuk buyer di Indonesia.",
    sellerResponsibility: ["Packaging ekspor", "Inland transport ke carrier depot", "Customs clearance ekspor (PEB)"],
    buyerResponsibility: ["Loading ke kapal utama", "Ocean freight", "Asuransi", "Customs impor", "Last mile"],
    defaultCostsIdr: {
      packaging: 1000000,
      inlandTransport: 1500000,
      originHandling: 0,
      customs: 900000,
      freight: 0,
      insurance: 0,
      destinationHandling: 0,
      importDuty: 0,
      lastMile: 0,
    },
    recommendedContingency: 3,
  },
  FOB: {
    term: "FOB",
    name: "Free On Board (Pelabuhan Muat Asal)",
    description: "Penjual menanggung seluruh biaya sampai barang dimuat ke atas kapal di pelabuhan muat Indonesia (POL Tanjung Priok/Perak/Belawan).",
    sellerResponsibility: ["Packaging ekspor", "Inland trucking ke pelabuhan", "Origin Terminal Handling (THC POL)", "Customs clearance PEB & COO"],
    buyerResponsibility: ["Ocean freight internasional", "Asuransi cargo", "Bongkar di pelabuhan tujuan", "Customs impor", "Last mile"],
    defaultCostsIdr: {
      packaging: 1200000,
      inlandTransport: 2500000,
      originHandling: 1800000,
      customs: 1250000,
      freight: 0,
      insurance: 0,
      destinationHandling: 0,
      importDuty: 0,
      lastMile: 0,
    },
    recommendedContingency: 4,
  },
  CFR: {
    term: "CFR",
    name: "Cost and Freight (Pelabuhan Bongkar Tujuan)",
    description: "Penjual menanggung biaya sampai pelabuhan tujuan (POD), termasuk ocean freight internasional.",
    sellerResponsibility: ["Komponen FOB", "Ocean freight kapal / Air freight internasional"],
    buyerResponsibility: ["Asuransi pengangkutan", "Bongkar di pelabuhan tujuan (THC POD)", "Customs impor", "Last mile"],
    defaultCostsIdr: {
      packaging: 1200000,
      inlandTransport: 2500000,
      originHandling: 1800000,
      customs: 1250000,
      freight: 18500000,
      insurance: 0,
      destinationHandling: 0,
      importDuty: 0,
      lastMile: 0,
    },
    recommendedContingency: 5,
  },
  CIF: {
    term: "CIF",
    name: "Cost, Insurance & Freight (Pelabuhan Bongkar Tujuan)",
    description: "Penjual menanggung biaya CFR ditambah premi asuransi pengangkutan laut (Marine Cargo Insurance).",
    sellerResponsibility: ["Komponen FOB", "Ocean freight internasional", "Asuransi pengangkutan kapal (Marine Cargo)"],
    buyerResponsibility: ["Bongkar pelabuhan tujuan (THC POD)", "Customs impor negara buyer", "Last mile ke gudang"],
    defaultCostsIdr: {
      packaging: 1200000,
      inlandTransport: 2500000,
      originHandling: 1800000,
      customs: 1250000,
      freight: 18500000,
      insurance: 1600000,
      destinationHandling: 0,
      importDuty: 0,
      lastMile: 0,
    },
    recommendedContingency: 5,
  },
  DAP: {
    term: "DAP",
    name: "Delivered at Place (Alamat / Gudang Buyer)",
    description: "Penjual menanggung seluruh biaya logistik sampai tiba di alamat gudang buyer di negara tujuan (sebelum pembayaran bea impor).",
    sellerResponsibility: ["Komponen CIF", "Bongkar di pelabuhan tujuan (THC POD)", "Trucking last-mile antar ke gudang buyer"],
    buyerResponsibility: ["Pembayaran Bea Masuk (Import Duty) & Pajak Impor negara tujuan"],
    defaultCostsIdr: {
      packaging: 1500000,
      inlandTransport: 2500000,
      originHandling: 1800000,
      customs: 1250000,
      freight: 19500000,
      insurance: 1800000,
      destinationHandling: 4500000,
      importDuty: 0,
      lastMile: 5500000,
    },
    recommendedContingency: 6,
  },
  DDP: {
    term: "DDP",
    name: "Delivered Duty Paid (Pintu ke Pintu Termasuk Pajak Impor)",
    description: "Penjual menanggung seluruh biaya maksimal: logistik pintu ke pintu, izin impor, bea masuk (duty), dan pajak negara tujuan.",
    sellerResponsibility: ["Komponen DAP", "Pembayaran Bea Masuk Impor (Import Duty)", "Pajak impor / PPN negara tujuan"],
    buyerResponsibility: ["Menerima barang di gudang"],
    defaultCostsIdr: {
      packaging: 1500000,
      inlandTransport: 2500000,
      originHandling: 1800000,
      customs: 1250000,
      freight: 19500000,
      insurance: 1800000,
      destinationHandling: 4500000,
      importDuty: 8500000,
      lastMile: 5500000,
    },
    recommendedContingency: 8,
  },
};

export type CountryRegulationPreset = {
  id: string;
  name: string;
  targetCountry: string;
  category: "goods" | "logistics" | "strategy";
  field: "packaging" | "customs" | "insurance" | "contingency";
  description: string;
  issuingAuthority: string;
  preparationTip: string;
  defaultAmountIdr: number;
};

export const COUNTRY_REGULATION_PRESETS: CountryRegulationPreset[] = [
  // Regulasi Karantina & Sanitari
  {
    id: "reg-phyto",
    name: "Phytosanitary Certificate",
    targetCountry: "Semua Negara (Wajib Hasil Bumi/Rempah)",
    category: "logistics",
    field: "customs",
    description: "Pemeriksaan resmi karantina agar komoditas bebas hama dan penyakit tanaman.",
    issuingAuthority: "Barantan",
    preparationTip: "Ajukan pemeriksaan karantina (PPK Online Barantan) sebelum stuffing kontainer.",
    defaultAmountIdr: 450000,
  },
  {
    id: "reg-fumigation",
    name: "Sertifikat Fumigasi (ISPM-15)",
    targetCountry: "Uni Eropa, AS, Australia, Jepang",
    category: "logistics",
    field: "customs",
    description: "Fumigasi muatan dan pallet kayu kemasan agar steril dan bebas serangga.",
    issuingAuthority: "Fumigator AFASID",
    preparationTip: "Pastikan pallet berstempel ISPM-15 dan sertifikat terbit sebelum kapal berlayar.",
    defaultAmountIdr: 1350000,
  },
  {
    id: "reg-lab-test",
    name: "Uji Lab Mutu & Residu (COA)",
    targetCountry: "Jepang & Uni Eropa",
    category: "goods",
    field: "packaging",
    description: "Pengujian mutu dan batas aman residu/pestisida sesuai regulasi negara buyer.",
    issuingAuthority: "Lab Sucofindo / SGS",
    preparationTip: "Kirim sampel uji dari lot produksi ke lab 1-2 minggu sebelum pengapalan.",
    defaultAmountIdr: 3500000,
  },
  {
    id: "reg-halal",
    name: "Sertifikat Halal Ekspor",
    targetCountry: "UAE, Arab Saudi & Timur Tengah",
    category: "logistics",
    field: "customs",
    description: "Sertifikasi halal resmi untuk kelancaran izin masuk produk pangan & konsumsi.",
    issuingAuthority: "BPJPH Kemenag",
    preparationTip: "Lampirkan salinan sertifikat halal aktif pada berkas perkapalan.",
    defaultAmountIdr: 2500000,
  },
  {
    id: "reg-coo",
    name: "Surat Keterangan Asal (SKA / COO)",
    targetCountry: "Negara Mitra FTA Indonesia",
    category: "logistics",
    field: "customs",
    description: "Bukti asal barang untuk fasilitas pembebasan bea masuk bagi buyer (Form FTA).",
    issuingAuthority: "Kemendag e-SKA",
    preparationTip: "Siapkan draft PEB, B/L, dan Final Invoice-Packing List untuk diajukan di e-SKA.",
    defaultAmountIdr: 350000,
  },
  {
    id: "reg-fda",
    name: "Registrasi Fasilitas US FDA",
    targetCountry: "Amerika Serikat (USA)",
    category: "logistics",
    field: "customs",
    description: "Pendaftaran Food Facility Registration (FFR) dan nomor Prior Notice muatan.",
    issuingAuthority: "U.S. FDA",
    preparationTip: "Konfirmasikan nomor FFR dan Prior Notice ke pihak shipping line / forwarder.",
    defaultAmountIdr: 2200000,
  },
  {
    id: "reg-embassy",
    name: "Legalisasi Dokumen Kedutaan",
    targetCountry: "Timur Tengah & Afrika",
    category: "logistics",
    field: "customs",
    description: "Pengesahan dokumen ekspor resmi oleh KADIN dan kedutaan besar negara buyer.",
    issuingAuthority: "KADIN & Kedubes",
    preparationTip: "Alokasikan waktu 3-7 hari kerja untuk proses legalisasi sebelum pengiriman.",
    defaultAmountIdr: 1800000,
  },
  {
    id: "reg-packaging-special",
    name: "Kemasan Barrier Ekspor",
    targetCountry: "Negara Jarak Jauh (Ocean 30+ Hari)",
    category: "goods",
    field: "packaging",
    description: "Inner liner dan container desiccant pencegah kelembapan saat transit laut jarak jauh.",
    issuingAuthority: "Standar Ekspor",
    preparationTip: "Gunakan kemasan food-grade dan pasang dry bag secukupnya di dalam kontainer.",
    defaultAmountIdr: 1500000,
  },
  {
    id: "reg-contingency-buffer",
    name: "Inspeksi Surveyor Independen",
    targetCountry: "Semua Negara",
    category: "strategy",
    field: "contingency",
    description: "Pemeriksaan kuantitas dan mutu sebelum pemuatan (pre-shipment inspection).",
    issuingAuthority: "Surveyor Independen",
    preparationTip: "Minta Certificate of Inspection (COI) jika disyaratkan dalam kontrak atau L/C.",
    defaultAmountIdr: 0,
  },
];

/**
 * Konversi biaya template IDR ke mata uang transaksi aktif.
 */
export function convertTemplateCost(amountIdr: number, targetCurrency: string, exchangeRate: number): number {
  if (targetCurrency === "IDR") return amountIdr;
  const rate = exchangeRate > 0 ? exchangeRate : 18274;
  return Number((amountIdr / rate).toFixed(2));
}


/**
 * AI Advisor Engine: Membaca negara buyer dan komoditas secara otomatis,
 * lalu merekomendasikan regulasi kepatuhan ekspor yang relevan.
 */
export function getAiRecommendedRegulations(countryName?: string, product?: string): CountryRegulationPreset[] {
  if (!countryName || !countryName.trim()) {
    return [
      COUNTRY_REGULATION_PRESETS.find((p) => p.id === "reg-phyto")!,
      COUNTRY_REGULATION_PRESETS.find((p) => p.id === "reg-fumigation")!,
      COUNTRY_REGULATION_PRESETS.find((p) => p.id === "reg-coo")!,
    ].filter(Boolean);
  }

  const c = countryName.toLowerCase().trim();
  const matched: CountryRegulationPreset[] = [];

  // 1. Swedia, Jerman, Belanda, Uni Eropa
  if (c.includes("swedia") || c.includes("sweden") || c.includes("eropa") || c.includes("jerman") || c.includes("germany") || c.includes("belanda") || c.includes("netherlands") || c.includes("prancis") || c.includes("france") || c.includes("italia") || c.includes("spanyol") || c.includes("poland") || c.includes("eu")) {
    matched.push(
      COUNTRY_REGULATION_PRESETS.find((p) => p.id === "reg-fumigation")!,
      COUNTRY_REGULATION_PRESETS.find((p) => p.id === "reg-lab-test")!,
      COUNTRY_REGULATION_PRESETS.find((p) => p.id === "reg-coo")!,
      COUNTRY_REGULATION_PRESETS.find((p) => p.id === "reg-packaging-special")!,
    );
  }
  // 2. Jepang
  else if (c.includes("jepang") || c.includes("japan") || c.includes("tokyo")) {
    matched.push(
      COUNTRY_REGULATION_PRESETS.find((p) => p.id === "reg-lab-test")!,
      COUNTRY_REGULATION_PRESETS.find((p) => p.id === "reg-fumigation")!,
      COUNTRY_REGULATION_PRESETS.find((p) => p.id === "reg-coo")!,
      COUNTRY_REGULATION_PRESETS.find((p) => p.id === "reg-phyto")!,
    );
  }
  // 3. Amerika Serikat / USA / Kanada
  else if (c.includes("amerika") || c.includes("usa") || c.includes("united states") || c.includes("kanada") || c.includes("canada")) {
    matched.push(
      COUNTRY_REGULATION_PRESETS.find((p) => p.id === "reg-fda")!,
      COUNTRY_REGULATION_PRESETS.find((p) => p.id === "reg-fumigation")!,
      COUNTRY_REGULATION_PRESETS.find((p) => p.id === "reg-lab-test")!,
      COUNTRY_REGULATION_PRESETS.find((p) => p.id === "reg-packaging-special")!,
    );
  }
  // 4. UAE, Arab Saudi, Qatar, Kuwait, Timur Tengah
  else if (c.includes("saudi") || c.includes("emirat") || c.includes("dubai") || c.includes("uae") || c.includes("qatar") || c.includes("kuwait") || c.includes("timur tengah") || c.includes("middle east")) {
    matched.push(
      COUNTRY_REGULATION_PRESETS.find((p) => p.id === "reg-halal")!,
      COUNTRY_REGULATION_PRESETS.find((p) => p.id === "reg-embassy")!,
      COUNTRY_REGULATION_PRESETS.find((p) => p.id === "reg-coo")!,
      COUNTRY_REGULATION_PRESETS.find((p) => p.id === "reg-phyto")!,
    );
  }
  // 5. Australia & New Zealand
  else if (c.includes("australia") || c.includes("selandia") || c.includes("zealand")) {
    matched.push(
      COUNTRY_REGULATION_PRESETS.find((p) => p.id === "reg-fumigation")!,
      COUNTRY_REGULATION_PRESETS.find((p) => p.id === "reg-phyto")!,
      COUNTRY_REGULATION_PRESETS.find((p) => p.id === "reg-coo")!,
    );
  }
  // 6. General fallback
  else {
    matched.push(
      COUNTRY_REGULATION_PRESETS.find((p) => p.id === "reg-phyto")!,
      COUNTRY_REGULATION_PRESETS.find((p) => p.id === "reg-fumigation")!,
      COUNTRY_REGULATION_PRESETS.find((p) => p.id === "reg-coo")!,
    );
  }

  return matched.filter(Boolean);
}
