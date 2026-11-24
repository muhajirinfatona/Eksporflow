import { describe, expect, it } from "vitest";
import { calculatePricing, calculateMaritimeInsurance, evaluateDheSdaCompliance, incotermCostKeys } from "./pricing";
import { initialShipment } from "./shipment";

describe("calculatePricing (formula v1.8)", () => {
  it("menghitung CIF dengan net-price margin dan contingency terpisah", () => {
    const result = calculatePricing(initialShipment);
    // goods 44.400 + packaging 1.320 + inland 640 + handling 380 + customs 275 + freight 2.860 + insurance 185 = 50.060
    // contingency 2% => 51.061,2 ; offer = cost / (1 - 12%)
    expect(result.goods).toBe(44400);
    expect(result.totalQuantity).toBe(2400);
    expect(result.active.cost).toBeCloseTo(51061.2, 2);
    expect(result.active.offer).toBeCloseTo(51061.2 / 0.88, 2);
    expect(result.active.profit).toBeCloseTo(51061.2 / 0.88 - 51061.2, 2);
    expect(result.active.unit).toBeCloseTo(result.active.offer / 2400, 6);
    expect(result.validationErrors).toEqual([]);
  });

  it("margin dihitung dari harga jual, bukan markup di atas cost", () => {
    const { active } = calculatePricing(initialShipment);
    expect(active.profit / active.offer).toBeCloseTo(0.12, 6);
  });

  it("EXW memuat lebih sedikit komponen biaya dibanding DDP", () => {
    const { scenarios } = calculatePricing(initialShipment);
    const byTerm = Object.fromEntries(scenarios.map((s) => [s.term, s.cost]));
    expect(byTerm.EXW).toBeCloseTo((44400 + 1320) * 1.02, 2);
    expect(byTerm.EXW).toBeLessThan(byTerm.FOB);
    expect(byTerm.FOB).toBeLessThan(byTerm.CIF);
    expect(byTerm.CIF).toBeLessThan(byTerm.DDP);
    expect(scenarios.map((s) => s.term)).toEqual(Object.keys(incotermCostKeys));
  });

  it("diskon mengurangi harga penawaran dan tidak membuat harga negatif", () => {
    const base = calculatePricing(initialShipment).active.offer;
    expect(calculatePricing({ ...initialShipment, discount: 1000 }).active.offer).toBeCloseTo(base - 1000, 2);
    expect(calculatePricing({ ...initialShipment, discount: 10_000_000 }).active.offer).toBe(0);
  });

  it("menandai input tidak valid", () => {
    const errors = calculatePricing({
      ...initialShipment,
      margin: 100,
      exchangeRate: 0,
      namedPlace: "  ",
      discount: -1,
      currency: "",
      lineItems: [],
    }).validationErrors;
    expect(errors).toHaveLength(6);
  });

  it("margin 0% menghasilkan offer sama dengan cost", () => {
    const { active } = calculatePricing({ ...initialShipment, margin: 0 });
    expect(active.offer).toBeCloseTo(active.cost, 6);
    expect(active.profit).toBe(0);
  });

  describe("evaluateDheSdaCompliance (PP No. 36/2023)", () => {
    it("menandai transaksi < USD 250k sebagai dikecualikan dari DHE SDA", () => {
      const res = evaluateDheSdaCompliance(58024);
      expect(res.isEligible).toBe(false);
      expect(res.minRetentionUsd).toBe(0);
      expect(res.thresholdUsd).toBe(250000);
    });

    it("menghitung kewajiban retensi 30% untuk transaksi >= USD 250k", () => {
      const res = evaluateDheSdaCompliance(300000);
      expect(res.isEligible).toBe(true);
      expect(res.minRetentionUsd).toBe(90000);
      expect(res.retentionMonths).toBe(3);
    });
  });

  describe("calculateMaritimeInsurance (Incoterms 2020 & ICC)", () => {
    it("menghitung premi ICC (C) standar CIF sebesar 110% nilai barang & freight", () => {
      const res = calculateMaritimeInsurance(50000, "ICC_C", 0.2);
      expect(res.insuredValue).toBe(55000); // 110% of 50000
      expect(res.premiumAmount).toBe(110);   // 0.2% of 55000
      expect(res.clause).toContain("Institute Cargo Clauses (C)");
    });

    it("menghitung premi ICC (A) all-risks standar CIP", () => {
      const res = calculateMaritimeInsurance(50000, "ICC_A", 0.5);
      expect(res.insuredValue).toBe(55000);
      expect(res.premiumAmount).toBe(275); // 0.5% of 55000
      expect(res.clause).toContain("Institute Cargo Clauses (A)");
    });
  });
});
