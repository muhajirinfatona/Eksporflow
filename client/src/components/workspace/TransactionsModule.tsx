import type { PersistenceSaveState } from "@/hooks/useActiveShipment";
import type { WorkspaceFlow } from "@/hooks/useWorkspaceFlow";
import { formatMoney } from "@shared/format";
import type { PoScreeningResult } from "@shared/poScreening";
import type { Pricing } from "@shared/pricing";
import type { ScreenId } from "@shared/risk";
import type { ContainerCalc, Shipment } from "@shared/shipment";
import {
  Calculator,
  CheckCircle2,
  ChevronRight,
  Cloud,
  FileSpreadsheet,
  FileText,
  FolderOpen,
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
import { ChecklistItem, Field, StatusPill } from "./Primitives";
import { toast } from "sonner";
import { getAiRecommendedRegulations } from "@shared/costFactors";

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
  const [lastScreening, setLastScreening] = useState<PoScreeningResult | null>(null);

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

      {/* 3. ALUR OPERASIONAL TERHUBUNG: Checklist Kesiapan Transaksi */}
      <section className="panel panel-padding">
        <div className="panel-head">
          <div>
            <span className="eyebrow">ALUR OPERASIONAL TERHUBUNG</span>
            <h3>Checklist kesiapan transaksi</h3>
          </div>
          <button className="text-button" type="button" onClick={() => navigate("risk")}>
            Risk Center ({flow?.riskEvaluation?.readinessPercent ?? 11}%) <ChevronRight size={14} />
          </button>
        </div>

        <div className="checklist">
          <ChecklistItem
            done={Boolean(shipment.buyer.trim() && shipment.destination.trim() && shipment.hsCode.trim())}
            label="Profil buyer, tujuan & referensi HS Code"
            meta={`${shipment.buyer.trim() || "Buyer belum diisi"} · HS ${shipment.hsCode.trim() || "belum diisi"}`}
            onClick={() => navigate("partners")}
          />
          <ChecklistItem
            done={pricing.active.offer > 0 && pricing.validationErrors.length === 0 && flow?.effectiveApprovalStatus === "Tercatat direview"}
            label={`Harga ${shipment.incoterm || "FOB"} & persetujuan internal`}
            meta={`${formatMoney(pricing.active.offer, shipment.currency)} · ${flow?.effectiveApprovalStatus || "Menunggu review"}`}
            onClick={() => navigate("approvals")}
          />
          <ChecklistItem
            done={Boolean(
              container &&
              (container.volumeUtilization > 0 || container.weightUtilization > 0) &&
              container.volumeUtilization <= 100 &&
              container.weightUtilization <= 100
            )}
            label="Kapasitas kemasan & kontainer 3D"
            meta={
              container && (container.volumeUtilization > 0 || container.weightUtilization > 0)
                ? `${container.containers} × ${shipment.containerType} · Berat ${container.weightUtilization.toFixed(0)}%`
                : `1 × ${shipment.containerType} · Berat 0%`
            }
            onClick={() => navigate("cargo")}
          />
          <ChecklistItem
            done={Boolean(shipment.documentReviewed)}
            label="Review 4 dokumen ekspor"
            meta={
              shipment.documentReviewed
                ? `Direview · Rev R${shipment.documentRevision}`
                : "Proforma, Commercial Invoice, Packing List & B/L Draft"
            }
            onClick={() => navigate("documents")}
          />
          <ChecklistItem
            done={Boolean(flow?.paidAmount && flow.paidAmount > 0)}
            label="Pencocokan pembayaran & AR Finance"
            meta={
              flow?.paidAmount && flow.paidAmount > 0
                ? `Tercatat masuk ${formatMoney(flow.paidAmount, shipment.currency)} · AR ${flow.finance.arStatus}`
                : "Belum ada pembayaran dicocokkan di Rekonsiliasi Bank"
            }
            onClick={() => navigate("finance")}
          />
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
