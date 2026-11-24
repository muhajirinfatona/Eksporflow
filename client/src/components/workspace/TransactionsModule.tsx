import type { PersistenceSaveState } from "@/hooks/useActiveShipment";
import type { WorkspaceFlow } from "@/hooks/useWorkspaceFlow";
import { formatMoney } from "@shared/format";
import type { PoScreeningResult } from "@shared/poScreening";
import type { Pricing } from "@shared/pricing";
import type { ScreenId } from "@shared/risk";
import type { ContainerCalc, Incoterm, Shipment, ShipmentStatus } from "@shared/shipment";
import {
  Activity,
  ArrowLeft,
  Calculator,
  Check,
  CheckCircle2,
  ChevronRight,
  Cloud,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Layers,
  MessageSquare,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { PoIngestionModal } from "./PoIngestionModal";
import { Field, SelectField, StatusPill } from "./Primitives";
import { toast } from "sonner";
import { getAiRecommendedRegulations } from "@shared/costFactors";

export type ExporterStage = {
  id: string;
  number: number;
  title: string;
  meta: string;
  isDone: boolean;
  targetScreen: ScreenId;
};

export type ExporterWorkflow = {
  incoterm: string;
  coordinationTip: string;
  stages: ExporterStage[];
};

function getExporterWorkflow(
  shipment: Shipment,
  pricing: Pricing,
  container?: ContainerCalc,
  flow?: WorkspaceFlow,
): ExporterWorkflow {
  const incoterm = shipment.incoterm || "FOB";
  const currency = shipment.currency || "IDR";

  const isProfileDone = Boolean(
    shipment.buyer.trim() &&
    shipment.destination.trim() &&
    shipment.hsCode.trim()
  );

  const isDpDone = Boolean(
    (flow?.paidAmount && flow.paidAmount > 0) || flow?.finance?.dpConfirmed
  );

  const isMutuDone = Boolean(
    flow?.readiness?.certReady || flow?.legalChecklist?.originEvidence
  );

  const isCargoDone = Boolean(
    container &&
    (container.volumeUtilization > 0 || container.weightUtilization > 0) &&
    container.volumeUtilization <= 100 &&
    container.weightUtilization <= 100
  );

  const isCustomsDone = Boolean(
    flow?.legalChecklist?.sanctionsScreened && flow?.legalChecklist?.hsCodeReviewed
  );

  const isPricingFreightDone = pricing.active.offer > 0 && pricing.validationErrors.length === 0;

  const isDocsDone = Boolean(shipment.documentReviewed);

  const isLastMileDone = shipment.destinationHandling > 0 || shipment.lastMile > 0;
  const isDdpDone = shipment.destinationHandling > 0 && shipment.importDuty > 0 && shipment.lastMile > 0;

  const isSettlementDone = Boolean(
    flow?.finance?.settlementConfirmed && (flow?.remainingReceivable ?? 0) <= 0
  );

  // Detail teks meta ringkas (1 baris padat & informatif)
  const metaProfile = isProfileDone
    ? `${shipment.buyer} (${shipment.buyerCountry || "Internasional"}) · HS ${shipment.hsCode}`
    : "Data buyer, tujuan, atau HS Code belum lengkap";

  const metaDp = isDpDone
    ? `Tercatat masuk ${formatMoney(flow?.paidAmount ?? 0, currency)} · ${flow?.finance?.dpConfirmed ? "DP Terkonfirmasi" : "Sebagian"}`
    : `Menunggu pembayaran DP · Syarat: ${shipment.paymentTerms || "T/T DP"}`;

  const metaMutu = isMutuDone
    ? "Standar mutu (COA) & kemasan ekspor terverifikasi"
    : "Siapkan COA, sertifikat fumigasi/ISPM-15 & karantina";

  const metaCargo = isCargoDone
    ? `${container?.containers ?? 1} × ${shipment.containerType} · Berat ${container ? container.weightUtilization.toFixed(0) : 0}% · Aman`
    : "Simulasi muatan kontainer 3D belum dioptimalkan";

  const metaCustoms = isCustomsDone
    ? "Review regulasi selesai · Siap PEB di CEISA Bea Cukai"
    : "Lakukan review regulasi ekspor sebelum pengajuan PEB";

  const metaDocs = isDocsDone
    ? `Dokumen terverifikasi (Rev R${shipment.documentRevision}) · Siap kirim`
    : "Review Invoice, Packing List, draft B/L & e-SKA Kemendag";

  const metaSettlement = isSettlementDone
    ? "Pelunasan 100% diterima · Siap pelaporan Devisa (DHE BI)"
    : `Sisa tagihan: ${formatMoney(flow?.remainingReceivable ?? pricing.active.offer, currency)}`;

  let coordinationTip = "";
  let rawStages: { title: string; meta: string; isDone: boolean; targetScreen: ScreenId }[] = [];

  switch (incoterm) {
    case "EXW":
      coordinationTip = "Armada penjemputan diatur oleh buyer. Koordinasikan tanggal & jam kesiapan barang di gudang.";
      rawStages = [
        { title: "Kontrak Penjualan & Buyer", meta: metaProfile, isDone: isProfileDone, targetScreen: "partners" },
        { title: "Pembayaran Uang Muka (DP)", meta: metaDp, isDone: isDpDone, targetScreen: "finance" },
        { title: "Kesiapan Barang di Gudang", meta: metaMutu, isDone: isMutuDone, targetScreen: "risk" },
        { title: "Dokumen Penyerahan & Invoice", meta: metaDocs, isDone: isDocsDone, targetScreen: "documents" },
        { title: "Pelunasan Pembayaran Akhir", meta: metaSettlement, isDone: isSettlementDone, targetScreen: "finance" },
      ];
      break;

    case "FCA":
      coordinationTip = "Koordinasikan titik serah dan jadwal armada pengangkut yang ditunjuk buyer.";
      rawStages = [
        { title: "Kontrak Penjualan & Buyer", meta: metaProfile, isDone: isProfileDone, targetScreen: "partners" },
        { title: "Pembayaran Uang Muka (DP)", meta: metaDp, isDone: isDpDone, targetScreen: "finance" },
        { title: "Kesiapan Mutu & Kemasan", meta: metaMutu, isDone: isMutuDone, targetScreen: "risk" },
        { title: "Kepabeanan Ekspor (PEB) & Serah Carrier", meta: metaCustoms, isDone: isCustomsDone, targetScreen: "risk" },
        { title: "Dokumen Ekspor & e-SKA", meta: metaDocs, isDone: isDocsDone, targetScreen: "documents" },
        { title: "Pelunasan Pembayaran Akhir", meta: metaSettlement, isDone: isSettlementDone, targetScreen: "finance" },
      ];
      break;

    case "FOB":
      coordinationTip = "Kapal laut dibooking pihak buyer. Pastikan koordinasi jadwal kapal (closing time & ETD) berjalan lancar dengan buyer.";
      rawStages = [
        { title: "Kontrak Penjualan & Buyer", meta: metaProfile, isDone: isProfileDone, targetScreen: "partners" },
        { title: "Pembayaran Uang Muka (DP)", meta: metaDp, isDone: isDpDone, targetScreen: "finance" },
        { title: "Kesiapan Mutu & Sertifikasi", meta: metaMutu, isDone: isMutuDone, targetScreen: "risk" },
        { title: "Muatan Kontainer & Truk ke Pelabuhan", meta: metaCargo, isDone: isCargoDone, targetScreen: "cargo" },
        { title: "Kepabeanan (PEB) & Muat ke Kapal", meta: metaCustoms, isDone: isCustomsDone, targetScreen: "risk" },
        { title: "Dokumen Ekspor & e-SKA", meta: metaDocs, isDone: isDocsDone, targetScreen: "documents" },
        { title: "Pelunasan Pembayaran Akhir", meta: metaSettlement, isDone: isSettlementDone, targetScreen: "finance" },
      ];
      break;

    case "CFR":
      coordinationTip = "Asuransi kargo laut ditutup oleh buyer. Informasikan konfirmasi jadwal pengapalan kapal (ETA) ke buyer.";
      rawStages = [
        { title: "Kontrak Penjualan & Buyer", meta: metaProfile, isDone: isProfileDone, targetScreen: "partners" },
        { title: "Pembayaran Uang Muka (DP)", meta: metaDp, isDone: isDpDone, targetScreen: "finance" },
        { title: "Kesiapan Mutu & Sertifikasi", meta: metaMutu, isDone: isMutuDone, targetScreen: "risk" },
        { title: "Muatan Kontainer & Truk ke Pelabuhan", meta: metaCargo, isDone: isCargoDone, targetScreen: "cargo" },
        { title: "Kepabeanan (PEB) & Muat ke Kapal", meta: metaCustoms, isDone: isCustomsDone, targetScreen: "risk" },
        { title: "Booking Kapal Laut (Ocean Freight)", meta: isPricingFreightDone ? `Biaya kapal terkalkulasi (${formatMoney(pricing.active.offer, currency)})` : "Hitung & pesan freight kapal laut", isDone: isPricingFreightDone, targetScreen: "pricing" },
        { title: "Dokumen Ekspor & e-SKA", meta: metaDocs, isDone: isDocsDone, targetScreen: "documents" },
        { title: "Pelunasan Pembayaran Akhir", meta: metaSettlement, isDone: isSettlementDone, targetScreen: "finance" },
      ];
      break;

    case "CIF":
      coordinationTip = "Polis asuransi kargo laut dan B/L resmi diserahkan ke buyer / bank untuk kliring barang di pelabuhan tujuan.";
      rawStages = [
        { title: "Kontrak Penjualan & Buyer", meta: metaProfile, isDone: isProfileDone, targetScreen: "partners" },
        { title: "Pembayaran Uang Muka (DP)", meta: metaDp, isDone: isDpDone, targetScreen: "finance" },
        { title: "Kesiapan Mutu & Sertifikasi", meta: metaMutu, isDone: isMutuDone, targetScreen: "risk" },
        { title: "Muatan Kontainer & Truk ke Pelabuhan", meta: metaCargo, isDone: isCargoDone, targetScreen: "cargo" },
        { title: "Kepabeanan (PEB) & Muat ke Kapal", meta: metaCustoms, isDone: isCustomsDone, targetScreen: "risk" },
        { title: "Pengapalan Laut & Asuransi Kargo", meta: isPricingFreightDone ? `Freight & asuransi siap (${formatMoney(pricing.active.offer, currency)})` : "Hitung freight kapal & polis asuransi kargo", isDone: isPricingFreightDone, targetScreen: "pricing" },
        { title: "Dokumen Ekspor & e-SKA", meta: metaDocs, isDone: isDocsDone, targetScreen: "documents" },
        { title: "Pelunasan Pembayaran Akhir", meta: metaSettlement, isDone: isSettlementDone, targetScreen: "finance" },
      ];
      break;

    case "DAP":
      coordinationTip = "Pajak & bea masuk impor dibayar oleh buyer. Koordinasikan alamat gudang dan kontak penerima lokal.";
      rawStages = [
        { title: "Kontrak Penjualan & Buyer", meta: metaProfile, isDone: isProfileDone, targetScreen: "partners" },
        { title: "Pembayaran Uang Muka (DP)", meta: metaDp, isDone: isDpDone, targetScreen: "finance" },
        { title: "Kesiapan Mutu & Sertifikasi", meta: metaMutu, isDone: isMutuDone, targetScreen: "risk" },
        { title: "Muatan Kontainer & Truk ke Pelabuhan", meta: metaCargo, isDone: isCargoDone, targetScreen: "cargo" },
        { title: "Kepabeanan (PEB) & Muat ke Kapal", meta: metaCustoms, isDone: isCustomsDone, targetScreen: "risk" },
        { title: "Pengapalan Laut & Asuransi", meta: isPricingFreightDone ? "Freight & asuransi terkalkulasi" : "Hitung freight & asuransi", isDone: isPricingFreightDone, targetScreen: "pricing" },
        { title: "Pengantaran ke Alamat Buyer", meta: isLastMileDone ? "Truk alamat tujuan siap" : "Hitung biaya handling & pengantaran lokal", isDone: isLastMileDone, targetScreen: "pricing" },
        { title: "Dokumen Ekspor & e-SKA", meta: metaDocs, isDone: isDocsDone, targetScreen: "documents" },
        { title: "Pelunasan Pembayaran Akhir", meta: metaSettlement, isDone: isSettlementDone, targetScreen: "finance" },
      ];
      break;

    case "DDP":
      coordinationTip = "Eksportir menanggung penuh dari kepabeanan impor, bea masuk & pajak, hingga pengantaran ke pintu buyer.";
      rawStages = [
        { title: "Kontrak Penjualan & Buyer", meta: metaProfile, isDone: isProfileDone, targetScreen: "partners" },
        { title: "Pembayaran Uang Muka (DP)", meta: metaDp, isDone: isDpDone, targetScreen: "finance" },
        { title: "Kesiapan Mutu & Sertifikasi", meta: metaMutu, isDone: isMutuDone, targetScreen: "risk" },
        { title: "Muatan Kontainer & Truk ke Pelabuhan", meta: metaCargo, isDone: isCargoDone, targetScreen: "cargo" },
        { title: "Kepabeanan (PEB) & Muat ke Kapal", meta: metaCustoms, isDone: isCustomsDone, targetScreen: "risk" },
        { title: "Pengapalan Laut & Asuransi", meta: isPricingFreightDone ? "Freight & asuransi siap" : "Hitung freight & asuransi", isDone: isPricingFreightDone, targetScreen: "pricing" },
        { title: "Kepabeanan Impor & Antar Gudang", meta: isDdpDone ? "Bea masuk & last-mile terkalkulasi" : "Hitung bea masuk, pajak & truk tujuan", isDone: isDdpDone, targetScreen: "pricing" },
        { title: "Dokumen Ekspor & e-SKA", meta: metaDocs, isDone: isDocsDone, targetScreen: "documents" },
        { title: "Pelunasan Pembayaran Akhir", meta: metaSettlement, isDone: isSettlementDone, targetScreen: "finance" },
      ];
      break;

    default:
      coordinationTip = "Pastikan komunikasi dan koordinasi jadwal pengiriman selalu terhubung dengan pihak buyer.";
      rawStages = [
        { title: "Kontrak Penjualan & Buyer", meta: metaProfile, isDone: isProfileDone, targetScreen: "partners" },
        { title: "Pembayaran Uang Muka (DP)", meta: metaDp, isDone: isDpDone, targetScreen: "finance" },
        { title: "Kesiapan Mutu & Kemasan", meta: metaMutu, isDone: isMutuDone, targetScreen: "risk" },
        { title: "Dokumen Ekspor & Invoice", meta: metaDocs, isDone: isDocsDone, targetScreen: "documents" },
        { title: "Pelunasan Pembayaran Akhir", meta: metaSettlement, isDone: isSettlementDone, targetScreen: "finance" },
      ];
  }

  const stages = rawStages.map((s, index) => ({
    id: `stage-${index + 1}`,
    number: index + 1,
    title: `${index + 1}. ${s.title}`,
    meta: s.meta,
    isDone: s.isDone,
    targetScreen: s.targetScreen,
  }));

  return {
    incoterm,
    coordinationTip,
    stages,
  };
}

export type ShipmentListItem = {
  id: string;
  reference: string;
  status: string;
  version: number;
  buyer?: string;
  buyerCountry?: string;
  product?: string;
  incoterm?: string;
  quantity?: number;
  unit?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type LocalShipmentRecord = {
  id: string;
  reference: string;
  buyer: string;
  buyerCountry: string;
  product: string;
  incoterm: string;
  quantity: number;
  unit: string;
  status: string;
  updatedAt: string;
  shipment: Shipment;
};

export type UnifiedTransactionItem = {
  id: string;
  reference: string;
  buyer: string;
  buyerCountry: string;
  product: string;
  incoterm: string;
  quantity: number;
  unit: string;
  status: string;
  version?: number;
  updatedAt: string | Date;
  isCloud: boolean;
  shipment?: Shipment;
};

function formatShortDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Baru saja";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function statusTone(status: string): "green" | "amber" | "blue" | "gray" {
  if (status === "Completed") return "green";
  if (status === "Draft" || status === "Quotation") return "amber";
  if (status === "Booked" || status === "In Transit" || status === "Confirmed") return "blue";
  return "gray";
}

export function TransactionsModule({
  user,
  shipment,
  update,
  activeShipmentId,
  version: _version,
  saveState,
  shipmentsList,
  isLoadingList,
  pricing,
  container,
  flow,
  loadShipment,
  loadCustomShipment,
  saveShipment,
  deleteShipment,
  createNewDraft,
  login,
  navigate,
  mode = "active_management",
}: {
  user: { name?: string | null; email?: string | null } | null;
  shipment: Shipment;
  update: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void;
  activeShipmentId: string | null;
  version: number;
  saveState: PersistenceSaveState;
  shipmentsList: ShipmentListItem[];
  isLoadingList: boolean;
  pricing: Pricing;
  container?: ContainerCalc;
  flow?: WorkspaceFlow;
  loadShipment: (id: string) => Promise<void>;
  loadCustomShipment?: (shipment: Shipment, id?: string | null) => void;
  saveShipment: () => Promise<void>;
  deleteShipment?: (id: string) => Promise<boolean>;
  createNewDraft: (customRef?: string) => void;
  login: () => Promise<void>;
  navigate: (screen: ScreenId) => void;
  mode?: "active_management" | "new_po_intake";
}) {
  const isIntakeMode = mode === "new_po_intake";
  const [activeTab, setActiveTab] = useState<"list" | "workflow">("list");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [poModalOpen, setPoModalOpen] = useState(false);
  const [isEditingActiveOrder, setIsEditingActiveOrder] = useState(false);

  // Clean value for reference: don't show dummy codes or placeholder words
  const isDefaultOrPlaceholderRef =
    !shipment.reference ||
    shipment.reference === "Transaksi Ekspor" ||
    shipment.reference === "EXP-2026-001" ||
    shipment.reference === "EXP-2026-084" ||
    shipment.reference.startsWith("EXP-2026-");

  const displayReference = isDefaultOrPlaceholderRef ? "" : shipment.reference;

  const [lastScreening, setLastScreening] = useState<PoScreeningResult | null>(() => {
    try {
      const saved = localStorage.getItem("eksporflow_last_po_screening");
      if (!saved) return null;
      const parsed = JSON.parse(saved) as PoScreeningResult;
      // Jangan pernah memuat screening jika form PO saat ini masih kosong
      const currentRef = (shipment.reference || shipment.poNumber || "").trim();
      const currentBuyer = (shipment.buyer || "").trim();
      if (!currentRef && !currentBuyer) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  });

  // Screening AI hanya aktif jika form TIDAK KOSONG dan data transaksi saat ini cocok dengan dokumen yang discan
  const activeScreening = useMemo(() => {
    if (!lastScreening) return null;
    const currentRef = (displayReference || shipment.poNumber || "").trim().toLowerCase();
    const currentBuyer = (shipment.buyer || "").trim().toLowerCase();

    // Jika form masih kosong, JANGAN tampilkan saran/screening AI sama sekali
    if (!currentRef && !currentBuyer) return null;

    const screeningRef = (lastScreening.reference || "").trim().toLowerCase();
    const screeningBuyer = (lastScreening.buyer || "").trim().toLowerCase();

    // Hanya tampil jika nomor PO atau nama buyer cocok
    const refMatch = Boolean(currentRef && screeningRef && (currentRef === screeningRef || currentRef.includes(screeningRef) || screeningRef.includes(currentRef)));
    const buyerMatch = Boolean(currentBuyer && screeningBuyer && (currentBuyer.includes(screeningBuyer) || screeningBuyer.includes(currentBuyer)));

    if (refMatch || buyerMatch) {
      return lastScreening;
    }
    return null;
  }, [lastScreening, displayReference, shipment.poNumber, shipment.buyer]);

  const [localList, setLocalList] = useState<LocalShipmentRecord[]>(() => {
    try {
      const saved = localStorage.getItem("eksporflow_local_shipments_v1");
      return saved ? (JSON.parse(saved) as LocalShipmentRecord[]) : [];
    } catch {
      return [];
    }
  });

  // Alur Ekspor Fleksibel Khusus Kewajiban Eksportir Berdasarkan Incoterm yang Disepakati
  const workflow = useMemo(() => {
    return getExporterWorkflow(shipment, pricing, container, flow);
  }, [shipment, pricing, container, flow]);

  const totalCount = workflow.stages.length;
  const completedCount = workflow.stages.filter((s) => s.isDone).length;
  const percentCompleted = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // AI Advisor mendeteksi regulasi & dokumen kepatuhan ekspor sesuai negara buyer
  const aiRegulations = useMemo(() => {
    return getAiRecommendedRegulations(shipment.buyerCountry, shipment.product);
  }, [shipment.buyerCountry, shipment.product]);

  const saveToLocalList = (targetShipment: Shipment, statusOverride?: string) => {
    const ref = targetShipment.reference?.trim() || targetShipment.poNumber?.trim() || "";
    const buyer = targetShipment.buyer?.trim() || "";
    if (!ref && !buyer) return;

    const id = ref ? `local-${ref.replace(/[^a-zA-Z0-9_-]/g, "_")}` : `local-${Date.now()}`;
    const status = statusOverride || targetShipment.shipmentStatus || "Draft";
    setLocalList((prev) => {
      const existingIdx = prev.findIndex(
        (p) => p.id === id || (ref && p.reference.toLowerCase() === ref.toLowerCase())
      );
      const record: LocalShipmentRecord = {
        id,
        reference: ref || "Draft PO",
        buyer: buyer || "Buyer Luar Negeri",
        buyerCountry: targetShipment.buyerCountry || "-",
        product: targetShipment.product || "Komoditas Ekspor",
        incoterm: targetShipment.incoterm || "FOB",
        quantity: targetShipment.quantity || 20,
        unit: targetShipment.unit || "MT",
        status,
        updatedAt: new Date().toISOString(),
        shipment: targetShipment,
      };

      const updated = existingIdx >= 0
        ? prev.map((item, i) => (i === existingIdx ? record : item))
        : [record, ...prev];

      try {
        localStorage.setItem("eksporflow_local_shipments_v1", JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleSaveDraft = () => {
    try {
      saveToLocalList(shipment);
      localStorage.setItem("eksporflow-user-draft-manual", JSON.stringify(shipment));
      toast.success("Draft Transaksi Disimpan", {
        description: `Status: ${shipment.shipmentStatus || "Draft"} tersimpan di penyimpanan perangkat.`,
      });
    } catch {
      toast.info("Draft transaksi tersimpan secara lokal");
    }
  };

  const handleSaveShipmentWithLocal = async () => {
    saveToLocalList(shipment);
    await saveShipment();
  };

  const handleNewTransactionClick = () => {
    if (shipment.reference || shipment.buyer) {
      saveToLocalList(shipment, "Draft");
    }
    setLastScreening(null);
    createNewDraft();
    navigate("po_intake");
  };

  const handleResetForm = () => {
    handleResetPo();
    createNewDraft();
    toast.info("Formulir telah dikosongkan.");
  };

  const handleActivateNewPo = async () => {
    const ref = displayReference || shipment.poNumber?.trim();
    if (!ref && !shipment.buyer) {
      toast.error("Lengkapi data PO", {
        description: "Harap masukkan nomor PO atau nama buyer sebelum mendaftarkan transaksi.",
      });
      return;
    }
    saveToLocalList(shipment, "Confirmed");
    if (user) {
      await saveShipment();
    }
    toast.success("PO Berhasil Didaftarkan", {
      description: `Transaksi ${ref || "PO Baru"} (${shipment.buyer || "Buyer"}) kini aktif di alur ekspor perusahaan.`,
    });
    setActiveTab("workflow");
    navigate("transactions");
  };

  const handleSwitchTransaction = async (item: UnifiedTransactionItem) => {
    if (shipment.reference || shipment.buyer) {
      saveToLocalList(shipment, "Draft");
    }

    if (item.isCloud) {
      await loadShipment(item.id);
    } else if (item.shipment && loadCustomShipment) {
      loadCustomShipment(item.shipment, item.id);
    }
    setIsEditingActiveOrder(false);
    setActiveTab("workflow");
  };

  const handleDeleteTransaction = async (row: UnifiedTransactionItem) => {
    const label = row.reference || "PO ini";
    const buyerDesc = row.buyer && row.buyer !== "-" ? ` (${row.buyer})` : "";
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus transaksi "${label}"${buyerDesc}?\n\nData transaksi ini akan dihapus secara permanen dari sistem.`
    );
    if (!confirmed) return;

    try {
      if (row.isCloud) {
        if (deleteShipment) {
          const success = await deleteShipment(row.id);
          if (!success) {
            toast.error("Gagal menghapus transaksi dari database cloud");
            return;
          }
        }
      } else {
        setLocalList((prev) => {
          const next = prev.filter((p) => p.id !== row.id);
          try {
            localStorage.setItem("eksporflow_local_shipments_v1", JSON.stringify(next));
          } catch {
            // ignore
          }
          return next;
        });
      }

      // Jika transaksi yang dihapus sedang dibuka sebagai activeShipment, buat draft baru
      const isCurrentlyActive =
        row.id === activeShipmentId ||
        (displayReference && row.reference === displayReference);
      if (isCurrentlyActive) {
        createNewDraft();
      }

      toast.success("Transaksi Berhasil Dihapus", {
        description: `Transaksi "${label}" telah dihapus dari sistem.`,
      });
    } catch (err) {
      console.error("Delete transaction error:", err);
      toast.error("Terjadi kesalahan saat menghapus transaksi");
    }
  };

  const handleApplyPo = (data: PoScreeningResult) => {
    update("reference", data.reference);
    update("poNumber", data.reference);
    update("buyer", data.buyer);
    update("buyerCountry", data.buyerCountry);
    update("destination", data.destination);
    update("product", data.product);
    update("hsCode", data.hsCode);
    update("quantity", data.quantity);
    update("unit", data.unit);
    update("unitPrice", data.unitPrice);
    update("incoterm", data.incoterm);
    update("paymentTerms", data.paymentTerms);
    setLastScreening(data);

    const updatedShipment: Shipment = {
      ...shipment,
      reference: data.reference,
      poNumber: data.reference,
      buyer: data.buyer,
      buyerCountry: data.buyerCountry,
      destination: data.destination,
      product: data.product,
      hsCode: data.hsCode,
      quantity: data.quantity,
      unit: data.unit,
      unitPrice: data.unitPrice,
      incoterm: data.incoterm,
      paymentTerms: data.paymentTerms,
    };
    saveToLocalList(updatedShipment, "Draft");

    try {
      localStorage.setItem("eksporflow_last_po_screening", JSON.stringify(data));
    } catch {
      // ignore
    }
  };

  const handleResetPo = () => {
    setLastScreening(null);
    try {
      localStorage.removeItem("eksporflow_last_po_screening");
    } catch {
      // ignore
    }
    toast.info("Dokumen PO/LOI direset. Silakan scan dokumen baru.");
  };

  // Filter out any default dummy auto-seeded transactions (e.g. EXP-2026-001)
  const genuineShipments = useMemo(() => {
    return shipmentsList.filter(
      (s) =>
        s.reference &&
        s.reference !== "Transaksi Ekspor" &&
        s.reference !== "EXP-2026-001" &&
        s.reference !== "EXP-2026-084" &&
        !s.reference.startsWith("EXP-2026-"),
    );
  }, [shipmentsList]);

  // Menggabungkan transaksi cloud dan draft lokal ke satu daftar bersih
  const allTransactions = useMemo(() => {
    const list: UnifiedTransactionItem[] = [];

    // 1. Masukkan transaksi cloud user dengan data lengkap
    for (const s of genuineShipments) {
      const isCurrentActive = s.id === activeShipmentId;
      const buyerName = (isCurrentActive && shipment.buyer) ? shipment.buyer : (s.buyer || "-");
      const buyerCountry = (isCurrentActive && shipment.buyerCountry) ? shipment.buyerCountry : (s.buyerCountry || "-");
      const product = (isCurrentActive && shipment.product) ? shipment.product : (s.product || "-");
      const incoterm = (isCurrentActive && shipment.incoterm) ? shipment.incoterm : (s.incoterm || "FOB");
      const quantity = (isCurrentActive && shipment.quantity) ? shipment.quantity : (s.quantity ?? 20);
      const unit = (isCurrentActive && shipment.unit) ? shipment.unit : (s.unit || "MT");

      list.push({
        id: s.id,
        reference: s.reference,
        buyer: buyerName,
        buyerCountry: buyerCountry,
        product: product,
        incoterm: incoterm,
        quantity: quantity,
        unit: unit,
        status: isCurrentActive ? (shipment.shipmentStatus || s.status) : s.status,
        version: s.version,
        updatedAt: s.updatedAt,
        isCloud: true,
      });
    }

    // 2. Masukkan transaksi lokal jika belum ada di list cloud
    for (const loc of localList) {
      if (!loc.reference || loc.reference === "Transaksi Ekspor") continue;
      const already = list.some(
        (item) => item.reference && item.reference.toLowerCase() === loc.reference.toLowerCase(),
      );
      if (!already) {
        list.push({
          id: loc.id,
          reference: loc.reference,
          buyer: loc.buyer || "-",
          buyerCountry: loc.buyerCountry || "-",
          product: loc.product || "-",
          incoterm: loc.incoterm || "FOB",
          quantity: loc.quantity || 20,
          unit: loc.unit || "MT",
          status: (loc.reference === displayReference || loc.id === activeShipmentId) ? (shipment.shipmentStatus || loc.status) : loc.status,
          updatedAt: loc.updatedAt,
          isCloud: false,
          shipment: loc.shipment,
        });
      }
    }

    // 3. Masukkan draft saat ini HANYA jika memiliki nomor PO atau nama buyer yang valid
    const validCurrentRef = displayReference.trim() || (shipment.poNumber && shipment.poNumber.trim() !== "Transaksi Ekspor" ? shipment.poNumber.trim() : "");
    const validCurrentBuyer = shipment.buyer?.trim();
    if (validCurrentRef || validCurrentBuyer) {
      const alreadyInList = list.some(
        (item) =>
          item.id === activeShipmentId ||
          (validCurrentRef && item.reference && item.reference.toLowerCase() === validCurrentRef.toLowerCase())
      );
      if (!alreadyInList) {
        list.unshift({
          id: activeShipmentId || "current-active",
          reference: validCurrentRef || "Draft PO Baru",
          buyer: validCurrentBuyer || "Buyer Baru",
          buyerCountry: shipment.buyerCountry || "-",
          product: shipment.product || "Komoditas Ekspor",
          incoterm: shipment.incoterm || "FOB",
          quantity: shipment.quantity || 20,
          unit: shipment.unit || "MT",
          status: shipment.shipmentStatus || "Draft",
          updatedAt: new Date(),
          isCloud: Boolean(activeShipmentId),
          shipment,
        });
      }
    }

    return list;
  }, [genuineShipments, localList, shipment, displayReference, activeShipmentId]);

  // Apakah ada transaksi tersimpan
  const hasSavedTransactions = allTransactions.length > 0;

  const draftCount = allTransactions.filter((r) => r.status === "Draft" || r.status === "Quotation").length;
  const activeExecutionCount = allTransactions.filter(
    (r) => !["Draft", "Quotation", "Completed"].includes(r.status),
  ).length;
  const completedTxCount = allTransactions.filter((r) => r.status === "Completed").length;

  // Apakah dokumen PO atau LOI sudah discan dan cocok dengan transaksi saat ini
  const hasScannedPo = Boolean(
    activeScreening ||
    (displayReference && shipment.buyer && shipment.buyerCountry && shipment.buyerCountry !== "-")
  );

  return (
    <div className="module-stack">
      {/* Notifikasi Mode Draft Lokal (Jika belum masuk akun) */}
      {!user && (
        <div className="clean-notice warn" style={{ marginBottom: "14px", padding: "8px 14px" }}>
          <div>
            <b>Mode Draft Lokal</b> — Masuk akun untuk sinkronisasi database cloud.
          </div>
          <button type="button" className="save-button" onClick={() => void login()}>
            <Cloud size={14} /> Hubungkan Cloud
          </button>
        </div>
      )}

      {/* TAMPILAN 1: PENGELOLAAN PESANAN EKSPOR */}
      {!isIntakeMode && (
        <>
          {/* Metrik KPI Ringkas di Bagian Atas */}
          <div className="clean-grid-4" style={{ marginBottom: "16px" }}>
            <div className="panel panel-padding clean-stat-card">
              <span className="eyebrow">TOTAL PESANAN</span>
              <strong style={{ fontSize: "24px", color: "var(--ink)" }}>{allTransactions.length}</strong>
              <small>Semua pesanan tercatat</small>
            </div>
            <div className="panel panel-padding clean-stat-card">
              <span className="eyebrow">DRAFT / QUOTATION</span>
              <strong style={{ fontSize: "24px", color: "var(--saffron)" }}>{draftCount}</strong>
              <small>Fase penawaran &amp; negosiasi</small>
            </div>
            <div className="panel panel-padding clean-stat-card">
              <span className="eyebrow">DALAM EKSEKUSI</span>
              <strong style={{ fontSize: "24px", color: "var(--brand-primary)" }}>{activeExecutionCount}</strong>
              <small>Confirmed, stuffing hingga kapal</small>
            </div>
            <div className="panel panel-padding clean-stat-card">
              <span className="eyebrow">SELESAI</span>
              <strong style={{ fontSize: "24px", color: "var(--mint)" }}>{completedTxCount}</strong>
              <small>Kargo tiba &amp; pembayaran lunas</small>
            </div>
          </div>

          {/* Tab Navigasi Berbentuk Tombol (Primary & Outline Button Jelas Bisa Diklik) */}
          <div className="orders-segmented-control" style={{ marginBottom: "20px" }}>
            <button
              type="button"
              className={`orders-seg-btn ${activeTab === "list" ? "active" : "inactive"}`}
              onClick={() => setActiveTab("list")}
            >
              <Layers size={16} />
              <span>Daftar Pesanan Ekspor</span>
              <span className="tab-badge-pill">{allTransactions.length}</span>
            </button>
            <button
              type="button"
              className={`orders-seg-btn ${activeTab === "workflow" ? "active" : "inactive"}`}
              onClick={() => setActiveTab("workflow")}
            >
              <Activity size={16} />
              <span>Alur Operasional: {displayReference || shipment.buyer || "Pesanan Aktif"}</span>
            </button>
          </div>

          {/* TAB KONTEN 1: TABEL DAFTAR PESANAN */}
          {activeTab === "list" && (
            <section className="panel panel-padding">
              <div className="panel-head" style={{ marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <span className="eyebrow">WORKSPACE PERUSAHAAN</span>
                  <h3 style={{ margin: "2px 0 0", fontSize: "17px", color: "var(--ink)" }}>
                    Daftar Pesanan Ekspor ({allTransactions.length})
                  </h3>
                </div>

                {/* Kolom Pencarian & Tombol Input PO Berdampingan Sejajar (Satu Baris, Tidak Ditumpuk) */}
                <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "10px", flexWrap: "nowrap" }}>
                  <div className="orders-search-input-wrap" style={{ width: "260px" }}>
                    <Search size={14} className="orders-search-icon" />
                    <input
                      type="text"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Cari PO, buyer, komoditas..."
                      className="orders-search-input"
                    />
                    {query && (
                      <button
                        type="button"
                        onClick={() => setQuery("")}
                        className="orders-search-clear"
                        title="Hapus pencarian"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    className="save-button"
                    onClick={handleNewTransactionClick}
                    style={{ padding: "0 16px", height: "36px", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap", flexShrink: 0 }}
                  >
                    <Plus size={15} /> Input PO Baru
                  </button>
                </div>
              </div>

              {/* Status Filter Chips (Satu Baris Bersih Tepat di Bawah Header) */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px", flexWrap: "wrap" }}>
                {(["ALL", "Draft", "Confirmed", "In Transit", "Completed"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    className={`orders-filter-chip ${statusFilter === st ? "active" : ""}`}
                    onClick={() => setStatusFilter(st)}
                  >
                    {st === "ALL" ? "Semua" : st}
                  </button>
                ))}
              </div>

              {/* Isi Tabel Riwayat Transaksi */}
              {allTransactions.length === 0 ? (
                <div className="tx-empty-state">
                  <div className="tx-empty-state-icon">
                    <FileSpreadsheet size={24} />
                  </div>
                  <h4>Belum Ada Transaksi Ekspor</h4>
                  <p>
                    Mulai dengan memindai dokumen PO atau LOI dari buyer Anda, atau masukkan parameter transaksi secara manual.
                  </p>
                  <button
                    type="button"
                    className="save-button"
                    onClick={handleNewTransactionClick}
                  >
                    <Plus size={14} /> Input / Scan PO Baru
                  </button>
                </div>
              ) : (
                <div className="clean-table-wrap">
                  <table className="clean-table">
                    <thead>
                      <tr>
                        <th>Nomor PO / Referensi</th>
                        <th>Nama Buyer &amp; Negara</th>
                        <th>Komoditas &amp; Incoterm</th>
                        <th>Progress Alur</th>
                        <th>Status</th>
                        <th style={{ textAlign: "right" }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allTransactions
                        .filter((row) => {
                          if (statusFilter !== "ALL" && row.status !== statusFilter) return false;
                          const q = query.trim().toLowerCase();
                          if (!q) return true;
                          return (
                            row.reference.toLowerCase().includes(q) ||
                            row.buyer.toLowerCase().includes(q) ||
                            row.buyerCountry.toLowerCase().includes(q) ||
                            row.product.toLowerCase().includes(q)
                          );
                        })
                        .map((row) => {
                          const isCurrent =
                            (row.reference && row.reference === displayReference) ||
                            row.id === activeShipmentId;
                          return (
                            <tr key={row.id} className={isCurrent ? "active-row" : ""}>
                              <td>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <b style={{ color: "var(--ink)" }}>{row.reference || "(Tanpa nomor)"}</b>
                                  {isCurrent && (
                                    <span className="current-tx-badge">● Aktif</span>
                                  )}
                                </div>
                              </td>
                              <td>
                                <div style={{ fontWeight: 600, color: "var(--ink)" }}>{row.buyer}</div>
                                <small style={{ color: "var(--muted)" }}>{row.buyerCountry}</small>
                              </td>
                              <td>
                                <div>{row.product}</div>
                                <small style={{ color: "var(--brand-primary)", fontWeight: 600 }}>
                                  {row.incoterm} · {row.quantity} {row.unit}
                                </small>
                              </td>
                              <td>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <div style={{ width: "60px", height: "6px", background: "var(--line)", borderRadius: "3px", overflow: "hidden" }}>
                                    <div
                                      style={{
                                        width: isCurrent ? `${percentCompleted}%` : row.status === "Completed" ? "100%" : "25%",
                                        height: "100%",
                                        background: row.status === "Completed" ? "var(--mint)" : "var(--brand-primary)",
                                      }}
                                    />
                                  </div>
                                  <small style={{ color: "var(--ink-secondary)", fontWeight: 600, fontSize: "11px" }}>
                                    {isCurrent ? `${completedCount}/${totalCount}` : row.status === "Completed" ? "Selesai" : "Berjalan"}
                                  </small>
                                </div>
                              </td>
                              <td>
                                <StatusPill tone={statusTone(row.status)}>{row.status}</StatusPill>
                              </td>
                              <td style={{ textAlign: "right" }}>
                                <div className="row-actions" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                  <button
                                    type="button"
                                    style={{
                                      padding: "6px 12px",
                                      fontSize: "12px",
                                      fontWeight: 500,
                                      borderRadius: "6px",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "5px",
                                      background: "var(--brand-subtle)",
                                      color: "var(--brand-primary)",
                                      border: "1px solid #bfdbfe",
                                      cursor: "pointer",
                                      transition: "all 0.15s ease",
                                    }}
                                    onClick={() => void handleSwitchTransaction(row)}
                                    title="Buka alur operasional transaksi ini"
                                  >
                                    <Activity size={13} /> Buka Alur
                                  </button>
                                  <button
                                    type="button"
                                    style={{
                                      padding: "6px 10px",
                                      fontSize: "12px",
                                      fontWeight: 500,
                                      borderRadius: "6px",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "4px",
                                      background: "#ffffff",
                                      color: "#dc2626",
                                      border: "1px solid #fecaca",
                                      cursor: "pointer",
                                      transition: "all 0.15s ease",
                                    }}
                                    onClick={() => void handleDeleteTransaction(row)}
                                    title={`Hapus transaksi ${row.reference} (${row.buyer})`}
                                  >
                                    <Trash2 size={12} /> Hapus
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* TAB KONTEN 2: ALUR OPERASIONAL TRANSAKSI AKTIF */}
          {activeTab === "workflow" && (
            <div className="module-stack">
              {/* Kartu Ringkasan Hero Pesanan Aktif */}
              <div className="active-order-summary-card">
                <div className="active-order-summary-main">
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span className="active-order-ref-pill">
                        {displayReference || shipment.poNumber || "Pesanan Aktif"}
                      </span>
                      <span className="tab-badge">{shipment.incoterm || "FOB"}</span>
                      <StatusPill tone={statusTone(shipment.shipmentStatus)}>
                        {shipment.shipmentStatus}
                      </StatusPill>
                    </div>
                    <span className="active-order-buyer-name">
                      {shipment.buyer || "Buyer Belum Ditentukan"}
                    </span>
                    <span className="active-order-buyer-meta">
                      {shipment.buyerCountry || "-"} · {shipment.destination || "Pelabuhan Tujuan -"} · {shipment.product || "Komoditas"}
                    </span>
                  </div>
                </div>

                <div className="active-order-summary-stats">
                  <div className="active-order-stat-item">
                    <span className="active-order-stat-label">Progress Alur Ekspor</span>
                    <span
                      className="active-order-stat-val"
                      style={{ color: percentCompleted === 100 ? "var(--mint)" : "var(--brand-primary)" }}
                    >
                      {completedCount}/{totalCount} Tahap ({percentCompleted}%)
                    </span>
                  </div>
                  <button
                    type="button"
                    className="ghost-button"
                    style={{ fontSize: "12px", padding: "6px 12px" }}
                    onClick={() => setIsEditingActiveOrder(!isEditingActiveOrder)}
                    title="Buka atau tutup form untuk mengubah parameter order aktif"
                  >
                    <Pencil size={13} /> {isEditingActiveOrder ? "Tutup Edit Parameter" : "Ubah Parameter PO"}
                  </button>
                  <button
                    type="button"
                    className="save-button"
                    style={{ fontSize: "12px", padding: "6px 12px" }}
                    onClick={() => void handleSaveShipmentWithLocal()}
                    disabled={saveState === "saving"}
                    title="Simpan perubahan transaksi ini ke cloud"
                  >
                    <Save size={13} /> {saveState === "saving" ? "Menyimpan..." : "Simpan"}
                  </button>
                </div>
              </div>

              {/* Form Parameter yang Bisa Di-Expand/Collapse Jika Perlu Diedit */}
              {isEditingActiveOrder && (
                <section className="panel panel-padding active-order-card" style={{ marginBottom: "14px" }}>
                  <div className="panel-head">
                    <div>
                      <span className="eyebrow">PARAMETER PO AKTIF</span>
                      <h3>Penyesuaian Data Transaksi</h3>
                    </div>

                    <div className="active-order-header-actions">
                      <button
                        type="button"
                        className="save-button"
                        onClick={() => setPoModalOpen(true)}
                        title="Pindai dan ekstrak data otomatis dari dokumen PO atau LOI buyer"
                        style={{ padding: "6px 12px", fontSize: "12px" }}
                      >
                        <FileSpreadsheet size={13} /> Scan Dokumen
                      </button>
                      <button
                        type="button"
                        className="ghost-button select-partner-btn"
                        onClick={() => navigate("partners")}
                        title="Pilih dari daftar mitra buyer tersimpan"
                        style={{ padding: "6px 12px", fontSize: "12px" }}
                      >
                        <Users size={13} /> Mitra
                      </button>
                    </div>
                  </div>

                  <div className="profile-grid">
                    <Field
                      label="Nomor PO / Transaksi"
                      value={displayReference}
                      placeholder="Contoh: PO-001, INV-2026/01"
                      onChange={(value) => update("reference", value)}
                    />

                    <Field
                      label="Nama Buyer (Pembeli)"
                      value={shipment.buyer}
                      placeholder="Nama perusahaan pembeli luar negeri"
                      onChange={(value) => update("buyer", value)}
                    />

                    <Field
                      label="Negara Tujuan"
                      value={shipment.buyerCountry}
                      placeholder="Contoh: Jepang, Jerman, AS"
                      onChange={(value) => update("buyerCountry", value)}
                    />

                    <Field
                      label="Pelabuhan Tujuan"
                      value={shipment.destination}
                      placeholder="Contoh: Port of Tokyo"
                      onChange={(value) => update("destination", value)}
                    />

                    <Field
                      label="Nama Eksportir"
                      value={shipment.exporter}
                      placeholder="Nama perusahaan Anda"
                      onChange={(value) => update("exporter", value)}
                    />

                    <Field
                      label="HS Code"
                      value={shipment.hsCode}
                      placeholder="Contoh: 0901.11"
                      onChange={(value) => update("hsCode", value)}
                    />

                    <SelectField
                      label="Status Siklus Transaksi"
                      value={shipment.shipmentStatus}
                      onChange={(val) => {
                        const nextStatus = val as ShipmentStatus;
                        update("shipmentStatus", nextStatus);
                        saveToLocalList({ ...shipment, shipmentStatus: nextStatus }, nextStatus);
                      }}
                    >
                      <option value="Draft">Draft (Tahap Perencanaan / Draf Awal)</option>
                      <option value="Quotation">Quotation (Fase Penawaran Resmi ke Buyer)</option>
                      <option value="Confirmed">Confirmed (PO / Kontrak Disepakati)</option>
                      <option value="Ready to Ship">Ready to Ship (Kargo Siap di Gudang)</option>
                      <option value="Booked">Booked (Booking Kapal / Pelayaran Terbit)</option>
                      <option value="Stuffing">Stuffing (Pemuatan Kargo ke Kontainer)</option>
                      <option value="Departed">Departed (Kapal Berangkat dari Pelabuhan)</option>
                      <option value="In Transit">In Transit (Dalam Pelayaran ke Negara Tujuan)</option>
                      <option value="Completed">Completed (Tiba di Buyer &amp; Transaksi Selesai)</option>
                    </SelectField>
                  </div>
                </section>
              )}

              {/* Rel Navigasi Antar Modul Terintegrasi */}
              <div className="connection-rail" style={{ marginBottom: "14px" }}>
                <div className="rail-chips">
                  <button type="button" className="rail-chip" onClick={() => navigate("pricing")}>
                    <Calculator size={13} />
                    <span>Harga &amp; Order</span>
                  </button>
                  <button type="button" className="rail-chip" onClick={() => navigate("documents")}>
                    <FileText size={13} />
                    <span>Dokumen Ekspor</span>
                  </button>
                  <button type="button" className="rail-chip" onClick={() => navigate("cargo")}>
                    <Package size={13} />
                    <span>Rencana Muatan</span>
                  </button>
                  <button type="button" className="rail-chip" onClick={() => navigate("risk")}>
                    <ShieldAlert size={13} />
                    <span>Risk Center</span>
                  </button>
                </div>
                <span className="rail-status">Sinkron otomatis</span>
              </div>

              {/* ALUR OPERASIONAL EKSPOR TERINTEGRASI (8 TAHAP) */}
              <section className="panel panel-padding clean-workflow-card">
                <div className="clean-workflow-head">
                  <div>
                    <span className="eyebrow">ALUR OPERASIONAL EKSPOR</span>
                    <h3>Alur Transaksi ({workflow.incoterm})</h3>
                  </div>
                  <div className="clean-workflow-progress">
                    <span className="clean-workflow-count">
                      <b>{completedCount}</b> dari {totalCount} tahap selesai ({percentCompleted}%)
                    </span>
                    <div className="clean-workflow-track">
                      <div
                        className="clean-workflow-fill"
                        style={{ width: `${percentCompleted}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bar Koordinasi Buyer (Singkat & Elegan) */}
                {workflow.coordinationTip && (
                  <div className="clean-buyer-notice">
                    <MessageSquare size={14} />
                    <span>
                      <strong>Koordinasi Buyer:</strong> {workflow.coordinationTip}
                    </span>
                  </div>
                )}

                {/* Daftar Tahapan Rapi, Bersih & Minimalis */}
                <div className="clean-stage-list">
                  {workflow.stages.map((stage) => {
                    return (
                      <div
                        key={stage.id}
                        className="clean-stage-row"
                        onClick={() => navigate(stage.targetScreen)}
                        title="Klik untuk membuka modul terkait"
                      >
                        <div className={`clean-stage-dot ${stage.isDone ? "done" : ""}`}>
                          {stage.isDone ? <Check size={12} strokeWidth={3} /> : stage.number}
                        </div>

                        <div className="clean-stage-info">
                          <span className="clean-stage-title">{stage.title}</span>
                          <span className="clean-stage-meta">{stage.meta}</span>
                        </div>

                        <div className="clean-stage-status">
                          <span className={`clean-stage-pill ${stage.isDone ? "done" : "pending"}`}>
                            {stage.isDone ? "Selesai" : "Perlu Dilengkapi"}
                          </span>
                          <ChevronRight size={15} className="clean-stage-arrow" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Dokumen & Sertifikat Kepatuhan Ekspor Hasil Scan AI */}
              {hasScannedPo && (
                <div className="trans-compliance-box" style={{ marginTop: "14px" }}>
                  <div className="trans-compliance-head">
                    <div className="trans-compliance-title">
                      <Sparkles size={14} />
                      <span>Dokumen &amp; Sertifikat Ekspor ({shipment.buyerCountry || "Internasional"})</span>
                      <span className="compliance-tag-scanned">
                        <CheckCircle2 size={11} /> Rekomendasi Dokumen Ketentuan Buyer
                      </span>
                    </div>
                    <div className="trans-compliance-actions">
                      <button
                        type="button"
                        className="trans-compliance-relink"
                        onClick={() => setPoModalOpen(true)}
                        title="Scan atau ganti dokumen PO/LOI lain"
                      >
                        <RefreshCw size={11} /> Ganti Dokumen
                      </button>
                    </div>
                  </div>

                  {aiRegulations.length > 0 ? (
                    <div className="trans-compliance-table-wrap">
                      <table className="trans-compliance-table">
                        <thead>
                          <tr>
                            <th style={{ width: "26%" }}>Dokumen</th>
                            <th style={{ width: "20%" }}>Instansi Penerbit</th>
                            <th style={{ width: "54%" }}>Keterangan &amp; Persiapan</th>
                          </tr>
                        </thead>
                        <tbody>
                          {aiRegulations.map((reg) => (
                            <tr key={reg.id}>
                              <td className="compliance-td-doc">
                                <span className="compliance-doc-name">{reg.name}</span>
                              </td>
                              <td className="compliance-td-auth">
                                <span className="compliance-auth-badge">{reg.issuingAuthority}</span>
                              </td>
                              <td className="compliance-td-desc">
                                <p className="compliance-desc-text">{reg.description}</p>
                                <p className="compliance-prep-text">
                                  <strong>Persiapan:</strong> {reg.preparationTip}
                                </p>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="compliance-empty-reg-note">
                      Tidak ada dokumen kepatuhan khusus yang diwajibkan untuk negara ini. Siapkan dokumen standar ekspor (PEB, Invoice, Packing List).
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* TAMPILAN 2: INPUT PURCHASE ORDER BARU */}
      {isIntakeMode && (
        <section className="panel panel-padding active-order-card">
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "18px", paddingBottom: "14px", borderBottom: "1px solid var(--line)" }}>
            <div>
              <button
                type="button"
                className="ghost-button"
                onClick={() => navigate("transactions")}
                style={{ fontSize: "12px", padding: "4px 8px", marginBottom: "6px", display: "inline-flex", alignItems: "center", gap: "5px" }}
              >
                <ArrowLeft size={13} /> Kembali ke Pesanan Ekspor
              </button>
              <h3 style={{ margin: "2px 0 0", fontSize: "18px", color: "var(--navy)" }}>Input Purchase Order (PO) Baru</h3>
            </div>

            <div className="active-order-header-actions" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                type="button"
                className="save-button"
                onClick={() => setPoModalOpen(true)}
                title="Pindai dan ekstrak data otomatis dari dokumen PO atau LOI buyer"
                style={{ padding: "8px 14px", fontSize: "12.5px" }}
              >
                <FileSpreadsheet size={14} /> Scan Dokumen PO / LOI
              </button>
              <button
                type="button"
                className="ghost-button select-partner-btn"
                onClick={() => navigate("partners")}
                title="Pilih dari daftar mitra buyer tersimpan"
                style={{ padding: "8px 12px", fontSize: "12.5px" }}
              >
                <Users size={14} /> Pilih Mitra
              </button>
            </div>
          </div>

          {/* Banner Ringkas Hasil Verifikasi AI Advisor Hanya Tampil Jika Form Cocok dengan PO yang Discan */}
          {activeScreening && (
            <div className="po-screening-banner" style={{ padding: "10px 14px", marginBottom: "16px", borderRadius: "6px" }}>
              <div className="po-screening-banner-left" style={{ gap: "4px" }}>
                <span className="po-screening-badge" style={{ fontSize: "12.5px" }}>
                  <CheckCircle2 size={14} /> Validasi Profil Buyer Terverifikasi ({activeScreening.validation.score}%) · {activeScreening.buyer}
                </span>
                <p style={{ fontSize: "12px", margin: 0 }}>
                  {activeScreening.validation.legalEntityStatus} · {activeScreening.validation.sanctionCheck}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <button
                  type="button"
                  className="compact-btn"
                  onClick={() => setPoModalOpen(true)}
                  style={{ fontSize: "11.5px", padding: "4px 10px" }}
                >
                  Detail Analisis
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={handleResetPo}
                  title="Tutup &amp; reset hasil screening"
                  style={{ padding: "4px 8px", fontSize: "11px", color: "#64748b" }}
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Form Input Rapi & Bersih */}
          <div className="profile-grid">
            <Field
              label="Nomor PO / Transaksi"
              value={displayReference}
              placeholder="Contoh: PO-001, INV-2026/01"
              onChange={(value) => update("reference", value)}
            />

            <Field
              label="Nama Buyer (Pembeli)"
              value={shipment.buyer}
              placeholder="Nama perusahaan pembeli luar negeri"
              onChange={(value) => update("buyer", value)}
            />

            <Field
              label="Negara Tujuan"
              value={shipment.buyerCountry}
              placeholder="Contoh: Jepang, Jerman, Uni Emirat Arab"
              onChange={(value) => update("buyerCountry", value)}
            />

            <Field
              label="Pelabuhan Tujuan (POD)"
              value={shipment.destination}
              placeholder="Contoh: Port of Tokyo, Jebel Ali Port"
              onChange={(value) => update("destination", value)}
            />

            <Field
              label="Nama Eksportir"
              value={shipment.exporter}
              placeholder="Nama perusahaan Anda"
              onChange={(value) => update("exporter", value)}
            />

            <Field
              label="HS Code"
              value={shipment.hsCode}
              placeholder="Contoh: 0901.11"
              onChange={(value) => update("hsCode", value)}
            />

            <SelectField
              label="Incoterm Yang Disepakati"
              value={shipment.incoterm || "FOB"}
              onChange={(val) => update("incoterm", val as Incoterm)}
            >
              <option value="FOB">FOB (Free On Board)</option>
              <option value="CIF">CIF (Cost, Insurance &amp; Freight)</option>
              <option value="CFR">CFR (Cost &amp; Freight)</option>
              <option value="EXW">EXW (Ex Works)</option>
              <option value="FCA">FCA (Free Carrier)</option>
              <option value="DAP">DAP (Delivered at Place)</option>
              <option value="DDP">DDP (Delivered Duty Paid)</option>
            </SelectField>

            <SelectField
              label="Status Transaksi Awal"
              value={shipment.shipmentStatus}
              onChange={(val) => update("shipmentStatus", val as ShipmentStatus)}
            >
              <option value="Draft">Draft (Tahap Perencanaan / Penjajakan)</option>
              <option value="Quotation">Quotation (Fase Penawaran Harga)</option>
              <option value="Confirmed">Confirmed (PO Resmi Diterima dari Buyer)</option>
              <option value="Booked">Booked (Booking Kapal Sudah Didapat)</option>
            </SelectField>
          </div>

          {/* Footer Aksi Pendaftaran PO Baru ke Pipeline Ekspor */}
          <div className="intake-action-footer" style={{ marginTop: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="status-pill status-pill-info">{shipment.shipmentStatus || "Draft"}</span>
              <small style={{ color: "var(--muted)" }}>
                {displayReference ? `PO: ${displayReference}` : "Nomor PO belum diisi"} · {shipment.buyer || "Nama buyer belum diisi"}
              </small>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <button
                type="button"
                className="ghost-button"
                onClick={handleResetForm}
                title="Kosongkan formulir"
              >
                <RefreshCw size={13} /> Kosongkan Form
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={() => navigate("transactions")}
              >
                Batal
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={handleSaveDraft}
                title="Simpan sebagai draft lokal"
              >
                <FileText size={14} /> Simpan Draft
              </button>
              <button
                type="button"
                className="save-button"
                onClick={() => void handleActivateNewPo()}
                title="Daftarkan pesanan ini ke daftar pesanan ekspor"
                style={{ padding: "8px 18px", fontSize: "13px" }}
              >
                <CheckCircle2 size={15} /> Daftarkan Pesanan
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Modal Ekstraksi PO Buyer & Screening AI Advisor */}
      <PoIngestionModal
        isOpen={poModalOpen}
        onClose={() => setPoModalOpen(false)}
        onApply={handleApplyPo}
      />
    </div>
  );
}
