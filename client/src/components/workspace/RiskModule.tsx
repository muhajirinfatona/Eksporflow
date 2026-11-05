import type { ApprovalDecision } from "@/hooks/useWorkspaceFlow";
import { formatMoney } from "@shared/format";
import type { Pricing } from "@shared/pricing";
import type {
  LegalChecklist,
  RiskEvaluation,
  ScreenId,
} from "@shared/risk";
import type { ContainerCalc, Shipment } from "@shared/shipment";
import {
  ArrowUpRight,
  Bot,
  Check,
  ChevronRight,
  FileSearch,
  MailCheck,
  MessageCircle,
  ShieldAlert,
  ShieldCheck,
  UploadCloud,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { StatusPill } from "./Primitives";

const LEGAL_ITEMS: { key: keyof LegalChecklist; label: string; detail: string }[] = [
  {
    key: "hsCodeReviewed",
    label: "HS Code dikonfirmasi",
    detail: "Verifikasi tarif & klasifikasi bersama PPJK / Bea Cukai.",
  },
  {
    key: "originEvidence",
    label: "Bukti asal barang (COO / e-SKA)",
    detail: "Dokumen asal barang & sertifikat mutu telah disiapkan.",
  },
  {
    key: "paymentTermsReviewed",
    label: "Terms pembayaran direview",
    detail: "Klausul DP, jatuh tempo, dan syarat rilis dokumen terverifikasi.",
  },
  {
    key: "sanctionsScreened",
    label: "Screening buyer & negara tujuan",
    detail: "Pemeriksaan daftar sanksi dan pembatasan perdagangan selesai.",
  },
];

export function RiskModule({
  shipment,
  update,
  pricing,
  navigate,
  legalChecklist,
  toggleLegalCheck,
  evaluation,
  effectiveApprovalStatus,
}: {
  shipment: Shipment;
  update: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void;
  pricing: Pricing;
  container: ContainerCalc;
  navigate: (screen: ScreenId) => void;
  legalChecklist: LegalChecklist;
  toggleLegalCheck: (key: keyof LegalChecklist) => void;
  evaluation: RiskEvaluation;
  effectiveApprovalStatus: ApprovalDecision;
}) {
  const addScreeningEvidence = (file?: File) => {
    if (!file) return;
    if (!/pdf|image|msword|officedocument|text/.test(file.type) && !/\.(pdf|png|jpe?g|docx?|txt)$/i.test(file.name)) {
      toast.error("Format bukti belum didukung", {
        description: "Gunakan PDF, gambar, DOC/DOCX, atau TXT.",
      });
      return;
    }
    if (!shipment.attachments.includes(file.name)) {
      update("attachments", [...shipment.attachments, file.name]);
    }
    toast.success("Bukti screening ditambahkan", {
      description: `${file.name} tercatat sebagai lampiran audit ${shipment.reference}.`,
    });
  };

  const { checks, passed, total, readinessPercent, riskLevel, hasPoEvidence, hasEmailEvidence } =
    evaluation;

  return (
    <div className="module-stack">
      <div
        className={`risk-hero ${
          riskLevel === "Review complete — verify"
            ? "safe"
            : riskLevel === "Review required"
              ? "review"
              : "high"
        }`}
      >
        <div>
          <span className="eyebrow light">EXPORT RISK CONTROL · REVIEW &amp; EVIDENCE</span>
          <h2>{riskLevel}</h2>
          <p>
            {passed} dari {total} kontrol internal terpenuhi untuk transaksi {shipment.reference}.
          </p>
        </div>
        <div className="risk-score">
          <strong>{readinessPercent}%</strong>
          <span>Skor Kontrol</span>
        </div>
      </div>

      <div className="content-grid two-thirds">
        <section className="panel panel-padding">
          <div className="panel-head">
            <div>
              <span className="eyebrow">PRE-DEPARTURE CHECKS</span>
              <h3>Temuan aktif &amp; alasan sumber</h3>
            </div>
            <ShieldAlert size={19} className="panel-spark" />
          </div>
          <div className="risk-list">
            {checks.map((check) => (
              <button
                type="button"
                className={`risk-row ${check.ok ? "ok" : "warning"}`}
                key={check.key}
                onClick={() => navigate(check.targetScreen)}
              >
                <span className="risk-icon">
                  {check.ok ? <Check size={15} /> : <ShieldAlert size={15} />}
                </span>
                <span>
                  <b>{check.label}</b>
                  <small>{check.detail}</small>
                </span>
                <StatusPill tone={check.ok ? "green" : "amber"}>
                  {check.ok ? "Sesuai" : "Tinjau"}
                </StatusPill>
                <ChevronRight size={15} />
              </button>
            ))}
          </div>
        </section>

        <section className="panel panel-padding">
          <div className="panel-head">
            <div>
              <span className="eyebrow">RISK PLAYBOOK</span>
              <h3>Guardrails operasional ekspor</h3>
            </div>
          </div>
          <div className="guardrail-list">
            <div>
              <b>Konsistensi Dokumen (3-Way Check)</b>
              <p>Pastikan kuantitas, HS Code, dan pelabuhan tujuan identik di Invoice, Packing List, dan B/L.</p>
            </div>
            <div>
              <b>Dokumentasi Stuffing &amp; Segel</b>
              <p>Simpan foto kontainer dan nomor seal resmi untuk perlindungan klaim asuransi.</p>
            </div>
            <div>
              <b>Validasi Kepabeanan &amp; Lartas</b>
              <p>Konfirmasi HS Code dan regulasi impor negara tujuan bersama PPJK sebelum pengajuan PEB.</p>
            </div>
            <div>
              <b>Otorisasi Harga &amp; Margin</b>
              <p>Perubahan Incoterm atau diskon di atas batas standar wajib disetujui manajemen.</p>
            </div>
          </div>
        </section>
      </div>

      <div className="content-grid two-thirds">
        <section className="panel panel-padding">
          <div className="panel-head">
            <div>
              <span className="eyebrow">LEGAL REVIEW GATE</span>
              <h3>Checklist Verifikasi Internal</h3>
            </div>
            <ShieldCheck size={18} className="panel-spark" />
          </div>
          <div className="legal-checklist">
            {LEGAL_ITEMS.map((item) => (
              <label className="legal-check-row" key={item.key}>
                <input
                  type="checkbox"
                  checked={Boolean(legalChecklist[item.key])}
                  onChange={() => toggleLegalCheck(item.key)}
                />
                <span>
                  <b>{item.label}</b>
                  <small>{item.detail}</small>
                </span>
                <StatusPill tone={legalChecklist[item.key] ? "green" : "amber"}>
                  {legalChecklist[item.key] ? "Checked" : "Review"}
                </StatusPill>
              </label>
            ))}
          </div>
        </section>

        <section className="panel panel-padding">
          <div className="panel-head">
            <div>
              <span className="eyebrow">BUYER / PO EVIDENCE</span>
              <h3>Bukti Dokumen Transaksi</h3>
            </div>
            <FileSearch size={18} className="panel-spark" />
          </div>
          <div className="screening-status">
            <div className={hasPoEvidence ? "verified" : "pending"}>
              <MailCheck size={15} />
              <span>
                <b>PO / Purchase Order</b>
                <small>
                  {hasPoEvidence
                    ? "Berkas PO terdeteksi di arsip lampiran transaksi."
                    : "Tambahkan berkas PO dengan nama file yang jelas."}
                </small>
              </span>
              <StatusPill tone={hasPoEvidence ? "green" : "amber"}>
                {hasPoEvidence ? "Tercatat" : "Belum"}
              </StatusPill>
            </div>
            <div className={hasEmailEvidence ? "verified" : "pending"}>
              <MessageCircle size={15} />
              <span>
                <b>Konfirmasi email / korespondensi buyer</b>
                <small>
                  {hasEmailEvidence
                    ? "Bukti komunikasi terdeteksi di arsip lampiran transaksi."
                    : "Tambahkan export email atau konfirmasi tertulis buyer."}
                </small>
              </span>
              <StatusPill tone={hasEmailEvidence ? "green" : "amber"}>
                {hasEmailEvidence ? "Tercatat" : "Belum"}
              </StatusPill>
            </div>
          </div>
          <label className="upload-button screening-upload">
            <UploadCloud size={15} /> Tambah bukti pemeriksaan
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt"
              onChange={(event) => {
                addScreeningEvidence(event.target.files?.[0]);
                event.currentTarget.value = "";
              }}
            />
          </label>
        </section>
      </div>

      <section className="panel panel-padding">
        <div className="panel-head">
          <div>
            <span className="eyebrow">AUDIT SNAPSHOT</span>
            <h3>Ringkasan kontrol {shipment.reference}</h3>
          </div>
          <span className="muted-note">
            Penawaran aktif {formatMoney(pricing.active.offer, shipment.currency)}
          </span>
        </div>
        <div className="audit-grid">
          <div>
            <span>STATUS SHIPMENT</span>
            <b>{shipment.shipmentStatus}</b>
          </div>
          <div>
            <span>INCOTERM</span>
            <b>{shipment.incoterm} · Incoterms® 2020</b>
          </div>
          <div>
            <span>CHECKLIST INTERNAL</span>
            <b>{Object.values(legalChecklist).filter(Boolean).length} / 4 ditandai</b>
          </div>
          <div>
            <span>PERSETUJUAN QUOTE</span>
            <b>{effectiveApprovalStatus}</b>
          </div>
        </div>
        <div className="row-actions" style={{ marginTop: 16 }}>
          <button type="button" className="ghost-button" onClick={() => navigate("advisor")}>
            <Bot size={14} /> Diskusikan Temuan di AI Advisor
          </button>
          <button type="button" className="save-button" onClick={() => navigate("finance")}>
            <Wallet size={14} /> Lanjut ke Keuangan &amp; AR <ArrowUpRight size={14} />
          </button>
        </div>
      </section>
    </div>
  );
}
