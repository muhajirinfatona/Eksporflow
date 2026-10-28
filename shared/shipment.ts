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
  const raw = (input.snapshot ?? {}) as Partial<Shipment>;
  const merged = { ...initialShipment, ...raw } as Shipment;
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
        ...initialShipment.lineItems[0],
        ...item,
        id: String(item.id ?? `item-${idx + 1}`),
      }))
    : [
        {
          ...initialShipment.lineItems[0],
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
    exporter: !raw.exporter || raw.exporter === "PT Nusantara Rasa" ? initialShipment.exporter : raw.exporter,
    letterheadText:
      !raw.letterheadText || String(raw.letterheadText).includes("Nusantara Rasa")
        ? initialShipment.letterheadText
        : raw.letterheadText,
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
    reference: shipment.reference.trim() || initialShipment.reference,
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
  const safeItems = (items.length ? items : initialShipment.lineItems).map((item) => ({
    ...initialShipment.lineItems[0],
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
