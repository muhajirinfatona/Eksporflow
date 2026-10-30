import type { AdditionalCostFactor, Incoterm, LineItem, Shipment } from "./shipment";

export type Pricing = {
  active: { offer: number; cost: number; profit: number; unit: number };
  goods: number;
  totalQuantity: number;
  validationErrors: string[];
  formulaVersion: string;
  scenarios: { term: Incoterm; offer: number; cost: number; profit: number; unit: number }[];
};

export type CostKey =
  | "goods"
  | "packaging"
  | "inlandTransport"
  | "originHandling"
  | "customs"
  | "freight"
  | "insurance"
  | "destinationHandling"
  | "importDuty"
  | "lastMile";

/** Komponen biaya yang termasuk dalam harga untuk setiap Incoterm. */
export const incotermCostKeys: Record<Incoterm, CostKey[]> = {
  EXW: ["goods", "packaging"],
  FCA: ["goods", "packaging", "inlandTransport"],
  FOB: ["goods", "packaging", "inlandTransport", "originHandling", "customs"],
  CFR: ["goods", "packaging", "inlandTransport", "originHandling", "customs", "freight"],
  CIF: ["goods", "packaging", "inlandTransport", "originHandling", "customs", "freight", "insurance"],
  DAP: ["goods", "packaging", "inlandTransport", "originHandling", "customs", "freight", "insurance", "destinationHandling"],
  DDP: ["goods", "packaging", "inlandTransport", "originHandling", "customs", "freight", "insurance", "destinationHandling", "importDuty", "lastMile"],
};

export type PricingInput = Pick<
  Shipment,
  | "currency"
  | "incoterm"
  | "packaging"
  | "inlandTransport"
  | "originHandling"
  | "customs"
  | "freight"
  | "insurance"
  | "destinationHandling"
  | "importDuty"
  | "lastMile"
  | "margin"
  | "discount"
  | "contingency"
  | "exchangeRate"
  | "namedPlace"
  | "formulaVersion"
> & {
  lineItems: Pick<LineItem, "quantity" | "unitPrice">[];
  additionalCostFactors?: AdditionalCostFactor[];
};

export function validatePricing(input: PricingInput, totalQuantity: number): string[] {
  const errors: string[] = [];
  if (totalQuantity <= 0) errors.push("Quantity harus lebih besar dari nol.");
  if (!input.currency.trim()) errors.push("Mata uang wajib diisi.");
  if (!Number.isFinite(input.exchangeRate) || input.exchangeRate <= 0) errors.push("Kurs referensi harus lebih besar dari nol.");
  if (!Number.isFinite(input.margin) || input.margin < 0 || input.margin >= 100) errors.push("Target margin harus berada di antara 0% dan kurang dari 100%.");
  if (!input.namedPlace.trim()) errors.push("Named place / port wajib diisi untuk menjelaskan titik serah.");
  if (input.discount < 0) errors.push("Diskon tidak boleh bernilai negatif.");
  return errors;
}

/**
 * Formula v1.8: harga penawaran = cost / (1 - target margin) - diskon,
 * dengan contingency ditambahkan ke cost (terpisah dari margin).
 */
export function calculatePricing(input: PricingInput) {
  const totalQuantity = input.lineItems.reduce((total, item) => total + item.quantity, 0);
  const rawGoods = input.lineItems.reduce((total, item) => total + item.quantity * item.unitPrice, 0);
  const additionalGoods = (input.additionalCostFactors || [])
    .filter((f) => f.section === "goods")
    .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  const additionalLogistics = (input.additionalCostFactors || [])
    .filter((f) => f.section === "logistics")
    .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  const additionalStrategy = (input.additionalCostFactors || [])
    .filter((f) => f.section === "strategy")
    .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  const goods = rawGoods + additionalGoods;

  const validationErrors = validatePricing(input, totalQuantity);
  const included = incotermCostKeys;
  const costs: Record<CostKey, number> = {
    goods,
    packaging: input.packaging,
    inlandTransport: input.inlandTransport,
    originHandling: input.originHandling,
    customs: input.customs,
    freight: input.freight,
    insurance: input.insurance,
    destinationHandling: input.destinationHandling,
    importDuty: input.importDuty,
    lastMile: input.lastMile,
  };
  const calculate = (term: Incoterm) => {
    const directCost =
      included[term].reduce((total, key) => total + (costs[key] ?? 0), 0) +
      (term !== "EXW" ? additionalLogistics : 0) +
      additionalStrategy;
    const cost = directCost + (directCost * Math.max(0, input.contingency)) / 100;
    const targetMargin = input.margin / 100;
    const netOfferBeforeDiscount = targetMargin < 1 ? cost / Math.max(0.0001, 1 - targetMargin) : 0;
    const offer = Math.max(0, netOfferBeforeDiscount - input.discount);
    const profit = Math.max(0, offer - cost);
    return { cost, profit, offer, unit: totalQuantity ? offer / totalQuantity : 0 };
  };
  const active = calculate(input.incoterm);
  return {
    goods,
    rawGoods,
    additionalGoods,
    additionalLogistics,
    additionalStrategy,
    totalQuantity,
    included,
    costs,
    calculate,
    active,
    validationErrors,
    formulaVersion: input.formulaVersion,
    scenarios: (Object.keys(included) as Incoterm[]).map((term) => ({ term, ...calculate(term) })),
  };
}
