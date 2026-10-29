export type SupportedCurrency = {
  code: string;
  name: string;
  symbol: string;
  country: string;
  flag: string;
  decimals: number;
};

export type BankIndonesiaRate = {
  currency: string;
  currencyName: string;
  flag: string;
  unit: number;
  sellRate: number;   // Kurs Jual BI
  buyRate: number;    // Kurs Beli BI
  middleRate: number; // Kurs Tengah BI
};

// Data resmi Kurs Transaksi Bank Indonesia (BI) lengkap untuk valuta asing dunia
export const OFFICIAL_BI_RATES: BankIndonesiaRate[] = [
  { currency: "USD", currencyName: "Dolar Amerika Serikat", flag: "🇺🇸", unit: 1, sellRate: 18273.92, buyRate: 18092.08, middleRate: 18183.0 },
  { currency: "EUR", currencyName: "Euro Uni Eropa", flag: "🇪🇺", unit: 1, sellRate: 19854.2, buyRate: 19652.1, middleRate: 19753.15 },
  { currency: "SGD", currencyName: "Dolar Singapura", flag: "🇸🇬", unit: 1, sellRate: 14257.56, buyRate: 14107.99, middleRate: 14182.78 },
  { currency: "JPY", currencyName: "Yen Jepang (100)", flag: "🇯🇵", unit: 100, sellRate: 11845.0, buyRate: 11720.0, middleRate: 11782.5 },
  { currency: "CNY", currencyName: "Yuan Tiongkok", flag: "🇨🇳", unit: 1, sellRate: 2528.4, buyRate: 2502.8, middleRate: 2515.6 },
  { currency: "GBP", currencyName: "Poundsterling Inggris", flag: "🇬🇧", unit: 1, sellRate: 23485.6, buyRate: 23245.1, middleRate: 23365.35 },
  { currency: "AUD", currencyName: "Dolar Australia", flag: "🇦🇺", unit: 1, sellRate: 11960.25, buyRate: 11838.5, middleRate: 11899.38 },
  { currency: "MYR", currencyName: "Ringgit Malaysia", flag: "🇲🇾", unit: 1, sellRate: 4125.5, buyRate: 4075.2, middleRate: 4100.35 },
  { currency: "AED", currencyName: "Dirham Uni Emirat Arab", flag: "🇦🇪", unit: 1, sellRate: 4975.8, buyRate: 4925.3, middleRate: 4950.55 },
  { currency: "SAR", currencyName: "Riyal Arab Saudi", flag: "🇸🇦", unit: 1, sellRate: 4869.8, buyRate: 4821.08, middleRate: 4845.44 },
  { currency: "SEK", currencyName: "Krona Swedia", flag: "🇸🇪", unit: 1, sellRate: 1836.93, buyRate: 1817.19, middleRate: 1827.06 },
  { currency: "THB", currencyName: "Baht Thailand", flag: "🇹🇭", unit: 1, sellRate: 541.13, buyRate: 535.27, middleRate: 538.2 },
  { currency: "KRW", currencyName: "Won Korea Selatan", flag: "🇰🇷", unit: 1, sellRate: 13.15, buyRate: 12.98, middleRate: 13.065 },
  { currency: "CAD", currencyName: "Dolar Kanada", flag: "🇨🇦", unit: 1, sellRate: 13210.4, buyRate: 13075.6, middleRate: 13143.0 },
  { currency: "CHF", currencyName: "Franc Swiss", flag: "🇨🇭", unit: 1, sellRate: 20540.8, buyRate: 20330.5, middleRate: 20435.65 },
  { currency: "HKD", currencyName: "Dolar Hong Kong", flag: "🇭🇰", unit: 1, sellRate: 2345.6, buyRate: 2320.4, middleRate: 2333.0 },
  { currency: "NZD", currencyName: "Dolar Selandia Baru", flag: "🇳🇿", unit: 1, sellRate: 10890.3, buyRate: 10775.2, middleRate: 10832.75 },
  { currency: "INR", currencyName: "Rupee India", flag: "🇮🇳", unit: 1, sellRate: 218.4, buyRate: 215.8, middleRate: 217.1 },
  { currency: "PHP", currencyName: "Peso Filipina", flag: "🇵🇭", unit: 1, sellRate: 314.5, buyRate: 310.8, middleRate: 312.65 },
  { currency: "VND", currencyName: "Dong Vietnam", flag: "🇻🇳", unit: 1, sellRate: 0.71, buyRate: 0.7, middleRate: 0.705 },
  { currency: "BND", currencyName: "Dolar Brunei", flag: "🇧🇳", unit: 1, sellRate: 14257.56, buyRate: 14107.99, middleRate: 14182.78 },
  { currency: "DKK", currencyName: "Krone Denmark", flag: "🇩🇰", unit: 1, sellRate: 2660.4, buyRate: 2632.8, middleRate: 2646.6 },
  { currency: "NOK", currencyName: "Krone Norwegia", flag: "🇳🇴", unit: 1, sellRate: 1685.2, buyRate: 1667.5, middleRate: 1676.35 },
  { currency: "KWD", currencyName: "Dinar Kuwait", flag: "🇰🇼", unit: 1, sellRate: 59520.0, buyRate: 58910.0, middleRate: 59215.0 },
  { currency: "QAR", currencyName: "Riyal Qatar", flag: "🇶🇦", unit: 1, sellRate: 5018.5, buyRate: 4965.2, middleRate: 4991.85 },
  { currency: "RUB", currencyName: "Rubel Rusia", flag: "🇷🇺", unit: 1, sellRate: 190.5, buyRate: 187.8, middleRate: 189.15 },
  { currency: "TRY", currencyName: "Lira Turki", flag: "🇹🇷", unit: 1, sellRate: 532.4, buyRate: 525.8, middleRate: 529.1 },
  { currency: "ZAR", currencyName: "Rand Afrika Selatan", flag: "🇿🇦", unit: 1, sellRate: 985.6, buyRate: 974.2, middleRate: 979.9 },
  { currency: "BRL", currencyName: "Real Brasil", flag: "🇧🇷", unit: 1, sellRate: 3240.5, buyRate: 3205.8, middleRate: 3223.15 },
];

export function getBiRateForCurrency(code: string): BankIndonesiaRate {
  const normalized = (code || "USD").toUpperCase().trim();
  const found = OFFICIAL_BI_RATES.find((r) => r.currency === normalized);
  return found || OFFICIAL_BI_RATES[0]; // fallback ke USD
}

// Daftar mata uang terlengkap yang didukung untuk transaksi ekspor & invoice internasional
export const SUPPORTED_CURRENCIES: SupportedCurrency[] = [
  { code: "IDR", name: "Rupiah Indonesia", symbol: "Rp", country: "Indonesia", flag: "🇮🇩", decimals: 0 },
  { code: "USD", name: "Dolar AS (Devisa Global)", symbol: "$", country: "Amerika Serikat / Global", flag: "🇺🇸", decimals: 2 },
  { code: "EUR", name: "Euro Uni Eropa", symbol: "€", country: "Uni Eropa / Jerman / Belanda", flag: "🇪🇺", decimals: 2 },
  { code: "SGD", name: "Dolar Singapura", symbol: "S$", country: "Singapura", flag: "🇸🇬", decimals: 2 },
  { code: "JPY", name: "Yen Jepang", symbol: "¥", country: "Jepang", flag: "🇯🇵", decimals: 0 },
  { code: "CNY", name: "Yuan Tiongkok", symbol: "¥", country: "Tiongkok / China", flag: "🇨🇳", decimals: 2 },
  { code: "GBP", name: "Poundsterling Inggris", symbol: "£", country: "Inggris Raya", flag: "🇬🇧", decimals: 2 },
  { code: "AUD", name: "Dolar Australia", symbol: "A$", country: "Australia", flag: "🇦🇺", decimals: 2 },
  { code: "MYR", name: "Ringgit Malaysia", symbol: "RM", country: "Malaysia", flag: "🇲🇾", decimals: 2 },
  { code: "AED", name: "Dirham UEA (Dubai)", symbol: "AED", country: "Uni Emirat Arab", flag: "🇦🇪", decimals: 2 },
  { code: "SAR", name: "Riyal Arab Saudi", symbol: "SAR", country: "Arab Saudi", flag: "🇸🇦", decimals: 2 },
  { code: "SEK", name: "Krona Swedia", symbol: "kr", country: "Swedia", flag: "🇸🇪", decimals: 2 },
  { code: "THB", name: "Baht Thailand", symbol: "฿", country: "Thailand", flag: "🇹🇭", decimals: 2 },
  { code: "KRW", name: "Won Korea Selatan", symbol: "₩", country: "Korea Selatan", flag: "🇰🇷", decimals: 0 },
  { code: "CAD", name: "Dolar Kanada", symbol: "CA$", country: "Kanada", flag: "🇨🇦", decimals: 2 },
  { code: "CHF", name: "Franc Swiss", symbol: "CHF", country: "Swiss", flag: "🇨🇭", decimals: 2 },
  { code: "HKD", name: "Dolar Hong Kong", symbol: "HK$", country: "Hong Kong", flag: "🇭🇰", decimals: 2 },
  { code: "NZD", name: "Dolar Selandia Baru", symbol: "NZ$", country: "Selandia Baru", flag: "🇳🇿", decimals: 2 },
  { code: "INR", name: "Rupee India", symbol: "₹", country: "India", flag: "🇮🇳", decimals: 2 },
  { code: "PHP", name: "Peso Filipina", symbol: "₱", country: "Filipina", flag: "🇵🇭", decimals: 2 },
  { code: "VND", name: "Dong Vietnam", symbol: "₫", country: "Vietnam", flag: "🇻🇳", decimals: 0 },
  { code: "BND", name: "Dolar Brunei", symbol: "B$", country: "Brunei Darussalam", flag: "🇧🇳", decimals: 2 },
  { code: "DKK", name: "Krone Denmark", symbol: "kr", country: "Denmark", flag: "🇩🇰", decimals: 2 },
  { code: "NOK", name: "Krone Norwegia", symbol: "kr", country: "Norwegia", flag: "🇳🇴", decimals: 2 },
  { code: "KWD", name: "Dinar Kuwait", symbol: "KD", country: "Kuwait", flag: "🇰🇼", decimals: 2 },
  { code: "QAR", name: "Riyal Qatar", symbol: "QR", country: "Qatar", flag: "🇶🇦", decimals: 2 },
  { code: "RUB", name: "Rubel Rusia", symbol: "₽", country: "Rusia", flag: "🇷🇺", decimals: 2 },
  { code: "TRY", name: "Lira Turki", symbol: "₺", country: "Turki", flag: "🇹🇷", decimals: 2 },
  { code: "ZAR", name: "Rand Afrika Selatan", symbol: "R", country: "Afrika Selatan", flag: "🇿🇦", decimals: 2 },
  { code: "BRL", name: "Real Brasil", symbol: "R$", country: "Brasil", flag: "🇧🇷", decimals: 2 },
];

/**
 * Mendapatkan rekomendasi mata uang berdasarkan negara buyer secara cerdas.
 */
export function getRecommendedCurrencyForCountry(countryName: string): SupportedCurrency | null {
  if (!countryName) return null;
  const lower = countryName.toLowerCase();
  if (lower.includes("indonesia")) return SUPPORTED_CURRENCIES[0]; // IDR
  if (lower.includes("jepang") || lower.includes("japan")) return SUPPORTED_CURRENCIES[4]; // JPY
  if (lower.includes("singapura") || lower.includes("singapore")) return SUPPORTED_CURRENCIES[3]; // SGD
  if (lower.includes("malaysia")) return SUPPORTED_CURRENCIES[8]; // MYR
  if (lower.includes("emirat") || lower.includes("dubai") || lower.includes("uae") || lower.includes("arab emirates")) {
    return SUPPORTED_CURRENCIES[9]; // AED
  }
  if (lower.includes("saudi")) return SUPPORTED_CURRENCIES[10]; // SAR
  if (lower.includes("swedia") || lower.includes("sweden")) return SUPPORTED_CURRENCIES[11]; // SEK
  if (lower.includes("thailand") || lower.includes("bangkok")) return SUPPORTED_CURRENCIES[12]; // THB
  if (lower.includes("korea")) return SUPPORTED_CURRENCIES[13]; // KRW
  if (lower.includes("tiongkok") || lower.includes("china") || lower.includes("tionghoa")) return SUPPORTED_CURRENCIES[5]; // CNY
  if (lower.includes("inggris") || lower.includes("uk") || lower.includes("united kingdom") || lower.includes("britain")) {
    return SUPPORTED_CURRENCIES[6]; // GBP
  }
  if (lower.includes("australia")) return SUPPORTED_CURRENCIES[7]; // AUD
  if (lower.includes("kanada") || lower.includes("canada")) return SUPPORTED_CURRENCIES[14]; // CAD
  if (lower.includes("swiss") || lower.includes("switzerland")) return SUPPORTED_CURRENCIES[15]; // CHF
  if (lower.includes("hong kong") || lower.includes("hongkong")) return SUPPORTED_CURRENCIES[16]; // HKD
  if (lower.includes("selandia") || lower.includes("new zealand")) return SUPPORTED_CURRENCIES[17]; // NZD
  if (lower.includes("india")) return SUPPORTED_CURRENCIES[18]; // INR
  if (lower.includes("filipina") || lower.includes("philippines")) return SUPPORTED_CURRENCIES[19]; // PHP
  if (lower.includes("vietnam")) return SUPPORTED_CURRENCIES[20]; // VND
  if (
    lower.includes("jerman") ||
    lower.includes("germany") ||
    lower.includes("belanda") ||
    lower.includes("netherlands") ||
    lower.includes("prancis") ||
    lower.includes("france") ||
    lower.includes("italia") ||
    lower.includes("italy") ||
    lower.includes("spanyol") ||
    lower.includes("spain") ||
    lower.includes("eropa") ||
    lower.includes("europe")
  ) {
    return SUPPORTED_CURRENCIES[2]; // EUR
  }
  if (lower.includes("amerika") || lower.includes("united states") || lower.includes("usa") || lower.includes("us")) {
    return SUPPORTED_CURRENCIES[1]; // USD
  }
  return null;
}

/**
 * Format mata uang dengan simbol lokal yang rapi dan terstandarisasi.
 */
export function formatCurrencyAmount(amount: number, currency: string): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const code = (currency || "USD").trim().toUpperCase();

  const found = SUPPORTED_CURRENCIES.find((c) => c.code === code);
  const decimals = found ? found.decimals : 2;

  const formattedNum = new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(safe);

  if (found) {
    return `${found.symbol} ${formattedNum}`;
  }
  return `${code} ${formattedNum}`;
}

/**
 * Konversi nilai uang antar mata uang secara presisi menggunakan kurs transaksi resmi Bank Indonesia.
 */
export function convertCurrencyValue(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  customUsdRate?: number,
  liveRates?: Record<string, number>,
): number {
  if (!Number.isFinite(amount) || amount === 0) return 0;
  const from = (fromCurrency || "USD").toUpperCase();
  const to = (toCurrency || "IDR").toUpperCase();
  if (from === to) return amount;

  // Nilai 1 unit valas dalam satuan IDR
  const getUnitRateInIdr = (cur: string): number => {
    if (cur === "IDR") return 1;
    if (cur === "USD" && customUsdRate && customUsdRate > 0) return customUsdRate;

    const bi = OFFICIAL_BI_RATES.find((r) => r.currency === cur);
    if (bi) {
      return bi.sellRate / bi.unit;
    }
    // Jika ada di liveRates USD base
    if (liveRates && typeof liveRates[cur] === "number" && liveRates[cur] > 0) {
      const usdRate = customUsdRate || 18273.92;
      return usdRate / liveRates[cur];
    }
    return 18273.92; // fallback USD rate
  };

  const fromRateInIdr = getUnitRateInIdr(from);
  const toRateInIdr = getUnitRateInIdr(to);

  // Langkah 1: Konversi ke Rupiah (IDR)
  const amountInIdr = from === "IDR" ? amount : amount * fromRateInIdr;

  // Langkah 2: Konversi dari Rupiah ke mata uang tujuan
  if (to === "IDR") {
    return amountInIdr;
  }
  return amountInIdr / toRateInIdr;
}
