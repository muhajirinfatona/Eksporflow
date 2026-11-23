import { createHash } from "node:crypto";
import { formatMoney, formatNumber, numberToWords } from "./format";
import type { LineItem, Shipment } from "./shipment";

export interface DocumentLineItem {
  itemNo: number;
  description: string;
  hsCode: string;
  packagingType: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  netWeightKg: number;
  grossWeightKg: number;
  volumeCbm: number;
  marksAndNumbers: string;
  packagesCount: number;
}

export interface DocumentTotals {
  totalQuantity: number;
  totalAmount: number;
  totalNetWeightKg: number;
  totalNetWeightMT: number;
  totalGrossWeightKg: number;
  totalGrossWeightMT: number;
  totalVolumeCbm: number;
  totalPackages: number;
  currency: string;
  amountInWords: string;
  itemsCount: number;
}

export interface DocumentSnapshotPayload {
  schemaVersion: "2.0";
  documentType: string;
  documentNumber: string;
  reference: string;
  revision: number;
  finalizedAt: string;
  exporter: {
    name: string;
    nib?: string;
    npwp?: string;
    address: string;
    contact?: string;
    signatoryName?: string;
    signatoryRole?: string;
  };
  buyer: {
    name: string;
    address: string;
    country: string;
    picName?: string;
    picRole?: string;
    phone?: string;
    email?: string;
  };
  consignee: {
    name: string;
    address: string;
    country: string;
  };
  notifyParty: {
    name: string;
    address: string;
    contact?: string;
  };
  transport: {
    pol: string;
    pod: string;
    namedPlace?: string;
    vesselName?: string;
    blNumber?: string;
    containerNumber?: string;
    sealNumber?: string;
    bookingNumber?: string;
    containerType?: string;
  };
  commercialTerms: {
    incoterm: string;
    paymentTerms: string;
    currency: string;
    exchangeRate?: number;
    exchangeRateSource?: string;
  };
  lineItems: DocumentLineItem[];
  totals: DocumentTotals;
  banking: {
    bankName?: string;
    bankAddress?: string;
    bankAccountNo?: string;
    bankSwift?: string;
  };
  signatures: {
    sellerSignatureImage?: string;
    sellerSignatureDate?: string;
    sellerVerificationCode?: string;
    buyerSignatureImage?: string;
    buyerSignatureDate?: string;
    buyerVerificationCode?: string;
    includeOfficialStamp?: boolean;
    officialStampColor?: string;
  };
  metadata: {
    paperSize: string;
    orientation: string;
    template: string;
    language: string;
  };
}

/**
 * Mengubah array line items dari state Shipment menjadi DocumentLineItem standar internasional
 * dengan 9 kolom wajib (HS Code, Description, Packaging, Qty, Unit Price, Total, Net Wt, Gross Wt, CBM).
 */
export function calculateDocumentItems(shipment: Partial<Shipment>): DocumentLineItem[] {
  const rawItems: LineItem[] =
    Array.isArray(shipment.lineItems) && shipment.lineItems.length > 0
      ? shipment.lineItems
      : [
          {
            id: "item-1",
            description: shipment.product || "Export Commodity",
            hsCode: shipment.hsCode || "0000.00.00",
            quantity: shipment.quantity || 1,
            unit: shipment.unit || "carton",
            unitPrice: shipment.unitPrice || 0,
            weight: shipment.cartonWeight || 1,
            length: shipment.cartonLength || 40,
            width: shipment.cartonWidth || 30,
            height: shipment.cartonHeight || 25,
            packagingType: shipment.packageType || "Karton box",
            shrinkageRate: 0,
            palletEnabled: false,
            palletCount: 0,
            palletLength: 120,
            palletWidth: 100,
            palletHeight: 15,
            palletWeight: 20,
          },
        ];

  let cumulativePackages = 0;
  const buyerInitials = (shipment.buyer || "BYR").replace(/[^a-zA-Z0-9]/g, "").slice(0, 3).toUpperCase();
  const destCode = (shipment.destination || "DEST").replace(/[^a-zA-Z0-9]/g, "").slice(0, 3).toUpperCase();

  return rawItems.map((item, idx) => {
    const itemNo = idx + 1;
    const quantity = Math.max(0, Number(item.quantity) || 0);
    const unitPrice = Math.max(0, Number(item.unitPrice) || 0);
    const unitWeight = Math.max(0, Number(item.weight) || 0);
    const lengthCm = Math.max(0, Number(item.length) || 0);
    const widthCm = Math.max(0, Number(item.width) || 0);
    const heightCm = Math.max(0, Number(item.height) || 0);

    const totalAmount = Math.round(quantity * unitPrice * 100) / 100;
    const netWeightKg = Math.round(quantity * unitWeight * 1000) / 1000;

    // Tare kemasan diperkirakan 3%-5% dari berat neto jika tidak ada pallet khusus
    const tarePerUnit = unitWeight * 0.04;
    let grossWeightKg = Math.round(quantity * (unitWeight + tarePerUnit) * 1000) / 1000;

    if (item.palletEnabled && (item.palletCount || 0) > 0) {
      grossWeightKg += (item.palletCount || 0) * (item.palletWeight || 20);
    }
    grossWeightKg = Math.round(grossWeightKg * 1000) / 1000;

    // Volume dalam CBM (Cubic Meter) = (P * L * T * Qty) / 1,000,000 cm³
    const volumeCbm =
      lengthCm > 0 && widthCm > 0 && heightCm > 0
        ? Math.round(((lengthCm * widthCm * heightCm * quantity) / 1_000_000) * 1000) / 1000
        : 0;

    const startPkg = cumulativePackages + 1;
    const endPkg = cumulativePackages + quantity;
    cumulativePackages = endPkg;
    const marksAndNumbers = `${buyerInitials}/${destCode}/${String(startPkg).padStart(3, "0")}-${String(endPkg).padStart(3, "0")}`;

    return {
      itemNo,
      description: item.description || "Commodity Item",
      hsCode: (item.hsCode || "0000.00.00").trim(),
      packagingType: item.packagingType || "Karton box",
      unit: item.unit || "carton",
      quantity,
      unitPrice,
      totalAmount,
      netWeightKg,
      grossWeightKg,
      volumeCbm,
      marksAndNumbers,
      packagesCount: quantity,
    };
  });
}

/**
 * Menghitung total akumulasi dari seluruh line items.
 */
export function calculateDocumentTotals(items: DocumentLineItem[], currency: string = "USD"): DocumentTotals {
  let totalQuantity = 0;
  let totalAmount = 0;
  let totalNetWeightKg = 0;
  let totalGrossWeightKg = 0;
  let totalVolumeCbm = 0;
  let totalPackages = 0;

  for (const item of items) {
    totalQuantity += item.quantity;
    totalAmount += item.totalAmount;
    totalNetWeightKg += item.netWeightKg;
    totalGrossWeightKg += item.grossWeightKg;
    totalVolumeCbm += item.volumeCbm;
    totalPackages += item.packagesCount;
  }

  totalAmount = Math.round(totalAmount * 100) / 100;
  totalNetWeightKg = Math.round(totalNetWeightKg * 1000) / 1000;
  totalGrossWeightKg = Math.round(totalGrossWeightKg * 1000) / 1000;
  totalVolumeCbm = Math.round(totalVolumeCbm * 1000) / 1000;

  const totalNetWeightMT = Math.round((totalNetWeightKg / 1000) * 1000) / 1000;
  const totalGrossWeightMT = Math.round((totalGrossWeightKg / 1000) * 1000) / 1000;

  return {
    totalQuantity,
    totalAmount,
    totalNetWeightKg,
    totalNetWeightMT,
    totalGrossWeightKg,
    totalGrossWeightMT,
    totalVolumeCbm,
    totalPackages,
    currency,
    amountInWords: numberToWords(totalAmount, currency),
    itemsCount: items.length,
  };
}

/**
 * Format nomor dokumen resmi institusional berdasarkan jenis dokumen dan referensi transaksi.
 */
export function formatInstitutionalDocNumber(docType: string, reference: string, revision: number = 1): string {
  const cleanRef = (reference || "EXP-001").replace(/[^a-zA-Z0-9-]/g, "");
  let prefix = "DOC";
  switch (docType) {
    case "Sales Contract":
      prefix = "SC";
      break;
    case "Commercial Invoice":
      prefix = "INV";
      break;
    case "Packing List":
      prefix = "PL";
      break;
    case "Certificate of Origin":
      prefix = "COO";
      break;
    case "Shipping Instruction":
      prefix = "SI";
      break;
    case "Proforma Invoice":
      prefix = "PI";
      break;
    case "Bill of Lading":
      prefix = "BL-DRAFT";
      break;
  }

  const revSuffix = revision > 1 ? `-R${revision}` : "";
  return `${prefix}/${cleanRef}${revSuffix}`;
}

/**
 * Serialisasi JSON secara deterministik (rekursif mengurutkan kunci objek)
 * agar perhitungan hash SHA-256 identik di runtime mana pun.
 */
export function canonicalJsonStringify(data: unknown): string {
  if (data === null || typeof data !== "object") {
    return JSON.stringify(data);
  }

  if (Array.isArray(data)) {
    return `[${data.map(canonicalJsonStringify).join(",")}]`;
  }

  const record = data as Record<string, unknown>;
  const sortedKeys = Object.keys(record).sort();
  const entries = sortedKeys.map(
    (key) => `${JSON.stringify(key)}:${canonicalJsonStringify(record[key])}`,
  );
  return `{${entries.join(",")}}`;
}

/**
 * Menghitung hash SHA-256 dari payload dokumen (representasi bukti immutable).
 */
export function computePayloadHash(payload: unknown): string {
  const canonical = canonicalJsonStringify(payload);
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

/**
 * Memverifikasi apakah isi payload sesuai dengan hash SHA-256 yang tersimpan.
 */
export function verifyPayloadHash(payload: unknown, expectedHash: string): boolean {
  if (!expectedHash || typeof expectedHash !== "string") return false;
  const computed = computePayloadHash(payload);
  return computed.toLowerCase() === expectedHash.trim().toLowerCase();
}

/**
 * Membangun payload dokumen lengkap yang siap disimpan ke tabel immutable documentSnapshots.
 */
export function buildDocumentSnapshotPayload(
  docType: string,
  shipment: Partial<Shipment>,
  revision: number = 1,
): DocumentSnapshotPayload {
  const lineItems = calculateDocumentItems(shipment);
  const totals = calculateDocumentTotals(lineItems, shipment.currency || "USD");
  const docNumber = formatInstitutionalDocNumber(docType, shipment.reference || "EXP", revision);

  return {
    schemaVersion: "2.0",
    documentType: docType,
    documentNumber: docNumber,
    reference: shipment.reference || "EXP-000",
    revision,
    finalizedAt: new Date().toISOString(),
    exporter: {
      name: shipment.exporter || "PT. INDICO EXPORT INDONESIA",
      nib: shipment.nib || "9120001234567",
      npwp: shipment.npwp || "01.345.678.9-012.000",
      address:
        typeof shipment.letterheadText === "string" && shipment.letterheadText.trim()
          ? shipment.letterheadText
          : "Jl. Pelabuhan Nusantara No. 88, Makassar, Indonesia",
      contact: shipment.exporterContact || "Telp: +62 812 3456 7890 · Email: export@indicoexport.com",
      signatoryName: shipment.signatoryName || "Muhajirin Fatona",
      signatoryRole: shipment.signatoryRole || "Export Director",
    },
    buyer: {
      name: shipment.buyer || "Consignee International Ltd",
      address: shipment.buyerAddress || "123 Harbor Blvd, Gothenburg, Sweden",
      country: shipment.buyerCountry || "Sweden",
      picName: shipment.buyerPicName || undefined,
      picRole: shipment.buyerPicRole || undefined,
      phone: shipment.buyerPhone || undefined,
      email: shipment.buyerEmail || undefined,
    },
    consignee: {
      name: shipment.buyer || "Consignee International Ltd",
      address: shipment.buyerAddress || "123 Harbor Blvd, Gothenburg, Sweden",
      country: shipment.buyerCountry || "Sweden",
    },
    notifyParty: {
      name: shipment.buyer || "Consignee International Ltd",
      address: shipment.buyerAddress || "123 Harbor Blvd, Gothenburg, Sweden",
      contact: shipment.buyerEmail || undefined,
    },
    transport: {
      pol: "Port of Makassar, Indonesia",
      pod: shipment.destination || "Port of Gothenburg, Sweden",
      namedPlace: shipment.namedPlace || undefined,
      vesselName: shipment.vesselName || "KMTC SHIMIZU V.2611N",
      blNumber: shipment.blNumber || "KMTC-MKS0091827",
      containerNumber: shipment.containerNumber || "TGHU 2468135",
      sealNumber: shipment.sealNumber || "IDMKS998877",
      bookingNumber: shipment.bookingNumber || "KMTC-BKG-8899",
      containerType: shipment.containerType || "40HC",
    },
    commercialTerms: {
      incoterm: shipment.incoterm || "FOB",
      paymentTerms: shipment.paymentTerms || "30% DP / 70% before shipment",
      currency: shipment.currency || "USD",
      exchangeRate: shipment.exchangeRate,
      exchangeRateSource: shipment.exchangeRateSource,
    },
    lineItems,
    totals,
    banking: {
      bankName: shipment.bankName || "PT. Bank Mandiri (Persero) Tbk",
      bankAddress: shipment.bankAddress || "Jl. Boulevard, Panakkukang, Makassar, Indonesia",
      bankAccountNo: shipment.bankAccountNo || "152-00-9876543-2",
      bankSwift: shipment.bankSwift || "BMRIIDJA",
    },
    signatures: {
      sellerSignatureImage: shipment.sellerSignatureImage || undefined,
      sellerSignatureDate: shipment.sellerSignatureDate || new Date().toISOString().slice(0, 10),
      sellerVerificationCode: shipment.sellerVerificationCode || "IEI-DIGISIG-8849",
      buyerSignatureImage: shipment.buyerSignatureImage || undefined,
      buyerSignatureDate: shipment.buyerSignatureDate || undefined,
      buyerVerificationCode: shipment.buyerVerificationCode || "ABF-DIGISIG-1092",
      includeOfficialStamp: shipment.includeOfficialStamp ?? true,
      officialStampColor: shipment.officialStampColor || "red",
    },
    metadata: {
      paperSize: shipment.paperSize || "A4",
      orientation: shipment.documentOrientation || "Portrait",
      template: shipment.documentTemplate || "Classic Trade",
      language: shipment.previewLanguage || "English",
    },
  };
}

/**
 * Validasi kepatuhan dokumen institusional sebelum difinalisasi.
 */
export function validateExportDocument(
  docType: string,
  shipment: Partial<Shipment>,
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!shipment.reference?.trim()) {
    errors.push("Nomor referensi transaksi wajib diisi.");
  }
  if (!shipment.exporter?.trim()) {
    errors.push("Nama entitas eksportir wajib diisi.");
  }
  if (!shipment.buyer?.trim()) {
    errors.push("Nama pembeli / consignee luar negeri wajib diisi.");
  }

  const items = calculateDocumentItems(shipment);
  if (items.length === 0) {
    errors.push("Dokumen ekspor wajib memiliki minimal 1 line item barang.");
  }

  for (const item of items) {
    if (!item.description?.trim()) {
      errors.push(`Item #${item.itemNo}: Deskripsi komoditas tidak boleh kosong.`);
    }
    if (!item.hsCode?.trim() || item.hsCode === "0000.00.00") {
      warnings.push(`Item #${item.itemNo}: Kode HS belum diisi lengkap (standar 8-10 digit disarankan).`);
    }
    if (item.quantity <= 0) {
      errors.push(`Item #${item.itemNo}: Kuantitas barang harus lebih dari 0.`);
    }
    if (item.unitPrice <= 0 && docType !== "Packing List") {
      errors.push(`Item #${item.itemNo}: Harga satuan wajib lebih dari 0 untuk dokumen komersial.`);
    }
    if (item.netWeightKg <= 0 && docType === "Packing List") {
      warnings.push(`Item #${item.itemNo}: Berat neto belum terdefinisi pada Packing List.`);
    }
  }

  if (!shipment.incoterm) {
    errors.push("Term penyerahan barang (Incoterms® 2020) wajib dipilih.");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
