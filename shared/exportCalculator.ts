/**
 * Kalkulator Harga Ekspor Berdasarkan Model Resmi Kemendag / PPEI / ICC Incoterms® 2020:
 * Model Trader: Beli bahan mentah dari petani -> olah & siapkan produk ekspor ->
 * hitung HPP -> tambah markup EXW -> tambah biaya ekspor, ocean freight, dan asuransi.
 */

export type HppComponentInput = {
  // 1. Bahan Baku & Yield
  buyPricePerMtRaw: number;          // Harga beli bahan mentah dari petani (per MT bahan)
  yieldPercent: number;              // Yield produk siap ekspor (misal 90% atau 0.9)
  sourcingFreightPerMtRaw: number;   // Angkut/pengumpulan bahan baku (per MT bahan)
  
  // 2. Pengolahan & Tenaga Kerja
  processingCostPerMt: number;       // Biaya pengolahan/rework (sortir, masak, cetak, pengeringan)
  laborCostPerMt: number;            // Upah karyawan produksi / tenaga kerja langsung
  overheadCostPerMt: number;         // Staffing, sewa gudang, utilitas, administrasi produksi
  
  // 3. Kemasan, Label & Mutu
  packagingCostPerMt: number;        // Kemasan ekspor (karung/karton/inner bag)
  labelCostPerMt: number;            // Label & desain kemasan (stiker, cetak, barcode)
  qcLabCostPerMt: number;            // QC, uji lab & sertifikasi (uji mutu produk)
  otherProdCostPerMt: number;        // Biaya produksi lain
  
  // 4. Biaya Tetap Order
  fixedPrepCostOrder: number;        // Biaya tetap persiapan order (total per order, e.g. setup/inspeksi)
};

export type AdditionalCostItem = {
  id: string;
  name: string;
  perMt: number;          // Biaya variabel per MT
  fixedOrder: number;     // Biaya tetap total per order
  stage: "FCA" | "FOB" | "CFR" | "CIF" | "DAP" | "DPU" | "DDP";
  description: string;
};

export type ExportCalculatorInput = {
  currency: string;
  quantityMt: number;             // Kuantitas produk jadi (MT)
  targetMarkup: number;           // Target markup atas biaya (e.g. 0.20 untuk 20%)
  buyerPricePerMt?: number;       // Input penawaran buyer per MT (opsional untuk cek profitabilitas)
  hpp: HppComponentInput;
  additionalCosts: AdditionalCostItem[];
};

export type IncotermChainRow = {
  term: "EXW" | "FCA" | "FAS" | "FOB" | "CFR" | "CIF" | "CPT" | "CIP" | "DAP" | "DPU" | "DDP";
  group: "Semua moda" | "Laut" | "Multimoda";
  cumulativeCostPerMt: number;    // Biaya tambahan kumulatif per MT
  breakEvenPricePerMt: number;    // Harga impas per unit
  targetPricePerMt: number;       // Harga target per unit = impas * (1 + markup)
  totalTargetOrder: number;       // Total harga target order
  targetProfitPerMt: number;      // Laba target per unit
  totalTargetProfitOrder: number; // Total laba target order
  buyerPricePerMt: number;        // Input penawaran buyer
  breakEvenIndicator: "RUGI" | "IMPAS" | "UNTUNG" | "-";
  targetStatus: "TARGET TERCAPAI" | "DI BAWAH TARGET" | "RUGI" | "-";
};

export type ExportCalculatorResult = {
  // Rincian HPP
  yieldRatio: number;
  rawMaterialPerMtOutput: number;
  effectiveRawCostPerMt: number;
  shrinkageCostImpactPerMt: number;
  effectiveSourcingFreightPerMt: number;
  fixedPrepCostPerMt: number;
  totalHppPerMt: number;
  totalHppOrder: number;
  hppBreakdownPercentages: Record<string, number>;

  // Rincian Biaya Tambahan Incoterms
  additionalCostsEffective: (AdditionalCostItem & { effectivePerMt: number; totalCost: number })[];
  
  // Rantai Harga & Indikator Profitabilitas
  chain: IncotermChainRow[];
};

export const defaultHppInput: HppComponentInput = {
  buyPricePerMtRaw: 1200,      // $1.200 per MT gula mentah petani (~Rp 19.500/kg)
  yieldPercent: 90,           // 90% yield (10% susut kadar air & sortasi)
  sourcingFreightPerMtRaw: 35, // $35 per MT angkut lokal
  processingCostPerMt: 65,    // $65 per MT rework/pengeringan/kristalisasi
  laborCostPerMt: 45,         // $45 per MT upah olah & packing
  overheadCostPerMt: 30,      // $30 per MT staffing & gudang
  packagingCostPerMt: 40,     // $40 per MT kemasan karung/karton/inner
  labelCostPerMt: 15,         // $15 per MT label & barcode
  qcLabCostPerMt: 20,         // $20 per MT uji lab SGS / Sucofindo
  otherProdCostPerMt: 0,
  fixedPrepCostOrder: 200,    // $200 setup persiapan lot per order
};

export const defaultAdditionalCosts: AdditionalCostItem[] = [
  {
    id: "fca-trucking",
    name: "Pengiriman lokal ke titik penyerahan/FCA",
    perMt: 25,
    fixedOrder: 250,
    stage: "FCA",
    description: "Truk angkut dari gudang pengolahan ke carrier / depo asal.",
  },
  {
    id: "fca-customs",
    name: "Formalitas ekspor & clearance (PEB)",
    perMt: 0,
    fixedOrder: 150,
    stage: "FCA",
    description: "Customs clearance ekspor PEB Bea Cukai dan PPJK.",
  },
  {
    id: "fca-docs",
    name: "Dokumen ekspor & forwarder origin",
    perMt: 0,
    fixedOrder: 180,
    stage: "FCA",
    description: "COO/SKA, Phytosanitary, fumigasi ISPM-15, VGM & booking admin.",
  },
  {
    id: "fob-terminal",
    name: "Biaya terminal / handling pelabuhan asal (THC POL)",
    perMt: 12,
    fixedOrder: 220,
    stage: "FOB",
    description: "THC origin pelabuhan muat, lift-on lift-off kontainer.",
  },
  {
    id: "fob-onboard",
    name: "Pemuatan ke kapal / biaya on-board",
    perMt: 8,
    fixedOrder: 0,
    stage: "FOB",
    description: "Stevedoring dan biaya penyerahan bersih di atas kapal.",
  },
  {
    id: "cfr-freight",
    name: "Ocean freight / main carriage",
    perMt: 110,
    fixedOrder: 650,
    stage: "CFR",
    description: "Tarif uang tambang kapal kontainer internasional POL ke POD.",
  },
  {
    id: "cif-insurance",
    name: "Asuransi kargo (Marine Cargo Insurance)",
    perMt: 12,
    fixedOrder: 80,
    stage: "CIF",
    description: "Premi perlindungan risiko pengangkutan laut klausula Institute Cargo Clauses.",
  },
  {
    id: "dap-thcpod",
    name: "Handling / terminal tujuan (THC POD)",
    perMt: 18,
    fixedOrder: 200,
    stage: "DAP",
    description: "THC pelabuhan bongkar tujuan sesuai kesepakatan kontrak.",
  },
  {
    id: "dap-lastmile",
    name: "Angkut dari pelabuhan ke tempat tujuan (Last-mile)",
    perMt: 25,
    fixedOrder: 300,
    stage: "DAP",
    description: "Truk delivery dari POD ke named place / gudang pembeli.",
  },
  {
    id: "dpU-unload",
    name: "Bongkar barang di tujuan",
    perMt: 10,
    fixedOrder: 0,
    stage: "DPU",
    description: "Khusus DPU bila biaya bongkar di tempat serah ditanggung penjual.",
  },
  {
    id: "ddp-clearance",
    name: "Clearance impor negara tujuan",
    perMt: 0,
    fixedOrder: 250,
    stage: "DDP",
    description: "Formalitas kepabeanan impor, brokerage dan administrasi impor buyer.",
  },
  {
    id: "ddp-duty",
    name: "Bea masuk & pajak impor",
    perMt: 45,
    fixedOrder: 0,
    stage: "DDP",
    description: "Import duty, VAT/GST negara tujuan yang ditanggung penjual.",
  },
];

/**
 * Menghitung seluruh Rantai Harga Ekspor: HPP -> EXW -> FOB -> CFR -> CIF -> DAP -> DDP
 */
export function calculateExportPricingModel(input: ExportCalculatorInput): ExportCalculatorResult {
  const qty = Math.max(0.001, input.quantityMt || 1);
  const markup = Math.max(0, input.targetMarkup || 0);
  const buyerPrice = Math.max(0, input.buyerPricePerMt || 0);

  // A. HPP Calculation
  const rawYield = input.hpp.yieldPercent || 100;
  const yieldRatio = rawYield <= 1 ? Math.max(0.1, rawYield) : Math.max(0.1, rawYield / 100);
  const rawMaterialPerMtOutput = 1 / yieldRatio;
  
  const effectiveRawCostPerMt = input.hpp.buyPricePerMtRaw / yieldRatio;
  const shrinkageCostImpactPerMt = effectiveRawCostPerMt - input.hpp.buyPricePerMtRaw;
  const effectiveSourcingFreightPerMt = input.hpp.sourcingFreightPerMtRaw / yieldRatio;
  const fixedPrepCostPerMt = input.hpp.fixedPrepCostOrder / qty;

  const totalHppPerMt =
    effectiveRawCostPerMt +
    effectiveSourcingFreightPerMt +
    input.hpp.processingCostPerMt +
    input.hpp.laborCostPerMt +
    input.hpp.overheadCostPerMt +
    input.hpp.packagingCostPerMt +
    input.hpp.labelCostPerMt +
    input.hpp.qcLabCostPerMt +
    input.hpp.otherProdCostPerMt +
    fixedPrepCostPerMt;

  const totalHppOrder = totalHppPerMt * qty;

  // Percentage breakdown of HPP
  const hppBreakdownPercentages: Record<string, number> = {
    rawMaterial: totalHppPerMt > 0 ? (effectiveRawCostPerMt / totalHppPerMt) * 100 : 0,
    sourcingFreight: totalHppPerMt > 0 ? (effectiveSourcingFreightPerMt / totalHppPerMt) * 100 : 0,
    processing: totalHppPerMt > 0 ? (input.hpp.processingCostPerMt / totalHppPerMt) * 100 : 0,
    labor: totalHppPerMt > 0 ? (input.hpp.laborCostPerMt / totalHppPerMt) * 100 : 0,
    overhead: totalHppPerMt > 0 ? (input.hpp.overheadCostPerMt / totalHppPerMt) * 100 : 0,
    packaging: totalHppPerMt > 0 ? (input.hpp.packagingCostPerMt / totalHppPerMt) * 100 : 0,
    label: totalHppPerMt > 0 ? (input.hpp.labelCostPerMt / totalHppPerMt) * 100 : 0,
    qcLab: totalHppPerMt > 0 ? (input.hpp.qcLabCostPerMt / totalHppPerMt) * 100 : 0,
    other: totalHppPerMt > 0 ? (input.hpp.otherProdCostPerMt / totalHppPerMt) * 100 : 0,
    fixedPrep: totalHppPerMt > 0 ? (fixedPrepCostPerMt / totalHppPerMt) * 100 : 0,
  };

  // B. Additional Costs Effective Calculation
  const additionalCostsEffective = input.additionalCosts.map((item) => {
    const effectivePerMt = (Number(item.perMt) || 0) + (Number(item.fixedOrder) || 0) / qty;
    return {
      ...item,
      effectivePerMt: Number(effectivePerMt.toFixed(2)),
      totalCost: Number((effectivePerMt * qty).toFixed(2)),
    };
  });

  // Calculate stage sum helpers
  const getStageCost = (stages: string[]) =>
    additionalCostsEffective
      .filter((i) => stages.includes(i.stage))
      .reduce((sum, i) => sum + i.effectivePerMt, 0);

  const fcaCost = getStageCost(["FCA"]);
  const fobCost = getStageCost(["FOB"]);
  const cfrCost = getStageCost(["CFR"]);
  const cifCost = getStageCost(["CIF"]);
  const dapCost = getStageCost(["DAP"]);
  const dpuCost = getStageCost(["DPU"]);
  const ddpCost = getStageCost(["DDP"]);

  // C. Cumulative Rantai Incoterms
  const exwCumulative = 0;
  const fcaCumulative = fcaCost;
  const fasCumulative = fcaCost + fobCost * 0.6; // Approximates FAS without on-board loading
  const fobCumulative = fcaCost + fobCost;
  const cfrCumulative = fobCumulative + cfrCost;
  const cifCumulative = cfrCumulative + cifCost;
  const cptCumulative = fcaCost + cfrCost;
  const cipCumulative = cptCumulative + cifCost;
  const dapCumulative = cifCumulative + dapCost;
  const dpuCumulative = dapCumulative + dpuCost;
  const ddpCumulative = dapCumulative + ddpCost;

  const buildRow = (
    term: IncotermChainRow["term"],
    group: IncotermChainRow["group"],
    cumulativeCost: number,
  ): IncotermChainRow => {
    const breakEven = totalHppPerMt + cumulativeCost;
    const targetPrice = breakEven * (1 + markup);
    const targetProfit = targetPrice - breakEven;
    const totalTargetOrder = targetPrice * qty;
    const totalTargetProfitOrder = targetProfit * qty;

    let breakEvenIndicator: IncotermChainRow["breakEvenIndicator"] = "-";
    let targetStatus: IncotermChainRow["targetStatus"] = "-";

    if (buyerPrice > 0) {
      if (buyerPrice < breakEven - 0.01) {
        breakEvenIndicator = "RUGI";
        targetStatus = "RUGI";
      } else if (Math.abs(buyerPrice - breakEven) <= 0.01) {
        breakEvenIndicator = "IMPAS";
        targetStatus = "DI BAWAH TARGET";
      } else {
        breakEvenIndicator = "UNTUNG";
        if (buyerPrice >= targetPrice - 0.01) {
          targetStatus = "TARGET TERCAPAI";
        } else {
          targetStatus = "DI BAWAH TARGET";
        }
      }
    }

    return {
      term,
      group,
      cumulativeCostPerMt: Number(cumulativeCost.toFixed(2)),
      breakEvenPricePerMt: Number(breakEven.toFixed(2)),
      targetPricePerMt: Number(targetPrice.toFixed(2)),
      totalTargetOrder: Number(totalTargetOrder.toFixed(2)),
      targetProfitPerMt: Number(targetProfit.toFixed(2)),
      totalTargetProfitOrder: Number(totalTargetProfitOrder.toFixed(2)),
      buyerPricePerMt: buyerPrice,
      breakEvenIndicator,
      targetStatus,
    };
  };

  const chain: IncotermChainRow[] = [
    buildRow("EXW", "Semua moda", exwCumulative),
    buildRow("FCA", "Multimoda", fcaCumulative),
    buildRow("FAS", "Laut", fasCumulative),
    buildRow("FOB", "Laut", fobCumulative),
    buildRow("CFR", "Laut", cfrCumulative),
    buildRow("CIF", "Laut", cifCumulative),
    buildRow("CPT", "Multimoda", cptCumulative),
    buildRow("CIP", "Multimoda", cipCumulative),
    buildRow("DAP", "Semua moda", dapCumulative),
    buildRow("DPU", "Semua moda", dpuCumulative),
    buildRow("DDP", "Semua moda", ddpCumulative),
  ];

  return {
    yieldRatio: Number(yieldRatio.toFixed(3)),
    rawMaterialPerMtOutput: Number(rawMaterialPerMtOutput.toFixed(3)),
    effectiveRawCostPerMt: Number(effectiveRawCostPerMt.toFixed(2)),
    shrinkageCostImpactPerMt: Number(shrinkageCostImpactPerMt.toFixed(2)),
    effectiveSourcingFreightPerMt: Number(effectiveSourcingFreightPerMt.toFixed(2)),
    fixedPrepCostPerMt: Number(fixedPrepCostPerMt.toFixed(2)),
    totalHppPerMt: Number(totalHppPerMt.toFixed(2)),
    totalHppOrder: Number(totalHppOrder.toFixed(2)),
    hppBreakdownPercentages,
    additionalCostsEffective,
    chain,
  };
}
