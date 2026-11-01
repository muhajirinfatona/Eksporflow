import React, { useState, useRef, useEffect } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Subscript,
  Superscript,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Indent,
  Outdent,
  Eraser,
  Undo2,
  Redo2,
  Highlighter,
  Baseline,
  CreditCard,
  FileSignature,
  RotateCcw,
  Check,
  Edit3,
  SlidersHorizontal,
  Sparkles,
  Table,
  Plus,
  Trash2,
  Columns,
  Rows,
  ChevronDown,
  FileText,
  Layout,
  Ruler,
  PanelTop,
  PanelBottom,
  Hash,
  Maximize2,
  TableProperties,
  PaintBucket,
  Grid,
  ArrowDown,
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  MoveHorizontal,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyEnd,
  Square,
} from "lucide-react";
import { toast } from "sonner";
import type { Shipment, PaperSize, DocumentOrientation, DocMarginPreset } from "@shared/shipment";
import { getPaperSizeSpec, getDocMargins, DOC_MARGIN_PRESETS } from "@shared/shipment";
import {
  saveActiveSelection,
  restoreActiveSelection,
  isTextSelected,
  applyInlineStyleToSelection,
  getSelectionFontSize,
  getSelectionFontFamily,
  stepSelectionFontSize,
  changeSelectionCase,
  clearFormattingFromSelection,
} from "../../lib/wordEditorEngine";

interface DocWordRibbonProps {
  shipment: Shipment;
  update: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void;
  isEditMode: boolean;
  setIsEditMode: (val: boolean) => void;
  onOpenSignatureModal: (party?: "seller" | "buyer") => void;
  onResetDocument: () => void;
  onOpenAiScreening?: () => void;
  onOpenBusinessCardOcr?: () => void;
}

export function DocWordRibbon({
  shipment,
  update,
  isEditMode,
  setIsEditMode,
  onOpenSignatureModal,
  onResetDocument,
  onOpenAiScreening,
  onOpenBusinessCardOcr,
}: DocWordRibbonProps) {
  const [activeRibbonTab, setActiveRibbonTab] = useState<"home" | "layout" | "insert" | "table">("home");
  const [isTableSelected, setIsTableSelected] = useState(false);
  const [activeTableTitle, setActiveTableTitle] = useState<string>("Tabel");
  const lastActiveCellRef = useRef<HTMLTableCellElement | null>(null);

  useEffect(() => {
    const handleTableFocus = (e: any) => {
      const detail = e.detail;
      setIsTableSelected(detail?.hasTable !== false);
      if (detail?.table) {
        const t = detail.table as HTMLTableElement;
        if (t.classList.contains("doc-table-pro")) {
          setActiveTableTitle("Rincian Barang Ekspor");
        } else if (t.classList.contains("bank-card-table")) {
          setActiveTableTitle("Rekening Bank Penerima");
        } else if (t.classList.contains("doc-user-table")) {
          setActiveTableTitle("Tabel Kustom");
        } else {
          setActiveTableTitle("Tabel Terpilih");
        }
      }
      if ((window as any).__eksporflow_active_cell) {
        lastActiveCellRef.current = (window as any).__eksporflow_active_cell;
      }
    };
    window.addEventListener("eksporflow:table-focus", handleTableFocus);
    return () => {
      window.removeEventListener("eksporflow:table-focus", handleTableFocus);
    };
  }, []);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [isRibbonCollapsed, setIsRibbonCollapsed] = useState(false);
  const [showMarginPopover, setShowMarginPopover] = useState(false);

  // Table creator state
  const [showTableMenu, setShowTableMenu] = useState(false);
  const [customRows, setCustomRows] = useState(3);
  const [customCols, setCustomCols] = useState(3);
  const [hoverGrid, setHoverGrid] = useState<{ r: number; c: number }>({ r: 0, c: 0 });
  const tableMenuRef = useRef<HTMLDivElement>(null);
  const marginMenuRef = useRef<HTMLDivElement>(null);

  // Live dynamic selection tracking inside .paper-document (Microsoft Word Fidelity)
  const [selectedFontSize, setSelectedFontSize] = useState<number | null>(null);
  const [selectedFontFamily, setSelectedFontFamily] = useState<string | null>(null);
  const [hasBlockedText, setHasBlockedText] = useState(false);

  useEffect(() => {
    const handleSelectionChange = () => {
      const selected = isTextSelected();
      setHasBlockedText(selected);
      if (selected) {
        saveActiveSelection();
        const pt = getSelectionFontSize();
        const font = getSelectionFontFamily();
        setSelectedFontSize(pt);
        setSelectedFontFamily(font);
      } else {
        setSelectedFontSize(null);
        setSelectedFontFamily(null);
      }
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, []);

  const activeFontFamily = selectedFontFamily || shipment.docEditorFontFamily || "Calibri";
  const activeFontSize = selectedFontSize ?? (shipment.docEditorFontSize || 11);
  const activeLineHeight = shipment.docEditorLineHeight || 1.35;
  const activePaperSize: PaperSize = shipment.paperSize || "A4";
  const activeOrientation: DocumentOrientation = shipment.documentOrientation || "Portrait";
  const docMargins = getDocMargins(shipment);

  const handlePaperSizeChange = (newSize: PaperSize) => {
    update("paperSize", newSize);
    const spec = getPaperSizeSpec(newSize);
    toast.success(`Ukuran kertas diatur: ${spec.label}`, {
      description: spec.description,
    });
  };

  const handleOrientationChange = (newOrientation: DocumentOrientation) => {
    update("documentOrientation", newOrientation);
    toast.success(
      `Orientasi kertas: ${newOrientation === "Landscape" ? "Lanskap (Mendatar)" : "Potret (Tegak)"}`
    );
  };

  const handleMarginPresetChange = (preset: DocMarginPreset) => {
    update("docMarginPreset", preset);
    if (preset !== "Kustom" && DOC_MARGIN_PRESETS[preset]) {
      const spec = DOC_MARGIN_PRESETS[preset];
      update("docMarginTop", spec.top);
      update("docMarginBottom", spec.bottom);
      update("docMarginLeft", spec.left);
      update("docMarginRight", spec.right);
      toast.success(`Margin kertas diatur ke ${preset}`, {
        description: spec.label,
      });
    }
  };

  const handleCustomMarginInput = (side: "top" | "bottom" | "left" | "right", val: number) => {
    update("docMarginPreset", "Kustom");
    if (side === "top") update("docMarginTop", val);
    if (side === "bottom") update("docMarginBottom", val);
    if (side === "left") update("docMarginLeft", val);
    if (side === "right") update("docMarginRight", val);
  };

  const toggleHeader = () => {
    const next = shipment.docHeaderEnabled === false;
    update("docHeaderEnabled", next);
    toast.info(next ? "Header dokumen diaktifkan" : "Header dokumen dinonaktifkan");
  };

  const toggleFooter = () => {
    const next = shipment.docFooterEnabled === false;
    update("docFooterEnabled", next);
    toast.info(next ? "Footer dokumen diaktifkan" : "Footer dokumen dinonaktifkan");
  };

  const togglePageNumber = () => {
    const next = shipment.docShowPageNumber === false;
    update("docShowPageNumber", next);
    toast.info(next ? "Nomor halaman diaktifkan" : "Nomor halaman disembunyikan");
  };

  const toggleRuler = () => {
    const next = shipment.docShowRuler === false;
    update("docShowRuler", next);
    toast.info(next ? "Penggaris Word ditampilkan" : "Penggaris Word disembunyikan");
  };

  // Click outside to close table and margin popovers
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tableMenuRef.current && !tableMenuRef.current.contains(event.target as Node)) {
        setShowTableMenu(false);
      }
      if (marginMenuRef.current && !marginMenuRef.current.contains(event.target as Node)) {
        setShowMarginPopover(false);
      }
    }
    if (showTableMenu || showMarginPopover) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showTableMenu, showMarginPopover]);

  // Execute formatting command while preserving selection
  const runCommand = (command: string, value: string | undefined = undefined) => {
    restoreActiveSelection();
    try {
      document.execCommand(command, false, value);
    } catch {
      // Fallback
    }
  };

  const handleFontFamilyChange = (font: string) => {
    // 1. If text is blocked/selected, apply style ONLY to the selected text segment
    if (isTextSelected()) {
      const success = applyInlineStyleToSelection({ "font-family": font });
      if (success) {
        setSelectedFontFamily(font);
        toast.success(`Jenis huruf teks terpilih diubah ke ${font} (teks lain tidak berubah)`);
        return;
      }
    }

    // 2. Document-wide font family
    update("docEditorFontFamily", font);
    setSelectedFontFamily(font);
    runCommand("fontName", font);
    toast.success(`Jenis huruf seluruh dokumen diubah ke ${font}`);
  };

  const handleFontSizeChange = (size: number) => {
    // 1. If text is blocked/selected, apply style ONLY to the selected text segment
    if (isTextSelected()) {
      const success = applyInlineStyleToSelection({ "font-size": `${size}pt` });
      if (success) {
        setSelectedFontSize(size);
        toast.success(`Ukuran teks terpilih diubah ke ${size} pt (teks lain tidak terpengaruh)`);
        return;
      }
    }

    // 2. Document-wide font size: updates document base size
    update("docEditorFontSize", size);
    setSelectedFontSize(size);
    toast.success(`Ukuran tulisan seluruh dokumen diubah ke ${size} pt`);
  };

  const stepFontSize = (delta: number) => {
    if (isTextSelected()) {
      const nextSize = stepSelectionFontSize(delta);
      if (nextSize !== null) {
        setSelectedFontSize(nextSize);
        toast.success(`Ukuran teks terpilih: ${nextSize} pt`);
        return;
      }
    }

    const current = Number(shipment.docEditorFontSize || 11);
    const nextSize = Math.max(7, Math.min(36, Math.round((current + delta) * 2) / 2));
    handleFontSizeChange(nextSize);
  };

  const handleLineHeightChange = (lh: number) => {
    update("docEditorLineHeight", lh);
  };

  const handleTextColor = (color: string) => {
    restoreActiveSelection();
    if (isTextSelected()) {
      applyInlineStyleToSelection({ color: color });
      toast.success("Warna teks terpilih diubah");
    } else {
      runCommand("foreColor", color);
    }
    setShowColorPicker(false);
  };

  const handleHighlightColor = (color: string) => {
    restoreActiveSelection();
    if (isTextSelected()) {
      applyInlineStyleToSelection({ "background-color": color });
      toast.success("Warna sorotan teks terpilih diterapkan");
    } else {
      runCommand("hiliteColor", color);
    }
    setShowHighlightPicker(false);
  };

  const handleCaseChange = () => {
    restoreActiveSelection();
    if (isTextSelected()) {
      changeSelectionCase();
      toast.success("Kapitalisasi teks terpilih diubah");
    } else {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      const selectedText = selection.toString();
      if (!selectedText) return;

      const isAllUpper = selectedText === selectedText.toUpperCase();
      const transformed = isAllUpper
        ? selectedText.toLowerCase()
        : selectedText.toUpperCase();
      runCommand("insertText", transformed);
    }
  };

  const handleClearFormat = () => {
    restoreActiveSelection();
    if (isTextSelected()) {
      clearFormattingFromSelection();
      toast.success("Format teks terpilih dibersihkan");
    } else {
      runCommand("removeFormat");
    }
  };

  // --- Enhanced Microsoft Word Table Operations ---
  const getTargetTableAndCell = () => {
    // 1. Current live cursor/selection in paper document (Highest Priority)
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const node = sel.anchorNode;
      const el = node instanceof Element ? node : node?.parentElement;
      const currentCell = el?.closest("td, th") as HTMLTableCellElement | null;
      if (currentCell && document.contains(currentCell)) {
        const currentTable = currentCell.closest("table");
        if (currentTable) {
          return { table: currentTable, cell: currentCell, row: currentCell.closest("tr") };
        }
      }
    }

    // 2. Focused active element in DOM
    const activeEl = document.activeElement;
    if (activeEl) {
      const activeCell = activeEl.closest("td, th") as HTMLTableCellElement | null;
      if (activeCell && document.contains(activeCell)) {
        const currentTable = activeCell.closest("table");
        if (currentTable) {
          return { table: currentTable, cell: activeCell, row: activeCell.closest("tr") };
        }
      }
    }

    // 3. Explicitly active cell / table in paper document
    const paper = document.querySelector(".paper-document");
    const activeCell = paper?.querySelector("td.active-cell, th.active-cell") as HTMLTableCellElement | null;
    if (activeCell && document.contains(activeCell)) {
      const currentTable = activeCell.closest("table");
      if (currentTable) {
        return { table: currentTable, cell: activeCell, row: activeCell.closest("tr") };
      }
    }

    const activeTable = paper?.querySelector("table.active-table") as HTMLTableElement | null;
    if (activeTable && document.contains(activeTable)) {
      const cell = activeTable.querySelector("td.active-cell, th.active-cell, td, th") as HTMLTableCellElement | null;
      return { table: activeTable, cell, row: cell?.closest("tr") || null };
    }

    // 4. From window variable (set by recent click in paper document)
    const winCell = (window as any).__eksporflow_active_cell as HTMLTableCellElement | null;
    if (winCell && document.contains(winCell)) {
      const currentTable = winCell.closest("table");
      if (currentTable) {
        return { table: currentTable, cell: winCell, row: winCell.closest("tr") };
      }
    }

    const winTable = (window as any).__eksporflow_active_table as HTMLTableElement | null;
    if (winTable && document.contains(winTable)) {
      const cell = winTable.querySelector("td, th") as HTMLTableCellElement | null;
      return { table: winTable, cell, row: cell?.closest("tr") || null };
    }

    // 5. From ref
    if (lastActiveCellRef.current && document.contains(lastActiveCellRef.current)) {
      const cell = lastActiveCellRef.current;
      const currentTable = cell.closest("table");
      if (currentTable) {
        return { table: currentTable, cell, row: cell.closest("tr") };
      }
    }

    return { table: null, cell: null, row: null };
  };

  const reindexTableNumbers = (table: HTMLTableElement) => {
    const tbody = table.querySelector("tbody");
    if (!tbody) return;
    const firstTh = table.querySelector("thead th");
    const isNumbered = firstTh && /^(no|#|\d+)$/i.test(firstTh.textContent?.trim() || "");
    if (!isNumbered) return;

    const rows = tbody.querySelectorAll("tr");
    let counter = 1;
    rows.forEach((r) => {
      if (!r.classList.contains("doc-table-total-row") && r.parentElement?.tagName !== "TFOOT") {
        const firstTd = r.querySelector("td");
        if (firstTd) {
          firstTd.innerText = String(counter++);
        }
      }
    });
  };

  const insertTable = (rows: number, cols: number) => {
    if (rows <= 0 || cols <= 0) return;

    let tableHtml = `<table class="doc-user-table" style="width: 100%; border-collapse: collapse; margin: 12px 0; font-size: inherit; border: 1.5px solid #0f2942;"><thead><tr style="background: #0f2942; color: #ffffff;">`;
    for (let c = 1; c <= cols; c++) {
      tableHtml += `<th style="border: 1px solid #1e3a5f; padding: 6px 10px; font-weight: 700; color: #ffffff; text-align: left;">Kolom ${c}</th>`;
    }
    tableHtml += `</tr></thead><tbody>`;

    for (let r = 1; r <= rows; r++) {
      tableHtml += `<tr style="border-bottom: 1px solid #cbd5e1;">`;
      for (let c = 1; c <= cols; c++) {
        tableHtml += `<td style="border: 1px solid #cbd5e1; padding: 6px 10px; color: #0f172a; vertical-align: top;">Data ${r}.${c}</td>`;
      }
      tableHtml += `</tr>`;
    }
    tableHtml += `</tbody></table><p><br></p>`;

    runCommand("insertHTML", tableHtml);
    setShowTableMenu(false);
    toast.success(`Tabel ${rows} × ${cols} berhasil disisipkan`);
  };

  const insertTableRow = (direction: "above" | "below" = "below") => {
    const { table, row } = getTargetTableAndCell();
    if (!table) {
      toast.error("Klik di dalam tabel terlebih dahulu");
      return;
    }

    const tbody = table.querySelector("tbody") || table;
    let targetRow = row;
    if (targetRow && targetRow.parentElement?.tagName === "THEAD") {
      targetRow = tbody.querySelector("tr") || null;
    }
    if (targetRow && (targetRow.parentElement?.tagName === "TFOOT" || targetRow.classList.contains("doc-table-total-row"))) {
      const tbodyRows = tbody.querySelectorAll("tr");
      targetRow = tbodyRows[tbodyRows.length - 1] || null;
    }

    const sampleRow = tbody.querySelector("tr") || table.querySelector("thead tr");
    const colCount = sampleRow ? sampleRow.children.length : (table.rows[0]?.cells.length || 3);

    const newRow = document.createElement("tr");
    newRow.style.borderBottom = "1px solid #e2e8f0";

    const isDocTablePro = table.classList.contains("doc-table-pro");
    const existingBodyRows = tbody.querySelectorAll("tr:not(.doc-table-total-row)");
    const nextItemNo = existingBodyRows.length + 1;

    for (let c = 0; c < colCount; c++) {
      const newCell = document.createElement("td");
      newCell.style.padding = "8px 10px";
      newCell.style.border = "1px solid #e2e8f0";
      newCell.style.verticalAlign = "top";
      newCell.style.color = "#0f172a";

      if (isDocTablePro) {
        if (c === 0) {
          newCell.className = "text-center font-normal";
          newCell.innerText = String(nextItemNo);
        } else if (c === 1) {
          newCell.innerHTML = `<b class="table-product-title">Item Baru ${nextItemNo}</b><ul class="table-product-specs"><li>Spesifikasi: Mutu Ekspor Standar</li><li>Kemasan: Karung / Kotak Ekspor</li></ul>`;
        } else if (c === 2) {
          newCell.className = "text-center font-normal";
          newCell.innerText = "-";
        } else if (c === 3) {
          newCell.className = "text-right font-normal";
          newCell.innerText = "0 MT";
        } else if (c === 4) {
          newCell.className = "text-right font-normal";
          newCell.innerText = "$0.00 / MT";
        } else {
          newCell.className = "text-right font-bold text-slate-900";
          newCell.innerText = "$0.00";
        }
      } else {
        newCell.innerText = `Data ${nextItemNo}.${c + 1}`;
      }
      newRow.appendChild(newCell);
    }

    if (targetRow && targetRow.parentElement) {
      if (direction === "above") {
        targetRow.parentElement.insertBefore(newRow, targetRow);
      } else {
        targetRow.parentElement.insertBefore(newRow, targetRow.nextSibling);
      }
    } else {
      tbody.appendChild(newRow);
    }

    reindexTableNumbers(table);
    toast.success(`Baris baru berhasil ditambahkan ${direction === "above" ? "di atas" : "di bawah"}!`);
  };

  const addTableRow = () => insertTableRow("below");
  const addTableCol = () => insertTableCol("right");

  const deleteTableRow = () => {
    const { table, row } = getTargetTableAndCell();
    if (!row) {
      toast.error("Klik sel baris yang ingin dihapus");
      return;
    }
    if (row.parentElement?.tagName === "THEAD") {
      toast.error("Baris header judul kolom tidak dapat dihapus");
      return;
    }
    if (row.parentElement?.tagName === "TFOOT" || row.classList.contains("doc-table-total-row")) {
      toast.error("Baris total faktur tidak dapat dihapus");
      return;
    }
    row.remove();
    if (table) {
      reindexTableNumbers(table);
    }
    toast.info("Baris tabel berhasil dihapus.");
  };

  const insertTableCol = (direction: "left" | "right" = "right") => {
    const { table, cell } = getTargetTableAndCell();
    if (!table) {
      toast.error("Klik di dalam tabel terlebih dahulu");
      return;
    }
    const colIndex = cell ? cell.cellIndex : (table.rows[0]?.cells.length || 0);
    const targetIndex = direction === "left" ? colIndex : colIndex + 1;

    // Update thead
    const thead = table.querySelector("thead");
    if (thead) {
      thead.querySelectorAll("tr").forEach((hRow) => {
        const th = document.createElement("th");
        th.style.padding = "8px 10px";
        th.style.background = "#0f2942";
        th.style.color = "#ffffff";
        th.style.border = "1px solid #1e3a5f";
        th.style.fontSize = "10px";
        th.style.fontWeight = "700";
        th.style.letterSpacing = "0.06em";
        th.style.textTransform = "uppercase";
        th.innerText = "KOLOM BARU";
        if (targetIndex >= hRow.children.length) {
          hRow.appendChild(th);
        } else {
          hRow.insertBefore(th, hRow.children[targetIndex]);
        }
      });
    }

    // Update tbody
    const tbody = table.querySelector("tbody") || table;
    tbody.querySelectorAll("tr:not(.doc-table-total-row)").forEach((bRow) => {
      const td = document.createElement("td");
      td.style.padding = "8px 10px";
      td.style.border = "1px solid #e2e8f0";
      td.style.color = "#0f172a";
      td.innerText = "-";
      if (targetIndex >= bRow.children.length) {
        bRow.appendChild(td);
      } else {
        bRow.insertBefore(td, bRow.children[targetIndex]);
      }
    });

    // Update tfoot colSpan if present
    const tfoot = table.querySelector("tfoot");
    if (tfoot) {
      const totalCell = tfoot.querySelector("td");
      if (totalCell && totalCell.colSpan) {
        totalCell.colSpan += 1;
      }
    }

    toast.success(`Kolom baru berhasil ditambahkan ${direction === "left" ? "di kiri" : "di kanan"}!`);
  };

  const deleteTableCol = () => {
    const { table, cell } = getTargetTableAndCell();
    if (!table || !cell) {
      toast.error("Klik sel kolom yang ingin dihapus");
      return;
    }
    const colIndex = cell.cellIndex;
    const headerCols = table.querySelector("thead tr, tr")?.children.length || 0;
    if (headerCols <= 1) {
      toast.error("Tabel harus memiliki minimal 1 kolom.");
      return;
    }

    table.querySelectorAll("thead tr, tbody tr").forEach((row) => {
      if (!row.classList.contains("doc-table-total-row") && row.children[colIndex]) {
        row.children[colIndex].remove();
      }
    });

    const tfoot = table.querySelector("tfoot");
    if (tfoot) {
      const totalCell = tfoot.querySelector("td");
      if (totalCell && totalCell.colSpan > 1) {
        totalCell.colSpan -= 1;
      }
    }

    toast.info("Kolom tabel dihapus.");
  };

  const deleteTable = () => {
    const { table } = getTargetTableAndCell();
    if (!table) {
      toast.error("Klik tabel yang ingin dihapus");
      return;
    }
    table.remove();
    setIsTableSelected(false);
    toast.info("Tabel berhasil dihapus dari dokumen.");
  };

  const adjustColWidth = (deltaPx: number) => {
    const { table, cell } = getTargetTableAndCell();
    if (!table || !cell) {
      toast.error("Klik sel kolom yang ingin diatur lebarnya");
      return;
    }
    const colIndex = cell.cellIndex;
    const th = (table.querySelector(`thead tr th:nth-child(${colIndex + 1})`) as HTMLElement | null) || cell;
    const currentWidth = th.offsetWidth;
    const newWidth = Math.max(30, currentWidth + deltaPx);
    th.style.width = `${newWidth}px`;

    table.querySelectorAll(`tbody tr td:nth-child(${colIndex + 1})`).forEach((td) => {
      (td as HTMLElement).style.width = `${newWidth}px`;
    });

    toast.success(`Lebar kolom diatur ke ${newWidth}px`);
  };

  const distributeColumnsEvenly = () => {
    const { table } = getTargetTableAndCell();
    if (!table) {
      toast.error("Klik di dalam tabel terlebih dahulu");
      return;
    }
    const thList = table.querySelectorAll("thead th");
    if (thList.length > 0) {
      const pct = (100 / thList.length).toFixed(1);
      thList.forEach((th) => {
        (th as HTMLElement).style.width = `${pct}%`;
      });
      table.querySelectorAll("tbody td").forEach((td) => {
        (td as HTMLElement).style.width = "auto";
      });
      toast.success("Seluruh kolom telah diratakan sama rata.");
    }
  };

  const autoFitColumns = () => {
    const { table } = getTargetTableAndCell();
    if (!table) {
      toast.error("Klik di dalam tabel terlebih dahulu");
      return;
    }
    table.querySelectorAll("th, td").forEach((c) => {
      (c as HTMLElement).style.width = "auto";
    });
    table.style.width = "100%";
    toast.success("Lebar kolom otomatis disesuaikan dengan isi teks.");
  };

  const setCellAlign = (align: "left" | "center" | "right" | "justify") => {
    const { cell } = getTargetTableAndCell();
    if (!cell) {
      toast.error("Pilih sel tabel terlebih dahulu");
      return;
    }
    cell.style.textAlign = align;
    toast.success(`Perataan teks: ${align}`);
  };

  const setCellVAlign = (vAlign: "top" | "middle" | "bottom") => {
    const { cell } = getTargetTableAndCell();
    if (!cell) {
      toast.error("Pilih sel tabel terlebih dahulu");
      return;
    }
    cell.style.verticalAlign = vAlign;
    toast.success(`Perataan vertikal: ${vAlign}`);
  };

  const setCellPadding = (preset: "compact" | "normal" | "spacious") => {
    const { table, cell } = getTargetTableAndCell();
    if (!table) {
      toast.error("Pilih sel atau tabel terlebih dahulu");
      return;
    }
    const paddingVal = preset === "compact" ? "4px 6px" : preset === "spacious" ? "12px 14px" : "8px 10px";
    if (cell) {
      cell.style.padding = paddingVal;
    } else {
      table.querySelectorAll("td, th").forEach((c) => {
        (c as HTMLElement).style.padding = paddingVal;
      });
    }
    toast.success(`Padding sel: ${preset}`);
  };

  const setTableBorderPreset = (preset: "all" | "horizontal" | "outer" | "none") => {
    const { table } = getTargetTableAndCell();
    if (!table) {
      toast.error("Pilih tabel terlebih dahulu");
      return;
    }
    if (preset === "all") {
      table.style.border = "1.5px solid #0f2942";
      table.querySelectorAll("th, td").forEach((c) => {
        (c as HTMLElement).style.border = "1px solid #cbd5e1";
      });
      toast.success("Gaya border: Semua Garis (Grid)");
    } else if (preset === "horizontal") {
      table.style.border = "none";
      table.querySelectorAll("th, td").forEach((c) => {
        (c as HTMLElement).style.borderLeft = "none";
        (c as HTMLElement).style.borderRight = "none";
        (c as HTMLElement).style.borderTop = "1px solid #e2e8f0";
        (c as HTMLElement).style.borderBottom = "1px solid #cbd5e1";
      });
      toast.success("Gaya border: Garis Horizontal Saja");
    } else if (preset === "outer") {
      table.style.border = "2px solid #0f2942";
      table.querySelectorAll("th, td").forEach((c) => {
        (c as HTMLElement).style.border = "none";
      });
      toast.success("Gaya border: Garis Luar Saja");
    } else if (preset === "none") {
      table.style.border = "none";
      table.querySelectorAll("th, td").forEach((c) => {
        (c as HTMLElement).style.border = "none";
      });
      toast.success("Gaya border: Tanpa Garis");
    }
  };

  const setCellBackground = (bgColor: string) => {
    const { cell } = getTargetTableAndCell();
    if (!cell) {
      toast.error("Pilih sel terlebih dahulu");
      return;
    }
    cell.style.backgroundColor = bgColor;
    if (bgColor === "#0f2942") {
      cell.style.color = "#ffffff";
    } else if (bgColor === "#ffffff" || bgColor === "transparent" || bgColor === "#f8fafc") {
      cell.style.color = "#0f172a";
    }
    toast.success("Warna latar sel diterapkan.");
  };

  const setTablePreset = (preset: "corporate" | "zebra" | "minimal") => {
    const { table } = getTargetTableAndCell();
    if (!table) {
      toast.error("Pilih tabel terlebih dahulu");
      return;
    }
    const tbody = table.querySelector("tbody") || table;
    const rows = tbody.querySelectorAll("tr:not(.doc-table-total-row)");

    if (preset === "corporate") {
      table.querySelectorAll("thead th").forEach((th) => {
        (th as HTMLElement).style.background = "#0f2942";
        (th as HTMLElement).style.color = "#ffffff";
      });
      rows.forEach((r) => {
        (r as HTMLElement).style.backgroundColor = "#ffffff";
      });
      toast.success("Gaya Tabel: Standar Ekspor Corporate");
    } else if (preset === "zebra") {
      table.querySelectorAll("thead th").forEach((th) => {
        (th as HTMLElement).style.background = "#1e293b";
        (th as HTMLElement).style.color = "#ffffff";
      });
      rows.forEach((r, idx) => {
        (r as HTMLElement).style.backgroundColor = idx % 2 === 1 ? "#f8fafc" : "#ffffff";
      });
      toast.success("Gaya Tabel: Zebra Striping");
    } else if (preset === "minimal") {
      table.querySelectorAll("thead th").forEach((th) => {
        (th as HTMLElement).style.background = "#f1f5f9";
        (th as HTMLElement).style.color = "#0f172a";
      });
      rows.forEach((r) => {
        (r as HTMLElement).style.backgroundColor = "#ffffff";
      });
      toast.success("Gaya Tabel: Minimalis Bersih");
    }
  };

  return (
    <div className="doc-word-ribbon-container">
      {/* 1. Ribbon Title Bar */}
      <div className="doc-ribbon-top-bar">
        <div className="doc-ribbon-brand">
          <div className="doc-word-icon-badge">W</div>
          <span className="doc-ribbon-title">EksporFlow Word Editor</span>
          <span className="doc-ribbon-subtitle">Format & Tata Letak Resmi</span>
        </div>

        <div className="doc-ribbon-top-actions">
          {/* Toggle WYSIWYG Edit Mode */}
          <button
            type="button"
            className={`doc-ribbon-mode-toggle ${isEditMode ? "active" : ""}`}
            onClick={() => {
              const next = !isEditMode;
              setIsEditMode(next);
              update("docEditorMode", next);
              if (next) {
                toast.success("Mode Edit Word Aktif", {
                  description: "Anda kini dapat mengeklik dan mengetik langsung isi surat/kontrak di kertas dokumen.",
                });
              } else {
                toast.info("Mode Pratinjau Terkunci", {
                  description: "Teks terkunci untuk pratinjau cetak dan ekspor resmi.",
                });
              }
            }}
            title="Aktifkan atau kunci mode pengetikan langsung di kertas"
          >
            <Edit3 size={13} />
            <span>{isEditMode ? "Mode Edit Aktif" : "Mode Pratinjau"}</span>
            <div className={`doc-mode-dot ${isEditMode ? "on" : "off"}`} />
          </button>

          {/* Minimize / Expand Ribbon */}
          <button
            type="button"
            className="doc-ribbon-collapse-btn"
            onClick={() => setIsRibbonCollapsed((prev) => !prev)}
            title={isRibbonCollapsed ? "Tampilkan Ribbon Penuh" : "Ciutkan Ribbon"}
          >
            {isRibbonCollapsed ? "▼ Buka" : "▲ Ciutkan"}
          </button>
        </div>
      </div>

      {/* 2. Word Ribbon Tab Navigation (Beranda · Tata Letak · Sisipkan · Alat Tabel) */}
      {!isRibbonCollapsed && (
        <div className="doc-ribbon-tab-nav">
          <button
            type="button"
            className={`doc-ribbon-tab-btn ${activeRibbonTab === "home" ? "active" : ""}`}
            onClick={() => setActiveRibbonTab("home")}
          >
            Beranda (Home)
          </button>
          <button
            type="button"
            className={`doc-ribbon-tab-btn ${activeRibbonTab === "layout" ? "active" : ""}`}
            onClick={() => setActiveRibbonTab("layout")}
          >
            Tata Letak (Layout & Margin)
          </button>
          <button
            type="button"
            className={`doc-ribbon-tab-btn ${activeRibbonTab === "insert" ? "active" : ""}`}
            onClick={() => setActiveRibbonTab("insert")}
          >
            Sisipkan (Insert & Header)
          </button>
          <button
            type="button"
            className={`doc-ribbon-tab-btn doc-ribbon-tab-table ${activeRibbonTab === "table" ? "active" : ""} ${isTableSelected ? "highlighted" : ""}`}
            onClick={() => setActiveRibbonTab("table")}
            title="Alat Tabel Word: Desain, Baris, Kolom, Lebar, Garis & Perataan"
          >
            <TableProperties size={13} className="mr-1 inline" />
            <span>Alat Tabel {isTableSelected && "●"}</span>
          </button>
        </div>
      )}

      {/* 3. Main Ribbon Tools Strip */}
      {!isRibbonCollapsed && (
        <div className="doc-ribbon-tools-strip">
          {/* ================= TAB 1: BERANDA (HOME) ================= */}
          {activeRibbonTab === "home" && (
            <>
              {/* Quick Undo / Redo */}
              <div className="doc-ribbon-group group-history">
                <button
                  type="button"
                  className="doc-ribbon-btn-icon"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    runCommand("undo");
                  }}
                  title="Undo / Urungkan (Ctrl+Z)"
                >
                  <Undo2 size={14} />
                </button>
                <button
                  type="button"
                  className="doc-ribbon-btn-icon"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    runCommand("redo");
                  }}
                  title="Redo / Ulangi (Ctrl+Y)"
                >
                  <Redo2 size={14} />
                </button>
                <span className="doc-ribbon-group-label">Riwayat</span>
              </div>

              <div className="doc-ribbon-divider" />

              {/* Font Controls Group */}
              <div className="doc-ribbon-group group-font">
                <div className="doc-ribbon-row-top">
                  {/* Font Family Dropdown */}
                  <select
                    className="doc-ribbon-select font-family-select"
                    value={activeFontFamily}
                    onFocus={() => saveActiveSelection()}
                    onMouseDown={() => saveActiveSelection()}
                    onChange={(e) => handleFontFamilyChange(e.target.value)}
                    title="Pilih Jenis Huruf (Font Family)"
                  >
                    <option value="Calibri">Calibri</option>
                    <option value="Arial">Arial</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Inter">Inter (Modern Clean)</option>
                    <option value="Georgia">Georgia (Serif Formal)</option>
                    <option value="Garamond">Garamond (Klasik Legal)</option>
                    <option value="Trebuchet MS">Trebuchet MS</option>
                    <option value="Courier New">Courier New (Monospace Pabean)</option>
                  </select>

                  {/* Font Size Dropdown (Word Standar Point pt) */}
                  <select
                    className="doc-ribbon-select font-size-select"
                    value={activeFontSize}
                    onFocus={() => saveActiveSelection()}
                    onMouseDown={() => saveActiveSelection()}
                    onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                    title="Ukuran Huruf Dokumen (Font Size dalam pt)"
                  >
                    <option value="7">7 pt (Sangat Kecil)</option>
                    <option value="8">8 pt</option>
                    <option value="8.5">8.5 pt</option>
                    <option value="9">9 pt (Word Ringkas / Kecil)</option>
                    <option value="9.5">9.5 pt</option>
                    <option value="10">10 pt</option>
                    <option value="10.5">10.5 pt (Standar Calibri/Arial)</option>
                    <option value="11">11 pt (Standar Word Modern)</option>
                    <option value="11.5">11.5 pt</option>
                    <option value="12">12 pt (Standar Ekspor Formal)</option>
                    <option value="12.5">12.5 pt</option>
                    <option value="13">13 pt</option>
                    <option value="14">14 pt (Subheading)</option>
                    <option value="16">16 pt (Heading)</option>
                    <option value="18">18 pt (Judul Besar)</option>
                    <option value="20">20 pt</option>
                    <option value="24">24 pt (Judul Utama)</option>
                    <option value="28">28 pt</option>
                    <option value="36">36 pt</option>
                    {!["7", "8", "8.5", "9", "9.5", "10", "10.5", "11", "11.5", "12", "12.5", "13", "14", "16", "18", "20", "24", "28", "36"].includes(String(activeFontSize)) && (
                      <option value={activeFontSize}>{activeFontSize} pt</option>
                    )}
                  </select>

                  {/* Grow / Shrink Font Buttons */}
                  <button
                    type="button"
                    className="doc-ribbon-btn-icon"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      stepFontSize(1);
                    }}
                    title="Perbesar Ukuran Font (A▲)"
                  >
                    <span style={{ fontSize: "13px", fontWeight: "bold" }}>A<sup style={{ fontSize: "9px" }}>▲</sup></span>
                  </button>
                  <button
                    type="button"
                    className="doc-ribbon-btn-icon"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      stepFontSize(-1);
                    }}
                    title="Perkecil Ukuran Font (A▼)"
                  >
                    <span style={{ fontSize: "11px", fontWeight: "bold" }}>A<sub style={{ fontSize: "9px" }}>▼</sub></span>
                  </button>

                  {/* Change Case (Aa) */}
                  <button
                    type="button"
                    className="doc-ribbon-btn-icon"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleCaseChange();
                    }}
                    title="Ubah Kapitalisasi (HURUF BESAR / kecil)"
                  >
                    <span style={{ fontSize: "12px", fontWeight: 700 }}>Aa</span>
                  </button>

                  {/* Clear Formatting */}
                  <button
                    type="button"
                    className="doc-ribbon-btn-icon"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleClearFormat();
                    }}
                    title="Hapus Pemformatan Teks"
                  >
                    <Eraser size={14} />
                  </button>
                </div>

                <div className="doc-ribbon-row-bottom">
                  {/* Bold */}
                  <button
                    type="button"
                    className="doc-ribbon-btn-icon"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      runCommand("bold");
                    }}
                    title="Tebalkan Teks (Bold · Ctrl+B)"
                  >
                    <Bold size={13} />
                  </button>

                  {/* Italic */}
                  <button
                    type="button"
                    className="doc-ribbon-btn-icon"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      runCommand("italic");
                    }}
                    title="Miringkan Teks (Italic · Ctrl+I)"
                  >
                    <Italic size={13} />
                  </button>

                  {/* Underline */}
                  <button
                    type="button"
                    className="doc-ribbon-btn-icon"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      runCommand("underline");
                    }}
                    title="Garis Bawah (Underline · Ctrl+U)"
                  >
                    <Underline size={13} />
                  </button>

                  {/* Strikethrough */}
                  <button
                    type="button"
                    className="doc-ribbon-btn-icon"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      runCommand("strikeThrough");
                    }}
                    title="Coret Teks (Strikethrough)"
                  >
                    <Strikethrough size={13} />
                  </button>

                  {/* Subscript */}
                  <button
                    type="button"
                    className="doc-ribbon-btn-icon"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      runCommand("subscript");
                    }}
                    title="Subskrip (x₂)"
                  >
                    <Subscript size={13} />
                  </button>

                  {/* Superscript */}
                  <button
                    type="button"
                    className="doc-ribbon-btn-icon"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      runCommand("superscript");
                    }}
                    title="Superskrip (x²)"
                  >
                    <Superscript size={13} />
                  </button>

                  {/* Text Highlight Color */}
                  <div className="doc-ribbon-color-wrap">
                    <button
                      type="button"
                      className="doc-ribbon-btn-icon doc-color-trigger"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        saveActiveSelection();
                      }}
                      onClick={() => setShowHighlightPicker((prev) => !prev)}
                      title="Warna Sorotan Teks (Highlighter)"
                    >
                      <Highlighter size={13} />
                      <div className="doc-color-bar highlight" />
                    </button>
                    {showHighlightPicker && (
                      <div className="doc-color-dropdown">
                        <button type="button" className="color-swatch swatch-yellow" onMouseDown={(e) => e.preventDefault()} onClick={() => handleHighlightColor("#fef08a")} />
                        <button type="button" className="color-swatch swatch-green" onMouseDown={(e) => e.preventDefault()} onClick={() => handleHighlightColor("#bbf7d0")} />
                        <button type="button" className="color-swatch swatch-cyan" onMouseDown={(e) => e.preventDefault()} onClick={() => handleHighlightColor("#bae6fd")} />
                        <button type="button" className="color-swatch swatch-pink" onMouseDown={(e) => e.preventDefault()} onClick={() => handleHighlightColor("#fbcfe8")} />
                        <button type="button" className="color-swatch swatch-clear" onMouseDown={(e) => e.preventDefault()} onClick={() => handleHighlightColor("transparent")} title="Hapus Sorotan">✕</button>
                      </div>
                    )}
                  </div>

                  {/* Font Color */}
                  <div className="doc-ribbon-color-wrap">
                    <button
                      type="button"
                      className="doc-ribbon-btn-icon doc-color-trigger"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        saveActiveSelection();
                      }}
                      onClick={() => setShowColorPicker((prev) => !prev)}
                      title="Warna Font Huruf (Text Color)"
                    >
                      <Baseline size={13} />
                      <div className="doc-color-bar text-color" />
                    </button>
                    {showColorPicker && (
                      <div className="doc-color-dropdown">
                        <button type="button" className="color-swatch swatch-black" onMouseDown={(e) => e.preventDefault()} onClick={() => handleTextColor("#0f172a")} />
                        <button type="button" className="color-swatch swatch-navy" onMouseDown={(e) => e.preventDefault()} onClick={() => handleTextColor("#0f2942")} />
                        <button type="button" className="color-swatch swatch-blue" onMouseDown={(e) => e.preventDefault()} onClick={() => handleTextColor("#1d4ed8")} />
                        <button type="button" className="color-swatch swatch-red" onMouseDown={(e) => e.preventDefault()} onClick={() => handleTextColor("#b91c1c")} />
                        <button type="button" className="color-swatch swatch-gray" onMouseDown={(e) => e.preventDefault()} onClick={() => handleTextColor("#475569")} />
                      </div>
                    )}
                  </div>
                </div>

                <span className="doc-ribbon-group-label">
                  Font ({activeFontSize} pt{hasBlockedText ? " · Teks Terpilih" : ""})
                </span>
              </div>

              <div className="doc-ribbon-divider" />

              {/* Paragraph Group */}
              <div className="doc-ribbon-group group-paragraph">
                <div className="doc-ribbon-row-top">
                  {/* Bulleted List */}
                  <button
                    type="button"
                    className="doc-ribbon-btn-icon"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      runCommand("insertUnorderedList");
                    }}
                    title="Daftar Poin (Bulleted List)"
                  >
                    <List size={14} />
                  </button>

                  {/* Numbered List */}
                  <button
                    type="button"
                    className="doc-ribbon-btn-icon"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      runCommand("insertOrderedList");
                    }}
                    title="Daftar Nomor (Numbered List)"
                  >
                    <ListOrdered size={14} />
                  </button>

                  {/* Outdent */}
                  <button
                    type="button"
                    className="doc-ribbon-btn-icon"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      runCommand("outdent");
                    }}
                    title="Kurangi Inden (Shift+Tab)"
                  >
                    <Outdent size={14} />
                  </button>

                  {/* Indent */}
                  <button
                    type="button"
                    className="doc-ribbon-btn-icon"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      runCommand("indent");
                    }}
                    title="Tambah Inden (Tab)"
                  >
                    <Indent size={14} />
                  </button>

                  {/* Line Spacing Selector */}
                  <select
                    className="doc-ribbon-select line-spacing-select"
                    value={activeLineHeight}
                    onChange={(e) => handleLineHeightChange(Number(e.target.value))}
                    title="Spasi Antar Baris (Line Spacing)"
                  >
                    <option value="1.15">1.15 Spasi Rapat</option>
                    <option value="1.25">1.25 Spasi Formal</option>
                    <option value="1.35">1.35 Spasi Standar Ekspor</option>
                    <option value="1.5">1.50 Spasi Lebar</option>
                  </select>
                </div>

                <div className="doc-ribbon-row-bottom">
                  {/* Align Left */}
                  <button
                    type="button"
                    className="doc-ribbon-btn-icon"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      runCommand("justifyLeft");
                      update("docEditorTextAlign", "left");
                    }}
                    title="Rata Kiri (Align Left · Ctrl+L)"
                  >
                    <AlignLeft size={13} />
                  </button>

                  {/* Align Center */}
                  <button
                    type="button"
                    className="doc-ribbon-btn-icon"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      runCommand("justifyCenter");
                      update("docEditorTextAlign", "center");
                    }}
                    title="Rata Tengah (Align Center · Ctrl+E)"
                  >
                    <AlignCenter size={13} />
                  </button>

                  {/* Align Right */}
                  <button
                    type="button"
                    className="doc-ribbon-btn-icon"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      runCommand("justifyRight");
                      update("docEditorTextAlign", "right");
                    }}
                    title="Rata Kanan (Align Right · Ctrl+R)"
                  >
                    <AlignRight size={13} />
                  </button>

                  {/* Justify */}
                  <button
                    type="button"
                    className="doc-ribbon-btn-icon"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      runCommand("justifyFull");
                      update("docEditorTextAlign", "justify");
                    }}
                    title="Rata Kanan-Kiri (Justify · Ctrl+J)"
                  >
                    <AlignJustify size={13} />
                  </button>
                </div>

                <span className="doc-ribbon-group-label">Paragraf</span>
              </div>

              <div className="doc-ribbon-divider" />

              {/* Quick Table Group on Home Tab (Word standard) */}
              <div className="doc-ribbon-group group-table" ref={tableMenuRef}>
                <div className="doc-ribbon-row-top">
                  <button
                    type="button"
                    className={`doc-ribbon-table-trigger ${showTableMenu ? "active" : ""}`}
                    onClick={() => setShowTableMenu((prev) => !prev)}
                    title="Sisipkan Tabel Baru (Seperti di Microsoft Word)"
                  >
                    <Table size={13} />
                    <span>Tabel</span>
                    <ChevronDown size={11} />
                  </button>

                  <button
                    type="button"
                    className="doc-ribbon-btn-icon"
                    onClick={() => insertTableRow("below")}
                    title="Tambah 1 Baris ke Bawah pada Tabel yang Dipilih"
                  >
                    <Rows size={13} />
                    <span style={{ fontSize: "9px", fontWeight: 800, marginLeft: "1px" }}>+</span>
                  </button>

                  <button
                    type="button"
                    className="doc-ribbon-btn-icon"
                    onClick={() => insertTableCol("right")}
                    title="Tambah 1 Kolom ke Kanan pada Tabel yang Dipilih"
                  >
                    <Columns size={13} />
                    <span style={{ fontSize: "9px", fontWeight: 800, marginLeft: "1px" }}>+</span>
                  </button>
                </div>

                <div className="doc-ribbon-row-bottom">
                  <button
                    type="button"
                    className="doc-ribbon-table-subbtn"
                    onClick={deleteTableRow}
                    title="Hapus Baris Tabel Aktif"
                  >
                    - Baris
                  </button>
                  <button
                    type="button"
                    className="doc-ribbon-table-subbtn"
                    onClick={deleteTableCol}
                    title="Hapus Kolom Tabel Aktif"
                  >
                    - Kolom
                  </button>
                  <button
                    type="button"
                    className="doc-ribbon-table-subbtn danger"
                    onClick={deleteTable}
                    title="Hapus Seluruh Tabel Aktif"
                  >
                    <Trash2 size={11} />
                  </button>
                  <button
                    type="button"
                    className="doc-ribbon-table-subbtn"
                    style={{ color: "#0284c7", fontWeight: 700 }}
                    onClick={() => setActiveRibbonTab("table")}
                    title="Buka Pengaturan Tabel Lengkap (Lebar, Garis, Perataan & Shading)"
                  >
                    Alat Tabel »
                  </button>
                </div>

                <span className="doc-ribbon-group-label">Tabel Word</span>

                {/* Table Insert Popover Modal/Dropdown */}
                {showTableMenu && (
                  <div className="doc-table-popover" role="dialog">
                    <div className="doc-table-popover-header">
                      <span className="popover-title">SISIPKAN TABEL</span>
                      <span className="popover-sub">
                        {hoverGrid.r > 0 && hoverGrid.c > 0 ? `Tabel ${hoverGrid.r} × ${hoverGrid.c}` : "Pilih Ukuran Grid"}
                      </span>
                    </div>

                    <div className="doc-table-grid-picker">
                      {[1, 2, 3, 4, 5].map((r) => (
                        <div key={`row-home-${r}`} className="grid-picker-row">
                          {[1, 2, 3, 4, 5].map((c) => {
                            const isHighlighted = r <= hoverGrid.r && c <= hoverGrid.c;
                            return (
                              <div
                                key={`cell-home-${r}-${c}`}
                                className={`grid-picker-cell ${isHighlighted ? "highlighted" : ""}`}
                                onMouseEnter={() => setHoverGrid({ r, c })}
                                onClick={() => insertTable(r, c)}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>

                    <div className="doc-table-custom-form">
                      <span className="custom-form-title">Ukuran Kustom:</span>
                      <div className="custom-form-inputs">
                        <label>
                          <span>Baris:</span>
                          <input
                            type="number"
                            min="1"
                            max="20"
                            value={customRows}
                            onChange={(e) => setCustomRows(Math.max(1, Number(e.target.value)))}
                          />
                        </label>
                        <label>
                          <span>Kolom:</span>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={customCols}
                            onChange={(e) => setCustomCols(Math.max(1, Number(e.target.value)))}
                          />
                        </label>
                      </div>
                      <button
                        type="button"
                        className="doc-btn-insert-table"
                        onClick={() => insertTable(customRows, customCols)}
                      >
                        <Plus size={13} />
                        <span>Sisipkan Tabel</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="doc-ribbon-divider" />

              {/* VIEW / PENGGARIS GROUP (Tab 1 shortcut) */}
              <div className="doc-ribbon-group group-ruler-shortcut">
                <div className="doc-ribbon-row-top">
                  <button
                    type="button"
                    className={`doc-ribbon-toggle-chip ${shipment.docShowRuler !== false ? "active" : ""}`}
                    onClick={toggleRuler}
                    title="Tampilkan / sembunyikan Penggaris Horizontal Microsoft Word di atas kertas"
                  >
                    <Ruler size={13} />
                    <span>Penggaris</span>
                    {shipment.docShowRuler !== false && <Check size={12} />}
                  </button>
                </div>
                <div className="doc-ribbon-row-bottom">
                  <span className="doc-ruler-stat-txt">
                    {shipment.docShowRuler !== false ? "Aktif" : "Sembunyi"}
                  </span>
                </div>
                <span className="doc-ribbon-group-label">Penggaris</span>
              </div>
            </>
          )}

          {/* ================= TAB 2: TATA LETAK (LAYOUT & MARGIN) ================= */}
          {activeRibbonTab === "layout" && (
            <>
              {/* PAGE MARGINS GROUP (Word Margins) */}
              <div className="doc-ribbon-group group-margins" ref={marginMenuRef}>
                <div className="doc-ribbon-row-top">
                  <div className="doc-ribbon-field-with-icon" title="Pilih Preset Margin Sesuai Microsoft Word">
                    <Maximize2 size={13} className="doc-field-prefix-icon" />
                    <select
                      className="doc-ribbon-select doc-margin-preset-select"
                      value={shipment.docMarginPreset || "Normal"}
                      onChange={(e) => handleMarginPresetChange(e.target.value as DocMarginPreset)}
                      title="Pilih Preset Margin Halaman Microsoft Word"
                    >
                      <option value="Normal">Normal (2.54 cm / 1 in)</option>
                      <option value="Sempit">Sempit (1.27 cm / 0.5 in)</option>
                      <option value="Sedang">Sedang (1.91 cm / 0.75 in)</option>
                      <option value="Lebar">Lebar (5.08 cm / 2.0 in)</option>
                      <option value="Kustom">Kustom (Atur Manual)...</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    className={`doc-ribbon-margin-toggle-btn ${showMarginPopover ? "active" : ""}`}
                    onClick={() => setShowMarginPopover((prev) => !prev)}
                    title="Buka dialog pengaturan margin kustom (Atas, Bawah, Kiri, Kanan)"
                  >
                    <SlidersHorizontal size={12} />
                    <span>Margin Kustom</span>
                    <ChevronDown size={11} />
                  </button>
                </div>

                <div className="doc-ribbon-row-bottom">
                  <div className="doc-margin-spec-badge">
                    <span>Atas: {(docMargins.top / 10).toFixed(2)}cm</span>
                    <span>Bawah: {(docMargins.bottom / 10).toFixed(2)}cm</span>
                    <span>Kiri: {(docMargins.left / 10).toFixed(2)}cm</span>
                    <span>Kanan: {(docMargins.right / 10).toFixed(2)}cm</span>
                  </div>
                </div>

                <span className="doc-ribbon-group-label">Margin Halaman</span>

                {/* Custom Margins Popover Modal */}
                {showMarginPopover && (
                  <div className="doc-margin-popover" role="dialog">
                    <div className="doc-margin-popover-header">
                      <span className="popover-title">PENGATURAN MARGIN HALAMAN</span>
                      <span className="popover-sub">Standar Microsoft Word</span>
                    </div>

                    <div className="doc-margin-presets-list">
                      <button
                        type="button"
                        className={`doc-margin-preset-item ${shipment.docMarginPreset === "Normal" ? "selected" : ""}`}
                        onClick={() => handleMarginPresetChange("Normal")}
                      >
                        <b>Normal:</b> Atas: 2.54cm · Bawah: 2.54cm · Kiri: 2.54cm · Kanan: 2.54cm
                      </button>
                      <button
                        type="button"
                        className={`doc-margin-preset-item ${shipment.docMarginPreset === "Sempit" ? "selected" : ""}`}
                        onClick={() => handleMarginPresetChange("Sempit")}
                      >
                        <b>Sempit:</b> Atas: 1.27cm · Bawah: 1.27cm · Kiri: 1.27cm · Kanan: 1.27cm
                      </button>
                      <button
                        type="button"
                        className={`doc-margin-preset-item ${shipment.docMarginPreset === "Sedang" ? "selected" : ""}`}
                        onClick={() => handleMarginPresetChange("Sedang")}
                      >
                        <b>Sedang:</b> Atas: 2.54cm · Bawah: 2.54cm · Kiri: 1.91cm · Kanan: 1.91cm
                      </button>
                    </div>

                    <div className="doc-margin-inputs-grid">
                      <label className="doc-margin-input-field">
                        <span>Margin Atas (mm):</span>
                        <input
                          type="number"
                          min="5"
                          max="80"
                          step="1"
                          value={docMargins.top}
                          onChange={(e) => handleCustomMarginInput("top", Number(e.target.value))}
                        />
                      </label>
                      <label className="doc-margin-input-field">
                        <span>Margin Bawah (mm):</span>
                        <input
                          type="number"
                          min="5"
                          max="80"
                          step="1"
                          value={docMargins.bottom}
                          onChange={(e) => handleCustomMarginInput("bottom", Number(e.target.value))}
                        />
                      </label>
                      <label className="doc-margin-input-field">
                        <span>Margin Kiri (mm):</span>
                        <input
                          type="number"
                          min="5"
                          max="80"
                          step="1"
                          value={docMargins.left}
                          onChange={(e) => handleCustomMarginInput("left", Number(e.target.value))}
                        />
                      </label>
                      <label className="doc-margin-input-field">
                        <span>Margin Kanan (mm):</span>
                        <input
                          type="number"
                          min="5"
                          max="80"
                          step="1"
                          value={docMargins.right}
                          onChange={(e) => handleCustomMarginInput("right", Number(e.target.value))}
                        />
                      </label>
                    </div>

                    <div className="doc-margin-popover-footer">
                      <button
                        type="button"
                        className="doc-margin-close-btn"
                        onClick={() => setShowMarginPopover(false)}
                      >
                        Terapkan Margin
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="doc-ribbon-divider" />

              {/* PAGE SETUP / UKURAN KERTAS & ORIENTASI GROUP */}
              <div className="doc-ribbon-group group-pagesetup">
                <div className="doc-ribbon-row-top">
                  <div className="doc-ribbon-field-with-icon" title="Pilih Ukuran Kertas Sesuai Standar Microsoft Word">
                    <FileText size={13} className="doc-field-prefix-icon" />
                    <select
                      className="doc-ribbon-select paper-size-select"
                      value={activePaperSize}
                      onChange={(e) => handlePaperSizeChange(e.target.value as PaperSize)}
                      title="Pilih Ukuran Kertas Sesuai Standar Word"
                    >
                      <option value="A4">A4 (210 × 297 mm)</option>
                      <option value="Letter">Letter (8.5 × 11 in)</option>
                      <option value="Legal">Legal (8.5 × 14 in)</option>
                      <option value="Folio">Folio / F4 (8.5 × 13 in)</option>
                      <option value="Executive">Executive (7.25 × 10.5 in)</option>
                      <option value="A3">A3 (297 × 420 mm)</option>
                      <option value="A5">A5 (148 × 210 mm)</option>
                      <option value="B4">B4 JIS (257 × 364 mm)</option>
                      <option value="B5">B5 JIS (182 × 257 mm)</option>
                      <option value="Tabloid">Tabloid (11 × 17 in)</option>
                      <option value="Statement">Statement (5.5 × 8.5 in)</option>
                    </select>
                  </div>
                </div>

                <div className="doc-ribbon-row-bottom">
                  <div className="doc-ribbon-field-with-icon" title="Orientasi Kertas">
                    <Layout size={12} className="doc-field-prefix-icon" />
                    <select
                      className="doc-ribbon-select doc-orientation-select"
                      value={activeOrientation}
                      onChange={(e) => handleOrientationChange(e.target.value as DocumentOrientation)}
                      title="Orientasi Kertas"
                    >
                      <option value="Portrait">Potret (Tegak)</option>
                      <option value="Landscape">Lanskap (Mendatar)</option>
                    </select>
                  </div>
                </div>

                <span className="doc-ribbon-group-label">Kertas & Orientasi</span>
              </div>

              <div className="doc-ribbon-divider" />

              {/* RULER & VIEW GROUP */}
              <div className="doc-ribbon-group group-view">
                <div className="doc-ribbon-row-top">
                  <button
                    type="button"
                    className={`doc-ribbon-toggle-chip ${shipment.docShowRuler !== false ? "active" : ""}`}
                    onClick={toggleRuler}
                    title="Tampilkan / sembunyikan Penggaris Horizontal Microsoft Word di atas kertas"
                  >
                    <Ruler size={13} />
                    <span>Penggaris Word</span>
                    {shipment.docShowRuler !== false && <Check size={12} />}
                  </button>
                </div>

                <div className="doc-ribbon-row-bottom">
                  <span className="doc-ruler-stat-txt">
                    {shipment.docShowRuler !== false ? "Penggaris Aktif" : "Penggaris Disembunyikan"}
                  </span>
                </div>

                <span className="doc-ribbon-group-label">Tampilan</span>
              </div>

              <div className="doc-ribbon-divider" />

              {/* Reset to ICC Standard */}
              <div className="doc-ribbon-group group-status">
                <button
                  type="button"
                  className="doc-ribbon-reset-btn"
                  onClick={onResetDocument}
                  title="Kembalikan semua teks editan ke template bawaan sistem"
                >
                  <RotateCcw size={12} />
                  <span>Reset Teks Asli</span>
                </button>
                <div className="doc-ribbon-status-tag">
                  <Sparkles size={11} />
                  <span>Format Standar ICC 2026</span>
                </div>
                <span className="doc-ribbon-group-label">Status</span>
              </div>
            </>
          )}

          {/* ================= TAB 3: SISIPKAN (INSERT & HEADER) ================= */}
          {activeRibbonTab === "insert" && (
            <>
              {/* TABLE TOOLS GROUP (Seperti di Word) */}
              <div className="doc-ribbon-group group-table" ref={tableMenuRef}>
                <div className="doc-ribbon-row-top">
                  <button
                    type="button"
                    className={`doc-ribbon-table-trigger ${showTableMenu ? "active" : ""}`}
                    onClick={() => setShowTableMenu((prev) => !prev)}
                    title="Sisipkan Tabel Baru (Seperti di Microsoft Word)"
                  >
                    <Table size={13} />
                    <span>Tabel</span>
                    <ChevronDown size={11} />
                  </button>

                  <button
                    type="button"
                    className="doc-ribbon-btn-icon"
                    onClick={addTableRow}
                    title="Tambah 1 Baris ke Bawah pada Tabel yang Dipilih"
                  >
                    <Rows size={13} />
                    <span style={{ fontSize: "9px", fontWeight: 800, marginLeft: "1px" }}>+</span>
                  </button>

                  <button
                    type="button"
                    className="doc-ribbon-btn-icon"
                    onClick={addTableCol}
                    title="Tambah 1 Kolom ke Kanan pada Tabel yang Dipilih"
                  >
                    <Columns size={13} />
                    <span style={{ fontSize: "9px", fontWeight: 800, marginLeft: "1px" }}>+</span>
                  </button>
                </div>

                <div className="doc-ribbon-row-bottom">
                  <button
                    type="button"
                    className="doc-ribbon-table-subbtn"
                    onClick={deleteTableRow}
                    title="Hapus Baris Tabel Aktif"
                  >
                    - Baris
                  </button>
                  <button
                    type="button"
                    className="doc-ribbon-table-subbtn"
                    onClick={deleteTableCol}
                    title="Hapus Kolom Tabel Aktif"
                  >
                    - Kolom
                  </button>
                  <button
                    type="button"
                    className="doc-ribbon-table-subbtn danger"
                    onClick={deleteTable}
                    title="Hapus Seluruh Tabel Aktif"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>

                <span className="doc-ribbon-group-label">Tabel Word</span>

                {/* Table Insert Popover Modal/Dropdown */}
                {showTableMenu && (
                  <div className="doc-table-popover" role="dialog">
                    <div className="doc-table-popover-header">
                      <span className="popover-title">SISIPKAN TABEL</span>
                      <span className="popover-sub">
                        {hoverGrid.r > 0 && hoverGrid.c > 0 ? `Tabel ${hoverGrid.r} × ${hoverGrid.c}` : "Pilih Ukuran Grid"}
                      </span>
                    </div>

                    <div className="doc-table-grid-picker">
                      {[1, 2, 3, 4, 5].map((r) => (
                        <div key={`row-${r}`} className="grid-picker-row">
                          {[1, 2, 3, 4, 5].map((c) => {
                            const isHighlighted = r <= hoverGrid.r && c <= hoverGrid.c;
                            return (
                              <div
                                key={`cell-${r}-${c}`}
                                className={`grid-picker-cell ${isHighlighted ? "highlighted" : ""}`}
                                onMouseEnter={() => setHoverGrid({ r, c })}
                                onClick={() => insertTable(r, c)}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>

                    <div className="doc-table-custom-form">
                      <span className="custom-form-title">Ukuran Kustom:</span>
                      <div className="custom-form-inputs">
                        <label>
                          <span>Baris:</span>
                          <input
                            type="number"
                            min="1"
                            max="20"
                            value={customRows}
                            onChange={(e) => setCustomRows(Math.max(1, Number(e.target.value)))}
                          />
                        </label>
                        <label>
                          <span>Kolom:</span>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={customCols}
                            onChange={(e) => setCustomCols(Math.max(1, Number(e.target.value)))}
                          />
                        </label>
                      </div>
                      <button
                        type="button"
                        className="doc-btn-insert-table"
                        onClick={() => insertTable(customRows, customCols)}
                      >
                        <Plus size={13} />
                        <span>Sisipkan Tabel</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="doc-ribbon-divider" />

              {/* HEADER & FOOTER GROUP (Seperti di Word) */}
              <div className="doc-ribbon-group group-header-footer">
                <div className="doc-ribbon-row-top">
                  <button
                    type="button"
                    className={`doc-ribbon-toggle-chip ${shipment.docHeaderEnabled !== false ? "active" : ""}`}
                    onClick={toggleHeader}
                    title="Aktifkan / nonaktifkan Header resmi di bagian atas kertas"
                  >
                    <PanelTop size={13} />
                    <span>Header</span>
                    {shipment.docHeaderEnabled !== false && <Check size={12} />}
                  </button>

                  <button
                    type="button"
                    className={`doc-ribbon-toggle-chip ${shipment.docFooterEnabled !== false ? "active" : ""}`}
                    onClick={toggleFooter}
                    title="Aktifkan / nonaktifkan Footer resmi di bagian bawah kertas"
                  >
                    <PanelBottom size={13} />
                    <span>Footer</span>
                    {shipment.docFooterEnabled !== false && <Check size={12} />}
                  </button>
                </div>

                <div className="doc-ribbon-row-bottom">
                  <button
                    type="button"
                    className={`doc-ribbon-toggle-chip ${shipment.docShowPageNumber !== false ? "active" : ""}`}
                    onClick={togglePageNumber}
                    title="Tampilkan / sembunyikan nomor halaman di footer (Halaman 1 dari 1)"
                  >
                    <Hash size={12} />
                    <span>Nomor Halaman</span>
                    {shipment.docShowPageNumber !== false && <Check size={11} />}
                  </button>
                </div>

                <span className="doc-ribbon-group-label">Header & Footer</span>
              </div>

              <div className="doc-ribbon-divider" />

              {/* LOGO SCALE GROUP */}
              <div className="doc-ribbon-group group-logo-scale">
                <div className="doc-ribbon-row-top" style={{ gap: "4px", alignItems: "center" }}>
                  <button
                    type="button"
                    className="doc-ribbon-btn-icon"
                    onClick={() => {
                      const cur = shipment.letterheadLogoScale ?? 100;
                      update("letterheadLogoScale", Math.max(40, cur - 10));
                    }}
                    title="Perkecil Ukuran Logo (-10%)"
                  >
                    -
                  </button>
                  <span style={{ fontSize: "11px", fontWeight: 700, minWidth: "36px", textAlign: "center", color: "#1e293b" }}>
                    {shipment.letterheadLogoScale ?? 100}%
                  </span>
                  <button
                    type="button"
                    className="doc-ribbon-btn-icon"
                    onClick={() => {
                      const cur = shipment.letterheadLogoScale ?? 100;
                      update("letterheadLogoScale", Math.min(200, cur + 10));
                    }}
                    title="Perbesar Ukuran Logo (+10%)"
                  >
                    +
                  </button>
                </div>

                <div className="doc-ribbon-row-bottom" style={{ gap: "4px", alignItems: "center" }}>
                  <input
                    type="range"
                    min="40"
                    max="200"
                    step="5"
                    value={shipment.letterheadLogoScale ?? 100}
                    onChange={(e) => update("letterheadLogoScale", Number(e.target.value))}
                    style={{ width: "65px", height: "14px", accentColor: "#0284c7", cursor: "pointer" }}
                    title="Geser untuk mengatur besar atau kecilnya logo perusahaan"
                  />
                  <button
                    type="button"
                    onClick={() => update("letterheadLogoScale", 100)}
                    style={{
                      fontSize: "9px",
                      padding: "1px 4px",
                      background: "#f1f5f9",
                      borderRadius: "3px",
                      border: "1px solid #cbd5e1",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                    title="Kembalikan logo ke ukuran asli 100%"
                  >
                    100%
                  </button>
                </div>

                <span className="doc-ribbon-group-label">Ukuran Logo</span>
              </div>

              <div className="doc-ribbon-divider" />

              {/* DIGITAL SIGNATURE GROUP */}
              <div className="doc-ribbon-group group-signature">
                <div className="doc-ribbon-row-top">
                  <button
                    type="button"
                    className="doc-ribbon-sig-btn"
                    onClick={() => onOpenSignatureModal("seller")}
                    title="Buka panel Tanda Tangan Digital & Stempel Resmi"
                  >
                    <FileSignature size={14} />
                    <span>Tanda Tangan & Stempel</span>
                  </button>
                </div>

                <div className="doc-ribbon-row-bottom">
                  <span className="doc-sig-stat-txt">
                    {shipment.sellerSignatureImage ? "✓ Tertandatangani" : "Belum Ditandatangani"}
                  </span>
                </div>

                <span className="doc-ribbon-group-label">Otorisasi Resmi</span>
              </div>

              <div className="doc-ribbon-divider" />

              {/* BUYER BUSINESS CARD OCR GROUP */}
              {onOpenBusinessCardOcr && (
                <div className="doc-ribbon-group group-ocr">
                  <div className="doc-ribbon-row-top">
                    <button
                      type="button"
                      className="doc-ribbon-sig-btn"
                      onClick={onOpenBusinessCardOcr}
                      title="Scan foto kartu nama buyer untuk mengekstrak nama perusahaan, PIC, jabatan, dan alamat ke surat"
                    >
                      <CreditCard size={14} />
                      <span>Scan Kartu Nama</span>
                    </button>
                  </div>
                  <div className="doc-ribbon-row-bottom">
                    <span className="doc-sig-stat-txt">
                      OCR Gambar ke Teks
                    </span>
                  </div>
                  <span className="doc-ribbon-group-label">Data Buyer (OCR)</span>
                </div>
              )}

              <div className="doc-ribbon-divider" />

              {/* AI ADVISOR SCREENING GROUP */}
              {onOpenAiScreening && (
                <div className="doc-ribbon-group group-ai-screen">
                  <div className="doc-ribbon-row-top">
                    <button
                      type="button"
                      className="doc-ribbon-sig-btn"
                      onClick={onOpenAiScreening}
                      title="Screening kepatuhan, kalkulasi finansial, dan deteksi typo/kesalahan penulisan dokumen sebelum & sesudah diedit"
                    >
                      <Sparkles size={14} />
                      <span>AI Screening</span>
                    </button>
                  </div>
                  <div className="doc-ribbon-row-bottom">
                    <span className="doc-sig-stat-txt">
                      Deteksi Typo & Audit
                    </span>
                  </div>
                  <span className="doc-ribbon-group-label">AI Advisor</span>
                </div>
              )}
            </>
          )}

          {/* ================= TAB 4: ALAT TABEL (TABLE TOOLS - DESAIN & TATA LETAK) ================= */}
          {activeRibbonTab === "table" && (
            <>
              {/* Active Table Target Indicator */}
              <div
                className="doc-ribbon-group group-active-table"
                style={{
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  borderRadius: "6px",
                  padding: "4px 8px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#1d4ed8", fontWeight: 700, fontSize: "11px" }}>
                  <Table size={13} />
                  <span>{activeTableTitle}</span>
                </div>
                <div style={{ fontSize: "9px", color: "#60a5fa", marginTop: "2px" }}>
                  Target pengaturan tabel
                </div>
                <span className="doc-ribbon-group-label" style={{ color: "#2563eb" }}>Tabel Terpilih</span>
              </div>

              <div className="doc-ribbon-divider" />

              {/* 1. Baris & Kolom (Rows & Columns) */}
              <div className="doc-ribbon-group group-table-rows">
                <div className="doc-ribbon-row-top">
                  <button
                    type="button"
                    className="doc-ribbon-table-subbtn"
                    onClick={() => insertTableRow("above")}
                    title="Sisipkan 1 Baris di Atas baris terpilih"
                  >
                    <ArrowUp size={11} />
                    <span>+ Baris Atas</span>
                  </button>
                  <button
                    type="button"
                    className="doc-ribbon-table-subbtn"
                    onClick={() => insertTableRow("below")}
                    title="Sisipkan 1 Baris di Bawah baris terpilih"
                  >
                    <ArrowDown size={11} />
                    <span>+ Baris Bawah</span>
                  </button>
                  <button
                    type="button"
                    className="doc-ribbon-table-subbtn danger"
                    onClick={deleteTableRow}
                    title="Hapus Baris yang Sedang Dipilih"
                  >
                    <Trash2 size={11} />
                    <span>- Baris</span>
                  </button>
                </div>

                <div className="doc-ribbon-row-bottom">
                  <button
                    type="button"
                    className="doc-ribbon-table-subbtn"
                    onClick={() => insertTableCol("left")}
                    title="Sisipkan 1 Kolom di Sebelah Kiri"
                  >
                    <ArrowLeft size={11} />
                    <span>+ Kolom Kiri</span>
                  </button>
                  <button
                    type="button"
                    className="doc-ribbon-table-subbtn"
                    onClick={() => insertTableCol("right")}
                    title="Sisipkan 1 Kolom di Sebelah Kanan"
                  >
                    <ArrowRight size={11} />
                    <span>+ Kolom Kanan</span>
                  </button>
                  <button
                    type="button"
                    className="doc-ribbon-table-subbtn danger"
                    onClick={deleteTableCol}
                    title="Hapus Kolom yang Sedang Dipilih"
                  >
                    <Trash2 size={11} />
                    <span>- Kolom</span>
                  </button>
                </div>

                <span className="doc-ribbon-group-label">Baris & Kolom</span>
              </div>

              <div className="doc-ribbon-divider" />

              {/* 2. Ukuran & Lebar Kolom (Width & Sizing) */}
              <div className="doc-ribbon-group group-table-width">
                <div className="doc-ribbon-row-top">
                  <button
                    type="button"
                    className="doc-ribbon-table-subbtn"
                    onClick={() => adjustColWidth(-20)}
                    title="Persempit Lebar Kolom Terpilih (-20px)"
                  >
                    <span>Kolom ◀-</span>
                  </button>
                  <button
                    type="button"
                    className="doc-ribbon-table-subbtn"
                    onClick={() => adjustColWidth(20)}
                    title="Perlebar Lebar Kolom Terpilih (+20px)"
                  >
                    <span>-+ Kolom ▶</span>
                  </button>
                </div>

                <div className="doc-ribbon-row-bottom">
                  <button
                    type="button"
                    className="doc-ribbon-table-subbtn"
                    onClick={distributeColumnsEvenly}
                    title="Ratakan Lebar Seluruh Kolom Sama Rata (Distribute Columns Evenly)"
                  >
                    <MoveHorizontal size={11} />
                    <span>Ratakan Kolom</span>
                  </button>
                  <button
                    type="button"
                    className="doc-ribbon-table-subbtn"
                    onClick={autoFitColumns}
                    title="Sesuaikan Lebar Otomatis Sesuai Teks (AutoFit)"
                  >
                    <span>AutoFit</span>
                  </button>
                </div>

                <span className="doc-ribbon-group-label">Lebar Kolom</span>
              </div>

              <div className="doc-ribbon-divider" />

              {/* 3. Perataan Sel (Cell Alignment & Padding) */}
              <div className="doc-ribbon-group group-table-align">
                <div className="doc-ribbon-row-top">
                  <button
                    type="button"
                    className="doc-ribbon-btn-icon"
                    onClick={() => setCellAlign("left")}
                    title="Rata Kiri Sel (Align Left)"
                  >
                    <AlignLeft size={13} />
                  </button>
                  <button
                    type="button"
                    className="doc-ribbon-btn-icon"
                    onClick={() => setCellAlign("center")}
                    title="Rata Tengah Sel (Align Center)"
                  >
                    <AlignCenter size={13} />
                  </button>
                  <button
                    type="button"
                    className="doc-ribbon-btn-icon"
                    onClick={() => setCellAlign("right")}
                    title="Rata Kanan Sel (Align Right)"
                  >
                    <AlignRight size={13} />
                  </button>
                  <button
                    type="button"
                    className="doc-ribbon-btn-icon"
                    onClick={() => setCellVAlign("top")}
                    title="Perataan Vertikal: Atas (Top)"
                  >
                    <AlignVerticalJustifyStart size={13} />
                  </button>
                  <button
                    type="button"
                    className="doc-ribbon-btn-icon"
                    onClick={() => setCellVAlign("middle")}
                    title="Perataan Vertikal: Tengah (Middle)"
                  >
                    <AlignVerticalJustifyCenter size={13} />
                  </button>
                  <button
                    type="button"
                    className="doc-ribbon-btn-icon"
                    onClick={() => setCellVAlign("bottom")}
                    title="Perataan Vertikal: Bawah (Bottom)"
                  >
                    <AlignVerticalJustifyEnd size={13} />
                  </button>
                </div>

                <div className="doc-ribbon-row-bottom">
                  <span style={{ fontSize: "9.5px", color: "#64748b", fontWeight: 700, marginRight: "2px" }}>Padding:</span>
                  <button
                    type="button"
                    className="doc-ribbon-table-subbtn"
                    onClick={() => setCellPadding("compact")}
                    title="Padding Rapat (4px)"
                  >
                    Rapat
                  </button>
                  <button
                    type="button"
                    className="doc-ribbon-table-subbtn"
                    onClick={() => setCellPadding("normal")}
                    title="Padding Normal (8px)"
                  >
                    Normal
                  </button>
                  <button
                    type="button"
                    className="doc-ribbon-table-subbtn"
                    onClick={() => setCellPadding("spacious")}
                    title="Padding Longgar (12px)"
                  >
                    Longgar
                  </button>
                </div>

                <span className="doc-ribbon-group-label">Perataan & Spasi</span>
              </div>

              <div className="doc-ribbon-divider" />

              {/* 4. Garis & Border Tabel */}
              <div className="doc-ribbon-group group-table-border">
                <div className="doc-ribbon-row-top">
                  <button
                    type="button"
                    className="doc-ribbon-table-subbtn"
                    onClick={() => setTableBorderPreset("all")}
                    title="Semua Garis (Grid Kotak Lengkap)"
                  >
                    <Grid size={11} />
                    <span>Semua Garis</span>
                  </button>
                  <button
                    type="button"
                    className="doc-ribbon-table-subbtn"
                    onClick={() => setTableBorderPreset("horizontal")}
                    title="Garis Horizontal Saja (Standar Faktur)"
                  >
                    <Rows size={11} />
                    <span>Horizontal</span>
                  </button>
                </div>

                <div className="doc-ribbon-row-bottom">
                  <button
                    type="button"
                    className="doc-ribbon-table-subbtn"
                    onClick={() => setTableBorderPreset("outer")}
                    title="Garis Bingkai Luar Saja"
                  >
                    <Square size={11} />
                    <span>Garis Luar</span>
                  </button>
                  <button
                    type="button"
                    className="doc-ribbon-table-subbtn"
                    onClick={() => setTableBorderPreset("none")}
                    title="Tanpa Garis / Borderless"
                  >
                    <span>Tanpa Garis</span>
                  </button>
                </div>

                <span className="doc-ribbon-group-label">Gaya Garis</span>
              </div>

              <div className="doc-ribbon-divider" />

              {/* 5. Warna Shading Sel (Cell Background Color) */}
              <div className="doc-ribbon-group group-table-color">
                <div className="doc-ribbon-row-top" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <PaintBucket size={12} style={{ color: "#475569" }} />
                  <span style={{ fontSize: "9.5px", fontWeight: 700, color: "#334155" }}>Warna Sel:</span>
                </div>

                <div className="doc-ribbon-row-bottom" style={{ display: "flex", gap: "3px", alignItems: "center" }}>
                  <button
                    type="button"
                    className="doc-color-swatch-mini swatch-clear"
                    onClick={() => setCellBackground("transparent")}
                    title="Bening / Hapus Warna"
                    style={{ width: "16px", height: "16px", borderRadius: "3px", border: "1px solid #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", cursor: "pointer" }}
                  >
                    ✕
                  </button>
                  <button
                    type="button"
                    className="doc-color-swatch-mini"
                    style={{ width: "16px", height: "16px", borderRadius: "3px", background: "#ffffff", border: "1px solid #94a3b8", cursor: "pointer" }}
                    onClick={() => setCellBackground("#ffffff")}
                    title="Putih Bersih"
                  />
                  <button
                    type="button"
                    className="doc-color-swatch-mini"
                    style={{ width: "16px", height: "16px", borderRadius: "3px", background: "#f8fafc", border: "1px solid #cbd5e1", cursor: "pointer" }}
                    onClick={() => setCellBackground("#f8fafc")}
                    title="Abu Sangat Muda"
                  />
                  <button
                    type="button"
                    className="doc-color-swatch-mini"
                    style={{ width: "16px", height: "16px", borderRadius: "3px", background: "#e0f2fe", border: "1px solid #93c5fd", cursor: "pointer" }}
                    onClick={() => setCellBackground("#e0f2fe")}
                    title="Biru Muda Lembut"
                  />
                  <button
                    type="button"
                    className="doc-color-swatch-mini"
                    style={{ width: "16px", height: "16px", borderRadius: "3px", background: "#fef9c3", border: "1px solid #fde047", cursor: "pointer" }}
                    onClick={() => setCellBackground("#fef9c3")}
                    title="Kuning Sorot"
                  />
                  <button
                    type="button"
                    className="doc-color-swatch-mini"
                    style={{ width: "16px", height: "16px", borderRadius: "3px", background: "#0f2942", border: "1px solid #0f2942", cursor: "pointer" }}
                    onClick={() => setCellBackground("#0f2942")}
                    title="Navy Resmi Ekspor"
                  />
                </div>

                <span className="doc-ribbon-group-label">Shading Sel</span>
              </div>

              <div className="doc-ribbon-divider" />

              {/* 6. Desain Cepat & Hapus Tabel */}
              <div className="doc-ribbon-group group-table-presets">
                <div className="doc-ribbon-row-top">
                  <button
                    type="button"
                    className="doc-ribbon-table-subbtn"
                    onClick={() => setTablePreset("corporate")}
                    title="Gaya Standar Ekspor: Header Navy & Garis Abu"
                  >
                    Standar Ekspor
                  </button>
                  <button
                    type="button"
                    className="doc-ribbon-table-subbtn"
                    onClick={() => setTablePreset("zebra")}
                    title="Zebra Striping: Baris Selang-Seling"
                  >
                    Zebra
                  </button>
                </div>

                <div className="doc-ribbon-row-bottom">
                  <button
                    type="button"
                    className="doc-ribbon-table-subbtn"
                    onClick={() => setTablePreset("minimal")}
                    title="Gaya Minimalis: Header Abu & Garis Tipis"
                  >
                    Minimalis
                  </button>
                  <button
                    type="button"
                    className="doc-ribbon-table-subbtn danger"
                    onClick={deleteTable}
                    title="Hapus Seluruh Tabel Ini"
                  >
                    <Trash2 size={11} />
                    <span>Hapus Tabel</span>
                  </button>
                </div>

                <span className="doc-ribbon-group-label">Desain Cepat</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Editing Notification Banner when in Edit Mode */}
      {isEditMode && (
        <div className="doc-ribbon-edit-hint">
          <Edit3 size={13} />
          <span>
            <b>Mode Edit Word Aktif:</b> Anda dapat mengeklik bagian manapun pada surat/dokumen (artikel, nama buyer, rincian koli, syarat bayar, header & footer) untuk mengedit langsung di kertas dokumen.
          </span>
        </div>
      )}
    </div>
  );
}
