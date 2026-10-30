import { describe, expect, it } from "vitest";
import { calculateManufacturerHpp, calculateTraderHpp } from "./hpp";

describe("calculateTraderHpp", () => {
  it("accurately calculates trader HPP with shrinkage rate", () => {
    // Petani: Rp 20.000 / kg, susut 10% (yield: 1 / 0.9 = 1.1111... -> Rp 22.222,22)
    // Angkut: Rp 500, Sortasi: Rp 1.000, Kemasan: Rp 1.000, Margin: Rp 500
    // Total per unit = 25222.22
    const res = calculateTraderHpp({
      supplierBuyPrice: 20000,
      shrinkageRatePercent: 10,
      sourcingFreightPerUnit: 500,
      sortingLaborPerUnit: 1000,
      innerPackagingPerUnit: 1000,
      traderMarginPerUnit: 500,
      quantity: 1000,
    });

    expect(res.effectiveMaterialCostPerUnit).toBeCloseTo(22222.22, 1);
    expect(res.shrinkageCostImpactPerUnit).toBeCloseTo(2222.22, 1);
    expect(res.totalHppPerUnit).toBeCloseTo(25222.22, 1);
    expect(res.totalHppOverall).toBeCloseTo(25222222.22, 1);
  });

  it("handles zero shrinkage correctly", () => {
    const res = calculateTraderHpp({
      supplierBuyPrice: 15,
      shrinkageRatePercent: 0,
      sourcingFreightPerUnit: 1,
      sortingLaborPerUnit: 0.5,
      innerPackagingPerUnit: 0.5,
      traderMarginPerUnit: 1,
      quantity: 100,
    });

    expect(res.effectiveMaterialCostPerUnit).toBe(15);
    expect(res.shrinkageCostImpactPerUnit).toBe(0);
    expect(res.totalHppPerUnit).toBe(18);
    expect(res.totalHppOverall).toBe(1800);
  });
});

describe("calculateManufacturerHpp", () => {
  it("calculates factory production HPP accurately", () => {
    const res = calculateManufacturerHpp({
      rawMaterialPerUnit: 10,
      auxiliaryMaterialPerUnit: 2,
      directLaborPerUnit: 3,
      factoryOverheadPerUnit: 1.5,
      quantity: 500,
    });

    expect(res.totalHppPerUnit).toBe(16.5);
    expect(res.totalHppOverall).toBe(8250);
  });
});
