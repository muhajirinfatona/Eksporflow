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
} from "lucide-react";
import { toast } from "sonner";
import type { Shipment, PaperSize, DocumentOrientation } from "@shared/shipment";
import { getPaperSizeSpec } from "@shared/shipment";

interface DocWordRibbonProps {
  shipment: Shipment;
  update: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void;
  isEditMode: boolean;
  setIsEditMode: (val: boolean) => void;
  onOpenSignatureModal: (party?: "seller" | "buyer") => void;
  onResetDocument: () => void;
}

export function DocWordRibbon({
  shipment,
  update,
  isEditMode,
  setIsEditMode,
  onOpenSignatureModal,
  onResetDocument,
}: DocWordRibbonProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [isRibbonCollapsed, setIsRibbonCollapsed] = useState(false);

  // Table creator state
  const [showTableMenu, setShowTableMenu] = useState(false);
  const [customRows, setCustomRows] = useState(3);
  const [customCols, setCustomCols] = useState(3);
  const [hoverGrid, setHoverGrid] = useState<{ r: number; c: number }>({ r: 0, c: 0 });
  const tableMenuRef = useRef<HTMLDivElement>(null);

  const activeFontFamily = shipment.docEditorFontFamily || "Calibri";
  const activeFontSize = shipment.docEditorFontSize || 12;
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

  // Click outside to close table popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tableMenuRef.current && !tableMenuRef.current.contains(event.target as Node)) {
        setShowTableMenu(false);
      }
    }
    if (showTableMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showTableMenu]);

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
      tableHtml += `<th style="border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; font-weight: 700; color: #0f2942;">Kolom ${c}</th>`;
    }
    tableHtml += `</tr></thead><tbody>`;
    for (let r = 1; r <= rows; r++) {
      tableHtml += `<tr>`;
      for (let c = 1; c <= cols; c++) {
        tableHtml += `<td style="border: 1px solid #cbd5e1; padding: 6px 10px; color: #0f172a;">Data ${r}.${c}</td>`;
      }
      tableHtml += `</tr>`;
    }
    tableHtml += `</tbody></table><p><br/></p>`;

    const selection = window.getSelection();
    const paperDoc = document.querySelector(".paper-document");

    if (selection && selection.rangeCount > 0 && paperDoc && paperDoc.contains(selection.anchorNode)) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = tableHtml;
      const frag = document.createDocumentFragment();
      let node: Node | null;
      while ((node = tempDiv.firstChild)) {
        frag.appendChild(node);
      }
      range.insertNode(frag);
    } else if (paperDoc) {
      const targetSection = paperDoc.querySelector(".doc-witness-clause, .doc-dual-signatures, .doc-single-signature-wrap") || paperDoc;
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = tableHtml;
      if (targetSection !== paperDoc && targetSection.parentNode) {
        targetSection.parentNode.insertBefore(tempDiv.firstChild!, targetSection);
      } else {
        paperDoc.appendChild(tempDiv.firstChild!);
      }
    }

    if (!isEditMode) {
      setIsEditMode(true);
      update("docEditorMode", true);
    }
    setShowTableMenu(false);
    toast.success(`Tabel ${rows} × ${cols} berhasil disisipkan!`, {
      description: "Klik pada sel tabel untuk langsung mengisi dan mengedit teks.",
    });
  };

  const addTableRow = () => {
    const selection = window.getSelection();
    const currentCell = selection?.anchorNode?.parentElement?.closest("td, th");
    const table = currentCell?.closest("table");
    if (!table) {
      toast.error("Klik salah satu sel tabel terlebih dahulu");
      return;
    }
    const colCount = table.rows[0]?.cells.length || 2;
    const newRow = table.insertRow();
    for (let i = 0; i < colCount; i++) {
      const newCell = newRow.insertCell();
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
      toast.error("Klik salah satu sel tabel terlebih dahulu");
      return;
    }
    for (let i = 0; i < table.rows.length; i++) {
      const row = table.rows[i];
      const isHeader = row.parentElement?.tagName === "THEAD" || i === 0;
      const newCell = document.createElement(isHeader ? "th" : "td");
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
          <span className="doc-ribbon-subtitle">Format & Editor Resmi</span>
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
                toast.info("Mode Pratinjau Cetak Terkunci", {
                  description: "Teks terkunci untuk pratinjau cetak dan ekspor.",
                });
              }
            }}
            title="Aktifkan atau kunci mode pengetikan langsung di kertas"
          >
            <Edit3 size={13} />
            <span>{isEditMode ? "Mode Edit Aktif" : "Mode Pratinjau"}</span>
            <div className={`doc-mode-dot ${isEditMode ? "on" : "off"}`} />
          </button>

          {/* Digital Signature Trigger (Unique here, not duplicated above) */}
          <button
            type="button"
            className="doc-ribbon-sig-btn"
            onClick={() => onOpenSignatureModal("seller")}
            title="Buka panel Tanda Tangan Digital & Stempel Resmi"
          >
            <FileSignature size={14} />
            <span>Tanda Tangan</span>
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

      {/* 2. Main Ribbon Tools Strip */}
      {!isRibbonCollapsed && (
        <div className="doc-ribbon-tools-strip">
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

              {/* Font Size Dropdown */}
              <select
                className="doc-ribbon-select font-size-select"
                value={activeFontSize}
                onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                title="Ukuran Huruf Dokumen (Font Size)"
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
                title="Perbesar Ukuran Font (A^)"
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
                title="Perkecil Ukuran Font (Av)"
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

            <span className="doc-ribbon-group-label">Font</span>
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

          {/* TABLE TOOLS GROUP (NEW: Seperti di Word) */}
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

              {/* Quick Row/Col Add Buttons */}
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

            <span className="doc-ribbon-group-label">Tabel</span>

            {/* Table Insert Popover Modal/Dropdown */}
            {showTableMenu && (
              <div className="doc-table-popover" role="dialog">
                <div className="doc-table-popover-header">
                  <span className="popover-title">SISIPKAN TABEL</span>
                  <span className="popover-sub">
                    {hoverGrid.r > 0 && hoverGrid.c > 0 ? `Tabel ${hoverGrid.r} × ${hoverGrid.c}` : "Pilih Ukuran Grid"}
                  </span>
                </div>

                {/* 5x5 Grid Selector like MS Word */}
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

                {/* Custom Dimensions Form */}
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

          {/* PAGE SETUP / UKURAN KERTAS GROUP (NEW: Seperti di Microsoft Word) */}
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

            <span className="doc-ribbon-group-label">Kertas</span>
          </div>

          <div className="doc-ribbon-divider" />

          {/* Quick Reset & Status Info */}
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
        </div>
      )}

      {/* Editing Notification Banner when in Edit Mode */}
      {isEditMode && (
        <div className="doc-ribbon-edit-hint">
          <Edit3 size={13} />
          <span>
            <b>Mode Edit Word Aktif:</b> Anda dapat mengeklik bagian manapun pada surat/dokumen (artikel, nama buyer, rincian koli, syarat bayar) untuk mengedit, menyisipkan tabel, atau mengubah klausul bebas.
          </span>
        </div>
      )}
    </div>
  );
}
