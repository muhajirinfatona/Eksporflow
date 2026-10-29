import { describe, expect, it } from "vitest";
import { parsePoTextAndScreen, SAMPLE_POS } from "./poScreening";

describe("PO Text Parsing & AI Advisor Buyer Screening (4 Pillars)", () => {
  it("mengekstrak parameter Nordic Pantry AB dan memvalidasi 4 pilar identitas", () => {
    const result = parsePoTextAndScreen(SAMPLE_POS[0].text);
    expect(result.reference).toBe("PO-2026/SE-089");
    expect(result.buyer).toContain("Nordic Pantry AB");
    expect(result.buyerCountry).toBe("Swedia");
    expect(result.destination).toContain("Gothenburg");
    expect(result.hsCode).toBe("1702.90");
    expect(result.incoterm).toBe("CIF");

    // 4 Pilar
    const { pillars } = result.validation;
    expect(pillars.companyName.isValid).toBe(true);
    expect(pillars.companyEmail.isValid).toBe(true);
    expect(pillars.companyEmail.value).toContain("@nordicpantry.se");
    expect(pillars.contactNumber.isValid).toBe(true);
    expect(pillars.contactNumber.value).toContain("+46");
    expect(pillars.companyWebsite.isValid).toBe(true);
    expect(pillars.companyWebsite.value).toContain("nordicpantry.se");

    expect(result.validation.status).toBe("verified");
    expect(result.validation.score).toBeGreaterThanOrEqual(85);
  });

  it("mendeteksi peringatan jika email menggunakan domain publik gratisan", () => {
    const poWithGmail = `
      PO Number: PO-TEST-01
      Company Name: Kyoto Trading Co., Ltd.
      Email: kyototrading@gmail.com
      Phone: +81 75 221 8830
      Port of Discharge: Tokyo
    `;
    const result = parsePoTextAndScreen(poWithGmail);
    expect(result.validation.pillars.companyEmail.isValid).toBe(false);
    expect(result.validation.pillars.companyEmail.note).toContain("gratisan");
  });
});
