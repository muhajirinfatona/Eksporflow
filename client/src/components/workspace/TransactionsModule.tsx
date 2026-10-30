import type { PersistenceSaveState } from "@/hooks/useActiveShipment";
import type { WorkspaceFlow } from "@/hooks/useWorkspaceFlow";
import { formatMoney } from "@shared/format";
import type { PoScreeningResult } from "@shared/poScreening";
import type { Pricing } from "@shared/pricing";
import type { ScreenId } from "@shared/risk";
import type { ContainerCalc, Incoterm, Shipment } from "@shared/shipment";
import {
  Calculator,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Cloud,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Globe,
  Package,
  Plus,
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

export type StageStatus = "completed" | "in_progress" | "buyer_scope";

export type ExportStage = {
  id: number;
  stageNumber: number;
  title: string;
  subtitle: string;
  responsibilityLabel: string;
  responsibilityTone: "blue" | "green" | "slate" | "indigo" | "amber";
  status: StageStatus;
  statusLabel: string;
  meta: string;
  targetScreen: ScreenId;
  targetScreenLabel: string;
};

function getIncotermExplanation(term: string): string {
  switch (term) {
    case "EXW":
      return "Pada EXW (Ex Works), barang diserahkan di gudang/pabrik penjual. Seluruh pengurusan logistik darat, kepabeanan ekspor (PEB), pemuatan kapal, ocean freight, asuransi kargo, dan kepabeanan impor ditanggung oleh Buyer.";
    case "FCA":
      return "Pada FCA (Free Carrier), eksportir mengurus kepabeanan ekspor (PEB) dan menyerahkan barang kepada pihak pengangkut yang ditunjuk buyer di lokasi asal yang disepakati.";
    case "FAS":
      return "Pada FAS (Free Alongside Ship), eksportir mengurus kepabeanan ekspor dan menyerahkan barang di dermaga samping kapal di pelabuhan muat. Ongkos muat ke kapal dan ocean freight ditanggung buyer.";
    case "FOB":
      return "Pada FOB (Free On Board), eksportir bertanggung jawab mengurus barang hingga selesai dimuat ke atas kapal (on-board) di pelabuhan muat Indonesia termasuk PEB. Ongkos kapal laut (ocean freight) dan asuransi ditanggung Buyer.";
    case "CFR":
      return "Pada CFR (Cost and Freight), eksportir menanggung biaya logistik dan ongkos kapal laut (ocean freight) hingga pelabuhan tujuan. Asuransi kargo laut dan kepabeanan impor diurus oleh Buyer.";
    case "CIF":
      return "Pada CIF (Cost, Insurance and Freight), eksportir menanggung ongkos kapal laut hingga pelabuhan tujuan dan wajib membelikan polis asuransi kargo laut (Marine Cargo) atas nama buyer. Kepabeanan impor ditanggung Buyer.";
    case "DAP":
      return "Pada DAP (Delivered at Place), eksportir mengurus pengiriman hingga tiba di alamat/gudang buyer di negara tujuan. Pajak dan bea masuk impor ditanggung Buyer.";
    case "DDP":
      return "Pada DDP (Delivered Duty Paid), eksportir bertanggung jawab penuh end-to-end hingga barang masuk gudang buyer, termasuk pembayaran seluruh bea masuk impor dan pajak di negara tujuan.";
    default:
      return "Alur operasional disesuaikan otomatis dengan batas tanggung jawab Incoterms® 2020.";
  }
}

function getExportOperationalStages(
  shipment: Shipment,
  pricing: Pricing,
  container?: ContainerCalc,
  flow?: WorkspaceFlow,
): ExportStage[] {
  const incoterm = shipment.incoterm || "FOB";

  // Stage 1: Kontrak Penjualan & Validasi Kepatuhan
  const s1Done = Boolean(shipment.buyer.trim() && shipment.buyerCountry.trim() && shipment.destination.trim() && shipment.hsCode.trim());
  const stage1: ExportStage = {
    id: 1,
    stageNumber: 1,
    title: "Tahap 1: Kontrak Penjualan & Validasi Kepatuhan",
    subtitle: "Sales Contract / PO, Validasi Profil Buyer & Cek Regulasi Lartas Ekspor Kemendag",
    responsibilityLabel: "Wajib Eksportir",
    responsibilityTone: "blue",
    status: s1Done ? "completed" : "in_progress",
    statusLabel: s1Done ? "Selesai" : "Perlu Dilengkapi",
    meta: s1Done
      ? `Buyer: ${shipment.buyer} (${shipment.buyerCountry}) · HS ${shipment.hsCode} · Pelabuhan Tujuan: ${shipment.destination}`
      : "Nama buyer, negara tujuan, atau HS Code belum diisi lengkap",
    targetScreen: "partners",
    targetScreenLabel: "Buka Profil Mitra",
  };

  // Stage 2: Pembayaran Uang Muka (DP) / Instrumen Keuangan
  const s2Done = Boolean((flow?.paidAmount && flow.paidAmount > 0) || flow?.finance?.dpConfirmed);
  const stage2: ExportStage = {
    id: 2,
    stageNumber: 2,
    title: "Tahap 2: Pembayaran Awal / Instrumen Keuangan",
    subtitle: "Penerimaan Uang Muka (DP T/T) atau Verifikasi Letter of Credit (L/C)",
    responsibilityLabel: "Wajib Finansial",
    responsibilityTone: "indigo",
    status: s2Done ? "completed" : "in_progress",
    statusLabel: s2Done ? "DP Terkonfirmasi" : "Menunggu Pembayaran",
    meta: s2Done
      ? `Tercatat masuk ${formatMoney(flow?.paidAmount ?? 0, shipment.currency)} (${flow?.finance?.dpConfirmed ? "DP Terkonfirmasi" : "Sebagian"}) · Syarat: ${shipment.paymentTerms || "T/T DP"}`
      : `Belum ada pembayaran DP tercatat di Rekonsiliasi Bank · Syarat: ${shipment.paymentTerms || "T/T DP"}`,
    targetScreen: "finance",
    targetScreenLabel: "Buka Keuangan & AR",
  };

  // Stage 3: Kesiapan Mutu, Kemasan & Sertifikasi Ekspor
  const s3Done = Boolean(flow?.readiness?.certReady || flow?.legalChecklist?.originEvidence);
  const stage3: ExportStage = {
    id: 3,
    stageNumber: 3,
    title: "Tahap 3: Kesiapan Mutu, Kemasan & Sertifikasi Ekspor",
    subtitle: "Standarisasi Mutu (COA), Kemasan Ekspor, Fumigasi ISPM-15 & Karantina",
    responsibilityLabel: "Wajib Eksportir",
    responsibilityTone: "blue",
    status: s3Done ? "completed" : "in_progress",
    statusLabel: s3Done ? "Mutu Terverifikasi" : "Persiapan Sertifikat",
    meta: s3Done
      ? "Sertifikasi mutu, bukti asal barang & kemasan ekspor telah diverifikasi"
      : `Siapkan dokumen uji lab (COA), fumigasi kayu/ISPM-15, dan karantina sesuai negara tujuan (${shipment.buyerCountry || "Internasional"})`,
    targetScreen: "risk",
    targetScreenLabel: "Buka Risk Center",
  };

  // Stage 4: Muatan Kontainer & Booking Armada Logistik (Cargo)
  const isExw = incoterm === "EXW";
  const s4ContainerOk = Boolean(
    container &&
    (container.volumeUtilization > 0 || container.weightUtilization > 0) &&
    container.volumeUtilization <= 100 &&
    container.weightUtilization <= 100
  );
  const stage4: ExportStage = {
    id: 4,
    stageNumber: 4,
    title: "Tahap 4: Muatan Kontainer & Booking Armada Logistik",
    subtitle: isExw
      ? "Penyerahan Barang di Gudang / Pabrik Penjual (Armada dari Buyer)"
      : "Simulasi Muatan 3D, Booking Kontainer/Truk & Penimbangan Resmi VGM (Solas)",
    responsibilityLabel: isExw ? "Ditanggung Buyer (EXW)" : "Wajib Eksportir",
    responsibilityTone: isExw ? "slate" : "blue",
    status: isExw ? "buyer_scope" : s4ContainerOk ? "completed" : "in_progress",
    statusLabel: isExw ? "Cakupan Buyer" : s4ContainerOk ? "Kapasitas Pas" : "Perlu Simulasi",
    meta: isExw
      ? "Pada EXW, kontainer dan truk penjemputan disediakan langsung oleh pihak buyer."
      : s4ContainerOk
      ? `${container?.containers ?? 1} × ${shipment.containerType} · Berat ${container ? container.weightUtilization.toFixed(0) : 0}% (${container ? container.volumeUtilization.toFixed(0) : 0}% vol) · Aman / Tidak Overload`
      : "Simulasi muatan belum optimal atau belum dihitung kapasitas kontainernya",
    targetScreen: "cargo",
    targetScreenLabel: "Buka Rencana Muatan",
  };

  // Stage 5: Kepabeanan Ekspor (PEB) & Pemuatan Pelabuhan Asal
  const s5Done = Boolean(flow?.legalChecklist?.sanctionsScreened && flow?.legalChecklist?.hsCodeReviewed);
  const stage5: ExportStage = {
    id: 5,
    stageNumber: 5,
    title: "Tahap 5: Kepabeanan Ekspor (PEB) & Pemuatan Pelabuhan Asal",
    subtitle: isExw
      ? "Pengurusan Ekspor di Pelabuhan Asal Dilakukan Buyer / Agen Buyer"
      : "Pengajuan PEB di Bea Cukai (CEISA), Penerbitan NPE & Muat ke Kapal (On-Board)",
    responsibilityLabel: isExw ? "Ditanggung Buyer (EXW)" : "Wajib Eksportir (Bea Cukai)",
    responsibilityTone: isExw ? "slate" : "blue",
    status: isExw ? "buyer_scope" : s5Done ? "completed" : "in_progress",
    statusLabel: isExw ? "Cakupan Buyer" : s5Done ? "Kepatuhan Terverifikasi" : "Siapkan PEB & NPE",
    meta: isExw
      ? "Tanggung jawab kepabeanan ekspor di Indonesia berada di pihak buyer atau forwarder buyer."
      : s5Done
      ? "Pemeriksaan sanksi & verifikasi HS Code kepabeanan selesai · Siap pengajuan PEB & bayar THC Origin."
      : "Lakukan review legalitas dokumen ekspor & kepabeanan di Risk Center sebelum pengajuan PEB.",
    targetScreen: "risk",
    targetScreenLabel: "Buka Risk Center",
  };

  // Stage 6: Pengapalan Internasional & Asuransi Kargo Laut
  const isFreightCollect = incoterm === "EXW" || incoterm === "FOB" || incoterm === "FCA";
  const isCfr = incoterm === "CFR";
  const isCif = incoterm === "CIF";
  const s6PricingOk = pricing.active.offer > 0 && pricing.validationErrors.length === 0;

  let s6Resp = "Wajib Eksportir";
  let s6Tone: "blue" | "green" | "slate" | "indigo" | "amber" = "blue";
  if (isFreightCollect) {
    s6Resp = `Ditanggung Buyer (${incoterm})`;
    s6Tone = "slate";
  } else if (isCfr) {
    s6Resp = "Freight: Eksportir · Asuransi: Buyer";
    s6Tone = "amber";
  } else if (isCif) {
    s6Resp = "Freight & Asuransi: Wajib Eksportir (CIF)";
    s6Tone = "blue";
  }

  const stage6: ExportStage = {
    id: 6,
    stageNumber: 6,
    title: "Tahap 6: Pengapalan Internasional & Asuransi Kargo Laut",
    subtitle: isFreightCollect
      ? "Ocean Freight (Kapal Laut) & Asuransi Kargo Dibooking & Dibayar Oleh Buyer"
      : isCfr
      ? "Ocean Freight Ditanggung Eksportir (Freight Prepaid) · Asuransi Ditanggung Buyer"
      : isCif
      ? "Ocean Freight & Polis Asuransi Kargo Laut (ICC Clause A) Wajib Disediakan Eksportir"
      : "Pengapalan Internasional & Proteksi Kargo Ditanggung Eksportir Hingga Negara Tujuan",
    responsibilityLabel: s6Resp,
    responsibilityTone: s6Tone,
    status: isFreightCollect ? "buyer_scope" : s6PricingOk ? "completed" : "in_progress",
    statusLabel: isFreightCollect ? "Cakupan Buyer (Freight Collect)" : s6PricingOk ? "Biaya Terkalkulasi" : "Hitung Freight & Asuransi",
    meta: isFreightCollect
      ? "Ocean freight kapal dan polis asuransi dibooking serta dibayar oleh Buyer di negara tujuan."
      : isCfr
      ? `Ocean freight telah terkalkulasi (${formatMoney(pricing.active.offer, shipment.currency)}) · Asuransi kargo ditutup oleh buyer.`
      : isCif
      ? `Ocean freight & premi asuransi kargo telah terkalkulasi (${formatMoney(pricing.active.offer, shipment.currency)}) · Siap terbitkan polis asuransi.`
      : `Pengapalan laut internasional dan proteksi transit terkalkulasi (${formatMoney(pricing.active.offer, shipment.currency)}).`,
    targetScreen: "pricing",
    targetScreenLabel: "Buka Harga & Order",
  };

  // Stage 7: Penerbitan Dokumen Resmi Ekspor & Surat Keterangan Asal (e-SKA)
  const s7Done = Boolean(shipment.documentReviewed);
  const stage7: ExportStage = {
    id: 7,
    stageNumber: 7,
    title: "Tahap 7: Penerbitan Dokumen Resmi Ekspor & Kirim Dokumen",
    subtitle: "Final Commercial Invoice, Packing List, Bill of Lading (B/L) & COO Form e-SKA Kemendag",
    responsibilityLabel: "Wajib Eksportir",
    responsibilityTone: "blue",
    status: s7Done ? "completed" : "in_progress",
    statusLabel: s7Done ? "Dokumen Siap" : "Perlu Review",
    meta: s7Done
      ? `Dokumen ekspor terverifikasi (Rev R${shipment.documentRevision}) · Siap dikirim ke buyer / diserahkan ke bank L/C`
      : "Review Commercial Invoice, Packing List, draft B/L pelayaran, dan pengajuan Surat Keterangan Asal (e-SKA)",
    targetScreen: "documents",
    targetScreenLabel: "Buka Dokumen Ekspor",
  };

  // Stage 8: Pengantaran ke Alamat Buyer & Bea Masuk Impor
  const isPortTerm = incoterm === "EXW" || incoterm === "FOB" || incoterm === "CFR" || incoterm === "CIF" || incoterm === "FCA";
  const isDap = incoterm === "DAP";
  const isDdp = incoterm === "DDP";

  let s8Resp = "Ditanggung Buyer di Pelabuhan Tujuan";
  let s8Tone: "blue" | "green" | "slate" | "indigo" | "amber" = "slate";
  let s8Status: StageStatus = "buyer_scope";
  let s8StatusLabel = "Selesai di Pelabuhan (Cakupan Buyer)";
  let s8Meta = `Tanggung jawab eksportir selesai di pelabuhan. Pengeluaran kargo, bea masuk impor & pajak di ${shipment.destination || "negara tujuan"} diurus buyer.`;

  if (isDap) {
    s8Resp = "Truk ke Alamat: Eksportir · Pajak: Buyer";
    s8Tone = "amber";
    const dapOk = shipment.destinationHandling > 0 || shipment.lastMile > 0;
    s8Status = dapOk ? "completed" : "in_progress";
    s8StatusLabel = dapOk ? "Biaya Terkalkulasi" : "Siapkan Tarif Last-Mile";
    s8Meta = "Eksportir menanggung biaya terminal bongkar dan truk lokal ke alamat buyer. Pajak impor dibayar buyer.";
  } else if (isDdp) {
    s8Resp = "Wajib Eksportir Penuh (DDP)";
    s8Tone = "blue";
    const ddpOk = shipment.destinationHandling > 0 && shipment.importDuty > 0 && shipment.lastMile > 0;
    s8Status = ddpOk ? "completed" : "in_progress";
    s8StatusLabel = ddpOk ? "Biaya Terkalkulasi" : "Siapkan Tarif Impor & Last-Mile";
    s8Meta = "Eksportir menanggung biaya terminal bongkar, custom clearance impor, pembayaran bea masuk & pajak hingga tiba di gudang buyer.";
  }

  const stage8: ExportStage = {
    id: 8,
    stageNumber: 8,
    title: "Tahap 8: Pengantaran ke Alamat Buyer & Kepabeanan Impor",
    subtitle: isPortTerm
      ? "Kepabeanan Impor & Pengambilan Barang di Pelabuhan Tujuan Diurus Pembeli"
      : isDap
      ? "Penanganan Pelabuhan Bongkar & Truk Hingga Gudang Buyer (Pajak Impor oleh Buyer)"
      : "Penanganan Bongkar, Pembayaran Bea Masuk Impor & Antar Sampai Pintu Gudang Buyer",
    responsibilityLabel: s8Resp,
    responsibilityTone: s8Tone,
    status: s8Status,
    statusLabel: s8StatusLabel,
    meta: s8Meta,
    targetScreen: "pricing",
    targetScreenLabel: "Buka Harga & Order",
  };

  // Stage 9: Pelunasan Akhir & Devisa Hasil Ekspor (DHE BI)
  const s9Done = Boolean(flow?.finance?.settlementConfirmed && (flow?.remainingReceivable ?? 0) <= 0);
  const stage9: ExportStage = {
    id: 9,
    stageNumber: 9,
    title: "Tahap 9: Pelunasan Akhir & Devisa Hasil Ekspor (DHE BI)",
    subtitle: "Penerimaan Pelunasan Sisa Tagihan (Settlement), Rekonsiliasi Bank & Pelaporan DHE ke Bank Indonesia",
    responsibilityLabel: "Kepatuhan BI & Bea Cukai",
    responsibilityTone: "indigo",
    status: s9Done ? "completed" : "in_progress",
    statusLabel: s9Done ? "Lunas & Patuh DHE" : "Menunggu Pelunasan",
    meta: s9Done
      ? "Pelunasan 100% diterima di rekening devisa · Siap pelaporan Devisa Hasil Ekspor (DHE) via SiMoDIS Bank Indonesia (PP 36/2023)"
      : `Sisa piutang: ${formatMoney(flow?.remainingReceivable ?? pricing.active.offer, shipment.currency)} · Pantau di Rekonsiliasi Bank & laporkan DHE setelah dana masuk`,
    targetScreen: "finance",
    targetScreenLabel: "Buka Keuangan & AR",
  };

  return [stage1, stage2, stage3, stage4, stage5, stage6, stage7, stage8, stage9];
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
  const [stageFilter, setStageFilter] = useState<"ALL" | "EXPORTER" | "BUYER" | "DONE">("ALL");
  const [poModalOpen, setPoModalOpen] = useState(false);
  const [lastScreening, setLastScreening] = useState<PoScreeningResult | null>(null);

  // 9 Tahap Operasional Ekspor Dinamis Sesuai Incoterms 2020 & Regulasi Ekspor RI
  const operationalStages = useMemo(() => {
    return getExportOperationalStages(shipment, pricing, container, flow);
  }, [shipment, pricing, container, flow]);

  const totalStages = operationalStages.length;
  const completedStagesCount = operationalStages.filter((s) => s.status === "completed").length;
  const buyerStagesCount = operationalStages.filter((s) => s.status === "buyer_scope").length;
  const exporterStagesCount = operationalStages.filter((s) => s.status !== "buyer_scope").length;

  const filteredStages = useMemo(() => {
    if (stageFilter === "EXPORTER") return operationalStages.filter((s) => s.status !== "buyer_scope");
    if (stageFilter === "BUYER") return operationalStages.filter((s) => s.status === "buyer_scope");
    if (stageFilter === "DONE") return operationalStages.filter((s) => s.status === "completed");
    return operationalStages;
  }, [operationalStages, stageFilter]);

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

      {/* 2. SINGLE SOURCE OF TRUTH: Data Transaksi Terhubung (Clean 3-Column Grid) */}
      <section className="panel panel-padding active-order-card">
        <div className="panel-head">
          <div>
            <span className="eyebrow">SINGLE SOURCE OF TRUTH</span>
            <h3>Data transaksi terhubung</h3>
            <p className="profile-description">
              Perubahan di sini otomatis dipakai oleh kalkulator harga, invoice, Packing List, B/L draft, dan rencana muatan.
            </p>
          </div>

          <div className="active-order-header-actions">
            <button
              type="button"
              className="create-po-btn"
              onClick={() => setPoModalOpen(true)}
              title="Buat transaksi otomatis dari dokumen Purchase Order (PO) buyer"
            >
              <FileSpreadsheet size={14} /> + Tambah Transaksi dari PO
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={handleSaveDraft}
              title="Simpan sebagai draft jika belum ingin dicatat resmi ke cloud"
            >
              <FileText size={14} /> Draft
            </button>
            <button
              type="button"
              className="save-button"
              onClick={() => void saveShipment()}
              disabled={saveState === "saving"}
              title="Simpan transaksi ke database cloud workspace"
            >
              <Save size={14} /> {saveState === "saving" ? "Menyimpan..." : "Simpan"}
            </button>
            <button
              type="button"
              className="ghost-button select-partner-btn"
              onClick={() => navigate("partners")}
              title="Pilih dari direktori mitra buyer dan consignee tersimpan"
            >
              <Users size={14} /> Mitra
            </button>
            <span className="connection-pill-sync">
              <span className="sync-dot">•</span> ✓ Semua modul sinkron
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

        {/* Form Input Symmetrical 3 Columns: Bebas Kode AI Dummy */}
        <div className="profile-grid">
          <Field
            label="Nomor transaksi / PO"
            value={displayReference}
            placeholder="Contoh: PO-001, INV-2026/01"
            onChange={(value) => update("reference", value)}
          />

          <Field
            label="Nama pembeli (Buyer)"
            value={shipment.buyer}
            placeholder="Nama perusahaan pembeli luar negeri"
            onChange={(value) => update("buyer", value)}
          />

          <Field
            label="Negara tujuan pembeli"
            value={shipment.buyerCountry}
            placeholder="Contoh: Jepang, Jerman, AS"
            onChange={(value) => update("buyerCountry", value)}
          />

          <Field
            label="Pelabuhan / Kota tujuan"
            value={shipment.destination}
            placeholder="Contoh: Port of Tokyo"
            onChange={(value) => update("destination", value)}
          />

          <Field
            label="Nama perusahaan Anda (Eksportir)"
            value={shipment.exporter}
            placeholder="Nama perusahaan eksportir Anda"
            onChange={(value) => update("exporter", value)}
          />

          <Field
            label="Kode komoditas (HS Code)"
            value={shipment.hsCode}
            placeholder="Contoh: 0901.11"
            onChange={(value) => update("hsCode", value)}
          />
        </div>

        {/* AI Advisor Rekomendasi Regulasi & Dokumen Ekspor (Khusus Kepatuhan Eksportir Tanpa Perkiraan Harga) */}
        <div className="trans-regulation-card">
          <div className="trans-reg-header-top">
            <div className="trans-reg-title-wrap">
              <h4 className="trans-reg-title">
                <Sparkles size={16} color="#0284c7" />
                Daftar Dokumen &amp; Sertifikat Ekspor ({shipment.buyerCountry || "Internasional"})
              </h4>
              <p className="trans-reg-meta">
                Dokumen dan sertifikasi resmi yang umum dipersyaratkan negara pembeli <b>{shipment.buyerCountry || "Tujuan Ekspor"}</b>:
              </p>
            </div>
            <span className="trans-reg-forwarder-note">
              ℹ️ Tarif pengurusan dokumen silakan dikonfirmasi ke freight forwarder Anda
            </span>
          </div>

          <div className="trans-reg-grid">
            {aiRegulations.map((reg) => (
              <div className="trans-reg-item" key={reg.id}>
                <div className="trans-reg-item-top">
                  <div className="trans-reg-item-title">{reg.name}</div>
                  <span className="trans-reg-auth-badge">{reg.issuingAuthority}</span>
                </div>
                <div className="trans-reg-scope">
                  <span>Lingkup: {reg.targetCountry}</span>
                </div>
                <p className="trans-reg-desc">{reg.description}</p>
                <div className="trans-reg-tip-box">
                  <strong>Yang Perlu Disiapkan Eksportir:</strong>
                  {reg.preparationTip}
                </div>
              </div>
            ))}
          </div>
        </div>

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

      {/* 3. ALUR OPERASIONAL EKSPOR TERINTEGRASI: 9 Tahap Lengkap Sesuai Incoterm */}
      <section className="panel panel-padding export-workflow-panel">
        <div className="panel-head">
          <div>
            <span className="eyebrow">ALUR OPERASIONAL EKSPOR TERINTEGRASI</span>
            <h3>9 Tahap Operasional Ekspor ({shipment.incoterm || "FOB"})</h3>
            <p className="profile-description">
              Rangkaian operasional ekspor terhubung dari kontrak awal, pembayaran uang muka, standarisasi mutu &amp; karantina, muatan kontainer, kepabeanan PEB Bea Cukai, ocean freight, dokumen e-SKA, hingga pelaporan Devisa Hasil Ekspor (DHE BI).
            </p>
          </div>
          <button className="text-button" type="button" onClick={() => navigate("risk")}>
            Risk Center ({flow?.riskEvaluation?.readinessPercent ?? 11}%) <ChevronRight size={14} />
          </button>
        </div>

        {/* Banner Panduan Incoterm Aktif & Pembagian Tanggung Jawab */}
        <div className="incoterm-guide-banner">
          <div className="incoterm-guide-header">
            <div className="incoterm-guide-title">
              <span className="incoterm-guide-badge">Incoterms® 2020: {shipment.incoterm || "FOB"}</span>
              <span>Batas Tanggung Jawab Operasional</span>
            </div>
            <div className="incoterm-summary-pills">
              <button
                type="button"
                className={`incoterm-pill-item ${stageFilter === "ALL" ? "info" : ""}`}
                onClick={() => setStageFilter("ALL")}
              >
                Semua Tahap ({totalStages})
              </button>
              <button
                type="button"
                className={`incoterm-pill-item ${stageFilter === "EXPORTER" ? "info" : ""}`}
                onClick={() => setStageFilter("EXPORTER")}
              >
                Wajib Eksportir ({exporterStagesCount})
              </button>
              <button
                type="button"
                className={`incoterm-pill-item ${stageFilter === "BUYER" ? "muted" : ""}`}
                onClick={() => setStageFilter("BUYER")}
              >
                Ditanggung Buyer ({buyerStagesCount})
              </button>
              <button
                type="button"
                className={`incoterm-pill-item ${stageFilter === "DONE" ? "highlight" : ""}`}
                onClick={() => setStageFilter("DONE")}
              >
                <Check size={11} strokeWidth={3} /> Selesai ({completedStagesCount}/{totalStages})
              </button>
            </div>
          </div>
          <p className="incoterm-guide-text">
            {getIncotermExplanation(shipment.incoterm || "FOB")}
          </p>
        </div>

        {/* Daftar 9 Tahapan Operasi */}
        <div className="export-stage-list">
          {filteredStages.map((stage) => {
            const isCompleted = stage.status === "completed";
            const isBuyer = stage.status === "buyer_scope";

            return (
              <div
                key={stage.id}
                className={`export-stage-card ${isCompleted ? "is-completed" : isBuyer ? "is-buyer" : "is-in-progress"}`}
                onClick={() => navigate(stage.targetScreen)}
                title={`Klik untuk menuju modul ${stage.targetScreenLabel}`}
              >
                <div className="stage-number-bubble">
                  {isCompleted ? <Check size={14} strokeWidth={3} /> : isBuyer ? <Globe size={13} /> : stage.stageNumber}
                </div>

                <div className="stage-body">
                  <div className="stage-row-top">
                    <h4 className="stage-title">{stage.title}</h4>
                    <span className={`stage-resp-tag ${stage.responsibilityTone}`}>
                      {stage.responsibilityLabel}
                    </span>
                  </div>
                  <p className="stage-desc">{stage.subtitle}</p>
                  <div className="stage-meta-line">
                    <span>{stage.meta}</span>
                  </div>
                </div>

                <div className="stage-side-action">
                  <span className={`stage-status-badge ${stage.status}`}>
                    {isCompleted && <Check size={11} strokeWidth={3} />}
                    {isBuyer && <Globe size={11} />}
                    {!isCompleted && !isBuyer && <Clock size={11} />}
                    <span>{stage.statusLabel}</span>
                  </span>
                  <ChevronRight size={15} color="#94a3b8" />
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
