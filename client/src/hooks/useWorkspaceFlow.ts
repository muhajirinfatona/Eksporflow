import type { Pricing } from "@shared/pricing";
import {
  defaultLegalChecklist,
  evaluateRiskChecks,
  type LegalChecklist,
  type RiskEvaluation,
  type ScreenId,
} from "@shared/risk";
import type { ContainerCalc, LineItem, Shipment } from "@shared/shipment";
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

export type PipelineStage = {
  id: string;
  label: string;
  shortMeta: string;
  screen: ScreenId;
  relatedScreens: ScreenId[];
  done: boolean;
};

const STORAGE_KEYS = {
  partners: "eksporflow-partners-v1",
  products: "eksporflow-products-v1",
  approvals: "eksporflow-approvals-v1",
  finance: "eksporflow-finance-v1",
  knowledge: "eksporflow-knowledge-v1",
  readiness: "eksporflow-readiness-v1",
};

const DEFAULT_PARTNERS: PartnerEntry[] = [
  {
    id: "partner-1",
    name: "Nordic Pantry AB",
    country: "Swedia",
    destination: "Gothenburg, Swedia",
    terms: "30% DP / 70% before shipment",
  },
  {
    id: "partner-2",
    name: "Global Foods Sdn Bhd",
    country: "Malaysia",
    destination: "Port Klang, Malaysia",
    terms: "T/T 30% advance / 70% copy B/L",
  },
  {
    id: "partner-3",
    name: "Baltic Organics OÜ",
    country: "Estonia",
    destination: "Tallinn, Estonia",
    terms: "50% DP / 50% before shipment",
  },
  {
    id: "partner-4",
    name: "Kyoto Trading Co.",
    country: "Jepang",
    destination: "Osaka, Jepang",
    terms: "Irrevocable L/C at sight",
  },
];

const DEFAULT_PRODUCTS: CatalogProduct[] = [
  {
    id: "prod-1",
    name: "Organic Coconut Sugar",
    sku: "CS-01",
    hsCode: "1702.90",
    unit: "carton",
    unitPrice: 18.5,
    packagingType: "Karton box",
    weight: 12,
    length: 40,
    width: 30,
    height: 25,
  },
  {
    id: "prod-2",
    name: "Java Robusta Green Bean",
    sku: "RC-03",
    hsCode: "0901.11",
    unit: "bag",
    unitPrice: 145,
    packagingType: "Karung goni",
    weight: 60,
    length: 75,
    width: 50,
    height: 28,
  },
  {
    id: "prod-3",
    name: "Cassia Cinnamon Powder",
    sku: "CP-02",
    hsCode: "0906.20",
    unit: "carton",
    unitPrice: 32,
    packagingType: "Karton box",
    weight: 10,
    length: 38,
    width: 28,
    height: 24,
  },
];

const DEFAULT_KNOWLEDGE: KnowledgeSource[] = [
  {
    id: "sop-1",
    title: "SOP Dokumen Ekspor & Pemeriksaan 3-Way",
    scope: "Organisasi · Global",
    version: "v2.1 · Berlaku s/d Jan 2027",
    governance: "Rina → Dimas (Compliance)",
    status: "Published",
  },
  {
    id: "sop-2",
    title: "Checklist Freight Booking & Cut-Off Pelabuhan",
    scope: "Organisasi · Operasional",
    version: "v1.4 · Review Des 2026",
    governance: "Bayu → Sari",
    status: "In review",
  },
  {
    id: "sop-3",
    title: "Panduan Label Pangan Pasar Eropa / Nordik",
    scope: "Uni Eropa · Food Grade",
    version: "v3.0 · Berlaku s/d Jun 2027",
    governance: "Admin → Dimas",
    status: "Published",
  },
];

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

function readLegalChecklist(reference: string): LegalChecklist {
  try {
    const raw = localStorage.getItem(`eksporflow-legal-${reference}`);
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
  pipeline: PipelineStage[];
};

export function useWorkspaceFlow({
  shipment,
  pricing,
  container,
  update,
  updateLineItems,
}: {
  shipment: Shipment;
  pricing: Pricing;
  container: ContainerCalc;
  update: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void;
  updateLineItems: (items: LineItem[]) => void;
}): WorkspaceFlow {
  const [partners, setPartners] = useState<PartnerEntry[]>(() =>
    readJson(STORAGE_KEYS.partners, DEFAULT_PARTNERS),
  );
  const [products, setProducts] = useState<CatalogProduct[]>(() =>
    readJson(STORAGE_KEYS.products, DEFAULT_PRODUCTS),
  );
  const [approvalsMap, setApprovalsMap] = useState<Record<string, StoredApproval>>(() =>
    readJson(STORAGE_KEYS.approvals, {}),
  );
  const [financeMap, setFinanceMap] = useState<Record<string, FinanceRecord>>(() =>
    readJson(STORAGE_KEYS.finance, {}),
  );
  const [knowledge, setKnowledge] = useState<KnowledgeSource[]>(() =>
    readJson(STORAGE_KEYS.knowledge, DEFAULT_KNOWLEDGE),
  );
  const [readinessMap, setReadinessMap] = useState<Record<string, ReadinessRecord>>(() =>
    readJson(STORAGE_KEYS.readiness, {}),
  );
  const [legalChecklist, setLegalChecklist] = useState<LegalChecklist>(() =>
    readLegalChecklist(shipment.reference),
  );

  useEffect(() => {
    setLegalChecklist(readLegalChecklist(shipment.reference));
  }, [shipment.reference]);

  useEffect(() => {
    writeJson(`eksporflow-legal-${shipment.reference}`, legalChecklist);
  }, [legalChecklist, shipment.reference]);

  useEffect(() => writeJson(STORAGE_KEYS.partners, partners), [partners]);
  useEffect(() => writeJson(STORAGE_KEYS.products, products), [products]);
  useEffect(() => writeJson(STORAGE_KEYS.approvals, approvalsMap), [approvalsMap]);
  useEffect(() => writeJson(STORAGE_KEYS.finance, financeMap), [financeMap]);
  useEffect(() => writeJson(STORAGE_KEYS.knowledge, knowledge), [knowledge]);
  useEffect(() => writeJson(STORAGE_KEYS.readiness, readinessMap), [readinessMap]);

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
      const base = shipment.lineItems[0];
      const nextItem: LineItem = {
        ...base,
        id: `item-${Date.now()}`,
        description: prod.name,
        hsCode: prod.hsCode,
        quantity: 100,
        unit: prod.unit,
        unitPrice: prod.unitPrice,
        packagingType: prod.packagingType,
        weight: prod.weight,
        length: prod.length,
        width: prod.width,
        height: prod.height,
      };
      updateLineItems([...shipment.lineItems, nextItem]);
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
    realizedRate: shipment.exchangeRate,
    arStatus: "Menunggu posting",
    updatedAt: null,
  };

  const paidAmount = useMemo(() => {
    const dp = finance.dpConfirmed ? pricing.active.offer * 0.3 : 0;
    const settlement = finance.settlementConfirmed ? pricing.active.offer * 0.7 : 0;
    return dp + settlement;
  }, [finance.dpConfirmed, finance.settlementConfirmed, pricing.active.offer]);

  const remainingReceivable = Math.max(0, pricing.active.offer - paidAmount);

  const patchFinance = useCallback(
    (patch: Partial<FinanceRecord>) => {
      setFinanceMap((prev) => {
        const current = prev[shipment.reference] ?? {
          dpConfirmed: false,
          settlementConfirmed: false,
          realizedRate: shipment.exchangeRate,
          arStatus: "Menunggu posting" as const,
          updatedAt: null,
        };
        return {
          ...prev,
          [shipment.reference]: {
            ...current,
            ...patch,
            updatedAt: new Date().toISOString(),
          },
        };
      });
    },
    [shipment.exchangeRate, shipment.reference],
  );

  const toggleDpConfirmed = useCallback(
    () => patchFinance({ dpConfirmed: !finance.dpConfirmed }),
    [finance.dpConfirmed, patchFinance],
  );
  const toggleSettlementConfirmed = useCallback(
    () => patchFinance({ settlementConfirmed: !finance.settlementConfirmed }),
    [finance.settlementConfirmed, patchFinance],
  );
  const setRealizedRate = useCallback(
    (rate: number) => patchFinance({ realizedRate: Math.max(0, rate) }),
    [patchFinance],
  );
  const setArStatus = useCallback(
    (arStatus: FinanceRecord["arStatus"]) => patchFinance({ arStatus }),
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
    experience: "Pernah 1–3 kali",
    certReady: false,
  };

  const setReadiness = useCallback(
    (patch: Partial<ReadinessRecord>) => {
      setReadinessMap((prev) => ({
        ...prev,
        [shipment.reference]: {
          ...(prev[shipment.reference] ?? { experience: "Pernah 1–3 kali", certReady: false }),
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

  const pipeline = useMemo<PipelineStage[]>(
    () => [
      {
        id: "stage-data",
        label: "1. Mitra & Produk",
        shortMeta: `${shipment.buyer || "Pilih buyer"} · ${shipment.lineItems.length} item`,
        screen: "partners",
        relatedScreens: ["readiness", "partners", "products", "transactions"],
        done: Boolean(shipment.buyer.trim() && shipment.product.trim()),
      },
      {
        id: "stage-pricing",
        label: "2. Harga & Persetujuan",
        shortMeta: `${shipment.incoterm} · ${effectiveApprovalStatus}`,
        screen: "pricing",
        relatedScreens: ["pricing", "approvals"],
        done: pricing.validationErrors.length === 0 && effectiveApprovalStatus === "Tercatat direview",
      },
      {
        id: "stage-docs",
        label: "3. Dokumen & Muatan",
        shortMeta: `${shipment.documentReviewed ? "Direview" : "Draft R" + shipment.documentRevision} · ${container.containers}×${shipment.containerType}`,
        screen: "documents",
        relatedScreens: ["documents", "cargo"],
        done:
          shipment.documentReviewed &&
          container.volumeUtilization <= 100 &&
          container.weightUtilization <= 100,
      },
      {
        id: "stage-ops",
        label: "4. Pengiriman & Risiko",
        shortMeta: `${shipment.shipmentStatus} · ${riskEvaluation.readinessPercent}% cek`,
        screen: "shipment",
        relatedScreens: ["shipment", "risk", "advisor", "knowledge"],
        done: riskEvaluation.readinessPercent >= 80,
      },
      {
        id: "stage-finance",
        label: "5. Keuangan & Laporan",
        shortMeta:
          finance.arStatus === "Posted"
            ? "AR Posted"
            : paidAmount > 0
              ? "DP tercatat"
              : "Pratinjau AR",
        screen: "finance",
        relatedScreens: ["finance", "bank", "journals", "reports"],
        done: finance.arStatus === "Posted" && paidAmount > 0,
      },
    ],
    [
      container.containers,
      container.volumeUtilization,
      container.weightUtilization,
      effectiveApprovalStatus,
      finance.arStatus,
      paidAmount,
      pricing.validationErrors.length,
      riskEvaluation.readinessPercent,
      shipment.buyer,
      shipment.containerType,
      shipment.documentReviewed,
      shipment.documentRevision,
      shipment.incoterm,
      shipment.lineItems.length,
      shipment.product,
      shipment.shipmentStatus,
    ],
  );

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
    pipeline,
  };
}
