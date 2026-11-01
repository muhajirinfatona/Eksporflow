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
  Palette,
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
  Image as ImageIcon,
  Layers,
  Move,
  RotateCw,
  SunMedium,
  ZoomIn,
  ZoomOut,
  X,
  Sliders,
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
  const [activeRibbonTab, setActiveRibbonTab] = useState<"home" | "layout" | "insert" | "table" | "picture">("home");
  const [isTableSelected, setIsTableSelected] = useState(false);
  const [isImageSelected, setIsImageSelected] = useState(false);
  const [activeTableTitle, setActiveTableTitle] = useState<string>("Tabel");
  const lastActiveCellRef = useRef<HTMLTableCellElement | null>(null);

  // Line spacing custom modal
  const [showCustomLineHeightModal, setShowCustomLineHeightModal] = useState(false);
  const [customLineHeightInput, setCustomLineHeightInput] = useState<number>(shipment.docEditorLineHeight || 1.35);

  // Page setup margin modal
  const [showMarginModal, setShowMarginModal] = useState(false);
  const docMargins = getDocMargins(shipment);
  const [customMarginInputs, setCustomMarginInputs] = useState({
    top: docMargins.top,
    bottom: docMargins.bottom,
    left: docMargins.left,
    right: docMargins.right,
  });

  // Keep modal margin inputs in sync when shipment changes
  useEffect(() => {
    setCustomMarginInputs({
      top: docMargins.top,
      bottom: docMargins.bottom,
      left: docMargins.left,
      right: docMargins.right,
    });
  }, [docMargins.top, docMargins.bottom, docMargins.left, docMargins.right]);

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

    const handleImageFocus = (e: any) => {
      const detail = e.detail;
      const hasImage = detail?.hasImage !== false;
      setIsImageSelected(hasImage);
      if (hasImage) {
        setActiveRibbonTab("picture");
      }
    };

    window.addEventListener("eksporflow:table-focus", handleTableFocus);
    window.addEventListener("eksporflow:image-focus", handleImageFocus);
    return () => {
      window.removeEventListener("eksporflow:table-focus", handleTableFocus);
      window.removeEventListener("eksporflow:image-focus", handleImageFocus);
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

  // Table Shading & Border Customization
  const [tableColorTarget, setTableColorTarget] = useState<"header" | "cell" | "row" | "table">("header");
  const [customTableColor, setCustomTableColor] = useState("#0f2942");
  const [tableBorderColor, setTableBorderColor] = useState("#cbd5e1");
  const [showCustomHexPopover, setShowCustomHexPopover] = useState(false);
  const [customHexInput, setCustomHexInput] = useState("#0f2942");

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

  // Contrast calculation ensuring high readability (black on light, white on dark)
  const getContrastColor = (hex: string): string => {
    if (!hex || hex === "transparent") return "#0f172a";
    let color = hex.replace("#", "");
    if (color.length === 3) {
      color = color.split("").map((c) => c + c).join("");
    }
    if (color.length !== 6) return "#0f172a";
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 145 ? "#0f172a" : "#ffffff";
  };

  const applyTableColor = (bgColor: string, target = tableColorTarget) => {
    const { table, cell, row } = getTargetTableAndCell();
    if (!table) {
      toast.error("Pilih atau klik salah satu sel tabel terlebih dahulu");
      return;
    }

    const textColor = getContrastColor(bgColor);

    if (target === "cell") {
      if (!cell) {
        toast.error("Klik sel tabel yang ingin diwarnai terlebih dahulu");
        return;
      }
      cell.style.backgroundColor = bgColor;
      if (bgColor !== "transparent") {
        cell.style.color = textColor;
      }
      toast.success("Warna sel tabel berhasil diubah.");
    } else if (target === "row") {
      const targetRow = row || (cell ? (cell.parentElement as HTMLTableRowElement) : null);
      if (!targetRow) {
        toast.error("Klik baris tabel yang ingin diwarnai terlebih dahulu");
        return;
      }
      targetRow.style.backgroundColor = bgColor;
      targetRow.querySelectorAll("td, th").forEach((c) => {
        (c as HTMLElement).style.backgroundColor = bgColor;
        if (bgColor !== "transparent") {
          (c as HTMLElement).style.color = textColor;
        }
      });
      toast.success("Warna baris tabel berhasil diubah.");
    } else if (target === "header") {
      const headers = table.querySelectorAll("thead th, tr:first-child th");
      if (headers.length > 0) {
        headers.forEach((th) => {
          (th as HTMLElement).style.backgroundColor = bgColor;
          if (bgColor !== "transparent") {
            (th as HTMLElement).style.color = textColor;
          }
        });
      } else {
        const firstRow = table.querySelector("tr");
        if (firstRow) {
          firstRow.querySelectorAll("td, th").forEach((c) => {
            (c as HTMLElement).style.backgroundColor = bgColor;
            if (bgColor !== "transparent") {
              (c as HTMLElement).style.color = textColor;
            }
          });
        }
      }
      toast.success("Warna header tabel berhasil diubah.");
    } else if (target === "table") {
      table.querySelectorAll("tbody td, tbody th, td").forEach((c) => {
        (c as HTMLElement).style.backgroundColor = bgColor;
        if (bgColor !== "transparent") {
          (c as HTMLElement).style.color = textColor;
        }
      });
      toast.success("Warna seluruh tabel berhasil diubah.");
    }
  };

  const applyTableBorderColor = (color: string) => {
    const { table } = getTargetTableAndCell();
    if (!table) {
      toast.error("Pilih tabel terlebih dahulu");
      return;
    }
    setTableBorderColor(color);
    table.style.borderColor = color;
    table.querySelectorAll("th, td").forEach((c) => {
      (c as HTMLElement).style.borderColor = color;
    });
    toast.success("Warna garis border tabel berhasil diubah.");
  };

  const applyTableThemePreset = (theme: "corporate" | "zebra" | "minimal" | "emerald" | "royal" | "slate" | "burgundy") => {
    const { table } = getTargetTableAndCell();
    if (!table) {
      toast.error("Pilih tabel terlebih dahulu");
      return;
    }
    const tbody = table.querySelector("tbody") || table;
    const rows = tbody.querySelectorAll("tr:not(.doc-table-total-row)");

    const configs: Record<string, { headerBg: string; headerColor: string; altBg?: string; border: string; label: string }> = {
      corporate: { headerBg: "#0f2942", headerColor: "#ffffff", border: "#cbd5e1", label: "Corporate Navy" },
      zebra: { headerBg: "#1e293b", headerColor: "#ffffff", altBg: "#f8fafc", border: "#e2e8f0", label: "Zebra Striping" },
      minimal: { headerBg: "#f1f5f9", headerColor: "#0f172a", border: "#e2e8f0", label: "Minimalis Bersih" },
      emerald: { headerBg: "#065f46", headerColor: "#ffffff", altBg: "#f0fdf4", border: "#a7f3d0", label: "Emerald Green" },
      royal: { headerBg: "#1e40af", headerColor: "#ffffff", altBg: "#eff6ff", border: "#bfdbfe", label: "Royal Blue" },
      slate: { headerBg: "#334155", headerColor: "#ffffff", altBg: "#f8fafc", border: "#cbd5e1", label: "Modern Slate" },
      burgundy: { headerBg: "#881337", headerColor: "#ffffff", altBg: "#fff1f2", border: "#fecdd3", label: "Burgundy Wine" },
    };

    const cfg = configs[theme];
    if (!cfg) return;

    table.querySelectorAll("thead th, tr:first-child th").forEach((th) => {
      (th as HTMLElement).style.backgroundColor = cfg.headerBg;
      (th as HTMLElement).style.color = cfg.headerColor;
      (th as HTMLElement).style.borderColor = cfg.border;
    });

    rows.forEach((r, idx) => {
      const bg = cfg.altBg && idx % 2 === 1 ? cfg.altBg : "#ffffff";
      (r as HTMLElement).style.backgroundColor = bg;
      r.querySelectorAll("td").forEach((td) => {
        (td as HTMLElement).style.backgroundColor = bg;
        (td as HTMLElement).style.borderColor = cfg.border;
      });
    });

    table.style.borderColor = cfg.border;
    toast.success(`Tema tabel diubah: ${cfg.label}`);
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
          <button
            type="button"
            className={`doc-ribbon-tab-btn doc-ribbon-tab-picture ${activeRibbonTab === "picture" ? "active" : ""} ${isImageSelected ? "highlighted" : ""}`}
            onClick={() => setActiveRibbonTab("picture")}
            title="Alat Format Gambar: Posisi, Bungkus Teks (Di Belakang/Depan/Kotak), Opasitas, Rotasi & Bingkai"
          >
            <ImageIcon size={13} className="mr-1 inline" />
            <span>Format Gambar 🖼️ {isImageSelected && "●"}</span>
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
                    value={[1.0, 1.15, 1.25, 1.35, 1.5, 1.75, 2.0, 2.5, 3.0].some(v => Math.abs(v - activeLineHeight) < 0.01) ? activeLineHeight.toString() : "custom"}
                    onChange={(e) => {
                      if (e.target.value === "custom") {
                        setCustomLineHeightInput(activeLineHeight);
                        setShowCustomLineHeightModal(true);
                      } else {
                        handleLineHeightChange(Number(e.target.value));
                      }
                    }}
                    title="Spasi Antar Baris (Line Spacing)"
                  >
                    <option value="1">1.00 Spasi Tunggal (Single)</option>
                    <option value="1.15">1.15 Spasi Rapat</option>
                    <option value="1.25">1.25 Spasi Formal</option>
                    <option value="1.35">1.35 Spasi Standar Ekspor</option>
                    <option value="1.5">1.50 Spasi 1.5 Baris</option>
                    <option value="1.75">1.75 Spasi Longgar</option>
                    <option value="2">2.00 Spasi Ganda (Double)</option>
                    <option value="2.5">2.50 Spasi Ekstra Lebar</option>
                    <option value="3">3.00 Spasi Maksimum</option>
                    <option value="custom">⚙️ Kustom Spasi Baris...</option>
                  </select>
                  <button
                    type="button"
                    className="doc-ribbon-btn-icon"
                    onClick={() => {
                      setCustomLineHeightInput(activeLineHeight);
                      setShowCustomLineHeightModal(true);
                    }}
                    title="Buka dialog pengaturan kustom spasi baris"
                    style={{ padding: "3px 6px" }}
                  >
                    <Sliders size={12} className="text-slate-600" />
                  </button>
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
              <div className="doc-ribbon-group group-margins">
                <div className="doc-ribbon-row-top">
                  <div className="doc-ribbon-field-with-icon" title="Pilih Preset Margin Sesuai Microsoft Word">
                    <Maximize2 size={13} className="doc-field-prefix-icon" />
                    <select
                      className="doc-ribbon-select doc-margin-preset-select"
                      value={shipment.docMarginPreset || "Normal"}
                      onChange={(e) => {
                        const val = e.target.value as DocMarginPreset;
                        if (val === "Kustom") {
                          setCustomMarginInputs({
                            top: docMargins.top,
                            bottom: docMargins.bottom,
                            left: docMargins.left,
                            right: docMargins.right,
                          });
                          setShowMarginModal(true);
                        } else {
                          handleMarginPresetChange(val);
                        }
                      }}
                      title="Pilih Preset Margin Halaman Microsoft Word"
                    >
                      <option value="Normal">Normal (2.54 cm / 1 in)</option>
                      <option value="Sempit">Sempit (1.27 cm / 0.5 in)</option>
                      <option value="Sedang">Sedang (1.91 cm / 0.75 in)</option>
                      <option value="Lebar">Lebar (5.08 cm / 2.0 in)</option>
                      <option value="Kustom">⚙️ Margin Kustom...</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    className="doc-ribbon-margin-toggle-btn"
                    onClick={() => {
                      setCustomMarginInputs({
                        top: docMargins.top,
                        bottom: docMargins.bottom,
                        left: docMargins.left,
                        right: docMargins.right,
                      });
                      setShowMarginModal(true);
                    }}
                    title="Buka pop-up dialog pengaturan margin kustom (Atas, Bawah, Kiri, Kanan)"
                  >
                    <SlidersHorizontal size={12} />
                    <span>Margin Kustom...</span>
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
                <div className="doc-ribbon-row-top" style={{ display: "flex", gap: "3px", alignItems: "center" }}>
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

                <div className="doc-ribbon-row-bottom" style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                  <span style={{ fontSize: "9px", fontWeight: 700, color: "#64748b" }}>Garis:</span>
                  {[
                    { color: "#cbd5e1", title: "Abu Lembut (Standar)" },
                    { color: "#0f2942", title: "Navy Formal" },
                    { color: "#000000", title: "Hitam Tegas" },
                    { color: "#2563eb", title: "Biru Aksen" },
                  ].map((b) => (
                    <button
                      key={b.color}
                      type="button"
                      className="doc-color-swatch-mini"
                      style={{
                        width: "15px",
                        height: "15px",
                        borderRadius: "2px",
                        background: b.color,
                        border: tableBorderColor === b.color ? "2px solid #0284c7" : "1px solid #94a3b8",
                        cursor: "pointer",
                      }}
                      onClick={() => applyTableBorderColor(b.color)}
                      title={b.title}
                    />
                  ))}
                  {/* Custom Border Color Picker */}
                  <label
                    className="doc-color-picker-native-wrap"
                    title="Pilih Warna Garis Kustom (Color Picker Spectrum & HEX)"
                    style={{ cursor: "pointer" }}
                  >
                    <input
                      type="color"
                      value={tableBorderColor}
                      onChange={(e) => applyTableBorderColor(e.target.value)}
                    />
                    <div
                      style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: "2px",
                        background: tableBorderColor,
                        border: "1px dashed #475569",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "9px",
                      }}
                    >
                      🎨
                    </div>
                  </label>
                </div>

                <span className="doc-ribbon-group-label">Gaya & Warna Garis</span>
              </div>

              <div className="doc-ribbon-divider" />

              {/* 5. Warna Shading Sel & Tabel (Custom Colors) */}
              <div className="doc-ribbon-group group-table-color">
                <div className="doc-ribbon-row-top" style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                  <PaintBucket size={12} style={{ color: "#475569" }} />
                  <span style={{ fontSize: "9px", fontWeight: 700, color: "#334155" }}>Target:</span>
                  {(["header", "cell", "row", "table"] as const).map((t) => {
                    const labels = { header: "Header", cell: "Sel", row: "Baris", table: "Tabel" };
                    const isActive = tableColorTarget === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        className={`doc-ribbon-scope-pill ${isActive ? "active" : ""}`}
                        onClick={() => setTableColorTarget(t)}
                        title={`Terapkan warna ke ${labels[t]}`}
                      >
                        {labels[t]}
                      </button>
                    );
                  })}
                </div>

                <div className="doc-ribbon-row-bottom" style={{ display: "flex", gap: "3px", alignItems: "center" }}>
                  <button
                    type="button"
                    className="doc-color-swatch-mini swatch-clear"
                    onClick={() => applyTableColor("transparent")}
                    title="Bening / Hapus Warna Latar"
                    style={{ width: "16px", height: "16px", borderRadius: "3px", border: "1px solid #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", cursor: "pointer" }}
                  >
                    ✕
                  </button>
                  {[
                    { color: "#ffffff", title: "Putih Bersih" },
                    { color: "#f8fafc", title: "Abu Lembut" },
                    { color: "#0f2942", title: "Navy Resmi Ekspor" },
                    { color: "#1e40af", title: "Biru Royal" },
                    { color: "#0284c7", title: "Biru Langit" },
                    { color: "#065f46", title: "Hijau Zamrud" },
                    { color: "#854d0e", title: "Kuning Emas" },
                    { color: "#881337", title: "Merah Marun" },
                    { color: "#1e293b", title: "Slate Gelap" },
                  ].map((sw) => (
                    <button
                      key={sw.color}
                      type="button"
                      className="doc-color-swatch-mini"
                      style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: "3px",
                        background: sw.color,
                        border: "1px solid rgba(0,0,0,0.15)",
                        cursor: "pointer",
                      }}
                      onClick={() => applyTableColor(sw.color)}
                      title={sw.title}
                    />
                  ))}

                  {/* Native HTML5 Color Spectrum Picker */}
                  <label
                    className="doc-color-picker-native-wrap"
                    title={`Pilih Warna Kustom Bebas (Spectrum & HEX) untuk ${tableColorTarget}`}
                  >
                    <input
                      type="color"
                      value={customTableColor}
                      onChange={(e) => {
                        setCustomTableColor(e.target.value);
                        setCustomHexInput(e.target.value);
                        applyTableColor(e.target.value);
                      }}
                    />
                    <div className="doc-color-picker-custom-btn">
                      <Palette size={11} />
                      <span>Kustom</span>
                    </div>
                  </label>

                  {/* Direct HEX Code Input Popover */}
                  <div style={{ position: "relative" }}>
                    <button
                      type="button"
                      className="doc-ribbon-scope-pill"
                      style={{ height: "18px", padding: "0 4px", fontSize: "9px" }}
                      onClick={() => setShowCustomHexPopover((p) => !p)}
                      title="Ketik Kode Warna HEX Langsung (misal: #0055aa)"
                    >
                      #HEX
                    </button>
                    {showCustomHexPopover && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: "calc(100% + 4px)",
                          left: "50%",
                          transform: "translateX(-50%)",
                          background: "#ffffff",
                          border: "1px solid #cbd5e1",
                          borderRadius: "6px",
                          boxShadow: "0 8px 20px rgba(0,0,0,0.18)",
                          padding: "8px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                          zIndex: 140,
                          width: "160px",
                        }}
                      >
                        <span style={{ fontSize: "10px", fontWeight: 700, color: "#1e293b" }}>Kode Warna HEX:</span>
                        <div style={{ display: "flex", gap: "4px" }}>
                          <input
                            type="text"
                            value={customHexInput}
                            onChange={(e) => setCustomHexInput(e.target.value)}
                            placeholder="#0f2942"
                            style={{
                              width: "80px",
                              padding: "2px 4px",
                              fontSize: "11px",
                              border: "1px solid #cbd5e1",
                              borderRadius: "3px",
                              fontFamily: "monospace",
                            }}
                          />
                          <div
                            style={{
                              width: "20px",
                              height: "20px",
                              borderRadius: "3px",
                              background: customHexInput,
                              border: "1px solid #94a3b8",
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          className="doc-ribbon-table-subbtn"
                          style={{ background: "#0284c7", color: "#ffffff", borderColor: "#0284c7", width: "100%", height: "22px" }}
                          onClick={() => {
                            applyTableColor(customHexInput);
                            setShowCustomHexPopover(false);
                          }}
                        >
                          Terapkan
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <span className="doc-ribbon-group-label">
                  Warna {tableColorTarget === "header" ? "Header" : tableColorTarget === "cell" ? "Sel" : tableColorTarget === "row" ? "Baris" : "Tabel"} (Kustom)
                </span>
              </div>

              <div className="doc-ribbon-divider" />

              {/* 6. Desain Cepat & Hapus Tabel */}
              <div className="doc-ribbon-group group-table-presets">
                <div className="doc-ribbon-row-top" style={{ display: "flex", gap: "3px" }}>
                  <button
                    type="button"
                    className="doc-ribbon-table-subbtn"
                    onClick={() => applyTableThemePreset("corporate")}
                    title="Tema Standar Ekspor: Header Navy & Garis Abu"
                  >
                    Standar Ekspor
                  </button>
                  <button
                    type="button"
                    className="doc-ribbon-table-subbtn"
                    onClick={() => applyTableThemePreset("zebra")}
                    title="Zebra Striping: Baris Selang-Seling"
                  >
                    Zebra
                  </button>
                  <button
                    type="button"
                    className="doc-ribbon-table-subbtn"
                    onClick={() => applyTableThemePreset("minimal")}
                    title="Gaya Minimalis: Header Abu & Garis Tipis"
                  >
                    Minimalis
                  </button>
                </div>

                <div className="doc-ribbon-row-bottom" style={{ display: "flex", gap: "3px" }}>
                  <button
                    type="button"
                    className="doc-ribbon-table-subbtn"
                    onClick={() => applyTableThemePreset("emerald")}
                    title="Tema Hijau Zamrud (Pertanian / Pangan Organik)"
                  >
                    Zamrud
                  </button>
                  <button
                    type="button"
                    className="doc-ribbon-table-subbtn"
                    onClick={() => applyTableThemePreset("royal")}
                    title="Tema Biru Royal Modern"
                  >
                    Royal Blue
                  </button>
                  <button
                    type="button"
                    className="doc-ribbon-table-subbtn"
                    onClick={() => applyTableThemePreset("burgundy")}
                    title="Tema Merah Marun Eksklusif"
                  >
                    Marun
                  </button>
                  <button
                    type="button"
                    className="doc-ribbon-table-subbtn danger"
                    onClick={deleteTable}
                    title="Hapus Seluruh Tabel Ini"
                  >
                    <Trash2 size={11} />
                    <span>Hapus</span>
                  </button>
                </div>

                <span className="doc-ribbon-group-label">Tema Desain Cepat</span>
              </div>
            </>
          )}

          {/* ================= TAB 5: FORMAT GAMBAR (PICTURE TOOLS) ================= */}
          {activeRibbonTab === "picture" && (
            <>
              {/* 1. Bungkus Teks (Wrap Text - Sesuai Microsoft Word) */}
              <div className="doc-ribbon-group group-wrap-text">
                <div className="doc-ribbon-row-top" style={{ display: "flex", gap: "4px" }}>
                  <select
                    className="doc-ribbon-select"
                    value={shipment.letterheadLogoWrap || "inline"}
                    onChange={(e) => {
                      const wrap = e.target.value as any;
                      update("letterheadLogoWrap", wrap);
                      toast.success(`Bungkus teks diatur: ${wrap === "behind" ? "Di Belakang Teks (Watermark)" : wrap === "front" ? "Di Depan Teks" : wrap === "square" ? "Kotak (Square)" : wrap === "topBottom" ? "Atas & Bawah" : "Sejajar Teks"}`);
                    }}
                    title="Bungkus Teks (Wrap Text) sesuai Microsoft Word"
                    style={{ fontWeight: 600, color: "#1e3a8a", minWidth: "140px" }}
                  >
                    <option value="inline">📄 Sejajar Teks (In Line)</option>
                    <option value="square">🔲 Kotak (Square Wrap)</option>
                    <option value="behind">📑 Di Belakang Teks (Watermark)</option>
                    <option value="front">🏷️ Di Depan Teks (Floating)</option>
                    <option value="topBottom">📜 Atas dan Bawah</option>
                  </select>
                </div>

                <div className="doc-ribbon-row-bottom" style={{ display: "flex", gap: "2px" }}>
                  <button
                    type="button"
                    className={`doc-ribbon-btn-icon ${shipment.letterheadLogoWrap === "inline" || !shipment.letterheadLogoWrap ? "active" : ""}`}
                    onClick={() => update("letterheadLogoWrap", "inline")}
                    title="Sejajar dengan Teks (In Line with Text)"
                  >
                    <span style={{ fontSize: "10px", fontWeight: 700 }}>Sejajar</span>
                  </button>
                  <button
                    type="button"
                    className={`doc-ribbon-btn-icon ${shipment.letterheadLogoWrap === "square" ? "active" : ""}`}
                    onClick={() => update("letterheadLogoWrap", "square")}
                    title="Kotak: Teks mengalir mengelilingi logo"
                  >
                    <span style={{ fontSize: "10px", fontWeight: 700 }}>Kotak</span>
                  </button>
                  <button
                    type="button"
                    className={`doc-ribbon-btn-icon ${shipment.letterheadLogoWrap === "behind" ? "active" : ""}`}
                    onClick={() => {
                      update("letterheadLogoWrap", "behind");
                      if (!shipment.letterheadLogoOpacity || shipment.letterheadLogoOpacity === 100) {
                        update("letterheadLogoOpacity", 30); // Default good watermark opacity
                      }
                    }}
                    title="Di Belakang Teks (Watermark Resmi: Logo berada di bawah naskah)"
                  >
                    <span style={{ fontSize: "10px", fontWeight: 700 }}>Belakang</span>
                  </button>
                  <button
                    type="button"
                    className={`doc-ribbon-btn-icon ${shipment.letterheadLogoWrap === "front" ? "active" : ""}`}
                    onClick={() => update("letterheadLogoWrap", "front")}
                    title="Di Depan Teks (Melayang di atas naskah/stempel)"
                  >
                    <span style={{ fontSize: "10px", fontWeight: 700 }}>Depan</span>
                  </button>
                </div>
                <span className="doc-ribbon-group-label">Bungkus Teks (Wrap)</span>
              </div>

              <div className="doc-ribbon-divider" />

              {/* 2. Posisi & Perataan Gambar */}
              <div className="doc-ribbon-group group-pic-position">
                <div className="doc-ribbon-row-top" style={{ display: "flex", gap: "3px" }}>
                  <button
                    type="button"
                    className={`doc-ribbon-btn-icon ${shipment.letterheadLogoAlign === "left" || !shipment.letterheadLogoAlign ? "active" : ""}`}
                    onClick={() => {
                      update("letterheadLogoAlign", "left");
                      update("letterheadLogoX", 0);
                      update("letterheadLogoY", 0);
                      toast.success("Posisi logo diatur: Rata Kiri");
                    }}
                    title="Posisi Kiri"
                  >
                    <AlignLeft size={13} />
                    <span style={{ fontSize: "10px", marginLeft: "2px" }}>Kiri</span>
                  </button>
                  <button
                    type="button"
                    className={`doc-ribbon-btn-icon ${shipment.letterheadLogoAlign === "center" ? "active" : ""}`}
                    onClick={() => {
                      update("letterheadLogoAlign", "center");
                      toast.success("Posisi logo diatur: Tengah");
                    }}
                    title="Posisi Tengah"
                  >
                    <AlignCenter size={13} />
                    <span style={{ fontSize: "10px", marginLeft: "2px" }}>Tengah</span>
                  </button>
                  <button
                    type="button"
                    className={`doc-ribbon-btn-icon ${shipment.letterheadLogoAlign === "right" ? "active" : ""}`}
                    onClick={() => {
                      update("letterheadLogoAlign", "right");
                      toast.success("Posisi logo diatur: Rata Kanan");
                    }}
                    title="Posisi Kanan"
                  >
                    <AlignRight size={13} />
                    <span style={{ fontSize: "10px", marginLeft: "2px" }}>Kanan</span>
                  </button>
                </div>

                <div className="doc-ribbon-row-bottom" style={{ display: "flex", gap: "3px" }}>
                  <button
                    type="button"
                    className="doc-ribbon-table-subbtn"
                    onClick={() => {
                      update("letterheadLogoX", 0);
                      update("letterheadLogoY", 0);
                      toast.success("Koordinat posisi logo di-reset ke awal");
                    }}
                    title="Reset Posisi Koordinat X & Y"
                  >
                    <Move size={11} />
                    <span>Reset Posisi</span>
                  </button>
                  <span style={{ fontSize: "10px", color: "#64748b", alignSelf: "center" }}>
                    X: {shipment.letterheadLogoX || 0}px · Y: {shipment.letterheadLogoY || 0}px
                  </span>
                </div>
                <span className="doc-ribbon-group-label">Posisi & Perataan</span>
              </div>

              <div className="doc-ribbon-divider" />

              {/* 3. Opasitas / Watermark Slider */}
              <div className="doc-ribbon-group group-pic-opacity">
                <div className="doc-ribbon-row-top" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <SunMedium size={13} className="text-amber-600" />
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={shipment.letterheadLogoOpacity ?? 100}
                    onChange={(e) => update("letterheadLogoOpacity", Number(e.target.value))}
                    title={`Transparansi / Opasitas Logo: ${shipment.letterheadLogoOpacity ?? 100}%`}
                    style={{ width: "90px", accentColor: "#2563eb", cursor: "pointer" }}
                  />
                  <span style={{ fontSize: "11px", fontWeight: 700, minWidth: "32px", color: "#1e293b" }}>
                    {shipment.letterheadLogoOpacity ?? 100}%
                  </span>
                </div>

                <div className="doc-ribbon-row-bottom" style={{ display: "flex", gap: "3px" }}>
                  <button
                    type="button"
                    className="doc-ribbon-table-subbtn"
                    onClick={() => {
                      update("letterheadLogoOpacity", 30);
                      update("letterheadLogoWrap", "behind");
                      toast.success("Mode Watermark Kop Surat Aktif (30% di Belakang Teks)");
                    }}
                    title="Atur otomatis sebagai Watermark Kop (30% transparan di belakang teks)"
                  >
                    Watermark 30%
                  </button>
                  <button
                    type="button"
                    className="doc-ribbon-table-subbtn"
                    onClick={() => {
                      update("letterheadLogoOpacity", 100);
                      toast.success("Opasitas logo solid 100%");
                    }}
                    title="Solid 100%"
                  >
                    Solid 100%
                  </button>
                </div>
                <span className="doc-ribbon-group-label">Opasitas / Watermark</span>
              </div>

              <div className="doc-ribbon-divider" />

              {/* 4. Rotasi & Sudut Gambar */}
              <div className="doc-ribbon-group group-pic-rotate">
                <div className="doc-ribbon-row-top" style={{ display: "flex", gap: "3px" }}>
                  <button
                    type="button"
                    className="doc-ribbon-btn-icon"
                    onClick={() => {
                      const cur = shipment.letterheadLogoRotate || 0;
                      const next = (cur + 90) % 360;
                      update("letterheadLogoRotate", next);
                      toast.success(`Logo diputar ke ${next}°`);
                    }}
                    title="Putar 90 Derajat Searah Jarum Jam"
                  >
                    <RotateCw size={13} />
                    <span style={{ fontSize: "10px", marginLeft: "2px" }}>+90°</span>
                  </button>
                  <button
                    type="button"
                    className="doc-ribbon-btn-icon"
                    onClick={() => {
                      update("letterheadLogoRotate", 0);
                      toast.success("Rotasi logo di-reset ke 0° (tegak lurus)");
                    }}
                    title="Tegak Lurus (0°)"
                  >
                    <span style={{ fontSize: "10px", fontWeight: 700 }}>0° Normal</span>
                  </button>
                </div>

                <div className="doc-ribbon-row-bottom">
                  <span style={{ fontSize: "10px", color: "#64748b" }}>
                    Sudut Rotasi: {shipment.letterheadLogoRotate || 0}°
                  </span>
                </div>
                <span className="doc-ribbon-group-label">Rotasi Gambar</span>
              </div>

              <div className="doc-ribbon-divider" />

              {/* 5. Gaya Bingkai / Picture Style */}
              <div className="doc-ribbon-group group-pic-style">
                <div className="doc-ribbon-row-top" style={{ display: "flex", gap: "3px" }}>
                  <select
                    className="doc-ribbon-select"
                    value={shipment.letterheadLogoBorder || "none"}
                    onChange={(e) => {
                      const b = e.target.value as any;
                      update("letterheadLogoBorder", b);
                      toast.success(`Bingkai logo: ${b}`);
                    }}
                    title="Bentuk Bingkai Logo"
                    style={{ fontSize: "11px" }}
                  >
                    <option value="none">Tanpa Bingkai</option>
                    <option value="solid">Bingkai Tipis Solid</option>
                    <option value="dashed">Garis Putus (Dashed)</option>
                    <option value="rounded">Sudut Bulat (Rounded)</option>
                  </select>
                </div>

                <div className="doc-ribbon-row-bottom" style={{ display: "flex", gap: "3px" }}>
                  <button
                    type="button"
                    className={`doc-ribbon-table-subbtn ${shipment.letterheadLogoShadow ? "active" : ""}`}
                    onClick={() => {
                      const next = !shipment.letterheadLogoShadow;
                      update("letterheadLogoShadow", next);
                      toast.success(next ? "Efek bayangan logo diaktifkan" : "Efek bayangan dinonaktifkan");
                    }}
                    title="Efek Bayangan Lembut (Soft Shadow)"
                  >
                    <span>Bayangan {shipment.letterheadLogoShadow ? "✓" : ""}</span>
                  </button>
                </div>
                <span className="doc-ribbon-group-label">Gaya Bingkai & Efek</span>
              </div>

              <div className="doc-ribbon-divider" />

              {/* 6. Skala & Ukuran Gambar */}
              <div className="doc-ribbon-group group-pic-size">
                <div className="doc-ribbon-row-top" style={{ display: "flex", gap: "3px" }}>
                  <button
                    type="button"
                    className="doc-ribbon-btn-icon"
                    onClick={() => {
                      const cur = shipment.letterheadLogoScale ?? 100;
                      const next = Math.max(30, cur - 10);
                      update("letterheadLogoScale", next);
                    }}
                    title="Perkecil Ukuran Logo (-10%)"
                  >
                    <ZoomOut size={13} />
                  </button>
                  <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 4px", minWidth: "38px", textAlign: "center" }}>
                    {shipment.letterheadLogoScale ?? 100}%
                  </span>
                  <button
                    type="button"
                    className="doc-ribbon-btn-icon"
                    onClick={() => {
                      const cur = shipment.letterheadLogoScale ?? 100;
                      const next = Math.min(300, cur + 10);
                      update("letterheadLogoScale", next);
                    }}
                    title="Perbesar Ukuran Logo (+10%)"
                  >
                    <ZoomIn size={13} />
                  </button>
                </div>

                <div className="doc-ribbon-row-bottom">
                  <button
                    type="button"
                    className="doc-ribbon-table-subbtn"
                    onClick={() => {
                      update("letterheadLogoScale", 100);
                      update("letterheadLogoWrap", "inline");
                      update("letterheadLogoAlign", "left");
                      update("letterheadLogoX", 0);
                      update("letterheadLogoY", 0);
                      update("letterheadLogoOpacity", 100);
                      update("letterheadLogoRotate", 0);
                      update("letterheadLogoBorder", "none");
                      update("letterheadLogoShadow", false);
                      toast.success("Format gambar di-reset ke standar awal");
                    }}
                    title="Reset Seluruh Format Gambar ke Awal"
                  >
                    <RotateCcw size={11} />
                    <span>Reset Format</span>
                  </button>
                </div>
                <span className="doc-ribbon-group-label">Ukuran Logo</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Pop-up Modal: Pengaturan Margin Kertas (Page Setup) */}
      {showMarginModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 no-print animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-blue-300" />
                <div>
                  <h3 className="font-bold text-sm">Pengaturan Margin Kertas</h3>
                  <p className="text-xs text-blue-200">Standar Dokumen Ekspor & Microsoft Word</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMarginModal(false)}
                className="text-slate-300 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Presets Grid */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">
                  Pilihan Cepat Standar Margin Word
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "Normal", name: "Normal", top: 25.4, bottom: 25.4, left: 25.4, right: 25.4, desc: "2.54 cm tiap sisi" },
                    { id: "Sempit", name: "Sempit (Narrow)", top: 12.7, bottom: 12.7, left: 12.7, right: 12.7, desc: "1.27 cm (Muat Lebih Banyak)" },
                    { id: "Standar Ekspor", name: "Standar Ekspor", top: 20, bottom: 20, left: 20, right: 20, desc: "2.00 cm (Kop & Stempel)" },
                    { id: "Sedang", name: "Sedang (Moderate)", top: 25.4, bottom: 25.4, left: 19.1, right: 19.1, desc: "Atas/Bwh 2.54, Samping 1.91 cm" },
                  ].map((preset) => {
                    const isSelected =
                      Math.abs(customMarginInputs.top - preset.top) < 0.2 &&
                      Math.abs(customMarginInputs.bottom - preset.bottom) < 0.2 &&
                      Math.abs(customMarginInputs.left - preset.left) < 0.2 &&
                      Math.abs(customMarginInputs.right - preset.right) < 0.2;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setCustomMarginInputs({
                            top: preset.top,
                            bottom: preset.bottom,
                            left: preset.left,
                            right: preset.right,
                          });
                        }}
                        className={`text-left p-2.5 rounded-lg border transition-all ${
                          isSelected
                            ? "bg-blue-50 border-blue-500 ring-2 ring-blue-500/20"
                            : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <div className="font-bold text-xs text-slate-800 flex items-center justify-between">
                          <span>{preset.name}</span>
                          {isSelected && <Check size={13} className="text-blue-600" />}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{preset.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Inputs with Diagram */}
              <div className="pt-3 border-t border-slate-200">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">
                  Batas Margin Kustom (cm / mm)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-semibold text-slate-600 block">Atas (Top)</span>
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="number"
                        min="5"
                        max="80"
                        step="0.5"
                        value={customMarginInputs.top}
                        onChange={(e) => setCustomMarginInputs((p) => ({ ...p, top: Number(e.target.value) }))}
                        className="w-full px-2 py-1 text-xs font-bold border border-slate-300 rounded bg-white"
                      />
                      <span className="text-[11px] text-slate-500">mm</span>
                    </div>
                    <span className="text-[10px] text-blue-600 font-medium block mt-0.5">
                      {(customMarginInputs.top / 10).toFixed(2)} cm
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-semibold text-slate-600 block">Bawah (Bottom)</span>
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="number"
                        min="5"
                        max="80"
                        step="0.5"
                        value={customMarginInputs.bottom}
                        onChange={(e) => setCustomMarginInputs((p) => ({ ...p, bottom: Number(e.target.value) }))}
                        className="w-full px-2 py-1 text-xs font-bold border border-slate-300 rounded bg-white"
                      />
                      <span className="text-[11px] text-slate-500">mm</span>
                    </div>
                    <span className="text-[10px] text-blue-600 font-medium block mt-0.5">
                      {(customMarginInputs.bottom / 10).toFixed(2)} cm
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-semibold text-slate-600 block">Kiri (Left)</span>
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="number"
                        min="5"
                        max="80"
                        step="0.5"
                        value={customMarginInputs.left}
                        onChange={(e) => setCustomMarginInputs((p) => ({ ...p, left: Number(e.target.value) }))}
                        className="w-full px-2 py-1 text-xs font-bold border border-slate-300 rounded bg-white"
                      />
                      <span className="text-[11px] text-slate-500">mm</span>
                    </div>
                    <span className="text-[10px] text-blue-600 font-medium block mt-0.5">
                      {(customMarginInputs.left / 10).toFixed(2)} cm
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-semibold text-slate-600 block">Kanan (Right)</span>
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="number"
                        min="5"
                        max="80"
                        step="0.5"
                        value={customMarginInputs.right}
                        onChange={(e) => setCustomMarginInputs((p) => ({ ...p, right: Number(e.target.value) }))}
                        className="w-full px-2 py-1 text-xs font-bold border border-slate-300 rounded bg-white"
                      />
                      <span className="text-[11px] text-slate-500">mm</span>
                    </div>
                    <span className="text-[10px] text-blue-600 font-medium block mt-0.5">
                      {(customMarginInputs.right / 10).toFixed(2)} cm
                    </span>
                  </div>
                </div>
              </div>

              {/* Mini Diagram Visualizer */}
              <div className="bg-slate-100 p-3 rounded-lg border border-slate-200 flex flex-col items-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Pratinjau Kertas ({shipment.paperSize || "A4"} · {shipment.documentOrientation || "Portrait"})
                </span>
                <div
                  className="w-32 h-44 bg-white border-2 border-slate-300 shadow-xs relative flex items-center justify-center"
                  style={{
                    padding: `${Math.max(4, customMarginInputs.top / 3)}px ${Math.max(4, customMarginInputs.right / 3)}px ${Math.max(4, customMarginInputs.bottom / 3)}px ${Math.max(4, customMarginInputs.left / 3)}px`,
                  }}
                >
                  <div className="w-full h-full border border-dashed border-blue-400 bg-blue-50/50 flex flex-col justify-center items-center p-1 text-[8px] text-blue-700 font-bold">
                    <span>Area Teks</span>
                  </div>
                  <span className="absolute top-0.5 text-[8px] text-slate-400">{(customMarginInputs.top / 10).toFixed(1)}cm</span>
                  <span className="absolute bottom-0.5 text-[8px] text-slate-400">{(customMarginInputs.bottom / 10).toFixed(1)}cm</span>
                  <span className="absolute left-0.5 text-[8px] text-slate-400">{(customMarginInputs.left / 10).toFixed(1)}cm</span>
                  <span className="absolute right-0.5 text-[8px] text-slate-400">{(customMarginInputs.right / 10).toFixed(1)}cm</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowMarginModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  update("docMarginPreset", "Kustom");
                  update("docMarginTop", customMarginInputs.top);
                  update("docMarginBottom", customMarginInputs.bottom);
                  update("docMarginLeft", customMarginInputs.left);
                  update("docMarginRight", customMarginInputs.right);
                  toast.success("Margin kertas kustom berhasil diterapkan!", {
                    description: `Atas: ${(customMarginInputs.top / 10).toFixed(2)}cm, Bawah: ${(customMarginInputs.bottom / 10).toFixed(2)}cm, Kiri: ${(customMarginInputs.left / 10).toFixed(2)}cm, Kanan: ${(customMarginInputs.right / 10).toFixed(2)}cm`,
                  });
                  setShowMarginModal(false);
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Check size={14} />
                Terapkan Margin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pop-up Modal: Pengaturan Spasi Antar Baris Kustom */}
      {showCustomLineHeightModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 no-print animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlignJustify size={18} className="text-blue-300" />
                <div>
                  <h3 className="font-bold text-sm">Pengaturan Spasi Antar Baris</h3>
                  <p className="text-xs text-blue-200">Line Spacing Sesuai Microsoft Word</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomLineHeightModal(false)}
                className="text-slate-300 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {/* Quick Presets Pills */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">
                  Pilihan Cepat Standar Spasi Word
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[1.0, 1.15, 1.25, 1.35, 1.5, 1.75, 2.0, 2.5, 3.0].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setCustomLineHeightInput(val)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all ${
                        Math.abs(customLineHeightInput - val) < 0.01
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                          : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                      }`}
                    >
                      {val.toFixed(2)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Numeric Input with +/- buttons */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 block">
                  Nilai Kelipatan Spasi (Multiplier)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomLineHeightInput((prev) => Math.max(0.8, Math.round((prev - 0.05) * 100) / 100))}
                    className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-300 text-slate-700 font-bold hover:bg-slate-200 flex items-center justify-center text-base"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0.8"
                    max="4.0"
                    step="0.05"
                    value={customLineHeightInput}
                    onChange={(e) => setCustomLineHeightInput(Number(e.target.value))}
                    className="flex-1 h-10 px-3 border border-slate-300 rounded-lg text-center font-bold text-base text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setCustomLineHeightInput((prev) => Math.min(4.0, Math.round((prev + 0.05) * 100) / 100))}
                    className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-300 text-slate-700 font-bold hover:bg-slate-200 flex items-center justify-center text-base"
                  >
                    +
                  </button>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Contoh: 1.15 (rapat modern), 1.35 (standar ekspor resmi), 1.50 (satu setengah baris), 2.0 (ganda).
                </span>
              </div>

              {/* Live Preview Box */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Pratinjau Teks (Live Preview)
                </span>
                <div
                  style={{
                    lineHeight: customLineHeightInput,
                    fontSize: "12px",
                    fontFamily: shipment.docEditorFontFamily || "Calibri",
                    color: "#334155",
                  }}
                  className="p-3 bg-white border border-slate-200 rounded"
                >
                  <div>Ini adalah baris pertama naskah resmi surat ekspor internasional.</div>
                  <div>Jarak antar baris teks ini diatur sebesar {customLineHeightInput.toFixed(2)}x kelipatan spasi.</div>
                  <div>Format ini diterapkan langsung ke dokumen sesuai standar Microsoft Word.</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowCustomLineHeightModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  update("docEditorLineHeight", customLineHeightInput);
                  if (isTextSelected()) {
                    applyInlineStyleToSelection({ "line-height": `${customLineHeightInput}` });
                    toast.success(`Spasi baris teks terpilih diatur ke ${customLineHeightInput.toFixed(2)}x`);
                  } else {
                    toast.success(`Spasi baris seluruh dokumen diatur ke ${customLineHeightInput.toFixed(2)}x`);
                  }
                  setShowCustomLineHeightModal(false);
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Check size={14} />
                Terapkan Spasi
              </button>
            </div>
          </div>
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
