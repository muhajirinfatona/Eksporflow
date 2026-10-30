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
  defaultAmountIdr: number;
};

export const COUNTRY_REGULATION_PRESETS: CountryRegulationPreset[] = [
  // Regulasi Karantina & Sanitari
  {
    id: "reg-phyto",
    name: "Phytosanitary Certificate (Karantina Pertanian)",
    targetCountry: "Semua Negara (Wajib Hasil Bumi/Rempah)",
    category: "logistics",
    field: "customs",
    description: "Pemeriksaan resmi Badan Karantina Indonesia untuk komoditas rempah, biji kopi, kelapa, dan tanaman.",
    defaultAmountIdr: 450000,
  },
  {
    id: "reg-fumigation",
    name: "Fumigasi Standar ISPM-15 & Sertifikat Fumigasi",
    targetCountry: "Uni Eropa, AS, Australia, Jepang",
    category: "logistics",
    field: "customs",
    description: "Perlakuan fumigasi metil bromida / heat treatment pada pallet kayu & kontainer bebas hama rayap.",
    defaultAmountIdr: 1350000,
  },
  {
    id: "reg-lab-test",
    name: "Uji Laboratorium Residu Pestisida & Aflatoksin (COA)",
    targetCountry: "Jepang & Uni Eropa",
    category: "goods",
    field: "packaging",
    description: "Pengujian lab independen (SGS / Intertek) memenuhi batas maksimum residu (MRL) negara tujuan.",
    defaultAmountIdr: 3500000,
  },
  {
    id: "reg-halal",
    name: "Sertifikasi Halal Internasional (BPJPH / ESMA / SFDA)",
    targetCountry: "UAE, Arab Saudi & Timur Tengah",
    category: "logistics",
    field: "customs",
    description: "Sertifikat halal resmi yang diakui otoritas Timur Tengah untuk produk pangan & turunan.",
    defaultAmountIdr: 2500000,
  },
  {
    id: "reg-coo",
    name: "Certificate of Origin / SKA (Form D / E / AK / IJEPA)",
    targetCountry: "Negara Mitra FTA Indonesia",
    category: "logistics",
    field: "customs",
    description: "Surat Keterangan Asal dari Kemendag agar buyer mendapatkan pembebasan bea masuk (0%).",
    defaultAmountIdr: 350000,
  },
  {
    id: "reg-fda",
    name: "Registrasi Fasilitas US FDA & Prior Notice",
    targetCountry: "Amerika Serikat (USA)",
    category: "logistics",
    field: "customs",
    description: "Pendaftaran nomor fasilitas pabrik pangan ke Food and Drug Administration AS.",
    defaultAmountIdr: 2200000,
  },
  {
    id: "reg-embassy",
    name: "Legalisasi Kedutaan & Kamar Dagang (Embassy Attestation)",
    targetCountry: "Timur Tengah & Afrika",
    category: "logistics",
    field: "customs",
    description: "Stempel legalisasi invoice dan packing list oleh kedutaan besar negara buyer.",
    defaultAmountIdr: 1800000,
  },
  {
    id: "reg-packaging-special",
    name: "Packaging Ekspor Khusus (Vacuum / Foil Food Grade)",
    targetCountry: "Negara Jarak Jauh (Ocean 30+ Hari)",
    category: "goods",
    field: "packaging",
    description: "Kantung barrier kedap udara dan silica gel desiccant kontainer pencegah jamur muatan.",
    defaultAmountIdr: 1500000,
  },
  {
    id: "reg-contingency-buffer",
    name: "Buffer Risiko Fluktuasi Logistik & Regulasi Lokal",
    targetCountry: "Semua Negara",
    category: "strategy",
    field: "contingency",
    description: "Cadangan proteksi margin mengantisipasi kenaikan bunker fuel surcharge atau demurrage pelabuhan.",
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
