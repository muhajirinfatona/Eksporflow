import { describe, expect, it } from "vitest";
import {
  convertCurrencyValue,
  formatCurrencyAmount,
  getBiRateForCurrency,
  getRecommendedCurrencyForCountry,
  OFFICIAL_BI_RATES,
  SUPPORTED_CURRENCIES,
} from "./currencies";

describe("shared/currencies", () => {
  it("defines comprehensive list of export currencies (30 currencies)", () => {
    expect(SUPPORTED_CURRENCIES.length).toBeGreaterThanOrEqual(30);
    expect(OFFICIAL_BI_RATES.length).toBeGreaterThanOrEqual(28);
    expect(SUPPORTED_CURRENCIES.some((c) => c.code === "IDR")).toBe(true);
    expect(SUPPORTED_CURRENCIES.some((c) => c.code === "USD")).toBe(true);
    expect(SUPPORTED_CURRENCIES.some((c) => c.code === "EUR")).toBe(true);
    expect(SUPPORTED_CURRENCIES.some((c) => c.code === "MYR")).toBe(true);
    expect(SUPPORTED_CURRENCIES.some((c) => c.code === "AED")).toBe(true);
    expect(SUPPORTED_CURRENCIES.some((c) => c.code === "SAR")).toBe(true);
    expect(SUPPORTED_CURRENCIES.some((c) => c.code === "THB")).toBe(true);
  });

  it("recommends appropriate currency based on buyer country", () => {
    expect(getRecommendedCurrencyForCountry("Indonesia")?.code).toBe("IDR");
    expect(getRecommendedCurrencyForCountry("Jepang")?.code).toBe("JPY");
    expect(getRecommendedCurrencyForCountry("Japan")?.code).toBe("JPY");
    expect(getRecommendedCurrencyForCountry("Jerman")?.code).toBe("EUR");
    expect(getRecommendedCurrencyForCountry("Swedia")?.code).toBe("SEK");
    expect(getRecommendedCurrencyForCountry("Singapura")?.code).toBe("SGD");
    expect(getRecommendedCurrencyForCountry("Malaysia")?.code).toBe("MYR");
    expect(getRecommendedCurrencyForCountry("Dubai UAE")?.code).toBe("AED");
    expect(getRecommendedCurrencyForCountry("Arab Saudi")?.code).toBe("SAR");
    expect(getRecommendedCurrencyForCountry("Tiongkok")?.code).toBe("CNY");
    expect(getRecommendedCurrencyForCountry("Inggris")?.code).toBe("GBP");
    expect(getRecommendedCurrencyForCountry("Australia")?.code).toBe("AUD");
    expect(getRecommendedCurrencyForCountry("Amerika Serikat")?.code).toBe("USD");
    expect(getRecommendedCurrencyForCountry("")).toBeNull();
  });

  it("formats currency amounts with localized symbols", () => {
    expect(formatCurrencyAmount(16250, "USD")).toContain("16.250");
    expect(formatCurrencyAmount(1000000, "IDR")).toContain("Rp 1.000.000");
    expect(formatCurrencyAmount(500, "EUR")).toContain("€ 500");
    expect(formatCurrencyAmount(10000, "JPY")).toContain("¥ 10.000");
    expect(formatCurrencyAmount(500, "MYR")).toContain("RM 500");
  });

  it("converts values between any world currencies accurately", () => {
    // 10 USD = 182,739.2 IDR
    const idrVal = convertCurrencyValue(10, "USD", "IDR", 18273.92);
    expect(Math.round(idrVal)).toBe(182739);

    // 182,739.2 IDR = 10 USD
    const usdVal = convertCurrencyValue(182739.2, "IDR", "USD", 18273.92);
    expect(Math.round(usdVal)).toBe(10);

    // Convert EUR to IDR using Bank Indonesia rate (19854.20)
    const eurInIdr = convertCurrencyValue(100, "EUR", "IDR");
    expect(Math.round(eurInIdr)).toBe(1985420);

    // Convert IDR to SGD
    const sgdRate = getBiRateForCurrency("SGD").sellRate; // 14257.56
    const sgdVal = convertCurrencyValue(1425756, "IDR", "SGD");
    expect(Math.round(sgdVal)).toBe(100);

    // Same currency identity
    expect(convertCurrencyValue(50, "USD", "USD")).toBe(50);
  });
});
