import { describe, expect, it } from "vitest";
import {
  calculateExportPricingModel,
  defaultAdditionalCosts,
  defaultHppInput,
} from "./exportCalculator";

describe("calculateExportPricingModel", () => {
  it("calculates HPP with yield conversion correctly", () => {
    const result = calculateExportPricingModel({
      currency: "USD",
      quantityMt: 20,
      targetMarkup: 0.20,
      hpp: defaultHppInput,
      additionalCosts: defaultAdditionalCosts,
    });

    // 1200 / 0.9 = 1333.33
    expect(result.effectiveRawCostPerMt).toBeCloseTo(1333.33, 1);
    // 35 / 0.9 = 38.89
    expect(result.effectiveSourcingFreightPerMt).toBeCloseTo(38.89, 1);
    // 200 / 20 = 10
    expect(result.fixedPrepCostPerMt).toBe(10);

    expect(result.totalHppPerMt).toBeGreaterThan(1500);
    expect(result.totalHppOrder).toBeCloseTo(result.totalHppPerMt * 20, 1);
  });

  it("calculates Incoterm chain break-even and target prices", () => {
    const result = calculateExportPricingModel({
      currency: "USD",
      quantityMt: 20,
      targetMarkup: 0.20,
      buyerPricePerMt: 2200,
      hpp: defaultHppInput,
      additionalCosts: defaultAdditionalCosts,
    });

    const exw = result.chain.find((r) => r.term === "EXW")!;
    const fob = result.chain.find((r) => r.term === "FOB")!;
    const cfr = result.chain.find((r) => r.term === "CFR")!;
    const cif = result.chain.find((r) => r.term === "CIF")!;

    expect(exw.breakEvenPricePerMt).toBe(result.totalHppPerMt);
    expect(fob.breakEvenPricePerMt).toBeGreaterThan(exw.breakEvenPricePerMt);
    expect(cfr.breakEvenPricePerMt).toBeGreaterThan(fob.breakEvenPricePerMt);
    expect(cif.breakEvenPricePerMt).toBeGreaterThan(cfr.breakEvenPricePerMt);

    // Target price = breakEven * 1.20
    expect(cif.targetPricePerMt).toBeCloseTo(cif.breakEvenPricePerMt * 1.20, 1);
  });

  it("evaluates buyer price indicators correctly", () => {
    const result = calculateExportPricingModel({
      currency: "USD",
      quantityMt: 20,
      targetMarkup: 0.20,
      buyerPricePerMt: 1000, // very low price
      hpp: defaultHppInput,
      additionalCosts: defaultAdditionalCosts,
    });

    const cif = result.chain.find((r) => r.term === "CIF")!;
    expect(cif.breakEvenIndicator).toBe("RUGI");
    expect(cif.targetStatus).toBe("RUGI");
  });
});
