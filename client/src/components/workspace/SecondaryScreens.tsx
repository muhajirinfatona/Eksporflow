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
  Briefcase,
  Building2,
  Calculator,
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
  Package,
  Plus,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Ship,
  Sparkles,
  Trash2,
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
  update,
  pricing,
  container,
  navigate,
  flow,
}: {
  shipment: Shipment;
  update: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void;
  pricing: Pricing;
  container: ContainerCalc;
  navigate: (screen: ScreenId) => void;
  flow: WorkspaceFlow;
}) {
  return (
    <div className="module-stack">
      {/* Ringkasan Operasional Transaksi Aktif */}
      <section className="panel panel-padding">
        <div className="panel-head" style={{ marginBottom: 0 }}>
          <div>
            <span className="eyebrow">RINGKASAN OPERASIONAL TRANSAKSI AKTIF</span>
            <h3>
              {shipment.reference} · {shipment.buyer || "Mitra Buyer Internasional"}
            </h3>
            <p className="profile-description">
              Tujuan: <strong>{shipment.destination || "Pelabuhan Tujuan"}</strong> ({shipment.buyerCountry || "Internasional"}) · Komoditas: <strong>{formatNumber(shipment.quantity)} {shipment.unit} {shipment.product}</strong> · Eksportir: <strong>{shipment.exporter || "Eksportir Terdaftar"}</strong>
            </p>
          </div>
          <div className="row-actions">
            <StatusPill tone="blue">{shipment.shipmentStatus}</StatusPill>
            <button
              type="button"
              className="ghost-button"
              onClick={() => navigate("transactions")}
            >
              Kelola di Transaksi Ekspor →
            </button>
          </div>
        </div>
      </section>

      <div className="overview-grid">
        <section className="hero-card">
          <div className="hero-card-copy">
            <span className="eyebrow light">PENAWARAN AKTIF · {shipment.incoterm}</span>
            <h2>{formatMoney(pricing.active.offer, shipment.currency)}</h2>
            <p>
              Estimasi nilai kontrak untuk{" "}
              <strong>
                {formatNumber(shipment.quantity)} {shipment.unit}
              </strong>{" "}
              {shipment.product || "produk ekspor Anda"} ke {shipment.destination || "tujuan pengiriman"}.
            </p>
            <div className="hero-meta">
              <span>
                <i className="tiny-dot mint" /> Margin bersih {shipment.margin}%
              </span>
              <span>
                <i className="tiny-dot saffron" /> Review: {flow.effectiveApprovalStatus}
              </span>
            </div>
          </div>
          <div className="hero-orbit">
            <div className="orbit-label">HARGA / UNIT</div>
            <strong>{formatMoney(pricing.active.unit, shipment.currency)}</strong>
            <span>
              {shipment.incoterm} · {shipment.currency}
            </span>
          </div>
          <div className="hero-wave" />
        </section>

        <MetricCard
          label="COST TO SERVE"
          value={formatMoney(pricing.active.cost, shipment.currency)}
          detail={`${formatNumber((pricing.active.cost / Math.max(1, pricing.goods)) * 100, 1)}% terhadap nilai barang`}
          tone="cream"
          icon={<BarChart3 size={16} />}
        />
        <MetricCard
          label="ESTIMASI PROFIT"
          value={formatMoney(pricing.active.profit, shipment.currency)}
          detail={`Target margin ${shipment.margin}%`}
          tone="mint"
          icon={<ArrowUpRight size={16} />}
        />
        <MetricCard
          label="UTILISASI KONTAINER"
          value={`${container.volumeUtilization.toFixed(0)}%`}
          detail={`${container.containers} × ${shipment.containerType} · ${formatNumber(container.totalVolume, 1)} m³`}
          tone="sand"
          icon={<Box size={16} />}
        />
      </div>

      {/* Akses Cepat Modul Ekspor */}
      <section className="panel panel-padding">
        <div className="panel-head">
          <div>
            <span className="eyebrow">AKSES CEPAT MODUL EKSPOR</span>
            <h3>Pusat Kerja Operasional</h3>
          </div>
          <span style={{ fontSize: "12px", color: "var(--muted)" }}>
            Buka langsung modul terkait untuk mengelola transaksi aktif
          </span>
        </div>
        <div className="quick-links-grid">
          <QuickLink
            icon={<Calculator size={16} />}
            title="Kalkulator Harga & Order"
            caption="Uji 7 skenario Incoterms® 2020 & margin"
            onClick={() => navigate("pricing")}
          />
          <QuickLink
            icon={<FileCheck2 size={16} />}
            title="Dokumen Ekspor"
            caption="Invoice, Packing List & B/L draft terintegrasi"
            onClick={() => navigate("documents")}
          />
          <QuickLink
            icon={<Ship size={16} />}
            title="Rencana Muatan Kontainer"
            caption="Simulasi 3D, pallet kayu & beban muatan"
            onClick={() => navigate("cargo")}
          />
          <QuickLink
            icon={<Wallet size={16} />}
            title="Keuangan & Piutang"
            caption={`Sisa piutang ${formatMoney(flow.remainingReceivable, shipment.currency)}`}
            onClick={() => navigate("finance")}
          />
        </div>
      </section>

      <section className="panel panel-padding scenario-panel">
        <div className="panel-head">
          <div>
            <span className="eyebrow">PERBANDINGAN INCOTERMS® 2020</span>
            <h3>Pergerakan harga di tiap skenario penyerahan</h3>
          </div>
          <button className="text-button" type="button" onClick={() => navigate("pricing")}>
            Buka kalkulator lengkap <ChevronRight size={15} />
          </button>
        </div>
        <div className="scenario-table">
          <div className="scenario-row scenario-header">
            <span>TERM</span>
            <span>CAKUPAN BIAYA</span>
            <span>TOTAL PENAWARAN</span>
            <span>SELISIH DARI EXW</span>
            <span>STATUS</span>
          </div>
          {pricing.scenarios.slice(0, 5).map((scenario, index) => (
            <div
              className={`scenario-row ${scenario.term === shipment.incoterm ? "selected" : ""}`}
              key={scenario.term}
            >
              <strong>{scenario.term}</strong>
              <span>
                {scenario.term === "EXW"
                  ? "Ex-works gudang eksportir"
                  : scenario.term === "FCA"
                    ? "Serah ke pengangkut pertama"
                    : scenario.term === "FOB"
                      ? "Muat di atas kapal (on board)"
                      : scenario.term === "CFR"
                        ? "Termasuk ocean freight"
                        : "Termasuk freight + insurance"}
              </span>
              <b>{formatMoney(scenario.offer, shipment.currency)}</b>
              <span className={index === 0 ? "muted-delta" : "positive-delta"}>
                {index === 0
                  ? "Basis EXW"
                  : `+${formatMoney(scenario.offer - pricing.scenarios[0].offer, shipment.currency)}`}
              </span>
              <span>
                {scenario.term === shipment.incoterm ? (
                  <StatusPill tone="amber">Aktif</StatusPill>
                ) : (
                  <button
                    type="button"
                    className="table-inline-btn"
                    onClick={() => update("incoterm", scenario.term)}
                  >
                    Pakai
                  </button>
                )}
              </span>
            </div>
          ))}
        </div>
      </section>

      <RecommendationsPanel
        shipment={shipment}
        pricing={pricing}
        container={container}
        navigate={navigate}
      />
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
    authority: "Otorisasi final penawaran, dispensasi margin, & penandatanganan kontrak",
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
    authority: "Kelola PEB Bea Cukai, perizinan e-SKA/COO, karantina mutu, & kontainer",
    status: "Aktif",
  },
  {
    id: "mem-4",
    name: "Budi Hartono",
    email: "budi.hartono@indico-export.com",
    role: "finance",
    roleLabel: "Keuangan & Akuntansi Ekspor",
    department: "Divisi Finansial & Perbankan",
    authority: "Verifikasi pembayaran DP, pencairan L/C, & pelaporan devisa DHE BI",
    status: "Aktif",
  },
];

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
  const [activeTab, setActiveTab] = useState<"approvals" | "team">("approvals");
  const [comment, setComment] = useState(flow.approval.comment);
  const [workflowMode, setWorkflowMode] = useState<"corporate" | "simple">(() => {
    try {
      return (localStorage.getItem("eksporflow_workflow_mode") as "corporate" | "simple") || "corporate";
    } catch {
      return "corporate";
    }
  });

  // State Manajemen Tim Workspace (ERP Enterprise)
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

  const statusTone =
    flow.effectiveApprovalStatus === "Tercatat direview"
      ? "green"
      : flow.effectiveApprovalStatus === "Revisi diminta" ||
          flow.effectiveApprovalStatus === "Perlu review ulang"
        ? "red"
        : "amber";

  // Ambil data pesanan/PO lokal dari browser
  const [localList] = useState<LocalShipmentRecord[]>(() => {
    try {
      const saved = localStorage.getItem("eksporflow_local_shipments_v1");
      return saved ? (JSON.parse(saved) as LocalShipmentRecord[]) : [];
    } catch {
      return [];
    }
  });

  const handleDecision = (next: "Revisi diminta" | "Tercatat direview") => {
    if (next === "Revisi diminta" && !comment.trim()) {
      toast.error("Catatan reviewer wajib diisi saat meminta revisi.");
      return;
    }
    flow.recordApprovalDecision(next, comment.trim());
    toast.success(`Status persetujuan diperbarui: ${next}`, {
      description: `Status kini sinkron ke Harga & Order, Dokumen Ekspor, dan Risk Center untuk ${shipment.reference || "PO ini"}.`,
    });
  };

  // Susun antrian penawaran & kontrak dari seluruh order perusahaan
  const queueItems = useMemo(() => {
    type QueueItem = {
      id: string;
      reference: string;
      revision: number;
      buyer: string;
      buyerCountry: string;
      destination?: string;
      salesPic: string;
      product: string;
      quantity: number;
      unit: string;
      incoterm: string;
      offerValue: number;
      currency: string;
      margin: number;
      approvalStatus: string;
      tone: "green" | "amber" | "red" | "blue" | "gray";
      isCurrent: boolean;
      isCloud: boolean;
      shipmentData?: Shipment;
    };

    const list: QueueItem[] = [];

    // 1. Pesanan yang sedang aktif di workspace
    const currentRef = shipment.reference?.trim() || shipment.poNumber?.trim() || "Draft PO Baru";
    const currentBuyer = shipment.buyer?.trim() || "Buyer Belum Ditentukan";
    const currentSales = user?.name?.trim() || "Muhajirin Fatona";

    list.push({
      id: activeShipmentId || "current-active",
      reference: currentRef,
      revision: shipment.documentRevision || 1,
      buyer: currentBuyer,
      buyerCountry: shipment.buyerCountry?.trim() || "-",
      destination: shipment.destination?.trim() || "-",
      salesPic: currentSales,
      product: shipment.product?.trim() || "Komoditas Ekspor",
      quantity: shipment.quantity || 20,
      unit: shipment.unit || "MT",
      incoterm: shipment.incoterm || "FOB",
      offerValue: pricing.active.offer || 0,
      currency: shipment.currency || "USD",
      margin: shipment.margin || 15,
      approvalStatus: flow.effectiveApprovalStatus,
      tone: statusTone,
      isCurrent: true,
      isCloud: Boolean(activeShipmentId),
      shipmentData: shipment,
    });

    // 2. Transaksi database cloud
    for (const s of shipmentsList) {
      if (s.id === activeShipmentId) continue;
      if (!s.reference || s.reference === "Transaksi Ekspor" || s.reference.startsWith("EXP-2026-")) continue;

      list.push({
        id: s.id,
        reference: s.reference,
        revision: 1,
        buyer: s.buyer?.trim() || "Mitra Buyer",
        buyerCountry: s.buyerCountry?.trim() || "-",
        destination: "-",
        salesPic: "Muhajirin Fatona",
        product: s.product?.trim() || "Komoditas Ekspor",
        quantity: s.quantity || 20,
        unit: s.unit || "MT",
        incoterm: s.incoterm || "FOB",
        offerValue: (s.quantity || 20) * 4200,
        currency: "USD",
        margin: 18,
        approvalStatus: s.status === "Confirmed" ? "Tercatat direview" : "Menunggu review",
        tone: s.status === "Confirmed" ? "green" : "amber",
        isCurrent: false,
        isCloud: true,
      });
    }

    // 3. Transaksi lokal tersimpan
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
          buyer: loc.buyer || "Buyer Internasional",
          buyerCountry: loc.buyerCountry || "-",
          destination: loc.shipment?.destination || "-",
          salesPic: "Muhajirin Fatona",
          product: loc.product || "Komoditas Ekspor",
          quantity: loc.quantity || 20,
          unit: loc.unit || "MT",
          incoterm: loc.incoterm || "FOB",
          offerValue: (loc.quantity || 20) * (loc.shipment?.unitPrice || 4200),
          currency: loc.shipment?.currency || "USD",
          margin: loc.shipment?.margin || 18,
          approvalStatus: loc.status === "Confirmed" ? "Tercatat direview" : "Menunggu review",
          tone: loc.status === "Confirmed" ? "green" : "amber",
          isCurrent: false,
          isCloud: false,
          shipmentData: loc.shipment,
        });
      }
    }

    // 4. Jika hanya ada 1 draft kosong, sertakan contoh penawaran riil (Buyer A vs Buyer B)
    if (list.length <= 1) {
      list.push({
        id: "demo-buyer-a",
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
        currency: "USD",
        margin: 18,
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
        id: "demo-buyer-b",
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
        currency: "USD",
        margin: 22,
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
    flow.effectiveApprovalStatus,
    statusTone,
    shipmentsList,
    localList,
    activeShipmentId,
    user?.name,
  ]);

  const handleSelectOrder = async (item: (typeof queueItems)[number]) => {
    if (item.isCurrent) return;
    if (item.isCloud && loadShipment) {
      await loadShipment(item.id);
      toast.success(`Order dimuat untuk ditinjau: ${item.reference}`, {
        description: `Buyer: ${item.buyer} (${item.buyerCountry})`,
      });
    } else if (item.shipmentData && loadCustomShipment) {
      loadCustomShipment(item.shipmentData, item.id);
      toast.success(`Order dimuat untuk ditinjau: ${item.reference}`, {
        description: `Buyer: ${item.buyer} (${item.buyerCountry})`,
      });
    }
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

  const pendingReviewCount = queueItems.filter(
    (q) => q.approvalStatus === "Menunggu review" || q.approvalStatus === "Perlu review ulang"
  ).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* 1. Header & Segmented Tabs Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          padding: "16px 20px",
          background: "#ffffff",
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              display: "inline-flex",
              background: "#f1f5f9",
              padding: 3,
              borderRadius: 8,
              border: "1px solid #e2e8f0",
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab("approvals")}
              style={{
                padding: "8px 18px",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                background: activeTab === "approvals" ? "#0284c7" : "transparent",
                color: activeTab === "approvals" ? "#ffffff" : "#475569",
                boxShadow: activeTab === "approvals" ? "0 1px 3px rgba(2,132,199,0.25)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              <ClipboardCheck size={16} /> Antrian Otorisasi ({queueItems.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("team")}
              style={{
                padding: "8px 18px",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                background: activeTab === "team" ? "#0284c7" : "transparent",
                color: activeTab === "team" ? "#ffffff" : "#475569",
                boxShadow: activeTab === "team" ? "0 1px 3px rgba(2,132,199,0.25)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              <Users size={16} /> Kelola Tim &amp; Hak Akses ({teamMembers.length})
            </button>
          </div>
        </div>

        {/* Mode Operasional: Korporasi vs Mandiri */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#64748b" }}>
          <span style={{ fontWeight: 500 }}>Mode Alur Kerja:</span>
          <select
            value={workflowMode}
            onChange={(e) => {
              const next = e.target.value as "corporate" | "simple";
              setWorkflowMode(next);
              try {
                localStorage.setItem("eksporflow_workflow_mode", next);
              } catch {}
              toast.info(
                `Mode beralih ke: ${next === "corporate" ? "Enterprise Multi-Tim (ERP Approval)" : "Mandiri / UMKM (Fast-Track)"}`
              );
            }}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid #cbd5e1",
              background: "#f8fafc",
              fontSize: 12.5,
              fontWeight: 600,
              color: "#0f172a",
              cursor: "pointer",
            }}
          >
            <option value="corporate">🏢 Korporasi / Multi-Tim (ERP Approval)</option>
            <option value="simple">🚀 Mandiri / UMKM (Fast-Track Otorisasi)</option>
          </select>
        </div>
      </div>

      {/* 2. TAB 1: Antrian Otorisasi Penawaran (Modern Clean Master-Detail View) */}
      {activeTab === "approvals" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "360px minmax(0, 1fr)",
            gap: 20,
            alignItems: "start",
          }}
        >
          {/* Kolom Kiri: Antrian Card Feed (Tidak ada tabel yang tertekuk!) */}
          <section
            style={{
              background: "#ffffff",
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              padding: "16px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
                paddingBottom: 10,
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              <div>
                <b style={{ fontSize: 14, color: "#0f172a" }}>Daftar Antrian Review</b>
                <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>
                  Pilih penawaran untuk memeriksa rincian
                </div>
              </div>
              <StatusPill tone={pendingReviewCount > 0 ? "amber" : "green"}>
                {pendingReviewCount} Menunggu
              </StatusPill>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {queueItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectOrder(item)}
                  style={{
                    padding: "14px 15px",
                    borderRadius: 10,
                    border: item.isCurrent ? "2px solid #0284c7" : "1px solid #e2e8f0",
                    background: item.isCurrent ? "#f0f9ff" : "#ffffff",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    boxShadow: item.isCurrent
                      ? "0 2px 8px rgba(2, 132, 199, 0.12)"
                      : "0 1px 2px rgba(0,0,0,0.03)",
                  }}
                  onMouseEnter={(e) => {
                    if (!item.isCurrent) e.currentTarget.style.borderColor = "#94a3b8";
                  }}
                  onMouseLeave={(e) => {
                    if (!item.isCurrent) e.currentTarget.style.borderColor = "#e2e8f0";
                  }}
                >
                  {/* Top Bar: PO & Status */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 6,
                    }}
                  >
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
                    <StatusPill tone={item.tone}>{item.approvalStatus}</StatusPill>
                  </div>

                  {/* Buyer & Negara */}
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: item.isCurrent ? "#0369a1" : "#1e293b",
                      marginBottom: 3,
                      lineHeight: 1.3,
                    }}
                  >
                    {item.buyer}
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: "#64748b",
                      marginBottom: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <span>🌍 {item.buyerCountry}</span>
                    {item.destination && item.destination !== "-" && (
                      <span>· {item.destination}</span>
                    )}
                  </div>

                  {/* Komoditas */}
                  <div style={{ fontSize: 12, color: "#475569", marginBottom: 10 }}>
                    📦 {item.product} ({item.quantity} {item.unit})
                  </div>

                  {/* Footer Card: Nilai, Margin, Sales */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingTop: 8,
                      borderTop: "1px solid #f1f5f9",
                      fontSize: 12,
                    }}
                  >
                    <div>
                      <b style={{ color: "#0284c7" }}>
                        {formatMoney(item.offerValue, item.currency)}
                      </b>
                      <span style={{ color: "#64748b", marginLeft: 4 }}>({item.incoterm})</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span
                        style={{
                          padding: "2px 7px",
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          background: item.margin < 20 ? "#fef3c7" : "#dcfce7",
                          color: item.margin < 20 ? "#b45309" : "#15803d",
                        }}
                      >
                        Margin {item.margin}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Kolom Kanan: Canvas Detail Peninjauan Eksekutif (Luas & Lapang) */}
          <section
            style={{
              background: "#ffffff",
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              padding: "24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            }}
          >
            {/* Header Detail */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                paddingBottom: 16,
                borderBottom: "1px solid #f1f5f9",
                marginBottom: 20,
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#0284c7",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  PENINJAUAN OTORISASI PENAWARAN EKSPOR
                </span>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", margin: "4px 0 2px" }}>
                  {shipment.reference || "PO Baru"} · {shipment.buyer || "Buyer Belum Ditentukan"}
                </h2>
                <div style={{ fontSize: 13, color: "#64748b" }}>
                  Tujuan: {shipment.buyerCountry || "-"} · Pelabuhan Bongkar: {shipment.destination || "-"}
                </div>
              </div>
              <StatusPill tone={statusTone}>{flow.effectiveApprovalStatus}</StatusPill>
            </div>

            {/* Guardrail Info Banner */}
            {workflowMode === "corporate" ? (
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontSize: 12.5,
                  color: "#166534",
                  marginBottom: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <ShieldCheck size={18} style={{ color: "#16a34a", flexShrink: 0 }} />
                <div>
                  <b>Tata Kelola Pemisahan Tugas (ERP SoD):</b> Persetujuan pimpinan (Approver) diperlukan sebelum Proforma Invoice resmi dikirim ke buyer untuk menjamin batas margin aman perusahaan.
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontSize: 12.5,
                  color: "#1e40af",
                  marginBottom: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <CheckCircle2 size={18} style={{ color: "#3b82f6", flexShrink: 0 }} />
                <div>
                  <b>Mode Mandiri / UMKM Aktif:</b> Anda dapat langsung mengesahkan penawaran tanpa proses birokrasi berjenjang.
                </div>
              </div>
            )}

            {/* 3 Metric Stat Cards di Atas */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 14,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  padding: "14px 16px",
                }}
              >
                <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                  Harga Penawaran Resmi
                </span>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginTop: 4 }}>
                  {formatMoney(pricing.active.offer, shipment.currency)}
                </div>
                <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>
                  Incoterm: {shipment.incoterm} · {shipment.namedPlace || "-"}
                </div>
              </div>

              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  padding: "14px 16px",
                }}
              >
                <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                  Total Biaya (Cost to Serve)
                </span>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginTop: 4 }}>
                  {formatMoney(pricing.active.cost, shipment.currency)}
                </div>
                <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>
                  HPP Produksi + Freight &amp; Kontingensi
                </div>
              </div>

              <div
                style={{
                  background: shipment.margin < 20 ? "#fffbeb" : "#f0fdf4",
                  border: shipment.margin < 20 ? "1px solid #fde68a" : "1px solid #bbf7d0",
                  borderRadius: 8,
                  padding: "14px 16px",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    color: shipment.margin < 20 ? "#92400e" : "#166534",
                    fontWeight: 600,
                  }}
                >
                  Estimasi Margin Bersih
                </span>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: shipment.margin < 20 ? "#b45309" : "#15803d",
                    marginTop: 4,
                  }}
                >
                  {shipment.margin}%
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: shipment.margin < 20 ? "#b45309" : "#166534",
                    marginTop: 2,
                    fontWeight: 500,
                  }}
                >
                  {shipment.margin < 20 ? "⚠️ Di bawah target (min. 20%)" : "✓ Target 20% terpenuhi"}
                </div>
              </div>
            </div>

            {/* 2-Column Specification Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                marginBottom: 20,
              }}
            >
              {/* Kolom 1: Spesifikasi Kontrak & Buyer */}
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  padding: "16px",
                }}
              >
                <b style={{ fontSize: 13, color: "#0f172a", display: "block", marginBottom: 12 }}>
                  📋 Spesifikasi Kontrak &amp; Buyer
                </b>
                <div className="clean-kv">
                  <span>Nama Buyer</span>
                  <b>{shipment.buyer || "Belum ditentukan (Draft)"}</b>
                </div>
                <div className="clean-kv">
                  <span>Negara &amp; Pelabuhan</span>
                  <b>
                    {shipment.buyerCountry || "-"} · {shipment.destination || "-"}
                  </b>
                </div>
                <div className="clean-kv">
                  <span>Komoditas &amp; Tonase</span>
                  <b>
                    {shipment.product || "Komoditas Ekspor"} · {formatNumber(shipment.quantity)}{" "}
                    {shipment.unit}
                  </b>
                </div>
                <div className="clean-kv">
                  <span>Syarat Pembayaran</span>
                  <b>{shipment.paymentTerms || "T/T 30% DP, 70% Pelunasan"}</b>
                </div>
                <div className="clean-kv">
                  <span>Diskon Diberikan</span>
                  <b>{formatMoney(shipment.discount, shipment.currency)}</b>
                </div>
              </div>

              {/* Kolom 2: Pemohon & Tata Kelola Otorisasi */}
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  padding: "16px",
                }}
              >
                <b style={{ fontSize: 13, color: "#0f172a", display: "block", marginBottom: 12 }}>
                  🛡️ Pemohon &amp; Kepatuhan (SoD)
                </b>
                <div className="clean-kv">
                  <span>Sales PIC (Pemohon)</span>
                  <b>{user?.name || "Muhajirin Fatona"} (Sales Executive)</b>
                </div>
                <div className="clean-kv">
                  <span>Divisi Pengaju</span>
                  <b>Penjualan &amp; Pemasaran Ekspor</b>
                </div>
                <div className="clean-kv">
                  <span>Dokumen Acuan</span>
                  <b>Proforma Invoice (Rev R{shipment.documentRevision})</b>
                </div>
                <div className="clean-kv">
                  <span>Screening Legal AI</span>
                  <b style={{ color: "#16a34a" }}>✓ Legal Terverifikasi (Bebas Sanksi)</b>
                </div>
                <div className="clean-kv">
                  <span>Pemicu Otorisasi</span>
                  <b style={{ color: shipment.margin < 20 ? "#b45309" : "#0f172a" }}>
                    {shipment.margin < 20 ? "Dispensasi margin < 20%" : "Tata kelola standar"}
                  </b>
                </div>
              </div>
            </div>

            {/* Pemicu Review Alert */}
            {shipment.margin < 20 && (
              <div
                style={{
                  background: "#fffbeb",
                  border: "1px solid #fde68a",
                  borderRadius: 8,
                  padding: "12px 16px",
                  fontSize: 13,
                  color: "#92400e",
                  marginBottom: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <AlertCircle size={18} style={{ color: "#d97706", flexShrink: 0 }} />
                <div>
                  <b>Catatan Kebijakan Perusahaan:</b> Penawaran ini memiliki estimasi margin {shipment.margin}%, yang berada di bawah target kuartal (20%). Persetujuan Direktur diperlukan untuk memberikan dispensasi harga ke buyer.
                </div>
              </div>
            )}

            {/* Seksi Catatan & Tindakan Pimpinan */}
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                padding: "16px",
              }}
            >
              <Field
                label="Catatan Reviewer / Pimpinan (wajib bila meminta revisi harga/syarat)"
                value={comment}
                onChange={setComment}
                placeholder="Contoh: Disetujui dengan klausul DP minimal 30% atau target serah akhir bulan..."
              />

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 16,
                  paddingTop: 14,
                  borderTop: "1px solid #e2e8f0",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => navigate("pricing")}
                    style={{ fontSize: 13 }}
                  >
                    ← Buka Kalkulator Harga
                  </button>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => navigate("documents")}
                    style={{ fontSize: 13 }}
                  >
                    Buka Dokumen Proforma Invoice →
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
                      padding: "9px 18px",
                      borderRadius: 6,
                      fontSize: 13,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#fef2f2";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#ffffff";
                    }}
                  >
                    Minta Revisi ke Sales
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDecision("Tercatat direview")}
                    style={{
                      background: "#0284c7",
                      border: "none",
                      color: "#ffffff",
                      fontWeight: 600,
                      padding: "9px 22px",
                      borderRadius: 6,
                      fontSize: 13,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      boxShadow: "0 1px 3px rgba(2, 132, 199, 0.3)",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#0369a1";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#0284c7";
                    }}
                  >
                    <ClipboardCheck size={16} /> Setujui &amp; Otorisasi Penawaran
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* 3. TAB 2: Kelola Tim & Hak Akses (Enterprise ERP Roles & Member Roster) */}
      {activeTab === "team" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Header Tab Tim & Tombol Tambah Tim */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              background: "#ffffff",
              padding: "20px 24px",
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            }}
          >
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                Struktur Tim Ekspor &amp; Matriks Hak Akses (ERP)
              </h3>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
                Kelola 4 divisi utama operasional ekspor (Marketing, Akuntansi, Dokumen/Kepabeanan, dan Pimpinan) dengan pembagian tugas yang jelas.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsInviteModalOpen(true)}
              style={{
                background: "#0284c7",
                color: "#ffffff",
                border: "none",
                fontWeight: 600,
                fontSize: 13,
                padding: "9px 18px",
                borderRadius: 6,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                boxShadow: "0 1px 3px rgba(2,132,199,0.25)",
              }}
            >
              <UserPlus size={16} /> + Tambah Anggota Tim Baru
            </button>
          </div>

          {/* 4 Kartu Peran Utama Perusahaan */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: 14,
            }}
          >
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                padding: "16px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>👔</span>
                <b style={{ fontSize: 13.5, color: "#0f172a" }}>Pimpinan / Direktur</b>
              </div>
              <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.4, marginBottom: 12 }}>
                Otorisasi final penawaran harga, dispensasi margin kuartal, dan penandatanganan Sales Contract resmi.
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#0369a1",
                  background: "#e0f2fe",
                  padding: "3px 8px",
                  borderRadius: 4,
                }}
              >
                Approver (Otoritas Penuh)
              </span>
            </div>

            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                padding: "16px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>💼</span>
                <b style={{ fontSize: 13.5, color: "#0f172a" }}>Sales &amp; Marketing</b>
              </div>
              <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.4, marginBottom: 12 }}>
                Mencari buyer luar negeri, input PO / LOI, kalkulasi biaya penawaran awal, dan mengajukan persetujuan ke pimpinan.
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#166534",
                  background: "#dcfce7",
                  padding: "3px 8px",
                  borderRadius: 4,
                }}
              >
                Requester (Pemohon Penawaran)
              </span>
            </div>

            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                padding: "16px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>📦</span>
                <b style={{ fontSize: 13.5, color: "#0f172a" }}>Operasional &amp; Dokumen</b>
              </div>
              <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.4, marginBottom: 12 }}>
                Mengurus PEB Bea Cukai, perizinan e-SKA/COO Kemendag, sertifikasi karantina mutu, dan booking kontainer kapal.
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#854d0e",
                  background: "#fef9c3",
                  padding: "3px 8px",
                  borderRadius: 4,
                }}
              >
                Shipping &amp; Customs Officer
              </span>
            </div>

            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                padding: "16px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>💳</span>
                <b style={{ fontSize: 13.5, color: "#0f172a" }}>Keuangan &amp; Akuntansi</b>
              </div>
              <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.4, marginBottom: 12 }}>
                Verifikasi mutasi rekening DP, validasi pencairan L/C bank, dan pelaporan Devisa Hasil Ekspor (DHE BI).
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#6b21a8",
                  background: "#f3e8ff",
                  padding: "3px 8px",
                  borderRadius: 4,
                }}
              >
                Finance &amp; Banking
              </span>
            </div>
          </div>

          {/* Daftar Anggota Tim Aktif */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              padding: "20px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            }}
          >
            <b style={{ fontSize: 15, color: "#0f172a", display: "block", marginBottom: 14 }}>
              Daftar Anggota Tim Workspace ({teamMembers.length})
            </b>

            <div className="clean-table-wrap">
              <table className="clean-table">
                <thead>
                  <tr>
                    <th style={{ width: "24%" }}>Nama &amp; Kontak</th>
                    <th style={{ width: "22%" }}>Peran &amp; Divisi</th>
                    <th style={{ width: "36%" }}>Tanggung Jawab Otoritas</th>
                    <th style={{ width: "10%" }}>Status</th>
                    <th style={{ width: "8%" }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map((member) => (
                    <tr key={member.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: "50%",
                              background: member.isOwner ? "#0284c7" : "#e2e8f0",
                              color: member.isOwner ? "#ffffff" : "#475569",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: 13,
                              flexShrink: 0,
                            }}
                          >
                            {member.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <b style={{ fontSize: 13, color: "#0f172a" }}>{member.name}</b>
                            {member.isOwner && (
                              <span
                                style={{
                                  fontSize: 10.5,
                                  color: "#0284c7",
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
                      <td>
                        <b>{member.roleLabel}</b>
                        <span className="row-sub">{member.department}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: 12.5, color: "#475569" }}>
                          {member.authority}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: 4,
                            fontSize: 11.5,
                            fontWeight: 600,
                            background: member.status === "Aktif" ? "#dcfce7" : "#fef3c7",
                            color: member.status === "Aktif" ? "#166534" : "#b45309",
                          }}
                        >
                          {member.status}
                        </span>
                      </td>
                      <td>
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
                              borderRadius: 4,
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                            title="Hapus akses tim"
                          >
                            Hapus
                          </button>
                        ) : (
                          <span style={{ fontSize: 11.5, color: "#94a3b8" }}>Utama</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal / Dialog Tambah Anggota Tim */}
          {isInviteModalOpen && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(15, 23, 42, 0.6)",
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
                  maxWidth: 520,
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
                    paddingBottom: 12,
                    borderBottom: "1px solid #e2e8f0",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <UserPlus size={18} style={{ color: "#0284c7" }} />
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
                      padding: 4,
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
                      <label
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#334155",
                          display: "block",
                          marginBottom: 6,
                        }}
                      >
                        Peran &amp; Tanggung Jawab Tim
                      </label>
                      <select
                        value={newMemberRole}
                        onChange={(e) =>
                          setNewMemberRole(
                            e.target.value as "pimpinan" | "sales" | "ops" | "finance"
                          )
                        }
                        style={{
                          width: "100%",
                          padding: "9px 12px",
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
                      💡 Sistem akan mengirimkan tautan akses ke email anggota dengan batasan hak akses sesuai peran divisi di atas.
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: 10,
                      marginTop: 20,
                      paddingTop: 14,
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
                        padding: "8px 16px",
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
                        background: "#0284c7",
                        border: "none",
                        color: "#ffffff",
                        fontWeight: 600,
                        padding: "8px 20px",
                        borderRadius: 6,
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      Kirim Undangan Tim
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
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
