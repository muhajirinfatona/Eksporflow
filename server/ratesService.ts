export type ExchangeRatesData = {
  base: string;
  rates: Record<string, number>;
  usdToIdr: number;
  lastUpdated: string;
  source: string;
};

const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  IDR: 16250,
  EUR: 0.915,
  JPY: 154.2,
  SGD: 1.315,
  CNY: 7.22,
  GBP: 0.785,
  AUD: 1.515,
};

let cachedRates: ExchangeRatesData | null = null;
let lastFetchTimestamp = 0;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 menit

export async function getLiveExchangeRates(forceRefresh = false): Promise<ExchangeRatesData> {
  const now = Date.now();
  if (!forceRefresh && cachedRates && now - lastFetchTimestamp < CACHE_TTL_MS) {
    return cachedRates;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = (await res.json()) as {
        result: string;
        rates?: Record<string, number>;
        time_last_update_utc?: string;
      };

      if (data.rates && typeof data.rates.IDR === "number") {
        const idrRate = Math.round(data.rates.IDR);
        const result: ExchangeRatesData = {
          base: "USD",
          rates: {
            USD: 1,
            IDR: idrRate,
            EUR: Number((data.rates.EUR || FALLBACK_RATES.EUR).toFixed(4)),
            JPY: Number((data.rates.JPY || FALLBACK_RATES.JPY).toFixed(2)),
            SGD: Number((data.rates.SGD || FALLBACK_RATES.SGD).toFixed(4)),
            CNY: Number((data.rates.CNY || FALLBACK_RATES.CNY).toFixed(4)),
            GBP: Number((data.rates.GBP || FALLBACK_RATES.GBP).toFixed(4)),
            AUD: Number((data.rates.AUD || FALLBACK_RATES.AUD).toFixed(4)),
          },
          usdToIdr: idrRate,
          lastUpdated: new Date().toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
          source: "Pasar Devisa Interbank (Live FX)",
        };

        cachedRates = result;
        lastFetchTimestamp = now;
        return result;
      }
    }
  } catch (err) {
    console.warn("[Rates] Live FX fetch fallback:", err instanceof Error ? err.message : err);
  }

  // Fallback jika offline / fetch timeout
  const fallbackResult: ExchangeRatesData = {
    base: "USD",
    rates: FALLBACK_RATES,
    usdToIdr: FALLBACK_RATES.IDR,
    lastUpdated: new Date().toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    source: "Kurs Acuan Pasar Ekspor (Fallback)",
  };

  cachedRates = fallbackResult;
  lastFetchTimestamp = now;
  return fallbackResult;
}
