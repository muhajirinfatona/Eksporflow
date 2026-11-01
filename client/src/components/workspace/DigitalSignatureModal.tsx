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
  Calendar,
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

export function DigitalSignatureModal({
  isOpen,
  onClose,
  shipment,
  update,
  initialParty = "seller",
}: DigitalSignatureModalProps) {
  const [selectedParty, setSelectedParty] = useState<"seller" | "buyer">(initialParty);
  const [activeTab, setActiveTab] = useState<"draw" | "upload" | "font" | "stamp">("draw");

  // Canvas drawing state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState("#0f172a");
  const [penWidth, setPenWidth] = useState(3);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [drawingHistory, setDrawingHistory] = useState<ImageData[]>([]);

  // Font signature state
  const defaultSellerName = shipment.signatoryName || "Muhajirin Fatona";
  const defaultBuyerName = shipment.buyerPicName || "Mr. Tariq Al-Mansoor";
  const [typedName, setTypedName] = useState(
    selectedParty === "seller" ? defaultSellerName : defaultBuyerName
  );
  const [selectedFontStyle, setSelectedFontStyle] = useState<number>(1);

  // Upload state
  const [uploadedImage, setUploadedImage] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Official seal options
  const [includeStamp, setIncludeStamp] = useState(shipment.includeOfficialStamp ?? true);
  const [stampColor, setStampColor] = useState<"red" | "blue">(
    shipment.officialStampColor || "red"
  );

  // Sync typed name when party changes
  useEffect(() => {
    setTypedName(selectedParty === "seller" ? defaultSellerName : defaultBuyerName);
  }, [selectedParty, defaultSellerName, defaultBuyerName]);

  // Canvas setup
  useEffect(() => {
    if (!isOpen || activeTab !== "draw") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // High DPI scaling
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Initial white clear
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Save initial state for history
    const initialData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setDrawingHistory([initialData]);
    setHasDrawn(false);
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  // Drawing event handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
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

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
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
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);
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
      toast.success("Foto tanda tangan berhasil dimuat");
    };
    reader.readAsDataURL(file);
  };

  // Generate Font Signature as Image Data URL
  const generateFontSignatureImage = (name: string, styleIndex: number): string => {
    const offCanvas = document.createElement("canvas");
    offCanvas.width = 480;
    offCanvas.height = 160;
    const ctx = offCanvas.getContext("2d");
    if (!ctx) return "";

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 480, 160);

    ctx.fillStyle = "#0f2942";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    switch (styleIndex) {
      case 1:
        ctx.font = "italic 44px 'Brush Script MT', 'Segoe Script', cursive";
        break;
      case 2:
        ctx.font = "italic 38px 'Segoe Script', cursive";
        break;
      case 3:
        ctx.font = "italic 40px 'Lucida Handwriting', cursive";
        break;
      case 4:
      default:
        ctx.font = "italic 42px 'Dancing Script', 'Snell Roundhand', cursive";
        break;
    }

    ctx.fillText(name, 240, 75);

    // Subtle flourish underline
    ctx.strokeStyle = "#0f2942";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(80, 115);
    ctx.bezierCurveTo(180, 125, 300, 105, 400, 120);
    ctx.stroke();

    return offCanvas.toDataURL("image/png");
  };

  // Save Signature
  const handleApplySignature = () => {
    let finalSignatureUrl = "";
    const signatureDate = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    if (activeTab === "draw") {
      if (!hasDrawn || !canvasRef.current) {
        toast.error("Silakan goreskan tanda tangan terlebih dahulu pada canvas.");
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
      finalSignatureUrl = generateFontSignatureImage(typedName, selectedFontStyle);
    } else if (activeTab === "stamp") {
      finalSignatureUrl = generateFontSignatureImage(typedName, 1);
    }

    if (selectedParty === "seller") {
      update("sellerSignatureImage", finalSignatureUrl);
      update("sellerSignatureType", activeTab);
      update("sellerSignatureDate", signatureDate);
      update("includeOfficialStamp", includeStamp);
      update("officialStampColor", stampColor);
      toast.success("Tanda Tangan Eksportir Berhasil Diterapkan!", {
        description: "Tanda tangan resmi kini tercetak di semua dokumen dan kontrak.",
      });
    } else {
      update("buyerSignatureImage", finalSignatureUrl);
      update("buyerSignatureType", activeTab);
      update("buyerSignatureDate", signatureDate);
      toast.success("Tanda Tangan Pembeli (Buyer) Berhasil Diterapkan!", {
        description: "Tanda tangan pihak buyer kini tercetak di Sales Contract.",
      });
    }

    onClose();
  };

  const handleRemoveSignature = () => {
    if (selectedParty === "seller") {
      update("sellerSignatureImage", "");
      update("sellerSignatureDate", "");
      toast.info("Tanda tangan eksportir dihapus dari dokumen.");
    } else {
      update("buyerSignatureImage", "");
      update("buyerSignatureDate", "");
      toast.info("Tanda tangan buyer dihapus dari dokumen.");
    }
    onClose();
  };

  const currentPartySigned =
    selectedParty === "seller"
      ? !!shipment.sellerSignatureImage
      : !!shipment.buyerSignatureImage;

  return (
    <div className="doc-sig-modal-backdrop" onClick={onClose}>
      <div className="doc-sig-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="doc-sig-modal-header">
          <div className="doc-sig-modal-header-left">
            <div className="doc-sig-icon-box">
              <FileSignature size={20} />
            </div>
            <div>
              <h3 className="doc-sig-modal-title">Tanda Tangan Digital & Stempel Legal</h3>
              <p className="doc-sig-modal-subtitle">
                Standar Keabsahan Dokumen Ekspor Global (ICC Incoterms & UNCITRAL Model Law)
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

        {/* Party Selector (The Seller vs The Buyer) */}
        <div className="doc-sig-party-bar">
          <span className="doc-sig-party-label">Pihak Penandatangan:</span>
          <div className="doc-sig-party-buttons">
            <button
              type="button"
              className={`doc-party-btn ${selectedParty === "seller" ? "active" : ""}`}
              onClick={() => setSelectedParty("seller")}
            >
              <div className="doc-party-badge">Eksportir</div>
              <span>The Seller ({shipment.signatoryName || "Muhajirin Fatona"})</span>
            </button>
            <button
              type="button"
              className={`doc-party-btn ${selectedParty === "buyer" ? "active" : ""}`}
              onClick={() => setSelectedParty("buyer")}
            >
              <div className="doc-party-badge buyer">Buyer</div>
              <span>The Buyer ({shipment.buyerPicName || "Mr. Tariq Al-Mansoor"})</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="doc-sig-tabs-nav">
          <button
            type="button"
            className={`doc-sig-tab-item ${activeTab === "draw" ? "active" : ""}`}
            onClick={() => setActiveTab("draw")}
          >
            <PenTool size={14} />
            <span>1. Gores Tangan</span>
          </button>
          <button
            type="button"
            className={`doc-sig-tab-item ${activeTab === "font" ? "active" : ""}`}
            onClick={() => setActiveTab("font")}
          >
            <Type size={14} />
            <span>2. Ketik Kaligrafi</span>
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
            <span>4. Stempel Resmi & E-Seal</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="doc-sig-tab-content">
          {/* TAB 1: DRAW CANVAS */}
          {activeTab === "draw" && (
            <div className="doc-sig-draw-pane">
              <div className="doc-canvas-toolbar">
                <div className="doc-pen-colors">
                  <span className="doc-tool-label">Tinta:</span>
                  <button
                    type="button"
                    className={`pen-color-dot dot-black ${penColor === "#0f172a" ? "active" : ""}`}
                    onClick={() => setPenColor("#0f172a")}
                    title="Hitam Resmi"
                  />
                  <button
                    type="button"
                    className={`pen-color-dot dot-blue ${penColor === "#1e40af" ? "active" : ""}`}
                    onClick={() => setPenColor("#1e40af")}
                    title="Biru Tinta Diplomat"
                  />
                  <button
                    type="button"
                    className={`pen-color-dot dot-navy ${penColor === "#1d4ed8" ? "active" : ""}`}
                    onClick={() => setPenColor("#1d4ed8")}
                    title="Biru Klasik"
                  />
                </div>

                <div className="doc-pen-thickness">
                  <span className="doc-tool-label">Tebal:</span>
                  <button
                    type="button"
                    className={`thickness-btn ${penWidth === 2 ? "active" : ""}`}
                    onClick={() => setPenWidth(2)}
                  >
                    Halus
                  </button>
                  <button
                    type="button"
                    className={`thickness-btn ${penWidth === 3 ? "active" : ""}`}
                    onClick={() => setPenWidth(3)}
                  >
                    Sedang
                  </button>
                  <button
                    type="button"
                    className={`thickness-btn ${penWidth === 4 ? "active" : ""}`}
                    onClick={() => setPenWidth(4)}
                  >
                    Tebal
                  </button>
                </div>

                <div className="doc-canvas-actions">
                  <button
                    type="button"
                    className="doc-canvas-mini-btn"
                    onClick={undoCanvas}
                    title="Undo goresan terakhir"
                  >
                    <RotateCcw size={12} /> Undo
                  </button>
                  <button
                    type="button"
                    className="doc-canvas-mini-btn btn-clear"
                    onClick={clearCanvas}
                    title="Bersihkan seluruh pad"
                  >
                    <Trash2 size={12} /> Bersihkan
                  </button>
                </div>
              </div>

              {/* Canvas Area */}
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
                    <span>Goreskan tanda tangan Anda di sini menggunakan mouse, pen tablet, atau layar sentuh</span>
                  </div>
                )}
                <div className="doc-canvas-baseline" />
              </div>
            </div>
          )}

          {/* TAB 2: FONT CALIGRAPHY */}
          {activeTab === "font" && (
            <div className="doc-sig-font-pane">
              <div className="doc-font-input-wrap">
                <label className="doc-font-label">Nama yang Ditandatangani:</label>
                <input
                  type="text"
                  className="doc-font-input"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  placeholder="Ketik nama lengkap penandatangan"
                />
              </div>

              <div className="doc-font-styles-grid">
                {[
                  { id: 1, name: "Gaya 1 · Formal Cursive", font: "'Brush Script MT', cursive" },
                  { id: 2, name: "Gaya 2 · Executive Fountain", font: "'Segoe Script', cursive" },
                  { id: 3, name: "Gaya 3 · Modern Diplomat", font: "'Lucida Handwriting', cursive" },
                  { id: 4, name: "Gaya 4 · Legal Flourish", font: "'Dancing Script', cursive, serif" },
                ].map((style) => (
                  <div
                    key={style.id}
                    className={`doc-font-card ${selectedFontStyle === style.id ? "selected" : ""}`}
                    onClick={() => setSelectedFontStyle(style.id)}
                  >
                    <div className="doc-font-card-header">
                      <span className="doc-font-card-title">{style.name}</span>
                      {selectedFontStyle === style.id && <Check size={14} className="check-icon" />}
                    </div>
                    <div className="doc-font-sample" style={{ fontFamily: style.font }}>
                      {typedName || "Muhajirin Fatona"}
                    </div>
                    <div className="doc-font-card-line" />
                  </div>
                ))}
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
                  <Upload size={32} />
                  <h4>Pilih atau Tarik Foto Tanda Tangan ke Sini</h4>
                  <p>Mendukung format PNG (transparan disarankan), JPG, atau WEBP (Maksimal 2 MB).</p>
                  <button type="button" className="doc-upload-browse-btn">
                    Pilih Berkas dari Komputer
                  </button>
                </div>
              ) : (
                <div className="doc-upload-preview-card">
                  <div className="doc-upload-preview-header">
                    <span className="doc-upload-preview-title">Foto Tanda Tangan Terunggah:</span>
                    <button
                      type="button"
                      className="doc-upload-change-btn"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Ganti Foto
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
                  <span>Bubuhkan Stempel Basah Digital Resmi Perusahaan (Corporate Seal)</span>
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
                      <span className="stamp-pill red">Stempel Merah Marun Resmi</span>
                    </label>
                    <label className="stamp-radio-label">
                      <input
                        type="radio"
                        name="stampColor"
                        checked={stampColor === "blue"}
                        onChange={() => setStampColor("blue")}
                      />
                      <span className="stamp-pill blue">Stempel Biru Pabean Diplomat</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Stamped Seal Preview */}
              <div className="doc-stamp-preview-box">
                <div className="doc-stamp-preview-label">Pratinjau Stempel Resmi:</div>
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

              {/* Legal Standards Note */}
              <div className="doc-stamp-security-card">
                <ShieldCheck size={18} className="shield-icon" />
                <div>
                  <b>Keabsahan Hukum Internasional:</b>
                  <p>
                    Dokumen ini dilengkapi dengan identitas penandatangan, nomor rujukan kontrak, dan stempel digital yang memenuhi standar UNCITRAL Model Law on Electronic Commerce serta ketentuan ICC Uniform Customs and Practice.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="doc-sig-modal-footer">
          <div className="doc-sig-footer-left">
            {currentPartySigned && (
              <button
                type="button"
                className="doc-sig-btn-delete"
                onClick={handleRemoveSignature}
              >
                <Trash2 size={13} />
                <span>Hapus Tanda Tangan Saat Ini</span>
              </button>
            )}
            <div className="doc-sig-security-tag">
              <Lock size={12} />
              <span>Verifikasi SHA-256 E-Sign</span>
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
