export type SupportedCurrency = {
  code: string;
  name: string;
  symbol: string;
  country: string;
  flag: string;
  decimals: number;
};

export const SUPPORTED_CURRENCIES: SupportedCurrency[] = [
  { code: "IDR", name: "Rupiah Indonesia", symbol: "Rp", country: "Indonesia", flag: "🇮🇩", decimals: 0 },
  { code: "USD", name: "Dolar AS (Devisa Global)", symbol: "$", country: "Amerika Serikat / Global", flag: "🇺🇸", decimals: 2 },
  { code: "EUR", name: "Euro Uni Eropa", symbol: "€", country: "Uni Eropa / Jerman / Swedia", flag: "🇪🇺", decimals: 2 },
  { code: "JPY", name: "Yen Jepang", symbol: "¥", country: "Jepang", flag: "🇯🇵", decimals: 0 },
  { code: "SGD", name: "Dolar Singapura", symbol: "S$", country: "Singapura", flag: "🇸🇬", decimals: 2 },
  { code: "CNY", name: "Yuan Tiongkok", symbol: "¥", country: "Tiongkok / China", flag: "🇨🇳", decimals: 2 },
  { code: "GBP", name: "Poundsterling Inggris", symbol: "£", country: "Inggris Raya", flag: "🇬🇧", decimals: 2 },
  { code: "AUD", name: "Dolar Australia", symbol: "A$", country: "Australia", flag: "🇦🇺", decimals: 2 },
];

/**
 * Mendapatkan rekomendasi mata uang berdasarkan negara buyer.
 */
export function getRecommendedCurrencyForCountry(countryName: string): SupportedCurrency | null {
  if (!countryName) return null;
  const lower = countryName.toLowerCase();
  if (lower.includes("indonesia")) return SUPPORTED_CURRENCIES[0];
  if (lower.includes("jepang") || lower.includes("japan")) return SUPPORTED_CURRENCIES[3];
  if (
    lower.includes("jerman") ||
    lower.includes("germany") ||
    lower.includes("swedia") ||
    lower.includes("sweden") ||
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
    return SUPPORTED_CURRENCIES[2];
  }
  if (lower.includes("singapura") || lower.includes("singapore")) return SUPPORTED_CURRENCIES[4];
  if (lower.includes("tiongkok") || lower.includes("china") || lower.includes("tionghoa")) return SUPPORTED_CURRENCIES[5];
  if (lower.includes("inggris") || lower.includes("uk") || lower.includes("united kingdom") || lower.includes("britain")) {
    return SUPPORTED_CURRENCIES[6];
  }
  if (lower.includes("australia")) return SUPPORTED_CURRENCIES[7];
  if (lower.includes("amerika") || lower.includes("united states") || lower.includes("usa") || lower.includes("us")) {
    return SUPPORTED_CURRENCIES[1];
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

  if (code === "IDR") return `Rp ${formattedNum}`;
  if (code === "USD") return `$${formattedNum}`;
  if (code === "EUR") return `€${formattedNum}`;
  if (code === "JPY") return `¥${formattedNum}`;
  if (code === "SGD") return `S$${formattedNum}`;
  if (code === "CNY") return `¥${formattedNum}`;
  if (code === "GBP") return `£${formattedNum}`;
  if (code === "AUD") return `A$${formattedNum}`;
  return `${code} ${formattedNum}`;
}

/**
 * Konversi nilai uang antar mata uang dengan basis kurs USD -> IDR dan rates FX live.
 */
export function convertCurrencyValue(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  usdToIdrRate: number,
  liveRates?: Record<string, number>,
): number {
  if (!Number.isFinite(amount) || amount === 0) return 0;
  const from = (fromCurrency || "USD").toUpperCase();
  const to = (toCurrency || "IDR").toUpperCase();
  if (from === to) return amount;

  const validRate = usdToIdrRate > 0 ? usdToIdrRate : 18274;
  const fxRates: Record<string, number> = {
    USD: 1,
    IDR: validRate,
    EUR: 0.915,
    JPY: 154.2,
    SGD: 1.315,
    CNY: 7.22,
    GBP: 0.785,
    AUD: 1.515,
    ...(liveRates || {}),
  };

  // Step 1: konversi from ke USD
  let amountInUsd = 0;
  if (from === "USD") {
    amountInUsd = amount;
  } else if (from === "IDR") {
    amountInUsd = amount / validRate;
  } else {
    const rateFrom = fxRates[from] || 1;
    amountInUsd = amount / rateFrom;
  }

  // Step 2: konversi USD ke target currency
  if (to === "USD") {
    return amountInUsd;
  }
  if (to === "IDR") {
    return amountInUsd * validRate;
  }
  const targetRate = fxRates[to] || 1;
  return amountInUsd * targetRate;
}
