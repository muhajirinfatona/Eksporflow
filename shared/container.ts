import type { ContainerCalc, LineItem, Shipment } from "./shipment";

export const containerSpecs = {
  "20GP": { name: "20' General Purpose", innerL: 589, innerW: 235, innerH: 239, volume: 33.2, weight: 28200 },
  "40GP": { name: "40' General Purpose", innerL: 1203, innerW: 235, innerH: 239, volume: 67.7, weight: 26600 },
  "40HC": { name: "40' High Cube", innerL: 1203, innerW: 235, innerH: 269, volume: 76.4, weight: 26600 },
} as const;

export type ContainerType = keyof typeof containerSpecs;

export interface PackagingPreset {
  id: string;
  name: string;
  uncefactCode: string; // e.g. "CT", "SA", "DR", "11A", "CR", "PK"
  uncefactName: string;
  category: "box" | "sack" | "drum" | "ibc" | "crate" | "custom";
  length: number; // cm
  width: number; // cm
  height: number; // cm
  tareWeight: number; // kg
  recommendedMaxPayloadKg?: number;
  description: string;
}

export interface PalletPreset {
  id: string;
  name: string;
  uncefactCode: string; // "PX"
  length: number; // cm
  width: number; // cm
  height: number; // cm
  tareWeight: number; // kg
  maxDynamicLoadKg: number;
  standard: "ISO" | "EPAL" | "JIS/Asia" | "Custom";
  description: string;
}

export const PACKAGING_PRESETS: PackagingPreset[] = [
  {
    id: "carton-master-std",
    name: "Karton Box (Master Carton Standar)",
    uncefactCode: "CT",
    uncefactName: "Carton",
    category: "box",
    length: 40,
    width: 30,
    height: 25,
    tareWeight: 0.5,
    recommendedMaxPayloadKg: 20,
    description: "Karton gelombang 5-ply standar ekspor pangan kering, rempah, dan manufaktur.",
  },
  {
    id: "sack-woven-25kg",
    name: "Karung 25kg (Gula Kelapa, Rempah, Tapioka)",
    uncefactCode: "SA",
    uncefactName: "Sack",
    category: "sack",
    length: 75,
    width: 45,
    height: 18,
    tareWeight: 0.15,
    recommendedMaxPayloadKg: 25,
    description: "Karung PP woven / multiwall kraft paper standar 25kg untuk gula kelapa, tapioka, lada, dan rempah.",
  },
  {
    id: "sack-woven-50kg",
    name: "Karung 50kg (Rempah, Pangan & Agro Bulk)",
    uncefactCode: "SA",
    uncefactName: "Sack",
    category: "sack",
    length: 90,
    width: 60,
    height: 22,
    tareWeight: 0.25,
    recommendedMaxPayloadKg: 50,
    description: "Karung PP anyaman standar 50kg untuk rempah curah, jagung, beras organik, arang, dan tepung agro.",
  },
  {
    id: "sack-jute-60kg",
    name: "Karung Goni 60kg (Kopi & Kakao ICO/ICCO)",
    uncefactCode: "SA",
    uncefactName: "Sack",
    category: "sack",
    length: 90,
    width: 65,
    height: 24,
    tareWeight: 0.8,
    recommendedMaxPayloadKg: 60,
    description: "Karung goni (jute bag) standar internasional ICO & ICCO untuk biji kopi hijau, kakao, dan kacang mete.",
  },
  {
    id: "drum-steel-200l",
    name: "Drum Baja 200L (Steel Drum ISO)",
    uncefactCode: "DR",
    uncefactName: "Drum, steel",
    category: "drum",
    length: 58.5,
    width: 58.5,
    height: 88,
    tareWeight: 17.5,
    recommendedMaxPayloadKg: 220,
    description: "Drum baja standar 55 gallon UN-certified untuk minyak atsiri, liquid chemical, & oleo.",
  },
  {
    id: "drum-hdpe-200l",
    name: "Drum Plastik HDPE 200L (Tight Head)",
    uncefactCode: "DR",
    uncefactName: "Drum, plastic",
    category: "drum",
    length: 59,
    width: 59,
    height: 93,
    tareWeight: 9.0,
    recommendedMaxPayloadKg: 215,
    description: "Drum polietilena kerapatan tinggi anti-korosi untuk cairan pangan (madu, sari kelapa).",
  },
  {
    id: "ibc-tank-1000l",
    name: "IBC Tank 1.000L (Intermediate Bulk Container)",
    uncefactCode: "11A",
    uncefactName: "Composite IBC for liquids",
    category: "ibc",
    length: 120,
    width: 100,
    height: 116,
    tareWeight: 58.0,
    recommendedMaxPayloadKg: 1200,
    description: "Tangki IBC kerangka baja terpadu untuk pengapalan cairan curah industri efisien.",
  },
  {
    id: "crate-wooden-ispm15",
    name: "Crate Kayu ISPM-15 (Peti Ekspor)",
    uncefactCode: "CR",
    uncefactName: "Crate, wooden",
    category: "crate",
    length: 80,
    width: 60,
    height: 60,
    tareWeight: 14.0,
    recommendedMaxPayloadKg: 150,
    description: "Peti kayu lapis tahan banting berstempel fumigasi IPPC/ISPM-15 untuk kerajinan & mesin.",
  },
  {
    id: "custom-package",
    name: "Kemasan Kustom (Ukuran Bebas)",
    uncefactCode: "PK",
    uncefactName: "Package",
    category: "custom",
    length: 0,
    width: 0,
    height: 0,
    tareWeight: 0,
    recommendedMaxPayloadKg: 0,
    description: "Dimensi dan bobot disesuaikan manual dengan spesifikasi unik eksportir.",
  },
];

export const PALLET_PRESETS: PalletPreset[] = [
  {
    id: "pallet-iso-120x100",
    name: "Pallet ISO Standar (120 x 100 cm)",
    uncefactCode: "PX",
    length: 120,
    width: 100,
    height: 15,
    tareWeight: 22,
    maxDynamicLoadKg: 1500,
    standard: "ISO",
    description: "Pallet standar internasional dominan untuk kontainer ekspor laut ke Amerika & Asia.",
  },
  {
    id: "pallet-epal-120x80",
    name: "Euro Pallet EPAL 1 (120 x 80 cm)",
    uncefactCode: "PX",
    length: 120,
    width: 80,
    height: 14.4,
    tareWeight: 20,
    maxDynamicLoadKg: 1500,
    standard: "EPAL",
    description: "Pallet resmi standar Eropa (EPAL), wajib untuk rantai pasok ritel Uni Eropa.",
  },
  {
    id: "pallet-asia-110x110",
    name: "Pallet Standar Asia / JIS (110 x 110 cm)",
    uncefactCode: "PX",
    length: 110,
    width: 110,
    height: 15,
    tareWeight: 19,
    maxDynamicLoadKg: 1400,
    standard: "JIS/Asia",
    description: "Pallet bujur sangkar optimal untuk rute Jepang, Korea Selatan, dan ASEAN.",
  },
];

/**
 * Memetakan jenis kemasan (nama string bebas) ke kode resmi UN/CEFACT Recommendation 21.
 */
export function resolveUncefactCode(packagingType?: string): string {
  if (!packagingType) return "CT";
  const lower = packagingType.toLowerCase().trim();
  if (lower.includes("drum")) return "DR";
  if (lower.includes("sack") || lower.includes("karung") || lower.includes("goni") || lower.includes("bag")) return "SA";
  if (lower.includes("ibc") || lower.includes("tank")) return "11A";
  if (lower.includes("crate") || lower.includes("peti")) return "CR";
  if (lower.includes("pallet")) return "PX";
  if (lower.includes("carton") || lower.includes("karton") || lower.includes("box") || lower.includes("dus")) return "CT";
  if (lower.includes("can") || lower.includes("jerrican") || lower.includes("derigen") || lower.includes("jeriken")) return "JY";
  if (lower.includes("bale")) return "BL";
  return "PK";
}

export function getPackagingPreset(id: string): PackagingPreset | undefined {
  return PACKAGING_PRESETS.find((p) => p.id === id);
}

export function getPalletPreset(id: string): PalletPreset | undefined {
  return PALLET_PRESETS.find((p) => p.id === id);
}

export type ContainerInput = Pick<Shipment, "containerType" | "cartonLength" | "cartonWidth" | "cartonHeight" | "cartonWeight" | "cartonQty"> & {
  lineItems: LineItem[];
};

/**
 * Estimasi muatan: volume produk/pallet, berat net/gross/pallet, dan jumlah kontainer.
 * Shrinkage hanya mengurangi net weight; gross weight tidak berkurang.
 * Hasil adalah estimasi komersial berstandar industri maritim.
 */
export function calculateContainer(input: ContainerInput): ContainerCalc {
  const spec = containerSpecs[input.containerType];
  const itemStats = input.lineItems.reduce(
    (stats, item) => {
      const shrinkage = Math.min(100, Math.max(0, item.shrinkageRate || 0)) / 100;
      const productVolume = ((item.length * item.width * item.height) / 1_000_000) * item.quantity;
      const palletVolume = item.palletEnabled ? ((item.palletLength * item.palletWidth * item.palletHeight) / 1_000_000) * item.palletCount : 0;
      const productWeight = item.weight * item.quantity;
      const palletWeight = item.palletEnabled ? item.palletWeight * item.palletCount : 0;
      return {
        volume: stats.volume + productVolume + palletVolume,
        weight: stats.weight + productWeight + palletWeight,
        netWeight: stats.netWeight + productWeight * (1 - shrinkage),
        grossWeight: stats.grossWeight + productWeight + palletWeight,
        productVolume: stats.productVolume + productVolume,
        palletVolume: stats.palletVolume + palletVolume,
        palletWeight: stats.palletWeight + palletWeight,
        palletCount: stats.palletCount + (item.palletEnabled ? item.palletCount : 0),
        shrinkageLoss: stats.shrinkageLoss + productWeight * shrinkage,
      };
    },
    { volume: 0, weight: 0, netWeight: 0, grossWeight: 0, productVolume: 0, palletVolume: 0, palletWeight: 0, palletCount: 0, shrinkageLoss: 0 },
  );

  const legacyVolume = ((input.cartonLength * input.cartonWidth * input.cartonHeight) / 1_000_000) * input.cartonQty;
  const totalVolume = itemStats.volume || legacyVolume;
  const totalWeight = itemStats.grossWeight || input.cartonWeight * input.cartonQty;
  const cartonVolume = input.lineItems.length
    ? totalVolume / Math.max(1, input.lineItems.reduce((sum, item) => sum + item.quantity, 0))
    : totalVolume / Math.max(1, input.cartonQty);
  const byVolume = spec.volume ? Math.ceil(totalVolume / spec.volume) : 0;
  const byWeight = spec.weight ? Math.ceil(totalWeight / spec.weight) : 0;
  const containers = Math.max(1, byVolume, byWeight);
  const volumeUtilization = (totalVolume / (containers * spec.volume)) * 100;
  const weightUtilization = (totalWeight / (containers * spec.weight)) * 100;

  const firstItem = input.lineItems[0];
  const primaryPackagingType = firstItem?.packagingType || "Karton box";
  const primaryUncefactCode = resolveUncefactCode(primaryPackagingType);
  const maxAllowedWeight = containers * spec.weight;
  const isPayloadOverweight = totalWeight > maxAllowedWeight;
  const maxPayloadRemainingKg = Math.max(0, maxAllowedWeight - totalWeight);
  const palletStandard = firstItem?.palletEnabled ? (firstItem.palletLength === 120 && firstItem.palletWidth === 80 ? "EPAL" : "ISO") : undefined;

  return {
    ...spec,
    cartonVolume,
    totalVolume,
    totalWeight,
    netWeight: input.lineItems.length ? itemStats.netWeight : totalWeight,
    grossWeight: totalWeight,
    productVolume: itemStats.productVolume || totalVolume,
    palletVolume: itemStats.palletVolume,
    palletWeight: itemStats.palletWeight,
    byVolume,
    byWeight,
    containers,
    volumeUtilization,
    weightUtilization,
    packagingVolume: itemStats.palletVolume,
    palletCount: itemStats.palletCount,
    shrinkageLoss: itemStats.shrinkageLoss,
    primaryPackagingType,
    primaryUncefactCode,
    palletStandard,
    isPayloadOverweight,
    maxPayloadRemainingKg,
  };
}

/**
 * Menghitung efisiensi stuffing volumetrik & kapasitas maksimal teoritis kontainer
 * untuk satu jenis kemasan.
 */
export function calculateStuffingOptimizationMatrix(
  containerType: ContainerType,
  item: { length: number; width: number; height: number; weight: number },
) {
  const spec = containerSpecs[containerType];
  if (!item.length || !item.width || !item.height) {
    return {
      maxPiecesByVolume: 0,
      maxPiecesByWeight: 0,
      recommendedPieces: 0,
      limitingFactor: "volume" as const,
      piecesPerRow: 0,
      piecesPerCol: 0,
      layersCount: 0,
    };
  }

  const piecesPerCol = Math.floor(spec.innerL / item.length);
  const piecesPerRow = Math.floor(spec.innerW / item.width);
  const layersCount = Math.floor(spec.innerH / item.height);
  const geometricMax = piecesPerCol * piecesPerRow * layersCount;

  const itemVolumeM3 = (item.length * item.width * item.height) / 1_000_000;
  const maxPiecesByVolume = itemVolumeM3 > 0 ? Math.floor(spec.volume / itemVolumeM3) : 0;
  const maxPiecesByWeight = item.weight > 0 ? Math.floor(spec.weight / item.weight) : Infinity;

  const recommendedPieces = Math.min(geometricMax, maxPiecesByWeight);
  const limitingFactor = maxPiecesByWeight < geometricMax ? ("weight" as const) : ("volume" as const);

  return {
    maxPiecesByVolume,
    maxPiecesByWeight: maxPiecesByWeight === Infinity ? 0 : maxPiecesByWeight,
    recommendedPieces,
    limitingFactor,
    piecesPerRow,
    piecesPerCol,
    layersCount,
  };
}
