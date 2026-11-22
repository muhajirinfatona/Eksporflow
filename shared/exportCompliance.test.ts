import { describe, expect, it } from "vitest";
import {
  buildAuditVaultSummary,
  buildOnboarding30Days,
  buildPreShipmentTimeline,
  calculateDemurrageSimulation,
  calculatePlanBilling,
  evaluatePermitExpiries,
  verifyHsCodeAndLartas,
} from "./exportCompliance";
import { createEmptyShipment, initialShipment } from "./shipment";

describe("exportCompliance domain helpers (MVP v5)", () => {
  it("memverifikasi HS Code, status Lartas, & rekomendasi tarif legal", () => {
    const palmSugar = verifyHsCodeAndLartas("Organic Coconut Sugar", "1702.90.91", "Uni Emirat Arab");
    expect(palmSugar.alignmentStatus).toBe("Sesuai Katalog");
    expect(palmSugar.lartasStatus).toBe("Bebas Ekspor (Non-Lartas)");
    expect(palmSugar.lartasRequired).toBe(false);
    expect(palmSugar.destinationDutyHint).toContain("Uni Emirat Arab");
    expect(palmSugar.alternativeHsCode).toBe("1702.90.99");

    const charcoal = verifyHsCodeAndLartas("Coconut Shell Briquette Charcoal", "4402.90.10", "UAE");
    expect(charcoal.lartasRequired).toBe(true);
    expect(charcoal.lartasStatus).toBe("Wajib Izin Khusus / PE");
    expect(charcoal.requiredPermits.some((p) => p.includes("SVLK"))).toBe(true);
  });

  it("mengevaluasi masa berlaku izin dengan peringatan dini <= 30 hari & kedaluwarsa", () => {
    const refDate = new Date("2026-06-01T00:00:00");
    const items = evaluatePermitExpiries(
      {
        quarantineNumber: "KT-01",
        quarantineExpiry: "2026-06-15", // H-14 -> expiring_soon
        cooNumber: "COO-01",
        cooExpiry: "2026-05-20", // Expired 12 days ago
        lartasLicenseNumber: "SVLK-01",
        lartasExpiry: "2026-09-01", // > 30 days -> valid
      },
      refDate,
    );

    expect(items[0].severity).toBe("expiring_soon");
    expect(items[0].statusLabel).toBe("Peringatan Dini: H-14");
    expect(items[1].severity).toBe("expired");
    expect(items[1].daysLeft).toBe(-12);
    expect(items[2].severity).toBe("valid");
    expect(items[3].severity).toBe("missing");
  });

  it("menghitung timeline checkpoint pra-pengiriman H-7 hingga Closing PEB", () => {
    const refDate = new Date("2026-06-10T00:00:00");
    const timeline = buildPreShipmentTimeline(
      {
        etdDate: "2026-06-14", // ETD H-4, PEB Closing June 12 = H-2 -> due_soon
        pebClosingDate: "2026-06-12",
        completedIds: ["h7_contract_dp"],
      },
      refDate,
    );

    expect(timeline.completedCount).toBe(1);
    expect(timeline.milestones.length).toBe(6);
    expect(timeline.milestones[0].urgency).toBe("completed");
    const pebStep = timeline.milestones.find((m) => m.id === "h2_peb_closing");
    expect(pebStep?.urgency).toBe("due_soon");
    expect(pebStep?.daysUntilDue).toBe(2);
    expect(pebStep?.dueDateIso).toBe("2026-06-12");
  });

  it("menghitung skema langganan 3 tingkat, diskon tahunan 10%, & ekstra kuota hibrida", () => {
    const growthMonthlyOver = calculatePlanBilling("growth", "monthly", 75);
    // Growth quota = 60 docs, overage = Rp 10.000/dok => +15 * 10.000 = 150.000
    expect(growthMonthlyOver.extraDocsCount).toBe(15);
    expect(growthMonthlyOver.overageChargeIdr).toBe(150000);
    expect(growthMonthlyOver.effectiveMonthlyIdr).toBe(349000);
    expect(growthMonthlyOver.totalEstimatedMonthlyIdr).toBe(499000);

    const enterpriseAnnual = calculatePlanBilling("enterprise", "annual", 100);
    expect(enterpriseAnnual.extraDocsCount).toBe(0);
    expect(enterpriseAnnual.overageChargeIdr).toBe(0);
    expect(enterpriseAnnual.effectiveMonthlyIdr).toBe(Math.round(799000 * 0.9));
    expect(enterpriseAnnual.annualDiscountSavedIdr).toBeGreaterThan(0);
  });

  it("menghitung simulasi kerugian demurrage dan ROI proteksi paket", () => {
    const sim = calculateDemurrageSimulation({
      containerCount: 2,
      delayedDays: 5,
      dailyRateUsd: 150,
      exchangeRateIdr: 16200,
      planId: "growth",
    });

    expect(sim.totalLossUsd).toBe(1500);
    expect(sim.totalLossIdr).toBe(24300000);
    expect(sim.subscriptionMonthlyIdr).toBe(349000);
    expect(sim.netSavingsIdr).toBe(24300000 - 349000);
    expect(sim.roiMultiple).toBeCloseTo(69.6, 1);
  });

  it("melacak progres Panduan Onboarding 30 Hari & brankas Arsip Audit DJBC", () => {
    const base = createEmptyShipment({
      exporter: "PT Ekspor Nusantara",
      product: "Organic Palm Sugar",
    });
    const onboardEmpty = buildOnboarding30Days(base, { productsCount: 1, partnersCount: 0 });
    expect(onboardEmpty.completedCount).toBe(1); // day1_catalog done
    expect(onboardEmpty.progressPercent).toBe(20);

    const withManual = buildOnboarding30Days(
      {
        ...initialShipment,
        exportPermits: { quarantineNumber: "KT-11" },
      },
      { productsCount: 2, partnersCount: 1 },
      ["day22_h7_audit"],
    );
    expect(withManual.completedCount).toBe(5);
    expect(withManual.progressPercent).toBe(100);

    const vault = buildAuditVaultSummary(
      {
        ...initialShipment,
        poNumber: "PO-2026-01",
        attachments: ["NPE-PEB-001.pdf", "Swift-TT-Receipt.jpg"],
        auditVaultDocs: [
          {
            id: "v1",
            folder: "04_logistik_bl",
            title: "Original B/L",
            addedAt: "2026-06-01",
            source: "manual",
          },
        ],
      },
      {
        version: 3,
        approvalStatus: "Disetujui",
        dpConfirmed: true,
        settlementConfirmed: true,
      },
    );

    expect(vault.folders.length).toBe(5);
    expect(
      vault.folders
        .find((f) => f.id === "03_kepabeanan_lartas")
        ?.items.some((i) => i.title === "NPE-PEB-001.pdf"),
    ).toBe(true);
    expect(
      vault.folders
        .find((f) => f.id === "05_pembayaran_tt")
        ?.items.some((i) => i.title === "Swift-TT-Receipt.jpg"),
    ).toBe(true);
  });
});
