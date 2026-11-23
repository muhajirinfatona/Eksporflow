import { describe, it, expect } from "vitest";
import { redactPii, computePromptHash } from "./aiSanitizer";
import {
  executeCalculateHpp,
  executeCalculateContainerFit,
  executeAssessExportRisk,
  executeDeterministicTool,
} from "./aiAdvisorTools";
import { evaluateExportGuardrails, extractHsCode, isRegulationQuery } from "./aiGuardrails";
import { screenCrossDocumentInconsistencies } from "@shared/crossDocumentScreening";

describe("AI Advisor v2: PII Redaction & Sanitization", () => {
  it("redacts formatted and unformatted NPWP without losing trade context", () => {
    const text = "Eksportir PT Sumber Rezeki dengan NPWP 01.234.567.8-012.000 dan NPWP: 987654321098765 mengirim 20 MT kopi.";
    const result = redactPii(text);

    expect(result.detectedTypes).toContain("NPWP");
    expect(result.sanitizedText).not.toContain("01.234.567.8-012.000");
    expect(result.sanitizedText).not.toContain("987654321098765");
    expect(result.sanitizedText).toContain("[REDACTED_NPWP]");
    expect(result.sanitizedText).toContain("20 MT kopi");
  });

  it("redacts Indonesian 16-digit NIK (Nomor Induk Kependudukan)", () => {
    const text = "Penanggung jawab dokumen ekspor memiliki NIK 3171012304900001 dan KTP: 3201015508880002.";
    const result = redactPii(text);

    expect(result.detectedTypes).toContain("NIK");
    expect(result.sanitizedText).not.toContain("3171012304900001");
    expect(result.sanitizedText).not.toContain("3201015508880002");
    expect(result.sanitizedText).toContain("[REDACTED_NIK]");
  });

  it("redacts bank account numbers near banking keywords", () => {
    const text = "Pelunasan T/T mohon ditransfer ke no rek mandiri 152-00-9876543-2 atau rekening BCA 8830192837 atas nama eksportir.";
    const result = redactPii(text);

    expect(result.detectedTypes).toContain("BANK_ACCOUNT");
    expect(result.sanitizedText).not.toContain("152-00-9876543-2");
    expect(result.sanitizedText).not.toContain("8830192837");
    expect(result.sanitizedText).toContain("[REDACTED_BANK_ACCOUNT]");
  });

  it("redacts email addresses and protects personal communications", () => {
    const text = "Kirim salinan draft B/L ke buyer.procurement@dubaitrading.ae dan direktur.personal@gmail.com.";
    const result = redactPii(text);

    expect(result.detectedTypes).toContain("EMAIL");
    expect(result.sanitizedText).not.toContain("buyer.procurement@dubaitrading.ae");
    expect(result.sanitizedText).not.toContain("direktur.personal@gmail.com");
    expect(result.sanitizedText).toContain("[REDACTED_EMAIL]");
  });

  it("redacts API keys, bearer tokens, and secrets", () => {
    const text = "Gunakan sk-abcdef1234567890abcdef1234567890 dan token Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoxfQ.signatureSecretValue.";
    const result = redactPii(text);

    expect(result.detectedTypes).toContain("API_KEY");
    expect(result.detectedTypes).toContain("SECRET");
    expect(result.sanitizedText).not.toContain("sk-abcdef1234567890abcdef1234567890");
    expect(result.sanitizedText).toContain("[REDACTED_API_KEY]");
    expect(result.sanitizedText).toContain("[REDACTED_SECRET]");
  });

  it("computes deterministic SHA-256 prompt hash", () => {
    const hash1 = computePromptHash("Berapa HPP ekspor gula kelapa ke Dubai?");
    const hash2 = computePromptHash("Berapa HPP ekspor gula kelapa ke Dubai?");
    const hash3 = computePromptHash("Pertanyaan lain");

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
    expect(hash1).not.toBe(hash3);
  });
});

describe("AI Advisor v2: Deterministic Tool Calling", () => {
  it("executes calculateHpp in trader mode with exact shrinkage compensation", () => {
    const result = executeCalculateHpp({
      mode: "trader",
      quantity: 1000,
      supplierBuyPrice: 20000,
      shrinkageRatePercent: 10, // 10% shrinkage -> yield ratio 1 / 0.9 = 1.1111...
      sourcingFreightPerUnit: 1000,
      sortingLaborPerUnit: 1500,
      innerPackagingPerUnit: 2000,
      traderMarginPerUnit: 3000,
    });

    expect(result.toolName).toBe("calculateHpp");
    const out = result.output as any;
    expect(out.effectiveMaterialCostPerUnit).toBeCloseTo(22222.22, 1);
    expect(out.shrinkageCostImpactPerUnit).toBeCloseTo(2222.22, 1);
    expect(out.totalHppPerUnit).toBeGreaterThan(25000);
    expect(out.totalHppOverall).toBeCloseTo(out.totalHppPerUnit * 1000, -1);
    expect(result.groundedSummary).toContain("KALKULATOR DETERMINISTIK HPP TRADER");
  });

  it("executes calculateHpp in manufacturer mode", () => {
    const result = executeCalculateHpp({
      mode: "manufacturer",
      quantity: 500,
      rawMaterialPerUnit: 15000,
      auxiliaryMaterialPerUnit: 2000,
      directLaborPerUnit: 3000,
      factoryOverheadPerUnit: 2500,
    });

    const out = result.output as any;
    expect(out.totalHppPerUnit).toBe(22500);
    expect(out.totalHppOverall).toBe(22500 * 500);
    expect(result.groundedSummary).toContain("KALKULATOR DETERMINISTIK HPP PRODUSEN");
  });

  it("executes calculateContainerFit and prevents volume/weight hallucinations", () => {
    const result = executeCalculateContainerFit({
      containerType: "20GP",
      cartonLength: 40,
      cartonWidth: 30,
      cartonHeight: 20,
      cartonWeight: 10,
      cartonQty: 1000,
    });

    expect(result.toolName).toBe("calculateContainerFit");
    const out = result.output as any;
    expect(out.totalVolume).toBeCloseTo(24, 1); // (40*30*20 / 1_000_000) * 1000 = 24 CBM
    expect(out.totalWeight).toBe(10000); // 1000 * 10 kg = 10,000 kg
    expect(out.containers).toBe(1); // 24 CBM <= 33.2 CBM, 10,000 kg <= 28,200 kg
    expect(out.volumeUtilization).toBeCloseTo((24 / 33.2) * 100, 1);
    expect(result.groundedSummary).toContain("Total Volume Kargo: 24.000 CBM");
  });

  it("executes assessExportRisk and flags missing PO evidence", () => {
    const result = executeAssessExportRisk({
      buyerCountry: "United Arab Emirates",
      paymentTerms: "100% Net 90 Days",
      hasPoEvidence: false,
      hasEmailEvidence: false,
    });

    expect(result.toolName).toBe("assessExportRisk");
    const out = result.output as any;
    expect(out.hasPoEvidence).toBe(false);
    expect(result.groundedSummary).toContain("Bukti PO Buyer: Belum Dilampirkan");
  });

  it("handles tool dispatcher routing and unknown tools", () => {
    const res = executeDeterministicTool("calculateContainerFit", {
      containerType: "20GP",
      cartonLength: 40,
      cartonWidth: 30,
      cartonHeight: 20,
      cartonWeight: 10,
      cartonQty: 500,
    });
    expect(res.toolName).toBe("calculateContainerFit");

    expect(() => executeDeterministicTool("unknownTool", {})).toThrow("tidak dikenal");
  });
});

describe("AI Advisor v2: Export Regulation Guardrails & Abstention Logic", () => {
  it("extracts HS Code from questions or snapshot text", () => {
    expect(extractHsCode("Apakah HS Code 1702.90 kena lartas ekspor?")).toBe("1702.90");
    expect(extractHsCode("Kode HS: 0901.11.00 untuk biji kopi gayo")).toBe("0901.11.00");
    expect(extractHsCode("Pertanyaan tanpa kode")).toBeNull();
  });

  it("detects regulation and compliance intent in queries", () => {
    expect(isRegulationQuery("Bagaimana regulasi dan lartas ekspor komoditas ini?")).toBe(true);
    expect(isRegulationQuery("Apakah butuh izin ekspor atau dokumen karantina?")).toBe(true);
    expect(isRegulationQuery("Hitung HPP dan estimasi kontainer")).toBe(false);
  });

  it("triggers mandatory abstention when HS Code is not in the verified catalog", () => {
    // 9999.99 is a non-existent / fabricated HS Code
    const check = evaluateExportGuardrails("Apakah HS Code 9999.99 ada lartas dan izin ekspor ke Dubai?");

    expect(check.shouldAbstain).toBe(true);
    expect(check.abstainReason).toBe("unverified_hs_code");
    expect(check.responseMessage).toContain("Data regulasi resmi untuk kode HS tersebut belum terverifikasi");
    expect(check.responseMessage).toContain("tidak berspekulasi terkait legalitas kepabeanan");
    expect(check.responseMessage).toContain("INSW");
  });

  it("does NOT abstain when HS Code is in the verified catalog", () => {
    // 1702.90 is Organic Coconut Sugar in verified catalog
    const check = evaluateExportGuardrails("Bagaimana regulasi ekspor untuk HS Code 1702.90 ke UAE?");

    expect(check.shouldAbstain).toBe(false);
    expect(check.isVerified).toBe(true);
    expect(check.verificationData).toBeDefined();
    expect(check.verificationData?.lartasStatus).toBeDefined();
  });
});

describe("AI Advisor v2: Cross-Document Inconsistency Screening", () => {
  it("detects Incoterms 2020 mismatch between PO and Sales Contract", () => {
    const report = screenCrossDocumentInconsistencies({
      po: "PURCHASE ORDER\nDelivery Terms: CIF Port of Gothenburg (Incoterms 2020)\nTotal Amount: USD 44,000",
      contract: "SALES CONTRACT\nTerms of Delivery: FOB Port of Makassar, Indonesia (Incoterms 2020)\nTotal Amount: USD 44,000",
    });

    expect(report.hasErrors).toBe(true);
    const incoDiscrepancy = report.discrepancies.find((d) => d.field === "incoterms");
    expect(incoDiscrepancy).toBeDefined();
    expect(incoDiscrepancy?.severity).toBe("error");
    expect(incoDiscrepancy?.description).toContain("CIF");
    expect(incoDiscrepancy?.description).toContain("FOB");
  });

  it("detects fatal weight error when Gross Weight is less than Net Weight", () => {
    const report = screenCrossDocumentInconsistencies({
      po: {
        documentType: "Purchase Order",
        netWeightKg: 20000,
        grossWeightKg: 19500, // Invalid: gross weight < net weight!
      },
    });

    expect(report.hasErrors).toBe(true);
    const weightDiscrepancy = report.discrepancies.find((d) => d.field === "weights");
    expect(weightDiscrepancy).toBeDefined();
    expect(weightDiscrepancy?.title).toContain("Berat Kotor Tidak Logis");
  });

  it("detects foreign currency mismatch between PO and Proforma Invoice", () => {
    const report = screenCrossDocumentInconsistencies({
      po: "PURCHASE ORDER\nCurrency: EUR\nTotal Amount: 50,000 EUR",
      pi: "PROFORMA INVOICE\nCurrency: USD\nTotal Amount: 50,000 USD",
    });

    expect(report.hasErrors).toBe(true);
    const currDiscrepancy = report.discrepancies.find((d) => d.field === "currency");
    expect(currDiscrepancy).toBeDefined();
    expect(currDiscrepancy?.severity).toBe("error");
    expect(currDiscrepancy?.description).toContain("EUR");
    expect(currDiscrepancy?.description).toContain("USD");
  });

  it("reports 100% verified when all trade parameters match across documents", () => {
    const report = screenCrossDocumentInconsistencies({
      po: {
        incoterm: "FOB",
        currency: "USD",
        netWeightKg: 18000,
        grossWeightKg: 18225,
        totalAmount: 39600,
      },
      pi: {
        incoterm: "FOB",
        currency: "USD",
        netWeightKg: 18000,
        grossWeightKg: 18225,
        totalAmount: 39600,
      },
      contract: {
        incoterm: "FOB",
        currency: "USD",
        netWeightKg: 18000,
        grossWeightKg: 18225,
        totalAmount: 39600,
      },
    });

    expect(report.hasErrors).toBe(false);
    expect(report.status).toBe("verified");
    expect(report.score).toBe(100);
    expect(report.discrepancies).toHaveLength(0);
  });
});
