import type { DocumentRenderContext } from "./types";
import { formatNumber } from "@shared/format";

export interface ShippingInstructionData {
  title: string;
  siNumber: string;
  siDate: string;
  bookingNumber: string;
  carrierName: string;
  shipper: DocumentRenderContext["exporter"];
  consignee: DocumentRenderContext["buyer"];
  notifyParty?: DocumentRenderContext["notifyParty"];
  routing: DocumentRenderContext["routing"];
  freightTerm: string; // "FREIGHT PREPAID" | "FREIGHT COLLECT"
  blType: string; // "ORIGINAL 3/3" | "TELEX RELEASE" | "SEA WAYBILL"
  lineItems: DocumentRenderContext["lineItems"];
  totals: DocumentRenderContext["totals"];
  specialInstructions: string[];
}

export function buildShippingInstructionData(ctx: DocumentRenderContext): ShippingInstructionData {
  const isId = ctx.language === "id";
  const { lineItems, totals, routing, incoterm } = ctx;

  const isPrepaid = incoterm.startsWith("CIF") || incoterm.startsWith("CFR") || incoterm.startsWith("CIP") || incoterm.startsWith("CPT");
  const freightTerm = isPrepaid ? "FREIGHT PREPAID" : "FREIGHT COLLECT";

  return {
    title: isId ? "INSTRUKSI PENGAPALAN (SHIPPING INSTRUCTION)" : "SHIPPING INSTRUCTION (OCEAN B/L)",
    siNumber: ctx.documentNumber,
    siDate: ctx.date,
    bookingNumber: `BKG-${(routing.vesselName || "KMTC").substring(0, 4).toUpperCase()}-2026-881`,
    carrierName: routing.carrierName || "KMTC / MAERSK LINE / OCEAN NETWORK EXPRESS",
    shipper: ctx.exporter,
    consignee: ctx.buyer,
    notifyParty: ctx.notifyParty || {
      name: "SAME AS CONSIGNEE",
      address: ctx.buyer.address,
      country: ctx.buyer.country,
    },
    routing: ctx.routing,
    freightTerm,
    blType: "3/3 ORIGINAL BILL OF LADING",
    lineItems: ctx.lineItems,
    totals: ctx.totals,
    specialInstructions: [
      isId
        ? "Harap terbitkan 3/3 Original Bill of Lading dan 3 Non-Negotiable Copies."
        : "Please issue 3/3 Original Ocean Bills of Lading and 3 Non-Negotiable copies.",
      isId
        ? "Wadah peti kemas harus laik laut, bersih, dan bebas bau asing sebelum dimuat."
        : "Containers must be seaworthy, completely clean, odor-free, dry and sweeped before cargo loading.",
      isId
        ? `Freight Term dinyatakan sebagai '${freightTerm}'. Semua biaya D/O dan THC di pelabuhan muat menjadi beban Shipper.`
        : `Freight payable term to be stated as '${freightTerm}'. Loading port THC and origin documentation on Shipper's account.`,
      isId
        ? "Sertifikat Fumigasi dan Phyto wajib dilampirkan sebelum kapal bertolak."
        : "Fumigation and Phytosanitary Certificates must accompany cargo manifest prior to vessel sailing.",
    ],
  };
}
