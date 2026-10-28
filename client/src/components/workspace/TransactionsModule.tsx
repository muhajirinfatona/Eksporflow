import type { PersistenceSaveState } from "@/hooks/useActiveShipment";
import { formatMoney } from "@shared/format";
import type { Pricing } from "@shared/pricing";
import type { ScreenId } from "@shared/risk";
import type { Shipment } from "@shared/shipment";
import { Cloud, FolderOpen, Plus, Save, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { StatusPill } from "./Primitives";

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
      {!user && (
        <div className="clean-notice warn">
          <div>
            <b>Mode Draft Browser Lokal Aktif</b> — Transaksi sedang disimpan sementara di browser perangkat ini dan belum tercatat ke database cloud PostgreSQL / Supabase. Masuk akun agar transaksi tersimpan per workspace beserta riwayat versi dan audit log.
          </div>
          <button type="button" className="save-button" onClick={() => void login()}>
            <Cloud size={14} /> Masuk &amp; Hubungkan Cloud
          </button>
        </div>
      )}

      <div className="clean-toolbar-card panel">
        <div className="clean-toolbar">
          <div className="clean-search-box">
            <Search size={14} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nomor referensi atau status..."
            />
          </div>
          <select
            className="clean-select"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter status transaksi"
          >
            <option value="ALL">Semua status</option>
            <option value="Draft">Draft</option>
            <option value="Quotation">Quotation</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Ready to Ship">Ready to Ship</option>
            <option value="Booked">Booked</option>
            <option value="Stuffing">Stuffing</option>
            <option value="In Transit">In Transit</option>
            <option value="Completed">Completed</option>
          </select>
          <div className="clean-toolbar-actions">
            <button type="button" className="ghost-button" onClick={() => void saveShipment()}>
              <Save size={14} /> {user ? "Simpan Transaksi Aktif" : "Simpan Draft Lokal"}
            </button>
            <button
              type="button"
              className="save-button"
              onClick={() => {
                createNewDraft();
                navigate("pricing");
              }}
            >
              <Plus size={14} /> Transaksi Baru
            </button>
          </div>
        </div>
      </div>

      <section className="panel panel-padding">
        <div className="panel-head">
          <div>
            <span className="eyebrow">ACTIVE IN WORKSPACE</span>
            <h3>Transaksi yang sedang dibuka</h3>
          </div>
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
                  ? "Konflik versi"
                  : user
                    ? "Belum disimpan ke Cloud"
                    : "Draft lokal browser"}
          </StatusPill>
        </div>

        <div className="clean-table-wrap">
          <table className="clean-table">
            <thead>
              <tr>
                <th>Referensi</th>
                <th>Buyer &amp; Tujuan</th>
                <th>Incoterm &amp; Nilai Penawaran</th>
                <th>Tahap</th>
                <th>Versi / Revisi</th>
                <th>Tindakan Cepat</th>
              </tr>
            </thead>
            <tbody>
              <tr className="active-row">
                <td>
                  <b>{shipment.reference}</b>
                  <span className="row-sub">
                    {activeShipmentId ? "Terhubung ke Cloud" : "Belum dikirim ke Cloud"}
                  </span>
                </td>
                <td>
                  <b>{shipment.buyer}</b>
                  <span className="row-sub">{shipment.destination}</span>
                </td>
                <td>
                  <b>{formatMoney(pricing.active.offer, shipment.currency)}</b>
                  <span className="row-sub">
                    {shipment.incoterm} · Margin {shipment.margin}%
                  </span>
                </td>
                <td>
                  <StatusPill tone={statusTone(shipment.shipmentStatus)}>
                    {shipment.shipmentStatus}
                  </StatusPill>
                </td>
                <td>
                  <b>{activeShipmentId ? `Cloud v${version}` : "Lokal"}</b>
                  <span className="row-sub">Dokumen R{shipment.documentRevision}</span>
                </td>
                <td>
                  <div className="row-actions">
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => navigate("pricing")}
                    >
                      Harga &amp; Order
                    </button>
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => navigate("documents")}
                    >
                      Dokumen
                    </button>
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => navigate("shipment")}
                    >
                      Logistik
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel panel-padding">
        <div className="panel-head">
          <div>
            <span className="eyebrow">CLOUD WORKSPACE RECORDS</span>
            <h3>Daftar transaksi tersimpan di workspace</h3>
            <p className="profile-description">
              Setiap penyimpanan memperbarui nomor versi optimistic locking dan mencatat audit log di PostgreSQL / Supabase.
            </p>
          </div>
          <StatusPill tone="blue">{shipmentsList.length} transaksi cloud</StatusPill>
        </div>

        {!user ? (
          <div className="empty-attachment">
            Masuk akun untuk memuat daftar transaksi workspace dari database PostgreSQL / Supabase.
          </div>
        ) : isLoadingList ? (
          <div className="empty-attachment">Memuat daftar transaksi dari server...</div>
        ) : filteredCloudList.length === 0 ? (
          <div className="empty-attachment">
            Belum ada transaksi di database yang cocok dengan filter. Klik{" "}
            <b>Simpan Transaksi Aktif</b> untuk menyimpan {shipment.reference} ke workspace Anda.
          </div>
        ) : (
          <div className="clean-table-wrap">
            <table className="clean-table">
              <thead>
                <tr>
                  <th>Referensi</th>
                  <th>Tahap Shipment</th>
                  <th>Versi</th>
                  <th>Terakhir Diperbarui</th>
                  <th>Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {filteredCloudList.map((row) => {
                  const isCurrent = row.id === activeShipmentId;
                  return (
                    <tr key={row.id} className={isCurrent ? "active-row" : ""}>
                      <td>
                        <b>{row.reference}</b>
                        {isCurrent && <span className="row-sub">Sedang dibuka di workspace</span>}
                      </td>
                      <td>
                        <StatusPill tone={statusTone(row.status)}>{row.status}</StatusPill>
                      </td>
                      <td>
                        <b>v{row.version}</b>
                      </td>
                      <td>{formatShortDate(row.updatedAt)}</td>
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className={isCurrent ? "ghost-button" : "save-button"}
                            onClick={() => void loadShipment(row.id)}
                          >
                            <FolderOpen size={13} /> {isCurrent ? "Muat Ulang" : "Buka"}
                          </button>
                          {isCurrent && (
                            <button
                              type="button"
                              className="ghost-button"
                              onClick={() => navigate("documents")}
                            >
                              Dokumen
                            </button>
                          )}
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

      <div className="clean-grid-3">
        <section className="panel panel-padding clean-stat-card">
          <span className="eyebrow">TOTAL CLOUD</span>
          <strong>{user ? shipmentsList.length : "—"}</strong>
          <small>
            {user
              ? "Transaksi tercatat di workspace PostgreSQL"
              : "Hubungkan akun untuk sinkronisasi cloud"}
          </small>
        </section>
        <section className="panel panel-padding clean-stat-card">
          <span className="eyebrow">FASE QUOTE / DRAFT</span>
          <strong>{user ? draftCount : 1}</strong>
          <small>Menunggu finalisasi harga atau konfirmasi buyer</small>
        </section>
        <section className="panel panel-padding clean-stat-card">
          <span className="eyebrow">EKSEKUSI BERJALAN</span>
          <strong>{user ? activeExecutionCount : 0}</strong>
          <small>Confirmed, Booked, Stuffing, hingga In Transit</small>
        </section>
      </div>
    </div>
  );
}
