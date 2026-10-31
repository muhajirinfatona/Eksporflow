import type { ApprovalDecision } from "@/hooks/useWorkspaceFlow";
import { formatMoney, formatNumber, numberToWords } from "@shared/format";
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
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  FileCheck2,
  FileSignature,
  FileText,
  Landmark,
  Printer,
  ShieldCheck,
  Ship,
  SlidersHorizontal,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import React, { useRef, useState } from "react";
import { toast } from "sonner";
import { Field, SelectField } from "./Primitives";

export function DocumentsModule({
  shipment,
  update,
  pricing,
  container,
  selectedDocument,
  setSelectedDocument,
  printDocument,
  navigate,
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
    desc: string;
    icon: React.ReactNode;
  }[] = [
    {
      type: "Proforma Invoice",
      code: "PI",
      desc: "Penawaran awal komersial, spesifikasi & rekening tujuan",
      icon: <FileText size={18} />,
    },
    {
      type: "Sales Contract",
      code: "SC",
      desc: "Kontrak resmi jual-beli ekspor (Articles 1 s/d 6)",
      icon: <FileSignature size={18} />,
    },
    {
      type: "Commercial Invoice",
      code: "CI",
      desc: "Faktur komersial penetapan pabean & bea cukai pelabuhan",
      icon: <FileCheck2 size={18} />,
    },
    {
      type: "Packing List",
      code: "PL",
      desc: "Rincian spesifikasi koli, dimensi, net & gross weight",
      icon: <ClipboardList size={18} />,
    },
    {
      type: "Shipping Instruction",
      code: "SI",
      desc: "Instruksi pengapalan resmi ke forwarder / pelayaran untuk B/L",
      icon: <Ship size={18} />,
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
    const nextReviewed = !shipment.documentReviewed;
    update("documentReviewed", nextReviewed);
    if (nextReviewed) {
      update("previewLanguage", "English");
      toast.success("Dokumen ditandai selesai diperiksa", {
        description: "Bahasa dokumen dialihkan kembali ke Bahasa Inggris untuk standar ekspor internasional.",
      });
    } else {
      toast.info("Status dokumen kembali ke draft");
    }
  };

  // Kalkulasi data turunan terpadu
  const exporterName = shipment.exporter || "PT. INDICO EXPORT INDONESIA";
  const defaultAddress =
    "Jl. Adiyaksa Baru No. 1B, Kec. Panakkukang, Kota Makassar, Sulawesi Selatan, Indonesia";
  const exporterAddress =
    shipment.letterheadText &&
    shipment.letterheadText.trim().toLowerCase() !== exporterName.trim().toLowerCase() &&
    shipment.letterheadText.length > 15
      ? shipment.letterheadText
      : defaultAddress;

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

  const isId = shipment.previewLanguage === "Bahasa Indonesia";
  const amountInWords = numberToWords(totalAmount, currency, isId ? "id" : "en");

  return (
    <div className="doc-center-root">
      {/* 1. 5 Document Selector Cards */}
      <div className="doc-tabs-grid five-cols" role="tablist">
        {documents.map((doc) => {
          const isActive = selectedDocument === doc.type;
          return (
            <button
              key={doc.type}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`doc-tab-card ${isActive ? "active" : ""}`}
              onClick={() => setSelectedDocument(doc.type)}
            >
              {isActive && <div className="doc-tab-active-indicator" />}
              <div className="doc-tab-top">
                <div className="doc-tab-icon-box">{doc.icon}</div>
                <div className="doc-tab-badges">
                  <span className="doc-code-badge">{doc.code}</span>
                  <span className="doc-ready-badge">● Siap Terbit</span>
                </div>
              </div>
              <div className="doc-tab-body">
                <h3 className="doc-tab-name">{doc.type}</h3>
                <p className="doc-tab-desc">{doc.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* 2. Document Action & Overview Bar */}
      <div className="doc-action-bar">
        <div className="doc-action-info">
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
                {shipment.documentReviewed ? "✓ Selesai Diperiksa" : "Draft Transaksi"}
              </b>
            </span>
          </div>
        </div>

        <div className="doc-action-buttons">
          <button
            type="button"
            className={`doc-btn-toggle-settings ${isSettingsOpen ? "active" : ""}`}
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            title="Sesuaikan ukuran kertas, orientasi, logo, dan kop perusahaan"
          >
            <SlidersHorizontal size={14} />
            <span>{isSettingsOpen ? "Tutup Setelan" : "Setelan Kop & Format"}</span>
            {isSettingsOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          <button
            type="button"
            className="doc-btn-review"
            onClick={finishReview}
            title="Tandai dokumen sudah diperiksa & siap diterbitkan"
          >
            <CheckCircle2 size={14} />
            <span>{shipment.documentReviewed ? "Terverifikasi" : "Selesai Diperiksa"}</span>
          </button>

          <button
            type="button"
            className="doc-btn-print"
            onClick={printDocument}
            title="Cetak atau unduh dokumen resmi dalam format PDF"
          >
            <Printer size={15} />
            <span>Cetak / Unduh PDF</span>
          </button>
        </div>
      </div>

      {/* 2. Collapsible Settings Drawer (only rendered when toggled) */}
      {isSettingsOpen && (
        <DocumentSettings
          shipment={shipment}
          update={update}
          onLetterheadImage={handleLetterheadImage}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* 3. Executive Desk Paper Preview */}
      <div className="doc-paper-desk">
        <div
          className={`paper-document paper-${shipment.paperSize.toLowerCase()} paper-${shipment.documentOrientation.toLowerCase()} paper-template-${shipment.documentTemplate.toLowerCase().replace(" ", "-")}`}
        >
          {/* Official Letterhead Header */}
          <OfficialLetterhead
            shipment={shipment}
            exporterName={exporterName}
            exporterAddress={exporterAddress}
            onOpenSettings={() => setIsSettingsOpen(true)}
            isId={isId}
          />

          {/* Render Specific Document Type */}
          {selectedDocument === "Proforma Invoice" && (
            <ProformaInvoiceDoc
              shipment={shipment}
              exporterName={exporterName}
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
              isId={isId}
            />
          )}

          {selectedDocument === "Sales Contract" && (
            <SalesContractDoc
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
              isId={isId}
            />
          )}

          {selectedDocument === "Commercial Invoice" && (
            <CommercialInvoiceDoc
              exporterName={exporterName}
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
              isId={isId}
            />
          )}

          {selectedDocument === "Packing List" && (
            <PackingListDoc
              exporterName={exporterName}
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
              isId={isId}
            />
          )}

          {(selectedDocument === "Shipping Instruction" ||
            selectedDocument === "Bill of Lading") && (
            <ShippingInstructionDoc
              exporterName={exporterName}
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
              isId={isId}
            />
          )}
        </div>
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
  isId = false,
}: {
  shipment: Shipment;
  exporterName: string;
  exporterAddress: string;
  onOpenSettings: () => void;
  isId?: boolean;
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
            <div
              className="letterhead-crest-badge"
              onClick={onOpenSettings}
              title="Klik untuk memasang logo perusahaan"
              role="button"
              tabIndex={0}
            >
              <Building2 size={24} className="text-slate-700" />
              <span className="crest-tag">IEI</span>
            </div>
          )}
          <div className="letterhead-text">
            <div className="letterhead-top-row">
              <h1 className="company-name">{exporterName}</h1>
              <span className="registered-badge">
                {isId
                  ? "EKSPORTIR TERDAFTAR · TERVALIDASI INSW"
                  : "REGISTERED EXPORTER · INSW VALIDATED"}
              </span>
            </div>
            <p className="company-details">{exporterAddress}</p>
            <p className="company-contact">
              Tel: +62 812 3456 7890 · Email: official@indicoexport.com · NPWP: 01.234.567.8-801.000
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
  isId = false,
}: {
  exporterName: string;
  role?: string;
  showStamp?: boolean;
  isId?: boolean;
}) {
  const displayRole = isId
    ? role === "Export Director"
      ? "Direktur Ekspor"
      : role === "Logistics & Export Manager"
        ? "Manajer Logistik & Ekspor"
        : role
    : role;

  return (
    <div className="official-sig-block">
      <span className="sig-signed-for">
        {isId ? "Ditandatangani untuk dan atas nama:" : "Signed for and on behalf of:"}
      </span>
      <b className="sig-company-name">{exporterName}</b>
      <div className="sig-canvas-zone">
        <div className="sig-line-mark">
          {isId ? "[Tanda Tangan & Stempel Perusahaan]" : "[Signature & Company Stamp]"}
        </div>
      </div>
      <b className="sig-signatory-name">{displayRole}</b>
      <span className="sig-signatory-title">
        {isId ? "Penandatangan Berwenang (Authorized Signatory)" : "Authorized Signatory"}
      </span>
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
  isId = false,
}: {
  shipment: Shipment;
  exporterName: string;
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
  isId?: boolean;
}) {
  return (
    <div className="doc-content-wrapper">
      <div className="doc-title-bar">
        <h2>{isId ? "FAKTUR PROFORMA (PROFORMA INVOICE)" : "PROFORMA INVOICE"}</h2>
      </div>

      <div className="doc-two-col-grid">
        <div className="doc-box">
          <span className="doc-box-tag">
            {isId ? "PEMBELI / PENERIMA (BUYER / CONSIGNEE):" : "BUYER / CONSIGNEE:"}
          </span>
          <b className="doc-entity-name">{buyerName}</b>
          <p className="doc-entity-address">{buyerAddress}, {buyerCountry}</p>
          <p className="doc-entity-contact">Tel: +971 4 223 4567 | Email: procurement@albarakahfoods.ae</p>
          <p className="doc-entity-contact">
            {isId ? "Narahubung:" : "Contact Person:"}{" "}
            <b>Mr. Tariq Al-Mansoor {isId ? "(Direktur Pengadaan)" : "(Procurement Director)"}</b>
          </p>
        </div>

        <div className="doc-box">
          <div className="meta-pair">
            <span className="meta-label">{isId ? "No. Faktur:" : "Invoice No.:"}</span>
            <b className="meta-value font-mono">PI/IEI-DXB/X/2026/001</b>
          </div>
          <div className="meta-pair">
            <span className="meta-label">{isId ? "Tanggal:" : "Date:"}</span>
            <span className="meta-value">{isId ? "31 Oktober 2026" : "October 31, 2026"}</span>
          </div>
          <div className="meta-pair">
            <span className="meta-label">{isId ? "Masa Berlaku:" : "Validity:"}</span>
            <span className="meta-value">{isId ? "14 November 2026 (14 Hari)" : "November 14, 2026 (14 Days)"}</span>
          </div>
          <div className="meta-pair">
            <span className="meta-label">{isId ? "Ref. Pembeli:" : "Buyer Ref:"}</span>
            <span className="meta-value font-mono">{shipment.poNumber || "ABF/LOI/2026/108"}</span>
          </div>
        </div>
      </div>

      <div className="doc-terms-panel">
        <div className="doc-terms-header">
          {isId ? "KETENTUAN PENGIRIMAN & KOMERSIAL" : "SHIPPING & COMMERCIAL TERMS"}
        </div>
        <div className="doc-terms-grid">
          <div>
            <span className="terms-lbl">{isId ? "Pelabuhan Muat (POL):" : "Port of Loading:"}</span>
            <b className="terms-val">{pol}</b>
          </div>
          <div>
            <span className="terms-lbl">{isId ? "Ketentuan Penyerahan:" : "Incoterm:"}</span>
            <b className="terms-val">{incoterm} Makassar (Incoterms 2020)</b>
          </div>
          <div>
            <span className="terms-lbl">{isId ? "Pelabuhan Bongkar (POD):" : "Port of Discharge:"}</span>
            <b className="terms-val">{pod}</b>
          </div>
          <div>
            <span className="terms-lbl">{isId ? "Estimasi Pengapalan:" : "Est. Shipment:"}</span>
            <b className="terms-val">
              {isId ? "Maksimal 21 hari setelah Pembayaran Uang Muka" : "Within 21 days after Advance Payment"}
            </b>
          </div>
          <div className="col-span-full">
            <span className="terms-lbl">{isId ? "Syarat Pembayaran:" : "Payment Terms:"}</span>
            <b className="terms-val">
              {isId
                ? "Telegraphic Transfer (T/T) - 50% Uang Muka (DP), 50% terhadap Salinan B/L"
                : "Telegraphic Transfer (T/T) - 50% Advance Payment, 50% against Copy of B/L"}
            </b>
          </div>
        </div>
      </div>

      <table className="doc-table-pro">
        <thead>
          <tr>
            <th style={{ width: "40px", textAlign: "center" }}>No</th>
            <th>{isId ? "Deskripsi & Spesifikasi Barang" : "Description of Goods"}</th>
            <th style={{ width: "110px", textAlign: "center" }}>{isId ? "Kode HS" : "HS Code"}</th>
            <th style={{ width: "110px", textAlign: "right" }}>{isId ? "Jumlah (MT)" : "Qty (MT)"}</th>
            <th style={{ width: "130px", textAlign: "right" }}>{isId ? "Harga Satuan" : "Unit Price"}</th>
            <th style={{ width: "140px", textAlign: "right" }}>{isId ? "Total Nilai" : "Total Amount"}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="text-center font-bold">1</td>
            <td>
              <b className="table-product-title">{productName}</b>
              <ul className="table-product-specs">
                <li>
                  {isId
                    ? "Spesifikasi: Mutu Ekspor Grade A, Kadar Air ≤ 2.5%, Mesh 16-18, Kemurnian 99%"
                    : "Specification: Grade A Export Quality, Moisture Max 2.5%, Mesh 16-18, Purity 99%"}
                </li>
                <li>
                  {isId
                    ? "Kemasan: Karung Kertas Kraft Multiwall 20 kg neto dengan Lapisan PE Food-Grade"
                    : "Packing: 20 kg net / Multiwall Kraft Paper Bag with PE Inner Liner"}
                </li>
                <li>
                  {isId
                    ? `Total Muatan: ${formatNumber(bagsCount)} Karung dimuat dalam 1 x 20' Kontainer Kering (Food Grade)`
                    : `Total Volume: ${formatNumber(bagsCount)} Bags loaded in 1 x 20' FCL (Dry Food Grade Container)`}
                </li>
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
        <span>{isId ? "Terbilang:" : "Say:"}</span> <i>{amountInWords}</i>
      </div>

      <div className="doc-bank-card">
        <div className="bank-card-title">
          <span>{isId ? "RINCIAN REKENING BANK PENERIMA (BENEFICIARY)" : "BANK DETAILS FOR BENEFICIARY"}</span>
        </div>
        <table className="bank-card-table">
          <tbody>
            <tr>
              <td className="bank-lbl">{isId ? "Nama Bank:" : "Bank Name:"}</td>
              <td className="bank-val font-semibold">PT. Bank Mandiri (Persero) Tbk - KCP Makassar Panakkukang</td>
            </tr>
            <tr>
              <td className="bank-lbl">{isId ? "Alamat Bank:" : "Bank Address:"}</td>
              <td className="bank-val">Jl. Boulevard, Panakkukang, Makassar, South Sulawesi, Indonesia</td>
            </tr>
            <tr>
              <td className="bank-lbl">{isId ? "Nama Rekening:" : "Account Name:"}</td>
              <td className="bank-val font-semibold">{exporterName}</td>
            </tr>
            <tr>
              <td className="bank-lbl">{isId ? "Nomor Rekening:" : "Account Number:"}</td>
              <td className="bank-val font-mono font-bold">152-00-9876543-2 {isId ? "(Rekening Valas USD)" : "(USD Account)"}</td>
            </tr>
            <tr>
              <td className="bank-lbl">{isId ? "Kode SWIFT / BIC:" : "SWIFT Code:"}</td>
              <td className="bank-val font-mono font-bold">BMRIIDJA</td>
            </tr>
            <tr>
              <td className="bank-lbl">{isId ? "Mata Uang:" : "Currency:"}</td>
              <td className="bank-val">{currency} {isId ? "(Dolar Amerika Serikat)" : "(United States Dollar)"}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="doc-single-signature-wrap">
        <OfficialStampAndSignature exporterName={exporterName} role="Export Director" isId={isId} />
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
  isId = false,
}: {
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
  isId?: boolean;
}) {
  return (
    <div className="doc-content-wrapper">
      <div className="doc-title-bar">
        <h2>{isId ? "KONTRAK PENJUALAN EKSPOR (SALES CONTRACT)" : "SALES CONTRACT"}</h2>
      </div>

      <div className="doc-contract-ref-bar">
        <span>
          {isId ? "No. Kontrak:" : "Contract No:"} <b>SC/IEI-ABF/XI/2026/001</b>
        </span>
        <span>|</span>
        <span>
          {isId ? "Tanggal:" : "Date:"} <b>{isId ? "2 November 2026" : "November 2, 2026"}</b>
        </span>
      </div>

      <p className="doc-preamble-text">
        {isId
          ? "Kontrak Penjualan ini dibuat dan disepakati oleh dan antara kedua belah pihak berikut:"
          : "This Sales Contract is made and entered into by and between:"}
      </p>

      <div className="doc-contract-parties-grid">
        <div className="contract-party-card">
          <div className="contract-party-header">
            {isId ? "PIHAK PENJUAL (THE SELLER)" : "THE SELLER"}
          </div>
          <b className="party-name">{exporterName}</b>
          <p className="party-address">{exporterAddress}</p>
          <p className="party-phone">
            {isId ? "Telepon:" : "Phone:"} +62 812 3456 7890 | Email: official@indicoexport.com
          </p>
          <p className="party-tax">NPWP: 01.234.567.8-801.000</p>
        </div>

        <div className="contract-party-card">
          <div className="contract-party-header">
            {isId ? "PIHAK PEMBELI (THE BUYER)" : "THE BUYER"}
          </div>
          <b className="party-name">{buyerName}</b>
          <p className="party-address">{buyerAddress}, {buyerCountry}</p>
          <p className="party-phone">
            {isId ? "Telepon:" : "Phone:"} +971 4 223 4567 | Email: procurement@albarakahfoods.ae
          </p>
          <p className="party-tax">
            {isId
              ? "Up: Mr. Tariq Al-Mansoor (Direktur Pengadaan)"
              : "Attn: Mr. Tariq Al-Mansoor (Procurement Director)"}
          </p>
        </div>
      </div>

      <div className="contract-articles-wrapper">
        <div className="contract-article-block">
          <h4 className="article-title">
            {isId ? "PASAL 1: KOMODITAS & SPESIFIKASI" : "ARTICLE 1: COMMODITY & SPECIFICATION"}
          </h4>
          <p>
            <b>{isId ? "Komoditas:" : "Commodity:"}</b> {productName} |{" "}
            <b>{isId ? "Kode HS:" : "HS Code:"}</b> {hsCode}
          </p>
          <p>
            <b>{isId ? "Kualitas:" : "Quality:"}</b>{" "}
            {isId
              ? "Kualitas Mutu Ekspor Grade A, Kadar Air ≤ 2.5%, Ukuran Butiran Mesh 16-18, Kelarutan 99%, Gula Pereduksi Maks 6%, Sukrosa 80-85%, Timbal (Pb) < 0.2 mg/kg."
              : "Grade A Export Quality, Moisture ≤ 2.5%, Granule Size Mesh 16-18, Solubility 99%, Reducing Sugar Max 6%, Sucrose 80-85%, Lead (Pb) < 0.2 mg/kg."}
          </p>
        </div>

        <div className="contract-article-block">
          <h4 className="article-title">
            {isId ? "PASAL 2: KUANTITAS, KEMASAN & HARGA" : "ARTICLE 2: QUANTITY, PACKING & PRICE"}
          </h4>
          <p>
            <b>{isId ? "Kuantitas:" : "Quantity:"}</b>{" "}
            {isId
              ? `${formatNumber(netWeightMT, 0)} Metrik Ton (${formatNumber(netWeightMT * 1000, 0)} Kg) toleransi +/- 2% atas pilihan Penjual.`
              : `${formatNumber(netWeightMT, 0)} Metric Tons (${formatNumber(netWeightMT * 1000, 0)} Kgs) +/- 2% tolerance at Seller's option.`}
          </p>
          <p>
            <b>{isId ? "Kemasan:" : "Packing:"}</b>{" "}
            {isId
              ? `Dikemas dalam karung kertas Kraft 3 lapis dengan lapisan dalam plastik PE food-grade 20 kg neto. Total ${formatNumber(bagsCount)} karung dimuat dalam 1 x 20ft Kontainer Kering (Food Grade).`
              : `Packed in 20 kg net weight food-grade PE inner liner and 3-ply Kraft Paper outer bag. Total ${formatNumber(bagsCount)} bags loaded in 1 x 20ft Dry Container (Food Grade Container).`}
          </p>
          <p>
            <b>{isId ? "Harga Satuan:" : "Unit Price:"}</b> {currency}{" "}
            {formatNumber(unitPricePerMT, 2)} / MT {incoterm} Pelabuhan Makassar, Indonesia (Incoterms 2020).
          </p>
          <p>
            <b>{isId ? "Nilai Total:" : "Total Value:"}</b> {currency} {formatNumber(totalAmount, 2)}{" "}
            ({isId ? "Terbilang:" : "Say:"} {amountInWords}).
          </p>
        </div>

        <div className="contract-article-block">
          <h4 className="article-title">
            {isId ? "PASAL 3: SYARAT PEMBAYARAN" : "ARTICLE 3: TERMS OF PAYMENT"}
          </h4>
          <p>
            {isId
              ? "Pembayaran dilakukan melalui Telegraphic Transfer (T/T) ke rekening bank yang ditunjuk oleh Penjual (PT. Bank Mandiri (Persero) Tbk, No. Rek: 152-00-9876543-2, SWIFT: BMRIIDJA) sebagai berikut:"
              : "Payment shall be made by Telegraphic Transfer (T/T) to Seller's designated bank account (PT. Bank Mandiri (Persero) Tbk, Acc No: 152-00-9876543-2, SWIFT: BMRIIDJA) as follows:"}
          </p>
          <ol className="article-ordered-list">
            <li>
              <b>
                {isId
                  ? `50% Uang Muka (DP) (${currency} ${formatNumber(totalAmount * 0.5, 2)})`
                  : `50% Down Payment (${currency} ${formatNumber(totalAmount * 0.5, 2)})`}
              </b>{" "}
              {isId
                ? "dibayarkan dalam waktu 3 (tiga) hari kerja setelah penandatanganan kontrak ini."
                : "payable within 3 (three) working days after signing this contract."}
            </li>
            <li>
              <b>
                {isId
                  ? `50% Pelunasan Sisa (${currency} ${formatNumber(totalAmount * 0.5, 2)})`
                  : `50% Balance Payment (${currency} ${formatNumber(totalAmount * 0.5, 2)})`}
              </b>{" "}
              {isId
                ? "dibayarkan dalam waktu 5 (lima) hari kerja terhadap salinan pindaian (scanned copy) dokumen pengapalan lengkap. Dokumen asli akan dikirim melalui kurir (DHL/FedEx) atau Telex Release setelah pembayaran lunas 100% diterima."
                : "payable within 5 (five) working days against scanned copies of full set shipping documents. Original documents will be released via courier (DHL/FedEx) or Telex Release upon receipt of 100% full payment."}
            </li>
          </ol>
        </div>

        <div className="contract-article-block">
          <h4 className="article-title">
            {isId ? "PASAL 4: KETENTUAN PENGAPALAN" : "ARTICLE 4: SHIPMENT TERMS"}
          </h4>
          <p>
            <b>{isId ? "Pelabuhan Muat:" : "Port of Loading:"}</b> {pol} |{" "}
            <b>{isId ? "Pelabuhan Bongkar:" : "Port of Discharge:"}</b> {pod}
          </p>
          <p>
            <b>{isId ? "Batas Akhir Pengapalan:" : "Latest Shipment:"}</b>{" "}
            {isId ? "25 November 2026" : "November 25, 2026"} |{" "}
            <b>{isId ? "Pengapalan Sebagian (Partial):" : "Partial Shipment:"}</b>{" "}
            {isId ? "Tidak Diizinkan" : "Not Allowed"} |{" "}
            <b>{isId ? "Pindah Kapal (Transshipment):" : "Transshipment:"}</b>{" "}
            {isId ? "Diizinkan" : "Allowed"}
          </p>
        </div>

        <div className="contract-article-block">
          <h4 className="article-title">
            {isId ? "PASAL 5: DOKUMEN YANG DIPERLUKAN" : "ARTICLE 5: REQUIRED DOCUMENTS"}
          </h4>
          <p>
            {isId
              ? "Penjual wajib menyediakan dokumen-dokumen berikut kepada Pembeli: (1) 1 Set Lengkap (3/3) Bill of Lading (B/L) Asli Clean on Board Ocean; (2) Faktur Komersial (Commercial Invoice) Asli bertandatangan dalam rangkap 3; (3) Daftar Kemasan (Packing List) Asli bertandatangan dalam rangkap 3; (4) Surat Keterangan Asal (COO / Form AK / e-COO) resmi dari instansi pemerintah; (5) Sertifikat Fitosanitari dari Badan Karantina Pertanian Indonesia; (6) Sertifikat Analisis (COA) dan Sertifikat Halal."
              : "Seller shall provide the following documents to the Buyer: (1) Full Set (3/3) Original Clean on Board Ocean Bill of Lading; (2) Signed Commercial Invoice in 3 originals; (3) Signed Packing List in 3 originals; (4) Certificate of Origin (COO) issued by Indonesian Chamber of Commerce / Ministry of Trade; (5) Phytosanitary Certificate issued by Indonesian Agricultural Quarantine Agency; (6) Certificate of Analysis (COA) and Halal Certificate."}
          </p>
        </div>

        <div className="contract-article-block">
          <h4 className="article-title">
            {isId ? "PASAL 6: KEADAAN KAHAR (FORCE MAJEURE) & ARBITRASE" : "ARTICLE 6: FORCE MAJEURE & ARBITRATION"}
          </h4>
          <p>
            {isId
              ? "Tidak ada pihak yang bertanggung jawab atas keterlambatan atau kegagalan pemenuhan kewajiban akibat Keadaan Kahar (bencana alam, perang, embargo atau keputusan darurat pemerintah). Setiap perselisihan yang timbul dari kontrak ini akan diselesaikan secara musyawarah mufakat. Apabila musyawarah mufakat gagal dicapai, perselisihan akan diajukan ke Badan Arbitrase Nasional Indonesia (BANI) sesuai dengan peraturan ICC yang berlaku."
              : "Neither party shall be liable for any delay or failure to perform due to Force Majeure (natural disasters, war, government embargo). Any disputes arising from this contract shall be settled amicably. If amicable settlement fails, the dispute shall be submitted to the Indonesian National Board of Arbitration (BANI) in accordance with ICC rules."}
          </p>
        </div>
      </div>

      <p className="doc-witness-clause">
        {isId
          ? "DEMIKIANLAH, kedua belah pihak telah menyepakati dan menandatangani Kontrak ini dalam rangkap dua dengan kekuatan hukum yang sama."
          : "IN WITNESS WHEREOF, both parties have executed this Contract in duplicate with equal legal force."}
      </p>

      <div className="doc-dual-signatures">
        <div className="sig-side">
          <span className="sig-header-txt">
            {isId ? "PIHAK PEMBELI (THE BUYER)" : "THE BUYER"}
          </span>
          <b>{isId ? `Untuk ${buyerName}` : `For ${buyerName}`}</b>
          <div className="sig-box-space">
            <div className="sig-placeholder">{isId ? "[Tanda Tangan & Stempel]" : "[Signature & Stamp]"}</div>
          </div>
          <b className="sig-name">Tariq Al-Mansoor</b>
          <span className="sig-sub">{isId ? "Direktur Pengadaan" : "Procurement Director"}</span>
        </div>

        <div className="sig-side sig-side-right">
          <span className="sig-header-txt">
            {isId ? "PIHAK PENJUAL (THE SELLER)" : "THE SELLER"}
          </span>
          <b>{isId ? `Untuk ${exporterName}` : `For ${exporterName}`}</b>
          <div className="sig-box-space">
            <div className="sig-placeholder">{isId ? "[Tanda Tangan & Stempel]" : "[Signature & Stamp]"}</div>
          </div>
          <b className="sig-name">{isId ? "Direktur Ekspor" : "Export Director"}</b>
          <span className="sig-sub">{isId ? "Penandatangan Berwenang" : "Authorized Signatory"}</span>
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
  isId = false,
}: {
  exporterName: string;
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
  isId?: boolean;
}) {
  return (
    <div className="doc-content-wrapper">
      <div className="doc-title-bar">
        <h2>{isId ? "FAKTUR KOMERSIAL (COMMERCIAL INVOICE)" : "COMMERCIAL INVOICE"}</h2>
      </div>

      <div className="doc-two-col-grid">
        <div className="doc-parties-column">
          <div className="doc-box">
            <span className="doc-box-tag">
              {isId ? "PENGIRIM / EKSPORTIR (SHIPPER / EXPORTER):" : "SHIPPER / EXPORTER:"}
            </span>
            <b className="doc-entity-name">{exporterName}</b>
            <p className="doc-entity-address">
              Jl. Adiyaksa Baru No. 1B, Kec. Panakkukang, Kota Makassar, Sulawesi Selatan, Indonesia
            </p>
          </div>

          <div className="doc-box">
            <span className="doc-box-tag">
              {isId ? "PENERIMA / PEMBELI (CONSIGNEE / BUYER):" : "CONSIGNEE / BUYER:"}
            </span>
            <b className="doc-entity-name">{buyerName}</b>
            <p className="doc-entity-address">{buyerAddress}, {buyerCountry}</p>
            <p className="doc-entity-contact">Tel: +971 4 223 4567 | Email: procurement@albarakahfoods.ae</p>
          </div>

          <div className="doc-box">
            <span className="doc-box-tag">
              {isId ? "PIHAK DIBERITAHU (NOTIFY PARTY):" : "NOTIFY PARTY:"}
            </span>
            <b className="doc-entity-name">
              {isId ? "Sama dengan Penerima (Same as Consignee)" : "Same as Consignee"}
            </b>
          </div>
        </div>

        <div className="doc-reference-column">
          <div className="doc-box">
            <div className="meta-pair">
              <span className="meta-label">{isId ? "No. Faktur:" : "Invoice No.:"}</span>{" "}
              <b className="meta-value font-mono">INV/IEI-DXB/XI/2026/001</b>
            </div>
            <div className="meta-pair">
              <span className="meta-label">{isId ? "Tanggal:" : "Date:"}</span>{" "}
              <span className="meta-value">{isId ? "20 November 2026" : "November 20, 2026"}</span>
            </div>
            <div className="meta-pair">
              <span className="meta-label">{isId ? "No. Kontrak Penjualan:" : "Sales Contract No.:"}</span>{" "}
              <b className="meta-value font-mono">SC/IEI-ABF/XI/2026/001</b>
            </div>
            <div className="meta-pair">
              <span className="meta-label">{isId ? "Syarat Pembayaran:" : "Payment Terms:"}</span>{" "}
              <span className="meta-value">Telegraphic Transfer (T/T)</span>
            </div>
          </div>

          <div className="doc-box transport-box">
            <span className="doc-box-tag">
              {isId ? "RINCIAN PENGANGKUTAN (TRANSPORT DETAILS):" : "TRANSPORT DETAILS:"}
            </span>
            <div className="meta-pair">
              <span className="meta-label">{isId ? "Kapal / Pelayaran:" : "Vessel / Voyage:"}</span>{" "}
              <b className="meta-value">KMTC SHIMIZU V.2611N</b>
            </div>
            <div className="meta-pair">
              <span className="meta-label">{isId ? "Pelabuhan Muat:" : "Port of Loading:"}</span>{" "}
              <span className="meta-value">{pol}</span>
            </div>
            <div className="meta-pair">
              <span className="meta-label">{isId ? "Pelabuhan Bongkar:" : "Port of Discharge:"}</span>{" "}
              <span className="meta-value">{pod}</span>
            </div>
            <div className="meta-pair">
              <span className="meta-label">{isId ? "No. Kontainer / Segel:" : "Container / Seal:"}</span>{" "}
              <b className="meta-value font-mono">TGHU 2468135 / IDMKS998877 (1x20&apos; FCL)</b>
            </div>
            <div className="meta-pair">
              <span className="meta-label">{isId ? "No. Bill of Lading:" : "B/L Number:"}</span>{" "}
              <b className="meta-value font-mono">KMTC-MKS0091827</b>
            </div>
          </div>
        </div>
      </div>

      <table className="doc-table-pro">
        <thead>
          <tr>
            <th style={{ width: "160px" }}>{isId ? "Tanda & No. Kemasan" : "Marks & Nos"}</th>
            <th>{isId ? "Deskripsi & Spesifikasi Barang" : "Description of Goods"}</th>
            <th style={{ width: "120px", textAlign: "right" }}>{isId ? "Kuantitas" : "Quantity"}</th>
            <th style={{ width: "120px", textAlign: "right" }}>{isId ? "Harga Satuan" : "Unit Price"}</th>
            <th style={{ width: "140px", textAlign: "right" }}>{isId ? "Total Nilai" : "Total Amount"}</th>
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
              <p className="text-xs text-slate-600 mt-1">{isId ? "KODE HS:" : "HS CODE:"} {hsCode}</p>
              <p className="text-xs text-slate-600">
                {isId ? "Kemasan: Karung Kertas Kraft Multiwall 20 Kg Neto" : "Packing: 20 Kg Net / Multiwall Kraft Paper Bag"}
              </p>
              <p className="text-xs text-slate-600">
                {isId ? `Total Kemasan: ${formatNumber(bagsCount)} Karung` : `Total Packages: ${formatNumber(bagsCount)} Bags`}
              </p>
              <p className="text-xs font-semibold text-slate-800 mt-1">
                {isId
                  ? `Berat Neto: ${formatNumber(netWeightKgs, 2)} Kg | Berat Bruto: ${formatNumber(grossWeightKgs, 2)} Kg`
                  : `Net Weight: ${formatNumber(netWeightKgs, 2)} Kgs | Gross Weight: ${formatNumber(grossWeightKgs, 2)} Kgs`}
              </p>
              <p className="text-xs text-slate-600">{isId ? "Negara Asal: Indonesia" : "Country of Origin: Indonesia"}</p>
            </td>
            <td className="text-right font-bold">
              {formatNumber(bagsCount)} {isId ? "Karung" : "Bags"}<br />
              <span className="text-xs font-normal text-slate-500">
                ({formatNumber(netWeightMT, 2)} MT {isId ? "Neto" : "Net"})
              </span>
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
        <span>{isId ? "Terbilang:" : "Amount in Words:"}</span> <b>{amountInWords}</b>
      </div>

      <div className="doc-cert-banner">
        <ShieldCheck size={16} className="text-blue-700 flex-shrink-0" />
        <p>
          {isId
            ? "Dengan ini kami menyatakan bahwa faktur ini mencantumkan harga barang yang sebenarnya dan tidak ada faktur lain yang diterbitkan, serta seluruh rincian di dalamnya adalah benar dan sah sesuai ketentuan pabean."
            : "We hereby certify that this invoice shows the actual price of the goods described, that no other invoice has been or will be issued, and that all particulars are true and correct."}
        </p>
      </div>

      <div className="doc-single-signature-wrap">
        <OfficialStampAndSignature exporterName={exporterName} role="Export Director" isId={isId} />
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
  isId = false,
}: {
  exporterName: string;
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
  isId?: boolean;
}) {
  return (
    <div className="doc-content-wrapper">
      <div className="doc-title-bar">
        <h2>{isId ? "DAFTAR KEMASAN (PACKING LIST)" : "PACKING LIST"}</h2>
      </div>

      <div className="doc-two-col-grid">
        <div className="doc-parties-column">
          <div className="doc-box">
            <span className="doc-box-tag">
              {isId ? "PENGIRIM / EKSPORTIR (SHIPPER / EXPORTER):" : "SHIPPER / EXPORTER:"}
            </span>
            <b className="doc-entity-name">{exporterName}</b>
            <p className="doc-entity-address">
              Jl. Adiyaksa Baru No. 1B, Kec. Panakkukang, Kota Makassar, Sulawesi Selatan, Indonesia
            </p>
          </div>

          <div className="doc-box">
            <span className="doc-box-tag">
              {isId ? "PENERIMA (CONSIGNEE):" : "CONSIGNEE:"}
            </span>
            <b className="doc-entity-name">{buyerName}</b>
            <p className="doc-entity-address">{buyerAddress}, {buyerCountry}</p>
            <p className="doc-entity-contact">Tel: +971 4 223 4567 | Email: procurement@albarakahfoods.ae</p>
          </div>

          <div className="doc-box">
            <span className="doc-box-tag">
              {isId ? "PIHAK DIBERITAHU (NOTIFY PARTY):" : "NOTIFY PARTY:"}
            </span>
            <b className="doc-entity-name">
              {isId ? "Sama dengan Penerima (Same as Consignee)" : "Same as Consignee"}
            </b>
          </div>
        </div>

        <div className="doc-reference-column">
          <div className="doc-box">
            <div className="meta-pair">
              <span className="meta-label">{isId ? "No. Daftar Kemasan:" : "Packing List No.:"}</span>{" "}
              <b className="meta-value font-mono">PL/IEI-DXB/XI/2026/001</b>
            </div>
            <div className="meta-pair">
              <span className="meta-label">{isId ? "No. Faktur:" : "Invoice No.:"}</span>{" "}
              <b className="meta-value font-mono">INV/IEI-DXB/XI/2026/001</b>
            </div>
            <div className="meta-pair">
              <span className="meta-label">{isId ? "Tanggal:" : "Date:"}</span>{" "}
              <span className="meta-value">{isId ? "20 November 2026" : "November 20, 2026"}</span>
            </div>
            <div className="meta-pair">
              <span className="meta-label">{isId ? "No. Kontrak Penjualan:" : "Sales Contract No.:"}</span>{" "}
              <b className="meta-value font-mono">SC/IEI-ABF/XI/2026/001</b>
            </div>
          </div>

          <div className="doc-box transport-box">
            <span className="doc-box-tag">
              {isId ? "RINCIAN PENGANGKUTAN (TRANSPORT DETAILS):" : "TRANSPORT DETAILS:"}
            </span>
            <div className="meta-pair">
              <span className="meta-label">{isId ? "Kapal / Pelayaran:" : "Vessel / Voyage:"}</span>{" "}
              <b className="meta-value">KMTC SHIMIZU V.2611N</b>
            </div>
            <div className="meta-pair">
              <span className="meta-label">{isId ? "Pelabuhan Muat:" : "Port of Loading:"}</span>{" "}
              <span className="meta-value">{pol}</span>
            </div>
            <div className="meta-pair">
              <span className="meta-label">{isId ? "Pelabuhan Bongkar:" : "Port of Discharge:"}</span>{" "}
              <span className="meta-value">{pod}</span>
            </div>
            <div className="meta-pair">
              <span className="meta-label">{isId ? "No. Kontainer / Segel:" : "Container / Seal:"}</span>{" "}
              <b className="meta-value font-mono">TGHU 2468135 / IDMKS998877 (1x20&apos; FCL)</b>
            </div>
            <div className="meta-pair">
              <span className="meta-label">{isId ? "No. Bill of Lading:" : "B/L Number:"}</span>{" "}
              <b className="meta-value font-mono">KMTC-MKS0091827</b>
            </div>
          </div>
        </div>
      </div>

      <table className="doc-table-pro">
        <thead>
          <tr>
            <th style={{ width: "150px" }}>{isId ? "Tanda & No. Kemasan" : "Marks & Nos"}</th>
            <th>{isId ? "Deskripsi Barang & Spesifikasi Kemasan" : "Description of Goods & Packing Spec"}</th>
            <th style={{ width: "95px", textAlign: "right" }}>{isId ? "Jumlah (Koli)" : "Qty (Bags)"}</th>
            <th style={{ width: "115px", textAlign: "right" }}>{isId ? "Berat Neto (Net Weight)" : "Net Weight"}</th>
            <th style={{ width: "115px", textAlign: "right" }}>{isId ? "Berat Bruto (Gross Weight)" : "Gross Weight"}</th>
            <th style={{ width: "95px", textAlign: "right" }}>{isId ? "Volume (CBM)" : "Meas. (CBM)"}</th>
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
              <p className="text-xs text-slate-600 mt-1">{isId ? "Kode HS:" : "HS Code:"} {hsCode}</p>
              <div className="text-xs text-slate-700 mt-2">
                <b>{isId ? "Spesifikasi Kemasan:" : "Packing Specification:"}</b>
                <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
                  <li>{isId ? "@ 20,00 Kg Berat Neto / Karung" : "@ 20.00 Kg Net Weight / Bag"}</li>
                  <li>{isId ? "@ 20,25 Kg Berat Bruto / Karung" : "@ 20.25 Kg Gross Weight / Bag"}</li>
                  <li>{isId ? "Dimensi Karung: 60 x 40 x 12 cm" : "Bag Dimension: 60 x 40 x 12 cm"}</li>
                  <li>{isId ? "Lapisan Dalam: Plastik PE Food Grade" : "Inner: Food Grade PE Plastic Liner"}</li>
                  <li>{isId ? "Lapisan Luar: Karung Kertas Kraft 3 Lapis (Heavy Duty)" : "Outer: 3-Ply Heavy Duty Kraft Paper Bag"}</li>
                </ul>
              </div>
            </td>
            <td className="text-right font-bold">{formatNumber(bagsCount)} {isId ? "Karung" : "Bags"}</td>
            <td className="text-right font-bold">
              {formatNumber(netWeightKgs, 2)} Kgs<br />
              <span className="text-xs font-normal text-slate-500">
                ({formatNumber(netWeightMT, 2)} MT {isId ? "Neto" : ""})
              </span>
            </td>
            <td className="text-right font-bold">
              {formatNumber(grossWeightKgs, 2)} Kgs<br />
              <span className="text-xs font-normal text-slate-500">
                ({formatNumber(grossWeightMT, 3)} MT {isId ? "Bruto" : ""})
              </span>
            </td>
            <td className="text-right font-bold text-slate-900">{formatNumber(totalCBM, 3)} CBM</td>
          </tr>
        </tbody>
        <tfoot>
          <tr className="doc-table-total-row">
            <td colSpan={2} className="text-right font-bold">{isId ? "TOTAL KESELURUHAN:" : "TOTAL:"}</td>
            <td className="text-right font-bold text-blue-900">{formatNumber(bagsCount)} {isId ? "Karung" : "Bags"}</td>
            <td className="text-right font-bold text-blue-900">{formatNumber(netWeightKgs, 2)} Kgs</td>
            <td className="text-right font-bold text-blue-900">{formatNumber(grossWeightKgs, 2)} Kgs</td>
            <td className="text-right font-bold text-blue-900">{formatNumber(totalCBM, 3)} CBM</td>
          </tr>
        </tfoot>
      </table>

      <div className="doc-single-signature-wrap">
        <OfficialStampAndSignature exporterName={exporterName} role="Export Director" isId={isId} />
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
  isId = false,
}: {
  exporterName: string;
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
  isId?: boolean;
}) {
  return (
    <div className="doc-content-wrapper">
      <div className="doc-title-bar">
        <h2>{isId ? "INSTRUKSI PENGAPALAN (SHIPPING INSTRUCTION)" : "SHIPPING INSTRUCTION (SI)"}</h2>
      </div>

      <div className="doc-si-header-grid">
        <div>
          <span className="si-lbl">{isId ? "No. SI:" : "SI Number:"}</span>{" "}
          <b className="font-mono">SI/IEI/XI/2026/001</b>
        </div>
        <div>
          <span className="si-lbl">{isId ? "Kepada (Forwarder/Pelayaran):" : "To (Forwarder/Line):"}</span>{" "}
          <b>PT. Samudera Logistik Nusantara</b>
        </div>
        <div>
          <span className="si-lbl">{isId ? "Tanggal:" : "Date:"}</span>{" "}
          <span>{isId ? "16 November 2026" : "November 16, 2026"}</span>
        </div>
        <div>
          <span className="si-lbl">{isId ? "Ditujukan Kepada:" : "Attention:"}</span>{" "}
          <b>{isId ? "Bagian Booking & Dokumentasi Ekspor" : "Export Booking & Documentation Dept."}</b>
        </div>
        <div>
          <span className="si-lbl">{isId ? "Ref. Kontrak:" : "Contract Ref:"}</span>{" "}
          <b className="font-mono">SC/IEI-ABF/XI/2026/001</b>
        </div>
        <div>
          <span className="si-lbl">{isId ? "Ref. Faktur:" : "Invoice Ref:"}</span>{" "}
          <b className="font-mono">INV/IEI-DXB/XI/2026/001</b>
        </div>
      </div>

      <div className="doc-three-col-parties">
        <div className="si-party-card">
          <div className="si-party-tag">
            {isId ? "SHIPPER / PENGIRIM (Dicantumkan pada B/L)" : "SHIPPER (To appear on B/L)"}
          </div>
          <b className="party-title">{exporterName}</b>
          <p className="party-txt">
            Jl. Adiyaksa Baru No. 1B, Kec. Panakkukang, Kota Makassar, Sulawesi Selatan, Indonesia
          </p>
          <p className="party-txt">
            {isId ? "Telepon:" : "Tel:"} +62 812 3456 7890 | Email: official@indicoexport.com
          </p>
          <p className="party-txt font-mono">NPWP: 01.234.567.8-801.000</p>
        </div>

        <div className="si-party-card">
          <div className="si-party-tag">
            {isId ? "CONSIGNEE / PENERIMA (Dicantumkan pada B/L)" : "CONSIGNEE (To appear on B/L)"}
          </div>
          <b className="party-title">{buyerName}</b>
          <p className="party-txt">{buyerAddress}</p>
          <p className="party-txt">{isId ? "Telepon:" : "Tel:"} +971 4 223 4567</p>
          <p className="party-txt">Email: procurement@albarakahfoods.ae</p>
        </div>

        <div className="si-party-card">
          <div className="si-party-tag">
            {isId ? "NOTIFY PARTY (Dicantumkan pada B/L)" : "NOTIFY PARTY (To appear on B/L)"}
          </div>
          <b className="party-title">{isId ? "SAMA DENGAN PENERIMA" : "SAME AS CONSIGNEE"}</b>
          <p className="party-txt mt-2">{buyerName}</p>
          <p className="party-txt">{isId ? "Narahubung: Mr. Tariq Al-Mansoor" : "Contact: Mr. Tariq Al-Mansoor"}</p>
          <p className="party-txt">{isId ? "Telepon:" : "Tel:"} +971 4 223 4567</p>
        </div>
      </div>

      <div className="doc-transport-row-strip">
        <div className="strip-item">
          <span className="strip-lbl">{isId ? "Kapal / Pelayaran" : "Vessel / Voyage"}</span>
          <b className="strip-val">KMTC SHIMIZU V.2611N</b>
          <small className="strip-sub">ETD: Nov 21, 2026</small>
        </div>
        <div className="strip-item">
          <span className="strip-lbl">{isId ? "Pelabuhan Muat (POL)" : "Port of Loading (POL)"}</span>
          <b className="strip-val">{pol}</b>
        </div>
        <div className="strip-item">
          <span className="strip-lbl">{isId ? "Pelabuhan Bongkar (POD)" : "Port of Discharge (POD)"}</span>
          <b className="strip-val">{pod}</b>
        </div>
        <div className="strip-item">
          <span className="strip-lbl">{isId ? "Kontainer & Muat" : "Container & Stuffing"}</span>
          <b className="strip-val">1 x 20&apos; GP (Food Grade)</b>
          <small className="strip-sub">{isId ? "Muat: 18 Nov 2026" : "Stuffing: Nov 18, 2026"}</small>
        </div>
      </div>

      <table className="doc-table-pro">
        <thead>
          <tr>
            <th style={{ width: "150px" }}>{isId ? "Tanda & Nomor Kemasan" : "Marks & Numbers"}</th>
            <th style={{ width: "160px" }}>{isId ? "Jumlah Kemasan" : "No. of Pkgs"}</th>
            <th>{isId ? "Deskripsi Barang (Pada B/L)" : "Description of Goods (On B/L)"}</th>
            <th style={{ width: "130px", textAlign: "right" }}>{isId ? "Berat (Kg)" : "Weight (Kgs)"}</th>
            <th style={{ width: "110px", textAlign: "right" }}>{isId ? "Dimensi / Volume" : "Measurement"}</th>
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
              <b>{formatNumber(bagsCount)} {isId ? "KARUNG" : "BAGS"}</b><br />
              <span className="text-xs text-slate-600">
                {isId ? "(Sembilan Ratus Karung Kertas Kraft Multiwall)" : "(Nine Hundred Multiwall Kraft Paper Bags)"}
              </span>
            </td>
            <td>
              <b className="table-product-title">{productName.toUpperCase()}</b>
              <p className="text-xs text-slate-600 mt-1">
                {isId
                  ? "Dikemas dalam Karung Kertas Kraft Multiwall 20 Kg Neto dengan Lapisan Dalam Plastik PE Food-Grade."
                  : "Packed in 20 Kg Net Multiwall Kraft Paper Bags with Inner Food-Grade PE Liner."}
              </p>
              <p className="text-xs font-mono text-slate-700 mt-1">{isId ? "KODE HS:" : "HS CODE:"} {hsCode}</p>
              <p className="text-xs font-mono font-bold text-slate-800">
                {isId ? "NO. KONTAINER / SEGEL:" : "CONT / SEAL NO.:"} TGHU 2468135 / IDMKS998877
              </p>
              <p className="text-xs font-bold text-slate-800">
                {isId ? "NEGARA ASAL: INDONESIA" : "COUNTRY OF ORIGIN: INDONESIA"}
              </p>
            </td>
            <td className="text-right">
              <div className="text-xs text-slate-500">{isId ? "NETO:" : "NET:"}</div>
              <b className="text-sm">{formatNumber(netWeightKgs, 2)}</b> KGS
              <div className="text-xs text-slate-500 mt-2">{isId ? "BRUTO:" : "GROSS:"}</div>
              <b className="text-sm">{formatNumber(grossWeightKgs, 2)}</b> KGS
            </td>
            <td className="text-right font-bold text-slate-900 text-sm">
              {formatNumber(totalCBM, 3)} CBM
            </td>
          </tr>
        </tbody>
      </table>

      <div className="doc-instructions-box">
        <h4 className="instructions-title">
          {isId ? "INSTRUKSI BILL OF LADING & PENGAPALAN (FREIGHT):" : "BILL OF LADING & FREIGHT INSTRUCTIONS:"}
        </h4>
        <ol className="instructions-list">
          <li>
            <b>{isId ? "Jenis Bill of Lading:" : "Type of Bill of Lading:"}</b>{" "}
            {isId
              ? "1 Set Lengkap (3/3) Original Clean on Board Ocean Bill of Lading + 3 Salinan Non-Negotiable."
              : "Full Set (3/3) Original Clean on Board Ocean Bill of Lading + 3 Non-Negotiable Copies."}
          </li>
          <li>
            <b>{isId ? "Ketentuan Freight:" : "Freight Term:"}</b>{" "}
            {incoterm === "FOB"
              ? isId
                ? "FREIGHT COLLECT (Dibayar di Pelabuhan Tujuan)"
                : "FREIGHT COLLECT"
              : isId
                ? "FREIGHT PREPAID (Dibayar di Pelabuhan Muat)"
                : "FREIGHT PREPAID"}{" "}
            (Incoterm: {incoterm} Pelabuhan Makassar, Incoterms 2020).
          </li>
          <li>
            <b>{isId ? "Standar Kontainer:" : "Container Requirement:"}</b>{" "}
            {isId
              ? "Mohon sediakan kontainer 20ft GP Food-Grade yang bersih, kering, tidak berbau, dan layak untuk produk bahan makanan."
              : "Please provide a Clean, Dry, Odorless, Food-Grade 20ft GP Container suitable for foodstuff."}
          </li>
          <li>
            <b>{isId ? "Verifikasi Dokumen:" : "Verification:"}</b>{" "}
            {isId
              ? "Mohon kirimkan Draft B/L dan Draft Pemberitahuan Ekspor Barang (PEB) kepada kami untuk diverifikasi sebelum penerbitan final."
              : "Please send us the Draft B/L and Draft PEB (Pemberitahuan Ekspor Barang) for our verification and approval prior to final issuance."}
          </li>
          <li>
            <b>{isId ? "Koordinasi Pengambilan:" : "Release Coordination:"}</b>{" "}
            {isId
              ? "Mohon konfirmasi Release Order kontainer kosong (RO/DO Empty) dan jadwal closing time kepada tim logistik kami."
              : "Please confirm container release order (RO/DO Empty) and closing time schedule to our warehouse team."}
          </li>
        </ol>
      </div>

      <div className="doc-single-signature-wrap">
        <OfficialStampAndSignature
          exporterName={exporterName}
          role="Logistics & Export Manager"
          isId={isId}
        />
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
