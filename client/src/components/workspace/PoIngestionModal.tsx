import {
  SAMPLE_POS,
  parsePoTextAndScreen,
  type PoScreeningResult,
} from "@shared/poScreening";
import type { Incoterm } from "@shared/shipment";
import { extractTextFromDocument } from "@/lib/documentExtractor";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronRight,
  Edit2,
  Eye,
  EyeOff,
  FileText,
  Globe,
  Info,
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
  const [analyzingStatus, setAnalyzingStatus] = useState("AI Advisor sedang memindai dokumen...");
  const [screeningResult, setScreeningResult] = useState<PoScreeningResult | null>(null);

  // Parameter yang dapat disesuaikan manual oleh user sebelum diterapkan
  const [isEditingData, setIsEditingData] = useState(false);
  const [showRawText, setShowRawText] = useState(false);
  const [editedBuyer, setEditedBuyer] = useState("");
  const [editedCountry, setEditedCountry] = useState("");
  const [editedRef, setEditedRef] = useState("");
  const [editedDest, setEditedDest] = useState("");
  const [editedProduct, setEditedProduct] = useState("");
  const [editedIncoterm, setEditedIncoterm] = useState<Incoterm>("FOB");

  if (!isOpen) return null;

  const handleClose = () => {
    setPoText("");
    setFileName("");
    setScreeningResult(null);
    setIsAnalyzing(false);
    setIsEditingData(false);
    setShowRawText(false);
    onClose();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsAnalyzing(true);
    setAnalyzingStatus(`Membaca dan mengekstrak teks digital dari ${file.name}...`);

    try {
      const extractedText = await extractTextFromDocument(file);
      setPoText(extractedText);
      setAnalyzingStatus("AI Advisor sedang memvalidasi data buyer, negara tujuan & regulasi...");
      setTimeout(() => {
        runValidation(extractedText, file.name);
      }, 350);
    } catch (err: unknown) {
      setIsAnalyzing(false);
      const msg = err instanceof Error ? err.message : "Gagal mengekstrak teks dari file.";
      toast.error("Pemberitahuan Ekstraksi File", {
        description: msg,
      });
    }
  };

  const runValidation = (textToValidate: string, docName?: string) => {
    if (!textToValidate.trim() || textToValidate.trim().length < 15) {
      toast.error("Dokumen PO/LOI Kosong", {
        description: "Silakan unggah dokumen atau tempel teks PO yang valid terlebih dahulu.",
      });
      setIsAnalyzing(false);
      return;
    }

    setIsAnalyzing(true);
    setTimeout(() => {
      const parsed = parsePoTextAndScreen(textToValidate, docName || fileName || "Dokumen-PO.txt");
      setScreeningResult(parsed);
      setEditedBuyer(parsed.buyer);
      setEditedCountry(parsed.buyerCountry);
      setEditedRef(parsed.reference);
      setEditedDest(parsed.destination);
      setEditedProduct(parsed.product);
      setEditedIncoterm(parsed.incoterm);
      setIsAnalyzing(false);
      toast.success("Dokumen Berhasil Dipindai", {
        description: `Buyer ${parsed.buyer} (${parsed.buyerCountry}) berhasil dideteksi oleh AI Advisor.`,
      });
    }, 400);
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
    const finalResult: PoScreeningResult = {
      ...screeningResult,
      buyer: editedBuyer.trim() || screeningResult.buyer,
      buyerCountry: editedCountry.trim() || screeningResult.buyerCountry,
      reference: editedRef.trim() || screeningResult.reference,
      destination: editedDest.trim() || screeningResult.destination,
      product: editedProduct.trim() || screeningResult.product,
      incoterm: editedIncoterm || screeningResult.incoterm,
    };
    onApply(finalResult);
    toast.success("Data Transaksi Diterapkan", {
      description: `Data PO ${finalResult.reference} (${finalResult.buyer}) berhasil diterapkan. Rekomendasi regulasi negara ${finalResult.buyerCountry} telah aktif.`,
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
              <span>AI SCAN &amp; EKSTRAKSI PO / LOI</span>
            </div>
            <h2>Impor Dokumen PO atau LOI Buyer</h2>
            <p>
              AI Advisor memindai identitas buyer, mengekstrak spesifikasi pesanan, dan otomatis menganalisis regulasi ekspor negara tujuan.
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
                  {fileName ? `Dokumen terpilih: ${fileName}` : "Unggah Dokumen PO atau LOI (PDF / TXT / DOCX)"}
                </span>
                <span className="dropzone-sub">
                  Klik untuk memilih file dari komputer Anda atau seret file ke sini
                </span>
                <span className="dropzone-btn">Pilih Dokumen PO / LOI</span>
                <input
                  type="file"
                  accept=".txt,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                />
              </label>

              <div className="po-paste-divider">
                <span>Atau tempel isi teks PO (Purchase Order) atau LOI (Letter of Intent) di bawah</span>
              </div>

              <textarea
                className="po-clean-textarea"
                rows={4}
                value={poText}
                onChange={(e) => setPoText(e.target.value)}
                placeholder="Contoh isi: Nomor PO/LOI, nama buyer, email resmi, kontak telepon, pelabuhan tujuan, Incoterms, komoditas..."
              />

              <div className="po-step-footer">
                <div className="po-demo-links">
                  <span>Uji coba sampel:</span>
                  <button
                    type="button"
                    className="po-demo-link"
                    onClick={() => handleLoadSample("nordic")}
                  >
                    Nordic Pantry (Swedia)
                  </button>
                  <button
                    type="button"
                    className="po-demo-link"
                    onClick={() => handleLoadSample("kyoto")}
                  >
                    Kyoto Trading (Jepang)
                  </button>
                  <button
                    type="button"
                    className="po-demo-link"
                    onClick={() => handleLoadSample("loi-dubai")}
                  >
                    Gulf Gourmet (LOI Dubai)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading Animation */}
          {isAnalyzing && (
            <div className="po-analyzing-state">
              <Loader2 size={32} className="spin-icon" />
              <h3>{analyzingStatus}</h3>
              <p>Membaca teks digital, memvalidasi identitas legal buyer, pelabuhan bongkar, dan regulasi kepatuhan.</p>
            </div>
          )}

          {/* LANGKAH 2: Hasil Validasi 4 Pilar Identitas & Parameter Transaksi */}
          {screeningResult && !isAnalyzing && (
            <div className="po-validated-view">
              {/* Disclaimer Peran AI Advisor */}
              <div className="po-advisory-disclaimer">
                <Info size={15} />
                <span>
                  <b>Peran AI Advisor:</b> Sistem memindai identitas dan menyaring klausul risiko. Periksa kembali data hasil ekstraksi di bawah, Anda dapat menyesuaikannya sebelum diterapkan ke form transaksi.
                </span>
              </div>

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

              {/* Data Parameter Ekspor yang Diekstrak & Dapat Disesuaikan Manual */}
              <div className="po-edit-card">
                <div className="po-edit-card-head">
                  <div>
                    <span className="eyebrow">PARAMETER TRANSAKSI DARI DOKUMEN</span>
                    <h4 className="po-edit-card-title">Data yang Diterapkan ke Transaksi</h4>
                  </div>
                  <div className="po-edit-card-actions">
                    <button
                      type="button"
                      className="po-card-btn"
                      onClick={() => setShowRawText(!showRawText)}
                      title="Lihat teks digital yang diekstrak dari dokumen"
                    >
                      {showRawText ? <EyeOff size={13} /> : <Eye size={13} />}
                      <span>{showRawText ? "Tutup Teks" : "Teks Dokumen"}</span>
                    </button>
                    <button
                      type="button"
                      className={`po-card-btn ${isEditingData ? "active" : ""}`}
                      onClick={() => setIsEditingData(!isEditingData)}
                    >
                      <Edit2 size={13} />
                      <span>{isEditingData ? "Selesai Edit" : "Sesuaikan Data"}</span>
                    </button>
                  </div>
                </div>

                {showRawText && (
                  <div className="po-raw-text-panel">
                    <small>Teks Digital Dokumen yang Berhasil Diekstrak ({poText.length} karakter):</small>
                    <textarea
                      readOnly
                      rows={5}
                      className="po-raw-textarea"
                      value={poText}
                    />
                  </div>
                )}

                {isEditingData ? (
                  <div className="po-fields-edit-grid">
                    <div className="po-input-group">
                      <label>Nomor Transaksi / PO</label>
                      <input
                        type="text"
                        value={editedRef}
                        onChange={(e) => setEditedRef(e.target.value)}
                        placeholder="Contoh: PO-001"
                      />
                    </div>
                    <div className="po-input-group">
                      <label>Nama Buyer</label>
                      <input
                        type="text"
                        value={editedBuyer}
                        onChange={(e) => setEditedBuyer(e.target.value)}
                        placeholder="Nama perusahaan pembeli"
                      />
                    </div>
                    <div className="po-input-group">
                      <label>Negara Tujuan</label>
                      <input
                        type="text"
                        value={editedCountry}
                        onChange={(e) => setEditedCountry(e.target.value)}
                        placeholder="Contoh: Jepang, Jerman, UAE"
                      />
                    </div>
                    <div className="po-input-group">
                      <label>Pelabuhan Tujuan (POD)</label>
                      <input
                        type="text"
                        value={editedDest}
                        onChange={(e) => setEditedDest(e.target.value)}
                        placeholder="Contoh: Port of Tokyo"
                      />
                    </div>
                    <div className="po-input-group">
                      <label>Komoditas</label>
                      <input
                        type="text"
                        value={editedProduct}
                        onChange={(e) => setEditedProduct(e.target.value)}
                        placeholder="Nama komoditas ekspor"
                      />
                    </div>
                    <div className="po-input-group">
                      <label>Incoterm</label>
                      <select
                        value={editedIncoterm}
                        onChange={(e) => setEditedIncoterm(e.target.value as Incoterm)}
                      >
                        {["EXW", "FCA", "FOB", "CFR", "CIF", "DAP", "DDP"].map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="po-summary-strip">
                    <div className="summary-field">
                      <small>Nomor Transaksi (PO)</small>
                      <b>{editedRef || screeningResult.reference}</b>
                    </div>
                    <div className="summary-field">
                      <small>Buyer &amp; Negara Tujuan</small>
                      <b>{editedBuyer || screeningResult.buyer} ({editedCountry || screeningResult.buyerCountry})</b>
                    </div>
                    <div className="summary-field">
                      <small>Komoditas &amp; HS Code</small>
                      <b>{editedProduct || screeningResult.product} · {screeningResult.hsCode}</b>
                    </div>
                    <div className="summary-field">
                      <small>Incoterm &amp; Pelabuhan</small>
                      <b>{editedIncoterm || screeningResult.incoterm} · {editedDest || screeningResult.destination}</b>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="clean-po-footer">
          <div className="clean-po-footer-actions">
            <button type="button" className="ghost-button" onClick={handleClose}>
              Batal
            </button>
            {!screeningResult ? (
              <>
                <button
                  type="button"
                  className="po-validate-btn"
                  onClick={() => runValidation(poText)}
                  disabled={!poText.trim() || isAnalyzing}
                >
                  <Sparkles size={14} /> Validasi Dokumen PO
                </button>
                <button
                  type="button"
                  className="save-button apply-btn"
                  onClick={() => runValidation(poText)}
                  disabled={!poText.trim() || isAnalyzing}
                >
                  Lanjutkan <ChevronRight size={15} />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => setScreeningResult(null)}
                >
                  <RefreshCw size={13} /> Ganti Dokumen
                </button>
                <button
                  type="button"
                  className="save-button apply-btn"
                  onClick={handleConfirmApply}
                >
                  <CheckCircle2 size={15} /> Setujui &amp; Terapkan ke Form Transaksi
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
