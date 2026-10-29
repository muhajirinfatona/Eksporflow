import {
  SAMPLE_POS,
  parsePoTextAndScreen,
  type PoScreeningResult,
} from "@shared/poScreening";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  FileText,
  Globe,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
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
  const [poText, setPoText] = useState("");
  const [fileName, setFileName] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [screeningResult, setScreeningResult] = useState<PoScreeningResult | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setPoText("");
    setFileName("");
    setScreeningResult(null);
    setIsAnalyzing(false);
    onClose();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = String(e.target?.result || "");
      setPoText(text);
      runValidation(text, file.name);
    };
    reader.readAsText(file);
  };

  const runValidation = (textToValidate: string, docName?: string) => {
    if (!textToValidate.trim() || textToValidate.trim().length < 15) {
      toast.error("Dokumen PO Kosong", {
        description: "Silakan unggah dokumen atau tempel teks PO yang valid terlebih dahulu.",
      });
      return;
    }

    setIsAnalyzing(true);
    setTimeout(() => {
      const parsed = parsePoTextAndScreen(textToValidate, docName || fileName || "Dokumen-PO.txt");
      setScreeningResult(parsed);
      setIsAnalyzing(false);
      toast.success("Dokumen PO Berhasil Divalidasi", {
        description: `Profil buyer ${parsed.buyer} berhasil diskrining oleh AI Advisor.`,
      });
    }, 600);
  };

  const handleLoadSample = (sampleId: string) => {
    const sample = SAMPLE_POS.find((s) => s.id === sampleId);
    if (!sample) return;
    setFileName(sample.fileName);
    setPoText(sample.text);
    runValidation(sample.text, sample.fileName);
  };

  const handleConfirmApply = () => {
    if (!screeningResult) return;
    onApply(screeningResult);
    toast.success("Transaksi Dibuat dari Dokumen PO", {
      description: `Data PO ${screeningResult.reference} (${screeningResult.buyer}) telah diterapkan ke form.`,
    });
    handleClose();
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="clean-po-modal">
        {/* Header Modal */}
        <div className="clean-po-header">
          <div>
            <div className="clean-po-badge">
              <Sparkles size={13} />
              <span>AI VALIDASI &amp; EKSTRAKSI PO</span>
            </div>
            <h2>Impor Dokumen Purchase Order (PO) Buyer</h2>
            <p>
              Impor dokumen PO buyer untuk verifikasi identitas resmi (nama, email, kontak, website) dan mengisi form secara otomatis.
            </p>
          </div>
          <button
            type="button"
            className="clean-po-close"
            onClick={handleClose}
            aria-label="Tutup dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Konten Modal */}
        <div className="clean-po-body">
          {/* LANGKAH 1: Jika belum ada dokumen yang divalidasi */}
          {!screeningResult && !isAnalyzing && (
            <div className="po-import-step">
              <label className="po-dropzone">
                <UploadCloud size={36} className="dropzone-icon" />
                <span className="dropzone-title">
                  {fileName ? `Dokumen terpilih: ${fileName}` : "Unggah Dokumen PO (PDF / TXT / DOCX)"}
                </span>
                <span className="dropzone-sub">
                  Klik untuk memilih file dari komputer Anda atau seret file ke sini
                </span>
                <span className="dropzone-btn">Pilih Dokumen PO</span>
                <input
                  type="file"
                  accept=".txt,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                />
              </label>

              <div className="po-paste-divider">
                <span>Atau tempel isi teks Purchase Order di bawah ini</span>
              </div>

              <textarea
                className="po-clean-textarea"
                rows={4}
                value={poText}
                onChange={(e) => setPoText(e.target.value)}
                placeholder="Contoh isi PO: Nomor PO, nama perusahaan buyer, alamat email perusahaan, nomor kontak telepon, pelabuhan tujuan, dsb..."
              />

              <div className="po-step-footer">
                <div className="po-demo-links">
                  <span>Uji coba sampel:</span>
                  <button
                    type="button"
                    className="po-demo-link"
                    onClick={() => handleLoadSample("nordic")}
                  >
                    Nordic Pantry AB (Swedia)
                  </button>
                  <button
                    type="button"
                    className="po-demo-link"
                    onClick={() => handleLoadSample("kyoto")}
                  >
                    Kyoto Trading (Jepang)
                  </button>
                </div>

                <button
                  type="button"
                  className="save-button"
                  onClick={() => runValidation(poText)}
                  disabled={!poText.trim()}
                >
                  <Sparkles size={14} /> Validasi Dokumen PO
                </button>
              </div>
            </div>
          )}

          {/* Loading Animation */}
          {isAnalyzing && (
            <div className="po-analyzing-state">
              <Loader2 size={32} className="spin-icon" />
              <h3>AI Advisor sedang menganalisis dokumen PO...</h3>
              <p>Memvalidasi nama perusahaan, domain email, nomor kontak, website, dan klausul pembayaran.</p>
            </div>
          )}

          {/* LANGKAH 2: Hasil Validasi 4 Pilar Identitas & Parameter Transaksi */}
          {screeningResult && !isAnalyzing && (
            <div className="po-validated-view">
              {/* Status Validasi Buyer */}
              <div className={`po-validation-header tone-${screeningResult.validation.status}`}>
                <div className="validation-header-left">
                  <ShieldCheck size={20} />
                  <div>
                    <b>
                      {screeningResult.validation.status === "verified"
                        ? `Buyer Terverifikasi Valid (${screeningResult.validation.score}%)`
                        : `Peringatan Kredibilitas Buyer (${screeningResult.validation.score}%)`}
                    </b>
                    <small>{screeningResult.validation.summary}</small>
                  </div>
                </div>
                <button
                  type="button"
                  className="re-upload-btn"
                  onClick={() => setScreeningResult(null)}
                  title="Ganti atau impor dokumen PO lain"
                >
                  <RefreshCw size={12} /> Ganti Dokumen
                </button>
              </div>

              {/* 4 PILAR VALIDASI IDENTITAS RESMI BUYER (Requested by User) */}
              <div className="four-pillars-card">
                <span className="eyebrow">VERIFIKASI 4 PILAR IDENTITAS BUYER OLEH AI</span>
                <div className="pillars-grid">
                  {/* Pilar 1: Nama Perusahaan */}
                  <div className={`pillar-box ${screeningResult.validation.pillars.companyName.isValid ? "valid" : "warning"}`}>
                    <div className="pillar-header">
                      <Building2 size={14} />
                      <span>Nama Perusahaan</span>
                      {screeningResult.validation.pillars.companyName.isValid ? (
                        <CheckCircle2 size={14} className="pillar-check" />
                      ) : (
                        <AlertCircle size={14} className="pillar-warn" />
                      )}
                    </div>
                    <b>{screeningResult.validation.pillars.companyName.value}</b>
                    <small>{screeningResult.validation.pillars.companyName.note}</small>
                  </div>

                  {/* Pilar 2: Email Perusahaan */}
                  <div className={`pillar-box ${screeningResult.validation.pillars.companyEmail.isValid ? "valid" : "warning"}`}>
                    <div className="pillar-header">
                      <Mail size={14} />
                      <span>Email Perusahaan</span>
                      {screeningResult.validation.pillars.companyEmail.isValid ? (
                        <CheckCircle2 size={14} className="pillar-check" />
                      ) : (
                        <AlertCircle size={14} className="pillar-warn" />
                      )}
                    </div>
                    <b>{screeningResult.validation.pillars.companyEmail.value}</b>
                    <small>{screeningResult.validation.pillars.companyEmail.note}</small>
                  </div>

                  {/* Pilar 3: Nomor Kontak */}
                  <div className={`pillar-box ${screeningResult.validation.pillars.contactNumber.isValid ? "valid" : "warning"}`}>
                    <div className="pillar-header">
                      <Phone size={14} />
                      <span>Nomor Kontak</span>
                      {screeningResult.validation.pillars.contactNumber.isValid ? (
                        <CheckCircle2 size={14} className="pillar-check" />
                      ) : (
                        <AlertCircle size={14} className="pillar-warn" />
                      )}
                    </div>
                    <b>{screeningResult.validation.pillars.contactNumber.value}</b>
                    <small>{screeningResult.validation.pillars.contactNumber.note}</small>
                  </div>

                  {/* Pilar 4: Website Perusahaan */}
                  <div className={`pillar-box ${screeningResult.validation.pillars.companyWebsite.isValid ? "valid" : "warning"}`}>
                    <div className="pillar-header">
                      <Globe size={14} />
                      <span>Website Perusahaan</span>
                      {screeningResult.validation.pillars.companyWebsite.isValid ? (
                        <CheckCircle2 size={14} className="pillar-check" />
                      ) : (
                        <AlertCircle size={14} className="pillar-warn" />
                      )}
                    </div>
                    <b>{screeningResult.validation.pillars.companyWebsite.value}</b>
                    <small>{screeningResult.validation.pillars.companyWebsite.note}</small>
                  </div>
                </div>
              </div>

              {/* Data Parameter Ekspor yang Diekstrak Anti-Typo */}
              <div className="po-summary-strip">
                <div className="summary-field">
                  <small>Nomor Transaksi (PO)</small>
                  <b>{screeningResult.reference}</b>
                </div>
                <div className="summary-field">
                  <small>Tujuan (POD)</small>
                  <b>{screeningResult.destination} ({screeningResult.buyerCountry})</b>
                </div>
                <div className="summary-field">
                  <small>Komoditas &amp; HS Code</small>
                  <b>{screeningResult.product} · {screeningResult.hsCode}</b>
                </div>
                <div className="summary-field">
                  <small>Kuantitas &amp; Harga</small>
                  <b>{screeningResult.quantity.toLocaleString()} {screeningResult.unit} · {screeningResult.incoterm} (${screeningResult.unitPrice})</b>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="clean-po-footer">
          <button type="button" className="ghost-button" onClick={handleClose}>
            Batal
          </button>
          {screeningResult && (
            <button
              type="button"
              className="save-button apply-btn"
              onClick={handleConfirmApply}
            >
              <CheckCircle2 size={15} /> Terapkan ke Form Transaksi
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
