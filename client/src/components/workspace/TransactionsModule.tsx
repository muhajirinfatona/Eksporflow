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
  MapPin,
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
  Trash2,
  TrendingDown,
  TrendingUp,
  Truck,
  UserPlus,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { PoIngestionModal } from "./PoIngestionModal";
import { ExportCalendarModule } from "./ExportCalendarModule";
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
  const { locale, t } = useLanguage();
  const isEn = locale === "EN";
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
      incoterm: string;
      destinationPort?: string;
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
          incoterm: "CIF",
          destinationPort: "Jebel Ali Port",
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
          incoterm: "FOB",
          destinationPort: "Bangkok Port",
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
          incoterm: "CFR",
          destinationPort: "Rotterdam Port",
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
          incoterm: "CIF",
          destinationPort: "Gothenburg Port",
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
          incoterm: "CIF",
          destinationPort: "Yokohama Port",
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
          incoterm: "CFR",
          destinationPort: "Busan Port",
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
          incoterm: "CIF",
          destinationPort: "Rotterdam Port",
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
          incoterm: "FOB",
          destinationPort: "Singapore Port",
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

  const handleRegressCard = (cardId: string, currentColId: string) => {
    const colIdx = kanbanStages.findIndex((c) => c.id === currentColId);
    if (colIdx <= 0) return;
    const prevCol = kanbanStages[colIdx - 1];
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
        if (col.id === prevCol.id) {
          return { ...col, items: [...col.items, movedItem] };
        }
        return col;
      });
    });
    toast.info(`Dikembalikan ke ${prevCol.title}`);
  };

  const handleMarkCompleteAndSaveBuyer = (
    card: { id: string; ref: string; buyer: string; country: string; product: string; value: string; container: string; incoterm?: string; destinationPort?: string; dueDate: string; status: string },
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

    // 2. Simpan secara permanen ke Database Mitra & Kontak (flow + localStorage)
    if (flow?.addPartner) {
      flow.addPartner({
        name: card.buyer,
        country: card.country,
        destination: card.destinationPort || card.country,
        terms: `Incoterms 2020 ${card.incoterm || "CIF"} · 30% DP / 70% before shipment`,
      });
    }

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
        incoterm: card.incoterm || "CIF",
        destinationPort: card.destinationPort || card.country,
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
      if (card.incoterm) update("incoterm", card.incoterm as any);
      if (card.destinationPort) update("destination", card.destinationPort);
    }

    toast.success(`Kargo ${card.ref} Diterima Buyer (${card.incoterm || "CIF"})! Data tersimpan di Data Mitra & Kontak.`, {
      action: {
        label: "Buka Mitra & Kontak",
        onClick: () => navigate("partners"),
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
              label={isEn ? "Total export pipeline" : "Total pipeline ekspor"}
              value={`$${allTransactions.reduce((acc, t) => acc + (t.quantity * 2800 || 45000), 184500).toLocaleString("en-US")}`}
              subtext={isEn ? `${allTransactions.length} Active Contracts` : `${allTransactions.length} Kontrak Aktif`}
              trend={{ value: "14.8% MoM", isUp: true }}
              tone="navy"
              icon={<Layers size={16} />}
            />
            <SpaceStatCard
              label={isEn ? "Quotations & offers" : "Penawaran & quotation"}
              value={`$${(draftCount * 38000 || 72400).toLocaleString("en-US")}`}
              subtext={isEn ? `${draftCount} Buyer Prospects` : `${draftCount} Prospek Buyer`}
              tone="gold"
              icon={<FileText size={16} />}
            />
            <SpaceStatCard
              label={isEn ? "Production & stuffing" : "Produksi & stuffing"}
              value={isEn ? `${activeExecutionCount} Contracts` : `${activeExecutionCount} Kontrak`}
              subtext={isEn ? "4 Containers Ready to Load" : "4 Kontainer Siap Muat"}
              trend={{ value: "On-Track", isUp: true }}
              tone="purple"
              icon={<Package size={16} />}
            />
            <SpaceStatCard
              label={isEn ? "Shipment & settlement" : "Pengapalan & pelunasan"}
              value={`$${(completedTxCount * 55000 || 165000).toLocaleString("en-US")}`}
              subtext={isEn ? `${completedTxCount} Completed Orders` : `${completedTxCount} Transaksi Selesai`}
              trend={{ value: isEn ? "100% Settled" : "100% Lunas", isUp: true }}
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
                { id: "list", label: isEn ? "Orders Table (CRM)" : "Tabel Pesanan (CRM)", icon: <Layers size={14} />, count: allTransactions.length },
                { id: "kanban", label: isEn ? "Kanban Pipeline Board" : "Papan Kanban Pipeline", icon: <LayoutGrid size={14} />, count: kanbanStages.reduce((acc, s) => acc + s.items.length, 0) },
                { id: "calendar", label: isEn ? "Export Calendar" : "Kalender Ekspor", icon: <Calendar size={14} />, count: 6 },
                { id: "analytics", label: "Comparison Chart", icon: <BarChart3 size={14} /> },
                { id: "workflow", label: isEn ? `Workflow: ${displayReference || shipment.buyer || "Active Order"}` : `Alur: ${displayReference || shipment.buyer || "Pesanan Aktif"}`, icon: <Activity size={14} /> },
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
                        placeholder={isEn ? "Search PO number, buyer name, commodity, HS Code..." : "Cari nomor PO, nama buyer, komoditas, HS Code..."}
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
                          { value: "ALL", label: isEn ? "All Countries" : "Semua Negara" },
                          { value: "Amerika Serikat", label: isEn ? "United States" : "Amerika Serikat" },
                          { value: "Belanda", label: isEn ? "Netherlands" : "Belanda" },
                          { value: "Jepang", label: isEn ? "Japan" : "Jepang" },
                          { value: "Korea Selatan", label: isEn ? "South Korea" : "Korea Selatan" },
                          { value: "Swedia", label: isEn ? "Sweden" : "Swedia" },
                          { value: "Uni Emirat Arab", label: isEn ? "United Arab Emirates" : "Uni Emirat Arab" },
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
                      {isEn ? "New PO Entry" : "Input PO Baru"}
                    </SpaceButton>
                    <SpaceButton
                      variant="secondary"
                      size="sm"
                      icon={<FileText size={14} />}
                      onClick={() => setPoModalOpen(true)}
                    >
                      {isEn ? "Scan PO / OCR" : "Scan PO / OCR"}
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
                          <span>{st === "ALL" ? (isEn ? "All Statuses" : "Semua Status") : st}</span>
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
                    {isEn ? (
                      <>
                        Showing <strong>{filteredTransactions.length}</strong> of {allTransactions.length} transactions
                      </>
                    ) : (
                      <>
                        Menampilkan <strong>{filteredTransactions.length}</strong> dari {allTransactions.length} transaksi
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Space DS Table */}
              {allTransactions.length === 0 ? (
                <div className="tx-empty-state">
                  <div className="tx-empty-state-icon">
                    <FileSpreadsheet size={24} />
                  </div>
                  <h4>{isEn ? "No Export Transactions Yet" : "Belum Ada Transaksi Ekspor"}</h4>
                  <p>{isEn ? "Get started by scanning a PO document or entering a new order manually." : "Mulai dengan memindai dokumen PO atau masukkan pesanan baru secara manual."}</p>
                  <SpaceButton variant="primary" icon={<Plus size={14} />} onClick={handleNewTransactionClick}>
                    {isEn ? "Enter / Scan New PO" : "Input / Scan PO Baru"}
                  </SpaceButton>
                </div>
              ) : (
                <div className="space-card-table-container">
                  <div className="space-table-wrap">
                    <table className="space-table" style={{ width: "100%", minWidth: 1000, tableLayout: "fixed" }}>
                      <colgroup>
                        <col style={{ width: 36 }} />
                        <col style={{ width: 155 }} />
                        <col style={{ width: 200 }} />
                        <col style={{ width: 195 }} />
                        <col style={{ width: 125 }} />
                        <col style={{ width: 135 }} />
                        <col style={{ width: 95 }} />
                        <col style={{ width: 85 }} />
                      </colgroup>
                      <thead>
                        <tr>
                          <th style={{ width: 40, textAlign: "center", padding: "11px 4px" }}>
                            <SpaceCheckbox
                              label=""
                              checked={selectedIds.length > 0 && selectedIds.length === filteredTransactions.length}
                              onChange={(chk) => {
                                setSelectedIds(chk ? filteredTransactions.map((t) => t.id) : []);
                              }}
                            />
                          </th>
                          <th style={{ padding: "11px 12px", whiteSpace: "nowrap" }}>{isEn ? "PO No. & Date" : "No. PO & Tanggal"}</th>
                          <th style={{ padding: "11px 12px", whiteSpace: "nowrap" }}>{isEn ? "Buyer & Destination" : "Buyer & Destinasi"}</th>
                          <th style={{ padding: "11px 12px", whiteSpace: "nowrap" }}>{isEn ? "Commodity & HS Code" : "Komoditas & HS Code"}</th>
                          <th style={{ textAlign: "right", padding: "11px 14px", whiteSpace: "nowrap" }}>{isEn ? "Contract Value" : "Nilai Kontrak"}</th>
                          <th style={{ padding: "11px 12px", whiteSpace: "nowrap" }}>{isEn ? "Workflow Progress" : "Progress Alur"}</th>
                          <th style={{ padding: "11px 10px", whiteSpace: "nowrap" }}>Status</th>
                          <th style={{ textAlign: "right", padding: "11px 12px", whiteSpace: "nowrap" }}>{isEn ? "Action" : "Aksi"}</th>
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
                          let progressDetail = isEn ? "3/7 · Cargo Readiness" : "3/7 · Kesiapan Kargo";
                          let progressTone: "success" | "primary" | "warning" = "primary";

                          if (isCurrent) {
                            progressPercent = percentCompleted;
                            progressDetail = `${completedCount}/${totalCount} ${isEn ? "Stages" : "Tahap"}`;
                          } else if (row.status === "Completed") {
                            progressPercent = 100;
                            progressDetail = isEn ? "7/7 · Completed & Settled" : "7/7 · Selesai & Lunas";
                            progressTone = "success";
                          } else if (row.status === "In Transit") {
                            progressPercent = 75;
                            progressDetail = isEn ? "5/7 · Vessel Sailing" : "5/7 · Kapal Berlayar";
                            progressTone = "primary";
                          } else if (row.status === "Confirmed") {
                            progressPercent = 45;
                            progressDetail = isEn ? "3/7 · Cargo Readiness" : "3/7 · Kesiapan Kargo";
                            progressTone = "primary";
                          } else if (row.status === "Draft" || row.status === "Quotation") {
                            progressPercent = 15;
                            progressDetail = isEn ? "1/7 · Draft Negotiation" : "1/7 · Draf Negosiasi";
                            progressTone = "warning";
                          }

                          return (
                            <tr key={row.id} style={{ background: isCurrent ? "rgba(15, 41, 66, 0.03)" : undefined }}>
                              <td style={{ textAlign: "center", padding: "12px 4px" }}>
                                <SpaceCheckbox
                                  label=""
                                  checked={isChecked}
                                  onChange={(chk) => {
                                    setSelectedIds((prev) => (chk ? [...prev, row.id] : prev.filter((id) => id !== row.id)));
                                  }}
                                />
                              </td>
                              <td style={{ padding: "12px 12px" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                                  <strong style={{ color: "#0F172A", fontSize: 13, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
                                    {row.reference || "(Tanpa nomor)"}
                                  </strong>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "nowrap" }}>
                                    <small style={{ color: "#64748B", fontSize: "11px", whiteSpace: "nowrap" }}>
                                      {formatShortDate(row.updatedAt)}
                                    </small>
                                    {isCurrent && (
                                      <span
                                        style={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: 3.5,
                                          fontSize: "10.5px",
                                          fontWeight: 600,
                                          color: "#1D4ED8",
                                          background: "#EFF6FF",
                                          border: "1px solid #BFDBFE",
                                          padding: "0.5px 6px",
                                          borderRadius: 999,
                                          lineHeight: 1.2,
                                          whiteSpace: "nowrap",
                                          flexShrink: 0,
                                        }}
                                      >
                                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#2563EB" }} />
                                        Aktif
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: "12px 12px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                                  <div style={{ flexShrink: 0 }}>
                                    <SpaceAvatar name={row.buyer || "Buyer"} size="sm" />
                                  </div>
                                  <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0, overflow: "hidden" }}>
                                    <span
                                      title={row.buyer}
                                      style={{ fontWeight: 600, color: "#0F172A", fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                                    >
                                      {row.buyer}
                                    </span>
                                    <span
                                      title={`${row.contactPerson ? `${row.contactPerson} · ` : ""}${row.buyerCountry}`}
                                      style={{ color: "#64748B", fontSize: "11.5px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                                    >
                                      {row.contactPerson ? `${row.contactPerson} · ` : ""}{row.buyerCountry}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: "12px 12px" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                                  <span
                                    title={row.product}
                                    style={{ fontWeight: 600, color: "#1E293B", fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                                  >
                                    {row.product}
                                  </span>
                                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "nowrap", minWidth: 0 }}>
                                    <span
                                      style={{
                                        background: "#F1F5F9",
                                        color: "#334155",
                                        padding: "1px 6px",
                                        borderRadius: 4,
                                        fontSize: 11,
                                        fontWeight: 600,
                                        flexShrink: 0,
                                      }}
                                    >
                                      {row.incoterm || "FOB"}
                                    </span>
                                    <span style={{ fontFamily: "monospace", fontSize: "11px", color: "#475569", flexShrink: 0 }}>
                                      HS {row.hsCode || "0901.11.10"}
                                    </span>
                                    <span
                                      style={{ fontSize: "11px", color: "#64748B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                                    >
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
                                    title={isEn ? "Open operational workflow for this transaction" : "Buka alur operasional transaksi ini"}
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
                                    <span>{isEn ? "Open" : "Buka"}</span>
                                    <ArrowRight size={12} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void handleDeleteTransaction(row)}
                                    title={isEn ? "Delete transaction from list" : "Hapus transaksi dari daftar"}
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
                      {isEn ? "Export Pipeline Board (7 Horizontal Stages)" : "Papan Pipeline Ekspor (7 Tahapan Alur Kesamping)"}
                    </h3>
                    <SpaceBadge tone="primary">{isEn ? "Scroll Horizontally →" : "Scroll Kesamping →"}</SpaceBadge>
                  </div>
                  <small style={{ color: "var(--space-gray-500)", display: "block", marginTop: 2 }}>
                    {isEn
                      ? "Use arrow buttons [ ← ] and [ → ] on each card to shift order statuses across stages. On the Vessel Sailing stage, click [ ✓ ] Complete to finish the shipment and save to Partners & Contacts."
                      : "Gunakan tombol panah [ ← ] Mundur dan [ → ] Maju pada setiap kartu untuk memindahkan status order bolak-balik antar tahapan. Pada tahap Kapal Berlayar, klik tombol checklist [ ✓ ] Selesai untuk menyelesaikan kargo dan menyimpan ke Data Mitra & Kontrak."}
                  </small>
                </div>
                <SpaceButton variant="primary" size="sm" icon={<Plus size={14} />} onClick={handleNewTransactionClick}>
                  {isEn ? "New Deal" : "Deal Baru"}
                </SpaceButton>
              </div>

              <div className="space-kanban-board">
                {kanbanStages.map((col, colIdx) => {
                  const isCompletedCol = col.id === "completed";
                  const colDisplayTitle = isEn
                    ? col.id === "inquiry"
                      ? "1. Buyer Lead & Inquiry"
                      : col.id === "quotation"
                      ? "2. Quotation & Pricing"
                      : col.id === "negotiation"
                      ? "3. Negotiation & Samples"
                      : col.id === "contract"
                      ? "4. Contract & Down Payment"
                      : col.id === "production"
                      ? "5. Production & Stuffing"
                      : col.id === "shipping"
                      ? "6. Vessel Sailing (In Transit)"
                      : col.id === "completed"
                      ? "7. Completed & Delivered"
                      : col.title
                    : col.title;

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
                            {colDisplayTitle}
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
                            <div className="space-kanban-card-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
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
                              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <span
                                  style={{
                                    background: card.incoterm === "CIF" ? "#EFF6FF" : card.incoterm === "CFR" ? "#F5F3FF" : card.incoterm === "FOB" ? "#FEF3C7" : "#F1F5F9",
                                    color: card.incoterm === "CIF" ? "#1D4ED8" : card.incoterm === "CFR" ? "#6D28D9" : card.incoterm === "FOB" ? "#B45309" : "#334155",
                                    border: `1px solid ${card.incoterm === "CIF" ? "#BFDBFE" : card.incoterm === "CFR" ? "#DDD6FE" : card.incoterm === "FOB" ? "#FDE68A" : "#CBD5E1"}`,
                                    padding: "1px 6px",
                                    borderRadius: 4,
                                    fontSize: "10.5px",
                                    fontWeight: 700,
                                    lineHeight: 1.4,
                                  }}
                                  title={`Incoterms 2020: ${card.incoterm} (${card.destinationPort || card.country})`}
                                >
                                  {card.incoterm}
                                </span>
                                <SpaceBadge tone="neutral">{card.container}</SpaceBadge>
                              </div>
                            </div>

                            <div className="space-kanban-card-title" style={{ color: "#0F172A", fontWeight: 700, fontSize: "13px", lineHeight: 1.3 }}>
                              {card.buyer}
                            </div>

                            {/* Komoditas Barang */}
                            <div style={{ color: "#334155", fontSize: "12px", fontWeight: 500, marginTop: 3 }}>
                              {card.product}
                            </div>

                            {/* Negara & Pelabuhan Tujuan (Dedicated clean line) */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                color: "#64748B",
                                fontSize: "11px",
                                marginTop: 5,
                                background: "#F8FAFC",
                                padding: "3px 6px",
                                borderRadius: 5,
                                border: "1px solid #F1F5F9",
                              }}
                            >
                              <MapPin size={11} style={{ flexShrink: 0, color: "#64748B" }} />
                              <span style={{ fontWeight: 600, color: "#334155" }}>{card.country}</span>
                              {card.destinationPort && (
                                <>
                                  <span style={{ color: "#CBD5E1" }}>•</span>
                                  <span style={{ color: "#64748B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {card.destinationPort}
                                  </span>
                                </>
                              )}
                            </div>

                            <div
                              className="space-kanban-card-foot"
                              style={{
                                marginTop: 8,
                                paddingTop: 8,
                                borderTop: "1px solid #F1F5F9",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                                <SpaceAvatar name={card.buyer} size="xs" />
                                <span className="space-kanban-card-val" style={{ fontWeight: 700, color: "#0F172A", fontSize: "12.5px" }}>
                                  {card.value}
                                </span>
                              </div>

                              <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                                {/* Tombol Mundur (Kembali ke tahapan sebelumnya) */}
                                {colIdx > 0 && (
                                  <button
                                    type="button"
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      width: 26,
                                      height: 26,
                                      padding: 0,
                                      background: "#FFFFFF",
                                      border: "1px solid #CBD5E1",
                                      borderRadius: 5,
                                      color: "#475569",
                                      cursor: "pointer",
                                      transition: "all 0.15s ease",
                                    }}
                                    onClick={() => handleRegressCard(card.id, col.id)}
                                    title={`Kembalikan ke tahapan sebelumnya (${kanbanStages[colIdx - 1]?.title})`}
                                  >
                                    <ArrowLeft size={13} />
                                  </button>
                                )}

                                {isCompletedCol ? (
                                  <button
                                    type="button"
                                    onClick={() => navigate("partners")}
                                    style={{
                                      height: 26,
                                      padding: "0 8px",
                                      fontSize: 11,
                                      fontWeight: 600,
                                      color: "#047857",
                                      background: "#ECFDF5",
                                      borderRadius: 5,
                                      border: "1px solid #A7F3D0",
                                      cursor: "pointer",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 4,
                                      whiteSpace: "nowrap",
                                      boxShadow: "0 1px 2px rgba(4, 120, 87, 0.08)",
                                      transition: "all 0.15s ease",
                                    }}
                                    title={isEn ? "Cargo completed. Click to view buyer profile in Partners & Contacts" : "Kargo telah selesai. Klik untuk buka data buyer di menu Mitra & Kontrak"}
                                  >
                                    <UserPlus size={13} />
                                    <span>{isEn ? "Partners ↗" : "Mitra ↗"}</span>
                                  </button>
                                ) : (
                                  <>
                                    {/* Tombol Selesai (Checklist Icon) HANYA diaktifkan pada Kapal Berlayar saat kargo tiba di pelabuhan buyer */}
                                    {col.id === "shipping" && (
                                      <button
                                        type="button"
                                        onClick={() => handleMarkCompleteAndSaveBuyer(card, col.id)}
                                        title={`Selesai (Kargo tiba di ${card.destinationPort || "pelabuhan buyer"} - ${card.incoterm}). Klik untuk simpan ke Data Mitra & Kontrak.`}
                                        style={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          width: 26,
                                          height: 26,
                                          padding: 0,
                                          background: "#ECFDF5",
                                          border: "1px solid #10B981",
                                          color: "#059669",
                                          borderRadius: 5,
                                          cursor: "pointer",
                                          boxShadow: "0 1px 2px rgba(5, 150, 105, 0.12)",
                                          transition: "all 0.15s ease",
                                        }}
                                      >
                                        <Check size={14} strokeWidth={2.5} />
                                      </button>
                                    )}

                                    {/* Tombol Maju ke tahapan berikutnya */}
                                    {colIdx < kanbanStages.length - 1 && (
                                      <button
                                        type="button"
                                        style={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          width: 26,
                                          height: 26,
                                          padding: 0,
                                          background: "#FFFFFF",
                                          border: "1px solid #CBD5E1",
                                          borderRadius: 5,
                                          color: "#475569",
                                          cursor: "pointer",
                                          transition: "all 0.15s ease",
                                        }}
                                        onClick={() => handleAdvanceCard(card.id, col.id)}
                                        title={
                                          col.id === "production"
                                            ? "Selesai stuffing, kargo siap berlayar"
                                            : col.id === "contract"
                                            ? "Mulai proses produksi & stuffing"
                                            : `Pindahkan ke tahapan berikutnya (${kanbanStages[colIdx + 1]?.title})`
                                        }
                                      >
                                        <ArrowRight size={13} />
                                      </button>
                                    )}
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

          {/* TAB 3: KALENDER EKSPOR & PENJADWALAN RENCANA OPERASIONAL (SPACE DS CALENDAR & PLANNER) */}
          {activeTab === "calendar" && (
            <ExportCalendarModule
              allTransactions={allTransactions}
              onNavigate={navigate}
              onSelectBuyer={(buyer) => {
                const matched = shipmentsList.find((s) => s.buyer === buyer);
                if (matched) loadShipment(matched.id);
              }}
            />
          )}

          {/* TAB 4: COMPARISON CHART & ANALITIK KINERJA EKSPOR */}
          {activeTab === "analytics" && (
            <div className="space-crm-container" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="space-chart-card" style={{ padding: "22px 24px" }}>
                <div className="space-chart-header" style={{ marginBottom: 12 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0F172A" }}>
                      {isEn ? "Export Realization vs 2026 Target Comparison" : "Perbandingan Realisasi Ekspor vs Target 2026"}
                    </h3>
                    <small style={{ color: "#64748B", fontSize: "12.5px" }}>
                      {isEn
                        ? "Monthly transaction value per commodity in USD (May – October 2026 Period)"
                        : "Nilai transaksi bulanan per komoditas dalam USD (Periode Mei – Oktober 2026)"}
                    </small>
                  </div>
                  <div className="space-chart-legend" style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div className="space-chart-legend-item" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "12px", color: "#334155" }}>
                      <span className="space-chart-legend-dot" style={{ background: "#2563EB", width: 10, height: 10, borderRadius: 3 }} />
                      <span style={{ fontWeight: 600 }}>{isEn ? "2026 Export Realization" : "Realisasi Ekspor 2026"}</span>
                    </div>
                    <div className="space-chart-legend-item" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "12px", color: "#334155" }}>
                      <span className="space-chart-legend-dot" style={{ background: "#059669", width: 10, height: 10, borderRadius: 3 }} />
                      <span style={{ fontWeight: 600 }}>{isEn ? "Company Target" : "Target Perusahaan"}</span>
                    </div>
                    <div className="space-chart-legend-item" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "12px", color: "#334155" }}>
                      <span className="space-chart-legend-dot" style={{ background: "#94A3B8", width: 10, height: 10, borderRadius: 3 }} />
                      <span style={{ fontWeight: 600 }}>{isEn ? "Previous Year 2025" : "Tahun Lalu 2025"}</span>
                    </div>
                  </div>
                </div>

                {/* SVG Visual Comparison Chart with Harmonious Professional Fintech Palette */}
                <div style={{ width: "100%", height: 260, position: "relative", background: "#FAFBFD", borderRadius: 8, padding: "10px 14px", border: "1px solid #F1F5F9" }}>
                  <svg width="100%" height="100%" viewBox="0 0 720 230" preserveAspectRatio="none">
                    {/* Y-Axis Value Labels & Grid Lines */}
                    {[
                      { y: 30, val: "$250k" },
                      { y: 75, val: "$200k" },
                      { y: 120, val: "$150k" },
                      { y: 165, val: "$100k" },
                      { y: 200, val: "$0" },
                    ].map((g) => (
                      <g key={g.val}>
                        <line x1="55" y1={g.y} x2="700" y2={g.y} stroke="#E2E8F0" strokeDasharray={g.y === 200 ? "none" : "3 3"} />
                        <text x="48" y={g.y + 4} textAnchor="end" fontSize="10.5" fill="#94A3B8" fontWeight="600">
                          {g.val}
                        </text>
                      </g>
                    ))}

                    {/* Bars for 6 months */}
                    {[
                      { m: isEn ? "May" : "Mei", val: 140, tgt: 120, prev: 105, x: 80 },
                      { m: "Jun", val: 165, tgt: 140, prev: 115, x: 185 },
                      { m: "Jul", val: 180, tgt: 160, prev: 130, x: 290 },
                      { m: isEn ? "Aug" : "Agu", val: 195, tgt: 180, prev: 145, x: 395 },
                      { m: "Sep", val: 210, tgt: 200, prev: 160, x: 500 },
                      { m: isEn ? "Oct" : "Okt", val: 245, tgt: 220, prev: 175, x: 605 },
                    ].map((bar) => {
                      const hVal = bar.val * 0.65;
                      const hTgt = bar.tgt * 0.65;
                      const hPrev = bar.prev * 0.65;
                      const baseY = 200;
                      return (
                        <g key={bar.m}>
                          {/* Previous year bar (Neutral Slate) */}
                          <rect
                            x={bar.x}
                            y={baseY - hPrev}
                            width="14"
                            height={hPrev}
                            fill="#CBD5E1"
                            rx="3"
                          >
                            <title>{isEn ? `Previous Year 2025 (${bar.m}): $${bar.prev},000` : `Tahun Lalu 2025 (${bar.m}): $${bar.prev},000`}</title>
                          </rect>

                          {/* Target bar (Emerald Green) */}
                          <rect
                            x={bar.x + 17}
                            y={baseY - hTgt}
                            width="14"
                            height={hTgt}
                            fill="#059669"
                            rx="3"
                          >
                            <title>{isEn ? `Company Target (${bar.m}): $${bar.tgt},000` : `Target Perusahaan (${bar.m}): $${bar.tgt},000`}</title>
                          </rect>

                          {/* Realization bar (Modern Tech Royal Blue) */}
                          <rect
                            x={bar.x + 34}
                            y={baseY - hVal}
                            width="14"
                            height={hVal}
                            fill="#2563EB"
                            rx="3"
                          >
                            <title>{isEn ? `2026 Export Realization (${bar.m}): $${bar.val},000` : `Realisasi Ekspor 2026 (${bar.m}): $${bar.val},000`}</title>
                          </rect>

                          {/* Value tag above Realization bar */}
                          <text
                            x={bar.x + 41}
                            y={baseY - hVal - 5}
                            textAnchor="middle"
                            fontSize="9.5"
                            fill="#1D4ED8"
                            fontWeight="700"
                          >
                            ${bar.val}k
                          </text>

                          {/* Month label */}
                          <text
                            x={bar.x + 32}
                            y={baseY + 18}
                            textAnchor="middle"
                            fontSize="11.5"
                            fill="#475569"
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
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginTop: 4 }}>
                  <div style={{ background: "#F8FAFC", padding: 14, borderRadius: 8, border: "1px solid #E2E8F0" }}>
                    <SpaceProgressBar value={42} label={isEn ? "Gayo Arabica Coffee" : "Kopi Arabika Gayo"} detail="$119,490 (42%)" tone="primary" />
                  </div>
                  <div style={{ background: "#F8FAFC", padding: 14, borderRadius: 8, border: "1px solid #E2E8F0" }}>
                    <SpaceProgressBar value={28} label={isEn ? "Frozen Black Tiger Shrimp" : "Udang Windu Beku"} detail="$79,660 (28%)" tone="success" />
                  </div>
                  <div style={{ background: "#F8FAFC", padding: 14, borderRadius: 8, border: "1px solid #E2E8F0" }}>
                    <SpaceProgressBar value={18} label="Organic Coconut Sugar" detail="$51,210 (18%)" tone="primary" />
                  </div>
                  <div style={{ background: "#F8FAFC", padding: 14, borderRadius: 8, border: "1px solid #E2E8F0" }}>
                    <SpaceProgressBar value={12} label={isEn ? "Wood & Rattan Furniture" : "Mebel Kayu & Rotan"} detail="$34,140 (12%)" tone="success" />
                  </div>
                </div>

                {/* EXECUTIVE CONCLUSION & CHART ANALYSIS (KESIMPULAN TERKAIT GRAFIK) */}
                <div
                  style={{
                    marginTop: 8,
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: 10,
                    padding: "18px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <TrendingUp size={18} color="#2563EB" />
                      <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0F172A" }}>
                        {isEn ? "Summary & Performance Analysis of 2026 Export Realization" : "Kesimpulan & Analisis Kinerja Realisasi Ekspor 2026"}
                      </h4>
                    </div>
                    <SpaceBadge tone="primary">{isEn ? "Semester II Evaluation (May - October 2026)" : "Evaluasi Semester II (Mei - Oktober 2026)"}</SpaceBadge>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
                    {/* Insight 1: Ketercapaian Target */}
                    <div style={{ background: "#FFFFFF", padding: "14px 16px", borderRadius: 8, border: "1px solid #E2E8F0" }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: "#059669", display: "flex", alignItems: "center", gap: 6 }}>
                        <CheckCircle2 size={15} /> {isEn ? "1. Consistent Target Outperformance (+11.3%)" : "1. Realisasi Konsisten Melampaui Target (+11.3%)"}
                      </span>
                      <p style={{ margin: "6px 0 0 0", fontSize: 12, color: "#475569", lineHeight: 1.5 }}>
                        {isEn
                          ? "Total cumulative realization reached $1,135,000 USD, surpassing the corporate target ($1,020,000 USD). October recorded the highest monthly performance ($245,000 USD) driven by increased order volume from Marubeni Specialty and Van Dijk Furniture."
                          : "Total realisasi kumulatif mencapai $1,135,000 USD melampaui target korporasi ($1,020,000 USD). Bulan Oktober mencatat rekor tertinggi ($245,000 USD) berkat peningkatan volume pesanan dari Marubeni Specialty dan Van Dijk Furniture."}
                      </p>
                    </div>

                    {/* Insight 2: Pertumbuhan YoY */}
                    <div style={{ background: "#FFFFFF", padding: "14px 16px", borderRadius: 8, border: "1px solid #E2E8F0" }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: "#2563EB", display: "flex", alignItems: "center", gap: 6 }}>
                        <TrendingUp size={15} /> {isEn ? "2. Significant Year-on-Year Growth (+36.7% YoY)" : "2. Pertumbuhan Signifikan Tahunan (+36.7% YoY)"}
                      </span>
                      <p style={{ margin: "6px 0 0 0", fontSize: 12, color: "#475569", lineHeight: 1.5 }}>
                        {isEn
                          ? "Compared to the same period in 2025 ($830,000 USD), exports surged by +$305,000 USD, propelled by coffee supply stability and new buyer route expansions in the Netherlands and South Korea."
                          : "Dibandingkan periode yang sama pada tahun 2025 ($830,000 USD), ekspor melonjak +$305,000 USD didorong oleh stabilitas pasokan komoditas kopi dan ekspansi rute buyer baru di Belanda dan Korea Selatan."}
                      </p>
                    </div>

                    {/* Insight 3: Rekomendasi Strategis */}
                    <div style={{ background: "#FFFFFF", padding: "14px 16px", borderRadius: 8, border: "1px solid #E2E8F0" }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: "#0284C7", display: "flex", alignItems: "center", gap: 6 }}>
                        <Package size={15} /> {isEn ? "3. Leading Commodities & Q4 Recommendations" : "3. Komoditas Unggulan & Rekomendasi Q4"}
                      </span>
                      <p style={{ margin: "6px 0 0 0", fontSize: 12, color: "#475569", lineHeight: 1.5 }}>
                        {isEn
                          ? "Gayo Arabica Coffee (42%) and Frozen Black Tiger Shrimp (28%) account for 70% of total revenue. Securing early reefer and 40HC container allocations is recommended to hedge against year-end freight rate increases."
                          : "Kopi Arabika Gayo (42%) dan Udang Windu Beku (28%) menyumbang 70% total omzet. Disarankan segera mengamankan alokasi kontainer reefer dan 40HC lebih awal guna mengantisipasi kenaikan freight rate akhir tahun."}
                      </p>
                    </div>
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
                        {displayReference || shipment.poNumber || (isEn ? "Active Order" : "Pesanan Aktif")}
                      </span>
                      <span className="tab-badge">{shipment.incoterm || "FOB"}</span>
                      <StatusPill tone={statusTone(shipment.shipmentStatus)}>
                        {shipment.shipmentStatus}
                      </StatusPill>
                    </div>
                    <span className="active-order-buyer-name">
                      {shipment.buyer || (isEn ? "Buyer Not Assigned" : "Buyer Belum Ditentukan")}
                    </span>
                    <span className="active-order-buyer-meta">
                      {shipment.buyerCountry || "-"} · {shipment.destination || (isEn ? "Destination Port -" : "Pelabuhan Tujuan -")} · {shipment.product || (isEn ? "Commodity" : "Komoditas")}
                    </span>
                  </div>
                </div>

                <div className="active-order-summary-stats">
                  <div className="active-order-stat-item">
                    <span className="active-order-stat-label">{isEn ? "Export Workflow Progress" : "Progress Alur Ekspor"}</span>
                    <span
                      className="active-order-stat-val"
                      style={{ color: percentCompleted === 100 ? "var(--mint)" : "var(--brand-primary)" }}
                    >
                      {completedCount}/{totalCount} {isEn ? "Stages" : "Tahap"} ({percentCompleted}%)
                    </span>
                  </div>
                  <button
                    type="button"
                    className="ghost-button"
                    style={{ fontSize: "12px", padding: "6px 12px" }}
                    onClick={() => setIsEditingActiveOrder(!isEditingActiveOrder)}
                    title={isEn ? "Toggle form to edit active order parameters" : "Buka atau tutup form untuk mengubah parameter order aktif"}
                  >
                    <Pencil size={13} /> {isEditingActiveOrder ? (isEn ? "Close Parameter Edit" : "Tutup Edit Parameter") : (isEn ? "Edit PO Parameters" : "Ubah Parameter PO")}
                  </button>
                  <button
                    type="button"
                    className="save-button"
                    style={{ fontSize: "12px", padding: "6px 12px" }}
                    onClick={() => void handleSaveShipmentWithLocal()}
                    disabled={saveState === "saving"}
                    title={isEn ? "Save changes to cloud" : "Simpan perubahan transaksi ini ke cloud"}
                  >
                    <Save size={13} /> {saveState === "saving" ? (isEn ? "Saving..." : "Menyimpan...") : (isEn ? "Save" : "Simpan")}
                  </button>
                </div>
              </div>

              {/* Form Parameter yang Bisa Di-Expand/Collapse Jika Perlu Diedit */}
              {isEditingActiveOrder && (
                <section className="panel panel-padding active-order-card" style={{ marginBottom: "14px" }}>
                  <div className="panel-head">
                    <div>
                      <span className="eyebrow">{isEn ? "ACTIVE PO PARAMETERS" : "PARAMETER PO AKTIF"}</span>
                      <h3>{isEn ? "Transaction Data Adjustment" : "Penyesuaian Data Transaksi"}</h3>
                    </div>

                    <div className="active-order-header-actions">
                      <button
                        type="button"
                        className="save-button"
                        onClick={() => setPoModalOpen(true)}
                        title={isEn ? "Scan and extract data automatically from buyer PO or LOI document" : "Pindai dan ekstrak data otomatis dari dokumen PO atau LOI buyer"}
                        style={{ padding: "6px 12px", fontSize: "12px" }}
                      >
                        <FileSpreadsheet size={13} /> {isEn ? "Scan Document" : "Scan Dokumen"}
                      </button>
                      <button
                        type="button"
                        className="ghost-button select-partner-btn"
                        onClick={() => navigate("partners")}
                        title={isEn ? "Select from saved buyer partner directory" : "Pilih dari daftar mitra buyer tersimpan"}
                        style={{ padding: "6px 12px", fontSize: "12px" }}
                      >
                        <Users size={13} /> {isEn ? "Partners" : "Mitra"}
                      </button>
                    </div>
                  </div>

                  <div className="profile-grid">
                    <Field
                      label={isEn ? "PO / Transaction Number" : "Nomor PO / Transaksi"}
                      value={displayReference}
                      placeholder={isEn ? "e.g., PO-001, INV-2026/01" : "Contoh: PO-001, INV-2026/01"}
                      onChange={(value) => update("reference", value)}
                    />

                    <Field
                      label={isEn ? "Buyer Name" : "Nama Buyer (Pembeli)"}
                      value={shipment.buyer}
                      placeholder={isEn ? "Foreign buyer company name" : "Nama perusahaan pembeli luar negeri"}
                      onChange={(value) => update("buyer", value)}
                    />

                    <Field
                      label={isEn ? "Destination Country" : "Negara Tujuan"}
                      value={shipment.buyerCountry}
                      placeholder={isEn ? "e.g., Japan, Germany, USA" : "Contoh: Jepang, Jerman, AS"}
                      onChange={(value) => update("buyerCountry", value)}
                    />

                    <Field
                      label={isEn ? "Port of Destination (POD)" : "Pelabuhan Tujuan"}
                      value={shipment.destination}
                      placeholder={isEn ? "e.g., Port of Tokyo, Rotterdam" : "Contoh: Port of Tokyo"}
                      onChange={(value) => update("destination", value)}
                    />

                    <Field
                      label={isEn ? "Exporter Name" : "Nama Eksportir"}
                      value={shipment.exporter}
                      placeholder={isEn ? "Your company name" : "Nama perusahaan Anda"}
                      onChange={(value) => update("exporter", value)}
                    />

                    <Field
                      label="HS Code"
                      value={shipment.hsCode}
                      placeholder={isEn ? "e.g., 0901.11" : "Contoh: 0901.11"}
                      onChange={(value) => update("hsCode", value)}
                    />

                    <SelectField
                      label={isEn ? "Lifecycle Transaction Status" : "Status Siklus Transaksi"}
                      value={shipment.shipmentStatus}
                      onChange={(val) => {
                        const nextStatus = val as ShipmentStatus;
                        update("shipmentStatus", nextStatus);
                        saveToLocalList({ ...shipment, shipmentStatus: nextStatus }, nextStatus);
                      }}
                    >
                      <option value="Draft">{isEn ? "Draft (Initial Planning / Draft Phase)" : "Draft (Tahap Perencanaan / Draf Awal)"}</option>
                      <option value="Quotation">{isEn ? "Quotation (Official Quotation to Buyer)" : "Quotation (Fase Penawaran Resmi ke Buyer)"}</option>
                      <option value="Confirmed">{isEn ? "Confirmed (PO / Sales Contract Agreed)" : "Confirmed (PO / Kontrak Disepakati)"}</option>
                      <option value="Ready to Ship">{isEn ? "Ready to Ship (Cargo Ready in Warehouse)" : "Ready to Ship (Kargo Siap di Gudang)"}</option>
                      <option value="Booked">{isEn ? "Booked (Vessel / Carrier Booking Confirmed)" : "Booked (Booking Kapal / Pelayaran Terbit)"}</option>
                      <option value="Stuffing">{isEn ? "Stuffing (Cargo Loading into Container)" : "Stuffing (Pemuatan Kargo ke Kontainer)"}</option>
                      <option value="Departed">{isEn ? "Departed (Vessel Departed Port)" : "Departed (Kapal Berangkat dari Pelabuhan)"}</option>
                      <option value="In Transit">{isEn ? "In Transit (Vessel Sailing to Destination)" : "In Transit (Dalam Pelayaran ke Negara Tujuan)"}</option>
                      <option value="Completed">{isEn ? "Completed (Delivered & Transaction Completed)" : "Completed (Tiba di Buyer & Transaksi Selesai)"}</option>
                    </SelectField>
                  </div>
                </section>
              )}

              {/* Rel Navigasi Antar Modul Terintegrasi */}
              <div className="connection-rail" style={{ marginBottom: "14px" }}>
                <div className="rail-chips">
                  <button type="button" className="rail-chip" onClick={() => navigate("pricing")}>
                    <Calculator size={13} />
                    <span>{isEn ? "Pricing & Costing" : "Harga & Order"}</span>
                  </button>
                  <button type="button" className="rail-chip" onClick={() => navigate("documents")}>
                    <FileText size={13} />
                    <span>{isEn ? "Export Documents" : "Dokumen Ekspor"}</span>
                  </button>
                  <button type="button" className="rail-chip" onClick={() => navigate("cargo")}>
                    <Package size={13} />
                    <span>{isEn ? "Load Plan" : "Rencana Muatan"}</span>
                  </button>
                  <button type="button" className="rail-chip" onClick={() => navigate("risk")}>
                    <ShieldAlert size={13} />
                    <span>Risk Center</span>
                  </button>
                </div>
                <span className="rail-status">{isEn ? "Auto sync" : "Sinkron otomatis"}</span>
              </div>

              {/* ALUR OPERASIONAL EKSPOR TERINTEGRASI (8 TAHAP) */}
              <section className="panel panel-padding clean-workflow-card">
                <div className="clean-workflow-head">
                  <div>
                    <span className="eyebrow">{isEn ? "EXPORT OPERATIONAL WORKFLOW" : "ALUR OPERASIONAL EKSPOR"}</span>
                    <h3>{isEn ? `Transaction Workflow (${workflow.incoterm})` : `Alur Transaksi (${workflow.incoterm})`}</h3>
                  </div>
                  <div className="clean-workflow-progress">
                    <span className="clean-workflow-count">
                      {isEn ? (
                        <>
                          <b>{completedCount}</b> of {totalCount} stages completed ({percentCompleted}%)
                        </>
                      ) : (
                        <>
                          <b>{completedCount}</b> dari {totalCount} tahap selesai ({percentCompleted}%)
                        </>
                      )}
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
                      <strong>{isEn ? "Buyer Coordination:" : "Koordinasi Buyer:"}</strong> {workflow.coordinationTip}
                    </span>
                  </div>
                )}

                {/* Daftar Tahapan Rapi, Bersih & Minimalis */}
                <div className="clean-stage-list">
                  {workflow.stages.map((stage) => {
                    const translatedTitle = isEn
                      ? stage.title === "Kontrak Penjualan & Buyer"
                        ? "Sales Contract & Buyer Profile"
                        : stage.title === "Pembayaran Uang Muka (DP)"
                        ? "Down Payment / Advance Settlement"
                        : stage.title === "Kesiapan Barang di Gudang"
                        ? "Warehouse Cargo Readiness"
                        : stage.title === "Kesiapan Mutu & Kemasan"
                        ? "Quality & Packaging Readiness"
                        : stage.title === "Kesiapan Mutu & Sertifikasi"
                        ? "Quality & Certification Compliance"
                        : stage.title === "Muatan Kontainer & Truk ke Pelabuhan"
                        ? "Container Stowage & Port Drayage"
                        : stage.title === "Kepabeanan (PEB) & Muat ke Kapal"
                        ? "Customs Export (PEB) & Vessel Load"
                        : stage.title === "Kepabeanan Ekspor (PEB) & Serah Carrier"
                        ? "Export Customs & Carrier Handover"
                        : stage.title === "Booking Kapal Laut (Ocean Freight)"
                        ? "Ocean Carrier Booking"
                        : stage.title === "Pengapalan Laut & Asuransi Kargo"
                        ? "Ocean Freight & Cargo Insurance"
                        : stage.title === "Pengapalan Laut & Asuransi"
                        ? "Ocean Shipping & Transit Insurance"
                        : stage.title === "Pengantaran ke Alamat Buyer"
                        ? "Delivery to Buyer Destination"
                        : stage.title === "Kepabeanan Impor & Antar Gudang"
                        ? "Import Clearance & Final Delivery"
                        : stage.title === "Dokumen Penyerahan & Invoice"
                        ? "Handover Documents & Invoice"
                        : stage.title === "Dokumen Ekspor & e-SKA"
                        ? "Export Documents & COO (e-SKA)"
                        : stage.title === "Dokumen Ekspor & Invoice"
                        ? "Export Documents & Commercial Invoice"
                        : stage.title === "Pelunasan Pembayaran Akhir"
                        ? "Final Payment Settlement"
                        : stage.title
                      : stage.title;

                    return (
                      <div
                        key={stage.id}
                        className="clean-stage-row"
                        onClick={() => navigate(stage.targetScreen)}
                        title={isEn ? "Click to open relevant module" : "Klik untuk membuka modul terkait"}
                      >
                        <div className={`clean-stage-dot ${stage.isDone ? "done" : ""}`}>
                          {stage.isDone ? <Check size={12} strokeWidth={3} /> : stage.number}
                        </div>

                        <div className="clean-stage-info">
                          <span className="clean-stage-title">{translatedTitle}</span>
                          <span className="clean-stage-meta">{stage.meta}</span>
                        </div>

                        <div className="clean-stage-status">
                          <span className={`clean-stage-pill ${stage.isDone ? "done" : "pending"}`}>
                            {stage.isDone ? (isEn ? "Done" : "Selesai") : (isEn ? "Action Needed" : "Perlu Dilengkapi")}
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
                      <FileText size={14} className="text-slate-600" />
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
              label={isEn ? "PO / Transaction Number" : "Nomor PO / Transaksi"}
              value={displayReference}
              placeholder={isEn ? "e.g., PO-001, INV-2026/01" : "Contoh: PO-001, INV-2026/01"}
              onChange={(value) => update("reference", value)}
            />

            <Field
              label={isEn ? "Buyer Name" : "Nama Buyer (Pembeli)"}
              value={shipment.buyer}
              placeholder={isEn ? "Foreign buyer company name" : "Nama perusahaan pembeli luar negeri"}
              onChange={(value) => update("buyer", value)}
            />

            <Field
              label={isEn ? "Destination Country" : "Negara Tujuan"}
              value={shipment.buyerCountry}
              placeholder={isEn ? "e.g., Japan, Germany, UAE" : "Contoh: Jepang, Jerman, Uni Emirat Arab"}
              onChange={(value) => update("buyerCountry", value)}
            />

            <Field
              label={isEn ? "Port of Destination (POD)" : "Pelabuhan Tujuan (POD)"}
              value={shipment.destination}
              placeholder={isEn ? "e.g., Port of Tokyo, Jebel Ali Port" : "Contoh: Port of Tokyo, Jebel Ali Port"}
              onChange={(value) => update("destination", value)}
            />

            <Field
              label={isEn ? "Exporter Name" : "Nama Eksportir"}
              value={shipment.exporter}
              placeholder={isEn ? "Your company name" : "Nama perusahaan Anda"}
              onChange={(value) => update("exporter", value)}
            />

            <Field
              label="HS Code"
              value={shipment.hsCode}
              placeholder={isEn ? "e.g., 0901.11" : "Contoh: 0901.11"}
              onChange={(value) => update("hsCode", value)}
            />

            <SelectField
              label={isEn ? "Agreed Incoterm" : "Incoterm Yang Disepakati"}
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
              label={isEn ? "Initial Transaction Status" : "Status Transaksi Awal"}
              value={shipment.shipmentStatus}
              onChange={(val) => update("shipmentStatus", val as ShipmentStatus)}
            >
              <option value="Draft">{isEn ? "Draft (Planning / Preliminary Stage)" : "Draft (Tahap Perencanaan / Penjajakan)"}</option>
              <option value="Quotation">{isEn ? "Quotation (Quotation Pricing Phase)" : "Quotation (Fase Penawaran Harga)"}</option>
              <option value="Confirmed">{isEn ? "Confirmed (Official PO Received from Buyer)" : "Confirmed (PO Resmi Diterima dari Buyer)"}</option>
              <option value="Booked">{isEn ? "Booked (Carrier / Vessel Booking Obtained)" : "Booked (Booking Kapal Sudah Didapat)"}</option>
            </SelectField>
          </div>

          {/* Footer Aksi Pendaftaran PO Baru ke Pipeline Ekspor */}
          <div className="intake-action-footer" style={{ marginTop: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="status-pill status-pill-info">{shipment.shipmentStatus || "Draft"}</span>
              <small style={{ color: "var(--muted)" }}>
                {displayReference ? `PO: ${displayReference}` : (isEn ? "PO number not filled" : "Nomor PO belum diisi")} · {shipment.buyer || (isEn ? "Buyer name not filled" : "Nama buyer belum diisi")}
              </small>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <button
                type="button"
                className="ghost-button"
                onClick={handleResetForm}
                title={isEn ? "Clear form" : "Kosongkan formulir"}
              >
                <RefreshCw size={13} /> {isEn ? "Clear Form" : "Kosongkan Form"}
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={() => navigate("transactions")}
              >
                {isEn ? "Cancel" : "Batal"}
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={handleSaveDraft}
                title={isEn ? "Save as local draft" : "Simpan sebagai draft lokal"}
              >
                <FileText size={14} /> {isEn ? "Save Draft" : "Simpan Draft"}
              </button>
              <button
                type="button"
                className="save-button"
                onClick={() => void handleActivateNewPo()}
                title={isEn ? "Register this order to export orders list" : "Daftarkan pesanan ini ke daftar pesanan ekspor"}
                style={{ padding: "8px 18px", fontSize: "13px" }}
              >
                <CheckCircle2 size={15} /> {isEn ? "Register Order" : "Daftarkan Pesanan"}
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
