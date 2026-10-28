import { clamp, formatMoney } from "@shared/format";
import type { Pricing } from "@shared/pricing";
import { computeRecommendations, type ScreenId } from "@shared/risk";
import type { ContainerCalc, Incoterm, LineItem, Shipment } from "@shared/shipment";
import {
  ArrowDownRight,
  Calculator,
  Check,
  ChevronRight,
  Copy,
  FileSearch,
  FileText,
  MessageCircle,
  Package,
  Truck,
  WandSparkles,
  X,
} from "lucide-react";
import type React from "react";

export function IconButton({
  label,
  children,
  onClick,
}: {
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button className="icon-button" aria-label={label} title={label} onClick={onClick} type="button">
      {children}
    </button>
  );
}

export function Field({
  label,
  value,
  onChange,
  type = "text",
  prefix,
  suffix,
  step,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  prefix?: string;
  suffix?: string;
  step?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className={`input-shell ${prefix ? "has-prefix" : ""} ${suffix ? "has-suffix" : ""}`}>
        {prefix && <b>{prefix}</b>}
        <input
          type={type}
          step={step}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        {suffix && <em>{suffix}</em>}
      </div>
    </label>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="input-shell select-shell">
        <select value={value} onChange={(event) => onChange(event.target.value)}>
          {children}
        </select>
      </div>
    </label>
  );
}

export function StatusPill({
  children,
  tone = "green",
}: {
  children: React.ReactNode;
  tone?: "green" | "amber" | "blue" | "gray" | "red";
}) {
  return (
    <span className={`status-pill ${tone}`}>
      <i />
      {children}
    </span>
  );
}

export function MetricCard({
  label,
  value,
  detail,
  tone = "cream",
  icon,
  trend,
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "navy" | "cream" | "mint" | "sand";
  icon?: React.ReactNode;
  trend?: string;
}) {
  return (
    <div className={`metric-card ${tone}`}>
      <div className="metric-top">
        <span className="metric-label">{label}</span>
        {icon && <span className="metric-icon">{icon}</span>}
      </div>
      <strong>{value}</strong>
      <div className="metric-foot">
        <span>{detail}</span>
        {trend && <span className="metric-trend">{trend}</span>}
      </div>
    </div>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="section-title">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function ChecklistItem({
  done,
  label,
  meta,
  onClick,
}: {
  done?: boolean;
  label: string;
  meta: string;
  onClick?: () => void;
}) {
  return (
    <button type="button" className="checklist-item" onClick={onClick}>
      <span className={`check-circle ${done ? "done" : ""}`}>{done && <Check size={13} />}</span>
      <span className="check-copy">
        <b>{label}</b>
        <small>{meta}</small>
      </span>
      <ChevronRight size={16} />
    </button>
  );
}

export function QuickLink({
  icon,
  title,
  caption,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  caption: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className="quick-link" onClick={onClick}>
      <span className="quick-icon">{icon}</span>
      <span>
        <b>{title}</b>
        <small>{caption}</small>
      </span>
      <ChevronRight size={15} />
    </button>
  );
}

export function UsageBar({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: number;
  detail: string;
  tone: string;
}) {
  return (
    <div className="usage-row">
      <div className="usage-label">
        <b>{label}</b>
        <span>{Math.min(100, value).toFixed(0)}%</span>
      </div>
      <div className="usage-track">
        <i className={tone} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <small>{detail}</small>
    </div>
  );
}

export function TransactionStrip({
  shipment,
  update,
}: {
  shipment: Shipment;
  update: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void;
}) {
  return (
    <div className="transaction-strip">
      <div className="transaction-cell">
        <span>REFERENCE</span>
        <b>{shipment.reference}</b>
      </div>
      <div className="transaction-cell">
        <span>BUYER</span>
        <b>{shipment.buyer}</b>
        <small>{shipment.buyerCountry}</small>
      </div>
      <div className="route-cell">
        <div className="route-line">
          <span className="route-dot" />
          <i />
          <span className="route-dot filled" />
        </div>
        <div>
          <small>ORIGIN</small>
          <b>Indonesia</b>
        </div>
        <ArrowDownRight size={18} className="route-arrow" />
        <div>
          <small>DESTINATION</small>
          <b>{shipment.destination}</b>
        </div>
      </div>
      <div className="transaction-cell incoterm-cell">
        <span>INCOTERM</span>
        <select
          value={shipment.incoterm}
          onChange={(event) => update("incoterm", event.target.value as Incoterm)}
        >
          {["EXW", "FCA", "FOB", "CFR", "CIF", "DAP", "DDP"].map((term) => (
            <option key={term}>{term}</option>
          ))}
        </select>
        <small>Incoterms® 2020</small>
      </div>
      <div className="transaction-status">
        <StatusPill tone="blue">{shipment.shipmentStatus}</StatusPill>
        <small>Rev R{shipment.documentRevision}</small>
      </div>
    </div>
  );
}

export function TransactionProfile({
  shipment,
  update,
}: {
  shipment: Shipment;
  update: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void;
}) {
  return (
    <section className="panel panel-padding connected-profile">
      <div className="panel-head">
        <div>
          <span className="eyebrow">SINGLE SOURCE OF TRUTH</span>
          <h3>Data transaksi terhubung</h3>
          <p className="profile-description">
            Perubahan di sini otomatis dipakai oleh kalkulator harga, invoice, Packing List, B/L draft, dan rencana muatan.
          </p>
        </div>
        <StatusPill tone="blue">
          <Check size={11} /> Semua modul sinkron
        </StatusPill>
      </div>
      <div className="profile-grid">
        <Field
          label="Nomor transaksi"
          value={shipment.reference}
          onChange={(value) => update("reference", value)}
        />
        <Field
          label="Nama buyer"
          value={shipment.buyer}
          onChange={(value) => update("buyer", value)}
        />
        <Field
          label="Negara buyer"
          value={shipment.buyerCountry}
          onChange={(value) => update("buyerCountry", value)}
        />
        <Field
          label="Tujuan pengiriman"
          value={shipment.destination}
          onChange={(value) => update("destination", value)}
        />
        <Field
          label="Eksportir"
          value={shipment.exporter}
          onChange={(value) => update("exporter", value)}
        />
        <Field
          label="HS code referensi"
          value={shipment.hsCode}
          onChange={(value) => update("hsCode", value)}
        />
      </div>
      <div className="connection-rail">
        <span>
          <Calculator size={13} /> Harga
        </span>
        <i />
        <span>
          <FileText size={13} /> Dokumen
        </span>
        <i />
        <span>
          <Package size={13} /> Muatan
        </span>
        <em>Live sync</em>
      </div>
    </section>
  );
}

export function LineItemsEditor({
  items,
  updateItems,
  currency,
}: {
  items: LineItem[];
  updateItems: (items: LineItem[]) => void;
  currency: string;
}) {
  const packagingOptions = ["Karton box", "Karung goni", "Drum", "Sack", "Crate kayu"];
  const numericFields = [
    "quantity",
    "unitPrice",
    "shrinkageRate",
    "palletCount",
    "palletLength",
    "palletWidth",
    "palletHeight",
    "palletWeight",
    "length",
    "width",
    "height",
    "weight",
  ];
  const updateItem = (id: string, field: keyof LineItem, value: string) =>
    updateItems(
      items.map((item) =>
        item.id === id
          ? ({
              ...item,
              [field]: numericFields.includes(field) ? clamp(Number(value)) : value,
            } as LineItem)
          : item,
      ),
    );
  const updateBoolean = (id: string, field: keyof LineItem, value: boolean) =>
    updateItems(
      items.map((item) => (item.id === id ? ({ ...item, [field]: value } as LineItem) : item)),
    );
  const addItem = () =>
    updateItems([
      ...items,
      {
        id: `item-${Date.now()}`,
        description: "Produk baru",
        hsCode: "",
        quantity: 1,
        unit: "carton",
        unitPrice: 0,
        weight: 12,
        length: 40,
        width: 30,
        height: 25,
        packagingType: "Karton box",
        shrinkageRate: 0,
        palletEnabled: false,
        palletCount: 0,
        palletLength: 120,
        palletWidth: 100,
        palletHeight: 15,
        palletWeight: 22,
      },
    ]);
  const removeItem = (id: string) => {
    if (items.length > 1) updateItems(items.filter((item) => item.id !== id));
  };

  return (
    <div className="line-items-editor">
      <div className="line-items-head">
        <div>
          <b>Line items transaksi</b>
          <small>
            {items.length} produk · otomatis masuk ke invoice, Packing List, dan simulasi muatan
          </small>
        </div>
        <button type="button" className="add-line-item" onClick={addItem}>
          <Copy size={13} /> Tambah item
        </button>
      </div>
      <div className="line-items-table">
        <div className="line-item-row line-item-header">
          <span>PRODUK</span>
          <span>HS CODE</span>
          <span>QTY</span>
          <span>HARGA UNIT</span>
          <span>TOTAL</span>
          <span />
        </div>
        {items.map((item) => (
          <div className="line-item-card" key={item.id}>
            <div className="line-item-row">
              <div className="line-cell line-cell-product">
                <span className="line-mobile-label">Produk</span>
                <input
                  aria-label="Nama produk"
                  value={item.description}
                  onChange={(event) => updateItem(item.id, "description", event.target.value)}
                />
              </div>
              <div className="line-cell line-cell-hs">
                <span className="line-mobile-label">HS Code</span>
                <input
                  aria-label="HS Code"
                  value={item.hsCode}
                  onChange={(event) => updateItem(item.id, "hsCode", event.target.value)}
                />
              </div>
              <div className="line-cell line-cell-qty">
                <span className="line-mobile-label">Quantity</span>
                <input
                  aria-label="Quantity"
                  type="number"
                  min="0"
                  value={item.quantity}
                  onChange={(event) => updateItem(item.id, "quantity", event.target.value)}
                />
              </div>
              <div className="line-cell line-cell-price">
                <span className="line-mobile-label">Harga Unit</span>
                <div className="line-money">
                  <span>{currency}</span>
                  <input
                    aria-label="Harga unit"
                    type="number"
                    min="0"
                    value={item.unitPrice}
                    onChange={(event) => updateItem(item.id, "unitPrice", event.target.value)}
                  />
                </div>
              </div>
              <div className="line-cell line-cell-total">
                <span className="line-mobile-label">Subtotal</span>
                <b>{formatMoney(item.quantity * item.unitPrice, currency)}</b>
              </div>
              <button
                type="button"
                className="remove-line-item"
                aria-label="Hapus item"
                onClick={() => removeItem(item.id)}
              >
                <X size={15} />
              </button>
            </div>
            <div className="line-item-detail">
              <label>
                Jenis kemasan
                <select
                  value={packagingOptions.includes(item.packagingType) ? item.packagingType : "__custom"}
                  onChange={(event) =>
                    updateItem(
                      item.id,
                      "packagingType",
                      event.target.value === "__custom"
                        ? packagingOptions.includes(item.packagingType)
                          ? "Kemasan custom"
                          : item.packagingType
                        : event.target.value,
                    )
                  }
                >
                  {packagingOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                  <option value="__custom">Kemasan lain…</option>
                </select>
              </label>
              {!packagingOptions.includes(item.packagingType) && (
                <label>
                  Nama kemasan
                  <input
                    value={item.packagingType}
                    onChange={(event) => updateItem(item.id, "packagingType", event.target.value)}
                    placeholder="Contoh: Big bag 1 ton"
                  />
                </label>
              )}
              <label>
                Panjang
                <input
                  type="number"
                  min="0"
                  value={item.length}
                  onChange={(event) => updateItem(item.id, "length", event.target.value)}
                />
                <span>cm</span>
              </label>
              <label>
                Lebar
                <input
                  type="number"
                  min="0"
                  value={item.width}
                  onChange={(event) => updateItem(item.id, "width", event.target.value)}
                />
                <span>cm</span>
              </label>
              <label>
                Tinggi
                <input
                  type="number"
                  min="0"
                  value={item.height}
                  onChange={(event) => updateItem(item.id, "height", event.target.value)}
                />
                <span>cm</span>
              </label>
              <label>
                Berat/unit
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={item.weight}
                  onChange={(event) => updateItem(item.id, "weight", event.target.value)}
                />
                <span>kg</span>
              </label>
              <label>
                Susut
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={item.shrinkageRate}
                  onChange={(event) => updateItem(item.id, "shrinkageRate", event.target.value)}
                />
                <span>%</span>
              </label>
              <label className="pallet-toggle">
                <input
                  type="checkbox"
                  checked={item.palletEnabled}
                  onChange={(event) => updateBoolean(item.id, "palletEnabled", event.target.checked)}
                />{" "}
                Tambahkan pallet kayu
              </label>
              {item.palletEnabled && (
                <>
                  <label>
                    Jumlah pallet
                    <input
                      type="number"
                      min="0"
                      value={item.palletCount}
                      onChange={(event) => updateItem(item.id, "palletCount", event.target.value)}
                    />
                  </label>
                  <label>
                    Panjang pallet
                    <input
                      type="number"
                      min="0"
                      value={item.palletLength}
                      onChange={(event) => updateItem(item.id, "palletLength", event.target.value)}
                    />
                    <span>cm</span>
                  </label>
                  <label>
                    Lebar pallet
                    <input
                      type="number"
                      min="0"
                      value={item.palletWidth}
                      onChange={(event) => updateItem(item.id, "palletWidth", event.target.value)}
                    />
                    <span>cm</span>
                  </label>
                  <label>
                    Tinggi pallet
                    <input
                      type="number"
                      min="0"
                      value={item.palletHeight}
                      onChange={(event) => updateItem(item.id, "palletHeight", event.target.value)}
                    />
                    <span>cm</span>
                  </label>
                  <label>
                    Berat pallet
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={item.palletWeight}
                      onChange={(event) => updateItem(item.id, "palletWeight", event.target.value)}
                    />
                    <span>kg</span>
                  </label>
                </>
              )}
            </div>
            {!packagingOptions.includes(item.packagingType) && (
              <div className="custom-packaging-note">
                <Check size={13} /> Kemasan custom dihitung dengan dimensi, berat kotor, dan warna fallback pada simulasi 3D.
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function recommendationIcon(kind: string) {
  switch (kind) {
    case "booking":
      return <Truck size={15} />;
    case "hsCode":
      return <FileSearch size={15} />;
    case "stuffing":
      return <Package size={15} />;
    case "letterhead":
      return <FileText size={15} />;
    case "margin":
      return <ArrowDownRight size={15} />;
    default:
      return <WandSparkles size={15} />;
  }
}

export function RecommendationsPanel({
  shipment,
  pricing,
  container,
  navigate,
}: {
  shipment: Shipment;
  pricing: Pricing;
  container: ContainerCalc;
  navigate: (screen: ScreenId) => void;
}) {
  const recommendations = computeRecommendations(shipment, pricing, container);
  return (
    <section className="panel panel-padding recommendations-panel">
      <div className="panel-head">
        <div>
          <span className="eyebrow">ACTIVE RECOMMENDATIONS</span>
          <h3>Langkah berikutnya yang paling berdampak</h3>
          <p className="profile-description">
            Saran ini dihitung ulang setiap kali data transaksi, dokumen, atau muatan berubah.
          </p>
        </div>
        <button type="button" className="text-button" onClick={() => navigate("advisor")}>
          <MessageCircle size={14} /> Tanya AI Advisor
        </button>
      </div>
      <div className="recommendation-grid">
        {recommendations.map((rec) => (
          <button
            type="button"
            key={rec.title}
            className={`recommendation-card ${rec.tone}`}
            onClick={() => navigate(rec.screen)}
          >
            <span className="recommendation-icon">{recommendationIcon(rec.kind)}</span>
            <span className="recommendation-copy">
              <b>{rec.title}</b>
              <small>{rec.detail}</small>
              <em>
                {rec.action} <ChevronRight size={12} />
              </em>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
