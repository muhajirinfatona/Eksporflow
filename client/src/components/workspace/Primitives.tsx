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
  Plus,
  ShieldAlert,
  Truck,
  Users,
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
  placeholder,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  prefix?: string;
  suffix?: string;
  step?: string;
  placeholder?: string;
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
          placeholder={placeholder}
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
        <span>Referensi</span>
        <b style={{ fontWeight: 600 }}>{shipment.reference}</b>
      </div>
      <div className="transaction-cell">
        <span>Buyer</span>
        <b style={{ fontWeight: 600 }}>{shipment.buyer}</b>
        <small>{shipment.buyerCountry}</small>
      </div>
      <div className="route-cell">
        <div className="route-line">
          <span className="route-dot" />
          <i />
          <span className="route-dot filled" />
        </div>
        <div>
          <small>Asal</small>
          <b style={{ fontWeight: 600 }}>Indonesia</b>
        </div>
        <ArrowDownRight size={18} className="route-arrow" />
        <div>
          <small>Tujuan</small>
          <b style={{ fontWeight: 600 }}>{shipment.destination}</b>
        </div>
      </div>
      <div className="transaction-cell incoterm-cell">
        <span>Incoterm</span>
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
  navigate,
}: {
  shipment: Shipment;
  update: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void;
  navigate?: (screen: ScreenId) => void;
}) {
  return (
    <section className="panel panel-padding connected-profile">
      <div className="panel-head">
        <div>
          <span className="eyebrow">Data utama transaksi</span>
          <h3>Parameter Transaksi Terhubung</h3>
        </div>
        <div className="row-actions">
          {navigate && (
            <button type="button" className="ghost-button" onClick={() => navigate("partners")}>
              <Users size={13} /> Pilih Mitra
            </button>
          )}
          <StatusPill tone="blue">
            <Check size={11} /> Sinkron
          </StatusPill>
        </div>
      </div>
      <div className="profile-grid">
        <Field
          label="Nomor / Referensi Internal Perusahaan"
          value={shipment.reference}
          placeholder="Contoh: PO-001, INV-2026/01, atau kode internal Anda"
          onChange={(value) => update("reference", value)}
        />
        <Field
          label="Nama buyer"
          value={shipment.buyer}
          placeholder="Masukkan nama perusahaan buyer"
          onChange={(value) => update("buyer", value)}
        />
        <Field
          label="Negara buyer"
          value={shipment.buyerCountry}
          placeholder="Contoh: Jepang"
          onChange={(value) => update("buyerCountry", value)}
        />
        <Field
          label="Tujuan pengiriman"
          value={shipment.destination}
          placeholder="Contoh: Port of Tokyo"
          onChange={(value) => update("destination", value)}
        />
        <Field
          label="Eksportir"
          value={shipment.exporter}
          placeholder="Nama perusahaan eksportir Anda"
          onChange={(value) => update("exporter", value)}
        />
        <Field
          label="HS code referensi"
          value={shipment.hsCode}
          placeholder="Contoh: 0901.11"
          onChange={(value) => update("hsCode", value)}
        />
      </div>
      <div className="connection-rail">
        <button type="button" className="rail-chip" onClick={() => navigate?.("pricing")}>
          <Calculator size={13} /> Harga &amp; Order
        </button>
        <i />
        <button type="button" className="rail-chip" onClick={() => navigate?.("documents")}>
          <FileText size={13} /> Dokumen Ekspor
        </button>
        <i />
        <button type="button" className="rail-chip" onClick={() => navigate?.("cargo")}>
          <Package size={13} /> Rencana Muatan
        </button>
        <i />
        <button type="button" className="rail-chip" onClick={() => navigate?.("risk")}>
          <ShieldAlert size={13} /> Risk Center
        </button>
        <em>Sinkron otomatis</em>
      </div>
    </section>
  );
}

export function LineItemsEditor({
  items,
  updateItems,
  currency,
  onOpenCatalog,
}: {
  items: LineItem[];
  updateItems: (items: LineItem[]) => void;
  currency: string;
  onOpenCatalog?: () => void;
}) {
  const packagingOptions = ["Karton box", "Karung goni", "Drum", "Sack", "Crate kayu", "IBC Tank 1000L"];
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
        <div className="line-items-info">
          <b>Daftar Produk ({items.length} item)</b>
        </div>
        <div className="line-items-actions">
          {onOpenCatalog && (
            <button type="button" className="catalog-pick-btn" onClick={onOpenCatalog}>
              <Package size={13} /> Katalog
            </button>
          )}
          <button type="button" className="add-line-item" onClick={addItem}>
            <Plus size={13} /> Tambah Item
          </button>
        </div>
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
                  placeholder="Nama produk ekspor..."
                  value={item.description}
                  onChange={(event) => updateItem(item.id, "description", event.target.value)}
                />
              </div>
              <div className="line-cell line-cell-hs">
                <span className="line-mobile-label">HS Code</span>
                <input
                  aria-label="HS Code"
                  placeholder="HS Code"
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
          <span className="eyebrow">TINDAK LANJUT</span>
          <h3>Prioritas Operasional</h3>
        </div>
        <button type="button" className="text-button" onClick={() => navigate("advisor")}>
          <MessageCircle size={14} /> AI Advisor
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



/* ==========================================================================
   SPACE DESIGN SYSTEM - EXPORTED ATOMIC COMPONENTS
   Figma Source: Space Design System (Community Specification)
   ========================================================================== */

import {
  ChevronLeft,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Info,
} from "lucide-react";

export interface SpaceButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "accent" | "danger" | "icon" | "outline";
  loading?: boolean;
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export function SpaceButton({
  children,
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  loading = false,
  disabled,
  className = "",
  ...props
}: SpaceButtonProps) {
  const isIconOnly = variant === "icon";
  const classNames = [
    "space-btn",
    `space-btn-${variant}`,
    `space-btn-${size}`,
    className,
  ].filter(Boolean).join(" ");

  return (
    <button className={classNames} disabled={disabled || loading} {...props}>
      {loading ? (
        <span
          style={{
            width: 14,
            height: 14,
            border: "2px solid currentColor",
            borderRightColor: "transparent",
            borderRadius: "50%",
            display: "inline-block",
            animation: "space-spin 0.7s linear infinite",
          }}
        />
      ) : icon ? (
        <span style={{ display: "inline-flex", flexShrink: 0 }}>{icon}</span>
      ) : null}
      {children}
      {iconRight && !loading && <span style={{ display: "inline-flex", flexShrink: 0 }}>{iconRight}</span>}
    </button>
  );
}

export interface SpaceInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  required?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  helperText?: string;
  error?: string;
}

export function SpaceInput({
  label,
  required,
  iconLeft,
  iconRight,
  helperText,
  error,
  className = "",
  id,
  ...props
}: SpaceInputProps) {
  const inputId = id || (label ? `space-input-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);
  const wrapClasses = [
    "space-input-wrap",
    iconLeft ? "has-left-icon" : "",
    iconRight ? "has-right-icon" : "",
    error ? "has-error" : "",
    className,
  ].filter(Boolean).join(" ");

  return (
    <div className="space-form-group">
      {label && (
        <label htmlFor={inputId} className="space-form-label">
          <span>
            {label}
            {required && <span className="required">*</span>}
          </span>
        </label>
      )}
      <div className={wrapClasses}>
        {iconLeft && <span className="space-input-icon-left">{iconLeft}</span>}
        <input id={inputId} className="space-input" {...props} />
        {iconRight && <span className="space-input-icon-right">{iconRight}</span>}
      </div>
      {error ? (
        <span className="space-input-helper error-text">{error}</span>
      ) : helperText ? (
        <span className="space-input-helper">{helperText}</span>
      ) : null}
    </div>
  );
}

export interface SpaceSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  options?: { value: string; label: string }[];
}

export function SpaceSelect({
  label,
  required,
  helperText,
  error,
  options,
  children,
  className = "",
  id,
  ...props
}: SpaceSelectProps) {
  const selectId = id || (label ? `space-select-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);
  return (
    <div className="space-form-group">
      {label && (
        <label htmlFor={selectId} className="space-form-label">
          <span>
            {label}
            {required && <span className="required">*</span>}
          </span>
        </label>
      )}
      <div className={`space-select-wrap ${className}`}>
        <select id={selectId} className="space-select" {...props}>
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <ChevronDown size={16} className="space-select-chevron" />
      </div>
      {error ? (
        <span className="space-input-helper error-text">{error}</span>
      ) : helperText ? (
        <span className="space-input-helper">{helperText}</span>
      ) : null}
    </div>
  );
}

export function SpaceCheckbox({
  label,
  description,
  checked,
  onChange,
  disabled,
  className = "",
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label className={`space-checkbox-label ${disabled ? "disabled" : ""} ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="space-checkbox-input"
        style={{ position: "absolute", opacity: 0, width: 0, height: 0, margin: 0 }}
      />
      <span className="space-checkbox-box">
        {checked && <Check size={12} strokeWidth={3} />}
      </span>
      <span className="space-checkbox-copy">
        <span className="space-checkbox-title">{label}</span>
        {description && <span className="space-checkbox-desc">{description}</span>}
      </span>
    </label>
  );
}

export function SpaceRadio({
  label,
  checked,
  onChange,
  name,
  disabled,
  className = "",
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  name?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label className={`space-radio-label ${disabled ? "disabled" : ""} ${className}`}>
      <input
        type="radio"
        name={name}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="space-radio-input"
        style={{ position: "absolute", opacity: 0, width: 0, height: 0, margin: 0 }}
      />
      <span className="space-radio-circle">
        <span className="space-radio-circle-dot" />
      </span>
      <span className="space-checkbox-title">{label}</span>
    </label>
  );
}

export function SpaceToggle({
  label,
  checked,
  onChange,
  disabled,
  className = "",
}: {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label className={`space-toggle-label ${disabled ? "disabled" : ""} ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="space-toggle-input"
        style={{ position: "absolute", opacity: 0, width: 0, height: 0, margin: 0 }}
      />
      <span className="space-toggle-track">
        <span className="space-toggle-thumb" />
      </span>
      {label && <span className="space-checkbox-title">{label}</span>}
    </label>
  );
}

export function SpaceBadge({
  children,
  tone = "neutral",
  size = "md",
  showDot = false,
  icon,
  className = "",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "primary" | "success" | "warning" | "danger" | "purple";
  size?: "sm" | "md" | "lg";
  showDot?: boolean;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={`space-badge space-badge-${tone} space-badge-${size} ${className}`}>
      {showDot && <span className="space-badge-dot" />}
      {icon && <span style={{ display: "inline-flex" }}>{icon}</span>}
      {children}
    </span>
  );
}

export function SpaceAvatar({
  name,
  src,
  size = "md",
  status,
  className = "",
}: {
  name: string;
  src?: string;
  size?: "xs" | "sm" | "md" | "lg";
  status?: "online" | "busy" | "offline";
  className?: string;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className={`space-avatar space-avatar-${size} ${className}`} title={name}>
      {src ? (
        <img src={src} alt={name} className="space-avatar-img" />
      ) : (
        <span>{initials || "U"}</span>
      )}
      {status && <span className={`space-avatar-status ${status}`} />}
    </div>
  );
}

export function SpaceTooltip({
  content,
  children,
}: {
  content: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-tooltip-trigger">
      {children}
      <span className="space-tooltip" role="tooltip">
        {content}
      </span>
    </div>
  );
}

export function SpaceProgressBar({
  value,
  label,
  detail,
  tone = "primary",
}: {
  value: number;
  label?: string;
  detail?: string;
  tone?: "primary" | "success" | "warning";
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="space-progress-wrap">
      {(label || detail) && (
        <div className="space-progress-header">
          <span>{label}</span>
          <span>{detail || `${clamped.toFixed(0)}%`}</span>
        </div>
      )}
      <div className="space-progress-track">
        <div
          className={`space-progress-fill ${tone}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

export function SpacePagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
}: {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, currentPage * pageSize);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i += 1) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i += 1) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="space-pagination-bar">
      <div className="space-pagination-info">
        Menampilkan <b>{startItem}</b>–<b>{endItem}</b> dari <b>{totalItems}</b> data
      </div>
      <div className="space-pagination-controls">
        <button
          type="button"
          className="space-page-btn"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Halaman Sebelumnya"
        >
          <ChevronLeft size={16} />
        </button>

        {getPageNumbers().map((p, idx) =>
          typeof p === "number" ? (
            <button
              key={p}
              type="button"
              className={`space-page-btn ${p === currentPage ? "active" : ""}`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          ) : (
            <span
              key={`ellipsis-${idx}`}
              style={{ padding: "0 4px", color: "var(--space-gray-400)", fontSize: 13 }}
            >
              …
            </span>
          )
        )}

        <button
          type="button"
          className="space-page-btn"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Halaman Berikutnya"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export function SpaceTabs({
  tabs,
  activeTab,
  onChange,
  variant = "pills",
}: {
  tabs: { id: string; label: string; icon?: React.ReactNode; count?: number }[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: "pills" | "underline";
}) {
  if (variant === "underline") {
    return (
      <div className="space-tabs-underline">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`space-tab-underline ${tab.id === activeTab ? "active" : ""}`}
            onClick={() => onChange(tab.id)}
          >
            {tab.icon}
            {tab.label}
            {typeof tab.count === "number" && (
              <span
                style={{
                  marginLeft: 6,
                  padding: "1px 6px",
                  fontSize: 11,
                  borderRadius: 99,
                  background: tab.id === activeTab ? "var(--space-navy-100)" : "var(--space-gray-200)",
                  color: tab.id === activeTab ? "var(--space-navy-800)" : "var(--space-gray-600)",
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-tabs-pills">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`space-tab-pill ${tab.id === activeTab ? "active" : ""}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.icon}
          {tab.label}
          {typeof tab.count === "number" && (
            <span
              style={{
                marginLeft: 4,
                padding: "1px 5px",
                fontSize: 10.5,
                borderRadius: 99,
                background: tab.id === activeTab ? "rgba(255, 255, 255, 0.25)" : "var(--space-gray-200)",
                color: tab.id === activeTab ? "#FFFFFF" : "var(--space-gray-600)",
              }}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export function SpaceSkeleton({
  width = "100%",
  height = 18,
  borderRadius = "var(--space-radius-sm)",
  style,
}: {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="space-skeleton"
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
    />
  );
}

export function SpaceStatCard({
  label,
  value,
  subtext,
  trend,
  badgeText,
  badgeTone = "primary",
  tone = "navy",
  icon,
}: {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: { value: string; isUp: boolean } | string;
  badgeText?: string;
  badgeTone?: "primary" | "success" | "warning" | "danger" | "purple" | "neutral";
  tone?: "navy" | "gold" | "mint" | "purple";
  icon?: React.ReactNode;
}) {
  return (
    <div className={`space-crm-stat-card ${tone}`}>
      <div className="space-crm-stat-label">
        <span>{label}</span>
        {icon && <span style={{ color: "var(--space-gray-400)" }}>{icon}</span>}
      </div>
      <div className="space-crm-stat-value" style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
        <span>{value}</span>
        {badgeText && (
          <SpaceBadge tone={badgeTone} size="sm">
            {badgeText}
          </SpaceBadge>
        )}
      </div>
      {(subtext || trend) && (
        <div className="space-crm-stat-foot">
          {trend && (
            typeof trend === "string" ? (
              <span className="space-crm-stat-trend up">{trend}</span>
            ) : (
              <span className={`space-crm-stat-trend ${trend.isUp ? "up" : "down"}`}>
                {trend.isUp ? "↑" : "↓"} {trend.value}
              </span>
            )
          )}
          {subtext && <span>{subtext}</span>}
        </div>
      )}
    </div>
  );
}
