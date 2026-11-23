import type { DocumentRenderContext } from "./types";
import { formatMoney, formatNumber } from "@shared/format";

export interface CommercialInvoiceData {
  title: string;
  invoiceNumber: string;
  invoiceDate: string;
  contractNumber: string;
  poNumber?: string;
  lcNumber?: string;
  exporter: DocumentRenderContext["exporter"];
  consignee: DocumentRenderContext["buyer"];
  notifyParty?: DocumentRenderContext["notifyParty"];
  routing: DocumentRenderContext["routing"];
  incoterm: string;
  paymentTerms: string;
  bank?: DocumentRenderContext["bank"];
  lineItems: DocumentRenderContext["lineItems"];
  totals: DocumentRenderContext["totals"];
  certificationDeclaration: string;
}

export function buildCommercialInvoiceData(ctx: DocumentRenderContext): CommercialInvoiceData {
  const isId = ctx.language === "id";
  const { lineItems, totals, routing, incoterm, paymentTerms, bank } = ctx;

  const declaration = isId
    ? "Dengan ini kami menyatakan bahwa faktur komersial ini benar dan sah, harga yang tercantum adalah nilai transaksi sebenarnya sesuai kontrak, serta barang sepenuhnya berasal dan diproduksi di Indonesia."
    : "We hereby certify that this commercial invoice is true and correct, that the particulars and prices are strictly in accordance with our sales contract, and that the goods are wholly produced and manufactured in the Republic of Indonesia.";

  return {
    title: isId ? "FAKTUR KOMERSIAL (COMMERCIAL INVOICE)" : "COMMERCIAL INVOICE",
    invoiceNumber: ctx.documentNumber,
    invoiceDate: ctx.date,
    contractNumber: ctx.reference,
    poNumber: ctx.reference,
    exporter: ctx.exporter,
    consignee: ctx.buyer,
    notifyParty: ctx.notifyParty || {
      name: "SAME AS CONSIGNEE",
      address: ctx.buyer.address,
      country: ctx.buyer.country,
    },
    routing: ctx.routing,
    incoterm: ctx.incoterm,
    paymentTerms: ctx.paymentTerms,
    bank: ctx.bank,
    lineItems: ctx.lineItems,
    totals: ctx.totals,
    certificationDeclaration: declaration,
  };
}
