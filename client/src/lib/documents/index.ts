import type { Shipment, DocumentType } from "@shared/shipment";
import {
  calculateDocumentItems,
  calculateDocumentTotals,
  formatInstitutionalDocNumber,
  canonicalJsonStringify,
  computePayloadHash,
  verifyPayloadHash,
  buildDocumentSnapshotPayload,
} from "@shared/documentEngine";
import type {
  DocumentLineItem,
  DocumentTotals,
  DocumentSnapshotPayload,
  DocumentRenderContext,
  InstitutionalDocumentType,
} from "./types";

export * from "./types";
export * from "./salesContract";
export * from "./commercialInvoice";
export * from "./packingList";
export * from "./certificateOfOrigin";
export * from "./shippingInstruction";

export {
  calculateDocumentItems,
  calculateDocumentTotals,
  formatInstitutionalDocNumber,
  canonicalJsonStringify,
  computePayloadHash,
  verifyPayloadHash,
  buildDocumentSnapshotPayload,
};

/**
 * Membangun context terstruktur dokumen institusional dari objek Shipment.
 */
export function createDocumentRenderContext(
  shipment: Shipment,
  docType: DocumentType | InstitutionalDocumentType,
  options?: {
    revision?: number;
    language?: "en" | "id";
    paperSize?: string;
    overrideItems?: DocumentLineItem[];
  },
): DocumentRenderContext {
  const revision = options?.revision ?? 1;
  const isIndonesian = options?.language === "id" || shipment.previewLanguage === "Bahasa Indonesia";
  const language: "en" | "id" = isIndonesian ? "id" : "en";
  const lineItems = options?.overrideItems ?? calculateDocumentItems(shipment);
  const totals = calculateDocumentTotals(lineItems, shipment.currency || "USD");
  const docNumber = formatInstitutionalDocNumber(docType, shipment.reference || "EXP", revision);

  const today = new Date().toISOString().split("T")[0];

  const exporterName = shipment.exporter || "PT INDO EKSPOR INTERNASIONAL";
  const exporterAddress = shipment.letterheadText || shipment.exporterContact || "Gedung Bursa Efek Indonesia, Tower 2, Jakarta Selatan, 12190";
  const buyerName = shipment.buyer || "AL-BARAKAH FOODS TRADING LLC";
  const buyerAddress = shipment.buyerAddress || "Warehouse 4B, Dubai Wholesale City, P.O. Box 9876";
  const pol = shipment.namedPlace || "Tanjung Priok, Jakarta (IDTPP)";
  const pod = shipment.destination || "Jebel Ali, Dubai (AEJEA)";

  return {
    documentType: docType as InstitutionalDocumentType,
    documentNumber: docNumber,
    date: today,
    reference: shipment.reference || "EXP-001",
    revision,
    exporter: {
      name: exporterName,
      address: exporterAddress,
      city: "Jakarta",
      country: "Indonesia",
      taxId: "01.234.567.8-012.000",
      phone: "+62 21 515 0555",
      email: "export@indoekspor.co.id",
      contactPerson: shipment.signatoryName || "Bambang Wijaya",
      contactRole: shipment.signatoryRole || "Managing Director",
    },
    buyer: {
      name: buyerName,
      address: buyerAddress,
      country: shipment.buyerCountry || "United Arab Emirates",
      phone: shipment.buyerPhone || "+971 4 888 1234",
      email: shipment.buyerEmail || "purchasing@albarakahfoods.ae",
      contactPerson: shipment.buyerPicName || "Tariq Mansoor",
      contactRole: shipment.buyerPicRole || "Procurement Director",
    },
    notifyParty: {
      name: "SAME AS CONSIGNEE",
      address: buyerAddress,
      country: shipment.buyerCountry || "United Arab Emirates",
    },
    routing: {
      pol,
      pod,
      finalDestination: pod,
      vesselName: shipment.vesselName || "MV KMTC JAKARTA",
      voyageNumber: "2412W",
      etd: today,
      eta: today,
      containerNumber: shipment.containerNumber || "TGHU-9988776",
      sealNumber: shipment.sealNumber || "ID-SEAL-8899",
      carrierName: "KMTC / OCEAN NETWORK EXPRESS",
    },
    incoterm: shipment.incoterm || "FOB",
    paymentTerms: shipment.paymentTerms || "30% T/T Advance, 70% against B/L Copy",
    bank: {
      bankName: shipment.bankName || "PT Bank Central Asia Tbk",
      branchName: shipment.bankAddress || "KCU Thamrin, Jakarta",
      accountName: exporterName,
      accountNumber: shipment.bankAccountNo || "206-8899-001",
      swiftCode: shipment.bankSwift || "CENAIDJA",
      currency: shipment.currency || "USD",
    },
    lineItems,
    totals,
    specialTerms: shipment.contractSpecialTerms,
    language,
    paperSize: options?.paperSize || shipment.paperSize || "A4",
  };
}
