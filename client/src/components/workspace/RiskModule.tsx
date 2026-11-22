import type { ApprovalDecision } from "@/hooks/useWorkspaceFlow";
import { buildPreShipmentTimeline } from "@shared/exportCompliance";
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
  CalendarClock,
  Check,
  ChevronRight,
  Clock,
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

  const preShipmentTimeline = buildPreShipmentTimeline(shipment.preShipmentSchedule);

  const updatePreShipmentSchedule = (patch: Partial<NonNullable<Shipment["preShipmentSchedule"]>>) => {
    update("preShipmentSchedule", {
      etdDate: preShipmentTimeline.etdDate,
      pebClosingDate: preShipmentTimeline.pebClosingDate,
      completedIds: shipment.preShipmentSchedule?.completedIds || [],
      ...patch,
    });
  };

  const toggleTimelineStep = (milestoneId: string) => {
    const existing = shipment.preShipmentSchedule?.completedIds || [];
    const next = existing.includes(milestoneId)
      ? existing.filter((id) => id !== milestoneId)
      : [...existing, milestoneId];
    updatePreShipmentSchedule({ completedIds: next });
  };

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

      {/* Timeline Checkpoint Pra-Pengiriman (H-7 hingga Closing PEB) */}
      <section className="panel panel-padding">
        <div className="panel-head">
          <div>
            <span className="eyebrow">TIMELINE CHECKPOINT PRA-PENGIRIMAN (H-7 S/D CLOSING PEB)</span>
            <h3>Pelacak Batas Waktu ETD &amp; Pengajuan PEB</h3>
          </div>
          <StatusPill tone={preShipmentTimeline.completionPercent === 100 ? "green" : "amber"}>
            <Clock size={12} /> {preShipmentTimeline.completedCount}/
            {preShipmentTimeline.milestones.length} Tahap Selesai (
            {preShipmentTimeline.completionPercent}%)
          </StatusPill>
        </div>

        <div
          className="ef-form"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
            marginBottom: 14,
            padding: 12,
            borderRadius: 10,
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
          }}
        >
          <label style={{ fontSize: 12, color: "#475569" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
              <CalendarClock size={13} /> Rencana ETD Kapal (H-0)
            </span>
            <input
              type="date"
              value={preShipmentTimeline.etdDate}
              onChange={(e) => updatePreShipmentSchedule({ etdDate: e.target.value })}
              style={{ marginTop: 4 }}
            />
          </label>
          <label style={{ fontSize: 12, color: "#475569" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
              <CalendarClock size={13} /> Batas Closing PEB &amp; Gate-In (H-2)
            </span>
            <input
              type="date"
              value={preShipmentTimeline.pebClosingDate}
              onChange={(e) => updatePreShipmentSchedule({ pebClosingDate: e.target.value })}
              style={{ marginTop: 4 }}
            />
          </label>
        </div>

        <div className="module-stack" style={{ gap: 8 }}>
          {preShipmentTimeline.milestones.map((ms) => {
            const pillTone =
              ms.urgency === "completed"
                ? "green"
                : ms.urgency === "overdue"
                  ? "red"
                  : ms.urgency === "due_soon"
                    ? "amber"
                    : "blue";
            const dueLabel =
              ms.urgency === "completed"
                ? "Selesai"
                : ms.daysUntilDue < 0
                  ? `Lewat ${Math.abs(ms.daysUntilDue)} hari`
                  : ms.daysUntilDue === 0
                    ? "Jatuh Tempo Hari Ini!"
                    : `H-${ms.daysUntilDue}`;

            return (
              <div
                key={ms.id}
                className={`legal-check-row ${ms.completed ? "done" : ""}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    cursor: "pointer",
                    flex: 1,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={ms.completed}
                    onChange={() => toggleTimelineStep(ms.id)}
                  />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span
                        className="mono-code"
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#0f2942",
                          background: "#e2e8f0",
                          padding: "1px 6px",
                          borderRadius: 4,
                        }}
                      >
                        {ms.tag}
                      </span>
                      <b>{ms.title}</b>
                      <small style={{ color: "#64748b" }}>Target: {ms.dueDateIso}</small>
                    </div>
                    <small style={{ display: "block", marginTop: 2 }}>{ms.detail}</small>
                  </div>
                </label>

                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <StatusPill tone={pillTone}>{dueLabel}</StatusPill>
                  <button
                    type="button"
                    className="table-inline-btn"
                    onClick={() => navigate(ms.targetScreen)}
                  >
                    Buka →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

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
