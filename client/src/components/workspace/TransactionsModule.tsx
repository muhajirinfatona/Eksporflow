import type { PersistenceSaveState } from "@/hooks/useActiveShipment";
import { formatMoney } from "@shared/format";
import type { Pricing } from "@shared/pricing";
import type { ScreenId } from "@shared/risk";
import type { Shipment } from "@shared/shipment";
import {
  Calculator,
  Check,
  Cloud,
  FileText,
  FolderOpen,
  Package,
  Plus,
  Save,
  Search,
  ShieldAlert,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Field, StatusPill } from "./Primitives";

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
  version,
  saveState,
  shipmentsList,
  isLoadingList,
  pricing,
  loadShipment,
  saveShipment,
  createNewDraft,
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
  loadShipment: (id: string) => Promise<void>;
  saveShipment: () => Promise<void>;
  createNewDraft: (customRef?: string) => void;
  login: () => Promise<void>;
  navigate: (screen: ScreenId) => void;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredCloudList = useMemo(() => {
    const q = query.trim().toLowerCase();
    return shipmentsList.filter((row) => {
      const matchQuery = !q || row.reference.toLowerCase().includes(q) || row.status.toLowerCase().includes(q);
      const matchStatus = statusFilter === "ALL" || row.status === statusFilter;
      return matchQuery && matchStatus;
    });
  }, [shipmentsList, query, statusFilter]);

  const draftCount = shipmentsList.filter((r) => r.status === "Draft" || r.status === "Quotation").length;
  const activeExecutionCount = shipmentsList.filter(
    (r) => !["Draft", "Quotation", "Completed"].includes(r.status),
  ).length;

  return (
    <div className="module-stack">
      {/* 1. Notifikasi Jika Bekerja di Mode Lokal */}
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

      {/* 2. MASTER TRANSAKSI YANG SEDANG DIKELOLA (Satu Kartu Terpadu & Rapi) */}
      <section className="panel panel-padding active-order-card">
        <div className="panel-head">
          <div>
            <span className="eyebrow">TRANSAKSI EKSPOR AKTIF</span>
            <h3>
              {shipment.reference
                ? `Transaksi: ${shipment.reference}`
                : "Transaksi Baru (Belum Diberi Nomor)"}
            </h3>
            <p className="profile-description">
              Tentukan nomor referensi internal perusahaan Anda, pembeli internasional, dan pelabuhan tujuan. Perubahan data di sini otomatis menjadi rujukan kalkulator harga, kargo 3D, dan dokumen ekspor.
            </p>
          </div>

          <div className="active-order-header-actions">
            <div className="active-order-pills">
              <StatusPill
                tone={
                  saveState === "saved"
                    ? "green"
                    : saveState === "conflict" || saveState === "error"
                      ? "red"
                      : "amber"
                }
              >
                {saveState === "saved"
                  ? `Tersimpan di Cloud · v${version}`
                  : saveState === "saving"
                    ? "Menyimpan..."
                    : saveState === "conflict"
                      ? "Konflik Versi"
                      : user
                        ? "Belum Disimpan ke Cloud"
                        : "Draft Lokal"}
              </StatusPill>
              <StatusPill tone={statusTone(shipment.shipmentStatus)}>
                Tahap: {shipment.shipmentStatus}
              </StatusPill>
            </div>

            <div className="row-actions">
              <button
                type="button"
                className="save-button"
                onClick={() => void saveShipment()}
                disabled={saveState === "saving"}
              >
                <Save size={14} /> {saveState === "saving" ? "Menyimpan..." : "Simpan Transaksi"}
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={() => createNewDraft()}
                title="Kosongkan form untuk membuat transaksi baru dengan nomor perusahaan Anda"
              >
                <Plus size={14} /> + Transaksi Baru
              </button>
            </div>
          </div>
        </div>

        {/* Form Input Master Data Transaksi (Label & Placeholder Jelas Bebas Kode Aneh) */}
        <div className="profile-grid">
          <Field
            label="Nomor / Referensi Internal Perusahaan"
            value={shipment.reference}
            placeholder="Contoh: PO-001, INV-2026/01, atau KTR/JP/01 (Bebas sesuai format Anda)"
            onChange={(value) => update("reference", value)}
          />

          <div className="field-with-action">
            <Field
              label="Nama Perusahaan Pembeli (Buyer)"
              value={shipment.buyer}
              placeholder="Masukkan nama perusahaan buyer luar negeri"
              onChange={(value) => update("buyer", value)}
            />
            <button
              type="button"
              className="field-sub-link"
              onClick={() => navigate("partners")}
              title="Pilih dari daftar rekanan buyer tersimpan"
            >
              <Users size={12} /> Ambil dari Mitra Tersimpan
            </button>
          </div>

          <Field
            label="Negara Pembeli"
            value={shipment.buyerCountry}
            placeholder="Contoh: Jepang, Jerman, Amerika Serikat"
            onChange={(value) => update("buyerCountry", value)}
          />

          <Field
            label="Pelabuhan Bongkar (Tujuan Pengiriman)"
            value={shipment.destination}
            placeholder="Contoh: Port of Tokyo, Hamburg, Long Beach"
            onChange={(value) => update("destination", value)}
          />

          <Field
            label="Nama Perusahaan Eksportir Anda"
            value={shipment.exporter}
            placeholder="Nama entitas legal eksportir (PT / CV / Firma)"
            onChange={(value) => update("exporter", value)}
          />

          <Field
            label="Referensi HS Code Komoditas"
            value={shipment.hsCode}
            placeholder="Contoh: 0901.11 (Kopi) atau 1513.11 (Minyak)"
            onChange={(value) => update("hsCode", value)}
          />
        </div>

        {/* Rel Navigasi Antar Modul Terintegrasi */}
        <div className="connection-rail">
          <button type="button" className="rail-chip" onClick={() => navigate("pricing")}>
            <Calculator size={13} />
            <span>Harga &amp; Order ({formatMoney(pricing.active.offer, shipment.currency)} · {shipment.incoterm})</span>
          </button>
          <i />
          <button type="button" className="rail-chip" onClick={() => navigate("documents")}>
            <FileText size={13} />
            <span>Dokumen Ekspor (Invoice, Packing List)</span>
          </button>
          <i />
          <button type="button" className="rail-chip" onClick={() => navigate("cargo")}>
            <Package size={13} />
            <span>Rencana Muatan ({shipment.containerType})</span>
          </button>
          <i />
          <button type="button" className="rail-chip" onClick={() => navigate("risk")}>
            <ShieldAlert size={13} />
            <span>Risk Center</span>
          </button>
          <span className="rail-status">
            <Check size={11} /> Sinkron Otomatis
          </span>
        </div>
      </section>

      {/* 3. DAFTAR ARSIP & RIWAYAT TRANSAKSI WORKSPACE (Pencarian & Tabel Terpadu) */}
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
              <option value="ALL">Semua Status ({shipmentsList.length})</option>
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
        {!user ? (
          <div className="empty-attachment">
            Masuk akun untuk memuat daftar arsip transaksi perusahaan dari database cloud PostgreSQL.
          </div>
        ) : isLoadingList ? (
          <div className="empty-attachment">Memuat daftar transaksi dari server...</div>
        ) : filteredCloudList.length === 0 ? (
          <div className="empty-attachment">
            {query || statusFilter !== "ALL"
              ? "Tidak ada transaksi yang cocok dengan kata kunci pencarian atau filter status."
              : `Belum ada transaksi tersimpan di database. Klik tombol "Simpan Transaksi" di atas untuk menyimpan transaksi ini ke workspace Anda.`}
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

      {/* 4. Ringkasan Statistik Eksekutif di Bawah */}
      <div className="clean-grid-3">
        <section className="panel panel-padding clean-stat-card">
          <span className="eyebrow">TOTAL TRANSAKSI TERSIMPAN</span>
          <strong>{user ? shipmentsList.length : "—"}</strong>
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
    </div>
  );
}
