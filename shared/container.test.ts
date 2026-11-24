import { describe, expect, it } from "vitest";
import {
  PACKAGING_PRESETS,
  PALLET_PRESETS,
  calculateContainer,
  calculateStuffingOptimizationMatrix,
  getPackagingPreset,
  getPalletPreset,
  resolveUncefactCode,
} from "./container";
import { initialShipment } from "./shipment";

describe("calculateContainer", () => {
  it("memisahkan volume produk dan pallet serta berat net/gross/pallet", () => {
    const calc = calculateContainer(initialShipment);
    // 40x30x25 cm = 0,03 m3 x 2.400 = 72 ; pallet 1,2x1x0,15 = 0,18 m3 x 60 = 10,8
    expect(calc.productVolume).toBeCloseTo(72, 6);
    expect(calc.palletVolume).toBeCloseTo(10.8, 6);
    expect(calc.totalVolume).toBeCloseTo(82.8, 6);
    expect(calc.palletCount).toBe(60);
    // 12 kg x 2.400 = 28.800 ; pallet 22 kg x 60 = 1.320
    expect(calc.palletWeight).toBe(1320);
    expect(calc.grossWeight).toBe(30120);
    expect(calc.totalWeight).toBe(30120);
  });

  it("shrinkage mengurangi net weight tetapi tidak gross weight", () => {
    const calc = calculateContainer(initialShipment);
    expect(calc.shrinkageLoss).toBeCloseTo(432, 6);
    expect(calc.netWeight).toBeCloseTo(28368, 6);
    expect(calc.grossWeight).toBe(30120);
  });

  it("jumlah kontainer mengikuti batas terbesar antara volume dan berat", () => {
    const calc = calculateContainer(initialShipment);
    expect(calc.byVolume).toBe(2); // 82,8 / 76,4
    expect(calc.byWeight).toBe(2); // 30.120 / 26.600
    expect(calc.containers).toBe(2);
    expect(calc.volumeUtilization).toBeCloseTo((82.8 / (2 * 76.4)) * 100, 6);
    expect(calc.weightUtilization).toBeCloseTo((30120 / (2 * 26600)) * 100, 6);
  });

  it("pallet nonaktif tidak menambah volume maupun berat", () => {
    const item = { ...initialShipment.lineItems[0], palletEnabled: false };
    const calc = calculateContainer({ ...initialShipment, lineItems: [item] });
    expect(calc.palletVolume).toBe(0);
    expect(calc.palletWeight).toBe(0);
    expect(calc.palletCount).toBe(0);
    expect(calc.grossWeight).toBe(28800);
  });

  it("shrinkage di luar 0-100% dibatasi", () => {
    const item = { ...initialShipment.lineItems[0], shrinkageRate: 250 };
    const calc = calculateContainer({ ...initialShipment, lineItems: [item] });
    expect(calc.shrinkageLoss).toBe(28800);
    expect(calc.netWeight).toBe(0);
  });

  it("memakai data karton legacy jika line item kosong", () => {
    const calc = calculateContainer({ ...initialShipment, lineItems: [] });
    expect(calc.totalVolume).toBeCloseTo(72, 6);
    expect(calc.totalWeight).toBe(28800);
    expect(calc.byVolume).toBe(1);
    expect(calc.byWeight).toBe(2); // 28.800 kg > batas 26.600 kg per 40HC
    expect(calc.containers).toBe(2);
  });

  it("kontainer 20GP memerlukan lebih banyak unit dibanding 40HC", () => {
    const a = calculateContainer({ ...initialShipment, containerType: "20GP" });
    const b = calculateContainer({ ...initialShipment, containerType: "40HC" });
    expect(a.containers).toBeGreaterThan(b.containers);
  });

  it("menetapkan kode UN/CEFACT dan preset kemasan secara akurat", () => {
    const calc = calculateContainer(initialShipment);
    expect(calc.primaryPackagingType).toBe("Karton box");
    expect(calc.primaryUncefactCode).toBe("CT");
    expect(calc.isPayloadOverweight).toBe(false);
    expect(calc.maxPayloadRemainingKg).toBeGreaterThan(0);
  });
});

describe("resolveUncefactCode & Packaging Presets", () => {
  it("memetakan berbagai tipe kemasan komersial ke kode UN/CEFACT Rec 21", () => {
    expect(resolveUncefactCode("Karton box")).toBe("CT");
    expect(resolveUncefactCode("Corrugated Master Carton")).toBe("CT");
    expect(resolveUncefactCode("Drum Baja 200L")).toBe("DR");
    expect(resolveUncefactCode("Steel Drum")).toBe("DR");
    expect(resolveUncefactCode("Karung goni 50kg")).toBe("SA");
    expect(resolveUncefactCode("Woven Sack PP")).toBe("SA");
    expect(resolveUncefactCode("IBC Tank 1000L")).toBe("11A");
    expect(resolveUncefactCode("Crate Kayu ISPM-15")).toBe("CR");
    expect(resolveUncefactCode("Wooden Pallet")).toBe("PX");
    expect(resolveUncefactCode("Jerrycan 20L")).toBe("JY");
    expect(resolveUncefactCode("Unknown Custom")).toBe("PK");
  });

  it("memiliki preset standar industri yang valid", () => {
    expect(PACKAGING_PRESETS.length).toBeGreaterThanOrEqual(7);
    expect(PALLET_PRESETS.length).toBeGreaterThanOrEqual(3);

    const drum = getPackagingPreset("drum-steel-200l");
    expect(drum).toBeDefined();
    expect(drum?.uncefactCode).toBe("DR");
    expect(drum?.length).toBe(58.5);

    const pallet = getPalletPreset("pallet-iso-120x100");
    expect(pallet).toBeDefined();
    expect(pallet?.standard).toBe("ISO");
    expect(pallet?.tareWeight).toBe(22);
  });

  it("menghitung matriks stuffing optimization dengan benar", () => {
    // Drum 200L di 20GP: 589x235x239 cm
    const matrix = calculateStuffingOptimizationMatrix("20GP", {
      length: 58.5,
      width: 58.5,
      height: 88,
      weight: 220,
    });
    expect(matrix.piecesPerCol).toBe(10); // 589 / 58.5 = 10
    expect(matrix.piecesPerRow).toBe(4);  // 235 / 58.5 = 4
    expect(matrix.layersCount).toBe(2);   // 239 / 88 = 2
    expect(matrix.recommendedPieces).toBeLessThanOrEqual(80);
    expect(matrix.limitingFactor).toBeDefined();
  });
});

