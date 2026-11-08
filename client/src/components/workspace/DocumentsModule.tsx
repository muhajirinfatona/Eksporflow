import type { ApprovalDecision } from "@/hooks/useWorkspaceFlow";
import { formatMoney, formatNumber, numberToWords } from "@shared/format";
import type { Pricing } from "@shared/pricing";
import type { ScreenId } from "@shared/risk";
import {
  type ContainerCalc,
  type DocumentOrientation,
  type DocumentTemplate,
  type DocumentType,
  type PaperSize,
  type PreviewLanguage,
  type Shipment,
  getPaperSizeSpec,
  getDocMargins,
} from "@shared/shipment";
import {
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  CreditCard,
  FileCheck2,
  FileSignature,
  FileText,
  FileDown,
  FileSpreadsheet,
  Globe,
  FileCode,
  Landmark,
  Languages,
  LayoutTemplate,
  Mail,
  MapPin,
  PenTool,
  Phone,
  Edit3,
  Printer,
  Ruler,
  ShieldCheck,
  Ship,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Upload,
  UploadCloud,
  X,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Field, SelectField } from "./Primitives";
import { DocWordRibbon } from "./DocWordRibbon";
import { DigitalSignatureModal } from "./DigitalSignatureModal";
import { DocumentAiScreeningModal } from "./DocumentAiScreeningModal";
import { BusinessCardOcrModal } from "./BusinessCardOcrModal";
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
import {
  registerShipmentHistoryBridge,
  pushEditorHistory,
  performEditorUndo,
  performEditorRedo,
  resetEditorHistory,
  saveActiveSelection,
  stepSelectedBlockSpacingPx,
} from "@/lib/wordEditorEngine";

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
  const [isReviewMenuOpen, setIsReviewMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isWordRibbonOpen, setIsWordRibbonOpen] = useState(true);
  const [isEditMode, setIsEditMode] = useState(shipment.docEditorMode ?? true);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [signatureParty, setSignatureParty] = useState<"seller" | "buyer">("seller");
  const [isAiScreeningOpen, setIsAiScreeningOpen] = useState(false);
  const [isBusinessCardOcrOpen, setIsBusinessCardOcrOpen] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const downloadMenuRef = useRef<HTMLDivElement>(null);
  const reviewMenuRef = useRef<HTMLDivElement>(null);

  const docMargins = getDocMargins(shipment);
  const paperSpec = getPaperSizeSpec(shipment.paperSize);
  const isLandscape = shipment.documentOrientation === "Landscape";
  const paperWidthMm = isLandscape ? paperSpec.heightMm : paperSpec.widthMm;

  const shipmentRef = useRef(shipment);
  shipmentRef.current = shipment;

  const trackedUpdate = <K extends keyof Shipment>(key: K, value: Shipment[K]) => {
    if (shipmentRef.current[key] !== value) {
      pushEditorHistory(`shipment:${String(key)}`);
    }
    update(key, value);
  };

  useEffect(() => {
    return registerShipmentHistoryBridge(
      () => ({ ...shipmentRef.current }),
      (restoredState) => {
        const current = shipmentRef.current;
        for (const k of Object.keys(restoredState) as (keyof Shipment)[]) {
          if (current[k] !== restoredState[k]) {
            update(k, restoredState[k] as Shipment[typeof k]);
          }
        }
      }
    );
  }, [update]);

  useEffect(() => {
    resetEditorHistory();
  }, [selectedDocument]);

  useEffect(() => {
    const handleUndoRedoShortcut = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT")) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && !e.altKey) {
        const key = e.key.toLowerCase();
        if (key === "z" && !e.shiftKey) {
          e.preventDefault();
          if (performEditorUndo()) {
            toast.info("Perubahan diurungkan (Undo)");
          }
        } else if (key === "y" || (key === "z" && e.shiftKey)) {
          e.preventDefault();
          if (performEditorRedo()) {
            toast.info("Perubahan diulangi (Redo)");
          }
        }
      }
    };
    window.addEventListener("keydown", handleUndoRedoShortcut);
    return () => window.removeEventListener("keydown", handleUndoRedoShortcut);
  }, []);

  const handleOpenSignatureModal = (party: "seller" | "buyer" = "seller") => {
    setSignatureParty(party);
    setIsSignatureModalOpen(true);
  };

  const handleResetDocument = () => {
    pushEditorHistory("reset-document");
    setEditorKey((prev) => prev + 1);
    toast.success("Dokumen berhasil di-reset ke template standar sistem!");
  };

  // Ensure body focus class is cleaned up so standard layout is never broken
  useEffect(() => {
    document.body.classList.remove("doc-word-focus-mode");
  }, [isEditMode]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
        setIsDownloadMenuOpen(false);
      }
      if (reviewMenuRef.current && !reviewMenuRef.current.contains(event.target as Node)) {
        setIsReviewMenuOpen(false);
      }
    }
    if (isDownloadMenuOpen || isReviewMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDownloadMenuOpen, isReviewMenuOpen]);

  // Interactive Table Column Resizing, Active Cell Focus & Tab Key Navigation (Word Table Mode)
  useEffect(() => {
    if (!isEditMode) return;

    const paperEl = document.querySelector(".paper-document");
    if (!paperEl) return;

    // 1. Cell, Table & Document Box Focus Tracking (Word Table & Box Mode)
    const handleCellFocus = (e: Event) => {
      const target = e.target as HTMLElement;
      const box = target.closest(
        ".doc-title-bar, .doc-box, .contract-party-card, .doc-terms-panel, .doc-bank-card"
      ) as HTMLElement | null;
      paperEl.querySelectorAll(".active-doc-box").forEach((el) => {
        if (el !== box) el.classList.remove("active-doc-box");
      });
      if (box) {
        box.classList.add("active-doc-box");
      }

      const cell = target.closest("td, th") as HTMLTableCellElement | null;
      if (cell) {
        const currentTable = cell.closest("table");
        (window as any).__eksporflow_active_cell = cell;
        (window as any).__eksporflow_active_table = currentTable;
        window.dispatchEvent(
          new CustomEvent("eksporflow:table-focus", {
            detail: { hasTable: true, table: currentTable, cell },
          })
        );
        paperEl.querySelectorAll("table.active-table").forEach((el) => {
          el.classList.remove("active-table");
        });
        paperEl.querySelectorAll("td.active-cell, th.active-cell").forEach((el) => {
          el.classList.remove("active-cell");
        });
        if (currentTable) {
          currentTable.classList.add("active-table");
        }
        cell.classList.add("active-cell");
      }
    };

    // 2. Attach Interactive Column Resizers to all table headers (isolated per table)
    const attachColResizers = () => {
      const tables = paperEl.querySelectorAll("table");
      tables.forEach((table) => {
        const headerCells =
          table.querySelectorAll("thead th:not([colspan]), thead td:not([colspan])").length > 0
            ? table.querySelectorAll("thead th:not([colspan]), thead td:not([colspan])")
            : table.querySelectorAll("tbody tr:first-child > td, tbody tr:first-child > th");

        headerCells.forEach((th) => {
          if (!th.querySelector(".col-resizer")) {
            const resizer = document.createElement("span");
            resizer.className = "col-resizer";
            resizer.setAttribute("contenteditable", "false");
            resizer.title = "Tarik (drag) untuk mengatur lebar kolom ini";

            let startX = 0;
            let startWidths: number[] = [];
            let startTableWidth = 0;
            let colIndex = 0;
            let isLastCol = false;
            const MIN_COL = 30;

            // Terapkan lebar ke satu kolom (header + semua baris yang tidak di-colspan)
            const setColWidth = (idx: number, w: number) => {
              const head = headerCells[idx] as HTMLElement | undefined;
              if (head) head.style.width = `${w}px`;
              table.querySelectorAll("tbody tr").forEach((row) => {
                const cells = Array.from(row.children) as HTMLTableCellElement[];
                if (cells[idx] && (cells[idx].colSpan || 1) === 1) {
                  cells[idx].style.width = `${w}px`;
                }
              });
            };

            const onMouseMove = (moveEvent: MouseEvent) => {
              const dx = moveEvent.clientX - startX;
              const leftW = startWidths[colIndex];

              if (isLastCol) {
                // Garis paling kanan: hanya kolom terakhir & lebar tabel yang berubah
                const newLeft = Math.max(MIN_COL, leftW + dx);
                setColWidth(colIndex, newLeft);
                (table as HTMLElement).style.width = `${startTableWidth + (newLeft - leftW)}px`;
                return;
              }

              // Garis di antara 2 kolom: hanya kolom kiri & kanan garis yang berubah,
              // total lebar tetap sehingga garis-garis lain tidak ikut bergeser.
              const rightW = startWidths[colIndex + 1];
              const clampedDx = Math.max(MIN_COL - leftW, Math.min(rightW - MIN_COL, dx));
              setColWidth(colIndex, leftW + clampedDx);
              setColWidth(colIndex + 1, rightW - clampedDx);
            };

            const onMouseUp = () => {
              resizer.classList.remove("is-resizing");
              document.removeEventListener("mousemove", onMouseMove);
              document.removeEventListener("mouseup", onMouseUp);
            };

            resizer.addEventListener("mousedown", (mdEvent: MouseEvent) => {
              mdEvent.preventDefault();
              mdEvent.stopPropagation();
              startX = mdEvent.clientX;
              colIndex = Array.prototype.indexOf.call(headerCells, th);
              isLastCol = colIndex === headerCells.length - 1;

              // Kunci lebar semua kolom dalam px agar browser tidak membagi ulang lebar
              // ke kolom lain saat satu garis ditarik.
              startWidths = Array.from(headerCells).map(
                (c) => (c as HTMLElement).getBoundingClientRect().width
              );
              startTableWidth = (table as HTMLElement).getBoundingClientRect().width;
              (table as HTMLElement).style.tableLayout = "fixed";
              (table as HTMLElement).style.width = `${startTableWidth}px`;
              startWidths.forEach((w, i) => setColWidth(i, w));

              resizer.classList.add("is-resizing");

              // Immediately lock THIS table & cell as active
              (window as any).__eksporflow_active_cell = th;
              (window as any).__eksporflow_active_table = table;
              paperEl.querySelectorAll("table.active-table").forEach((el) => el.classList.remove("active-table"));
              table.classList.add("active-table");
              paperEl.querySelectorAll("td.active-cell, th.active-cell").forEach((el) => el.classList.remove("active-cell"));
              th.classList.add("active-cell");
              window.dispatchEvent(
                new CustomEvent("eksporflow:table-focus", {
                  detail: { hasTable: true, table, cell: th },
                })
              );

              document.addEventListener("mousemove", onMouseMove);
              document.addEventListener("mouseup", onMouseUp);
            });

            th.appendChild(resizer);
          }
        });
      });
    };

    attachColResizers();
    (paperEl as HTMLElement).addEventListener("mousedown", handleCellFocus as EventListener);
    (paperEl as HTMLElement).addEventListener("focusin", handleCellFocus as EventListener);

    // 3. Tab Key Navigation inside Table Cells (Word experience)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        const selection = window.getSelection();
        const node = selection?.anchorNode;
        const cell = (node instanceof Element ? node : node?.parentElement)?.closest("td, th") as HTMLTableCellElement | null;
        if (cell) {
          e.preventDefault();
          const row = cell.closest("tr");
          const table = cell.closest("table");
          if (!row || !table) return;

          const cellsInRow = Array.from(row.querySelectorAll("td, th"));
          const currentIndex = cellsInRow.indexOf(cell);

          if (!e.shiftKey) {
            // Next cell in row
            if (currentIndex < cellsInRow.length - 1) {
              const nextCell = cellsInRow[currentIndex + 1] as HTMLElement;
              nextCell.focus();
            } else {
              // Next row first cell
              const allRows = Array.from(table.querySelectorAll("tbody tr"));
              const currentRowIndex = allRows.indexOf(row);
              if (currentRowIndex < allRows.length - 1) {
                const nextRow = allRows[currentRowIndex + 1];
                const firstCell = nextRow.querySelector("td") as HTMLElement | null;
                firstCell?.focus();
              }
            }
          } else {
            // Shift + Tab: Previous cell
            if (currentIndex > 0) {
              const prevCell = cellsInRow[currentIndex - 1] as HTMLElement;
              prevCell.focus();
            }
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      (paperEl as HTMLElement).removeEventListener("mousedown", handleCellFocus as EventListener);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isEditMode, selectedDocument, shipment.contractLayout, editorKey]);

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

  // Review & Verification workflow handlers
  const handleStartReviewId = () => {
    setIsReviewMenuOpen(false);
    update("previewLanguage", "Bahasa Indonesia");
    update("documentReviewed", false);
    toast.info("Mode Review Bahasa Indonesia Aktif", {
      description: "Seluruh pasal, rincian koli, dan data perbankan dialihkan ke Bahasa Indonesia untuk telaah internal tim eksportir.",
    });
  };

  const handleStartReviewEn = () => {
    setIsReviewMenuOpen(false);
    update("previewLanguage", "English");
    update("documentReviewed", false);
    toast.info("Mode Review English Aktif", {
      description: "Pratinjau naskah dokumen dalam bahasa Inggris standar perdagangan internasional.",
    });
  };

  const handleVerifyDocument = () => {
    update("documentReviewed", true);
    update("previewLanguage", "English"); // Selalu kembali ke Bahasa Inggris otomatis sesuai request user!
    toast.success("Dokumen Berhasil Diverifikasi!", {
      description: "Dokumen telah disetujui. Bahasa dokumen otomatis dikembalikan ke Bahasa Inggris resmi untuk transaksi ekspor.",
    });
  };

  const handleReopenReview = () => {
    update("documentReviewed", false);
    toast.info("Status verifikasi dibuka kembali untuk penelaahan / revisi naskah.");
  };

  const finishReview = () => {
    if (shipment.documentReviewed) {
      handleReopenReview();
    } else {
      handleVerifyDocument();
    }
  };

  const handlePrint = () => {
    setIsSettingsOpen(false);
    const scrollEl = document.querySelector(".doc-paper-workspace-scroll");
    if (scrollEl) {
      scrollEl.scrollTop = 0;
    }
    window.scrollTo(0, 0);
    printDocument();
  };

  // Kalkulasi data turunan terpadu
  const rawExporterName = shipment.exporter || "PT. INDICO EXPORT INDONESIA";
  const exporterName =
    rawExporterName.trim().toLowerCase() === "indico export indonesia"
      ? "PT. INDICO EXPORT INDONESIA"
      : rawExporterName;
  const defaultAddress =
    "Head Office: Jl. Adiyaksa Baru No. 1B, Kec. Panakkukang, Kota Makassar, Sulawesi Selatan 90231 – Indonesia";
  const exporterAddress =
    shipment.letterheadText &&
    shipment.letterheadText.trim().toLowerCase() !== rawExporterName.trim().toLowerCase() &&
    shipment.letterheadText.trim().toLowerCase() !== exporterName.trim().toLowerCase() &&
    shipment.letterheadText.trim() !==
      "Jl. Adiyaksa Baru No. 1B, Kec. Panakkukang, Kota Makassar, Sulawesi Selatan, Indonesia" &&
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
        paperSize: shipment.paperSize || "A4",
        documentOrientation: shipment.documentOrientation || "Portrait",
        fontFamily: shipment.docEditorFontFamily || "Calibri",
        fontSize: shipment.docEditorFontSize || 11,
        lineHeight: shipment.docEditorLineHeight || 1.35,
        docMarginPreset: shipment.docMarginPreset,
        docMarginTop: shipment.docMarginTop,
        docMarginBottom: shipment.docMarginBottom,
        docMarginLeft: shipment.docMarginLeft,
        docMarginRight: shipment.docMarginRight,
        docHeaderEnabled: shipment.docHeaderEnabled,
        docHeaderText: shipment.docHeaderText,
        docFooterEnabled: shipment.docFooterEnabled,
        docFooterText: shipment.docFooterText,
        docShowPageNumber: shipment.docShowPageNumber,
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
    <div className={`doc-center-root ${isEditMode ? "doc-edit-mode-active" : ""}`}>
      <style>{`
        @media print {
          @page {
            size: ${paperSpec.cssSize} ${shipment.documentOrientation ? shipment.documentOrientation.toLowerCase() : "portrait"};
            margin: 11mm 10mm 8mm 10mm;
          }
          .paper-document {
            --doc-font-size: ${Math.min(10.2, Number(((shipment.docEditorFontSize || 11) * 0.91).toFixed(1)))}pt !important;
            font-size: ${Math.min(10.2, Number(((shipment.docEditorFontSize || 11) * 0.91).toFixed(1)))}pt !important;
          }
        }
      `}</style>

      {/* 1. Executive Document Selector Tabs (5 Documents - Compact & Clean) */}
      <div className="doc-tabs-grid five-cols no-print" role="tablist">
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
              title={doc.desc}
            >
              {isActive && <div className="doc-tab-active-indicator" />}
              <div className="doc-tab-icon-box">{doc.icon}</div>
              <div className="doc-tab-body">
                <h3 className="doc-tab-name">{doc.type}</h3>
              </div>
              <span className="doc-code-badge">{doc.code}</span>
            </button>
          );
        })}
      </div>

      {/* 1.5 Compact Single-Row Executive Action Bar */}
      <div className="doc-action-bar no-print">
        <div className="doc-action-controls-row">
          {/* Left: Active Document Identity & Status */}
          <div className="doc-active-name-wrap">
            <h2 className="doc-active-title">{selectedDocument}</h2>
            <span className="doc-active-ref">{getDocumentNumber(selectedDocument, isId)}</span>
            <span className={`spec-badge-status ${shipment.documentReviewed ? "status-verified" : "status-draft"}`}>
              {shipment.documentReviewed ? "✓ Terverifikasi" : "Draft"}
            </span>
          </div>

          {/* Right: Streamlined Executive Actions */}
          <div className="doc-actions-cluster">
            {/* Language Switcher (Compact) */}
            <div className="doc-review-dropdown-wrap" ref={reviewMenuRef}>
              <button
                type="button"
                className={`doc-btn-review-trigger ${isReviewMenuOpen ? "active" : ""} ${shipment.previewLanguage === "Bahasa Indonesia" ? "review-id-active" : ""}`}
                onClick={() => setIsReviewMenuOpen((prev) => !prev)}
                title="Pilih bahasa dokumen: English atau Bahasa Indonesia"
              >
                <Languages size={14} />
                <span>{shipment.previewLanguage === "Bahasa Indonesia" ? "ID" : "EN"}</span>
                <ChevronDown size={11} />
              </button>

              {isReviewMenuOpen && (
                <div className="doc-review-menu-panel" role="menu">
                  <div className="doc-review-menu-items">
                    <button
                      type="button"
                      className={`doc-review-menu-item ${shipment.previewLanguage === "English" ? "selected" : ""}`}
                      onClick={handleStartReviewEn}
                    >
                      <div className="doc-lang-flag">🇬🇧</div>
                      <div className="doc-lang-info">
                        <span className="doc-lang-name">English (Standar Ekspor)</span>
                      </div>
                      {shipment.previewLanguage === "English" && <Check size={14} className="doc-lang-check" />}
                    </button>
                    <button
                      type="button"
                      className={`doc-review-menu-item ${shipment.previewLanguage === "Bahasa Indonesia" ? "selected" : ""}`}
                      onClick={handleStartReviewId}
                    >
                      <div className="doc-lang-flag">🇮🇩</div>
                      <div className="doc-lang-info">
                        <span className="doc-lang-name">Bahasa Indonesia (Telaah)</span>
                      </div>
                      {shipment.previewLanguage === "Bahasa Indonesia" && <Check size={14} className="doc-lang-check" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Verify Button */}
            {shipment.documentReviewed ? (
              <button
                type="button"
                className="doc-btn-verified-status"
                onClick={handleReopenReview}
                title="Dokumen telah diverifikasi. Klik untuk membuka revisi."
              >
                <CheckCircle2 size={14} className="icon-check-green" />
                <span>Terverifikasi</span>
              </button>
            ) : (
              <button
                type="button"
                className="doc-btn-verify-action"
                onClick={handleVerifyDocument}
                title="Verifikasi dokumen resmi ekspor"
              >
                <ShieldCheck size={14} />
                <span>Verifikasi</span>
              </button>
            )}

            {/* AI Screening */}
            <button
              type="button"
              className="doc-btn-ai-screen"
              onClick={() => setIsAiScreeningOpen(true)}
              title="AI Audit & Deteksi Kesalahan Dokumen"
            >
              <Sparkles size={14} className="icon-sparkle-amber" />
              <span>AI Audit</span>
            </button>

            {/* Setelan Drawer */}
            <button
              type="button"
              className={`doc-btn-toggle-settings ${isSettingsOpen ? "active" : ""}`}
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              title="Buka panel pengaturan data & kop surat"
            >
              <SlidersHorizontal size={14} />
              <span>Setelan</span>
              {isSettingsOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {/* Print PDF */}
            <button
              type="button"
              className="doc-btn-print"
              onClick={handlePrint}
              title="Cetak atau simpan PDF"
            >
              <Printer size={14} />
              <span>Cetak</span>
            </button>

            {/* Multi-Format Download Dropdown Menu */}
            <div className="doc-download-dropdown-wrap" ref={downloadMenuRef}>
              <button
                type="button"
                className={`doc-btn-download-trigger ${isDownloadMenuOpen ? "active" : ""}`}
                onClick={() => setIsDownloadMenuOpen((prev) => !prev)}
                title="Unduh dokumen (PDF, Word, Excel, HTML, TXT)"
                disabled={isExporting}
              >
                <FileDown size={14} />
                <span>Unduh</span>
                <ChevronDown size={12} />
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
      </div>

      {/* 2. Collapsible Settings Drawer (only rendered when toggled) */}
      {isSettingsOpen && (
        <DocumentSettings
          shipment={shipment}
          update={trackedUpdate}
          onLetterheadImage={handleLetterheadImage}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* 2.5 Word-like Formatting Ribbon Toolbar (Sticky on Scroll) */}
      {isWordRibbonOpen && (
        <div className="doc-sticky-ribbon-wrap no-print">
          <DocWordRibbon
            shipment={shipment}
            update={trackedUpdate}
            isEditMode={isEditMode}
            setIsEditMode={setIsEditMode}
            onOpenSignatureModal={handleOpenSignatureModal}
            onResetDocument={handleResetDocument}
            onOpenAiScreening={() => setIsAiScreeningOpen(true)}
            onOpenBusinessCardOcr={() => setIsBusinessCardOcrOpen(true)}
          />
        </div>
      )}

      {/* 3. Executive Desk Paper Preview */}
      <div className="doc-paper-workspace-scroll">
        <div className="doc-paper-desk">
        {/* Word-like Horizontal Ruler (Penggaris Word) */}
        {shipment.docShowRuler !== false && (
          <div className="no-print">
            <WordRuler
              paperWidthMm={paperWidthMm}
              leftMarginMm={docMargins.left}
              rightMarginMm={docMargins.right}
              onClose={() => {
                trackedUpdate("docShowRuler", false);
                toast.info("Penggaris disembunyikan. Anda dapat menampilkannya kembali lewat tombol 'Penggaris' di toolbar atas.");
              }}
            />
          </div>
        )}

        <div
          key={editorKey}
          contentEditable={isEditMode}
          suppressContentEditableWarning={true}
          onBeforeInput={() => pushEditorHistory("typing")}
          style={{
            fontFamily: shipment.docEditorFontFamily || "Calibri",
            fontSize: `${shipment.docEditorFontSize || 11}pt`,
            ["--doc-font-size" as any]: `${shipment.docEditorFontSize || 11}pt`,
            ["--logo-scale" as any]: `${(shipment.letterheadLogoScale ?? 100) / 100}`,
            lineHeight: shipment.docEditorLineHeight || 1.35,
            textAlign: shipment.docEditorTextAlign || "left",
            paddingTop: `${docMargins.top}mm`,
            paddingBottom: `${docMargins.bottom}mm`,
            paddingLeft: `${docMargins.left}mm`,
            paddingRight: `${docMargins.right}mm`,
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
            isEditMode={isEditMode}
            update={trackedUpdate}
            onLetterheadImage={handleLetterheadImage}
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
      </div>

      {/* Digital Signature & Official E-Seal Modal */}
      <DigitalSignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        shipment={shipment}
        update={update}
        initialParty={signatureParty}
      />

      {/* AI Advisor Document Screening & Typo Detection Modal */}
      <DocumentAiScreeningModal
        isOpen={isAiScreeningOpen}
        onClose={() => setIsAiScreeningOpen(false)}
        shipment={shipment}
        update={update}
        selectedDocument={selectedDocument}
        isId={isId}
      />

      {/* Business Card OCR Scanner Modal */}
      <BusinessCardOcrModal
        isOpen={isBusinessCardOcrOpen}
        onClose={() => setIsBusinessCardOcrOpen(false)}
        shipment={shipment}
        update={update}
      />
    </div>
  );
}

// --------------------------------------------------------------------------
// Word-like Horizontal Ruler Component (Penggaris Word)
// --------------------------------------------------------------------------
function WordRuler({
  paperWidthMm,
  leftMarginMm,
  rightMarginMm,
  onClose,
}: {
  paperWidthMm: number;
  leftMarginMm: number;
  rightMarginMm: number;
  onClose?: () => void;
}) {
  const printableMm = Math.max(10, paperWidthMm - leftMarginMm - rightMarginMm);
  const totalCm = Math.max(5, Math.floor(paperWidthMm / 10));

  return (
    <div
      className="doc-word-ruler-container no-print"
      title={`Margin Kiri: ${(leftMarginMm / 10).toFixed(2)} cm · Area Cetak: ${(printableMm / 10).toFixed(2)} cm · Margin Kanan: ${(rightMarginMm / 10).toFixed(2)} cm`}
    >
      <div className="doc-ruler-track">
        {/* Left Margin Gray Zone */}
        <div
          className="doc-ruler-margin-zone left"
          style={{ width: `${(leftMarginMm / paperWidthMm) * 100}%` }}
          title={`Margin Kiri: ${(leftMarginMm / 10).toFixed(2)} cm`}
        >
          <div className="doc-ruler-marker-triangle marker-left">▼</div>
        </div>

        {/* Printable White Zone */}
        <div
          className="doc-ruler-printable-zone"
          style={{ width: `${(printableMm / paperWidthMm) * 100}%` }}
        >
          <div className="doc-ruler-ticks">
            {Array.from({ length: totalCm }).map((_, i) => (
              <div key={i} className="doc-ruler-cm-mark">
                <span className="doc-ruler-cm-number">{i + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Margin Gray Zone */}
        <div
          className="doc-ruler-margin-zone right"
          style={{ width: `${(rightMarginMm / paperWidthMm) * 100}%` }}
          title={`Margin Kanan: ${(rightMarginMm / 10).toFixed(2)} cm`}
        >
          <div className="doc-ruler-marker-triangle marker-right">▲</div>
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// Official Letterhead Component & Line Styles
// --------------------------------------------------------------------------
const LINE_STYLES = [
  {
    id: "double" as const,
    label: "Garis Ganda Resmi",
    preview: (color: string) => (
      <div style={{ display: "flex", flexDirection: "column", gap: "2px", width: "100%" }}>
        <div style={{ height: "2.5px", background: color }} />
        <div style={{ height: "1px", background: color }} />
      </div>
    ),
  },
  {
    id: "thick-thin" as const,
    label: "Tebal-Tipis Dinas",
    preview: (color: string) => (
      <div style={{ display: "flex", flexDirection: "column", gap: "2px", width: "100%" }}>
        <div style={{ height: "3.5px", background: color }} />
        <div style={{ height: "1px", background: color }} />
      </div>
    ),
  },
  {
    id: "thin-thick" as const,
    label: "Tipis-Tebal Modern",
    preview: (color: string) => (
      <div style={{ display: "flex", flexDirection: "column", gap: "2px", width: "100%" }}>
        <div style={{ height: "1px", background: color }} />
        <div style={{ height: "3px", background: color }} />
      </div>
    ),
  },
  {
    id: "single" as const,
    label: "Garis Tunggal Solid",
    preview: (color: string) => (
      <div style={{ height: "2px", background: color, width: "100%" }} />
    ),
  },
  {
    id: "thin" as const,
    label: "Garis Tunggal Halus",
    preview: (color: string) => (
      <div style={{ height: "1px", background: color, width: "100%" }} />
    ),
  },
  {
    id: "bold" as const,
    label: "Garis Tunggal Tebal",
    preview: (color: string) => (
      <div style={{ height: "3.5px", background: color, width: "100%" }} />
    ),
  },
  {
    id: "accent-gradient" as const,
    label: "Aksen Gradasi Modern",
    preview: (color: string) => (
      <div style={{ height: "3px", background: `linear-gradient(90deg, ${color} 0%, ${color} 65%, transparent 100%)`, width: "100%", borderRadius: "2px" }} />
    ),
  },
  {
    id: "dashed" as const,
    label: "Garis Putus-Putus",
    preview: (color: string) => (
      <div style={{ borderBottom: `2px dashed ${color}`, width: "100%", height: "0px" }} />
    ),
  },
  {
    id: "dotted" as const,
    label: "Garis Titik-Titik",
    preview: (color: string) => (
      <div style={{ borderBottom: `2.5px dotted ${color}`, width: "100%", height: "0px" }} />
    ),
  },
  {
    id: "none" as const,
    label: "Tanpa Garis (Polos)",
    preview: () => (
      <div style={{ fontSize: "10px", color: "#94a3b8", fontStyle: "italic", textAlign: "center" }}>Tanpa garis</div>
    ),
  },
];

const LINE_STYLE_LABELS: Record<string, string> = {
  double: "Ganda Resmi",
  "thick-thin": "Tebal-Tipis",
  "thin-thick": "Tipis-Tebal",
  single: "Tunggal",
  solid: "Tunggal",
  thin: "Halus",
  bold: "Tebal",
  "accent-gradient": "Gradasi",
  dashed: "Putus-putus",
  dotted: "Titik-titik",
  none: "Tanpa Garis",
};

const DIVIDER_COLORS = [
  { color: "#0f2942", label: "Navy Eksekutif" },
  { color: "#000000", label: "Hitam Pekat" },
  { color: "#1e40af", label: "Biru Royal" },
  { color: "#334155", label: "Abu Slate" },
  { color: "#065f46", label: "Hijau Emerald" },
  { color: "#b45309", label: "Emas / Amber" },
  { color: "#991b1b", label: "Merah Marun" },
];

function OfficialLetterhead({
  shipment,
  exporterName,
  exporterAddress,
  onOpenSettings,
  isId = false,
  isEditMode = false,
  update,
  onLetterheadImage,
}: {
  shipment: Shipment;
  exporterName: string;
  exporterAddress: string;
  onOpenSettings: () => void;
  isId?: boolean;
  isEditMode?: boolean;
  update?: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void;
  onLetterheadImage?: (file?: File) => void;
}) {
  const [isSelected, setIsSelected] = useState(false);
  const [selectedLineGapPx, setSelectedLineGapPx] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const [showLineMenu, setShowLineMenu] = useState(false);
  const [dragScale, setDragScale] = useState<number | null>(null);
  const [dragShift, setDragShift] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragMoveOffset, setDragMoveOffset] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const lineMenuRef = useRef<HTMLDivElement | null>(null);
  const quickFileInputRef = useRef<HTMLInputElement | null>(null);

  const activeScale = dragScale !== null ? dragScale : (shipment.letterheadLogoScale ?? 100);
  const baseLogoHeight = 68;
  const scaledHeight = Math.round(baseLogoHeight * (activeScale / 100));

  const wrapMode = shipment.letterheadLogoWrap || "inline";
  const alignMode = shipment.letterheadLogoAlign || "left";
  const posPreset = shipment.letterheadLogoPositionPreset || "inline";
  const logoOpacity = (shipment.letterheadLogoOpacity ?? 100) / 100;
  const logoRotate = shipment.letterheadLogoRotate || 0;
  const flipH = shipment.letterheadLogoFlipH ? -1 : 1;
  const flipV = shipment.letterheadLogoFlipV ? -1 : 1;
  const logoBorder = shipment.letterheadLogoBorder || "none";
  const logoShadow = shipment.letterheadLogoShadow ?? false;

  const letterheadMode = shipment.letterheadMode || "standard";
  const bannerHeight = shipment.letterheadBannerHeight ?? 110;
  const lineSpacing = shipment.letterheadSpacing ?? 2;
  const kopLineHeight = Number((1.1 + lineSpacing * 0.05).toFixed(2));
  const dividerGap = shipment.letterheadDividerGap ?? 4;
  const dividerStyle = shipment.letterheadDividerStyle || "double";
  const dividerColor = shipment.letterheadDividerColor || "#0f2942";
  const layoutMode = shipment.letterheadLayout || "left";
  const rawExporterContact = shipment.exporterContact || "";
  const exporterContact =
    !rawExporterContact ||
    rawExporterContact.trim() === "Telp: +62 812 3456 7890 · Email: official@indicoexport.com"
      ? "Tel: +62 812-3456-7890  |  Email: official@indicoexport.com  |  Web: www.indicoexport.com"
      : rawExporterContact;

  // Parse structured address label & body for executive corporate header
  const addressMatch = exporterAddress.match(/^(Head Office|Kantor Pusat|Office|Alamat)\s*:\s*(.+)$/i);
  const addressLabel = addressMatch ? addressMatch[1].toUpperCase() : isId ? "KANTOR PUSAT" : "HEAD OFFICE";
  const addressBody = addressMatch ? addressMatch[2].trim() : exporterAddress;

  // Parse structured contact pillars (Tel, Email, Web)
  const telMatch = exporterContact.match(/(?:Telp?|Phone|HP|WA)\s*:\s*([^|·•\n]+)/i);
  const emailMatch = exporterContact.match(/(?:Email|E-mail|Mail)\s*:\s*([^|·•\n]+)/i);
  const webMatch = exporterContact.match(/(?:Web|Website|Site)\s*:\s*([^|·•\n]+)/i);
  const telVal = telMatch ? telMatch[1].trim() : "+62 812-3456-7890";
  const emailVal = emailMatch ? emailMatch[1].trim() : "official@indicoexport.com";
  const webVal = webMatch ? webMatch[1].trim() : "www.indicoexport.com";

  const updateContactPart = (part: "tel" | "email" | "web", newVal: string) => {
    if (!update) return;
    const clean = newVal.trim();
    if (!clean) return;
    const nextTel = part === "tel" ? clean : telVal;
    const nextEmail = part === "email" ? clean : emailVal;
    const nextWeb = part === "web" ? clean : webVal;
    update("exporterContact", `Tel: ${nextTel}  |  Email: ${nextEmail}  |  Web: ${nextWeb}`);
  };

  const defaultTagline = isId
    ? "EKSPORTIR & PEMASOK KOMODITAS PERTANIAN & KELAPA INDONESIA"
    : "EXPORTER & SUPPLIER OF INDONESIAN AGRICULTURAL & COCONUT COMMODITIES";
  const [customTagline, setCustomTagline] = useState<string | null>(null);
  const exporterTagline = customTagline !== null ? customTagline : defaultTagline;

  const currentX = dragMoveOffset ? dragMoveOffset.x : (shipment.letterheadLogoX || 0);
  const currentY = dragMoveOffset ? dragMoveOffset.y : (shipment.letterheadLogoY || 0);

  // Notify Ribbon of Image Focus / Deselection & Handle Click Outside
  useEffect(() => {
    if (!isSelected) {
      window.dispatchEvent(new CustomEvent("eksporflow:image-focus", { detail: { hasImage: false } }));
      return;
    }
    window.dispatchEvent(new CustomEvent("eksporflow:image-focus", { detail: { hasImage: true } }));
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(".doc-word-ribbon-container")) return;
      if (containerRef.current && !containerRef.current.contains(target)) {
        setIsSelected(false);
        setShowLayoutMenu(false);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [isSelected]);

  // Handle Click Outside for Line Style Menu
  useEffect(() => {
    if (!showLineMenu) return;
    const handleLineMenuOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (lineMenuRef.current && !lineMenuRef.current.contains(target)) {
        setShowLineMenu(false);
      }
    };
    window.addEventListener("mousedown", handleLineMenuOutside);
    return () => window.removeEventListener("mousedown", handleLineMenuOutside);
  }, [showLineMenu]);

  // Keyboard shortcut: Delete or Backspace key to remove logo when selected
  useEffect(() => {
    if (!isSelected || !isEditMode || !update) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        const target = e.target as HTMLElement;
        if (target.isContentEditable || target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
          return;
        }
        e.preventDefault();
        update("letterheadImage", "");
        setIsSelected(false);
        setShowLayoutMenu(false);
        toast.success("Logo kop surat berhasil dihapus.");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSelected, isEditMode, update]);

  // Free Drag Move across Document Canvas
  const startDragMove = (e: React.MouseEvent) => {
    if (!isEditMode || !update) return;
    if ((e.target as HTMLElement).classList.contains("word-resize-handle")) return;
    if ((e.target as HTMLElement).closest(".word-layout-floating-btn, .word-layout-popover")) return;
    e.preventDefault();
    e.stopPropagation();

    setIsSelected(true);
    setIsMoving(true);
    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const startLogoX = shipment.letterheadLogoX || 0;
    const startLogoY = shipment.letterheadLogoY || 0;
    let finalX = startLogoX;
    let finalY = startLogoY;
    let moved = false;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startClientX;
      const dy = moveEvent.clientY - startClientY;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        moved = true;
        finalX = startLogoX + dx;
        finalY = startLogoY + dy;
        setDragMoveOffset({ x: finalX, y: finalY });
      }
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      setIsMoving(false);
      setDragMoveOffset(null);
      if (moved) {
        update("letterheadLogoX", finalX);
        update("letterheadLogoY", finalY);
        update("letterheadLogoAlign", "custom");
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  // Handle Dragging like in Microsoft Word (Anchored accurately per handle so opposite corner stays locked!)
  const startDragHandle = (
    e: React.MouseEvent,
    handle: "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w"
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (!update || !imgRef.current) return;

    setIsDragging(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const startRect = imgRef.current.getBoundingClientRect();
    const aspectRatio = (startRect.width || 1) / (startRect.height || 1);
    const startHeight = startRect.height;
    const startLogoX = shipment.letterheadLogoX || 0;
    const startLogoY = shipment.letterheadLogoY || 0;
    let latestScale = activeScale;
    let latestShiftX = 0;
    let latestShiftY = 0;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      let deltaH = 0;

      if (handle === "se") {
        deltaH = (dx / aspectRatio + dy) / 2;
      } else if (handle === "nw") {
        deltaH = (-dx / aspectRatio - dy) / 2;
      } else if (handle === "ne") {
        deltaH = (dx / aspectRatio - dy) / 2;
      } else if (handle === "sw") {
        deltaH = (-dx / aspectRatio + dy) / 2;
      } else if (handle === "e") {
        deltaH = dx / aspectRatio;
      } else if (handle === "w") {
        deltaH = -dx / aspectRatio;
      } else if (handle === "s") {
        deltaH = dy;
      } else if (handle === "n") {
        deltaH = -dy;
      }

      const rawNewHeight = Math.max(20, startHeight + deltaH);
      const computedScale = Math.min(300, Math.max(30, Math.round((rawNewHeight / baseLogoHeight) * 100)));
      const actualNewHeight = Math.round(baseLogoHeight * (computedScale / 100));
      const actualDeltaH = actualNewHeight - startHeight;
      const actualDeltaW = actualDeltaH * aspectRatio;

      let sx = 0;
      let sy = 0;
      if (handle === "nw" || handle === "w" || handle === "sw") {
        sx = -actualDeltaW;
      }
      if (handle === "nw" || handle === "n" || handle === "ne") {
        sy = -actualDeltaH;
      }

      latestScale = computedScale;
      latestShiftX = Math.round(sx);
      latestShiftY = Math.round(sy);
      setDragScale(computedScale);
      setDragShift({ x: latestShiftX, y: latestShiftY });
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      setIsDragging(false);
      setDragScale(null);
      setDragShift({ x: 0, y: 0 });
      update("letterheadLogoScale", latestScale);
      if (latestShiftX !== 0 || latestShiftY !== 0) {
        update("letterheadLogoX", startLogoX + latestShiftX);
        update("letterheadLogoY", startLogoY + latestShiftY);
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  // Compute Word Wrap & Positioning CSS Styles
  let wrapStyles: React.CSSProperties = {};
  const isFloatingWrap = wrapMode === "behind" || wrapMode === "front";
  const isFlowWrap = wrapMode === "square" || wrapMode === "tight" || wrapMode === "through";

  if (isFloatingWrap) {
    wrapStyles = {
      position: "absolute",
      left: `${currentX}px`,
      top: `${currentY}px`,
      zIndex: wrapMode === "behind" ? 0 : 25,
      opacity: logoOpacity,
      pointerEvents: isEditMode ? "auto" : "none",
    };
  } else if (isFlowWrap) {
    const gapMargin = wrapMode === "tight" || wrapMode === "through" ? "2px 10px 4px 0" : "2px 16px 6px 0";
    const gapMarginRight = wrapMode === "tight" || wrapMode === "through" ? "2px 0 4px 10px" : "2px 0 6px 16px";
    wrapStyles = {
      float: alignMode === "right" ? "right" : "left",
      margin: alignMode === "right" ? gapMarginRight : gapMargin,
      display: "inline-block",
      position: "relative",
      opacity: logoOpacity,
    };
  } else if (wrapMode === "topBottom") {
    wrapStyles = {
      display: "block",
      margin: alignMode === "center" ? "0 auto 8px" : alignMode === "right" ? "0 0 8px auto" : "0 auto 8px 0",
      clear: "both",
      position: "relative",
      opacity: logoOpacity,
    };
  } else {
    // inline
    wrapStyles = {
      display: "inline-flex",
      position: "relative",
      opacity: logoOpacity,
    };
  }

  let borderStyles: React.CSSProperties = {};
  if (logoBorder === "solid") {
    borderStyles = { border: `1.5px solid ${shipment.letterheadLogoBorderColor || "#cbd5e1"}`, borderRadius: "4px", padding: "3px", background: "#ffffff" };
  } else if (logoBorder === "dashed") {
    borderStyles = { border: `1.5px dashed ${shipment.letterheadLogoBorderColor || "#94a3b8"}`, borderRadius: "4px", padding: "3px" };
  } else if (logoBorder === "rounded") {
    borderStyles = { border: `1.5px solid ${shipment.letterheadLogoBorderColor || "#cbd5e1"}`, borderRadius: "12px", overflow: "hidden", padding: "3px", background: "#ffffff" };
  } else if (logoBorder === "double") {
    borderStyles = { border: `4px double ${shipment.letterheadLogoBorderColor || "#0f2942"}`, borderRadius: "4px", padding: "3px", background: "#ffffff" };
  } else if (logoBorder === "oval") {
    borderStyles = { border: `2px solid ${shipment.letterheadLogoBorderColor || "#cbd5e1"}`, borderRadius: "9999px", overflow: "hidden", padding: "4px", background: "#ffffff" };
  }

  const shadowStyles: React.CSSProperties = logoShadow
    ? { boxShadow: "0 8px 20px rgba(15, 23, 42, 0.22)" }
    : {};

  // Compute divider line style (boxSizing: content-box ensures crisp white gap between double rules!)
  let dividerLineStyles: React.CSSProperties = {
    marginTop: `${dividerGap + 6}px`,
    boxSizing: "content-box",
  };
  if (dividerStyle === "none") {
    dividerLineStyles.display = "none";
  } else if (dividerStyle === "double") {
    dividerLineStyles.borderTop = `2.5px solid ${dividerColor}`;
    dividerLineStyles.borderBottom = `1px solid ${dividerColor}`;
    dividerLineStyles.height = "2.5px";
  } else if (dividerStyle === "thick-thin") {
    dividerLineStyles.borderTop = `3.5px solid ${dividerColor}`;
    dividerLineStyles.borderBottom = `1px solid ${dividerColor}`;
    dividerLineStyles.height = "2.5px";
  } else if (dividerStyle === "thin-thick") {
    dividerLineStyles.borderTop = `1px solid ${dividerColor}`;
    dividerLineStyles.borderBottom = `3px solid ${dividerColor}`;
    dividerLineStyles.height = "2.5px";
  } else if (dividerStyle === "single") {
    dividerLineStyles.borderBottom = `2px solid ${dividerColor}`;
    dividerLineStyles.height = "0px";
  } else if (dividerStyle === "thin") {
    dividerLineStyles.borderBottom = `1px solid ${dividerColor}`;
    dividerLineStyles.height = "0px";
  } else if (dividerStyle === "bold") {
    dividerLineStyles.borderBottom = `3.5px solid ${dividerColor}`;
    dividerLineStyles.height = "0px";
  } else if (dividerStyle === "dashed") {
    dividerLineStyles.borderBottom = `2px dashed ${dividerColor}`;
    dividerLineStyles.height = "0px";
  } else if (dividerStyle === "dotted") {
    dividerLineStyles.borderBottom = `2.5px dotted ${dividerColor}`;
    dividerLineStyles.height = "0px";
  } else if (dividerStyle === "accent-gradient") {
    dividerLineStyles.background = `linear-gradient(90deg, ${dividerColor} 0%, ${dividerColor} 74%, #059669 74%, #059669 91%, #d97706 91%, #d97706 100%)`;
    dividerLineStyles.height = "3.5px";
    dividerLineStyles.borderRadius = "1px";
  } else {
    dividerLineStyles.borderBottom = `2px solid ${dividerColor}`;
    dividerLineStyles.height = "0px";
  }

  const totalTranslateX = (!isFloatingWrap ? currentX : 0) + (isDragging ? dragShift.x : 0);
  const totalTranslateY = (!isFloatingWrap ? currentY : 0) + (isDragging ? dragShift.y : 0);

  return (
    <div
      className="paper-letterhead-wrap group/kop relative"
      style={{
        paddingTop: "4px",
        marginBottom: `${Math.max(12, dividerGap + 10)}px`,
        ["--logo-scale" as any]: `${activeScale / 100}`,
        ["--kop-line-height" as any]: `${kopLineHeight}`,
        ["--kop-line-spacing" as any]: `${lineSpacing}px`,
      }}
    >
      {/* Floating Quick Kop Surat Toolbar in Edit Mode (Appears on Hover, Text Selection, or Logo Selection) */}
      {isEditMode && (
        <div
          className={`letterhead-quick-toolbar no-print transition-all duration-200 ${
            isSelected || showLineMenu
              ? "opacity-100"
              : "opacity-0 group-hover/kop:opacity-100 group-focus-within/kop:opacity-100"
          }`}
          contentEditable={false}
          style={{
            position: "absolute",
            top: "-36px",
            right: "0",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            zIndex: 35,
            background: "rgba(255, 255, 255, 0.98)",
            backdropFilter: "blur(8px)",
            padding: "3px 6px",
            borderRadius: "7px",
            border: "1px solid #cbd5e1",
            boxShadow: "0 4px 16px -2px rgba(15, 23, 42, 0.14), 0 2px 4px -1px rgba(15, 23, 42, 0.06)",
          }}
        >
            {/* Quick hidden file input for Upload Logo */}
          <input
            ref={quickFileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && onLetterheadImage) {
                onLetterheadImage(file);
                toast.success("Logo resmi berhasil dipasang.");
              }
            }}
          />

          {/* Quick Pinterest Corporate Layout Switcher */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "2px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "5px",
              padding: "2px 4px",
              fontSize: "10.5px",
            }}
            title="Pilih desain tata letak kop surat standar korporat internasional"
          >
            <LayoutTemplate size={11} style={{ color: "#1e40af", margin: "0 2px" }} />
            {(
              [
                { id: "left", label: "Grid Eksekutif" },
                { id: "split", label: "Split Korporat" },
                { id: "center", label: "Simetris" },
              ] as const
            ).map((ly) => {
              const active = layoutMode === ly.id;
              return (
                <button
                  key={ly.id}
                  type="button"
                  onClick={() => {
                    if (update) {
                      update("letterheadLayout", ly.id);
                      toast.success(`Desain kop surat: ${ly.label}`);
                    }
                  }}
                  style={{
                    padding: "2px 6px",
                    borderRadius: "3.5px",
                    border: active ? "1px solid #1e40af" : "1px solid transparent",
                    background: active ? "#1e40af" : "transparent",
                    color: active ? "#ffffff" : "#475569",
                    fontWeight: active ? 700 : 600,
                    fontSize: "10px",
                    cursor: "pointer",
                    transition: "all 0.12s ease",
                  }}
                >
                  {ly.label}
                </button>
              );
            })}
          </div>

          {/* Stepper: Spasi Teks */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "2px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "5px",
              padding: "2px 6px",
              fontSize: "11px",
              color: "#334155",
            }}
            title="Atur spasi antar baris teks kop surat"
          >
            <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", marginRight: "2px" }}>Spasi</span>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                saveActiveSelection();
              }}
              onClick={() => {
                const res = stepSelectedBlockSpacingPx(-1, selectedLineGapPx ?? lineSpacing);
                if (res.applied && !res.allLetterheadSelected) {
                  setSelectedLineGapPx(res.nextPx);
                  return;
                }
                setSelectedLineGapPx(null);
                if (update) update("letterheadSpacing", Math.max(0, lineSpacing - 1));
              }}
              style={{
                width: "18px",
                height: "18px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "3px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                fontWeight: 700,
                cursor: "pointer",
                color: "#1e40af",
              }}
            >
              −
            </button>
            <span style={{ fontWeight: 700, color: "#1e293b", padding: "0 3px", minWidth: "22px", textAlign: "center" }}>
              {selectedLineGapPx ?? lineSpacing}px
            </span>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                saveActiveSelection();
              }}
              onClick={() => {
                const res = stepSelectedBlockSpacingPx(1, selectedLineGapPx ?? lineSpacing);
                if (res.applied && !res.allLetterheadSelected) {
                  setSelectedLineGapPx(res.nextPx);
                  return;
                }
                setSelectedLineGapPx(null);
                if (update) update("letterheadSpacing", Math.min(20, lineSpacing + 1));
              }}
              style={{
                width: "18px",
                height: "18px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "3px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                fontWeight: 700,
                cursor: "pointer",
                color: "#1e40af",
              }}
            >
              +
            </button>
          </div>

          {/* Dropdown: Pilihan Garis Kop Surat */}
          <div style={{ position: "relative" }} ref={lineMenuRef}>
            <button
              type="button"
              onClick={() => setShowLineMenu((prev) => !prev)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                background: showLineMenu ? "#eff6ff" : "#f8fafc",
                border: showLineMenu ? "1px solid #3b82f6" : "1px solid #e2e8f0",
                borderRadius: "5px",
                padding: "2px 7px",
                fontSize: "11px",
                fontWeight: 600,
                color: showLineMenu ? "#1d4ed8" : "#334155",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              title="Pilih model garis, warna, dan jarak garis kop surat"
            >
              <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748b" }}>Garis:</span>
              <span style={{ fontWeight: 700, color: dividerColor }}>
                {LINE_STYLE_LABELS[dividerStyle] || "Ganda"}
              </span>
              <ChevronDown size={12} className={showLineMenu ? "rotate-180 transition-transform" : "transition-transform"} />
            </button>

            {/* Popover Pilihan Garis */}
            {showLineMenu && (
              <div
                className="no-print"
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  right: "0",
                  width: "275px",
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  boxShadow: "0 12px 30px -4px rgba(15, 23, 42, 0.22)",
                  padding: "10px",
                  zIndex: 60,
                  fontSize: "11px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", borderBottom: "1px solid #f1f5f9", paddingBottom: "5px" }}>
                  <span style={{ fontWeight: 700, color: "#0f172a", fontSize: "11.5px" }}>Pilihan Model Garis Kop</span>
                  <button
                    type="button"
                    onClick={() => setShowLineMenu(false)}
                    style={{ border: 0, background: "none", color: "#94a3b8", cursor: "pointer", fontSize: "12px", padding: "0 2px" }}
                  >
                    ✕
                  </button>
                </div>

                {/* List model garis */}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxHeight: "210px", overflowY: "auto" }}>
                  {LINE_STYLES.map((st) => {
                    const isSelectedStyle = dividerStyle === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => {
                          if (update) update("letterheadDividerStyle", st.id as any);
                          toast.success(`Model garis: ${st.label}`);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "5px 8px",
                          borderRadius: "5px",
                          border: isSelectedStyle ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
                          background: isSelectedStyle ? "#eff6ff" : "#ffffff",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <span style={{ fontWeight: isSelectedStyle ? 700 : 500, color: isSelectedStyle ? "#1e40af" : "#334155" }}>
                          {st.label}
                        </span>
                        <div style={{ width: "90px" }}>
                          {st.preview(dividerColor)}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Pilihan Warna Garis */}
                <div style={{ marginTop: "10px", paddingTop: "8px", borderTop: "1px solid #f1f5f9" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "5px" }}>
                    Warna Garis
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {DIVIDER_COLORS.map((c) => (
                      <button
                        key={c.color}
                        type="button"
                        onClick={() => {
                          if (update) update("letterheadDividerColor", c.color);
                        }}
                        style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "100%",
                          background: c.color,
                          border: dividerColor.toLowerCase() === c.color.toLowerCase() ? "2px solid #ffffff" : "1px solid #cbd5e1",
                          outline: dividerColor.toLowerCase() === c.color.toLowerCase() ? `2px solid ${c.color}` : "none",
                          cursor: "pointer",
                        }}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>

                {/* Jarak Garis */}
                <div style={{ marginTop: "10px", paddingTop: "8px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748b" }}>Jarak Garis (Gap)</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <button
                      type="button"
                      onClick={() => update && update("letterheadDividerGap", Math.max(0, dividerGap - 2))}
                      style={{ width: "20px", height: "20px", borderRadius: "3px", border: "1px solid #cbd5e1", background: "#f8fafc", cursor: "pointer", fontWeight: 700 }}
                    >
                      −
                    </button>
                    <span style={{ fontWeight: 700, color: "#0f172a", minWidth: "24px", textAlign: "center" }}>
                      {dividerGap}px
                    </span>
                    <button
                      type="button"
                      onClick={() => update && update("letterheadDividerGap", Math.min(28, dividerGap + 2))}
                      style={{ width: "20px", height: "20px", borderRadius: "3px", border: "1px solid #cbd5e1", background: "#f8fafc", cursor: "pointer", fontWeight: 700 }}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stepper: Jarak Garis Langsung */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "2px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "5px",
              padding: "2px 6px",
              fontSize: "11px",
              color: "#334155",
            }}
            title="Atur jarak ke garis pembatas kop surat"
          >
            <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", marginRight: "2px" }}>Jarak</span>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => update && update("letterheadDividerGap", Math.max(0, dividerGap - 2))}
              style={{
                width: "18px",
                height: "18px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "3px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                fontWeight: 700,
                cursor: "pointer",
                color: "#1e40af",
              }}
            >
              −
            </button>
            <span style={{ fontWeight: 700, color: "#1e293b", padding: "0 3px", minWidth: "22px", textAlign: "center" }}>
              {dividerGap}px
            </span>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => update && update("letterheadDividerGap", Math.min(28, dividerGap + 2))}
              style={{
                width: "18px",
                height: "18px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "3px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                fontWeight: 700,
                cursor: "pointer",
                color: "#1e40af",
              }}
            >
              +
            </button>
          </div>

          {/* Tombol Hapus Logo / Pasang Logo */}
          {shipment.letterheadImage ? (
            <button
              type="button"
              onClick={() => {
                if (update) {
                  update("letterheadImage", "");
                  setIsSelected(false);
                  toast.success("Logo kop surat berhasil dihapus.");
                }
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#dc2626",
                borderRadius: "5px",
                padding: "2px 7px",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              title="Hapus logo resmi dari kop surat"
            >
              <Trash2 size={11} />
              <span>Hapus Logo</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => quickFileInputRef.current?.click()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                color: "#16a34a",
                borderRadius: "5px",
                padding: "2px 7px",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              title="Unggah logo resmi perusahaan"
            >
              <Upload size={11} />
              <span>Pasang Logo</span>
            </button>
          )}

          {/* Tombol Atur Kop */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("eksporflow:open-letterhead-modal"))}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              background: "#0f2942",
              border: "1px solid #0f2942",
              color: "#ffffff",
              borderRadius: "5px",
              padding: "2px 9px",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(15, 41, 66, 0.2)",
              transition: "all 0.15s ease",
            }}
            title="Buka panel lengkap pengaturan kop surat"
          >
            <SlidersHorizontal size={11} />
            <span>Atur Kop</span>
          </button>
        </div>
      )}

      {/* MODE 1: FULL BANNER KOP SURAT IMPORTED FROM ANOTHER DOCUMENT */}
      {letterheadMode === "banner" && shipment.letterheadBannerImage ? (
        <div className="letterhead-banner-wrap relative" contentEditable={false}>
          <img
            src={shipment.letterheadBannerImage}
            alt="Kop Surat Resmi Perusahaan"
            style={{
              width: "100%",
              height: `${bannerHeight}px`,
              objectFit: "contain",
              objectPosition: "center",
              display: "block",
            }}
          />
          {isEditMode && (
            <div className="no-print flex items-center justify-end gap-2 mt-1">
              <span className="text-[10px] text-slate-500">Tinggi Kop Banner: {bannerHeight}px</span>
              <input
                type="range"
                min="50"
                max="220"
                value={bannerHeight}
                onChange={(e) => update && update("letterheadBannerHeight", Number(e.target.value))}
                style={{ width: "90px", accentColor: "#2563eb" }}
              />
              <button
                type="button"
                onClick={() => update && update("letterheadMode", "standard")}
                className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 font-semibold"
              >
                Kembali ke Kop Teks
              </button>
            </div>
          )}
        </div>
      ) : (
        /* MODE 2: STANDARD EDITABLE KOP SURAT (Left / Center / Split) */
        <div className="paper-letterhead-content">
          <div
            className="letterhead-brand"
            style={{
              display: "flex",
              flexDirection: layoutMode === "center" ? "column" : "row",
              alignItems: "center",
              justifyContent: layoutMode === "split" ? "space-between" : layoutMode === "center" ? "center" : "flex-start",
              textAlign: layoutMode === "center" ? "center" : "left",
              gap: layoutMode === "center" ? "6px" : "14px",
              width: "100%",
            }}
          >
            {shipment.letterheadImage ? (
              <div
                ref={containerRef}
                contentEditable={false}
                className={`letterhead-logo-container ${isEditMode && isSelected ? "word-image-selected" : ""}`}
                style={{
                  ...wrapStyles,
                  ...borderStyles,
                  ...shadowStyles,
                  transform: `translate(${totalTranslateX}px, ${totalTranslateY}px) rotate(${logoRotate}deg)`,
                  outline: isEditMode && isSelected ? "1.5px solid #2563eb" : undefined,
                  outlineOffset: "2px",
                  cursor: isEditMode ? (isMoving ? "grabbing" : "grab") : "default",
                  userSelect: "none",
                }}
                onMouseDown={(e) => {
                  if (isEditMode) {
                    startDragMove(e);
                  }
                }}
                onClick={(e) => {
                  if (isEditMode) {
                    e.stopPropagation();
                    setIsSelected(true);
                  }
                }}
                onDoubleClick={(e) => {
                  if (isEditMode && update) {
                    e.stopPropagation();
                    update("letterheadLogoScale", 100);
                    update("letterheadLogoX", 0);
                    update("letterheadLogoY", 0);
                    toast.success("Ukuran & posisi logo di-reset ke standar 100%");
                  }
                }}
                title={
                  isEditMode
                    ? "Klik untuk memilih logo, geser untuk memindahkan posisi, atau tarik titik sudutnya (seperti di Microsoft Word)"
                    : undefined
                }
              >
                <img
                  ref={imgRef}
                  src={shipment.letterheadImage}
                  alt="Logo Resmi Perusahaan"
                  className="letterhead-logo"
                  draggable={false}
                  style={{
                    height: `${scaledHeight}px`,
                    maxHeight: `${Math.round(200 * (activeScale / 100))}px`,
                    maxWidth: `${Math.round(400 * (activeScale / 100))}px`,
                    width: "auto",
                    objectFit: "contain",
                    transform: `scale(${flipH}, ${flipV})`,
                    transition: isDragging || isMoving ? "none" : "height 0.1s ease",
                    pointerEvents: isDragging || isMoving ? "none" : "auto",
                  }}
                />

                {/* Microsoft Word Style 8 Resize Handles & Floating Layout Options */}
                {isEditMode && isSelected && (
                  <>
                    {/* Floating Word Layout Options Button */}
                    <button
                      type="button"
                      className="word-layout-floating-btn no-print"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowLayoutMenu((prev) => !prev);
                      }}
                      title="Opsi Tata Letak (Layout Options Microsoft Word)"
                      style={{
                        position: "absolute",
                        top: "-14px",
                        right: "-28px",
                        width: "24px",
                        height: "24px",
                        background: "#ffffff",
                        border: "1px solid #94a3b8",
                        borderRadius: "4px",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.18)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        zIndex: 40,
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                        <rect x="2" y="2" width="12" height="2" fill="#64748b" rx="0.5" />
                        <path d="M4 11 A4 4 0 0 1 12 11" stroke="#2563eb" strokeWidth="1.8" fill="none" />
                        <rect x="2" y="6" width="3" height="1.5" fill="#64748b" rx="0.5" />
                        <rect x="11" y="6" width="3" height="1.5" fill="#64748b" rx="0.5" />
                        <rect x="2" y="13" width="12" height="1.5" fill="#64748b" rx="0.5" />
                      </svg>
                    </button>

                    {/* Floating Word Delete Button */}
                    <button
                      type="button"
                      className="word-logo-delete-btn no-print"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (update) {
                          update("letterheadImage", "");
                          setIsSelected(false);
                          setShowLayoutMenu(false);
                          toast.success("Logo kop surat berhasil dihapus.");
                        }
                      }}
                      title="Hapus Logo Kop Surat (Delete)"
                      style={{
                        position: "absolute",
                        top: "-14px",
                        right: "-56px",
                        width: "24px",
                        height: "24px",
                        background: "#ffffff",
                        border: "1px solid #fca5a5",
                        borderRadius: "4px",
                        boxShadow: "0 2px 6px rgba(220, 38, 38, 0.18)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        zIndex: 40,
                        color: "#dc2626",
                      }}
                    >
                      <Trash2 size={13} />
                    </button>

                    {/* Floating Word Layout Options Popover (Authentic MS Word Layout Options) */}
                    {showLayoutMenu && (
                      <div
                        className="word-layout-popover no-print"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          position: "absolute",
                          top: "-10px",
                          left: "calc(100% + 10px)",
                          background: "#ffffff",
                          border: "1px solid #cbd5e1",
                          borderRadius: "8px",
                          boxShadow: "0 10px 28px rgba(15, 23, 42, 0.22)",
                          padding: "12px",
                          width: "255px",
                          zIndex: 55,
                          fontSize: "11px",
                          textAlign: "left",
                        }}
                      >
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 mb-2">
                          <span className="font-bold text-slate-800 text-[11px]">
                            Layout Options (Opsi Tata Letak)
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowLayoutMenu(false)}
                            className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
                          >
                            ✕
                          </button>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <span className="text-[10px] font-semibold text-slate-500 block mb-1">
                              In Line with Text (Sejajar Teks)
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (update) {
                                  update("letterheadLogoWrap", "inline");
                                  update("letterheadLogoPositionPreset", "inline");
                                  update("letterheadLogoX", 0);
                                  update("letterheadLogoY", 0);
                                  toast.success("Tata letak: In Line with Text (Sejajar Teks)");
                                }
                              }}
                              className={`w-full p-1.5 flex items-center gap-2 rounded border transition-colors ${
                                wrapMode === "inline"
                                  ? "bg-blue-50 border-blue-500 font-bold text-blue-700"
                                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                              }`}
                            >
                              <span className="text-xs">📄</span>
                              <span>In Line with Text (Sejajar)</span>
                            </button>
                          </div>

                          <div>
                            <span className="text-[10px] font-semibold text-slate-500 block mb-1">
                              With Text Wrapping (Bungkus Teks)
                            </span>
                            <div className="grid grid-cols-3 gap-1.5">
                              {[
                                { id: "square", label: "Square", sub: "Kotak" },
                                { id: "tight", label: "Tight", sub: "Rapat" },
                                { id: "through", label: "Through", sub: "Tembus" },
                                { id: "topBottom", label: "Top/Btm", sub: "Atas-Bwh" },
                                { id: "behind", label: "Behind", sub: "Belakang" },
                                { id: "front", label: "In Front", sub: "Di Depan" },
                              ].map((m) => (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => {
                                    if (update) {
                                      update("letterheadLogoWrap", m.id as any);
                                      if (m.id === "behind" && (!shipment.letterheadLogoOpacity || shipment.letterheadLogoOpacity === 100)) {
                                        update("letterheadLogoOpacity", 30);
                                      } else if (m.id === "front" && shipment.letterheadLogoOpacity === 30) {
                                        update("letterheadLogoOpacity", 100);
                                      }
                                      toast.success(`Wrap Text: ${m.label} (${m.sub})`);
                                    }
                                  }}
                                  className={`p-1.5 text-center rounded border transition-colors ${
                                    wrapMode === m.id
                                      ? "bg-blue-50 border-blue-500 font-bold text-blue-700"
                                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                                  }`}
                                >
                                  <div className="text-[10.5px] font-bold">{m.label}</div>
                                  <div className="text-[9px] text-slate-500">{m.sub}</div>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Opacity slider for watermark */}
                          <div className="pt-2 border-t border-slate-100">
                            <div className="flex justify-between items-center text-[10px] font-semibold text-slate-600 mb-1">
                              <span>Transparansi / Watermark:</span>
                              <span className="font-bold text-blue-600">{shipment.letterheadLogoOpacity ?? 100}%</span>
                            </div>
                            <input
                              type="range"
                              min="10"
                              max="100"
                              step="5"
                              value={shipment.letterheadLogoOpacity ?? 100}
                              onChange={(e) => update && update("letterheadLogoOpacity", Number(e.target.value))}
                              style={{ width: "100%", accentColor: "#2563eb" }}
                            />
                          </div>

                          {/* Quick Delete Logo button inside layout menu */}
                          <div className="pt-2 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => {
                                if (update) {
                                  update("letterheadImage", "");
                                  setIsSelected(false);
                                  setShowLayoutMenu(false);
                                  toast.success("Logo kop surat berhasil dihapus.");
                                }
                              }}
                              className="w-full py-1.5 px-2 bg-red-50 hover:bg-red-100 text-red-600 rounded text-[10.5px] font-semibold flex items-center justify-center gap-1.5 border border-red-200 transition-colors"
                            >
                              <Trash2 size={12} /> Hapus Logo Kop Surat
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* NW (Top-Left) */}
                    <div
                      className="word-resize-handle no-print"
                      style={{ top: "-5px", left: "-5px", cursor: "nwse-resize" }}
                      onMouseDown={(e) => startDragHandle(e, "nw")}
                      title="Tarik sudut kiri-atas (sudut kanan-bawah terkunci)"
                    />
                    {/* N (Top-Center) */}
                    <div
                      className="word-resize-handle no-print"
                      style={{ top: "-5px", left: "calc(50% - 4.5px)", cursor: "ns-resize" }}
                      onMouseDown={(e) => startDragHandle(e, "n")}
                      title="Tarik sisi atas"
                    />
                    {/* NE (Top-Right) */}
                    <div
                      className="word-resize-handle no-print"
                      style={{ top: "-5px", right: "-5px", cursor: "nesw-resize" }}
                      onMouseDown={(e) => startDragHandle(e, "ne")}
                      title="Tarik sudut kanan-atas (sudut kiri-bawah terkunci)"
                    />
                    {/* E (Middle-Right) */}
                    <div
                      className="word-resize-handle no-print"
                      style={{ top: "calc(50% - 4.5px)", right: "-5px", cursor: "ew-resize" }}
                      onMouseDown={(e) => startDragHandle(e, "e")}
                      title="Tarik sisi kanan"
                    />
                    {/* SE (Bottom-Right) */}
                    <div
                      className="word-resize-handle no-print"
                      style={{ bottom: "-5px", right: "-5px", cursor: "nwse-resize" }}
                      onMouseDown={(e) => startDragHandle(e, "se")}
                      title="Tarik sudut kanan-bawah (sudut kiri-atas terkunci)"
                    />
                    {/* S (Bottom-Center) */}
                    <div
                      className="word-resize-handle no-print"
                      style={{ bottom: "-5px", left: "calc(50% - 4.5px)", cursor: "ns-resize" }}
                      onMouseDown={(e) => startDragHandle(e, "s")}
                      title="Tarik sisi bawah"
                    />
                    {/* SW (Bottom-Left) */}
                    <div
                      className="word-resize-handle no-print"
                      style={{ bottom: "-5px", left: "-5px", cursor: "nesw-resize" }}
                      onMouseDown={(e) => startDragHandle(e, "sw")}
                      title="Tarik sudut kiri-bawah (sudut kanan-atas terkunci)"
                    />
                    {/* W (Middle-Left) */}
                    <div
                      className="word-resize-handle no-print"
                      style={{ top: "calc(50% - 4.5px)", left: "-5px", cursor: "ew-resize" }}
                      onMouseDown={(e) => startDragHandle(e, "w")}
                      title="Tarik sisi kiri"
                    />

                    {/* Size Indicator Tooltip while dragging */}
                    {isDragging && (
                      <div
                        className="word-resize-tooltip no-print"
                        contentEditable={false}
                        style={{
                          position: "absolute",
                          bottom: "-26px",
                          left: "50%",
                          transform: "translateX(-50%)",
                          background: "rgba(15, 23, 42, 0.9)",
                          color: "#ffffff",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "10px",
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                          pointerEvents: "none",
                          zIndex: 35,
                          boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                        }}
                      >
                        {activeScale}% ({(scaledHeight * 0.0264).toFixed(2)} cm)
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : isEditMode ? (
              <div
                className="letterhead-crest-badge no-print"
                contentEditable={false}
                onClick={() => quickFileInputRef.current?.click()}
                title="Klik untuk memasang logo perusahaan"
                role="button"
                tabIndex={0}
              >
                <Upload size={20} className="text-slate-500" />
                <span className="crest-tag">+ Logo</span>
              </div>
            ) : null}

            {shipment.letterheadImage && layoutMode !== "center" && (
              <div
                className="letterhead-logo-divider"
                contentEditable={false}
                style={{
                  width: "1.5px",
                  height: layoutMode === "split" ? "56px" : "64px",
                  background: "#cbd5e1",
                  margin: "0 16px 0 6px",
                  flexShrink: 0,
                }}
              />
            )}

            {/* CLEAN EXECUTIVE CORPORATE LETTERHEAD TEMPLATES */}
            {layoutMode === "split" ? (
              /* MODE SPLIT: Executive Left-Right Corporate Header */
              <div
                className="letterhead-text doc-layout-split"
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "18px",
                }}
              >
                {/* Left Identity Column */}
                <div style={{ textAlign: "left", flex: 1, minWidth: 0 }}>
                  <h1
                    className="company-name"
                    style={{
                      fontSize: "15.5pt",
                      fontWeight: 800,
                      letterSpacing: "0.035em",
                      color: dividerColor,
                      margin: `0 0 ${Math.max(2, lineSpacing)}px 0`,
                      lineHeight: 1.1,
                      whiteSpace: "nowrap",
                      fontFamily: "'Plus Jakarta Sans', 'Segoe UI', Arial, sans-serif",
                    }}
                    onBlur={(e) => {
                      const text = e.currentTarget.innerText.trim();
                      if (update && text && text !== exporterName) {
                        update("exporter", text);
                      }
                    }}
                  >
                    {exporterName}
                  </h1>
                  <p
                    className="company-tagline"
                    style={{
                      fontSize: "7.2pt",
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      color: "#334155",
                      margin: 0,
                      lineHeight: 1.25,
                      textTransform: "uppercase",
                    }}
                    onBlur={(e) => {
                      const text = e.currentTarget.innerText.trim();
                      if (text !== exporterTagline) {
                        setCustomTagline(text);
                      }
                    }}
                  >
                    {exporterTagline}
                  </p>
                </div>

                {/* Right Corporate Contact Column */}
                <div
                  style={{
                    borderLeft: "1.5px solid #cbd5e1",
                    paddingLeft: "14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: `${Math.max(2, lineSpacing)}px`,
                    textAlign: "left",
                    flexShrink: 0,
                  }}
                >
                  <p
                    className="company-details"
                    style={{
                      fontSize: "8.2pt",
                      lineHeight: 1.3,
                      color: "#1e293b",
                      fontWeight: 500,
                      margin: 0,
                      maxWidth: "290px",
                    }}
                    onBlur={(e) => {
                      const text = e.currentTarget.innerText.trim();
                      if (update && text) {
                        update("letterheadText", `Head Office: ${text}`);
                      }
                    }}
                  >
                    <strong contentEditable={false} style={{ fontWeight: 700, color: dividerColor }}>
                      {addressLabel}:{" "}
                    </strong>
                    {addressBody}
                  </p>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
                    <span>
                      <strong contentEditable={false} style={{ fontSize: "8.2pt", fontWeight: 700, color: dividerColor }}>
                        Tel:{" "}
                      </strong>
                      <span
                        className="company-contact"
                        style={{ fontSize: "8.2pt", fontWeight: 500, color: "#1e293b" }}
                        onBlur={(e) => updateContactPart("tel", e.currentTarget.innerText)}
                      >
                        {telVal}
                      </span>
                    </span>
                    <span contentEditable={false} style={{ color: "#94a3b8", fontSize: "8pt" }}>|</span>
                    <span>
                      <strong contentEditable={false} style={{ fontSize: "8.2pt", fontWeight: 700, color: dividerColor }}>
                        Email:{" "}
                      </strong>
                      <span
                        className="company-contact"
                        style={{ fontSize: "8.2pt", fontWeight: 500, color: "#1e293b" }}
                        onBlur={(e) => updateContactPart("email", e.currentTarget.innerText)}
                      >
                        {emailVal}
                      </span>
                    </span>
                  </div>

                  <div style={{ whiteSpace: "nowrap" }}>
                    <strong contentEditable={false} style={{ fontSize: "8.2pt", fontWeight: 700, color: dividerColor }}>
                      Web:{" "}
                    </strong>
                    <span
                      className="company-contact"
                      style={{ fontSize: "8.2pt", fontWeight: 500, color: "#1e293b" }}
                      onBlur={(e) => updateContactPart("web", e.currentTarget.innerText)}
                    >
                      {webVal}
                    </span>
                  </div>
                </div>
              </div>
            ) : layoutMode === "center" ? (
              /* MODE CENTER: Classic Diplomatic / Chamber of Commerce Symmetrical Header */
              <div
                className="letterhead-text doc-layout-center"
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  gap: `${Math.max(2, lineSpacing)}px`,
                }}
              >
                <h1
                  className="company-name"
                  style={{
                    fontSize: "17pt",
                    fontWeight: 800,
                    letterSpacing: "0.055em",
                    color: dividerColor,
                    margin: 0,
                    lineHeight: 1.1,
                    fontFamily: "'Plus Jakarta Sans', 'Segoe UI', Arial, sans-serif",
                  }}
                  onBlur={(e) => {
                    const text = e.currentTarget.innerText.trim();
                    if (update && text && text !== exporterName) {
                      update("exporter", text);
                    }
                  }}
                >
                  {exporterName}
                </h1>

                <p
                  className="company-tagline"
                  style={{
                    fontSize: "7.8pt",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    color: "#334155",
                    margin: 0,
                    textTransform: "uppercase",
                  }}
                  onBlur={(e) => {
                    const text = e.currentTarget.innerText.trim();
                    if (text !== exporterTagline) {
                      setCustomTagline(text);
                    }
                  }}
                >
                  {exporterTagline}
                </p>

                <div style={{ marginTop: "2px", whiteSpace: "nowrap" }}>
                  <strong
                    contentEditable={false}
                    style={{ fontSize: "8.6pt", fontWeight: 700, color: dividerColor }}
                  >
                    {addressLabel}:{" "}
                  </strong>
                  <span
                    className="company-details"
                    style={{ fontSize: "8.6pt", color: "#1e293b", fontWeight: 500 }}
                    onBlur={(e) => {
                      const text = e.currentTarget.innerText.trim();
                      if (update && text) {
                        update("letterheadText", `Head Office: ${text}`);
                      }
                    }}
                  >
                    {addressBody}
                  </span>
                </div>

                <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "10px", whiteSpace: "nowrap" }}>
                  <span>
                    <strong contentEditable={false} style={{ fontSize: "8.6pt", fontWeight: 700, color: dividerColor }}>
                      Tel:{" "}
                    </strong>
                    <span
                      className="company-contact"
                      style={{ fontSize: "8.6pt", fontWeight: 500, color: "#1e293b" }}
                      onBlur={(e) => updateContactPart("tel", e.currentTarget.innerText)}
                    >
                      {telVal}
                    </span>
                  </span>
                  <span contentEditable={false} style={{ color: "#94a3b8", fontSize: "8.5pt" }}>|</span>
                  <span>
                    <strong contentEditable={false} style={{ fontSize: "8.6pt", fontWeight: 700, color: dividerColor }}>
                      Email:{" "}
                    </strong>
                    <span
                      className="company-contact"
                      style={{ fontSize: "8.6pt", fontWeight: 500, color: "#1e293b" }}
                      onBlur={(e) => updateContactPart("email", e.currentTarget.innerText)}
                    >
                      {emailVal}
                    </span>
                  </span>
                  <span contentEditable={false} style={{ color: "#94a3b8", fontSize: "8.5pt" }}>|</span>
                  <span>
                    <strong contentEditable={false} style={{ fontSize: "8.6pt", fontWeight: 700, color: dividerColor }}>
                      Web:{" "}
                    </strong>
                    <span
                      className="company-contact"
                      style={{ fontSize: "8.6pt", fontWeight: 500, color: "#1e293b" }}
                      onBlur={(e) => updateContactPart("web", e.currentTarget.innerText)}
                    >
                      {webVal}
                    </span>
                  </span>
                </div>
              </div>
            ) : (
              /* MODE LEFT (DEFAULT): Clean Authoritative International Corporate Stationery */
              <div
                className="letterhead-text doc-layout-left"
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                  textAlign: "left",
                }}
              >
                {/* Row 1: Company Name */}
                <h1
                  className="company-name"
                  style={{
                    fontSize: "17.5pt",
                    fontWeight: 800,
                    letterSpacing: "0.04em",
                    color: dividerColor,
                    margin: 0,
                    lineHeight: 1.08,
                    whiteSpace: "nowrap",
                    fontFamily: "'Plus Jakarta Sans', 'Segoe UI', Arial, sans-serif",
                  }}
                  onBlur={(e) => {
                    const text = e.currentTarget.innerText.trim();
                    if (update && text && text !== exporterName) {
                      update("exporter", text);
                    }
                  }}
                >
                  {exporterName}
                </h1>

                {/* Row 2: Business Scope / Tagline (Flush Left, Clean Corporate Tracking) */}
                <p
                  className="company-tagline"
                  style={{
                    fontSize: "7.8pt",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    color: "#334155",
                    margin: "2px 0 0 0",
                    lineHeight: 1.25,
                    whiteSpace: "nowrap",
                    textTransform: "uppercase",
                  }}
                  onBlur={(e) => {
                    const text = e.currentTarget.innerText.trim();
                    if (text !== exporterTagline) {
                      setCustomTagline(text);
                    }
                  }}
                >
                  {exporterTagline}
                </p>

                {/* Full-Width Structural Hairline */}
                <div
                  contentEditable={false}
                  style={{
                    height: "1px",
                    width: "100%",
                    background: "#cbd5e1",
                    margin: `${Math.max(4, lineSpacing + 2)}px 0`,
                  }}
                />

                {/* Row 3 & Row 4: Clean Executive Address & Contact Details */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: `${Math.max(2, lineSpacing)}px`,
                  }}
                >
                  {/* Row 3: Head Office Address (1 Line) */}
                  <div style={{ whiteSpace: "nowrap", lineHeight: 1.32 }}>
                    <strong
                      contentEditable={false}
                      style={{
                        fontSize: "8.6pt",
                        fontWeight: 700,
                        color: dividerColor,
                      }}
                    >
                      Head Office:{" "}
                    </strong>
                    <span
                      className="company-details"
                      style={{
                        fontSize: "8.6pt",
                        color: "#1e293b",
                        fontWeight: 500,
                        lineHeight: 1.32,
                        whiteSpace: "nowrap",
                      }}
                      onBlur={(e) => {
                        const text = e.currentTarget.innerText.trim();
                        if (update && text) {
                          update("letterheadText", `Head Office: ${text}`);
                        }
                      }}
                    >
                      {addressBody}
                    </span>
                  </div>

                  {/* Row 4: Tel | Email | Web (1 Line) */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      flexWrap: "nowrap",
                      whiteSpace: "nowrap",
                      gap: "10px",
                      lineHeight: 1.32,
                    }}
                  >
                    <span>
                      <strong
                        contentEditable={false}
                        style={{ fontSize: "8.6pt", fontWeight: 700, color: dividerColor }}
                      >
                        Tel:{" "}
                      </strong>
                      <span
                        className="company-contact"
                        style={{ fontSize: "8.6pt", fontWeight: 500, color: "#1e293b" }}
                        onBlur={(e) => updateContactPart("tel", e.currentTarget.innerText)}
                      >
                        {telVal}
                      </span>
                    </span>

                    <span contentEditable={false} style={{ color: "#94a3b8", fontSize: "8.6pt" }}>
                      |
                    </span>

                    <span>
                      <strong
                        contentEditable={false}
                        style={{ fontSize: "8.6pt", fontWeight: 700, color: dividerColor }}
                      >
                        Email:{" "}
                      </strong>
                      <span
                        className="company-contact"
                        style={{ fontSize: "8.6pt", fontWeight: 500, color: "#1e293b" }}
                        onBlur={(e) => updateContactPart("email", e.currentTarget.innerText)}
                      >
                        {emailVal}
                      </span>
                    </span>

                    <span contentEditable={false} style={{ color: "#94a3b8", fontSize: "8.6pt" }}>
                      |
                    </span>

                    <span>
                      <strong
                        contentEditable={false}
                        style={{ fontSize: "8.6pt", fontWeight: 700, color: dividerColor }}
                      >
                        Web:{" "}
                      </strong>
                      <span
                        className="company-contact"
                        style={{ fontSize: "8.6pt", fontWeight: 500, color: "#1e293b" }}
                        onBlur={(e) => updateContactPart("web", e.currentTarget.innerText)}
                      >
                        {webVal}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="letterhead-divider-line" style={dividerLineStyles} />
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
// INTERACTIVE DOCUMENT TITLE BANNER (SELECTABLE & COLOR CUSTOMIZABLE)
// --------------------------------------------------------------------------
function DocTitleBanner({ title }: { title: string }) {
  const barRef = useRef<HTMLDivElement>(null);
  const h2Ref = useRef<HTMLHeadingElement>(null);

  const selectTitleText = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const h2 = h2Ref.current;
    if (!h2) return;
    const bar = barRef.current;
    if (bar) {
      document.querySelectorAll(".active-doc-box").forEach((el) => el.classList.remove("active-doc-box"));
      bar.classList.add("active-doc-box");
    }
    try {
      const range = document.createRange();
      range.selectNodeContents(h2);
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
      saveActiveSelection();
    } catch {
      // ignore
    }
  };

  const applyTitleBoxStyle = (
    bg: string,
    textColor: string,
    border: string
  ) => {
    const bar = barRef.current;
    const h2 = h2Ref.current;
    if (!bar || !h2) return;
    pushEditorHistory("title-box-style");
    bar.style.setProperty("background", bg, "important");
    bar.style.setProperty("background-color", bg, "important");
    bar.style.setProperty("border", border, "important");
    h2.style.setProperty("color", textColor, "important");
    h2.querySelectorAll<HTMLElement>("*").forEach((child) => {
      child.style.setProperty("color", textColor, "important");
    });
    toast.success("Gaya & warna kotak judul diperbarui");
  };

  return (
    <div
      ref={barRef}
      className="doc-title-bar group/titlebar relative"
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest(".titlebar-quick-tools")) return;
        if (target === barRef.current && h2Ref.current) {
          selectTitleText();
        }
      }}
    >
      <div
        className="titlebar-quick-tools no-print opacity-0 group-hover/titlebar:opacity-100 group-focus-within/titlebar:opacity-100 transition-opacity duration-150"
        contentEditable={false}
        style={{
          position: "absolute",
          top: "-24px",
          right: "0",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          background: "#ffffff",
          border: "1px solid #cbd5e1",
          borderRadius: "5px",
          padding: "2px 6px",
          boxShadow: "0 2px 6px rgba(15, 23, 42, 0.1)",
          zIndex: 25,
        }}
      >
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={selectTitleText}
          style={{
            fontSize: "9.5px",
            fontWeight: 700,
            color: "#1e40af",
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: "3px",
            padding: "1px 6px",
            cursor: "pointer",
          }}
          title="Blok / pilih seluruh teks judul untuk diubah ukuran atau jenis hurufnya"
        >
          Pilih Teks
        </button>
        <span style={{ fontSize: "9px", fontWeight: 700, color: "#64748b", marginLeft: "2px" }}>
          Warna Kotak:
        </span>
        {[
          { label: "Navy Korporat", bg: "#0f2942", text: "#ffffff", border: "1px solid #0f2942", swatch: "#0f2942" },
          { label: "Biru Royal", bg: "#1e40af", text: "#ffffff", border: "1px solid #1e40af", swatch: "#1e40af" },
          { label: "Hijau Ekspor", bg: "#065f46", text: "#ffffff", border: "1px solid #065f46", swatch: "#065f46" },
          { label: "Slate Modern", bg: "#334155", text: "#ffffff", border: "1px solid #334155", swatch: "#334155" },
          { label: "Putih Garis Resmi", bg: "#ffffff", text: "#0f172a", border: "1.5px solid #0f2942", swatch: "#ffffff" },
        ].map((preset) => (
          <button
            key={preset.label}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyTitleBoxStyle(preset.bg, preset.text, preset.border)}
            title={preset.label}
            style={{
              width: "13px",
              height: "13px",
              borderRadius: "3px",
              background: preset.swatch,
              border: preset.swatch === "#ffffff" ? "1.5px solid #0f2942" : "1px solid rgba(0,0,0,0.2)",
              cursor: "pointer",
              padding: 0,
            }}
          />
        ))}
      </div>
      <h2 ref={h2Ref}>{title}</h2>
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
      <DocTitleBanner title={isId ? "FAKTUR PROFORMA (PROFORMA INVOICE)" : "PROFORMA INVOICE"} />

      <div className="doc-two-col-grid">
        <div className="doc-box">
          <span className="doc-box-tag">
            {isId ? "PEMBELI / PENERIMA (BUYER / CONSIGNEE):" : "BUYER / CONSIGNEE:"}
          </span>
          <b className="doc-entity-name">{buyerName}</b>
          <p className="doc-entity-address">
            {buyerCountry && !buyerAddress.toLowerCase().includes(buyerCountry.toLowerCase())
              ? `${buyerAddress}, ${buyerCountry}`
              : buyerAddress}
          </p>
          <p className="doc-entity-contact">Telp: {buyerPhone || "+971 4 223 4567"} | Email: {buyerEmail || "procurement@albarakahfoods.ae"}</p>
          <p className="doc-entity-contact">
            {isId ? "Narahubung:" : "Contact Person:"}{" "}
            <span>
              {buyerPicName || "Mr. Tariq Al-Mansoor"}{" "}
              {isId ? `(${buyerPicRole || "Direktur Pengadaan"})` : `(${buyerPicRole || "Procurement Director"})`}
            </span>
          </p>
        </div>

        <div className="doc-box">
          <div className="meta-pair">
            <span className="meta-label">{isId ? "No. Faktur:" : "Invoice No.:"}</span>
            <b className="meta-value meta-value-primary">PI/IEI-DXB/X/2026/001</b>
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
            <span className="meta-value">{poNumber || shipment.poNumber || "ABF/LOI/2026/108"}</span>
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
            <span className="terms-val">{pol}</span>
          </div>
          <div>
            <span className="terms-lbl">{isId ? "Ketentuan Penyerahan:" : "Incoterm:"}</span>
            <span className="terms-val">{incoterm} Makassar (Incoterms 2020)</span>
          </div>
          <div>
            <span className="terms-lbl">{isId ? "Pelabuhan Bongkar (POD):" : "Port of Discharge:"}</span>
            <span className="terms-val">{pod}</span>
          </div>
          <div>
            <span className="terms-lbl">{isId ? "Estimasi Pengapalan:" : "Est. Shipment:"}</span>
            <span className="terms-val">
              {isId ? "Maksimal 21 hari setelah Pembayaran Uang Muka" : "Within 21 days after Advance Payment"}
            </span>
          </div>
          <div className="col-span-full">
            <span className="terms-lbl">{isId ? "Syarat Pembayaran:" : "Payment Terms:"}</span>
            <span className="terms-val">
              {paymentTerms ||
                (isId
                  ? "Telegraphic Transfer (T/T) - 50% Uang Muka (DP), 50% terhadap Salinan B/L"
                  : "Telegraphic Transfer (T/T) - 50% Advance Payment, 50% against Copy of B/L")}
            </span>
          </div>
        </div>
      </div>

      <table className="doc-table-pro">
        <thead>
          <tr>
            <th style={{ width: "36px", textAlign: "center" }}>No</th>
            <th style={{ width: "42%" }}>{isId ? "Deskripsi & Spesifikasi Barang" : "Description of Goods"}</th>
            <th style={{ width: "85px", textAlign: "center" }}>{isId ? "Kode HS" : "HS Code"}</th>
            <th style={{ width: "85px", textAlign: "right" }}>{isId ? "Jumlah (MT)" : "Qty (MT)"}</th>
            <th style={{ width: "95px", textAlign: "right" }}>{isId ? "Harga Satuan" : "Unit Price"}</th>
            <th style={{ width: "105px", textAlign: "right" }}>{isId ? "Total Nilai" : "Total Amount"}</th>
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
            <td className="text-center font-normal">{hsCode}</td>
            <td className="text-right font-normal">{formatNumber(netWeightMT, 2)} MT</td>
            <td className="text-right font-normal">{formatMoney(unitPricePerMT, currency)} / MT</td>
            <td className="text-right font-normal text-slate-900">{formatMoney(totalAmount, currency)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr className="doc-table-total-row">
            <td colSpan={4} className="text-right font-bold">
              TOTAL {incoterm} MAKASSAR (INCOTERMS 2020)
            </td>
            <td colSpan={2} className="text-right font-bold text-blue-900">
              {currency} {formatNumber(totalAmount, 2)}
            </td>
          </tr>
        </tfoot>
      </table>

      <div className="doc-words-banner">
        <span className="words-lbl">{isId ? "Terbilang:" : "Say:"}</span>{" "}
        <span className="words-val italic">{amountInWords}</span>
      </div>

      <div className="doc-bank-card">
        <table className="bank-card-table">
          <thead>
            <tr>
              <th colSpan={2} className="bank-card-title" style={{ textAlign: "left" }}>
                <span>{isId ? "RINCIAN REKENING BANK PENERIMA (BENEFICIARY)" : "BANK DETAILS FOR BENEFICIARY"}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="bank-lbl">{isId ? "Nama Bank:" : "Bank Name:"}</td>
              <td className="bank-val">{bankName || "PT. Bank Mandiri (Persero) Tbk - KCP Makassar Panakkukang"}</td>
            </tr>
            <tr>
              <td className="bank-lbl">{isId ? "Alamat Bank:" : "Bank Address:"}</td>
              <td className="bank-val">
                {shipment.bankAddress || "Jl. Boulevard, Panakkukang, Makassar, South Sulawesi, Indonesia"}
              </td>
            </tr>
            <tr>
              <td className="bank-lbl">{isId ? "Nama Rekening:" : "Account Name:"}</td>
              <td className="bank-val font-semibold">{exporterName}</td>
            </tr>
            <tr>
              <td className="bank-lbl">{isId ? "Nomor Rekening:" : "Account Number:"}</td>
              <td className="bank-val font-semibold">{bankAccountNo || "152-00-9876543-2"} {isId ? "(Rekening Valas USD)" : "(USD Account)"}</td>
            </tr>
            <tr>
              <td className="bank-lbl">{isId ? "Kode SWIFT / BIC:" : "SWIFT Code:"}</td>
              <td className="bank-val">{bankSwift || "BMRIIDJA"}</td>
            </tr>
            <tr>
              <td className="bank-lbl">{isId ? "Mata Uang:" : "Currency:"}</td>
              <td className="bank-val">{currency} {isId ? "(Dolar Amerika Serikat)" : "(United States Dollar)"}</td>
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
      <DocTitleBanner title={isId ? "KONTRAK PENJUALAN EKSPOR (SALES CONTRACT)" : "SALES CONTRACT"} />

      <div className="doc-contract-ref-bar">
        <span>
          {isId ? "No. Kontrak:" : "Contract No:"} <b>SC/IEI-ABF/XI/2026/001</b>
        </span>
        <span>|</span>
        <span>
          {isId ? "Tanggal:" : "Date:"} <span>{isId ? "2 November 2026" : "November 2, 2026"}</span>
        </span>
        {poNumber && (
          <>
            <span>|</span>
            <span>
              {isId ? "Ref. Buyer PO:" : "Buyer PO Ref:"} <span>{poNumber}</span>
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
          <p className="party-address">
            {buyerCountry && !buyerAddress.toLowerCase().includes(buyerCountry.toLowerCase())
              ? `${buyerAddress}, ${buyerCountry}`
              : buyerAddress}
          </p>
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
          <div className="sig-box-space" />
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
      <DocTitleBanner title={isId ? "FAKTUR KOMERSIAL (COMMERCIAL INVOICE)" : "COMMERCIAL INVOICE"} />

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
            <p className="doc-entity-address">
              {buyerCountry && !buyerAddress.toLowerCase().includes(buyerCountry.toLowerCase())
                ? `${buyerAddress}, ${buyerCountry}`
                : buyerAddress}
            </p>
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
              <b className="meta-value meta-value-primary">INV/IEI-DXB/XI/2026/001</b>
            </div>
            <div className="meta-pair">
              <span className="meta-label">{isId ? "Tanggal:" : "Date:"}</span>{" "}
              <span className="meta-value">{isId ? "20 November 2026" : "November 20, 2026"}</span>
            </div>
            <div className="meta-pair">
              <span className="meta-label">{isId ? "No. Kontrak Penjualan:" : "Sales Contract No.:"}</span>{" "}
              <span className="meta-value">SC/IEI-ABF/XI/2026/001</span>
            </div>
            {poNumber && (
              <div className="meta-pair">
                <span className="meta-label">{isId ? "Ref. Buyer PO:" : "Buyer PO Ref:"}</span>{" "}
                <span className="meta-value">{poNumber}</span>
              </div>
            )}
            <div className="meta-pair">
              <span className="meta-label">{isId ? "Syarat Pembayaran:" : "Payment Terms:"}</span>{" "}
              <span className="meta-value">{paymentTerms || "Telegraphic Transfer (T/T)"}</span>
            </div>
          </div>

          <div className="doc-box transport-box">
            <span className="doc-box-tag">
              {isId ? "RINCIAN PENGANGKUTAN (TRANSPORT DETAILS):" : "TRANSPORT DETAILS:"}
            </span>
            <div className="meta-pair">
              <span className="meta-label">{isId ? "Kapal / Pelayaran:" : "Vessel / Voyage:"}</span>{" "}
              <span className="meta-value">{vesselName || "KMTC SHIMIZU V.2611N"}</span>
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
              <span className="meta-value">{containerNumber || "TGHU 2468135"} / {sealNumber || "IDMKS998877"} (1x20&apos; FCL)</span>
            </div>
            <div className="meta-pair">
              <span className="meta-label">{isId ? "No. Bill of Lading:" : "B/L Number:"}</span>{" "}
              <span className="meta-value">KMTC-MKS0091827</span>
            </div>
          </div>
        </div>
      </div>

      <table className="doc-table-pro">
        <thead>
          <tr>
            <th style={{ width: "130px" }}>{isId ? "Tanda & No. Kemasan" : "Marks & Nos"}</th>
            <th style={{ width: "42%" }}>{isId ? "Deskripsi & Spesifikasi Barang" : "Description of Goods"}</th>
            <th style={{ width: "85px", textAlign: "right" }}>{isId ? "Kuantitas" : "Quantity"}</th>
            <th style={{ width: "95px", textAlign: "right" }}>{isId ? "Harga Satuan" : "Unit Price"}</th>
            <th style={{ width: "105px", textAlign: "right" }}>{isId ? "Total Nilai" : "Total Amount"}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <b>{buyerName.split(" ")[0] || "AL BARAKAH"}</b><br />
              DUBAI - UAE<br />
              BATCH: 11/26<br />
              PROD: 11/2026<br />
              EXP: 11/2028<br />
              MADE IN INDONESIA
            </td>
            <td>
              <b className="table-product-title">{productName.toUpperCase()}</b>
              <p className="text-slate-800 mt-1">{isId ? "Kode HS:" : "HS Code:"} {hsCode}</p>
              <p className="text-slate-800">
                {isId ? "Kemasan: Karung Kertas Kraft Multiwall 20 Kg Neto" : "Packing: 20 Kg Net / Multiwall Kraft Paper Bag"}
              </p>
              <p className="text-slate-800">
                {isId ? `Total Kemasan: ${formatNumber(bagsCount)} Karung` : `Total Packages: ${formatNumber(bagsCount)} Bags`}
              </p>
              <p className="text-slate-800 mt-1">
                {isId
                  ? `Berat Neto: ${formatNumber(netWeightKgs, 2)} Kg | Berat Bruto: ${formatNumber(grossWeightKgs, 2)} Kg`
                  : `Net Weight: ${formatNumber(netWeightKgs, 2)} Kgs | Gross Weight: ${formatNumber(grossWeightKgs, 2)} Kgs`}
              </p>
              <p className="text-slate-800">{isId ? "Negara Asal: Indonesia" : "Country of Origin: Indonesia"}</p>
            </td>
            <td className="text-right font-normal">
              {formatNumber(bagsCount)} {isId ? "Karung" : "Bags"}<br />
              <span className="text-slate-700">
                ({formatNumber(netWeightMT, 2)} MT {isId ? "Neto" : "Net"})
              </span>
            </td>
            <td className="text-right font-normal">
              {currency} {formatNumber(unitPricePerMT, 2)}<br />
              <span className="text-slate-700">/ MT</span>
            </td>
            <td className="text-right font-normal text-slate-900">
              {currency} {formatNumber(totalAmount, 2)}
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr className="doc-table-total-row">
            <td colSpan={4} className="text-right font-bold">
              TOTAL {incoterm} MAKASSAR (INCOTERMS 2020)
            </td>
            <td className="text-right font-bold text-blue-900">
              {currency} {formatNumber(totalAmount, 2)}
            </td>
          </tr>
        </tfoot>
      </table>

      <div className="doc-words-banner">
        <span className="words-lbl">{isId ? "Terbilang:" : "Amount in Words:"}</span>{" "}
        <span className="words-val italic">{amountInWords}</span>
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
      <DocTitleBanner title={isId ? "DAFTAR KEMASAN (PACKING LIST)" : "PACKING LIST"} />

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
            <p className="doc-entity-address">
              {buyerCountry && !buyerAddress.toLowerCase().includes(buyerCountry.toLowerCase())
                ? `${buyerAddress}, ${buyerCountry}`
                : buyerAddress}
            </p>
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
              <b className="meta-value meta-value-primary">PL/IEI-DXB/XI/2026/001</b>
            </div>
            <div className="meta-pair">
              <span className="meta-label">{isId ? "No. Faktur:" : "Invoice No.:"}</span>{" "}
              <span className="meta-value">INV/IEI-DXB/XI/2026/001</span>
            </div>
            <div className="meta-pair">
              <span className="meta-label">{isId ? "Tanggal:" : "Date:"}</span>{" "}
              <span className="meta-value">{isId ? "20 November 2026" : "November 20, 2026"}</span>
            </div>
            <div className="meta-pair">
              <span className="meta-label">{isId ? "No. Kontrak Penjualan:" : "Sales Contract No.:"}</span>{" "}
              <span className="meta-value">SC/IEI-ABF/XI/2026/001</span>
            </div>
            {poNumber && (
              <div className="meta-pair">
                <span className="meta-label">{isId ? "Ref. Buyer PO:" : "Buyer PO Ref:"}</span>{" "}
                <span className="meta-value">{poNumber}</span>
              </div>
            )}
          </div>

          <div className="doc-box transport-box">
            <span className="doc-box-tag">
              {isId ? "RINCIAN PENGANGKUTAN (TRANSPORT DETAILS):" : "TRANSPORT DETAILS:"}
            </span>
            <div className="meta-pair">
              <span className="meta-label">{isId ? "Kapal / Pelayaran:" : "Vessel / Voyage:"}</span>{" "}
              <span className="meta-value">{vesselName || "KMTC SHIMIZU V.2611N"}</span>
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
              <span className="meta-value">{containerNumber || "TGHU 2468135"} / {sealNumber || "IDMKS998877"} (1x20&apos; FCL)</span>
            </div>
            <div className="meta-pair">
              <span className="meta-label">{isId ? "No. Bill of Lading:" : "B/L Number:"}</span>{" "}
              <span className="meta-value">KMTC-MKS0091827</span>
            </div>
          </div>
        </div>
      </div>

      <table className="doc-table-pro">
        <thead>
          <tr>
            <th style={{ width: "120px" }}>{isId ? "Tanda & No. Kemasan" : "Marks & Nos"}</th>
            <th style={{ width: "40%" }}>{isId ? "Deskripsi Barang & Spesifikasi Kemasan" : "Description of Goods & Packing Spec"}</th>
            <th style={{ width: "70px", textAlign: "right" }}>{isId ? "Jumlah (Koli)" : "Qty (Bags)"}</th>
            <th style={{ width: "85px", textAlign: "right" }}>{isId ? "Berat Neto (Net Weight)" : "Net Weight"}</th>
            <th style={{ width: "85px", textAlign: "right" }}>{isId ? "Berat Bruto (Gross Weight)" : "Gross Weight"}</th>
            <th style={{ width: "75px", textAlign: "right" }}>{isId ? "Volume (CBM)" : "Meas. (CBM)"}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <b>{buyerName.split(" ")[0] || "AL BARAKAH"}</b><br />
              DUBAI - UAE<br />
              BATCH: 11/26<br />
              PROD: 11/2026<br />
              EXP: 11/2028
            </td>
            <td>
              <b className="table-product-title">{productName}</b>
              <p className="text-slate-800 mt-1">{isId ? "Kode HS:" : "HS Code:"} {hsCode}</p>
              <div className="text-slate-800 mt-2">
                <span className="font-semibold">{isId ? "Spesifikasi Kemasan:" : "Packing Specification:"}</span>
                <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
                  <li>{isId ? "@ 20,00 Kg Berat Neto / Karung" : "@ 20.00 Kg Net Weight / Bag"}</li>
                  <li>{isId ? "@ 20,25 Kg Berat Bruto / Karung" : "@ 20.25 Kg Gross Weight / Bag"}</li>
                  <li>{isId ? "Dimensi Karung: 60 x 40 x 12 cm" : "Bag Dimension: 60 x 40 x 12 cm"}</li>
                  <li>{isId ? "Lapisan Dalam: Plastik PE Food Grade" : "Inner: Food Grade PE Plastic Liner"}</li>
                  <li>{isId ? "Lapisan Luar: Karung Kertas Kraft 3 Lapis (Heavy Duty)" : "Outer: 3-Ply Heavy Duty Kraft Paper Bag"}</li>
                </ul>
              </div>
            </td>
            <td className="text-right font-normal">{formatNumber(bagsCount)} {isId ? "Karung" : "Bags"}</td>
            <td className="text-right font-normal">
              {formatNumber(netWeightKgs, 2)} Kgs<br />
              <span className="text-slate-600">
                ({formatNumber(netWeightMT, 2)} MT {isId ? "Neto" : ""})
              </span>
            </td>
            <td className="text-right font-normal">
              {formatNumber(grossWeightKgs, 2)} Kgs<br />
              <span className="text-slate-600">
                ({formatNumber(grossWeightMT, 3)} MT {isId ? "Bruto" : ""})
              </span>
            </td>
            <td className="text-right font-normal text-slate-900">{formatNumber(totalCBM, 3)} CBM</td>
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
      <DocTitleBanner title={isId ? "INSTRUKSI PENGAPALAN (SHIPPING INSTRUCTION)" : "SHIPPING INSTRUCTION (SI)"} />

      <div className="doc-si-header-grid">
        <div>
          <span className="si-lbl">{isId ? "No. SI:" : "SI Number:"}</span>{" "}
          <b>SI/IEI/XI/2026/001</b>
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
          <span>{isId ? "Bagian Booking & Dokumentasi Ekspor" : "Export Booking & Documentation Dept."}</span>
        </div>
        <div>
          <span className="si-lbl">{isId ? "Ref. Kontrak:" : "Contract Ref:"}</span>{" "}
          <span>SC/IEI-ABF/XI/2026/001</span>
        </div>
        <div>
          <span className="si-lbl">{isId ? "Ref. Faktur:" : "Invoice Ref:"}</span>{" "}
          <span>INV/IEI-DXB/XI/2026/001</span>
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
          <span className="strip-val">{vesselName || "KMTC SHIMIZU V.2611N"}</span>
          <small className="strip-sub">ETD: Nov 21, 2026</small>
        </div>
        <div className="strip-item">
          <span className="strip-lbl">{isId ? "Pelabuhan Muat (POL)" : "Port of Loading (POL)"}</span>
          <span className="strip-val">{pol}</span>
        </div>
        <div className="strip-item">
          <span className="strip-lbl">{isId ? "Pelabuhan Bongkar (POD)" : "Port of Discharge (POD)"}</span>
          <span className="strip-val">{pod}</span>
        </div>
        <div className="strip-item">
          <span className="strip-lbl">{isId ? "Kontainer & Muat" : "Container & Stuffing"}</span>
          <span className="strip-val">1 x 20&apos; GP (Food Grade)</span>
          <small className="strip-sub">{isId ? "Muat: 18 Nov 2026" : "Stuffing: Nov 18, 2026"}</small>
        </div>
      </div>

      <table className="doc-table-pro">
        <thead>
          <tr>
            <th style={{ width: "120px" }}>{isId ? "Tanda & Nomor Kemasan" : "Marks & Numbers"}</th>
            <th style={{ width: "100px" }}>{isId ? "Jumlah Kemasan" : "No. of Pkgs"}</th>
            <th style={{ width: "44%" }}>{isId ? "Deskripsi Barang (Pada B/L)" : "Description of Goods (On B/L)"}</th>
            <th style={{ width: "85px", textAlign: "right" }}>{isId ? "Berat (Kg)" : "Weight (Kgs)"}</th>
            <th style={{ width: "80px", textAlign: "right" }}>{isId ? "Dimensi / Volume" : "Measurement"}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <b>{buyerName.split(" ")[0] || "AL BARAKAH"}</b><br />
              DUBAI - UAE<br />
              BATCH: 11/26<br />
              PROD: 11/2026<br />
              EXP: 11/2028<br />
              MADE IN INDONESIA
            </td>
            <td>
              <b>{formatNumber(bagsCount)} {isId ? "KARUNG" : "BAGS"}</b><br />
              <span className="text-slate-700">
                {isId ? "(Sembilan Ratus Karung Kertas Kraft Multiwall)" : "(Nine Hundred Multiwall Kraft Paper Bags)"}
              </span>
            </td>
            <td>
              <b className="table-product-title">{productName.toUpperCase()}</b>
              <p className="text-slate-800 mt-1">
                {isId
                  ? "Dikemas dalam Karung Kertas Kraft Multiwall 20 Kg Neto dengan Lapisan Dalam Plastik PE Food-Grade."
                  : "Packed in 20 Kg Net Multiwall Kraft Paper Bags with Inner Food-Grade PE Liner."}
              </p>
              <p className="text-slate-800 mt-1">{isId ? "Kode HS:" : "HS Code:"} {hsCode}</p>
              <p className="text-slate-800">
                {isId ? "No. Kontainer / Segel:" : "Cont / Seal No.:"} {containerNumber || "TGHU 2468135"} / {sealNumber || "IDMKS998877"}
              </p>
              <p className="text-slate-800">
                {isId ? "Negara Asal: Indonesia" : "Country of Origin: Indonesia"}
              </p>
            </td>
            <td className="text-right">
              <div className="font-semibold text-slate-700">{isId ? "NETO:" : "NET:"}</div>
              <span>{formatNumber(netWeightKgs, 2)} KGS</span>
              <div className="font-semibold text-slate-700 mt-2">{isId ? "BRUTO:" : "GROSS:"}</div>
              <span>{formatNumber(grossWeightKgs, 2)} KGS</span>
            </td>
            <td className="text-right font-normal text-slate-900 text-sm">
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
                label="Ukuran Kertas Dokumen (Tersedia juga di Toolbar Word)"
                value={shipment.paperSize}
                onChange={(value) => update("paperSize", value as PaperSize)}
              >
                <option value="A4">A4 · 210 × 297 mm (Standar Internasional ISO)</option>
                <option value="Letter">US Letter · 8.5 × 11 in (Standar Amerika)</option>
                <option value="Legal">US Legal · 8.5 × 14 in (Panjang)</option>
                <option value="Folio">Folio / F4 · 8.5 × 13 in (Standar Bisnis & Ekspor RI)</option>
                <option value="Executive">Executive · 7.25 × 10.5 in</option>
                <option value="A3">A3 · 297 × 420 mm (Format Lebar ISO)</option>
                <option value="A5">A5 · 148 × 210 mm (Format Ringkas ISO)</option>
                <option value="B4">B4 JIS · 257 × 364 mm (Standar Jepang)</option>
                <option value="B5">B5 JIS · 182 × 257 mm (Standar Jepang)</option>
                <option value="Tabloid">Tabloid · 11 × 17 in (Ledger ANSI B)</option>
                <option value="Statement">Statement · 5.5 × 8.5 in (Half Letter)</option>
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
                label="Alamat Lengkap Kop Surat"
                value={shipment.letterheadText}
                placeholder="Jl. Adiyaksa Baru No. 1B, Makassar..."
                onChange={(value) => update("letterheadText", value)}
              />

              <Field
                label="Kontak Kop Surat (Telp, Email, Website)"
                value={shipment.exporterContact || "Telp: +62 812 3456 7890 · Email: official@indicoexport.com"}
                placeholder="Telp: +62 812 3456 7890 · Email: official@indicoexport.com"
                onChange={(value) => update("exporterContact", value)}
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

                      {/* Scale / Ukuran Logo Slider & Presets */}
                      <div className="doc-logo-scale-control" style={{ marginTop: "12px", paddingTop: "8px", borderTop: "1px dashed #cbd5e1" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                          <span style={{ fontSize: "11px", fontWeight: 600, color: "#334155" }}>
                            Skala / Ukuran Logo:
                          </span>
                          <span style={{ fontSize: "12px", fontWeight: 700, color: "#0284c7" }}>
                            {shipment.letterheadLogoScale ?? 100}%
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <button
                            type="button"
                            className="doc-logo-scale-btn"
                            onClick={() => {
                              const cur = shipment.letterheadLogoScale ?? 100;
                              update("letterheadLogoScale", Math.max(40, cur - 10));
                            }}
                            style={{
                              width: "24px",
                              height: "24px",
                              border: "1px solid #cbd5e1",
                              background: "#fff",
                              borderRadius: "4px",
                              fontWeight: "bold",
                              cursor: "pointer",
                            }}
                            title="Perkecil logo (-10%)"
                          >
                            -
                          </button>
                          <input
                            type="range"
                            min="40"
                            max="200"
                            step="5"
                            value={shipment.letterheadLogoScale ?? 100}
                            onChange={(e) => update("letterheadLogoScale", Number(e.target.value))}
                            style={{ flex: 1, accentColor: "#0284c7", cursor: "pointer" }}
                          />
                          <button
                            type="button"
                            className="doc-logo-scale-btn"
                            onClick={() => {
                              const cur = shipment.letterheadLogoScale ?? 100;
                              update("letterheadLogoScale", Math.min(200, cur + 10));
                            }}
                            style={{
                              width: "24px",
                              height: "24px",
                              border: "1px solid #cbd5e1",
                              background: "#fff",
                              borderRadius: "4px",
                              fontWeight: "bold",
                              cursor: "pointer",
                            }}
                            title="Perbesar logo (+10%)"
                          >
                            +
                          </button>
                        </div>
                        <div style={{ display: "flex", gap: "4px", marginTop: "6px" }}>
                          {[60, 80, 100, 120, 150].map((scaleVal) => (
                            <button
                              key={scaleVal}
                              type="button"
                              onClick={() => update("letterheadLogoScale", scaleVal)}
                              style={{
                                flex: 1,
                                fontSize: "10px",
                                padding: "2px 0",
                                border: (shipment.letterheadLogoScale ?? 100) === scaleVal ? "1px solid #0284c7" : "1px solid #e2e8f0",
                                background: (shipment.letterheadLogoScale ?? 100) === scaleVal ? "#e0f2fe" : "#f8fafc",
                                color: (shipment.letterheadLogoScale ?? 100) === scaleVal ? "#0369a1" : "#475569",
                                borderRadius: "4px",
                                fontWeight: (shipment.letterheadLogoScale ?? 100) === scaleVal ? 700 : 500,
                                cursor: "pointer",
                              }}
                            >
                              {scaleVal}%
                            </button>
                          ))}
                        </div>
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
                label="Alamat Cabang Bank Eksportir"
                value={shipment.bankAddress || "Jl. Boulevard, Panakkukang, Makassar, South Sulawesi, Indonesia"}
                placeholder="Contoh: Jl. Boulevard, Panakkukang, Makassar"
                onChange={(value) => update("bankAddress", value)}
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
