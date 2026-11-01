import React, { useState } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import type { Shipment } from "@shared/shipment";

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

  const activeFontFamily = shipment.docEditorFontFamily || "Calibri";
  const activeFontSize = shipment.docEditorFontSize || 12;
  const activeLineHeight = shipment.docEditorLineHeight || 1.35;

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

  return (
    <div className="doc-word-ribbon-container">
      {/* 1. Ribbon Title Bar */}
      <div className="doc-ribbon-top-bar">
        <div className="doc-ribbon-brand">
          <div className="doc-word-icon-badge">W</div>
          <span className="doc-ribbon-title">EksporFlow Word Editor</span>
          <span className="doc-ribbon-subtitle">Toolbar Format & Editor Surat Resmi Ekspor</span>
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
            <span>{isEditMode ? "Mode Edit Aktif (Bisa Diketik)" : "Kunci Mode Pratinjau"}</span>
            <div className={`doc-mode-dot ${isEditMode ? "on" : "off"}`} />
          </button>

          {/* Digital Signature Trigger */}
          <button
            type="button"
            className="doc-ribbon-sig-btn"
            onClick={() => onOpenSignatureModal("seller")}
            title="Buka panel Tanda Tangan Digital & Stempel Resmi"
          >
            <FileSignature size={14} />
            <span>Tanda Tangan Digital</span>
          </button>

          {/* Minimize / Expand Ribbon */}
          <button
            type="button"
            className="doc-ribbon-collapse-btn"
            onClick={() => setIsRibbonCollapsed((prev) => !prev)}
            title={isRibbonCollapsed ? "Tampilkan Ribbon Penuh" : "Ciutkan Ribbon"}
          >
            {isRibbonCollapsed ? "▼ Buka Toolbar" : "▲ Ciutkan"}
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
            <b>Mode Edit Word Aktif:</b> Anda dapat mengeklik bagian manapun pada surat/dokumen (artikel, nama buyer, rincian koli, syarat bayar) untuk mengedit, menambah klausul, atau mengubah kata secara bebas.
          </span>
        </div>
      )}
    </div>
  );
}
