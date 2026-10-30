import type { PersistenceSaveState } from "@/hooks/useActiveShipment";
import type { WorkspaceFlow } from "@/hooks/useWorkspaceFlow";
import { formatMoney } from "@shared/format";
import type { PoScreeningResult } from "@shared/poScreening";
import type { Pricing } from "@shared/pricing";
import type { ScreenId } from "@shared/risk";
import type { ContainerCalc, Shipment } from "@shared/shipment";
import {
  Calculator,
  Check,
  CheckCircle2,
  ChevronRight,
  Cloud,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  MessageSquare,
  Package,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { PoIngestionModal } from "./PoIngestionModal";
import { Field, StatusPill } from "./Primitives";
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
  createdAt: Date | string;
  updatedAt: Date | string;
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
  saveShipment,
  createNewDraft: _createNewDraft,
  login,
  navigate,
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
  saveShipment: () => Promise<void>;
  createNewDraft: (customRef?: string) => void;
  login: () => Promise<void>;
  navigate: (screen: ScreenId) => void;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [poModalOpen, setPoModalOpen] = useState(false);
  const [lastScreening, setLastScreening] = useState<PoScreeningResult | null>(() => {
    try {
      const saved = localStorage.getItem("eksporflow_last_po_screening");
      return saved ? (JSON.parse(saved) as PoScreeningResult) : null;
    } catch {
      return null;
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

  const handleSaveDraft = () => {
    try {
      localStorage.setItem("eksporflow-user-draft-manual", JSON.stringify(shipment));
      toast.success("Draft Transaksi Disimpan", {
        description: "Data tersimpan di penyimpanan draft perangkat Anda (belum dicatat ke Cloud).",
      });
    } catch {
      toast.info("Draft transaksi tersimpan secara lokal");
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
        s.reference !== "EXP-2026-001" &&
        s.reference !== "EXP-2026-084" &&
        !s.reference.startsWith("EXP-2026-"),
    );
  }, [shipmentsList]);

  // Jika belum ada transaksi asli buatan user, sembunyikan tabel daftar transaksi
  const hasSavedTransactions = genuineShipments.length > 0;

  const filteredCloudList = useMemo(() => {
    const q = query.trim().toLowerCase();
    return genuineShipments.filter((row) => {
      const matchQuery =
        !q || row.reference.toLowerCase().includes(q) || row.status.toLowerCase().includes(q);
      const matchStatus = statusFilter === "ALL" || row.status === statusFilter;
      return matchQuery && matchStatus;
    });
  }, [genuineShipments, query, statusFilter]);

  const draftCount = genuineShipments.filter((r) => r.status === "Draft" || r.status === "Quotation").length;
  const activeExecutionCount = genuineShipments.filter(
    (r) => !["Draft", "Quotation", "Completed"].includes(r.status),
  ).length;

  // Clean value for reference: don't show dummy codes
  const displayReference =
    shipment.reference === "EXP-2026-001" ||
    shipment.reference === "EXP-2026-084" ||
    shipment.reference.startsWith("EXP-2026-")
      ? ""
      : shipment.reference;

  // Apakah dokumen PO atau LOI sudah discan atau sudah ada dokumen resmi buyer
  const hasScannedPo = Boolean(
    lastScreening ||
    (displayReference && shipment.buyer && shipment.buyerCountry)
  );

  return (
    <div className="module-stack">
      {/* 1. Notifikasi Mode Draft Lokal (Jika belum masuk akun) */}
      {!user && (
        <div className="clean-notice warn">
          <div>
            <b>Mode Draft Lokal Aktif</b> — Data transaksi disimpan sementara di browser perangkat ini. Masuk akun agar transaksi tersimpan aman di database cloud PostgreSQL beserta riwayat versi.
          </div>
          <button type="button" className="save-button" onClick={() => void login()}>
            <Cloud size={14} /> Masuk &amp; Hubungkan Cloud
          </button>
        </div>
      )}

      {/* 2. INFORMASI UTAMA: Data Transaksi (Clean, Minimalist & Symmetrical) */}
      <section className="panel panel-padding active-order-card">
        <div className="panel-head">
          <div>
            <span className="eyebrow">INFORMASI UTAMA</span>
            <h3>Data Transaksi</h3>
          </div>

          <div className="active-order-header-actions">
            <button
              type="button"
              className="create-po-btn"
              onClick={() => setPoModalOpen(true)}
              title="Pindai dan ekstrak data otomatis dari dokumen PO atau LOI buyer"
            >
              <FileSpreadsheet size={14} /> + Scan Dokumen PO / LOI
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={handleSaveDraft}
              title="Simpan sebagai draft lokal"
            >
              <FileText size={14} /> Draft
            </button>
            <button
              type="button"
              className="save-button"
              onClick={() => void saveShipment()}
              disabled={saveState === "saving"}
              title="Simpan transaksi ke database cloud"
            >
              <Save size={14} /> {saveState === "saving" ? "Menyimpan..." : "Simpan"}
            </button>
            <button
              type="button"
              className="ghost-button select-partner-btn"
              onClick={() => navigate("partners")}
              title="Pilih dari daftar mitra buyer tersimpan"
            >
              <Users size={14} /> Mitra
            </button>
            <span className="connection-pill-sync">
              <span className="sync-dot">•</span> Sinkron
            </span>
          </div>
        </div>

        {/* Banner Hasil Screening AI Advisor Buyer Jika Ada */}
        {lastScreening && (
          <div className="po-screening-banner">
            <div className="po-screening-banner-left">
              <span className="po-screening-badge">
                <CheckCircle2 size={15} /> AI Advisor: Buyer {lastScreening.buyer} Terverifikasi ({lastScreening.validation.score}%)
              </span>
              <p>
                {lastScreening.validation.legalEntityStatus} · {lastScreening.validation.sanctionCheck} · {lastScreening.validation.paymentTermRisk}
              </p>
            </div>
            <button
              type="button"
              className="compact-btn"
              onClick={() => setPoModalOpen(true)}
            >
              Lihat Analisis Lengkap PO
            </button>
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
        </div>

        {/* Rekomendasi Dokumen: Hanya Ditampilkan Setelah Ada PO/LOI dari Buyer */}
        {!hasScannedPo ? (
          <div className="trans-compliance-pending">
            <div className="trans-compliance-pending-left">
              <div className="trans-compliance-pending-icon">
                <Sparkles size={18} />
              </div>
              <div className="trans-compliance-pending-text">
                <span className="trans-compliance-pending-title">
                  Rekomendasi Regulasi &amp; Sertifikat Ekspor (AI Advisor)
                </span>
                <p>
                  Saran dokumen kepatuhan belum ditampilkan karena belum ada PO/LOI dari buyer. Gunakan tombol <strong>+ Scan Dokumen PO / LOI</strong> di atas agar AI Advisor dapat memindai negara tujuan dan memunculkan dokumen yang wajib Anda siapkan.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Dokumen & Sertifikat Kepatuhan Ekspor Hasil Scan AI */
          <div className="trans-compliance-box">
            <div className="trans-compliance-head">
              <div className="trans-compliance-title">
                <Sparkles size={14} />
                <span>Dokumen &amp; Sertifikat Ekspor ({shipment.buyerCountry || "Internasional"})</span>
                <span className="compliance-tag-scanned">
                  <CheckCircle2 size={11} /> AI Rekomendasi Aktif dari PO / LOI
                </span>
              </div>
              <div className="trans-compliance-actions">
                <span className="trans-compliance-note">
                  Konfirmasi tarif resmi ke freight forwarder Anda
                </span>
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

        {/* Rel Navigasi Antar Modul Terintegrasi */}
        <div className="connection-rail">
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
      </section>

      {/* 3. ALUR OPERASIONAL EKSPOR TERINTEGRASI */}
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

      {/* 4. DAFTAR ARSIP & RIWAYAT TRANSAKSI: Hanya Tampil Bila Ada Transaksi Tersimpan */}
      {hasSavedTransactions && (
        <>
          <section className="panel panel-padding">
            <div className="panel-head">
              <div>
                <span className="eyebrow">DATABASE WORKSPACE</span>
                <h3>Daftar Transaksi Perusahaan</h3>
                <p className="profile-description">
                  Kelola dan buka kembali arsip transaksi ekspor yang pernah disimpan ke database cloud. Setiap transaksi memiliki riwayat versi dan audit log.
                </p>
              </div>

              {/* Filter & Pencarian Langsung di Header Tabel */}
              <div className="clean-table-toolbar">
                <div className="clean-search-box compact">
                  <Search size={14} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Cari nomor transaksi, status..."
                  />
                </div>
                <select
                  className="clean-select compact"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  aria-label="Filter status transaksi"
                >
                  <option value="ALL">Semua Status ({genuineShipments.length})</option>
                  <option value="Draft">Draft</option>
                  <option value="Quotation">Quotation</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Ready to Ship">Ready to Ship</option>
                  <option value="Booked">Booked</option>
                  <option value="Stuffing">Stuffing</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Isi Tabel Riwayat Transaksi */}
            {isLoadingList ? (
              <div className="empty-attachment">Memuat daftar transaksi dari server...</div>
            ) : filteredCloudList.length === 0 ? (
              <div className="empty-attachment">
                Tidak ada transaksi yang cocok dengan kata kunci pencarian atau filter status.
              </div>
            ) : (
              <div className="clean-table-wrap">
                <table className="clean-table">
                  <thead>
                    <tr>
                      <th>Nomor / Referensi Internal</th>
                      <th>Status Operasional</th>
                      <th>Versi Database</th>
                      <th>Terakhir Diperbarui</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCloudList.map((row) => {
                      const isCurrent = row.id === activeShipmentId;
                      return (
                        <tr key={row.id} className={isCurrent ? "active-row" : ""}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <b style={{ color: "var(--navy)" }}>{row.reference || "(Tanpa nomor)"}</b>
                              {isCurrent && (
                                <span className="current-tx-badge">● Sedang Dibuka</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <StatusPill tone={statusTone(row.status)}>{row.status}</StatusPill>
                          </td>
                          <td>
                            <span className="mono-code">v{row.version}</span>
                          </td>
                          <td style={{ color: "var(--muted)", fontSize: "12px" }}>
                            {formatShortDate(row.updatedAt)}
                          </td>
                          <td>
                            <div className="row-actions">
                              <button
                                type="button"
                                className={isCurrent ? "ghost-button" : "save-button"}
                                onClick={() => void loadShipment(row.id)}
                                title={isCurrent ? "Muat ulang data dari server" : "Buka transaksi ini ke workspace"}
                              >
                                <FolderOpen size={13} /> {isCurrent ? "Muat Ulang" : "Buka Transaksi"}
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

          {/* Ringkasan Statistik Eksekutif */}
          <div className="clean-grid-3">
            <section className="panel panel-padding clean-stat-card">
              <span className="eyebrow">TOTAL TRANSAKSI TERSIMPAN</span>
              <strong>{user ? genuineShipments.length : "—"}</strong>
              <small>{user ? "Tercatat di database workspace" : "Masuk akun untuk sinkronisasi"}</small>
            </section>
            <section className="panel panel-padding clean-stat-card">
              <span className="eyebrow">FASE PENAWARAN (DRAFT / QUOTE)</span>
              <strong>{user ? draftCount : 1}</strong>
              <small>Negosiasi harga atau menunggu konfirmasi buyer</small>
            </section>
            <section className="panel panel-padding clean-stat-card">
              <span className="eyebrow">EKSEKUSI BERJALAN</span>
              <strong>{user ? activeExecutionCount : 0}</strong>
              <small>Confirmed, Booked, Stuffing, hingga Pelayaran</small>
            </section>
          </div>
        </>
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
