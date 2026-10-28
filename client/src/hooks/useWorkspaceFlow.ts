import type { Pricing } from "@shared/pricing";
import {
  defaultLegalChecklist,
  evaluateRiskChecks,
  type LegalChecklist,
  type RiskEvaluation,
  type ScreenId,
} from "@shared/risk";
import { emptyLineItem, type ContainerCalc, type LineItem, type Shipment } from "@shared/shipment";
import { useCallback, useEffect, useMemo, useState } from "react";

export type PartnerEntry = {
  id: string;
  name: string;
  country: string;
  destination: string;
  terms: string;
};

export type CatalogProduct = {
  id: string;
  name: string;
  sku: string;
  hsCode: string;
  unit: string;
  unitPrice: number;
  packagingType: string;
  weight: number;
  length: number;
  width: number;
  height: number;
};

export type ApprovalDecision =
  | "Menunggu review"
  | "Revisi diminta"
  | "Tercatat direview"
  | "Perlu review ulang";

export type StoredApproval = {
  status: "Menunggu review" | "Revisi diminta" | "Tercatat direview";
  comment: string;
  reviewedOffer: number | null;
  reviewedIncoterm: string | null;
  reviewedMargin: number | null;
  updatedAt: string | null;
};

export type FinanceRecord = {
  dpConfirmed: boolean;
  settlementConfirmed: boolean;
  realizedRate: number;
  arStatus: "Menunggu posting" | "Posted" | "Reversed";
  updatedAt: string | null;
};

export type KnowledgeSource = {
  id: string;
  title: string;
  scope: string;
  version: string;
  governance: string;
  status: "Published" | "In review";
};

export type ReadinessRecord = {
  experience: string;
  certReady: boolean;
};

const LEGACY_KEYS = [
  "eksporflow-shipment",
  "eksporflow-partners-v1",
  "eksporflow-products-v1",
  "eksporflow-approvals-v1",
  "eksporflow-finance-v1",
  "eksporflow-knowledge-v1",
  "eksporflow-readiness-v1",
  "eksporflow-legal-EXP-2026-084",
];

function purgeLegacyDummyStorage() {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem("eksporflow-clean-slate-v2") === "1") return;
    for (const key of LEGACY_KEYS) {
      localStorage.removeItem(key);
    }
    localStorage.setItem("eksporflow-clean-slate-v2", "1");
  } catch {
    // Abaikan jika akses localStorage terbatas.
  }
}

function buildUserKeys(userId?: number | null) {
  const scope = userId ? `u${userId}` : "guest";
  return {
    partners: `eksporflow-v2-${scope}-partners`,
    products: `eksporflow-v2-${scope}-products`,
    approvals: `eksporflow-v2-${scope}-approvals`,
    finance: `eksporflow-v2-${scope}-finance`,
    knowledge: `eksporflow-v2-${scope}-knowledge`,
    readiness: `eksporflow-v2-${scope}-readiness`,
    legalPrefix: `eksporflow-v2-${scope}-legal-`,
  };
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Abaikan bila storage penuh.
  }
}

function readLegalChecklist(prefix: string, reference: string): LegalChecklist {
  try {
    const raw = localStorage.getItem(`${prefix}${reference}`);
    if (!raw) return defaultLegalChecklist;
    return {
      ...defaultLegalChecklist,
      ...(JSON.parse(raw) as Partial<LegalChecklist>),
    };
  } catch {
    return defaultLegalChecklist;
  }
}

export type WorkspaceFlow = {
  partners: PartnerEntry[];
  addPartner: (entry: Omit<PartnerEntry, "id">) => void;
  applyPartner: (partner: PartnerEntry) => void;
  saveCurrentBuyerToPartners: () => boolean;
  products: CatalogProduct[];
  addProduct: (entry: Omit<CatalogProduct, "id">) => void;
  addProductToShipment: (prod: CatalogProduct) => void;
  approval: StoredApproval;
  effectiveApprovalStatus: ApprovalDecision;
  recordApprovalDecision: (
    nextStatus: "Revisi diminta" | "Tercatat direview",
    comment: string,
  ) => void;
  finance: FinanceRecord;
  paidAmount: number;
  remainingReceivable: number;
  toggleDpConfirmed: () => void;
  toggleSettlementConfirmed: () => void;
  setRealizedRate: (rate: number) => void;
  setArStatus: (status: FinanceRecord["arStatus"]) => void;
  knowledge: KnowledgeSource[];
  publishedKnowledge: KnowledgeSource[];
  addKnowledgeSource: (entry: Omit<KnowledgeSource, "id">) => void;
  toggleKnowledgeStatus: (id: string) => void;
  legalChecklist: LegalChecklist;
  toggleLegalCheck: (key: keyof LegalChecklist) => void;
  riskEvaluation: RiskEvaluation;
  readiness: ReadinessRecord;
  readinessScore: number;
  setReadiness: (patch: Partial<ReadinessRecord>) => void;
};

export function useWorkspaceFlow({
  userId,
  shipment,
  pricing,
  container,
  update,
  updateLineItems,
}: {
  userId?: number | null;
  shipment: Shipment;
  pricing: Pricing;
  container: ContainerCalc;
  update: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void;
  updateLineItems: (items: LineItem[]) => void;
}): WorkspaceFlow {
  useEffect(() => {
    purgeLegacyDummyStorage();
  }, []);

  const keys = useMemo(() => buildUserKeys(userId), [userId]);

  const [partners, setPartners] = useState<PartnerEntry[]>(() => readJson(keys.partners, []));
  const [products, setProducts] = useState<CatalogProduct[]>(() => readJson(keys.products, []));
  const [approvalsMap, setApprovalsMap] = useState<Record<string, StoredApproval>>(() =>
    readJson(keys.approvals, {}),
  );
  const [financeMap, setFinanceMap] = useState<Record<string, FinanceRecord>>(() =>
    readJson(keys.finance, {}),
  );
  const [knowledge, setKnowledge] = useState<KnowledgeSource[]>(() =>
    readJson(keys.knowledge, []),
  );
  const [readinessMap, setReadinessMap] = useState<Record<string, ReadinessRecord>>(() =>
    readJson(keys.readiness, {}),
  );
  const [legalChecklist, setLegalChecklist] = useState<LegalChecklist>(() =>
    readLegalChecklist(keys.legalPrefix, shipment.reference),
  );

  // Muat ulang state saat akun user berganti (isolasi antar-user).
  useEffect(() => {
    setPartners(readJson(keys.partners, []));
    setProducts(readJson(keys.products, []));
    setApprovalsMap(readJson(keys.approvals, {}));
    setFinanceMap(readJson(keys.finance, {}));
    setKnowledge(readJson(keys.knowledge, []));
    setReadinessMap(readJson(keys.readiness, {}));
  }, [keys]);

  useEffect(() => {
    setLegalChecklist(readLegalChecklist(keys.legalPrefix, shipment.reference));
  }, [keys.legalPrefix, shipment.reference]);

  useEffect(() => {
    writeJson(`${keys.legalPrefix}${shipment.reference}`, legalChecklist);
  }, [keys.legalPrefix, legalChecklist, shipment.reference]);

  useEffect(() => writeJson(keys.partners, partners), [keys.partners, partners]);
  useEffect(() => writeJson(keys.products, products), [keys.products, products]);
  useEffect(() => writeJson(keys.approvals, approvalsMap), [keys.approvals, approvalsMap]);
  useEffect(() => writeJson(keys.finance, financeMap), [keys.finance, financeMap]);
  useEffect(() => writeJson(keys.knowledge, knowledge), [keys.knowledge, knowledge]);
  useEffect(() => writeJson(keys.readiness, readinessMap), [keys.readiness, readinessMap]);

  const addPartner = useCallback((entry: Omit<PartnerEntry, "id">) => {
    setPartners((prev) => [{ ...entry, id: `partner-${Date.now()}` }, ...prev]);
  }, []);

  const applyPartner = useCallback(
    (partner: PartnerEntry) => {
      update("buyer", partner.name);
      update("buyerCountry", partner.country);
      update("destination", partner.destination);
      update("paymentTerms", partner.terms);
    },
    [update],
  );

  const saveCurrentBuyerToPartners = useCallback((): boolean => {
    const name = shipment.buyer.trim();
    if (!name) return false;
    const exists = partners.some((p) => p.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      setPartners((prev) =>
        prev.map((p) =>
          p.name.toLowerCase() === name.toLowerCase()
            ? {
                ...p,
                country: shipment.buyerCountry || p.country,
                destination: shipment.destination || p.destination,
                terms: shipment.paymentTerms || p.terms,
              }
            : p,
        ),
      );
      return true;
    }
    setPartners((prev) => [
      {
        id: `partner-${Date.now()}`,
        name,
        country: shipment.buyerCountry || "Belum diisi",
        destination: shipment.destination || shipment.buyerCountry || "Belum diisi",
        terms: shipment.paymentTerms || "30% DP / 70% before shipment",
      },
      ...prev,
    ]);
    return true;
  }, [partners, shipment.buyer, shipment.buyerCountry, shipment.destination, shipment.paymentTerms]);

  const addProduct = useCallback((entry: Omit<CatalogProduct, "id">) => {
    setProducts((prev) => [{ ...entry, id: `prod-${Date.now()}` }, ...prev]);
  }, []);

  const addProductToShipment = useCallback(
    (prod: CatalogProduct) => {
      const base = shipment.lineItems[0] ?? emptyLineItem;
      const nextItem: LineItem = {
        ...emptyLineItem,
        ...base,
        id: `item-${Date.now()}`,
        description: prod.name,
        hsCode: prod.hsCode,
        quantity: 1,
        unit: prod.unit,
        unitPrice: prod.unitPrice,
        packagingType: prod.packagingType,
        weight: prod.weight,
        length: prod.length,
        width: prod.width,
        height: prod.height,
      };
      const isSingleEmptyPlaceholder =
        shipment.lineItems.length === 1 &&
        !shipment.lineItems[0].description.trim() &&
        shipment.lineItems[0].quantity === 0 &&
        shipment.lineItems[0].unitPrice === 0;

      updateLineItems(
        isSingleEmptyPlaceholder ? [nextItem] : [...shipment.lineItems, nextItem],
      );
    },
    [shipment.lineItems, updateLineItems],
  );

  const approval: StoredApproval = approvalsMap[shipment.reference] ?? {
    status: "Menunggu review",
    comment: "",
    reviewedOffer: null,
    reviewedIncoterm: null,
    reviewedMargin: null,
    updatedAt: null,
  };

  const effectiveApprovalStatus: ApprovalDecision = useMemo(() => {
    if (approval.status === "Tercatat direview") {
      const offerChanged =
        approval.reviewedOffer !== null &&
        Math.abs(approval.reviewedOffer - pricing.active.offer) > 0.01;
      const termChanged =
        approval.reviewedIncoterm !== null && approval.reviewedIncoterm !== shipment.incoterm;
      const marginChanged =
        approval.reviewedMargin !== null && approval.reviewedMargin !== shipment.margin;
      if (offerChanged || termChanged || marginChanged) {
        return "Perlu review ulang";
      }
    }
    return approval.status;
  }, [
    approval.reviewedIncoterm,
    approval.reviewedMargin,
    approval.reviewedOffer,
    approval.status,
    pricing.active.offer,
    shipment.incoterm,
    shipment.margin,
  ]);

  const recordApprovalDecision = useCallback(
    (nextStatus: "Revisi diminta" | "Tercatat direview", comment: string) => {
      setApprovalsMap((prev) => ({
        ...prev,
        [shipment.reference]: {
          status: nextStatus,
          comment,
          reviewedOffer: nextStatus === "Tercatat direview" ? pricing.active.offer : null,
          reviewedIncoterm: nextStatus === "Tercatat direview" ? shipment.incoterm : null,
          reviewedMargin: nextStatus === "Tercatat direview" ? shipment.margin : null,
          updatedAt: new Date().toISOString(),
        },
      }));
    },
    [pricing.active.offer, shipment.incoterm, shipment.margin, shipment.reference],
  );

  const finance: FinanceRecord = financeMap[shipment.reference] ?? {
    dpConfirmed: false,
    settlementConfirmed: false,
    realizedRate: shipment.exchangeRate || 16000,
    arStatus: "Menunggu posting",
    updatedAt: null,
  };

  const paidAmount = useMemo(() => {
    const dpPart = finance.dpConfirmed ? pricing.active.offer * 0.3 : 0;
    const balPart = finance.settlementConfirmed ? pricing.active.offer * 0.7 : 0;
    return dpPart + balPart;
  }, [finance.dpConfirmed, finance.settlementConfirmed, pricing.active.offer]);

  const remainingReceivable = Math.max(0, pricing.active.offer - paidAmount);

  const patchFinance = useCallback(
    (updater: (current: FinanceRecord) => FinanceRecord) => {
      setFinanceMap((prev) => {
        const current = prev[shipment.reference] ?? {
          dpConfirmed: false,
          settlementConfirmed: false,
          realizedRate: shipment.exchangeRate || 16000,
          arStatus: "Menunggu posting",
          updatedAt: null,
        };
        return {
          ...prev,
          [shipment.reference]: {
            ...updater(current),
            updatedAt: new Date().toISOString(),
          },
        };
      });
    },
    [shipment.exchangeRate, shipment.reference],
  );

  const toggleDpConfirmed = useCallback(() => {
    patchFinance((cur) => ({ ...cur, dpConfirmed: !cur.dpConfirmed }));
  }, [patchFinance]);

  const toggleSettlementConfirmed = useCallback(() => {
    patchFinance((cur) => ({ ...cur, settlementConfirmed: !cur.settlementConfirmed }));
  }, [patchFinance]);

  const setRealizedRate = useCallback(
    (rate: number) => {
      patchFinance((cur) => ({ ...cur, realizedRate: Math.max(0, rate) }));
    },
    [patchFinance],
  );

  const setArStatus = useCallback(
    (arStatus: FinanceRecord["arStatus"]) => {
      patchFinance((cur) => ({ ...cur, arStatus }));
    },
    [patchFinance],
  );

  const publishedKnowledge = useMemo(
    () => knowledge.filter((item) => item.status === "Published"),
    [knowledge],
  );

  const addKnowledgeSource = useCallback((entry: Omit<KnowledgeSource, "id">) => {
    setKnowledge((prev) => [{ ...entry, id: `sop-${Date.now()}` }, ...prev]);
  }, []);

  const toggleKnowledgeStatus = useCallback((id: string) => {
    setKnowledge((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: item.status === "Published" ? "In review" : "Published" }
          : item,
      ),
    );
  }, []);

  const toggleLegalCheck = useCallback((key: keyof LegalChecklist) => {
    setLegalChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const riskEvaluation = useMemo(
    () => evaluateRiskChecks(shipment, pricing, container, legalChecklist),
    [container, legalChecklist, pricing, shipment],
  );

  const readiness: ReadinessRecord = readinessMap[shipment.reference] ?? {
    experience: "",
    certReady: false,
  };

  const setReadiness = useCallback(
    (patch: Partial<ReadinessRecord>) => {
      setReadinessMap((prev) => ({
        ...prev,
        [shipment.reference]: {
          ...(prev[shipment.reference] ?? { experience: "", certReady: false }),
          ...patch,
        },
      }));
    },
    [shipment.reference],
  );

  const readinessScore =
    (shipment.product.trim() ? 25 : 0) +
    (shipment.hsCode.trim() ? 20 : 0) +
    (shipment.buyerCountry.trim() ? 20 : 0) +
    (shipment.packaging > 0 ? 15 : 0) +
    (readiness.certReady ? 20 : 0);

  return {
    partners,
    addPartner,
    applyPartner,
    saveCurrentBuyerToPartners,
    products,
    addProduct,
    addProductToShipment,
    approval,
    effectiveApprovalStatus,
    recordApprovalDecision,
    finance,
    paidAmount,
    remainingReceivable,
    toggleDpConfirmed,
    toggleSettlementConfirmed,
    setRealizedRate,
    setArStatus,
    knowledge,
    publishedKnowledge,
    addKnowledgeSource,
    toggleKnowledgeStatus,
    legalChecklist,
    toggleLegalCheck,
    riskEvaluation,
    readiness,
    readinessScore,
    setReadiness,
  };
}
