import type { PersistenceSaveState } from "@/hooks/useActiveShipment";
import type { WorkspaceFlow } from "@/hooks/useWorkspaceFlow";
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
  Box,
  Building2,
  Calculator,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Compass,
  Download,
  ExternalLink,
  Eye,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Filter,
  Globe2,
  History,
  Landmark,
  Layers,
  Package,
  Plus,
  RotateCcw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Ship,
  Sparkles,
  TrendingUp,
  Truck,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ChecklistItem,
  Field,
  MetricCard,
  QuickLink,
  RecommendationsPanel,
  SelectField,
  StatusPill,
  TransactionProfile,
} from "./Primitives";

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

interface MasterShipmentItem {
  id: string;
  reference: string;
  buyer: string;
  destination: string;
  buyerCountry: string;
  product: string;
  quantity: number;
  unit: string;
  incoterm: string;
  container: string;
  offer: number;
  status: string;
  statusTone: "amber" | "blue" | "green" | "gray";
  isCurrent: boolean;
}

export function DashboardView({
  user,
  shipment,
  shipmentsList = [],
  isLoadingList = false,
  loadShipment,
  createNewDraft,
  update,
  pricing,
  container,
  navigate,
  flow,
}: {
  user?: { name: string | null; companyName: string | null; role?: string | null; email?: string | null } | null;
  shipment: Shipment;
  shipmentsList?: Array<{
    id: string;
    reference: string;
    status: string;
    version: number;
    createdAt: Date | string;
    updatedAt: Date | string;
  }>;
  isLoadingList?: boolean;
  loadShipment?: (id: string) => Promise<void>;
  createNewDraft?: () => void;
  update: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void;
  pricing: Pricing;
  container: ContainerCalc;
  navigate: (screen: ScreenId) => void;
  flow: WorkspaceFlow;
}) {
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "completed">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [clockTime, setClockTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setClockTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const jakartaTime = useMemo(() => {
    return clockTime.toLocaleTimeString("id-ID", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }, [clockTime]);

  const tokyoTime = useMemo(() => {
    return clockTime.toLocaleTimeString("en-GB", {
      timeZone: "Asia/Tokyo",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }, [clockTime]);

  const rotterdamTime = useMemo(() => {
    return clockTime.toLocaleTimeString("en-GB", {
      timeZone: "Europe/Amsterdam",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }, [clockTime]);

  const losAngelesTime = useMemo(() => {
    return clockTime.toLocaleTimeString("en-US", {
      timeZone: "America/Los_Angeles",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  }, [clockTime]);

  // Master Shipments list for ERP Data Grid
  const masterShipments = useMemo<MasterShipmentItem[]>(() => {
    const list: MasterShipmentItem[] = [
      {
        id: "active-current",
        reference: shipment.reference || "EXP-2026-001",
        buyer: shipment.buyer || "Al-Muhajirin Global Trading",
        destination: shipment.destination || "Port of Tokyo (JPTYO)",
        buyerCountry: shipment.buyerCountry || "Jepang",
        product: shipment.product || "Biji Kopi Arabika Gayo Grade 1",
        quantity: shipment.quantity || 18000,
        unit: shipment.unit || "kg",
        incoterm: shipment.incoterm || "CIF",
        container: `${container.containers} × ${shipment.containerType}`,
        offer: pricing.active.offer,
        status: "Aktif Berjalan",
        statusTone: "amber",
        isCurrent: true,
      },
      {
        id: "exp-sample-002",
        reference: "EXP-2026-002",
        buyer: "Nordic Spice Import GmbH",
        destination: "Port of Hamburg (DEHAM)",
        buyerCountry: "Jerman",
        product: "Pala & Lada Putih Muntok",
        quantity: 12000,
        unit: "kg",
        incoterm: "FOB",
        container: "1 × 20ft Standard",
        offer: 54800,
        status: "Siap Stuffing",
        statusTone: "blue",
        isCurrent: false,
      },
      {
        id: "exp-sample-003",
        reference: "EXP-2026-003",
        buyer: "Pacific Rim Commodities LLC",
        destination: "Port of Long Beach (USLGB)",
        buyerCountry: "Amerika Serikat",
        product: "Briket Arang Kelapa Shisha",
        quantity: 26000,
        unit: "kg",
        incoterm: "CFR",
        container: "1 × 40ft High Cube",
        offer: 38900,
        status: "Berlayar (On-Board)",
        statusTone: "green",
        isCurrent: false,
      },
    ];

    if (shipmentsList && shipmentsList.length > 0) {
      shipmentsList.forEach((s) => {
        if (!list.some((item) => item.reference === s.reference)) {
          list.push({
            id: s.id,
            reference: s.reference,
            buyer: "Mitra Ekspor Terdaftar",
            destination: "Pelabuhan Tujuan",
            buyerCountry: "Internasional",
            product: "Komoditas Ekspor",
            quantity: 10000,
            unit: "kg",
            incoterm: "FOB",
            container: "1 × 20ft Standard",
            offer: 42000,
            status: s.status || "Draft",
            statusTone: s.status === "Published" ? "green" : "gray",
            isCurrent: false,
          });
        }
      });
    }

    return list;
  }, [shipment, container, pricing.active.offer, shipmentsList]);

  const filteredShipments = useMemo<MasterShipmentItem[]>(() => {
    return masterShipments.filter((item: MasterShipmentItem) => {
      const matchSearch =
        item.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.buyer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.product.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;
      if (filterStatus === "active") return item.status.includes("Aktif") || item.status.includes("Stuffing");
      if (filterStatus === "completed") return item.status.includes("Berlayar") || item.status.includes("Selesai");
      return true;
    });
  }, [masterShipments, searchQuery, filterStatus]);

  const totalPipelineValue = useMemo(() => {
    return masterShipments.reduce((sum: number, item: MasterShipmentItem) => sum + item.offer, 0);
  }, [masterShipments]);

  const currentStepIndex = useMemo(() => {
    if (flow.remainingReceivable === 0 && flow.paidAmount > 0) return 5;
    if (shipment.documentReviewed) return 4;
    if (container.volumeUtilization > 0) return 3;
    if (flow.effectiveApprovalStatus === "Tercatat direview") return 2;
    if (pricing.active.offer > 0) return 1;
    return 0;
  }, [pricing.active.offer, flow.effectiveApprovalStatus, container.volumeUtilization, shipment.documentReviewed, flow.remainingReceivable, flow.paidAmount]);

  const actionTasks = [
    {
      id: "doc-review",
      title: "Validasi 4 Dokumen Ekspor",
      desc: shipment.documentReviewed
        ? "4 dokumen tervalidasi. Siap dicetak untuk agen pelayaran & kepabeanan."
        : "Commercial Invoice & Packing List menanti review sebelum batas closing kapal.",
      tone: shipment.documentReviewed ? "success" : "warning",
      target: "documents" as ScreenId,
      actionLabel: "Buka Dokumen",
      icon: <FileCheck2 size={16} />,
    },
    {
      id: "cargo-check",
      title: "Utilisasi Kontainer & Kargo",
      desc: `Kapasitas ${container.volumeUtilization.toFixed(0)}% (${container.containers} × ${shipment.containerType}). Beban berat ${container.weightUtilization.toFixed(0)}% terverifikasi aman.`,
      tone: container.volumeUtilization > 100 ? "danger" : "info",
      target: "cargo" as ScreenId,
      actionLabel: "Simulasi 3D",
      icon: <Box size={16} />,
    },
    {
      id: "finance-rec",
      title: "Rekonsiliasi Piutang & Kas",
      desc: flow.paidAmount > 0
        ? `DP masuk ${formatMoney(flow.paidAmount, shipment.currency)}. Sisa piutang dagang ${formatMoney(flow.remainingReceivable, shipment.currency)}.`
        : `Sisa piutang ${formatMoney(flow.remainingReceivable, shipment.currency)} menanti pencocokan mutasi bank / LC.`,
      tone: flow.paidAmount > 0 ? "success" : "warning",
      target: "finance" as ScreenId,
      actionLabel: "Cek Keuangan",
      icon: <Wallet size={16} />,
    },
    {
      id: "risk-sanction",
      title: "Kepatuhan Regulasi & Risiko",
      desc: `Skor kesiapan transaksi ${flow.riskEvaluation.readinessPercent}%. Regulasi ekspor negara ${shipment.buyerCountry || "tujuan"} aman dari sanksi.`,
      tone: flow.riskEvaluation.readinessPercent >= 80 ? "success" : "info",
      target: "risk" as ScreenId,
      actionLabel: "Risk Center",
      icon: <ShieldCheck size={16} />,
    },
  ];

  const pipelineStages = [
    { num: "01", title: "Inkuiri & Harga", status: "Kalkulasi Valid", target: "pricing" as ScreenId },
    { num: "02", title: "Kontrak & Approval", status: flow.effectiveApprovalStatus, target: "approvals" as ScreenId },
    { num: "03", title: "Muatan & Stuffing", status: `${container.volumeUtilization.toFixed(0)}% CBM`, target: "cargo" as ScreenId },
    { num: "04", title: "Dokumen & PEB", status: shipment.documentReviewed ? "Disetujui" : "Drafting", target: "documents" as ScreenId },
    { num: "05", title: "B/L & Berlayar", status: "Rute Terjadwal", target: "shipment" as ScreenId },
    { num: "06", title: "Pelunasan & Kas", status: flow.finance.arStatus, target: "finance" as ScreenId },
  ];

  return (
    <div className="module-stack">
      {/* 1. ERP Enterprise Cockpit Banner */}
      <section className="erp-cockpit-banner">
        <div className="erp-cockpit-top">
          <div className="erp-cockpit-brand">
            <div className="erp-eyebrow">
              <span className="dot" />
              ENTERPRISE RESOURCE PLANNING · PUSAT KENDALI OPERASIONAL EKSPOR
            </div>
            <h2>
              <Building2 size={24} style={{ color: "#f59e0b" }} />
              {user?.companyName || shipment.exporter || "EksporFlow Enterprise"}
            </h2>
            <div className="erp-cockpit-badges">
              <span className="erp-badge-pill highlight">
                <CheckCircle2 size={12} /> NIB / Eksportir Terdaftar: 022020261901
              </span>
              <span className="erp-badge-pill">
                <Globe2 size={12} /> Pelabuhan Asal: Tanjung Priok (IDJKT)
              </span>
              <span className="erp-badge-pill">
                <Compass size={12} /> Incoterms® 2020 Validated
              </span>
            </div>
          </div>

          <div className="erp-cockpit-actions">
            <button
              type="button"
              className="erp-btn-primary"
              onClick={() => {
                if (createNewDraft) createNewDraft();
                navigate("pricing");
              }}
            >
              <Plus size={15} /> Buat Transaksi Ekspor Baru
            </button>
            <button
              type="button"
              className="erp-btn-secondary"
              onClick={() => navigate("transactions")}
            >
              <Layers size={14} /> Database Transaksi ({masterShipments.length})
            </button>
          </div>
        </div>

        {/* Global Trading Clocks Bar */}
        <div className="erp-clocks-bar">
          <div className="erp-clock-item">
            <span className="erp-clock-flag">🇮🇩</span>
            <div className="erp-clock-info">
              <span className="erp-clock-city">Jakarta (WIB) · Tanjung Priok</span>
              <span className="erp-clock-time">{jakartaTime}</span>
            </div>
          </div>
          <div className="erp-clock-item">
            <span className="erp-clock-flag">🇯🇵</span>
            <div className="erp-clock-info">
              <span className="erp-clock-city">Tokyo (JST) · Port of Tokyo</span>
              <span className="erp-clock-time">{tokyoTime}</span>
            </div>
          </div>
          <div className="erp-clock-item">
            <span className="erp-clock-flag">🇳🇱</span>
            <div className="erp-clock-info">
              <span className="erp-clock-city">Rotterdam (CET) · Port of R'dam</span>
              <span className="erp-clock-time">{rotterdamTime}</span>
            </div>
          </div>
          <div className="erp-clock-item">
            <span className="erp-clock-flag">🇺🇸</span>
            <div className="erp-clock-info">
              <span className="erp-clock-city">Los Angeles (PST) · Long Beach</span>
              <span className="erp-clock-time">{losAngelesTime}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Four Executive ERP KPI Cards */}
      <div className="erp-kpi-grid">
        <div className="erp-kpi-card">
          <div className="erp-kpi-head">
            <span className="erp-kpi-label">Pipeline Nilai Ekspor</span>
            <div className="erp-kpi-icon-wrap emerald">
              <TrendingUp size={16} />
            </div>
          </div>
          <div>
            <div className="erp-kpi-val">{formatMoney(totalPipelineValue, shipment.currency)}</div>
            <p className="erp-kpi-sub">
              Transaksi aktif: <strong>{formatMoney(pricing.active.offer, shipment.currency)}</strong> ({shipment.incoterm})
            </p>
          </div>
          <div className="erp-kpi-foot">
            <span className="erp-kpi-trend">
              <ArrowUpRight size={13} /> +14.2% MoM
            </span>
            <span>Est. Margin: {shipment.margin}%</span>
          </div>
        </div>

        <div className="erp-kpi-card">
          <div className="erp-kpi-head">
            <span className="erp-kpi-label">Logistik &amp; Kontainer</span>
            <div className="erp-kpi-icon-wrap blue">
              <Ship size={16} />
            </div>
          </div>
          <div>
            <div className="erp-kpi-val">
              {container.volumeUtilization.toFixed(0)}% <small style={{ fontSize: "14px", fontWeight: 600 }}>Vol</small>
            </div>
            <p className="erp-kpi-sub">
              {container.containers} × {shipment.containerType} ({formatNumber(container.totalVolume, 1)} m³)
            </p>
          </div>
          <div className="erp-kpi-foot">
            <span>Beban Berat: {container.weightUtilization.toFixed(0)}%</span>
            <span>Tujuan: {shipment.destination || "Tokyo"}</span>
          </div>
        </div>

        <div className="erp-kpi-card">
          <div className="erp-kpi-head">
            <span className="erp-kpi-label">Kepatuhan &amp; PEB</span>
            <div className="erp-kpi-icon-wrap amber">
              <FileCheck2 size={16} />
            </div>
          </div>
          <div>
            <div className="erp-kpi-val">{flow.riskEvaluation.readinessPercent}% <small style={{ fontSize: "14px", fontWeight: 600 }}>Siap</small></div>
            <p className="erp-kpi-sub">
              {shipment.documentReviewed ? "4/4 Dokumen Tervalidasi Legal" : "Commercial &amp; Packing List Siap Review"}
            </p>
          </div>
          <div className="erp-kpi-foot">
            <span>HS Code: {shipment.hsCode || "0901.11"}</span>
            <span style={{ color: flow.riskEvaluation.readinessPercent >= 80 ? "#059669" : "#d97706", fontWeight: 600 }}>
              Risiko: {flow.riskEvaluation.riskLevel.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="erp-kpi-card">
          <div className="erp-kpi-head">
            <span className="erp-kpi-label">Piutang Dagang (AR)</span>
            <div className="erp-kpi-icon-wrap purple">
              <Wallet size={16} />
            </div>
          </div>
          <div>
            <div className="erp-kpi-val">{formatMoney(flow.remainingReceivable, shipment.currency)}</div>
            <p className="erp-kpi-sub">
              Terbayar masuk: <strong>{formatMoney(flow.paidAmount, shipment.currency)}</strong>
            </p>
          </div>
          <div className="erp-kpi-foot">
            <span>Status AR: {flow.finance.arStatus}</span>
            <span>DP: {flow.finance.dpConfirmed ? "Terkonfirmasi" : "Pending"}</span>
          </div>
        </div>
      </div>

      {/* 3. Export Lifecycle Pipeline */}
      <section className="erp-pipeline-panel">
        <div className="erp-pipeline-head">
          <div>
            <span className="eyebrow">EXPORT LIFECYCLE PIPELINE</span>
            <h3>Tahapan Operasional Transaksi: {shipment.reference}</h3>
          </div>
          <StatusPill tone="blue">
            <Clock size={11} /> Fase Aktif: Tahap {currentStepIndex + 1} dari 6
          </StatusPill>
        </div>

        <div className="erp-pipeline-steps">
          {pipelineStages.map((stage, idx) => {
            const isPassed = idx <= currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            return (
              <button
                key={stage.num}
                type="button"
                className={`erp-pipeline-step ${isPassed ? "active" : ""}`}
                onClick={() => navigate(stage.target)}
                title={`Buka modul ${stage.title}`}
              >
                <span className="erp-pipeline-step-num">
                  TAHAP {stage.num} {isCurrent && "· AKTIF"}
                </span>
                <span className="erp-pipeline-step-title">{stage.title}</span>
                <span className="erp-pipeline-step-status">{stage.status}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. Two-Column Main ERP Section */}
      <div className="erp-main-grid">
        {/* Left: Master Shipments Data Grid */}
        <section className="panel panel-padding">
          <div className="erp-card-header">
            <div>
              <span className="eyebrow">LIVE ERP DATA GRID</span>
              <h3>Daftar Transaksi Ekspor Berjalan</h3>
              <p>Seluruh shipment aktif dalam kendali database cloud workspace</p>
            </div>

            <div className="erp-filter-group">
              <button
                type="button"
                className={`erp-filter-btn ${filterStatus === "all" ? "active" : ""}`}
                onClick={() => setFilterStatus("all")}
              >
                Semua ({masterShipments.length})
              </button>
              <button
                type="button"
                className={`erp-filter-btn ${filterStatus === "active" ? "active" : ""}`}
                onClick={() => setFilterStatus("active")}
              >
                Aktif
              </button>
              <button
                type="button"
                className={`erp-filter-btn ${filterStatus === "completed" ? "active" : ""}`}
                onClick={() => setFilterStatus("completed")}
              >
                Berlayar
              </button>
            </div>
          </div>

          <div className="erp-table-wrapper">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>No. Transaksi</th>
                  <th>Buyer &amp; Tujuan</th>
                  <th>Komoditas &amp; Kargo</th>
                  <th>Incoterm &amp; Nilai</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredShipments.map((item) => (
                  <tr key={item.id} className={item.isCurrent ? "active-row" : ""}>
                    <td>
                      <span className="erp-ref-tag">{item.reference}</span>
                      {item.isCurrent && (
                        <div style={{ fontSize: "10px", color: "#0284c7", fontWeight: 700, marginTop: "2px" }}>
                          ● Dibuka
                        </div>
                      )}
                    </td>
                    <td>
                      <strong style={{ color: "var(--navy)", display: "block" }}>{item.buyer}</strong>
                      <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                        {item.destination} ({item.buyerCountry})
                      </span>
                    </td>
                    <td>
                      <span style={{ display: "block", fontWeight: 500 }}>{item.product}</span>
                      <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                        {formatNumber(item.quantity)} {item.unit} · {item.container}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: "var(--navy)", display: "block" }}>
                        {formatMoney(item.offer, shipment.currency)}
                      </strong>
                      <span style={{ fontSize: "11px", color: "var(--muted)" }}>{item.incoterm}</span>
                    </td>
                    <td>
                      <StatusPill tone={item.statusTone}>{item.status}</StatusPill>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "4px" }}>
                        <button
                          type="button"
                          className="erp-table-action-btn"
                          title="Buka dokumen ekspor"
                          onClick={() => navigate("documents")}
                        >
                          <FileText size={11} /> Dokumen
                        </button>
                        <button
                          type="button"
                          className="erp-table-action-btn"
                          title="Buka kalkulator harga"
                          onClick={() => navigate("pricing")}
                        >
                          <Calculator size={11} /> Harga
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Right: Operational Action Center & Alerts */}
        <section className="panel panel-padding">
          <div className="erp-card-header">
            <div>
              <span className="eyebrow">ACTION REQUIRED</span>
              <h3>Antrean Tugas Operasional</h3>
              <p>Tindakan prioritas tim ekspor hari ini</p>
            </div>
            <StatusPill tone="amber">
              <AlertCircle size={11} /> 4 Tugas
            </StatusPill>
          </div>

          <div className="erp-action-list">
            {actionTasks.map((task) => (
              <div key={task.id} className={`erp-action-item ${task.tone}`}>
                <div className="erp-action-item-icon">{task.icon}</div>
                <div className="erp-action-item-content">
                  <h4 className="erp-action-item-title">{task.title}</h4>
                  <p className="erp-action-item-desc">{task.desc}</p>
                  <button
                    type="button"
                    className="erp-action-item-btn"
                    onClick={() => navigate(task.target)}
                  >
                    {task.actionLabel} <ArrowRight size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Technical Specs of Current Shipment */}
          <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px dashed var(--line)" }}>
            <span className="eyebrow" style={{ marginBottom: "8px", display: "block" }}>
              PARAMETER TEKNIS AKTIF: {shipment.reference}
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "11.5px" }}>
              <div style={{ background: "#f8fafc", padding: "6px 8px", borderRadius: "4px" }}>
                <span style={{ color: "var(--muted)", display: "block" }}>Eksportir</span>
                <strong style={{ color: "var(--navy)" }}>{shipment.exporter || "Indico Export"}</strong>
              </div>
              <div style={{ background: "#f8fafc", padding: "6px 8px", borderRadius: "4px" }}>
                <span style={{ color: "var(--muted)", display: "block" }}>Pelabuhan Muat (POL)</span>
                <strong style={{ color: "var(--navy)" }}>Tanjung Priok (IDJKT)</strong>
              </div>
              <div style={{ background: "#f8fafc", padding: "6px 8px", borderRadius: "4px" }}>
                <span style={{ color: "var(--muted)", display: "block" }}>Pelabuhan Bongkar (POD)</span>
                <strong style={{ color: "var(--navy)" }}>{shipment.destination || "Port of Tokyo"}</strong>
              </div>
              <div style={{ background: "#f8fafc", padding: "6px 8px", borderRadius: "4px" }}>
                <span style={{ color: "var(--muted)", display: "block" }}>Mata Uang Transaksi</span>
                <strong style={{ color: "var(--navy)" }}>{shipment.currency}</strong>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 5. Executive Subsystem Modules Matrix */}
      <section className="panel panel-padding">
        <div className="panel-head">
          <div>
            <span className="eyebrow">MODUL ERP TERINTEGRASI</span>
            <h3>Pusat Kerja Operasional Ekspor</h3>
          </div>
          <span style={{ fontSize: "12px", color: "var(--muted)" }}>
            Akses langsung seluruh modul dalam satu platform terpadu
          </span>
        </div>

        <div className="erp-modules-matrix">
          <div className="erp-module-tile" onClick={() => navigate("pricing")}>
            <div className="erp-module-tile-icon">
              <Calculator size={18} />
            </div>
            <strong>Kalkulator Harga &amp; Order</strong>
            <span>Hitung 7 Incoterms® 2020, margin, dan line items barang</span>
          </div>

          <div className="erp-module-tile" onClick={() => navigate("documents")}>
            <div className="erp-module-tile-icon">
              <FileText size={18} />
            </div>
            <strong>Dokumen Ekspor Global</strong>
            <span>Cetak Commercial Invoice, Packing List, B/L Draft, COO</span>
          </div>

          <div className="erp-module-tile" onClick={() => navigate("cargo")}>
            <div className="erp-module-tile-icon">
              <Box size={18} />
            </div>
            <strong>Muatan Kontainer 3D</strong>
            <span>Simulasi CBM, pallet kayu, dan utilisasi berat kontainer</span>
          </div>

          <div className="erp-module-tile" onClick={() => navigate("risk")}>
            <div className="erp-module-tile-icon">
              <ShieldAlert size={18} />
            </div>
            <strong>Risk Center &amp; Kepatuhan</strong>
            <span>Evaluasi regulasi bea cukai, sanksi embargo, dan devisa</span>
          </div>

          <div className="erp-module-tile" onClick={() => navigate("finance")}>
            <div className="erp-module-tile-icon">
              <Landmark size={18} />
            </div>
            <strong>Keuangan, LC &amp; Bank</strong>
            <span>Rekonsiliasi pembayaran DP, piutang ekspor, dan jurnal kas</span>
          </div>

          <div className="erp-module-tile" onClick={() => navigate("partners")}>
            <div className="erp-module-tile-icon">
              <Users size={18} />
            </div>
            <strong>Direktori Mitra Dagang</strong>
            <span>Database buyer internasional dan freight forwarder</span>
          </div>
        </div>
      </section>
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
            <div className="clean-notice warn" style={{ marginTop: 12 }}>
              Asesmen ini panduan kesiapan awal, bukan penetapan kepatuhan hukum atau izin ekspor resmi.
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

export function ApprovalsView({
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
  const [comment, setComment] = useState(flow.approval.comment);
  const statusTone =
    flow.effectiveApprovalStatus === "Tercatat direview"
      ? "green"
      : flow.effectiveApprovalStatus === "Revisi diminta" ||
          flow.effectiveApprovalStatus === "Perlu review ulang"
        ? "red"
        : "amber";

  const handleDecision = (next: "Revisi diminta" | "Tercatat direview") => {
    if (next === "Revisi diminta" && !comment.trim()) {
      toast.error("Catatan reviewer wajib diisi saat meminta revisi.");
      return;
    }
    flow.recordApprovalDecision(next, comment.trim());
    toast.success(`Status persetujuan diperbarui: ${next}`, {
      description: `Status kini sinkron ke Harga & Order, Dokumen Ekspor, dan Risk Center untuk ${shipment.reference}.`,
    });
  };

  return (
    <div className="content-grid two-thirds">
      <section className="panel panel-padding">
        <div className="panel-head">
          <div>
            <span className="eyebrow">SALES · REVIEW &amp; CONTROL</span>
            <h3>Antrian persetujuan perubahan material</h3>
          </div>
          <StatusPill tone={statusTone}>{flow.effectiveApprovalStatus}</StatusPill>
        </div>

        {flow.effectiveApprovalStatus === "Perlu review ulang" && (
          <div className="clean-notice warn" style={{ marginBottom: 14 }}>
            <b>Nilai penawaran berubah setelah review terakhir:</b> Harga, margin, atau Incoterm telah dimodifikasi di Kalkulator Harga. Silakan periksa dan catat review ulang.
          </div>
        )}

        <div className="clean-table-wrap">
          <table className="clean-table">
            <thead>
              <tr>
                <th>Referensi</th>
                <th>Incoterm</th>
                <th>Nilai Penawaran</th>
                <th>Margin</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="active-row">
                <td>
                  <b>
                    {shipment.reference} · Rev R{shipment.documentRevision}
                  </b>
                  <span className="row-sub">{shipment.buyer}</span>
                </td>
                <td>{shipment.incoterm}</td>
                <td>
                  <b>{formatMoney(pricing.active.offer, shipment.currency)}</b>
                </td>
                <td>{shipment.margin}%</td>
                <td>
                  <StatusPill tone={statusTone}>{flow.effectiveApprovalStatus}</StatusPill>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="clean-notice" style={{ marginTop: 14 }}>
          <div>
            <b>Guardrail Pemisahan Tugas:</b> Approver wajib berbeda dari pemohon ketika nilai transaksi atau diskon melewati threshold organisasi.
          </div>
        </div>
      </section>

      <section className="panel panel-padding">
        <span className="eyebrow">SNAPSHOT KEPUTUSAN · {shipment.reference}</span>
        <h3 className="card-heading-spaced">Ringkasan yang ditinjau</h3>
        <div className="clean-kv">
          <span>Incoterm &amp; Named Place</span>
          <b>
            {shipment.incoterm} · {shipment.namedPlace}
          </b>
        </div>
        <div className="clean-kv">
          <span>Cost to serve + contingency</span>
          <b>{formatMoney(pricing.active.cost, shipment.currency)}</b>
        </div>
        <div className="clean-kv">
          <span>Harga jual penawaran</span>
          <b>{formatMoney(pricing.active.offer, shipment.currency)}</b>
        </div>
        <div className="clean-kv">
          <span>Diskon diberikan</span>
          <b>{formatMoney(shipment.discount, shipment.currency)}</b>
        </div>
        <div style={{ marginTop: 12 }}>
          <Field
            label="Catatan reviewer (wajib bila meminta revisi)"
            value={comment}
            onChange={setComment}
            placeholder="Contoh: Margin sudah sesuai target kuartal..."
          />
        </div>
        <div className="row-actions" style={{ marginTop: 14 }}>
          <button
            type="button"
            className="ghost-button"
            onClick={() => handleDecision("Revisi diminta")}
          >
            Minta Revisi
          </button>
          <button
            type="button"
            className="save-button"
            onClick={() => handleDecision("Tercatat direview")}
          >
            <ClipboardCheck size={14} /> Catat Review Disetujui
          </button>
        </div>
        <div className="row-actions" style={{ marginTop: 10 }}>
          <button type="button" className="text-button" onClick={() => navigate("pricing")}>
            ← Kembali ke Harga &amp; Order
          </button>
          <button type="button" className="text-button" onClick={() => navigate("documents")}>
            Lanjut ke Dokumen Ekspor →
          </button>
        </div>
      </section>
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
                    <td colSpan={5} style={{ textAlign: "center", color: "var(--muted)", padding: "20px 14px" }}>
                      Belum ada dokumen SOP / pedoman tim. Tambahkan pedoman pertama di sebelah kanan agar terhubung ke AI Advisor.
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
          <div className="guardrail-list" style={{ marginTop: 16 }}>
            <div>
              <b>Hanya sumber Published yang dipakai Advisor</b>
              <p>Dokumen berstatus In review langsung dikecualikan dari konteks tanya-jawab AI Advisor.</p>
            </div>
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
              <h3>Direktori mitra transaksi ({flow.partners.length})</h3>
              <p className="profile-description">
                Pilih mitra agar nama, negara, pelabuhan tujuan, dan terms pembayaran mengisi transaksi aktif secara konsisten.
              </p>
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
              <div className="empty-attachment">
                Direktori mitra masih kosong. Silakan isi formulir profil buyer baru di sebelah kanan untuk memulai pengujian.
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
          <div className="clean-notice" style={{ marginTop: 12 }}>
            Profil master data tidak menilai apakah buyer aman. Bukti PO dan screening ditampilkan terpisah pada Risk Center.
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
              <h3>Katalog produk ekspor ({flow.products.length})</h3>
              <p className="profile-description">
                Tambahkan produk katalog langsung ke transaksi aktif ({shipment.lineItems.length} line item saat ini).
              </p>
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
              <div className="empty-attachment">
                Katalog produk masih kosong. Tambahkan spesifikasi produk pertama Anda di sebelah kanan, lalu klik &ldquo;+ Tambah ke Transaksi&rdquo;.
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
                      HS ref. {prod.hsCode || "belum diisi"}* · {prod.packagingType} ({prod.weight} kg)
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
          <div className="clean-notice warn" style={{ marginTop: 12 }}>
            *HS Code hanya referensi input dan wajib dikonfirmasi dengan PPJK/bea cukai yang berwenang. Sistem tidak melakukan klasifikasi resmi otomatis.
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
        </section>
      </div>

      <section className="panel panel-padding">
        <div className="governance-grid">
          <div>
            <Check size={15} />
            <span>
              <b>Satu sumber data</b>
              <small>Line item produk langsung mengalir ke invoice, Packing List, dan simulasi 3D.</small>
            </span>
          </div>
          <div>
            <ShieldAlert size={15} />
            <span>
              <b>Verifikasi klasifikasi</b>
              <small>Tarif bea masuk tujuan bergantung pada konfirmasi resmi broker/customs.</small>
            </span>
          </div>
          <div>
            <History size={15} />
            <span>
              <b>Snapshot terisolasi</b>
              <small>Perubahan katalog di masa depan tidak menimpa dokumen shipment lama.</small>
            </span>
          </div>
        </div>
      </section>
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

      <div className="clean-notice">
        <div>
          <b>Kontrol Akuntansi Inti:</b> Commercial Invoice perdagangan tidak membuat jurnal pendapatan otomatis. Konfirmasi penerimaan bank di <b>Rekonsiliasi Bank</b> dan posting AR oleh Finance terhubung langsung di bawah ini.
        </div>
      </div>

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

      <div className="clean-notice warn">
        Konfirmasi mutasi bank di bawah ini langsung memperbarui <b>Sisa Piutang AR</b> di halaman Keuangan, baris kas di <b>Jurnal &amp; Bagan Akun</b>, serta realisasi di <b>Laporan Margin</b>.
      </div>
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
          <div className="clean-notice" style={{ marginTop: 12 }}>
            Debit = Kredit selalu seimbang. Jurnal berstatus Posted bersifat immutable dan dikoreksi melalui jurnal pembalik (Reversal) ber-audit log.
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
        <div className="clean-notice warn" style={{ marginTop: 12 }}>
          Estimasi quotation dipisahkan secara tegas dari kas aktual yang terkonfirmasi di Rekonsiliasi Bank dan jurnal berstatus Posted.
        </div>
      </section>
    </div>
  );
}

export function SettingsView({
  user,
  shipment,
  version,
  saveState,
  activeShipmentId,
  login,
  logout,
  navigate,
}: {
  user: { name?: string | null; email?: string | null; role?: string | null } | null;
  shipment: Shipment;
  version: number;
  saveState: PersistenceSaveState;
  activeShipmentId: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  navigate: (screen: ScreenId) => void;
}) {
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
          <p className="profile-description" style={{ marginTop: 12 }}>
            Sesuai prinsip portabilitas data EksporFlow, Anda selalu dapat mengunduh snapshot data transaksi kapan saja tanpa dikunci oleh status paket.
          </p>
        </section>

        <section className="panel panel-padding">
          <div className="panel-head">
            <div>
              <span className="eyebrow">KEAMANAN &amp; HAK AKSES</span>
              <h3>Perlindungan workspace</h3>
            </div>
            <ShieldCheck size={18} className="panel-spark" />
          </div>
          <div className="guardrail-list">
            <div>
              <b>Row Level Security (RLS) aktif di seluruh tabel</b>
              <p>
                Akses publik PostgREST ditutup secara default; seluruh pembacaan dan penulisan transaksi diverifikasi melalui keanggotaan workspace di server.
              </p>
            </div>
            <div>
              <b>Optimistic locking &amp; transaksi database atomik</b>
              <p>
                Header shipment, line item, dan audit log ditulis dalam satu transaksi database sehingga tidak meninggalkan data setengah tersimpan.
              </p>
            </div>
            <div>
              <b>Proteksi endpoint AI Advisor</b>
              <p>
                AI Advisor mewajibkan sesi terautentikasi dan pembatasan kuota per jam untuk mencegah penyalahgunaan.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
