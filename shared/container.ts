import type { ContainerCalc, LineItem, Shipment } from "./shipment";

export const containerSpecs = {
  "20GP": { name: "20' General Purpose", innerL: 589, innerW: 235, innerH: 239, volume: 33.2, weight: 28200 },
  "40GP": { name: "40' General Purpose", innerL: 1203, innerW: 235, innerH: 239, volume: 67.7, weight: 26600 },
  "40HC": { name: "40' High Cube", innerL: 1203, innerW: 235, innerH: 269, volume: 76.4, weight: 26600 },
} as const;

export type ContainerInput = Pick<Shipment, "containerType" | "cartonLength" | "cartonWidth" | "cartonHeight" | "cartonWeight" | "cartonQty"> & {
  lineItems: LineItem[];
};

/**
 * Estimasi muatan: volume produk/pallet, berat net/gross/pallet, dan jumlah kontainer.
 * Shrinkage hanya mengurangi net weight; gross weight tidak berkurang.
 * Hasil adalah estimasi, bukan optimizer stuffing atau sertifikasi keselamatan.
 */
export function calculateContainer(input: ContainerInput): ContainerCalc {
  const spec = containerSpecs[input.containerType];
  const itemStats = input.lineItems.reduce(
    (stats, item) => {
      const shrinkage = Math.min(100, Math.max(0, item.shrinkageRate || 0)) / 100;
      const productVolume = ((item.length * item.width * item.height) / 1_000_000) * item.quantity;
      const palletVolume = item.palletEnabled ? ((item.palletLength * item.palletWidth * item.palletHeight) / 1_000_000) * item.palletCount : 0;
      const productWeight = item.weight * item.quantity;
      const palletWeight = item.palletEnabled ? item.palletWeight * item.palletCount : 0;
      return {
        volume: stats.volume + productVolume + palletVolume,
        weight: stats.weight + productWeight + palletWeight,
        netWeight: stats.netWeight + productWeight * (1 - shrinkage),
        grossWeight: stats.grossWeight + productWeight + palletWeight,
        productVolume: stats.productVolume + productVolume,
        palletVolume: stats.palletVolume + palletVolume,
        palletWeight: stats.palletWeight + palletWeight,
        palletCount: stats.palletCount + (item.palletEnabled ? item.palletCount : 0),
        shrinkageLoss: stats.shrinkageLoss + productWeight * shrinkage,
      };
    },
    { volume: 0, weight: 0, netWeight: 0, grossWeight: 0, productVolume: 0, palletVolume: 0, palletWeight: 0, palletCount: 0, shrinkageLoss: 0 },
  );
  const legacyVolume = ((input.cartonLength * input.cartonWidth * input.cartonHeight) / 1_000_000) * input.cartonQty;
  const totalVolume = itemStats.volume || legacyVolume;
  const totalWeight = itemStats.grossWeight || input.cartonWeight * input.cartonQty;
  const cartonVolume = input.lineItems.length
    ? totalVolume / Math.max(1, input.lineItems.reduce((sum, item) => sum + item.quantity, 0))
    : totalVolume / Math.max(1, input.cartonQty);
  const byVolume = spec.volume ? Math.ceil(totalVolume / spec.volume) : 0;
  const byWeight = spec.weight ? Math.ceil(totalWeight / spec.weight) : 0;
  const containers = Math.max(1, byVolume, byWeight);
  const volumeUtilization = (totalVolume / (containers * spec.volume)) * 100;
  const weightUtilization = (totalWeight / (containers * spec.weight)) * 100;
  return {
    ...spec,
    cartonVolume,
    totalVolume,
    totalWeight,
    netWeight: input.lineItems.length ? itemStats.netWeight : totalWeight,
    grossWeight: totalWeight,
    productVolume: itemStats.productVolume || totalVolume,
    palletVolume: itemStats.palletVolume,
    palletWeight: itemStats.palletWeight,
    byVolume,
    byWeight,
    containers,
    volumeUtilization,
    weightUtilization,
    packagingVolume: itemStats.palletVolume,
    palletCount: itemStats.palletCount,
    shrinkageLoss: itemStats.shrinkageLoss,
  };
}
