import { describe, expect, it } from "vitest";
import {
  buildDocumentSnapshotPayload,
  calculateDocumentItems,
  calculateDocumentTotals,
  canonicalJsonStringify,
  computePayloadHash,
  formatInstitutionalDocNumber,
  validateExportDocument,
  verifyPayloadHash,
  type DocumentLineItem,
} from "./documentEngine";
import type { Shipment } from "./shipment";

describe("Document Engine - Institutional Multi-Item & Snapshot Integrity", () => {
  const sampleShipment: Partial<Shipment> = {
    reference: "EXP-2026-901",
    exporter: "PT. Indico Nusantara Agro",
    buyer: "Nordic Pantry AB",
    buyerCountry: "Sweden",
    destination: "Gothenburg, Sweden",
    currency: "USD",
    incoterm: "CIF",
    paymentTerms: "30% DP / 70% before shipment",
    lineItems: [
      {
        id: "item-1",
        description: "Organic Coconut Sugar Grade A",
        hsCode: "1702.90.11",
        quantity: 1200,
        unit: "carton",
        unitPrice: 22.5,
        weight: 10, // 10 kg/carton
        length: 40,
        width: 30,
        height: 25, // 0.03 m3 per carton
        packagingType: "Karton box",
        shrinkageRate: 0,
        palletEnabled: true,
        palletCount: 30,
        palletLength: 120,
        palletWidth: 100,
        palletHeight: 15,
        palletWeight: 20, // 30 * 20 = 600 kg pallet tare
      },
      {
        id: "item-2",
        description: "Robusta Fine Coffee Green Beans",
        hsCode: "0901.11.10",
        quantity: 300,
        unit: "sack",
        unitPrice: 180.0,
        weight: 60, // 60 kg/sack
        length: 80,
        width: 50,
        height: 30, // 0.12 m3 per sack
        packagingType: "Karung goni / Jute bag",
        shrinkageRate: 0,
        palletEnabled: false,
        palletCount: 0,
        palletLength: 120,
        palletWidth: 100,
        palletHeight: 15,
        palletWeight: 0,
      },
    ],
  };

  it("calculates multi-item dimensions, weights, and CBM accurately", () => {
    const items = calculateDocumentItems(sampleShipment);
    expect(items).toHaveLength(2);

    // Item 1
    const item1 = items[0];
    expect(item1.itemNo).toBe(1);
    expect(item1.description).toBe("Organic Coconut Sugar Grade A");
    expect(item1.hsCode).toBe("1702.90.11");
    expect(item1.uncefactPackageCode).toBe("CT");
    expect(item1.quantity).toBe(1200);
    expect(item1.totalAmount).toBe(27000); // 1200 * 22.5
    expect(item1.netWeightKg).toBe(12000); // 1200 * 10
    // Gross weight = net weight + packaging tare (4%) + pallets (30 * 20 = 600)
    // 1200 * (10 + 0.4) + 600 = 12480 + 600 = 13080 kg
    expect(item1.grossWeightKg).toBe(13080);
    // Volume: (40 * 30 * 25 * 1200) / 1,000,000 = 36.0 CBM
    expect(item1.volumeCbm).toBe(36);
    expect(item1.marksAndNumbers).toMatch(/^NOR\/GOT\/\d{3}-\d{4}$/);

    // Item 2
    const item2 = items[1];
    expect(item2.itemNo).toBe(2);
    expect(item2.description).toBe("Robusta Fine Coffee Green Beans");
    expect(item2.uncefactPackageCode).toBe("SA");
    expect(item2.totalAmount).toBe(54000); // 300 * 180
    expect(item2.netWeightKg).toBe(18000); // 300 * 60
    // Volume: (80 * 50 * 30 * 300) / 1,000,000 = 36.0 CBM
    expect(item2.volumeCbm).toBe(36);
  });

  it("accumulates document grand totals correctly across line items", () => {
    const items = calculateDocumentItems(sampleShipment);
    const totals = calculateDocumentTotals(items, "USD");

    expect(totals.itemsCount).toBe(2);
    expect(totals.totalQuantity).toBe(1500); // 1200 + 300
    expect(totals.totalAmount).toBe(81000); // 27000 + 54000
    expect(totals.totalNetWeightKg).toBe(30000); // 12000 + 18000
    expect(totals.totalNetWeightMT).toBe(30);
    expect(totals.totalVolumeCbm).toBe(72); // 36 + 36
    expect(totals.currency).toBe("USD");
    expect(totals.amountInWords).toContain("EIGHTY-ONE THOUSAND");
  });

  it("formats standardized institutional document numbers", () => {
    expect(formatInstitutionalDocNumber("Sales Contract", "EXP-2026-901", 1)).toBe("SC/EXP-2026-901");
    expect(formatInstitutionalDocNumber("Commercial Invoice", "EXP-2026-901", 2)).toBe("INV/EXP-2026-901-R2");
    expect(formatInstitutionalDocNumber("Packing List", "EXP-2026-901", 1)).toBe("PL/EXP-2026-901");
    expect(formatInstitutionalDocNumber("Certificate of Origin", "EXP-2026-901", 1)).toBe("COO/EXP-2026-901");
    expect(formatInstitutionalDocNumber("Shipping Instruction", "EXP-2026-901", 1)).toBe("SI/EXP-2026-901");
  });

  it("produces deterministic canonical JSON string and consistent SHA-256 hash", () => {
    const objA = { z: 1, a: 2, m: { y: "test", b: 10 } };
    const objB = { a: 2, m: { b: 10, y: "test" }, z: 1 };

    const canonicalA = canonicalJsonStringify(objA);
    const canonicalB = canonicalJsonStringify(objB);

    expect(canonicalA).toBe(canonicalB);

    const hashA = computePayloadHash(objA);
    const hashB = computePayloadHash(objB);

    expect(hashA).toBe(hashB);
    expect(hashA).toHaveLength(64); // SHA-256 hex string length
    expect(verifyPayloadHash(objA, hashA)).toBe(true);
    expect(verifyPayloadHash({ ...objA, z: 99 }, hashA)).toBe(false);
  });

  it("builds a complete institutional document snapshot payload and validates it", () => {
    const payload = buildDocumentSnapshotPayload("Commercial Invoice", sampleShipment, 1);
    expect(payload.schemaVersion).toBe("2.0");
    expect(payload.documentType).toBe("Commercial Invoice");
    expect(payload.lineItems).toHaveLength(2);
    expect(payload.totals.totalAmount).toBe(81000);
    expect(payload.compliance?.packagingSummary).toContain("Total 1500 pkgs");
    expect(payload.compliance?.insuranceStatement).toContain("MARINE INSURANCE");

    const hash = computePayloadHash(payload);
    expect(verifyPayloadHash(payload, hash)).toBe(true);

    const validation = validateExportDocument("Commercial Invoice", sampleShipment);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it("catches validation errors when required export fields are missing", () => {
    const invalidShipment: Partial<Shipment> = {
      reference: "",
      exporter: "",
      buyer: "",
      lineItems: [],
    };

    const validation = validateExportDocument("Commercial Invoice", invalidShipment);
    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(2);
    expect(validation.errors).toContain("Nomor referensi transaksi wajib diisi.");
    expect(validation.errors).toContain("Nama entitas eksportir wajib diisi.");
  });
});
