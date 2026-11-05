import type { ScreenId } from "@shared/risk";
import type { Shipment, ShipmentStatus } from "@shared/shipment";
import { ArrowUpRight, Check, FileDown, FileText, ShieldAlert, Truck, UploadCloud, Wallet, X } from "lucide-react";
import { toast } from "sonner";
import { Field, StatusPill } from "./Primitives";

const SHIPMENT_STATUSES: ShipmentStatus[] = [
  "Draft",
  "Quotation",
  "Confirmed",
  "Ready to Ship",
  "Booked",
  "Stuffing",
  "Departed",
  "In Transit",
  "Completed",
];

function OpsCheck({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="ops-check">
      <span className={`check-circle ${ok ? "done" : ""}`}>{ok && <Check size={13} />}</span>
      <b>{label}</b>
      <StatusPill tone={ok ? "green" : "amber"}>{ok ? "Lengkap" : "Perlu isi"}</StatusPill>
    </div>
  );
}

export function OperationsModule({
  shipment,
  update,
  navigate,
}: {
  shipment: Shipment;
  update: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void;
  navigate: (screen: ScreenId) => void;
}) {
  const currentIndex = SHIPMENT_STATUSES.indexOf(shipment.shipmentStatus);

  const addAttachment = (file?: File) => {
    if (!file) return;
    if (!shipment.attachments.includes(file.name)) {
      update("attachments", [...shipment.attachments, file.name]);
      toast.success("Lampiran dicatat ke transaksi", {
        description: `${file.name} ditambahkan ke daftar bukti ${shipment.reference}.`,
      });
    }
  };

  const removeAttachment = (name: string) => {
    update(
      "attachments",
      shipment.attachments.filter((attachment) => attachment !== name),
    );
  };

  return (
    <div className="module-stack">
      <section className="panel panel-padding">
        <div className="panel-head">
          <div>
            <span className="eyebrow">SHIPMENT CONTROL TOWER</span>
            <h2 className="ops-title">
              {shipment.reference} · {shipment.buyer || "Buyer belum diisi"}
            </h2>
          </div>
          <StatusPill tone={shipment.shipmentStatus === "Completed" ? "green" : "amber"}>
            {shipment.shipmentStatus}
          </StatusPill>
        </div>
        <div className="status-track">
          {SHIPMENT_STATUSES.map((status, index) => (
            <button
              type="button"
              key={status}
              className={`status-step ${index <= currentIndex ? "done" : ""} ${status === shipment.shipmentStatus ? "current" : ""}`}
              onClick={() => update("shipmentStatus", status)}
            >
              <span>{index + 1}</span>
              <small>{status}</small>
            </button>
          ))}
        </div>
      </section>

      <div className="content-grid two-thirds">
        <section className="panel panel-padding">
          <div className="panel-head">
            <div>
              <span className="eyebrow">SHIPMENT REFERENCES</span>
              <h3>Referensi booking & kontainer</h3>
            </div>
            <StatusPill tone="blue">
              <Truck size={11} /> Satu transaksi
            </StatusPill>
          </div>
          <div className="form-grid two">
            <Field
              label="PO buyer"
              value={shipment.poNumber}
              onChange={(value) => update("poNumber", value)}
            />
            <Field
              label="Booking number"
              value={shipment.bookingNumber}
              onChange={(value) => update("bookingNumber", value)}
            />
            <Field
              label="Container number"
              value={shipment.containerNumber}
              onChange={(value) => update("containerNumber", value)}
            />
            <Field
              label="Seal number"
              value={shipment.sealNumber}
              onChange={(value) => update("sealNumber", value)}
            />
            <Field
              label="Named place / port"
              value={shipment.namedPlace}
              onChange={(value) => update("namedPlace", value)}
            />
            <Field
              label="Tujuan akhir"
              value={shipment.destination}
              onChange={(value) => update("destination", value)}
            />
          </div>
        </section>

        <section className="panel panel-padding">
          <div className="panel-head">
            <div>
              <span className="eyebrow">DOCUMENT ARCHIVE</span>
              <h3>Lampiran &amp; Bukti Shipment</h3>
            </div>
            <label className="upload-button">
              <UploadCloud size={15} /> Unggah Berkas
              <input
                type="file"
                onChange={(event) => {
                  addAttachment(event.target.files?.[0]);
                  event.currentTarget.value = "";
                }}
              />
            </label>
          </div>
          <div className="attachment-list">
            {shipment.attachments.length ? (
              shipment.attachments.map((attachment) => (
                <div className="attachment-row" key={attachment}>
                  <FileText size={15} />
                  <span>
                    {attachment}
                    <small>{shipment.reference}</small>
                  </span>
                  <button
                    type="button"
                    aria-label={`Hapus ${attachment}`}
                    onClick={() => removeAttachment(attachment)}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))
            ) : (
              <div className="empty-attachment">
                <FileDown size={17} /> Belum ada berkas lampiran tercatat.
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="panel panel-padding">
        <div className="panel-head">
          <div>
            <span className="eyebrow">HANDOFF CHECKLIST</span>
            <h3>Kontrol Sebelum Berangkat</h3>
          </div>
        </div>
        <div className="ops-checks">
          <OpsCheck
            label="PO buyer dan terms pembayaran"
            ok={Boolean(shipment.poNumber.trim() && shipment.paymentTerms.trim())}
          />
          <OpsCheck
            label="Harga dan Incoterm sudah ditetapkan"
            ok={Boolean(shipment.incoterm && shipment.unitPrice > 0)}
          />
          <OpsCheck
            label="Packing List dan dokumen komersial"
            ok={Boolean(shipment.product.trim() && shipment.quantity > 0)}
          />
          <OpsCheck
            label="Booking, container, dan seal"
            ok={Boolean(
              shipment.bookingNumber.trim() &&
                shipment.containerNumber.trim() &&
                shipment.sealNumber.trim(),
            )}
          />
        </div>
        <div className="row-actions" style={{ marginTop: 16 }}>
          <button type="button" className="ghost-button" onClick={() => navigate("documents")}>
            <FileText size={14} /> Periksa B/L Draft &amp; Invoice
          </button>
          <button type="button" className="save-button" onClick={() => navigate("risk")}>
            <ShieldAlert size={14} /> Lanjut ke Risk Center <ArrowUpRight size={14} />
          </button>
          <button type="button" className="ghost-button" onClick={() => navigate("finance")}>
            <Wallet size={14} /> Lihat Tagihan Keuangan
          </button>
        </div>
      </section>
    </div>
  );
}
