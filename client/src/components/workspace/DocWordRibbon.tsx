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
} from "lucide-react";
import { toast } from "sonner";
import type { Shipment, PaperSize, DocumentOrientation, DocMarginPreset } from "@shared/shipment";
import { getPaperSizeSpec, getDocMargins, DOC_MARGIN_PRESETS } from "@shared/shipment";

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
  const [activeRibbonTab, setActiveRibbonTab] = useState<"home" | "layout" | "insert">("home");
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

  const activeFontFamily = shipment.docEditorFontFamily || "Calibri";
  const activeFontSize = shipment.docEditorFontSize || 12;
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

  // Execute formatting command while keeping selection
  const runCommand = (command: string, value: string | undefined = undefined) => {
    try {
      document.execCommand(command, false, value);
    } catch {
      // Fallback
    }
  };

  const handleFontFamilyChange = (font: string) => {
    update("docEditorFontFamily", font);
    runCommand("fontName", font);
  };

  const handleFontSizeChange = (size: number) => {
    update("docEditorFontSize", size);
  };

  const stepFontSize = (delta: number) => {
    const nextSize = Math.max(8, Math.min(28, (shipment.docEditorFontSize || 12) + delta));
    handleFontSizeChange(nextSize);
  };

  const handleLineHeightChange = (lh: number) => {
    update("docEditorLineHeight", lh);
  };

  const handleTextColor = (color: string) => {
    runCommand("foreColor", color);
    setShowColorPicker(false);
  };

  const handleHighlightColor = (color: string) => {
    runCommand("hiliteColor", color);
    setShowHighlightPicker(false);
  };

  const handleCaseChange = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const selectedText = selection.toString();
    if (!selectedText) return;

    const isAllUpper = selectedText === selectedText.toUpperCase();
    const transformed = isAllUpper
      ? selectedText.toLowerCase()
      : selectedText.toUpperCase();
    runCommand("insertText", transformed);
  };

  // --- Table Operations ---
  const insertTable = (rows: number, cols: number) => {
    if (rows <= 0 || cols <= 0) return;

    let tableHtml = `<table class="doc-user-table" style="width: 100%; border-collapse: collapse; margin: 12px 0; font-size: inherit; border: 1.5px solid #0f2942;"><thead><tr style="background: #f1f5f9; border-bottom: 2px solid #0f2942;">`;
    for (let c = 1; c <= cols; c++) {
      tableHtml += `<th style="border: 1px solid #cbd5e1; padding: 6px 10px; font-weight: 700; color: #0f2942; text-align: left;">Kolom ${c}</th>`;
    }
    tableHtml += `</tr></thead><tbody>`;

    for (let r = 1; r <= rows; r++) {
      tableHtml += `<tr style="border-bottom: 1px solid #cbd5e1;">`;
      for (let c = 1; c <= cols; c++) {
        tableHtml += `<td style="border: 1px solid #cbd5e1; padding: 6px 10px; color: #0f172a;">Data ${r}.${c}</td>`;
      }
      tableHtml += `</tr>`;
    }
    tableHtml += `</tbody></table><p><br></p>`;

    runCommand("insertHTML", tableHtml);
    setShowTableMenu(false);
    toast.success(`Tabel ${rows} × ${cols} berhasil disisipkan`);
  };

  const addTableRow = () => {
    const selection = window.getSelection();
    const currentCell = selection?.anchorNode?.parentElement?.closest("td, th");
    const table = currentCell?.closest("table");
    if (!table) {
      toast.error("Klik di dalam tabel terlebih dahulu");
      return;
    }
    const colsCount = table.rows[0]?.cells.length || 3;
    const newRow = table.insertRow(-1);
    newRow.style.borderBottom = "1px solid #cbd5e1";
    for (let i = 0; i < colsCount; i++) {
      const newCell = newRow.insertCell(-1);
      newCell.style.border = "1px solid #cbd5e1";
      newCell.style.padding = "6px 10px";
      newCell.innerText = `Data Baru`;
    }
    toast.success("Baris baru berhasil ditambahkan!");
  };

  const addTableCol = () => {
    const selection = window.getSelection();
    const currentCell = selection?.anchorNode?.parentElement?.closest("td, th");
    const table = currentCell?.closest("table");
    if (!table) {
      toast.error("Klik di dalam tabel terlebih dahulu");
      return;
    }
    for (let i = 0; i < table.rows.length; i++) {
      const row = table.rows[i];
      const isHeader = i === 0 && row.parentElement?.tagName === "THEAD";
      const newCell = isHeader ? document.createElement("th") : row.insertCell(-1);
      newCell.style.border = "1px solid #cbd5e1";
      newCell.style.padding = "6px 10px";
      if (isHeader) {
        newCell.style.fontWeight = "700";
        newCell.style.color = "#0f2942";
        newCell.style.background = "#f1f5f9";
        newCell.innerText = `Kolom Baru`;
      } else {
        newCell.innerText = `Data`;
      }
      row.appendChild(newCell);
    }
    toast.success("Kolom baru berhasil ditambahkan!");
  };

  const deleteTableRow = () => {
    const selection = window.getSelection();
    const currentCell = selection?.anchorNode?.parentElement?.closest("td, th");
    const row = currentCell?.closest("tr");
    if (!row) {
      toast.error("Klik sel baris yang ingin dihapus");
      return;
    }
    row.remove();
    toast.info("Baris tabel dihapus.");
  };

  const deleteTableCol = () => {
    const selection = window.getSelection();
    const currentCell = selection?.anchorNode?.parentElement?.closest("td, th") as HTMLTableCellElement | null;
    const table = currentCell?.closest("table");
    if (!currentCell || !table) {
      toast.error("Klik sel kolom yang ingin dihapus");
      return;
    }
    const colIndex = currentCell.cellIndex;
    for (let i = 0; i < table.rows.length; i++) {
      if (table.rows[i].cells[colIndex]) {
        table.rows[i].deleteCell(colIndex);
      }
    }
    toast.info("Kolom tabel dihapus.");
  };

  const deleteTable = () => {
    const selection = window.getSelection();
    const table = selection?.anchorNode?.parentElement?.closest("table");
    if (!table) {
      toast.error("Klik tabel yang ingin dihapus");
      return;
    }
    table.remove();
    toast.info("Tabel berhasil dihapus dari dokumen.");
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

      {/* 2. Word Ribbon Tab Navigation (Beranda · Tata Letak · Sisipkan) */}
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
                    onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                    title="Ukuran Huruf Dokumen (Font Size dalam pt)"
                  >
                    <option value="8.5">8.5 pt</option>
                    <option value="9">9 pt</option>
                    <option value="10">10 pt</option>
                    <option value="11">11 pt</option>
                    <option value="12">12 pt (Standar Ekspor)</option>
                    <option value="13">13 pt</option>
                    <option value="14">14 pt</option>
                    <option value="16">16 pt</option>
                    <option value="18">18 pt</option>
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
                      runCommand("removeFormat");
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
                      onClick={() => setShowHighlightPicker((prev) => !prev)}
                      title="Warna Sorotan Teks (Highlighter)"
                    >
                      <Highlighter size={13} />
                      <div className="doc-color-bar highlight" />
                    </button>
                    {showHighlightPicker && (
                      <div className="doc-color-dropdown">
                        <button type="button" className="color-swatch swatch-yellow" onClick={() => handleHighlightColor("#fef08a")} />
                        <button type="button" className="color-swatch swatch-green" onClick={() => handleHighlightColor("#bbf7d0")} />
                        <button type="button" className="color-swatch swatch-cyan" onClick={() => handleHighlightColor("#bae6fd")} />
                        <button type="button" className="color-swatch swatch-pink" onClick={() => handleHighlightColor("#fbcfe8")} />
                        <button type="button" className="color-swatch swatch-clear" onClick={() => handleHighlightColor("transparent")} title="Hapus Sorotan">✕</button>
                      </div>
                    )}
                  </div>

                  {/* Font Color */}
                  <div className="doc-ribbon-color-wrap">
                    <button
                      type="button"
                      className="doc-ribbon-btn-icon doc-color-trigger"
                      onClick={() => setShowColorPicker((prev) => !prev)}
                      title="Warna Font Huruf (Text Color)"
                    >
                      <Baseline size={13} />
                      <div className="doc-color-bar text-color" />
                    </button>
                    {showColorPicker && (
                      <div className="doc-color-dropdown">
                        <button type="button" className="color-swatch swatch-black" onClick={() => handleTextColor("#0f172a")} />
                        <button type="button" className="color-swatch swatch-navy" onClick={() => handleTextColor("#0f2942")} />
                        <button type="button" className="color-swatch swatch-blue" onClick={() => handleTextColor("#1d4ed8")} />
                        <button type="button" className="color-swatch swatch-red" onClick={() => handleTextColor("#b91c1c")} />
                        <button type="button" className="color-swatch swatch-gray" onClick={() => handleTextColor("#475569")} />
                      </div>
                    )}
                  </div>
                </div>

                <span className="doc-ribbon-group-label">Font ({activeFontSize} pt)</span>
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
