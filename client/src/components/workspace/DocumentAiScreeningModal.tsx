import React, { useState } from "react";
import {
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  X,
  RefreshCw,
  SpellCheck,
  Building,
  DollarSign,
  Ship,
  FileCheck,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import type { Shipment, DocumentType } from "@shared/shipment";
import {
  screenExportDocument,
  type DocumentScreeningReport,
  type ScreeningFinding,
  type ScreeningSeverity,
} from "@/lib/documentAiScreening";

interface DocumentAiScreeningModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: Shipment;
  update: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void;
  selectedDocument: DocumentType;
  isId?: boolean;
}

export function DocumentAiScreeningModal({
  isOpen,
  onClose,
  shipment,
  update,
  selectedDocument,
  isId = false,
}: DocumentAiScreeningModalProps) {
  const [filterSeverity, setFilterSeverity] = useState<"all" | "error" | "warning" | "pass">("all");
  const [report, setReport] = useState<DocumentScreeningReport>(() => {
    // Ambil konten naskah dari DOM dokumen aktif jika ada
    const paperEl = typeof document !== "undefined" ? document.querySelector(".paper-document") : null;
    const content = paperEl ? paperEl.textContent || "" : "";
    return screenExportDocument(shipment, selectedDocument, content, isId);
  });
  const [isRescreening, setIsRescreening] = useState(false);

  if (!isOpen) return null;

  const handleRescreen = () => {
    setIsRescreening(true);
    setTimeout(() => {
      const paperEl = document.querySelector(".paper-document");
      const content = paperEl ? paperEl.textContent || "" : "";
      const newReport = screenExportDocument(shipment, selectedDocument, content, isId);
      setReport(newReport);
      setIsRescreening(false);
      toast.success("Screening AI Advisor Selesai", {
        description: `Skor kepatuhan dokumen: ${newReport.score}/100.`,
      });
    }, 450);
  };

  const filteredFindings = report.findings.filter((f) => {
    if (filterSeverity === "all") return true;
    return f.severity === filterSeverity;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "commercial":
        return <DollarSign size={14} className="category-icon text-amber-600" />;
      case "banking":
        return <Building size={14} className="category-icon text-emerald-600" />;
      case "logistics":
        return <Ship size={14} className="category-icon text-blue-600" />;
      case "spelling":
        return <SpellCheck size={14} className="category-icon text-purple-600" />;
      default:
        return <FileCheck size={14} className="category-icon text-slate-600" />;
    }
  };

  return (
    <div className="doc-screening-modal-overlay" role="dialog" aria-modal="true">
      <div className="doc-screening-modal-container">
        {/* Header */}
        <div className="doc-screening-modal-header">
          <div className="header-left">
            <div className="screening-ai-badge">
              <ShieldCheck size={14} className="text-slate-600" />
              <span>Audit Kepatuhan &amp; Validitas Dokumen</span>
            </div>
            <h3 className="screening-modal-title">
              Pemeriksaan Kepatuhan & Deteksi Kesalahan: {selectedDocument}
            </h3>
            <span className="screening-timestamp">
              Dipindai: {report.screenedAt} · Mode: {report.isEditedManual ? "Naskah Hasil Edit Pengguna" : "Data Transaksi Asli"}
            </span>
          </div>

          <div className="header-actions">
            <button
              type="button"
              className="btn-rescreen"
              onClick={handleRescreen}
              disabled={isRescreening}
              title="Pindai ulang dokumen sekarang"
            >
              <RefreshCw size={13} className={isRescreening ? "animate-spin" : ""} />
              <span>Pindai Ulang</span>
            </button>
            <button
              type="button"
              className="btn-close-screening"
              onClick={onClose}
              title="Tutup dialog screening"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Audit Score Card */}
        <div className={`screening-score-banner status-${report.status}`}>
          <div className="score-circle-box">
            <span className="score-number">{report.score}</span>
            <span className="score-denom">/100</span>
          </div>

          <div className="score-info-box">
            <div className="score-status-badge">
              {report.status === "verified" && (
                <>
                  <CheckCircle2 size={15} />
                  <span>LOLOS VERIFIKASI RESMI ICC</span>
                </>
              )}
              {report.status === "warning" && (
                <>
                  <AlertTriangle size={15} />
                  <span>PERINGATAN MINOR (BISA DITERBITKAN)</span>
                </>
              )}
              {report.status === "high_risk" && (
                <>
                  <ShieldAlert size={15} />
                  <span>PERLU KOREKSI SEBELUM TERBIT</span>
                </>
              )}
            </div>
            <p className="score-summary-text">{report.summary}</p>
          </div>

          <div className="score-stats-grid">
            <div className="stat-pill error">
              <span className="stat-val">{report.errorCount}</span>
              <span className="stat-lbl">Kesalahan</span>
            </div>
            <div className="stat-pill warning">
              <span className="stat-val">{report.warningCount}</span>
              <span className="stat-lbl">Peringatan</span>
            </div>
            <div className="stat-pill pass">
              <span className="stat-val">{report.passedCount}</span>
              <span className="stat-lbl">Lolos Uji</span>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="screening-filter-strip">
          <span className="filter-label">Filter Hasil:</span>
          <button
            type="button"
            className={`filter-btn ${filterSeverity === "all" ? "active" : ""}`}
            onClick={() => setFilterSeverity("all")}
          >
            Semua ({report.findings.length})
          </button>
          <button
            type="button"
            className={`filter-btn error ${filterSeverity === "error" ? "active" : ""}`}
            onClick={() => setFilterSeverity("error")}
          >
            <AlertCircle size={12} className="inline mr-1 text-rose-600" />
            Kesalahan Kritis ({report.errorCount})
          </button>
          <button
            type="button"
            className={`filter-btn warning ${filterSeverity === "warning" ? "active" : ""}`}
            onClick={() => setFilterSeverity("warning")}
          >
            <AlertTriangle size={12} className="inline mr-1 text-amber-600" />
            Peringatan & Typo ({report.warningCount})
          </button>
          <button
            type="button"
            className={`filter-btn pass ${filterSeverity === "pass" ? "active" : ""}`}
            onClick={() => setFilterSeverity("pass")}
          >
            <CheckCircle2 size={12} className="inline mr-1 text-emerald-600" />
            Terverifikasi Valid ({report.passedCount})
          </button>
        </div>

        {/* Findings List */}
        <div className="screening-findings-list">
          {filteredFindings.length === 0 ? (
            <div className="screening-empty-state">
              <CheckCircle2 size={32} className="text-emerald-600 mb-2" />
              <p className="font-semibold text-slate-800">Tidak ada isu pada kategori ini</p>
              <p className="text-xs text-slate-500">Seluruh bagian yang diperiksa memenuhi standar ekspor.</p>
            </div>
          ) : (
            filteredFindings.map((finding) => (
              <div key={finding.id} className={`finding-card severity-${finding.severity}`}>
                <div className="finding-header">
                  <div className="finding-title-wrap">
                    {getCategoryIcon(finding.category)}
                    <h4 className="finding-title">{finding.title}</h4>
                  </div>
                  <span className={`finding-severity-tag severity-${finding.severity}`}>
                    {finding.severity === "error" && "Kritis"}
                    {finding.severity === "warning" && "Peringatan"}
                    {finding.severity === "pass" && "Valid"}
                    {finding.severity === "info" && "Info"}
                  </span>
                </div>

                <div className="finding-meta-row">
                  <span className="finding-location">
                    <b>Bagian Dokumen:</b> {finding.location}
                  </span>
                </div>

                <p className="finding-desc">{finding.description}</p>

                <div className="finding-recommendation-box">
                  <span className="rec-label">Saran AI Advisor:</span>
                  <p className="rec-text">{finding.recommendation}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="doc-screening-modal-footer">
          <span className="screening-footer-note">
            <b>Panduan Kepatuhan:</b> Screening otomatis memeriksa kepatuhan ICC UCP 600, Incoterms 2020, dan protokol keamanan perbankan sebelum Anda menandatangani dan menerbitkan dokumen.
          </span>
          <button
            type="button"
            className="btn-done-screening"
            onClick={onClose}
          >
            Selesai Menelaah
          </button>
        </div>
      </div>
    </div>
  );
}
