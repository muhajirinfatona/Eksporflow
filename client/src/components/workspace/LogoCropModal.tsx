import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crop, RotateCcw, Check, Sparkles, Image as ImageIcon, Sliders, Eye } from "lucide-react";
import { toast } from "sonner";
import { DEFAULT_INDICO_LOGO, type Shipment } from "@shared/shipment";

interface LogoCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: Shipment;
  update: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void;
}

export function LogoCropModal({ isOpen, onClose, shipment, update }: LogoCropModalProps) {
  // Source image is the original uncropped logo if available, or the current logo
  const sourceImage = shipment.letterheadOriginalImage || shipment.letterheadImage || DEFAULT_INDICO_LOGO;

  // Crop percentages (0 - 80)
  const [cropTop, setCropTop] = useState(0);
  const [cropBottom, setCropBottom] = useState(0);
  const [cropLeft, setCropLeft] = useState(0);
  const [cropRight, setCropRight] = useState(0);

  const [naturalWidth, setNaturalWidth] = useState(0);
  const [naturalHeight, setNaturalHeight] = useState(0);
  const [previewDataUrl, setPreviewDataUrl] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  const imgRef = useRef<HTMLImageElement | null>(null);

  // Load natural dimensions of source image
  useEffect(() => {
    if (!isOpen || !sourceImage) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = sourceImage;
    img.onload = () => {
      setNaturalWidth(img.naturalWidth || 500);
      setNaturalHeight(img.naturalHeight || 500);
    };
  }, [isOpen, sourceImage]);

  // Update live preview whenever crop values change
  useEffect(() => {
    if (!isOpen || !sourceImage || !naturalWidth || !naturalHeight) return;

    const timer = setTimeout(() => {
      generateCroppedDataUrl()
        .then((url) => setPreviewDataUrl(url))
        .catch(() => {});
    }, 50);

    return () => clearTimeout(timer);
  }, [cropTop, cropBottom, cropLeft, cropRight, naturalWidth, naturalHeight, sourceImage, isOpen]);

  // Generate cropped base64 from current crop percentages
  const generateCroppedDataUrl = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = sourceImage;
      img.onload = () => {
        const nw = img.naturalWidth || 1024;
        const nh = img.naturalHeight || 858;

        const sx = (cropLeft / 100) * nw;
        const sy = (cropTop / 100) * nh;
        const sWidth = Math.max(10, nw - sx - (cropRight / 100) * nw);
        const sHeight = Math.max(10, nh - sy - (cropBottom / 100) * nh);

        const canvas = document.createElement("canvas");
        canvas.width = Math.round(sWidth);
        canvas.height = Math.round(sHeight);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context not available"));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);

        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = reject;
    });
  };

  const handleApply = async () => {
    setIsProcessing(true);
    try {
      // Ensure original is saved if not already
      if (!shipment.letterheadOriginalImage) {
        update("letterheadOriginalImage", sourceImage);
      }

      // If no crop applied, simply restore original
      if (cropTop === 0 && cropBottom === 0 && cropLeft === 0 && cropRight === 0) {
        update("letterheadImage", sourceImage);
        toast.success("Logo utuh diterapkan tanpa pemotongan.");
      } else {
        const cropped = await generateCroppedDataUrl();
        update("letterheadImage", cropped);
        toast.success("Hasil pangkas logo berhasil diterapkan ke kop surat!");
      }
      onClose();
    } catch (e) {
      toast.error("Gagal memangkas logo: " + (e instanceof Error ? e.message : "Kesalahan tidak dikenal"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetToOriginal = () => {
    setCropTop(0);
    setCropBottom(0);
    setCropLeft(0);
    setCropRight(0);
    if (shipment.letterheadOriginalImage) {
      update("letterheadImage", shipment.letterheadOriginalImage);
    }
    toast.info("Area pangkas di-reset ke logo asli (utuh).");
  };

  // Preset helpers
  const applyPreset = (preset: "full" | "emblemOnly" | "textOnly" | "square") => {
    if (preset === "full") {
      setCropTop(0);
      setCropBottom(0);
      setCropLeft(0);
      setCropRight(0);
    } else if (preset === "emblemOnly") {
      // Keep top palm & coconut emblem, cut off bottom "INDICO EXPORT INDONESIA" text
      setCropTop(0);
      setCropBottom(37);
      setCropLeft(10);
      setCropRight(10);
      toast.success("Preset: Hanya Lambang / Pohon & Kelapa");
    } else if (preset === "textOnly") {
      // Cut off top palm & coconut emblem, keep bottom "INDICO EXPORT INDONESIA" text
      setCropTop(63);
      setCropBottom(0);
      setCropLeft(2);
      setCropRight(2);
      toast.success("Preset: Hanya Teks Nama Perusahaan");
    } else if (preset === "square") {
      setCropTop(5);
      setCropBottom(5);
      setCropLeft(10);
      setCropRight(10);
      toast.success("Preset: Kotak Rapi");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl w-full p-0 overflow-hidden bg-white rounded-2xl shadow-2xl border border-slate-200">
        <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/80 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
              <Crop size={18} />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-800">
                Pangkas / Crop Logo Kop Surat
              </DialogTitle>
              <p className="text-xs text-slate-500">
                Atur area logo yang ingin ditampilkan di kop surat secara bebas dan presisi
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Quick Preset Buttons */}
          <div>
            <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
              <Crop size={13} className="text-slate-500" />
              <span>Pilihan Preset Pemotongan:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => applyPreset("full")}
                className={`py-2 px-3 rounded-lg border text-left transition-all ${
                  cropTop === 0 && cropBottom === 0 && cropLeft === 0 && cropRight === 0
                    ? "border-teal-500 bg-teal-50/70 text-teal-900 font-semibold ring-2 ring-teal-500/20 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                }`}
              >
                <div className="text-xs font-bold">🌱 Utuh / Lengkap</div>
                <div className="text-[10px] text-slate-500">Logo + Teks lengkap</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset("emblemOnly")}
                className={`py-2 px-3 rounded-lg border text-left transition-all ${
                  cropBottom >= 30 && cropTop === 0
                    ? "border-teal-500 bg-teal-50/70 text-teal-900 font-semibold ring-2 ring-teal-500/20 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                }`}
              >
                <div className="text-xs font-bold">🥥 Hanya Lambang</div>
                <div className="text-[10px] text-slate-500">Pohon & Kelapa saja</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset("textOnly")}
                className={`py-2 px-3 rounded-lg border text-left transition-all ${
                  cropTop >= 50
                    ? "border-teal-500 bg-teal-50/70 text-teal-900 font-semibold ring-2 ring-teal-500/20 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                }`}
              >
                <div className="text-xs font-bold">🔤 Hanya Teks</div>
                <div className="text-[10px] text-slate-500">Indico Export Indonesia</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset("square")}
                className="py-2 px-3 rounded-lg border border-slate-200 hover:border-slate-300 bg-white text-slate-700 text-left transition-all"
              >
                <div className="text-xs font-bold">✂️ Rapi Simetris</div>
                <div className="text-[10px] text-slate-500">Pangkas tepi luar</div>
              </button>
            </div>
          </div>

          {/* Visual Crop Workspace & Live Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
            {/* Left: Original with Interactive Crop Frame */}
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-900/5">
              <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                <span>Area Pemotongan (Drag Sliders di Bawah):</span>
                <span className="text-[10px] text-slate-500">{naturalWidth} × {naturalHeight} px</span>
              </div>
              <div className="relative overflow-hidden rounded-lg bg-white border border-slate-200 flex items-center justify-center p-2 min-h-[200px]">
                {/* Checkerboard transparency background pattern */}
                <div
                  className="absolute inset-0 opacity-25"
                  style={{
                    backgroundImage: `radial-gradient(#94a3b8 1px, transparent 1px)`,
                    backgroundSize: "12px 12px",
                  }}
                />

                <div className="relative max-w-full max-h-[220px]">
                  <img
                    ref={imgRef}
                    src={sourceImage}
                    alt="Logo Sumber"
                    className="max-h-[220px] w-auto object-contain block mx-auto select-none pointer-events-none"
                  />

                  {/* Shaded Mask: Top */}
                  <div
                    className="absolute left-0 right-0 top-0 bg-slate-900/60 pointer-events-none transition-all"
                    style={{ height: `${cropTop}%` }}
                  />
                  {/* Shaded Mask: Bottom */}
                  <div
                    className="absolute left-0 right-0 bottom-0 bg-slate-900/60 pointer-events-none transition-all"
                    style={{ height: `${cropBottom}%` }}
                  />
                  {/* Shaded Mask: Left */}
                  <div
                    className="absolute left-0 bg-slate-900/60 pointer-events-none transition-all"
                    style={{
                      top: `${cropTop}%`,
                      bottom: `${cropBottom}%`,
                      width: `${cropLeft}%`,
                    }}
                  />
                  {/* Shaded Mask: Right */}
                  <div
                    className="absolute right-0 bg-slate-900/60 pointer-events-none transition-all"
                    style={{
                      top: `${cropTop}%`,
                      bottom: `${cropBottom}%`,
                      width: `${cropRight}%`,
                    }}
                  />

                  {/* Visible Crop Box Border */}
                  <div
                    className="absolute border-2 border-teal-500 border-dashed pointer-events-none shadow-sm transition-all"
                    style={{
                      top: `${cropTop}%`,
                      bottom: `${cropBottom}%`,
                      left: `${cropLeft}%`,
                      right: `${cropRight}%`,
                    }}
                  >
                    <div className="absolute top-1 left-1.5 bg-teal-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                      Aktif
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Live Cropped Result Preview */}
            <div className="border border-slate-200 rounded-xl p-3 bg-white flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Eye size={13} className="text-blue-600" />
                    <span>Hasil yang Akan Tampil di Kop Surat:</span>
                  </span>
                  <span className="text-[10px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    Live Preview
                  </span>
                </div>
                <div className="relative rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center p-4 min-h-[200px]">
                  {previewDataUrl ? (
                    <img
                      src={previewDataUrl}
                      alt="Hasil Pangkas"
                      className="max-h-[170px] w-auto object-contain drop-shadow-xs"
                    />
                  ) : (
                    <div className="text-xs text-slate-400 flex flex-col items-center gap-1">
                      <ImageIcon size={24} />
                      <span>Memuat hasil pangkas...</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-3 p-2 bg-slate-50 rounded-lg text-[11px] text-slate-600 flex items-center justify-between border border-slate-200">
                <span>Rasio Pangkas Aktif:</span>
                <span className="font-mono font-bold text-slate-800">
                  T:{cropTop}% B:{cropBottom}% L:{cropLeft}% R:{cropRight}%
                </span>
              </div>
            </div>
          </div>

          {/* Precision Sliders */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
            <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Sliders size={13} className="text-slate-500" />
              <span>Pengaturan Pangkas Presisi (Geser Slider):</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                  <span>Pangkas Atas (Top):</span>
                  <span className="font-bold text-teal-700">{cropTop}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="80"
                  value={cropTop}
                  onChange={(e) => setCropTop(Number(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                  <span>Pangkas Bawah (Bottom):</span>
                  <span className="font-bold text-teal-700">{cropBottom}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="80"
                  value={cropBottom}
                  onChange={(e) => setCropBottom(Number(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                  <span>Pangkas Sisi Kiri (Left):</span>
                  <span className="font-bold text-teal-700">{cropLeft}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="80"
                  value={cropLeft}
                  onChange={(e) => setCropLeft(Number(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                  <span>Pangkas Sisi Kanan (Right):</span>
                  <span className="font-bold text-teal-700">{cropRight}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="80"
                  value={cropRight}
                  onChange={(e) => setCropRight(Number(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between sm:justify-between w-full">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetToOriginal}
            className="text-xs text-slate-600 hover:text-slate-800 flex items-center gap-1.5"
          >
            <RotateCcw size={13} />
            <span>Reset ke Logo Asli</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleApply}
              disabled={isProcessing}
              className="text-xs bg-teal-700 hover:bg-teal-800 text-white font-semibold flex items-center gap-1.5 px-4 shadow-sm"
            >
              <Check size={14} />
              <span>{isProcessing ? "Memproses..." : "Terapkan Hasil Crop"}</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
