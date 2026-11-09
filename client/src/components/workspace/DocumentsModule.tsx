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
  DEFAULT_INDICO_LOGO,
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
  RotateCcw,
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
import { extractLetterheadFromFile } from "@/lib/letterheadExtractor";
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
  applyAlignmentToSelection,
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
        } else if (key === "l") {
          e.preventDefault();
          if (applyAlignmentToSelection("left")) {
            toast.success("Rata kiri diterapkan pada teks/sel terpilih");
          }
        } else if (key === "e") {
          e.preventDefault();
          if (applyAlignmentToSelection("center")) {
            toast.success("Rata tengah diterapkan pada teks/sel terpilih");
          }
        } else if (key === "r") {
          e.preventDefault();
          if (applyAlignmentToSelection("right")) {
            toast.success("Rata kanan diterapkan pada teks/sel terpilih");
          }
        } else if (key === "j") {
          e.preventDefault();
          if (applyAlignmentToSelection("justify")) {
            toast.success("Rata justify diterapkan pada teks/sel terpilih");
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
    // State and handlers for Word-style Table Cell Blocking & Merging
    let isCellSelecting = false;
    let selectStartCell: HTMLTableCellElement | null = null;
    let selectStartTable: HTMLTableElement | null = null;

    const clearCellSelection = () => {
      paperEl.querySelectorAll("td.table-cell-selected, th.table-cell-selected").forEach((el) => {
        el.classList.remove("table-cell-selected");
      });
      const pill = document.querySelector(".floating-merge-pill");
      if (pill) pill.remove();
    };

    const updateFloatingMergePill = () => {
      const selected = Array.from(
        paperEl.querySelectorAll("td.table-cell-selected, th.table-cell-selected")
      ) as HTMLTableCellElement[];
      let pill = document.querySelector(".floating-merge-pill") as HTMLElement | null;
      if (selected.length < 2) {
        if (pill) pill.remove();
        return;
      }
      if (!pill) {
        pill = document.createElement("div");
        pill.className = "floating-merge-pill";
        document.body.appendChild(pill);
      }
      const lastCell = selected[selected.length - 1];
      const rect = lastCell.getBoundingClientRect();
      pill.style.position = "absolute";
      pill.style.zIndex = "9999";
      pill.style.top = `${Math.max(10, rect.top + window.scrollY - 36)}px`;
      pill.style.left = `${rect.left + window.scrollX}px`;
      pill.innerHTML = `
        <span style="display:flex;align-items:center;gap:4px;">🔀 <b>${selected.length} Sel Terpilih</b></span>
        <button type="button" class="btn-merge-action" style="background:#0284c7;color:#fff;border:none;padding:2px 8px;border-radius:4px;font-weight:700;cursor:pointer;">Gabung Sel</button>
        <button type="button" class="btn-merge-cancel" style="background:transparent;color:#94a3b8;border:none;padding:2px 6px;cursor:pointer;">✕</button>
      `;
      pill.querySelector(".btn-merge-action")?.addEventListener("mousedown", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        mergeSelectedCells();
      });
      pill.querySelector(".btn-merge-cancel")?.addEventListener("mousedown", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        clearCellSelection();
      });
    };

    const selectCellsBetween = (startCell: HTMLTableCellElement, endCell: HTMLTableCellElement) => {
      const table = startCell.closest("table");
      if (!table || table !== endCell.closest("table")) return;

      const rows = Array.from(table.querySelectorAll("tr")) as HTMLTableRowElement[];
      const r1 = rows.indexOf(startCell.closest("tr") as HTMLTableRowElement);
      const r2 = rows.indexOf(endCell.closest("tr") as HTMLTableRowElement);
      if (r1 === -1 || r2 === -1) return;

      const minR = Math.min(r1, r2);
      const maxR = Math.max(r1, r2);

      const c1 = Array.from(startCell.parentElement?.children || []).indexOf(startCell);
      const c2 = Array.from(endCell.parentElement?.children || []).indexOf(endCell);
      const minC = Math.min(c1, c2);
      const maxC = Math.max(c1, c2);

      paperEl.querySelectorAll("td.table-cell-selected, th.table-cell-selected").forEach((el) => {
        el.classList.remove("table-cell-selected");
      });

      for (let r = minR; r <= maxR; r++) {
        const rowCells = Array.from(rows[r].children) as HTMLTableCellElement[];
        for (let c = minC; c <= maxC; c++) {
          if (rowCells[c]) {
            rowCells[c].classList.add("table-cell-selected");
          }
        }
      }
    };

    const mergeSelectedCells = () => {
      const blockedCells = Array.from(
        paperEl.querySelectorAll("td.table-cell-selected, th.table-cell-selected, td.active-cell, th.active-cell")
      ) as HTMLTableCellElement[];
      const uniqueSelected = Array.from(new Set(blockedCells));

      if (uniqueSelected.length >= 2) {
        const rowGroups = new Map<HTMLTableRowElement, HTMLTableCellElement[]>();
        uniqueSelected.forEach((c) => {
          const tr = c.closest("tr");
          if (tr) {
            if (!rowGroups.has(tr)) rowGroups.set(tr, []);
            rowGroups.get(tr)!.push(c);
          }
        });

        let totalMerged = 0;
        let firstBaseCell: HTMLTableCellElement | null = null;

        rowGroups.forEach((cellsInRow, tr) => {
          if (cellsInRow.length >= 2) {
            const allTrCells = Array.from(tr.children) as HTMLTableCellElement[];
            cellsInRow.sort((a, b) => allTrCells.indexOf(a) - allTrCells.indexOf(b));

            const baseCell = cellsInRow[0];
            if (!firstBaseCell) firstBaseCell = baseCell;

            for (let i = 1; i < cellsInRow.length; i++) {
              const nextCell = cellsInRow[i];
              baseCell.colSpan = (baseCell.colSpan || 1) + (nextCell.colSpan || 1);
              if (nextCell.innerText.trim()) {
                baseCell.innerHTML = baseCell.innerHTML.trim()
                  ? `${baseCell.innerHTML} ${nextCell.innerHTML}`
                  : nextCell.innerHTML;
              }
              nextCell.remove();
              totalMerged++;
            }
          }
        });

        clearCellSelection();
        const finalBase = firstBaseCell as HTMLTableCellElement | null;
        if (finalBase) {
          finalBase.classList.add("active-cell");
          (window as any).__eksporflow_active_cell = finalBase;
        }
        toast.success(`🎉 Berhasil menggabungkan ${totalMerged + 1} sel tabel! (Colspan: ${finalBase?.colSpan || 1})`);
        return;
      }

      // Single active cell fallback: merge with next or previous sibling
      const activeCell =
        ((window as any).__eksporflow_active_cell as HTMLTableCellElement | null) ||
        (paperEl.querySelector("td.active-cell, th.active-cell") as HTMLTableCellElement | null);
      if (activeCell) {
        const next =
          (activeCell.nextElementSibling as HTMLTableCellElement | null) ||
          (activeCell.previousElementSibling as HTMLTableCellElement | null);
        if (next) {
          const targetBase = activeCell.nextElementSibling ? activeCell : next;
          const toRemove = activeCell.nextElementSibling ? next : activeCell;
          targetBase.colSpan = (targetBase.colSpan || 1) + (toRemove.colSpan || 1);
          if (toRemove.innerText.trim()) {
            targetBase.innerHTML = targetBase.innerHTML.trim()
              ? `${targetBase.innerHTML} ${toRemove.innerHTML}`
              : toRemove.innerHTML;
          }
          toRemove.remove();
          clearCellSelection();
          targetBase.classList.add("active-cell");
          (window as any).__eksporflow_active_cell = targetBase;
          toast.success(`🎉 Sel berhasil digabungkan (Colspan: ${targetBase.colSpan})!`);
          return;
        }
      }
      toast.info("Klik atau blok sel di tabel yang ingin digabung terlebih dahulu.");
    };

    (window as any).__eksporflow_merge_cells = mergeSelectedCells;

    const handleCellMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const box = target.closest(
        ".doc-title-bar, .doc-box, .contract-party-card, .doc-terms-panel, .doc-bank-card, .unlk-cell, .unlk-total-bar"
      ) as HTMLElement | null;
      paperEl.querySelectorAll(".active-doc-box").forEach((el) => {
        if (el !== box) el.classList.remove("active-doc-box");
      });
      if (box) {
        box.classList.add("active-doc-box");
        (window as any).__eksporflow_active_cell = box;
      }

      const cell = target.closest("td, th") as HTMLTableCellElement | null;
      if (!cell) {
        clearCellSelection();
        if (box && box.closest(".unlk-trade-form")) {
          window.dispatchEvent(
            new CustomEvent("eksporflow:table-focus", {
              detail: { hasTable: true, table: box.closest(".unlk-trade-form"), cell: box },
            })
          );
        }
        return;
      }

      const currentTable = cell.closest("table");
      if (!currentTable) return;

      (window as any).__eksporflow_active_cell = cell;
      (window as any).__eksporflow_active_table = currentTable;
      window.dispatchEvent(
        new CustomEvent("eksporflow:table-focus", {
          detail: { hasTable: true, table: currentTable, cell },
        })
      );

      if (e.shiftKey && selectStartCell && selectStartCell.closest("table") === currentTable) {
        e.preventDefault();
        selectCellsBetween(selectStartCell, cell);
        updateFloatingMergePill();
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        cell.classList.toggle("table-cell-selected");
        updateFloatingMergePill();
        return;
      }

      // Normal click: start fresh selection
      paperEl.querySelectorAll("table.active-table").forEach((el) => el.classList.remove("active-table"));
      currentTable.classList.add("active-table");
      paperEl.querySelectorAll("td.active-cell, th.active-cell").forEach((el) => el.classList.remove("active-cell"));
      cell.classList.add("active-cell");
      cell.classList.add("table-cell-selected");

      selectStartCell = cell;
      selectStartTable = currentTable;
      isCellSelecting = true;
    };

    const handleCellMouseOver = (e: MouseEvent) => {
      if (!isCellSelecting || !selectStartCell || !selectStartTable) return;
      const target = e.target as HTMLElement;
      const cell = target.closest("td, th") as HTMLTableCellElement | null;
      if (!cell || cell.closest("table") !== selectStartTable) return;

      window.getSelection()?.removeAllRanges();
      selectCellsBetween(selectStartCell, cell);
      updateFloatingMergePill();
    };

    const handleDocumentMouseUp = () => {
      if (isCellSelecting) {
        isCellSelecting = false;
        updateFloatingMergePill();
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
    (paperEl as HTMLElement).addEventListener("mousedown", handleCellMouseDown as EventListener);
    (paperEl as HTMLElement).addEventListener("mousemove", handleCellMouseOver as EventListener);
    document.addEventListener("mouseup", handleDocumentMouseUp);

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
      (paperEl as HTMLElement).removeEventListener("mousedown", handleCellMouseDown as EventListener);
      (paperEl as HTMLElement).removeEventListener("mousemove", handleCellMouseOver as EventListener);
      document.removeEventListener("mouseup", handleDocumentMouseUp);
      document.removeEventListener("keydown", handleKeyDown);
      const pill = document.querySelector(".floating-merge-pill");
      if (pill) pill.remove();
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

  const handleLetterheadImage = async (file?: File) => {
    if (!file) return;
    const toastId = toast.loading(`Mengekstrak kop surat & footer dari ${file.name}...`);
    try {
      const res = await extractLetterheadFromFile(file);
      if (res.bannerImage) {
        update("letterheadBannerImage", res.bannerImage);
        update("letterheadMode", "banner");
      }
      if (res.footerImage) {
        update("letterheadFooterImage", res.footerImage);
        update("letterheadFooterEnabled", true);
      }
      if (res.fullPageImage) {
        update("letterheadFullPageBg", res.fullPageImage);
      }
      const chosenLogo = res.logoImage || res.bannerImage;
      if (chosenLogo) {
        update("letterheadImage", chosenLogo);
      }
      if (res.companyName) {
        update("exporter", res.companyName);
        update("letterheadText", res.companyName);
      }
      if (res.address) {
        update("letterheadText", res.address);
      }
      if (res.contact) {
        update("exporterContact", res.contact);
      }
      if (res.footerText) {
        update("docFooterText", res.footerText);
      }
      toast.success(`Kop surat & footer berhasil diekstrak dari ${file.name}!`, {
        id: toastId,
        description: res.footerImage
          ? "Kop surat atas & footer grafis bawah berhasil dipasang otomatis."
          : "Identitas perusahaan & kop surat resmi berhasil dipasang.",
      });
    } catch (err) {
      toast.error(`Gagal memproses berkas ${file.name}`, {
        id: toastId,
        description: err instanceof Error ? err.message : "Format berkas tidak didukung.",
      });
    }
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
            margin: 6mm 8mm 5mm 8mm;
          }
          .paper-document {
            --doc-font-size: ${Math.min(10.2, Number(((shipment.docEditorFontSize || 11) * 0.91).toFixed(1)))}pt !important;
            font-size: ${Math.min(10.2, Number(((shipment.docEditorFontSize || 11) * 0.91).toFixed(1)))}pt !important;
          }
          .paper-document table.unlk-items-table thead th:last-child,
          .paper-document table.unlk-items-table tbody td:last-child,
          .paper-document table.unlk-items-table tfoot td:last-child,
          .paper-document table.unlk-items-table tbody tr.unlk-subtotal-row td:last-child,
          .paper-document table.unlk-items-table tfoot tr.unlk-subtotal-row td:last-child,
          .unlk-total-bar {
            border-right: var(--unlk-outer-width, 1.25px) solid var(--unlk-outer-color, #475569) !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .paper-document table.unlk-items-table thead th:first-child,
          .paper-document table.unlk-items-table tbody td:first-child,
          .paper-document table.unlk-items-table tfoot td:first-child,
          .paper-document table.unlk-items-table tbody tr.unlk-subtotal-row td:first-child,
          .paper-document table.unlk-items-table tfoot tr.unlk-subtotal-row td:first-child {
            border-left: var(--unlk-outer-width, 1.25px) solid var(--unlk-outer-color, #475569) !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
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
            textAlign: "left",
            paddingTop: `${docMargins.top}mm`,
            paddingBottom: `${docMargins.bottom}mm`,
            paddingLeft: `${docMargins.left}mm`,
            paddingRight: `${docMargins.right}mm`,
          }}
          className={`paper-document paper-${shipment.paperSize.toLowerCase()} paper-${shipment.documentOrientation.toLowerCase()} paper-template-${shipment.documentTemplate.toLowerCase().replace(" ", "-")} doc-type-${selectedDocument.toLowerCase().replace(/\s+/g, "-")} ${selectedDocument === "Sales Contract" ? `doc-contract-mode-${effectiveContractLayout === "2-page" ? "2page" : "1page"}` : ""} ${isEditMode ? "word-editable-mode" : ""}`}
        >
          {/* Full Page Stationery Background (if active) */}
          {shipment.letterheadFullPageBg && shipment.letterheadFullPageBgEnabled && (
            <div
              className="doc-letterhead-full-page-bg pointer-events-none select-none absolute inset-0 z-0 bg-cover bg-top bg-no-repeat"
              style={{
                backgroundImage: `url(${shipment.letterheadFullPageBg})`,
                opacity: (shipment.letterheadWatermarkOpacity ?? 12) / 100,
              }}
            />
          )}

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
              update={trackedUpdate}
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
              update={trackedUpdate}
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
              netWeightKgs={netWeightKgs}
              grossWeightKgs={grossWeightKgs}
              netWeightMT={netWeightMT}
              unitPricePerMT={unitPricePerMT}
              totalAmount={totalAmount}
              amountInWords={amountInWords}
              isId={isId}
              onOpenSignatureModal={handleOpenSignatureModal}
              update={trackedUpdate}
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
              update={trackedUpdate}
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
              update={trackedUpdate}
            />
          )}

          {/* Official Letterhead Footer / Kop Surat Bawah Grafis & Disclaimer */}
          <OfficialFooter
            shipment={shipment}
            isEditMode={isEditMode}
            update={trackedUpdate}
          />
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
  const [dragScale, setDragScale] = useState<number | null>(null);
  const [dragShift, setDragShift] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragMoveOffset, setDragMoveOffset] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const quickFileInputRef = useRef<HTMLInputElement | null>(null);

  const effectiveLogoImage =
    shipment.letterheadImage ||
    (exporterName.toLowerCase().includes("indico") ? DEFAULT_INDICO_LOGO : "");

  const rawScale = dragScale !== null ? dragScale : (shipment.letterheadLogoScale ?? 100);
  const activeScale = isNaN(rawScale) || rawScale < 30 ? 100 : Math.min(300, rawScale);
  const baseLogoHeight = 68;
  const scaledHeight = Math.max(34, Math.round(baseLogoHeight * (activeScale / 100)));

  const wrapMode = shipment.letterheadLogoWrap || "inline";
  const alignMode = shipment.letterheadLogoAlign || "left";
  const posPreset = shipment.letterheadLogoPositionPreset || "inline";
  const logoOpacity = (shipment.letterheadLogoOpacity ?? 100) / 100;
  const logoRotate = shipment.letterheadLogoRotate || 0;
  const flipH = shipment.letterheadLogoFlipH ? -1 : 1;
  const flipV = shipment.letterheadLogoFlipV ? -1 : 1;
  const logoBorder = shipment.letterheadLogoBorder || "none";
  const logoShadow = shipment.letterheadLogoShadow ?? false;

  const letterheadMode = (shipment.letterheadMode as string) || "standard";
  const bannerHeight = shipment.letterheadBannerHeight ?? 110;
  const lineSpacing = shipment.letterheadSpacing !== undefined ? shipment.letterheadSpacing : 1;
  const kopLineHeight = lineSpacing === 0 ? 1.05 : Number((1.06 + lineSpacing * 0.04).toFixed(2));
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

  const rawX = dragMoveOffset ? dragMoveOffset.x : (shipment.letterheadLogoX || 0);
  const rawY = dragMoveOffset ? dragMoveOffset.y : (shipment.letterheadLogoY || 0);
  const currentX = Math.max(-10, Math.min(260, isNaN(rawX) ? 0 : rawX));
  const currentY = Math.max(-10, Math.min(80, isNaN(rawY) ? 0 : rawY));

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
        finalX = Math.max(-10, Math.min(260, startLogoX + dx));
        finalY = Math.max(-10, Math.min(80, startLogoY + dy));
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
      latestShiftX = Math.max(-10 - startLogoX, Math.min(260 - startLogoX, Math.round(sx)));
      latestShiftY = Math.max(-10 - startLogoY, Math.min(80 - startLogoY, Math.round(sy)));
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
        update("letterheadLogoX", Math.max(-10, Math.min(260, startLogoX + latestShiftX)));
        update("letterheadLogoY", Math.max(-10, Math.min(80, startLogoY + latestShiftY)));
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const isLogoCentered =
    layoutMode === "center" && (!shipment.letterheadImage || shipment.letterheadLogoAlign === "center");

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
    marginTop: `${Math.max(1, dividerGap)}px`,
    marginBottom: "4px",
    boxSizing: "content-box",
    width: "100%",
  };
  if (dividerStyle === "none") {
    dividerLineStyles.display = "none";
  } else if (dividerStyle === "double") {
    dividerLineStyles.borderTop = `2px solid ${dividerColor}`;
    dividerLineStyles.borderBottom = `0.75px solid ${dividerColor}`;
    dividerLineStyles.height = "2px";
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
      className={`paper-letterhead-wrap group/kop relative ${letterheadMode === "hidden" ? "letterhead-hidden" : ""}`}
      style={{
        paddingTop: letterheadMode === "hidden" ? 0 : "4px",
        marginBottom: letterheadMode === "hidden" ? (isEditMode ? "6px" : "0px") : `${Math.max(10, dividerGap + 6)}px`,
        ["--logo-scale" as any]: `${activeScale / 100}`,
        ["--kop-line-height" as any]: `${kopLineHeight}`,
        ["--kop-line-spacing" as any]: `${lineSpacing}px`,
      }}
    >
      {/* Hidden file input for Upload Logo / Letterhead (Universal: PDF, Word, Excel, CSV, Images) */}
      <input
        ref={quickFileInputRef}
        type="file"
        accept="image/*,application/pdf,.pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.csv,text/csv"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && onLetterheadImage) {
            onLetterheadImage(file);
          }
          e.target.value = "";
        }}
      />

      {/* MODE 0: HIDDEN INCODOCS MODE (Logo & Identitas menyatu di dalam kotak Seller) */}
      {letterheadMode === "hidden" ? (
        isEditMode ? (
          <div className="no-print py-1.5 px-3 mb-2 bg-blue-50 border border-blue-200 rounded-md text-[11px] text-blue-900 flex items-center justify-between">
            <span className="font-semibold">
              Mode IncoDocs Aktif: Kop surat atas disembunyikan. Logo dan identitas eksportir tampil terintegrasi di dalam kotak Seller.
            </span>
            <button
              type="button"
              onClick={() => update && update("letterheadMode", "standard")}
              className="text-blue-700 hover:text-blue-900 font-bold underline ml-2"
            >
              Tampilkan Kop Atas
            </button>
          </div>
        ) : null
      ) : letterheadMode === "banner" && shipment.letterheadBannerImage ? (
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
              flexDirection:
                layoutMode === "center" && (!shipment.letterheadImage || shipment.letterheadLogoAlign === "center")
                  ? "column"
                  : "row",
              alignItems: "center",
              justifyContent:
                layoutMode === "split"
                  ? "space-between"
                  : layoutMode === "center" && (!shipment.letterheadImage || shipment.letterheadLogoAlign === "center")
                  ? "center"
                  : "flex-start",
              textAlign:
                layoutMode === "center" && (!shipment.letterheadImage || shipment.letterheadLogoAlign === "center")
                  ? "center"
                  : "left",
              gap:
                layoutMode === "center" && (!shipment.letterheadImage || shipment.letterheadLogoAlign === "center")
                  ? "6px"
                  : "14px",
              width: "100%",
            }}
          >
            {effectiveLogoImage ? (
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
                    update("letterheadLogoWrap", "inline");
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
                  src={effectiveLogoImage}
                  alt="Logo Resmi Perusahaan"
                  className="letterhead-logo"
                  draggable={false}
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== DEFAULT_INDICO_LOGO) {
                      target.src = DEFAULT_INDICO_LOGO;
                      if (update) update("letterheadImage", DEFAULT_INDICO_LOGO);
                    }
                  }}
                  style={{
                    height: `${scaledHeight}px`,
                    minHeight: "36px",
                    minWidth: "36px",
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

                    {/* Floating Word Reset Button */}
                    <button
                      type="button"
                      className="word-logo-reset-btn no-print"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (update) {
                          update("letterheadLogoScale", 100);
                          update("letterheadLogoX", 0);
                          update("letterheadLogoY", 0);
                          update("letterheadLogoWrap", "inline");
                          toast.success("Ukuran & posisi logo di-reset ke standar 100%");
                        }
                      }}
                      title="Reset Posisi & Ukuran Logo ke Standar (100%)"
                      style={{
                        position: "absolute",
                        top: "-14px",
                        right: "-84px",
                        width: "24px",
                        height: "24px",
                        background: "#ffffff",
                        border: "1px solid #cbd5e1",
                        borderRadius: "4px",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.18)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        zIndex: 40,
                        color: "#475569",
                      }}
                    >
                      <RotateCcw size={12} />
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
                style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: "5px" }}
              >
                <div
                  onClick={() => quickFileInputRef.current?.click()}
                  title="Klik untuk memilih file logo atau dokumen kop surat (PDF, Word, Excel, CSV, PNG, JPG)"
                  role="button"
                  tabIndex={0}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "3px 8px",
                    background: "#f8fafc",
                    border: "1px dashed #cbd5e1",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "10px",
                    fontWeight: 600,
                    color: "#475569",
                  }}
                >
                  <Upload size={13} className="text-slate-500" />
                  <span>+ Upload Logo</span>
                </div>
                {update && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      update("letterheadImage", DEFAULT_INDICO_LOGO);
                      update("letterheadLogoScale", 100);
                      update("letterheadLogoX", 0);
                      update("letterheadLogoY", 0);
                      update("letterheadLogoWrap", "inline");
                      toast.success("Logo Indico Export Indonesia berhasil dipasang!");
                    }}
                    style={{
                      padding: "2px 6px",
                      fontSize: "9.5px",
                      fontWeight: 600,
                      borderRadius: "3px",
                      border: "1px solid #bbf7d0",
                      background: "#f0fdf4",
                      color: "#15803d",
                      cursor: "pointer",
                    }}
                    title="Gunakan Logo Resmi Indico Export Indonesia"
                  >
                    🌿 Logo Indico
                  </button>
                )}
              </div>
            ) : null}

            {effectiveLogoImage && !isLogoCentered && (
              <div
                className="letterhead-logo-divider"
                contentEditable={false}
                style={{
                  width: "1.5px",
                  height: layoutMode === "split" ? "56px" : "62px",
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
                  gap: "16px",
                }}
              >
                {/* Left Identity Column */}
                <div style={{ textAlign: "left", flex: "1 1 auto", minWidth: 0, paddingRight: "4px" }}>
                  <h1
                    className="company-name"
                    style={{
                      fontSize: "13.5pt",
                      fontWeight: 800,
                      letterSpacing: "0.03em",
                      color: dividerColor,
                      margin: `0 0 ${Math.max(2, lineSpacing)}px 0`,
                      lineHeight: 1.15,
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
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
                      letterSpacing: "0.05em",
                      color: "#334155",
                      margin: 0,
                      lineHeight: 1.25,
                      whiteSpace: "normal",
                      wordBreak: "break-word",
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
                    paddingLeft: "12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: `${Math.max(0, lineSpacing)}px`,
                    textAlign: "left",
                    flex: "0 0 auto",
                    maxWidth: "285px",
                    minWidth: "220px",
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
                      wordBreak: "break-word",
                    }}
                    onBlur={(e) => {
                      const text = e.currentTarget.innerText.trim();
                      if (update && text) {
                        update("letterheadText", `Head Office: ${text}`);
                      }
                    }}
                  >
                    <strong style={{ fontWeight: 700, color: dividerColor }}>
                      {addressLabel}:{" "}
                    </strong>
                    {addressBody}
                  </p>

                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 8px" }}>
                    <span style={{ whiteSpace: "nowrap" }}>
                      <strong style={{ fontSize: "8.2pt", fontWeight: 700, color: dividerColor }}>
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
                    <span style={{ color: "#94a3b8", fontSize: "8pt" }}>|</span>
                    <span style={{ whiteSpace: "nowrap" }}>
                      <strong style={{ fontSize: "8.2pt", fontWeight: 700, color: dividerColor }}>
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
                    <strong style={{ fontSize: "8.2pt", fontWeight: 700, color: dividerColor }}>
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
            ) : isLogoCentered ? (
              /* MODE CENTER: Classic Diplomatic / Chamber of Commerce Symmetrical Header (only when logo is centered on top or no logo) */
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
                  <strong style={{ fontSize: "8.6pt", fontWeight: 700, color: dividerColor }}>
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
                    <strong style={{ fontSize: "8.6pt", fontWeight: 700, color: dividerColor }}>
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
                  <span style={{ color: "#94a3b8", fontSize: "8.5pt" }}>|</span>
                  <span>
                    <strong style={{ fontSize: "8.6pt", fontWeight: 700, color: dividerColor }}>
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
                  <span style={{ color: "#94a3b8", fontSize: "8.5pt" }}>|</span>
                  <span>
                    <strong style={{ fontSize: "8.6pt", fontWeight: 700, color: dividerColor }}>
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
                    fontSize: "17pt",
                    fontWeight: 800,
                    letterSpacing: "0.035em",
                    color: dividerColor,
                    margin: 0,
                    lineHeight: 1.12,
                    whiteSpace: "normal",
                    wordBreak: "break-word",
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
                    letterSpacing: "0.06em",
                    color: "#334155",
                    margin: "2px 0 0 0",
                    lineHeight: 1.25,
                    whiteSpace: "normal",
                    wordBreak: "break-word",
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
                    height: lineSpacing === 0 ? "0px" : "1px",
                    width: "100%",
                    background: lineSpacing === 0 ? "transparent" : "#cbd5e1",
                    margin: `${Math.round(lineSpacing * 0.4)}px 0`,
                  }}
                />

                {/* Row 3 & Row 4: Clean Executive Address & Contact Details */}
                <div
                  className="company-details-wrap"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: `${Math.max(0, lineSpacing)}px`,
                  }}
                >
                  {/* Row 3: Head Office Address */}
                  <div
                    className="company-details"
                    style={{
                      fontSize: "8.6pt",
                      lineHeight: lineSpacing === 0 ? 1.05 : 1.16,
                      color: "#1e293b",
                      fontWeight: 500,
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      margin: 0,
                    }}
                    onBlur={(e) => {
                      const text = e.currentTarget.innerText.trim();
                      if (update && text) {
                        update("letterheadText", text);
                      }
                    }}
                  >
                    <strong style={{ fontSize: "8.6pt", fontWeight: 700, color: dividerColor }}>
                      {addressLabel}:{" "}
                    </strong>
                    <span>{addressBody}</span>
                  </div>

                  {/* Row 4: Tel | Email | Web */}
                  <div
                    className="company-contact"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "0 8px",
                      lineHeight: lineSpacing === 0 ? 1.05 : 1.16,
                      fontSize: "8.6pt",
                      color: "#1e293b",
                      margin: 0,
                    }}
                  >
                    <span>
                      <strong style={{ fontSize: "8.6pt", fontWeight: 700, color: dividerColor }}>
                        Tel:{" "}
                      </strong>
                      <span onBlur={(e) => updateContactPart("tel", e.currentTarget.innerText)}>
                        {telVal}
                      </span>
                    </span>

                    <span style={{ color: "#94a3b8", fontSize: "8.6pt", margin: "0 2px" }}>
                      •
                    </span>

                    <span>
                      <strong style={{ fontSize: "8.6pt", fontWeight: 700, color: dividerColor }}>
                        Email:{" "}
                      </strong>
                      <span onBlur={(e) => updateContactPart("email", e.currentTarget.innerText)}>
                        {emailVal}
                      </span>
                    </span>

                    <span style={{ color: "#94a3b8", fontSize: "8.6pt", margin: "0 2px" }}>
                      •
                    </span>

                    <span>
                      <strong style={{ fontSize: "8.6pt", fontWeight: 700, color: dividerColor }}>
                        Web:{" "}
                      </strong>
                      <span onBlur={(e) => updateContactPart("web", e.currentTarget.innerText)}>
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

      {letterheadMode !== "hidden" && (
        <div className="letterhead-divider-line" style={dividerLineStyles} />
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
// Official Letterhead Footer Component (Kop Surat Bawah Grafis & Legal Disclaimer)
// --------------------------------------------------------------------------
function OfficialFooter({
  shipment,
  isEditMode = false,
  update,
}: {
  shipment: Shipment;
  isEditMode?: boolean;
  update?: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void;
}) {
  const footerInputRef = useRef<HTMLInputElement | null>(null);
  const footerImage = shipment.letterheadFooterImage;
  const footerEnabled = shipment.letterheadFooterEnabled !== false;
  const footerHeight = shipment.letterheadFooterHeight ?? 65;
  const showLegalText = shipment.docFooterEnabled && shipment.docFooterText;

  const handleUploadFooter = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (update) {
        update("letterheadFooterImage", String(reader.result));
        update("letterheadFooterEnabled", true);
        toast.success("Kop surat bawah (footer grafis) berhasil diperbarui!");
      }
    };
    reader.readAsDataURL(file);
  };

  if (!footerImage && !showLegalText) return null;

  return (
    <div
      className="official-document-footer mt-auto pt-6 break-inside-avoid print:break-inside-avoid relative z-10"
      contentEditable={false}
      style={{ userSelect: "none" }}
    >
      {/* Graphic Letterhead Footer (e.g. Modern Teal Geometric or Corporate Branding) */}
      {footerImage && footerEnabled && (
        <div className="relative group/footer-img mb-2">
          <img
            src={footerImage}
            alt="Kop Surat Bawah Resmi (Footer)"
            style={{
              width: "100%",
              height: `${footerHeight}px`,
              objectFit: "contain",
              objectPosition: "bottom center",
              display: "block",
            }}
          />
          {isEditMode && (
            <div className="no-print opacity-0 group-hover/footer-img:opacity-100 transition-opacity flex items-center justify-end gap-2 mt-1 py-1 px-2 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-600">
              <span className="font-semibold text-slate-700">Footer Grafis Bawah:</span>
              <span>Tinggi: {footerHeight}px</span>
              <input
                type="range"
                min="35"
                max="140"
                value={footerHeight}
                onChange={(e) => update && update("letterheadFooterHeight", Number(e.target.value))}
                style={{ width: "80px", accentColor: "#0d9488" }}
              />
              <button
                type="button"
                onClick={() => footerInputRef.current?.click()}
                className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border text-slate-700 font-medium"
              >
                Ganti Gambar
              </button>
              <button
                type="button"
                onClick={() => update && update("letterheadFooterEnabled", false)}
                className="px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 font-medium"
              >
                Sembunyikan
              </button>
              <button
                type="button"
                onClick={() => {
                  if (update) {
                    update("letterheadFooterImage", "");
                    update("letterheadFooterEnabled", false);
                  }
                }}
                className="px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-medium"
              >
                Hapus
              </button>
            </div>
          )}
        </div>
      )}

      {/* Hidden file input for quick footer image upload */}
      <input
        ref={footerInputRef}
        type="file"
        accept="image/*,.pdf,.docx"
        className="hidden"
        onChange={handleUploadFooter}
      />

      {/* Legal Confidential Notice & Disclaimer */}
      {showLegalText && (
        <div className="doc-footer-legal-bar text-[9px] text-slate-400 font-medium uppercase tracking-wider text-center py-1 border-t border-slate-200/60 flex items-center justify-between">
          <span className="flex-1 text-center">{shipment.docFooterText}</span>
          {shipment.docShowPageNumber && (
            <span className="text-slate-400 font-mono text-[9px] shrink-0 pl-2">Hal. 1/1</span>
          )}
        </div>
      )}
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
// INTERACTIVE DOCUMENT TITLE BANNER (RESIZABLE BOX & TABLE STYLE SELECTOR)
// --------------------------------------------------------------------------
function DocTitleBanner({ title }: { title: string }) {
  const barRef = useRef<HTMLDivElement>(null);
  const h2Ref = useRef<HTMLHeadingElement>(null);
  const [boxPadY, setBoxPadY] = useState<number>(() => {
    const saved = localStorage.getItem("eksporflow_title_box_pady");
    return saved ? Math.max(1, Math.min(20, Number(saved))) : 4;
  });
  const [tableStyle, setTableStyle] = useState<string>(() => {
    return localStorage.getItem("eksporflow_unlk_table_style") || "unlk";
  });
  const [isDraggingHeight, setIsDraggingHeight] = useState(false);

  // Sync saved padding & table style on mount / document switch
  useEffect(() => {
    const bar = barRef.current;
    if (bar) {
      bar.style.setProperty("padding-top", `${boxPadY}px`, "important");
      bar.style.setProperty("padding-bottom", `${boxPadY}px`, "important");
    }
    const wrapper = bar?.closest(".unlk-doc-wrapper") || document.querySelector(".unlk-doc-wrapper");
    const form = wrapper?.querySelector(".unlk-trade-form") as HTMLElement | null;
    if (form) {
      form.classList.remove("unlk-style-unlk", "unlk-style-corporate", "unlk-style-soft", "unlk-style-minimal");
      form.classList.add(`unlk-style-${tableStyle}`);
    }
  }, [boxPadY, tableStyle, title]);

  const updateBoxHeight = (newPadY: number, notify = false) => {
    const clamped = Math.max(1, Math.min(20, Math.round(newPadY * 2) / 2));
    setBoxPadY(clamped);
    localStorage.setItem("eksporflow_title_box_pady", String(clamped));
    const bar = barRef.current;
    if (bar) {
      bar.style.setProperty("padding-top", `${clamped}px`, "important");
      bar.style.setProperty("padding-bottom", `${clamped}px`, "important");
    }
    if (notify) {
      toast.success(`Tinggi kotak judul diatur ke ${clamped}px`);
    }
  };

  useEffect(() => {
    const handleExtTableStyle = (e: any) => {
      if (e.detail?.styleKey) {
        setTableStyle(e.detail.styleKey);
      }
    };
    const handleExtBoxStyle = (e: any) => {
      if (e.detail) {
        applyTitleBoxStyle(e.detail.bg, e.detail.textColor, e.detail.border);
      }
    };
    const handleExtBoxHeight = (e: any) => {
      if (typeof e.detail?.height === "number") {
        updateBoxHeight(e.detail.height);
      }
    };
    const handleExtSelectText = () => {
      selectTitleText();
    };

    window.addEventListener("eksporflow:table-style-change", handleExtTableStyle);
    window.addEventListener("eksporflow:title-box-style", handleExtBoxStyle);
    window.addEventListener("eksporflow:title-box-height", handleExtBoxHeight);
    window.addEventListener("eksporflow:select-title-text", handleExtSelectText);

    return () => {
      window.removeEventListener("eksporflow:table-style-change", handleExtTableStyle);
      window.removeEventListener("eksporflow:title-box-style", handleExtBoxStyle);
      window.removeEventListener("eksporflow:title-box-height", handleExtBoxHeight);
      window.removeEventListener("eksporflow:select-title-text", handleExtSelectText);
    };
  }, []);

  const applyDocumentTableStyle = (styleKey: string, label: string) => {
    pushEditorHistory("table-style-change");
    setTableStyle(styleKey);
    localStorage.setItem("eksporflow_unlk_table_style", styleKey);
    document.querySelectorAll<HTMLElement>(".unlk-trade-form").forEach((form) => {
      form.classList.remove("unlk-style-unlk", "unlk-style-corporate", "unlk-style-soft", "unlk-style-minimal");
      form.classList.add(`unlk-style-${styleKey}`);
    });
    window.dispatchEvent(new CustomEvent("eksporflow:table-style-change", { detail: { styleKey } }));
    toast.success(`Jenis tabel diubah ke: ${label}`);
  };

  const handleStartDragHeight = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startY = e.clientY;
    const startPad = boxPadY;
    setIsDraggingHeight(true);

    const onMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const nextPad = Math.max(1, Math.min(20, Math.round((startPad + deltaY * 0.5) * 2) / 2));
      setBoxPadY(nextPad);
      localStorage.setItem("eksporflow_title_box_pady", String(nextPad));
      const bar = barRef.current;
      if (bar) {
        bar.style.setProperty("padding-top", `${nextPad}px`, "important");
        bar.style.setProperty("padding-bottom", `${nextPad}px`, "important");
      }
    };

    const onUp = () => {
      setIsDraggingHeight(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

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
    border: string,
    borderBottom?: string
  ) => {
    const bar = barRef.current;
    const h2 = h2Ref.current;
    if (!bar || !h2) return;
    pushEditorHistory("title-box-style");
    bar.style.setProperty("background", bg, "important");
    bar.style.setProperty("background-color", bg, "important");
    bar.style.setProperty("border", border, "important");
    if (borderBottom) {
      bar.style.setProperty("border-bottom", borderBottom, "important");
      bar.style.setProperty("border-radius", "0px", "important");
    } else {
      bar.style.setProperty("border-radius", "3px", "important");
    }
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
      style={{
        paddingTop: `${boxPadY}px`,
        paddingBottom: `${boxPadY}px`,
      }}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest(".titlebar-resize-handle")) return;
        if (target === barRef.current && h2Ref.current) {
          selectTitleText();
        }
      }}
    >
      <h2 ref={h2Ref}>{title}</h2>

      {/* Bottom Drag Handle to resize title box height directly */}
      <div
        className={`titlebar-resize-handle no-print opacity-0 group-hover/titlebar:opacity-100 ${isDraggingHeight ? "opacity-100" : ""} transition-opacity duration-150`}
        contentEditable={false}
        onMouseDown={handleStartDragHeight}
        title="Tarik ke atas / bawah untuk mengatur tinggi kotak judul"
        style={{
          position: "absolute",
          left: "50%",
          bottom: "-4px",
          transform: "translateX(-50%)",
          width: "52px",
          height: "7px",
          borderRadius: "999px",
          background: "#2563eb",
          border: "1.5px solid #ffffff",
          cursor: "ns-resize",
          zIndex: 26,
          boxShadow: "0 1px 4px rgba(15, 23, 42, 0.25)",
        }}
      />
    </div>
  );
}

// --------------------------------------------------------------------------
// IncoDocs / UNLK Compact Signature Box (Inside Right Footer Grid — Box 7)
// Microsoft Word Style interactive image box (8 resize handles, free drag move,
// floating pill options on selection, zero layout shift/expansion on document grid)
// --------------------------------------------------------------------------
function UnlkSignatureBox({
  shipment,
  exporterName = "PT. INDICO EXPORT INDONESIA",
  signatoryName = "Muhajirin Fatona",
  signatoryRole = "Export Director",
  onOpenSignatureModal,
  update,
}: {
  shipment?: Shipment;
  exporterName?: string;
  signatoryName?: string;
  signatoryRole?: string;
  onOpenSignatureModal?: (party?: "seller" | "buyer") => void;
  update?: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void;
}) {
  const hasSignature = !!shipment?.sellerSignatureImage;

  const sigHeight = shipment?.sellerSignatureHeight ?? 48;
  const sigAlign = shipment?.sellerSignatureAlign || "left";
  const sigX = shipment?.sellerSignatureX || 0;
  const sigY = shipment?.sellerSignatureY || 0;

  const [isSelected, setIsSelected] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const [dragMoveOffset, setDragMoveOffset] = useState<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Outside click & keyboard listener (Escape to deselect, Delete to remove)
  useEffect(() => {
    if (!isSelected) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsSelected(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsSelected(false);
      } else if ((e.key === "Delete" || e.key === "Backspace") && isSelected && update) {
        const activeTag = (document.activeElement?.tagName || "").toLowerCase();
        if (
          activeTag === "input" ||
          activeTag === "textarea" ||
          (document.activeElement as HTMLElement)?.isContentEditable
        ) {
          return;
        }
        e.preventDefault();
        update("sellerSignatureImage", "" as any);
        update("sellerSignatureDate", "" as any);
        setIsSelected(false);
        toast.success("Tanda tangan berhasil dihapus.");
      }
    };
    window.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSelected, update]);

  // Direct Drag Move across Document Canvas (similar to MS Word image repositioning)
  const startDragMove = (e: React.MouseEvent) => {
    if (!update) return;
    if ((e.target as HTMLElement).classList.contains("word-resize-handle")) return;
    if ((e.target as HTMLElement).closest(".word-sig-floating-pill, .no-drag")) return;
    e.preventDefault();
    e.stopPropagation();

    setIsSelected(true);
    setIsMoving(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const initX = sigX;
    const initY = sigY;
    let finalX = initX;
    let finalY = initY;
    let moved = false;

    const onMouseMove = (moveEv: MouseEvent) => {
      const dx = moveEv.clientX - startX;
      const dy = moveEv.clientY - startY;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        moved = true;
        finalX = Math.max(-180, Math.min(180, Math.round(initX + dx)));
        finalY = Math.max(-60, Math.min(60, Math.round(initY + dy)));
        setDragMoveOffset({ x: finalX, y: finalY });
      }
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      setIsMoving(false);
      setDragMoveOffset(null);
      if (moved) {
        update("sellerSignatureX", finalX);
        update("sellerSignatureY", finalY);
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  // 8 Resize Handles (Corner & Edge pulling identical to OfficialLetterhead logo resize)
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
    const startH = startRect.height;
    const initX = sigX;
    const initY = sigY;
    let latestH = sigHeight;
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

      const newH = Math.max(24, Math.min(130, Math.round(startH + deltaH)));
      const deltaHeight = newH - startH;
      const deltaWidth = deltaHeight * aspectRatio;

      let sx = 0;
      let sy = 0;
      if (handle === "nw" || handle === "w" || handle === "sw") {
        sx = -deltaWidth;
      }
      if (handle === "nw" || handle === "n" || handle === "ne") {
        sy = -deltaHeight;
      }

      latestH = newH;
      latestShiftX = Math.round(sx);
      latestShiftY = Math.round(sy);
      setDragHeight(newH);
      setDragMoveOffset({ x: initX + latestShiftX, y: initY + latestShiftY });
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      setIsDragging(false);
      setDragHeight(null);
      setDragMoveOffset(null);
      update("sellerSignatureHeight", latestH);
      if (latestShiftX !== 0 || latestShiftY !== 0) {
        update("sellerSignatureX", initX + latestShiftX);
        update("sellerSignatureY", initY + latestShiftY);
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("eksporflow_sig_height", String(latestH));
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const currentH = dragHeight ?? sigHeight;
  const currentX = dragMoveOffset !== null ? dragMoveOffset.x : sigX;
  const currentY = dragMoveOffset !== null ? dragMoveOffset.y : sigY;

  return (
    <div
      className="unlk-sig-zone"
      style={{
        width: "100%",
        position: "relative",
        minHeight: "44px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: sigAlign === "center" ? "center" : sigAlign === "right" ? "flex-end" : "flex-start",
        padding: "2px 0",
      }}
    >
      {hasSignature ? (
        <div
          ref={containerRef}
          className={`sig-interactive-wrap ${isSelected ? "word-image-selected" : ""}`}
          contentEditable={false}
          style={{
            display: "inline-flex",
            flexDirection: "column",
            alignItems: sigAlign === "center" ? "center" : sigAlign === "right" ? "flex-end" : "flex-start",
            position: "relative",
            transform: `translate(${currentX}px, ${currentY}px)`,
            outline: isSelected ? "1.5px solid #2563eb" : undefined,
            outlineOffset: "2px",
            cursor: isMoving ? "grabbing" : "grab",
            userSelect: "none",
            transition: isDragging || isMoving ? "none" : "transform 0.1s ease",
          }}
          onMouseDown={startDragMove}
          onClick={(e) => {
            e.stopPropagation();
            setIsSelected(true);
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            if (update) {
              update("sellerSignatureHeight", 48);
              update("sellerSignatureX", 0);
              update("sellerSignatureY", 0);
              update("sellerSignatureAlign", "left");
              toast.success("Ukuran & posisi tanda tangan di-reset ke standar");
            }
          }}
          title="Klik tanda tangan untuk memilih & mengatur ukuran (tarik titik sudut), atau geser posisi bebas (seperti di Microsoft Word)"
        >
          <img
            ref={imgRef}
            src={shipment.sellerSignatureImage}
            alt="Digital Signature"
            className="doc-rendered-signature"
            draggable={false}
            style={{
              height: `${currentH}px`,
              maxHeight: "140px",
              width: "auto",
              objectFit: "contain",
              display: "block",
              transition: isDragging || isMoving ? "none" : "height 0.12s ease",
              filter: isMoving ? "drop-shadow(0 4px 8px rgba(37, 99, 235, 0.35))" : undefined,
              pointerEvents: isDragging ? "none" : "auto",
            }}
          />

          <div className="sig-verify-badge no-print" style={{ fontSize: "8.5px", marginTop: "2px" }}>
            <span className="sig-verify-check">✓</span>
            <span>Verified ({shipment.sellerSignatureDate || "8 Nov 2026"})</span>
          </div>

          {/* Floating Word-style Action Pill (Zero document flow space, only visible when selected) */}
          {isSelected && (
            <div
              className="word-sig-floating-pill no-print"
              contentEditable={false}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "absolute",
                top: "-34px",
                left: sigAlign === "right" ? "auto" : "0",
                right: sigAlign === "right" ? "0" : "auto",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "3px 7px",
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: "6px",
                boxShadow: "0 4px 14px rgba(15, 23, 42, 0.16)",
                fontSize: "9px",
                zIndex: 45,
                whiteSpace: "nowrap",
              }}
            >
              {/* Align options */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (update) {
                      update("sellerSignatureAlign", "left");
                      update("sellerSignatureX", 0);
                    }
                  }}
                  style={{
                    padding: "1.5px 5px",
                    borderRadius: "3px",
                    border: sigAlign === "left" && sigX === 0 ? "1px solid #2563eb" : "1px solid #e2e8f0",
                    background: sigAlign === "left" && sigX === 0 ? "#eff6ff" : "#ffffff",
                    color: sigAlign === "left" && sigX === 0 ? "#1d4ed8" : "#475569",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                  title="Ratakan Kiri"
                >
                  Kiri
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (update) {
                      update("sellerSignatureAlign", "center");
                      update("sellerSignatureX", 0);
                    }
                  }}
                  style={{
                    padding: "1.5px 5px",
                    borderRadius: "3px",
                    border: sigAlign === "center" && sigX === 0 ? "1px solid #2563eb" : "1px solid #e2e8f0",
                    background: sigAlign === "center" && sigX === 0 ? "#eff6ff" : "#ffffff",
                    color: sigAlign === "center" && sigX === 0 ? "#1d4ed8" : "#475569",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                  title="Ratakan Tengah"
                >
                  Tengah
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (update) {
                      update("sellerSignatureAlign", "right");
                      update("sellerSignatureX", 0);
                    }
                  }}
                  style={{
                    padding: "1.5px 5px",
                    borderRadius: "3px",
                    border: sigAlign === "right" && sigX === 0 ? "1px solid #2563eb" : "1px solid #e2e8f0",
                    background: sigAlign === "right" && sigX === 0 ? "#eff6ff" : "#ffffff",
                    color: sigAlign === "right" && sigX === 0 ? "#1d4ed8" : "#475569",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                  title="Ratakan Kanan"
                >
                  Kanan
                </button>
              </div>

              <div style={{ width: "1px", height: "14px", background: "#cbd5e1", margin: "0 2px" }} />

              {/* Height adjustment */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const next = Math.max(24, currentH - 4);
                    if (update) update("sellerSignatureHeight", next);
                    if (typeof window !== "undefined") localStorage.setItem("eksporflow_sig_height", String(next));
                  }}
                  style={{
                    width: "16px",
                    height: "17px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    borderRadius: "3px",
                    cursor: "pointer",
                    fontWeight: 700,
                    color: "#334155",
                    padding: 0,
                  }}
                  title="Perkecil tinggi tanda tangan (-4px)"
                >
                  −
                </button>
                <span style={{ fontWeight: 700, color: "#0f172a", minWidth: "26px", textAlign: "center" }}>
                  {currentH}px
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const next = Math.min(130, currentH + 4);
                    if (update) update("sellerSignatureHeight", next);
                    if (typeof window !== "undefined") localStorage.setItem("eksporflow_sig_height", String(next));
                  }}
                  style={{
                    width: "16px",
                    height: "17px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    borderRadius: "3px",
                    cursor: "pointer",
                    fontWeight: 700,
                    color: "#334155",
                    padding: 0,
                  }}
                  title="Perbesar tinggi tanda tangan (+4px)"
                >
                  +
                </button>
              </div>

              <div style={{ width: "1px", height: "14px", background: "#cbd5e1", margin: "0 2px" }} />

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (update) {
                    update("sellerSignatureAlign", "left");
                    update("sellerSignatureX", 0);
                    update("sellerSignatureY", 0);
                    update("sellerSignatureHeight", 48);
                    toast.success("Ukuran & posisi tanda tangan di-reset ke standar");
                  }
                }}
                style={{
                  padding: "1.5px 5px",
                  borderRadius: "3px",
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                  color: "#64748b",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                title="Reset ke posisi & ukuran standar"
              >
                Reset
              </button>

              {onOpenSignatureModal && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenSignatureModal("seller");
                  }}
                  style={{
                    padding: "1.5px 6px",
                    borderRadius: "3px",
                    border: "1px solid #bfdbfe",
                    background: "#eff6ff",
                    color: "#1d4ed8",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                  title="Ganti tanda tangan"
                >
                  Ganti
                </button>
              )}

              {update && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    update("sellerSignatureImage", "" as any);
                    update("sellerSignatureDate", "" as any);
                    setIsSelected(false);
                    toast.success("Tanda tangan berhasil dihapus.");
                  }}
                  style={{
                    padding: "1.5px 5px",
                    borderRadius: "3px",
                    border: "1px solid #fecaca",
                    background: "#fef2f2",
                    color: "#dc2626",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                  title="Hapus tanda tangan"
                >
                  Hapus
                </button>
              )}
            </div>
          )}

          {/* 8 Resize Handles (NW, N, NE, E, SE, S, SW, W) */}
          {isSelected && (
            <>
              <div
                className="word-resize-handle no-print"
                style={{ top: "-5px", left: "-5px", cursor: "nwse-resize" }}
                onMouseDown={(e) => startDragHandle(e, "nw")}
                title="Tarik sudut kiri-atas"
              />
              <div
                className="word-resize-handle no-print"
                style={{ top: "-5px", left: "calc(50% - 4.5px)", cursor: "ns-resize" }}
                onMouseDown={(e) => startDragHandle(e, "n")}
                title="Tarik sisi atas"
              />
              <div
                className="word-resize-handle no-print"
                style={{ top: "-5px", right: "-5px", cursor: "nesw-resize" }}
                onMouseDown={(e) => startDragHandle(e, "ne")}
                title="Tarik sudut kanan-atas"
              />
              <div
                className="word-resize-handle no-print"
                style={{ top: "calc(50% - 4.5px)", right: "-5px", cursor: "ew-resize" }}
                onMouseDown={(e) => startDragHandle(e, "e")}
                title="Tarik sisi kanan"
              />
              <div
                className="word-resize-handle no-print"
                style={{ bottom: "-5px", right: "-5px", cursor: "nwse-resize" }}
                onMouseDown={(e) => startDragHandle(e, "se")}
                title="Tarik sudut kanan-bawah"
              />
              <div
                className="word-resize-handle no-print"
                style={{ bottom: "-5px", left: "calc(50% - 4.5px)", cursor: "ns-resize" }}
                onMouseDown={(e) => startDragHandle(e, "s")}
                title="Tarik sisi bawah"
              />
              <div
                className="word-resize-handle no-print"
                style={{ bottom: "-5px", left: "-5px", cursor: "nesw-resize" }}
                onMouseDown={(e) => startDragHandle(e, "sw")}
                title="Tarik sudut kiri-bawah"
              />
              <div
                className="word-resize-handle no-print"
                style={{ top: "calc(50% - 4.5px)", left: "-5px", cursor: "ew-resize" }}
                onMouseDown={(e) => startDragHandle(e, "w")}
                title="Tarik sisi kiri"
              />

              {isDragging && (
                <div
                  className="word-resize-tooltip no-print"
                  contentEditable={false}
                  style={{
                    position: "absolute",
                    bottom: "-24px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "rgba(15, 23, 42, 0.9)",
                    color: "#ffffff",
                    padding: "2px 7px",
                    borderRadius: "4px",
                    fontSize: "9.5px",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                    zIndex: 45,
                    boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                  }}
                >
                  {currentH}px
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div
          className="sig-placeholder-wrap"
          style={{
            minHeight: "44px",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            position: "relative",
          }}
        >
          {onOpenSignatureModal ? (
            <button
              type="button"
              className="doc-btn-click-sign no-print"
              onClick={() => onOpenSignatureModal("seller")}
              title="Pasang tanda tangan digital & stempel resmi eksportir"
            >
              <PenTool size={12} />
              <span>+ Tanda Tangan Eksportir</span>
            </button>
          ) : null}
        </div>
      )}

      {/* Signatory Name & Role directly underneath signature (Gambar 2 format) */}
      <div
        className="sig-signatory-info mt-1 pt-1"
        style={{
          borderTop: hasSignature ? "1px solid #cbd5e1" : "none",
          textAlign: "left",
        }}
      >
        <b
          className="sig-name text-slate-900 block font-bold"
          style={{ fontSize: "8.8pt", lineHeight: 1.25 }}
        >
          {signatoryName || "Muhajirin Fatona"}
        </b>
        <span
          className="sig-sub text-slate-600 block font-medium"
          style={{ fontSize: "8pt", lineHeight: 1.25 }}
        >
          {signatoryRole || "Export Director"}
        </span>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// 1. PROFORMA INVOICE (PI) COMPONENT — INCODOCS / UNLK SINGLE-PAGE FORMAT
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
  update,
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
  update?: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void;
}) {
  const fullBuyerAddress =
    buyerCountry && !buyerAddress.toLowerCase().includes(buyerCountry.toLowerCase())
      ? `${buyerAddress}, ${buyerCountry}`
      : buyerAddress;

  const hasTopLetterhead = ((shipment?.letterheadMode as string) || "standard") !== "hidden";
  const sigFull = signatoryName || "Muhajirin Fatona";
  const sigRoleText = signatoryRole || (isId ? "Direktur Ekspor" : "Export Director");
  const netWeightKgs = netWeightMT * 1000;
  const grossWeightKgs = bagsCount * 20.25;

  return (
    <div className="doc-content-wrapper unlk-doc-wrapper">
      <DocTitleBanner title={isId ? "FAKTUR PROFORMA (PROFORMA INVOICE)" : "PROFORMA INVOICE"} />

      <div className="unlk-trade-form">
        {/* ROW 1: Seller (Left 50%) | Invoice No/Date + Buyer Ref/Due Date (Right 50%) */}
        <div className="unlk-row-50-50">
          <div className="unlk-cell unlk-border-r">
            <div className="unlk-lbl">{isId ? "Penjual / Eksportir (Seller)" : "Seller"}</div>
            <div className="unlk-val-bold">{exporterName}</div>
            <div className="unlk-val">
              Jl. Adiyaksa Baru No. 1B, Kec. Panakkukang, Kota Makassar, Sulawesi Selatan 90231 – Indonesia
            </div>
            <div className="unlk-val">
              Tel: +62 812-3456-7890 | Email: official@indicoexport.com
            </div>
            <div className="unlk-val" style={{ color: "#334155", fontWeight: 600, marginTop: "2px" }}>
              {isId ? "Narahubung:" : "Contact Person:"} {sigFull} ({sigRoleText})
            </div>
          </div>

          <div className="unlk-col-stack">
            <div className="unlk-subrow-2col unlk-border-b unlk-flex-fill">
              <div className="unlk-cell unlk-border-r">
                <div className="unlk-lbl">{isId ? "Nomor Faktur (Invoice No)" : "Invoice Number"}</div>
                <div className="unlk-val-bold">PI/IEI-DXB/X/2026/001</div>
              </div>
              <div className="unlk-cell">
                <div className="unlk-lbl">{isId ? "Tanggal Penerbitan" : "Issue Date"}</div>
                <div className="unlk-val-bold">08 Nov 2026</div>
              </div>
            </div>

            <div className="unlk-subrow-2col unlk-flex-fill">
              <div className="unlk-cell unlk-border-r">
                <div className="unlk-lbl">{isId ? "Referensi Pembeli (Buyer Ref)" : "Buyer Reference"}</div>
                <div className="unlk-val-bold">{poNumber || shipment.poNumber || "ABF/LOI/2026/108"}</div>
              </div>
              <div className="unlk-cell">
                <div className="unlk-lbl">{isId ? "Masa Berlaku / Jatuh Tempo" : "Validity / Due Date"}</div>
                <div className="unlk-val-bold">{isId ? "22 Nov 2026 (14 Hari)" : "22 Nov 2026 (14 Days)"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 2: Buyer (Left 50%) | Dispatch & Delivery Schedule (Right 50%) */}
        <div className="unlk-row-50-50 unlk-border-t">
          <div className="unlk-cell unlk-border-r">
            <div className="unlk-lbl">{isId ? "Pembeli / Penerima Barang (Buyer / Consignee)" : "Buyer / Consignee"}</div>
            <div className="unlk-val-bold">{buyerName}</div>
            <div className="unlk-val">{fullBuyerAddress}</div>
            <div className="unlk-val">
              Tel: {buyerPhone || "+971 4 223 4567"} | Email: {buyerEmail || "procurement@albarakahfoods.ae"}
            </div>
            <div className="unlk-val">
              {isId ? "U.p. (Attn):" : "Attn:"} {buyerPicName || "Mr. Tariq Al-Mansoor"} ({buyerPicRole || (isId ? "Direktur Pengadaan" : "Procurement Director")})
            </div>
          </div>

          <div className="unlk-col-stack">
            <div className="unlk-subrow-2col unlk-border-b unlk-flex-fill">
              <div className="unlk-cell unlk-border-r">
                <div className="unlk-lbl">{isId ? "Metode Pengiriman" : "Method of Dispatch"}</div>
                <div className="unlk-val-bold">{isId ? "Muatan Laut (Ocean FCL)" : "Sea Freight (Ocean FCL)"}</div>
              </div>
              <div className="unlk-cell">
                <div className="unlk-lbl">{isId ? "Jenis Pengapalan" : "Type of Shipment"}</div>
                <div className="unlk-val-bold">1 x 20&apos; FCL Food-Grade</div>
              </div>
            </div>

            <div className="unlk-cell unlk-flex-fill">
              <div className="unlk-lbl">{isId ? "Estimasi Pengapalan & Pengiriman" : "Estimated Shipment & Delivery"}</div>
              <div className="unlk-val-bold">
                {isId
                  ? "Maksimal 21 hari setelah Pembayaran Uang Muka (DP)"
                  : "Within 21 days after receipt of Advance Payment"}
              </div>
            </div>
          </div>
        </div>

        {/* ROW 3: Ports & Incoterm (Left 50%) | Origin, Destination & Payment Terms (Right 50%) */}
        <div className="unlk-row-50-50 unlk-border-t">
          <div className="unlk-col-stack unlk-border-r">
            <div className="unlk-subrow-2col unlk-border-b unlk-flex-fill">
              <div className="unlk-cell unlk-border-r">
                <div className="unlk-lbl">{isId ? "Pelabuhan Muat (POL)" : "Port of Loading (POL)"}</div>
                <div className="unlk-val-bold">{pol}</div>
              </div>
              <div className="unlk-cell">
                <div className="unlk-lbl">{isId ? "Pelabuhan Bongkar (POD)" : "Port of Discharge (POD)"}</div>
                <div className="unlk-val-bold">{pod}</div>
              </div>
            </div>

            <div className="unlk-subrow-2col unlk-flex-fill">
              <div className="unlk-cell unlk-border-r">
                <div className="unlk-lbl">{isId ? "Asuransi Laut" : "Marine Insurance"}</div>
                <div className="unlk-val-bold">
                  {incoterm === "CIF"
                    ? (isId ? "Ditanggung Penjual (110%)" : "Covered by Seller (110%)")
                    : (isId ? "Ditanggung Pembeli (FOB)" : "Buyer Coverage (FOB)")}
                </div>
              </div>
              <div className="unlk-cell">
                <div className="unlk-lbl">{isId ? "Incoterm Perdagangan" : "Trade Incoterm"}</div>
                <div className="unlk-val-bold">{incoterm} Makassar (2020)</div>
              </div>
            </div>
          </div>

          <div className="unlk-col-stack">
            <div className="unlk-subrow-2col unlk-border-b unlk-flex-fill">
              <div className="unlk-cell unlk-border-r">
                <div className="unlk-lbl">{isId ? "Negara Asal Barang" : "Country of Origin of Goods"}</div>
                <div className="unlk-val-bold">Indonesia</div>
              </div>
              <div className="unlk-cell">
                <div className="unlk-lbl">{isId ? "Negara Tujuan Akhir" : "Country of Final Destination"}</div>
                <div className="unlk-val-bold">{buyerCountry || "United Arab Emirates"}</div>
              </div>
            </div>

            <div className="unlk-cell unlk-flex-fill">
              <div className="unlk-lbl">{isId ? "Syarat / Metode Pembayaran" : "Terms / Method of Payment"}</div>
              <div className="unlk-val-bold">
                {paymentTerms ||
                  (isId
                    ? "Telegraphic Transfer (T/T) - 50% Uang Muka (DP), 50% terhadap Salinan B/L"
                    : "Telegraphic Transfer (T/T) - 50% Advance Payment, 50% against Copy of B/L")}
              </div>
            </div>
          </div>
        </div>

        {/* ROW 4: LINE ITEMS TABLE */}
        <table className="unlk-items-table">
          <thead>
            <tr>
              <th style={{ width: "11%" }}>{isId ? "Kode Produk" : "Product Code"}</th>
              <th style={{ width: "35%" }}>{isId ? "Deskripsi Barang" : "Description of Goods"}</th>
              <th style={{ width: "10%" }}>{isId ? "Kode HS" : "HS Code"}</th>
              <th style={{ width: "11%" }}>{isId ? "Kuantitas" : "Unit Quantity"}</th>
              <th style={{ width: "8%" }}>{isId ? "Satuan" : "Unit Type"}</th>
              <th style={{ width: "11%" }}>{isId ? "Harga Satuan" : "Unit Price"}</th>
              <th style={{ width: "14%" }}>{isId ? "Total Harga" : "Amount"}</th>
            </tr>
          </thead>
          <tbody>
            <tr className="unlk-item-main-row">
              <td className="text-center font-semibold">IEI-PS-01</td>
              <td>
                <div className="unlk-val-bold">{productName}</div>
                <div className="unlk-item-spec">
                  • {isId
                    ? "Spesifikasi: Mutu Ekspor Grade A, Kadar Air ≤ 2.5%, Mesh 16-18, Kemurnian 99%"
                    : "Specification: Grade A Export Quality, Moisture Max 2.5%, Mesh 16-18, Purity 99%"}
                </div>
                <div className="unlk-item-spec">
                  • {isId
                    ? `Kemasan: Karung Kertas Kraft Multiwall 20 kg neto dengan Lapisan PE Food-Grade (${formatNumber(bagsCount)} Karung)`
                    : `Packing: 20 kg net / Multiwall Kraft Paper Bag with Food-Grade PE Inner Liner (${formatNumber(bagsCount)} Bags)`}
                </div>
                <div className="unlk-item-spec">
                  • {isId
                    ? `Berat Neto: ${formatNumber(netWeightKgs, 2)} Kgs | Berat Bruto: ${formatNumber(grossWeightKgs, 2)} Kgs | Muatan: 1 x 20' FCL`
                    : `Net Weight: ${formatNumber(netWeightKgs, 2)} Kgs | Gross Weight: ${formatNumber(grossWeightKgs, 2)} Kgs | Load: 1 x 20' FCL`}
                </div>
              </td>
              <td className="text-center font-semibold">{hsCode}</td>
              <td className="text-right font-semibold">{formatNumber(netWeightMT, 2)}</td>
              <td className="text-center">MT</td>
              <td className="text-right" style={{ whiteSpace: "nowrap" }}>{formatMoney(unitPricePerMT, currency)}</td>
              <td className="text-right font-bold" style={{ whiteSpace: "nowrap" }}>{formatMoney(totalAmount, currency)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="unlk-subtotal-row">
              <td colSpan={3} className="unlk-subtotal-label">{isId ? "Total Halaman Ini" : "Total This Page"}</td>
              <td className="text-right font-semibold">{formatNumber(netWeightMT, 2)}</td>
              <td className="text-center">MT</td>
              <td />
              <td className="text-right font-bold" style={{ whiteSpace: "nowrap" }}>{formatMoney(totalAmount, currency)}</td>
            </tr>
            <tr className="unlk-subtotal-row unlk-consignment-total-row">
              <td colSpan={3} className="unlk-subtotal-label font-bold">{isId ? "Total Konsinyasi" : "Consignment Total"} ({incoterm} Makassar)</td>
              <td className="text-right font-bold">{formatNumber(netWeightMT, 2)}</td>
              <td className="text-center font-bold">MT</td>
              <td />
              <td className="text-right font-bold" style={{ whiteSpace: "nowrap" }}>{currency} {formatNumber(totalAmount, 2)}</td>
            </tr>
          </tfoot>
        </table>

        {/* ROW 5: BOTTOM 50/50 SPLIT FOOTER (Additional Info + Bank Details LEFT | Total + Incoterms + Signatory + Signature RIGHT) */}
        <div className="unlk-row-50-50">
          {/* Left 50%: Additional Info + Bank Details */}
          <div className="unlk-col-stack unlk-border-r">
            <div className="unlk-cell unlk-border-b">
              <div className="unlk-lbl">Amount in Words</div>
              <div className="unlk-val">
                <b>Say:</b> <i>{amountInWords}</i>
              </div>
              <div className="unlk-val" style={{ marginTop: "2px" }}>
                {isId
                  ? `Total Muatan: ${formatNumber(bagsCount)} Karung Kertas Kraft Multiwall @ 20 kg Neto dimuat dalam Kontainer 1 x 20' FCL Food-Grade.`
                  : `Total Volume: ${formatNumber(bagsCount)} Multiwall Kraft Paper Bags @ 20 kg Net loaded in 1 x 20' FCL Food-Grade Container.`}
              </div>
            </div>

            <div className="unlk-cell unlk-flex-fill">
              <div className="unlk-lbl">{isId ? "Rincian Bank Penerima (Beneficiary Bank)" : "Beneficiary Bank Details"}</div>
              <div className="unlk-bank-lines">
                <div><b>{isId ? "Nama Bank:" : "Bank Name:"}</b> {bankName || "PT. Bank Mandiri (Persero) Tbk"}</div>
                <div><b>{isId ? "Alamat Bank:" : "Bank Address:"}</b> {shipment.bankAddress || "Jl. Boulevard, Panakkukang, Makassar, South Sulawesi, Indonesia"}</div>
                <div><b>{isId ? "Nama Rekening:" : "Account Name:"}</b> {exporterName}</div>
                <div><b>{isId ? "Nomor Rekening:" : "Account Number:"}</b> {bankAccountNo || "152-00-9876543-2"} ({isId ? "Rekening USD" : "USD Account"})</div>
                <div><b>{isId ? "Kode SWIFT:" : "SWIFT Code:"}</b> {bankSwift || "BMRIIDJA"} | <b>{isId ? "Mata Uang:" : "Currency:"}</b> {currency} ({isId ? "Dolar Amerika Serikat" : "United States Dollar"})</div>
              </div>
            </div>
          </div>

          {/* Right 50%: TOTAL + Incoterms/Currency + Signatory Company + Authorized Signatory + Signature */}
          <div className="unlk-col-stack">
            <div className="unlk-cell unlk-border-b unlk-total-bar">
              <span className="unlk-val-bold">TOTAL ({incoterm} MAKASSAR):</span>
              <span className="unlk-val-bold" style={{ whiteSpace: "nowrap" }}>
                {currency} {formatNumber(totalAmount, 2)}
              </span>
            </div>

            <div className="unlk-subrow-2col-70-30 unlk-border-b">
              <div className="unlk-cell unlk-border-r">
                <div className="unlk-lbl">{isId ? "Tempat & Tanggal Penerbitan" : "Place and Date of Issue"}</div>
                <div className="unlk-val-bold">MAKASSAR, INDONESIA</div>
              </div>
              <div className="unlk-cell">
                <div className="unlk-lbl">{isId ? "Tanggal Penerbitan" : "Date of Issue"}</div>
                <div className="unlk-val-bold">08 Nov 2026</div>
              </div>
            </div>

            <div className="unlk-cell unlk-border-b">
              <div className="unlk-lbl">{isId ? "Perusahaan Penandatangan" : "Signatory Company"}</div>
              <div className="unlk-val-bold">{exporterName}</div>
            </div>

            <div className="unlk-cell unlk-flex-fill" style={{ minHeight: "105px", padding: "6px 8px" }}>
              <div className="unlk-lbl mb-1">{isId ? "Tanda Tangan & Cap Resmi" : "Authorized Signature & Official Seal"}</div>
              <UnlkSignatureBox
                shipment={shipment}
                exporterName={exporterName}
                signatoryName={sigFull}
                signatoryRole={sigRoleText}
                onOpenSignatureModal={onOpenSignatureModal}
                update={update}
              />
            </div>
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
  update,
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
  update?: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void;
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
                  style={{
                    maxHeight: "56px",
                    width: "auto",
                    objectFit: "contain",
                    cursor: onOpenSignatureModal ? "pointer" : "default",
                  }}
                  onClick={() => onOpenSignatureModal?.("seller")}
                  title="Klik untuk mengubah tanda tangan"
                />
                <div className="sig-verify-badge no-print">
                  <span className="sig-verify-check">✓</span>
                  <span>Signed & Verified ({shipment.sellerSignatureDate || "2026"})</span>
                </div>
                <div className="no-print" style={{ display: "flex", gap: "4px" }}>
                  {onOpenSignatureModal && (
                    <button
                      type="button"
                      className="sig-edit-hover-btn"
                      onClick={() => onOpenSignatureModal("seller")}
                      title="Ganti tanda tangan"
                    >
                      Ubah
                    </button>
                  )}
                  {update && (
                    <button
                      type="button"
                      className="sig-edit-hover-btn"
                      onClick={() => {
                        update("sellerSignatureImage", "" as any);
                        update("sellerSignatureDate", "" as any);
                      }}
                      title="Hapus tanda tangan"
                      style={{ color: "#dc2626" }}
                    >
                      Hapus
                    </button>
                  )}
                </div>
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
// --------------------------------------------------------------------------
// 3. COMMERCIAL INVOICE (CI) COMPONENT — INCODOCS / UNLK SINGLE-PAGE FORMAT
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
  netWeightKgs,
  grossWeightKgs,
  netWeightMT,
  unitPricePerMT,
  totalAmount,
  amountInWords,
  isId = false,
  onOpenSignatureModal,
  update,
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
  netWeightKgs: number;
  grossWeightKgs: number;
  netWeightMT: number;
  unitPricePerMT: number;
  totalAmount: number;
  amountInWords: string;
  isId?: boolean;
  onOpenSignatureModal?: (party?: "seller" | "buyer") => void;
  update?: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void;
}) {
  const fullBuyerAddress =
    buyerCountry && !buyerAddress.toLowerCase().includes(buyerCountry.toLowerCase())
      ? `${buyerAddress}, ${buyerCountry}`
      : buyerAddress;

  const sigFull = signatoryName || "Muhajirin Fatona";
  const sigRoleText = signatoryRole || (isId ? "Direktur Ekspor" : "Export Director");

  const rawVessel = vesselName || "KMTC SHIMIZU V.2611N";
  const vParts = rawVessel.split(/\s+V\./i);
  const vesselOnly = vParts[0] || rawVessel;
  const voyageOnly = vParts[1] ? `V.${vParts[1]}` : "V.2611N";

  return (
    <div className="doc-content-wrapper unlk-doc-wrapper">
      <DocTitleBanner title={isId ? "FAKTUR KOMERSIAL (COMMERCIAL INVOICE)" : "COMMERCIAL INVOICE"} />

      <div className="unlk-trade-form">
        {/* ROW 1: Exporter (Left 50%) | Invoice No & Date / B/L No + Reference / Buyer Ref (Right 50%) */}
        <div className="unlk-row-50-50">
          <div className="unlk-cell unlk-border-r">
            <div className="unlk-lbl">{isId ? "Penjual / Eksportir (Seller / Exporter)" : "Exporter"}</div>
            <div className="unlk-val-bold">{exporterName}</div>
            <div className="unlk-val">
              Jl. Adiyaksa Baru No. 1B, Kec. Panakkukang, Kota Makassar, Sulawesi Selatan 90231 – Indonesia
            </div>
            <div className="unlk-val">
              Tel: +62 812-3456-7890 | Email: official@indicoexport.com
            </div>
            <div className="unlk-val" style={{ color: "#334155", fontWeight: 600, marginTop: "2px" }}>
              {isId ? "Narahubung:" : "Contact Person:"} {sigFull} ({sigRoleText})
            </div>
          </div>

          <div className="unlk-col-stack">
            <div className="unlk-subrow-2col unlk-border-b unlk-flex-fill">
              <div className="unlk-cell unlk-border-r">
                <div className="unlk-lbl">{isId ? "Nomor & Tanggal Faktur" : "Invoice Number & Date"}</div>
                <div className="unlk-val-bold" style={{ whiteSpace: "nowrap" }}>INV/IEI-DXB/XI/2026/001</div>
                <div className="unlk-val" style={{ color: "#475569", fontWeight: 600, marginTop: "2px", whiteSpace: "nowrap" }}>
                  {isId ? "Tanggal: 08 Nov 2026" : "Date: 08 Nov 2026"}
                </div>
              </div>
              <div className="unlk-cell">
                <div className="unlk-lbl">{isId ? "Nomor Bill of Lading (B/L)" : "Bill of Lading Number"}</div>
                <div className="unlk-val-bold">{shipment?.blNumber || "KMTC-MKS0091827"}</div>
              </div>
            </div>

            <div className="unlk-subrow-2col unlk-flex-fill">
              <div className="unlk-cell unlk-border-r">
                <div className="unlk-lbl">{isId ? "Referensi Kontrak" : "Reference"}</div>
                <div className="unlk-val-bold">SC/IEI-ABF/XI/2026/001</div>
              </div>
              <div className="unlk-cell">
                <div className="unlk-lbl">{isId ? "Referensi Pembeli" : "Buyer Reference"}</div>
                <div className="unlk-val-bold">{poNumber || shipment?.poNumber || "ABF/LOI/2026/108"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 2: Consignee (Left 50%) | Method of Dispatch & Vessel (Right 50% - replaces duplicate Buyer) */}
        <div className="unlk-row-50-50 unlk-border-t">
          <div className="unlk-cell unlk-border-r">
            <div className="unlk-lbl">{isId ? "Penerima Barang (Consignee)" : "Consignee"}</div>
            <div className="unlk-val-bold">{buyerName}</div>
            <div className="unlk-val">{fullBuyerAddress}</div>
            <div className="unlk-val">
              Tel: {buyerPhone || "+971 4 223 4567"} | Email: {buyerEmail || "procurement@albarakahfoods.ae"}
            </div>
            <div className="unlk-val" style={{ color: "#334155", fontWeight: 600, marginTop: "2px" }}>
              {isId ? "Kontak:" : "Contact:"} {buyerPicName || "Mr. Tariq Al-Mansoor"} ({buyerPhone || "+971 4 223 4567"})
            </div>
          </div>

          <div className="unlk-col-stack">
            <div className="unlk-subrow-2col unlk-border-b unlk-flex-fill">
              <div className="unlk-cell unlk-border-r">
                <div className="unlk-lbl">{isId ? "Metode Pengiriman" : "Method of Dispatch"}</div>
                <div className="unlk-val-bold">{isId ? "Muatan Laut (Ocean FCL)" : "Sea Freight (FCL)"}</div>
              </div>
              <div className="unlk-cell">
                <div className="unlk-lbl">{isId ? "Jenis Pengapalan" : "Type of Shipment"}</div>
                <div className="unlk-val-bold">1 x 20&apos; FCL Dry Container</div>
              </div>
            </div>

            <div className="unlk-subrow-2col unlk-flex-fill">
              <div className="unlk-cell unlk-border-r">
                <div className="unlk-lbl">{isId ? "Kapal / Pesawat" : "Vessel / Aircraft"}</div>
                <div className="unlk-val-bold">{vesselOnly}</div>
              </div>
              <div className="unlk-cell">
                <div className="unlk-lbl">{isId ? "Nomor Pelayaran" : "Voyage No"}</div>
                <div className="unlk-val-bold">{voyageOnly}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 3: Ports & Destination (Left 50%) | Origin, Destination & Terms of Payment (Right 50%) */}
        <div className="unlk-row-50-50 unlk-border-t">
          <div className="unlk-col-stack unlk-border-r">
            <div className="unlk-subrow-2col unlk-border-b unlk-flex-fill">
              <div className="unlk-cell unlk-border-r">
                <div className="unlk-lbl">{isId ? "Pelabuhan Muat" : "Port of Loading"}</div>
                <div className="unlk-val-bold">{pol}</div>
              </div>
              <div className="unlk-cell">
                <div className="unlk-lbl">{isId ? "Tanggal Keberangkatan" : "Date of Departure"}</div>
                <div className="unlk-val-bold">21 Nov 2026</div>
              </div>
            </div>

            <div className="unlk-subrow-2col unlk-flex-fill">
              <div className="unlk-cell unlk-border-r">
                <div className="unlk-lbl">{isId ? "Pelabuhan Bongkar" : "Port of Discharge"}</div>
                <div className="unlk-val-bold">{pod}</div>
              </div>
              <div className="unlk-cell">
                <div className="unlk-lbl">{isId ? "Tujuan Akhir" : "Final Destination"}</div>
                <div className="unlk-val-bold">{buyerCountry}</div>
              </div>
            </div>
          </div>

          <div className="unlk-col-stack">
            <div className="unlk-subrow-2col unlk-border-b unlk-flex-fill">
              <div className="unlk-cell unlk-border-r">
                <div className="unlk-lbl">{isId ? "Negara Asal Barang" : "Country Of Origin of Goods"}</div>
                <div className="unlk-val-bold">Indonesia</div>
              </div>
              <div className="unlk-cell">
                <div className="unlk-lbl">{isId ? "Negara Tujuan Akhir" : "Country of Final Destination"}</div>
                <div className="unlk-val-bold">{buyerCountry}</div>
              </div>
            </div>

            <div className="unlk-cell unlk-flex-fill">
              <div className="unlk-lbl">{isId ? "Syarat / Metode Pembayaran" : "Terms / Method of Payment"}</div>
              <div className="unlk-val-bold">
                {paymentTerms ||
                  (isId
                    ? "Telegraphic Transfer (T/T) - 50% Uang Muka (DP), 50% saat Salinan B/L Diterima"
                    : "Telegraphic Transfer (T/T) - 50% Advance Payment, 50% against Copy of B/L")}
              </div>
            </div>
          </div>
        </div>

        {/* ROW 4: LINE ITEMS TABLE */}
        <table className="unlk-items-table">
          <thead>
            <tr>
              <th style={{ width: "11%" }}>{isId ? "Kode Produk" : "Product Code"}</th>
              <th style={{ width: "35%" }}>{isId ? "Uraian / Deskripsi Barang" : "Description of Goods"}</th>
              <th style={{ width: "10%" }}>{isId ? "Kode HS" : "HS Code"}</th>
              <th style={{ width: "11%" }}>{isId ? "Jumlah Kuantitas" : "Unit Quantity"}</th>
              <th style={{ width: "8%" }}>{isId ? "Satuan" : "Unit Type"}</th>
              <th style={{ width: "11%" }}>{isId ? "Harga Satuan" : "Unit Price"}</th>
              <th style={{ width: "14%" }}>{isId ? "Jumlah Total" : "Amount"}</th>
            </tr>
          </thead>
          <tbody>
            <tr className="unlk-item-main-row">
              <td className="text-center font-semibold">IEI-PS-01</td>
              <td>
                <div className="unlk-val-bold">{productName.toUpperCase()}</div>
                <div className="unlk-item-spec">
                  • {isId ? "Spesifikasi:" : "Specification:"} Grade A Export Quality, Moisture Max 2.5%, Mesh 16-18, Purity 99%
                </div>
                <div className="unlk-item-spec">
                  • {isId ? "Kemasan:" : "Packing:"} 20 Kg Net Multiwall Kraft Paper Bag with Food-Grade PE Liner ({formatNumber(bagsCount)} Bags)
                </div>
                <div className="unlk-item-spec">
                  • {isId ? "Berat Bersih:" : "Net Weight:"} {formatNumber(netWeightKgs, 2)} Kgs | {isId ? "Berat Kotor:" : "Gross Weight:"} {formatNumber(grossWeightKgs, 2)} Kgs | Muat 1 x 20&apos; FCL
                </div>
                <div className="unlk-item-spec">
                  • {isId ? "Tanda Pengapalan:" : "Shipping Marks:"} {buyerName.split(" ")[0] || "AL BARAKAH"} / {pod.split(",")[0] || "DUBAI"} / C/NO. 1-{formatNumber(bagsCount)}
                </div>
              </td>
              <td className="text-center font-semibold">{hsCode}</td>
              <td className="text-right font-semibold">{formatNumber(netWeightMT, 2)}</td>
              <td className="text-center">MT</td>
              <td className="text-right" style={{ whiteSpace: "nowrap" }}>{formatMoney(unitPricePerMT, currency)}</td>
              <td className="text-right font-bold" style={{ whiteSpace: "nowrap" }}>{formatMoney(totalAmount, currency)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="unlk-subtotal-row">
              <td colSpan={3} className="unlk-subtotal-label">{isId ? "Total Halaman Ini" : "Total This Page"}</td>
              <td className="text-right font-semibold">{formatNumber(netWeightMT, 2)}</td>
              <td className="text-center">MT</td>
              <td />
              <td className="text-right font-bold" style={{ whiteSpace: "nowrap" }}>{formatMoney(totalAmount, currency)}</td>
            </tr>
            <tr className="unlk-subtotal-row unlk-consignment-total-row">
              <td colSpan={3} className="unlk-subtotal-label font-bold">
                {isId ? `Total Konsinyasi (${incoterm} Makassar)` : `Consignment Total (${incoterm} Makassar)`}
              </td>
              <td className="text-right font-bold">{formatNumber(netWeightMT, 2)}</td>
              <td className="text-center font-bold">MT</td>
              <td />
              <td className="text-right font-bold" style={{ whiteSpace: "nowrap" }}>{currency} {formatNumber(totalAmount, 2)}</td>
            </tr>
          </tfoot>
        </table>

        {/* ROW 5: BOTTOM 50/50 SPLIT FOOTER */}
        <div className="unlk-row-50-50">
          <div className="unlk-col-stack unlk-border-r">
            <div className="unlk-cell unlk-border-b">
              <div className="unlk-lbl">Amount in Words</div>
              <div className="unlk-val">
                <b>Say:</b> <i>{amountInWords}</i>
              </div>
              <div className="unlk-val" style={{ marginTop: "2px" }}>
                {isId
                  ? "Total Volume: 900 Karung Multiwall Kraft Paper Bag @ 20 Kg dimuat ke dalam 1 x 20' FCL Food-Grade Container."
                  : "Total Volume: 900 Multiwall Kraft Paper Bags @ 20 Kg net loaded in 1 x 20' FCL Food-Grade Container."}
              </div>
              <div className="unlk-val" style={{ marginTop: "2px" }}>
                {isId
                  ? "Dengan ini kami menyatakan bahwa faktur ini menunjukkan harga sebenarnya dari barang yang diuraikan dan bahwa semua keterangan adalah benar dan tepat."
                  : "We hereby certify that this invoice shows the actual price of the goods described and that all particulars are true and correct."}
              </div>
            </div>

            <div className="unlk-cell unlk-flex-fill">
              <div className="unlk-lbl">{isId ? "Rincian Bank Penerima (Beneficiary)" : "Beneficiary Bank Details"}</div>
              <div className="unlk-bank-lines">
                <div><b>{isId ? "Nama Bank:" : "Bank Name:"}</b> {bankName || "PT. Bank Mandiri (Persero) Tbk"}</div>
                <div><b>{isId ? "Alamat Bank:" : "Bank Address:"}</b> {shipment?.bankAddress || "Jl. Boulevard, Panakkukang, Makassar, South Sulawesi, Indonesia"}</div>
                <div><b>{isId ? "Nama Pemilik Rekening:" : "Account Name:"}</b> {exporterName}</div>
                <div><b>{isId ? "Nomor Rekening:" : "Account Number:"}</b> {bankAccountNo || "152-00-9876543-2"} ({isId ? "Rekening USD" : "USD Account"})</div>
                <div><b>SWIFT Code:</b> {bankSwift || "BMRIIDJA"} | <b>{isId ? "Mata Uang:" : "Currency:"}</b> {currency}</div>
              </div>
            </div>
          </div>

          <div className="unlk-col-stack">
            <div className="unlk-cell unlk-border-b unlk-total-bar">
              <span className="unlk-val-bold">{isId ? `TOTAL FAKTUR (${incoterm} MAKASSAR):` : `INVOICE TOTAL (${incoterm} MAKASSAR):`}</span>
              <span className="unlk-val-bold" style={{ whiteSpace: "nowrap" }}>
                {currency} {formatNumber(totalAmount, 2)}
              </span>
            </div>

            <div className="unlk-subrow-2col unlk-border-b">
              <div className="unlk-cell unlk-border-r">
                <div className="unlk-lbl">{isId ? "Tempat & Tanggal Penerbitan" : "Place and Date of Issue"}</div>
                <div className="unlk-val-bold">MAKASSAR, INDONESIA</div>
              </div>
              <div className="unlk-cell">
                <div className="unlk-lbl">{isId ? "Tanggal Penerbitan" : "Date of Issue"}</div>
                <div className="unlk-val-bold">08 Nov 2026</div>
              </div>
            </div>

            <div className="unlk-cell unlk-border-b">
              <div className="unlk-lbl">{isId ? "Perusahaan Penandatangan" : "Signatory Company"}</div>
              <div className="unlk-val-bold">{exporterName}</div>
            </div>

            <div className="unlk-cell unlk-flex-fill" style={{ minHeight: "105px", padding: "6px 8px" }}>
              <div className="unlk-lbl mb-1">{isId ? "Tanda Tangan & Cap Resmi" : "Authorized Signature & Official Seal"}</div>
              <UnlkSignatureBox
                shipment={shipment}
                exporterName={exporterName}
                signatoryName={sigFull}
                signatoryRole={sigRoleText}
                onOpenSignatureModal={onOpenSignatureModal}
                update={update}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// 4. PACKING LIST (PL) COMPONENT — INCODOCS / UNLK SINGLE-PAGE FORMAT
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
  update,
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
  update?: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void;
}) {
  const fullBuyerAddress =
    buyerCountry && !buyerAddress.toLowerCase().includes(buyerCountry.toLowerCase())
      ? `${buyerAddress}, ${buyerCountry}`
      : buyerAddress;

  const sigFull = signatoryName || "Muhajirin Fatona";
  const sigRoleText = signatoryRole || (isId ? "Direktur Ekspor" : "Export Director");

  const rawVessel = vesselName || "KMTC SHIMIZU V.2611N";
  const vParts = rawVessel.split(/\s+V\./i);
  const vesselOnly = vParts[0] || rawVessel;
  const voyageOnly = vParts[1] ? `V.${vParts[1]}` : "V.2611N";

  return (
    <div className="doc-content-wrapper unlk-doc-wrapper">
      <DocTitleBanner title={isId ? "DAFTAR KEMASAN (PACKING LIST)" : "PACKING LIST"} />

      <div className="unlk-trade-form">
        {/* ROW 1: Exporter (Left 50%) | Pages + PL No/Date + Invoice Ref/Buyer Ref (Right 50%) */}
        <div className="unlk-row-50-50">
          <div className="unlk-cell unlk-border-r">
            <div className="unlk-lbl">{isId ? "Penjual / Eksportir (Seller / Exporter)" : "Exporter"}</div>
            <div className="unlk-val-bold">{exporterName}</div>
            <div className="unlk-val">
              Jl. Adiyaksa Baru No. 1B, Kec. Panakkukang, Kota Makassar, Sulawesi Selatan 90231 – Indonesia
            </div>
            <div className="unlk-val">
              Tel: +62 812-3456-7890 | Email: official@indicoexport.com
            </div>
            <div className="unlk-val" style={{ color: "#334155", fontWeight: 600, marginTop: "2px" }}>
              {isId ? "Narahubung:" : "Contact Person:"} {sigFull} ({sigRoleText})
            </div>
          </div>

          <div className="unlk-col-stack">
            <div className="unlk-subrow-2col unlk-border-b unlk-flex-fill">
              <div className="unlk-cell unlk-border-r">
                <div className="unlk-lbl">{isId ? "Nomor & Tanggal Packing List" : "Packing List Number & Date"}</div>
                <div className="unlk-val-bold" style={{ whiteSpace: "nowrap" }}>PL/IEI-DXB/XI/2026/001</div>
                <div className="unlk-val" style={{ color: "#475569", fontWeight: 600, marginTop: "2px", whiteSpace: "nowrap" }}>
                  {isId ? "Tanggal: 08 Nov 2026" : "Date: 08 Nov 2026"}
                </div>
              </div>
              <div className="unlk-cell">
                <div className="unlk-lbl">{isId ? "Nomor Bill of Lading (B/L)" : "Bill of Lading Number"}</div>
                <div className="unlk-val-bold">{shipment?.blNumber || "KMTC-MKS0091827"}</div>
              </div>
            </div>

            <div className="unlk-subrow-2col unlk-flex-fill">
              <div className="unlk-cell unlk-border-r">
                <div className="unlk-lbl">{isId ? "Referensi Faktur (Invoice Ref)" : "Invoice Reference"}</div>
                <div className="unlk-val-bold">INV/IEI-DXB/XI/2026/001</div>
              </div>
              <div className="unlk-cell">
                <div className="unlk-lbl">{isId ? "Referensi Pembeli" : "Buyer Reference"}</div>
                <div className="unlk-val-bold">{poNumber || shipment?.poNumber || "ABF/LOI/2026/108"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 2: Consignee (Left 50%) | Method of Dispatch & Vessel (Right 50% - replaces duplicate Buyer) */}
        <div className="unlk-row-50-50 unlk-border-t">
          <div className="unlk-cell unlk-border-r">
            <div className="unlk-lbl">{isId ? "Penerima Barang (Consignee)" : "Consignee"}</div>
            <div className="unlk-val-bold">{buyerName}</div>
            <div className="unlk-val">{fullBuyerAddress}</div>
            <div className="unlk-val">
              Tel: {buyerPhone || "+971 4 223 4567"} | Email: {buyerEmail || "procurement@albarakahfoods.ae"}
            </div>
            <div className="unlk-val" style={{ color: "#334155", fontWeight: 600, marginTop: "2px" }}>
              {isId ? "Kontak:" : "Contact:"} {buyerPicName || "Mr. Tariq Al-Mansoor"} ({buyerPhone || "+971 4 223 4567"})
            </div>
          </div>

          <div className="unlk-col-stack">
            <div className="unlk-subrow-2col unlk-border-b unlk-flex-fill">
              <div className="unlk-cell unlk-border-r">
                <div className="unlk-lbl">{isId ? "Metode Pengiriman" : "Method of Dispatch"}</div>
                <div className="unlk-val-bold">{isId ? "Muatan Laut (Ocean FCL)" : "Sea Freight (FCL)"}</div>
              </div>
              <div className="unlk-cell">
                <div className="unlk-lbl">{isId ? "Jenis Pengapalan" : "Type of Shipment"}</div>
                <div className="unlk-val-bold">1 x 20&apos; FCL Dry Container</div>
              </div>
            </div>

            <div className="unlk-subrow-2col unlk-flex-fill">
              <div className="unlk-cell unlk-border-r">
                <div className="unlk-lbl">{isId ? "Kapal / Pesawat" : "Vessel / Aircraft"}</div>
                <div className="unlk-val-bold">{vesselOnly}</div>
              </div>
              <div className="unlk-cell">
                <div className="unlk-lbl">{isId ? "Nomor Pelayaran" : "Voyage No"}</div>
                <div className="unlk-val-bold">{voyageOnly}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 3: Transport & Container Grid */}
        <div className="unlk-row-50-50 unlk-border-t">
          <div className="unlk-col-stack unlk-border-r">
            <div className="unlk-subrow-2col unlk-border-b unlk-flex-fill">
              <div className="unlk-cell unlk-border-r">
                <div className="unlk-lbl">{isId ? "Pelabuhan Muat" : "Port of Loading"}</div>
                <div className="unlk-val-bold">{pol}</div>
              </div>
              <div className="unlk-cell">
                <div className="unlk-lbl">{isId ? "Pelabuhan Bongkar" : "Port of Discharge"}</div>
                <div className="unlk-val-bold">{pod}</div>
              </div>
            </div>

            <div className="unlk-subrow-2col unlk-flex-fill">
              <div className="unlk-cell unlk-border-r">
                <div className="unlk-lbl">{isId ? "Nomor Kontainer" : "Container Number"}</div>
                <div className="unlk-val-bold">{containerNumber || "TGHU 2468135"}</div>
              </div>
              <div className="unlk-cell">
                <div className="unlk-lbl">{isId ? "Nomor Segel" : "Seal Number"}</div>
                <div className="unlk-val-bold">{sealNumber || "IDMKS998877"}</div>
              </div>
            </div>
          </div>

          <div className="unlk-col-stack">
            <div className="unlk-subrow-2col unlk-border-b unlk-flex-fill">
              <div className="unlk-cell unlk-border-r">
                <div className="unlk-lbl">{isId ? "Negara Asal Barang" : "Country Of Origin of Goods"}</div>
                <div className="unlk-val-bold">Indonesia</div>
              </div>
              <div className="unlk-cell">
                <div className="unlk-lbl">{isId ? "Negara Tujuan Akhir" : "Country of Final Destination"}</div>
                <div className="unlk-val-bold">{buyerCountry}</div>
              </div>
            </div>

            <div className="unlk-cell unlk-flex-fill">
              <div className="unlk-lbl">{isId ? "Dimensi & Kemasan Karung" : "Packing & Bag Dimension"}</div>
              <div className="unlk-val-bold">
                {isId
                  ? "Karung Kertas Kraft Multiwall 3 Lapis dengan Lapisan PE Food-Grade (60 x 40 x 12 cm)"
                  : "3-Ply Multiwall Kraft Paper Bag with Food-Grade PE Liner (60 x 40 x 12 cm)"}
              </div>
            </div>
          </div>
        </div>

        {/* ROW 4: PACKING ITEMS TABLE */}
        <table className="unlk-items-table">
          <thead>
            <tr>
              <th style={{ width: "12%" }}>{isId ? "Kode Produk" : "Product Code"}</th>
              <th style={{ width: "34%" }}>{isId ? "Uraian / Deskripsi Barang" : "Description of Goods"}</th>
              <th style={{ width: "10%" }}>{isId ? "Kode HS" : "HS Code"}</th>
              <th style={{ width: "11%" }}>{isId ? "Jumlah Karung" : "Unit Qty"}</th>
              <th style={{ width: "11%" }}>{isId ? "Berat Bersih" : "Net Weight"}</th>
              <th style={{ width: "11%" }}>{isId ? "Berat Kotor" : "Gross Weight"}</th>
              <th style={{ width: "11%" }}>{isId ? "Ukuran (CBM)" : "Meas. (CBM)"}</th>
            </tr>
          </thead>
          <tbody>
            <tr className="unlk-item-main-row">
              <td className="text-center font-semibold">IEI-PS-01</td>
              <td>
                <div className="unlk-val-bold">{productName.toUpperCase()}</div>
                <div className="unlk-item-spec">
                  • {isId ? "Berat Bersih Satuan: 20,00 Kg / Karung | Berat Kotor Satuan: 20,25 Kg / Karung" : "Unit Net Weight: 20.00 Kg / Bag | Unit Gross Weight: 20.25 Kg / Bag"}
                </div>
                <div className="unlk-item-spec">
                  • {isId ? "Tanda Pengapalan:" : "Shipping Marks:"} {buyerName.split(" ")[0] || "AL BARAKAH"} / DUBAI - UAE / BATCH 11/26 / MADE IN INDONESIA
                </div>
              </td>
              <td className="text-center font-semibold">{hsCode}</td>
              <td className="text-right font-semibold">{formatNumber(bagsCount)} {isId ? "Karung" : "Bags"}</td>
              <td className="text-right font-semibold">{formatNumber(netWeightKgs, 2)} Kgs</td>
              <td className="text-right font-semibold">{formatNumber(grossWeightKgs, 2)} Kgs</td>
              <td className="text-right font-bold">{formatNumber(totalCBM, 3)} CBM</td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="unlk-subtotal-row">
              <td colSpan={3} className="unlk-subtotal-label">{isId ? "Total Halaman Ini" : "Total This Page"}</td>
              <td className="text-right font-semibold">{formatNumber(bagsCount)} {isId ? "Karung" : "Bags"}</td>
              <td className="text-right font-semibold">{formatNumber(netWeightKgs, 2)} Kgs</td>
              <td className="text-right font-semibold">{formatNumber(grossWeightKgs, 2)} Kgs</td>
              <td className="text-right font-bold">{formatNumber(totalCBM, 3)} CBM</td>
            </tr>
            <tr className="unlk-subtotal-row unlk-consignment-total-row">
              <td colSpan={3} className="unlk-subtotal-label font-bold">{isId ? "Total Konsinyasi" : "Consignment Total"}</td>
              <td className="text-right font-bold">{formatNumber(bagsCount)} {isId ? "Karung" : "Bags"}</td>
              <td className="text-right font-bold">{formatNumber(netWeightMT, 2)} MT</td>
              <td className="text-right font-bold">{formatNumber(grossWeightMT, 3)} MT</td>
              <td className="text-right font-bold">{formatNumber(totalCBM, 3)} CBM</td>
            </tr>
          </tfoot>
        </table>

        {/* ROW 5: BOTTOM 50/50 SPLIT FOOTER */}
        <div className="unlk-row-50-50">
          <div className="unlk-col-stack unlk-border-r">
            <div className="unlk-cell unlk-border-b">
              <div className="unlk-lbl">{isId ? "Informasi Tambahan" : "Additional Info"}</div>
              <div className="unlk-val">
                <b>{isId ? "Total Konsinyasi:" : "Total Consignment:"}</b> {formatNumber(bagsCount)} {isId ? "Karung Kertas Kraft Multiwall dimuat dalam 1 x 20' FCL Food-Grade Container." : "Multiwall Kraft Paper Bags stuffed into 1 x 20' FCL Food-Grade Container."}
              </div>
            </div>

            <div className="unlk-cell unlk-flex-fill">
              <div className="unlk-lbl">{isId ? "Deklarasi Kemasan & Kelaiklautan (Seaworthy)" : "Packing & Seaworthy Compliance Declaration"}</div>
              <div className="unlk-bank-lines">
                <div>
                  {isId
                    ? "Dengan ini kami menyatakan bahwa barang yang disebutkan di atas dikemas dalam karung kertas kraft multiwall standar ekspor kelaiklautan dengan lapisan dalam PE food-grade."
                    : "We hereby certify that the goods mentioned above are packed in seaworthy export multiwall kraft paper bags with inner food-grade PE liner."}
                </div>
                <div>
                  {isId
                    ? "Semua rincian mengenai kuantitas, kemasan, serta berat kotor dan bersih telah diverifikasi dengan tepat, benar, dan sah."
                    : "All particulars concerning quantity, packaging, and gross/net weights are verified, true, and correct."}
                </div>
              </div>
            </div>
          </div>

          <div className="unlk-col-stack">
            <div className="unlk-cell unlk-border-b unlk-total-bar">
              <span className="unlk-val-bold">{isId ? "TOTAL KEMASAN:" : "TOTAL PACKAGES:"}</span>
              <span className="unlk-val-bold">
                {formatNumber(bagsCount)} {isId ? "KARUNG" : "BAGS"} ({formatNumber(grossWeightKgs, 2)} KGS)
              </span>
            </div>

            <div className="unlk-subrow-2col unlk-border-b">
              <div className="unlk-cell unlk-border-r">
                <div className="unlk-lbl">{isId ? "Tempat & Tanggal Penerbitan" : "Place and Date of Issue"}</div>
                <div className="unlk-val-bold">MAKASSAR, INDONESIA</div>
              </div>
              <div className="unlk-cell">
                <div className="unlk-lbl">{isId ? "Tanggal Penerbitan" : "Date of Issue"}</div>
                <div className="unlk-val-bold">08 Nov 2026</div>
              </div>
            </div>

            <div className="unlk-cell unlk-border-b">
              <div className="unlk-lbl">{isId ? "Perusahaan Penandatangan" : "Signatory Company"}</div>
              <div className="unlk-val-bold">{exporterName}</div>
            </div>

            <div className="unlk-cell unlk-flex-fill" style={{ minHeight: "105px", padding: "6px 8px" }}>
              <div className="unlk-lbl mb-1">{isId ? "Tanda Tangan & Cap Resmi" : "Authorized Signature & Official Seal"}</div>
              <UnlkSignatureBox
                shipment={shipment}
                exporterName={exporterName}
                signatoryName={sigFull}
                signatoryRole={sigRoleText}
                onOpenSignatureModal={onOpenSignatureModal}
                update={update}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// 5. SHIPPING INSTRUCTION (SI) COMPONENT — INCODOCS / UNLK SINGLE-PAGE FORMAT
// --------------------------------------------------------------------------
function ShippingInstructionDoc({
  shipment,
  exporterName,
  exporterAddress,
  buyerName,
  buyerAddress,
  buyerCountry = "United Arab Emirates",
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
  update,
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
  update?: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void;
}) {
  const fullBuyerAddress =
    buyerCountry && !buyerAddress.toLowerCase().includes(buyerCountry.toLowerCase())
      ? `${buyerAddress}, ${buyerCountry}`
      : buyerAddress;

  const sigFull = signatoryName || "Muhajirin Fatona";
  const sigRoleText = signatoryRole || (isId ? "Direktur Ekspor" : "Export Director");

  const rawVessel = vesselName || "KMTC SHIMIZU V.2611N";
  const vParts = rawVessel.split(/\s+V\./i);
  const vesselOnly = vParts[0] || rawVessel;
  const voyageOnly = vParts[1] ? `V.${vParts[1]}` : "V.2611N";

  return (
    <div className="doc-content-wrapper unlk-doc-wrapper">
      <DocTitleBanner title={isId ? "INSTRUKSI PENGAPALAN (SHIPPING INSTRUCTION)" : "SHIPPING INSTRUCTION (SI)"} />

      <div className="unlk-trade-form">
        {/* ROW 1: Shipper / Exporter (Left 50%) | Pages + SI No/Date + Booking/Contract Ref (Right 50%) */}
        <div className="unlk-row-50-50">
          <div className="unlk-cell unlk-border-r">
            <div className="unlk-lbl">{isId ? "Pengirim / Eksportir (Shipper / Exporter)" : "Shipper / Exporter (To appear on B/L)"}</div>
            <div className="unlk-val-bold">{exporterName}</div>
            <div className="unlk-val">
              {exporterAddress || "Jl. Adiyaksa Baru No. 1B, Kec. Panakkukang, Kota Makassar, Sulawesi Selatan 90231 – Indonesia"}
            </div>
            <div className="unlk-val">
              Tel: +62 812-3456-7890 | Email: official@indicoexport.com
            </div>
            <div className="unlk-val" style={{ color: "#334155", fontWeight: 600, marginTop: "2px" }}>
              {isId ? "Narahubung:" : "Contact Person:"} {sigFull} ({sigRoleText})
            </div>
          </div>

          <div className="unlk-col-stack">
            <div className="unlk-subrow-2col unlk-border-b unlk-flex-fill">
              <div className="unlk-cell unlk-border-r">
                <div className="unlk-lbl">{isId ? "Nomor & Tanggal SI" : "SI Number & Date"}</div>
                <div className="unlk-val-bold" style={{ whiteSpace: "nowrap" }}>SI/IEI/XI/2026/001</div>
                <div className="unlk-val" style={{ color: "#475569", fontWeight: 600, marginTop: "2px", whiteSpace: "nowrap" }}>
                  {isId ? "Tanggal: 16 Nov 2026" : "Date: 16 Nov 2026"}
                </div>
              </div>
              <div className="unlk-cell">
                <div className="unlk-lbl">{isId ? "Kepada (Forwarder / Pelayaran)" : "To (Forwarder / Shipping Line)"}</div>
                <div className="unlk-val-bold">PT. Samudera Logistik Nusantara</div>
              </div>
            </div>

            <div className="unlk-subrow-2col unlk-flex-fill">
              <div className="unlk-cell unlk-border-r">
                <div className="unlk-lbl">{isId ? "Referensi Kontrak / Faktur" : "Contract / Invoice Ref"}</div>
                <div className="unlk-val-bold">INV/IEI-DXB/XI/2026/001</div>
              </div>
              <div className="unlk-cell">
                <div className="unlk-lbl">{isId ? "Referensi Pembeli" : "Buyer Reference"}</div>
                <div className="unlk-val-bold">{poNumber || shipment?.poNumber || "ABF/LOI/2026/108"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 2: Consignee (Left 50%) | Notify Party (Right 50%) */}
        <div className="unlk-row-50-50 unlk-border-t">
          <div className="unlk-cell unlk-border-r">
            <div className="unlk-lbl">{isId ? "Penerima Barang (Untuk B/L)" : "Consignee (To appear on B/L)"}</div>
            <div className="unlk-val-bold">{buyerName}</div>
            <div className="unlk-val">{fullBuyerAddress}</div>
            <div className="unlk-val">
              Tel: {buyerPhone || "+971 4 223 4567"} | Email: {buyerEmail || "procurement@albarakahfoods.ae"}
            </div>
          </div>

          <div className="unlk-cell">
            <div className="unlk-lbl">{isId ? "Pihak yang Diberitahu (Untuk B/L)" : "Notify Party (To appear on B/L)"}</div>
            <div className="unlk-val-bold">{isId ? "SAMA DENGAN PENERIMA (SAME AS CONSIGNEE)" : "SAME AS CONSIGNEE"}</div>
            <div className="unlk-val">
              {buyerName} — {isId ? "Kontak:" : "Contact:"} {buyerPicName || "Mr. Tariq Al-Mansoor"} ({buyerPhone || "+971 4 223 4567"})
            </div>
          </div>
        </div>

        {/* ROW 3: Vessel, Ports & B/L Terms */}
        <div className="unlk-row-50-50 unlk-border-t">
          <div className="unlk-col-stack unlk-border-r">
            <div className="unlk-subrow-2col unlk-border-b">
              <div className="unlk-cell unlk-border-r">
                <div className="unlk-lbl">{isId ? "Kapal / Pesawat" : "Vessel / Aircraft"}</div>
                <div className="unlk-val-bold">{vesselOnly}</div>
              </div>
              <div className="unlk-cell">
                <div className="unlk-lbl">{isId ? "Nomor Pelayaran / ETD" : "Voyage No / ETD"}</div>
                <div className="unlk-val-bold">{voyageOnly} (ETD: 21 Nov 2026)</div>
              </div>
            </div>

            <div className="unlk-subrow-2col unlk-flex-fill">
              <div className="unlk-cell unlk-border-r">
                <div className="unlk-lbl">{isId ? "Pelabuhan Muat" : "Port of Loading"}</div>
                <div className="unlk-val-bold">{pol}</div>
              </div>
              <div className="unlk-cell">
                <div className="unlk-lbl">{isId ? "Pelabuhan Bongkar" : "Port of Discharge"}</div>
                <div className="unlk-val-bold">{pod}</div>
              </div>
            </div>
          </div>

          <div className="unlk-col-stack">
            <div className="unlk-subrow-2col unlk-border-b">
              <div className="unlk-cell unlk-border-r">
                <div className="unlk-lbl">{isId ? "Jenis Bill of Lading" : "Type of Bill of Lading"}</div>
                <div className="unlk-val-bold">{isId ? "Set Lengkap (3/3) Asli Clean on Board" : "Full Set (3/3) Original Clean on Board"}</div>
              </div>
              <div className="unlk-cell">
                <div className="unlk-lbl">{isId ? "Syarat Uang Tambang (Freight Terms)" : "Freight Terms"}</div>
                <div className="unlk-val-bold">
                  {incoterm === "FOB"
                    ? (isId ? "ONGKOS DIBAYAR DI TUJUAN (FREIGHT COLLECT)" : "FREIGHT COLLECT")
                    : (isId ? "ONGKOS DIBAYAR DI MUKA (FREIGHT PREPAID)" : "FREIGHT PREPAID")}
                </div>
              </div>
            </div>

            <div className="unlk-subrow-2col unlk-flex-fill">
              <div className="unlk-cell unlk-border-r">
                <div className="unlk-lbl">{isId ? "Nomor Kontainer / Segel" : "Container / Seal No"}</div>
                <div className="unlk-val-bold">{containerNumber || "TGHU 2468135"} / {sealNumber || "IDMKS998877"}</div>
              </div>
              <div className="unlk-cell">
                <div className="unlk-lbl">{isId ? "Mode Muat (Stuffing Mode)" : "Stuffing Mode"}</div>
                <div className="unlk-val-bold">1 x 20&apos; GP Food-Grade (CY / CY)</div>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 4: CARGO DESCRIPTION TABLE */}
        <table className="unlk-items-table">
          <thead>
            <tr>
              <th style={{ width: "16%" }}>{isId ? "Tanda & Nomor Kemasan" : "Marks & Numbers"}</th>
              <th style={{ width: "36%" }}>{isId ? "Uraian Barang (Pada B/L)" : "Description of Goods (On B/L)"}</th>
              <th style={{ width: "11%" }}>{isId ? "Kode HS" : "HS Code"}</th>
              <th style={{ width: "12%" }}>{isId ? "Jumlah Kemasan" : "No. of Pkgs"}</th>
              <th style={{ width: "13%" }}>{isId ? "Berat Kotor (Bruto)" : "Gross Weight"}</th>
              <th style={{ width: "12%" }}>{isId ? "Ukuran (CBM)" : "Measurement"}</th>
            </tr>
          </thead>
          <tbody>
            <tr className="unlk-item-main-row">
              <td>
                <div className="unlk-val-bold">{buyerName.split(" ")[0] || "AL BARAKAH"}</div>
                <div className="unlk-item-spec">DUBAI - UAE</div>
                <div className="unlk-item-spec">BATCH: 11/26</div>
                <div className="unlk-item-spec">MADE IN INDONESIA</div>
              </td>
              <td>
                <div className="unlk-val-bold">{productName.toUpperCase()}</div>
                <div className="unlk-item-spec">
                  • {isId ? "Dikemas dalam Karung Kertas Kraft Multiwall 20 Kg Neto dengan Lapisan PE Food-Grade." : "Packed in 20 Kg Net Multiwall Kraft Paper Bags with Inner Food-Grade PE Liner."}
                </div>
                <div className="unlk-item-spec">
                  • {isId ? "Clean on Board, Dimuat di Bawah Geladak dalam Kontainer FCL." : "Clean on Board, Stowed Under Deck in FCL Container."}
                </div>
              </td>
              <td className="text-center font-semibold">{hsCode}</td>
              <td className="text-right font-semibold">{formatNumber(bagsCount)} {isId ? "KARUNG" : "BAGS"}</td>
              <td className="text-right font-semibold">{formatNumber(grossWeightKgs, 2)} KGS</td>
              <td className="text-right font-bold">{formatNumber(totalCBM, 3)} CBM</td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="unlk-subtotal-row">
              <td colSpan={3} className="unlk-subtotal-label">{isId ? "Total Konsinyasi" : "Consignment Total"}</td>
              <td className="text-right font-bold">{formatNumber(bagsCount)} {isId ? "KARUNG" : "BAGS"}</td>
              <td className="text-right font-bold">{formatNumber(grossWeightKgs, 2)} KGS</td>
              <td className="text-right font-bold">{formatNumber(totalCBM, 3)} CBM</td>
            </tr>
          </tfoot>
        </table>

        {/* ROW 5: BOTTOM 50/50 SPLIT FOOTER */}
        <div className="unlk-row-50-50">
          <div className="unlk-col-stack unlk-border-r">
            <div className="unlk-cell unlk-flex-fill">
              <div className="unlk-lbl">{isId ? "Instruksi Khusus Dokumen & Penanganan" : "Special Documentary & Handling Instructions"}</div>
              <div className="unlk-bank-lines">
                <div>1. {isId ? "Terbitkan Set Lengkap (3/3) Asli Clean on Board Ocean B/L + 3 Salinan Non-Negotiable." : "Issue Full Set (3/3) Original Clean on Board Ocean B/L + 3 Non-Negotiable Copies."}</div>
                <div>2. {isId ? `Ketentuan Freight: ${incoterm === "FOB" ? "FREIGHT COLLECT" : "FREIGHT PREPAID"} (${incoterm} Makassar, Incoterms® 2020).` : `Freight Term: ${incoterm === "FOB" ? "FREIGHT COLLECT" : "FREIGHT PREPAID"} (${incoterm} Makassar, Incoterms® 2020).`}</div>
                <div>3. {isId ? "Kontainer: Bersih, Kering, Tidak Berbau, Standar Food-Grade 20ft GP Container sesuai untuk bahan pangan." : "Container: Clean, Dry, Odorless, Food-Grade 20ft GP Container suitable for foodstuff."}</div>
                <div>4. {isId ? "Kirim Draf B/L & Draf PEB untuk verifikasi sebelum penerbitan final." : "Send Draft B/L & Draft PEB for verification prior to final issuance."}</div>
              </div>
            </div>
          </div>

          <div className="unlk-col-stack">
            <div className="unlk-cell unlk-border-b unlk-total-bar">
              <span className="unlk-val-bold">{isId ? "TOTAL KARGO:" : "TOTAL CARGO:"}</span>
              <span className="unlk-val-bold">
                {formatNumber(bagsCount)} {isId ? "KARUNG" : "BAGS"} | {formatNumber(grossWeightKgs, 2)} KGS | {formatNumber(totalCBM, 3)} CBM
              </span>
            </div>

            <div className="unlk-subrow-2col unlk-border-b">
              <div className="unlk-cell unlk-border-r">
                <div className="unlk-lbl">{isId ? "Tempat & Tanggal Penerbitan" : "Place and Date of Issue"}</div>
                <div className="unlk-val-bold">MAKASSAR, INDONESIA</div>
              </div>
              <div className="unlk-cell">
                <div className="unlk-lbl">{isId ? "Tanggal Penerbitan" : "Date of Issue"}</div>
                <div className="unlk-val-bold">16 Nov 2026</div>
              </div>
            </div>

            <div className="unlk-cell unlk-border-b">
              <div className="unlk-lbl">{isId ? "Perusahaan Penandatangan" : "Signatory Company"}</div>
              <div className="unlk-val-bold">{exporterName}</div>
            </div>

            <div className="unlk-cell unlk-flex-fill" style={{ minHeight: "105px", padding: "6px 8px" }}>
              <div className="unlk-lbl mb-1">{isId ? "Tanda Tangan & Cap Resmi" : "Authorized Signature & Official Seal"}</div>
              <UnlkSignatureBox
                shipment={shipment}
                exporterName={exporterName}
                signatoryName={sigFull}
                signatoryRole={sigRoleText}
                onOpenSignatureModal={onOpenSignatureModal}
                update={update}
              />
            </div>
          </div>
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
