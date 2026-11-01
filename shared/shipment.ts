// Tipe domain dan data awal transaksi EksporFlow. Dipisahkan dari Home.tsx agar dapat dipakai bersama oleh client, server, dan test.

export type Incoterm = "EXW" | "FCA" | "FOB" | "CFR" | "CIF" | "DAP" | "DDP";
export type DocumentType =
  | "Proforma Invoice"
  | "Sales Contract"
  | "Commercial Invoice"
  | "Packing List"
  | "Shipping Instruction"
  | "Bill of Lading";
export type PaperSize =
  | "A4"
  | "Letter"
  | "Legal"
  | "Folio"
  | "Executive"
  | "A3"
  | "A5"
  | "B4"
  | "B5"
  | "Tabloid"
  | "Statement";

export interface PaperSizeSpec {
  size: PaperSize;
  label: string;
  widthMm: number;
  heightMm: number;
  widthIn: number;
  heightIn: number;
  widthDxa: number;
  heightDxa: number;
  cssSize: string;
  description: string;
}

export const PAPER_SIZE_SPECS: Record<PaperSize, PaperSizeSpec> = {
  A4: {
    size: "A4",
    label: "A4",
    widthMm: 210,
    heightMm: 297,
    widthIn: 8.27,
    heightIn: 11.69,
    widthDxa: 11906,
    heightDxa: 16838,
    cssSize: "210mm 297mm",
    description: "A4 (210 × 297 mm) · Standar Internasional ISO",
  },
  Letter: {
    size: "Letter",
    label: "Letter",
    widthMm: 215.9,
    heightMm: 279.4,
    widthIn: 8.5,
    heightIn: 11.0,
    widthDxa: 12240,
    heightDxa: 15840,
    cssSize: "8.5in 11in",
    description: "Letter (8.5 × 11 in / 216 × 279 mm) · Standar US",
  },
  Legal: {
    size: "Legal",
    label: "Legal",
    widthMm: 215.9,
    heightMm: 355.6,
    widthIn: 8.5,
    heightIn: 14.0,
    widthDxa: 12240,
    heightDxa: 20160,
    cssSize: "8.5in 14in",
    description: "Legal (8.5 × 14 in / 216 × 356 mm) · US Legal",
  },
  Folio: {
    size: "Folio",
    label: "Folio / F4",
    widthMm: 215.9,
    heightMm: 330.2,
    widthIn: 8.5,
    heightIn: 13.0,
    widthDxa: 12240,
    heightDxa: 18720,
    cssSize: "215.9mm 330.2mm",
    description: "Folio / F4 (8.5 × 13 in / 216 × 330 mm) · Standar Bisnis & Ekspor RI",
  },
  Executive: {
    size: "Executive",
    label: "Executive",
    widthMm: 184.1,
    heightMm: 266.7,
    widthIn: 7.25,
    heightIn: 10.5,
    widthDxa: 10440,
    heightDxa: 15120,
    cssSize: "7.25in 10.5in",
    description: "Executive (7.25 × 10.5 in / 184 × 267 mm)",
  },
  A3: {
    size: "A3",
    label: "A3",
    widthMm: 297,
    heightMm: 420,
    widthIn: 11.69,
    heightIn: 16.54,
    widthDxa: 16838,
    heightDxa: 23811,
    cssSize: "297mm 420mm",
    description: "A3 (297 × 420 mm) · Format Besar ISO",
  },
  A5: {
    size: "A5",
    label: "A5",
    widthMm: 148,
    heightMm: 210,
    widthIn: 5.83,
    heightIn: 8.27,
    widthDxa: 8391,
    heightDxa: 11906,
    cssSize: "148mm 210mm",
    description: "A5 (148 × 210 mm) · Format Ringkas ISO",
  },
  B4: {
    size: "B4",
    label: "B4 (JIS)",
    widthMm: 257,
    heightMm: 364,
    widthIn: 10.12,
    heightIn: 14.33,
    widthDxa: 14570,
    heightDxa: 20636,
    cssSize: "257mm 364mm",
    description: "B4 JIS (257 × 364 mm) · Standar Jepang",
  },
  B5: {
    size: "B5",
    label: "B5 (JIS)",
    widthMm: 182,
    heightMm: 257,
    widthIn: 7.17,
    heightIn: 10.12,
    widthDxa: 10318,
    heightDxa: 14570,
    cssSize: "182mm 257mm",
    description: "B5 JIS (182 × 257 mm) · Standar Jepang",
  },
  Tabloid: {
    size: "Tabloid",
    label: "Tabloid",
    widthMm: 279.4,
    heightMm: 431.8,
    widthIn: 11.0,
    heightIn: 17.0,
    widthDxa: 15840,
    heightDxa: 24480,
    cssSize: "11in 17in",
    description: "Tabloid / Ledger (11 × 17 in / 279 × 432 mm)",
  },
  Statement: {
    size: "Statement",
    label: "Statement",
    widthMm: 139.7,
    heightMm: 215.9,
    widthIn: 5.5,
    heightIn: 8.5,
    widthDxa: 7920,
    heightDxa: 12240,
    cssSize: "5.5in 8.5in",
    description: "Statement / Half Letter (5.5 × 8.5 in / 140 × 216 mm)",
  },
};

export function getPaperSizeSpec(size: PaperSize = "A4"): PaperSizeSpec {
  return PAPER_SIZE_SPECS[size] || PAPER_SIZE_SPECS.A4;
}

// --- Microsoft Word Standard Page Margins ---
export type DocMarginPreset = "Normal" | "Sempit" | "Sedang" | "Lebar" | "Kustom";

export interface DocMarginSpec {
  preset: DocMarginPreset;
  top: number; // in mm
  bottom: number; // in mm
  left: number; // in mm
  right: number; // in mm
  label: string;
}

export const DOC_MARGIN_PRESETS: Record<"Normal" | "Sempit" | "Sedang" | "Lebar", DocMarginSpec> = {
  Normal: {
    preset: "Normal",
    top: 25.4,
    bottom: 25.4,
    left: 25.4,
    right: 25.4,
    label: "Normal (Atas: 2.54cm · Bawah: 2.54cm · Kiri: 2.54cm · Kanan: 2.54cm)",
  },
  Sempit: {
    preset: "Sempit",
    top: 12.7,
    bottom: 12.7,
    left: 12.7,
    right: 12.7,
    label: "Sempit / Narrow (Atas/Bawah: 1.27cm · Kiri/Kanan: 1.27cm)",
  },
  Sedang: {
    preset: "Sedang",
    top: 25.4,
    bottom: 25.4,
    left: 19.1,
    right: 19.1,
    label: "Sedang / Moderate (Atas/Bawah: 2.54cm · Kiri/Kanan: 1.91cm)",
  },
  Lebar: {
    preset: "Lebar",
    top: 25.4,
    bottom: 25.4,
    left: 50.8,
    right: 50.8,
    label: "Lebar / Wide (Atas/Bawah: 2.54cm · Kiri/Kanan: 5.08cm)",
  },
};

export function getDocMargins(shipment: Partial<Shipment>): DocMarginSpec {
  const preset = shipment.docMarginPreset || "Normal";
  if (preset !== "Kustom" && DOC_MARGIN_PRESETS[preset]) {
    return DOC_MARGIN_PRESETS[preset];
  }
  return {
    preset: "Kustom",
    top: shipment.docMarginTop ?? 25.4,
    bottom: shipment.docMarginBottom ?? 25.4,
    left: shipment.docMarginLeft ?? 25.4,
    right: shipment.docMarginRight ?? 25.4,
    label: "Kustom",
  };
}

export type DocumentOrientation = "Portrait" | "Landscape";
export type DocumentTemplate = "Classic Trade" | "Corporate Clean" | "Minimal";
export type PreviewLanguage = "English" | "Bahasa Indonesia";
export type ShipmentStatus = "Draft" | "Quotation" | "Confirmed" | "Ready to Ship" | "Booked" | "Stuffing" | "Departed" | "In Transit" | "Completed";
export type LineItem = { id: string; description: string; hsCode: string; quantity: number; unit: string; unitPrice: number; weight: number; length: number; width: number; height: number; packagingType: string; shrinkageRate: number; palletEnabled: boolean; palletCount: number; palletLength: number; palletWidth: number; palletHeight: number; palletWeight: number };

export type AdditionalCostFactor = {
  id: string;
  name: string;
  amount: number;
  section: "goods" | "logistics" | "strategy";
  category?: string;
};

export type ContainerCalc = {
  name: string;
  innerL: number;
  innerW: number;
  innerH: number;
  volume: number;
  weight: number;
  cartonVolume: number;
  totalVolume: number;
  totalWeight: number;
  netWeight: number;
  grossWeight: number;
  productVolume: number;
  palletVolume: number;
  palletWeight: number;
  byVolume: number;
  byWeight: number;
  containers: number;
  volumeUtilization: number;
  weightUtilization: number;
  packagingVolume: number;
  palletCount: number;
  shrinkageLoss: number;
};

export type Shipment = {
  reference: string;
  exporter: string;
  buyer: string;
  buyerCountry: string;
  destination: string;
  product: string;
  hsCode: string;
  currency: string;
  incoterm: Incoterm;
  paymentTerms: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  packaging: number;
  inlandTransport: number;
  originHandling: number;
  customs: number;
  freight: number;
  insurance: number;
  destinationHandling: number;
  importDuty: number;
  lastMile: number;
  margin: number;
  discount: number;
  contingency: number;
  exchangeRate: number;
  exchangeRateSource: string;
  exchangeRateDate: string;
  formulaVersion: string;
  namedPlace: string;
  cartonLength: number;
  cartonWidth: number;
  cartonHeight: number;
  cartonWeight: number;
  cartonQty: number;
  containerType: "20GP" | "40GP" | "40HC";
  packageType: string;
  paperSize: PaperSize;
  documentOrientation: DocumentOrientation;
  documentTemplate: DocumentTemplate;
  previewLanguage: PreviewLanguage;
  documentReviewed: boolean;
  documentRevision: number;
  letterheadText: string;
  letterheadImage: string;
  letterheadLogoScale?: number;
  letterheadLogoWrap?: "inline" | "square" | "behind" | "front" | "topBottom";
  letterheadLogoAlign?: "left" | "center" | "right" | "custom";
  letterheadLogoX?: number;
  letterheadLogoY?: number;
  letterheadLogoOpacity?: number;
  letterheadLogoRotate?: number;
  letterheadLogoBorder?: "none" | "solid" | "dashed" | "rounded";
  letterheadLogoBorderColor?: string;
  letterheadLogoShadow?: boolean;
  poNumber: string;
  bookingNumber: string;
  containerNumber: string;
  sealNumber: string;
  signatoryName?: string;
  signatoryRole?: string;
  buyerAddress?: string;
  buyerPicName?: string;
  buyerPicRole?: string;
  buyerPhone?: string;
  buyerEmail?: string;
  vesselName?: string;
  bankName?: string;
  bankAccountNo?: string;
  bankSwift?: string;
  shipmentStatus: ShipmentStatus;
  attachments: string[];
  lineItems: LineItem[];
  additionalCostFactors: AdditionalCostFactor[];
  hppMode?: "trader" | "manufacturer";
  traderBuyPrice?: number;
  traderShrinkage?: number;
  traderSourcingFreight?: number;
  traderSortingLabor?: number;
  traderInnerPackaging?: number;
  traderLabelPackaging?: number;
  traderStaffingOverhead?: number;
  traderMargin?: number;
  contractSpecialTerms?: string;
  contractLayout?: "1-page" | "2-page";
  defaultExportFormat?: "pdf" | "docx" | "xlsx" | "html" | "txt";
  blNumber?: string;
  sellerSignatureImage?: string;
  sellerSignatureType?: "draw" | "upload" | "font" | "stamp";
  sellerSignatureDate?: string;
  sellerVerificationCode?: string;
  buyerSignatureImage?: string;
  buyerSignatureType?: "draw" | "upload" | "font" | "stamp";
  buyerSignatureDate?: string;
  buyerVerificationCode?: string;
  includeOfficialStamp?: boolean;
  officialStampColor?: "red" | "blue";
  docEditorFontFamily?: string;
  docEditorFontSize?: number;
  docEditorLineHeight?: number;
  docEditorTextAlign?: "left" | "center" | "right" | "justify";
  docEditorMode?: boolean;
  docMarginPreset?: DocMarginPreset;
  docMarginTop?: number;
  docMarginBottom?: number;
  docMarginLeft?: number;
  docMarginRight?: number;
  docHeaderEnabled?: boolean;
  docHeaderText?: string;
  docFooterEnabled?: boolean;
  docFooterText?: string;
  docShowPageNumber?: boolean;
  docShowRuler?: boolean;
  mfgRawMaterial?: number;
  mfgAuxiliary?: number;
  mfgDirectLabor?: number;
  mfgOverhead?: number;
};

export const initialShipment: Shipment = {
  reference: "EXP-2026-084",
  exporter: "Indico Export Indonesia",
  buyer: "Nordic Pantry AB",
  buyerCountry: "Swedia",
  destination: "Gothenburg, Swedia",
  product: "Organic Coconut Sugar",
  hsCode: "1702.90",
  currency: "USD",
  incoterm: "CIF",
  paymentTerms: "30% DP / 70% before shipment",
  quantity: 2400,
  unit: "carton",
  unitPrice: 18.5,
  packaging: 1320,
  inlandTransport: 640,
  originHandling: 380,
  customs: 275,
  freight: 2860,
  insurance: 185,
  destinationHandling: 450,
  importDuty: 920,
  lastMile: 520,
  margin: 12,
  discount: 0,
  contingency: 2,
  exchangeRate: 18274,
  exchangeRateSource: "Bank Indonesia (Kurs Jual BI)",
  exchangeRateDate: "2026-10-25",
  formulaVersion: "v1.8 · cost/(1-target margin)",
  namedPlace: "Port of Gothenburg, Sweden",
  cartonLength: 40,
  cartonWidth: 30,
  cartonHeight: 25,
  cartonWeight: 12,
  cartonQty: 2400,
  containerType: "40HC",
  packageType: "Carton box",
  paperSize: "A4",
  documentOrientation: "Portrait",
  documentTemplate: "Classic Trade",
  previewLanguage: "English",
  documentReviewed: false,
  documentRevision: 1,
  contractLayout: "1-page",
  defaultExportFormat: "pdf",
  blNumber: "KMTC-MKS0091827",
  sellerSignatureImage: "",
  sellerSignatureType: "font",
  sellerSignatureDate: "",
  sellerVerificationCode: "IEI-DIGISIG-8849-DXB",
  buyerSignatureImage: "",
  buyerSignatureType: "font",
  buyerSignatureDate: "",
  buyerVerificationCode: "ABF-DIGISIG-1092-DXB",
  includeOfficialStamp: true,
  officialStampColor: "red",
  docEditorFontFamily: "Calibri",
  docEditorFontSize: 12,
  docEditorLineHeight: 1.35,
  docEditorTextAlign: "left",
  docEditorMode: false,
  docMarginPreset: "Normal",
  docMarginTop: 25.4,
  docMarginBottom: 25.4,
  docMarginLeft: 25.4,
  docMarginRight: 25.4,
  docHeaderEnabled: true,
  docHeaderText: "OFFICIAL COMMERCIAL EXPORT CONTRACT",
  docFooterEnabled: true,
  docFooterText: "CONFIDENTIAL & LEGALLY BINDING INTERNATIONAL COMMERCIAL DOCUMENT",
  docShowPageNumber: true,
  docShowRuler: true,
  contractSpecialTerms: "",
  letterheadText: "Indico Export Indonesia",
  letterheadImage: "",
  letterheadLogoScale: 100,
  letterheadLogoWrap: "inline",
  letterheadLogoAlign: "left",
  letterheadLogoX: 0,
  letterheadLogoY: 0,
  letterheadLogoOpacity: 100,
  letterheadLogoRotate: 0,
  letterheadLogoBorder: "none",
  letterheadLogoBorderColor: "#cbd5e1",
  letterheadLogoShadow: false,
  poNumber: "ABF/LOI/2026/108",
  bookingNumber: "KMTC SHIMIZU V.2611N",
  containerNumber: "TGHU 2468135",
  sealNumber: "IDMKS998877",
  signatoryName: "Muhajirin Fatona",
  signatoryRole: "Export Director",
  buyerAddress: "P.O. Box 112233, Al Ras Area, Deira, Dubai, United Arab Emirates",
  buyerPicName: "Tariq Al-Mansoor",
  buyerPicRole: "Procurement Director",
  buyerPhone: "+971 4 223 4567",
  buyerEmail: "procurement@albarakahfoods.ae",
  vesselName: "KMTC SHIMIZU V.2611N",
  bankName: "PT. Bank Mandiri (Persero) Tbk",
  bankAccountNo: "152-00-9876543-2",
  bankSwift: "BMRIIDJA",
  shipmentStatus: "Quotation",
  attachments: ["Buyer_PO_NPI-2026-118.pdf"],
  additionalCostFactors: [],
  hppMode: "trader",
  traderBuyPrice: 15.5,
  traderShrinkage: 5,
  traderSourcingFreight: 0.3,
  traderSortingLabor: 0.4,
  traderInnerPackaging: 0.4,
  traderLabelPackaging: 0.2,
  traderStaffingOverhead: 0.2,
  traderMargin: 0,
  mfgRawMaterial: 14,
  mfgAuxiliary: 1.5,
  mfgDirectLabor: 1.2,
  mfgOverhead: 0.8,
  lineItems: [{ id: "item-1", description: "Organic Coconut Sugar", hsCode: "1702.90", quantity: 2400, unit: "carton", unitPrice: 18.5, weight: 12, length: 40, width: 30, height: 25, packagingType: "Karton box", shrinkageRate: 1.5, palletEnabled: true, palletCount: 60, palletLength: 120, palletWidth: 100, palletHeight: 15, palletWeight: 22 }],
};


export const emptyLineItem: LineItem = {
  id: "item-1",
  description: "",
  hsCode: "",
  quantity: 0,
  unit: "carton",
  unitPrice: 0,
  weight: 0,
  length: 0,
  width: 0,
  height: 0,
  packagingType: "Karton box",
  shrinkageRate: 0,
  palletEnabled: false,
  palletCount: 0,
  palletLength: 120,
  palletWidth: 100,
  palletHeight: 15,
  palletWeight: 20,
};

export function createEmptyShipment(options?: { exporter?: string; reference?: string }): Shipment {
  const company = options?.exporter?.trim() ?? "";
  return {
    reference: options?.reference?.trim() || "",
    exporter: company,
    buyer: "",
    buyerCountry: "",
    destination: "",
    product: "",
    hsCode: "",
    currency: "USD",
    incoterm: "FOB",
    paymentTerms: "",
    quantity: 0,
    unit: "carton",
    unitPrice: 0,
    packaging: 0,
    inlandTransport: 0,
    originHandling: 0,
    customs: 0,
    freight: 0,
    insurance: 0,
    destinationHandling: 0,
    importDuty: 0,
    lastMile: 0,
    margin: 15,
    discount: 0,
    contingency: 0,
    exchangeRate: 18274,
    exchangeRateSource: "Kurs referensi internal",
    exchangeRateDate: new Date().toISOString().slice(0, 10),
    formulaVersion: "v1.8 · cost/(1-target margin)",
    namedPlace: "",
    cartonLength: 0,
    cartonWidth: 0,
    cartonHeight: 0,
    cartonWeight: 0,
    cartonQty: 0,
    containerType: "20GP",
    packageType: "Karton box",
    paperSize: "A4",
    documentOrientation: "Portrait",
    documentTemplate: "Corporate Clean",
    previewLanguage: "English",
    documentReviewed: false,
    documentRevision: 1,
    letterheadText: company,
    letterheadImage: "",
    letterheadLogoScale: 100,
    letterheadLogoWrap: "inline",
    letterheadLogoAlign: "left",
    letterheadLogoX: 0,
    letterheadLogoY: 0,
    letterheadLogoOpacity: 100,
    letterheadLogoRotate: 0,
    letterheadLogoBorder: "none",
    letterheadLogoBorderColor: "#cbd5e1",
    letterheadLogoShadow: false,
    poNumber: "",
    bookingNumber: "",
    containerNumber: "",
    sealNumber: "",
    signatoryName: "Muhajirin Fatona",
    signatoryRole: "Export Director",
    buyerAddress: "",
    buyerPicName: "",
    buyerPicRole: "",
    buyerPhone: "",
    buyerEmail: "",
    vesselName: "",
    bankName: "PT. Bank Mandiri (Persero) Tbk",
    bankAccountNo: "152-00-9876543-2",
    bankSwift: "BMRIIDJA",
    shipmentStatus: "Draft",
    attachments: [],
    lineItems: [{ ...emptyLineItem }],
    additionalCostFactors: [],
    hppMode: "trader",
    traderBuyPrice: 0,
    traderShrinkage: 5,
    traderSourcingFreight: 0,
    traderSortingLabor: 0,
    traderInnerPackaging: 0,
    traderLabelPackaging: 0,
    traderStaffingOverhead: 0,
    traderMargin: 0,
    mfgRawMaterial: 0,
    mfgAuxiliary: 0,
    mfgDirectLabor: 0,
    mfgOverhead: 0,
  };
}

const REVISION_KEYS: (keyof Shipment)[] = [
  "reference",
  "exporter",
  "buyer",
  "buyerCountry",
  "destination",
  "product",
  "hsCode",
  "currency",
  "incoterm",
  "paymentTerms",
  "quantity",
  "unit",
  "unitPrice",
  "packaging",
  "inlandTransport",
  "originHandling",
  "customs",
  "freight",
  "insurance",
  "destinationHandling",
  "importDuty",
  "lastMile",
  "margin",
  "discount",
  "contingency",
  "namedPlace",
  "lineItems",
  "paperSize",
  "documentOrientation",
  "documentTemplate",
  "letterheadText",
  "letterheadImage",
  "letterheadLogoScale",
  "letterheadLogoWrap",
  "letterheadLogoAlign",
  "letterheadLogoX",
  "letterheadLogoY",
  "letterheadLogoOpacity",
  "letterheadLogoRotate",
  "letterheadLogoBorder",
  "letterheadLogoBorderColor",
  "letterheadLogoShadow",
  "signatoryName",
  "signatoryRole",
  "buyerAddress",
  "buyerPicName",
  "buyerPicRole",
  "buyerPhone",
  "buyerEmail",
  "vesselName",
  "containerNumber",
  "sealNumber",
  "poNumber",
  "bankName",
  "bankAccountNo",
  "bankSwift",
];

/**
 * Merekam ulang objek Shipment dari snapshot JSON database/localStorage dengan fallback aman.
 */
export function hydrateShipment(input: {
  reference?: string;
  status?: string;
  snapshot?: Record<string, unknown> | Partial<Shipment>;
  lineItems?: Record<string, unknown>[];
}): Shipment {
  const base = createEmptyShipment();
  const raw = (input.snapshot ?? {}) as Partial<Shipment>;
  const merged = { ...base, ...raw } as Shipment;
  if (input.reference) merged.reference = input.reference;
  if (input.status) merged.shipmentStatus = input.status as ShipmentStatus;

  const rawItems =
    input.lineItems && input.lineItems.length > 0
      ? (input.lineItems as Partial<LineItem>[])
      : Array.isArray(raw.lineItems) && raw.lineItems.length > 0
        ? (raw.lineItems as Partial<LineItem>[])
        : null;

  const migratedItems: LineItem[] = rawItems
    ? rawItems.map((item, idx) => ({
        ...emptyLineItem,
        ...item,
        id: String(item.id ?? `item-${idx + 1}`),
      }))
    : [
        {
          ...emptyLineItem,
          description: merged.product,
          hsCode: merged.hsCode,
          quantity: merged.quantity,
          unit: merged.unit,
          unitPrice: merged.unitPrice,
          weight: merged.cartonWeight,
          length: merged.cartonLength,
          width: merged.cartonWidth,
          height: merged.cartonHeight,
        },
      ];

  return {
    ...merged,
    lineItems: migratedItems,
    exporter: typeof raw.exporter === "string" ? raw.exporter : base.exporter,
    letterheadText: typeof raw.letterheadText === "string" ? raw.letterheadText : base.letterheadText,
    additionalCostFactors: Array.isArray(raw.additionalCostFactors) ? (raw.additionalCostFactors as AdditionalCostFactor[]) : [],
  };
}

/**
 * Mengubah state Shipment menjadi payload tRPC `shipments.create` / `shipments.update`.
 */
export function toShipmentPersistencePayload(shipment: Shipment): {
  reference: string;
  status: string;
  snapshot: Record<string, unknown>;
  lineItems: Record<string, unknown>[];
} {
  const { lineItems, ...rest } = shipment;
  return {
    reference:
      shipment.reference.trim() ||
      (shipment.buyer.trim() ? `Ekspor ${shipment.buyer.trim()}` : "Transaksi Ekspor"),
    status: shipment.shipmentStatus,
    snapshot: rest as unknown as Record<string, unknown>,
    lineItems: lineItems.map((item) => ({ ...item })),
  };
}

export function applyShipmentFieldUpdate<K extends keyof Shipment>(
  current: Shipment,
  key: K,
  value: Shipment[K],
): Shipment {
  const next = { ...current, [key]: value } as Shipment;
  if (REVISION_KEYS.includes(key)) {
    next.documentRevision = Math.max(1, current.documentRevision + 1);
  }
  if (current.lineItems.length && (key === "product" || key === "hsCode" || key === "unit")) {
    const lineKey = key === "product" ? "description" : key;
    next.lineItems = current.lineItems.map((item, index) =>
      index === 0 ? { ...item, [lineKey]: value } : item,
    ) as LineItem[];
  }
  if (current.lineItems.length && key === "unitPrice") {
    next.lineItems = current.lineItems.map((item, index) =>
      index === 0 ? { ...item, unitPrice: value } : item,
    ) as LineItem[];
  }
  return next;
}

export function applyShipmentNumberUpdate(current: Shipment, key: keyof Shipment, rawValue: string): Shipment {
  const parsed = Number(rawValue);
  const numericValue = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  const next = { ...current, [key]: numericValue } as Shipment;
  if (REVISION_KEYS.includes(key)) {
    next.documentRevision = Math.max(1, current.documentRevision + 1);
  }
  if (key === "quantity") {
    next.cartonQty = numericValue;
    next.lineItems = current.lineItems.map((item, index) =>
      index === 0 ? { ...item, quantity: numericValue } : item,
    );
  }
  if (key === "unitPrice") {
    next.lineItems = current.lineItems.map((item, index) =>
      index === 0 ? { ...item, unitPrice: numericValue } : item,
    );
  }
  if (key === "cartonQty") {
    next.quantity = numericValue;
  }
  return next;
}

export function applyLineItemsUpdate(current: Shipment, items: LineItem[]): Shipment {
  const safeItems = (items.length ? items : [emptyLineItem]).map((item) => ({
    ...emptyLineItem,
    ...item,
  }));
  const first = safeItems[0];
  const totalQuantity = safeItems.reduce((sum, item) => sum + item.quantity, 0);
  return {
    ...current,
    documentRevision: Math.max(1, current.documentRevision + 1),
    lineItems: safeItems,
    product: first.description,
    hsCode: first.hsCode,
    quantity: totalQuantity,
    cartonQty: totalQuantity,
    unit: first.unit,
    unitPrice: first.unitPrice,
    cartonWeight: first.weight,
    cartonLength: first.length,
    cartonWidth: first.width,
    cartonHeight: first.height,
  };
}
