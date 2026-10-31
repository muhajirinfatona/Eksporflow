import type { ApprovalDecision } from "@/hooks/useWorkspaceFlow";
import { formatMoney, formatNumber, getDocumentNumber } from "@shared/format";
import type { Pricing } from "@shared/pricing";
import type { ScreenId } from "@shared/risk";
import type {
  ContainerCalc,
  DocumentOrientation,
  DocumentTemplate,
  DocumentType,
  PaperSize,
  PreviewLanguage,
  Shipment,
} from "@shared/shipment";
import {
  ArrowLeft,
  ArrowRight,
  Box,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  FileCheck2,
  FileText,
  Printer,
  RefreshCcw,
  ShieldAlert,
  Ship,
  SlidersHorizontal,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import React, { useRef, useState } from "react";
import { toast } from "sonner";
import { Field, SelectField, StatusPill } from "./Primitives";

function docCopy(language: PreviewLanguage, english: string, indonesian: string) {
  return language === "Bahasa Indonesia" ? indonesian : english;
}

export function DocumentsModule({
  shipment,
  update,
  pricing,
  container,
  selectedDocument,
  setSelectedDocument,
  printDocument,
  navigate,
  effectiveApprovalStatus,
}: {
  shipment: Shipment;
  update: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void;
  pricing: Pricing;
  container: ContainerCalc;
  selectedDocument: DocumentType;
  setSelectedDocument: (doc: DocumentType) => void;
  printDocument: () => void;
  navigate: (screen: ScreenId) => void;
  effectiveApprovalStatus: ApprovalDecision;
}) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const documents: {
    type: DocumentType;
    code: string;
    caption: string;
    icon: React.ReactNode;
    status: string;
    badgeTone: "green" | "amber" | "blue";
  }[] = [
    {
      type: "Proforma Invoice",
      code: "PI",
      caption: "Penawaran awal, rincian produk & syarat pembayaran",
      icon: <FileText size={18} />,
      status: "Siap Diterbitkan",
      badgeTone: "green",
    },
    {
      type: "Commercial Invoice",
      code: "CI",
      caption: "Dokumen nilai komersial resmi & penetapan pabean",
      icon: <FileCheck2 size={18} />,
      status: "Siap Diterbitkan",
      badgeTone: "green",
    },
    {
      type: "Packing List",
      code: "PL",
      caption: "Rincian spesifikasi koli, volume & tonase muatan",
      icon: <ClipboardList size={18} />,
      status: "Siap Diterbitkan",
      badgeTone: "green",
    },
    {
      type: "Bill of Lading",
      code: "BL",
      caption: "Draft instruksi konosemen muatan (Non-carrier draft)",
      icon: <Ship size={18} />,
      status: "Draft / Reference",
      badgeTone: "amber",
    },
  ];

  const handleLetterheadImage = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("File logo/kop harus berupa gambar", { description: "Gunakan PNG, JPG, atau WEBP." });
      return;
    }
    if (file.size > 2_000_000) {
      toast.error("Ukuran logo terlalu besar", { description: "Maksimal 2 MB agar draft tetap ringan." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      update("letterheadImage", String(reader.result));
      toast.success("Logo perusahaan berhasil diperbarui");
    };
    reader.readAsDataURL(file);
  };

  const finishReview = () => {
    update("previewLanguage", "English");
    update("documentReviewed", true);
    toast.success("Review dokumen ditandai selesai", {
      description: "Output PDF/print otomatis mengikuti standar English dengan setelan dokumen aktif.",
    });
  };

  return (
    <div className="doc-center-root">
      {/* Top Header Hub */}
      <div className="doc-hub-header">
        <div className="doc-hub-title-block">
          <div className="doc-hub-badge-row">
            <span className="doc-hub-tag">PUSAT DOKUMEN EKSPOR RESMI</span>
            <span className="doc-hub-pill">Standar Ekspor Global · ICC Rules</span>
          </div>
          <h2 className="doc-hub-title">Dokumen Transaksi Ekspor</h2>
          <p className="doc-hub-desc">
            Pusat penerbitan dokumen perdagangan resmi (Invoice, Packing List, & Draft B/L) yang siap cetak dan sinkron dengan snapshot transaksi.
          </p>
        </div>

        <div className="doc-hub-status-block">
          <div className="doc-hub-meta">
            <span className="doc-hub-meta-label">Revisi Transaksi:</span>
            <span className="doc-hub-meta-val">Snapshot R{shipment.documentRevision}</span>
          </div>
          <div className="doc-hub-meta">
            <span className="doc-hub-meta-label">Otorisasi Kontrak:</span>
            <StatusPill tone={effectiveApprovalStatus === "Tercatat direview" ? "green" : "amber"}>
              {effectiveApprovalStatus}
            </StatusPill>
          </div>
          <button
            type="button"
            className="doc-refresh-btn"
            onClick={() => toast.success("Data dokumen disinkronkan dari transaksi aktif")}
            title="Segarkan data dokumen"
          >
            <RefreshCcw size={13} /> Sinkron Data
          </button>
        </div>
      </div>

      {/* Horizontal Document Switcher Tabs */}
      <div className="doc-tabs-grid">
        {documents.map((doc) => {
          const isActive = selectedDocument === doc.type;
          return (
            <button
              key={doc.type}
              type="button"
              className={`doc-tab-card ${isActive ? "active" : ""}`}
              onClick={() => setSelectedDocument(doc.type)}
            >
              <div className="doc-tab-top">
                <div className={`doc-tab-icon-box ${isActive ? "active" : ""}`}>
                  {doc.icon}
                </div>
                <div className="doc-tab-badges">
                  <span className="doc-code-badge">{doc.code}</span>
                  <StatusPill tone={doc.badgeTone}>{doc.status}</StatusPill>
                </div>
              </div>
              <div className="doc-tab-body">
                <h4 className="doc-tab-name">{doc.type}</h4>
                <p className="doc-tab-desc">{doc.caption}</p>
              </div>
              {isActive && <div className="doc-tab-active-indicator" />}
            </button>
          );
        })}
      </div>

      {/* Unified Action Bar */}
      <div className="doc-action-bar">
        <div className="doc-action-info">
          <div className="doc-active-name-wrap">
            <span className="doc-active-eyebrow">DOKUMEN DITINJAU:</span>
            <h3 className="doc-active-title">
              {selectedDocument === "Bill of Lading" ? "Draft Bill of Lading (B/L)" : selectedDocument}
            </h3>
            <span className="doc-active-ref">
              No: {getDocumentNumber(selectedDocument, shipment.reference)}
            </span>
          </div>
          <div className="doc-active-specs">
            <span className="spec-item">
              Kertas: <b>{shipment.paperSize} ({shipment.documentOrientation})</b>
            </span>
            <span className="spec-dot">·</span>
            <span className="spec-item">
              Gaya: <b>{shipment.documentTemplate}</b>
            </span>
            <span className="spec-dot">·</span>
            <span className="spec-item">
              Bahasa: <b>{shipment.previewLanguage}</b>
            </span>
            <span className="spec-dot">·</span>
            <span className="spec-item">
              Status:{" "}
              <b className={shipment.documentReviewed ? "spec-reviewed" : "spec-draft"}>
                {shipment.documentReviewed ? "✓ Telah Direview" : "Draft Transaksi"}
              </b>
            </span>
          </div>
        </div>

        <div className="doc-action-buttons">
          <button
            type="button"
            className={`doc-btn-toggle-settings ${isSettingsOpen ? "active" : ""}`}
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          >
            <SlidersHorizontal size={14} />
            <span>{isSettingsOpen ? "Tutup Setelan" : "Setelan Kop & Format"}</span>
            {isSettingsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          <button
            type="button"
            className="doc-btn-review"
            onClick={finishReview}
          >
            <CheckCircle2 size={15} />
            <span>Selesai Diperiksa</span>
          </button>

          <button
            type="button"
            className="doc-btn-print"
            onClick={printDocument}
          >
            <Printer size={15} />
            <span>Cetak / Unduh PDF</span>
          </button>
        </div>
      </div>

      {/* Collapsible Settings Panel or Quick Strip */}
      {isSettingsOpen ? (
        <DocumentSettings
          shipment={shipment}
          update={update}
          onLetterheadImage={handleLetterheadImage}
          onClose={() => setIsSettingsOpen(false)}
        />
      ) : (
        <div className="doc-quick-settings-strip">
          <div className="quick-strip-left">
            <SlidersHorizontal size={14} className="quick-strip-icon" />
            <span className="quick-strip-label">Setelan Output:</span>
            <span className="quick-strip-value">
              Format <b>{shipment.paperSize} ({shipment.documentOrientation})</b>
            </span>
            <span className="quick-strip-dot">·</span>
            <span className="quick-strip-value">
              Template <b>{shipment.documentTemplate}</b>
            </span>
            <span className="quick-strip-dot">·</span>
            <span className="quick-strip-value">
              Kop: <b>{shipment.exporter || "Belum ada identitas"}</b>
            </span>
            <span className="quick-strip-dot">·</span>
            <span className="quick-strip-value">
              Port: <b>{shipment.namedPlace || "Surabaya, ID"}</b>
            </span>
          </div>
          <button
            type="button"
            className="quick-strip-btn"
            onClick={() => setIsSettingsOpen(true)}
          >
            Sesuaikan Kop & Gaya ⚙
          </button>
        </div>
      )}

      {/* Centered Paper Desk Canvas */}
      <div className="doc-paper-desk">
        <div className="doc-desk-header">
          <div className="doc-desk-badge">
            <FileText size={13} />
            <span>LEMBAR PRATINJAU DOKUMEN CETAK (PRINT-READY CANVASS)</span>
          </div>
          <div className="doc-desk-notice">
            Dokumen cetak/PDF selalu diekspor dalam Bahasa Inggris resmi sesuai regulasi kepabeanan internasional.
          </div>
        </div>

        <div
          className={`paper-document paper-${shipment.paperSize.toLowerCase()} paper-${shipment.documentOrientation.toLowerCase()} paper-template-${shipment.documentTemplate.toLowerCase().replace(" ", "-")}`}
        >
          <div className="paper-header">
            <div className="paper-letterhead">
              {shipment.letterheadImage ? (
                <img src={shipment.letterheadImage} alt="Logo resmi perusahaan eksportir" />
              ) : (
                <button
                  type="button"
                  className="paper-no-logo-action"
                  onClick={() => setIsSettingsOpen(true)}
                  title="Klik untuk memasang logo perusahaan di setelan kop"
                >
                  <UploadCloud size={14} />
                  <span>Pasang Logo Perusahaan</span>
                </button>
              )}
              <div>
                <b>{shipment.exporter}</b>
                <small>
                  {shipment.letterheadText || "Tambahkan alamat, kontak, dan identitas perusahaan di setelan kop surat."}
                </small>
              </div>
            </div>
            <div className="paper-title">
              <span>
                {selectedDocument === "Bill of Lading"
                  ? "DRAFT / REFERENCE B/L"
                  : selectedDocument.toUpperCase()}
              </span>
              <strong>{getDocumentNumber(selectedDocument, shipment.reference)}</strong>
              <small>
                {shipment.paperSize} · {shipment.documentOrientation} · R{shipment.documentRevision}
              </small>
            </div>
          </div>

          <div className="paper-rule" />

          <div className="paper-parties">
            <div>
              <span>{docCopy(shipment.previewLanguage, "EXPORTER / SHIPPER", "EKSPORTIR / PENGIRIM")}</span>
              <b>{shipment.exporter}</b>
              <p>{shipment.letterheadText || "Company address and contact details"}</p>
            </div>
            <div>
              <span>{docCopy(shipment.previewLanguage, "BUYER / CONSIGNEE", "BUYER / PENERIMA")}</span>
              <b>{shipment.buyer}</b>
              <p>
                {shipment.destination}
                <br />
                {shipment.buyerCountry}
              </p>
            </div>
            <div>
              <span>{docCopy(shipment.previewLanguage, "SHIPMENT TERMS", "KETENTUAN PENGIRIMAN")}</span>
              <b>
                {shipment.incoterm} · {shipment.currency}
              </b>
              <p>
                {docCopy(shipment.previewLanguage, "Payment", "Pembayaran")}: {shipment.paymentTerms}
                <br />
                Named place: {shipment.namedPlace}
              </p>
            </div>
          </div>

          {selectedDocument === "Bill of Lading" ? (
            <BlContent shipment={shipment} container={container} language={shipment.previewLanguage} />
          ) : selectedDocument === "Packing List" ? (
            <PackingListContent
              shipment={shipment}
              container={container}
              language={shipment.previewLanguage}
            />
          ) : (
            <InvoiceContent
              shipment={shipment}
              pricing={pricing}
              commercial={selectedDocument === "Commercial Invoice"}
              language={shipment.previewLanguage}
            />
          )}
        </div>
      </div>

      {/* Operational Workflow Footer */}
      <div className="doc-workflow-footer">
        <button
          type="button"
          className="workflow-link-btn"
          onClick={() => navigate("pricing")}
        >
          <ArrowLeft size={16} />
          <div className="workflow-link-text">
            <span className="workflow-sub">Tahap Sebelumnya</span>
            <span className="workflow-main">Harga & Otorisasi Pesanan</span>
          </div>
        </button>

        <div className="workflow-center-pills">
          <span className="workflow-pills-label">Alur Operasional Terkait:</span>
          <button
            type="button"
            className="workflow-pill-btn"
            onClick={() => navigate("cargo")}
          >
            <Box size={14} />
            <span>Rencana Muatan (3D)</span>
          </button>
          <button
            type="button"
            className="workflow-pill-btn"
            onClick={() => navigate("risk")}
          >
            <ShieldAlert size={14} />
            <span>Risk & Compliance Center</span>
          </button>
        </div>

        <button
          type="button"
          className="workflow-link-btn primary"
          onClick={() => navigate("shipment")}
        >
          <div className="workflow-link-text text-right">
            <span className="workflow-sub">Tahap Berikutnya</span>
            <span className="workflow-main">Logistik & Pengiriman Ekspor</span>
          </div>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

function DocumentSettings({
  shipment,
  update,
  onLetterheadImage,
  onClose,
}: {
  shipment: Shipment;
  update: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void;
  onLetterheadImage: (file?: File) => void;
  onClose: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const templates: { name: DocumentTemplate; detail: string; badge: string }[] = [
    {
      name: "Corporate Clean",
      badge: "Modern & Bersih",
      detail: "Identitas modern dengan aksen warna korporat, hierarki jelas, dan tata letak elegan.",
    },
    {
      name: "Classic Trade",
      badge: "Standar Perbankan / L/C",
      detail: "Format formal perbankan dengan border terstruktur ketat dan tabel standar UCP 600.",
    },
    {
      name: "Minimal",
      badge: "Kontemporer Ringkas",
      detail: "Desain ringkas dan lapang dengan whitespace optimal serta tipografi bersih.",
    },
  ];

  const changeLanguage = (value: string) => {
    update("previewLanguage", value as PreviewLanguage);
    update("documentReviewed", false);
  };

  return (
    <section className="doc-settings-panel">
      <div className="doc-settings-top">
        <div>
          <div className="doc-settings-eyebrow">
            <SlidersHorizontal size={13} />
            <span>PENGATURAN KOP SURAT & OUTPUT DOKUMEN</span>
          </div>
          <h3 className="doc-settings-heading">Konfigurasi Identitas & Format Ekspor</h3>
          <p className="doc-settings-sub">
            Atur identitas kop surat perusahaan, pelabuhan muat, ukuran kertas, dan gaya dokumen cetak PDF.
          </p>
        </div>
        <button
          type="button"
          className="doc-settings-close-btn"
          onClick={onClose}
          aria-label="Tutup pengaturan"
        >
          <X size={15} /> Tutup
        </button>
      </div>

      <div className="doc-settings-columns">
        {/* Kolom 1: Format Kertas & Bahasa */}
        <div className="doc-settings-card">
          <div className="doc-settings-card-header">
            <h4>1. Format Kertas & Pratinjau</h4>
            <p>Spesifikasi cetak fisik dan bahasa tampilan dokumen.</p>
          </div>
          <div className="doc-settings-card-fields">
            <SelectField
              label="Ukuran Kertas Dokumen"
              value={shipment.paperSize}
              onChange={(value) => update("paperSize", value as PaperSize)}
            >
              <option value="A4">A4 · 210 × 297 mm (Standar Internasional ISO)</option>
              <option value="Letter">US Letter · 8.5 × 11 in (Standar Amerika)</option>
              <option value="Legal">US Legal · 8.5 × 14 in (Panjang)</option>
            </SelectField>

            <SelectField
              label="Orientasi Kertas"
              value={shipment.documentOrientation}
              onChange={(value) => update("documentOrientation", value as DocumentOrientation)}
            >
              <option value="Portrait">Portrait · Default (Standar Invoice & PL)</option>
              <option value="Landscape">Landscape · Horizontal (Untuk tabel lebar)</option>
            </SelectField>

            <SelectField
              label="Bahasa Pratinjau Layar"
              value={shipment.previewLanguage}
              onChange={changeLanguage}
            >
              <option value="English">English · Standar Resmi Ekspor Global</option>
              <option value="Bahasa Indonesia">Bahasa Indonesia · Pratinjau Tim Internal</option>
            </SelectField>

            <div className="doc-settings-note">
              Output Cetak & PDF selalu diproduksi dalam <b>English</b> sesuai ketentuan perdagangan internasional (ICC Incoterms & Kepabeanan).
            </div>
          </div>
        </div>

        {/* Kolom 2: Identitas Kop Surat & Port */}
        <div className="doc-settings-card">
          <div className="doc-settings-card-header">
            <h4>2. Identitas Kop & Pelabuhan</h4>
            <p>Informasi eksportir yang dicetak pada kepala surat dokumen.</p>
          </div>
          <div className="doc-settings-card-fields">
            <Field
              label="Named Place / Pelabuhan Muat"
              value={shipment.namedPlace}
              placeholder="Contoh: Surabaya, Tanjung Perak Port"
              onChange={(value) => update("namedPlace", value)}
            />

            <Field
              label="Teks Alamat / Kontak Kop Surat"
              value={shipment.letterheadText}
              placeholder="Alamat kantor, nomor telepon, email, NPWP/NIB eksportir"
              onChange={(value) => update("letterheadText", value)}
            />

            {/* Custom Logo Upload Dropzone */}
            <div className="doc-logo-field">
              <label className="field-label">Logo / Lambang Perusahaan Eksportir</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                style={{ display: "none" }}
                onChange={(e) => onLetterheadImage(e.target.files?.[0])}
              />
              {shipment.letterheadImage ? (
                <div className="doc-logo-active-card">
                  <div className="doc-logo-preview-thumb">
                    <img src={shipment.letterheadImage} alt="Logo Perusahaan Aktif" />
                  </div>
                  <div className="doc-logo-meta">
                    <b>Logo Resmi Terpasang</b>
                    <small>Disematkan otomatis pada kop surat dokumen</small>
                    <div className="doc-logo-btn-row">
                      <button
                        type="button"
                        className="doc-logo-change-btn"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Ganti File
                      </button>
                      <button
                        type="button"
                        className="doc-logo-delete-btn"
                        onClick={() => update("letterheadImage", "")}
                      >
                        <Trash2 size={13} /> Hapus
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className="doc-logo-dropzone"
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                >
                  <div className="dropzone-icon-circle">
                    <UploadCloud size={20} />
                  </div>
                  <div className="dropzone-text-group">
                    <span className="dropzone-title">Klik untuk unggah logo resmi perusahaan</span>
                    <span className="dropzone-hint">Format PNG, JPG, atau WEBP · Maksimal 2 MB</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Kolom 3: Template Gallery */}
        <div className="doc-settings-card">
          <div className="doc-settings-card-header">
            <h4>3. Gaya Desain Template</h4>
            <p>Pilih gaya visual dokumen yang merefleksikan karakter perusahaan.</p>
          </div>
          <div className="doc-template-list">
            {templates.map((tpl) => {
              const isSelected = shipment.documentTemplate === tpl.name;
              return (
                <button
                  key={tpl.name}
                  type="button"
                  className={`doc-template-option-card ${isSelected ? "selected" : ""}`}
                  onClick={() => update("documentTemplate", tpl.name)}
                >
                  <div className="tpl-option-header">
                    <span className="tpl-name">{tpl.name}</span>
                    <span className={`tpl-badge ${isSelected ? "active" : ""}`}>
                      {tpl.badge}
                    </span>
                  </div>
                  <p className="tpl-detail">{tpl.detail}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function InvoiceContent({
  shipment,
  pricing,
  commercial,
  language,
}: {
  shipment: Shipment;
  pricing: Pricing;
  commercial: boolean;
  language: PreviewLanguage;
}) {
  return (
    <>
      <table className="paper-table">
        <thead>
          <tr>
            <th>{docCopy(language, "DESCRIPTION OF GOODS", "DESKRIPSI BARANG")}</th>
            <th>HS CODE</th>
            <th>{docCopy(language, "QUANTITY", "JUMLAH")}</th>
            <th>{docCopy(language, "UNIT PRICE", "HARGA UNIT")}</th>
            <th>{docCopy(language, "TOTAL", "TOTAL")}</th>
          </tr>
        </thead>
        <tbody>
          {shipment.lineItems.map((item) => (
            <tr key={item.id}>
              <td>
                <b>{item.description}</b>
                <small>Export grade · Indonesia</small>
              </td>
              <td>{item.hsCode || "—"}</td>
              <td>
                {formatNumber(item.quantity)} {item.unit}
              </td>
              <td>{formatMoney(item.unitPrice, shipment.currency)}</td>
              <td>
                <b>{formatMoney(item.quantity * item.unitPrice, shipment.currency)}</b>
              </td>
            </tr>
          ))}
          <tr>
            <td>
              <b>
                {docCopy(
                  language,
                  "Export packaging & handling",
                  "Kemasan & handling ekspor",
                )}
              </b>
              <small>Ready for review</small>
            </td>
            <td>—</td>
            <td>1 lot</td>
            <td>—</td>
            <td>
              <b>{formatMoney(shipment.packaging, shipment.currency)}</b>
            </td>
          </tr>
        </tbody>
      </table>
      <div className="paper-summary">
        <div>
          <span>{docCopy(language, "Subtotal", "Subtotal")}</span>
          <b>{formatMoney(pricing.active.cost, shipment.currency)}</b>
        </div>
        <div>
          <span>
            {docCopy(
              language,
              commercial ? "Margin / commercial value" : "Margin / offer",
              commercial ? "Margin / nilai komersial" : "Margin / penawaran",
            )}
          </span>
          <b>{formatMoney(pricing.active.profit, shipment.currency)}</b>
        </div>
        <div className="paper-total">
          <span>{commercial ? "TOTAL COMMERCIAL VALUE" : "TOTAL AMOUNT DUE"}</span>
          <strong>{formatMoney(pricing.active.offer, shipment.currency)}</strong>
        </div>
      </div>
      <div className="paper-notes">
        <div>
          <span>{docCopy(language, "NOTES", "CATATAN")}</span>
          <p>
            {docCopy(language, "Country of origin", "Negara asal")}: Indonesia
            <br />
            Incoterm: {shipment.incoterm} · Named place: {shipment.namedPlace}
            <br />
            All banking charges outside Indonesia are for buyer&apos;s account.
          </p>
        </div>
        <div className="signature-box">
          <span>AUTHORIZED SIGNATURE</span>
          <div />
        </div>
      </div>
    </>
  );
}

function BlContent({
  shipment,
  container,
  language,
}: {
  shipment: Shipment;
  container: { totalVolume: number; totalWeight: number };
  language: PreviewLanguage;
}) {
  return (
    <>
      <div className="draft-warning">
        <ShieldAlert size={14} />{" "}
        {docCopy(
          language,
          "DRAFT / REFERENCE ONLY — not carrier-issued and not proof of shipment.",
          "HANYA DRAFT / REFERENSI — bukan dokumen carrier dan bukan bukti pengiriman.",
        )}
      </div>
      <div className="bl-grid">
        <div>
          <span>PORT OF LOADING</span>
          <b>Surabaya, Indonesia</b>
        </div>
        <div>
          <span>PORT OF DISCHARGE</span>
          <b>{shipment.namedPlace}</b>
        </div>
        <div>
          <span>PLACE OF DELIVERY</span>
          <b>{shipment.destination}</b>
        </div>
        <div>
          <span>FREIGHT TERMS</span>
          <b>Prepaid · {shipment.incoterm}</b>
        </div>
      </div>
      <table className="paper-table">
        <thead>
          <tr>
            <th>MARKS & NUMBERS</th>
            <th>NO. OF PACKAGES</th>
            <th>DESCRIPTION</th>
            <th>GROSS WEIGHT</th>
            <th>MEASUREMENT</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{shipment.reference}</td>
            <td>{formatNumber(shipment.cartonQty)} CTNS</td>
            <td>
              <b>{shipment.product}</b>
              <small>
                {shipment.containerType} · {shipment.packageType}
              </small>
            </td>
            <td>{formatNumber(container.totalWeight, 0)} KG</td>
            <td>{formatNumber(container.totalVolume, 2)} CBM</td>
          </tr>
        </tbody>
      </table>
      <div className="bl-footer-note">
        Draft prepared from transaction workspace data. Carrier, customs, and operational review required.
      </div>
    </>
  );
}

function PackingListContent({
  shipment,
  language,
}: {
  shipment: Shipment;
  container: { totalVolume: number; totalWeight: number };
  language: PreviewLanguage;
}) {
  return (
    <>
      <div className="bl-grid">
        <div>
          <span>{docCopy(language, "PACKING TYPE", "JENIS KEMASAN")}</span>
          <b>{shipment.packageType}</b>
        </div>
        <div>
          <span>CONTAINER</span>
          <b>{shipment.containerType}</b>
        </div>
        <div>
          <span>CONTAINER NUMBER</span>
          <b>{shipment.containerNumber || "To be assigned"}</b>
        </div>
        <div>
          <span>SEAL NUMBER</span>
          <b>{shipment.sealNumber || "To be assigned"}</b>
        </div>
      </div>
      <table className="paper-table">
        <thead>
          <tr>
            <th>PACKING MARKS</th>
            <th>NO. OF PACKAGES</th>
            <th>DESCRIPTION OF GOODS</th>
            <th>NET / GROSS WEIGHT</th>
            <th>MEASUREMENT</th>
          </tr>
        </thead>
        <tbody>
          {shipment.lineItems.map((item) => {
            const itemGross = item.weight * item.quantity;
            const itemNet =
              itemGross * (1 - Math.min(100, Math.max(0, item.shrinkageRate || 0)) / 100);
            const itemVolume = (item.length * item.width * item.height * item.quantity) / 1_000_000;
            return (
              <tr key={item.id}>
                <td>
                  {shipment.reference}
                  <small>Made in Indonesia</small>
                </td>
                <td>
                  {formatNumber(item.quantity)} {item.unit.toUpperCase()}
                </td>
                <td>
                  <b>{item.description}</b>
                  <small>
                    HS Code {item.hsCode || "—"} · {item.packagingType}
                  </small>
                </td>
                <td>
                  {formatNumber(itemNet, 0)} / {formatNumber(itemGross, 0)} KG
                </td>
                <td>{formatNumber(itemVolume, 2)} CBM</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="paper-notes">
        <div>
          <span>{docCopy(language, "PACKING NOTES", "CATATAN KEMASAN")}</span>
          <p>
            {docCopy(
              language,
              "Gross weight excludes no product shrinkage; shrinkage is shown separately in the load plan.",
              "Berat kotor tidak dikurangi susut produk; susut ditampilkan terpisah di rencana muatan.",
            )}
            <br />
            Net/gross weight remains an operational estimate and must be confirmed at stuffing.
          </p>
        </div>
        <div className="signature-box">
          <span>WAREHOUSE CHECK</span>
          <div />
        </div>
      </div>
    </>
  );
}
