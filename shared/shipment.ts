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
  letterheadLogoWrap?: "inline" | "square" | "tight" | "through" | "behind" | "front" | "topBottom";
  letterheadLogoAlign?: "left" | "center" | "right" | "custom";
  letterheadLogoPositionPreset?:
    | "inline"
    | "top-left"
    | "top-center"
    | "top-right"
    | "middle-left"
    | "middle-center"
    | "middle-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";
  letterheadLogoX?: number;
  letterheadLogoY?: number;
  letterheadLogoOpacity?: number;
  letterheadLogoRotate?: number;
  letterheadLogoFlipH?: boolean;
  letterheadLogoFlipV?: boolean;
  letterheadLogoBorder?: "none" | "solid" | "dashed" | "rounded" | "double" | "oval";
  letterheadLogoBorderColor?: string;
  letterheadLogoShadow?: boolean;
  letterheadMode?: "standard" | "banner";
  letterheadBannerImage?: string;
  letterheadBannerHeight?: number;
  letterheadSpacing?: number;
  letterheadDividerGap?: number;
  letterheadDividerStyle?:
    | "single"
    | "double"
    | "thick-thin"
    | "thin-thick"
    | "thin"
    | "bold"
    | "accent-gradient"
    | "dashed"
    | "dotted"
    | "none";
  letterheadDividerColor?: string;
  letterheadLayout?: "left" | "center" | "split";
  exporterContact?: string;
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
  bankAddress?: string;
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
  sellerSignatureHeight?: number;
  sellerSignatureAlign?: "left" | "center" | "right";
  sellerSignatureX?: number;
  sellerSignatureY?: number;
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

export const DEFAULT_INDICO_LOGO = "data:image/png;base64,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";

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
  sellerSignatureHeight: 48,
  sellerSignatureAlign: "left",
  sellerSignatureX: 0,
  sellerSignatureY: 0,
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
  docEditorMode: true,
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
  letterheadImage: DEFAULT_INDICO_LOGO,
  letterheadLogoScale: 100,
  letterheadLogoWrap: "inline",
  letterheadLogoAlign: "left",
  letterheadLogoPositionPreset: "inline",
  letterheadLogoX: 0,
  letterheadLogoY: 0,
  letterheadLogoOpacity: 100,
  letterheadLogoRotate: 0,
  letterheadLogoFlipH: false,
  letterheadLogoFlipV: false,
  letterheadLogoBorder: "none",
  letterheadLogoBorderColor: "#cbd5e1",
  letterheadLogoShadow: false,
  letterheadMode: "standard",
  letterheadBannerImage: "",
  letterheadBannerHeight: 110,
  letterheadSpacing: 2,
  letterheadDividerGap: 4,
  letterheadDividerStyle: "double",
  letterheadDividerColor: "#0f2942",
  letterheadLayout: "left",
  exporterContact: "Telp: +62 812 3456 7890 · Email: official@indicoexport.com",
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
  bankAddress: "Jl. Boulevard, Panakkukang, Makassar, South Sulawesi, Indonesia",
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
    letterheadText: company || "PT. INDICO EXPORT INDONESIA",
    letterheadImage: !company || company.toLowerCase().includes("indico") ? DEFAULT_INDICO_LOGO : "",
    letterheadLogoScale: 100,
    letterheadLogoWrap: "inline",
    letterheadLogoAlign: "left",
    letterheadLogoPositionPreset: "inline",
    letterheadLogoX: 0,
    letterheadLogoY: 0,
    letterheadLogoOpacity: 100,
    letterheadLogoRotate: 0,
    letterheadLogoFlipH: false,
    letterheadLogoFlipV: false,
    letterheadLogoBorder: "none",
    letterheadLogoBorderColor: "#cbd5e1",
    letterheadLogoShadow: false,
    letterheadMode: "standard",
    letterheadBannerImage: "",
    letterheadBannerHeight: 110,
    letterheadSpacing: 2,
    letterheadDividerGap: 4,
    letterheadDividerStyle: "double",
    letterheadDividerColor: "#0f2942",
    letterheadLayout: "left",
    exporterContact: "Telp: +62 812 3456 7890 · Email: official@indicoexport.com",
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
    bankAddress: "Jl. Boulevard, Panakkukang, Makassar, South Sulawesi, Indonesia",
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
  "letterheadLogoPositionPreset",
  "letterheadLogoX",
  "letterheadLogoY",
  "letterheadLogoOpacity",
  "letterheadLogoRotate",
  "letterheadLogoFlipH",
  "letterheadLogoFlipV",
  "letterheadLogoBorder",
  "letterheadLogoBorderColor",
  "letterheadLogoShadow",
  "letterheadMode",
  "letterheadBannerImage",
  "letterheadBannerHeight",
  "letterheadSpacing",
  "letterheadDividerGap",
  "letterheadDividerStyle",
  "letterheadDividerColor",
  "letterheadLayout",
  "exporterContact",
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
  "bankAddress",
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
    letterheadImage:
      typeof raw.letterheadImage === "string" && raw.letterheadImage.trim() !== ""
        ? raw.letterheadImage
        : (typeof raw.exporter === "string" ? raw.exporter : base.exporter).toLowerCase().includes("indico")
          ? DEFAULT_INDICO_LOGO
          : (raw.letterheadImage || base.letterheadImage),
    letterheadLogoScale:
      typeof raw.letterheadLogoScale === "number" && !isNaN(raw.letterheadLogoScale) && raw.letterheadLogoScale >= 30
        ? Math.min(300, raw.letterheadLogoScale)
        : 100,
    letterheadLogoX:
      typeof raw.letterheadLogoX === "number" && !isNaN(raw.letterheadLogoX)
        ? Math.max(-10, Math.min(260, raw.letterheadLogoX))
        : 0,
    letterheadLogoY:
      typeof raw.letterheadLogoY === "number" && !isNaN(raw.letterheadLogoY)
        ? Math.max(-10, Math.min(80, raw.letterheadLogoY))
        : 0,
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
