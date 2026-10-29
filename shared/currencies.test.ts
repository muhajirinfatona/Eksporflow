import { describe, expect, it } from "vitest";
import {
  convertCurrencyValue,
  formatCurrencyAmount,
  getRecommendedCurrencyForCountry,
  SUPPORTED_CURRENCIES,
} from "./currencies";

describe("shared/currencies", () => {
  it("defines supported export currencies including IDR and USD", () => {
    expect(SUPPORTED_CURRENCIES.length).toBeGreaterThanOrEqual(8);
    expect(SUPPORTED_CURRENCIES.some((c) => c.code === "IDR")).toBe(true);
    expect(SUPPORTED_CURRENCIES.some((c) => c.code === "USD")).toBe(true);
    expect(SUPPORTED_CURRENCIES.some((c) => c.code === "EUR")).toBe(true);
    expect(SUPPORTED_CURRENCIES.some((c) => c.code === "JPY")).toBe(true);
  });

  it("recommends appropriate currency based on buyer country", () => {
    expect(getRecommendedCurrencyForCountry("Indonesia")?.code).toBe("IDR");
    expect(getRecommendedCurrencyForCountry("Jepang")?.code).toBe("JPY");
    expect(getRecommendedCurrencyForCountry("Japan")?.code).toBe("JPY");
    expect(getRecommendedCurrencyForCountry("Jerman")?.code).toBe("EUR");
    expect(getRecommendedCurrencyForCountry("Swedia")?.code).toBe("EUR");
    expect(getRecommendedCurrencyForCountry("Singapura")?.code).toBe("SGD");
    expect(getRecommendedCurrencyForCountry("Tiongkok")?.code).toBe("CNY");
    expect(getRecommendedCurrencyForCountry("Inggris")?.code).toBe("GBP");
    expect(getRecommendedCurrencyForCountry("Australia")?.code).toBe("AUD");
    expect(getRecommendedCurrencyForCountry("Amerika Serikat")?.code).toBe("USD");
    expect(getRecommendedCurrencyForCountry("")).toBeNull();
  });

  it("formats currency amounts with localized symbols", () => {
    expect(formatCurrencyAmount(16250, "USD")).toContain("$16.250");
    expect(formatCurrencyAmount(1000000, "IDR")).toContain("Rp 1.000.000");
    expect(formatCurrencyAmount(500, "EUR")).toContain("€500");
    expect(formatCurrencyAmount(10000, "JPY")).toContain("¥10.000");
  });

  it("converts values between currencies accurately", () => {
    // 1 USD = 18,274 IDR (Kurs Bank Indonesia)
    const idrVal = convertCurrencyValue(10, "USD", "IDR", 18274);
    expect(idrVal).toBe(182740);

    // 182,740 IDR = 10 USD
    const usdVal = convertCurrencyValue(182740, "IDR", "USD", 18274);
    expect(usdVal).toBe(10);

    // Same currency identity
    expect(convertCurrencyValue(50, "USD", "USD", 18274)).toBe(50);
  });
});
