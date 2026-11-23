import type { DocumentRenderContext } from "./types";
import { formatNumber } from "@shared/format";

export interface PackingListData {
  title: string;
  packingListNumber: string;
  packingListDate: string;
  invoiceReference: string;
  contractReference: string;
  exporter: DocumentRenderContext["exporter"];
  consignee: DocumentRenderContext["buyer"];
  notifyParty?: DocumentRenderContext["notifyParty"];
  routing: DocumentRenderContext["routing"];
  containerSummary: {
    containerNumber: string;
    sealNumber: string;
    containerType: string;
    tareWeightKg: number;
  };
  lineItems: DocumentRenderContext["lineItems"];
  totals: DocumentRenderContext["totals"];
  notes: string;
}

export function buildPackingListData(ctx: DocumentRenderContext): PackingListData {
  const isId = ctx.language === "id";
  const { lineItems, totals, routing } = ctx;

  const containerNumber = routing.containerNumber || "TGHU-7654321";
  const sealNumber = routing.sealNumber || "ML-ID998811";

  return {
    title: isId ? "DAFTAR KEMASAN (PACKING LIST)" : "PACKING LIST",
    packingListNumber: ctx.documentNumber,
    packingListDate: ctx.date,
    invoiceReference: ctx.documentNumber.replace("PL/", "INV/"),
    contractReference: ctx.reference,
    exporter: ctx.exporter,
    consignee: ctx.buyer,
    notifyParty: ctx.notifyParty || {
      name: "SAME AS CONSIGNEE",
      address: ctx.buyer.address,
      country: ctx.buyer.country,
    },
    routing: ctx.routing,
    containerSummary: {
      containerNumber,
      sealNumber,
      containerType: "1 x 20' FCL Dry Container",
      tareWeightKg: 2200,
    },
    lineItems: ctx.lineItems,
    totals: ctx.totals,
    notes: isId
      ? "Seluruh muatan dikemas rapi, disterilkan dan difumigasi sesuai standar fitosanitari internasional ISPM #15. Kemasan dalam keadaan utuh, bersih, dan laik laut (seaworthy)."
      : "All cargo is properly packed, palletized, strapped, and fumigated in compliance with international phytosanitary standards ISPM #15. Clean, sound, dry, and seaworthy packing.",
  };
}
