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
  ArrowRight,
  BarChart3,
  Calendar,
  Calculator,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Cloud,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  FolderOpen,
  GripVertical,
  Layers,
  LayoutGrid,
  MessageSquare,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldAlert,
  ShieldCheck,
  Ship,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { PoIngestionModal } from "./PoIngestionModal";
import {
  Field,
  SelectField,
  StatusPill,
  SpaceButton,
  SpaceInput,
  SpaceSelect,
  SpaceCheckbox,
  SpaceRadio,
  SpaceToggle,
  SpaceBadge,
  SpaceAvatar,
  SpaceTooltip,
  SpaceProgressBar,
  SpacePagination,
  SpaceTabs,
  SpaceSkeleton,
  SpaceStatCard,
} from "./Primitives";
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
  contactPerson?: string;
  buyerCountry: string;
  product: string;
  hsCode?: string;
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
  const [activeTab, setActiveTab] = useState<"list" | "kanban" | "calendar" | "analytics" | "workflow">("list");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [countryFilter, setCountryFilter] = useState("ALL");
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);

  // Initial Kanban stages populated from orders or presets with distinct stage colors
  const [kanbanStages, setKanbanStages] = useState<{
    id: string;
    title: string;
    accentColor: string;
    bgTint: string;
    badgeBg: string;
    badgeText: string;
    borderColor: string;
    items: {
      id: string;
      ref: string;
      buyer: string;
      country: string;
      product: string;
      value: string;
      container: string;
      dueDate: string;
      status: string;
      avatarTone?: string;
    }[];
  }[]>([
    {
      id: "inquiry",
      title: "1. Inquiry & Leads",
      accentColor: "#2563EB",
      bgTint: "#F8FAFC",
      badgeBg: "#DBEAFE",
      badgeText: "#1D4ED8",
      borderColor: "#93C5FD",
      items: [
        {
          id: "kb-1",
          ref: "INQ-2026/DXB/03",
          buyer: "Al-Barakah Global Trading",
          country: "Uni Emirat Arab",
          product: "Briket Arang Kelapa",
          value: "$42,600",
          container: "2 × 40HC",
          dueDate: "28 Nov 2026",
          status: "Inquiry",
        },
        {
          id: "kb-2",
          ref: "INQ-2026/BKK/08",
          buyer: "Siam Bio Agro Co.",
          country: "Thailand",
          product: "Minyak Atsiri Nilam",
          value: "$31,400",
          container: "1 × 20GP",
          dueDate: "02 Des 2026",
          status: "Inquiry",
        },
      ],
    },
    {
      id: "quotation",
      title: "2. Penawaran (Quotation)",
      accentColor: "#D97706",
      bgTint: "#FFFDF5",
      badgeBg: "#FEF3C7",
      badgeText: "#B45309",
      borderColor: "#FDE68A",
      items: [
        {
          id: "kb-3",
          ref: "QUO-2026/AMS/07",
          buyer: "Van Dijk Furniture BV",
          country: "Belanda",
          product: "Mebel Kayu & Rotan",
          value: "$65,800",
          container: "1 × 40HC",
          dueDate: "30 Nov 2026",
          status: "Quotation",
        },
      ],
    },
    {
      id: "negotiation",
      title: "3. Negosiasi & Sampel",
      accentColor: "#7C3AED",
      bgTint: "#FAF5FF",
      badgeBg: "#EDE9FE",
      badgeText: "#6D28D9",
      borderColor: "#DDD6FE",
      items: [
        {
          id: "kb-4",
          ref: "NEG-2026/SWE/01",
          buyer: "Nordic Pantry AB",
          country: "Swedia",
          product: "Organic Coconut Sugar",
          value: "$58,024",
          container: "1 × 20GP",
          dueDate: "25 Nov 2026",
          status: "Negotiation",
        },
      ],
    },
    {
      id: "contract",
      title: "4. Kontrak & DP Terbit",
      accentColor: "#0D9488",
      bgTint: "#F0FDFA",
      badgeBg: "#CCFBF1",
      badgeText: "#0F766E",
      borderColor: "#99F6E4",
      items: [
        {
          id: "kb-5",
          ref: "PO-2026/TYO/04",
          buyer: "Marubeni Specialty Foods",
          country: "Jepang",
          product: "Kopi Arabika Gayo Grade 1",
          value: "$112,000",
          container: "1 × 40HC",
          dueDate: "05 Des 2026",
          status: "Confirmed",
        },
      ],
    },
    {
      id: "production",
      title: "5. Produksi & Stuffing",
      accentColor: "#EA580C",
      bgTint: "#FFF7ED",
      badgeBg: "#FFEDD5",
      badgeText: "#C2410C",
      borderColor: "#FED7AA",
      items: [
        {
          id: "kb-6",
          ref: "PO-2026/KOR/02",
          buyer: "Busan Marine Corp",
          country: "Korea Selatan",
          product: "Udang Windu Beku (Head-On)",
          value: "$84,500",
          container: "1 × 20RF",
          dueDate: "12 Des 2026",
          status: "In Transit",
        },
      ],
    },
    {
      id: "shipping",
      title: "6. Kapal Berlayar (In Transit)",
      accentColor: "#0284C7",
      bgTint: "#F0F9FF",
      badgeBg: "#E0F2FE",
      badgeText: "#0369A1",
      borderColor: "#BAE6FD",
      items: [
        {
          id: "kb-7",
          ref: "PO-2026/DEU/12",
          buyer: "Hamburg Roasters B.V.",
          country: "Belanda",
          product: "Biji Kakao Fermentasi Sulawesi",
          value: "$71,250",
          container: "1 × 40HC",
          dueDate: "18 Des 2026",
          status: "In Transit",
        },
      ],
    },
    {
      id: "completed",
      title: "7. Selesai & Diterima Buyer",
      accentColor: "#16A34A",
      bgTint: "#F0FDF4",
      badgeBg: "#DCFCE7",
      badgeText: "#15803D",
      borderColor: "#BBF7D0",
      items: [
        {
          id: "kb-8",
          ref: "PO-2026/SIN/01",
          buyer: "Olam International Ltd",
          country: "Singapura",
          product: "Kayu Manis Korintje A",
          value: "$55,000",
          container: "1 × 20GP",
          dueDate: "10 Nov 2026",
          status: "Completed",
        },
      ],
    },
  ]);

  const handleDragStart = (cardId: string) => {
    setDraggedCardId(cardId);
  };

  const handleDrop = (targetColId: string) => {
    if (!draggedCardId) return;
    setKanbanStages((prev) => {
      let movedItem: any = null;
      // remove from old col
      const cleaned = prev.map((col) => {
        const remaining = col.items.filter((it) => {
          if (it.id === draggedCardId) {
            movedItem = it;
            return false;
          }
          return true;
        });
        return { ...col, items: remaining };
      });
      if (!movedItem) return prev;
      // add to target col
      return cleaned.map((col) => {
        if (col.id === targetColId) {
          return { ...col, items: [...col.items, movedItem] };
        }
        return col;
      });
    });
    setDraggedCardId(null);
    toast.success("Tahapan Pesanan Diperbarui");
  };

  const handleAdvanceCard = (cardId: string, currentColId: string) => {
    const colIdx = kanbanStages.findIndex((c) => c.id === currentColId);
    if (colIdx < 0 || colIdx >= kanbanStages.length - 1) return;
    const nextCol = kanbanStages[colIdx + 1];
    handleDragStart(cardId);
    setKanbanStages((prev) => {
      let movedItem: any = null;
      const cleaned = prev.map((col) => {
        const remaining = col.items.filter((it) => {
          if (it.id === cardId) {
            movedItem = it;
            return false;
          }
          return true;
        });
        return { ...col, items: remaining };
      });
      if (!movedItem) return prev;
      return cleaned.map((col) => {
        if (col.id === nextCol.id) {
          return { ...col, items: [...col.items, movedItem] };
        }
        return col;
      });
    });
    toast.success(`Dipindahkan ke ${nextCol.title}`);
  };

  const handleMarkCompleteAndSaveBuyer = (
    card: { id: string; ref: string; buyer: string; country: string; product: string; value: string; container: string; dueDate: string; status: string },
    _currentColId: string
  ) => {
    // 1. Pindahkan kartu ke tahapan 7. Selesai & Diterima Buyer
    setKanbanStages((prev) => {
      let movedItem: any = null;
      const cleaned = prev.map((col) => {
        const remaining = col.items.filter((it) => {
          if (it.id === card.id) {
            movedItem = { ...it, status: "Completed" };
            return false;
          }
          return true;
        });
        return { ...col, items: remaining };
      });
      if (!movedItem) return prev;
      return cleaned.map((col) => {
        if (col.id === "completed") {
          const exists = col.items.some((it) => it.id === movedItem.id);
          return { ...col, items: exists ? col.items : [movedItem, ...col.items] };
        }
        return col;
      });
    });

    // 2. Simpan secara permanen ke Database Buyer (Menu Pra-Transaksi & Buyer)
    try {
      const raw = localStorage.getItem("eksporflow_saved_buyers");
      const list = raw ? JSON.parse(raw) : [];
      const newBuyerRecord = {
        id: `buyer-${Date.now()}`,
        companyName: card.buyer,
        country: card.country,
        product: card.product,
        lastPoRef: card.ref,
        dealValue: card.value,
        container: card.container,
        status: "Kargo Diterima & Lunas",
        savedAt: new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
      };
      const filtered = list.filter((b: any) => b.companyName !== card.buyer);
      const updated = [newBuyerRecord, ...filtered];
      localStorage.setItem("eksporflow_saved_buyers", JSON.stringify(updated));
      window.dispatchEvent(new Event("eksporflow_buyer_saved"));
    } catch (err) {
      console.error("Gagal menyimpan buyer ke CRM", err);
    }

    // 3. Sinkronkan dengan transaksi aktif bila diperlukan
    if (update) {
      update("buyer", card.buyer);
      update("buyerCountry", card.country);
    }

    toast.success(`Pesanan ${card.ref} Selesai! Data buyer ${card.buyer} (${card.country}) berhasil tersimpan di menu Data Buyer & CRM.`, {
      action: {
        label: "Buka Data Buyer",
        onClick: () => navigate("pre_transaction"),
      },
      duration: 6000,
    });
  };
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
      const hsCode = (isCurrentActive && shipment.hsCode) ? shipment.hsCode : "0901.11.10";
      const incoterm = (isCurrentActive && shipment.incoterm) ? shipment.incoterm : (s.incoterm || "FOB");
      const quantity = (isCurrentActive && shipment.quantity) ? shipment.quantity : (s.quantity ?? 20);
      const unit = (isCurrentActive && shipment.unit) ? shipment.unit : (s.unit || "MT");

      list.push({
        id: s.id,
        reference: s.reference,
        buyer: buyerName,
        contactPerson: isCurrentActive ? (shipment.signatoryName || "") : "",
        buyerCountry: buyerCountry,
        product: product,
        hsCode: hsCode,
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
          contactPerson: loc.shipment?.signatoryName || "",
          buyerCountry: loc.buyerCountry || "-",
          product: loc.product || "-",
          hsCode: loc.shipment?.hsCode || "0901.11.10",
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
          contactPerson: shipment.signatoryName || "",
          buyerCountry: shipment.buyerCountry || "-",
          product: shipment.product || "Komoditas Ekspor",
          hsCode: shipment.hsCode || "0901.11.10",
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

    // Jika belum ada data transaksi, sediakan sampel transaksi riil komersial
    if (list.length === 0) {
      list.push(
        {
          id: "tx-sample-1",
          reference: "PO-2026/US/089",
          buyer: "Global Coffee LLC",
          contactPerson: "Marilyn Ramirez",
          buyerCountry: "Amerika Serikat",
          product: "Kopi Arabika Gayo Grade 1",
          hsCode: "0901.11.10",
          incoterm: "FOB",
          quantity: 20,
          unit: "MT",
          status: "Confirmed",
          updatedAt: new Date(Date.now() - 2 * 86400000),
          isCloud: false,
        },
        {
          id: "tx-sample-2",
          reference: "PO-2026/DEU/12",
          buyer: "Hamburg Roasters B.V.",
          contactPerson: "Douglas Cobb",
          buyerCountry: "Belanda",
          product: "Biji Kakao Fermentasi Sulawesi",
          hsCode: "1801.00.00",
          incoterm: "CIF",
          quantity: 25,
          unit: "MT",
          status: "In Transit",
          updatedAt: new Date(Date.now() - 5 * 86400000),
          isCloud: false,
        },
        {
          id: "tx-sample-3",
          reference: "PO-2026/TYO/04",
          buyer: "Marubeni Specialty Foods",
          contactPerson: "Kenji Sato",
          buyerCountry: "Jepang",
          product: "Kopi Arabika Mandheling G1",
          hsCode: "0901.11.20",
          incoterm: "CFR",
          quantity: 40,
          unit: "MT",
          status: "Confirmed",
          updatedAt: new Date(Date.now() - 7 * 86400000),
          isCloud: false,
        },
        {
          id: "tx-sample-4",
          reference: "PO-2026/KOR/02",
          buyer: "Busan Marine Corp",
          contactPerson: "Park Jin-Soo",
          buyerCountry: "Korea Selatan",
          product: "Udang Windu Beku (Head-On)",
          hsCode: "0306.17.10",
          incoterm: "CIF",
          quantity: 18,
          unit: "MT",
          status: "Completed",
          updatedAt: new Date(Date.now() - 12 * 86400000),
          isCloud: false,
        }
      );
    }

    return list;
  }, [genuineShipments, localList, shipment, displayReference, activeShipmentId]);

  // Transaksi terfilter untuk pencarian, negara, dan status
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((row) => {
      if (statusFilter !== "ALL" && row.status !== statusFilter) return false;
      if (countryFilter !== "ALL" && !row.buyerCountry?.toLowerCase().includes(countryFilter.toLowerCase())) return false;
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (
        row.reference.toLowerCase().includes(q) ||
        row.buyer.toLowerCase().includes(q) ||
        (row.contactPerson && row.contactPerson.toLowerCase().includes(q)) ||
        row.buyerCountry.toLowerCase().includes(q) ||
        row.product.toLowerCase().includes(q) ||
        (row.hsCode && row.hsCode.toLowerCase().includes(q))
      );
    });
  }, [allTransactions, statusFilter, countryFilter, query]);

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

      {/* TAMPILAN 1: PENGELOLAAN PESANAN EKSPOR (SPACE DS CRM SUITE) */}
      {!isIntakeMode && (
        <>
          {/* Space DS Executive KPI Stat Cards */}
          <div className="space-crm-stats-grid" style={{ marginBottom: "20px" }}>
            <SpaceStatCard
              label="Total pipeline ekspor"
              value={`$${allTransactions.reduce((acc, t) => acc + (t.quantity * 2800 || 45000), 184500).toLocaleString("en-US")}`}
              subtext={`${allTransactions.length} Kontrak Aktif`}
              trend={{ value: "14.8% MoM", isUp: true }}
              tone="navy"
              icon={<Layers size={16} />}
            />
            <SpaceStatCard
              label="Penawaran & quotation"
              value={`$${(draftCount * 38000 || 72400).toLocaleString("en-US")}`}
              subtext={`${draftCount} Prospek Buyer`}
              tone="gold"
              icon={<FileText size={16} />}
            />
            <SpaceStatCard
              label="Produksi & stuffing"
              value={`${activeExecutionCount} Kontrak`}
              subtext="4 Kontainer Siap Muat"
              trend={{ value: "On-Track", isUp: true }}
              tone="purple"
              icon={<Package size={16} />}
            />
            <SpaceStatCard
              label="Pengapalan & pelunasan"
              value={`$${(completedTxCount * 55000 || 165000).toLocaleString("en-US")}`}
              subtext={`${completedTxCount} Transaksi Selesai`}
              trend={{ value: "100% Lunas", isUp: true }}
              tone="mint"
              icon={<CheckCircle2 size={16} />}
            />
          </div>

          {/* Space DS Subnavigation Tabs */}
          <div style={{ marginBottom: "20px" }}>
            <SpaceTabs
              variant="pills"
              activeTab={activeTab}
              onChange={(t) => {
                setActiveTab(t as any);
                setCurrentPage(1);
              }}
              tabs={[
                { id: "list", label: "Tabel Pesanan (CRM)", icon: <Layers size={14} />, count: allTransactions.length },
                { id: "kanban", label: "Papan Kanban Pipeline", icon: <LayoutGrid size={14} />, count: kanbanStages.reduce((acc, s) => acc + s.items.length, 0) },
                { id: "calendar", label: "Kalender Ekspor", icon: <Calendar size={14} />, count: 6 },
                { id: "analytics", label: "Comparison Chart", icon: <BarChart3 size={14} /> },
                { id: "workflow", label: `Alur: ${displayReference || shipment.buyer || "Pesanan Aktif"}`, icon: <Activity size={14} /> },
              ]}
            />
          </div>

          {/* TAB 1: TABEL PESANAN EKSPOR (ORDERS BY STATUS) */}
          {activeTab === "list" && (
            <div className="space-crm-container">
              {/* Space DS 2-Tier Structured Filter Toolbar */}
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: 12,
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                  marginBottom: 16,
                }}
              >
                {/* Baris 1: Pencarian, Filter Negara, & Tombol Aksi */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "1 1 360px", minWidth: 260 }}>
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <SpaceInput
                        placeholder="Cari nomor PO, nama buyer, komoditas, HS Code..."
                        value={query}
                        onChange={(e) => {
                          setQuery(e.target.value);
                          setCurrentPage(1);
                        }}
                        iconLeft={<Search size={15} />}
                      />
                    </div>
                    <div style={{ width: 170, minWidth: 160, flexShrink: 0 }}>
                      <SpaceSelect
                        value={countryFilter}
                        onChange={(e) => {
                          setCountryFilter(e.target.value);
                          setCurrentPage(1);
                        }}
                        options={[
                          { value: "ALL", label: "Semua Negara" },
                          { value: "Amerika Serikat", label: "Amerika Serikat" },
                          { value: "Belanda", label: "Belanda" },
                          { value: "Jepang", label: "Jepang" },
                          { value: "Korea Selatan", label: "Korea Selatan" },
                          { value: "Swedia", label: "Swedia" },
                          { value: "Uni Emirat Arab", label: "Uni Emirat Arab" },
                        ]}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                    <SpaceButton
                      variant="primary"
                      size="sm"
                      icon={<Plus size={14} />}
                      onClick={handleNewTransactionClick}
                    >
                      Input PO Baru
                    </SpaceButton>
                    <SpaceButton
                      variant="secondary"
                      size="sm"
                      icon={<FileText size={14} />}
                      onClick={() => setPoModalOpen(true)}
                    >
                      Scan PO / OCR
                    </SpaceButton>
                  </div>
                </div>

                {/* Baris 2: Segmented Status Filter & Ringkasan Hasil */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderTop: "1px solid #F1F5F9",
                    paddingTop: 10,
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                    {(["ALL", "Draft", "Confirmed", "In Transit", "Completed"] as const).map((st) => {
                      const countForSt =
                        st === "ALL"
                          ? allTransactions.length
                          : allTransactions.filter((r) => r.status === st).length;
                      const isActive = statusFilter === st;

                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => {
                            setStatusFilter(st);
                            setCurrentPage(1);
                          }}
                          style={{
                            padding: "4px 10px",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: isActive ? 600 : 500,
                            border: isActive ? "1px solid #0F172A" : "1px solid #E2E8F0",
                            background: isActive ? "#0F172A" : "#F8FAFC",
                            color: isActive ? "#FFFFFF" : "#475569",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            transition: "all 0.15s ease",
                          }}
                        >
                          <span>{st === "ALL" ? "Semua Status" : st}</span>
                          <span
                            style={{
                              padding: "1px 5px",
                              borderRadius: 99,
                              fontSize: 10,
                              fontWeight: 600,
                              background: isActive ? "rgba(255,255,255,0.2)" : "#E2E8F0",
                              color: isActive ? "#FFFFFF" : "#64748B",
                            }}
                          >
                            {countForSt}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <span style={{ fontSize: 11.5, color: "#64748B", fontWeight: 500 }}>
                    Menampilkan <strong>{filteredTransactions.length}</strong> dari {allTransactions.length} transaksi
                  </span>
                </div>
              </div>

              {/* Space DS Table */}
              {allTransactions.length === 0 ? (
                <div className="tx-empty-state">
                  <div className="tx-empty-state-icon">
                    <FileSpreadsheet size={24} />
                  </div>
                  <h4>Belum Ada Transaksi Ekspor</h4>
                  <p>Mulai dengan memindai dokumen PO atau masukkan pesanan baru secara manual.</p>
                  <SpaceButton variant="primary" icon={<Plus size={14} />} onClick={handleNewTransactionClick}>
                    Input / Scan PO Baru
                  </SpaceButton>
                </div>
              ) : (
                <div className="space-card-table-container">
                  <div className="space-table-wrap">
                    <table className="space-table" style={{ width: "100%", tableLayout: "fixed" }}>
                      <colgroup>
                        <col style={{ width: 36 }} />
                        <col style={{ width: 145 }} />
                        <col style={{ width: 185 }} />
                        <col style={{ width: 185 }} />
                        <col style={{ width: 110 }} />
                        <col style={{ width: 140 }} />
                        <col style={{ width: 95 }} />
                        <col style={{ width: 105 }} />
                      </colgroup>
                      <thead>
                        <tr>
                          <th style={{ width: 36, textAlign: "center", padding: "10px 4px" }}>
                            <SpaceCheckbox
                              label=""
                              checked={selectedIds.length > 0 && selectedIds.length === filteredTransactions.length}
                              onChange={(chk) => {
                                setSelectedIds(chk ? filteredTransactions.map((t) => t.id) : []);
                              }}
                            />
                          </th>
                          <th style={{ padding: "10px 10px", whiteSpace: "nowrap" }}>No. PO &amp; Tanggal</th>
                          <th style={{ padding: "10px 10px", whiteSpace: "nowrap" }}>Buyer &amp; Destinasi</th>
                          <th style={{ padding: "10px 10px", whiteSpace: "nowrap" }}>Komoditas &amp; HS Code</th>
                          <th style={{ textAlign: "right", padding: "10px 14px", whiteSpace: "nowrap" }}>Nilai Kontrak</th>
                          <th style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>Progress Alur</th>
                          <th style={{ padding: "10px 10px", whiteSpace: "nowrap" }}>Status</th>
                          <th style={{ textAlign: "right", padding: "10px 10px", whiteSpace: "nowrap" }}>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                      {filteredTransactions
                        .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                        .map((row) => {
                          const isCurrent =
                            (row.reference && row.reference === displayReference) ||
                            row.id === activeShipmentId;
                          const isChecked = selectedIds.includes(row.id);
                          const tone = statusTone(row.status);
                          const badgeTone = tone === "green" ? "success" : tone === "amber" ? "warning" : tone === "blue" ? "primary" : "neutral";

                          // Milestone detail & progress percentage
                          let progressPercent = 35;
                          let progressDetail = "3/7 · Kesiapan Kargo";
                          let progressTone: "success" | "primary" | "warning" = "primary";

                          if (isCurrent) {
                            progressPercent = percentCompleted;
                            progressDetail = `${completedCount}/${totalCount} Tahap`;
                          } else if (row.status === "Completed") {
                            progressPercent = 100;
                            progressDetail = "7/7 · Selesai & Lunas";
                            progressTone = "success";
                          } else if (row.status === "In Transit") {
                            progressPercent = 75;
                            progressDetail = "5/7 · Kapal Berlayar";
                            progressTone = "primary";
                          } else if (row.status === "Confirmed") {
                            progressPercent = 45;
                            progressDetail = "3/7 · Kesiapan Kargo";
                            progressTone = "primary";
                          } else if (row.status === "Draft" || row.status === "Quotation") {
                            progressPercent = 15;
                            progressDetail = "1/7 · Draf Negosiasi";
                            progressTone = "warning";
                          }

                          return (
                            <tr key={row.id} style={{ background: isCurrent ? "rgba(15, 41, 66, 0.03)" : undefined }}>
                              <td style={{ textAlign: "center", padding: "10px 6px" }}>
                                <SpaceCheckbox
                                  label=""
                                  checked={isChecked}
                                  onChange={(chk) => {
                                    setSelectedIds((prev) => (chk ? [...prev, row.id] : prev.filter((id) => id !== row.id)));
                                  }}
                                />
                              </td>
                              <td style={{ padding: "10px 10px" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "nowrap" }}>
                                    <strong style={{ color: "#0F172A", fontSize: 13, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
                                      {row.reference || "(Tanpa nomor)"}
                                    </strong>
                                    {isCurrent && <SpaceBadge tone="primary" showDot>Aktif</SpaceBadge>}
                                  </div>
                                  <small style={{ color: "#64748B", fontSize: "11px", whiteSpace: "nowrap" }}>
                                    {formatShortDate(row.updatedAt)}
                                  </small>
                                </div>
                              </td>
                              <td style={{ padding: "10px 10px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  <SpaceAvatar name={row.buyer || "Buyer"} size="sm" />
                                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                    <span style={{ fontWeight: 600, color: "#0F172A", fontSize: 13 }}>{row.buyer}</span>
                                    <span style={{ color: "#64748B", fontSize: "11.5px" }}>
                                      {row.contactPerson ? `${row.contactPerson} · ` : ""}{row.buyerCountry}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: "10px 10px" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                  <span style={{ fontWeight: 600, color: "#1E293B", fontSize: 13 }}>{row.product}</span>
                                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                                    <span
                                      style={{
                                        background: "#F1F5F9",
                                        color: "#334155",
                                        padding: "1px 6px",
                                        borderRadius: 4,
                                        fontSize: 11,
                                        fontWeight: 600,
                                      }}
                                    >
                                      {row.incoterm || "FOB"}
                                    </span>
                                    <span style={{ fontFamily: "monospace", fontSize: "11px", color: "#475569" }}>
                                      HS {row.hsCode || "0901.11.10"}
                                    </span>
                                    <span style={{ fontSize: "11px", color: "#64748B" }}>
                                      · {row.quantity} {row.unit}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td style={{ textAlign: "right", padding: "10px 14px" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-end" }}>
                                  <strong style={{ color: "#0F172A", fontSize: 13.5, fontVariantNumeric: "tabular-nums" }}>
                                    ${((row.quantity || 10) * 2850).toLocaleString("en-US")}
                                  </strong>
                                  <small style={{ color: "#64748B", fontSize: "11px" }}>
                                    @ $2,850/{row.unit || "MT"}
                                  </small>
                                </div>
                              </td>
                              <td style={{ padding: "10px 12px" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px" }}>
                                    <span style={{ color: "#334155", fontWeight: 600 }}>{progressDetail}</span>
                                    <span style={{ color: "#64748B", fontSize: "10.5px" }}>{progressPercent}%</span>
                                  </div>
                                  <div style={{ width: "100%", height: 5, background: "#E2E8F0", borderRadius: 99, overflow: "hidden" }}>
                                    <div
                                      style={{
                                        width: `${progressPercent}%`,
                                        height: "100%",
                                        borderRadius: 99,
                                        background: progressTone === "success" ? "#10B981" : progressTone === "warning" ? "#F59E0B" : "#2563EB",
                                        transition: "width 0.3s ease",
                                      }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: "10px 10px" }}>
                                <SpaceBadge tone={badgeTone as any} showDot>
                                  {row.status}
                                </SpaceBadge>
                              </td>
                              <td style={{ textAlign: "right", padding: "10px 10px", whiteSpace: "nowrap" }}>
                                <div style={{ display: "inline-flex", gap: 4, alignItems: "center", justifyContent: "flex-end" }}>
                                  <button
                                    type="button"
                                    onClick={() => void handleSwitchTransaction(row)}
                                    title="Buka alur operasional transaksi ini"
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 4,
                                      padding: "4px 8px",
                                      fontSize: 11.5,
                                      fontWeight: 600,
                                      color: "#0F172A",
                                      background: "#F1F5F9",
                                      border: "1px solid #CBD5E1",
                                      borderRadius: 6,
                                      cursor: "pointer",
                                    }}
                                  >
                                    <span>Buka</span>
                                    <ArrowRight size={12} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void handleDeleteTransaction(row)}
                                    title="Hapus transaksi dari daftar"
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      width: 26,
                                      height: 26,
                                      padding: 0,
                                      color: "#94A3B8",
                                      background: "transparent",
                                      border: "none",
                                      borderRadius: 4,
                                      cursor: "pointer",
                                    }}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>

                {/* Space DS Pagination Component */}
                <SpacePagination
                  currentPage={currentPage}
                  totalItems={filteredTransactions.length}
                  pageSize={pageSize}
                  onPageChange={(p) => setCurrentPage(p)}
                />
              </div>
            )}
            </div>
          )}

          {/* TAB 2: PAPAN KANBAN (DRAG & DROP PIPELINE) */}
          {activeTab === "kanban" && (
            <div className="space-crm-container">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <h3 style={{ margin: 0, fontSize: 16, color: "var(--space-gray-900)" }}>
                      Papan Pipeline Ekspor (7 Tahapan Alur Kesamping)
                    </h3>
                    <SpaceBadge tone="primary">Scroll Kesamping →</SpaceBadge>
                  </div>
                  <small style={{ color: "var(--space-gray-500)", display: "block", marginTop: 2 }}>
                    Geser kartu order antar kolom tahapan atau geser horizontal kesamping untuk meninjau seluruh siklus ekspor. Klik "Selesai" untuk langsung simpan ke Data Buyer.
                  </small>
                </div>
                <SpaceButton variant="primary" size="sm" icon={<Plus size={14} />} onClick={handleNewTransactionClick}>
                  Deal Baru
                </SpaceButton>
              </div>

              <div className="space-kanban-board">
                {kanbanStages.map((col) => {
                  const isCompletedCol = col.id === "completed";
                  const isLateStage = col.id === "production" || col.id === "shipping" || col.id === "contract";

                  return (
                    <div
                      key={col.id}
                      className="space-kanban-col"
                      style={{
                        borderTop: `4px solid ${col.accentColor}`,
                        background: col.bgTint,
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDrop(col.id)}
                    >
                      <div
                        className="space-kanban-col-header"
                        style={{
                          borderBottom: `1.5px solid ${col.borderColor}`,
                          paddingBottom: 8,
                        }}
                      >
                        <div className="space-kanban-col-title" style={{ gap: 8 }}>
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              background: col.accentColor,
                              display: "inline-block",
                              flexShrink: 0,
                            }}
                          />
                          <span style={{ color: "#0F172A", fontSize: 13, fontWeight: 700 }}>
                            {col.title}
                          </span>
                        </div>
                        <span
                          className="space-kanban-col-count"
                          style={{
                            background: col.badgeBg,
                            color: col.badgeText,
                            border: `1px solid ${col.borderColor}`,
                            fontWeight: 700,
                            padding: "1px 8px",
                            borderRadius: 99,
                            fontSize: 11,
                          }}
                        >
                          {col.items.length}
                        </span>
                      </div>

                      <div className="space-kanban-cards-stack">
                        {col.items.map((card) => (
                          <div
                            key={card.id}
                            className="space-kanban-card"
                            style={{
                              borderLeft: `3.5px solid ${col.accentColor}`,
                            }}
                            draggable
                            onDragStart={() => handleDragStart(card.id)}
                          >
                            <div className="space-kanban-card-head">
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  color: "#0F172A",
                                  fontFamily: "monospace",
                                }}
                              >
                                {card.ref}
                              </span>
                              <SpaceBadge tone="neutral">{card.container}</SpaceBadge>
                            </div>

                            <div className="space-kanban-card-title" style={{ color: "#0F172A", fontWeight: 700 }}>
                              {card.buyer}
                            </div>

                            <div className="space-kanban-card-meta" style={{ color: "#64748B", fontSize: "11.5px" }}>
                              <span>{card.product}</span>
                              <span>·</span>
                              <span>{card.country}</span>
                            </div>

                            <div
                              className="space-kanban-card-foot"
                              style={{
                                marginTop: 4,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <SpaceAvatar name={card.buyer} size="xs" />
                                <span className="space-kanban-card-val" style={{ fontWeight: 700, color: "#0F172A" }}>
                                  {card.value}
                                </span>
                              </div>

                              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                {isCompletedCol ? (
                                  <button
                                    type="button"
                                    onClick={() => navigate("pre_transaction")}
                                    className="space-btn space-btn-ghost space-btn-sm"
                                    style={{
                                      padding: "3px 7px",
                                      fontSize: 10.5,
                                      fontWeight: 600,
                                      color: "#047857",
                                      background: "#DCFCE7",
                                      borderRadius: 5,
                                      border: "1px solid #BBF7D0",
                                      cursor: "pointer",
                                    }}
                                    title="Kargo selesai & data tersimpan di menu Data Buyer"
                                  >
                                    Data Buyer ↗
                                  </button>
                                ) : (
                                  <>
                                    {isLateStage && (
                                      <button
                                        type="button"
                                        onClick={() => handleMarkCompleteAndSaveBuyer(card, col.id)}
                                        title="Selesai stuffing / kargo diterima buyer & otomatis simpan ke menu Data Buyer"
                                        style={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: 3,
                                          padding: "3px 7px",
                                          fontSize: 11,
                                          fontWeight: 700,
                                          background: "#ECFDF5",
                                          border: "1px solid #A7F3D0",
                                          color: "#047857",
                                          borderRadius: 5,
                                          cursor: "pointer",
                                        }}
                                      >
                                        <CheckCircle2 size={12} />
                                        <span>Selesai</span>
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      className="space-btn space-btn-ghost space-btn-sm"
                                      style={{ padding: "3px 6px", height: "auto" }}
                                      onClick={() => handleAdvanceCard(card.id, col.id)}
                                      title="Pindahkan ke tahapan berikutnya"
                                    >
                                      <ArrowRight size={13} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: KALENDER EKSPOR & JADWAL KAPAL (SPACE DS CALENDAR) */}
          {activeTab === "calendar" && (
            <div className="space-crm-container">
              <div className="space-calendar-card">
                <div className="space-calendar-nav">
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <h3 style={{ margin: 0, fontSize: 16, color: "var(--space-gray-900)" }}>
                      November 2026
                    </h3>
                    <SpaceBadge tone="primary">Bulan Ini</SpaceBadge>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <SpaceButton variant="secondary" size="sm" icon={<ChevronLeft size={14} />}>Sebelumnya</SpaceButton>
                    <SpaceButton variant="secondary" size="sm">Hari Ini</SpaceButton>
                    <SpaceButton variant="secondary" size="sm" iconRight={<ChevronRight size={14} />}>Berikutnya</SpaceButton>
                  </div>
                </div>

                <div className="space-calendar-grid">
                  {["SEN", "SEL", "RAB", "KAM", "JUM", "SAB", "MIN"].map((day) => (
                    <div key={day} className="space-calendar-day-header">{day}</div>
                  ))}

                  {/* 35 Calendar Cells */}
                  {Array.from({ length: 35 }).map((_, i) => {
                    const dateNum = i + 1;
                    const isToday = dateNum === 24;
                    return (
                      <div key={i} className={`space-calendar-cell ${isToday ? "today" : ""}`}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span className="space-calendar-date-num">{dateNum <= 30 ? dateNum : dateNum - 30}</span>
                          {isToday && <span style={{ fontSize: 9, fontWeight: 700, color: "var(--space-navy-800)" }}>HARI INI</span>}
                        </div>

                        {/* Events on specific dates */}
                        {dateNum === 5 && (
                          <div
                            className="space-calendar-event stuffing"
                            onClick={() => toast.info("Stuffing 40HC Kopi Arabika di Gudang Belawan")}
                          >
                            📦 Stuffing Kopi 40HC
                          </div>
                        )}
                        {dateNum === 12 && (
                          <div
                            className="space-calendar-event vessel"
                            onClick={() => toast.info("ETD Vessel KM Nusantara menuju Port of Tokyo")}
                          >
                            🚢 ETD KM Nusantara
                          </div>
                        )}
                        {dateNum === 18 && (
                          <div
                            className="space-calendar-event peb"
                            onClick={() => toast.info("Batas akhir submit PEB & e-SKA ke Bea Cukai")}
                          >
                            📄 Closing PEB DJBC
                          </div>
                        )}
                        {dateNum === 22 && (
                          <div
                            className="space-calendar-event finance"
                            onClick={() => toast.info("Jatuh tempo pelunasan 70% L/C Nordic Pantry")}
                          >
                            💵 Pelunasan 70% L/C
                          </div>
                        )}
                        {dateNum === 26 && (
                          <div
                            className="space-calendar-event stuffing"
                            onClick={() => toast.info("Inspeksi Karantina & Fumigasi Muatan Kayu")}
                          >
                            🔍 Uji Fumigasi Kayu
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: COMPARISON CHART & ANALITIK KINERJA EKSPOR */}
          {activeTab === "analytics" && (
            <div className="space-crm-container">
              <div className="space-chart-card">
                <div className="space-chart-header">
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, color: "var(--space-gray-900)" }}>
                      Perbandingan Realisasi Ekspor vs Target 2026
                    </h3>
                    <small style={{ color: "var(--space-gray-500)" }}>
                      Nilai transaksi bulanan per komoditas dalam USD
                    </small>
                  </div>
                  <div className="space-chart-legend">
                    <div className="space-chart-legend-item">
                      <span className="space-chart-legend-dot" style={{ background: "var(--space-navy-800)" }} />
                      <span>Realisasi Ekspor 2026</span>
                    </div>
                    <div className="space-chart-legend-item">
                      <span className="space-chart-legend-dot" style={{ background: "var(--space-gold-500)" }} />
                      <span>Target Perusahaan</span>
                    </div>
                    <div className="space-chart-legend-item">
                      <span className="space-chart-legend-dot" style={{ background: "var(--space-gray-300)" }} />
                      <span>Tahun Lalu 2025</span>
                    </div>
                  </div>
                </div>

                {/* SVG Visual Comparison Chart */}
                <div style={{ width: "100%", height: 260, position: "relative" }}>
                  <svg width="100%" height="100%" viewBox="0 0 700 240" preserveAspectRatio="none">
                    {/* Grid lines */}
                    <line x1="40" y1="30" x2="680" y2="30" stroke="#E2E8F0" strokeDasharray="3 3" />
                    <line x1="40" y1="80" x2="680" y2="80" stroke="#E2E8F0" strokeDasharray="3 3" />
                    <line x1="40" y1="130" x2="680" y2="130" stroke="#E2E8F0" strokeDasharray="3 3" />
                    <line x1="40" y1="180" x2="680" y2="180" stroke="#E2E8F0" />

                    {/* Bars for 6 months */}
                    {[
                      { m: "Mei", val: 140, tgt: 120, prev: 105, x: 70 },
                      { m: "Jun", val: 165, tgt: 140, prev: 115, x: 170 },
                      { m: "Jul", val: 180, tgt: 160, prev: 130, x: 270 },
                      { m: "Agu", val: 195, tgt: 180, prev: 145, x: 370 },
                      { m: "Sep", val: 210, tgt: 200, prev: 160, x: 470 },
                      { m: "Okt", val: 245, tgt: 220, prev: 175, x: 570 },
                    ].map((bar) => {
                      const hVal = bar.val * 0.65;
                      const hTgt = bar.tgt * 0.65;
                      const hPrev = bar.prev * 0.65;
                      return (
                        <g key={bar.m}>
                          {/* Previous year bar */}
                          <rect
                            x={bar.x}
                            y={180 - hPrev}
                            width="14"
                            height={hPrev}
                            fill="#CBD5E1"
                            rx="3"
                          />
                          {/* Target bar */}
                          <rect
                            x={bar.x + 18}
                            y={180 - hTgt}
                            width="14"
                            height={hTgt}
                            fill="#F59E0B"
                            rx="3"
                          />
                          {/* Realization bar */}
                          <rect
                            x={bar.x + 36}
                            y={180 - hVal}
                            width="14"
                            height={hVal}
                            fill="#0F2942"
                            rx="3"
                          />
                          {/* Month label */}
                          <text
                            x={bar.x + 32}
                            y="205"
                            textAnchor="middle"
                            fontSize="11"
                            fill="#64748B"
                            fontWeight="600"
                          >
                            {bar.m}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Commodity Share Breakdown */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
                  <div style={{ background: "var(--space-gray-50)", padding: 14, borderRadius: 8, border: "1px solid var(--space-gray-200)" }}>
                    <SpaceProgressBar value={42} label="Kopi Arabika Gayo" detail="$119,490 (42%)" tone="primary" />
                  </div>
                  <div style={{ background: "var(--space-gray-50)", padding: 14, borderRadius: 8, border: "1px solid var(--space-gray-200)" }}>
                    <SpaceProgressBar value={28} label="Udang Windu Beku" detail="$79,660 (28%)" tone="primary" />
                  </div>
                  <div style={{ background: "var(--space-gray-50)", padding: 14, borderRadius: 8, border: "1px solid var(--space-gray-200)" }}>
                    <SpaceProgressBar value={18} label="Organic Coconut Sugar" detail="$51,210 (18%)" tone="warning" />
                  </div>
                  <div style={{ background: "var(--space-gray-50)", padding: 14, borderRadius: 8, border: "1px solid var(--space-gray-200)" }}>
                    <SpaceProgressBar value={12} label="Mebel Kayu & Rotan" detail="$34,140 (12%)" tone="success" />
                  </div>
                </div>
              </div>
            </div>
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
