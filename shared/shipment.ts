// Tipe domain dan data awal transaksi EksporFlow. Dipisahkan dari Home.tsx agar dapat dipakai bersama oleh client, server, dan test.

export type Incoterm = "EXW" | "FCA" | "FOB" | "CFR" | "CIF" | "DAP" | "DDP";
export type DocumentType = "Proforma Invoice" | "Commercial Invoice" | "Packing List" | "Bill of Lading";
export type PaperSize = "A4" | "Letter" | "Legal";
export type DocumentOrientation = "Portrait" | "Landscape";
export type DocumentTemplate = "Classic Trade" | "Corporate Clean" | "Minimal";
export type PreviewLanguage = "English" | "Bahasa Indonesia";
export type ShipmentStatus = "Draft" | "Quotation" | "Confirmed" | "Ready to Ship" | "Booked" | "Stuffing" | "Departed" | "In Transit" | "Completed";
export type LineItem = { id: string; description: string; hsCode: string; quantity: number; unit: string; unitPrice: number; weight: number; length: number; width: number; height: number; packagingType: string; shrinkageRate: number; palletEnabled: boolean; palletCount: number; palletLength: number; palletWidth: number; palletHeight: number; palletWeight: number };

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
  poNumber: string;
  bookingNumber: string;
  containerNumber: string;
  sealNumber: string;
  shipmentStatus: ShipmentStatus;
  attachments: string[];
  lineItems: LineItem[];
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
  exchangeRate: 16000,
  exchangeRateSource: "Input finance · indicative",
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
  letterheadText: "Indico Export Indonesia",
  letterheadImage: "",
  poNumber: "NPI-2026-118",
  bookingNumber: "",
  containerNumber: "",
  sealNumber: "",
  shipmentStatus: "Quotation",
  attachments: ["Buyer_PO_NPI-2026-118.pdf"],
  lineItems: [{ id: "item-1", description: "Organic Coconut Sugar", hsCode: "1702.90", quantity: 2400, unit: "carton", unitPrice: 18.5, weight: 12, length: 40, width: 30, height: 25, packagingType: "Karton box", shrinkageRate: 1.5, palletEnabled: true, palletCount: 60, palletLength: 120, palletWidth: 100, palletHeight: 15, palletWeight: 22 }],
};
