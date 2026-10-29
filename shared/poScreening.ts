import type { Incoterm } from "./shipment";

export type BuyerScreeningStatus = "verified" | "warning" | "high_risk";

export type BuyerScreeningValidation = {
  score: number; // 0 - 100
  status: BuyerScreeningStatus;
  legalEntityStatus: string;
  sanctionCheck: string;
  paymentTermRisk: string;
  summary: string;
  recommendations: string[];
};

export type PoScreeningResult = {
  reference: string;
  buyer: string;
  buyerCountry: string;
  destination: string;
  product: string;
  hsCode: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  currency: string;
  incoterm: Incoterm;
  paymentTerms: string;
  validation: BuyerScreeningValidation;
};

export const SAMPLE_POS = [
  {
    id: "nordic",
    title: "Nordic Pantry AB (Swedia · Gula Kelapa)",
    fileName: "PO-2026-SE-089_NordicPantry.pdf",
    text: `PURCHASE ORDER
PO Number: PO-2026/SE-089
Date: 28 October 2026

Buyer / Importer:
Nordic Pantry AB (Reg. No: SE-556123-9981)
Hamngatan 12, 411 17 Gothenburg, Sweden
Email: procurement@nordicpantry.se
Contact: Sofia Lindqvist

Destination / Port of Discharge: Port of Gothenburg, Sweden
Delivery Terms: CIF Gothenburg (Incoterms 2020)

Order Items:
1. Item Description: Organic Coconut Sugar (Grade A Granulated)
   HS Code: 1702.90
   Quantity: 2,400 cartons (each carton 10 kg net)
   Unit Price: USD 18.50 per carton
   Total Amount: USD 44,400.00

Payment Terms:
30% Down Payment by T/T upon Proforma Invoice confirmation.
70% balance payment against presentation of complete non-negotiable Bill of Lading (B/L) copy.`,
  },
  {
    id: "kyoto",
    title: "Kyoto Trading Co., Ltd. (Jepang · Biji Kopi)",
    fileName: "PO-JP-8841_KyotoTrading.pdf",
    text: `PURCHASE ORDER
PO Number: PO-JP-8841
Date: 26 October 2026

Buyer / Importer:
Kyoto Trading Co., Ltd. (Corporation ID: JP-0118-202)
Karasuma-dori 45, Nakagyo-ku, Kyoto 604-8136, Japan
Email: trade-ops@kyototrading.co.jp
Contact: Kenji Takahashi

Destination / Port of Discharge: Port of Tokyo / Yokohama, Japan
Delivery Terms: FOB Tanjung Priok, Jakarta (Incoterms 2020)

Order Items:
1. Item Description: Specialty Arabica Green Coffee Beans (Gayo Grade 1)
   HS Code: 0901.11
   Quantity: 300 jute bags (each 60 kg net weight)
   Unit Price: USD 7.20 per kg (Total 18,000 kg)
   Total Amount: USD 129,600.00

Payment Terms:
100% Irrevocable Letter of Credit (L/C) at sight confirmed by reputable international bank.`,
  },
  {
    id: "hamburg",
    title: "Hamburg Organic Spices GmbH (Jerman · Cengkeh)",
    fileName: "PO-DE-4412_HamburgSpices.pdf",
    text: `PURCHASE ORDER
PO Number: PO-DE-4412
Date: 24 October 2026

Buyer / Importer:
Hamburg Organic Spices GmbH (HRB 88392 Amtsgericht Hamburg)
Speicherstadt 8, 20457 Hamburg, Germany
Email: import@hamburgspices.de
Contact: Markus Weber

Destination / Port of Discharge: Port of Hamburg, Germany
Delivery Terms: CFR Hamburg (Incoterms 2020)

Order Items:
1. Item Description: Organic Whole Cloves (Lal Pari Quality)
   HS Code: 0907.10
   Quantity: 500 cartons (each carton 20 kg)
   Unit Price: USD 12.00 per kg (Total 10,000 kg)
   Total Amount: USD 120,000.00

Payment Terms:
40% T/T Advance Deposit, 60% balance payable within 5 days after Bill of Lading issuance and vessel sailing notification.`,
  },
];

/**
 * Parsing teks PO dan menjalankan evaluasi screening AI Advisor terhadap profil legal buyer,
 * negara tujuan, pelabuhan, sanksi perdagangan, dan keamanan klausul pembayaran.
 */
export function parsePoTextAndScreen(text: string, fileName?: string): PoScreeningResult {
  const clean = text || "";

  // 1. Ekstraksi PO Reference
  const poMatch =
    clean.match(/(?:PO\s*(?:Number|No\.?|#)?\s*[:=\-]?\s*)([A-Z0-9\/\-_]+)/i) ||
    clean.match(/([A-Z]{2,4}-[0-9]{4}[A-Z0-9\/\-_]*)/i);
  const reference = poMatch ? poMatch[1].trim() : "PO-" + new Date().getFullYear() + "/01";

  // 2. Ekstraksi Nama Buyer
  const buyerOnNextLine = clean.match(/(?:Buyer|Importer|Purchaser|Customer|Bill To)[^\n:]*:\s*\r?\n\s*([^\n\r(]+)/i);
  const buyerSameLine = clean.match(/(?:Buyer|Importer|Purchaser|Customer|Bill To)\s*[:=\-]\s*([^\n\r(]+)/i);
  let buyer = (buyerOnNextLine ? buyerOnNextLine[1] : buyerSameLine ? buyerSameLine[1] : "").trim();
  buyer = buyer.replace(/^\/\s*[a-zA-Z]+\s*[:=]?\s*/i, "").trim();

  if (!buyer || buyer.length < 3 || /^(importer|purchaser|buyer)$/i.test(buyer)) {
    if (clean.includes("Nordic Pantry")) buyer = "Nordic Pantry AB";
    else if (clean.includes("Kyoto Trading")) buyer = "Kyoto Trading Co., Ltd.";
    else if (clean.includes("Hamburg Organic")) buyer = "Hamburg Organic Spices GmbH";
    else buyer = "International Trade Buyer";
  }

  // 3. Ekstraksi Negara Buyer
  let buyerCountry = "Jepang";
  if (/Sweden|Swedia|Gothenburg|Stockholm/i.test(clean)) buyerCountry = "Swedia";
  else if (/Japan|Jepang|Tokyo|Yokohama|Kyoto|Osaka/i.test(clean)) buyerCountry = "Jepang";
  else if (/Germany|Jerman|Hamburg|Bremen|Berlin/i.test(clean)) buyerCountry = "Jerman";
  else if (/USA|United States|America|Amerika|Long Beach|Los Angeles|New York/i.test(clean)) buyerCountry = "Amerika Serikat";
  else if (/Netherlands|Belanda|Rotterdam|Amsterdam/i.test(clean)) buyerCountry = "Belanda";
  else if (/Singapore|Singapura/i.test(clean)) buyerCountry = "Singapura";
  else if (/Malaysia|Kuala Lumpur|Port Klang/i.test(clean)) buyerCountry = "Malaysia";
  else if (/Australia|Sydney|Melbourne|Brisbane/i.test(clean)) buyerCountry = "Australia";

  // 4. Ekstraksi Pelabuhan Bongkar (POD / Destination)
  const podMatch = clean.match(/(?:Port of Discharge|Destination|Delivery Port|POD|Discharge Port)\s*[:=\-]?\s*([^\n\r]+)/i);
  let destination = podMatch ? podMatch[1].trim() : "";
  if (!destination) {
    if (buyerCountry === "Swedia") destination = "Port of Gothenburg";
    else if (buyerCountry === "Jepang") destination = "Port of Tokyo";
    else if (buyerCountry === "Jerman") destination = "Port of Hamburg";
    else if (buyerCountry === "Amerika Serikat") destination = "Port of Long Beach";
    else destination = "Port of Discharge";
  }

  // 5. Ekstraksi Komoditas & HS Code
  const hsMatch = clean.match(/(?:HS\s*Code|Harmonized Code|HS|Tariff)\s*[:=\-]?\s*([0-9]{4}(?:\.[0-9]{2})?)/i);
  let hsCode = hsMatch ? hsMatch[1].trim() : "";
  let product = "Komoditas Ekspor";

  if (/Coconut Sugar|Gula Kelapa/i.test(clean)) {
    product = "Organic Coconut Sugar";
    if (!hsCode) hsCode = "1702.90";
  } else if (/Coffee|Kopi|Arabica|Robusta/i.test(clean)) {
    product = "Specialty Coffee Beans";
    if (!hsCode) hsCode = "0901.11";
  } else if (/Clove|Cengkeh|Spices|Rempah/i.test(clean)) {
    product = "Organic Whole Cloves";
    if (!hsCode) hsCode = "0907.10";
  } else if (/Cocoa|Cokelat|Cacao/i.test(clean)) {
    product = "Fermented Cocoa Beans";
    if (!hsCode) hsCode = "1801.00";
  }
  if (!hsCode) hsCode = "0901.11";

  // 6. Ekstraksi Kuantitas & Harga
  const qtyMatch = clean.match(/(?:Quantity|Qty)\s*[:=\-]?\s*([0-9.,]+)\s*([a-zA-Z]+)?/i);
  const quantity = qtyMatch ? parseFloat(qtyMatch[1].replace(/,/g, "")) || 2400 : 2400;
  const unit = qtyMatch && qtyMatch[2] ? qtyMatch[2].toLowerCase() : "carton";

  const priceMatch = clean.match(/(?:Unit Price|Price per [a-zA-Z]+|Price)\s*[:=\-]?\s*(?:USD|\$|EUR|€)?\s*([0-9.,]+)/i);
  const unitPrice = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, "")) || 18.5 : 18.5;

  // 7. Ekstraksi Incoterms
  let incoterm: Incoterm = "FOB";
  if (/\bCIF\b/i.test(clean)) incoterm = "CIF";
  else if (/\bCFR\b/i.test(clean)) incoterm = "CFR";
  else if (/\bFOB\b/i.test(clean)) incoterm = "FOB";
  else if (/\bFCA\b/i.test(clean)) incoterm = "FCA";
  else if (/\bEXW\b/i.test(clean)) incoterm = "EXW";
  else if (/\bDAP\b/i.test(clean)) incoterm = "DAP";
  else if (/\bDDP\b/i.test(clean)) incoterm = "DDP";

  // 8. Ekstraksi Payment Terms
  const payMatch = clean.match(/(?:Payment Terms?|Terms of Payment)\s*[:=\-]?\s*([^\n\r]+(?:\n[^\n\r]+)?)/i);
  const paymentTerms = payMatch ? payMatch[1].replace(/\s+/g, " ").trim() : "30% Down Payment / 70% against B/L copy";

  // 9. AI ADVISOR SCREENING EVALUATION
  // Validasi Badan Hukum
  const hasLegalSuffix = /\b(AB|GmbH|Ltd|LLC|Inc|Corporation|S\.A\.|S\.p\.A\.|Sdn\s*Bhd|Pte\s*Ltd|AG|Oy|BV)\b/i.test(buyer);
  const hasCorporateEmail = /@[a-zA-Z0-9.-]+\.(se|jp|de|com|org|co\.uk|co\.jp|eu|net)/i.test(clean) && !/@(gmail|yahoo|hotmail|outlook)\.com/i.test(clean);
  const hasRegNumber = /(?:Reg\.?\s*No|HRB|Corporation ID|EIN|VAT|Company No)/i.test(clean);

  // Analisis Pembayaran & Risiko
  const hasAdvanceOrLC = /(?:Down Payment|DP|Advance|Deposit|Letter of Credit|L\/C)/i.test(paymentTerms);
  const isHighRiskPayment = /(?:100%\s*CAD|Open Account\s*(?:60|90)|Cash Against Documents\s*100%|DA\s*90)/i.test(paymentTerms);

  // Cek Sanksi
  const isSanctionedCountry = /(?:North Korea|Iran|Syria|Russia|Cuba|Belarus)/i.test(buyerCountry) || /(?:Vladivostok|St\. Petersburg|Novorossiysk)/i.test(destination);

  let score = 92;
  let status: BuyerScreeningStatus = "verified";
  const recommendations: string[] = [];

  if (hasLegalSuffix) {
    score += 4;
  } else {
    score -= 15;
    recommendations.push("Minta sertifikat pendaftaran perusahaan resmi (Certificate of Incorporation) karena nama buyer tidak memiliki akhiran badan hukum standar.");
  }

  if (hasCorporateEmail || hasRegNumber) {
    score += 4;
  } else {
    score -= 10;
    recommendations.push("Konfirmasi alamat kantor fisik dan nomor registrasi pajak perusahaan buyer untuk menghindari penipuan perantara gelap.");
  }

  if (isHighRiskPayment) {
    score -= 40;
    status = "high_risk";
    recommendations.push("PERINGATAN KRUSIAL: Syarat pembayaran tanpa DP/LC berisiko gagal bayar tinggi. Ubah syarat menjadi minimal 30% Down Payment sebelum kargo dimuat.");
  } else if (!hasAdvanceOrLC) {
    score -= 20;
    status = "warning";
    recommendations.push("Negosiasikan pembayaran uang muka (DP) minimal 30% atau L/C at sight agar modal produksi kargo terlindungi.");
  }

  if (isSanctionedCountry) {
    score = Math.min(score, 30);
    status = "high_risk";
    recommendations.push("Kawasan tujuan terindikasi sanksi embargo perdagangan internasional. Konsultasikan dengan bank devisa sebelum menandatangani kontrak.");
  }

  score = Math.max(15, Math.min(99, score));
  if (score >= 85) status = "verified";
  else if (score >= 60) status = "warning";
  else status = "high_risk";

  if (recommendations.length === 0) {
    recommendations.push("Profil buyer berbadan hukum legal terverifikasi. Terbitkan Proforma Invoice resmi sesuai nomor PO ini.");
    recommendations.push("Pastikan klausul pelunasan 70% selaras dengan tanggal estimasi keberangkatan kapal (ETD).");
  }

  const legalEntityStatus = hasLegalSuffix
    ? `Entitas Legal Terverifikasi (${buyer.match(/\b(AB|GmbH|Ltd|LLC|Inc|Corporation|S\.A\.|S\.p\.A\.|Sdn\s*Bhd|Pte\s*Ltd|AG|Oy|BV)\b/i)?.[0] || "Korporasi"})`
    : "Format nama perusahaan belum menyertakan tipe badan hukum";

  const sanctionCheck = isSanctionedCountry
    ? "Peringatan: Wilayah tujuan terindikasi sanksi embargo perdagangan"
    : `Bebas Sanksi Dagang Internasional (Rute Indonesia ➔ ${buyerCountry})`;

  const paymentTermRisk = isHighRiskPayment
    ? "Risiko Tinggi: Tanpa jaminan uang muka (DP) atau L/C bank"
    : hasAdvanceOrLC
      ? "Risiko Rendah: Terdapat klausul DP / L/C bank yang melindungi eksportir"
      : "Risiko Sedang: Perlu penegasan batas waktu pembayaran";

  const summary =
    status === "verified"
      ? `AI Advisor memvalidasi dokumen PO "${reference}" dari ${buyer} (${buyerCountry}). Parameter badan hukum, pelabuhan bongkar ${destination}, dan komoditas siap disinkronkan ke seluruh modul EksporFlow.`
      : status === "warning"
        ? `PO "${reference}" teridentifikasi, namun disarankan melengkapi verifikasi klausul pembayaran dan izin dagang buyer sebelum memulai muatan kontainer.`
        : `Waspada: Terdeteksi poin risiko tinggi pada klausul pembayaran atau yurisdiksi dokumen PO ini. Tinjau rekomendasi mitigasi AI sebelum melanjutkan.`;

  return {
    reference,
    buyer,
    buyerCountry,
    destination,
    product,
    hsCode,
    quantity,
    unit,
    unitPrice,
    currency: "USD",
    incoterm,
    paymentTerms,
    validation: {
      score,
      status,
      legalEntityStatus,
      sanctionCheck,
      paymentTermRisk,
      summary,
      recommendations,
    },
  };
}
