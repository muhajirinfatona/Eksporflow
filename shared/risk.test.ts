import { describe, expect, it } from "vitest";
import { calculateContainer } from "./container";
import { formatMoney, getDocumentNumber } from "./format";
import { calculatePricing } from "./pricing";
import { computeRecommendations, evaluateRiskChecks } from "./risk";
import { initialShipment } from "./shipment";

describe("evaluateRiskChecks & computeRecommendations", () => {
  it("tidak pernah mengeluarkan status Ready to ship meskipun seluruh 9 kontrol terpenuhi", () => {
    const completeShipment = {
      ...initialShipment,
      bookingNumber: "MSC-IND-8845",
      containerNumber: "MSCU4821990",
      sealNumber: "SL-99812",
      attachments: ["Buyer_PO_NPI-2026-118.pdf", "Buyer_Email_Confirmation.pdf"],
    };
    const pricing = calculatePricing(completeShipment);
    const container = calculateContainer(completeShipment);
    const result = evaluateRiskChecks(completeShipment, pricing, container, {
      hsCodeReviewed: true,
      originEvidence: true,
      paymentTermsReviewed: true,
      sanctionsScreened: true,
    });
    expect(result.passed).toBe(9);
    expect(result.readinessPercent).toBe(100);
    expect(result.riskLevel).toBe("Review complete — verify");
  });

  it("mendeteksi ketidakcocokan 3-way saat quantity atau HS Code kosong", () => {
    const broken = {
      ...initialShipment,
      lineItems: [{ ...initialShipment.lineItems[0], hsCode: "" }],
    };
    const result = evaluateRiskChecks(broken, calculatePricing(broken), calculateContainer(broken));
    expect(result.threeWayConsistent).toBe(false);
    expect(result.checks.find((c) => c.key === "threeWay")?.ok).toBe(false);
  });

  it("memberikan rekomendasi booking dan margin saat data kurang", () => {
    const zeroMargin = { ...initialShipment, margin: 0, bookingNumber: "" };
    const recs = computeRecommendations(zeroMargin, calculatePricing(zeroMargin), calculateContainer(zeroMargin));
    expect(recs.map((r) => r.kind)).toContain("booking");
    expect(recs.map((r) => r.kind)).toContain("margin");
  });

  it("formatMoney tetap aman ketika input mata uang sedang kosong atau bukan ISO", () => {
    expect(formatMoney(1500, "")).toBe("1,500");
    expect(formatMoney(1500, "US")).toBe("US 1,500");
    expect(formatMoney(1500, "USD")).toBe("$1,500");
    expect(getDocumentNumber("Commercial Invoice", "EXP-01")).toBe("CI-EXP-01");
  });
});
