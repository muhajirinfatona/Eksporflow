import {
  SAMPLE_POS,
  parsePoTextAndScreen,
  type PoScreeningResult,
} from "@shared/poScreening";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

export function PoIngestionModal({
  isOpen,
  onClose,
  onApply,
}: {
  isOpen: boolean;
  onClose: () => void;
  onApply: (data: PoScreeningResult) => void;
}) {
  const [activeTab, setActiveTab] = useState<"samples" | "custom">("samples");
  const [selectedSampleId, setSelectedSampleId] = useState<string>("nordic");
  const [customPoText, setCustomPoText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [screeningResult, setScreeningResult] = useState<PoScreeningResult | null>(() =>
    parsePoTextAndScreen(SAMPLE_POS[0].text, SAMPLE_POS[0].fileName)
  );

  if (!isOpen) return null;

  const handleSelectSample = (id: string) => {
    setSelectedSampleId(id);
    const sample = SAMPLE_POS.find((s) => s.id === id);
    if (!sample) return;
    setIsAnalyzing(true);
    setTimeout(() => {
      const parsed = parsePoTextAndScreen(sample.text, sample.fileName);
      setScreeningResult(parsed);
      setIsAnalyzing(false);
    }, 450);
  };

  const handleProcessCustom = () => {
    if (!customPoText.trim() || customPoText.trim().length < 10) {
      toast.error("Teks PO Terlalu Pendek", {
        description: "Silakan salin isi dokumen Purchase Order buyer minimal 10 karakter.",
      });
      return;
    }
    setIsAnalyzing(true);
    setTimeout(() => {
      const parsed = parsePoTextAndScreen(customPoText, "Custom-PO.txt");
      setScreeningResult(parsed);
      setIsAnalyzing(false);
      toast.success("Dokumen PO Berhasil Dianalisis", {
        description: `Buyer ${parsed.buyer} berhasil divalidasi oleh AI Advisor.`,
      });
    }, 500);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = String(e.target?.result || "");
      setCustomPoText(text);
      setActiveTab("custom");
      setIsAnalyzing(true);
      setTimeout(() => {
        const parsed = parsePoTextAndScreen(text, file.name);
        setScreeningResult(parsed);
        setIsAnalyzing(false);
        toast.success(`File ${file.name} Dimuat`, {
          description: "Data diekstrak dan profil buyer telah divalidasi.",
        });
      }, 500);
    };
    reader.readAsText(file);
  };

  const handleConfirmApply = () => {
    if (!screeningResult) return;
    onApply(screeningResult);
    toast.success("Transaksi Dibuat dari Dokumen PO", {
      description: `Nomor PO ${screeningResult.reference} (${screeningResult.buyer}) telah disinkronkan ke seluruh modul.`,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-content po-modal-card">
        {/* Header Modal */}
        <div className="po-modal-header">
          <div className="po-modal-header-title">
            <span className="po-sparkle-badge">
              <Sparkles size={14} /> AI Smart Ingestion
            </span>
            <h2>Tambah Transaksi dari Purchase Order (PO) Buyer</h2>
            <p>
              Ekstraksi parameter transaksi otomatis bebas salah ketik dan validasi kredibilitas badan hukum buyer secara instan oleh AI Advisor.
            </p>
          </div>
          <button
            type="button"
            className="po-modal-close-btn"
            onClick={onClose}
            aria-label="Tutup dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Pemilihan Sumber PO */}
        <div className="po-modal-tabs">
          <button
            type="button"
            className={`po-tab-btn ${activeTab === "samples" ? "active" : ""}`}
            onClick={() => setActiveTab("samples")}
          >
            <FileSpreadsheet size={15} /> Contoh Dokumen PO Riil
          </button>
          <button
            type="button"
            className={`po-tab-btn ${activeTab === "custom" ? "active" : ""}`}
            onClick={() => setActiveTab("custom")}
          >
            <UploadCloud size={15} /> Unggah File / Salin Teks PO Anda
          </button>
        </div>

        <div className="po-modal-body">
          {activeTab === "samples" ? (
            <div className="po-samples-grid">
              {SAMPLE_POS.map((sample) => (
                <button
                  type="button"
                  key={sample.id}
                  className={`po-sample-card ${selectedSampleId === sample.id ? "selected" : ""}`}
                  onClick={() => handleSelectSample(sample.id)}
                >
                  <div className="po-sample-icon">
                    <FileText size={18} />
                  </div>
                  <div className="po-sample-info">
                    <b>{sample.title}</b>
                    <small>{sample.fileName}</small>
                  </div>
                  <ChevronRight size={16} className="sample-arrow" />
                </button>
              ))}
            </div>
          ) : (
            <div className="po-custom-input-wrap">
              <div className="po-file-dropzone">
                <UploadCloud size={28} />
                <div>
                  <b>Unggah Dokumen PO Buyer (PDF / TXT / DOCX)</b>
                  <p>Atau tempel teks Purchase Order langsung pada kolom di bawah</p>
                </div>
                <label className="po-upload-btn">
                  Pilih Berkas
                  <input
                    type="file"
                    accept=".txt,.pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    style={{ display: "none" }}
                  />
                </label>
              </div>

              <textarea
                className="clean-textarea po-textarea"
                rows={5}
                value={customPoText}
                onChange={(e) => setCustomPoText(e.target.value)}
                placeholder="Salin teks Purchase Order dari buyer luar negeri di sini (nomor PO, nama buyer, pelabuhan, komoditas, harga, dsb)..."
              />

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="save-button"
                  onClick={handleProcessCustom}
                  disabled={isAnalyzing || !customPoText.trim()}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 size={14} className="spin-icon" /> Memproses Dokumen...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} /> Ekstrak &amp; Screening Buyer AI
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Bagian Hasil Evaluasi AI Advisor */}
          {isAnalyzing ? (
            <div className="po-loading-box">
              <Loader2 size={24} className="spin-icon" />
              <b>AI Advisor sedang menganalisis dokumen PO...</b>
              <small>Memvalidasi legalitas badan hukum, rute pelabuhan, dan keamanan klausul pembayaran</small>
            </div>
          ) : screeningResult ? (
            <div className="po-results-container">
              {/* Kartu Status Validasi Buyer AI */}
              <div
                className={`po-ai-screening-card tone-${screeningResult.validation.status}`}
              >
                <div className="screening-card-header">
                  <div className="screening-status-pill">
                    {screeningResult.validation.status === "verified" ? (
                      <>
                        <ShieldCheck size={16} /> Buyer Terverifikasi Valid ({screeningResult.validation.score}%)
                      </>
                    ) : screeningResult.validation.status === "warning" ? (
                      <>
                        <AlertTriangle size={16} /> Perlu Verifikasi Tambahan ({screeningResult.validation.score}%)
                      </>
                    ) : (
                      <>
                        <ShieldAlert size={16} /> Risiko Tinggi Terdeteksi ({screeningResult.validation.score}%)
                      </>
                    )}
                  </div>
                  <span className="screening-label">
                    HASIL SCREENING AI ADVISOR
                  </span>
                </div>

                <p className="screening-summary">
                  {screeningResult.validation.summary}
                </p>

                <div className="screening-metrics-grid">
                  <div className="screening-metric">
                    <span className="metric-label">Legalitas Badan Hukum</span>
                    <strong>{screeningResult.validation.legalEntityStatus}</strong>
                  </div>
                  <div className="screening-metric">
                    <span className="metric-label">Rute &amp; Kepatuhan Sanksi</span>
                    <strong>{screeningResult.validation.sanctionCheck}</strong>
                  </div>
                  <div className="screening-metric">
                    <span className="metric-label">Keamanan Pembayaran</span>
                    <strong>{screeningResult.validation.paymentTermRisk}</strong>
                  </div>
                </div>

                {screeningResult.validation.recommendations.length > 0 && (
                  <div className="screening-recs">
                    <b>Langkah Mitigasi Risiko AI Advisor:</b>
                    <ul>
                      {screeningResult.validation.recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Grid Pratinjau Data Parameter yang Berhasil Diekstrak */}
              <div className="po-extracted-preview">
                <span className="eyebrow">PARAMETER TRANSAKSI YANG DIEKSTRAK (ANTI-TYPO)</span>
                <div className="extracted-fields-grid">
                  <div className="extracted-field">
                    <small>Nomor Transaksi (PO)</small>
                    <b>{screeningResult.reference}</b>
                  </div>
                  <div className="extracted-field">
                    <small>Nama Buyer</small>
                    <b>{screeningResult.buyer}</b>
                  </div>
                  <div className="extracted-field">
                    <small>Negara Buyer</small>
                    <b>{screeningResult.buyerCountry}</b>
                  </div>
                  <div className="extracted-field">
                    <small>Tujuan Pengiriman (POD)</small>
                    <b>{screeningResult.destination}</b>
                  </div>
                  <div className="extracted-field">
                    <small>Komoditas &amp; HS Code</small>
                    <b>{screeningResult.product} · {screeningResult.hsCode}</b>
                  </div>
                  <div className="extracted-field">
                    <small>Kuantitas &amp; Incoterms</small>
                    <b>{screeningResult.quantity.toLocaleString()} {screeningResult.unit} · {screeningResult.incoterm} (${screeningResult.unitPrice})</b>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="po-modal-footer">
          <button type="button" className="ghost-button" onClick={onClose}>
            Batal
          </button>
          <button
            type="button"
            className="save-button po-apply-btn"
            onClick={handleConfirmApply}
            disabled={!screeningResult || isAnalyzing}
          >
            <CheckCircle2 size={16} /> Terapkan ke Form Transaksi
          </button>
        </div>
      </div>
    </div>
  );
}
