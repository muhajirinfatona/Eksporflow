import { describe, expect, it } from "vitest";
import { calculateContainer } from "./container";
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
});
