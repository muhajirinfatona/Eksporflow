export type TraderHppInput = {
  supplierBuyPrice: number;       // Harga beli supplier/petani per unit (gula mentah dari petani)
  shrinkageRatePercent: number;   // % susut bobot saat diolah agar masuk spek ekspor (0-80%)
  sourcingFreightPerUnit: number; // Biaya angkut lokal dari petani/kebun ke gudang olah
  sortingLaborPerUnit: number;    // Gaji/upah karyawan olah, sortasi & packing
  innerPackagingPerUnit: number;  // Biaya kemasan produk (pouch, karung, plastik)
  labelPackagingPerUnit?: number; // Biaya label kemasan (stiker, printing, barcode)
  staffingOverheadPerUnit?: number; // Biaya staffing, listrik gudang, uji lab & lain-lain
  traderMarginPerUnit: number;    // Margin pengadaan trader (opsional di HPP)
  quantity: number;
};

export type ManufacturerHppInput = {
  rawMaterialPerUnit: number;    // Biaya bahan baku utama
  auxiliaryMaterialPerUnit: number; // Biaya bahan penolong
  directLaborPerUnit: number;    // Upah tenaga kerja langsung
  factoryOverheadPerUnit: number;// Biaya overhead pabrik (listrik, mesin, QC)
  quantity: number;
};

export type HppResult = {
  effectiveMaterialCostPerUnit: number; // Biaya bahan setelah susut
  shrinkageCostImpactPerUnit: number;   // Tambahan biaya akibat susut per unit
  totalHppPerUnit: number;              // Total HPP per unit bersih
  totalHppOverall: number;              // Total HPP seluruh quantity
};

/**
 * Kalkulator HPP khusus Trader / Aggregator Ekspor:
 * Menghitung harga beli supplier dengan kompensasi susut sortasi (shrinkage),
 * biaya angkut lokal dari petani/sumber, sortasi, dan kemasan primer.
 */
export function calculateTraderHpp(input: TraderHppInput): HppResult {
  const shrink = Math.max(0, Math.min(80, input.shrinkageRatePercent || 0)) / 100;
  // Yield ratio: untuk menghasilkan 1 unit siap ekspor dengan susut s%, dibutuhkan 1 / (1 - s) unit mentah
  const yieldRatio = shrink < 1 ? 1 / (1 - shrink) : 1;
  const buyPrice = Math.max(0, input.supplierBuyPrice || 0);
  const effectiveMaterialCostPerUnit = buyPrice * yieldRatio;
  const shrinkageCostImpactPerUnit = effectiveMaterialCostPerUnit - buyPrice;

  const totalHppPerUnit =
    effectiveMaterialCostPerUnit +
    Math.max(0, input.sourcingFreightPerUnit || 0) +
    Math.max(0, input.sortingLaborPerUnit || 0) +
    Math.max(0, input.innerPackagingPerUnit || 0) +
    Math.max(0, input.labelPackagingPerUnit || 0) +
    Math.max(0, input.staffingOverheadPerUnit || 0) +
    Math.max(0, input.traderMarginPerUnit || 0);

  const qty = Math.max(1, input.quantity || 1);
  const totalHppOverall = totalHppPerUnit * qty;

  return {
    effectiveMaterialCostPerUnit: Number(effectiveMaterialCostPerUnit.toFixed(2)),
    shrinkageCostImpactPerUnit: Number(shrinkageCostImpactPerUnit.toFixed(2)),
    totalHppPerUnit: Number(totalHppPerUnit.toFixed(2)),
    totalHppOverall: Number(totalHppOverall.toFixed(2)),
  };
}

/**
 * Kalkulator HPP khusus Produsen / Manufaktur Ekspor:
 * Bahan baku + Bahan pembantu + Tenaga kerja langsung + Overhead pabrik.
 */
export function calculateManufacturerHpp(input: ManufacturerHppInput): HppResult {
  const materialCost = Math.max(0, input.rawMaterialPerUnit || 0) + Math.max(0, input.auxiliaryMaterialPerUnit || 0);
  const totalHppPerUnit =
    materialCost +
    Math.max(0, input.directLaborPerUnit || 0) +
    Math.max(0, input.factoryOverheadPerUnit || 0);

  const qty = Math.max(1, input.quantity || 1);
  const totalHppOverall = totalHppPerUnit * qty;

  return {
    effectiveMaterialCostPerUnit: Number(materialCost.toFixed(2)),
    shrinkageCostImpactPerUnit: 0,
    totalHppPerUnit: Number(totalHppPerUnit.toFixed(2)),
    totalHppOverall: Number(totalHppOverall.toFixed(2)),
  };
}
