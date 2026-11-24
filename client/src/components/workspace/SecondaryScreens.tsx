import type { PersistenceSaveState } from "@/hooks/useActiveShipment";
import type { WorkspaceFlow } from "@/hooks/useWorkspaceFlow";
import {
  formatDemoRemainingLabel,
  getDemoRemainingMs,
  type UserSession,
} from "@/lib/supabaseAuth";
import {
  buildOnboarding30Days,
  calculatePlanBilling,
  SUBSCRIPTION_PLANS,
  type SubscriptionPlanSpec,
} from "@shared/exportCompliance";
import { formatMoney, formatNumber } from "@shared/format";
import type { Pricing } from "@shared/pricing";
import type { ScreenId } from "@shared/risk";
import type { ContainerCalc, Incoterm, LineItem, Shipment } from "@shared/shipment";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Bot,
  Box,
  Briefcase,
  Building2,
  Calculator,
  Compass,
  FileText,
  Calendar,
  Filter,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Download,
  FileCheck2,
  FileSpreadsheet,
  History,
  Landmark,
  Mail,
  MoreVertical,
  Package,
  Plus,
  RotateCcw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Ship,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  UserCheck,
  UserPlus,
  UserRound,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Field,
  MetricCard,
  QuickLink,
  RecommendationsPanel,
  SelectField,
  StatusPill,
} from "./Primitives";
import type { LocalShipmentRecord, ShipmentListItem } from "./TransactionsModule";

function FinanceSubNav({
  active,
  navigate,
}: {
  active: "finance" | "bank" | "journals" | "reports";
  navigate: (screen: ScreenId) => void;
}) {
  const tabs: { id: "finance" | "bank" | "journals" | "reports"; label: string; icon: React.ReactNode }[] = [
    { id: "finance", label: "Keuangan (AR / AP)", icon: <Wallet size={14} /> },
    { id: "bank", label: "Rekonsiliasi Bank", icon: <Landmark size={14} /> },
    { id: "journals", label: "Jurnal & Bagan Akun", icon: <FileSpreadsheet size={14} /> },
    { id: "reports", label: "Laporan & Analitik", icon: <BarChart3 size={14} /> },
  ];
  return (
    <div className="clean-tabs finance-subnav">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={active === tab.id ? "active" : ""}
          onClick={() => navigate(tab.id)}
        >
          {tab.icon} {tab.label}
        </button>
      ))}
      <button type="button" className="tab-link-right" onClick={() => navigate("documents")}>
        Lihat Commercial Invoice →
      </button>
    </div>
  );
}

export function DashboardView({
  shipment,
  pricing,
  container,
  update,
  navigate,
  flow,
}: {
  shipment: Shipment;
  pricing: Pricing;
  container: ContainerCalc;
  update?: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void;
  navigate: (screen: ScreenId) => void;
  flow: WorkspaceFlow;
}) {
  const [selectedPort, setSelectedPort] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);

  const totalContract = pricing.active.offer > 0 ? pricing.active.offer : 24590.43;
  const totalReceived = flow.paidAmount > 0 ? flow.paidAmount : 24590.43;

  const allShipments = useMemo(() => [
    {
      blNumber: "EKL-US2026-0881",
      invNumber: "INV-2026-0881",
      buyer: "Atlantic Roast Corp",
      buyerLoc: "Boston, USA",
      avatar: "AR",
      avClass: "av1",
      commodity: "Kopi Arabika Gayo Grade 1",
      stowage: "1x20' FCL · 320 Karung ICO 60kg (19.2 MT)",
      polCode: "IDTPP",
      podCode: "USLAX",
      polName: "Tanjung Priok",
      podName: "Los Angeles",
      etd: "28 Nov '26",
      eta: "18 Des '26",
      statusPill: "green",
      statusLabel: "Jalur Hijau (NPE)",
      paymentLabel: "L/C at Sight (Paid)",
      amount: "$24,590.00",
    },
    {
      blNumber: "EKL-EU2026-0412",
      invNumber: "INV-2026-0412",
      buyer: "Hamburg Specialty Coffee GmbH",
      buyerLoc: "Hamburg, Jerman",
      avatar: "HC",
      avClass: "av2",
      commodity: "Kopi Robusta Lampung Fine",
      stowage: "1x20' FCL · 300 Karung 60kg (18.0 MT)",
      polCode: "IDPNJ",
      podCode: "DEHAM",
      polName: "Panjang",
      podName: "Hamburg",
      etd: "02 Des '26",
      eta: "24 Des '26",
      statusPill: "blue",
      statusLabel: "In Transit Kapal",
      paymentLabel: "T/T 30% DP / 70% B/L",
      amount: "$18,400.00",
    },
    {
      blNumber: "EKL-JP2026-0199",
      invNumber: "INV-2026-0199",
      buyer: "Tokyo Agro & Spices Co., Ltd",
      buyerLoc: "Tokyo, Jepang",
      avatar: "TA",
      avClass: "av3",
      commodity: "Kayu Manis Korintje Cassia A",
      stowage: "1x40' HC · 520 Karton ISPM-15 (15.6 MT)",
      polCode: "IDSUB",
      podCode: "JPYOK",
      polName: "Tanjung Perak",
      podName: "Yokohama",
      etd: "05 Des '26",
      eta: "19 Des '26",
      statusPill: "amber",
      statusLabel: "Siap Muat di Depo",
      paymentLabel: "DP 30% Masuk (Mandiri)",
      amount: "$32,150.00",
    },
    {
      blNumber: "EKL-AE2026-0920",
      invNumber: "INV-2026-0920",
      buyer: "Emirates Foodstuff Trading LLC",
      buyerLoc: "Dubai, UAE",
      avatar: "EF",
      avClass: "av4",
      commodity: "Briket Arang Kelapa Premium",
      stowage: "1x20' FCL · 1,400 Master Box (14.0 MT)",
      polCode: "IDTPP",
      podCode: "AEJEA",
      polName: "Tanjung Priok",
      podName: "Jebel Ali",
      etd: "10 Des '26",
      eta: "27 Des '26",
      statusPill: "green",
      statusLabel: "Jalur Hijau (NPE)",
      paymentLabel: "CAD (Cash Against Docs)",
      amount: "$14,800.00",
    },
  ], []);

  const filteredShipments = useMemo(() => {
    if (selectedPort === "all") return allShipments;
    return allShipments.filter((s) => s.polCode === selectedPort);
  }, [allShipments, selectedPort]);

  return (
    <div className="space-home-container">
      {/* ROW 1: 4 Sleek, Text-Light Executive KPI Cards */}
      <div className="space-home-stats-grid-4">
        {/* Card 1: Nilai Kontrak Ekspor */}
        <div className="space-stat-card-v2">
          <div className="space-stat-v2-header">
            <span className="space-stat-v2-title">Nilai Kontrak Ekspor</span>
            <div className="space-stat-v2-icon blue">
              <Briefcase size={16} />
            </div>
          </div>
          <div className="space-stat-v2-value">
            {formatMoney(totalContract, shipment.currency || "USD")}
          </div>
          <div className="space-stat-v2-foot">
            <span className="space-kpi-badge positive">
              <ArrowUpRight size={13} /> +2.9%
            </span>
            <span className="space-kpi-meta">FOB Tanjung Priok</span>
          </div>
        </div>

        {/* Card 2: Devisa Ekspor Masuk */}
        <div className="space-stat-card-v2">
          <div className="space-stat-v2-header">
            <span className="space-stat-v2-title">Realisasi Devisa (DHE)</span>
            <div className="space-stat-v2-icon purple">
              <Landmark size={16} />
            </div>
          </div>
          <div className="space-stat-v2-value">
            {formatMoney(totalReceived, shipment.currency || "USD")}
          </div>
          <div className="space-stat-v2-foot">
            <span className="space-kpi-badge neutral">
              Mandiri
            </span>
            <span className="space-kpi-meta" title="Rekening Khusus DHE SDA">
              Rek. Khusus DHE SDA
            </span>
          </div>
        </div>

        {/* Card 3: Kepatuhan DHE SDA */}
        <div className="space-stat-card-v2">
          <div className="space-stat-v2-header">
            <span className="space-stat-v2-title">Kepatuhan DHE SDA</span>
            <div className="space-stat-v2-icon mint">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="space-stat-v2-value">
            100% Patuh
          </div>
          <div className="space-stat-v2-foot">
            <span className="space-kpi-badge positive">
              <Check size={11} /> PP 36
            </span>
            <span className="space-kpi-meta">Retensi 30% · 90 Hari</span>
          </div>
        </div>

        {/* Card 4: Volume & Muatan Kontainer */}
        <div className="space-stat-card-v2">
          <div className="space-stat-v2-header">
            <span className="space-stat-v2-title">Muatan & Kontainer</span>
            <div className="space-stat-v2-icon blue">
              <Package size={16} />
            </div>
          </div>
          <div className="space-stat-v2-value">
            19.2 MT · 1x20'
          </div>
          <div className="space-stat-v2-foot">
            <span className="space-kpi-badge info">
              87.2% CBM
            </span>
            <span className="space-kpi-meta">320 Karung Kopi ICO</span>
          </div>
        </div>
      </div>

      {/* ROW 2: Ocean Freight Tracking (65%) + Market Share & Compliance (35%) */}
      <div className="space-home-middle-grid">
        {/* Left Card: Ocean Freight Tracking */}
        <div className="space-vessel-tracker-card">
          <div className="space-chart-v2-head">
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0F172A" }}>
                Pelacakan Pengapalan Samudera
              </h3>
              <p style={{ margin: "2px 0 0 0", fontSize: 12.5, color: "#64748B" }}>
                Pemantauan rute kargo maritim aktif &amp; status izin kepabeanan
              </p>
            </div>
            <button
              type="button"
              className="space-btn-secondary"
              onClick={() => navigate("tracking")}
              title="Buka Pelacakan Kontainer Lengkap"
              style={{ padding: "6px 14px", fontSize: 12 }}
            >
              <Ship size={13} />
              <span>Detail Kapal</span>
            </button>
          </div>

          {/* Premium Orange Vessel Banner (Requested: Pengganti Hitam dengan Orange Elegan) */}
          <div className="space-vessel-top-banner">
            <div className="space-vessel-info-left">
              <div className="space-vessel-badge-icon">
                <Ship size={24} />
              </div>
              <div>
                <div className="space-vessel-name-title">
                  <span>MV CMA CGM Dignity</span>
                  <span className="space-vessel-voyage-badge">
                    Voyage 024W
                  </span>
                </div>
                <div className="space-vessel-route">
                  <span>Tanjung Priok (IDTPP)</span>
                  <span style={{ color: "#FFFFFF", fontWeight: 700 }}>→</span>
                  <span>Port of Los Angeles (USLAX)</span>
                </div>
              </div>
            </div>

            <div className="space-vessel-etd-eta">
              <div className="space-vessel-etd-item">
                <span>ETD (PRIOK)</span>
                <strong>28 Nov 2026</strong>
              </div>
              <div style={{ color: "rgba(255,255,255,0.35)", fontWeight: 300 }}>|</div>
              <div className="space-vessel-etd-item eta">
                <span>ETA (LOS ANGELES)</span>
                <strong>18 Des 2026</strong>
              </div>
            </div>
          </div>

          {/* 6-Stage Export Milestone Stepper (Rata Tengah / Center-Aligned) */}
          <div className="space-export-stepper">
            <div className="space-export-step-item">
              <div className="space-step-head">
                <div className="space-step-dot done"><Check size={12} strokeWidth={2.8} /></div>
                <div className="space-step-line done" />
              </div>
              <span className="space-step-label">Stuffing</span>
              <span className="space-step-sub">Karawang</span>
            </div>

            <div className="space-export-step-item">
              <div className="space-step-head">
                <div className="space-step-dot done"><Check size={12} strokeWidth={2.8} /></div>
                <div className="space-step-line done" />
              </div>
              <span className="space-step-label">Karantina</span>
              <span className="space-step-sub">Phyto OK</span>
            </div>

            <div className="space-export-step-item">
              <div className="space-step-head">
                <div className="space-step-dot done"><Check size={12} strokeWidth={2.8} /></div>
                <div className="space-step-line done" />
              </div>
              <span className="space-step-label">Bea Cukai</span>
              <span className="space-step-sub">Jalur Hijau</span>
            </div>

            <div className="space-export-step-item">
              <div className="space-step-head">
                <div className="space-step-dot done"><Check size={12} strokeWidth={2.8} /></div>
                <div className="space-step-line done" />
              </div>
              <span className="space-step-label">Gate-in POL</span>
              <span className="space-step-sub">JICT Priok</span>
            </div>

            <div className="space-export-step-item">
              <div className="space-step-head">
                <div className="space-step-dot active"><Ship size={12} strokeWidth={2.2} /></div>
                <div className="space-step-line" />
              </div>
              <span className="space-step-label active">Pelayaran</span>
              <span className="space-step-sub active">In Transit</span>
            </div>

            <div className="space-export-step-item">
              <div className="space-step-head">
                <div className="space-step-dot pending">6</div>
              </div>
              <span className="space-step-label pending">POD (Tujuan)</span>
              <span className="space-step-sub pending">Los Angeles</span>
            </div>
          </div>

          {/* Active Contract & B/L Summary Strip */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 18px",
              background: "#F8FAFC",
              borderRadius: 12,
              border: "1px solid #E2E8F0",
              fontSize: 12.5,
              gap: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16, color: "#475569", flexWrap: "wrap" }}>
              <div>
                <span style={{ color: "#64748B", fontSize: 12 }}>Bill of Lading: </span>
                <strong style={{ color: "#0F172A", fontFamily: "var(--font-mono, monospace)", fontSize: 13 }}>
                  EKL-US2026-0881
                </strong>
              </div>
              <span style={{ color: "#CBD5E1" }}>•</span>
              <div>
                <span style={{ color: "#64748B", fontSize: 12 }}>Muatan: </span>
                <strong style={{ color: "#0F172A", fontSize: 13 }}>Kopi Arabika Gayo (19.2 MT · 1x20' FCL)</strong>
              </div>
            </div>
            <button
              type="button"
              className="space-btn-secondary"
              onClick={() => navigate("documents")}
              title="Buka Dokumen Bill of Lading"
              style={{ padding: "6px 14px", fontSize: 12, flexShrink: 0 }}
            >
              <FileText size={13} />
              <span>Lihat B/L Dokumen</span>
            </button>
          </div>
        </div>

        {/* Right Column: Market Share & Compliance */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Card 1: Pangsa Pasar Ekspor (Professional Donut Pie Chart) */}
          <div className="space-traffic-card-v2">
            <div className="space-payment-v2-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0F172A" }}>
                  Pangsa Pasar Ekspor
                </h3>
                <span style={{ fontSize: 12, color: "#64748B", fontWeight: 500 }}>Distribusi Pengapalan (FOB &amp; CIF)</span>
              </div>
              <span className="space-kpi-badge neutral">18 TEUs</span>
            </div>

            {/* Circular Donut Pie Chart with Center Metric */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "10px 0 4px 0" }}>
              <svg viewBox="0 0 170 170" width="150" height="150">
                <g transform="rotate(-90 85 85)">
                  {/* Base Track */}
                  <circle cx="85" cy="85" r="58" fill="none" stroke="#F1F5F9" strokeWidth="18" />
                  {/* USA 45% (163.99 of 364.42, 2px gap) */}
                  <circle
                    cx="85"
                    cy="85"
                    r="58"
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="18"
                    strokeDasharray="161.99 364.42"
                    strokeDashoffset="0"
                  />
                  {/* Eropa 35% (127.55 of 364.42, 2px gap) */}
                  <circle
                    cx="85"
                    cy="85"
                    r="58"
                    fill="none"
                    stroke="#8B5CF6"
                    strokeWidth="18"
                    strokeDasharray="125.55 364.42"
                    strokeDashoffset="-163.99"
                  />
                  {/* Jepang 20% (72.88 of 364.42, 2px gap) */}
                  <circle
                    cx="85"
                    cy="85"
                    r="58"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="18"
                    strokeDasharray="70.88 364.42"
                    strokeDashoffset="-291.54"
                  />
                </g>
                {/* Center Stat */}
                <text x="85" y="81" textAnchor="middle" style={{ fontSize: "18px", fontWeight: 700, fill: "#0F172A", fontFamily: "inherit" }}>
                  18 TEUs
                </text>
                <text x="85" y="99" textAnchor="middle" style={{ fontSize: "11px", fontWeight: 500, fill: "#64748B", fontFamily: "inherit" }}>
                  Total Ekspor
                </text>
              </svg>
            </div>

            {/* Structured Market Distribution List */}
            <div style={{ display: "flex", flexDirection: "column", gap: 9, padding: "0 4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#2563EB" }} />
                  <span style={{ color: "#334155", fontWeight: 500 }}>USA (Los Angeles)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: "#64748B", fontSize: 11.5 }}>8 TEUs</span>
                  <strong style={{ color: "#2563EB", fontWeight: 700 }}>45%</strong>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#8B5CF6" }} />
                  <span style={{ color: "#334155", fontWeight: 500 }}>Eropa (Rotterdam)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: "#64748B", fontSize: 11.5 }}>6 TEUs</span>
                  <strong style={{ color: "#8B5CF6", fontWeight: 700 }}>35%</strong>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#10B981" }} />
                  <span style={{ color: "#334155", fontWeight: 500 }}>Jepang (Kobe / Tokyo)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: "#64748B", fontSize: 11.5 }}>4 TEUs</span>
                  <strong style={{ color: "#10B981", fontWeight: 700 }}>20%</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Dokumen Wajib Ekspor */}
          <div className="space-export-matrix-card">
            <div className="space-matrix-header">
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0F172A" }}>
                Dokumen Wajib Ekspor
              </h3>
              <span className="status-pill green">6/6 Valid</span>
            </div>

            <div className="space-checklist-items">
              <div className="space-check-row">
                <span className="space-check-name">
                  <CheckCircle2 size={15} style={{ color: "#10B981" }} />
                  PEB & NPE (Kepabeanan)
                </span>
                <span className="space-check-status green">Jalur Hijau</span>
              </div>

              <div className="space-check-row">
                <span className="space-check-name">
                  <CheckCircle2 size={15} style={{ color: "#10B981" }} />
                  Bill of Lading (B/L)
                </span>
                <span className="space-check-status green">On Board</span>
              </div>

              <div className="space-check-row">
                <span className="space-check-name">
                  <CheckCircle2 size={15} style={{ color: "#10B981" }} />
                  Certificate of Origin (COO)
                </span>
                <span className="space-check-status green">Kemendag</span>
              </div>

              <div className="space-check-row">
                <span className="space-check-name">
                  <CheckCircle2 size={15} style={{ color: "#10B981" }} />
                  Karantina & Fumigasi
                </span>
                <span className="space-check-status green">Lolos</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 3: Manifest Pengapalan Ekspor Aktif Table (Full Width) */}
      <div className="space-invoices-card-v2">
        <div className="space-invoices-v2-head">
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0F172A" }}>
              Pengapalan Ekspor Aktif
            </h3>
          </div>
          <div className="space-invoices-v2-actions">
            {/* Clean Segmented Port Control (Non-Button Confusion) */}
            <div className="filter-segmented-group">
              {[
                { id: "all", label: "Semua Pelabuhan" },
                { id: "IDTPP", label: "Tanjung Priok" },
                { id: "IDPNJ", label: "Panjang" },
                { id: "IDSUB", label: "Tanjung Perak" },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`filter-segment-btn ${selectedPort === p.id ? "active" : ""}`}
                  onClick={() => setSelectedPort(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="space-btn-secondary"
              onClick={() => navigate("transactions")}
              style={{ padding: "6px 12px", fontSize: 12 }}
            >
              <span>Semua Transaksi</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="space-invoices-table-v2">
            <thead>
              <tr>
                <th>No. B/L & Kontrak</th>
                <th>Buyer & Destinasi</th>
                <th>Komoditas & Kontainer</th>
                <th>Rute Pelayaran</th>
                <th>Jadwal Kapal</th>
                <th>Status Kepabeanan</th>
                <th>Nilai Ekspor</th>
                <th style={{ textAlign: "right" }}>Aksi Cepat</th>
              </tr>
            </thead>
            <tbody>
              {filteredShipments.map((s) => (
                <tr key={s.blNumber}>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span className="space-invoice-code" onClick={() => navigate("documents")}>
                        {s.blNumber}
                      </span>
                      <small style={{ color: "#64748B", fontSize: 11 }}>{s.invNumber}</small>
                    </div>
                  </td>
                  <td>
                    <div className="space-table-user-cell">
                      <div className={`space-table-avatar ${s.avClass}`}>{s.avatar}</div>
                      <div className="space-table-name-wrap">
                        <span className="space-table-buyer-name">{s.buyer}</span>
                        <span className="space-table-buyer-email">{s.buyerLoc}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <strong style={{ fontSize: 13, color: "#0F172A" }}>{s.commodity}</strong>
                      <span style={{ fontSize: 11.5, color: "#64748B" }}>{s.stowage}</span>
                    </div>
                  </td>
                  <td>
                    <div className="space-table-tracking">
                      <span className="space-tracking-code">{s.polCode} → {s.podCode}</span>
                      <span className="space-tracking-dest">{s.polName} ke {s.podName}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", fontSize: 12 }}>
                      <span style={{ color: "#0F172A" }}>ETD: {s.etd}</span>
                      <span style={{ color: "#0066FF", fontWeight: 600 }}>ETA: {s.eta}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span className={`status-pill ${s.statusPill}`}>{s.statusLabel}</span>
                      <span style={{ fontSize: 11, color: "#166534" }}>{s.paymentLabel}</span>
                    </div>
                  </td>
                  <td>
                    <span className="space-table-amount">{s.amount}</span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: 6 }}>
                      <button
                        type="button"
                        className="space-btn-ghost-sm"
                        onClick={() => navigate("documents")}
                        title="Lihat Dokumen Ekspor"
                      >
                        <FileText size={12} />
                        <span>Dokumen</span>
                      </button>
                      <button
                        type="button"
                        className="space-btn-ghost-sm"
                        onClick={() => navigate("cargo")}
                        title="Rencana Muatan Kontainer"
                      >
                        <Package size={12} />
                        <span>Muatan</span>
                      </button>
                      <button
                        type="button"
                        className="space-btn-secondary"
                        style={{ padding: "3px 9px", fontSize: 11.5 }}
                        onClick={() => navigate("tracking")}
                        title="Lacak Posisi Kapal"
                      >
                        <Compass size={12} />
                        <span>Lacak</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Functional Pagination Bar */}
        <div className="space-invoices-pagination">
          <button
            type="button"
            className="space-page-btn"
            onClick={() => {
              setCurrentPage(1);
              toast.info("Menampilkan halaman 1");
            }}
          >
            ← Sebelumnya
          </button>
          <div className="space-page-numbers">
            <button
              type="button"
              className={`space-page-num ${currentPage === 1 ? "active" : ""}`}
              onClick={() => setCurrentPage(1)}
            >
              01
            </button>
            <button
              type="button"
              className={`space-page-num ${currentPage === 2 ? "active" : ""}`}
              onClick={() => {
                setCurrentPage(2);
                toast.info("Semua transaksi aktif ditampilkan pada daftar utama.");
              }}
            >
              02
            </button>
          </div>
          <button
            type="button"
            className="space-page-btn"
            onClick={() => navigate("transactions")}
          >
            Lihat Semua Transaksi →
          </button>
        </div>
      </div>
    </div>
  );
}

export function ReadinessView({
  shipment,
  update,
  navigate,
  flow,
}: {
  shipment: Shipment;
  update: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void;
  navigate: (screen: ScreenId) => void;
  flow: WorkspaceFlow;
}) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const { readiness, readinessScore, setReadiness } = flow;

  return (
    <div className="module-stack">
      <section className="panel panel-padding">
        <div className="clean-tabs">
          {[
            [1, "1 · Produk & HS Code"],
            [2, "2 · Buyer & Pasar Tujuan"],
            [3, "3 · Kemasan & Sertifikasi"],
            [4, "4 · Ringkasan Kesiapan"],
          ].map(([num, label]) => (
            <button
              key={num}
              type="button"
              className={step === num ? "active" : ""}
              onClick={() => setStep(num as 1 | 2 | 3 | 4)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="content-grid two-thirds" style={{ marginTop: 16, marginBottom: 0 }}>
          <div>
            {step === 1 && (
              <div className="form-grid two">
                <Field
                  label="Produk utama yang diekspor"
                  value={shipment.product}
                  onChange={(v) => update("product", v)}
                />
                <Field
                  label="HS Code referensi"
                  value={shipment.hsCode}
                  onChange={(v) => update("hsCode", v)}
                />
                <Field
                  label="Satuan jual"
                  value={shipment.unit}
                  onChange={(v) => update("unit", v)}
                />
                <Field
                  label="Pengalaman ekspor tim"
                  value={readiness.experience}
                  onChange={(v) => setReadiness({ experience: v })}
                />
                <div className="row-actions" style={{ gridColumn: "1 / -1", marginTop: 4 }}>
                  <button type="button" className="ghost-button" onClick={() => navigate("products")}>
                    <Package size={14} /> Ambil dari Katalog Produk
                  </button>
                  <button type="button" className="save-button" onClick={() => setStep(2)}>
                    Lanjut ke Pasar Tujuan →
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="form-grid two">
                <Field
                  label="Nama perusahaan buyer"
                  value={shipment.buyer}
                  onChange={(v) => update("buyer", v)}
                />
                <Field
                  label="Negara tujuan"
                  value={shipment.buyerCountry}
                  onChange={(v) => update("buyerCountry", v)}
                />
                <Field
                  label="Pelabuhan / kota tujuan"
                  value={shipment.destination}
                  onChange={(v) => update("destination", v)}
                />
                <Field
                  label="Terms pembayaran"
                  value={shipment.paymentTerms}
                  onChange={(v) => update("paymentTerms", v)}
                />
                <div className="row-actions" style={{ gridColumn: "1 / -1", marginTop: 4 }}>
                  <button type="button" className="ghost-button" onClick={() => navigate("partners")}>
                    <UserRound size={14} /> Pilih dari Direktori Mitra
                  </button>
                  <button type="button" className="save-button" onClick={() => setStep(3)}>
                    Lanjut ke Kemasan &amp; Sertifikasi →
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="form-grid two">
                <Field
                  label="Kemasan standar ekspor"
                  value={shipment.packageType}
                  onChange={(v) => update("packageType", v)}
                />
                <SelectField
                  label="Rencana Incoterm"
                  value={shipment.incoterm}
                  onChange={(v) => update("incoterm", v as Incoterm)}
                >
                  {["EXW", "FCA", "FOB", "CFR", "CIF", "DAP", "DDP"].map((term) => (
                    <option key={term}>{term}</option>
                  ))}
                </SelectField>
                <label className="legal-check-row" style={{ gridColumn: "1 / -1" }}>
                  <input
                    type="checkbox"
                    checked={readiness.certReady}
                    onChange={(e) => setReadiness({ certReady: e.target.checked })}
                  />
                  <span>
                    <b>Dokumen mutu / COO / sertifikat pendukung sudah dipetakan</b>
                    <small>Tandai bila daftar persyaratan dari buyer atau broker sudah dikonfirmasi.</small>
                  </span>
                </label>
                <div className="row-actions" style={{ gridColumn: "1 / -1", marginTop: 4 }}>
                  <button type="button" className="ghost-button" onClick={() => navigate("cargo")}>
                    <Box size={14} /> Atur Dimensi Kontainer 3D
                  </button>
                  <button type="button" className="save-button" onClick={() => setStep(4)}>
                    Lihat Ringkasan Kesiapan →
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="module-stack">
                <div className="clean-notice">
                  Seluruh data yang Anda isi di asesmen ini sudah otomatis tersambung ke transaksi{" "}
                  <b>{shipment.reference}</b> di Kalkulator Harga, Dokumen Ekspor, dan Risk Center.
                </div>
                <div className="row-actions">
                  <button type="button" className="save-button" onClick={() => navigate("pricing")}>
                    <Calculator size={14} /> Lanjut Susun Harga &amp; Order
                  </button>
                  <button type="button" className="ghost-button" onClick={() => navigate("documents")}>
                    <FileCheck2 size={14} /> Buka Dokumen Ekspor
                  </button>
                  <button type="button" className="ghost-button" onClick={() => navigate("advisor")}>
                    Tanya AI Advisor
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="panel panel-padding subtle-subpanel">
            <span className="eyebrow">SKOR KESIAPAN AWAL</span>
            <div className="score-headline">
              <strong>{readinessScore}</strong>
              <small>/ 100 · indikatif</small>
            </div>
            <div className="progress-track">
              <i style={{ width: `${readinessScore}%` }} />
            </div>
            <div className="clean-kv">
              <span>Produk &amp; HS Code</span>
              <StatusPill tone={shipment.product && shipment.hsCode ? "green" : "amber"}>
                {shipment.product && shipment.hsCode ? "Terisi" : "Lengkapi"}
              </StatusPill>
            </div>
            <div className="clean-kv">
              <span>Buyer &amp; negara tujuan</span>
              <StatusPill tone={shipment.buyerCountry ? "green" : "amber"}>
                {shipment.buyerCountry || "Perlu isi"}
              </StatusPill>
            </div>
            <div className="clean-kv">
              <span>Pemetaan COO / sertifikat</span>
              <StatusPill tone={readiness.certReady ? "green" : "amber"}>
                {readiness.certReady ? "Siap" : "Belum ditandai"}
              </StatusPill>
            </div>
          </div>
        </div>
      </section>

      <section className="panel panel-padding">
        <div className="panel-head">
          <div>
            <span className="eyebrow">RENCANA KERJA TERHUBUNG</span>
            <h3>Tindak lanjut per divisi</h3>
          </div>
        </div>
        <div className="clean-table-wrap">
          <table className="clean-table">
            <thead>
              <tr>
                <th>Langkah Persiapan</th>
                <th>Divisi</th>
                <th>Status</th>
                <th>Tindakan</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <b>Verifikasi dimensi koli &amp; kapasitas {shipment.containerType}</b>
                </td>
                <td>Operasional</td>
                <td>
                  <StatusPill tone={shipment.cartonLength > 0 ? "green" : "amber"}>
                    {shipment.cartonLength > 0 ? "Terukur" : "Perlu isi"}
                  </StatusPill>
                </td>
                <td>
                  <button type="button" className="table-inline-btn" onClick={() => navigate("cargo")}>
                    Buka Muatan →
                  </button>
                </td>
              </tr>
              <tr>
                <td>
                  <b>Konfirmasi HS Code {shipment.hsCode || "—"} dengan PPJK / bea cukai</b>
                </td>
                <td>Compliance</td>
                <td>
                  <StatusPill tone={flow.legalChecklist.hsCodeReviewed ? "green" : "amber"}>
                    {flow.legalChecklist.hsCodeReviewed ? "Terkonfirmasi" : "Verifikasi ahli"}
                  </StatusPill>
                </td>
                <td>
                  <button type="button" className="table-inline-btn" onClick={() => navigate("risk")}>
                    Buka Risk Center →
                  </button>
                </td>
              </tr>
              <tr>
                <td>
                  <b>Hitung biaya &amp; margin penawaran {shipment.incoterm}</b>
                </td>
                <td>Sales</td>
                <td>
                  <StatusPill
                    tone={flow.effectiveApprovalStatus === "Tercatat direview" ? "green" : "blue"}
                  >
                    {flow.effectiveApprovalStatus}
                  </StatusPill>
                </td>
                <td>
                  <button type="button" className="table-inline-btn" onClick={() => navigate("pricing")}>
                    Buka Harga →
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: "pimpinan" | "sales" | "ops" | "finance";
  roleLabel: string;
  department: string;
  authority: string;
  status: "Aktif" | "Undangan Terkirim";
  isOwner?: boolean;
};

const DEFAULT_TEAM_MEMBERS: TeamMember[] = [
  {
    id: "mem-1",
    name: "Muhajirin Fatona",
    email: "muhajirin@indico-export.com",
    role: "pimpinan",
    roleLabel: "Pimpinan / Direktur Eksekutif",
    department: "Direksi & Otorisasi",
    authority: "Otorisasi final penawaran harga, dispensasi margin, & penandatanganan kontrak",
    status: "Aktif",
    isOwner: true,
  },
  {
    id: "mem-2",
    name: "Ahmad Fauzi",
    email: "ahmad.fauzi@indico-export.com",
    role: "sales",
    roleLabel: "Sales & Marketing Ekspor",
    department: "Divisi Penjualan Internasional",
    authority: "Negosiasi buyer luar negeri, input PO / LOI, & pengajuan kalkulasi penawaran",
    status: "Aktif",
  },
  {
    id: "mem-3",
    name: "Siti Rahmawati",
    email: "siti.rahma@indico-export.com",
    role: "ops",
    roleLabel: "Operasional & Dokumen Ekspor",
    department: "Divisi Pengiriman & Kepabeanan",
    authority: "Kelola PEB Bea Cukai, perizinan e-SKA/COO Kemendag, karantina mutu, & kontainer",
    status: "Aktif",
  },
  {
    id: "mem-4",
    name: "Budi Hartono",
    email: "budi.hartono@indico-export.com",
    role: "finance",
    roleLabel: "Keuangan & Akuntansi Ekspor",
    department: "Divisi Finansial & Perbankan",
    authority: "Verifikasi pembayaran DP, validasi pencairan L/C, & pelaporan devisa DHE BI",
    status: "Aktif",
  },
];

type ApprovalQueueItem = {
  id: string;
  reference: string;
  revision: number;
  buyer: string;
  buyerCountry: string;
  destination: string;
  salesPic: string;
  product: string;
  quantity: number;
  unit: string;
  incoterm: string;
  offerValue: number;
  costValue: number;
  currency: string;
  margin: number;
  discount: number;
  paymentTerms: string;
  containerType: string;
  approvalStatus: string;
  tone: "green" | "amber" | "red" | "blue" | "gray";
  isCurrent: boolean;
  isCloud: boolean;
  shipmentData?: Shipment;
};

export function ApprovalsView({
  shipment,
  pricing,
  navigate,
  flow,
  user,
  shipmentsList = [],
  activeShipmentId,
  loadShipment,
  loadCustomShipment,
}: {
  shipment: Shipment;
  pricing: Pricing;
  navigate: (screen: ScreenId) => void;
  flow: WorkspaceFlow;
  user?: {
    id?: number;
    name?: string | null;
    email?: string | null;
    companyName?: string | null;
    role?: string | null;
  } | null;
  shipmentsList?: ShipmentListItem[];
  activeShipmentId?: string | null;
  loadShipment?: (id: string) => Promise<void>;
  loadCustomShipment?: (custom: Shipment, id?: string | null) => void;
}) {
  const [activeTab, setActiveTab] = useState<"approvals" | "team" | "matrix">("approvals");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "APPROVED">("ALL");
  const [reviewModalItem, setReviewModalItem] = useState<ApprovalQueueItem | null>(null);
  const [comment, setComment] = useState("");

  // State Tim Workspace (Enterprise RBAC)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    try {
      const saved = localStorage.getItem("eksporflow_team_members_v1");
      if (saved) return JSON.parse(saved) as TeamMember[];
    } catch {}
    return DEFAULT_TEAM_MEMBERS;
  });

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"pimpinan" | "sales" | "ops" | "finance">("sales");

  // Ambil transaksi lokal
  const [localList] = useState<LocalShipmentRecord[]>(() => {
    try {
      const saved = localStorage.getItem("eksporflow_local_shipments_v1");
      return saved ? (JSON.parse(saved) as LocalShipmentRecord[]) : [];
    } catch {
      return [];
    }
  });

  // Susun antrian penawaran secara bersih dan konsisten
  const queueItems = useMemo(() => {
    const list: ApprovalQueueItem[] = [];

    // 1. Order yang sedang aktif saat ini
    const currentRef = shipment.reference?.trim() || shipment.poNumber?.trim() || "PO-DRAFT-01";
    const currentBuyer = shipment.buyer?.trim() || "Mitra Pembeli Internasional";
    const currentSales = user?.name?.trim() || "Muhajirin Fatona (Sales)";

    list.push({
      id: activeShipmentId || "current-active",
      reference: currentRef,
      revision: shipment.documentRevision || 1,
      buyer: currentBuyer,
      buyerCountry: shipment.buyerCountry?.trim() || "Uni Emirat Arab",
      destination: shipment.destination?.trim() || "Jebel Ali Port",
      salesPic: currentSales,
      product: shipment.product?.trim() || "Biji Kopi Robusta Grade 1",
      quantity: shipment.quantity || 20,
      unit: shipment.unit || "MT",
      incoterm: shipment.incoterm || "FOB",
      offerValue: pricing.active.offer > 0 ? pricing.active.offer : 84000,
      costValue: pricing.active.cost > 0 ? pricing.active.cost : 68880,
      currency: shipment.currency || "USD",
      margin: shipment.margin || 18,
      discount: shipment.discount || 0,
      paymentTerms: shipment.paymentTerms || "T/T 30% DP, 70% against B/L",
      containerType: shipment.containerType || "20ft FCL",
      approvalStatus: flow.effectiveApprovalStatus,
      tone:
        flow.effectiveApprovalStatus === "Tercatat direview"
          ? "green"
          : flow.effectiveApprovalStatus === "Revisi diminta"
            ? "red"
            : "amber",
      isCurrent: true,
      isCloud: Boolean(activeShipmentId),
      shipmentData: shipment,
    });

    // 2. Order dari database cloud
    for (const s of shipmentsList) {
      if (s.id === activeShipmentId) continue;
      if (!s.reference || s.reference === "Transaksi Ekspor" || s.reference.startsWith("EXP-2026-")) continue;

      list.push({
        id: s.id,
        reference: s.reference,
        revision: 1,
        buyer: s.buyer?.trim() || "Tokyo Global Foods Co., Ltd.",
        buyerCountry: s.buyerCountry?.trim() || "Jepang",
        destination: "Port of Tokyo",
        salesPic: "Ahmad Fauzi (Sales)",
        product: s.product?.trim() || "Briket Arang Kelapa Premium",
        quantity: s.quantity || 25,
        unit: s.unit || "MT",
        incoterm: s.incoterm || "CIF",
        offerValue: 62500,
        costValue: 48750,
        currency: "USD",
        margin: 22,
        discount: 500,
        paymentTerms: "Irrevocable At Sight L/C",
        containerType: "40ft HC",
        approvalStatus: s.status === "Confirmed" ? "Tercatat direview" : "Menunggu review",
        tone: s.status === "Confirmed" ? "green" : "amber",
        isCurrent: false,
        isCloud: true,
      });
    }

    // 3. Order dari draft lokal
    for (const loc of localList) {
      if (!loc.reference || loc.reference === "Transaksi Ekspor") continue;
      const already = list.some(
        (item) => item.reference.toLowerCase() === loc.reference.toLowerCase() || item.id === loc.id
      );
      if (!already) {
        list.push({
          id: loc.id,
          reference: loc.reference,
          revision: loc.shipment?.documentRevision || 1,
          buyer: loc.buyer || "Al Barakah Foodstuff LLC",
          buyerCountry: loc.buyerCountry || "Uni Emirat Arab",
          destination: loc.shipment?.destination || "Port of Jebel Ali",
          salesPic: "Muhajirin Fatona (Sales)",
          product: loc.product || "Biji Kopi Robusta",
          quantity: loc.quantity || 20,
          unit: loc.unit || "MT",
          incoterm: loc.incoterm || "FOB",
          offerValue: 84000,
          costValue: 68880,
          currency: loc.shipment?.currency || "USD",
          margin: loc.shipment?.margin || 18,
          discount: loc.shipment?.discount || 0,
          paymentTerms: loc.shipment?.paymentTerms || "T/T 30% DP",
          containerType: loc.shipment?.containerType || "20ft FCL",
          approvalStatus: loc.status === "Confirmed" ? "Tercatat direview" : "Menunggu review",
          tone: loc.status === "Confirmed" ? "green" : "amber",
          isCurrent: false,
          isCloud: false,
          shipmentData: loc.shipment,
        });
      }
    }

    // 4. Jika hanya ada 1 draft, tampilkan 2 contoh transaksi korporasi (Buyer A vs Buyer B)
    if (list.length <= 1) {
      list.push({
        id: "corp-order-a",
        reference: "ABF-PO-2026-089",
        revision: 1,
        buyer: "For Al Barakah Foodstuff Trading LLC",
        buyerCountry: "Uni Emirat Arab",
        destination: "Port of Jebel Ali, Dubai",
        salesPic: "Muhajirin Fatona (Sales)",
        product: "Biji Kopi Robusta Grade 1",
        quantity: 20,
        unit: "MT",
        incoterm: "FOB",
        offerValue: 84000,
        costValue: 68880,
        currency: "USD",
        margin: 18,
        discount: 0,
        paymentTerms: "T/T 30% DP, 70% against B/L",
        containerType: "20ft FCL",
        approvalStatus: "Menunggu review",
        tone: "amber",
        isCurrent: false,
        isCloud: false,
        shipmentData: {
          ...shipment,
          reference: "ABF-PO-2026-089",
          poNumber: "ABF-PO-2026-089",
          buyer: "For Al Barakah Foodstuff Trading LLC",
          buyerCountry: "Uni Emirat Arab",
          destination: "Port of Jebel Ali, Dubai",
          product: "Biji Kopi Robusta Grade 1",
          hsCode: "0901.11",
          quantity: 20,
          unit: "MT",
          unitPrice: 4200,
          incoterm: "FOB",
          namedPlace: "Tanjung Priok, Jakarta",
          margin: 18,
          discount: 0,
          shipmentStatus: "Draft",
          paymentTerms: "T/T 30% DP, 70% against B/L",
        },
      });

      list.push({
        id: "corp-order-b",
        reference: "SNF-PO-2026-114",
        revision: 2,
        buyer: "Tokyo Global Foods Co., Ltd.",
        buyerCountry: "Jepang",
        destination: "Port of Tokyo",
        salesPic: "Ahmad Fauzi (Sales)",
        product: "Briket Arang Kelapa Premium",
        quantity: 25,
        unit: "MT",
        incoterm: "CIF",
        offerValue: 62500,
        costValue: 48750,
        currency: "USD",
        margin: 22,
        discount: 500,
        paymentTerms: "Irrevocable At Sight L/C",
        containerType: "40ft HC",
        approvalStatus: "Tercatat direview",
        tone: "green",
        isCurrent: false,
        isCloud: false,
        shipmentData: {
          ...shipment,
          reference: "SNF-PO-2026-114",
          poNumber: "SNF-PO-2026-114",
          buyer: "Tokyo Global Foods Co., Ltd.",
          buyerCountry: "Jepang",
          destination: "Port of Tokyo",
          product: "Briket Arang Kelapa Premium",
          hsCode: "4402.90",
          quantity: 25,
          unit: "MT",
          unitPrice: 2500,
          incoterm: "CIF",
          namedPlace: "Port of Tokyo",
          margin: 22,
          discount: 500,
          shipmentStatus: "Confirmed",
          paymentTerms: "Irrevocable At Sight L/C",
        },
      });
    }

    return list;
  }, [
    shipment,
    pricing.active.offer,
    pricing.active.cost,
    flow.effectiveApprovalStatus,
    shipmentsList,
    localList,
    activeShipmentId,
    user?.name,
  ]);

  // Filter pencarian dan tab status
  const filteredQueue = useMemo(() => {
    return queueItems.filter((item) => {
      if (statusFilter === "PENDING" && item.approvalStatus === "Tercatat direview") return false;
      if (statusFilter === "APPROVED" && item.approvalStatus !== "Tercatat direview") return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.reference.toLowerCase().includes(q) ||
        item.buyer.toLowerCase().includes(q) ||
        item.buyerCountry.toLowerCase().includes(q) ||
        item.salesPic.toLowerCase().includes(q) ||
        item.product.toLowerCase().includes(q)
      );
    });
  }, [queueItems, statusFilter, searchQuery]);

  const pendingCount = queueItems.filter((q) => q.approvalStatus !== "Tercatat direview").length;
  const approvedCount = queueItems.filter((q) => q.approvalStatus === "Tercatat direview").length;
  const totalOfferValue = queueItems.reduce((acc, curr) => acc + curr.offerValue, 0);

  const handleOpenReviewModal = async (item: ApprovalQueueItem) => {
    setReviewModalItem(item);
    setComment(flow.approval.comment || "");

    // Muat ke workspace aktif bila berbeda
    if (!item.isCurrent) {
      if (item.isCloud && loadShipment) {
        await loadShipment(item.id);
      } else if (item.shipmentData && loadCustomShipment) {
        loadCustomShipment(item.shipmentData, item.id);
      }
    }
  };

  const handleDecision = (next: "Revisi diminta" | "Tercatat direview") => {
    if (next === "Revisi diminta" && !comment.trim()) {
      toast.error("Catatan reviewer wajib diisi saat meminta revisi.");
      return;
    }
    flow.recordApprovalDecision(next, comment.trim());
    toast.success(`Keputusan Otorisasi Tercatat: ${next}`, {
      description: `Status telah disinkronkan ke Dokumen Ekspor & Kalkulator Harga.`,
    });
    setReviewModalItem(null);
  };

  const handleAddTeamMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberEmail.trim()) {
      toast.error("Nama dan email anggota tim wajib diisi.");
      return;
    }

    const roleConfig = {
      pimpinan: {
        roleLabel: "Pimpinan / Approver",
        department: "Direksi & Otorisasi",
        authority: "Otorisasi final penawaran, dispensasi margin, & penandatanganan kontrak",
      },
      sales: {
        roleLabel: "Sales & Marketing Ekspor",
        department: "Divisi Penjualan Internasional",
        authority: "Negosiasi buyer luar negeri, input PO, & pengajuan harga",
      },
      ops: {
        roleLabel: "Operasional & Dokumen Ekspor",
        department: "Divisi Pengiriman & Kepabeanan",
        authority: "Kelola PEB Bea Cukai, sertifikat e-SKA Kemendag, & kontainer",
      },
      finance: {
        roleLabel: "Keuangan & Akuntansi",
        department: "Divisi Finansial & Perbankan",
        authority: "Verifikasi pembayaran DP, pencairan L/C, & pelaporan devisa DHE BI",
      },
    }[newMemberRole];

    const newMember: TeamMember = {
      id: `mem-${Date.now()}`,
      name: newMemberName.trim(),
      email: newMemberEmail.trim(),
      role: newMemberRole,
      roleLabel: roleConfig.roleLabel,
      department: roleConfig.department,
      authority: roleConfig.authority,
      status: "Undangan Terkirim",
    };

    const updated = [...teamMembers, newMember];
    setTeamMembers(updated);
    try {
      localStorage.setItem("eksporflow_team_members_v1", JSON.stringify(updated));
    } catch {}

    toast.success(`Undangan tim berhasil dikirim!`, {
      description: `Undangan peran ${roleConfig.roleLabel} dikirimkan ke ${newMemberEmail}.`,
    });

    setNewMemberName("");
    setNewMemberEmail("");
    setIsInviteModalOpen(false);
  };

  const handleRemoveMember = (id: string, name: string) => {
    if (id === "mem-1") {
      toast.error("Akun utama workspace (Owner) tidak dapat dihapus.");
      return;
    }
    const confirmed = window.confirm(`Apakah Anda yakin ingin menonaktifkan akses tim untuk ${name}?`);
    if (!confirmed) return;

    const filtered = teamMembers.filter((m) => m.id !== id);
    setTeamMembers(filtered);
    try {
      localStorage.setItem("eksporflow_team_members_v1", JSON.stringify(filtered));
    } catch {}
    toast.success(`Akses tim untuk ${name} telah dinonaktifkan.`);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* 1. SEGMENTED TABS BAR */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          padding: "10px 14px",
          background: "#ffffff",
          borderRadius: 10,
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "inline-flex", background: "#f1f5f9", padding: 3, borderRadius: 8 }}>
          <button
            type="button"
            onClick={() => setActiveTab("approvals")}
            style={{
              padding: "7px 16px",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: activeTab === "approvals" ? "var(--brand-primary)" : "transparent",
              color: activeTab === "approvals" ? "#ffffff" : "#475569",
              boxShadow: activeTab === "approvals" ? "0 1px 2px rgba(2,132,199,0.2)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            <ClipboardCheck size={15} /> Antrian Otorisasi ({queueItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("team")}
            style={{
              padding: "7px 16px",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: activeTab === "team" ? "var(--brand-primary)" : "transparent",
              color: activeTab === "team" ? "#ffffff" : "#475569",
              boxShadow: activeTab === "team" ? "0 1px 2px rgba(2,132,199,0.2)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            <Users size={15} /> Kelola Tim &amp; Role RBAC ({teamMembers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("matrix")}
            style={{
              padding: "7px 16px",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: activeTab === "matrix" ? "var(--brand-primary)" : "transparent",
              color: activeTab === "matrix" ? "#ffffff" : "#475569",
              boxShadow: activeTab === "matrix" ? "0 1px 2px rgba(2,132,199,0.2)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            <ShieldCheck size={15} /> Matriks Batas Wewenang (SoD)
          </button>
        </div>

        <div style={{ fontSize: 12.5, color: "#64748b" }}>
          Perusahaan: <b style={{ color: "#0f172a" }}>Indico Export Indonesia</b>
        </div>
      </div>

      {/* TAB 1: ANTRIAN PERSETUJUAN PENAWARAN (FULL-WIDTH CLEAN TABLE) */}
      {activeTab === "approvals" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* 3 Top KPI Metric Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 14,
            }}
          >
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                padding: "16px 20px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                Menunggu Otorisasi Direksi
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", marginTop: 4 }}>
                {pendingCount} Penawaran
              </div>
              <div style={{ fontSize: 12, color: "var(--brand-primary)", marginTop: 2, fontWeight: 500 }}>
                Nilai Akumulasi: {formatMoney(totalOfferValue, "USD")}
              </div>
            </div>

            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                padding: "16px 20px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                Rata-rata Margin Penawaran
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#15803d", marginTop: 4 }}>
                18.3%
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                Target Ambang Standar: min. 20%
              </div>
            </div>

            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                padding: "16px 20px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                Kepatuhan Sanksi Dagang
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "var(--brand-primary)", marginTop: 4 }}>
                100% Lolos Skrining
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                Terverifikasi AI Sanctions Screening
              </div>
            </div>
          </div>

          {/* Filter & Search Toolbar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              background: "#ffffff",
              padding: "12px 16px",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
            }}
          >
            {/* Filter Chips */}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                style={{
                  padding: "5px 12px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: statusFilter === "ALL" ? "1.5px solid var(--brand-primary)" : "1px solid #e2e8f0",
                  background: statusFilter === "ALL" ? "#f0f9ff" : "#ffffff",
                  color: statusFilter === "ALL" ? "var(--brand-primary)" : "#64748b",
                }}
              >
                Semua ({queueItems.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("PENDING")}
                style={{
                  padding: "5px 12px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: statusFilter === "PENDING" ? "1.5px solid #d97706" : "1px solid #e2e8f0",
                  background: statusFilter === "PENDING" ? "#fffbeb" : "#ffffff",
                  color: statusFilter === "PENDING" ? "#b45309" : "#64748b",
                }}
              >
                Menunggu Otorisasi ({pendingCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("APPROVED")}
                style={{
                  padding: "5px 12px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: statusFilter === "APPROVED" ? "1.5px solid #16a34a" : "1px solid #e2e8f0",
                  background: statusFilter === "APPROVED" ? "#f0fdf4" : "#ffffff",
                  color: statusFilter === "APPROVED" ? "#15803d" : "#64748b",
                }}
              >
                Telah Disetujui ({approvedCount})
              </button>
            </div>

            {/* Input Cari */}
            <div style={{ position: "relative", width: 280 }}>
              <Search
                size={14}
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari PO, buyer, negara..."
                style={{
                  width: "100%",
                  padding: "6px 10px 6px 32px",
                  borderRadius: 6,
                  border: "1px solid #cbd5e1",
                  fontSize: 12.5,
                  color: "#0f172a",
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* Tabel Antrian Lengkap (Full-Width, Tanpa Teks Tertekuk) */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            }}
          >
            <div className="clean-table-wrap">
              <table className="clean-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    <th style={{ width: "17%", padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#475569" }}>
                      NOMOR PO / REF
                    </th>
                    <th style={{ width: "24%", padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#475569" }}>
                      NAMA BUYER &amp; NEGARA
                    </th>
                    <th style={{ width: "16%", padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#475569" }}>
                      PEMOHON (SALES PIC)
                    </th>
                    <th style={{ width: "14%", padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#475569" }}>
                      KOMODITAS
                    </th>
                    <th style={{ width: "12%", padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#475569" }}>
                      PENAWARAN
                    </th>
                    <th style={{ width: "8%", padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#475569" }}>
                      MARGIN
                    </th>
                    <th style={{ width: "9%", padding: "12px 16px", textAlign: "center", fontSize: 12, fontWeight: 700, color: "#475569" }}>
                      AKSI
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQueue.map((item) => (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        background: item.isCurrent ? "#f8fafc" : "#ffffff",
                      }}
                    >
                      <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <b style={{ fontSize: 13, color: "#0f172a" }}>{item.reference}</b>
                          <span
                            style={{
                              fontSize: 10.5,
                              color: "#64748b",
                              background: "#f1f5f9",
                              padding: "1px 6px",
                              borderRadius: 4,
                              fontWeight: 600,
                            }}
                          >
                            Rev R{item.revision}
                          </span>
                        </div>
                        {item.isCurrent && (
                          <div style={{ fontSize: 11, color: "var(--brand-primary)", fontWeight: 600, marginTop: 2 }}>
                            ● Sedang Dibuka di Workspace
                          </div>
                        )}
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <b style={{ fontSize: 13, color: "#1e293b", display: "block" }}>
                          {item.buyer}
                        </b>
                        <span style={{ fontSize: 11.5, color: "#64748b" }}>
                          🌍 {item.buyerCountry} · {item.destination}
                        </span>
                      </td>

                      <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>
                          {item.salesPic}
                        </div>
                        <span style={{ fontSize: 11, color: "#64748b" }}>Sales Executive</span>
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontSize: 13, color: "#0f172a", fontWeight: 500 }}>
                          {item.product}
                        </div>
                        <span style={{ fontSize: 11.5, color: "#64748b" }}>
                          {item.quantity} {item.unit}
                        </span>
                      </td>

                      <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                        <b style={{ fontSize: 13, color: "var(--brand-primary)" }}>
                          {formatMoney(item.offerValue, item.currency)}
                        </b>
                        <span style={{ fontSize: 11.5, color: "#64748b", marginLeft: 4 }}>
                          ({item.incoterm})
                        </span>
                      </td>

                      <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: 4,
                            fontSize: 11.5,
                            fontWeight: 700,
                            background: item.margin < 20 ? "#fef3c7" : "#dcfce7",
                            color: item.margin < 20 ? "#b45309" : "#15803d",
                          }}
                        >
                          {item.margin}%
                        </span>
                      </td>

                      <td style={{ padding: "14px 16px", textAlign: "center", whiteSpace: "nowrap" }}>
                        <button
                          type="button"
                          onClick={() => handleOpenReviewModal(item)}
                          style={{
                            background: item.approvalStatus === "Tercatat direview" ? "#f8fafc" : "var(--brand-primary)",
                            border: item.approvalStatus === "Tercatat direview" ? "1px solid #cbd5e1" : "none",
                            color: item.approvalStatus === "Tercatat direview" ? "#475569" : "#ffffff",
                            padding: "6px 14px",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          {item.approvalStatus === "Tercatat direview" ? "Lihat Detail" : "Tinjau & Otorisasi"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: KELOLA TIM & ROLE RBAC */}
      {activeTab === "team" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Header Bar Tim */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              background: "#ffffff",
              padding: "16px 20px",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
            }}
          >
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                Matriks Divisi &amp; Peran Tim Ekspor
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setIsInviteModalOpen(true)}
              style={{
                background: "var(--brand-primary)",
                color: "#ffffff",
                border: "none",
                fontWeight: 600,
                fontSize: 12.5,
                padding: "8px 16px",
                borderRadius: 6,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <UserPlus size={15} /> + Tambah Anggota Tim
            </button>
          </div>

          {/* 4 Kartu Divisi */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 }}>
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 18 }}>👔</span>
                <b style={{ fontSize: 13, color: "#0f172a" }}>Pimpinan / Direktur</b>
              </div>
              <div style={{ fontSize: 11.5, color: "#64748b", lineHeight: 1.4, marginBottom: 10 }}>
                Otorisasi penawaran, dispensasi margin, &amp; penandatanganan kontrak ekspor.
              </div>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: "#0369a1", background: "#e0f2fe", padding: "2px 6px", borderRadius: 4 }}>
                Approver (Otoritas Penuh)
              </span>
            </div>

            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 18 }}>💼</span>
                <b style={{ fontSize: 13, color: "#0f172a" }}>Sales &amp; Marketing</b>
              </div>
              <div style={{ fontSize: 11.5, color: "#64748b", lineHeight: 1.4, marginBottom: 10 }}>
                Negosiasi buyer luar negeri, input PO/LOI, &amp; pengajuan kalkulasi penawaran.
              </div>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: "#166534", background: "#dcfce7", padding: "2px 6px", borderRadius: 4 }}>
                Requester (Pemohon)
              </span>
            </div>

            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 18 }}>📦</span>
                <b style={{ fontSize: 13, color: "#0f172a" }}>Operasional &amp; Dokumen</b>
              </div>
              <div style={{ fontSize: 11.5, color: "#64748b", lineHeight: 1.4, marginBottom: 10 }}>
                Kelola PEB Bea Cukai, perizinan e-SKA/COO, karantina, &amp; booking kontainer.
              </div>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: "#854d0e", background: "#fef9c3", padding: "2px 6px", borderRadius: 4 }}>
                Customs &amp; Shipping
              </span>
            </div>

            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 18 }}>💳</span>
                <b style={{ fontSize: 13, color: "#0f172a" }}>Keuangan &amp; Akuntansi</b>
              </div>
              <div style={{ fontSize: 11.5, color: "#64748b", lineHeight: 1.4, marginBottom: 10 }}>
                Verifikasi mutasi DP bank, pencairan L/C, &amp; pelaporan devisa DHE BI.
              </div>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: "#6b21a8", background: "#f3e8ff", padding: "2px 6px", borderRadius: 4 }}>
                Finance &amp; Treasury
              </span>
            </div>
          </div>

          {/* Tabel Roster Anggota Tim */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              padding: "16px 20px",
            }}
          >
            <b style={{ fontSize: 14, color: "#0f172a", display: "block", marginBottom: 12 }}>
              Daftar Anggota Tim Terdaftar ({teamMembers.length})
            </b>

            <div className="clean-table-wrap">
              <table className="clean-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    <th style={{ width: "26%", padding: "10px 14px", textAlign: "left", fontSize: 12, color: "#475569" }}>
                      ANGGOTA TIM
                    </th>
                    <th style={{ width: "22%", padding: "10px 14px", textAlign: "left", fontSize: 12, color: "#475569" }}>
                      PERAN &amp; DIVISI
                    </th>
                    <th style={{ width: "36%", padding: "10px 14px", textAlign: "left", fontSize: 12, color: "#475569" }}>
                      HAK AKSES SISTEM
                    </th>
                    <th style={{ width: "10%", padding: "10px 14px", textAlign: "left", fontSize: 12, color: "#475569" }}>
                      STATUS
                    </th>
                    <th style={{ width: "6%", padding: "10px 14px", textAlign: "center", fontSize: 12, color: "#475569" }}>
                      AKSI
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map((member) => (
                    <tr key={member.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                              background: member.isOwner ? "var(--brand-primary)" : "#e2e8f0",
                              color: member.isOwner ? "#ffffff" : "#475569",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: 12,
                            }}
                          >
                            {member.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <b style={{ fontSize: 13, color: "#0f172a" }}>{member.name}</b>
                            {member.isOwner && (
                              <span
                                style={{
                                  fontSize: 10,
                                  color: "var(--brand-primary)",
                                  background: "#e0f2fe",
                                  padding: "1px 5px",
                                  borderRadius: 4,
                                  fontWeight: 700,
                                  marginLeft: 6,
                                }}
                              >
                                Owner
                              </span>
                            )}
                            <div style={{ fontSize: 11.5, color: "#64748b" }}>{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <b style={{ fontSize: 13, color: "#0f172a" }}>{member.roleLabel}</b>
                        <span className="row-sub">{member.department}</span>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ fontSize: 12, color: "#475569" }}>{member.authority}</span>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span
                          style={{
                            padding: "2px 7px",
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            background: member.status === "Aktif" ? "#dcfce7" : "#fef3c7",
                            color: member.status === "Aktif" ? "#166534" : "#b45309",
                          }}
                        >
                          {member.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "center" }}>
                        {!member.isOwner ? (
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(member.id, member.name)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#dc2626",
                              cursor: "pointer",
                              padding: "4px 8px",
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            Hapus
                          </button>
                        ) : (
                          <span style={{ fontSize: 11, color: "#94a3b8" }}>Utama</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MATRIKS KEBIJAKAN OTORISASI (ENTERPRISE SOD RULES) */}
      {activeTab === "matrix" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              background: "#ffffff",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              padding: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <ShieldCheck size={20} style={{ color: "var(--brand-primary)" }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                Matriks Batas Wewenang &amp; Kebijakan Otorisasi (SoD)
              </h3>
            </div>

            <div className="clean-table-wrap">
              <table className="clean-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    <th style={{ width: "28%", padding: "10px 14px", textAlign: "left", fontSize: 12, color: "#475569" }}>
                      KATEGORI TRANSAKSI
                    </th>
                    <th style={{ width: "24%", padding: "10px 14px", textAlign: "left", fontSize: 12, color: "#475569" }}>
                      AMBANG BATAS (THRESHOLD)
                    </th>
                    <th style={{ width: "24%", padding: "10px 14px", textAlign: "left", fontSize: 12, color: "#475569" }}>
                      TINGKAT PEJABAT APPROVER
                    </th>
                    <th style={{ width: "24%", padding: "10px 14px", textAlign: "left", fontSize: 12, color: "#475569" }}>
                      STATUS GUARDRAIL
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 14px" }}>
                      <b>Nilai Transaksi Material</b>
                      <span className="row-sub">Total nilai FOB/CIF pesanan</span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <b style={{ color: "#0f172a" }}>&gt; $25,000 USD</b>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <b style={{ color: "var(--brand-primary)" }}>Direktur Utama / Owner</b>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#166534", background: "#dcfce7", padding: "2px 6px", borderRadius: 4 }}>
                        Wajib Otorisasi Direksi
                      </span>
                    </td>
                  </tr>

                  <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 14px" }}>
                      <b>Dispensasi Margin Bersih</b>
                      <span className="row-sub">Margin penawaran di bawah target</span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <b style={{ color: "#b45309" }}>&lt; 20% Target Kuartal</b>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <b style={{ color: "var(--brand-primary)" }}>Direktur Operasional / Pimpinan</b>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#b45309", background: "#fef3c7", padding: "2px 6px", borderRadius: 4 }}>
                        Wajib Justifikasi Margin
                      </span>
                    </td>
                  </tr>

                  <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 14px" }}>
                      <b>Pemberian Diskon Khusus</b>
                      <span className="row-sub">Diskon harga yang diajukan sales</span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <b style={{ color: "#0f172a" }}>&gt; $1,000 USD</b>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <b style={{ color: "var(--brand-primary)" }}>Manajer Penjualan Ekspor</b>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#166534", background: "#dcfce7", padding: "2px 6px", borderRadius: 4 }}>
                        Wajib Approval Manajer
                      </span>
                    </td>
                  </tr>

                  <tr>
                    <td style={{ padding: "12px 14px" }}>
                      <b>Syarat Pembayaran Berisiko</b>
                      <span className="row-sub">Metode tanpa uang muka / Open Account</span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <b style={{ color: "#dc2626" }}>DP 0% / D/A / D/P</b>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <b style={{ color: "var(--brand-primary)" }}>Direktur Keuangan (CFO)</b>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#dc2626", background: "#fee2e2", padding: "2px 6px", borderRadius: 4 }}>
                        Wajib Analisis Kredit
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL DIALOG PENINJAUAN & OTORISASI (FOCUS EXECUTIVE MODAL) */}
      {reviewModalItem && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 20,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 12,
              width: "100%",
              maxWidth: 680,
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "24px 28px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                paddingBottom: 14,
                borderBottom: "1px solid #e2e8f0",
                marginBottom: 16,
              }}
            >
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--brand-primary)", textTransform: "uppercase" }}>
                  LEMBAR OTORISASI PENAWARAN EKSEKUTIF
                </span>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: "2px 0 0" }}>
                  {reviewModalItem.reference} · {reviewModalItem.buyer}
                </h3>
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  Tujuan: {reviewModalItem.buyerCountry} · {reviewModalItem.destination}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setReviewModalItem(null)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  padding: 4,
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* 3 Metrics di Modal */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px" }}>
                <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Harga Penawaran</span>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginTop: 2 }}>
                  {formatMoney(reviewModalItem.offerValue, reviewModalItem.currency)}
                </div>
                <div style={{ fontSize: 11, color: "#64748b" }}>{reviewModalItem.incoterm}</div>
              </div>

              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px" }}>
                <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>HPP &amp; Logistik</span>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginTop: 2 }}>
                  {formatMoney(reviewModalItem.costValue, reviewModalItem.currency)}
                </div>
                <div style={{ fontSize: 11, color: "#64748b" }}>Cost to serve</div>
              </div>

              <div
                style={{
                  background: reviewModalItem.margin < 20 ? "#fffbeb" : "#f0fdf4",
                  border: reviewModalItem.margin < 20 ? "1px solid #fde68a" : "1px solid #bbf7d0",
                  borderRadius: 8,
                  padding: "10px 14px",
                }}
              >
                <span style={{ fontSize: 11, color: reviewModalItem.margin < 20 ? "#92400e" : "#166534", fontWeight: 600 }}>
                  Margin Keuntungan
                </span>
                <div style={{ fontSize: 18, fontWeight: 700, color: reviewModalItem.margin < 20 ? "#b45309" : "#15803d", marginTop: 2 }}>
                  {reviewModalItem.margin}%
                </div>
                <div style={{ fontSize: 11, color: reviewModalItem.margin < 20 ? "#b45309" : "#166534" }}>
                  {reviewModalItem.margin < 20 ? "⚠️ Butuh Dispensasi" : "✓ Memenuhi Target"}
                </div>
              </div>
            </div>

            {/* Rincian Grid 2 Kolom */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 14,
                marginBottom: 16,
              }}
            >
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 12 }}>
                <b style={{ fontSize: 12, color: "#0f172a", display: "block", marginBottom: 8 }}>
                  📋 Spesifikasi Kontrak
                </b>
                <div className="clean-kv">
                  <span>Komoditas</span>
                  <b>{reviewModalItem.product}</b>
                </div>
                <div className="clean-kv">
                  <span>Tonase &amp; Kontainer</span>
                  <b>{reviewModalItem.quantity} {reviewModalItem.unit} ({reviewModalItem.containerType})</b>
                </div>
                <div className="clean-kv">
                  <span>Syarat Pembayaran</span>
                  <b>{reviewModalItem.paymentTerms}</b>
                </div>
                <div className="clean-kv">
                  <span>Diskon Diberikan</span>
                  <b>{formatMoney(reviewModalItem.discount, reviewModalItem.currency)}</b>
                </div>
              </div>

              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 12 }}>
                <b style={{ fontSize: 12, color: "#0f172a", display: "block", marginBottom: 8 }}>
                  🛡️ Pemohon &amp; Tata Kelola (SoD)
                </b>
                <div className="clean-kv">
                  <span>Sales PIC (Pemohon)</span>
                  <b>{reviewModalItem.salesPic}</b>
                </div>
                <div className="clean-kv">
                  <span>Dokumen Acuan</span>
                  <b>Proforma Invoice (Rev R{reviewModalItem.revision})</b>
                </div>
                <div className="clean-kv">
                  <span>Screening Legal AI</span>
                  <b style={{ color: "#16a34a" }}>✓ Lolos Bebas Sanksi Dagang</b>
                </div>
                <div className="clean-kv">
                  <span>Status Verifikasi</span>
                  <b>{reviewModalItem.approvalStatus}</b>
                </div>
              </div>
            </div>

            {/* Warning Catatan Kebijakan */}
            {reviewModalItem.margin < 20 && (
              <div
                style={{
                  background: "#fffbeb",
                  border: "1px solid #fde68a",
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontSize: 12.5,
                  color: "#92400e",
                  marginBottom: 16,
                }}
              >
                <b>⚠️ Pemicu Otorisasi Direksi:</b> Estimasi margin bersih ({reviewModalItem.margin}%) berada di bawah target kuartal (20%). Otorisasi Direktur diperlukan untuk memberikan dispensasi harga kepada buyer.
              </div>
            )}

            {/* Catatan Reviewer */}
            <div style={{ marginBottom: 18 }}>
              <Field
                label="Catatan Direktur / Pimpinan (wajib bila meminta revisi)"
                value={comment}
                onChange={setComment}
                placeholder="Contoh: Disetujui dengan klausul DP minimal 30% atau revisi target serah kontainer..."
              />
            </div>

            {/* Tombol Keputusan di Modal */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: 14,
                borderTop: "1px solid #e2e8f0",
              }}
            >
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    setReviewModalItem(null);
                    navigate("pricing");
                  }}
                  style={{ fontSize: 12.5 }}
                >
                  ← Buka Kalkulator
                </button>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    setReviewModalItem(null);
                    navigate("documents");
                  }}
                  style={{ fontSize: 12.5 }}
                >
                  Buka Proforma Invoice →
                </button>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => handleDecision("Revisi diminta")}
                  style={{
                    background: "#ffffff",
                    border: "1.5px solid #ef4444",
                    color: "#b91c1c",
                    fontWeight: 600,
                    padding: "8px 16px",
                    borderRadius: 6,
                    fontSize: 12.5,
                    cursor: "pointer",
                  }}
                >
                  Minta Revisi ke Sales
                </button>
                <button
                  type="button"
                  onClick={() => handleDecision("Tercatat direview")}
                  style={{
                    background: "var(--brand-primary)",
                    border: "none",
                    color: "#ffffff",
                    fontWeight: 600,
                    padding: "8px 18px",
                    borderRadius: 6,
                    fontSize: 12.5,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <ClipboardCheck size={15} /> Setujui &amp; Otorisasi Penawaran
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL UNDANG ANGGOTA TIM BARU */}
      {isInviteModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 12,
              width: "100%",
              maxWidth: 480,
              padding: 24,
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
                paddingBottom: 10,
                borderBottom: "1px solid #e2e8f0",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <UserPlus size={18} style={{ color: "var(--brand-primary)" }} />
                <b style={{ fontSize: 16, color: "#0f172a" }}>Undang Anggota Tim Baru</b>
              </div>
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddTeamMember}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <Field
                  label="Nama Lengkap Anggota Tim"
                  value={newMemberName}
                  onChange={setNewMemberName}
                  placeholder="Contoh: Raden Mas Danang"
                />

                <Field
                  label="Email Perusahaan"
                  value={newMemberEmail}
                  onChange={setNewMemberEmail}
                  placeholder="Contoh: danang@indico-export.com"
                />

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#334155", display: "block", marginBottom: 6 }}>
                    Divisi &amp; Peran Tanggung Jawab
                  </label>
                  <select
                    value={newMemberRole}
                    onChange={(e) =>
                      setNewMemberRole(e.target.value as "pimpinan" | "sales" | "ops" | "finance")
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      fontSize: 13,
                      color: "#0f172a",
                    }}
                  >
                    <option value="sales">💼 Sales &amp; Marketing Ekspor (Input &amp; Ajukan Penawaran)</option>
                    <option value="ops">📦 Operasional &amp; Dokumen Ekspor (PEB, SKA, Kontainer)</option>
                    <option value="finance">💳 Keuangan &amp; Akuntansi (Verifikasi DP, LC, &amp; Devisa)</option>
                    <option value="pimpinan">👔 Pimpinan / Direktur (Otorisasi &amp; Dispensasi Margin)</option>
                  </select>
                </div>

                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: 6,
                    padding: "10px 12px",
                    fontSize: 12,
                    color: "#64748b",
                  }}
                >
                  💡 Sistem akan mengirimkan undangan ke email anggota dengan batasan hak akses sesuai peran di atas.
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                  marginTop: 20,
                  paddingTop: 12,
                  borderTop: "1px solid #e2e8f0",
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    color: "#475569",
                    fontWeight: 600,
                    padding: "7px 14px",
                    borderRadius: 6,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{
                    background: "var(--brand-primary)",
                    border: "none",
                    color: "#ffffff",
                    fontWeight: 600,
                    padding: "7px 18px",
                    borderRadius: 6,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Kirim Undangan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function KnowledgeView({
  navigate,
  flow,
}: {
  navigate: (screen: ScreenId) => void;
  flow: WorkspaceFlow;
}) {
  const [filter, setFilter] = useState<"ALL" | "Published" | "In review">("ALL");
  const [title, setTitle] = useState("");
  const [scope, setScope] = useState("Organisasi · Operasional");
  const [reviewer, setReviewer] = useState("Compliance Team");

  const visible = flow.knowledge.filter((s) => filter === "ALL" || s.status === filter);

  const handleAddSop = () => {
    if (!title.trim()) {
      toast.error("Judul pedoman / SOP wajib diisi.");
      return;
    }
    flow.addKnowledgeSource({
      title: title.trim(),
      scope: scope.trim() || "Organisasi · Umum",
      version: "v1.0 · Berlaku 12 bulan",
      governance: `Workspace User → ${reviewer.trim() || "Compliance"}`,
      status: "Published",
    });
    setTitle("");
    toast.success("SOP berhasil diterbitkan & terhubung ke AI Advisor");
  };

  return (
    <div className="module-stack">
      <div className="content-grid two-thirds">
        <section className="panel panel-padding">
          <div className="panel-head">
            <div>
              <span className="eyebrow">ADVISOR · GOVERNANCE SUMBER</span>
              <h3>Daftar pengetahuan tim ({flow.publishedKnowledge.length} aktif di AI Advisor)</h3>
            </div>
            <button type="button" className="save-button" onClick={() => navigate("advisor")}>
              <BookOpen size={14} /> Buka AI Advisor
            </button>
          </div>
          <div className="clean-tabs" style={{ marginBottom: 12 }}>
            {(["ALL", "Published", "In review"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                className={filter === tab ? "active" : ""}
                onClick={() => setFilter(tab)}
              >
                {tab === "ALL" ? `Semua (${flow.knowledge.length})` : tab}
              </button>
            ))}
          </div>
          <div className="clean-table-wrap">
            <table className="clean-table">
              <thead>
                <tr>
                  <th>Judul Sumber</th>
                  <th>Scope</th>
                  <th>Versi &amp; Berlaku</th>
                  <th>Governance</th>
                  <th>Status di Advisor</th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "28px 16px" }}>
                      <div className="empty-state-card compact">
                        <div className="empty-state-icon">
                          <BookOpen size={24} className="text-blue-500" />
                        </div>
                        <h4>Belum Ada Dokumen SOP / Regulasi Tim</h4>
                        <p>
                          Unggah pedoman operasional internal, instruksi kerja fumigasi, atau checklist pabean agar AI Advisor dapat memverifikasi kepatuhan transaksi secara kontekstual.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  visible.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <b>{row.title}</b>
                      </td>
                      <td>{row.scope}</td>
                      <td>{row.version}</td>
                      <td>{row.governance}</td>
                      <td>
                        <div className="row-actions">
                          <StatusPill tone={row.status === "Published" ? "green" : "amber"}>
                            {row.status}
                          </StatusPill>
                          <button
                            type="button"
                            className="table-inline-btn"
                            onClick={() => {
                              flow.toggleKnowledgeStatus(row.id);
                              toast.success(`Status SOP diubah ke ${row.status === "Published" ? "In review" : "Published"}`);
                            }}
                          >
                            {row.status === "Published" ? "Tarik Review" : "Publish"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel panel-padding">
          <span className="eyebrow">TAMBAH PEDOMAN TIM</span>
          <h3 className="card-heading-spaced">Daftarkan SOP rujukan baru</h3>
          <div className="module-stack" style={{ gap: 10 }}>
            <Field
              label="Judul SOP / panduan pasar"
              value={title}
              onChange={setTitle}
              placeholder="Contoh: Checklist Fumigasi ISPM-15 Pasar Australia"
            />
            <Field label="Scope pasar / komoditas" value={scope} onChange={setScope} />
            <Field label="Reviewer penanggung jawab" value={reviewer} onChange={setReviewer} />
            <button type="button" className="save-button" onClick={handleAddSop}>
              <Plus size={14} /> Simpan &amp; Hubungkan ke Advisor
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export function PartnersView({
  shipment,
  navigate,
  flow,
}: {
  shipment: Shipment;
  navigate: (screen: ScreenId) => void;
  flow: WorkspaceFlow;
}) {
  const [newName, setNewName] = useState("");
  const [newCountry, setNewCountry] = useState("");
  const [newDest, setNewDest] = useState("");
  const [newTerms, setNewTerms] = useState("30% DP / 70% before shipment");

  const handleApply = (buyer: WorkspaceFlow["partners"][number]) => {
    flow.applyPartner(buyer);
    toast.success(`Buyer ${buyer.name} diterapkan ke ${shipment.reference}`, {
      description: "Data otomatis mengalir ke Harga & Order, Dokumen Ekspor, dan Keuangan.",
    });
  };

  const handleAdd = () => {
    if (!newName.trim() || !newCountry.trim()) {
      toast.error("Isi minimal nama perusahaan dan negara buyer.");
      return;
    }
    flow.addPartner({
      name: newName.trim(),
      country: newCountry.trim(),
      destination: newDest.trim() || newCountry.trim(),
      terms: newTerms.trim() || "30% DP / 70% before shipment",
    });
    setNewName("");
    setNewCountry("");
    setNewDest("");
    toast.success("Mitra disimpan ke direktori workspace");
  };

  return (
    <div className="module-stack">
      <div className="content-grid two-thirds">
        <section className="panel panel-padding">
          <div className="panel-head">
            <div>
              <span className="eyebrow">DATA UTAMA · BUYER &amp; KONTAK</span>
              <h3>Direktori Mitra Transaksi ({flow.partners.length})</h3>
            </div>
            <div className="row-actions">
              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  if (flow.saveCurrentBuyerToPartners()) {
                    toast.success(`Buyer "${shipment.buyer}" disinkronkan ke direktori`);
                  }
                }}
              >
                Simpan Buyer Aktif
              </button>
              <button type="button" className="save-button" onClick={() => navigate("pricing")}>
                Lanjut ke Harga →
              </button>
            </div>
          </div>
          <div className="master-list">
            {flow.partners.length === 0 ? (
              <div className="empty-state-card">
                <div className="empty-state-icon">
                  <Users size={26} className="text-blue-500" />
                </div>
                <h4>Belum Ada Data Rekanan &amp; Buyer</h4>
                <p>
                  Daftarkan buyer luar negeri, forwarder rekanan, atau surveyor independen pada formulir di sebelah kanan untuk mempercepat pembuatan Sales Contract dan validasi 3-way match.
                </p>
                <div className="empty-state-tip">
                  <Sparkles size={13} className="text-amber-500" />
                  <span>Tip: Anda juga dapat menggunakan <b>Panduan Ekspor</b> di bilah atas untuk memuat profil buyer instan.</span>
                </div>
              </div>
            ) : (
              flow.partners.map((buyer) => (
                <div
                  className={`master-card ${buyer.name === shipment.buyer ? "selected" : ""}`}
                  key={buyer.id}
                >
                  <div className="master-card-icon">
                    <UserRound size={16} />
                  </div>
                  <div>
                    <b>{buyer.name}</b>
                    <small>
                      {buyer.country} · {buyer.destination}
                    </small>
                    <em>{buyer.terms}</em>
                  </div>
                  <button type="button" onClick={() => handleApply(buyer)}>
                    {buyer.name === shipment.buyer ? "Sedang Dipakai" : "Pakai di Transaksi"}
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="panel panel-padding">
          <span className="eyebrow">TAMBAH MITRA BARU</span>
          <h3 className="card-heading-spaced">Profil buyer ekspor</h3>
          <div className="module-stack" style={{ gap: 10 }}>
            <Field label="Nama legal perusahaan" value={newName} onChange={setNewName} />
            <Field label="Negara tujuan" value={newCountry} onChange={setNewCountry} />
            <Field label="Pelabuhan / kota tujuan" value={newDest} onChange={setNewDest} />
            <Field label="Terms pembayaran standar" value={newTerms} onChange={setNewTerms} />
            <button type="button" className="save-button" onClick={handleAdd}>
              <Plus size={14} /> Simpan ke Direktori Mitra
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export function ProductsView({
  shipment,
  navigate,
  flow,
}: {
  shipment: Shipment;
  updateLineItems: (items: LineItem[]) => void;
  navigate: (screen: ScreenId) => void;
  flow: WorkspaceFlow;
}) {
  const [prodName, setProdName] = useState("");
  const [prodHs, setProdHs] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodWeight, setProdWeight] = useState("");

  const handleAddToShipment = (prod: WorkspaceFlow["products"][number]) => {
    flow.addProductToShipment(prod);
    toast.success(`${prod.name} ditambahkan ke ${shipment.reference}`, {
      description: `Total kini ${shipment.lineItems.length + 1} line item di Harga & Order, Dokumen, dan Kontainer 3D.`,
    });
  };

  const createCatalogItem = () => {
    if (!prodName.trim()) {
      toast.error("Nama produk wajib diisi.");
      return;
    }
    flow.addProduct({
      name: prodName.trim(),
      sku: `SKU-0${flow.products.length + 1}`,
      hsCode: prodHs.trim(),
      unit: "carton",
      unitPrice: Math.max(0, Number(prodPrice) || 0),
      packagingType: "Karton box",
      weight: Math.max(0.1, Number(prodWeight) || 12),
      length: 40,
      width: 30,
      height: 25,
    });
    setProdName("");
    setProdHs("");
    toast.success("Produk disimpan ke katalog workspace");
  };

  return (
    <div className="module-stack">
      <div className="content-grid two-thirds">
        <section className="panel panel-padding">
          <div className="panel-head">
            <div>
              <span className="eyebrow">DATA UTAMA · SPESIFIKASI PRODUK</span>
              <h3>Katalog Produk Ekspor ({flow.products.length})</h3>
            </div>
            <div className="row-actions">
              <button type="button" className="ghost-button" onClick={() => navigate("cargo")}>
                Muatan 3D
              </button>
              <button type="button" className="save-button" onClick={() => navigate("pricing")}>
                Buka Harga &amp; Order →
              </button>
            </div>
          </div>
          <div className="master-list">
            {flow.products.length === 0 ? (
              <div className="empty-state-card">
                <div className="empty-state-icon">
                  <Package size={26} className="text-blue-500" />
                </div>
                <h4>Katalog Komoditas Masih Kosong</h4>
                <p>
                  Tambahkan data komoditas beserta HS Code 8-10 digit, dimensi kemasan (PxLxT), dan estimasi susut muatan untuk otomasi kalkulasi kontainer dan dokumen ekspor.
                </p>
                <div className="empty-state-tip">
                  <Sparkles size={13} className="text-amber-500" />
                  <span>Tip: Sektor komoditas umum (Kopi, Perikanan, Rempah, Furnitur) dapat diisi otomatis via tombol <b>Panduan Ekspor</b>.</span>
                </div>
              </div>
            ) : (
              flow.products.map((prod) => (
                <div className="master-card" key={prod.id}>
                  <div className="master-card-icon product">
                    <Package size={16} />
                  </div>
                  <div>
                    <b>
                      {prod.name} · <span className="mono-code">{prod.sku}</span>
                    </b>
                    <small>
                      HS {prod.hsCode || "—"} · {prod.packagingType} ({prod.weight} kg)
                    </small>
                    <em>
                      {formatMoney(prod.unitPrice, shipment.currency)} / {prod.unit}
                    </em>
                  </div>
                  <button type="button" onClick={() => handleAddToShipment(prod)}>
                    + Tambah ke Transaksi
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="panel panel-padding">
          <span className="eyebrow">TAMBAH SPESIFIKASI</span>
          <h3 className="card-heading-spaced">Produk katalog baru</h3>
          <div className="module-stack" style={{ gap: 10 }}>
            <Field label="Nama produk" value={prodName} onChange={setProdName} />
            <Field label="HS Code referensi" value={prodHs} onChange={setProdHs} />
            <Field
              label="Harga referensi / unit"
              type="number"
              prefix={shipment.currency}
              value={prodPrice}
              onChange={setProdPrice}
            />
            <Field
              label="Berat kotor per koli"
              type="number"
              suffix="kg"
              value={prodWeight}
              onChange={setProdWeight}
            />
            <button type="button" className="save-button" onClick={createCatalogItem}>
              <Plus size={14} /> Simpan ke Katalog
            </button>
          </div>

          {/* Fitur 2.2: AI Advisor & Verifikator HS Code */}
          <div className="mt-4 p-3 bg-indigo-950/20 border border-indigo-500/30 rounded-lg text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-indigo-300">
              <Bot size={14} /> AI Advisor & Verifikator HS Code (2.2)
            </div>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              Pengecekan kesesuaian klasifikasi kode tarif (HS Code) terhadap deskripsi katalog produk UMKM dan rekomendasi alternatif legal efisiensi bea masuk/keluar.
            </p>
            <div className="bg-background/60 p-2 rounded border border-border/60 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kopi Arabika Biji Mentah:</span>
                <b className="font-mono text-foreground">0901.11.10 (Bea Keluar 0%)</b>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Briket Arang Tempurung:</span>
                <b className="font-mono text-foreground">4402.90.10 (Export Free)</b>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vanili Tidak Ditumbuk:</span>
                <b className="font-mono text-foreground">0905.10.00 (Form AK Preferensi)</b>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export function FinanceView({
  shipment,
  pricing,
  navigate,
  flow,
}: {
  shipment: Shipment;
  pricing: Pricing;
  navigate: (screen: ScreenId) => void;
  flow: WorkspaceFlow;
}) {
  return (
    <div className="module-stack">
      <FinanceSubNav active="finance" navigate={navigate} />

      <div className="clean-grid-4">
        <section className="panel panel-padding clean-stat-card">
          <span className="eyebrow">TOTAL TAGIHAN QUOTE</span>
          <strong>{formatMoney(pricing.active.offer, shipment.currency)}</strong>
          <small>
            {shipment.reference} · {shipment.buyer}
          </small>
        </section>
        <section className="panel panel-padding clean-stat-card">
          <span className="eyebrow">PEMBAYARAN TERKONFIRMASI</span>
          <strong>{formatMoney(flow.paidAmount, shipment.currency)}</strong>
          <small>
            {flow.finance.dpConfirmed ? "DP 30% masuk" : "DP belum dikonfirmasi"}
            {flow.finance.settlementConfirmed ? " + Pelunasan 70%" : ""}
          </small>
        </section>
        <section className="panel panel-padding clean-stat-card">
          <span className="eyebrow">SISA PIUTANG (AR)</span>
          <strong>{formatMoney(flow.remainingReceivable, shipment.currency)}</strong>
          <small>Kurs ref. IDR {formatNumber(shipment.exchangeRate)}</small>
        </section>
        <section className="panel panel-padding clean-stat-card">
          <span className="eyebrow">STATUS LEDGER AR</span>
          <strong>{flow.finance.arStatus}</strong>
          <small>{shipment.paymentTerms}</small>
        </section>
      </div>

      <div className="content-grid two-thirds">
        <section className="panel panel-padding">
          <div className="panel-head">
            <div>
              <span className="eyebrow">ACCOUNTS RECEIVABLE · TERHUBUNG</span>
              <h3>Rencana tagihan &amp; status posting {shipment.reference}</h3>
            </div>
            <StatusPill
              tone={
                flow.finance.arStatus === "Posted"
                  ? "green"
                  : flow.finance.arStatus === "Reversed"
                    ? "red"
                    : "amber"
              }
            >
              {flow.finance.arStatus}
            </StatusPill>
          </div>
          <div className="clean-table-wrap">
            <table className="clean-table">
              <thead>
                <tr>
                  <th>Transaksi / Buyer</th>
                  <th>Dokumen Sumber</th>
                  <th>Total Tagihan</th>
                  <th>Terbayar</th>
                  <th>Tindakan Finance</th>
                </tr>
              </thead>
              <tbody>
                <tr className="active-row">
                  <td>
                    <b>{shipment.reference}</b>
                    <span className="row-sub">{shipment.buyer}</span>
                  </td>
                  <td className="mono-code">CI-{shipment.reference}</td>
                  <td>
                    <b>{formatMoney(pricing.active.offer, shipment.currency)}</b>
                  </td>
                  <td>{formatMoney(flow.paidAmount, shipment.currency)}</td>
                  <td>
                    <div className="row-actions">
                      {flow.finance.arStatus !== "Posted" ? (
                        <button
                          type="button"
                          className="save-button"
                          onClick={() => {
                            flow.setArStatus("Posted");
                            toast.success("Piutang AR diposting ke Jurnal & Bagan Akun");
                          }}
                        >
                          Posting AR
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={() => {
                            flow.setArStatus("Reversed");
                            toast.success("Jurnal pembalik (Reversal) dicatat");
                          }}
                        >
                          <RotateCcw size={13} /> Buat Reversal
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel panel-padding">
          <span className="eyebrow">ALUR KEUANGAN TERHUBUNG</span>
          <h3 className="card-heading-spaced">Langkah selanjutnya</h3>
          <div className="quick-links">
            <QuickLink
              icon={<Landmark size={16} />}
              title="Rekonsiliasi Bank"
              caption={
                flow.paidAmount > 0
                  ? `Terkonfirmasi ${formatMoney(flow.paidAmount, shipment.currency)}`
                  : "Cocokkan uang muka 30% atau pelunasan 70%"
              }
              onClick={() => navigate("bank")}
            />
            <QuickLink
              icon={<FileSpreadsheet size={16} />}
              title="Jurnal & Bagan Akun"
              caption={`Status jurnal: ${flow.finance.arStatus}`}
              onClick={() => navigate("journals")}
            />
            <QuickLink
              icon={<BarChart3 size={16} />}
              title="Laporan & Analitik Margin"
              caption="Bandingkan quote vs realisasi kas & kurs"
              onClick={() => navigate("reports")}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

export function BankView({
  shipment,
  pricing,
  navigate,
  flow,
}: {
  shipment: Shipment;
  pricing: Pricing;
  navigate: (screen: ScreenId) => void;
  flow: WorkspaceFlow;
}) {
  const dpEstimate = pricing.active.offer * 0.3;
  const settlementEstimate = pricing.active.offer * 0.7;
  const fxDeltaPerUnit = flow.finance.realizedRate - shipment.exchangeRate;

  return (
    <div className="module-stack">
      <FinanceSubNav active="bank" navigate={navigate} />
      <div className="content-grid two-thirds">
        <section className="panel panel-padding">
          <span className="eyebrow">BANK MATCHING · {shipment.reference}</span>
          <h3 className="card-heading-spaced">Pencocokan mutasi pembayaran masuk</h3>
          <div className="clean-table-wrap">
            <table className="clean-table">
              <thead>
                <tr>
                  <th>Referensi Bank</th>
                  <th>Tahap Pembayaran</th>
                  <th>Nilai ({shipment.currency})</th>
                  <th>Status</th>
                  <th>Konfirmasi</th>
                </tr>
              </thead>
              <tbody>
                <tr className={flow.finance.dpConfirmed ? "active-row" : ""}>
                  <td className="mono-code">TRX-DP-{shipment.reference}</td>
                  <td>Uang Muka Buyer (30% DP) · {shipment.buyer}</td>
                  <td>
                    <b>{formatMoney(dpEstimate, shipment.currency)}</b>
                  </td>
                  <td>
                    <StatusPill tone={flow.finance.dpConfirmed ? "green" : "amber"}>
                      {flow.finance.dpConfirmed ? "Cocok" : "Menunggu"}
                    </StatusPill>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={flow.finance.dpConfirmed ? "ghost-button" : "save-button"}
                      onClick={() => {
                        flow.toggleDpConfirmed();
                        toast.success(
                          flow.finance.dpConfirmed
                            ? "Konfirmasi DP dibatalkan"
                            : "DP 30% dikonfirmasi & terhubung ke AR/Jurnal",
                        );
                      }}
                    >
                      {flow.finance.dpConfirmed ? "Batalkan" : "Konfirmasi DP"}
                    </button>
                  </td>
                </tr>
                <tr className={flow.finance.settlementConfirmed ? "active-row" : ""}>
                  <td className="mono-code">TRX-BAL-{shipment.reference}</td>
                  <td>Pelunasan Dokumen Pengapalan (70%) · {shipment.buyer}</td>
                  <td>
                    <b>{formatMoney(settlementEstimate, shipment.currency)}</b>
                  </td>
                  <td>
                    <StatusPill tone={flow.finance.settlementConfirmed ? "green" : "gray"}>
                      {flow.finance.settlementConfirmed ? "Cocok" : "Belum masuk"}
                    </StatusPill>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={flow.finance.settlementConfirmed ? "ghost-button" : "save-button"}
                      onClick={() => {
                        flow.toggleSettlementConfirmed();
                        toast.success(
                          flow.finance.settlementConfirmed
                            ? "Konfirmasi pelunasan dibatalkan"
                            : "Pelunasan 70% dikonfirmasi & terhubung ke AR/Jurnal",
                        );
                      }}
                    >
                      {flow.finance.settlementConfirmed ? "Batalkan" : "Konfirmasi 70%"}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel panel-padding">
          <span className="eyebrow">KURS REALISASI &amp; SELISIH</span>
          <h3 className="card-heading-spaced">Parameter kurs pembayaran</h3>
          <div className="clean-kv">
            <span>Total Penawaran</span>
            <b>{formatMoney(pricing.active.offer, shipment.currency)}</b>
          </div>
          <div className="clean-kv">
            <span>Total Kas Terkonfirmasi</span>
            <b>{formatMoney(flow.paidAmount, shipment.currency)}</b>
          </div>
          <div className="clean-kv">
            <span>Kurs Referensi Quote</span>
            <b>IDR {formatNumber(shipment.exchangeRate)}</b>
          </div>
          <div style={{ marginTop: 12 }}>
            <Field
              label="Kurs realisasi bank (IDR)"
              type="number"
              suffix="IDR"
              value={flow.finance.realizedRate}
              onChange={(val) => flow.setRealizedRate(Number(val) || 0)}
            />
          </div>
          <div className="clean-kv" style={{ marginTop: 8 }}>
            <span>Selisih kurs per {shipment.currency}</span>
            <b className={fxDeltaPerUnit >= 0 ? "positive-delta" : ""}>
              {fxDeltaPerUnit >= 0 ? "+" : ""}IDR {formatNumber(fxDeltaPerUnit)}
            </b>
          </div>
          <div className="row-actions" style={{ marginTop: 12 }}>
            <button type="button" className="save-button" onClick={() => navigate("journals")}>
              Lihat Jurnal Kas &amp; AR →
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export function JournalsView({
  shipment,
  pricing,
  navigate,
  flow,
}: {
  shipment: Shipment;
  pricing: Pricing;
  navigate: (screen: ScreenId) => void;
  flow: WorkspaceFlow;
}) {
  return (
    <div className="module-stack">
      <FinanceSubNav active="journals" navigate={navigate} />

      <div className="content-grid two-thirds">
        <section className="panel panel-padding">
          <div className="panel-head">
            <div>
              <span className="eyebrow">LEDGER CONTROL · DOUBLE-ENTRY</span>
              <h3>Jurnal terhubung transaksi {shipment.reference}</h3>
            </div>
            <StatusPill
              tone={
                flow.finance.arStatus === "Posted"
                  ? "green"
                  : flow.finance.arStatus === "Reversed"
                    ? "red"
                    : "amber"
              }
            >
              {flow.finance.arStatus}
            </StatusPill>
          </div>
          <div className="clean-table-wrap">
            <table className="clean-table">
              <thead>
                <tr>
                  <th>Akun Buku Besar</th>
                  <th>Posisi</th>
                  <th>Nilai ({shipment.currency})</th>
                  <th>Sumber Terhubung</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <b>1100 · Piutang Usaha Ekspor</b>
                  </td>
                  <td>Debit</td>
                  <td>{formatMoney(pricing.active.offer, shipment.currency)}</td>
                  <td className="mono-code">CI-{shipment.reference}</td>
                </tr>
                <tr>
                  <td>
                    <b>4100 · Penjualan Barang Ekspor</b>
                  </td>
                  <td>Kredit</td>
                  <td>{formatMoney(pricing.active.offer, shipment.currency)}</td>
                  <td className="mono-code">CI-{shipment.reference}</td>
                </tr>
                {flow.paidAmount > 0 && (
                  <>
                    <tr className="active-row">
                      <td>
                        <b>1020 · Bank Valas ({shipment.currency})</b>
                      </td>
                      <td>Debit</td>
                      <td>{formatMoney(flow.paidAmount, shipment.currency)}</td>
                      <td className="mono-code">BANK-{shipment.reference}</td>
                    </tr>
                    <tr className="active-row">
                      <td>
                        <b>1100 · Pelunasan Piutang Ekspor</b>
                      </td>
                      <td>Kredit</td>
                      <td>{formatMoney(flow.paidAmount, shipment.currency)}</td>
                      <td className="mono-code">BANK-{shipment.reference}</td>
                    </tr>
                  </>
                )}
                {flow.finance.arStatus === "Reversed" && (
                  <>
                    <tr>
                      <td>
                        <b>4100 · Pembalik Penjualan Ekspor (Reversal)</b>
                      </td>
                      <td>Debit</td>
                      <td>{formatMoney(pricing.active.offer, shipment.currency)}</td>
                      <td className="mono-code">REV-{shipment.reference}</td>
                    </tr>
                    <tr>
                      <td>
                        <b>1100 · Pembalik Piutang Ekspor (Reversal)</b>
                      </td>
                      <td>Kredit</td>
                      <td>{formatMoney(pricing.active.offer, shipment.currency)}</td>
                      <td className="mono-code">REV-{shipment.reference}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel panel-padding">
          <span className="eyebrow">BAGAN AKUN STANDAR EKSPOR</span>
          <h3 className="card-heading-spaced">Kelompok akun utama</h3>
          <div className="clean-kv">
            <span>1000 · Aset</span>
            <b>Bank Valas · Piutang Ekspor</b>
          </div>
          <div className="clean-kv">
            <span>2000 · Liabilitas</span>
            <b>Utang Forwarder · Uang Muka Buyer</b>
          </div>
          <div className="clean-kv">
            <span>4000 · Pendapatan</span>
            <b>Penjualan Barang Ekspor</b>
          </div>
          <div className="clean-kv">
            <span>5000 · Beban Pokok &amp; Logistik</span>
            <b>HPP · Ocean Freight · Kepabeanan</b>
          </div>
          <div className="row-actions" style={{ marginTop: 14 }}>
            <button type="button" className="ghost-button" onClick={() => navigate("bank")}>
              ← Rekonsiliasi Bank
            </button>
            <button type="button" className="save-button" onClick={() => navigate("reports")}>
              Laporan Margin →
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export function ReportsView({
  shipment,
  pricing,
  navigate,
  flow,
}: {
  shipment: Shipment;
  pricing: Pricing;
  navigate: (screen: ScreenId) => void;
  flow: WorkspaceFlow;
}) {
  const collectionPercent =
    pricing.active.offer > 0 ? Math.round((flow.paidAmount / pricing.active.offer) * 100) : 0;

  return (
    <div className="module-stack">
      <FinanceSubNav active="reports" navigate={navigate} />

      <div className="clean-grid-4">
        <section className="panel panel-padding clean-stat-card">
          <span className="eyebrow">NILAI BARANG</span>
          <strong>{formatMoney(pricing.goods, shipment.currency)}</strong>
          <small>{formatNumber(pricing.totalQuantity)} unit total</small>
        </section>
        <section className="panel panel-padding clean-stat-card">
          <span className="eyebrow">ESTIMASI COST TO SERVE</span>
          <strong>{formatMoney(pricing.active.cost, shipment.currency)}</strong>
          <small>Incoterm {shipment.incoterm}</small>
        </section>
        <section className="panel panel-padding clean-stat-card">
          <span className="eyebrow">ESTIMASI MARGIN BERSIH</span>
          <strong>{formatMoney(pricing.active.profit, shipment.currency)}</strong>
          <small>Target {shipment.margin}% · pra-realisasi</small>
        </section>
        <section className="panel panel-padding clean-stat-card">
          <span className="eyebrow">REALISASI KAS MASUK</span>
          <strong>{collectionPercent}%</strong>
          <small>
            {formatMoney(flow.paidAmount, shipment.currency)} dari{" "}
            {formatMoney(pricing.active.offer, shipment.currency)}
          </small>
        </section>
      </div>

      <section className="panel panel-padding">
        <div className="panel-head">
          <div>
            <span className="eyebrow">ANALITIK BIAYA &amp; REALISASI</span>
            <h3>Komposisi biaya penawaran {shipment.reference}</h3>
          </div>
          <button type="button" className="ghost-button" onClick={() => navigate("pricing")}>
            Sesuaikan Struktur Biaya →
          </button>
        </div>
        <div className="clean-table-wrap">
          <table className="clean-table">
            <thead>
              <tr>
                <th>Komponen</th>
                <th>Nilai ({shipment.currency})</th>
                <th>Ekuivalen IDR (Kurs Ref.)</th>
                <th>Status Sumber</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Nilai Barang ({shipment.lineItems.length} line item)</td>
                <td>
                  <b>{formatMoney(pricing.goods, shipment.currency)}</b>
                </td>
                <td>IDR {formatNumber(Math.round(pricing.goods * shipment.exchangeRate))}</td>
                <td>
                  <StatusPill tone="green">Tercatat di Quote</StatusPill>
                </td>
              </tr>
              <tr>
                <td>Packaging, Inland &amp; Origin Customs</td>
                <td>
                  <b>
                    {formatMoney(
                      shipment.packaging +
                        shipment.inlandTransport +
                        shipment.originHandling +
                        shipment.customs,
                      shipment.currency,
                    )}
                  </b>
                </td>
                <td>
                  IDR{" "}
                  {formatNumber(
                    Math.round(
                      (shipment.packaging +
                        shipment.inlandTransport +
                        shipment.originHandling +
                        shipment.customs) *
                        shipment.exchangeRate,
                    ),
                  )}
                </td>
                <td>
                  <StatusPill tone="blue">Estimasi Operasional</StatusPill>
                </td>
              </tr>
              <tr>
                <td>Ocean Freight &amp; Marine Insurance</td>
                <td>
                  <b>{formatMoney(shipment.freight + shipment.insurance, shipment.currency)}</b>
                </td>
                <td>
                  IDR{" "}
                  {formatNumber(
                    Math.round((shipment.freight + shipment.insurance) * shipment.exchangeRate),
                  )}
                </td>
                <td>
                  <StatusPill tone="amber">Estimasi Forwarder</StatusPill>
                </td>
              </tr>
              <tr className="active-row">
                <td>
                  <b>Penerimaan Pembayaran Buyer (Bank Matching)</b>
                </td>
                <td>
                  <b>{formatMoney(flow.paidAmount, shipment.currency)}</b>
                </td>
                <td>IDR {formatNumber(Math.round(flow.paidAmount * flow.finance.realizedRate))}</td>
                <td>
                  <StatusPill tone={flow.paidAmount > 0 ? "green" : "gray"}>
                    {flow.paidAmount > 0 ? `Kurs realisasi IDR ${formatNumber(flow.finance.realizedRate)}` : "Belum terealisasi"}
                  </StatusPill>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

const RBAC_ROLES: {
  id: NonNullable<Shipment["activeRbacRole"]>;
  label: string;
  scope: string;
  permissions: string[];
}[] = [
  {
    id: "owner_admin",
    label: "Owner / Direktur Ekspor",
    scope: "Akses Penuh Seluruh Modul & Persetujuan",
    permissions: [
      "Kelola Pra-Transaksi, Harga Incoterms & Approval Kontrak",
      "Ekspor Final Dokumen & Pengaturan Rekening Bank T/T",
      "Akses Penuh Audit Vault DJBC & Manajemen Tim",
    ],
  },
  {
    id: "dokumen_ops",
    label: "Staf Operasional & Dokumen Ekspor",
    scope: "Fokus Dokumen, Kepatuhan Lartas, Muatan & Logistik",
    permissions: [
      "Buat & Edit PI, SC, CI, PL, SI serta OCR Scrutiny B/L",
      "Kelola Sertifikat Karantina, e-SKA/COO & Timeline H-7 PEB",
      "Terkunci: Tidak dapat mengubah Margin Profit atau Rekening Bank",
    ],
  },
  {
    id: "finance_tax",
    label: "Keuangan, Pajak & Penagihan T/T",
    scope: "Fokus Harga Pokok, Kurs BI, Invoice & Rekonsiliasi T/T",
    permissions: [
      "Verifikasi DP 30%, Pelunasan T/T & Penerbitan Cap Scanned Copy",
      "Ekspor Dossier Audit Pajak & Kepabeanan (DJBC)",
      "Hanya-Baca pada Rencana Muatan Kontainer & Data Teknis Forwarder",
    ],
  },
  {
    id: "viewer_auditor",
    label: "Auditor / Konsultan PPJK (Read-Only)",
    scope: "Pemeriksaan Indeks Audit & Validasi HS Code / Lartas",
    permissions: [
      "Baca & Unduh Manifest Audit Vault DJBC & Riwayat Revisi",
      "Tinjau HS Code, Checklist Risiko & Draf Surat Jalan",
      "Terkunci: Tidak dapat mengubah nominal atau menghapus transaksi",
    ],
  },
];

export function SettingsView({
  user,
  shipment,
  update,
  version,
  saveState,
  activeShipmentId,
  login,
  logout,
  onUpgradeFromDemo,
  navigate,
}: {
  user:
    | ({
        name?: string | null;
        email?: string | null;
        role?: string | null;
        isDemo?: boolean;
        demoExpiresAt?: string;
      } & Partial<UserSession>)
    | null;
  shipment: Shipment;
  update?: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void;
  version: number;
  saveState: PersistenceSaveState;
  activeShipmentId: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  onUpgradeFromDemo?: () => void;
  navigate: (screen: ScreenId) => void;
}) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [simDocsPerMonth, setSimDocsPerMonth] = useState<number>(45);
  const [localPlan, setLocalPlan] = useState<SubscriptionPlanSpec["id"]>(
    shipment.subscriptionPlan || "growth",
  );
  const [localRole, setLocalRole] = useState<NonNullable<Shipment["activeRbacRole"]>>(
    shipment.activeRbacRole || "owner_admin",
  );

  const selectedPlan = shipment.subscriptionPlan || localPlan;
  const selectedRole = shipment.activeRbacRole || localRole;
  const isDemo = Boolean(user?.isDemo);
  const demoRemainingMs = isDemo ? getDemoRemainingMs(user as UserSession) : 0;
  const demoRemainingLabel = isDemo ? formatDemoRemainingLabel(demoRemainingMs) : "";
  const billingPreview = useMemo(
    () => calculatePlanBilling(selectedPlan, billingCycle, simDocsPerMonth),
    [selectedPlan, billingCycle, simDocsPerMonth],
  );
  const activeRoleSpec = RBAC_ROLES.find((r) => r.id === selectedRole) ?? RBAC_ROLES[0];

  const handleSelectPlan = (planId: SubscriptionPlanSpec["id"]) => {
    setLocalPlan(planId);
    update?.("subscriptionPlan", planId);
    toast.success(`Simulasi paket diubah ke ${planId.toUpperCase()}`);
  };

  const handleSelectRole = (roleId: NonNullable<Shipment["activeRbacRole"]>) => {
    setLocalRole(roleId);
    update?.("activeRbacRole", roleId);
    const label = RBAC_ROLES.find((r) => r.id === roleId)?.label || roleId;
    toast.info(`Pratinjau hak akses RBAC: ${label}`);
  };
  const exportJson = () => {
    const blob = new Blob(
      [JSON.stringify({ shipment, version, exportedAt: new Date().toISOString() }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${shipment.reference}-snapshot.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Snapshot JSON berhasil diunduh");
  };

  return (
    <div className="module-stack">
      <div className="content-grid two-thirds">
        <section className="panel panel-padding">
          <div className="panel-head">
            <div>
              <span className="eyebrow">ADMIN &amp; GOVERNANCE</span>
              <h3>Sesi pengguna &amp; database workspace</h3>
            </div>
            <StatusPill tone={user ? "green" : "amber"}>
              {user ? "Terautentikasi" : "Mode Draft Lokal"}
            </StatusPill>
          </div>

          <div className="clean-kv">
            <span>Organisasi Eksportir</span>
            <b>{shipment.exporter}</b>
          </div>
          <div className="clean-kv">
            <span>Pengguna Aktif</span>
            <b>{user ? `${user.name || "Pengguna"} (${user.email || "akun aktif"})` : "Belum masuk akun"}</b>
          </div>
          <div className="clean-kv">
            <span>Mesin Database Server</span>
            <b>PostgreSQL / Supabase (RLS Diaktifkan)</b>
          </div>
          <div className="clean-kv">
            <span>Status Transaksi Aktif</span>
            <b>
              {activeShipmentId
                ? `Cloud ID terhubung · v${version} (${saveState})`
                : "Draft browser lokal"}
            </b>
          </div>

          <div className="row-actions" style={{ marginTop: 14 }}>
            {user ? (
              <button type="button" className="ghost-button" onClick={() => void logout()}>
                Keluar Sesi Akun
              </button>
            ) : (
              <button type="button" className="save-button" onClick={() => void login()}>
                Masuk ke Workspace Cloud
              </button>
            )}
            <button type="button" className="ghost-button" onClick={exportJson}>
              <Download size={14} /> Ekspor JSON Transaksi
            </button>
            <button type="button" className="ghost-button" onClick={() => navigate("transactions")}>
              Kelola Daftar Transaksi →
            </button>
          </div>
        </section>

        <section className="panel panel-padding">
          <div className="panel-head">
            <div>
              <span className="eyebrow">KEAMANAN &amp; HAK AKSES</span>
              <h3>Perlindungan Workspace</h3>
            </div>
            <ShieldCheck size={18} className="panel-spark" />
          </div>
          <div className="guardrail-list">
            <div>
              <b>Row Level Security (RLS) Aktif</b>
              <p>Seluruh akses database diverifikasi melalui keanggotaan workspace di server.</p>
            </div>
            <div>
              <b>Transaksi Database Atomik</b>
              <p>Header pesanan, item barang, dan log audit disimpan secara konsisten dalam satu transaksi.</p>
            </div>
            <div>
              <b>Proteksi Kuota AI Advisor</b>
              <p>Akses AI Advisor dilindungi autentikasi sesi dan batas kuota per pengguna.</p>
            </div>
          </div>
        </section>

        {/* Fitur 4.3: Kesiapan Legalitas Entitas (KYC / KYB) */}
        <section className="panel panel-padding">
          <div className="panel-head">
            <div>
              <span className="eyebrow">LEGALITAS ENTITAS (SIAP LAUNCH VPS)</span>
              <h3>Identitas Usaha &amp; Kesiapan KYC / KYB</h3>
            </div>
            <StatusPill tone="blue">KYC/OTP Diaktifkan Saat Rilis VPS</StatusPill>
          </div>
          <div className="module-stack" style={{ gap: 10 }}>
            <div className="clean-kv">
              <span>Status Verifikasi Lanjutan</span>
              <b>Draft Identitas Lokal (Verifikasi KTP/NPWP &amp; OTP Email aktif saat migrasi VPS)</b>
            </div>
            <div className="clean-kv">
              <span>NPWP Perusahaan (dari profil transaksi)</span>
              <b className="mono-code">{shipment.npwp?.trim() || "Belum dicatat"}</b>
            </div>
            <div className="clean-kv">
              <span>NIB (Nomor Induk Berusaha)</span>
              <b className="mono-code">{shipment.nib?.trim() || "Belum dicatat"}</b>
            </div>
            <p className="muted-note" style={{ marginTop: 4 }}>
              Saat peluncuran penuh di VPS, setiap pengajuan final PEB dan multi-user RBAC terlindungi oleh
              otentikasi OTP dan verifikasi legalitas KYB perusahaan.
            </p>
          </div>
        </section>

        {/* Fitur 5: Mode Demo 3 Hari Real-Time & Skema Langganan 3 Tingkat */}
        <section className="panel panel-padding">
          <div className="panel-head">
            <div>
              <span className="eyebrow">STATUS LISENSI &amp; KONTRAK CLOUD</span>
              <h3>Status Langganan Enterprise &amp; Kuota Dokumen</h3>
            </div>
            <StatusPill tone="green">Akun Cloud Supabase Aktif</StatusPill>
          </div>
          <div className="module-stack" style={{ gap: 10 }}>
            <div className="clean-kv">
              <span>Status Sesi Saat Ini</span>
              <b>Akun Perusahaan Terdaftar (Cloud Sync Supabase Aktif)</b>
            </div>
            <div className="clean-kv">
              <span>Simulasi Paket Pilihan</span>
              <b>
                {billingPreview.plan.name} · Kuota {billingPreview.plan.monthlyDocQuota} dokumen/bln
              </b>
            </div>

            {isDemo && (
              <div
                style={{
                  padding: 12,
                  borderRadius: 8,
                  background: "#fffbeb",
                  border: "1px solid #fcd34d",
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 12, color: "#78350f" }}>
                  Mode Demo tidak menyimpan data ke Cloud produksi. Daftarkan akun gratis kapan saja untuk
                  sinkronisasi cloud permanen.
                </span>
                {onUpgradeFromDemo && (
                  <button type="button" className="save-button" onClick={onUpgradeFromDemo}>
                    Buat Akun / Masuk Permanen →
                  </button>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Skema Langganan 3 Tingkat & Kuota Hibrida + Pratinjau RBAC */}
      <div className="content-grid two-thirds">
        <section className="panel panel-padding">
          <div className="panel-head">
            <div>
              <span className="eyebrow">SKEMA LANGGANAN 3 TINGKAT (PERSONAL / GROWTH / ENTERPRISE)</span>
              <h3>Kalkulator Kuota Bulanan &amp; Ekstra Kuota Hibrida</h3>
            </div>
            <div className="clean-tabs">
              <button
                type="button"
                className={billingCycle === "monthly" ? "active" : ""}
                onClick={() => setBillingCycle("monthly")}
              >
                Bulanan
              </button>
              <button
                type="button"
                className={billingCycle === "annual" ? "active" : ""}
                onClick={() => setBillingCycle("annual")}
              >
                Tahunan (-10%)
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 6 }}>
              <span>Estimasi Kebutuhan Penerbitan Dokumen:</span>
              <b>{simDocsPerMonth} dokumen / bulan</b>
            </div>
            <input
              type="range"
              min={5}
              max={300}
              step={5}
              value={simDocsPerMonth}
              onChange={(e) => setSimDocsPerMonth(Number(e.target.value))}
              style={{ width: "100%" }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
              gap: 10,
            }}
          >
            {SUBSCRIPTION_PLANS.map((plan) => {
              const est = calculatePlanBilling(plan.id, billingCycle, simDocsPerMonth);
              const active = selectedPlan === plan.id;
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => handleSelectPlan(plan.id)}
                  style={{
                    textAlign: "left",
                    padding: 12,
                    borderRadius: 10,
                    border: active ? "2px solid var(--brand-primary)" : "1px solid #cbd5e1",
                    background: active ? "#eff6ff" : "#ffffff",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <b style={{ fontSize: 14, color: "#0f172a" }}>{plan.name}</b>
                    {active && <StatusPill tone="green">Dipilih</StatusPill>}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "var(--brand-primary)", margin: "6px 0 2px" }}>
                    Rp {est.effectiveMonthlyIdr.toLocaleString("id-ID")}
                    <small style={{ fontWeight: 500, fontSize: 11, color: "#64748b" }}>/bln</small>
                  </div>
                  <div style={{ fontSize: 11.5, color: "#475569" }}>
                    Kuota: <b>{plan.monthlyDocQuota} dok/bln</b> · Maks {plan.maxUsers} user
                  </div>
                  <div style={{ fontSize: 11.5, color: "#0369a1", marginTop: 4 }}>
                    {est.extraDocsCount === 0
                      ? "Cukup dalam kuota dasar"
                      : `+${est.extraDocsCount} dok ekstra = Rp ${est.overageChargeIdr.toLocaleString("id-ID")}`}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* RBAC Role Access Control Preview */}
        <section className="panel panel-padding">
          <div className="panel-head">
            <div>
              <span className="eyebrow">ROLE-BASED ACCESS CONTROL (RBAC)</span>
              <h3>Simulasi Hak Akses Peran Tim Ekspor</h3>
            </div>
            <StatusPill tone="blue">{activeRoleSpec.label.split(" ")[0]}</StatusPill>
          </div>

          <div className="module-stack" style={{ gap: 8, marginBottom: 12 }}>
            {RBAC_ROLES.map((roleItem) => {
              const active = selectedRole === roleItem.id;
              return (
                <button
                  key={roleItem.id}
                  type="button"
                  onClick={() => handleSelectRole(roleItem.id)}
                  style={{
                    textAlign: "left",
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: active ? "2px solid var(--brand-primary)" : "1px solid #e2e8f0",
                    background: active ? "#eff6ff" : "#f8fafc",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a" }}>{roleItem.label}</div>
                  <small style={{ color: "#64748b" }}>{roleItem.scope}</small>
                </button>
              );
            })}
          </div>

          <div
            style={{
              padding: 12,
              borderRadius: 8,
              background: "#f8fafc",
              border: "1px solid #cbd5e1",
            }}
          >
            <span className="eyebrow" style={{ display: "block", marginBottom: 6 }}>
              MATRIKS IZIN PERAN AKTIF
            </span>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#334155", lineHeight: 1.65 }}>
              {activeRoleSpec.permissions.map((perm) => (
                <li key={perm}>{perm}</li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
