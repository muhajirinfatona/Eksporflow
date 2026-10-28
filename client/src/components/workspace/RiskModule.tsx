import { formatMoney } from "@shared/format";
import type { Pricing } from "@shared/pricing";
import {
  defaultLegalChecklist,
  evaluateRiskChecks,
  type LegalChecklist,
  type ScreenId,
} from "@shared/risk";
import type { ContainerCalc, Shipment } from "@shared/shipment";
import {
  Check,
  ChevronRight,
  FileSearch,
  MailCheck,
  MessageCircle,
  ShieldAlert,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { StatusPill } from "./Primitives";

function readLegalChecklist(reference: string): LegalChecklist {
  try {
    const raw = localStorage.getItem(`eksporflow-legal-${reference}`);
    if (!raw) return defaultLegalChecklist;
    return {
      ...defaultLegalChecklist,
      ...(JSON.parse(raw) as Partial<LegalChecklist>),
    };
  } catch {
    return defaultLegalChecklist;
  }
}

const LEGAL_ITEMS: { key: keyof LegalChecklist; label: string; detail: string }[] = [
  {
    key: "hsCodeReviewed",
    label: "HS Code dikonfirmasi",
    detail: "Konfirmasi dengan customs/broker berwenang, bukan hanya mengandalkan referensi input.",
  },
  {
    key: "originEvidence",
    label: "Bukti asal barang tersedia",
    detail: "Siapkan COO, supplier declaration, atau dokumen asal yang relevan untuk negara tujuan.",
  },
  {
    key: "paymentTermsReviewed",
    label: "Terms pembayaran direview",
    detail: "Pastikan DP, jatuh tempo, bank charges, dan pemicu release dokumen dipahami tim.",
  },
  {
    key: "sanctionsScreened",
    label: "Screening buyer & negara dilakukan",
    detail: "Catat hasil pemeriksaan internal dan eskalasi bila ada keraguan atau data kurang.",
  },
];

export function RiskModule({
  shipment,
  update,
  pricing,
  container,
  navigate,
}: {
  shipment: Shipment;
  update: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void;
  pricing: Pricing;
  container: ContainerCalc;
  navigate: (screen: ScreenId) => void;
}) {
  const [legalChecklist, setLegalChecklist] = useState<LegalChecklist>(() =>
    readLegalChecklist(shipment.reference),
  );

  useEffect(() => {
    setLegalChecklist(readLegalChecklist(shipment.reference));
  }, [shipment.reference]);

  useEffect(() => {
    try {
      localStorage.setItem(
        `eksporflow-legal-${shipment.reference}`,
        JSON.stringify(legalChecklist),
      );
    } catch {
      // Abaikan bila localStorage tidak tersedia.
    }
  }, [legalChecklist, shipment.reference]);

  const toggleLegal = (key: keyof LegalChecklist) =>
    setLegalChecklist((current) => ({ ...current, [key]: !current[key] }));

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

  const evaluation = evaluateRiskChecks(shipment, pricing, container, legalChecklist);
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
            {passed} dari {total} kontrol internal terpenuhi; status ini bukan legal clearance, bukan klaim &ldquo;buyer aman&rdquo;, dan keputusan release tetap oleh tim berwenang untuk {shipment.reference}.
          </p>
        </div>
        <div className="risk-score">
          <strong>{readinessPercent}%</strong>
          <span>review check</span>
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
              <b>Jangan terbitkan dokumen tanpa 3-way check</b>
              <p>
                Invoice, Packing List, dan B/L draft harus memakai quantity, HS Code referensi, dan tujuan yang konsisten.
              </p>
            </div>
            <div>
              <b>Konfirmasi seal number saat stuffing</b>
              <p>
                Foto stuffing dan nomor seal menjadi bukti penting jika terjadi klaim asuransi atau selisih bongkar.
              </p>
            </div>
            <div>
              <b>Konfirmasi HS Code pada otoritas resmi</b>
              <p>
                Validasi klasifikasi tarif dan ketentuan negara tujuan dengan PPJK/broker atau bea cukai sebelum final.
              </p>
            </div>
            <div>
              <b>Gunakan persetujuan berjenjang</b>
              <p>
                Perubahan harga, Incoterm, atau diskon di atas batas organisasi wajib direview approver terpisah.
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className="content-grid two-thirds">
        <section className="panel panel-padding">
          <div className="panel-head">
            <div>
              <span className="eyebrow">LEGAL REVIEW GATE</span>
              <h3>Checklist verifikasi internal</h3>
              <p className="profile-description">
                Checklist ini membantu tim mendokumentasikan pemeriksaan; bukan pengganti review customs, bank, atau penasihat hukum.
              </p>
            </div>
            <ShieldCheck size={18} className="panel-spark" />
          </div>
          <div className="legal-checklist">
            {LEGAL_ITEMS.map((item) => (
              <label className="legal-check-row" key={item.key}>
                <input
                  type="checkbox"
                  checked={Boolean(legalChecklist[item.key])}
                  onChange={() => toggleLegal(item.key)}
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
              <h3>Bukti transaksi yang dapat diaudit</h3>
              <p className="profile-description">
                Sistem hanya mencatat bukti yang Anda unggah; tidak memberikan skor &ldquo;buyer aman&rdquo; atau jaminan bebas sanksi.
              </p>
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
            <span>REVISI DOKUMEN</span>
            <b>Rev R{shipment.documentRevision}</b>
          </div>
        </div>
      </section>
    </div>
  );
}
