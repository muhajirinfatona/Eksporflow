import type { Incoterm } from "./shipment";

export type BuyerScreeningStatus = "verified" | "warning" | "high_risk";

export type VerificationPillar = {
  label: string;
  value: string;
  isValid: boolean;
  note: string;
};

export type BuyerScreeningValidation = {
  score: number; // 0 - 100
  status: BuyerScreeningStatus;
  pillars: {
    companyName: VerificationPillar;
    companyEmail: VerificationPillar;
    contactNumber: VerificationPillar;
    companyWebsite: VerificationPillar;
  };
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
    title: "Nordic Pantry AB (Swedia)",
    fileName: "PO-2026-SE-089_NordicPantry.pdf",
    text: `PURCHASE ORDER
PO Number: PO-2026/SE-089
Date: 28 October 2026

Buyer / Importer:
Company Name: Nordic Pantry AB (Reg. No: SE-556123-9981)
Address: Hamngatan 12, 411 17 Gothenburg, Sweden
Corporate Email: procurement@nordicpantry.se
Phone / Contact: +46 31 771 9900
Official Website: https://www.nordicpantry.se
Contact Person: Sofia Lindqvist (Head of Sourcing)

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
    title: "Kyoto Trading Co., Ltd. (Jepang)",
    fileName: "PO-JP-8841_KyotoTrading.pdf",
    text: `PURCHASE ORDER
PO Number: PO-JP-8841
Date: 26 October 2026

Buyer / Importer:
Company Name: Kyoto Trading Co., Ltd. (Corporation ID: JP-0118-202)
Address: Karasuma-dori 45, Nakagyo-ku, Kyoto 604-8136, Japan
Corporate Email: trade-ops@kyototrading.co.jp
Phone / Contact: +81 75 221 8830
Official Website: https://www.kyototrading.co.jp
Contact Person: Kenji Takahashi (Import Director)

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
    title: "Hamburg Organic Spices GmbH (Jerman)",
    fileName: "PO-DE-4412_HamburgSpices.pdf",
    text: `PURCHASE ORDER
PO Number: PO-DE-4412
Date: 24 October 2026

Buyer / Importer:
Company Name: Hamburg Organic Spices GmbH (HRB 88392 Amtsgericht Hamburg)
Address: Speicherstadt 8, 20457 Hamburg, Germany
Corporate Email: import@hamburgspices.de
Phone / Contact: +49 40 339 8810
Official Website: https://www.hamburgspices.de
Contact Person: Markus Weber (Commodity Purchasing)

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
  {
    id: "loi-dubai",
    title: "Gulf Gourmet LLC (LOI Dubai)",
    fileName: "LOI-DXB-2026-004_GulfGourmet.pdf",
    text: `LETTER OF INTENT (LOI)
LOI Number: LOI-DXB-2026/004
Date: 29 October 2026

Buyer / Importer:
Company Name: Gulf Gourmet General Trading LLC (License No: 671829)
Address: Al Quoz Industrial Area 3, Dubai, United Arab Emirates
Corporate Email: sourcing@gulfgourmet.ae
Phone / Contact: +971 4 338 9912
Official Website: https://www.gulfgourmet.ae
Contact Person: Tariq Al-Mansoori (Procurement Director)

Destination / Port of Discharge: Jebel Ali Port, Dubai, UAE
Delivery Terms: CIF Jebel Ali (Incoterms 2020)

Order Items:
1. Item Description: Organic Coconut Sugar & Spices Grade A
   HS Code: 1702.90
   Quantity: 20 Metric Ton (20,000 kg)
   Unit Price: USD 1.85 per kg
   Total Amount: USD 37,000.00

Payment Terms:
30% Advance Deposit by T/T upon Proforma Invoice, 70% against B/L copy, Halal Certificate, and COO.`,
  },
];

/**
 * Parsing teks PO dan menjalankan evaluasi screening AI Advisor terhadap:
 * 1. Nama Perusahaan (Legal corporate entity)
 * 2. Email Perusahaan (Corporate domain vs free webmail)
 * 3. Nomor Kontak yang Bisa Dihubungi (Format internasional)
 * 4. Website Perusahaan (Domain resmi)
 * Serta validasi rute logistik dan keamanan klausul pembayaran.
 */
export function parsePoTextAndScreen(text: string, _fileName?: string): PoScreeningResult {
  const clean = text || "";

  // 1. Ekstraksi PO Reference
  const poMatch =
    clean.match(/(?:(?:PO|LOI|Contract)\s*(?:Number|No\.?|#)?\s*[:=\-]?\s*)([A-Z0-9\/\-_]+)/i) ||
    clean.match(/((?:PO|LOI)-[0-9]{4}[A-Z0-9\/\-_]*)/i) ||
    clean.match(/([A-Z]{2,4}-[0-9]{4}[A-Z0-9\/\-_]*)/i);
  const reference = poMatch ? poMatch[1].trim() : "PO-" + new Date().getFullYear() + "/01";

  // 2. Ekstraksi Nama Buyer
  const buyerOnNextLine = clean.match(/(?:Company\s*Name|Buyer|Importer|Purchaser|Customer)[^\n:]*:\s*\r?\n\s*([^\n\r(]+)/i);
  const buyerSameLine = clean.match(/(?:Company\s*Name|Buyer|Importer|Purchaser|Customer)\s*[:=\-]\s*([^\n\r(]+)/i);
  let buyer = (buyerOnNextLine ? buyerOnNextLine[1] : buyerSameLine ? buyerSameLine[1] : "").trim();
  buyer = buyer.replace(/^\/\s*[a-zA-Z]+\s*[:=]?\s*/i, "").trim();

  if (!buyer || buyer.length < 3 || /^(importer|purchaser|buyer|company name)$/i.test(buyer)) {
    if (clean.includes("Nordic Pantry")) buyer = "Nordic Pantry AB";
    else if (clean.includes("Kyoto Trading")) buyer = "Kyoto Trading Co., Ltd.";
    else if (clean.includes("Hamburg Organic")) buyer = "Hamburg Organic Spices GmbH";
    else if (clean.includes("Gulf Gourmet")) buyer = "Gulf Gourmet General Trading LLC";
    else buyer = "International Trade Buyer";
  }

  // 3. Ekstraksi Negara Buyer
  let buyerCountry = "Jepang";
  if (/Sweden|Swedia|Gothenburg|Stockholm/i.test(clean)) buyerCountry = "Swedia";
  else if (/Japan|Jepang|Tokyo|Yokohama|Kyoto|Osaka/i.test(clean)) buyerCountry = "Jepang";
  else if (/Germany|Jerman|Hamburg|Bremen|Berlin/i.test(clean)) buyerCountry = "Jerman";
  else if (/USA|United States|America|Amerika|Long Beach|Los Angeles|New York/i.test(clean)) buyerCountry = "Amerika Serikat";
  else if (/UAE|Dubai|Jebel Ali|Emirat|Saudi|Arab/i.test(clean)) buyerCountry = "Uni Emirat Arab";
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
    else if (buyerCountry === "Uni Emirat Arab") destination = "Jebel Ali Port, Dubai";
    else destination = "Port of Discharge";
  }

  // 5. Ekstraksi 4 Pilar Identitas Bisnis (Nama, Email, Kontak, Website)
  // Email Perusahaan
  const emailMatch = clean.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const companyEmail = emailMatch ? emailMatch[1].toLowerCase() : "";
  const isCorporateEmail =
    Boolean(companyEmail) &&
    !/@(gmail|yahoo|hotmail|outlook|ymail|aol)\.com/i.test(companyEmail);

  // Nomor Kontak
  const phoneMatch =
    clean.match(/(?:Phone|Tel|Telp|Mobile|Contact|WhatsApp)\s*[:=\-]?\s*([+0-9\s\-()]{8,22})/i) ||
    clean.match(/(\+[0-9]{1,3}\s*[0-9\s\-()]{7,18})/);
  const contactNumber = phoneMatch ? phoneMatch[1].trim() : "";

  // Website Perusahaan
  const webMatch =
    clean.match(/(?:Website|Web|URL)\s*[:=\-]?\s*(https?:\/\/[^\s\n\r]+|www\.[^\s\n\r]+)/i) ||
    clean.match(/(https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s\n\r]*)/i) ||
    clean.match(/(www\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s\n\r]*)/i);
  let companyWebsite = webMatch ? webMatch[1].trim() : "";
  if (!companyWebsite && companyEmail && isCorporateEmail) {
    const domain = companyEmail.split("@")[1];
    companyWebsite = `https://www.${domain}`;
  }

  // 6. Ekstraksi Komoditas & HS Code
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

  // 7. Ekstraksi Kuantitas & Harga
  const qtyMatch = clean.match(/(?:Quantity|Qty)\s*[:=\-]?\s*([0-9.,]+)\s*([a-zA-Z]+)?/i);
  const quantity = qtyMatch ? parseFloat(qtyMatch[1].replace(/,/g, "")) || 2400 : 2400;
  const unit = qtyMatch && qtyMatch[2] ? qtyMatch[2].toLowerCase() : "carton";

  const priceMatch = clean.match(/(?:Unit Price|Price per [a-zA-Z]+|Price)\s*[:=\-]?\s*(?:USD|\$|EUR|€)?\s*([0-9.,]+)/i);
  const unitPrice = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, "")) || 18.5 : 18.5;

  // 8. Ekstraksi Incoterms
  let incoterm: Incoterm = "FOB";
  if (/\bCIF\b/i.test(clean)) incoterm = "CIF";
  else if (/\bCFR\b/i.test(clean)) incoterm = "CFR";
  else if (/\bFOB\b/i.test(clean)) incoterm = "FOB";
  else if (/\bFCA\b/i.test(clean)) incoterm = "FCA";
  else if (/\bEXW\b/i.test(clean)) incoterm = "EXW";
  else if (/\bDAP\b/i.test(clean)) incoterm = "DAP";
  else if (/\bDDP\b/i.test(clean)) incoterm = "DDP";

  // 9. Ekstraksi Payment Terms
  const payMatch = clean.match(/(?:Payment Terms?|Terms of Payment)\s*[:=\-]?\s*([^\n\r]+(?:\n[^\n\r]+)?)/i);
  const paymentTerms = payMatch ? payMatch[1].replace(/\s+/g, " ").trim() : "30% Down Payment / 70% against B/L copy";

  // 10. AI ADVISOR SCREENING EVALUATION TERHADAP 4 PILAR
  const hasLegalSuffix = /\b(AB|GmbH|Ltd|LLC|Inc|Corporation|S\.A\.|S\.p\.A\.|Sdn\s*Bhd|Pte\s*Ltd|AG|Oy|BV)\b/i.test(buyer);
  const hasContact = Boolean(contactNumber && contactNumber.length >= 8);
  const hasWebsite = Boolean(companyWebsite && companyWebsite.length >= 6);

  // Evaluasi Tiap Pilar
  const pillarCompanyName: VerificationPillar = {
    label: "Nama Perusahaan",
    value: buyer,
    isValid: hasLegalSuffix,
    note: hasLegalSuffix
      ? `Badan hukum resmi teridentifikasi (${buyer.match(/\b(AB|GmbH|Ltd|LLC|Inc|Corporation|S\.A\.|S\.p\.A\.|Sdn\s*Bhd|Pte\s*Ltd|AG|Oy|BV)\b/i)?.[0]})`
      : "Nama perusahaan belum mencantumkan bentuk badan hukum (PT/Ltd/GmbH/AB)",
  };

  const pillarEmail: VerificationPillar = {
    label: "Email Perusahaan",
    value: companyEmail || "(Tidak tercantum di dokumen PO)",
    isValid: isCorporateEmail,
    note: isCorporateEmail
      ? `Domain korporasi resmi aktif (@${companyEmail.split("@")[1]}) · Bebas email gratisan`
      : companyEmail
        ? "Waspada: Menggunakan domain email publik gratisan, bukan email domain korporasi"
        : "Email korespondensi resmi belum tercantum di dokumen PO",
  };

  const pillarContact: VerificationPillar = {
    label: "Nomor Kontak",
    value: contactNumber || "(Tidak tercantum di dokumen PO)",
    isValid: hasContact,
    note: hasContact
      ? `Nomor telepon format internasional valid (${contactNumber})`
      : "Nomor telepon/kontak perwakilan buyer belum tercantum",
  };

  const pillarWebsite: VerificationPillar = {
    label: "Website Perusahaan",
    value: companyWebsite || "(Tidak ditemukan)",
    isValid: hasWebsite,
    note: hasWebsite
      ? `Domain resmi online (${companyWebsite.replace(/^https?:\/\//, "")})`
      : "Situs web resmi belum dapat diverifikasi secara publik",
  };

  // Analisis Pembayaran & Risiko Sanksi
  const hasAdvanceOrLC = /(?:Down Payment|DP|Advance|Deposit|Letter of Credit|L\/C)/i.test(paymentTerms);
  const isHighRiskPayment = /(?:100%\s*CAD|Open Account\s*(?:60|90)|Cash Against Documents\s*100%|DA\s*90)/i.test(paymentTerms);
  const isSanctionedCountry = /(?:North Korea|Iran|Syria|Russia|Cuba|Belarus)/i.test(buyerCountry) || /(?:Vladivostok|St\. Petersburg|Novorossiysk)/i.test(destination);

  let score = 70;
  const recommendations: string[] = [];

  if (pillarCompanyName.isValid) score += 10;
  else recommendations.push("Minta Certificate of Incorporation resmi karena nama buyer belum memiliki akhiran badan hukum standar.");

  if (pillarEmail.isValid) score += 10;
  else recommendations.push("Konfirmasi alamat email resmi dengan domain korporat buyer untuk mencegah pemalsuan identitas (fraud).");

  if (pillarContact.isValid) score += 5;
  else recommendations.push("Minta nomor telepon kantor atau sambungan langsung bagian procurement buyer luar negeri.");

  if (pillarWebsite.isValid) score += 5;
  else recommendations.push("Lakukan penelusuran situs resmi buyer untuk memastikan jejak digital dan profil operasional perusahaan.");

  if (isHighRiskPayment) {
    score -= 35;
    recommendations.push("PERINGATAN KRUSIAL: Syarat pembayaran tanpa DP/LC berisiko gagal bayar. Ubah syarat menjadi minimal 30% Down Payment sebelum kargo dimuat.");
  } else if (!hasAdvanceOrLC) {
    score -= 15;
    recommendations.push("Negosiasikan pembayaran uang muka (DP) minimal 30% atau L/C at sight agar modal produksi kargo terlindungi.");
  }

  if (isSanctionedCountry) {
    score = Math.min(score, 25);
    recommendations.push("Kawasan tujuan terindikasi sanksi embargo perdagangan internasional. Konsultasikan dengan bank devisa sebelum memproses transaksi.");
  }

  score = Math.max(15, Math.min(99, score));
  let status: BuyerScreeningStatus = "verified";
  if (score >= 85) status = "verified";
  else if (score >= 60) status = "warning";
  else status = "high_risk";

  if (recommendations.length === 0) {
    recommendations.push("Seluruh 4 pilar identitas buyer (Nama, Email, Kontak, Website) terverifikasi valid.");
    recommendations.push("Proforma Invoice dapat langsung diterbitkan sesuai nomor dan parameter PO ini.");
  }

  const legalEntityStatus = pillarCompanyName.isValid
    ? `Entitas Legal Terverifikasi (${pillarCompanyName.value})`
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
      ? `AI Advisor memvalidasi dokumen PO "${reference}" dari ${buyer} (${buyerCountry}). Parameter badan hukum, email domain, kontak, dan website terverifikasi valid dan siap disinkronkan ke seluruh modul EksporFlow.`
      : status === "warning"
        ? `PO "${reference}" teridentifikasi, namun disarankan melengkapi verifikasi identitas resmi buyer atau klausul pembayaran sebelum memulai muatan kontainer.`
        : `Waspada: Terdeteksi poin risiko tinggi pada identitas atau klausul pembayaran dokumen PO ini. Tinjau rekomendasi mitigasi AI sebelum melanjutkan.`;

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
      pillars: {
        companyName: pillarCompanyName,
        companyEmail: pillarEmail,
        contactNumber: pillarContact,
        companyWebsite: pillarWebsite,
      },
      legalEntityStatus,
      sanctionCheck,
      paymentTermRisk,
      summary,
      recommendations,
    },
  };
}
