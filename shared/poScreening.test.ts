import { describe, expect, it } from "vitest";
import { parsePoTextAndScreen, SAMPLE_POS } from "./poScreening";

describe("PO Text Parsing & AI Advisor Buyer Screening", () => {
  it("mengekstrak parameter Nordic Pantry AB dan memvalidasi kredibilitas buyer Swedia", () => {
    const result = parsePoTextAndScreen(SAMPLE_POS[0].text);
    expect(result.reference).toBe("PO-2026/SE-089");
    expect(result.buyer).toContain("Nordic Pantry AB");
    expect(result.buyerCountry).toBe("Swedia");
    expect(result.destination).toContain("Gothenburg");
    expect(result.hsCode).toBe("1702.90");
    expect(result.incoterm).toBe("CIF");
    expect(result.validation.status).toBe("verified");
    expect(result.validation.score).toBeGreaterThanOrEqual(85);
  });

  it("mengekstrak parameter Kyoto Trading Co., Ltd. dari Jepang dengan L/C payment", () => {
    const result = parsePoTextAndScreen(SAMPLE_POS[1].text);
    expect(result.reference).toBe("PO-JP-8841");
    expect(result.buyer).toContain("Kyoto Trading Co., Ltd.");
    expect(result.buyerCountry).toBe("Jepang");
    expect(result.incoterm).toBe("FOB");
    expect(result.validation.status).toBe("verified");
  });

  it("mendeteksi klausul pembayaran berisiko (100% CAD tanpa DP)", () => {
    const highRiskPo = `
      PO Number: PO-ALERT-01
      Buyer: Shady Import Inc
      Country: United States
      Port of Discharge: Long Beach
      Payment Terms: 100% CAD (Cash Against Documents) 90 days after arrival
    `;
    const result = parsePoTextAndScreen(highRiskPo);
    expect(result.validation.status).toBe("high_risk");
    expect(result.validation.score).toBeLessThan(70);
    expect(result.validation.paymentTermRisk).toContain("Risiko Tinggi");
  });
});
