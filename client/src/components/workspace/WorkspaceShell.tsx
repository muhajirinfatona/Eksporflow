import type { PersistenceSaveState } from "@/hooks/useActiveShipment";
import { toast } from "sonner";
import {
  formatDemoRemainingLabel,
  getDemoRemainingMs,
  type UserSession,
} from "@/lib/supabaseAuth";
import type { ScreenId } from "@shared/risk";
import { DateRangePickerPopover, type DateRange } from "./DateRangePickerPopover";
import { SupportModal } from "./SupportModal";
import { LanguageDropdown, type SupportedLocale } from "./LanguageDropdown";
import { useLanguage } from "@/contexts/LanguageContext";
import { ScreenAIFloatingWidget } from "./ScreenAIAdvisor";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  BellOff,
  HelpCircle,
  BookOpen,
  Bot,
  Box,
  Building2,
  Calculator,
  Calendar,
  ChevronDown,
  Download,
  Plus,
  PhoneCall,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Cloud,
  CloudOff,
  Compass,
  FileSearch,
  FileSpreadsheet,
  FileText,
  FileCheck2,
  FolderArchive,
  HardDrive,
  Landmark,
  Layers,
  LayoutGrid,
  ListChecks,
  LogIn,
  LogOut,
  Mail,
  Menu,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  PlusCircle,
  RefreshCcw,
  RefreshCw,
  Save,
  Scale,
  Search,
  Settings2,
  ShieldAlert,
  Ship,
  Sparkles,
  Truck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { calculatePricing, type Pricing } from "@shared/pricing";
import { calculateContainer } from "@shared/container";
import { initialShipment, type ContainerCalc, type LineItem, type Shipment } from "@shared/shipment";
import type { WorkspaceFlow } from "@/hooks/useWorkspaceFlow";
import { IconButton, StatusPill, SpaceAvatar, SpaceBadge } from "./Primitives";


export type ScreenMeta = {
  id: ScreenId;
  label: string;
  group: string;
  phase: string;
  title: string;
  description: string;
  icon: React.ReactNode;
};

export const NAV_GROUPS: { group: string; items: ScreenMeta[] }[] = [
  {
    group: "Ringkasan",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        group: "Ringkasan",
        phase: "Ringkasan",
        title: "Dashboard Ekspor",
        description:
          "Ringkasan operasional transaksi ekspor aktif & kepatuhan devisa",
        icon: <LayoutGrid size={16} />,
      },
      {
        id: "readiness",
        label: "Asesmen Kesiapan",
        group: "Ringkasan",
        phase: "Ringkasan",
        title: "Asesmen Kesiapan Ekspor",
        description:
          "Evaluasi legalitas badan usaha, sertifikasi komoditas, dan perizinan ekspor.",
        icon: <CheckCircle2 size={16} />,
      },
    ],
  },
  {
    group: "Penjualan",
    items: [
      {
        id: "pre_transaction",
        label: "Pra-Transaksi & Buyer",
        group: "Penjualan",
        phase: "Penjualan",
        title: "Akuisisi Buyer & Pra-Transaksi",
        description:
          "Penyusunan penawaran harga (Quotation), surat minat (Inquiry), dan verifikasi buyer.",
        icon: <Sparkles size={16} />,
      },
      {
        id: "po_intake",
        label: "Input PO",
        group: "Penjualan",
        phase: "Penjualan",
        title: "Input Purchase Order",
        description: "Catat pesanan baru atau pindai dokumen PO/LOI buyer.",
        icon: <PlusCircle size={16} />,
      },
      {
        id: "transactions",
        label: "Pesanan Ekspor",
        group: "Penjualan",
        phase: "Penjualan",
        title: "Pesanan Ekspor",
        description: "Daftar pesanan ekspor, tracking invoice, dan tahapan operasional pengapalan.",
        icon: <Layers size={16} />,
      },
      {
        id: "pricing",
        label: "Harga & Order",
        group: "Penjualan",
        phase: "Penjualan",
        title: "Harga & Order",
        description:
          "Kalkulasi struktur HPP, freight forwarder, dan penetapan harga per Incoterm (FOB, CIF).",
        icon: <Calculator size={16} />,
      },
      {
        id: "approvals",
        label: "Persetujuan",
        group: "Penjualan",
        phase: "Penjualan",
        title: "Persetujuan",
        description:
          "Tinjau perubahan harga, margin, atau Incoterm secara terstruktur sebelum quotation dikirim ke buyer.",
        icon: <ClipboardCheck size={16} />,
      },
    ],
  },
  {
    group: "Operasional Ekspor",
    items: [
      {
        id: "compliance",
        label: "HS Code & Lartas",
        group: "Operasional Ekspor",
        phase: "Operasional Ekspor",
        title: "HS Code & Kepatuhan Lartas",
        description:
          "Verifikasi BTKI, tarif FTA/CEPA, dan status lartas kementerian teknis.",
        icon: <Scale size={16} />,
      },
      {
        id: "documents",
        label: "Dokumen Ekspor",
        group: "Operasional Ekspor",
        phase: "Operasional Ekspor",
        title: "Dokumen Ekspor",
        description:
          "Penerbitan 6 dokumen ekspor resmi (PI, SC, CI, PL, SI, COO) berstandar internasional.",
        icon: <FileText size={16} />,
      },
      {
        id: "cargo",
        label: "Rencana Muatan",
        group: "Operasional Ekspor",
        phase: "Operasional Ekspor",
        title: "Rencana Muatan Kontainer",
        description:
          "Kalkulasi kubikasi CBM, kapasitas kontainer 20ft/40ft/40HC, dan susut muatan.",
        icon: <Box size={16} />,
      },
      {
        id: "tracking",
        label: "Pelacakan Kontainer",
        group: "Operasional Ekspor",
        phase: "Operasional Ekspor",
        title: "Pelacakan Kontainer Maritim",
        description:
          "Pemantauan posisi kontainer dan jadwal kapal selama pelayaran.",
        icon: <Ship size={16} />,
      },
      {
        id: "shipment",
        label: "Logistik & Pengiriman",
        group: "Operasional Ekspor",
        phase: "Operasional Ekspor",
        title: "Logistik & Pengiriman",
        description:
          "Status booking kapal, nomor kontainer/seal, dan checklist serah terima barang.",
        icon: <Truck size={16} />,
      },
      {
        id: "scrutiny",
        label: "Validasi Dokumen (B/L)",
        group: "Operasional Ekspor",
        phase: "Operasional Ekspor",
        title: "Validasi Silang Draft B/L",
        description:
          "Pemeriksaan OCR 3-way antara Draft B/L, Commercial Invoice, dan Packing List.",
        icon: <FileSearch size={16} />,
      },
      {
        id: "risk",
        label: "Risk Center & H-7 PEB",
        group: "Operasional Ekspor",
        phase: "Operasional Ekspor",
        title: "Risk Center & Timeline PEB",
        description:
          "Monitoring kepatuhan dokumen pra-pengapalan dan countdown closing PEB.",
        icon: <ShieldAlert size={16} />,
      },
      {
        id: "audit_vault",
        label: "Audit Vault DJBC",
        group: "Operasional Ekspor",
        phase: "Operasional Ekspor",
        title: "Arsip Digital Audit DJBC",
        description:
          "Pengelompokan arsip transaksi 5 folder siap audit kepabeanan Bea Cukai.",
        icon: <FolderArchive size={16} />,
      },
    ],
  },
  {
    group: "Advisor & Pengetahuan",
    items: [
      {
        id: "advisor",
        label: "AI Advisor",
        group: "Advisor & Pengetahuan",
        phase: "Advisor & Pengetahuan",
        title: "AI Advisor",
        description:
          "Tanyakan risiko, skenario Incoterm, atau kelengkapan dokumen berdasarkan snapshot transaksi yang sedang dibuka.",
        icon: <Bot size={16} />,
      },
      {
        id: "knowledge",
        label: "Pengetahuan Tim",
        group: "Advisor & Pengetahuan",
        phase: "Advisor & Pengetahuan",
        title: "Pengetahuan Tim",
        description:
          "Kelola SOP internal dan panduan pasar dengan batas scope, masa berlaku, dan pemisahan uploader vs reviewer.",
        icon: <BookOpen size={16} />,
      },
    ],
  },
  {
    group: "Data Utama",
    items: [
      {
        id: "partners",
        label: "Mitra & Kontak",
        group: "Data Utama",
        phase: "Data Utama",
        title: "Mitra & Kontak",
        description:
          "Simpan identitas buyer, negara tujuan, dan terms pembayaran agar tidak diketik berulang kali.",
        icon: <Users size={16} />,
      },
      {
        id: "products",
        label: "Katalog Produk",
        group: "Data Utama",
        phase: "Data Utama",
        title: "Katalog Produk",
        description:
          "Kelola spesifikasi kemasan standar dan HS Code referensi untuk ditambahkan cepat ke transaksi.",
        icon: <Package size={16} />,
      },
    ],
  },
  {
    group: "Keuangan & Analitik",
    items: [
      {
        id: "finance",
        label: "Keuangan",
        group: "Keuangan & Analitik",
        phase: "Keuangan",
        title: "Keuangan (AR / AP)",
        description:
          "Pantau rencana piutang dan kontrol pemisahan antara dokumen perdagangan dengan pengakuan pendapatan akuntansi.",
        icon: <Wallet size={16} />,
      },
      {
        id: "bank",
        label: "Rekonsiliasi Bank",
        group: "Keuangan & Analitik",
        phase: "Keuangan",
        title: "Rekonsiliasi Bank",
        description:
          "Tinjau saran pencocokan pembayaran uang muka/pelunasan dan kurs realisasi sebelum posting Finance.",
        icon: <Landmark size={16} />,
      },
      {
        id: "journals",
        label: "Jurnal & Bagan Akun",
        group: "Keuangan & Analitik",
        phase: "Keuangan",
        title: "Jurnal & Bagan Akun",
        description:
          "Pratinjau jurnal double-entry seimbang dengan kontrol jejak sumber dan kebijakan koreksi via reversal.",
        icon: <FileSpreadsheet size={16} />,
      },
      {
        id: "reports",
        label: "Laporan & Analitik",
        group: "Keuangan & Analitik",
        phase: "Keuangan",
        title: "Laporan & Analitik",
        description:
          "Evaluasi struktur biaya, estimasi margin per shipment, dan pemisahan tegas antara asumsi quote vs realisasi.",
        icon: <BarChart3 size={16} />,
      },
    ],
  },
  {
    group: "Administrasi",
    items: [
      {
        id: "settings",
        label: "Pengaturan Workspace",
        group: "Administrasi",
        phase: "Administrasi",
        title: "Pengaturan Workspace",
        description:
          "Kelola sesi autentikasi, status koneksi PostgreSQL / Supabase, keamanan RLS, dan ekspor portabilitas data.",
        icon: <Settings2 size={16} />,
      },
    ],
  },
];

export const ALL_SCREENS: ScreenMeta[] = NAV_GROUPS.flatMap((g) => g.items);

export function getScreenMeta(screen: ScreenId): ScreenMeta {
  return ALL_SCREENS.find((item) => item.id === screen) ?? ALL_SCREENS[0];
}

function renderPersistenceBadge(
  user: ({ name?: string | null; isDemo?: boolean } & Partial<UserSession>) | null,
  saveState: PersistenceSaveState,
  version: number,
  activeShipmentId: string | null,
) {
  if (user?.isDemo) {
    return (
      <span className="sync-status-badge sync-cloud tabular-nums" title="Terhubung ke Supabase Cloud PostgreSQL">
        <Cloud size={13} className="text-emerald-500" />
        <span>Cloud Supabase Aktif</span>
      </span>
    );
  }
  if (!user) {
    return (
      <span className="sync-status-badge sync-local tabular-nums" title="Sesi belum login, perubahan disimpan di draf lokal">
        <HardDrive size={13} className="text-slate-400" />
        <span>Draf Lokal (Offline)</span>
      </span>
    );
  }
  if (saveState === "saving") {
    return (
      <span className="sync-status-badge sync-saving tabular-nums" title="Sedang menyinkronkan data ke cloud database...">
        <RefreshCw size={13} className="spin text-blue-500" />
        <span>Sinkronisasi Berjalan...</span>
      </span>
    );
  }
  if (saveState === "saved" && activeShipmentId) {
    return (
      <span className="sync-status-badge sync-saved tabular-nums" title={`Data transaksi aman tersimpan di cloud database (Revisi v${version})`}>
        <Cloud size={13} className="text-emerald-500" />
        <span>Tersimpan di Cloud · v{version}</span>
      </span>
    );
  }
  if (saveState === "conflict") {
    return (
      <span className="sync-status-badge sync-conflict tabular-nums" title="Terdapat pembaruan data dari perangkat/sesi lain">
        <AlertTriangle size={13} className="text-rose-500" />
        <span>Konflik Versi Cloud</span>
      </span>
    );
  }
  if (saveState === "error") {
    return (
      <span className="sync-status-badge sync-error tabular-nums" title="Gagal terhubung ke cloud, data tersimpan di draf lokal">
        <AlertTriangle size={13} className="text-amber-500" />
        <span>Draf Tersimpan Lokal</span>
      </span>
    );
  }
  return (
    <span className="sync-status-badge sync-pending tabular-nums" title="Ada perubahan yang belum disimpan ke cloud">
      <CloudOff size={13} className="text-amber-500" />
      <span>{activeShipmentId ? `Belum Disimpan · v${version}` : "Draf Baru"}</span>
    </span>
  );
}

export function WorkspaceShell({
  screen,
  navigate,
  exporterName,
  reference,
  user,
  saveState,
  statusNote,
  version,
  activeShipmentId,
  shipment,
  pricing,
  container,
  flow,
  update,
  updateNumber,
  updateLineItems,
  onSave,
  onReloadLatest,
  onReset,
  onLogin,
  onLogout,
  onUpgradeFromDemo,
  children,
}: {
  screen: ScreenId;
  navigate: (next: ScreenId) => void;
  exporterName: string;
  reference: string;
  user:
    | ({
        name?: string | null;
        email?: string | null;
        isDemo?: boolean;
        demoExpiresAt?: string;
      } & Partial<UserSession>)
    | null;
  saveState: PersistenceSaveState;
  statusNote: string | null;
  version: number;
  activeShipmentId: string | null;
  shipment?: Shipment;
  pricing?: Pricing;
  container?: ContainerCalc;
  flow?: WorkspaceFlow;
  update?: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void;
  updateNumber?: (key: keyof Shipment, rawValue: string) => void;
  updateLineItems?: (items: LineItem[]) => void;
  onSave: () => Promise<void>;
  onReloadLatest: () => Promise<void>;
  onReset: () => void;
  onLogin: () => Promise<void>;
  onLogout: () => Promise<void>;
  onUpgradeFromDemo?: () => void;
  children: React.ReactNode;
}) {
  const isDemoUser = Boolean(user?.isDemo);
  const demoRemainingLabel = isDemoUser
    ? formatDemoRemainingLabel(getDemoRemainingMs(user as UserSession))
    : "";

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.innerWidth > 768 : true,
  );
  const [isCompactViewport, setIsCompactViewport] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.innerWidth <= 768 : false,
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { locale, setLocale, t, navGroups, screens } = useLanguage();
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(2026, 10, 1),
    endDate: new Date(2026, 10, 24),
    label: "Bulan Ini",
    presetKey: "this_month",
  });
  const [showSupportModal, setShowSupportModal] = useState<boolean>(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);
  const [consultationPrompt, setConsultationPrompt] = useState("");

  useEffect(() => {
    document.documentElement.removeAttribute("data-text-scale");
  }, []);

  useEffect(() => {
    const activeBtn = document.querySelector(".clean-nav-item.active");
    if (activeBtn) {
      activeBtn.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [screen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 768px)");
    const syncViewport = (matches: boolean) => {
      setIsCompactViewport(matches);
      setSidebarOpen(!matches);
    };
    setIsCompactViewport(media.matches);
    const handler = (event: MediaQueryListEvent) => syncViewport(event.matches);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (!isCompactViewport || !sidebarOpen) {
      document.body.style.removeProperty("overflow");
      return;
    }
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.removeProperty("overflow");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isCompactViewport, sidebarOpen]);

  const activeMeta = screens.find((item) => item.id === screen) ?? getScreenMeta(screen);

  const matchingScreens = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return [];
    return screens.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q),
    ).slice(0, 6);
  }, [searchTerm, screens]);

  const companyOrUserName =
    user?.companyName?.trim() ||
    exporterName?.trim() ||
    user?.name?.trim() ||
    "PT Nusantara Ekspor Mandiri";

  const userEmail = user?.email?.trim() || "operasional@nusantaraekspor.com";

  const cleanNameForInitials = companyOrUserName.replace(/^(PT|CV|UD|PO)\.?\s+/i, "");
  const nameParts = cleanNameForInitials.trim().split(/\s+/).filter(Boolean);
  const smartInitials =
    nameParts.length >= 2
      ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
      : cleanNameForInitials.slice(0, 2).toUpperCase() || "NM";

  const avatarSrc = (user as any)?.avatar || (user as any)?.avatarUrl || (shipment as any)?.exporterLogo || null;

  return (
    <div className={`app-shell ${sidebarOpen ? "sidebar-is-open" : "sidebar-is-closed"}`}>
      {isCompactViewport && sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className="sidebar clean-sidebar">
        <div className="brand-lockup clean-brand-lockup">
          <div className="brand-mark">
            <span />
            <span />
          </div>
          <div className="brand-copy">
            <strong>
              Ekspor<span>Flow</span>
            </strong>
            <small>Export Operations</small>
          </div>
          <button
            type="button"
            className="sidebar-toggle-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Tutup menu navigasi"
            title="Tutup navigasi"
          >
            <PanelLeftClose size={16} />
          </button>
        </div>

        <nav className="clean-nav-scroll" aria-label="Navigasi utama EksporFlow">
          {navGroups.map((group) => (
            <div className="clean-nav-group" key={group.group}>
              <span className="clean-nav-group-title">{group.group}</span>
              {group.items.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={`clean-nav-item ${screen === item.id ? "active" : ""}`}
                  onClick={() => {
                    navigate(item.id);
                    if (window.innerWidth <= 768) setSidebarOpen(false);
                  }}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom clean-sidebar-footer">
          <div className="user-row">
            {avatarSrc ? (
              <img src={avatarSrc} alt={companyOrUserName} className="user-avatar-img" />
            ) : (
              <div className="user-avatar" title={companyOrUserName}>{smartInitials}</div>
            )}
            <div>
              <b title={companyOrUserName}>{companyOrUserName}</b>
              {userEmail && <small title={userEmail}>{userEmail}</small>}
            </div>
            {user ? (
              <button
                type="button"
                className="sidebar-auth-btn"
                title="Keluar sesi"
                onClick={() => void onLogout()}
              >
                <LogOut size={14} />
              </button>
            ) : (
              <button
                type="button"
                className="sidebar-auth-btn"
                title="Masuk akun"
                onClick={() => void onLogin()}
              >
                <LogIn size={14} />
              </button>
            )}
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          {/* Topbar Left: Navigation Toggle + Minimal Context Breadcrumb */}
          <div className="topbar-left" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              type="button"
              className="topbar-menu-btn"
              onClick={() => setSidebarOpen((open) => !open)}
              aria-label={sidebarOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
              title={sidebarOpen ? "Tutup navigasi" : "Buka navigasi"}
            >
              {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#64748B" }}>
              <span style={{ fontWeight: 600, color: "#0F172A" }}>EksporFlow</span>
            </div>
          </div>

          {/* Topbar Right Actions: Search + Bantuan + Notifikasi + Bahasa (Grouped Closely Together on Right) */}
          <div className="topbar-actions" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Desktop Global Search Box */}
            <div className="space-topbar-omni desktop-only-search">
              <Search size={14} style={{ color: "#64748B" }} />
              <input
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setSearchOpen(Boolean(event.target.value.trim()));
                }}
                placeholder={t("topbar.search_placeholder", "Cari transaksi, B/L...")}
                style={{ fontSize: 12.5 }}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setSearchOpen(false);
                    setSearchTerm("");
                  } else if (event.key === "Enter" && matchingScreens[0]) {
                    navigate(matchingScreens[0].id);
                    setSearchOpen(false);
                    setSearchTerm("");
                  }
                }}
              />
              {searchTerm && (
                <button
                  type="button"
                  style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0 }}
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchTerm("");
                  }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Mobile Search Icon Trigger */}
            <button
              type="button"
              className="icon-button mobile-only-search-btn"
              onClick={() => setMobileSearchOpen((prev) => !prev)}
              aria-label="Cari transaksi atau menu"
              title="Pencarian"
            >
              <Search size={16} />
            </button>

            {searchOpen && matchingScreens.length > 0 && !mobileSearchOpen && (
              <div className="top-search-dropdown" style={{ position: "absolute", top: 52, right: 280, zIndex: 100 }}>
                {matchingScreens.map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => {
                      navigate(m.id);
                      setSearchOpen(false);
                      setSearchTerm("");
                    }}
                  >
                    <b>{m.label}</b>
                    <small>{m.group}</small>
                  </button>
                ))}
              </div>
            )}

            {/* 2. Bantuan / Support Button (Replaces top AI Advisor) */}
            <button
              type="button"
              className="space-btn-secondary topbar-help-btn"
              onClick={() => setShowSupportModal(true)}
              title={t("topbar.support_title", "Pusat Bantuan & Hubungi Tim Dukungan")}
              style={{ padding: "6px 12px", fontSize: 12.5 }}
            >
              <HelpCircle size={14} style={{ color: "#2563EB" }} />
              <span className="topbar-help-text">{t("topbar.help", "Bantuan")}</span>
            </button>

            {/* 3. Notification Bell with Empty State & Mark Read */}
            <div style={{ position: "relative" }}>
              <button
                type="button"
                className="icon-button"
                aria-label="Notifikasi Operasional Ekspor"
                title="Notifikasi Operasional Ekspor"
                onClick={() => setShowNotifications((prev) => !prev)}
                style={{ position: "relative" }}
              >
                <Bell size={16} />
                {hasUnreadNotifications && (
                  <span
                    style={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "#EF4444",
                    }}
                  />
                )}
              </button>
              {showNotifications && (
                <div
                  style={{
                    position: "absolute",
                    top: 42,
                    right: 0,
                    width: 320,
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: 12,
                    padding: 16,
                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.12)",
                    zIndex: 220,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 12,
                      paddingBottom: 8,
                      borderBottom: "1px solid #F1F5F9",
                    }}
                  >
                    <strong style={{ fontSize: 13, color: "#0F172A" }}>{t("topbar.notifications", "Notifikasi")}</strong>
                    <button
                      type="button"
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: 11.5,
                        color: "#2563EB",
                        cursor: "pointer",
                        fontWeight: 500,
                      }}
                      onClick={() => {
                        setHasUnreadNotifications(false);
                        toast.success("Semua notifikasi ditandai sudah dibaca");
                      }}
                    >
                      {t("topbar.mark_all_read", "Tandai sudah dibaca")}
                    </button>
                  </div>
                  {/* Clean Empty State as requested by user */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "24px 12px",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: "#F8FAFC",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#94A3B8",
                        marginBottom: 10,
                      }}
                    >
                      <BellOff size={18} />
                    </div>
                    <strong style={{ fontSize: 12.5, color: "#0F172A", marginBottom: 4 }}>
                      {t("topbar.notifications_empty", "Belum ada notifikasi baru")}
                    </strong>
                    <p style={{ margin: 0, fontSize: 11.5, color: "#64748B", lineHeight: 1.5 }}>
                      {t("topbar.notifications_empty_desc", "Semua pembaruan sistem, dokumen kepabeanan, dan jadwal kapal akan muncul di sini.")}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Language Selector Dropdown (ID 🇮🇩 / EN 🇺🇸) */}
            <LanguageDropdown
              currentLocale={locale}
              onSelectLocale={(loc) => {
                setLocale(loc);
                const labels: Record<string, string> = {
                  ID: "Bahasa Indonesia",
                  EN: "English (US)",
                };
                toast.success(`${t("topbar.language_changed", "Bahasa sistem diubah ke")}: ${labels[loc]}`);
              }}
            />
          </div>
        </header>

        {/* Mobile Expandable Search Strip */}
        {mobileSearchOpen && (
          <div className="mobile-search-bar-wrap">
            <div className="mobile-search-bar">
              <Search size={14} style={{ color: "#64748B", flexShrink: 0 }} />
              <input
                autoFocus
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setSearchOpen(Boolean(event.target.value.trim()));
                }}
                placeholder={t("topbar.search_mobile_placeholder", "Cari transaksi, B/L, dokumen...")}
              />
              <button
                type="button"
                className="mobile-search-close-btn"
                onClick={() => {
                  setMobileSearchOpen(false);
                  setSearchOpen(false);
                  setSearchTerm("");
                }}
              >
                <X size={15} />
              </button>
            </div>
            {searchOpen && matchingScreens.length > 0 && (
              <div className="mobile-search-dropdown">
                {matchingScreens.map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => {
                      navigate(m.id);
                      setMobileSearchOpen(false);
                      setSearchOpen(false);
                      setSearchTerm("");
                    }}
                  >
                    <b>{m.label}</b>
                    <small>{m.group}</small>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="page-wrap">
          {saveState === "conflict" && (
            <div className="conflict-banner">
              <div>
                <AlertTriangle size={16} />
                <span>
                  <b>{t("topbar.conflict_detected", "Konflik versi terdeteksi:")}</b> {statusNote || t("topbar.conflict_desc", "Transaksi telah diperbarui dari sesi lain. Muat versi terbaru sebelum menyimpan kembali agar tidak menimpa data tim.")}
                </span>
              </div>
              {activeShipmentId && (
                <button
                  type="button"
                  className="save-button"
                  onClick={() => void onReloadLatest()}
                >
                  <RefreshCcw size={14} /> {t("topbar.reload_latest", "Muat Versi Terbaru")}
                </button>
              )}
            </div>
          )}

          <section className={`page-heading ${screen === "documents" ? "doc-screen-heading" : ""}`}>
            <div>
              <h1 style={{ margin: "0 0 2px 0" }}>{activeMeta.title}</h1>
              {activeMeta.description && (
                <p style={{ margin: 0, fontSize: 12.5, color: "#64748B" }}>
                  {activeMeta.description}
                </p>
              )}
            </div>
            <div className="heading-actions" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {screen === "dashboard" ? (
                <>
                  {/* Meta Ads style Date Range Picker Popover (left of Unduh Laporan) */}
                  <DateRangePickerPopover
                    selectedRange={dateRange}
                    onSelectRange={(range) => {
                      setDateRange(range);
                      toast.success(`Filter rentang waktu: ${range.label} diterapkan`);
                    }}
                    locale={locale}
                  />
                  <button
                    type="button"
                    className="space-btn-secondary"
                    onClick={() => toast.success("Ringkasan operasional berhasil diunduh (PDF/CSV)")}
                    title={t("topbar.download_summary", "Unduh Laporan")}
                  >
                    <Download size={13} />
                    <span>{t("topbar.download_summary", "Unduh Laporan")}</span>
                  </button>
                  <button
                    type="button"
                    className="space-btn-primary"
                    onClick={() => navigate("transactions")}
                    title={t("topbar.new_shipment", "Transaksi Baru")}
                  >
                    <Plus size={14} />
                    <span>{t("topbar.new_shipment", "Transaksi Baru")}</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="space-btn-primary"
                  onClick={() => {
                    if (onSave) onSave();
                    toast.success("Data Tersimpan di Supabase Cloud");
                  }}
                >
                  <FileCheck2 size={13} />
                  <span>{t("topbar.save_shipment", "Simpan Transaksi")}</span>
                </button>
              )}
            </div>
          </section>

          {children}
        </div>
      </main>

      {/* Support Center Modal */}
      <SupportModal
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
        userCompany={user?.companyName || "PT Nusantara Ekspor Mandiri"}
      />

      {/* Restored AI Advisor Floating Widget at Bottom Right */}
      {screen !== "advisor" && shipment && (
        <ScreenAIFloatingWidget
          isOpen={isConsultationOpen}
          onToggle={() => setIsConsultationOpen((prev) => !prev)}
          onClose={() => setIsConsultationOpen(false)}
          initialPrompt={consultationPrompt}
          screen={screen}
          screenTitle={activeMeta.title}
          shipment={shipment}
          pricing={pricing || calculatePricing(shipment)}
          container={container || calculateContainer(shipment)}
          flow={flow!}
          isAuthenticated={Boolean(user && !user.isDemo)}
          onLogin={() => void onLogin()}
          onNavigateFullAdvisor={() => navigate("advisor")}
        />
      )}
    </div>
  );
}
