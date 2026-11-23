import type { Shipment } from "@shared/shipment";
import type {
  DocumentLineItem,
  DocumentTotals,
  DocumentSnapshotPayload,
} from "@shared/documentEngine";

export type {
  DocumentLineItem,
  DocumentTotals,
  DocumentSnapshotPayload,
};

export type InstitutionalDocumentType =
  | "Sales Contract"
  | "Commercial Invoice"
  | "Packing List"
  | "Certificate of Origin"
  | "Shipping Instruction"
  | "Proforma Invoice"
  | "Bill of Lading";

export interface PartyInfo {
  name: string;
  address: string;
  city?: string;
  country: string;
  taxId?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  contactRole?: string;
}

export interface BankInfo {
  bankName: string;
  branchName?: string;
  accountName: string;
  accountNumber: string;
  swiftCode: string;
  currency: string;
}

export interface RoutingInfo {
  pol: string;
  pod: string;
  finalDestination?: string;
  vesselName?: string;
  voyageNumber?: string;
  etd?: string;
  eta?: string;
  containerNumber?: string;
  sealNumber?: string;
  carrierName?: string;
}

export interface DocumentRenderContext {
  documentType: InstitutionalDocumentType;
  documentNumber: string;
  date: string;
  reference: string;
  revision: number;
  exporter: PartyInfo;
  buyer: PartyInfo;
  notifyParty?: PartyInfo;
  routing: RoutingInfo;
  incoterm: string;
  paymentTerms: string;
  bank?: BankInfo;
  lineItems: DocumentLineItem[];
  totals: DocumentTotals;
  notes?: string;
  specialTerms?: string;
  language: "en" | "id";
  paperSize?: string;
}

export interface DocumentSection {
  id: string;
  title: string;
  content: string;
  order: number;
}
