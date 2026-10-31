import type { ApprovalDecision } from "@/hooks/useWorkspaceFlow";
import { formatMoney, formatNumber, getDocumentNumber, numberToWords } from "@shared/format";
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
  Award,
  Box,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  FileCheck,
  FileCheck2,
  FileSignature,
  FileSpreadsheet,
  FileText,
  Landmark,
  Mail,
  MapPin,
  Phone,
  Printer,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  Ship,
  SlidersHorizontal,
  Stamp,
  Trash2,
  Truck,
  UploadCloud,
  X,
} from "lucide-react";
import React, { useRef, useState } from "react";
import { toast } from "sonner";
import { Field, SelectField, StatusPill } from "./Primitives";

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
      caption: "Penawaran awal komersial, spesifikasi & rekening tujuan",
      icon: <FileText size={18} />,
      status: "Siap Terbit",
      badgeTone: "green",
    },
    {
      type: "Sales Contract",
      code: "SC",
      caption: "Kontrak resmi jual-beli ekspor (Articles 1 s/d 6)",
      icon: <FileSignature size={18} />,
      status: "Siap Terbit",
      badgeTone: "green",
    },
    {
      type: "Commercial Invoice",
      code: "CI",
      caption: "Faktur komersial penetapan pabean & bea cukai pelabuhan",
      icon: <FileCheck2 size={18} />,
      status: "Siap Terbit",
      badgeTone: "green",
    },
    {
      type: "Packing List",
      code: "PL",
      caption: "Rincian spesifikasi koli, dimensi, net & gross weight",
      icon: <ClipboardList size={18} />,
      status: "Siap Terbit",
      badgeTone: "green",
    },
    {
      type: "Shipping Instruction",
      code: "SI",
      caption: "Instruksi pengapalan resmi ke forwarder / pelayaran untuk B/L",
      icon: <Ship size={18} />,
      status: "Siap Terbit",
      badgeTone: "green",
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
      toast.success("Logo resmi perusahaan berhasil diperbarui");
    };
    reader.readAsDataURL(file);
  };

  const finishReview = () => {
    update("previewLanguage", "English");
    update("documentReviewed", true);
    toast.success("Review dokumen ditandai selesai", {
      description: "Output cetak & unduh PDF siap diterbitkan dalam format standar internasional.",
    });
  };

  // Kalkulasi data turunan terpadu
  const exporterName = shipment.exporter || "PT. INDICO EXPORT INDONESIA";
  const exporterAddress =
    shipment.letterheadText ||
    "Jl. Adiyaksa Baru No. 1B, Kec. Panakkukang, Kota Makassar, Sulawesi Selatan, Indonesia";
  const buyerName = shipment.buyer || "AL BARAKAH FOODSTUFF TRADING LLC";
  const buyerAddress =
    shipment.destination ||
    "P.O. Box 112233, Al Ras Area, Deira, Dubai, United Arab Emirates";
  const buyerCountry = shipment.buyerCountry || "United Arab Emirates";
  const pol = shipment.namedPlace || "Makassar New Port, South Sulawesi, Indonesia";
  const pod = shipment.destination || "Jebel Ali Port, Dubai, UAE";
  const incoterm = shipment.incoterm || "FOB";
  const currency = shipment.currency || "USD";
  const productName =
    shipment.product ||
    "Indonesian Organic Granulated Palm Sugar (Gula Aren Semut)";
  const hsCode = shipment.hsCode || "1702.90.91";

  // Konversi kuantitas koli, berat net, berat gross, dan volume CBM
  const bagsCount =
    shipment.cartonQty > 0
      ? shipment.cartonQty
      : shipment.quantity > 0 && shipment.quantity < 5000
        ? shipment.quantity
        : 900;
  const netWeightKgs = bagsCount * 20; // 20 kg per bag
  const grossWeightKgs = bagsCount * 20.25; // 20.25 kg gross per bag
  const netWeightMT = Number((netWeightKgs / 1000).toFixed(2));
  const grossWeightMT = Number((grossWeightKgs / 1000).toFixed(3));
  const totalCBM =
    container.totalVolume > 0
      ? Number(container.totalVolume.toFixed(3))
      : 27.5;

  const unitPricePerMT =
    shipment.unitPrice > 100
      ? shipment.unitPrice
      : shipment.unitPrice > 0
        ? Number((shipment.unitPrice * (1000 / 20)).toFixed(2))
        : 2200;

  const totalAmount =
    pricing.active.offer > 0
      ? pricing.active.offer
      : Math.round(netWeightMT * unitPricePerMT);

  const amountInWords = numberToWords(totalAmount, currency);

  return (
    <div className="doc-center-root">
      {/* Top Header Hub */}
      <div className="doc-hub-header">
        <div className="doc-hub-title-block">
          <div className="doc-hub-badge-row">
            <span className="doc-hub-tag">PUSAT DOKUMEN EKSPOR RESMI</span>
            <span className="doc-hub-pill">Standar Ekspor Global · ICC Incoterms 2020 · UCP 600</span>
          </div>
          <h2 className="doc-hub-title">Pusat Penerbitan Dokumen Ekspor Terpadu</h2>
          <p className="doc-hub-desc">
            Sistem penerbitan 5 dokumen resmi ekspor (Proforma Invoice, Sales Contract, Commercial Invoice, Packing List, dan Shipping Instruction) dengan template eksekutif siap cetak dan terverifikasi pabean.
          </p>
        </div>

        <div className="doc-hub-status-block">
          <div className="doc-hub-meta">
            <span className="doc-hub-meta-label">Revisi Transaksi:</span>
            <span className="doc-hub-meta-val">Snapshot R{shipment.documentRevision}</span>
          </div>
          <div className="doc-hub-meta">
            <span className="doc-hub-meta-label">Status Otorisasi:</span>
            <StatusPill tone={effectiveApprovalStatus === "Tercatat direview" ? "green" : "amber"}>
              {effectiveApprovalStatus}
            </StatusPill>
          </div>
          <button
            type="button"
            className="doc-refresh-btn"
            onClick={() => toast.success("Data dokumen berhasil disinkronkan dari transaksi")}
            title="Segarkan data dokumen"
          >
            <RefreshCcw size={13} /> Sinkron Data
          </button>
        </div>
      </div>

      {/* Horizontal Document Switcher Tabs (5 Essential Export Documents) */}
      <div className="doc-tabs-grid five-cols">
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

      {/* Action Bar */}
      <div className="doc-action-bar">
        <div className="doc-action-info">
          <div className="doc-active-name-wrap">
            <span className="doc-active-eyebrow">DOKUMEN DITINJAU:</span>
            <h3 className="doc-active-title">{selectedDocument}</h3>
            <span className="doc-active-ref">
              No: {getDocumentNumber(selectedDocument, shipment.reference || "IEI-DXB/XI/2026/001")}
            </span>
          </div>
          <div className="doc-active-specs">
            <span className="spec-item">
              Kertas: <b>{shipment.paperSize} ({shipment.documentOrientation})</b>
            </span>
            <span className="spec-dot">·</span>
            <span className="spec-item">
              Gaya Desain: <b>{shipment.documentTemplate}</b>
            </span>
            <span className="spec-dot">·</span>
            <span className="spec-item">
              Bahasa Output: <b>{shipment.previewLanguage}</b>
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
            <span className="quick-strip-label">Parameter Cetak:</span>
            <span className="quick-strip-value">
              Kertas <b>{shipment.paperSize} ({shipment.documentOrientation})</b>
            </span>
            <span className="quick-strip-dot">·</span>
            <span className="quick-strip-value">
              Gaya <b>{shipment.documentTemplate}</b>
            </span>
            <span className="quick-strip-dot">·</span>
            <span className="quick-strip-value">
              Eksportir: <b>{exporterName}</b>
            </span>
            <span className="quick-strip-dot">·</span>
            <span className="quick-strip-value">
              Port: <b>{pol}</b>
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
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>STANDAR CETAK DOKUMEN RESMI EKSPOR (PRINT-READY CANVASS · ISO 216)</span>
          </div>
          <div className="doc-desk-notice">
            Dokumen print/PDF mengikuti tata letak internasional yang siap diverifikasi bea cukai & perbankan L/C.
          </div>
        </div>

        {/* Paper Document Container with selected template */}
        <div
          className={`paper-document paper-${shipment.paperSize.toLowerCase()} paper-${shipment.documentOrientation.toLowerCase()} paper-template-${shipment.documentTemplate.toLowerCase().replace(" ", "-")}`}
        >
          {/* Official Letterhead Header */}
          <OfficialLetterhead
            shipment={shipment}
            exporterName={exporterName}
            exporterAddress={exporterAddress}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />

          {/* Render Specific Document Type */}
          {selectedDocument === "Proforma Invoice" && (
            <ProformaInvoiceDoc
              shipment={shipment}
              exporterName={exporterName}
              exporterAddress={exporterAddress}
              buyerName={buyerName}
              buyerAddress={buyerAddress}
              buyerCountry={buyerCountry}
              pol={pol}
              pod={pod}
              incoterm={incoterm}
              currency={currency}
              productName={productName}
              hsCode={hsCode}
              bagsCount={bagsCount}
              netWeightMT={netWeightMT}
              unitPricePerMT={unitPricePerMT}
              totalAmount={totalAmount}
              amountInWords={amountInWords}
            />
          )}

          {selectedDocument === "Sales Contract" && (
            <SalesContractDoc
              shipment={shipment}
              exporterName={exporterName}
              exporterAddress={exporterAddress}
              buyerName={buyerName}
              buyerAddress={buyerAddress}
              buyerCountry={buyerCountry}
              pol={pol}
              pod={pod}
              incoterm={incoterm}
              currency={currency}
              productName={productName}
              hsCode={hsCode}
              bagsCount={bagsCount}
              netWeightMT={netWeightMT}
              unitPricePerMT={unitPricePerMT}
              totalAmount={totalAmount}
              amountInWords={amountInWords}
            />
          )}

          {selectedDocument === "Commercial Invoice" && (
            <CommercialInvoiceDoc
              shipment={shipment}
              exporterName={exporterName}
              exporterAddress={exporterAddress}
              buyerName={buyerName}
              buyerAddress={buyerAddress}
              buyerCountry={buyerCountry}
              pol={pol}
              pod={pod}
              incoterm={incoterm}
              currency={currency}
              productName={productName}
              hsCode={hsCode}
              bagsCount={bagsCount}
              netWeightKgs={netWeightKgs}
              grossWeightKgs={grossWeightKgs}
              netWeightMT={netWeightMT}
              unitPricePerMT={unitPricePerMT}
              totalAmount={totalAmount}
              amountInWords={amountInWords}
            />
          )}

          {selectedDocument === "Packing List" && (
            <PackingListDoc
              shipment={shipment}
              exporterName={exporterName}
              exporterAddress={exporterAddress}
              buyerName={buyerName}
              buyerAddress={buyerAddress}
              buyerCountry={buyerCountry}
              pol={pol}
              pod={pod}
              productName={productName}
              hsCode={hsCode}
              bagsCount={bagsCount}
              netWeightKgs={netWeightKgs}
              grossWeightKgs={grossWeightKgs}
              netWeightMT={netWeightMT}
              grossWeightMT={grossWeightMT}
              totalCBM={totalCBM}
            />
          )}

          {(selectedDocument === "Shipping Instruction" ||
            selectedDocument === "Bill of Lading") && (
            <ShippingInstructionDoc
              shipment={shipment}
              exporterName={exporterName}
              exporterAddress={exporterAddress}
              buyerName={buyerName}
              buyerAddress={buyerAddress}
              pol={pol}
              pod={pod}
              incoterm={incoterm}
              productName={productName}
              hsCode={hsCode}
              bagsCount={bagsCount}
              netWeightKgs={netWeightKgs}
              grossWeightKgs={grossWeightKgs}
              totalCBM={totalCBM}
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

// --------------------------------------------------------------------------
// Official Letterhead Component
// --------------------------------------------------------------------------
function OfficialLetterhead({
  shipment,
  exporterName,
  exporterAddress,
  onOpenSettings,
}: {
  shipment: Shipment;
  exporterName: string;
  exporterAddress: string;
  onOpenSettings: () => void;
}) {
  return (
    <div className="paper-letterhead-wrap">
      <div className="paper-letterhead-content">
        <div className="letterhead-brand">
          {shipment.letterheadImage ? (
            <img
              src={shipment.letterheadImage}
              alt="Logo Resmi Perusahaan"
              className="letterhead-logo"
            />
          ) : (
            <button
              type="button"
              className="letterhead-logo-placeholder"
              onClick={onOpenSettings}
              title="Klik untuk memasang logo resmi perusahaan"
            >
              <UploadCloud size={16} />
              <span>+ Pasang Logo Resmi</span>
            </button>
          )}
          <div className="letterhead-text">
            <h1 className="company-name">{exporterName}</h1>
            <p className="company-details">{exporterAddress}</p>
            <p className="company-contact">
              Tel: +62 812 3456 7890 | Email: official@indicoexport.com | NPWP: 01.234.567.8-801.000
            </p>
          </div>
        </div>
      </div>
      <div className="letterhead-divider-line" />
    </div>
  );
}

// --------------------------------------------------------------------------
// Official Stamp & Signature Component
// --------------------------------------------------------------------------
function OfficialStampAndSignature({
  exporterName,
  role = "Export Director",
  showStamp = true,
}: {
  exporterName: string;
  role?: string;
  showStamp?: boolean;
}) {
  return (
    <div className="official-sig-block">
      <span className="sig-signed-for">Signed for and on behalf of:</span>
      <b className="sig-company-name">{exporterName}</b>
      <div className="sig-canvas-zone">
        {showStamp && (
          <div className="official-stamp-seal">
            <div className="stamp-seal-circle">
              <span className="stamp-seal-text-top">{exporterName}</span>
              <div className="stamp-seal-center">
                <Award size={18} />
                <span>EXPORT VERIFIED</span>
                <small>LEGAL OPERATIONS</small>
              </div>
              <span className="stamp-seal-text-bottom">INDONESIA</span>
            </div>
          </div>
        )}
        <div className="sig-line-mark">[Signature & Company Stamp]</div>
      </div>
      <b className="sig-signatory-name">{role}</b>
      <span className="sig-signatory-title">Authorized Signatory</span>
    </div>
  );
}

// --------------------------------------------------------------------------
// 1. PROFORMA INVOICE (PI) COMPONENT
// --------------------------------------------------------------------------
function ProformaInvoiceDoc({
  shipment,
  exporterName,
  buyerName,
  buyerAddress,
  buyerCountry,
  pol,
  pod,
  incoterm,
  currency,
  productName,
  hsCode,
  bagsCount,
  netWeightMT,
  unitPricePerMT,
  totalAmount,
  amountInWords,
}: {
  shipment: Shipment;
  exporterName: string;
  exporterAddress: string;
  buyerName: string;
  buyerAddress: string;
  buyerCountry: string;
  pol: string;
  pod: string;
  incoterm: string;
  currency: string;
  productName: string;
  hsCode: string;
  bagsCount: number;
  netWeightMT: number;
  unitPricePerMT: number;
  totalAmount: number;
  amountInWords: string;
}) {
  return (
    <div className="doc-content-wrapper">
      <div className="doc-title-bar">
        <h2>PROFORMA INVOICE</h2>
      </div>

      <div className="doc-two-col-grid">
        <div className="doc-box">
          <span className="doc-box-tag">BUYER / CONSIGNEE:</span>
          <b className="doc-entity-name">{buyerName}</b>
          <p className="doc-entity-address">{buyerAddress}, {buyerCountry}</p>
          <p className="doc-entity-contact">Tel: +971 4 223 4567 | Email: procurement@albarakahfoods.ae</p>
          <p className="doc-entity-contact">Contact Person: <b>Mr. Tariq Al-Mansoor</b></p>
        </div>

        <div className="doc-box">
          <div className="meta-pair">
            <span className="meta-label">Invoice No.:</span>
            <b className="meta-value">PI/IEI-DXB/X/2026/001</b>
          </div>
          <div className="meta-pair">
            <span className="meta-label">Date:</span>
            <span className="meta-value">October 31, 2026</span>
          </div>
          <div className="meta-pair">
            <span className="meta-label">Validity:</span>
            <span className="meta-value">November 14, 2026 (14 Days)</span>
          </div>
          <div className="meta-pair">
            <span className="meta-label">Buyer Ref:</span>
            <span className="meta-value">{shipment.poNumber || "ABF/LOI/2026/108"}</span>
          </div>
        </div>
      </div>

      <div className="doc-terms-panel">
        <div className="doc-terms-header">SHIPPING & COMMERCIAL TERMS</div>
        <div className="doc-terms-grid">
          <div>
            <span className="terms-lbl">Port of Loading:</span>
            <b className="terms-val">{pol}</b>
          </div>
          <div>
            <span className="terms-lbl">Incoterm:</span>
            <b className="terms-val">{incoterm} Makassar (Incoterms 2020)</b>
          </div>
          <div>
            <span className="terms-lbl">Port of Discharge:</span>
            <b className="terms-val">{pod}</b>
          </div>
          <div>
            <span className="terms-lbl">Est. Shipment:</span>
            <b className="terms-val">Within 21 days after Advance Payment</b>
          </div>
          <div className="col-span-full">
            <span className="terms-lbl">Payment Terms:</span>
            <b className="terms-val">
              Telegraphic Transfer (T/T) - 50% Advance Payment, 50% against Copy of B/L
            </b>
          </div>
        </div>
      </div>

      <table className="doc-table-pro">
        <thead>
          <tr>
            <th style={{ width: "40px" }}>No</th>
            <th>Description of Goods</th>
            <th style={{ width: "110px" }}>HS Code</th>
            <th style={{ width: "110px", textAlign: "right" }}>Qty (MT)</th>
            <th style={{ width: "130px", textAlign: "right" }}>Unit Price</th>
            <th style={{ width: "140px", textAlign: "right" }}>Total Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="text-center font-bold">1</td>
            <td>
              <b className="table-product-title">{productName}</b>
              <ul className="table-product-specs">
                <li>Specification: Grade A Export Quality, Moisture Max 2.5%, Mesh 16-18, Purity 99%</li>
                <li>Packing: 20 kg net / Multiwall Kraft Paper Bag with PE Inner Liner</li>
                <li>Total Volume: {formatNumber(bagsCount)} Bags loaded in 1 x 20' FCL (Dry Food Grade Container)</li>
              </ul>
            </td>
            <td className="font-mono text-center">{hsCode}</td>
            <td className="text-right font-bold">{formatNumber(netWeightMT, 2)} MT</td>
            <td className="text-right">{formatMoney(unitPricePerMT, currency)} / MT</td>
            <td className="text-right font-bold text-slate-900">{formatMoney(totalAmount, currency)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr className="doc-table-total-row">
            <td colSpan={4} className="text-right font-bold">
              TOTAL {incoterm} MAKASSAR (INCOTERMS 2020)
            </td>
            <td colSpan={2} className="text-right font-bold text-lg text-blue-900">
              {currency} {formatNumber(totalAmount, 2)}
            </td>
          </tr>
        </tfoot>
      </table>

      <div className="doc-words-banner">
        <span>Say:</span> <i>{amountInWords}</i>
      </div>

      <div className="doc-bank-card">
        <div className="bank-card-title">
          <Landmark size={15} />
          <span>BANK DETAILS FOR BENEFICIARY</span>
        </div>
        <div className="bank-card-grid">
          <div><span className="b-lbl">Bank Name:</span> <b>PT. Bank Mandiri (Persero) Tbk - KCP Makassar Panakkukang</b></div>
          <div><span className="b-lbl">Account Name:</span> <b>{exporterName}</b></div>
          <div><span className="b-lbl">Bank Address:</span> <span>Jl. Boulevard, Panakkukang, Makassar, South Sulawesi, Indonesia</span></div>
          <div><span className="b-lbl">Account Number:</span> <b className="font-mono text-blue-700">152-00-9876543-2 (USD Account)</b></div>
          <div><span className="b-lbl">SWIFT Code:</span> <b className="font-mono">BMRIIDJA</b></div>
          <div><span className="b-lbl">Currency:</span> <b>USD (United States Dollar)</b></div>
        </div>
      </div>

      <div className="doc-dual-signatures">
        <div className="sig-side">
          <span className="sig-header-txt">Confirmed and Accepted by:</span>
          <b>{buyerName}</b>
          <div className="sig-box-space">
            <div className="sig-placeholder">[Signature & Stamp]</div>
          </div>
          <b className="sig-name">Tariq Al-Mansoor</b>
          <span className="sig-sub">Procurement Director</span>
        </div>

        <div className="sig-side">
          <span className="sig-header-txt">Issued by:</span>
          <b>{exporterName}</b>
          <div className="sig-box-space">
            <OfficialStampAndSignature exporterName={exporterName} role="Export Director" />
          </div>
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// 2. SALES CONTRACT (SC) COMPONENT
// --------------------------------------------------------------------------
function SalesContractDoc({
  exporterName,
  exporterAddress,
  buyerName,
  buyerAddress,
  buyerCountry,
  pol,
  pod,
  incoterm,
  currency,
  productName,
  hsCode,
  bagsCount,
  netWeightMT,
  unitPricePerMT,
  totalAmount,
  amountInWords,
}: {
  shipment: Shipment;
  exporterName: string;
  exporterAddress: string;
  buyerName: string;
  buyerAddress: string;
  buyerCountry: string;
  pol: string;
  pod: string;
  incoterm: string;
  currency: string;
  productName: string;
  hsCode: string;
  bagsCount: number;
  netWeightMT: number;
  unitPricePerMT: number;
  totalAmount: number;
  amountInWords: string;
}) {
  return (
    <div className="doc-content-wrapper">
      <div className="doc-title-bar">
        <h2>SALES CONTRACT</h2>
      </div>

      <div className="doc-contract-ref-bar">
        <span>Contract No: <b>SC/IEI-ABF/XI/2026/001</b></span>
        <span>|</span>
        <span>Date: <b>November 2, 2026</b></span>
      </div>

      <p className="doc-preamble-text">
        This Sales Contract is made and entered into by and between:
      </p>

      <div className="doc-contract-parties-grid">
        <div className="contract-party-card">
          <div className="contract-party-header">THE SELLER</div>
          <b className="party-name">{exporterName}</b>
          <p className="party-address">{exporterAddress}</p>
          <p className="party-phone">Phone: +62 812 3456 7890 | Email: official@indicoexport.com</p>
          <p className="party-tax">NPWP: 01.234.567.8-801.000</p>
        </div>

        <div className="contract-party-card">
          <div className="contract-party-header">THE BUYER</div>
          <b className="party-name">{buyerName}</b>
          <p className="party-address">{buyerAddress}, {buyerCountry}</p>
          <p className="party-phone">Phone: +971 4 223 4567 | Email: procurement@albarakahfoods.ae</p>
          <p className="party-tax">Attn: Mr. Tariq Al-Mansoor (Procurement Director)</p>
        </div>
      </div>

      <div className="contract-articles-wrapper">
        {/* Article 1 */}
        <div className="contract-article-block">
          <h4 className="article-title">ARTICLE 1: COMMODITY & SPECIFICATION</h4>
          <p>
            <b>Commodity:</b> {productName} | <b>HS Code:</b> {hsCode}
          </p>
          <p>
            <b>Quality:</b> Grade A Export Quality, Moisture &le; 2.5%, Granule Size Mesh 16-18, Solubility 99%,
            Reducing Sugar Max 6%, Sucrose 80-85%, Lead (Pb) &lt; 0.2 mg/kg.
          </p>
        </div>

        {/* Article 2 */}
        <div className="contract-article-block">
          <h4 className="article-title">ARTICLE 2: QUANTITY, PACKING & PRICE</h4>
          <p>
            <b>Quantity:</b> {formatNumber(netWeightMT, 0)} Metric Tons ({formatNumber(netWeightMT * 1000, 0)} Kgs) +/- 2% tolerance at Seller&apos;s option.
          </p>
          <p>
            <b>Packing:</b> Packed in 20 kg net weight food-grade PE inner liner and 3-ply Kraft Paper outer bag.
            Total {formatNumber(bagsCount)} bags loaded in 1 x 20ft Dry Container (Food Grade Container).
          </p>
          <p>
            <b>Unit Price:</b> {currency} {formatNumber(unitPricePerMT, 2)} / MT {incoterm} Makassar Port, Indonesia (Incoterms 2020).
          </p>
          <p>
            <b>Total Value:</b> {currency} {formatNumber(totalAmount, 2)} (Say: {amountInWords}).
          </p>
        </div>

        {/* Article 3 */}
        <div className="contract-article-block">
          <h4 className="article-title">ARTICLE 3: TERMS OF PAYMENT</h4>
          <p>
            Payment shall be made by Telegraphic Transfer (T/T) to Seller&apos;s designated bank account
            (PT. Bank Mandiri (Persero) Tbk, Acc No: 152-00-9876543-2, SWIFT: BMRIIDJA) as follows:
          </p>
          <ol className="article-ordered-list">
            <li>
              <b>50% Down Payment ({currency} {formatNumber(totalAmount * 0.5, 2)})</b> payable within 3 (three) working days after signing this contract.
            </li>
            <li>
              <b>50% Balance Payment ({currency} {formatNumber(totalAmount * 0.5, 2)})</b> payable within 5 (five) working days against scanned copies of full set shipping documents. Original documents will be released via courier (DHL/FedEx) or Telex Release upon receipt of 100% full payment.
            </li>
          </ol>
        </div>

        {/* Article 4 */}
        <div className="contract-article-block">
          <h4 className="article-title">ARTICLE 4: SHIPMENT TERMS</h4>
          <p>
            <b>Port of Loading:</b> {pol} | <b>Port of Discharge:</b> {pod}
          </p>
          <p>
            <b>Latest Shipment:</b> November 25, 2026 | <b>Partial Shipment:</b> Not Allowed | <b>Transshipment:</b> Allowed
          </p>
        </div>

        {/* Article 5 */}
        <div className="contract-article-block">
          <h4 className="article-title">ARTICLE 5: REQUIRED DOCUMENTS</h4>
          <p>
            Seller shall provide the following documents to the Buyer: (1) Full Set (3/3) Original Clean on Board Ocean Bill of Lading; (2) Signed Commercial Invoice in 3 originals; (3) Signed Packing List in 3 originals; (4) Certificate of Origin (COO) issued by Indonesian Chamber of Commerce / Ministry of Trade; (5) Phytosanitary Certificate issued by Indonesian Agricultural Quarantine Agency; (6) Certificate of Analysis (COA) and Halal Certificate.
          </p>
        </div>

        {/* Article 6 */}
        <div className="contract-article-block">
          <h4 className="article-title">ARTICLE 6: FORCE MAJEURE & ARBITRATION</h4>
          <p>
            Neither party shall be liable for any delay or failure to perform due to Force Majeure (natural disasters, war, government embargo). Any disputes arising from this contract shall be settled amicably. If amicable settlement fails, the dispute shall be submitted to the Indonesian National Board of Arbitration (BANI) in accordance with ICC rules.
          </p>
        </div>
      </div>

      <p className="doc-witness-clause">
        IN WITNESS WHEREOF, both parties have executed this Contract in duplicate with equal legal force.
      </p>

      <div className="doc-dual-signatures">
        <div className="sig-side">
          <span className="sig-header-txt">THE BUYER</span>
          <b>For {buyerName}</b>
          <div className="sig-box-space">
            <div className="sig-placeholder">[Signature & Stamp]</div>
          </div>
          <b className="sig-name">Tariq Al-Mansoor</b>
          <span className="sig-sub">Procurement Director</span>
        </div>

        <div className="sig-side">
          <span className="sig-header-txt">THE SELLER</span>
          <b>For {exporterName}</b>
          <div className="sig-box-space">
            <OfficialStampAndSignature exporterName={exporterName} role="Export Director" />
          </div>
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// 3. COMMERCIAL INVOICE (CI) COMPONENT
// --------------------------------------------------------------------------
function CommercialInvoiceDoc({
  exporterName,
  buyerName,
  buyerAddress,
  buyerCountry,
  pol,
  pod,
  incoterm,
  currency,
  productName,
  hsCode,
  bagsCount,
  netWeightKgs,
  grossWeightKgs,
  netWeightMT,
  unitPricePerMT,
  totalAmount,
  amountInWords,
}: {
  shipment: Shipment;
  exporterName: string;
  exporterAddress: string;
  buyerName: string;
  buyerAddress: string;
  buyerCountry: string;
  pol: string;
  pod: string;
  incoterm: string;
  currency: string;
  productName: string;
  hsCode: string;
  bagsCount: number;
  netWeightKgs: number;
  grossWeightKgs: number;
  netWeightMT: number;
  unitPricePerMT: number;
  totalAmount: number;
  amountInWords: string;
}) {
  return (
    <div className="doc-content-wrapper">
      <div className="doc-title-bar">
        <h2>COMMERCIAL INVOICE</h2>
      </div>

      <div className="doc-two-col-grid">
        <div className="doc-parties-column">
          <div className="doc-box">
            <span className="doc-box-tag">SHIPPER / EXPORTER:</span>
            <b className="doc-entity-name">{exporterName}</b>
            <p className="doc-entity-address">Jl. Adiyaksa Baru No. 1B, Kec. Panakkukang, Kota Makassar, Sulawesi Selatan, Indonesia</p>
          </div>

          <div className="doc-box">
            <span className="doc-box-tag">CONSIGNEE / BUYER:</span>
            <b className="doc-entity-name">{buyerName}</b>
            <p className="doc-entity-address">{buyerAddress}, {buyerCountry}</p>
            <p className="doc-entity-contact">Tel: +971 4 223 4567 | Email: procurement@albarakahfoods.ae</p>
          </div>

          <div className="doc-box">
            <span className="doc-box-tag">NOTIFY PARTY:</span>
            <b className="doc-entity-name">Same as Consignee</b>
          </div>
        </div>

        <div className="doc-reference-column">
          <div className="doc-box">
            <div className="meta-pair"><span className="meta-label">Invoice No.:</span> <b className="meta-value font-mono">INV/IEI-DXB/XI/2026/001</b></div>
            <div className="meta-pair"><span className="meta-label">Date:</span> <span className="meta-value">November 20, 2026</span></div>
            <div className="meta-pair"><span className="meta-label">Sales Contract No.:</span> <b className="meta-value font-mono">SC/IEI-ABF/XI/2026/001</b></div>
            <div className="meta-pair"><span className="meta-label">Payment Terms:</span> <span className="meta-value">Telegraphic Transfer (T/T)</span></div>
          </div>

          <div className="doc-box transport-box">
            <span className="doc-box-tag">TRANSPORT DETAILS:</span>
            <div className="meta-pair"><span className="meta-label">Vessel / Voyage:</span> <b className="meta-value">KMTC SHIMIZU V.2611N</b></div>
            <div className="meta-pair"><span className="meta-label">Port of Loading:</span> <span className="meta-value">{pol}</span></div>
            <div className="meta-pair"><span className="meta-label">Port of Discharge:</span> <span className="meta-value">{pod}</span></div>
            <div className="meta-pair"><span className="meta-label">Container / Seal:</span> <b className="meta-value font-mono">TGHU 2468135 / IDMKS998877 (1x20&apos; FCL)</b></div>
            <div className="meta-pair"><span className="meta-label">B/L Number:</span> <b className="meta-value font-mono">KMTC-MKS0091827</b></div>
          </div>
        </div>
      </div>

      <table className="doc-table-pro">
        <thead>
          <tr>
            <th style={{ width: "160px" }}>Marks & Nos</th>
            <th>Description of Goods</th>
            <th style={{ width: "120px", textAlign: "right" }}>Quantity</th>
            <th style={{ width: "120px", textAlign: "right" }}>Unit Price</th>
            <th style={{ width: "140px", textAlign: "right" }}>Total Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="font-mono text-xs">
              <b>AL BARAKAH</b><br />
              DUBAI - UAE<br />
              BATCH: 11/26<br />
              PROD: 11/2026<br />
              EXP: 11/2028<br />
              <b>MADE IN INDONESIA</b>
            </td>
            <td>
              <b className="table-product-title">{productName.toUpperCase()}</b>
              <p className="text-xs text-slate-600 mt-1">HS CODE: {hsCode}</p>
              <p className="text-xs text-slate-600">Packing: 20 Kg Net / Multiwall Kraft Paper Bag</p>
              <p className="text-xs text-slate-600">Total Packages: {formatNumber(bagsCount)} Bags</p>
              <p className="text-xs font-semibold text-slate-800 mt-1">
                Net Weight: {formatNumber(netWeightKgs, 2)} Kgs | Gross Weight: {formatNumber(grossWeightKgs, 2)} Kgs
              </p>
              <p className="text-xs text-slate-600">Country of Origin: Indonesia</p>
            </td>
            <td className="text-right font-bold">
              {formatNumber(bagsCount)} Bags<br />
              <span className="text-xs font-normal text-slate-500">({formatNumber(netWeightMT, 2)} MT Net)</span>
            </td>
            <td className="text-right">
              {currency} {formatNumber(unitPricePerMT, 2)}<br />
              <span className="text-xs text-slate-500">/ MT</span>
            </td>
            <td className="text-right font-bold text-slate-900 text-base">
              {currency} {formatNumber(totalAmount, 2)}
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr className="doc-table-total-row">
            <td colSpan={4} className="text-right font-bold">
              TOTAL {incoterm} MAKASSAR (INCOTERMS 2020)
            </td>
            <td className="text-right font-bold text-lg text-blue-900">
              {currency} {formatNumber(totalAmount, 2)}
            </td>
          </tr>
        </tfoot>
      </table>

      <div className="doc-words-banner">
        <span>Amount in Words:</span> <b>{amountInWords}</b>
      </div>

      <div className="doc-cert-banner">
        <ShieldCheck size={16} className="text-blue-700 flex-shrink-0" />
        <p>
          We hereby certify that this invoice shows the actual price of the goods described, that no other invoice has been or will be issued, and that all particulars are true and correct.
        </p>
      </div>

      <div className="doc-single-signature-wrap">
        <OfficialStampAndSignature exporterName={exporterName} role="Export Director" />
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// 4. PACKING LIST (PL) COMPONENT
// --------------------------------------------------------------------------
function PackingListDoc({
  exporterName,
  buyerName,
  buyerAddress,
  buyerCountry,
  pol,
  pod,
  productName,
  hsCode,
  bagsCount,
  netWeightKgs,
  grossWeightKgs,
  netWeightMT,
  grossWeightMT,
  totalCBM,
}: {
  shipment: Shipment;
  exporterName: string;
  exporterAddress: string;
  buyerName: string;
  buyerAddress: string;
  buyerCountry: string;
  pol: string;
  pod: string;
  productName: string;
  hsCode: string;
  bagsCount: number;
  netWeightKgs: number;
  grossWeightKgs: number;
  netWeightMT: number;
  grossWeightMT: number;
  totalCBM: number;
}) {
  return (
    <div className="doc-content-wrapper">
      <div className="doc-title-bar">
        <h2>PACKING LIST</h2>
      </div>

      <div className="doc-two-col-grid">
        <div className="doc-parties-column">
          <div className="doc-box">
            <span className="doc-box-tag">SHIPPER / EXPORTER:</span>
            <b className="doc-entity-name">{exporterName}</b>
            <p className="doc-entity-address">Jl. Adiyaksa Baru No. 1B, Kec. Panakkukang, Kota Makassar, Sulawesi Selatan, Indonesia</p>
          </div>

          <div className="doc-box">
            <span className="doc-box-tag">CONSIGNEE:</span>
            <b className="doc-entity-name">{buyerName}</b>
            <p className="doc-entity-address">{buyerAddress}, {buyerCountry}</p>
            <p className="doc-entity-contact">Tel: +971 4 223 4567 | Email: procurement@albarakahfoods.ae</p>
          </div>

          <div className="doc-box">
            <span className="doc-box-tag">NOTIFY PARTY:</span>
            <b className="doc-entity-name">Same as Consignee</b>
          </div>
        </div>

        <div className="doc-reference-column">
          <div className="doc-box">
            <div className="meta-pair"><span className="meta-label">Packing List No.:</span> <b className="meta-value font-mono">PL/IEI-DXB/XI/2026/001</b></div>
            <div className="meta-pair"><span className="meta-label">Invoice No.:</span> <b className="meta-value font-mono">INV/IEI-DXB/XI/2026/001</b></div>
            <div className="meta-pair"><span className="meta-label">Date:</span> <span className="meta-value">November 20, 2026</span></div>
            <div className="meta-pair"><span className="meta-label">Sales Contract No.:</span> <b className="meta-value font-mono">SC/IEI-ABF/XI/2026/001</b></div>
          </div>

          <div className="doc-box transport-box">
            <span className="doc-box-tag">TRANSPORT DETAILS:</span>
            <div className="meta-pair"><span className="meta-label">Vessel / Voyage:</span> <b className="meta-value">KMTC SHIMIZU V.2611N</b></div>
            <div className="meta-pair"><span className="meta-label">Port of Loading:</span> <span className="meta-value">{pol}</span></div>
            <div className="meta-pair"><span className="meta-label">Port of Discharge:</span> <span className="meta-value">{pod}</span></div>
            <div className="meta-pair"><span className="meta-label">Container / Seal:</span> <b className="meta-value font-mono">TGHU 2468135 / IDMKS998877 (1x20&apos; FCL)</b></div>
            <div className="meta-pair"><span className="meta-label">B/L Number:</span> <b className="meta-value font-mono">KMTC-MKS0091827</b></div>
          </div>
        </div>
      </div>

      <table className="doc-table-pro">
        <thead>
          <tr>
            <th style={{ width: "150px" }}>Marks & Nos</th>
            <th>Description of Goods & Packing Spec</th>
            <th style={{ width: "95px", textAlign: "right" }}>Qty (Bags)</th>
            <th style={{ width: "115px", textAlign: "right" }}>Net Weight</th>
            <th style={{ width: "115px", textAlign: "right" }}>Gross Weight</th>
            <th style={{ width: "95px", textAlign: "right" }}>Meas. (CBM)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="font-mono text-xs">
              <b>AL BARAKAH</b><br />
              DUBAI - UAE<br />
              BATCH: 11/26<br />
              PROD: 11/2026<br />
              EXP: 11/2028
            </td>
            <td>
              <b className="table-product-title">{productName}</b>
              <p className="text-xs text-slate-600 mt-1">HS Code: {hsCode}</p>
              <div className="text-xs text-slate-700 mt-2">
                <b>Packing Specification:</b>
                <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
                  <li>@ 20.00 Kg Net Weight / Bag</li>
                  <li>@ 20.25 Kg Gross Weight / Bag</li>
                  <li>Bag Dimension: 60 x 40 x 12 cm</li>
                  <li>Inner: Food Grade PE Plastic Liner</li>
                  <li>Outer: 3-Ply Heavy Duty Kraft Paper Bag</li>
                </ul>
              </div>
            </td>
            <td className="text-right font-bold">{formatNumber(bagsCount)} Bags</td>
            <td className="text-right font-bold">
              {formatNumber(netWeightKgs, 2)} Kgs<br />
              <span className="text-xs font-normal text-slate-500">({formatNumber(netWeightMT, 2)} MT)</span>
            </td>
            <td className="text-right font-bold">
              {formatNumber(grossWeightKgs, 2)} Kgs<br />
              <span className="text-xs font-normal text-slate-500">({formatNumber(grossWeightMT, 3)} MT)</span>
            </td>
            <td className="text-right font-bold text-slate-900">{formatNumber(totalCBM, 3)} CBM</td>
          </tr>
        </tbody>
        <tfoot>
          <tr className="doc-table-total-row">
            <td colSpan={2} className="text-right font-bold">TOTAL:</td>
            <td className="text-right font-bold text-blue-900">{formatNumber(bagsCount)} Bags</td>
            <td className="text-right font-bold text-blue-900">{formatNumber(netWeightKgs, 2)} Kgs</td>
            <td className="text-right font-bold text-blue-900">{formatNumber(grossWeightKgs, 2)} Kgs</td>
            <td className="text-right font-bold text-blue-900">{formatNumber(totalCBM, 3)} CBM</td>
          </tr>
        </tfoot>
      </table>

      <div className="doc-single-signature-wrap">
        <OfficialStampAndSignature exporterName={exporterName} role="Export Director" />
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// 5. SHIPPING INSTRUCTION (SI) COMPONENT
// --------------------------------------------------------------------------
function ShippingInstructionDoc({
  exporterName,
  buyerName,
  buyerAddress,
  pol,
  pod,
  incoterm,
  productName,
  hsCode,
  bagsCount,
  netWeightKgs,
  grossWeightKgs,
  totalCBM,
}: {
  shipment: Shipment;
  exporterName: string;
  exporterAddress: string;
  buyerName: string;
  buyerAddress: string;
  pol: string;
  pod: string;
  incoterm: string;
  productName: string;
  hsCode: string;
  bagsCount: number;
  netWeightKgs: number;
  grossWeightKgs: number;
  totalCBM: number;
}) {
  return (
    <div className="doc-content-wrapper">
      <div className="doc-title-bar">
        <h2>SHIPPING INSTRUCTION (SI)</h2>
      </div>

      <div className="doc-si-header-grid">
        <div><span className="si-lbl">SI Number:</span> <b className="font-mono">SI/IEI/XI/2026/001</b></div>
        <div><span className="si-lbl">To (Forwarder/Line):</span> <b>PT. Samudera Logistik Nusantara</b></div>
        <div><span className="si-lbl">Date:</span> <span>November 16, 2026</span></div>
        <div><span className="si-lbl">Attention:</span> <b>Export Booking & Documentation Dept.</b></div>
        <div><span className="si-lbl">Contract Ref:</span> <b className="font-mono">SC/IEI-ABF/XI/2026/001</b></div>
        <div><span className="si-lbl">Invoice Ref:</span> <b className="font-mono">INV/IEI-DXB/XI/2026/001</b></div>
      </div>

      <div className="doc-three-col-parties">
        <div className="si-party-card">
          <div className="si-party-tag">SHIPPER (To appear on B/L)</div>
          <b className="party-title">{exporterName}</b>
          <p className="party-txt">Jl. Adiyaksa Baru No. 1B, Kec. Panakkukang, Kota Makassar, Sulawesi Selatan, Indonesia</p>
          <p className="party-txt">Tel: +62 812 3456 7890 | Email: official@indicoexport.com</p>
          <p className="party-txt font-mono">NPWP: 01.234.567.8-801.000</p>
        </div>

        <div className="si-party-card">
          <div className="si-party-tag">CONSIGNEE (To appear on B/L)</div>
          <b className="party-title">{buyerName}</b>
          <p className="party-txt">{buyerAddress}</p>
          <p className="party-txt">Tel: +971 4 223 4567</p>
          <p className="party-txt">Email: procurement@albarakahfoods.ae</p>
        </div>

        <div className="si-party-card">
          <div className="si-party-tag">NOTIFY PARTY (To appear on B/L)</div>
          <b className="party-title">SAME AS CONSIGNEE</b>
          <p className="party-txt mt-2">{buyerName}</p>
          <p className="party-txt">Contact: Mr. Tariq Al-Mansoor</p>
          <p className="party-txt">Tel: +971 4 223 4567</p>
        </div>
      </div>

      <div className="doc-transport-row-strip">
        <div className="strip-item">
          <span className="strip-lbl">Vessel / Voyage</span>
          <b className="strip-val">KMTC SHIMIZU V.2611N</b>
          <small className="strip-sub">ETD: Nov 21, 2026</small>
        </div>
        <div className="strip-item">
          <span className="strip-lbl">Port of Loading (POL)</span>
          <b className="strip-val">{pol}</b>
        </div>
        <div className="strip-item">
          <span className="strip-lbl">Port of Discharge (POD)</span>
          <b className="strip-val">{pod}</b>
        </div>
        <div className="strip-item">
          <span className="strip-lbl">Container & Stuffing</span>
          <b className="strip-val">1 x 20&apos; GP (Food Grade)</b>
          <small className="strip-sub">Stuffing: Nov 18, 2026</small>
        </div>
      </div>

      <table className="doc-table-pro">
        <thead>
          <tr>
            <th style={{ width: "150px" }}>Marks & Numbers</th>
            <th style={{ width: "160px" }}>No. of Pkgs</th>
            <th>Description of Goods (On B/L)</th>
            <th style={{ width: "130px", textAlign: "right" }}>Weight (Kgs)</th>
            <th style={{ width: "110px", textAlign: "right" }}>Measurement</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="font-mono text-xs">
              <b>AL BARAKAH</b><br />
              DUBAI - UAE<br />
              BATCH: 11/26<br />
              PROD: 11/2026<br />
              EXP: 11/2028<br />
              <b>MADE IN INDONESIA</b>
            </td>
            <td>
              <b>{formatNumber(bagsCount)} BAGS</b><br />
              <span className="text-xs text-slate-600">
                (Nine Hundred Multiwall Kraft Paper Bags)
              </span>
            </td>
            <td>
              <b className="table-product-title">{productName.toUpperCase()}</b>
              <p className="text-xs text-slate-600 mt-1">
                Packed in 20 Kg Net Multiwall Kraft Paper Bags with Inner Food-Grade PE Liner.
              </p>
              <p className="text-xs font-mono text-slate-700 mt-1">HS CODE: {hsCode}</p>
              <p className="text-xs font-mono font-bold text-slate-800">
                CONT / SEAL NO.: TGHU 2468135 / IDMKS998877
              </p>
              <p className="text-xs font-bold text-slate-800">COUNTRY OF ORIGIN: INDONESIA</p>
            </td>
            <td className="text-right">
              <div className="text-xs text-slate-500">NET:</div>
              <b className="text-sm">{formatNumber(netWeightKgs, 2)}</b> KGS
              <div className="text-xs text-slate-500 mt-2">GROSS:</div>
              <b className="text-sm">{formatNumber(grossWeightKgs, 2)}</b> KGS
            </td>
            <td className="text-right font-bold text-slate-900 text-sm">
              {formatNumber(totalCBM, 3)} CBM
            </td>
          </tr>
        </tbody>
      </table>

      <div className="doc-instructions-box">
        <h4 className="instructions-title">BILL OF LADING & FREIGHT INSTRUCTIONS:</h4>
        <ol className="instructions-list">
          <li>
            <b>Type of Bill of Lading:</b> Full Set (3/3) Original Clean on Board Ocean Bill of Lading + 3 Non-Negotiable Copies.
          </li>
          <li>
            <b>Freight Term:</b> {incoterm === "FOB" ? "FREIGHT COLLECT" : "FREIGHT PREPAID"} (Incoterm: {incoterm} Makassar Port, Incoterms 2020).
          </li>
          <li>
            <b>Container Requirement:</b> Please provide a Clean, Dry, Odorless, Food-Grade 20ft GP Container suitable for foodstuff.
          </li>
          <li>
            <b>Verification:</b> Please send us the Draft B/L and Draft PEB (Pemberitahuan Ekspor Barang) for our verification and approval prior to final issuance.
          </li>
          <li>
            <b>Release Coordination:</b> Please confirm container release order (RO/DO Empty) and closing time schedule to our warehouse team.
          </li>
        </ol>
      </div>

      <div className="doc-single-signature-wrap">
        <div className="official-sig-block">
          <span className="sig-signed-for">Issued by Shipper / Exporter:</span>
          <b className="sig-company-name">{exporterName}</b>
          <div className="sig-canvas-zone">
            <div className="official-stamp-seal">
              <div className="stamp-seal-circle">
                <span className="stamp-seal-text-top">{exporterName}</span>
                <div className="stamp-seal-center">
                  <Award size={18} />
                  <span>LOGISTICS DEPT</span>
                  <small>SHIPPING ORDER</small>
                </div>
                <span className="stamp-seal-text-bottom">INDONESIA</span>
              </div>
            </div>
            <div className="sig-line-mark">[Signature & Company Stamp]</div>
          </div>
          <b className="sig-signatory-name">Logistics & Export Manager</b>
          <span className="sig-signatory-title">Authorized Signature & Company Stamp</span>
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// Collapsible Document Settings Panel
// --------------------------------------------------------------------------
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

  const templates: { name: DocumentTemplate; badge: string; detail: string }[] = [
    {
      name: "Corporate Clean",
      badge: "Modern & Direkomendasikan",
      detail: "Identitas korporat modern dengan header navy pekat, badge pabean jelas, dan hierarki data elegan.",
    },
    {
      name: "Classic Trade",
      badge: "Standar Perbankan / L/C",
      detail: "Format formal perbankan dengan border terstruktur ketat, garis ganda, dan kepatuhan ICC UCP 600.",
    },
    {
      name: "Minimal",
      badge: "Kontemporer Ringkas",
      detail: "Desain ringkas kontemporer dengan hairline borders, optimal whitespace, dan tipografi Swiss bersih.",
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
            <span>PENGATURAN KOP SURAT & FORMAT 5 DOKUMEN EKSPOR</span>
          </div>
          <h3 className="doc-settings-heading">Konfigurasi Identitas Resmi & Parameter Ekspor</h3>
          <p className="doc-settings-sub">
            Atur identitas kop surat perusahaan eksportir, pelabuhan muat, nomor kontainer/segel, ukuran kertas, dan gaya template cetak.
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
            <h4>1. Format Kertas & Output</h4>
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
              label="Bahasa Dokumen"
              value={shipment.previewLanguage}
              onChange={changeLanguage}
            >
              <option value="English">English · Standar Resmi Ekspor Global</option>
              <option value="Bahasa Indonesia">Bahasa Indonesia · Pratinjau Internal</option>
            </SelectField>

            <div className="doc-settings-note">
              Dokumen ekspor (PI, SC, CI, PL, SI) dicetak dalam <b>English</b> sesuai ketentuan perdagangan internasional (ICC Incoterms & Kepabeanan).
            </div>
          </div>
        </div>

        {/* Kolom 2: Identitas Kop Surat & Port */}
        <div className="doc-settings-card">
          <div className="doc-settings-card-header">
            <h4>2. Identitas Eksportir & Pelabuhan</h4>
            <p>Informasi perusahaan yang dicetak pada kepala surat dokumen.</p>
          </div>
          <div className="doc-settings-card-fields">
            <Field
              label="Nama Perusahaan Eksportir"
              value={shipment.exporter}
              placeholder="Contoh: PT. INDICO EXPORT INDONESIA"
              onChange={(value) => update("exporter", value)}
            />

            <Field
              label="Pelabuhan Muat / Port of Loading (POL)"
              value={shipment.namedPlace}
              placeholder="Contoh: Makassar New Port, South Sulawesi, Indonesia"
              onChange={(value) => update("namedPlace", value)}
            />

            <Field
              label="Alamat & Kontak Kop Surat"
              value={shipment.letterheadText}
              placeholder="Jl. Adiyaksa Baru No. 1B, Makassar..."
              onChange={(value) => update("letterheadText", value)}
            />

            {/* Custom Logo Upload Dropzone */}
            <div className="doc-logo-field">
              <label className="field-label">Logo Resmi Perusahaan Eksportir</label>
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
            <h4>3. Gaya Desain Template Eksekutif</h4>
            <p>Pilih gaya estetika dokumen yang sesuai dengan profil perusahaan.</p>
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
