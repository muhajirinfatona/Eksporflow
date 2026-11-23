import type { DocumentRenderContext } from "./types";
import { formatMoney, formatNumber } from "@shared/format";

export interface CertificateOfOriginBox12 {
  certificateNumber: string;
  formType: string; // e.g. "FORM AK", "FORM D", "ORDINARY COO"
  box1_exporter: {
    name: string;
    address: string;
    country: string;
  };
  box2_consignee: {
    name: string;
    address: string;
    country: string;
  };
  box3_transport: {
    departureDate: string;
    vesselVoyage: string;
    portOfLoading: string;
    portOfDischarge: string;
  };
  box4_officialUse: string;
  box5_to_box9_items: Array<{
    itemNumber: number;
    marksAndNumbers: string;
    packageAndDescription: string;
    hsCode: string;
    originCriterion: string;
    grossWeightAndQuantity: string;
    fobValue?: string;
  }>;
  box10_invoice: {
    invoiceNumber: string;
    invoiceDate: string;
  };
  box11_declaration: {
    exporterCompany: string;
    declaredBy: string;
    placeAndDate: string;
    signatureText: string;
  };
  box12_certification: {
    issuingAuthority: string;
    placeAndDate: string;
    certifyingOfficer: string;
    stampNotes: string;
  };
}

export function buildCertificateOfOriginData(ctx: DocumentRenderContext): CertificateOfOriginBox12 {
  const isId = ctx.language === "id";
  const { lineItems, totals, routing } = ctx;

  const invoiceNumber = ctx.documentNumber.replace("COO/", "INV/");
  const departureDate = routing.etd || ctx.date;
  const vesselVoyage = `${routing.vesselName || "MV ORIENT SKY"} / V.${routing.voyageNumber || "2408W"}`;

  const items = lineItems.map((item, index) => {
    return {
      itemNumber: index + 1,
      marksAndNumbers: item.marksAndNumbers,
      packageAndDescription: `${item.packagingType} OF ${item.description}\n(HS CODE: ${item.hsCode})`,
      hsCode: item.hsCode,
      originCriterion: "WO", // Wholly Obtained in Indonesia
      grossWeightAndQuantity: `${formatNumber(item.grossWeightKg)} KG G.W.\n(${formatNumber(item.netWeightKg)} KG N.W.)\n${formatNumber(item.quantity)} PKGS`,
      fobValue: `${totals.currency} ${formatMoney(item.totalAmount, totals.currency)}`,
    };
  });

  return {
    certificateNumber: ctx.documentNumber,
    formType: isId ? "SURAT KETERANGAN ASAL (CERTIFICATE OF ORIGIN)" : "CERTIFICATE OF ORIGIN (FORM AK / ORDINARY)",
    box1_exporter: {
      name: ctx.exporter.name,
      address: ctx.exporter.address,
      country: ctx.exporter.country,
    },
    box2_consignee: {
      name: ctx.buyer.name,
      address: ctx.buyer.address,
      country: ctx.buyer.country,
    },
    box3_transport: {
      departureDate,
      vesselVoyage,
      portOfLoading: routing.pol || "Tanjung Priok, Jakarta, Indonesia",
      portOfDischarge: routing.pod || "Jebel Ali, Dubai, UAE",
    },
    box4_officialUse: isId
      ? "Preferential Tariff Treatment Accorded under Trade Agreement"
      : "Preferential Tariff Treatment Accorded / General Certificate of Origin",
    box5_to_box9_items: items,
    box10_invoice: {
      invoiceNumber,
      invoiceDate: ctx.date,
    },
    box11_declaration: {
      exporterCompany: ctx.exporter.name,
      declaredBy: ctx.exporter.contactPerson || "Authorized Managing Director",
      placeAndDate: `Jakarta, Indonesia, ${ctx.date}`,
      signatureText: isId
        ? "Dengan ini menyatakan bahwa rincian di atas adalah benar dan semua barang diproduksi di Indonesia dan memenuhi persyaratan asal barang."
        : "The undersigned hereby declares that the above details and statements are correct; that all the goods were produced in INDONESIA and that they comply with the origin requirements specified for those goods.",
    },
    box12_certification: {
      issuingAuthority: "MINISTRY OF TRADE OF THE REPUBLIC OF INDONESIA / KADIN INDONESIA",
      placeAndDate: `Jakarta, Indonesia, ${ctx.date}`,
      certifyingOfficer: "Head of Export Documentation Department",
      stampNotes: isId
        ? "Disahkan secara resmi oleh Instansi Penerbit SKA (IPSKA) Republik Indonesia."
        : "Officially certified and stamped by the Issuing Authority (IPSKA), Republic of Indonesia.",
    },
  };
}
