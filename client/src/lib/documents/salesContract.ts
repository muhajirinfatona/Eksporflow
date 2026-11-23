import type { DocumentRenderContext } from "./types";
import { formatMoney, formatNumber } from "@shared/format";

export interface SalesContractData {
  title: string;
  contractNumber: string;
  contractDate: string;
  seller: {
    companyName: string;
    address: string;
    city?: string;
    country: string;
    phone?: string;
    email?: string;
    signatoryName: string;
    signatoryRole: string;
  };
  buyer: {
    companyName: string;
    address: string;
    city?: string;
    country: string;
    picName?: string;
    picRole?: string;
    phone?: string;
    email?: string;
  };
  articles: Array<{
    number: string;
    title: string;
    body: string;
  }>;
  dualSignature: {
    sellerLabel: string;
    buyerLabel: string;
  };
}

export function buildSalesContractArticles(ctx: DocumentRenderContext): SalesContractData["articles"] {
  const isId = ctx.language === "id";
  const { lineItems, totals, routing, incoterm, paymentTerms, bank } = ctx;

  const primaryItem = lineItems[0];
  const commodityList = lineItems.map((it) => it.description).join(", ");
  const currency = totals.currency || "USD";

  return [
    {
      number: isId ? "PASAL 1" : "ARTICLE 1",
      title: isId ? "KOMODITAS & SPESIFIKASI MUTU" : "COMMODITY & QUALITY SPECIFICATIONS",
      body: isId
        ? `Penjual sepakat untuk menjual dan Pembeli sepakat untuk membeli komoditas ekspor: ${commodityList}. Seluruh barang harus memenuhi standar mutu ekspor prima internasional, bebas dari hama kutu hidup dan jamur berbahaya, dikemas higienis, serta disertai sertifikat uji mutu resmi dari laboratorium independen terakreditasi.`
        : `The Seller agrees to sell and the Buyer agrees to buy the export commodities: ${commodityList}. All goods delivered under this Contract shall strictly conform to premium international export specifications, clean, free from live weevils, dangerous molds, or foreign matter, and certified by an accredited independent laboratory prior to vessel loading.`,
    },
    {
      number: isId ? "PASAL 2" : "ARTICLE 2",
      title: isId ? "KUANTITAS & TOLERANSI PENGAPALAN" : "QUANTITY & SHIPPING TOLERANCE",
      body: isId
        ? `Total kuantitas barang adalah ${formatNumber(totals.totalQuantity)} unit (${formatNumber(totals.totalNetWeightMT)} Metrik Ton Berat Bersih / ${formatNumber(totals.totalGrossWeightMT)} MT Berat Kotor). Toleransi kuantitas sebesar +/- 5% atas opsi Penjual diperkenankan sesuai dengan kapasitas muat peti kemas dan ketentuan liner shipping internasional.`
        : `Total quantity of goods under this Contract is ${formatNumber(totals.totalQuantity)} units (${formatNumber(totals.totalNetWeightMT)} Metric Tons Net Weight / ${formatNumber(totals.totalGrossWeightMT)} MT Gross Weight). A shipping tolerance of +/- 5% (more or less) at Seller's option is acceptable in accordance with container stowage factor and international liner terms.`,
    },
    {
      number: isId ? "PASAL 3" : "ARTICLE 3",
      title: isId ? "HARGA & KETENTUAN PENYERAHAN (INCOTERMS 2020)" : "TOTAL CONTRACT VALUE & INCOTERMS 2020",
      body: isId
        ? `Total nilai kontrak adalah ${currency} ${formatMoney(totals.totalAmount, currency)} (Terbilang: ${totals.amountInWords}). Ketentuan penyerahan barang disepakati berdasarkan Incoterms 2020 ${incoterm} (${routing.pol || "Indonesian Port"} / ${routing.pod || "Destination Port"}). Harga bersifat mengikat dan mencakup seluruh biaya pengemasan ekspor, fumigasi, dan bea keluar Indonesia.`
        : `The total contract price is ${currency} ${formatMoney(totals.totalAmount, currency)} (Say: ${totals.amountInWords}). Delivery terms are governed by Incoterms 2020 ${incoterm} (${routing.pol || "Indonesian Port"} to ${routing.pod || "Destination Port"}). The agreed prices are firm and fixed, encompassing export seaworthy packing, loading, fumigation, and Indonesian export clearance.`,
    },
    {
      number: isId ? "PASAL 4" : "ARTICLE 4",
      title: isId ? "SYARAT PEMBAYARAN & INSTRUKSI BANK" : "TERMS OF PAYMENT & BANKING DETAILS",
      body: isId
        ? `Pembayaran dilakukan melalui ${paymentTerms || "Irrevocable Letter of Credit (L/C) at sight / T/T Wire Transfer"}. Pembayaran ditransfer langsung ke rekening devisa Penjual:\n` +
          `• Nama Bank: ${bank?.bankName || "PT Bank Central Asia Tbk / Mandiri"}\n` +
          `• Cabang: ${bank?.branchName || "Jakarta International Banking Division"}\n` +
          `• Nomor Rekening: ${bank?.accountNumber || "888-000-168-999"}\n` +
          `• Pemegang Rekening: ${bank?.accountName || ctx.exporter.name}\n` +
          `• Kode SWIFT: ${bank?.swiftCode || "CENAIDJA / BMRIIDJA"}`
        : `Payment shall be effected by ${paymentTerms || "100% Irrevocable Letter of Credit (L/C) at sight or Wire Transfer T/T"}. Remittance shall be wired directly to the Seller's foreign currency account as specified below:\n` +
          `• Bank Name: ${bank?.bankName || "PT Bank Mandiri (Persero) Tbk / BCA"}\n` +
          `• Branch: ${bank?.branchName || "Main International Branch, Jakarta"}\n` +
          `• Account Number: ${bank?.accountNumber || "123-00-9988776-5"}\n` +
          `• Beneficiary Name: ${bank?.accountName || ctx.exporter.name}\n` +
          `• SWIFT Code: ${bank?.swiftCode || "BMRIIDJA / CENAIDJA"}`,
    },
    {
      number: isId ? "PASAL 5" : "ARTICLE 5",
      title: isId ? "PENGAPALAN, PELABUHAN & DOKUMENTASI" : "SHIPMENT, PORTS & SHIPPING DOCUMENTS",
      body: isId
        ? `Pengapalan dilakukan dari ${routing.pol || "Pelabuhan Muat Indonesia"} menuju ${routing.pod || "Pelabuhan Bongkar Tujuan"}. Pindah kapal (Transshipment) diizinkan, Pengapalan sebagian (Partial shipment) dilarang kecuali disepakati tertulis. Penjual wajib menyerahkan dokumen ekspor resmi lengkap: Full set 3/3 Original Ocean Bill of Lading, Commercial Invoice 3 lembar, Packing List 3 lembar, Certificate of Origin (Form AK/COO) resmi, Certificate of Analysis/Fumigation.`
        : `Shipment shall be effected from ${routing.pol || "Indonesian Port"} to ${routing.pod || "Destination Port"}. Transshipment is permitted; Partial shipment is prohibited unless mutually agreed in writing. Seller shall present full set of official export documents: 3/3 Clean on Board Ocean Bills of Lading, Signed Commercial Invoice in 3 originals, Packing List in 3 originals, Certificate of Origin, Certificate of Fumigation, and Certificate of Analysis.`,
    },
    {
      number: isId ? "PASAL 6" : "ARTICLE 6",
      title: isId ? "KEMASAN & TANDA PENGAPALAN" : "PACKAGING & SHIPPING MARKS",
      body: isId
        ? `Barang dikemas dalam kemasan standar ekspor laik laut (seaworthy export packing) anti lembab. Setiap kemasan diberi tanda pengapalan (shipping marks) yang jelas: Nama Pembeli, Negara Tujuan, Nomor Kontrak, dan Nomor Kemasan berurutan.`
        : `Goods shall be packed in strong seaworthy export packaging, resistant to moisture and rough ocean handling. Each package must bear clear indelible shipping marks: Buyer's mark, Port of Discharge, Contract Reference No, and Package sequence numbers.`,
    },
    {
      number: isId ? "PASAL 7" : "ARTICLE 7",
      title: isId ? "INSPEKSI & SERTIFIKASI INDEPENDEN" : "INSPECTION & SURVEYOR CERTIFICATION",
      body: isId
        ? `Sebelum pemuatan ke kapal, barang wajib diinspeksi oleh surveyor independen bertaraf internasional (PT Sucofindo / PT Surveyor Indonesia / SGS) di pelabuhan muat atas biaya Penjual. Sertifikat mutu dan timbang dari surveyor tersebut bersifat final dan mengikat kedua belah pihak.`
        : `Quality, quantity, and weight inspection shall be carried out at the loading port by an internationally recognized independent surveyor (SGS / Sucofindo / Cotecna) at Seller's expense. The Surveyor's Certificate of Quality and Weight shall be final and binding upon both parties.`,
    },
    {
      number: isId ? "PASAL 8" : "ARTICLE 8",
      title: isId ? "KEADAAN KAHAR (FORCE MAJEURE)" : "FORCE MAJEURE",
      body: isId
        ? `Kedua belah pihak dibebaskan dari tanggung jawab atas keterlambatan atau kegagalan pemenuhan kewajiban kontrak apabila diakibatkan oleh Keadaan Kahar (perang, bencana alam dahsyat, blokade pelabuhan, embargo perdagangan pemerintah). Pihak yang terdampak wajib memberitahukan pihak lainnya dalam waktu 14 (empat belas) hari kalender kalender disertai bukti otentik dari Kamar Dagang dan Industri (KADIN).`
        : `Neither party shall be held liable for delay or default in performance of this Contract caused by Force Majeure events (acts of God, war, blockades, major natural disasters, government export/import bans). The affected party shall notify the other party within 14 calendar days with valid proof issued by the competent Chamber of Commerce.`,
    },
    {
      number: isId ? "PASAL 9" : "ARTICLE 9",
      title: isId ? "HUKUM YANG BERLAKU & ARBITRASE" : "GOVERNING LAW & DISPUTE ARBITRATION",
      body: isId
        ? `Kontrak ini tunduk pada hukum perdagangan internasional dan Konvensi PBB tentang Kontrak Penjualan Barang Internasional (CISG). Segala sengketa yang timbul yang tidak dapat diselesaikan secara musyawarah dalam 30 hari akan diselesaikan melalui Arbitrase sesuai aturan Singapore International Arbitration Centre (SIAC) atau Badan Arbitrase Nasional Indonesia (BANI). Putusan arbitrase bersifat final dan berkekuatan hukum tetap.`
        : `This Contract shall be governed by and construed in accordance with international commercial trade laws and the UN Convention on Contracts for the International Sale of Goods (CISG). Any dispute arising out of or in connection with this Contract that cannot be settled amicably within 30 days shall be submitted to the Singapore International Arbitration Centre (SIAC) or BANI in accordance with its Arbitration Rules. The arbitral award shall be final and binding.`,
    },
  ];
}
