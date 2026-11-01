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
  FileDown,
  FileSpreadsheet,
  Globe,
  FileCode,
  Landmark,
  PenTool,
  Edit3,
  Printer,
  ShieldCheck,
  Ship,
  SlidersHorizontal,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Field, SelectField } from "./Primitives";
import { DocWordRibbon } from "./DocWordRibbon";
import { DigitalSignatureModal } from "./DigitalSignatureModal";
import {
  exportToDocx,
  exportToXlsx,
  exportToHtml,
  exportToTxt,
  downloadBlob,
  getDocumentNumber,
  type ExportFormat,
  type ExportDocData,
} from "@/lib/documentExporters";

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
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isWordRibbonOpen, setIsWordRibbonOpen] = useState(true);
  const [isEditMode, setIsEditMode] = useState(shipment.docEditorMode ?? false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [signatureParty, setSignatureParty] = useState<"seller" | "buyer">("seller");
  const [editorKey, setEditorKey] = useState(0);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  const handleOpenSignatureModal = (party: "seller" | "buyer" = "seller") => {
    setSignatureParty(party);
    setIsSignatureModalOpen(true);
  };

  const handleResetDocument = () => {
    setEditorKey((prev) => prev + 1);
    toast.success("Dokumen berhasil di-reset ke template standar sistem!");
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
        setIsDownloadMenuOpen(false);
      }
    }
    if (isDownloadMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDownloadMenuOpen]);

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

  const handlePrint = () => {
    setIsSettingsOpen(false);
    printDocument();
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
    shipment.buyerAddress ||
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

  const isId = shipment.previewLanguage === "Bahasa Indonesia";
  const signatoryName = shipment.signatoryName || "Muhajirin Fatona";
  const signatoryRole = shipment.signatoryRole || (isId ? "Direktur Ekspor" : "Export Director");
  const buyerPicName = shipment.buyerPicName || "Mr. Tariq Al-Mansoor";
  const buyerPicRole =
    shipment.buyerPicRole || (isId ? "Direktur Pengadaan" : "Procurement Director");
  const buyerPhone = shipment.buyerPhone || "+971 4 223 4567";
  const buyerEmail = shipment.buyerEmail || "procurement@albarakahfoods.ae";
  const vesselName = shipment.vesselName || shipment.bookingNumber || "KMTC SHIMIZU V.2611N";
  const containerNumber = shipment.containerNumber || "TGHU 2468135";
  const sealNumber = shipment.sealNumber || "IDMKS998877";
  const poNumber = shipment.poNumber || "ABF/LOI/2026/108";
  const bankName = shipment.bankName || "PT. Bank Mandiri (Persero) Tbk";
  const bankAccountNo = shipment.bankAccountNo || "152-00-9876543-2";
  const bankSwift = shipment.bankSwift || "BMRIIDJA";
  const paymentTerms =
    shipment.paymentTerms ||
    (isId
      ? "Telegraphic Transfer (T/T) - 50% Uang Muka (DP), 50% terhadap Salinan B/L"
      : "Telegraphic Transfer (T/T) - 50% Advance Payment, 50% against Copy of B/L");

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

  const amountInWords = numberToWords(totalAmount, currency, isId ? "id" : "en");

  const effectiveContractLayout: "1-page" | "2-page" =
    (typeof window !== "undefined" &&
      (new URLSearchParams(window.location.search).get("contractLayout") as "1-page" | "2-page")) ||
    shipment.contractLayout ||
    "1-page";

  const handleExport = async (format: ExportFormat) => {
    setIsDownloadMenuOpen(false);
    if (format === "pdf") {
      handlePrint();
      return;
    }

    try {
      setIsExporting(true);
      toast.loading(`Mempersiapkan berkas .${format.toUpperCase()}...`, { id: "export-doc" });

      const exportData: ExportDocData = {
        exporterName,
        exporterAddress,
        buyerName,
        buyerAddress,
        buyerCountry,
        buyerPicName,
        buyerPicRole,
        buyerPhone,
        buyerEmail,
        signatoryName,
        signatoryRole,
        poNumber,
        bankName,
        bankAccountNo,
        bankSwift,
        paymentTerms,
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
        contractLayout: effectiveContractLayout,
        contractSpecialTerms: shipment.contractSpecialTerms,
        vesselName,
        blNumber: shipment.blNumber || "KMTC-MKS0091827",
        containerNo: containerNumber,
        sealNo: sealNumber,
        sellerSignatureImage: shipment.sellerSignatureImage,
        sellerSignatureDate: shipment.sellerSignatureDate,
        sellerVerificationCode: shipment.sellerVerificationCode || "IEI-DIGISIG-8849-DXB",
        buyerSignatureImage: shipment.buyerSignatureImage,
        buyerSignatureDate: shipment.buyerSignatureDate,
        buyerVerificationCode: shipment.buyerVerificationCode || "ABF-DIGISIG-1092-DXB",
        includeOfficialStamp: shipment.includeOfficialStamp,
      };

      const docSlug = selectedDocument.toLowerCase().replace(/\s+/g, "_");
      const timestamp = new Date().toISOString().slice(0, 10);
      const baseFilename = `${docSlug}_${timestamp}`;

      if (format === "docx") {
        const blob = await exportToDocx(selectedDocument, exportData, isId);
        downloadBlob(blob, `${baseFilename}.docx`);
        toast.success("Dokumen Word (.docx) berhasil diunduh!", {
          id: "export-doc",
          description: "Dapat langsung diedit di Microsoft Word / Google Docs.",
        });
      } else if (format === "xlsx") {
        const blob = exportToXlsx(selectedDocument, exportData, isId);
        downloadBlob(blob, `${baseFilename}.xlsx`);
        toast.success("Dokumen Excel (.xlsx) berhasil diunduh!", {
          id: "export-doc",
          description: "3 sheet terstruktur: Informasi Dokumen, Finansial & Logistik.",
        });
      } else if (format === "html") {
        const blob = exportToHtml(selectedDocument, exportData, isId);
        downloadBlob(blob, `${baseFilename}.html`);
        toast.success("File Web Standalone (.html) berhasil diunduh!", {
          id: "export-doc",
          description: "Dapat dibuka di browser manapun secara offline.",
        });
      } else if (format === "txt") {
        const blob = exportToTxt(selectedDocument, exportData, isId);
        downloadBlob(blob, `${baseFilename}.txt`);
        toast.success("File Teks (.txt) berhasil diunduh!", {
          id: "export-doc",
          description: "Format teks rapi untuk lampiran email atau sistem ERP.",
        });
      }
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Gagal mengunduh dokumen", {
        id: "export-doc",
        description: err instanceof Error ? err.message : "Terjadi kesalahan sistem.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="doc-center-root">
      <style>{`
        @media print {
          @page {
            size: ${shipment.paperSize === "Letter" ? "letter" : shipment.paperSize === "Legal" ? "legal" : "A4"} ${shipment.documentOrientation ? shipment.documentOrientation.toLowerCase() : "portrait"};
            margin: 6mm 10mm 6mm 10mm;
          }
        }
      `}</style>

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
            title="Ubah data surat, permintaan buyer, kop, format kertas, dan penandatangan"
          >
            <SlidersHorizontal size={14} />
            <span>{isSettingsOpen ? "Tutup Pengaturan" : "Setelan Kop & Format"}</span>
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

          {/* Word Ribbon Toggle Button */}
          <button
            type="button"
            className={`doc-btn-review ${isWordRibbonOpen ? "active" : ""}`}
            onClick={() => setIsWordRibbonOpen((prev) => !prev)}
            title="Tampilkan atau sembunyikan toolbar editor format Word"
          >
            <Edit3 size={14} />
            <span>{isWordRibbonOpen ? "Tutup Toolbar Word" : "Toolbar Word"}</span>
          </button>

          {/* Digital Signature Trigger Button */}
          <button
            type="button"
            className="doc-btn-review"
            onClick={() => handleOpenSignatureModal("seller")}
            title="Bubuhkan tanda tangan digital & stempel resmi"
          >
            <PenTool size={14} />
            <span>Tanda Tangan Digital</span>
            {(shipment.sellerSignatureImage || shipment.buyerSignatureImage) && (
              <span style={{ fontSize: "10px", background: "#dcfce7", color: "#15803d", padding: "1px 5px", borderRadius: "4px", fontWeight: 700, marginLeft: "4px" }}>
                ✓ Siap
              </span>
            )}
          </button>

          <button
            type="button"
            className="doc-btn-print"
            onClick={handlePrint}
            title="Cetak atau simpan dokumen dalam format PDF"
          >
            <Printer size={15} />
            <span>Cetak PDF</span>
          </button>

          {/* Multi-Format Download Dropdown Menu */}
          <div className="doc-download-dropdown-wrap" ref={downloadMenuRef}>
            <button
              type="button"
              className={`doc-btn-download-trigger ${isDownloadMenuOpen ? "active" : ""}`}
              onClick={() => setIsDownloadMenuOpen((prev) => !prev)}
              title="Pilih format unduhan file (PDF, Word, Excel, HTML, Text)"
              disabled={isExporting}
            >
              <FileDown size={15} />
              <span>Unduh File</span>
              <ChevronDown
                size={13}
                style={{
                  transform: isDownloadMenuOpen ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s ease",
                }}
              />
            </button>

            {isDownloadMenuOpen && (
              <div className="doc-download-menu-panel" role="menu">
                <div className="doc-download-menu-header">
                  <span className="doc-download-menu-title">PILIH FORMAT FILE</span>
                  <span className="doc-download-menu-subtitle">{selectedDocument}</span>
                </div>
                <div className="doc-download-menu-items">
                  <button
                    type="button"
                    className="doc-download-item"
                    onClick={() => handleExport("pdf")}
                    role="menuitem"
                  >
                    <div className="doc-format-badge format-pdf">PDF</div>
                    <div className="doc-format-info">
                      <span className="doc-format-name">Dokumen PDF (.pdf)</span>
                      <span className="doc-format-desc">Standar cetak resmi vector kualitas tinggi</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="doc-download-item"
                    onClick={() => handleExport("docx")}
                    role="menuitem"
                  >
                    <div className="doc-format-badge format-docx">DOCX</div>
                    <div className="doc-format-info">
                      <span className="doc-format-name">Microsoft Word (.docx)</span>
                      <span className="doc-format-desc">Dapat diedit untuk penyesuaian klausul kontrak</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="doc-download-item"
                    onClick={() => handleExport("xlsx")}
                    role="menuitem"
                  >
                    <div className="doc-format-badge format-xlsx">XLSX</div>
                    <div className="doc-format-info">
                      <span className="doc-format-name">Microsoft Excel (.xlsx)</span>
                      <span className="doc-format-desc">Spreadsheet rincian barang, finansial & logistik</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="doc-download-item"
                    onClick={() => handleExport("html")}
                    role="menuitem"
                  >
                    <div className="doc-format-badge format-html">HTML</div>
                    <div className="doc-format-info">
                      <span className="doc-format-name">Web Standalone (.html)</span>
                      <span className="doc-format-desc">Tampilan web presisi buka langsung di browser</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="doc-download-item"
                    onClick={() => handleExport("txt")}
                    role="menuitem"
                  >
                    <div className="doc-format-badge format-txt">TXT</div>
                    <div className="doc-format-info">
                      <span className="doc-format-name">Plain Text (.txt)</span>
                      <span className="doc-format-desc">Format teks rapi untuk email & integrasi ERP</span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
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

      {/* 2.5 Word-like Formatting Ribbon Toolbar */}
      {isWordRibbonOpen && (
        <DocWordRibbon
          shipment={shipment}
          update={update}
          isEditMode={isEditMode}
          setIsEditMode={setIsEditMode}
          onOpenSignatureModal={handleOpenSignatureModal}
          onResetDocument={handleResetDocument}
        />
      )}

      {/* 3. Executive Desk Paper Preview */}
      <div className="doc-paper-desk">
        <div
          key={editorKey}
          contentEditable={isEditMode}
          suppressContentEditableWarning={true}
          style={{
            fontFamily: shipment.docEditorFontFamily || "Calibri",
            fontSize: `${shipment.docEditorFontSize || 12}px`,
            lineHeight: shipment.docEditorLineHeight || 1.35,
            textAlign: shipment.docEditorTextAlign || "left",
          }}
          className={`paper-document paper-${shipment.paperSize.toLowerCase()} paper-${shipment.documentOrientation.toLowerCase()} paper-template-${shipment.documentTemplate.toLowerCase().replace(" ", "-")} doc-type-${selectedDocument.toLowerCase().replace(/\s+/g, "-")} ${selectedDocument === "Sales Contract" ? `doc-contract-mode-${effectiveContractLayout === "2-page" ? "2page" : "1page"}` : ""} ${isEditMode ? "word-editable-mode" : ""}`}
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
              buyerPicName={buyerPicName}
              buyerPicRole={buyerPicRole}
              buyerPhone={buyerPhone}
              buyerEmail={buyerEmail}
              signatoryName={signatoryName}
              signatoryRole={signatoryRole}
              poNumber={poNumber}
              bankName={bankName}
              bankAccountNo={bankAccountNo}
              bankSwift={bankSwift}
              paymentTerms={paymentTerms}
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
              onOpenSignatureModal={handleOpenSignatureModal}
            />
          )}

          {selectedDocument === "Sales Contract" && (
            <SalesContractDoc
              shipment={shipment}
              contractLayout={effectiveContractLayout}
              exporterName={exporterName}
              exporterAddress={exporterAddress}
              buyerName={buyerName}
              buyerAddress={buyerAddress}
              buyerCountry={buyerCountry}
              buyerPicName={buyerPicName}
              buyerPicRole={buyerPicRole}
              buyerPhone={buyerPhone}
              buyerEmail={buyerEmail}
              signatoryName={signatoryName}
              signatoryRole={signatoryRole}
              poNumber={poNumber}
              bankName={bankName}
              bankAccountNo={bankAccountNo}
              bankSwift={bankSwift}
              paymentTerms={paymentTerms}
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
              contractSpecialTerms={shipment.contractSpecialTerms}
              isId={isId}
              onOpenSignatureModal={handleOpenSignatureModal}
            />
          )}

          {selectedDocument === "Commercial Invoice" && (
            <CommercialInvoiceDoc
              shipment={shipment}
              exporterName={exporterName}
              buyerName={buyerName}
              buyerAddress={buyerAddress}
              buyerCountry={buyerCountry}
              buyerPicName={buyerPicName}
              buyerPhone={buyerPhone}
              buyerEmail={buyerEmail}
              signatoryName={signatoryName}
              signatoryRole={signatoryRole}
              vesselName={vesselName}
              containerNumber={containerNumber}
              sealNumber={sealNumber}
              poNumber={poNumber}
              paymentTerms={paymentTerms}
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
              onOpenSignatureModal={handleOpenSignatureModal}
            />
          )}

          {selectedDocument === "Packing List" && (
            <PackingListDoc
              shipment={shipment}
              exporterName={exporterName}
              buyerName={buyerName}
              buyerAddress={buyerAddress}
              buyerCountry={buyerCountry}
              buyerPicName={buyerPicName}
              buyerPhone={buyerPhone}
              buyerEmail={buyerEmail}
              signatoryName={signatoryName}
              signatoryRole={signatoryRole}
              vesselName={vesselName}
              containerNumber={containerNumber}
              sealNumber={sealNumber}
              poNumber={poNumber}
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
              onOpenSignatureModal={handleOpenSignatureModal}
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
              buyerCountry={buyerCountry}
              buyerPicName={buyerPicName}
              buyerPhone={buyerPhone}
              buyerEmail={buyerEmail}
              signatoryName={signatoryName}
              signatoryRole={signatoryRole}
              vesselName={vesselName}
              containerNumber={containerNumber}
              sealNumber={sealNumber}
              poNumber={poNumber}
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
              onOpenSignatureModal={handleOpenSignatureModal}
            />
          )}
        </div>
      </div>

      {/* Digital Signature & Official E-Seal Modal */}
      <DigitalSignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        shipment={shipment}
        update={update}
        initialParty={signatureParty}
      />
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
            <h1 className="company-name">{exporterName}</h1>
            <p className="company-details">{exporterAddress}</p>
            <p className="company-contact">
              Telp: +62 812 3456 7890 · Email: official@indicoexport.com
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
  signatoryName = "Muhajirin Fatona",
  role = "Export Director",
  isId = false,
  shipment,
  onOpenSignatureModal,
}: {
  exporterName: string;
  signatoryName?: string;
  role?: string;
  showStamp?: boolean;
  isId?: boolean;
  shipment?: Shipment;
  onOpenSignatureModal?: (party?: "seller" | "buyer") => void;
}) {
  const displayRole = isId
    ? role === "Export Director"
      ? "Direktur Ekspor"
      : role === "Logistics & Export Manager"
        ? "Manajer Logistik & Ekspor"
        : role
    : role;

  const hasSignature = !!shipment?.sellerSignatureImage;
  const includeStamp = shipment?.includeOfficialStamp ?? true;
  const stampColor = shipment?.officialStampColor || "red";

  return (
    <div className="official-sig-block">
      <span className="sig-signed-for">
        {isId ? "Ditandatangani untuk dan atas nama:" : "Signed for and on behalf of:"}
      </span>
      <b className="sig-company-name">{exporterName}</b>
      <div className="sig-canvas-zone">
        {hasSignature ? (
          <div className="sig-rendered-wrap">
            <img
              src={shipment.sellerSignatureImage}
              alt="Digital Signature"
              className="doc-rendered-signature"
            />
            {includeStamp && (
              <div className={`doc-seal-overlay seal-${stampColor}`} title="Stempel Digital Resmi Validated">
                <div className="seal-circle-outer">
                  <div className="seal-circle-inner">
                    <span className="seal-txt-top">★ PT. INDICO EXPORT ★</span>
                    <span className="seal-txt-star">★ VALIDATED ★</span>
                    <span className="seal-txt-sub">OFFICIAL SEAL</span>
                    <span className="seal-txt-bot">INDONESIA</span>
                  </div>
                </div>
              </div>
            )}
            <div className="sig-verify-badge">
              <span className="sig-verify-check">✓</span>
              <span>Terverifikasi Digital ({shipment.sellerSignatureDate || "2026"})</span>
            </div>
            {onOpenSignatureModal && (
              <button
                type="button"
                className="sig-edit-hover-btn"
                onClick={() => onOpenSignatureModal("seller")}
                title="Ganti atau perbarui tanda tangan digital"
              >
                Ubah Tanda Tangan
              </button>
            )}
          </div>
        ) : (
          <div className="sig-placeholder-wrap">
            {onOpenSignatureModal ? (
              <button
                type="button"
                className="doc-btn-click-sign"
                onClick={() => onOpenSignatureModal("seller")}
                title="Klik untuk membubuhkan tanda tangan digital & stempel resmi"
              >
                <PenTool size={13} />
                <span>+ Klik Tanda Tangan Digital & Stempel</span>
              </button>
            ) : (
              <div className="sig-box-space" />
            )}
          </div>
        )}
      </div>
      <b className="sig-signatory-name">{signatoryName}</b>
      <span className="sig-signatory-title">{displayRole}</span>
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
  buyerPicName,
  buyerPicRole,
  buyerPhone,
  buyerEmail,
  signatoryName,
  signatoryRole,
  poNumber,
  bankName,
  bankAccountNo,
  bankSwift,
  paymentTerms,
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
  onOpenSignatureModal,
}: {
  shipment: Shipment;
  exporterName: string;
  buyerName: string;
  buyerAddress: string;
  buyerCountry: string;
  buyerPicName?: string;
  buyerPicRole?: string;
  buyerPhone?: string;
  buyerEmail?: string;
  signatoryName?: string;
  signatoryRole?: string;
  poNumber?: string;
  bankName?: string;
  bankAccountNo?: string;
  bankSwift?: string;
  paymentTerms?: string;
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
  onOpenSignatureModal?: (party?: "seller" | "buyer") => void;
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
          <p className="doc-entity-contact">Telp: {buyerPhone || "+971 4 223 4567"} | Email: {buyerEmail || "procurement@albarakahfoods.ae"}</p>
          <p className="doc-entity-contact">
            {isId ? "Narahubung:" : "Contact Person:"}{" "}
            <b>
              {buyerPicName || "Mr. Tariq Al-Mansoor"}{" "}
              {isId ? `(${buyerPicRole || "Direktur Pengadaan"})` : `(${buyerPicRole || "Procurement Director"})`}
            </b>
          </p>
        </div>

        <div className="doc-box">
          <div className="meta-pair">
            <span className="meta-label">{isId ? "No. Faktur:" : "Invoice No.:"}</span>
            <b className="meta-value font-mono">PI/IEI-DXB/X/2026/001</b>
          </div>
          <div className="meta-pair">
            <span className="meta-label">{isId ? "Tanggal:" : "Date:"}</span>
            <b className="meta-value">{isId ? "31 Oktober 2026" : "October 31, 2026"}</b>
          </div>
          <div className="meta-pair">
            <span className="meta-label">{isId ? "Masa Berlaku:" : "Validity:"}</span>
            <b className="meta-value">{isId ? "14 November 2026 (14 Hari)" : "November 14, 2026 (14 Days)"}</b>
          </div>
          <div className="meta-pair">
            <span className="meta-label">{isId ? "Ref. Pembeli:" : "Buyer Ref:"}</span>
            <b className="meta-value font-mono">{poNumber || shipment.poNumber || "ABF/LOI/2026/108"}</b>
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
              {paymentTerms ||
                (isId
                  ? "Telegraphic Transfer (T/T) - 50% Uang Muka (DP), 50% terhadap Salinan B/L"
                  : "Telegraphic Transfer (T/T) - 50% Advance Payment, 50% against Copy of B/L")}
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
            <td className="text-center font-normal">1</td>
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
            <td className="font-mono text-center font-normal">{hsCode}</td>
            <td className="text-right font-normal">{formatNumber(netWeightMT, 2)} MT</td>
            <td className="text-right font-normal">{formatMoney(unitPricePerMT, currency)} / MT</td>
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
        <span className="font-medium">{isId ? "Terbilang:" : "Say:"}</span> <b className="font-bold italic">{amountInWords}</b>
      </div>

      <div className="doc-bank-card">
        <div className="bank-card-title">
          <span>{isId ? "RINCIAN REKENING BANK PENERIMA (BENEFICIARY)" : "BANK DETAILS FOR BENEFICIARY"}</span>
        </div>
        <table className="bank-card-table">
          <tbody>
            <tr>
              <td className="bank-lbl">{isId ? "Nama Bank:" : "Bank Name:"}</td>
              <td className="bank-val font-bold">{bankName || "PT. Bank Mandiri (Persero) Tbk - KCP Makassar Panakkukang"}</td>
            </tr>
            <tr>
              <td className="bank-lbl">{isId ? "Alamat Bank:" : "Bank Address:"}</td>
              <td className="bank-val font-bold">Jl. Boulevard, Panakkukang, Makassar, South Sulawesi, Indonesia</td>
            </tr>
            <tr>
              <td className="bank-lbl">{isId ? "Nama Rekening:" : "Account Name:"}</td>
              <td className="bank-val font-bold">{exporterName}</td>
            </tr>
            <tr>
              <td className="bank-lbl">{isId ? "Nomor Rekening:" : "Account Number:"}</td>
              <td className="bank-val font-mono font-bold">{bankAccountNo || "152-00-9876543-2"} {isId ? "(Rekening Valas USD)" : "(USD Account)"}</td>
            </tr>
            <tr>
              <td className="bank-lbl">{isId ? "Kode SWIFT / BIC:" : "SWIFT Code:"}</td>
              <td className="bank-val font-mono font-bold">{bankSwift || "BMRIIDJA"}</td>
            </tr>
            <tr>
              <td className="bank-lbl">{isId ? "Mata Uang:" : "Currency:"}</td>
              <td className="bank-val font-bold">{currency} {isId ? "(Dolar Amerika Serikat)" : "(United States Dollar)"}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="doc-single-signature-wrap">
        <OfficialStampAndSignature
          exporterName={exporterName}
          signatoryName={signatoryName}
          role={signatoryRole}
          isId={isId}
          shipment={shipment}
          onOpenSignatureModal={onOpenSignatureModal}
        />
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// 2. SALES CONTRACT (SC) COMPONENT
// --------------------------------------------------------------------------
function SalesContractDoc({
  shipment,
  exporterName,
  exporterAddress,
  buyerName,
  buyerAddress,
  buyerCountry,
  buyerPicName,
  buyerPicRole,
  buyerPhone,
  buyerEmail,
  signatoryName,
  signatoryRole,
  poNumber,
  bankName,
  bankAccountNo,
  bankSwift,
  paymentTerms,
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
  contractSpecialTerms,
  contractLayout = "1-page",
  isId = false,
  onOpenSignatureModal,
}: {
  shipment?: Shipment;
  exporterName: string;
  exporterAddress: string;
  buyerName: string;
  buyerAddress: string;
  buyerCountry: string;
  buyerPicName?: string;
  buyerPicRole?: string;
  buyerPhone?: string;
  buyerEmail?: string;
  signatoryName?: string;
  signatoryRole?: string;
  poNumber?: string;
  bankName?: string;
  bankAccountNo?: string;
  bankSwift?: string;
  paymentTerms?: string;
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
  contractSpecialTerms?: string;
  contractLayout?: "1-page" | "2-page";
  isId?: boolean;
  onOpenSignatureModal?: (party?: "seller" | "buyer") => void;
}) {
  const is2Page = contractLayout === "2-page";

  return (
    <div className={`doc-content-wrapper doc-contract-wrapper ${is2Page ? "mode-2page" : "mode-1page"}`}>
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
        {poNumber && (
          <>
            <span>|</span>
            <span>
              {isId ? "Ref. Buyer PO:" : "Buyer PO Ref:"} <b>{poNumber}</b>
            </span>
          </>
        )}
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
            Telp: +62 812 3456 7890 | Email: official@indicoexport.com
          </p>
          <p className="party-tax">
            {isId ? "Up:" : "Attn:"} {signatoryName || "Muhajirin Fatona"} (
            {isId ? signatoryRole || "Direktur Ekspor" : signatoryRole || "Export Director"})
          </p>
        </div>

        <div className="contract-party-card">
          <div className="contract-party-header">
            {isId ? "PIHAK PEMBELI (THE BUYER)" : "THE BUYER"}
          </div>
          <b className="party-name">{buyerName}</b>
          <p className="party-address">{buyerAddress}, {buyerCountry}</p>
          <p className="party-phone">
            Telp: {buyerPhone || "+971 4 223 4567"} | Email: {buyerEmail || "procurement@albarakahfoods.ae"}
          </p>
          <p className="party-tax">
            {isId ? "Up:" : "Attn:"} {buyerPicName || "Mr. Tariq Al-Mansoor"}{" "}
            ({isId ? buyerPicRole || "Direktur Pengadaan" : buyerPicRole || "Procurement Director"})
          </p>
        </div>
      </div>

      {/* JIKA MODE 1-PAGE (STANDAR RESMI): Seluruh 6 Pasal mengalir utuh dalam 1 lembar tanpa pemisah */}
      {!is2Page ? (
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
                ? `Dikemas dalam karung kertas Kraft 3 lapis dengan lapisan plastik PE food-grade 20 kg neto. Total ${formatNumber(bagsCount)} karung dimuat dalam 1 x 20ft Kontainer Kering.`
                : `Packed in 20 kg net weight food-grade PE inner liner and 3-ply Kraft Paper outer bag. Total ${formatNumber(bagsCount)} bags loaded in 1 x 20ft Dry Container.`}
            </p>
            <p>
              <b>{isId ? "Harga & Nilai:" : "Price & Value:"}</b> {currency}{" "}
              {formatNumber(unitPricePerMT, 2)} / MT {incoterm} Pelabuhan Makassar, Indonesia (Incoterms 2020) |{" "}
              <b>{isId ? "Total Nilai:" : "Total Value:"}</b> {currency} {formatNumber(totalAmount, 2)}{" "}
              ({isId ? "Terbilang:" : "Say:"} {amountInWords}).
            </p>
          </div>

          <div className="contract-article-block">
            <h4 className="article-title">
              {isId ? "PASAL 3: SYARAT PEMBAYARAN" : "ARTICLE 3: TERMS OF PAYMENT"}
            </h4>
            <p>
              {isId
                ? `Pembayaran melalui Telegraphic Transfer (T/T) ke rekening Penjual (${bankName || "PT. Bank Mandiri (Persero) Tbk"}, No. Rek: ${bankAccountNo || "152-00-9876543-2"}, SWIFT: ${bankSwift || "BMRIIDJA"}):`
                : `Payment by Telegraphic Transfer (T/T) to Seller's designated bank account (${bankName || "PT. Bank Mandiri (Persero) Tbk"}, Acc No: ${bankAccountNo || "152-00-9876543-2"}, SWIFT: ${bankSwift || "BMRIIDJA"}):`}
            </p>
            <ol className="article-ordered-list">
              <li>
                <b>{isId ? "Ketentuan:" : "Terms:"}</b>{" "}
                {paymentTerms ||
                  (isId
                    ? `50% Uang Muka (DP) (${currency} ${formatNumber(totalAmount * 0.5, 2)}) dibayarkan dalam waktu 3 hari kerja.`
                    : `50% Down Payment (${currency} ${formatNumber(totalAmount * 0.5, 2)}) payable within 3 working days.`)}
              </li>
              <li>
                <b>
                  {isId
                    ? `50% Pelunasan Sisa (${currency} ${formatNumber(totalAmount * 0.5, 2)})`
                    : `50% Balance Payment (${currency} ${formatNumber(totalAmount * 0.5, 2)})`}
                </b>{" "}
                {isId
                  ? "dibayarkan dalam 5 hari kerja terhadap salinan pindaian dokumen pengapalan lengkap. Dokumen asli dikirim setelah pelunasan 100% diterima."
                  : "payable within 5 working days against scanned copies of full set shipping documents. Original documents released upon receipt of 100% full payment."}
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
              <b>{isId ? "Pengapalan Sebagian:" : "Partial Shipment:"}</b> {isId ? "Tidak Diizinkan" : "Not Allowed"} |{" "}
              <b>{isId ? "Pindah Kapal (Transshipment):" : "Transshipment:"}</b> {isId ? "Diizinkan" : "Allowed"}
            </p>
          </div>

          <div className="contract-article-block">
            <h4 className="article-title">
              {isId ? "PASAL 5: DOKUMEN YANG DIPERLUKAN" : "ARTICLE 5: REQUIRED DOCUMENTS"}
            </h4>
            <p>
              {isId
                ? "Penjual wajib menyediakan: (1) Full Set (3/3) B/L Asli Clean on Board Ocean; (2) Faktur Komersial Asli rangkap 3; (3) Packing List Asli rangkap 3; (4) COO (Surat Keterangan Asal / Form AK / e-COO); (5) Sertifikat Fitosanitari Karantina Pertanian; (6) Sertifikat Analisis (COA) dan Sertifikat Halal."
                : "Seller shall provide: (1) Full Set (3/3) Original Clean on Board Ocean Bill of Lading; (2) Signed Commercial Invoice in 3 originals; (3) Signed Packing List in 3 originals; (4) Certificate of Origin (COO / Form AK / e-COO); (5) Phytosanitary Certificate; (6) Certificate of Analysis (COA) and Halal Certificate."}
            </p>
          </div>

          <div className="contract-article-block">
            <h4 className="article-title">
              {isId ? "PASAL 6: KEADAAN KAHAR & ARBITRASE" : "ARTICLE 6: FORCE MAJEURE & ARBITRATION"}
            </h4>
            <p>
              {isId
                ? "Keadaan Kahar (bencana alam, perang, embargo pemerintah) membebaskan kedua pihak dari tanggung jawab keterlambatan. Setiap perselisihan diselesaikan secara musyawarah mufakat, atau diajukan ke Badan Arbitrase Nasional Indonesia (BANI) sesuai dengan peraturan ICC yang berlaku."
                : "Neither party shall be liable for delay or failure to perform due to Force Majeure (natural disasters, war, government embargo). Any disputes shall be settled amicably, failing which the dispute shall be submitted to the Indonesian National Board of Arbitration (BANI) in accordance with ICC rules."}
            </p>
          </div>

          {contractSpecialTerms && contractSpecialTerms.trim() !== "" && (
            <div className="contract-article-block">
              <h4 className="article-title">
                {isId ? "PASAL 7: KETENTUAN KHUSUS / TAMBAHAN" : "ARTICLE 7: SPECIAL CONDITIONS"}
              </h4>
              <p style={{ whiteSpace: "pre-line" }}>{contractSpecialTerms}</p>
            </div>
          )}
        </div>
      ) : (
        /* JIKA MODE 2-PAGE: Pembagian proporsional & padat hukum ICC (Pasal 1-5 di Halaman 1, Pasal 6-10 di Halaman 2) */
        <>
          {/* HALAMAN 1 ARTIKEL: Komersial, Kuantitas, Harga, Pembayaran & Jadwal Pengapalan */}
          <div className="contract-articles-wrapper contract-articles-page-1">
            <div className="contract-article-block">
              <h4 className="article-title">
                {isId ? "PASAL 1: KOMODITAS & STANDAR SPESIFIKASI" : "ARTICLE 1: COMMODITY & SPECIFICATION STANDARDS"}
              </h4>
              <p>
                <b>{isId ? "Komoditas:" : "Commodity:"}</b> {productName} |{" "}
                <b>{isId ? "Kode Harmonized System (HS):" : "Harmonized System (HS) Code:"}</b> {hsCode}
              </p>
              <p>
                <b>{isId ? "Spesifikasi Mutu:" : "Quality Specification:"}</b>{" "}
                {isId
                  ? "Kualitas Mutu Ekspor Grade A (Ekspor Premium), Kadar Air ≤ 2.5%, Ukuran Butiran Granul Mesh 16-18, Kelarutan 99%, Gula Pereduksi Maks 6%, Sukrosa 80-85%, Timbal (Pb) < 0.2 mg/kg, Aflatoksin Negatif, Bebas dari hama serangga hidup dan kontaminan asing."
                  : "Grade A Export Quality (Premium Export Grade), Moisture Content ≤ 2.5%, Granule Size Mesh 16-18, Water Solubility 99%, Reducing Sugar Max 6%, Sucrose Content 80-85%, Lead (Pb) < 0.2 mg/kg, Aflatoxin Negative, Free from live insects and foreign contaminants."}
              </p>
            </div>

            <div className="contract-article-block">
              <h4 className="article-title">
                {isId ? "PASAL 2: KUANTITAS, KEMASAN & TOLERANSI" : "ARTICLE 2: QUANTITY, PACKAGING & TOLERANCE"}
              </h4>
              <p>
                <b>{isId ? "Kuantitas Kontrak:" : "Contract Quantity:"}</b>{" "}
                {isId
                  ? `${formatNumber(netWeightMT, 0)} Metrik Ton (${formatNumber(netWeightMT * 1000, 0)} Kg neto) dengan batas toleransi kuantitas pengapalan +/- 2% atas diskresi Penjual sesuai standar perdagangan komoditas internasional.`
                  : `${formatNumber(netWeightMT, 0)} Metric Tons (${formatNumber(netWeightMT * 1000, 0)} Kgs net weight) with shipment tolerance of +/- 2% at Seller's discretion in line with international commodity trading practice.`}
              </p>
              <p>
                <b>{isId ? "Standar Kemasan:" : "Packaging Standard:"}</b>{" "}
                {isId
                  ? `Dikemas dalam karung kertas Kraft 3 lapis (multi-wall 3-ply Kraft paper) berkekuatan tinggi dengan lapisan kantong dalam plastik PE (Polyethylene) food-grade 20 kg neto per karung. Total muatan ${formatNumber(bagsCount)} karung dimuat rapi dalam 1 x 20ft Full Container Load (FCL Food Grade Dry Container).`
                  : `Packed in 20 kg net weight heavy-duty 3-ply multiwall Kraft paper outer bags with food-grade PE (Polyethylene) inner liner. Total ${formatNumber(bagsCount)} bags stowed in 1 x 20ft Full Container Load (FCL Food Grade Dry Container).`}
              </p>
            </div>

            <div className="contract-article-block">
              <h4 className="article-title">
                {isId ? "PASAL 3: NILAI KONTRAK & KETENTUAN KOMERSIAL" : "ARTICLE 3: CONTRACT VALUE & COMMERCIAL TERMS"}
              </h4>
              <p>
                <b>{isId ? "Harga Satuan Kontrak:" : "Contract Unit Price:"}</b> {currency}{" "}
                {formatNumber(unitPricePerMT, 2)} / MT {incoterm} Pelabuhan Makassar, Sulawesi Selatan, Indonesia (Incoterms 2020).
              </p>
              <p>
                <b>{isId ? "Total Nilai Kontrak:" : "Total Contract Value:"}</b> {currency}{" "}
                {formatNumber(totalAmount, 2)} ({isId ? "Terbilang:" : "Say:"} {amountInWords}).
              </p>
              <p>
                {isId
                  ? "Harga tersebut sudah mencakup biaya pengadaan, pengemasan ekspor, pengangkutan lokal, fumigasi, penanganan terminal di pelabuhan muat, dan pengurusan kepabeanan ekspor (PEB) Indonesia."
                  : "The unit price includes product cost, export packaging, inland transport, fumigation, terminal handling charges at Port of Loading, and Indonesian export customs clearance."}
              </p>
            </div>

            <div className="contract-article-block">
              <h4 className="article-title">
                {isId ? "PASAL 4: SYARAT PEMBAYARAN & REKENING BANK" : "ARTICLE 4: TERMS OF PAYMENT & BANKING PROTOCOL"}
              </h4>
              <p>
                {isId
                  ? `Seluruh pembayaran wajib ditransfer melalui Telegraphic Transfer (T/T) dalam mata uang USD ke rekening bank resmi Penjual (${bankName || "PT. Bank Mandiri (Persero) Tbk"}, No. Rekening: ${bankAccountNo || "152-00-9876543-2"}, SWIFT: ${bankSwift || "BMRIIDJA"}, Atas Nama: ${exporterName}) dengan skema bertahap:`
                  : `All payments shall be remitted via Telegraphic Transfer (T/T) in USD currency to Seller's designated bank account (${bankName || "PT. Bank Mandiri (Persero) Tbk"}, Acc No: ${bankAccountNo || "152-00-9876543-2"}, SWIFT: ${bankSwift || "BMRIIDJA"}, Beneficiary: ${exporterName}) according to the following schedule:`}
              </p>
              <ol className="article-ordered-list">
                <li>
                  <b>{isId ? "Uang Muka (Down Payment 50%):" : "Advance Deposit (50% Down Payment):"}</b>{" "}
                  {currency} {formatNumber(totalAmount * 0.5, 2)}{" "}
                  {isId
                    ? "wajib disetorkan oleh Pembeli dalam waktu 3 (tiga) hari kerja perbankan setelah penandatanganan Kontrak Penjualan ini untuk memulai proses produksi, kemasan, dan pemesanan ruang kapal."
                    : "payable within 3 (three) banking days following the execution of this Sales Contract to initiate production, export packing, and vessel booking."}
                </li>
                <li>
                  <b>{isId ? "Pelunasan Sisa (50% Balance Payment):" : "Final Balance (50% Balance Payment):"}</b>{" "}
                  {currency} {formatNumber(totalAmount * 0.5, 2)}{" "}
                  {isId
                    ? "wajib disetorkan dalam waktu 5 (lima) hari kerja setelah diterimanya salinan pindaian (scanned copy) dokumen pengapalan lengkap termasuk Bill of Lading asli. Dokumen fisik asli akan segera dikirimkan melalui kurir ekspres internasional (DHL/FedEx) atau diinstruksikan melalui Telex Release setelah pembayaran 100% lunas tercatat di rekening Penjual."
                    : "payable within 5 (five) working days upon receipt of scanned copies of complete shipping documents including original Bill of Lading. Original documents shall be dispatched via international express courier (DHL/FedEx) or Telex Released upon 100% full fund clearance."}
                </li>
              </ol>
            </div>

            <div className="contract-article-block">
              <h4 className="article-title">
                {isId ? "PASAL 5: JADWAL PENGAPALAN & LOGISTIK MARITIM" : "ARTICLE 5: SHIPMENT & MARITIME LOGISTICS SCHEDULE"}
              </h4>
              <p>
                <b>{isId ? "Pelabuhan Muat (POL):" : "Port of Loading (POL):"}</b> {pol} |{" "}
                <b>{isId ? "Pelabuhan Bongkar (POD):" : "Port of Discharge (POD):"}</b> {pod}
              </p>
              <p>
                <b>{isId ? "Batas Akhir Pengapalan (Latest Shipment):" : "Latest Shipment Date:"}</b>{" "}
                {isId ? "25 November 2026" : "November 25, 2026"} |{" "}
                <b>{isId ? "Pengapalan Parsial (Partial Shipment):" : "Partial Shipment:"}</b>{" "}
                {isId ? "Tidak Diizinkan" : "Not Allowed"} |{" "}
                <b>{isId ? "Pindah Kapal (Transshipment):" : "Transshipment:"}</b>{" "}
                {isId ? "Diizinkan" : "Allowed"}
              </p>
            </div>

            <div className="contract-article-block">
              <h4 className="article-title">
                {isId ? "PASAL 6: DOKUMEN PENGAPALAN RESMI (SHIPPING DOCUMENTS)" : "ARTICLE 6: OFFICIAL SHIPPING & EXPORT DOCUMENTS"}
              </h4>
              <p>
                {isId
                  ? "Penjual berkewajiban menyiapkan dan menyerahkan kelengkapan dokumen ekspor standar internasional kepada Pembeli sebagai berikut: (1) 1 Set Lengkap (3/3) Bill of Lading (B/L) Asli Clean on Board Ocean diterbitkan untuk order pembeli; (2) Faktur Komersial (Commercial Invoice) Asli bertandatangan bermeterai/stempel dalam rangkap 3; (3) Daftar Kemasan (Packing List) Asli bertandatangan dalam rangkap 3; (4) Surat Keterangan Asal (Certificate of Origin / COO Form AK / e-COO) resmi dari instansi pemerintah/KADIN; (5) Sertifikat Fitosanitari resmi dari Badan Karantina Pertanian Republik Indonesia; (6) Sertifikat Analisis Mutu Laboratorium (COA) dan Sertifikat Halal resmi."
                  : "Seller shall prepare and deliver the following complete set of international export documents to the Buyer: (1) Full Set (3/3) Original Clean on Board Ocean Bill of Lading; (2) Signed Commercial Invoice in 3 originals; (3) Signed Packing List in 3 originals; (4) Certificate of Origin (COO / Form AK / e-COO) issued by Indonesian Chamber of Commerce / Ministry of Trade; (5) Phytosanitary Certificate issued by Indonesian Agricultural Quarantine Agency; (6) Certificate of Analysis (COA) and official Halal Certificate."}
              </p>
            </div>

            <div className="contract-article-block">
              <h4 className="article-title">
                {isId ? "PASAL 7: PEMERIKSAAN MUTU, SURVEYOR & VERIFIKASI" : "ARTICLE 7: QUALITY INSPECTION, SURVEYOR & VERIFICATION"}
              </h4>
              <p>
                {isId
                  ? "Pemeriksaan kuantitas, kemasan dan mutu akhir dilakukan di gudang pelabuhan muat sebelum pemuatan ke dalam peti kemas oleh surveyor independen terakreditasi internasional (seperti Sucofindo / PT Surveyor Indonesia / SGS). Sertifikat hasil inspeksi yang diterbitkan surveyor menjadi bukti pemenuhan spesifikasi sebelum keberangkatan kapal. Pembeli berhak melakukan verifikasi inspeksi mandiri atau menunjuk perwakilan pada saat pemuatan dengan seluruh biaya koordinasi ditanggung pihak masing-masing."
                  : "Final quantity, packaging, and quality inspection shall be conducted at Port of Loading warehouse prior to container stuffing by an accredited independent surveyor (such as Sucofindo / Surveyor Indonesia / SGS). The inspection certificate issued serves as prima facie evidence of conformity prior to vessel departure. Buyer is entitled to perform inspection verification at their discretion at Port of Loading."}
              </p>
            </div>
          </div>

          {/* PEMISAH HALAMAN: Page Break Print & Divider Visual Layar */}
          <div className="doc-contract-page-break" />
          <div className="doc-contract-screen-divider">
            <span>{isId ? "— HALAMAN 2: PROSEDUR KLAIM, KAHAR & PENGESAHAN KONTRAK —" : "— PAGE 2: CLAIMS, FORCE MAJEURE & CONTRACT EXECUTION —"}</span>
          </div>

          {/* HEADER RESMI AWAL HALAMAN 2 */}
          <div className="doc-contract-page-2-header">
            <span>{isId ? "KONTRAK PENJUALAN EKSPOR (SALES CONTRACT)" : "SALES CONTRACT"} · REF: SC/IEI-ABF/XI/2026/001</span>
            <span>{isId ? "HALAMAN 2 DARI 2" : "PAGE 2 OF 2"}</span>
          </div>

          {/* HALAMAN 2 ARTIKEL: Dokumen, Inspeksi, Klaim, Kahar & Arbitrase */}
          <div className="contract-articles-wrapper contract-articles-page-2">
            <div className="contract-article-block">
              <h4 className="article-title">
                {isId ? "PASAL 8: PROSEDUR KLAIM & GANTI RUGI" : "ARTICLE 8: CLAIMS PROCEDURE, DISCREPANCIES & REMEDIES"}
              </h4>
              <p>
                {isId
                  ? "Pembeli berhak memeriksa kondisi fisik kargo setibanya di Pelabuhan Bongkar (Jebel Ali Port). Setiap klaim atas perbedaan mutu spesifikasi atau susut kuantitas wajib diajukan secara tertulis dalam jangka waktu paling lambat 14 (empat belas) hari kalender terhitung sejak tanggal pembongkaran kontainer di pelabuhan tujuan, dengan menyertakan bukti tertulis berupa Laporan Survei Bersama (Joint Survey Report) dari surveyor internasional terakreditasi. Klaim yang diajukan melampaui tenggat waktu tersebut dinyatakan gugur demi hukum."
                  : "The Buyer is entitled to inspect cargo upon discharge at Port of Discharge (Jebel Ali Port). Any claims regarding quality discrepancy or weight shortage must be lodged in writing within 14 (fourteen) calendar days from the container discharge date, supported by a formal Joint Survey Report from an accredited international surveyor. Any claims submitted beyond this period shall be deemed null and void."}
              </p>
            </div>

            <div className="contract-article-block">
              <h4 className="article-title">
                {isId ? "PASAL 9: KEADAAN KAHAR (FORCE MAJEURE) & KESULITAN BESAR" : "ARTICLE 9: FORCE MAJEURE & HARDSHIP CLAUSE"}
              </h4>
              <p>
                {isId
                  ? "Tidak ada pihak yang dianggap melanggar kontrak atau bertanggung jawab atas keterlambatan kinerja akibat Keadaan Kahar sebagaimana didefinisikan dalam ICC Force Majeure Clause 2020 (termasuk namun tidak terbatas pada bencana alam dahsyat, perang, blokade maritim militer, kerusuhan, pandemi global, dan kebijakan embargo atau larangan ekspor/impor darurat pemerintah). Pihak yang terdampak wajib memberitahukan pihak lainnya secara tertulis disertai bukti resmi dalam waktu 7 (tujuh) hari kalender sejak peristiwa terjadi."
                  : "Neither party shall be held liable for delay or failure in performing contract obligations resulting from Force Majeure as defined under the ICC Force Majeure Clause 2020 (including natural disasters, armed conflicts, maritime blockades, pandemics, and emergency statutory export/import bans). The affected party shall notify the other party in writing with official verification within 7 (seven) calendar days of occurrence."}
              </p>
            </div>

            <div className="contract-article-block">
              <h4 className="article-title">
                {isId ? "PASAL 10: HUKUM YANG BERLAKU & PENYELESAIAN SENGKETA" : "ARTICLE 10: GOVERNING LAW & DISPUTE RESOLUTION"}
              </h4>
              <p>
                {isId
                  ? "Kontrak ini diatur dan ditafsirkan sesuai dengan ketentuan Incoterms 2020 dan prinsip hukum perdagangan internasional ICC. Setiap perselisihan atau sengketa yang timbul wajib diselesaikan terlebih dahulu melalui musyawarah mufakat secara itikad baik dalam waktu 30 (tiga puluh) hari kalender. Apabila mufakat tidak tercapai, perselisihan akan diputus melalui arbitrase mengikat pada Badan Arbitrase Nasional Indonesia (BANI) di Jakarta atau ICC International Court of Arbitration, dengan putusan yang bersifat final dan mengikat kedua belah pihak."
                  : "This contract shall be construed in accordance with Incoterms 2020 and recognized international commercial practices. Any disputes arising out of this contract shall first be settled through amicable good-faith negotiations within 30 (thirty) days. Failing amicable resolution, the dispute shall be finally resolved by binding arbitration under the rules of the Indonesian National Board of Arbitration (BANI) or ICC International Court of Arbitration, whose award shall be final and binding."}
              </p>
            </div>

            {contractSpecialTerms && contractSpecialTerms.trim() !== "" && (
              <div className="contract-article-block">
                <h4 className="article-title">
                  {isId ? "PASAL 11: KETENTUAN KHUSUS / KESEPAKATAN TAMBAHAN" : "ARTICLE 11: SPECIAL CONDITIONS & CUSTOM ADDENDA"}
                </h4>
                <p style={{ whiteSpace: "pre-line" }}>{contractSpecialTerms}</p>
              </div>
            )}
          </div>
        </>
      )}

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
          <b className="sig-company-name">{isId ? `Untuk ${buyerName}` : `For ${buyerName}`}</b>
          <div className="sig-box-space">
            {shipment?.buyerSignatureImage ? (
              <div className="sig-rendered-wrap">
                <img
                  src={shipment.buyerSignatureImage}
                  alt="Buyer Signature"
                  className="doc-rendered-signature"
                />
                <div className="sig-verify-badge">
                  <span className="sig-verify-check">✓</span>
                  <span>E-Signed by Buyer ({shipment.buyerSignatureDate || "2026"})</span>
                </div>
                {onOpenSignatureModal && (
                  <button
                    type="button"
                    className="sig-edit-hover-btn"
                    onClick={() => onOpenSignatureModal("buyer")}
                  >
                    Ubah
                  </button>
                )}
              </div>
            ) : onOpenSignatureModal ? (
              <button
                type="button"
                className="doc-btn-click-sign buyer-sign-btn"
                onClick={() => onOpenSignatureModal("buyer")}
                title="Pasang tanda tangan digital pihak pembeli"
              >
                <PenTool size={12} />
                <span>+ Tanda Tangan Buyer</span>
              </button>
            ) : null}
          </div>
          <b className="sig-name">{buyerPicName || "Mr. Tariq Al-Mansoor"}</b>
          <span className="sig-sub">{buyerPicRole || (isId ? "Direktur Pengadaan" : "Procurement Director")}</span>
        </div>

        <div className="sig-side sig-side-right">
          <span className="sig-header-txt">
            {isId ? "PIHAK PENJUAL (THE SELLER)" : "THE SELLER"}
          </span>
          <b className="sig-company-name">{isId ? `Untuk ${exporterName}` : `For ${exporterName}`}</b>
          <div className="sig-box-space">
            {shipment?.sellerSignatureImage ? (
              <div className="sig-rendered-wrap">
                <img
                  src={shipment.sellerSignatureImage}
                  alt="Seller Signature"
                  className="doc-rendered-signature"
                />
                {(shipment?.includeOfficialStamp ?? true) && (
                  <div className={`doc-seal-overlay seal-${shipment?.officialStampColor || "red"}`} title="Stempel Digital Resmi Validated">
                    <div className="seal-circle-outer">
                      <div className="seal-circle-inner">
                        <span className="seal-txt-top">★ PT. INDICO EXPORT ★</span>
                        <span className="seal-txt-star">★ VALIDATED ★</span>
                        <span className="seal-txt-sub">OFFICIAL SEAL</span>
                        <span className="seal-txt-bot">INDONESIA</span>
                      </div>
                    </div>
                  </div>
                )}
                <div className="sig-verify-badge">
                  <span className="sig-verify-check">✓</span>
                  <span>Signed & Verified ({shipment.sellerSignatureDate || "2026"})</span>
                </div>
                {onOpenSignatureModal && (
                  <button
                    type="button"
                    className="sig-edit-hover-btn"
                    onClick={() => onOpenSignatureModal("seller")}
                  >
                    Ubah
                  </button>
                )}
              </div>
            ) : onOpenSignatureModal ? (
              <button
                type="button"
                className="doc-btn-click-sign"
                onClick={() => onOpenSignatureModal("seller")}
                title="Pasang tanda tangan digital & stempel resmi eksportir"
              >
                <PenTool size={12} />
                <span>+ Tanda Tangan Eksportir</span>
              </button>
            ) : null}
          </div>
          <b className="sig-name">{signatoryName || "Muhajirin Fatona"}</b>
          <span className="sig-sub">
            {signatoryRole || (isId ? "Direktur Ekspor" : "Export Director")}
          </span>
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// 3. COMMERCIAL INVOICE (CI) COMPONENT
// --------------------------------------------------------------------------
function CommercialInvoiceDoc({
  shipment,
  exporterName,
  buyerName,
  buyerAddress,
  buyerCountry,
  buyerPicName,
  buyerPhone,
  buyerEmail,
  signatoryName,
  signatoryRole,
  vesselName,
  containerNumber,
  sealNumber,
  poNumber,
  paymentTerms,
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
  onOpenSignatureModal,
}: {
  shipment?: Shipment;
  exporterName: string;
  buyerName: string;
  buyerAddress: string;
  buyerCountry: string;
  buyerPicName?: string;
  buyerPhone?: string;
  buyerEmail?: string;
  signatoryName?: string;
  signatoryRole?: string;
  vesselName?: string;
  containerNumber?: string;
  sealNumber?: string;
  poNumber?: string;
  paymentTerms?: string;
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
  onOpenSignatureModal?: (party?: "seller" | "buyer") => void;
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
            <p className="doc-entity-contact">Telp: {buyerPhone || "+971 4 223 4567"} | Email: {buyerEmail || "procurement@albarakahfoods.ae"}</p>
          </div>

          <div className="doc-box">
            <span className="doc-box-tag">
              {isId ? "PIHAK DIBERITAHU (NOTIFY PARTY):" : "NOTIFY PARTY:"}
            </span>
            <b className="doc-entity-name">
              {isId ? "Sama dengan Penerima (SAME AS CONSIGNEE)" : "SAME AS CONSIGNEE"}
            </b>
            <p className="doc-entity-address">{buyerName} — {buyerCountry}</p>
            <p className="doc-entity-contact">
              {isId ? "Narahubung:" : "Contact:"} {buyerPicName || "Mr. Tariq Al-Mansoor"} | Telp: {buyerPhone || "+971 4 223 4567"}
            </p>
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
              <b className="meta-value">{isId ? "20 November 2026" : "November 20, 2026"}</b>
            </div>
            <div className="meta-pair">
              <span className="meta-label">{isId ? "No. Kontrak Penjualan:" : "Sales Contract No.:"}</span>{" "}
              <b className="meta-value font-mono">SC/IEI-ABF/XI/2026/001</b>
            </div>
            {poNumber && (
              <div className="meta-pair">
                <span className="meta-label">{isId ? "Ref. Buyer PO:" : "Buyer PO Ref:"}</span>{" "}
                <b className="meta-value font-mono">{poNumber}</b>
              </div>
            )}
            <div className="meta-pair">
              <span className="meta-label">{isId ? "Syarat Pembayaran:" : "Payment Terms:"}</span>{" "}
              <b className="meta-value">{paymentTerms || "Telegraphic Transfer (T/T)"}</b>
            </div>
          </div>

          <div className="doc-box transport-box">
            <span className="doc-box-tag">
              {isId ? "RINCIAN PENGANGKUTAN (TRANSPORT DETAILS):" : "TRANSPORT DETAILS:"}
            </span>
            <div className="meta-pair">
              <span className="meta-label">{isId ? "Kapal / Pelayaran:" : "Vessel / Voyage:"}</span>{" "}
              <b className="meta-value">{vesselName || "KMTC SHIMIZU V.2611N"}</b>
            </div>
            <div className="meta-pair">
              <span className="meta-label">{isId ? "Pelabuhan Muat:" : "Port of Loading:"}</span>{" "}
              <b className="meta-value">{pol}</b>
            </div>
            <div className="meta-pair">
              <span className="meta-label">{isId ? "Pelabuhan Bongkar:" : "Port of Discharge:"}</span>{" "}
              <b className="meta-value">{pod}</b>
            </div>
            <div className="meta-pair">
              <span className="meta-label">{isId ? "No. Kontainer / Segel:" : "Container / Seal:"}</span>{" "}
              <b className="meta-value font-mono">{containerNumber || "TGHU 2468135"} / {sealNumber || "IDMKS998877"} (1x20&apos; FCL)</b>
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
              <b>{buyerName.split(" ")[0] || "AL BARAKAH"}</b><br />
              DUBAI - UAE<br />
              BATCH: 11/26<br />
              PROD: 11/2026<br />
              EXP: 11/2028<br />
              <b>MADE IN INDONESIA</b>
            </td>
            <td>
              <b className="table-product-title">{productName.toUpperCase()}</b>
              <p className="text-xs font-semibold text-slate-800 mt-1">{isId ? "KODE HS:" : "HS CODE:"} {hsCode}</p>
              <p className="text-xs text-slate-800">
                {isId ? "Kemasan: Karung Kertas Kraft Multiwall 20 Kg Neto" : "Packing: 20 Kg Net / Multiwall Kraft Paper Bag"}
              </p>
              <p className="text-xs text-slate-800">
                {isId ? `Total Kemasan: ${formatNumber(bagsCount)} Karung` : `Total Packages: ${formatNumber(bagsCount)} Bags`}
              </p>
              <p className="text-xs font-bold text-slate-900 mt-1">
                {isId
                  ? `Berat Neto: ${formatNumber(netWeightKgs, 2)} Kg | Berat Bruto: ${formatNumber(grossWeightKgs, 2)} Kg`
                  : `Net Weight: ${formatNumber(netWeightKgs, 2)} Kgs | Gross Weight: ${formatNumber(grossWeightKgs, 2)} Kgs`}
              </p>
              <p className="text-xs font-semibold text-slate-800">{isId ? "Negara Asal: Indonesia" : "Country of Origin: Indonesia"}</p>
            </td>
            <td className="text-right font-normal">
              {formatNumber(bagsCount)} {isId ? "Karung" : "Bags"}<br />
              <span className="text-xs text-slate-700">
                ({formatNumber(netWeightMT, 2)} MT {isId ? "Neto" : "Net"})
              </span>
            </td>
            <td className="text-right font-normal">
              {currency} {formatNumber(unitPricePerMT, 2)}<br />
              <span className="text-xs text-slate-700">/ MT</span>
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
        <span className="font-medium">{isId ? "Terbilang:" : "Amount in Words:"}</span> <b className="font-bold italic">{amountInWords}</b>
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
        <OfficialStampAndSignature
          exporterName={exporterName}
          signatoryName={signatoryName}
          role={signatoryRole}
          isId={isId}
          shipment={shipment}
          onOpenSignatureModal={onOpenSignatureModal}
        />
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// 4. PACKING LIST (PL) COMPONENT
// --------------------------------------------------------------------------
function PackingListDoc({
  shipment,
  exporterName,
  buyerName,
  buyerAddress,
  buyerCountry,
  buyerPicName,
  buyerPhone,
  buyerEmail,
  signatoryName,
  signatoryRole,
  vesselName,
  containerNumber,
  sealNumber,
  poNumber,
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
  onOpenSignatureModal,
}: {
  shipment?: Shipment;
  exporterName: string;
  buyerName: string;
  buyerAddress: string;
  buyerCountry: string;
  buyerPicName?: string;
  buyerPhone?: string;
  buyerEmail?: string;
  signatoryName?: string;
  signatoryRole?: string;
  vesselName?: string;
  containerNumber?: string;
  sealNumber?: string;
  poNumber?: string;
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
  onOpenSignatureModal?: (party?: "seller" | "buyer") => void;
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
            <p className="doc-entity-contact">Telp: {buyerPhone || "+971 4 223 4567"} | Email: {buyerEmail || "procurement@albarakahfoods.ae"}</p>
          </div>

          <div className="doc-box">
            <span className="doc-box-tag">
              {isId ? "PIHAK DIBERITAHU (NOTIFY PARTY):" : "NOTIFY PARTY:"}
            </span>
            <b className="doc-entity-name">
              {isId ? "Sama dengan Penerima (SAME AS CONSIGNEE)" : "SAME AS CONSIGNEE"}
            </b>
            <p className="doc-entity-address">{buyerName} — {buyerCountry}</p>
            <p className="doc-entity-contact">
              {isId ? "Narahubung:" : "Contact:"} {buyerPicName || "Mr. Tariq Al-Mansoor"} | Telp: {buyerPhone || "+971 4 223 4567"}
            </p>
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
              <b className="meta-value">{isId ? "20 November 2026" : "November 20, 2026"}</b>
            </div>
            <div className="meta-pair">
              <span className="meta-label">{isId ? "No. Kontrak Penjualan:" : "Sales Contract No.:"}</span>{" "}
              <b className="meta-value font-mono">SC/IEI-ABF/XI/2026/001</b>
            </div>
            {poNumber && (
              <div className="meta-pair">
                <span className="meta-label">{isId ? "Ref. Buyer PO:" : "Buyer PO Ref:"}</span>{" "}
                <b className="meta-value font-mono">{poNumber}</b>
              </div>
            )}
          </div>

          <div className="doc-box transport-box">
            <span className="doc-box-tag">
              {isId ? "RINCIAN PENGANGKUTAN (TRANSPORT DETAILS):" : "TRANSPORT DETAILS:"}
            </span>
            <div className="meta-pair">
              <span className="meta-label">{isId ? "Kapal / Pelayaran:" : "Vessel / Voyage:"}</span>{" "}
              <b className="meta-value">{vesselName || "KMTC SHIMIZU V.2611N"}</b>
            </div>
            <div className="meta-pair">
              <span className="meta-label">{isId ? "Pelabuhan Muat:" : "Port of Loading:"}</span>{" "}
              <b className="meta-value">{pol}</b>
            </div>
            <div className="meta-pair">
              <span className="meta-label">{isId ? "Pelabuhan Bongkar:" : "Port of Discharge:"}</span>{" "}
              <b className="meta-value">{pod}</b>
            </div>
            <div className="meta-pair">
              <span className="meta-label">{isId ? "No. Kontainer / Segel:" : "Container / Seal:"}</span>{" "}
              <b className="meta-value font-mono">{containerNumber || "TGHU 2468135"} / {sealNumber || "IDMKS998877"} (1x20&apos; FCL)</b>
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
              <b>{buyerName.split(" ")[0] || "AL BARAKAH"}</b><br />
              DUBAI - UAE<br />
              BATCH: 11/26<br />
              PROD: 11/2026<br />
              EXP: 11/2028
            </td>
            <td>
              <b className="table-product-title">{productName}</b>
              <p className="text-xs font-semibold text-slate-800 mt-1">{isId ? "Kode HS:" : "HS Code:"} {hsCode}</p>
              <div className="text-xs text-slate-800 mt-2">
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
              <span className="text-xs font-semibold text-slate-700">
                ({formatNumber(netWeightMT, 2)} MT {isId ? "Neto" : ""})
              </span>
            </td>
            <td className="text-right font-bold">
              {formatNumber(grossWeightKgs, 2)} Kgs<br />
              <span className="text-xs font-semibold text-slate-700">
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
        <OfficialStampAndSignature
          exporterName={exporterName}
          signatoryName={signatoryName}
          role={signatoryRole}
          isId={isId}
          shipment={shipment}
          onOpenSignatureModal={onOpenSignatureModal}
        />
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// 5. SHIPPING INSTRUCTION (SI) COMPONENT
// --------------------------------------------------------------------------
function ShippingInstructionDoc({
  shipment,
  exporterName,
  exporterAddress,
  buyerName,
  buyerAddress,
  buyerPicName,
  buyerPhone,
  buyerEmail,
  signatoryName,
  signatoryRole,
  vesselName,
  containerNumber,
  sealNumber,
  poNumber,
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
  onOpenSignatureModal,
}: {
  shipment?: Shipment;
  exporterName: string;
  exporterAddress?: string;
  buyerName: string;
  buyerAddress: string;
  buyerCountry?: string;
  buyerPicName?: string;
  buyerPhone?: string;
  buyerEmail?: string;
  signatoryName?: string;
  signatoryRole?: string;
  vesselName?: string;
  containerNumber?: string;
  sealNumber?: string;
  poNumber?: string;
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
  onOpenSignatureModal?: (party?: "seller" | "buyer") => void;
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
          <b>{isId ? "16 November 2026" : "November 16, 2026"}</b>
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
            {exporterAddress || "Jl. Adiyaksa Baru No. 1B, Kec. Panakkukang, Kota Makassar, Sulawesi Selatan, Indonesia"}
          </p>
          <p className="party-txt">
            Telp: +62 812 3456 7890 | Email: official@indicoexport.com
          </p>
        </div>

        <div className="si-party-card">
          <div className="si-party-tag">
            {isId ? "CONSIGNEE / PENERIMA (Dicantumkan pada B/L)" : "CONSIGNEE (To appear on B/L)"}
          </div>
          <b className="party-title">{buyerName}</b>
          <p className="party-txt">{buyerAddress}</p>
          <p className="party-txt">Telp: {buyerPhone || "+971 4 223 4567"}</p>
          <p className="party-txt">Email: {buyerEmail || "procurement@albarakahfoods.ae"}</p>
        </div>

        <div className="si-party-card">
          <div className="si-party-tag">
            {isId ? "NOTIFY PARTY (Dicantumkan pada B/L)" : "NOTIFY PARTY (To appear on B/L)"}
          </div>
          <b className="party-title">{isId ? "SAMA DENGAN PENERIMA" : "SAME AS CONSIGNEE"}</b>
          <p className="party-txt mt-2">{buyerName}</p>
          <p className="party-txt">
            {isId ? "Narahubung:" : "Contact:"} {buyerPicName || "Mr. Tariq Al-Mansoor"}
          </p>
          <p className="party-txt">Telp: {buyerPhone || "+971 4 223 4567"}</p>
        </div>
      </div>

      <div className="doc-transport-row-strip">
        <div className="strip-item">
          <span className="strip-lbl">{isId ? "Kapal / Pelayaran" : "Vessel / Voyage"}</span>
          <b className="strip-val">{vesselName || "KMTC SHIMIZU V.2611N"}</b>
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
              <b>{buyerName.split(" ")[0] || "AL BARAKAH"}</b><br />
              DUBAI - UAE<br />
              BATCH: 11/26<br />
              PROD: 11/2026<br />
              EXP: 11/2028<br />
              <b>MADE IN INDONESIA</b>
            </td>
            <td>
              <b>{formatNumber(bagsCount)} {isId ? "KARUNG" : "BAGS"}</b><br />
              <span className="text-xs font-semibold text-slate-800">
                {isId ? "(Sembilan Ratus Karung Kertas Kraft Multiwall)" : "(Nine Hundred Multiwall Kraft Paper Bags)"}
              </span>
            </td>
            <td>
              <b className="table-product-title">{productName.toUpperCase()}</b>
              <p className="text-xs text-slate-800 mt-1">
                {isId
                  ? "Dikemas dalam Karung Kertas Kraft Multiwall 20 Kg Neto dengan Lapisan Dalam Plastik PE Food-Grade."
                  : "Packed in 20 Kg Net Multiwall Kraft Paper Bags with Inner Food-Grade PE Liner."}
              </p>
              <p className="text-xs font-mono font-semibold text-slate-800 mt-1">{isId ? "KODE HS:" : "HS CODE:"} {hsCode}</p>
              <p className="text-xs font-mono font-bold text-slate-900">
                {isId ? "NO. KONTAINER / SEGEL:" : "CONT / SEAL NO.:"} {containerNumber || "TGHU 2468135"} / {sealNumber || "IDMKS998877"}
              </p>
              <p className="text-xs font-bold text-slate-900">
                {isId ? "NEGARA ASAL: INDONESIA" : "COUNTRY OF ORIGIN: INDONESIA"}
              </p>
            </td>
            <td className="text-right">
              <div className="text-xs font-bold text-slate-800">{isId ? "NETO:" : "NET:"}</div>
              <b className="text-sm">{formatNumber(netWeightKgs, 2)}</b> KGS
              <div className="text-xs font-bold text-slate-800 mt-2">{isId ? "BRUTO:" : "GROSS:"}</div>
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
          signatoryName={signatoryName}
          role={signatoryRole || (isId ? "Manajer Logistik & Ekspor" : "Logistics & Export Manager")}
          isId={isId}
          shipment={shipment}
          onOpenSignatureModal={onOpenSignatureModal}
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
  const [settingsTab, setSettingsTab] = useState<"kop" | "content">("kop");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isId = shipment.previewLanguage === "Bahasa Indonesia";

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
            <span>PENGATURAN KOP SURAT & EDIT ISI DOKUMEN EKSPOR</span>
          </div>
          <h3 className="doc-settings-heading">Konfigurasi Identitas Resmi, Penandatangan & Data Dokumen</h3>
          <p className="doc-settings-sub">
            Atur nama & jabatan penandatangan eksportir, kop surat & logo, ukuran kertas, serta sesuaikan data buyer, kontainer, dan pengapalan sesuai request transaksi.
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

      {/* Tab Switcher */}
      <div className="doc-settings-tabs-nav">
        <button
          type="button"
          className={`doc-settings-nav-tab ${settingsTab === "kop" ? "active" : ""}`}
          onClick={() => setSettingsTab("kop")}
        >
          <SlidersHorizontal size={14} />
          <span>1. Setelan Kop, Format Kertas & Penandatangan</span>
        </button>
        <button
          type="button"
          className={`doc-settings-nav-tab ${settingsTab === "content" ? "active" : ""}`}
          onClick={() => setSettingsTab("content")}
        >
          <FileText size={14} />
          <span>2. Edit Isi Dokumen & Permintaan Buyer</span>
          <span className="doc-settings-tab-badge">Permintaan Buyer / Transaksi</span>
        </button>
      </div>

      {settingsTab === "kop" ? (
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

              <SelectField
                label="Format Halaman Sales Contract (SC)"
                value={shipment.contractLayout || "1-page"}
                onChange={(value) => update("contractLayout", value as "1-page" | "2-page")}
              >
                <option value="1-page">Pas 1 Lembar Eksekutif (Standar Resmi · Pasal 1 s/d 6)</option>
                <option value="2-page">2 Lembar Komprehensif (Format Legal ICC · Pasal 1 s/d 10)</option>
              </SelectField>

              <SelectField
                label="Format File Unduhan Bawaan"
                value={shipment.defaultExportFormat || "pdf"}
                onChange={(value) => update("defaultExportFormat", value as any)}
              >
                <option value="pdf">PDF (.pdf) · Format Cetak Resmi Vector</option>
                <option value="docx">Microsoft Word (.docx) · Dokumen Editable Kontrak</option>
                <option value="xlsx">Microsoft Excel (.xlsx) · Spreadsheet Rincian & Logistik</option>
                <option value="html">Web Standalone (.html) · Buka Offline di Browser</option>
                <option value="txt">Plain Text (.txt) · Teks Bersih untuk Email / ERP</option>
              </SelectField>

              <div className="doc-settings-note">
                Dokumen ekspor (PI, SC, CI, PL, SI) dicetak dalam <b>English</b> sesuai ketentuan perdagangan internasional (ICC Incoterms & Kepabeanan).
              </div>
            </div>
          </div>

          {/* Kolom 2: Identitas Eksportir & Penandatangan */}
          <div className="doc-settings-card">
            <div className="doc-settings-card-header">
              <h4>2. Identitas Eksportir & Penandatangan</h4>
              <p>Nama legal perusahaan, pejabat penandatangan resmi, dan pelabuhan muat.</p>
            </div>
            <div className="doc-settings-card-fields">
              <Field
                label="Nama Perusahaan Eksportir"
                value={shipment.exporter}
                placeholder="Contoh: PT. INDICO EXPORT INDONESIA"
                onChange={(value) => update("exporter", value)}
              />

              <Field
                label="Nama Penandatangan Eksportir"
                value={shipment.signatoryName ?? "Muhajirin Fatona"}
                placeholder="Contoh: Muhajirin Fatona"
                onChange={(value) => update("signatoryName", value)}
              />

              <Field
                label="Jabatan Penandatangan"
                value={shipment.signatoryRole ?? (isId ? "Direktur Ekspor" : "Export Director")}
                placeholder="Contoh: Export Director / Direktur Ekspor"
                onChange={(value) => update("signatoryRole", value)}
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
      ) : (
        /* Tab 2: Edit Isi Dokumen & Permintaan Buyer */
        <div className="doc-settings-columns">
          {/* Kolom 1: Data Pembeli / Buyer */}
          <div className="doc-settings-card">
            <div className="doc-settings-card-header">
              <h4>1. Permintaan & Data Buyer (Penerima)</h4>
              <p>Identitas importir, alamat kantor, dan narahubung pemesan.</p>
            </div>
            <div className="doc-settings-card-fields">
              <Field
                label="Nama Perusahaan Buyer"
                value={shipment.buyer}
                placeholder="Contoh: AL BARAKAH FOODSTUFF TRADING LLC"
                onChange={(value) => update("buyer", value)}
              />
              <Field
                label="Alamat Lengkap Buyer / Consignee"
                value={shipment.buyerAddress || shipment.destination}
                placeholder="P.O. Box 112233, Al Ras Area, Deira, Dubai"
                onChange={(value) => update("buyerAddress", value)}
              />
              <Field
                label="Negara Buyer"
                value={shipment.buyerCountry}
                placeholder="Contoh: United Arab Emirates"
                onChange={(value) => update("buyerCountry", value)}
              />
              <Field
                label="Nama Narahubung / PIC Buyer"
                value={shipment.buyerPicName || "Tariq Al-Mansoor"}
                placeholder="Contoh: Mr. Tariq Al-Mansoor"
                onChange={(value) => update("buyerPicName", value)}
              />
              <Field
                label="Jabatan Narahubung Buyer"
                value={shipment.buyerPicRole || "Procurement Director"}
                placeholder="Contoh: Procurement Director"
                onChange={(value) => update("buyerPicRole", value)}
              />
              <Field
                label="No. Telepon Buyer"
                value={shipment.buyerPhone || "+971 4 223 4567"}
                placeholder="+971 4 223 4567"
                onChange={(value) => update("buyerPhone", value)}
              />
              <Field
                label="Email Buyer"
                value={shipment.buyerEmail || "procurement@albarakahfoods.ae"}
                placeholder="buyer@domain.com"
                onChange={(value) => update("buyerEmail", value)}
              />
            </div>
          </div>

          {/* Kolom 2: Nomor Transaksi & Syarat Pembayaran */}
          <div className="doc-settings-card">
            <div className="doc-settings-card-header">
              <h4>2. Referensi PO & Syarat Pembayaran</h4>
              <p>Nomor PO pesanan buyer, termin pembayaran, dan rekening eksportir.</p>
            </div>
            <div className="doc-settings-card-fields">
              <Field
                label="No. PO / Referensi Buyer (Buyer Ref)"
                value={shipment.poNumber || "ABF/LOI/2026/108"}
                placeholder="Contoh: ABF/LOI/2026/108"
                onChange={(value) => update("poNumber", value)}
              />
              <Field
                label="Syarat Pembayaran (Payment Terms)"
                value={shipment.paymentTerms || "Telegraphic Transfer (T/T) - 50% Advance Payment, 50% against Copy of B/L"}
                placeholder="Contoh: 50% DP / 50% against Copy of B/L"
                onChange={(value) => update("paymentTerms", value)}
              />
              <Field
                label="Nama Bank Eksportir"
                value={shipment.bankName || "PT. Bank Mandiri (Persero) Tbk"}
                placeholder="Contoh: PT. Bank Mandiri (Persero) Tbk"
                onChange={(value) => update("bankName", value)}
              />
              <Field
                label="Nomor Rekening Bank"
                value={shipment.bankAccountNo || "152-00-9876543-2"}
                placeholder="Contoh: 152-00-9876543-2"
                onChange={(value) => update("bankAccountNo", value)}
              />
              <Field
                label="Kode SWIFT Bank"
                value={shipment.bankSwift || "BMRIIDJA"}
                placeholder="Contoh: BMRIIDJA"
                onChange={(value) => update("bankSwift", value)}
              />
              <Field
                label="Klausul / Ketentuan Tambahan Kontrak (Opsional / Permintaan Khusus)"
                value={shipment.contractSpecialTerms || ""}
                placeholder="Kosongkan jika kontrak standar 1 lembar (Pasal 1-6). Isi bila ada penambahan pasal dari buyer/eksportir (otomatis terbit sebagai Pasal 7 & mengalir ke lembar ke-2 jika panjang)."
                onChange={(value) => update("contractSpecialTerms", value)}
              />
            </div>
          </div>

          {/* Kolom 3: Logistik Pengapalan & Kontainer */}
          <div className="doc-settings-card">
            <div className="doc-settings-card-header">
              <h4>3. Logistik Pengapalan & Kontainer</h4>
              <p>Rute pelabuhan, nama kapal pengangkut, nomor kontainer dan segel.</p>
            </div>
            <div className="doc-settings-card-fields">
              <Field
                label="Nama Kapal & Voyage (Vessel / Voyage)"
                value={shipment.vesselName || shipment.bookingNumber || "KMTC SHIMIZU V.2611N"}
                placeholder="Contoh: KMTC SHIMIZU V.2611N"
                onChange={(value) => {
                  update("vesselName", value);
                  update("bookingNumber", value);
                }}
              />
              <Field
                label="Nomor Kontainer"
                value={shipment.containerNumber || "TGHU 2468135"}
                placeholder="Contoh: TGHU 2468135"
                onChange={(value) => update("containerNumber", value)}
              />
              <Field
                label="Nomor Segel (Seal No.)"
                value={shipment.sealNumber || "IDMKS998877"}
                placeholder="Contoh: IDMKS998877"
                onChange={(value) => update("sealNumber", value)}
              />
              <Field
                label="Pelabuhan Bongkar / Port of Discharge (POD)"
                value={shipment.destination || "Jebel Ali Port, Dubai, UAE"}
                placeholder="Contoh: Jebel Ali Port, Dubai, UAE"
                onChange={(value) => update("destination", value)}
              />
              <Field
                label="Pelabuhan Muat / Port of Loading (POL)"
                value={shipment.namedPlace || "Makassar New Port, South Sulawesi, Indonesia"}
                placeholder="Contoh: Makassar New Port, South Sulawesi, Indonesia"
                onChange={(value) => update("namedPlace", value)}
              />
              <div className="doc-settings-note">
                💡 <b>Sinkronisasi Otomatis:</b> Setiap penyesuaian data buyer, PO, syarat pembayaran, kapal, dan kontainer langsung terhubung dan terbit di ke-5 dokumen ekspor secara serempak.
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
