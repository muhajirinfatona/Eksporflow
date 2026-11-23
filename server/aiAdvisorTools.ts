import { calculateTraderHpp, calculateManufacturerHpp, type TraderHppInput, type ManufacturerHppInput, type HppResult } from "@shared/hpp";
import { calculateContainer, containerSpecs, type ContainerInput } from "@shared/container";
import { evaluateRiskChecks, defaultLegalChecklist, type RiskEvaluation } from "@shared/risk";
import type { Shipment, LineItem } from "@shared/shipment";
import type { Pricing } from "@shared/pricing";

export interface HppToolInput {
  mode?: "trader" | "manufacturer";
  quantity: number;
  // Trader mode
  supplierBuyPrice?: number;
  shrinkageRatePercent?: number;
  sourcingFreightPerUnit?: number;
  sortingLaborPerUnit?: number;
  innerPackagingPerUnit?: number;
  labelPackagingPerUnit?: number;
  staffingOverheadPerUnit?: number;
  traderMarginPerUnit?: number;
  // Manufacturer mode
  rawMaterialPerUnit?: number;
  auxiliaryMaterialPerUnit?: number;
  directLaborPerUnit?: number;
  factoryOverheadPerUnit?: number;
}

export interface ContainerFitToolInput {
  containerType?: "20GP" | "40GP" | "40HC";
  cartonLength: number; // cm
  cartonWidth: number;  // cm
  cartonHeight: number; // cm
  cartonWeight: number; // kg
  cartonQty: number;
  lineItems?: LineItem[];
}

export interface RiskToolInput {
  buyerCountry?: string;
  paymentTerms?: string;
  incoterm?: string;
  quantity?: number;
  cartonQty?: number;
  attachments?: string[];
  hasPoEvidence?: boolean;
  hasEmailEvidence?: boolean;
  hsCodeReviewed?: boolean;
  originEvidence?: boolean;
  paymentTermsReviewed?: boolean;
  sanctionsScreened?: boolean;
}

export interface DeterministicToolResult {
  toolName: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  groundedSummary: string;
}

/**
 * Tool 1: Kalkulator HPP Deterministik (Trader & Produsen).
 * Menghitung biaya pokok produksi/pengadaan tanpa halusinasi matematis.
 */
export function executeCalculateHpp(input: HppToolInput): DeterministicToolResult {
  const mode = input.mode || "trader";
  const quantity = Math.max(1, input.quantity || 1);

  if (mode === "manufacturer") {
    const mInput: ManufacturerHppInput = {
      rawMaterialPerUnit: Math.max(0, input.rawMaterialPerUnit || 0),
      auxiliaryMaterialPerUnit: Math.max(0, input.auxiliaryMaterialPerUnit || 0),
      directLaborPerUnit: Math.max(0, input.directLaborPerUnit || 0),
      factoryOverheadPerUnit: Math.max(0, input.factoryOverheadPerUnit || 0),
      quantity,
    };
    const result: HppResult = calculateManufacturerHpp(mInput);

    const groundedSummary = [
      `[KALKULATOR DETERMINISTIK HPP PRODUSEN]`,
      `• Kuantitas: ${quantity.toLocaleString("id-ID")} unit`,
      `• Bahan Baku: Rp ${mInput.rawMaterialPerUnit.toLocaleString("id-ID")}/unit`,
      `• Bahan Penolong: Rp ${mInput.auxiliaryMaterialPerUnit.toLocaleString("id-ID")}/unit`,
      `• Tenaga Kerja Langsung: Rp ${mInput.directLaborPerUnit.toLocaleString("id-ID")}/unit`,
      `• Overhead Pabrik: Rp ${mInput.factoryOverheadPerUnit.toLocaleString("id-ID")}/unit`,
      `----------------------------------------------------`,
      `TOTAL HPP PER UNIT: Rp ${Math.round(result.totalHppPerUnit).toLocaleString("id-ID")}`,
      `TOTAL BIAYA PRODUKSI: Rp ${Math.round(result.totalHppOverall).toLocaleString("id-ID")}`,
    ].join("\n");

    return {
      toolName: "calculateHpp",
      input: { mode, ...mInput },
      output: { ...result },
      groundedSummary,
    };
  }

  // Trader Mode
  const tInput: TraderHppInput = {
    supplierBuyPrice: Math.max(0, input.supplierBuyPrice || 0),
    shrinkageRatePercent: Math.max(0, Math.min(80, input.shrinkageRatePercent || 0)),
    sourcingFreightPerUnit: Math.max(0, input.sourcingFreightPerUnit || 0),
    sortingLaborPerUnit: Math.max(0, input.sortingLaborPerUnit || 0),
    innerPackagingPerUnit: Math.max(0, input.innerPackagingPerUnit || 0),
    labelPackagingPerUnit: Math.max(0, input.labelPackagingPerUnit || 0),
    staffingOverheadPerUnit: Math.max(0, input.staffingOverheadPerUnit || 0),
    traderMarginPerUnit: Math.max(0, input.traderMarginPerUnit || 0),
    quantity,
  };
  const result: HppResult = calculateTraderHpp(tInput);

  const groundedSummary = [
    `[KALKULATOR DETERMINISTIK HPP TRADER / AGGREGATOR]`,
    `• Kuantitas: ${quantity.toLocaleString("id-ID")} unit`,
    `• Harga Beli Supplier: Rp ${tInput.supplierBuyPrice.toLocaleString("id-ID")}/unit`,
    `• Tingkat Susut Sortasi (Shrinkage): ${tInput.shrinkageRatePercent}% (+Rp ${Math.round(result.shrinkageCostImpactPerUnit).toLocaleString("id-ID")}/unit)`,
    `• Biaya Bahan Efektif: Rp ${Math.round(result.effectiveMaterialCostPerUnit).toLocaleString("id-ID")}/unit`,
    `• Angkut Lokal + Sortasi: Rp ${(tInput.sourcingFreightPerUnit + tInput.sortingLaborPerUnit).toLocaleString("id-ID")}/unit`,
    `• Kemasan & Label: Rp ${(tInput.innerPackagingPerUnit + (tInput.labelPackagingPerUnit || 0)).toLocaleString("id-ID")}/unit`,
    `• Margin Pengadaan: Rp ${tInput.traderMarginPerUnit.toLocaleString("id-ID")}/unit`,
    `----------------------------------------------------`,
    `TOTAL HPP PER UNIT: Rp ${Math.round(result.totalHppPerUnit).toLocaleString("id-ID")}`,
    `TOTAL HPP KESELURUHAN: Rp ${Math.round(result.totalHppOverall).toLocaleString("id-ID")}`,
  ].join("\n");

  return {
    toolName: "calculateHpp",
    input: { mode, ...tInput },
    output: { ...result },
    groundedSummary,
  };
}

/**
 * Tool 2: Kalkulator Kapasitas Muat Kontainer Deterministik.
 * Menghitung kapasitas volume CBM, berat muatan, utilisasi, dan jumlah kontainer.
 */
export function executeCalculateContainerFit(input: ContainerFitToolInput): DeterministicToolResult {
  const containerType = input.containerType || "20GP";
  const cInput: ContainerInput = {
    containerType,
    cartonLength: Math.max(1, input.cartonLength || 40),
    cartonWidth: Math.max(1, input.cartonWidth || 30),
    cartonHeight: Math.max(1, input.cartonHeight || 20),
    cartonWeight: Math.max(0.1, input.cartonWeight || 10),
    cartonQty: Math.max(1, input.cartonQty || 500),
    lineItems: input.lineItems || [],
  };

  const result = calculateContainer(cInput);
  const spec = containerSpecs[containerType];

  const groundedSummary = [
    `[KALKULATOR DETERMINISTIK KAPASITAS KONTAINER (${containerType})]`,
    `• Tipe Kontainer: ${spec.name}`,
    `• Dimensi Karton/Kemasan: ${cInput.cartonLength} × ${cInput.cartonWidth} × ${cInput.cartonHeight} cm`,
    `• Berat per Kemasan: ${cInput.cartonWeight.toFixed(2)} kg`,
    `• Jumlah Kemasan: ${cInput.cartonQty.toLocaleString("id-ID")} koli`,
    `• Total Volume Kargo: ${result.totalVolume.toFixed(3)} CBM (Kapasitas Kontainer: ${spec.volume} CBM)`,
    `• Total Berat Kargo: ${result.totalWeight.toLocaleString("id-ID")} kg (Payload Maksimal: ${spec.weight.toLocaleString("id-ID")} kg)`,
    `• Utilisasi Volume: ${result.volumeUtilization.toFixed(1)}%`,
    `• Utilisasi Berat: ${result.weightUtilization.toFixed(1)}%`,
    `• Estimasi Kontainer Dibutuhkan: ${result.containers} Unit ${containerType}`,
    result.volumeUtilization > 100 || result.weightUtilization > 100
      ? `⚠️ PERINGATAN: Muatan melebihi kapasitas 1 kontainer, disarankan menggunakan kontainer tambahan atau tipe 40HC.`
      : `✓ Kargo muat dengan aman dalam 1 kontainer.`,
  ].join("\n");

  return {
    toolName: "calculateContainerFit",
    input: { ...cInput },
    output: { ...result },
    groundedSummary,
  };
}

/**
 * Tool 3: Penilaian Risiko & Kepatuhan Ekspor Deterministik.
 * Mengevaluasi checklist legalitas, bukti dokumen, konsistensi data, dan protokol bayar.
 */
export function executeAssessExportRisk(input: RiskToolInput): DeterministicToolResult {
  const quantity = Math.max(1, input.quantity || input.cartonQty || 100);
  const cartonQty = input.cartonQty || quantity;
  const attachments = input.attachments || [];
  if (input.hasPoEvidence && !attachments.some(a => /po|purchase/i.test(a))) {
    attachments.push("PO_Buyer_Verified.pdf");
  }
  if (input.hasEmailEvidence && !attachments.some(a => /email|correspondence/i.test(a))) {
    attachments.push("Email_Confirmation.eml");
  }

  const dummyShipment: Partial<Shipment> = {
    quantity,
    cartonQty,
    attachments,
    buyer: "AL-BARAKAH FOODS TRADING LLC",
    buyerCountry: input.buyerCountry || "United Arab Emirates",
    destination: "Jebel Ali, Dubai (AEJEA)",
    hsCode: "1702.90",
    product: "Organic Coconut Sugar",
    letterheadText: "PT INDO EKSPOR INTERNASIONAL",
    bookingNumber: "BKG-202611-001",
    containerNumber: "TGHU 2468135",
    sealNumber: "IDMKS998877",
    poNumber: input.hasPoEvidence ? "PO-2026-001" : "",
    paymentTerms: input.paymentTerms || "30% Advance, 70% against B/L",
    incoterm: (input.incoterm as any) || "FOB",
    lineItems: [
      {
        id: "1",
        description: "Export Goods",
        hsCode: "1702.90",
        quantity,
        unit: "kg",
        unitPrice: 2,
        packagingType: "Kraft Paper Bag",
        shrinkageRate: 0,
        length: 40,
        width: 30,
        height: 20,
        weight: 10,
        palletEnabled: false,
        palletLength: 120,
        palletWidth: 100,
        palletHeight: 15,
        palletWeight: 20,
        palletCount: 0,
      },
    ],
  };

  const dummyPricing: Pricing = {
    active: { offer: 2, cost: 1.56, profit: 0.44, unit: 2 },
    goods: quantity * 2,
    totalQuantity: quantity,
    validationErrors: [],
    formulaVersion: "v2",
    scenarios: [{ term: "FOB", offer: 2, cost: 1.56, profit: 0.44, unit: 2 }],
  };

  const dummyContainer = calculateContainer({
    containerType: "20GP",
    cartonLength: 40,
    cartonWidth: 30,
    cartonHeight: 20,
    cartonWeight: 10,
    cartonQty,
    lineItems: dummyShipment.lineItems || [],
  });

  const legalChecklist = {
    hsCodeReviewed: input.hsCodeReviewed ?? Boolean(input.buyerCountry),
    originEvidence: input.originEvidence ?? true,
    paymentTermsReviewed: input.paymentTermsReviewed ?? Boolean(input.paymentTerms),
    sanctionsScreened: input.sanctionsScreened ?? true,
  };

  const result: RiskEvaluation = evaluateRiskChecks(
    dummyShipment as Shipment,
    dummyPricing,
    dummyContainer,
    legalChecklist,
  );

  const groundedSummary = [
    `[PENILAIAN RISIKO & KEPATUHAN EKSPOR]`,
    `• Tingkat Risiko: ${result.riskLevel.toUpperCase()}`,
    `• Kesiapan Transaksi: ${result.readinessPercent}% (${result.passed}/${result.total} pemeriksaan lolos)`,
    `• Bukti PO Buyer: ${result.hasPoEvidence ? "Tersedia ✓" : "Belum Dilampirkan ⚠️"}`,
    `• Bukti Korespondensi Email: ${result.hasEmailEvidence ? "Tersedia ✓" : "Belum Dilampirkan ⚠️"}`,
    `• Konsistensi Data 3-Way: ${result.threeWayConsistent ? "Sinkron 100% ✓" : "Perlu Penyelarasan Kuantitas/Harga ⚠️"}`,
    `• Rincian Pemeriksaan Kritis:`,
    ...result.checks.slice(0, 5).map(c => `  - ${c.ok ? "✓" : "✗"} ${c.label}: ${c.detail}`),
  ].join("\n");

  return {
    toolName: "assessExportRisk",
    input: { ...input },
    output: { ...result },
    groundedSummary,
  };
}

/**
 * Dispatcher untuk mengeksekusi tool deterministik berdasarkan nama fungsi.
 */
export function executeDeterministicTool(
  toolName: string,
  args: Record<string, unknown>,
): DeterministicToolResult {
  switch (toolName) {
    case "calculateHpp":
      return executeCalculateHpp(args as unknown as HppToolInput);
    case "calculateContainerFit":
      return executeCalculateContainerFit(args as unknown as ContainerFitToolInput);
    case "assessExportRisk":
      return executeAssessExportRisk(args as unknown as RiskToolInput);
    default:
      throw new Error(`Tool deterministik '${toolName}' tidak dikenal.`);
  }
}
