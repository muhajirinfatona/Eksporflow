import type { PersistenceSaveState } from "@/hooks/useActiveShipment";
import type { ScreenId } from "@shared/risk";
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Bot,
  Box,
  Building2,
  Calculator,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Cloud,
  Compass,
  FileSearch,
  FileSpreadsheet,
  FileText,
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
  Save,
  Search,
  Settings2,
  ShieldAlert,
  Ship,
  Truck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import type { Pricing } from "@shared/pricing";
import type { ContainerCalc, Shipment } from "@shared/shipment";
import type { WorkspaceFlow } from "@/hooks/useWorkspaceFlow";
import { IconButton, StatusPill } from "./Primitives";
import { ScreenAIFloatingWidget } from "./ScreenAIAdvisor";

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
          "Satu sumber data terhubung untuk memantau penawaran, kesiapan dokumen, muatan kontainer, dan langkah operasional.",
        icon: <LayoutGrid size={16} />,
      },
      {
        id: "readiness",
        label: "Asesmen Kesiapan",
        group: "Ringkasan",
        phase: "Ringkasan",
        title: "Asesmen Kesiapan Ekspor",
        description:
          "Petakan informasi produk, pasar tujuan, dan kesiapan dokumen sebelum mengirim penawaran ke buyer.",
        icon: <CheckCircle2 size={16} />,
      },
    ],
  },
  {
    group: "Penjualan",
    items: [
      {
        id: "transactions",
        label: "Pesanan Ekspor",
        group: "Penjualan",
        phase: "Penjualan",
        title: "Pesanan Ekspor",
        description: "Kelola daftar pesanan buyer dan pantau alur tahapan operasional ekspor.",
        icon: <Layers size={16} />,
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
        id: "pricing",
        label: "Harga & Order",
        group: "Penjualan",
        phase: "Penjualan",
        title: "Harga & Order",
        description:
          "Kalkulasi biaya logistik, kepabeanan, contingency, dan harga jual bersih di 7 skenario Incoterms® 2020.",
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
        id: "documents",
        label: "Dokumen Ekspor",
        group: "Operasional Ekspor",
        phase: "Operasional Ekspor",
        title: "Dokumen Ekspor",
        description:
          "Siapkan 5 Dokumen Inti (PI, SC, CI, PL, SI) dan cap digital Scanned Copy untuk penagihan TT.",
        icon: <FileText size={16} />,
      },
      {
        id: "cargo",
        label: "Rencana Muatan",
        group: "Operasional Ekspor",
        phase: "Operasional Ekspor",
        title: "Rencana Muatan & Kubikasi",
        description:
          "Kalkulasi kapasitas volume/berat kontainer 20ft, 40ft, 40ft HC, CBM, pallet kayu, dan susut muatan.",
        icon: <Box size={16} />,
      },
      {
        id: "tracking",
        label: "Pelacakan Kontainer",
        group: "Operasional Ekspor",
        phase: "Operasional Ekspor",
        title: "Pelacakan Kontainer Maritim (Mid-Sea Tracking)",
        description:
          "Pemantauan visual posisi dan pergerakan kontainer maritim selama di tengah laut via nomor kontainer / BL.",
        icon: <Ship size={16} />,
      },
      {
        id: "shipment",
        label: "Logistik & Pengiriman",
        group: "Operasional Ekspor",
        phase: "Operasional Ekspor",
        title: "Logistik & Pengiriman",
        description:
          "Pantau tahapan shipment, nomor booking/kontainer/seal, handoff checklist, dan arsip bukti transaksi.",
        icon: <Truck size={16} />,
      },
      {
        id: "scrutiny",
        label: "Validasi Dokumen (B/L)",
        group: "Operasional Ekspor",
        phase: "Operasional Ekspor",
        title: "Pemeriksaan Dokumen & Validasi Silang (Scrutiny)",
        description:
          "Ekstraksi data OCR draft B/L forwarder, validasi silang 3-way dengan CI & PL guna mencegah demurrage.",
        icon: <FileSearch size={16} />,
      },
      {
        id: "risk",
        label: "Risk Center",
        group: "Operasional Ekspor",
        phase: "Operasional Ekspor",
        title: "Risk Center",
        description:
          "Tampilkan temuan konsistensi 3-way, kelengkapan bukti PO/email, dan checklist verifikasi sebelum keberangkatan.",
        icon: <ShieldAlert size={16} />,
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
  user: { name?: string | null } | null,
  saveState: PersistenceSaveState,
  version: number,
  activeShipmentId: string | null,
) {
  if (!user) {
    return <StatusPill tone="gray">Draft Lokal</StatusPill>;
  }
  if (saveState === "saving") {
    return <StatusPill tone="blue">Menyimpan...</StatusPill>;
  }
  if (saveState === "saved" && activeShipmentId) {
    return <StatusPill tone="green">✓ Tersimpan Otomatis · v{version}</StatusPill>;
  }
  if (saveState === "conflict") {
    return <StatusPill tone="red">Konflik Versi</StatusPill>;
  }
  if (saveState === "error") {
    return <StatusPill tone="amber">Draft Tersimpan Lokal</StatusPill>;
  }
  return (
    <StatusPill tone="amber">
      {activeShipmentId ? `● Belum Disimpan · v${version}` : "Draft Baru"}
    </StatusPill>
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
  onSave,
  onReloadLatest,
  onReset,
  onLogin,
  onLogout,
  children,
}: {
  screen: ScreenId;
  navigate: (next: ScreenId) => void;
  exporterName: string;
  reference: string;
  user: { name?: string | null; email?: string | null } | null;
  saveState: PersistenceSaveState;
  statusNote: string | null;
  version: number;
  activeShipmentId: string | null;
  shipment?: Shipment;
  pricing?: Pricing;
  container?: ContainerCalc;
  flow?: WorkspaceFlow;
  onSave: () => Promise<void>;
  onReloadLatest: () => Promise<void>;
  onReset: () => void;
  onLogin: () => Promise<void>;
  onLogout: () => Promise<void>;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.innerWidth > 1024 : true,
  );
  const [isCompactViewport, setIsCompactViewport] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.innerWidth <= 1024 : false,
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);
  const [consultationPrompt, setConsultationPrompt] = useState("");

  useEffect(() => {
    document.documentElement.removeAttribute("data-text-scale");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 1024px)");
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

  const activeMeta = getScreenMeta(screen);

  const matchingScreens = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return [];
    return ALL_SCREENS.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q),
    ).slice(0, 6);
  }, [searchTerm]);

  const userInitials = (user?.name || "EF")
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

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
            <small>EXPORT OPERATIONS</small>
          </div>
          <button
            type="button"
            className="sidebar-mobile-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Tutup menu navigasi"
          >
            <X size={18} />
          </button>
        </div>

        <button
          type="button"
          className="workspace-switcher clean-workspace-box"
          title="Kelola atau ganti transaksi aktif"
          onClick={() => {
            navigate("transactions");
            if (window.innerWidth <= 1024) setSidebarOpen(false);
          }}
        >
          <div className="workspace-avatar">
            <Building2 size={14} />
          </div>
          <div>
            <b>{exporterName}</b>
            <small>
              {user
                ? reference && !reference.startsWith("EXP-")
                  ? `Cloud aktif · ${reference}`
                  : "Cloud aktif · Workspace"
                : reference && !reference.startsWith("EXP-")
                  ? `Draft lokal · ${reference}`
                  : "Draft lokal"}
            </small>
          </div>
        </button>

        <nav className="clean-nav-scroll" aria-label="Navigasi utama EksporFlow">
          {NAV_GROUPS.map((group) => (
            <div className="clean-nav-group" key={group.group}>
              <span className="clean-nav-group-title">{group.group}</span>
              {group.items.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={`clean-nav-item ${screen === item.id ? "active" : ""}`}
                  onClick={() => {
                    navigate(item.id);
                    if (window.innerWidth <= 1024) setSidebarOpen(false);
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
            <div className="user-avatar">{userInitials}</div>
            <div>
              <b>{user ? user.name || "Pengguna Workspace" : "Belum Masuk Akun"}</b>
              <small>{user ? "PostgreSQL / Supabase" : "Mode draft browser"}</small>
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
          <div className="topbar-left">
            <button
              type="button"
              className="topbar-menu-btn"
              onClick={() => setSidebarOpen((open) => !open)}
              aria-label={sidebarOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
            >
              <Menu size={20} />
            </button>
            <div className="breadcrumbs">
              <span className="breadcrumb-group">{activeMeta.group}</span>
              <ChevronRight size={14} className="breadcrumb-sep" />
              <b>{activeMeta.label}</b>
            </div>
          </div>

          <div className="topbar-actions">
            {searchOpen && (
              <div className="top-search-wrap">
                <div className="top-search">
                  <Search size={15} />
                  <input
                    autoFocus
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Loncat ke menu..."
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
                  <button
                    type="button"
                    className="top-search-close"
                    aria-label="Tutup pencarian"
                    onClick={() => {
                      setSearchOpen(false);
                      setSearchTerm("");
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
                {matchingScreens.length > 0 && (
                  <div className="top-search-dropdown">
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
              </div>
            )}

            <IconButton
              label="Cari halaman"
              onClick={() => setSearchOpen((open) => !open)}
            >
              <Search size={17} />
            </IconButton>

            <IconButton label="Pengaturan Workspace" onClick={() => navigate("settings")}>
              <Settings2 size={17} />
            </IconButton>

            {!user ? (
              <button type="button" className="ghost-button topbar-login-btn" onClick={() => void onLogin()}>
                <Cloud size={14} /> <span className="btn-label-desktop">Masuk Cloud</span><span className="btn-label-mobile">Masuk</span>
              </button>
            ) : null}

            <button
              type="button"
              className="save-button topbar-save-btn"
              disabled={saveState === "saving"}
              onClick={() => void onSave()}
            >
              <Save size={14} />
              <span className="btn-label-desktop">
                {saveState === "saving"
                  ? "Menyimpan..."
                  : user
                    ? "Simpan ke Cloud"
                    : "Simpan Draft"}
              </span>
              <span className="btn-label-mobile">
                {saveState === "saving" ? "..." : "Simpan"}
              </span>
            </button>
          </div>
        </header>

        <div className="page-wrap">
          {saveState === "conflict" && (
            <div className="conflict-banner">
              <div>
                <AlertTriangle size={16} />
                <span>
                  <b>Konflik versi terdeteksi:</b> {statusNote || "Transaksi telah diperbarui dari sesi lain."} Muat versi terbaru sebelum menyimpan kembali agar tidak menimpa data tim.
                </span>
              </div>
              {activeShipmentId && (
                <button
                  type="button"
                  className="save-button"
                  onClick={() => void onReloadLatest()}
                >
                  <RefreshCcw size={14} /> Muat Versi Terbaru
                </button>
              )}
            </div>
          )}

          <section className={`page-heading ${screen === "documents" ? "doc-screen-heading" : ""}`}>
            <div>
              <span className="eyebrow">
                {activeMeta.phase}
                {reference && !reference.startsWith("EXP-") ? (
                  <>
                    {" · "}
                    <button
                      type="button"
                      className="eyebrow-ref-link mono-code"
                      title="Kelola atau ganti transaksi aktif"
                      onClick={() => navigate("transactions")}
                    >
                      {reference}
                    </button>
                  </>
                ) : null}
              </span>
              <h1>{activeMeta.title}</h1>
            </div>
            <div className="heading-actions">
              {renderPersistenceBadge(user, saveState, version, activeShipmentId)}
            </div>
          </section>

          {children}
        </div>
      </main>

      {shipment && pricing && container && flow && screen !== "advisor" && (
        <ScreenAIFloatingWidget
          isOpen={isConsultationOpen}
          onToggle={() => setIsConsultationOpen((prev) => !prev)}
          onClose={() => setIsConsultationOpen(false)}
          initialPrompt={consultationPrompt}
          screen={screen}
          screenTitle={activeMeta.title}
          shipment={shipment}
          pricing={pricing}
          container={container}
          flow={flow}
          isAuthenticated={Boolean(user)}
          onLogin={() => void onLogin()}
          onNavigateFullAdvisor={() => navigate("advisor")}
        />
      )}

      {!isCompactViewport && !sidebarOpen && (
        <button
          type="button"
          className="sidebar-reopen"
          onClick={() => setSidebarOpen(true)}
          aria-label="Buka navigasi"
        >
          <PanelLeftOpen size={18} />
        </button>
      )}
      {!isCompactViewport && sidebarOpen && (
        <button
          type="button"
          className="sidebar-collapse"
          onClick={() => setSidebarOpen(false)}
          aria-label="Tutup navigasi"
        >
          <PanelLeftClose size={16} />
        </button>
      )}
    </div>
  );
}
