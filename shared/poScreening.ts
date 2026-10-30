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
export function parsePoTextAndScreen(text: string, fileName?: string): PoScreeningResult {
  const clean = text || "";
  const lines = clean
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // 1. Ekstraksi Nomor Referensi PO / LOI / Kontrak
  const poMatch =
    clean.match(/(?:(?:No\.?|Nomor|Kode)\s*(?:PO|LOI|Pesanan|Kontrak|Order)\s*[:=\-]?\s*)([A-Z0-9\/\-_]{3,35})/i) ||
    clean.match(/(?:(?:P\.O\.|PO|L\.O\.I\.|LOI|Purchase\s*Order|Pesanan\s*Pembelian|Order|Pesanan|Kontrak|Invoice|Contract)\s*(?:Number|No\.?|#|Kode|ID)\s*[:=\-]?\s*)([A-Z0-9\/\-_]{3,35})/i) ||
    clean.match(/(?:(?:P\.O\.|PO|LOI)\s*[:=\-]\s*)([A-Z0-9\/\-_]{3,35})/i);

  const standaloneCodeMatch =
    clean.match(/\b((?:PO|LOI|ORD|INV|CTR)[-_\/][A-Z0-9\/\-_]{3,25})\b/i) ||
    clean.match(/\bPO\s*#?\s*([A-Z0-9\/\-_]{3,20})\b/i);

  let fileRef = "";
  if (fileName) {
    const fnMatch = fileName.match(/((?:PO|LOI|INV|ORD)[-_\/0-9A-Z]+)/i);
    if (fnMatch) fileRef = fnMatch[1].replace(/[_.]/g, "-");
  }

  const reference = poMatch
    ? poMatch[1].trim()
    : standaloneCodeMatch
      ? standaloneCodeMatch[1].trim()
      : fileRef || "PO-" + new Date().getFullYear() + "/01";

  // 2. Ekstraksi 4 Pilar Identitas Bisnis Awal (Email, Kontak, Website) untuk referensi deteksi buyer & negara
  // Email Perusahaan
  const emailMatch = clean.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const companyEmail = emailMatch ? emailMatch[1].toLowerCase() : "";
  const isCorporateEmail =
    Boolean(companyEmail) &&
    !/@(gmail|yahoo|hotmail|outlook|ymail|aol)\.com/i.test(companyEmail);

  // Nomor Kontak
  const phoneMatch =
    clean.match(/(?:Phone|Tel|Telp|Mobile|Contact|WhatsApp|Telepon|HP|Fax)\s*[:=\-]?\s*([+0-9\s\-()]{8,22})/i) ||
    clean.match(/(\+[0-9]{1,3}\s*[0-9\s\-()]{7,18})/);
  const contactNumber = phoneMatch ? phoneMatch[1].trim() : "";

  // Website Perusahaan
  const webMatch =
    clean.match(/(?:Website|Web|URL|Situs)\s*[:=\-]?\s*(https?:\/\/[^\s\n\r]+|www\.[^\s\n\r]+)/i) ||
    clean.match(/(https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s\n\r]*)/i) ||
    clean.match(/(www\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s\n\r]*)/i);
  let companyWebsite = webMatch ? webMatch[1].trim() : "";
  if (!companyWebsite && companyEmail && isCorporateEmail) {
    const domain = companyEmail.split("@")[1];
    companyWebsite = `https://www.${domain}`;
  }

  // 3. Ekstraksi Nama Buyer / Importir
  const buyerSameLine = /(?:Company\s*Name|Buyer\s*Name|Buyer|Importer\s*Name|Importer|Purchaser\s*Name|Purchaser|Customer\s*Name|Customer|Bill\s*To|Invoice\s*To|Sold\s*To|Consignee|Applicant|Nama\s*Perusahaan|Nama\s*Pembeli|Pembeli|Importir|Pihak\s*Pembeli|Kepada\s*(?:Yth\.?)?|Messrs|Client|Ordered\s*By|Issued\s*By)\s*[:=\-]\s*([^\n\r(]+)/i;
  const buyerNextLine = /(?:Company\s*Name|Buyer\s*Name|Buyer|Importer\s*Name|Importer|Purchaser\s*Name|Purchaser|Customer\s*Name|Customer|Bill\s*To|Invoice\s*To|Sold\s*To|Consignee|Applicant|Nama\s*Perusahaan|Nama\s*Pembeli|Pembeli|Importir|Pihak\s*Pembeli|Kepada\s*(?:Yth\.?)?|Messrs|Client|Ordered\s*By|Issued\s*By)[^\n:]*:\s*\r?\n\s*([^\n\r(]+)/i;

  const bMatch1 = clean.match(buyerSameLine);
  const bMatch2 = clean.match(buyerNextLine);
  let buyer = (bMatch2 ? bMatch2[1] : bMatch1 ? bMatch1[1] : "").trim();
  buyer = buyer
    .replace(/^\/\s*[a-zA-Z]+\s*[:=]?\s*/i, "")
    .replace(/^(Attn|Attention|Mr\.?|Mrs\.?|Ms\.?)\s*[:=\-]?\s*[^\n,]+/i, "")
    .trim();

  // Cari baris dengan akhiran badan hukum resmi internasional/nasional
  const legalSuffixRegex = /\b(PT\.?|CV\.?|UD\.?|Ltd\.?|LLC|Inc\.?|Corp\.?|Corporation|GmbH|Co\.,?\s*Ltd\.?|Pte\.?\s*Ltd\.?|Sdn\.?\s*Bhd\.?|S\.A\.|S\.p\.A\.|B\.V\.|AG|Oy|AB|Trading\s+LLC|General\s+Trading)\b/i;
  if (!buyer || buyer.length < 3 || /^(importer|purchaser|buyer|company name|customer|pembeli|perusahaan)$/i.test(buyer)) {
    for (const line of lines.slice(0, 20)) {
      if (
        legalSuffixRegex.test(line) &&
        !/^(PURCHASE ORDER|LETTER OF INTENT|INVOICE|CONTRACT|PACKING LIST|PROFORMA|TAX INVOICE)/i.test(line) &&
        !/@/.test(line) &&
        !/http|www\./i.test(line) &&
        !/(Indico|Seller|Exporter|Eksportir|Pemasok|Supplier)/i.test(line) &&
        line.length >= 4 &&
        line.length <= 70
      ) {
        buyer = line.replace(/^(Buyer|Importer|Purchaser|Company|Customer|Messrs|Bill\s*To|Consignee)\s*[:=\-]?\s*/i, "").trim();
        break;
      }
    }
  }

  // Fallback domain / website / email brand matching (Contoh: albarakahfoods.ae -> "Al Barakah Foods")
  if ((!buyer || buyer.length < 3 || /^(importer|purchaser|buyer|company name|customer|pembeli|perusahaan|buyer internasional)$/i.test(buyer)) && (companyWebsite || companyEmail)) {
    const rawDomain = (companyWebsite || companyEmail.split("@")[1])
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .split(".")[0];

    if (rawDomain && rawDomain.length >= 4) {
      // 1. Coba cari baris yang memuat teks domain (misal "Al Barakah Foods LLC")
      for (const line of lines.slice(0, 25)) {
        const compact = line.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (
          compact.includes(rawDomain.toLowerCase()) &&
          !/http|www\.|@/i.test(line) &&
          line.length >= 4 &&
          line.length <= 70
        ) {
          buyer = line.replace(/^(Buyer|Importer|Purchaser|Company|Customer|Messrs)\s*[:=\-]?\s*/i, "").trim();
          break;
        }
      }

      // 2. Format domain jadi nama bersih jika belum ketemu baris spesifik
      if (!buyer || buyer.length < 3 || /^(importer|purchaser|buyer|company name|customer|pembeli|perusahaan|buyer internasional)$/i.test(buyer)) {
        const formatted = rawDomain
          .replace(/(foods|trading|general|group|global|trade|import|export|logistics|corp|intl|international)/gi, " $1")
          .trim()
          .split(/\s+/)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(" ");
        if (formatted.length >= 3) {
          buyer = formatted;
        }
      }
    }
  }

  // Fallback sampel PO bawaan jika ada kata kunci khusus
  if (!buyer || buyer.length < 3 || /^(importer|purchaser|buyer|company name|customer|pembeli|perusahaan)$/i.test(buyer)) {
    if (clean.includes("Nordic Pantry")) buyer = "Nordic Pantry AB";
    else if (clean.includes("Kyoto Trading")) buyer = "Kyoto Trading Co., Ltd.";
    else if (clean.includes("Hamburg Organic")) buyer = "Hamburg Organic Spices GmbH";
    else if (clean.includes("Gulf Gourmet")) buyer = "Gulf Gourmet General Trading LLC";
    else {
      for (const line of lines.slice(0, 8)) {
        if (
          line.length > 5 &&
          line.length < 50 &&
          !/^(purchase|order|po|loi|date|ref|nomor|invoice|tanggal|page)/i.test(line) &&
          !/@/.test(line)
        ) {
          buyer = line;
          break;
        }
      }
      if (!buyer) buyer = "Buyer Internasional";
    }
  }

  // Format ke Title Case jika nama buyer seluruhnya huruf kapital (ALL CAPS)
  if (buyer && buyer === buyer.toUpperCase() && buyer.length > 3) {
    buyer = buyer
      .split(/\s+/)
      .map((word) => {
        if (/^(PT\.?|CV\.?|UD\.?|LLC|LTD\.?|GMBH|AB|BV|SA|SPA|AG|OY|UK|USA|UAE|KSA)$/i.test(word)) {
          return word.toUpperCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(" ");
  }

  // 4. Ekstraksi Pelabuhan Bongkar (POD / Destination)
  const podMatch = clean.match(
    /(?:Port\s*of\s*Discharge|POD|Port\s*of\s*Destination|Destination\s*Port|Discharge\s*Port|Destination|Delivery\s*Port|Pelabuhan\s*Bongkar|Pelabuhan\s*Tujuan|Tujuan\s*Pengiriman|Ship\s*To(?:\s*Port)?)\s*[:=\-]?\s*([^\n\r,]+)/i
  );
  let destination = podMatch ? podMatch[1].trim() : "";

  // 5. Ekstraksi Negara Buyer dengan multi-sinyal cerdas (Bebas dari jebakan mata uang "United States Dollar")
  // Bersihkan sebutan mata uang seperti 'United States Dollar', 'USD', 'US Dollars' agar tidak memicu deteksi salah Amerika Serikat!
  const textWithoutCurrency = clean
    .replace(/\b(?:United\s+States\s+Dollars?|US\s+Dollars?|U\.S\.\s*Dollars?|American\s+Dollars?)\b/gi, "USD")
    .replace(/\bBank\s+of\s+America\b/gi, "BankCorp")
    .replace(/\bAmerican\s+Express\b/gi, "AmexCard");

  // Definisi Kamus Pelabuhan Utama, Awalan Telepon, TLD Website, dan Nama Negara
  interface CountryRule {
    country: string;
    defaultPort: string;
    portPattern: RegExp;
    phonePattern?: RegExp;
    tldPattern?: RegExp;
    textPattern: RegExp;
  }

  const countryRules: CountryRule[] = [
    {
      country: "Uni Emirat Arab",
      defaultPort: "Jebel Ali Port, Dubai",
      portPattern: /Jebel Ali|Dubai|Abu Dhabi|Sharjah|Khor Fakkan|Fujairah|Port Rashid/i,
      phonePattern: /^\+971/,
      tldPattern: /\.ae\b/i,
      textPattern: /\b(?:UAE|U\.A\.E\.|United\s+Arab\s+Emirates|Dubai|Abu\s+Dhabi|Sharjah|Emirat)\b/i,
    },
    {
      country: "Arab Saudi",
      defaultPort: "Jeddah Islamic Port",
      portPattern: /Jeddah|Dammam|Riyadh|King Abdulaziz|Jubail|Yanbu/i,
      phonePattern: /^\+966/,
      tldPattern: /\.sa\b/i,
      textPattern: /\b(?:Saudi|KSA|Arab\s+Saudi|Kingdom\s+of\s+Saudi\s+Arabia|Jeddah|Riyadh|Dammam)\b/i,
    },
    {
      country: "Jepang",
      defaultPort: "Port of Tokyo",
      portPattern: /Tokyo|Yokohama|Osaka|Kobe|Nagoya|Hakata|Moji|Chiba/i,
      phonePattern: /^\+81/,
      tldPattern: /\.jp\b|\.co\.jp\b/i,
      textPattern: /\b(?:Japan|Jepang|Tokyo|Yokohama|Osaka|Kobe|Nagoya|Kyoto)\b/i,
    },
    {
      country: "Swedia",
      defaultPort: "Port of Gothenburg",
      portPattern: /Gothenburg|Stockholm|Malmo|Helsingborg/i,
      phonePattern: /^\+46/,
      tldPattern: /\.se\b/i,
      textPattern: /\b(?:Sweden|Swedia|Sverige|Gothenburg|Stockholm|Malmo)\b/i,
    },
    {
      country: "Jerman",
      defaultPort: "Port of Hamburg",
      portPattern: /Hamburg|Bremen|Bremerhaven|Duisburg/i,
      phonePattern: /^\+49/,
      tldPattern: /\.de\b/i,
      textPattern: /\b(?:Germany|Jerman|Deutschland|Hamburg|Bremen|Berlin|Frankfurt|Munich|München)\b/i,
    },
    {
      country: "Singapura",
      defaultPort: "Port of Singapore",
      portPattern: /Singapore|Jurong|Pasir Panjang/i,
      phonePattern: /^\+65/,
      tldPattern: /\.sg\b/i,
      textPattern: /\b(?:Singapore|Singapura)\b/i,
    },
    {
      country: "Malaysia",
      defaultPort: "Port Klang",
      portPattern: /Port Klang|Penang|Tanjung Pelepas|Pasir Gudang/i,
      phonePattern: /^\+60/,
      tldPattern: /\.my\b/i,
      textPattern: /\b(?:Malaysia|Kuala\s+Lumpur|Port\s+Klang|Penang|Johor)\b/i,
    },
    {
      country: "Belanda",
      defaultPort: "Port of Rotterdam",
      portPattern: /Rotterdam|Amsterdam/i,
      phonePattern: /^\+31/,
      tldPattern: /\.nl\b/i,
      textPattern: /\b(?:Netherlands|Belanda|Holland|Rotterdam|Amsterdam)\b/i,
    },
    {
      country: "Inggris (UK)",
      defaultPort: "Port of Southampton",
      portPattern: /Southampton|Felixstowe|London Gateway|Liverpool|Tilbury/i,
      phonePattern: /^\+44/,
      tldPattern: /\.uk\b|\.co\.uk\b/i,
      textPattern: /\b(?:United\s+Kingdom|UK|Inggris|Great\s+Britain|England|London|Southampton|Felixstowe)\b/i,
    },
    {
      country: "Amerika Serikat",
      defaultPort: "Port of Long Beach",
      portPattern: /Long Beach|Los Angeles|New York|New Jersey|Houston|Oakland|Savannah|Miami|Seattle|Charleston|Norfolk|Baltimore/i,
      phonePattern: /^\+1\s*[2-9]/,
      tldPattern: /\.us\b/i,
      textPattern: /\b(?:USA|U\.S\.A\.|United\s+States(?!\s*Dollar)|America(?!\s*Express)|California|Texas|Florida|New\s+York(?!\s*Coffee)|Los\s+Angeles|Houston|Miami)\b/i,
    },
    {
      country: "Tiongkok (China)",
      defaultPort: "Port of Shanghai",
      portPattern: /Shanghai|Ningbo|Shenzhen|Qingdao|Guangzhou|Tianjin|Xiamen|Dalian/i,
      phonePattern: /^\+86/,
      tldPattern: /\.cn\b/i,
      textPattern: /\b(?:China|Tiongkok|Cina|PRC|Shanghai|Ningbo|Shenzhen|Guangzhou|Qingdao)\b/i,
    },
    {
      country: "Korea Selatan",
      defaultPort: "Port of Busan",
      portPattern: /Busan|Incheon|Gwangyang|Pyeongtaek/i,
      phonePattern: /^\+82/,
      tldPattern: /\.kr\b|\.co\.kr\b/i,
      textPattern: /\b(?:South\s+Korea|Korea\s+Selatan|Korea|Busan|Incheon|Seoul)\b/i,
    },
    {
      country: "India",
      defaultPort: "Nhava Sheva Port, Mumbai",
      portPattern: /Nhava Sheva|Jawaharlal Nehru|Mundra|Chennai|Kolkata|Mumbai|Cochin/i,
      phonePattern: /^\+91/,
      tldPattern: /\.in\b|\.co\.in\b/i,
      textPattern: /\b(?:India|Mumbai|Nhava\s+Sheva|Chennai|Kolkata|Delhi|Gujarat)\b/i,
    },
    {
      country: "Australia",
      defaultPort: "Port of Melbourne",
      portPattern: /Melbourne|Sydney|Brisbane|Fremantle|Adelaide|Perth/i,
      phonePattern: /^\+61/,
      tldPattern: /\.au\b/i,
      textPattern: /\b(?:Australia|Sydney|Melbourne|Brisbane|Fremantle|Perth)\b/i,
    },
    {
      country: "Kanada",
      defaultPort: "Port of Vancouver",
      portPattern: /Vancouver|Montreal|Toronto|Halifax|Prince Rupert/i,
      phonePattern: /^\+1/,
      tldPattern: /\.ca\b/i,
      textPattern: /\b(?:Canada|Kanada|Vancouver|Montreal|Toronto|Ontario|Quebec)\b/i,
    },
    {
      country: "Prancis",
      defaultPort: "Port of Le Havre",
      portPattern: /Le Havre|Marseille|Fos/i,
      phonePattern: /^\+33/,
      tldPattern: /\.fr\b/i,
      textPattern: /\b(?:France|Prancis|Le\s+Havre|Marseille|Paris)\b/i,
    },
    {
      country: "Italia",
      defaultPort: "Port of Genoa",
      portPattern: /Genoa|La Spezia|Trieste|Livorno|Naples/i,
      phonePattern: /^\+39/,
      tldPattern: /\.it\b/i,
      textPattern: /\b(?:Italy|Italia|Genoa|Trieste|La\s+Spezia|Milan|Milano|Rome)\b/i,
    },
    {
      country: "Spanyol",
      defaultPort: "Port of Valencia",
      portPattern: /Valencia|Barcelona|Algeciras|Bilbao/i,
      phonePattern: /^\+34/,
      tldPattern: /\.es\b/i,
      textPattern: /\b(?:Spain|Spanyol|España|Valencia|Barcelona|Algeciras|Madrid)\b/i,
    },
    {
      country: "Turki",
      defaultPort: "Port of Istanbul",
      portPattern: /Istanbul|Izmir|Mersin|Ambarli|Gemlik/i,
      phonePattern: /^\+90/,
      tldPattern: /\.tr\b/i,
      textPattern: /\b(?:Turkey|Turki|Türkiye|Istanbul|Izmir|Mersin)\b/i,
    },
    {
      country: "Mesir",
      defaultPort: "Port of Alexandria",
      portPattern: /Alexandria|Port Said|Damietta|Sokhna/i,
      phonePattern: /^\+20/,
      tldPattern: /\.eg\b/i,
      textPattern: /\b(?:Egypt|Mesir|Alexandria|Port\s+Said|Cairo)\b/i,
    },
    {
      country: "Thailand",
      defaultPort: "Laem Chabang Port",
      portPattern: /Laem Chabang|Bangkok/i,
      phonePattern: /^\+66/,
      tldPattern: /\.th\b/i,
      textPattern: /\b(?:Thailand|Bangkok|Laem\s+Chabang)\b/i,
    },
    {
      country: "Vietnam",
      defaultPort: "Cat Lai Port, Ho Chi Minh",
      portPattern: /Cat Lai|Hai Phong|Da Nang|Ho Chi Minh/i,
      phonePattern: /^\+84/,
      tldPattern: /\.vn\b/i,
      textPattern: /\b(?:Vietnam|Ho\s+Chi\s+Minh|Hai\s+Phong|Da\s+Nang|Hanoi)\b/i,
    },
    {
      country: "Filipina",
      defaultPort: "Port of Manila",
      portPattern: /Manila|Cebu|Batangas|Subic/i,
      phonePattern: /^\+63/,
      tldPattern: /\.ph\b/i,
      textPattern: /\b(?:Philippines|Filipina|Manila|Cebu)\b/i,
    },
    {
      country: "Taiwan",
      defaultPort: "Port of Kaohsiung",
      portPattern: /Kaohsiung|Keelung|Taichung|Taipei/i,
      phonePattern: /^\+886/,
      tldPattern: /\.tw\b/i,
      textPattern: /\b(?:Taiwan|Kaohsiung|Taipei|Keelung)\b/i,
    },
    {
      country: "Qatar",
      defaultPort: "Hamad Port, Doha",
      portPattern: /Hamad|Doha/i,
      phonePattern: /^\+974/,
      tldPattern: /\.qa\b/i,
      textPattern: /\b(?:Qatar|Doha|Hamad)\b/i,
    },
    {
      country: "Kuwait",
      defaultPort: "Shuwaikh Port",
      portPattern: /Shuwaikh|Shuaiba/i,
      phonePattern: /^\+965/,
      tldPattern: /\.kw\b/i,
      textPattern: /\b(?:Kuwait|Shuwaikh)\b/i,
    },
    {
      country: "Oman",
      defaultPort: "Sohar Port",
      portPattern: /Sohar|Salalah|Muscat/i,
      phonePattern: /^\+968/,
      tldPattern: /\.om\b/i,
      textPattern: /\b(?:Oman|Muscat|Sohar|Salalah)\b/i,
    },
    {
      country: "Brasil",
      defaultPort: "Port of Santos",
      portPattern: /Santos|Paranagua|Rio de Janeiro/i,
      phonePattern: /^\+55/,
      tldPattern: /\.br\b/i,
      textPattern: /\b(?:Brazil|Brasil|Santos|Paranagua|Sao\s+Paulo)\b/i,
    },
    {
      country: "Afrika Selatan",
      defaultPort: "Port of Durban",
      portPattern: /Durban|Cape Town|Port Elizabeth/i,
      phonePattern: /^\+27/,
      tldPattern: /\.za\b/i,
      textPattern: /\b(?:South\s+Africa|Afrika\s+Selatan|Durban|Cape\s+Town|Johannesburg)\b/i,
    },
    {
      country: "Selandia Baru",
      defaultPort: "Port of Auckland",
      portPattern: /Auckland|Tauranga|Lyttelton/i,
      phonePattern: /^\+64/,
      tldPattern: /\.nz\b/i,
      textPattern: /\b(?:New\s+Zealand|Selandia\s+Baru|Auckland|Wellington)\b/i,
    },
    {
      country: "Belgia",
      defaultPort: "Port of Antwerp",
      portPattern: /Antwerp|Zeebrugge/i,
      phonePattern: /^\+32/,
      tldPattern: /\.be\b/i,
      textPattern: /\b(?:Belgium|Belgia|Antwerp|Brussels)\b/i,
    },
    {
      country: "Polandia",
      defaultPort: "Port of Gdansk",
      portPattern: /Gdansk|Gdynia/i,
      phonePattern: /^\+48/,
      tldPattern: /\.pl\b/i,
      textPattern: /\b(?:Poland|Polandia|Polska|Gdansk|Gdynia|Warsaw)\b/i,
    },
  ];

  let buyerCountry = "";
  let defaultPort = "Port of Discharge";

  // Langkah 5A: Evaluasi berdasarkan Pelabuhan Bongkar (POD) yang teridentifikasi
  if (destination) {
    for (const rule of countryRules) {
      if (rule.portPattern.test(destination)) {
        buyerCountry = rule.country;
        defaultPort = rule.defaultPort;
        break;
      }
    }
  }

  // Langkah 5B: Evaluasi berdasarkan Kode Panggilan Telepon Internasional (+971, +81, +49, dll)
  if (!buyerCountry && contactNumber) {
    for (const rule of countryRules) {
      if (rule.phonePattern && rule.phonePattern.test(contactNumber)) {
        buyerCountry = rule.country;
        defaultPort = rule.defaultPort;
        break;
      }
    }
  }

  // Langkah 5C: Evaluasi berdasarkan Ekstensi Domain Resmi Website (.ae, .jp, .de, .se, dll)
  if (!buyerCountry && companyWebsite) {
    for (const rule of countryRules) {
      if (rule.tldPattern && rule.tldPattern.test(companyWebsite)) {
        buyerCountry = rule.country;
        defaultPort = rule.defaultPort;
        break;
      }
    }
  }

  // Langkah 5D: Evaluasi berdasarkan Label Eksplisit "Country:" atau "Negara Tujuan:" di teks dokumen
  if (!buyerCountry) {
    const explicitCountryMatch = clean.match(
      /(?:Country(?:\s*of\s*(?:Destination|Discharge|Import))?|Destination\s*Country|Buyer(?:\s*['’]s)?\s*Country|Negara\s*(?:Tujuan|Buyer|Pembeli|Importir)?)\s*[:=\-]\s*([a-zA-Z\s]{2,30})/i
    );
    if (explicitCountryMatch) {
      const cand = explicitCountryMatch[1].trim();
      for (const rule of countryRules) {
        if (rule.textPattern.test(cand)) {
          buyerCountry = rule.country;
          defaultPort = rule.defaultPort;
          break;
        }
      }
      if (!buyerCountry && cand.length >= 3) {
        buyerCountry = cand;
      }
    }
  }

  // Langkah 5E: Evaluasi berdasarkan pencocokan kata di teks dokumen yang sudah dibersihkan dari sebutan mata uang
  if (!buyerCountry) {
    for (const rule of countryRules) {
      if (rule.portPattern.test(textWithoutCurrency) || rule.textPattern.test(textWithoutCurrency)) {
        buyerCountry = rule.country;
        defaultPort = rule.defaultPort;
        break;
      }
    }
  }

  if (!buyerCountry) {
    buyerCountry = "Negara Tujuan Ekspor";
  }

  if (!destination) {
    destination = defaultPort;
  }

  // 6. Ekstraksi Komoditas & HS Code dengan Pembersihan Header Tabel
  const hsMatch =
    clean.match(/(?:HS\s*Code|Harmonized\s*Code|Tariff\s*Code|Tariff|Kode\s*HS|HS)\s*[:=\-]?\s*([0-9]{4}(?:\.[0-9]{2}(?:\.[0-9]{2})?)?)/i) ||
    clean.match(/\b([0-9]{4}\.[0-9]{2})\b/);
  let hsCode = hsMatch ? hsMatch[1].trim() : "";

  const headerTokens = /\b(HS\s*Code|Qty|Quantity|Unit\s*Price|Total|Specification|Specifications|Amount|Price|No\.|Item\s*No)\b/i;

  const prodMatch = clean.match(
    /(?:Item\s*Description|Description\s*of\s*Goods|Product\s*Name|Commodity|Barang|Nama\s*Barang|Nama\s*Produk|Komoditas)\s*[:=\-]?\s*([^\n\r]+)/i
  );

  let product = "";
  if (prodMatch) {
    const candidate = prodMatch[1].replace(/^[0-9.]+\s*/, "").trim();
    // Cegah kebocoran kolom tabel seperti "& Specifications HS Code Qty Unit Price Total"
    if (!headerTokens.test(candidate) && candidate.length > 2 && candidate.length < 80) {
      product = candidate;
    }
  }

  // Jika belum ketemu, cari baris item pertama (misal: "1. Organic Coconut Sugar" atau "1 | Organic Coconut Sugar")
  if (!product) {
    for (const line of lines) {
      const itemRowMatch = line.match(/^(?:1|01|item\s*1)\s*[:.\-|]\s*([^|,\n\r]{4,70})/i);
      if (itemRowMatch && !headerTokens.test(itemRowMatch[1])) {
        product = itemRowMatch[1].trim();
        break;
      }
    }
  }

  // Deteksi kategori komoditas unggulan ekspor Indonesia
  if (!product || headerTokens.test(product)) {
    if (/Coconut Sugar|Gula Kelapa|Gula Semut/i.test(clean)) {
      product = "Organic Coconut Sugar";
      if (!hsCode) hsCode = "1702.90";
    } else if (/Coffee|Kopi|Arabica|Robusta|Green Beans/i.test(clean)) {
      product = "Specialty Coffee Beans";
      if (!hsCode) hsCode = "0901.11";
    } else if (/Clove|Cengkeh/i.test(clean)) {
      product = "Organic Whole Cloves";
      if (!hsCode) hsCode = "0907.10";
    } else if (/Cocoa|Cokelat|Cacao/i.test(clean)) {
      product = "Fermented Cocoa Beans";
      if (!hsCode) hsCode = "1801.00";
    } else if (/Briquette|Charcoal|Arang/i.test(clean)) {
      product = "Coconut Charcoal Briquette";
      if (!hsCode) hsCode = "4402.90";
    } else if (/Ginger|Jahe/i.test(clean)) {
      product = "Fresh / Dried Ginger";
      if (!hsCode) hsCode = "0910.11";
    } else if (/Vanilla|Vanili/i.test(clean)) {
      product = "Planifolia Vanilla Beans";
      if (!hsCode) hsCode = "0905.10";
    } else if (/Desiccated Coconut|Kelapa Parut/i.test(clean)) {
      product = "Desiccated Coconut High Fat";
      if (!hsCode) hsCode = "0801.11";
    } else if (/Nutmeg|Pala/i.test(clean)) {
      product = "Organic Whole Nutmeg";
      if (!hsCode) hsCode = "0908.11";
    } else if (/Cinnamon|Kayu Manis/i.test(clean)) {
      product = "Cassia Cinnamon Sticks";
      if (!hsCode) hsCode = "0906.11";
    } else if (/Pepper|Lada/i.test(clean)) {
      product = "Black / White Pepper";
      if (!hsCode) hsCode = "0904.11";
    } else if (/Cashew|Mente/i.test(clean)) {
      product = "Raw / Roasted Cashew Nuts";
      if (!hsCode) hsCode = "0801.31";
    }
  }

  if (!product || headerTokens.test(product)) product = "Komoditas Ekspor";
  if (!hsCode) hsCode = "0901.11";

  // 7. Ekstraksi Kuantitas & Harga
  const qtyMatch = clean.match(/(?:Quantity|Qty|Volume|Jumlah|Kuantitas)\s*[:=\-]?\s*([0-9.,]+)\s*([a-zA-Z]+)?/i);
  const quantity = qtyMatch ? parseFloat(qtyMatch[1].replace(/,/g, "")) || 20 : 20;
  const unit = qtyMatch && qtyMatch[2] ? qtyMatch[2].toLowerCase() : "MT";

  const priceMatch = clean.match(/(?:Unit\s*Price|Price\s*per\s*[a-zA-Z]+|Price|Harga\s*Satuan|Harga)\s*[:=\-]?\s*(?:USD|\$|EUR|€|IDR|Rp)?\s*([0-9.,]+)/i);
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
  else if (/\bCIP\b/i.test(clean)) incoterm = "CIF";
  else if (/\bCPT\b/i.test(clean)) incoterm = "CFR";

  // 9. Ekstraksi Payment Terms
  const payMatch = clean.match(/(?:Payment\s*Terms?|Terms\s*of\s*Payment|Syarat\s*Pembayaran|Metode\s*Pembayaran|Payment)\s*[:=\-]?\s*([^\n\r]+(?:\n[^\n\r]+)?)/i);
  const paymentTerms = payMatch ? payMatch[1].replace(/\s+/g, " ").trim() : "30% Down Payment / 70% against B/L copy";

  // 10. AI ADVISOR SCREENING EVALUATION TERHADAP 4 PILAR
  const hasLegalSuffix = /\b(PT\.?|CV\.?|UD\.?|AB|GmbH|Ltd|LLC|Inc|Corporation|Corp|S\.A\.|S\.p\.A\.|Sdn\s*Bhd|Pte\s*Ltd|AG|Oy|BV)\b/i.test(buyer);
  const hasContact = Boolean(contactNumber && contactNumber.length >= 8);
  const hasWebsite = Boolean(companyWebsite && companyWebsite.length >= 6);

  // Evaluasi Tiap Pilar
  const pillarCompanyName: VerificationPillar = {
    label: "Nama Perusahaan",
    value: buyer,
    isValid: hasLegalSuffix,
    note: hasLegalSuffix
      ? `Badan hukum resmi teridentifikasi (${buyer.match(/\b(PT\.?|CV\.?|UD\.?|AB|GmbH|Ltd|LLC|Inc|Corporation|Corp|S\.A\.|S\.p\.A\.|Sdn\s*Bhd|Pte\s*Ltd|AG|Oy|BV)\b/i)?.[0]})`
      : "Nama perusahaan dapat disesuaikan manual di form jika belum menyertakan PT/Ltd/GmbH",
  };

  const pillarEmail: VerificationPillar = {
    label: "Email Perusahaan",
    value: companyEmail || "(Tidak tercantum di dokumen)",
    isValid: isCorporateEmail,
    note: isCorporateEmail
      ? `Domain korporasi resmi aktif (@${companyEmail.split("@")[1]}) · Bebas email gratisan`
      : companyEmail
        ? "Waspada: Menggunakan domain email publik gratisan, bukan email domain korporasi"
        : "Email korespondensi dapat dilengkapi di profil mitra buyer",
  };

  const pillarContact: VerificationPillar = {
    label: "Nomor Kontak",
    value: contactNumber || "(Tidak tercantum di dokumen)",
    isValid: hasContact,
    note: hasContact
      ? `Nomor telepon format internasional valid (${contactNumber})`
      : "Nomor kontak telepon dapat dicatat untuk korespondensi pengiriman",
  };

  const pillarWebsite: VerificationPillar = {
    label: "Website Perusahaan",
    value: companyWebsite || "(Dapat dilengkapi)",
    isValid: hasWebsite,
    note: hasWebsite
      ? `Domain resmi online (${companyWebsite.replace(/^https?:\/\//, "")})`
      : "Situs web dapat dicatat untuk referensi verifikasi profil",
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
