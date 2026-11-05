import React, { useRef, useState, useEffect } from "react";
import {
  FileSignature,
  PenTool,
  Upload,
  Type,
  Stamp,
  Check,
  X,
  Trash2,
  RotateCcw,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import type { Shipment } from "@shared/shipment";

interface DigitalSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: Shipment;
  update: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void;
  initialParty?: "seller" | "buyer";
}

export interface SignatureStyleSpec {
  id: number;
  label: string;
  badge: string;
  fontFamily: string;
  fontSizePx: number;
  canvasFontPx: number;
  slantDeg: number;
  letterSpacing: string;
  mode: "full" | "initial-last" | "monogram-full" | "paraf-surname";
  flourishType:
    | "sweep-hook"
    | "diplomat-dots"
    | "slash-tail"
    | "loop-under"
    | "figure-eight"
    | "rising-arc"
    | "double-rail"
    | "vertical-strike"
    | "wrap-loop"
    | "tapered-wave"
    | "z-paraph"
    | "parabolic-bold";
}

export const SIGNATURE_STYLES: SignatureStyleSpec[] = [
  {
    id: 1,
    label: "Executive Wet-Ink",
    badge: "Direktur Utama",
    fontFamily: "'Mrs Saint Delafield', cursive",
    fontSizePx: 34,
    canvasFontPx: 64,
    slantDeg: -7,
    letterSpacing: "-0.02em",
    mode: "full",
    flourishType: "sweep-hook",
  },
  {
    id: 2,
    label: "Diplomat Aristocrat",
    badge: "Pejabat Ekspor",
    fontFamily: "'Herr Von Muellerhoff', cursive",
    fontSizePx: 33,
    canvasFontPx: 62,
    slantDeg: -9,
    letterSpacing: "-0.01em",
    mode: "full",
    flourishType: "diplomat-dots",
  },
  {
    id: 3,
    label: "Rapid CEO Paraf",
    badge: "Goresan Cepat",
    fontFamily: "'Reenie Beanie', cursive",
    fontSizePx: 33,
    canvasFontPx: 62,
    slantDeg: -10,
    letterSpacing: "-0.03em",
    mode: "initial-last",
    flourishType: "slash-tail",
  },
  {
    id: 4,
    label: "Notary Legal Script",
    badge: "Kontrak Dagang",
    fontFamily: "'Pinyon Script', cursive",
    fontSizePx: 29,
    canvasFontPx: 54,
    slantDeg: -6,
    letterSpacing: "0em",
    mode: "full",
    flourishType: "loop-under",
  },
  {
    id: 5,
    label: "Banker Fountain Pen",
    badge: "Bank Devisa / L/C",
    fontFamily: "'Alex Brush', cursive",
    fontSizePx: 31,
    canvasFontPx: 58,
    slantDeg: -8,
    letterSpacing: "-0.01em",
    mode: "monogram-full",
    flourishType: "figure-eight",
  },
  {
    id: 6,
    label: "Founder Dynamic",
    badge: "Otentik Natural",
    fontFamily: "'Nothing You Could Do', cursive",
    fontSizePx: 26,
    canvasFontPx: 48,
    slantDeg: -8,
    letterSpacing: "-0.02em",
    mode: "full",
    flourishType: "rising-arc",
  },
  {
    id: 7,
    label: "Presidential Calligraphy",
    badge: "Resmi Korporat",
    fontFamily: "'Great Vibes', cursive",
    fontSizePx: 29,
    canvasFontPx: 54,
    slantDeg: -6,
    letterSpacing: "0em",
    mode: "full",
    flourishType: "double-rail",
  },
  {
    id: 8,
    label: "Minimalist Monoline",
    badge: "Paraf Modern",
    fontFamily: "'Sacramento', cursive",
    fontSizePx: 31,
    canvasFontPx: 58,
    slantDeg: -7,
    letterSpacing: "-0.01em",
    mode: "initial-last",
    flourishType: "vertical-strike",
  },
  {
    id: 9,
    label: "Swift Ballpoint",
    badge: "Tanda Tangan Asli",
    fontFamily: "'La Belle Aurore', cursive",
    fontSizePx: 27,
    canvasFontPx: 50,
    slantDeg: -9,
    letterSpacing: "-0.02em",
    mode: "paraf-surname",
    flourishType: "wrap-loop",
  },
  {
    id: 10,
    label: "Corporate Rollerball",
    badge: "Faktur Komersial",
    fontFamily: "'Allura', cursive",
    fontSizePx: 31,
    canvasFontPx: 58,
    slantDeg: -6,
    letterSpacing: "0em",
    mode: "full",
    flourishType: "tapered-wave",
  },
  {
    id: 11,
    label: "Merchant Captain",
    badge: "Shipping / B/L",
    fontFamily: "'Cedarville Cursive', cursive",
    fontSizePx: 26,
    canvasFontPx: 48,
    slantDeg: -10,
    letterSpacing: "-0.03em",
    mode: "initial-last",
    flourishType: "z-paraph",
  },
  {
    id: 12,
    label: "Bold Nib Signatory",
    badge: "Pena Kaligrafi",
    fontFamily: "'Marck Script', cursive",
    fontSizePx: 28,
    canvasFontPx: 52,
    slantDeg: -7,
    letterSpacing: "-0.01em",
    mode: "full",
    flourishType: "parabolic-bold",
  },
];

function formatSignatureDisplayText(rawName: string, mode: SignatureStyleSpec["mode"]): string {
  const clean = (rawName || "Muhajirin Fatona").trim().replace(/\s+/g, " ");
  const parts = clean.split(" ").filter(Boolean);
  if (parts.length <= 1) return clean;

  if (mode === "initial-last") {
    const firstInitial = parts[0].charAt(0).toUpperCase();
    const rest = parts.slice(1).join(" ");
    return `${firstInitial}. ${rest}`;
  }
  if (mode === "monogram-full") {
    return clean;
  }
  if (mode === "paraf-surname") {
    const initials = parts
      .slice(0, -1)
      .map((p) => p.charAt(0).toUpperCase())
      .join("");
    const surname = parts[parts.length - 1];
    return `${initials} ${surname}`;
  }
  return clean;
}

function renderFlourishSvgPath(type: SignatureStyleSpec["flourishType"]): React.ReactNode {
  switch (type) {
    case "sweep-hook":
      return (
        <path
          d="M 28 52 C 85 45, 165 38, 225 41 C 205 46, 130 55, 95 60 C 82 62, 92 67, 118 64"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      );
    case "diplomat-dots":
      return (
        <>
          <path
            d="M 35 54 Q 125 38 215 49"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <circle cx="118" cy="57" r="1.4" fill="currentColor" />
          <circle cx="132" cy="56" r="1.4" fill="currentColor" />
        </>
      );
    case "slash-tail":
      return (
        <path
          d="M 52 14 L 34 58 M 30 52 C 95 44, 175 36, 232 30"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      );
    case "loop-under":
      return (
        <path
          d="M 40 52 C 105 46, 185 44, 218 48 C 228 50, 212 58, 175 56 C 145 55, 128 51, 148 45"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      );
    case "figure-eight":
      return (
        <path
          d="M 48 53 C 88 42, 168 42, 204 51 C 220 55, 190 62, 145 54 C 105 47, 85 57, 132 61"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.45"
          strokeLinecap="round"
        />
      );
    case "rising-arc":
      return (
        <path
          d="M 38 56 C 95 48, 165 39, 224 33"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      );
    case "double-rail":
      return (
        <>
          <path
            d="M 34 51 C 100 44, 170 42, 222 45"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M 58 57 C 115 52, 168 50, 202 52"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
        </>
      );
    case "vertical-strike":
      return (
        <path
          d="M 64 12 L 54 60 M 42 50 L 218 42"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      );
    case "wrap-loop":
      return (
        <path
          d="M 210 38 C 235 46, 175 63, 95 57 C 32 52, 18 32, 58 18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.45"
          strokeLinecap="round"
        />
      );
    case "tapered-wave":
      return (
        <path
          d="M 32 53 C 78 44, 125 56, 175 46 C 198 42, 215 41, 228 44"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      );
    case "z-paraph":
      return (
        <path
          d="M 42 49 L 212 42 L 78 58 L 222 53"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.45"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    case "parabolic-bold":
    default:
      return (
        <path
          d="M 30 55 Q 125 36 226 48"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
      );
  }
}

function drawCanvasFlourish(
  ctx: CanvasRenderingContext2D,
  type: SignatureStyleSpec["flourishType"],
  inkColor: string
) {
  ctx.save();
  ctx.strokeStyle = inkColor;
  ctx.fillStyle = inkColor;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Scale from 250x68 SVG space to 560x190 Canvas space
  const sx = 560 / 250;
  const sy = 190 / 68;
  ctx.scale(sx, sy);

  switch (type) {
    case "sweep-hook": {
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(28, 52);
      ctx.bezierCurveTo(85, 45, 165, 38, 225, 41);
      ctx.bezierCurveTo(205, 46, 130, 55, 95, 60);
      ctx.bezierCurveTo(82, 62, 92, 67, 118, 64);
      ctx.stroke();
      break;
    }
    case "diplomat-dots": {
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(35, 54);
      ctx.quadraticCurveTo(125, 38, 215, 49);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(118, 57, 1.4, 0, Math.PI * 2);
      ctx.arc(132, 56, 1.4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "slash-tail": {
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(52, 14);
      ctx.lineTo(34, 58);
      ctx.moveTo(30, 52);
      ctx.bezierCurveTo(95, 44, 175, 36, 232, 30);
      ctx.stroke();
      break;
    }
    case "loop-under": {
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(40, 52);
      ctx.bezierCurveTo(105, 46, 185, 44, 218, 48);
      ctx.bezierCurveTo(228, 50, 212, 58, 175, 56);
      ctx.bezierCurveTo(145, 55, 128, 51, 148, 45);
      ctx.stroke();
      break;
    }
    case "figure-eight": {
      ctx.lineWidth = 1.45;
      ctx.beginPath();
      ctx.moveTo(48, 53);
      ctx.bezierCurveTo(88, 42, 168, 42, 204, 51);
      ctx.bezierCurveTo(220, 55, 190, 62, 145, 54);
      ctx.bezierCurveTo(105, 47, 85, 57, 132, 61);
      ctx.stroke();
      break;
    }
    case "rising-arc": {
      ctx.lineWidth = 1.75;
      ctx.beginPath();
      ctx.moveTo(38, 56);
      ctx.bezierCurveTo(95, 48, 165, 39, 224, 33);
      ctx.stroke();
      break;
    }
    case "double-rail": {
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(34, 51);
      ctx.bezierCurveTo(100, 44, 170, 42, 222, 45);
      ctx.stroke();
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(58, 57);
      ctx.bezierCurveTo(115, 52, 168, 50, 202, 52);
      ctx.stroke();
      break;
    }
    case "vertical-strike": {
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(64, 12);
      ctx.lineTo(54, 60);
      ctx.moveTo(42, 50);
      ctx.lineTo(218, 42);
      ctx.stroke();
      break;
    }
    case "wrap-loop": {
      ctx.lineWidth = 1.45;
      ctx.beginPath();
      ctx.moveTo(210, 38);
      ctx.bezierCurveTo(235, 46, 175, 63, 95, 57);
      ctx.bezierCurveTo(32, 52, 18, 32, 58, 18);
      ctx.stroke();
      break;
    }
    case "tapered-wave": {
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(32, 53);
      ctx.bezierCurveTo(78, 44, 125, 56, 175, 46);
      ctx.bezierCurveTo(198, 42, 215, 41, 228, 44);
      ctx.stroke();
      break;
    }
    case "z-paraph": {
      ctx.lineWidth = 1.45;
      ctx.beginPath();
      ctx.moveTo(42, 49);
      ctx.lineTo(212, 42);
      ctx.lineTo(78, 58);
      ctx.lineTo(222, 53);
      ctx.stroke();
      break;
    }
    case "parabolic-bold":
    default: {
      ctx.lineWidth = 1.9;
      ctx.beginPath();
      ctx.moveTo(30, 55);
      ctx.quadraticCurveTo(125, 36, 226, 48);
      ctx.stroke();
      break;
    }
  }

  ctx.restore();
}

export function DigitalSignatureModal({
  isOpen,
  onClose,
  shipment,
  update,
}: DigitalSignatureModalProps) {
  const [activeTab, setActiveTab] = useState<"font" | "draw" | "upload" | "stamp">("font");

  // Canvas drawing state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState("#0f2942");
  const [penWidth, setPenWidth] = useState(2.5);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [drawingHistory, setDrawingHistory] = useState<ImageData[]>([]);

  // Font signature state (Strictly Exporter / Seller)
  const defaultSellerName = shipment.signatoryName || "Muhajirin Fatona";
  const [typedName, setTypedName] = useState(defaultSellerName);
  const [selectedFontStyle, setSelectedFontStyle] = useState<number>(1);
  const [fontInkColor, setFontInkColor] = useState<string>("#0f2942");

  // Upload state
  const [uploadedImage, setUploadedImage] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Official seal options
  const [includeStamp, setIncludeStamp] = useState(shipment.includeOfficialStamp ?? true);
  const [stampColor, setStampColor] = useState<"red" | "blue">(
    shipment.officialStampColor || "red"
  );

  useEffect(() => {
    if (isOpen) {
      setTypedName(shipment.signatoryName || "Muhajirin Fatona");
    }
  }, [isOpen, shipment.signatoryName]);

  // Canvas setup for manual drawing tab
  useEffect(() => {
    if (!isOpen || activeTab !== "draw") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const initialData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setDrawingHistory([initialData]);
    setHasDrawn(false);
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  // Drawing event handlers
  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.closePath();
    const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setDrawingHistory((prev) => [...prev, currentState]);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    setHasDrawn(false);
    setDrawingHistory([]);
  };

  const undoCanvas = () => {
    if (drawingHistory.length <= 1) {
      clearCanvas();
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const nextHistory = drawingHistory.slice(0, -1);
    const prevState = nextHistory[nextHistory.length - 1];
    ctx.putImageData(prevState, 0, 0);
    setDrawingHistory(nextHistory);
  };

  // Image Upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar (PNG, JPG, WEBP)");
      return;
    }
    if (file.size > 2_000_000) {
      toast.error("Ukuran file gambar maksimal 2 MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImage(String(reader.result));
      toast.success("Gambar tanda tangan berhasil dimuat");
    };
    reader.readAsDataURL(file);
  };

  // Generate Realistic Handwritten Signature as Transparent PNG Data URL
  const generateFontSignatureImage = (name: string, styleId: number, inkColor: string): string => {
    const spec = SIGNATURE_STYLES.find((s) => s.id === styleId) || SIGNATURE_STYLES[0];
    const displayText = formatSignatureDisplayText(name, spec.mode);

    const offCanvas = document.createElement("canvas");
    offCanvas.width = 560;
    offCanvas.height = 190;
    const ctx = offCanvas.getContext("2d");
    if (!ctx) return "";

    // Transparent background so signature overlaps corporate seal naturally
    ctx.clearRect(0, 0, 560, 190);

    // Draw slanted handwritten text
    ctx.save();
    ctx.translate(280, 92);
    ctx.rotate((spec.slantDeg * Math.PI) / 180);
    ctx.fillStyle = inkColor;
    ctx.strokeStyle = inkColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${spec.canvasFontPx}px ${spec.fontFamily}`;
    ctx.fillText(displayText, 0, 0);
    // Subtle wet-ink stroke weight
    ctx.lineWidth = 0.65;
    ctx.strokeText(displayText, 0, 0);
    ctx.restore();

    // Draw authentic fountain-pen flourish
    drawCanvasFlourish(ctx, spec.flourishType, inkColor);

    return offCanvas.toDataURL("image/png");
  };

  // Save Signature (Strictly Exporter / Seller)
  const handleApplySignature = () => {
    let finalSignatureUrl = "";
    const signatureDate = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    if (activeTab === "draw") {
      if (!hasDrawn || !canvasRef.current) {
        toast.error("Silakan goreskan tanda tangan terlebih dahulu pada area kanvas.");
        return;
      }
      finalSignatureUrl = canvasRef.current.toDataURL("image/png");
    } else if (activeTab === "upload") {
      if (!uploadedImage) {
        toast.error("Silakan unggah gambar tanda tangan terlebih dahulu.");
        return;
      }
      finalSignatureUrl = uploadedImage;
    } else if (activeTab === "font") {
      finalSignatureUrl = generateFontSignatureImage(typedName, selectedFontStyle, fontInkColor);
    } else if (activeTab === "stamp") {
      finalSignatureUrl =
        shipment.sellerSignatureImage ||
        generateFontSignatureImage(typedName, selectedFontStyle, fontInkColor);
    }

    if (typedName.trim() && typedName.trim() !== shipment.signatoryName) {
      update("signatoryName", typedName.trim());
    }
    update("sellerSignatureImage", finalSignatureUrl);
    update("sellerSignatureType", activeTab);
    update("sellerSignatureDate", signatureDate);
    update("includeOfficialStamp", includeStamp);
    update("officialStampColor", stampColor);

    toast.success("Tanda Tangan & Stempel Eksportir Diterapkan", {
      description: "Tanda tangan resmi telah terpasang pada dokumen ekspor.",
    });

    onClose();
  };

  const handleRemoveSignature = () => {
    update("sellerSignatureImage", "");
    update("sellerSignatureDate", "");
    toast.info("Tanda tangan dihapus dari dokumen.");
    onClose();
  };

  const hasExistingSignature = !!shipment.sellerSignatureImage;

  return (
    <div className="doc-sig-modal-backdrop" onClick={onClose}>
      <div
        className="doc-sig-modal-card"
        style={{ maxWidth: "740px" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="doc-sig-modal-header">
          <div className="doc-sig-modal-header-left">
            <div className="doc-sig-icon-box">
              <FileSignature size={18} />
            </div>
            <div>
              <h3 className="doc-sig-modal-title">Tanda Tangan Digital & Stempel Resmi Eksportir</h3>
              <p className="doc-sig-modal-subtitle">
                Otorisasi Pejabat Eksportir ({shipment.exporter || "PT. INDICO EXPORT INDONESIA"})
              </p>
            </div>
          </div>
          <button
            type="button"
            className="doc-sig-modal-close"
            onClick={onClose}
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        {/* Single-Line Tab Switcher */}
        <div className="doc-sig-tabs-nav">
          <button
            type="button"
            className={`doc-sig-tab-item ${activeTab === "font" ? "active" : ""}`}
            onClick={() => setActiveTab("font")}
          >
            <Type size={14} />
            <span>1. Pilih Gaya Tanda Tangan (12 Gaya)</span>
          </button>
          <button
            type="button"
            className={`doc-sig-tab-item ${activeTab === "draw" ? "active" : ""}`}
            onClick={() => setActiveTab("draw")}
          >
            <PenTool size={14} />
            <span>2. Gores Tangan Manual</span>
          </button>
          <button
            type="button"
            className={`doc-sig-tab-item ${activeTab === "upload" ? "active" : ""}`}
            onClick={() => setActiveTab("upload")}
          >
            <Upload size={14} />
            <span>3. Unggah Gambar</span>
          </button>
          <button
            type="button"
            className={`doc-sig-tab-item ${activeTab === "stamp" ? "active" : ""}`}
            onClick={() => setActiveTab("stamp")}
          >
            <Stamp size={14} />
            <span>4. Stempel Perusahaan</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="doc-sig-tab-content">
          {/* TAB 1: 12 REALISTIC HANDWRITTEN SIGNATURE STYLES */}
          {activeTab === "font" && (
            <div className="doc-sig-font-pane">
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  gap: "14px",
                  marginBottom: "12px",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ flex: 1, minWidth: "240px" }}>
                  <label className="doc-font-label">Nama Pejabat Penandatangan (Eksportir):</label>
                  <input
                    type="text"
                    className="doc-font-input"
                    value={typedName}
                    onChange={(e) => setTypedName(e.target.value)}
                    placeholder="Ketik nama lengkap pejabat penandatangan..."
                  />
                </div>

                {/* Ink Color Selector */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <span className="doc-font-label" style={{ marginBottom: 0 }}>
                    Warna Tinta Pena:
                  </span>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      background: "#f8fafc",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      padding: "5px 8px",
                    }}
                  >
                    {[
                      { color: "#0f2942", label: "Navy Wet-Ink" },
                      { color: "#1d4ed8", label: "Biru Pulpen" },
                      { color: "#0f172a", label: "Hitam Pekat" },
                    ].map((ink) => {
                      const active = fontInkColor === ink.color;
                      return (
                        <button
                          key={ink.color}
                          type="button"
                          onClick={() => setFontInkColor(ink.color)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "3px 8px",
                            borderRadius: "4px",
                            border: active ? "1.5px solid #0284c7" : "1px solid transparent",
                            background: active ? "#e0f2fe" : "transparent",
                            fontSize: "11px",
                            fontWeight: active ? 700 : 600,
                            color: "#1e293b",
                            cursor: "pointer",
                          }}
                        >
                          <span
                            style={{
                              width: "12px",
                              height: "12px",
                              borderRadius: "50%",
                              background: ink.color,
                              display: "inline-block",
                              boxShadow: "0 0 0 1px rgba(0,0,0,0.15)",
                            }}
                          />
                          <span>{ink.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 12 Signature Cards Grid (3 Columns, Scrollable Container) */}
              <div className="doc-font-styles-grid-12">
                {SIGNATURE_STYLES.map((style) => {
                  const isSelected = selectedFontStyle === style.id;
                  const displayTxt = formatSignatureDisplayText(typedName, style.mode);
                  return (
                    <button
                      key={style.id}
                      type="button"
                      className={`doc-font-card-pro ${isSelected ? "selected" : ""}`}
                      onClick={() => setSelectedFontStyle(style.id)}
                    >
                      <div className="doc-font-card-header">
                        <span className="doc-font-card-title">{style.label}</span>
                        <span className="doc-font-card-badge">{style.badge}</span>
                      </div>

                      <div
                        className="doc-font-sample-stage"
                        style={{ color: fontInkColor }}
                      >
                        <div
                          className="doc-font-sample-text"
                          style={{
                            fontFamily: style.fontFamily,
                            fontSize: `${style.fontSizePx}px`,
                            letterSpacing: style.letterSpacing,
                            transform: `rotate(${style.slantDeg}deg)`,
                            color: fontInkColor,
                          }}
                        >
                          {displayTxt}
                        </div>
                        <svg
                          viewBox="0 0 250 68"
                          className="doc-font-flourish-svg"
                          style={{ color: fontInkColor }}
                          preserveAspectRatio="none"
                        >
                          {renderFlourishSvgPath(style.flourishType)}
                        </svg>
                      </div>

                      <div className="doc-font-card-footer-line">
                        <span>Authorized Signature</span>
                        {isSelected && <Check size={13} className="check-icon" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: DRAW CANVAS */}
          {activeTab === "draw" && (
            <div className="doc-sig-draw-pane">
              <div className="doc-canvas-toolbar">
                <div className="doc-pen-colors">
                  <span className="doc-tool-label">Warna Tinta:</span>
                  <button
                    type="button"
                    className={`pen-color-dot dot-navy ${penColor === "#0f2942" ? "active" : ""}`}
                    onClick={() => setPenColor("#0f2942")}
                    title="Navy Wet-Ink"
                  />
                  <button
                    type="button"
                    className={`pen-color-dot dot-blue ${penColor === "#1d4ed8" ? "active" : ""}`}
                    onClick={() => setPenColor("#1d4ed8")}
                    title="Biru Pulpen Resmi"
                  />
                  <button
                    type="button"
                    className={`pen-color-dot dot-black ${penColor === "#0f172a" ? "active" : ""}`}
                    onClick={() => setPenColor("#0f172a")}
                    title="Hitam Pekat"
                  />
                </div>

                <div className="doc-pen-thickness">
                  <span className="doc-tool-label">Ketebalan Pena:</span>
                  <button
                    type="button"
                    className={`thickness-btn ${penWidth === 1.8 ? "active" : ""}`}
                    onClick={() => setPenWidth(1.8)}
                  >
                    Halus
                  </button>
                  <button
                    type="button"
                    className={`thickness-btn ${penWidth === 2.5 ? "active" : ""}`}
                    onClick={() => setPenWidth(2.5)}
                  >
                    Standar
                  </button>
                  <button
                    type="button"
                    className={`thickness-btn ${penWidth === 3.6 ? "active" : ""}`}
                    onClick={() => setPenWidth(3.6)}
                  >
                    Tebal
                  </button>
                </div>

                <div className="doc-canvas-actions">
                  <button
                    type="button"
                    className="doc-canvas-mini-btn"
                    onClick={undoCanvas}
                    title="Urungkan goresan terakhir"
                  >
                    <RotateCcw size={12} /> Undo
                  </button>
                  <button
                    type="button"
                    className="doc-canvas-mini-btn btn-clear"
                    onClick={clearCanvas}
                    title="Bersihkan seluruh kanvas"
                  >
                    <Trash2 size={12} /> Bersihkan
                  </button>
                </div>
              </div>

              <div className="doc-canvas-wrapper">
                <canvas
                  ref={canvasRef}
                  className="doc-signature-canvas"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
                {!hasDrawn && (
                  <div className="doc-canvas-guide">
                    <PenTool size={20} />
                    <span>
                      Goreskan tanda tangan Anda di area ini menggunakan mouse, stylus, atau layar sentuh
                    </span>
                  </div>
                )}
                <div className="doc-canvas-baseline" />
              </div>
            </div>
          )}

          {/* TAB 3: UPLOAD IMAGE */}
          {activeTab === "upload" && (
            <div className="doc-sig-upload-pane">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                style={{ display: "none" }}
                onChange={handleImageUpload}
              />

              {!uploadedImage ? (
                <div
                  className="doc-upload-dropzone"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={30} />
                  <h4>Unggah Berkas Gambar Tanda Tangan</h4>
                  <p>Mendukung format PNG transparan, JPG, atau WEBP (Maks. 2 MB).</p>
                  <button type="button" className="doc-upload-browse-btn">
                    Pilih Berkas dari Komputer
                  </button>
                </div>
              ) : (
                <div className="doc-upload-preview-card">
                  <div className="doc-upload-preview-header">
                    <span className="doc-upload-preview-title">Pratinjau Tanda Tangan Terunggah:</span>
                    <button
                      type="button"
                      className="doc-upload-change-btn"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Ganti Berkas
                    </button>
                  </div>
                  <div className="doc-upload-img-box">
                    <img src={uploadedImage} alt="Uploaded Signature" className="uploaded-sig-img" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: OFFICIAL STAMP & E-SEAL */}
          {activeTab === "stamp" && (
            <div className="doc-sig-stamp-pane">
              <div className="doc-stamp-settings">
                <label className="doc-stamp-checkbox">
                  <input
                    type="checkbox"
                    checked={includeStamp}
                    onChange={(e) => setIncludeStamp(e.target.checked)}
                  />
                  <span>Sertakan Stempel Resmi Perusahaan (Official Corporate Seal)</span>
                </label>

                {includeStamp && (
                  <div className="doc-stamp-color-options">
                    <span className="doc-tool-label">Warna Tinta Stempel:</span>
                    <label className="stamp-radio-label">
                      <input
                        type="radio"
                        name="stampColor"
                        checked={stampColor === "red"}
                        onChange={() => setStampColor("red")}
                      />
                      <span className="stamp-pill red">Merah Marun Korporat</span>
                    </label>
                    <label className="stamp-radio-label">
                      <input
                        type="radio"
                        name="stampColor"
                        checked={stampColor === "blue"}
                        onChange={() => setStampColor("blue")}
                      />
                      <span className="stamp-pill blue">Biru Kepabeanan Ekspor</span>
                    </label>
                  </div>
                )}
              </div>

              <div className="doc-stamp-preview-box">
                <div className="doc-stamp-preview-label">Pratinjau Stempel Perusahaan:</div>
                <div className={`official-corporate-seal seal-${stampColor}`}>
                  <div className="seal-outer-circle">
                    <div className="seal-inner-circle">
                      <div className="seal-text-top">★ PT. INDICO EXPORT INDONESIA ★</div>
                      <div className="seal-center-box">
                        <span className="seal-star">★★★★★</span>
                        <span className="seal-center-text">OFFICIAL</span>
                        <span className="seal-center-sub">EXPORT SEAL</span>
                        <span className="seal-year">2026</span>
                      </div>
                      <div className="seal-text-bottom">★ REPUBLIC OF INDONESIA ★</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="doc-stamp-security-card">
                <ShieldCheck size={18} className="shield-icon" />
                <div>
                  <b>Otorisasi Dokumen Ekspor Resmi:</b>
                  <p>
                    Tanda tangan dan stempel perusahaan diterapkan langsung pada blok pengesahan Eksportir di seluruh dokumen (*Proforma Invoice*, *Sales Contract*, *Commercial Invoice*, *Packing List*, dan *Shipping Instruction*).
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="doc-sig-modal-footer">
          <div className="doc-sig-footer-left">
            {hasExistingSignature && (
              <button
                type="button"
                className="doc-sig-btn-delete"
                onClick={handleRemoveSignature}
              >
                <Trash2 size={13} />
                <span>Hapus Tanda Tangan</span>
              </button>
            )}
            <div className="doc-sig-security-tag">
              <Lock size={12} />
              <span>Otorisasi Resmi Eksportir</span>
            </div>
          </div>

          <div className="doc-sig-footer-right">
            <button
              type="button"
              className="doc-sig-btn-cancel"
              onClick={onClose}
            >
              Batal
            </button>
            <button
              type="button"
              className="doc-sig-btn-apply"
              onClick={handleApplySignature}
            >
              <Check size={15} />
              <span>Terapkan Tanda Tangan ke Dokumen</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
