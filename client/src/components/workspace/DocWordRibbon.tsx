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
  Upload,
  Building2,
  FlipHorizontal,
  FlipVertical,
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
  applyLineSpacingToSelection,
  getSelectionLineHeight,
  mapLineHeightToGapPx,
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

  // Microsoft Word Picture Format Dropdowns & Kop Surat Import Modal
  const [showPositionMenu, setShowPositionMenu] = useState(false);
  const [showWrapTextMenu, setShowWrapTextMenu] = useState(false);
  const [showLetterheadModal, setShowLetterheadModal] = useState(false);
  const [letterheadModalTab, setLetterheadModalTab] = useState<"import" | "spacing">("import");
  const positionMenuRef = useRef<HTMLDivElement>(null);
  const wrapTextMenuRef = useRef<HTMLDivElement>(null);
  const bannerUploadRef = useRef<HTMLInputElement>(null);
  const logoUploadRef = useRef<HTMLInputElement>(null);

  const [savedKopProfiles, setSavedKopProfiles] = useState<
    Array<{
      id: string;
      name: string;
      exporter: string;
      address: string;
      contact: string;
      layout: "left" | "center" | "split";
      dividerStyle: "double" | "thick-thin" | "single" | "none";
      dividerColor: string;
      dividerGap: number;
      spacing: number;
      logoImage?: string;
      bannerImage?: string;
      mode?: "standard" | "banner";
    }>
  >(() => {
    const defaults = [
      {
        id: "kop-indico",
        name: "PT. Indico Export Indonesia (Standar Ekspor)",
        exporter: "PT. INDICO EXPORT INDONESIA",
        address: "Jl. Adiyaksa Baru No. 1B, Kec. Panakkukang, Kota Makassar, Sulawesi Selatan, Indonesia",
        contact: "Telp: +62 812 3456 7890 · Email: official@indicoexport.com",
        layout: "left" as const,
        dividerStyle: "double" as const,
        dividerColor: "#0f2942",
        dividerGap: 4,
        spacing: 2,
        mode: "standard" as const,
      },
      {
        id: "kop-nusantara",
        name: "CV. Nusantara Spice & Coco (Kop Rata Tengah)",
        exporter: "CV. NUSANTARA SPICE & COCO GLOBAL",
        address: "Kawasan Industri Makassar (KIMA) Kav. B-14, Sulawesi Selatan, Indonesia",
        contact: "Telp: +62 411 512 889 · Email: export@nusantaraspice.co.id · Web: www.nusantaraspice.co.id",
        layout: "center" as const,
        dividerStyle: "thick-thin" as const,
        dividerColor: "#065f46",
        dividerGap: 4,
        spacing: 2,
        mode: "standard" as const,
      },
      {
        id: "kop-celebes",
        name: "PT. Celebes Agro Marine (Format Split Kiri-Kanan)",
        exporter: "PT. CELEBES AGRO MARINE",
        address: "Soekarno Hatta Port Boulevard No. 88, Makassar 90173, Indonesia",
        contact: "Phone: +62 411 361 7700 · Email: trade@celebesagro.com",
        layout: "split" as const,
        dividerStyle: "single" as const,
        dividerColor: "#1e40af",
        dividerGap: 5,
        spacing: 2,
        mode: "standard" as const,
      },
    ];
    try {
      const raw = localStorage.getItem("eksporflow_saved_kop_profiles");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return defaults;
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

    const handleOpenLetterheadModal = () => {
      setShowLetterheadModal(true);
    };

    window.addEventListener("eksporflow:table-focus", handleTableFocus);
    window.addEventListener("eksporflow:image-focus", handleImageFocus);
    window.addEventListener("eksporflow:open-letterhead-modal", handleOpenLetterheadModal);
    return () => {
      window.removeEventListener("eksporflow:table-focus", handleTableFocus);
      window.removeEventListener("eksporflow:image-focus", handleImageFocus);
      window.removeEventListener("eksporflow:open-letterhead-modal", handleOpenLetterheadModal);
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
  const [selectedLineHeight, setSelectedLineHeight] = useState<number | null>(null);
  const [hasBlockedText, setHasBlockedText] = useState(false);

  useEffect(() => {
    const handleSelectionChange = () => {
      const selected = isTextSelected();
      setHasBlockedText(selected);
      if (selected) {
        saveActiveSelection();
        const pt = getSelectionFontSize();
        const font = getSelectionFontFamily();
        const lh = getSelectionLineHeight();
        setSelectedFontSize(pt);
        setSelectedFontFamily(font);
        if (lh !== null) setSelectedLineHeight(lh);
      } else {
        setSelectedFontSize(null);
        setSelectedFontFamily(null);
        setSelectedLineHeight(null);
      }
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, []);

  const activeFontFamily = selectedFontFamily || shipment.docEditorFontFamily || "Calibri";
  const activeFontSize = selectedFontSize ?? (shipment.docEditorFontSize || 11);
  const activeLineHeight = selectedLineHeight ?? (shipment.docEditorLineHeight || 1.35);
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

  // Click outside to close table, margin, position, and wrap text popovers
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tableMenuRef.current && !tableMenuRef.current.contains(event.target as Node)) {
        setShowTableMenu(false);
      }
      if (marginMenuRef.current && !marginMenuRef.current.contains(event.target as Node)) {
        setShowMarginPopover(false);
      }
      if (positionMenuRef.current && !positionMenuRef.current.contains(event.target as Node)) {
        setShowPositionMenu(false);
      }
      if (wrapTextMenuRef.current && !wrapTextMenuRef.current.contains(event.target as Node)) {
        setShowWrapTextMenu(false);
      }
    }
    if (showTableMenu || showMarginPopover || showPositionMenu || showWrapTextMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showTableMenu, showMarginPopover, showPositionMenu, showWrapTextMenu]);

  // Microsoft Word 9-Grid Position Preset Handler
  const applyWordPositionPreset = (
    preset:
      | "inline"
      | "top-left"
      | "top-center"
      | "top-right"
      | "middle-left"
      | "middle-center"
      | "middle-right"
      | "bottom-left"
      | "bottom-center"
      | "bottom-right"
  ) => {
    update("letterheadLogoPositionPreset", preset);
    if (preset === "inline") {
      update("letterheadLogoWrap", "inline");
      update("letterheadLogoAlign", "left");
      update("letterheadLogoX", 0);
      update("letterheadLogoY", 0);
      toast.success("Posisi gambar: In Line with Text (Sejajar dengan Teks)");
    } else if (preset === "top-left") {
      update("letterheadLogoWrap", "square");
      update("letterheadLogoAlign", "left");
      update("letterheadLogoX", 0);
      update("letterheadLogoY", 0);
      toast.success("Posisi gambar: Kiri Atas dengan Bungkus Teks (Top Left)");
    } else if (preset === "top-center") {
      update("letterheadLogoWrap", "topBottom");
      update("letterheadLogoAlign", "center");
      update("letterheadLogoX", 0);
      update("letterheadLogoY", 0);
      toast.success("Posisi gambar: Tengah Atas dengan Bungkus Teks (Top Center)");
    } else if (preset === "top-right") {
      update("letterheadLogoWrap", "square");
      update("letterheadLogoAlign", "right");
      update("letterheadLogoX", 0);
      update("letterheadLogoY", 0);
      toast.success("Posisi gambar: Kanan Atas dengan Bungkus Teks (Top Right)");
    } else if (preset === "middle-left") {
      update("letterheadLogoWrap", "front");
      update("letterheadLogoAlign", "custom");
      update("letterheadLogoX", 20);
      update("letterheadLogoY", 260);
      toast.success("Posisi gambar: Kiri Tengah Halaman (Middle Left)");
    } else if (preset === "middle-center") {
      update("letterheadLogoWrap", "behind");
      update("letterheadLogoAlign", "custom");
      update("letterheadLogoX", 220);
      update("letterheadLogoY", 260);
      if (!shipment.letterheadLogoOpacity || shipment.letterheadLogoOpacity === 100) {
        update("letterheadLogoOpacity", 25);
      }
      toast.success("Posisi gambar: Pusat Halaman / Watermark Tengah (Middle Center)");
    } else if (preset === "middle-right") {
      update("letterheadLogoWrap", "front");
      update("letterheadLogoAlign", "custom");
      update("letterheadLogoX", 450);
      update("letterheadLogoY", 260);
      toast.success("Posisi gambar: Kanan Tengah Halaman (Middle Right)");
    } else if (preset === "bottom-left") {
      update("letterheadLogoWrap", "front");
      update("letterheadLogoAlign", "custom");
      update("letterheadLogoX", 20);
      update("letterheadLogoY", 520);
      toast.success("Posisi gambar: Kiri Bawah Halaman (Bottom Left)");
    } else if (preset === "bottom-center") {
      update("letterheadLogoWrap", "front");
      update("letterheadLogoAlign", "custom");
      update("letterheadLogoX", 220);
      update("letterheadLogoY", 520);
      toast.success("Posisi gambar: Tengah Bawah Halaman (Bottom Center)");
    } else if (preset === "bottom-right") {
      update("letterheadLogoWrap", "front");
      update("letterheadLogoAlign", "custom");
      update("letterheadLogoX", 450);
      update("letterheadLogoY", 520);
      toast.success("Posisi gambar: Kanan Bawah Halaman (Bottom Right)");
    }
    setShowPositionMenu(false);
  };

  // Kop Surat Banner & Logo Upload Handlers
  const handleBannerFileUpload = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("File kop surat harus berupa gambar (PNG, JPG, atau WEBP)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      update("letterheadBannerImage", String(reader.result));
      update("letterheadMode", "banner");
      toast.success("Kop surat perusahaan berhasil diimpor dan dipasang!");
    };
    reader.readAsDataURL(file);
  };

  const handleLogoFileUpload = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("File logo harus berupa gambar (PNG, JPG, atau WEBP)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      update("letterheadImage", String(reader.result));
      update("letterheadMode", "standard");
      toast.success("Logo kop surat perusahaan berhasil diperbarui!");
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCurrentKopProfile = () => {
    const profileName = `${shipment.exporter || "Perusahaan Baru"} (${new Date().toLocaleDateString("id-ID")})`;
    const newProfile = {
      id: `kop-${Date.now()}`,
      name: profileName,
      exporter: shipment.exporter || "PT. INDICO EXPORT INDONESIA",
      address:
        shipment.letterheadText ||
        "Jl. Adiyaksa Baru No. 1B, Kec. Panakkukang, Kota Makassar, Sulawesi Selatan, Indonesia",
      contact:
        shipment.exporterContact || "Telp: +62 812 3456 7890 · Email: official@indicoexport.com",
      layout: (shipment.letterheadLayout || "left") as "left" | "center" | "split",
      dividerStyle: (shipment.letterheadDividerStyle || "double") as "double" | "thick-thin" | "single" | "none",
      dividerColor: shipment.letterheadDividerColor || "#0f2942",
      dividerGap: shipment.letterheadDividerGap ?? 4,
      spacing: shipment.letterheadSpacing ?? 2,
      logoImage: shipment.letterheadImage,
      bannerImage: shipment.letterheadBannerImage,
      mode: (shipment.letterheadMode || "standard") as "standard" | "banner",
    };
    const nextList = [newProfile, ...savedKopProfiles];
    setSavedKopProfiles(nextList);
    try {
      localStorage.setItem("eksporflow_saved_kop_profiles", JSON.stringify(nextList));
    } catch {
      // ignore storage quota
    }
    toast.success(`Format kop surat "${profileName}" disimpan ke daftar profil!`);
  };

  const applyKopProfile = (p: (typeof savedKopProfiles)[number]) => {
    update("exporter", p.exporter);
    update("letterheadText", p.address);
    update("exporterContact", p.contact);
    update("letterheadLayout", p.layout);
    update("letterheadDividerStyle", p.dividerStyle);
    update("letterheadDividerColor", p.dividerColor);
    update("letterheadDividerGap", p.dividerGap);
    update("letterheadSpacing", p.spacing);
    if (p.logoImage !== undefined) update("letterheadImage", p.logoImage);
    if (p.bannerImage !== undefined) update("letterheadBannerImage", p.bannerImage);
    update("letterheadMode", p.mode || "standard");
    toast.success(`Kop surat "${p.name}" berhasil diterapkan ke dokumen!`);
  };

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
    const cleanLh = Math.max(0.8, Math.min(4.0, Math.round(lh * 100) / 100));
    restoreActiveSelection();

    if (isTextSelected()) {
      const res = applyLineSpacingToSelection(cleanLh);
      setSelectedLineHeight(cleanLh);
      if (res.isLetterhead) {
        update("letterheadSpacing", res.mappedSpacingPx);
      }
      if (res.applied) {
        toast.success(`Spasi baris teks terpilih diubah ke ${cleanLh}`);
        return;
      }
    }

    update("docEditorLineHeight", cleanLh);
    update("letterheadSpacing", mapLineHeightToGapPx(cleanLh));
    setSelectedLineHeight(cleanLh);
    toast.success(`Spasi baris dokumen diubah ke ${cleanLh}`);
  };

  const stepLineSpacing = (delta: number) => {
    const base = selectedLineHeight ?? (shipment.docEditorLineHeight || 1.25);
    const next = Math.max(1.0, Math.min(3.0, Math.round((base + delta) * 20) / 20));
    handleLineHeightChange(next);
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
    const isBankTable = table.classList.contains("bank-card-table");
    const existingBodyRows = tbody.querySelectorAll("tr:not(.doc-table-total-row)");
    const nextItemNo = existingBodyRows.length + 1;

    for (let c = 0; c < colCount; c++) {
      const newCell = document.createElement("td");

      if (isBankTable) {
        if (c === 0) {
          newCell.className = "bank-lbl";
          newCell.innerText = "Keterangan Baru:";
        } else {
          newCell.className = "bank-val font-bold";
          newCell.innerText = "Isi Rincian Bank";
        }
      } else if (isDocTablePro) {
        newCell.style.padding = "8px 10px";
        newCell.style.border = "1px solid #e2e8f0";
        newCell.style.verticalAlign = "top";
        newCell.style.color = "#0f172a";
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
        newCell.style.padding = "8px 10px";
        newCell.style.border = "1px solid #e2e8f0";
        newCell.style.verticalAlign = "top";
        newCell.style.color = "#0f172a";
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
    const thList = table.querySelectorAll("thead th:not([colspan])");
    if (thList.length > 0) {
      const pct = (100 / thList.length).toFixed(1);
      thList.forEach((th) => {
        (th as HTMLElement).style.width = `${pct}%`;
      });
      table.querySelectorAll("tbody td").forEach((td) => {
        (td as HTMLElement).style.width = "auto";
      });
      toast.success("Seluruh kolom telah diratakan sama rata.");
    } else {
      const firstBodyRow = table.querySelector("tbody tr");
      const tdCount = firstBodyRow ? firstBodyRow.children.length : 0;
      if (tdCount > 0) {
        const pct = (100 / tdCount).toFixed(1);
        table.querySelectorAll("tbody tr").forEach((r) => {
          Array.from(r.children).forEach((td) => {
            (td as HTMLElement).style.width = `${pct}%`;
            (td as HTMLElement).style.maxWidth = "none";
          });
        });
        toast.success("Seluruh kolom telah diratakan sama rata.");
      }
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
          <span className="doc-ribbon-title">Word Editor</span>
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
                toast.success("Mode Edit Aktif");
              } else {
                toast.info("Mode Pratinjau Terkunci");
              }
            }}
            title="Aktifkan atau kunci mode pengetikan langsung di kertas"
          >
            <Edit3 size={12} />
            <span>{isEditMode ? "Mode Edit" : "Pratinjau"}</span>
            <div className={`doc-mode-dot ${isEditMode ? "on" : "off"}`} />
          </button>

          {/* Minimize / Expand Ribbon */}
          <button
            type="button"
            className="doc-ribbon-collapse-btn"
            onClick={() => setIsRibbonCollapsed((prev) => !prev)}
            title={isRibbonCollapsed ? "Tampilkan Ribbon" : "Ciutkan Ribbon"}
          >
            {isRibbonCollapsed ? "▼" : "▲"}
          </button>
        </div>
      </div>

      {/* 2. Word Ribbon Tab Navigation */}
      {!isRibbonCollapsed && (
        <div className="doc-ribbon-tab-nav">
          <button
            type="button"
            className={`doc-ribbon-tab-btn ${activeRibbonTab === "home" ? "active" : ""}`}
            onClick={() => setActiveRibbonTab("home")}
          >
            Beranda
          </button>
          <button
            type="button"
            className={`doc-ribbon-tab-btn ${activeRibbonTab === "insert" ? "active" : ""}`}
            onClick={() => setActiveRibbonTab("insert")}
          >
            Sisipkan
          </button>
          <button
            type="button"
            className={`doc-ribbon-tab-btn ${activeRibbonTab === "layout" ? "active" : ""}`}
            onClick={() => setActiveRibbonTab("layout")}
          >
            Tata Letak
          </button>
          <button
            type="button"
            className={`doc-ribbon-tab-btn doc-ribbon-tab-table ${activeRibbonTab === "table" ? "active" : ""} ${isTableSelected ? "highlighted" : ""}`}
            onClick={() => setActiveRibbonTab("table")}
            title="Alat Tabel: Baris, Kolom, Lebar, Garis & Warna"
          >
            <TableProperties size={13} className="mr-1 inline" />
            <span>Tabel {isTableSelected && "●"}</span>
          </button>
          <button
            type="button"
            className={`doc-ribbon-tab-btn doc-ribbon-tab-picture ${activeRibbonTab === "picture" ? "active" : ""} ${isImageSelected ? "highlighted" : ""}`}
            onClick={() => setActiveRibbonTab("picture")}
            title="Format Gambar: Posisi, Bungkus Teks, Opasitas, Rotasi & Bingkai"
          >
            <ImageIcon size={13} className="mr-1 inline" />
            <span>Format Gambar {isImageSelected && "●"}</span>
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
                    title="Jenis Huruf (Font Family)"
                  >
                    <option value="Calibri">Calibri</option>
                    <option value="Arial">Arial</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Inter">Inter</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Garamond">Garamond</option>
                    <option value="Trebuchet MS">Trebuchet MS</option>
                    <option value="Courier New">Courier New</option>
                  </select>

                  {/* Font Size Dropdown */}
                  <select
                    className="doc-ribbon-select font-size-select"
                    value={activeFontSize}
                    onFocus={() => saveActiveSelection()}
                    onMouseDown={() => saveActiveSelection()}
                    onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                    title="Ukuran Huruf (pt)"
                  >
                    <option value="7">7</option>
                    <option value="8">8</option>
                    <option value="8.5">8.5</option>
                    <option value="9">9</option>
                    <option value="9.5">9.5</option>
                    <option value="10">10</option>
                    <option value="10.5">10.5</option>
                    <option value="11">11</option>
                    <option value="11.5">11.5</option>
                    <option value="12">12</option>
                    <option value="12.5">12.5</option>
                    <option value="13">13</option>
                    <option value="14">14</option>
                    <option value="16">16</option>
                    <option value="18">18</option>
                    <option value="20">20</option>
                    <option value="24">24</option>
                    <option value="28">28</option>
                    <option value="36">36</option>
                    {!["7", "8", "8.5", "9", "9.5", "10", "10.5", "11", "11.5", "12", "12.5", "13", "14", "16", "18", "20", "24", "28", "36"].includes(String(activeFontSize)) && (
                      <option value={activeFontSize}>{activeFontSize}</option>
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
                    value={[1.0, 1.15, 1.25, 1.35, 1.5, 1.75, 2.0, 2.5, 3.0].some(v => Math.abs(v - activeLineHeight) < 0.01) ? [1.0, 1.15, 1.25, 1.35, 1.5, 1.75, 2.0, 2.5, 3.0].find(v => Math.abs(v - activeLineHeight) < 0.01)!.toString() : "custom"}
                    onFocus={() => saveActiveSelection()}
                    onMouseDown={() => saveActiveSelection()}
                    onChange={(e) => {
                      if (e.target.value === "custom") {
                        setCustomLineHeightInput(activeLineHeight);
                        setShowCustomLineHeightModal(true);
                      } else {
                        handleLineHeightChange(Number(e.target.value));
                      }
                    }}
                    title="Spasi Antar Baris (Pilih spasi untuk teks yang diblok atau seluruh dokumen)"
                    style={{ minWidth: "68px" }}
                  >
                    <option value="1">↕ 1.0</option>
                    <option value="1.15">↕ 1.15</option>
                    <option value="1.25">↕ 1.25</option>
                    <option value="1.35">↕ 1.35</option>
                    <option value="1.5">↕ 1.5</option>
                    <option value="1.75">↕ 1.75</option>
                    <option value="2">↕ 2.0</option>
                    <option value="2.5">↕ 2.5</option>
                    <option value="3">↕ 3.0</option>
                    <option value="custom">Kustom...</option>
                  </select>

                  {/* Quick Step Line Spacing Buttons */}
                  <button
                    type="button"
                    className="doc-ribbon-btn-icon"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      saveActiveSelection();
                      stepLineSpacing(-0.15);
                    }}
                    title="Rapatkan Spasi Baris Teks Terpilih (↕−)"
                  >
                    <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "-0.5px" }}>↕−</span>
                  </button>
                  <button
                    type="button"
                    className="doc-ribbon-btn-icon"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      saveActiveSelection();
                      stepLineSpacing(0.15);
                    }}
                    title="Regangkan Spasi Baris Teks Terpilih (↕+)"
                  >
                    <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "-0.5px" }}>↕+</span>
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

              {/* Quick Kop Surat & Tabel Shortcuts on Home Tab */}
              <div className="doc-ribbon-group group-kop-shortcut">
                <div className="doc-ribbon-row-top">
                  <button
                    type="button"
                    className="doc-ribbon-table-subbtn"
                    style={{ fontWeight: 700, color: "#1e3a8a" }}
                    onClick={() => {
                      setLetterheadModalTab("import");
                      setShowLetterheadModal(true);
                    }}
                    title="Impor Kop Surat Perusahaan Lain atau Pilih Profil Kop"
                  >
                    <Upload size={11} />
                    <span>Impor Kop</span>
                  </button>
                  <button
                    type="button"
                    className="doc-ribbon-table-subbtn"
                    onClick={() => {
                      setLetterheadModalTab("spacing");
                      setShowLetterheadModal(true);
                    }}
                    title="Atur Spasi & Garis Kop Surat"
                  >
                    <Sliders size={11} />
                    <span>Spasi Kop</span>
                  </button>
                </div>
                <div className="doc-ribbon-row-bottom">
                  <button
                    type="button"
                    className="doc-ribbon-table-subbtn"
                    onClick={() => setActiveRibbonTab("picture")}
                    title="Buka Alat Format Gambar / Logo"
                  >
                    <ImageIcon size={11} />
                    <span>Format Gambar</span>
                  </button>
                  <button
                    type="button"
                    className="doc-ribbon-table-subbtn"
                    onClick={() => onOpenSignatureModal("seller")}
                    title="Tanda Tangan & Stempel"
                  >
                    <FileSignature size={11} />
                    <span>Tanda Tangan</span>
                  </button>
                </div>
                <span className="doc-ribbon-group-label">Kop & Stempel</span>
              </div>

              <div className="doc-ribbon-divider" />

              {/* Quick Table & View Group on Home Tab */}
              <div className="doc-ribbon-group group-table" ref={tableMenuRef}>
                <div className="doc-ribbon-row-top">
                  <button
                    type="button"
                    className={`doc-ribbon-table-trigger ${showTableMenu ? "active" : ""}`}
                    onClick={() => setShowTableMenu((prev) => !prev)}
                    title="Sisipkan Tabel Baru"
                  >
                    <Table size={13} />
                    <span>Tabel</span>
                    <ChevronDown size={11} />
                  </button>
                  <button
                    type="button"
                    className="doc-ribbon-table-subbtn"
                    onClick={() => setActiveRibbonTab("table")}
                    title="Buka Pengaturan Tabel"
                  >
                    <span>Alat Tabel</span>
                  </button>
                </div>

                <div className="doc-ribbon-row-bottom">
                  <button
                    type="button"
                    className={`doc-ribbon-table-subbtn ${shipment.docShowRuler !== false ? "active" : ""}`}
                    onClick={toggleRuler}
                    title="Tampilkan / Sembunyikan Penggaris"
                  >
                    <Ruler size={11} />
                    <span>Penggaris</span>
                  </button>
                  {onOpenBusinessCardOcr && (
                    <button
                      type="button"
                      className="doc-ribbon-table-subbtn"
                      onClick={onOpenBusinessCardOcr}
                      title="Scan Kartu Nama Buyer (OCR)"
                    >
                      <CreditCard size={11} />
                      <span>Scan Kartu</span>
                    </button>
                  )}
                </div>

                <span className="doc-ribbon-group-label">Tabel & Alat</span>

                {/* Table Insert Popover Modal/Dropdown */}
                {showTableMenu && (
                  <div className="doc-table-popover" role="dialog">
                    <div className="doc-table-popover-header">
                      <span className="popover-title">SISIPKAN TABEL</span>
                      <span className="popover-sub">
                        {hoverGrid.r > 0 && hoverGrid.c > 0 ? `${hoverGrid.r} × ${hoverGrid.c}` : "Pilih Grid"}
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
                        <span>Sisipkan</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ================= TAB 2: TATA LETAK (LAYOUT & MARGIN) ================= */}
          {activeRibbonTab === "layout" && (
            <>
              {/* PAGE MARGINS GROUP */}
              <div className="doc-ribbon-group group-margins">
                <div className="doc-ribbon-row-top">
                  <div className="doc-ribbon-field-with-icon" title="Preset Margin">
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
                    >
                      <option value="Normal">Normal (2.54 cm)</option>
                      <option value="Sempit">Sempit (1.27 cm)</option>
                      <option value="Sedang">Sedang (1.91 cm)</option>
                      <option value="Lebar">Lebar (5.08 cm)</option>
                      <option value="Kustom">Margin Kustom...</option>
                    </select>
                  </div>
                </div>

                <div className="doc-ribbon-row-bottom">
                  <button
                    type="button"
                    className="doc-ribbon-table-subbtn"
                    onClick={() => {
                      setCustomMarginInputs({
                        top: docMargins.top,
                        bottom: docMargins.bottom,
                        left: docMargins.left,
                        right: docMargins.right,
                      });
                      setShowMarginModal(true);
                    }}
                  >
                    <SlidersHorizontal size={11} />
                    <span>Atur Margin Kustom...</span>
                  </button>
                </div>

                <span className="doc-ribbon-group-label">Margin</span>
              </div>

              <div className="doc-ribbon-divider" />

              {/* PAGE SETUP / UKURAN KERTAS & ORIENTASI GROUP */}
              <div className="doc-ribbon-group group-pagesetup">
                <div className="doc-ribbon-row-top">
                  <div className="doc-ribbon-field-with-icon" title="Ukuran Kertas">
                    <FileText size={13} className="doc-field-prefix-icon" />
                    <select
                      className="doc-ribbon-select paper-size-select"
                      value={activePaperSize}
                      onChange={(e) => handlePaperSizeChange(e.target.value as PaperSize)}
                    >
                      <option value="A4">A4 (210 × 297 mm)</option>
                      <option value="Letter">Letter (8.5 × 11 in)</option>
                      <option value="Legal">Legal (8.5 × 14 in)</option>
                      <option value="Folio">Folio / F4</option>
                      <option value="Executive">Executive</option>
                      <option value="A3">A3</option>
                      <option value="A5">A5</option>
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
                    >
                      <option value="Portrait">Portrait (Tegak)</option>
                      <option value="Landscape">Landscape (Mendatar)</option>
                    </select>
                  </div>
                </div>

                <span className="doc-ribbon-group-label">Kertas</span>
              </div>

              <div className="doc-ribbon-divider" />

              {/* RULER & RESET GROUP */}
              <div className="doc-ribbon-group group-view">
                <div className="doc-ribbon-row-top">
                  <button
                    type="button"
                    className={`doc-ribbon-table-subbtn ${shipment.docShowRuler !== false ? "active" : ""}`}
                    onClick={toggleRuler}
                  >
                    <Ruler size={12} />
                    <span>Penggaris {shipment.docShowRuler !== false ? "✓" : ""}</span>
                  </button>
                </div>

                <div className="doc-ribbon-row-bottom">
                  <button
                    type="button"
                    className="doc-ribbon-table-subbtn"
                    onClick={onResetDocument}
                    title="Kembalikan teks ke template standar"
                  >
                    <RotateCcw size={11} />
                    <span>Reset Dokumen</span>
                  </button>
                </div>

                <span className="doc-ribbon-group-label">Tampilan</span>
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

              {/* KOP SURAT PERUSAHAAN (IMPORT & SPASI) */}
              <div className="doc-ribbon-group group-letterhead-import">
                <div className="doc-ribbon-row-top" style={{ gap: "4px" }}>
                  <button
                    type="button"
                    className="doc-ribbon-sig-btn"
                    style={{ background: "linear-gradient(135deg, #1e3a8a, #2563eb)", color: "#ffffff" }}
                    onClick={() => {
                      setLetterheadModalTab("import");
                      setShowLetterheadModal(true);
                    }}
                    title="Impor Kop Surat dari Dokumen Perusahaan Lain (Gambar Banner / Profil Kop)"
                  >
                    <Upload size={13} />
                    <span>Impor Kop Surat...</span>
                  </button>
                </div>

                <div className="doc-ribbon-row-bottom" style={{ gap: "4px" }}>
                  <button
                    type="button"
                    className="doc-ribbon-table-subbtn"
                    onClick={() => {
                      setLetterheadModalTab("spacing");
                      setShowLetterheadModal(true);
                    }}
                    title="Atur Jarak Spasi Kop Surat, Tata Letak & Garis Pembatas"
                  >
                    <Sliders size={11} />
                    <span>Atur Spasi & Garis Kop...</span>
                  </button>
                </div>

                <span className="doc-ribbon-group-label">Format Kop Surat</span>
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

              {/* DIGITAL SIGNATURE & TOOLS GROUP */}
              <div className="doc-ribbon-group group-signature">
                <div className="doc-ribbon-row-top" style={{ gap: "4px" }}>
                  <button
                    type="button"
                    className="doc-ribbon-table-subbtn"
                    onClick={() => onOpenSignatureModal("seller")}
                    title="Tanda Tangan Digital & Stempel Resmi"
                  >
                    <FileSignature size={12} />
                    <span>Tanda Tangan</span>
                  </button>
                  {onOpenBusinessCardOcr && (
                    <button
                      type="button"
                      className="doc-ribbon-table-subbtn"
                      onClick={onOpenBusinessCardOcr}
                      title="Scan Kartu Nama Buyer (OCR)"
                    >
                      <CreditCard size={12} />
                      <span>Scan Kartu</span>
                    </button>
                  )}
                </div>

                <div className="doc-ribbon-row-bottom" style={{ gap: "4px" }}>
                  {onOpenAiScreening && (
                    <button
                      type="button"
                      className="doc-ribbon-table-subbtn"
                      onClick={onOpenAiScreening}
                      title="AI Audit & Deteksi Kesalahan Dokumen"
                    >
                      <Sparkles size={12} />
                      <span>AI Audit</span>
                    </button>
                  )}
                </div>

                <span className="doc-ribbon-group-label">Otorisasi & Alat</span>
              </div>
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

          {/* ================= TAB 5: FORMAT GAMBAR (MICROSOFT WORD PICTURE FORMAT) ================= */}
          {activeRibbonTab === "picture" && (
            <>
              {/* 1. SESUAIKAN (ADJUST) */}
              <div className="doc-ribbon-group group-pic-adjust">
                <div className="doc-ribbon-row-top" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <button
                    type="button"
                    className="doc-ribbon-table-subbtn"
                    onClick={() => logoUploadRef.current?.click()}
                    title="Ganti Gambar Logo dari Komputer"
                  >
                    <Upload size={11} />
                    <span>Ganti Logo</span>
                  </button>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "#f8fafc", padding: "2px 6px", borderRadius: "4px", border: "1px solid #e2e8f0" }}>
                    <SunMedium size={12} className="text-amber-600" />
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={shipment.letterheadLogoOpacity ?? 100}
                      onChange={(e) => update("letterheadLogoOpacity", Number(e.target.value))}
                      title={`Transparansi / Opasitas Gambar: ${shipment.letterheadLogoOpacity ?? 100}%`}
                      style={{ width: "68px", accentColor: "#2563eb", cursor: "pointer" }}
                    />
                    <span style={{ fontSize: "10px", fontWeight: 700, minWidth: "28px", color: "#1e293b" }}>
                      {shipment.letterheadLogoOpacity ?? 100}%
                    </span>
                  </div>
                </div>

                <div className="doc-ribbon-row-bottom" style={{ display: "flex", gap: "4px" }}>
                  <button
                    type="button"
                    className={`doc-ribbon-table-subbtn ${(shipment.letterheadLogoOpacity ?? 100) <= 35 && shipment.letterheadLogoWrap === "behind" ? "active" : ""}`}
                    onClick={() => {
                      update("letterheadLogoOpacity", 30);
                      update("letterheadLogoWrap", "behind");
                      toast.success("Mode Watermark Aktif (30% di Belakang Teks)");
                    }}
                    title="Atur gambar sebagai Watermark (30% transparan di belakang teks)"
                  >
                    <span>Watermark 30%</span>
                  </button>
                  <button
                    type="button"
                    className="doc-ribbon-table-subbtn"
                    onClick={() => {
                      update("letterheadLogoScale", 100);
                      update("letterheadLogoWrap", "inline");
                      update("letterheadLogoPositionPreset", "inline");
                      update("letterheadLogoAlign", "left");
                      update("letterheadLogoX", 0);
                      update("letterheadLogoY", 0);
                      update("letterheadLogoOpacity", 100);
                      update("letterheadLogoRotate", 0);
                      update("letterheadLogoFlipH", false);
                      update("letterheadLogoFlipV", false);
                      update("letterheadLogoBorder", "none");
                      update("letterheadLogoShadow", false);
                      toast.success("Seluruh pengaturan gambar di-reset ke standar awal");
                    }}
                    title="Reset Gambar (Reset Picture & Size)"
                  >
                    <RotateCcw size={11} />
                    <span>Reset Gambar</span>
                  </button>
                </div>
                <span className="doc-ribbon-group-label">Adjust (Sesuaikan)</span>
              </div>

              <div className="doc-ribbon-divider" />

              {/* 2. GAYA GAMBAR (PICTURE STYLES GALLERY) */}
              <div className="doc-ribbon-group group-pic-styles">
                <div className="doc-ribbon-row-top" style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                  {[
                    { id: "none", label: "Polos", style: { border: "1px solid #cbd5e1", borderRadius: "2px" } },
                    { id: "solid", label: "Bingkai", style: { border: "2px solid #1e293b", borderRadius: "2px" } },
                    { id: "double", label: "Ganda", style: { border: "3px double #1e293b", borderRadius: "2px", background: "#f8fafc" } },
                    { id: "rounded", label: "Bulat", style: { border: "2px solid #334155", borderRadius: "6px" } },
                    { id: "oval", label: "Oval", style: { border: "2px solid #2563eb", borderRadius: "999px" } },
                    { id: "dashed", label: "Putus", style: { border: "1.5px dashed #475569", borderRadius: "3px" } },
                  ].map((frame) => {
                    const isActive = (shipment.letterheadLogoBorder || "none") === frame.id;
                    return (
                      <button
                        key={frame.id}
                        type="button"
                        onClick={() => {
                          update("letterheadLogoBorder", frame.id as any);
                          toast.success(`Gaya Bingkai Gambar: ${frame.label}`);
                        }}
                        title={`Gaya Bingkai: ${frame.label}`}
                        style={{
                          width: "34px",
                          height: "26px",
                          padding: "3px",
                          background: isActive ? "#dbeafe" : "#ffffff",
                          border: isActive ? "2px solid #2563eb" : "1px solid #cbd5e1",
                          borderRadius: "4px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            background: "linear-gradient(180deg, #93c5fd 0%, #bfdbfe 55%, #86efac 55%, #4ade80 100%)",
                            ...frame.style,
                          }}
                        />
                      </button>
                    );
                  })}
                </div>

                <div className="doc-ribbon-row-bottom" style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                  <button
                    type="button"
                    className={`doc-ribbon-table-subbtn ${shipment.letterheadLogoShadow ? "active" : ""}`}
                    onClick={() => {
                      const next = !shipment.letterheadLogoShadow;
                      update("letterheadLogoShadow", next);
                      toast.success(next ? "Picture Effects: Bayangan Diaktifkan" : "Picture Effects: Bayangan Dinonaktifkan");
                    }}
                    title="Picture Effects: Efek Bayangan (Drop Shadow)"
                  >
                    <span>Picture Effects: Bayangan {shipment.letterheadLogoShadow ? "✓" : ""}</span>
                  </button>
                  <button
                    type="button"
                    className="doc-ribbon-table-subbtn"
                    onClick={() => {
                      setLetterheadModalTab("spacing");
                      setShowLetterheadModal(true);
                    }}
                    title="Atur Tata Letak Kop Surat & Jarak Garis"
                  >
                    <Layout size={11} />
                    <span>Picture Layout Kop</span>
                  </button>
                </div>
                <span className="doc-ribbon-group-label">Picture Styles</span>
              </div>

              <div className="doc-ribbon-divider" />

              {/* 3. SUSUN (ARRANGE - POSITION 9-GRID & WRAP TEXT MENU PERSIS MS WORD) */}
              <div className="doc-ribbon-group group-pic-arrange" style={{ position: "relative" }}>
                <div className="doc-ribbon-row-top" style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  {/* POSITION DROPDOWN BUTTON (9-GRID WORD POPOVER) */}
                  <div ref={positionMenuRef} style={{ position: "relative" }}>
                    <button
                      type="button"
                      className={`doc-ribbon-table-subbtn ${showPositionMenu ? "active" : ""}`}
                      style={{
                        height: "28px",
                        padding: "0 10px",
                        fontWeight: 700,
                        background: showPositionMenu ? "#dbeafe" : "#f8fafc",
                        borderColor: showPositionMenu ? "#2563eb" : "#cbd5e1",
                        color: "#1e3a8a",
                      }}
                      onClick={() => {
                        setShowPositionMenu((prev) => !prev);
                        setShowWrapTextMenu(false);
                      }}
                      title="Position: Pilih posisi gambar di halaman (In Line with Text atau 9 titik posisi dengan Text Wrapping)"
                    >
                      <Layout size={13} />
                      <span>Position</span>
                      <ChevronDown size={12} />
                    </button>

                    {showPositionMenu && (
                      <div
                        className="no-print"
                        style={{
                          position: "absolute",
                          top: "calc(100% + 4px)",
                          left: 0,
                          width: "248px",
                          background: "#ffffff",
                          border: "1px solid #cbd5e1",
                          borderRadius: "6px",
                          boxShadow: "0 12px 28px rgba(15, 23, 42, 0.22)",
                          zIndex: 9999,
                          padding: "8px",
                        }}
                      >
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "#475569", background: "#f1f5f9", padding: "4px 8px", borderRadius: "3px", marginBottom: "6px" }}>
                          In Line with Text
                        </div>
                        <button
                          type="button"
                          onClick={() => applyWordPositionPreset("inline")}
                          title="Sejajar dengan Teks (In Line with Text)"
                          style={{
                            width: "54px",
                            height: "58px",
                            border: (shipment.letterheadLogoPositionPreset || "inline") === "inline" ? "2px solid #2563eb" : "1px solid #94a3b8",
                            background: (shipment.letterheadLogoPositionPreset || "inline") === "inline" ? "#eff6ff" : "#ffffff",
                            borderRadius: "4px",
                            padding: "5px",
                            cursor: "pointer",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            marginBottom: "8px",
                          }}
                        >
                          <div style={{ height: "2px", background: "#94a3b8", width: "100%" }} />
                          <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                            <div style={{ width: "18px", height: "14px", background: "#3b82f6", borderRadius: "2px", border: "1px solid #1d4ed8" }} />
                            <div style={{ flex: 1, height: "2px", background: "#94a3b8" }} />
                          </div>
                          <div style={{ height: "2px", background: "#94a3b8", width: "100%" }} />
                          <div style={{ height: "2px", background: "#94a3b8", width: "80%" }} />
                        </button>

                        <div style={{ fontSize: "11px", fontWeight: 700, color: "#475569", background: "#f1f5f9", padding: "4px 8px", borderRadius: "3px", marginBottom: "6px" }}>
                          With Text Wrapping
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "8px" }}>
                          {(
                            [
                              { id: "top-left", label: "Kiri Atas (Top Left)", v: "flex-start", h: "flex-start" },
                              { id: "top-center", label: "Tengah Atas (Top Center)", v: "flex-start", h: "center" },
                              { id: "top-right", label: "Kanan Atas (Top Right)", v: "flex-start", h: "flex-end" },
                              { id: "middle-left", label: "Kiri Tengah (Middle Left)", v: "center", h: "flex-start" },
                              { id: "middle-center", label: "Tengah Halaman (Middle Center)", v: "center", h: "center" },
                              { id: "middle-right", label: "Kanan Tengah (Middle Right)", v: "center", h: "flex-end" },
                              { id: "bottom-left", label: "Kiri Bawah (Bottom Left)", v: "flex-end", h: "flex-start" },
                              { id: "bottom-center", label: "Tengah Bawah (Bottom Center)", v: "flex-end", h: "center" },
                              { id: "bottom-right", label: "Kanan Bawah (Bottom Right)", v: "flex-end", h: "flex-end" },
                            ] as const
                          ).map((pos) => {
                            const active = shipment.letterheadLogoPositionPreset === pos.id;
                            return (
                              <button
                                key={pos.id}
                                type="button"
                                onClick={() => applyWordPositionPreset(pos.id)}
                                title={`Position in ${pos.label} with Square Text Wrapping`}
                                style={{
                                  height: "60px",
                                  border: active ? "2px solid #2563eb" : "1px solid #94a3b8",
                                  background: active ? "#eff6ff" : "#ffffff",
                                  borderRadius: "4px",
                                  padding: "5px",
                                  cursor: "pointer",
                                  position: "relative",
                                  display: "flex",
                                  flexDirection: "column",
                                  justifyContent: "space-between",
                                }}
                              >
                                {[0, 1, 2, 3, 4, 5].map((ln) => (
                                  <div key={ln} style={{ height: "2px", background: "#cbd5e1", width: "100%" }} />
                                ))}
                                <div
                                  style={{
                                    position: "absolute",
                                    inset: "5px",
                                    display: "flex",
                                    alignItems: pos.v,
                                    justifyContent: pos.h,
                                    pointerEvents: "none",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: "18px",
                                      height: "14px",
                                      background: "#2563eb",
                                      border: "1.5px solid #ffffff",
                                      boxShadow: "0 0 0 1px #1d4ed8",
                                      borderRadius: "2px",
                                    }}
                                  />
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "6px" }}>
                          <button
                            type="button"
                            onClick={() => {
                              setShowPositionMenu(false);
                              setLetterheadModalTab("spacing");
                              setShowLetterheadModal(true);
                            }}
                            style={{
                              width: "100%",
                              textAlign: "left",
                              padding: "5px 8px",
                              fontSize: "11px",
                              fontWeight: 600,
                              color: "#1e293b",
                              background: "transparent",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <SlidersHorizontal size={12} className="text-blue-600" />
                            <span>More Layout Options...</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* WRAP TEXT DROPDOWN BUTTON (PERSIS MS WORD) */}
                  <div ref={wrapTextMenuRef} style={{ position: "relative" }}>
                    <button
                      type="button"
                      className={`doc-ribbon-table-subbtn ${showWrapTextMenu ? "active" : ""}`}
                      style={{
                        height: "28px",
                        padding: "0 10px",
                        fontWeight: 700,
                        background: showWrapTextMenu ? "#dbeafe" : "#f8fafc",
                        borderColor: showWrapTextMenu ? "#2563eb" : "#cbd5e1",
                        color: "#1e3a8a",
                      }}
                      onClick={() => {
                        setShowWrapTextMenu((prev) => !prev);
                        setShowPositionMenu(false);
                      }}
                      title="Wrap Text: Pilih cara teks mengalir di sekitar gambar"
                    >
                      <Layers size={13} />
                      <span>Wrap Text</span>
                      <ChevronDown size={12} />
                    </button>

                    {showWrapTextMenu && (
                      <div
                        className="no-print"
                        style={{
                          position: "absolute",
                          top: "calc(100% + 4px)",
                          left: 0,
                          width: "215px",
                          background: "#ffffff",
                          border: "1px solid #cbd5e1",
                          borderRadius: "6px",
                          boxShadow: "0 12px 28px rgba(15, 23, 42, 0.22)",
                          zIndex: 9999,
                          padding: "4px 0",
                        }}
                      >
                        {(
                          [
                            { id: "inline", label: "In Line with Text", desc: "Sejajar dengan baris teks" },
                            { id: "square", label: "Square", desc: "Teks mengelilingi kotak gambar" },
                            { id: "tight", label: "Tight", desc: "Teks rapat mengelilingi gambar" },
                            { id: "through", label: "Through", desc: "Teks mengalir menembus batas" },
                            { id: "topBottom", label: "Top and Bottom", desc: "Teks di atas dan di bawah gambar" },
                            { id: "behind", label: "Behind Text", desc: "Di belakang teks (Watermark)" },
                            { id: "front", label: "In Front of Text", desc: "Bebas melayang di depan teks" },
                          ] as const
                        ).map((item, idx) => {
                          const isCurrent = (shipment.letterheadLogoWrap || "inline") === item.id;
                          return (
                            <React.Fragment key={item.id}>
                              {idx === 5 && <div style={{ borderTop: "1px solid #e2e8f0", margin: "3px 0" }} />}
                              <button
                                type="button"
                                onClick={() => {
                                  update("letterheadLogoWrap", item.id);
                                  if (item.id === "inline") {
                                    update("letterheadLogoPositionPreset", "inline");
                                    update("letterheadLogoX", 0);
                                    update("letterheadLogoY", 0);
                                  }
                                  setShowWrapTextMenu(false);
                                  toast.success(`Wrap Text: ${item.label}`);
                                }}
                                style={{
                                  width: "100%",
                                  padding: "6px 12px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  background: isCurrent ? "#eff6ff" : "transparent",
                                  color: isCurrent ? "#1d4ed8" : "#1e293b",
                                  fontWeight: isCurrent ? 700 : 500,
                                  fontSize: "12px",
                                  border: "none",
                                  cursor: "pointer",
                                  textAlign: "left",
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <span
                                    style={{
                                      width: "18px",
                                      height: "16px",
                                      border: "1px solid #94a3b8",
                                      borderRadius: "2px",
                                      background: "#f8fafc",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontSize: "9px",
                                      color: "#2563eb",
                                      fontWeight: 800,
                                    }}
                                  >
                                    ↷
                                  </span>
                                  <span>{item.label}</span>
                                </div>
                                {isCurrent && <Check size={13} className="text-blue-600" />}
                              </button>
                            </React.Fragment>
                          );
                        })}

                        <div style={{ borderTop: "1px solid #e2e8f0", margin: "4px 0" }} />
                        <button
                          type="button"
                          onClick={() => {
                            update("letterheadLogoX", 0);
                            update("letterheadLogoY", 0);
                            setShowWrapTextMenu(false);
                            toast.success("Posisi gambar dikunci mengikuti teks kop surat");
                          }}
                          style={{
                            width: "100%",
                            padding: "5px 12px",
                            fontSize: "11px",
                            color: "#475569",
                            background: "transparent",
                            border: "none",
                            textAlign: "left",
                            cursor: "pointer",
                          }}
                        >
                          ✓ Move with Text (Reset X/Y)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowWrapTextMenu(false);
                            setLetterheadModalTab("spacing");
                            setShowLetterheadModal(true);
                          }}
                          style={{
                            width: "100%",
                            padding: "6px 12px",
                            fontSize: "11px",
                            fontWeight: 600,
                            color: "#1e293b",
                            background: "transparent",
                            border: "none",
                            textAlign: "left",
                            cursor: "pointer",
                          }}
                        >
                          More Layout Options...
                        </button>
                      </div>
                    )}
                  </div>

                  {/* BRING FORWARD & SEND BACKWARD */}
                  <button
                    type="button"
                    className={`doc-ribbon-table-subbtn ${shipment.letterheadLogoWrap === "front" ? "active" : ""}`}
                    onClick={() => {
                      update("letterheadLogoWrap", "front");
                      toast.success("Bring Forward: Di Depan Teks");
                    }}
                    title="Bring Forward (Bawa ke Depan Teks)"
                  >
                    <ArrowUp size={11} />
                    <span>Maju</span>
                  </button>
                  <button
                    type="button"
                    className={`doc-ribbon-table-subbtn ${shipment.letterheadLogoWrap === "behind" ? "active" : ""}`}
                    onClick={() => {
                      update("letterheadLogoWrap", "behind");
                      toast.success("Send Backward: Di Belakang Teks");
                    }}
                    title="Send Backward (Kirim ke Belakang Teks)"
                  >
                    <ArrowDown size={11} />
                    <span>Mundur</span>
                  </button>
                </div>

                {/* ROW BOTTOM: ALIGN + ROTATE + FLIP (CLEAN ICON BUTTONS) */}
                <div className="doc-ribbon-row-bottom" style={{ display: "flex", gap: "3px", alignItems: "center" }}>
                  <button
                    type="button"
                    className={`doc-ribbon-btn-icon ${(shipment.letterheadLogoAlign || "left") === "left" ? "active" : ""}`}
                    onClick={() => {
                      update("letterheadLogoAlign", "left");
                      update("letterheadLogoX", 0);
                      update("letterheadLogoY", 0);
                    }}
                    title="Rata Kiri (Align Left)"
                  >
                    <AlignLeft size={13} />
                  </button>
                  <button
                    type="button"
                    className={`doc-ribbon-btn-icon ${shipment.letterheadLogoAlign === "center" ? "active" : ""}`}
                    onClick={() => update("letterheadLogoAlign", "center")}
                    title="Rata Tengah (Align Center)"
                  >
                    <AlignCenter size={13} />
                  </button>
                  <button
                    type="button"
                    className={`doc-ribbon-btn-icon ${shipment.letterheadLogoAlign === "right" ? "active" : ""}`}
                    onClick={() => update("letterheadLogoAlign", "right")}
                    title="Rata Kanan (Align Right)"
                  >
                    <AlignRight size={13} />
                  </button>

                  <span style={{ color: "#cbd5e1", margin: "0 2px" }}>|</span>

                  <button
                    type="button"
                    className="doc-ribbon-btn-icon"
                    onClick={() => {
                      const cur = shipment.letterheadLogoRotate || 0;
                      const next = (cur + 90) % 360;
                      update("letterheadLogoRotate", next);
                      toast.success(`Rotasi ${next}°`);
                    }}
                    title="Putar 90° Searah Jarum Jam"
                  >
                    <RotateCw size={13} />
                  </button>
                  <button
                    type="button"
                    className={`doc-ribbon-btn-icon ${shipment.letterheadLogoFlipH ? "active" : ""}`}
                    onClick={() => {
                      const next = !shipment.letterheadLogoFlipH;
                      update("letterheadLogoFlipH", next);
                    }}
                    title="Balik Horizontal (Flip Horizontal)"
                  >
                    <FlipHorizontal size={13} />
                  </button>
                  <button
                    type="button"
                    className={`doc-ribbon-btn-icon ${shipment.letterheadLogoFlipV ? "active" : ""}`}
                    onClick={() => {
                      const next = !shipment.letterheadLogoFlipV;
                      update("letterheadLogoFlipV", next);
                    }}
                    title="Balik Vertikal (Flip Vertical)"
                  >
                    <FlipVertical size={13} />
                  </button>
                </div>
                <span className="doc-ribbon-group-label">Arrange</span>
              </div>

              <div className="doc-ribbon-divider" />

              {/* 4. UKURAN (SIZE IN CM & % PERSIS MS WORD) */}
              <div className="doc-ribbon-group group-pic-size">
                <div className="doc-ribbon-row-top" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "10px", color: "#475569", fontWeight: 600, minWidth: "34px" }}>Tinggi:</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0.6"
                    max="7.0"
                    value={(((shipment.letterheadLogoScale ?? 100) / 100) * 1.9).toFixed(2)}
                    onChange={(e) => {
                      const cm = parseFloat(e.target.value);
                      if (!isNaN(cm) && cm > 0.3) {
                        const pct = Math.round((cm / 1.9) * 100);
                        update("letterheadLogoScale", Math.max(30, Math.min(350, pct)));
                      }
                    }}
                    style={{
                      width: "54px",
                      height: "22px",
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "0 4px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "4px",
                      textAlign: "right",
                    }}
                    title="Tinggi Gambar (cm)"
                  />
                  <span style={{ fontSize: "10px", color: "#64748b" }}>cm</span>
                </div>

                <div className="doc-ribbon-row-bottom" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "10px", color: "#475569", fontWeight: 600, minWidth: "34px" }}>Lebar:</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0.6"
                    max="8.0"
                    value={(((shipment.letterheadLogoScale ?? 100) / 100) * 2.22).toFixed(2)}
                    onChange={(e) => {
                      const cm = parseFloat(e.target.value);
                      if (!isNaN(cm) && cm > 0.3) {
                        const pct = Math.round((cm / 2.22) * 100);
                        update("letterheadLogoScale", Math.max(30, Math.min(350, pct)));
                      }
                    }}
                    style={{
                      width: "54px",
                      height: "22px",
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "0 4px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "4px",
                      textAlign: "right",
                    }}
                    title="Lebar Gambar (cm)"
                  />
                  <span style={{ fontSize: "10px", color: "#64748b" }}>cm</span>
                </div>
                <span className="doc-ribbon-group-label">Size ({shipment.letterheadLogoScale ?? 100}%)</span>
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

      {/* Hidden File Inputs for Importing Kop Surat Banner & Logo */}
      <input
        ref={bannerUploadRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          handleBannerFileUpload(e.target.files?.[0]);
          e.target.value = "";
        }}
        style={{ display: "none" }}
      />
      <input
        ref={logoUploadRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          handleLogoFileUpload(e.target.files?.[0]);
          e.target.value = "";
        }}
        style={{ display: "none" }}
      />

      {/* Pop-up Modal: Impor Kop Surat & Pengaturan Spasi / Garis Kop */}
      {showLetterheadModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 no-print animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Building2 size={19} className="text-blue-300" />
                <div>
                  <h3 className="font-bold text-sm">Impor & Pengaturan Format Kop Surat Perusahaan</h3>
                  <p className="text-xs text-blue-200">
                    Impor kop surat dari dokumen perusahaan lain, simpan profil kop, atau atur spasi & jarak garis
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLetterheadModal(false)}
                className="text-slate-300 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tab Bar */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-2 gap-2">
              <button
                type="button"
                onClick={() => setLetterheadModalTab("import")}
                className={`px-4 py-2 text-xs font-bold rounded-t-lg border-b-2 transition-all flex items-center gap-1.5 ${
                  letterheadModalTab === "import"
                    ? "border-blue-600 text-blue-700 bg-white"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <Upload size={13} />
                <span>1. Impor Kop Surat & Profil Perusahaan</span>
              </button>
              <button
                type="button"
                onClick={() => setLetterheadModalTab("spacing")}
                className={`px-4 py-2 text-xs font-bold rounded-t-lg border-b-2 transition-all flex items-center gap-1.5 ${
                  letterheadModalTab === "spacing"
                    ? "border-blue-600 text-blue-700 bg-white"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <Sliders size={13} />
                <span>2. Atur Spasi, Jarak Garis & Tata Letak Kop</span>
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 overflow-y-auto text-slate-700">
              {letterheadModalTab === "import" ? (
                <>
                  {/* Mode Selector: Standard vs Full Banner Image */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div
                      onClick={() => update("letterheadMode", "standard")}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                        (shipment.letterheadMode || "standard") === "standard"
                          ? "border-blue-600 bg-blue-50/60"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900">📝 Mode Kop Teks + Logo (Bisa Diedit)</span>
                        {(shipment.letterheadMode || "standard") === "standard" && (
                          <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">Aktif</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Logo di samping/tengah dengan nama perusahaan, alamat, dan kontak yang bisa diketik & diatur spasinya langsung.
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          logoUploadRef.current?.click();
                        }}
                        className="mt-2.5 px-3 py-1.5 bg-white border border-blue-300 text-blue-700 hover:bg-blue-50 rounded-lg text-[11px] font-bold inline-flex items-center gap-1.5 shadow-2xs"
                      >
                        <Upload size={12} />
                        <span>Impor / Ganti Logo Perusahaan...</span>
                      </button>
                    </div>

                    <div
                      onClick={() => {
                        if (shipment.letterheadBannerImage) {
                          update("letterheadMode", "banner");
                        } else {
                          bannerUploadRef.current?.click();
                        }
                      }}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                        shipment.letterheadMode === "banner"
                          ? "border-blue-600 bg-blue-50/60"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900">🖼️ Mode Gambar Kop Surat Utuh (Banner)</span>
                        {shipment.letterheadMode === "banner" && (
                          <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">Aktif</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Punya desain kop surat siap pakai dari Word/Canva/Corel? Unggah gambar kop utuh (PNG/JPG) untuk dipasang penuh di atas kertas.
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          bannerUploadRef.current?.click();
                        }}
                        className="mt-2.5 px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-[11px] font-bold inline-flex items-center gap-1.5 shadow-2xs"
                      >
                        <Upload size={12} />
                        <span>Impor Gambar Kop Surat Utuh (PNG/JPG)...</span>
                      </button>
                    </div>
                  </div>

                  {/* Saved Company Profiles (Multi-Company Letterhead Templates) */}
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70">
                    <div className="flex items-center justify-between mb-2.5">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          🏢 Daftar Profil Kop Surat Perusahaan (Multi-Perusahaan)
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Klik salah satu profil perusahaan di bawah untuk langsung menerapkan format kop suratnya ke dokumen ini:
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleSaveCurrentKopProfile}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg shadow-2xs flex items-center gap-1"
                      >
                        <Plus size={12} />
                        <span>Simpan Kop Saat Ini</span>
                      </button>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {savedKopProfiles.map((prof) => (
                        <div
                          key={prof.id}
                          className="bg-white border border-slate-200 hover:border-blue-400 rounded-lg p-2.5 flex items-center justify-between gap-3 transition-all"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900 truncate">{prof.exporter || prof.name}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                                {prof.layout === "center" ? "Tengah" : prof.layout === "split" ? "Kiri-Kanan" : "Rata Kiri"}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">{prof.address}</div>
                            <div className="text-[10px] text-slate-400 truncate">{prof.contact}</div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                applyKopProfile(prof);
                                setShowLetterheadModal(false);
                              }}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-md transition-colors"
                            >
                              Gunakan Kop Ini
                            </button>
                            {!prof.id.startsWith("kop-") && (
                              <button
                                type="button"
                                onClick={() => {
                                  const next = savedKopProfiles.filter((p) => p.id !== prof.id);
                                  setSavedKopProfiles(next);
                                  try {
                                    localStorage.setItem("eksporflow_saved_kop_profiles", JSON.stringify(next));
                                  } catch {
                                    // ignore
                                  }
                                  toast.info("Profil kop surat dihapus");
                                }}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded"
                                title="Hapus profil ini"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Tab 2: Spacing, Divider Gap, Layout & Divider Style */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Jarak Teks Kop ke Garis Pembatas */}
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-800">
                          📏 Jarak Kop ke Garis Bawah (Divider Gap)
                        </label>
                        <span className="text-xs font-extrabold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                          {shipment.letterheadDividerGap ?? 4} px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="24"
                        step="1"
                        value={shipment.letterheadDividerGap ?? 4}
                        onChange={(e) => update("letterheadDividerGap", Number(e.target.value))}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                        <button type="button" onClick={() => update("letterheadDividerGap", 0)} className="hover:text-blue-600 font-semibold">
                          0px (Sangat Rapat)
                        </button>
                        <button type="button" onClick={() => update("letterheadDividerGap", 4)} className="hover:text-blue-600 font-semibold">
                          4px (Standar Rapi)
                        </button>
                        <button type="button" onClick={() => update("letterheadDividerGap", 10)} className="hover:text-blue-600 font-semibold">
                          10px (Sedang)
                        </button>
                      </div>
                    </div>

                    {/* Spasi Antar Baris Teks Kop Surat */}
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-800">
                          ↕️ Spasi Antar Baris Teks Kop Surat
                        </label>
                        <span className="text-xs font-extrabold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                          {shipment.letterheadSpacing ?? 2} px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="12"
                        step="1"
                        value={shipment.letterheadSpacing ?? 2}
                        onChange={(e) => update("letterheadSpacing", Number(e.target.value))}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                        <button type="button" onClick={() => update("letterheadSpacing", 0)} className="hover:text-blue-600 font-semibold">
                          0px (Rapat)
                        </button>
                        <button type="button" onClick={() => update("letterheadSpacing", 2)} className="hover:text-blue-600 font-semibold">
                          2px (Ideal)
                        </button>
                        <button type="button" onClick={() => update("letterheadSpacing", 6)} className="hover:text-blue-600 font-semibold">
                          6px (Renggang)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Tata Letak Kop & Gaya Garis Pembatas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Tata Letak Kop Surat (Layout)
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: "left", label: "Kiri Standar" },
                          { id: "center", label: "Tengah Simetris" },
                          { id: "split", label: "Kiri & Kanan" },
                        ].map((ly) => (
                          <button
                            key={ly.id}
                            type="button"
                            onClick={() => update("letterheadLayout", ly.id as any)}
                            className={`py-2 px-2.5 text-xs font-bold rounded-lg border transition-all ${
                              (shipment.letterheadLayout || "left") === ly.id
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                            }`}
                          >
                            {ly.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Gaya Garis Bawah Kop Surat
                      </label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { id: "double", label: "Ganda" },
                          { id: "thick-thin", label: "Tebal-Tipis" },
                          { id: "single", label: "Tunggal" },
                          { id: "none", label: "Tanpa Garis" },
                        ].map((st) => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => update("letterheadDividerStyle", st.id as any)}
                            className={`py-2 px-2 text-[11px] font-bold rounded-lg border transition-all ${
                              (shipment.letterheadDividerStyle || "double") === st.id
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                            }`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <span className="text-[11px] text-slate-500">
                💡 Teks kop surat juga dapat diketik langsung di atas kertas.
              </span>
              <button
                type="button"
                onClick={() => setShowLetterheadModal(false)}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Check size={14} />
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
