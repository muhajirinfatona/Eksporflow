import { describe, expect, it } from "vitest";
import {
  applyLineItemsUpdate,
  applyShipmentFieldUpdate,
  applyShipmentNumberUpdate,
  hydrateShipment,
  initialShipment,
  toShipmentPersistencePayload,
} from "./shipment";

describe("shipment state & persistence serialization", () => {
  it("melakukan round-trip antara Shipment dan payload database tanpa kehilangan data", () => {
    const modified = {
      ...initialShipment,
      reference: "EXP-2026-901",
      buyer: "Kyoto Trading Co.",
      shipmentStatus: "Booked" as const,
      bookingNumber: "NYK-7712",
      lineItems: [
        ...initialShipment.lineItems,
        {
          ...initialShipment.lineItems[0],
          id: "item-2",
          description: "Robusta Coffee Beans",
          hsCode: "0901.11",
          quantity: 120,
          unitPrice: 45,
        },
      ],
    };
    const payload = toShipmentPersistencePayload(modified);
    const hydrated = hydrateShipment(payload);
    expect(hydrated.reference).toBe("EXP-2026-901");
    expect(hydrated.buyer).toBe("Kyoto Trading Co.");
    expect(hydrated.shipmentStatus).toBe("Booked");
    expect(hydrated.bookingNumber).toBe("NYK-7712");
    expect(hydrated.lineItems).toHaveLength(2);
    expect(hydrated.lineItems[1].description).toBe("Robusta Coffee Beans");
  });

  it("menaikkan documentRevision dan menyinkronkan quantity dengan cartonQty & line item pertama", () => {
    const step1 = applyShipmentFieldUpdate(initialShipment, "buyer", "Global Foods Sdn Bhd");
    expect(step1.documentRevision).toBe(initialShipment.documentRevision + 1);

    const step2 = applyShipmentNumberUpdate(step1, "quantity", "1500");
    expect(step2.quantity).toBe(1500);
    expect(step2.cartonQty).toBe(1500);
    expect(step2.lineItems[0].quantity).toBe(1500);

    const step3 = applyLineItemsUpdate(step2, [
      { ...step2.lineItems[0], quantity: 800 },
      { ...step2.lineItems[0], id: "item-2", quantity: 200 },
    ]);
    expect(step3.quantity).toBe(1000);
    expect(step3.cartonQty).toBe(1000);
  });
});
