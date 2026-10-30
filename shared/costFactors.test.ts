import { describe, expect, it } from "vitest";
import {
  convertTemplateCost,
  COUNTRY_REGULATION_PRESETS,
  INCOTERM_TEMPLATES,
} from "./costFactors";

describe("costFactors engine", () => {
  it("provides templates for all 7 standard Incoterms", () => {
    const terms = ["EXW", "FCA", "FOB", "CFR", "CIF", "DAP", "DDP"] as const;
    for (const term of terms) {
      expect(INCOTERM_TEMPLATES[term]).toBeDefined();
      expect(INCOTERM_TEMPLATES[term].defaultCostsIdr).toBeDefined();
    }
  });

  it("ensures DAP and DDP include destination and last mile logistics", () => {
    const dap = INCOTERM_TEMPLATES.DAP;
    expect(dap.defaultCostsIdr.destinationHandling).toBeGreaterThan(0);
    expect(dap.defaultCostsIdr.lastMile).toBeGreaterThan(0);
    expect(dap.defaultCostsIdr.importDuty).toBe(0);

    const ddp = INCOTERM_TEMPLATES.DDP;
    expect(ddp.defaultCostsIdr.importDuty).toBeGreaterThan(0);
    expect(ddp.defaultCostsIdr.lastMile).toBeGreaterThan(0);
  });

  it("converts costs between IDR and foreign currencies accurately", () => {
    const costIdr = 18274000;
    const usd = convertTemplateCost(costIdr, "USD", 18274);
    expect(usd).toBe(1000);

    const idr = convertTemplateCost(costIdr, "IDR", 18274);
    expect(idr).toBe(18274000);
  });

  it("contains critical export regulatory presets (Phytosanitary, ISPM-15, Halal, COO)", () => {
    const ids = COUNTRY_REGULATION_PRESETS.map((p) => p.id);
    expect(ids).toContain("reg-phyto");
    expect(ids).toContain("reg-fumigation");
    expect(ids).toContain("reg-halal");
    expect(ids).toContain("reg-coo");
  });
});
