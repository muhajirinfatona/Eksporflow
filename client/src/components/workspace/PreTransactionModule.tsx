import { StatusPill } from "@/components/workspace/Primitives";
import type { PreTransactionDraftData } from "@shared/exportCompliance";
import { formatMoney } from "@shared/format";
import type { Pricing } from "@shared/pricing";
import type { ScreenId } from "@shared/risk";
import type { Shipment } from "@shared/shipment";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Copy,
  Database,
  Mail,
  Send,
} from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";

interface PreTransactionModuleProps {
  shipment: Shipment;
  update: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void;
  pricing: Pricing;
  navigate: (screen: ScreenId) => void;
}

const BUYER_VALIDATION_CHECKS: { id: string; label: string; tag: string }[] = [
  {
    id: "reg_checked",
    label: "Registrasi Bisnis / Nomor VAT / EORI Valid",
    tag: "Legalitas",
  },
  {
    id: "domain_checked",
    label: "Email Domain Resmi Perusahaan",
    tag: "Kontak",
  },
  {
    id: "port_sanction_checked",
    label: "Pelabuhan Tujuan Bebas Sanksi & Embargo",
    tag: "Kepatuhan",
  },
  {
    id: "dp_guard_checked",
    label: "Komitmen Pembayaran Aman (DP Min. 30% T/T / L/C)",
    tag: "Finansial",
  },
  {
    id: "spec_sample_checked",
    label: "Spesifikasi Mutu, Grade & Kemasan Disepakati",
    tag: "Kargo",
  },
];

function buildDraftCopy(params: {
  docType: NonNullable<PreTransactionDraftData["docType"]>;
  tone: NonNullable<PreTransactionDraftData["tone"]>;
  companyName: string;
  country: string;
  exporter: string;
  signatory: string;
  product: string;
  hsCode: string;
  quantity: number;
  unit: string;
  offerValue: string;
  incoterm: string;
  destination: string;
  paymentTerms: string;
  customNotes: string;
}): { subject: string; body: string } {
  const buyer = params.companyName || "Procurement Department";
  const countrySuffix = params.country ? ` (${params.country})` : "";
  const exporter = (params.exporter || "PT Nusantara Ekspor Mandiri").replace(/\s*\(Demo\)/gi, "").trim();
  const signatory = (params.signatory || "Export Sales Department").replace(/\s*\(Demo\)/gi, "").trim();
  const product = params.product || "Export Commodity";
  const hs = params.hsCode ? ` (HS Code: ${params.hsCode})` : "";
  const route = params.destination || "Destination Port";
  const notesBlock = params.customNotes ? `\n\nNotes:\n${params.customNotes}` : "";

  const subjectMap: Record<NonNullable<PreTransactionDraftData["docType"]>, string> = {
    inquiry: `Product Supply Introduction: ${product}${hs} — ${exporter}`,
    quotation: `Official Export Quotation: ${product} (${params.incoterm} ${route})`,
    negotiation: `Commercial Terms & Payment Alignment: ${product} — ${exporter}`,
  };

  if (params.docType === "inquiry") {
    return {
      subject: subjectMap.inquiry,
      body: `Dear Purchasing Team at ${buyer}${countrySuffix},\n\nWe are pleased to introduce ${exporter}, a licensed Indonesian exporter specializing in ${product}${hs}.\n\nWe supply consistent commercial shipments (${params.quantity.toLocaleString("en-US")} ${params.unit} per cycle) with full export compliance, including Phytosanitary Certification, Certificate of Origin (e-SKA), and quality assurance.\n\nShould your desk be evaluating qualified Indonesian suppliers, we would be pleased to dispatch specifications and samples.${notesBlock}\n\nBest regards,\n${signatory}\n${exporter}`,
    };
  }

  if (params.docType === "quotation") {
    return {
      subject: subjectMap.quotation,
      body: `Dear Purchasing Team at ${buyer}${countrySuffix},\n\nFollowing your inquiry for ${product}, please find our commercial quotation below:\n\nQUOTATION SUMMARY\n• Commodity: ${product}${hs}\n• Volume: ${params.quantity.toLocaleString("en-US")} ${params.unit}\n• Indicative Total Value: ${params.offerValue}\n• Delivery Term: ${params.incoterm} (${route})\n• Payment Terms: ${params.paymentTerms || "30% Advance T/T, 70% against shipping documents"}\n• Export Documentation: Commercial Invoice, Packing List, Certificate of Origin (COO), and Health/Quarantine Certificates.${notesBlock}\n\nUpon your confirmation, we will reserve container allocation and issue the formal Proforma Invoice.\n\nBest regards,\n${signatory}\n${exporter}`,
    };
  }

  return {
    subject: subjectMap.negotiation,
    body: `Dear Purchasing Team at ${buyer}${countrySuffix},\n\nThank you for reviewing our commercial quotation for ${product} (${params.quantity.toLocaleString("en-US")} ${params.unit}, ${params.incoterm} ${route} at ${params.offerValue}).\n\nTo finalize terms for our first shipment:\n1. Delivery Option: We can maintain ${params.incoterm} (${route}) or quote FOB Indonesian Main Port if you prefer ocean freight nominated forwarder.\n2. Payment Schedule: ${params.paymentTerms || "30% Advance T/T upon order confirmation, and 70% against verified copy of Bill of Lading, Commercial Invoice, and Packing List"}.\n3. Shipment Verification: Container stuffing photos, seal verification, and Draft B/L inspection will be shared prior to departure.${notesBlock}\n\nPlease let us know if these terms are acceptable to proceed.\n\nBest regards,\n${signatory}\n${exporter}`,
  };
}

export function PreTransactionModule({
  shipment,
  update,
  pricing,
  navigate,
}: PreTransactionModuleProps) {
  const draft: PreTransactionDraftData = shipment.preTransactionData || {};
  const docType = draft.docType || "quotation";
  const tone = draft.tone || "formal";
  const prospectCompany = draft.prospectCompany ?? shipment.buyer ?? "";
  const prospectCountry = draft.prospectCountry ?? shipment.buyerCountry ?? "";
  const prospectEmail = draft.prospectEmail ?? shipment.buyerEmail ?? "";
  const customNotes = draft.customNotes ?? "";
  const checklist = draft.buyerVerifiedChecklist ?? [];

  const updateDraft = (patch: Partial<PreTransactionDraftData>) => {
    update("preTransactionData", {
      ...draft,
      ...patch,
    });
  };

  const toggleChecklist = (id: string) => {
    const next = checklist.includes(id)
      ? checklist.filter((item) => item !== id)
      : [...checklist, id];
    updateDraft({ buyerVerifiedChecklist: next });
  };

  const generatedCopy = useMemo(
    () =>
      buildDraftCopy({
        docType,
        tone,
        companyName: prospectCompany,
        country: prospectCountry,
        exporter: shipment.exporter,
        signatory: shipment.signatoryName || "",
        product: shipment.product,
        hsCode: shipment.hsCode,
        quantity: shipment.quantity,
        unit: shipment.unit,
        offerValue: formatMoney(pricing.active.offer, shipment.currency),
        incoterm: shipment.incoterm,
        destination: shipment.destination,
        paymentTerms: shipment.paymentTerms,
        customNotes,
      }),
    [
      docType,
      tone,
      prospectCompany,
      prospectCountry,
      shipment.exporter,
      shipment.signatoryName,
      shipment.product,
      shipment.hsCode,
      shipment.quantity,
      shipment.unit,
      pricing.active.offer,
      shipment.currency,
      shipment.incoterm,
      shipment.destination,
      shipment.paymentTerms,
      customNotes,
    ],
  );

  const handleCopyDraft = async () => {
    try {
      await navigator.clipboard.writeText(`Subject: ${generatedCopy.subject}\n\n${generatedCopy.body}`);
      toast.success("Draf Surat Penawaran Disalin");
    } catch {
      toast.error("Gagal menyalin ke clipboard.");
    }
  };

  const handleSyncToBuyer = () => {
    if (prospectCompany.trim()) update("buyer", prospectCompany.trim());
    if (prospectCountry.trim()) update("buyerCountry", prospectCountry.trim());
    if (prospectEmail.trim()) update("buyerEmail", prospectEmail.trim());
    toast.success("Data Buyer Disinkronkan ke Transaksi");
  };

  const mailtoUrl = `mailto:${encodeURIComponent(prospectEmail)}?subject=${encodeURIComponent(
    generatedCopy.subject,
  )}&body=${encodeURIComponent(generatedCopy.body)}`;

  const verifiedCount = checklist.length;

  return (
    <div className="module-stack" style={{ gap: 16 }}>
      {/* Space DS Clean Module Header */}
      <section className="ef-module-hero">
        <div className="ef-module-hero-copy">
          <span className="eyebrow" style={{ color: "var(--navy)" }}>
            Pra-transaksi &amp; buyer
          </span>
          <h2>Penawaran Ekspor &amp; Validasi Buyer</h2>
          <p className="lead">
            Penyusunan penawaran harga resmi ({shipment.incoterm}) dan verifikasi profil calon importir.
          </p>
          <div className="ef-hero-actions">
            <button type="button" className="ef-hero-btn-primary" onClick={handleCopyDraft}>
              <Copy size={14} /> Salin Penawaran
            </button>
            <a href={mailtoUrl} className="ef-hero-btn-ghost">
              <Mail size={14} /> Buka di Email
            </a>
            <button
              type="button"
              className="ef-hero-btn-ghost"
              onClick={() => navigate("pricing")}
            >
              Sesuaikan Harga {shipment.incoterm} <ArrowRight size={13} />
            </button>
          </div>
        </div>

        <div className="ef-hero-kpis">
          <div className="ef-hero-kpi-card">
            <span>Penawaran aktif</span>
            <strong>{formatMoney(pricing.active.offer, shipment.currency)}</strong>
            <small>
              {shipment.incoterm} · {shipment.quantity.toLocaleString("en-US")} {shipment.unit}
            </small>
          </div>
          <div className="ef-hero-kpi-card">
            <span>Validasi buyer</span>
            <strong>
              {verifiedCount} / {BUYER_VALIDATION_CHECKS.length} Kriteria
            </strong>
            <small>{verifiedCount >= 4 ? "Kriteria Terpenuhi" : "Lengkapi Cek"}</small>
          </div>
        </div>
      </section>

      {/* Grid 2 Kolom: Draf Korespondensi & Checklist Validasi */}
      <div className="content-grid pretrans-grid">
        {/* Kolom Kiri: Formulir & Draf Surat */}
        <section className="panel panel-padding">
          <div className="panel-head">
            <div>
              <span className="eyebrow">Korespondensi ekspor</span>
              <h3>Draf Surat Penawaran</h3>
            </div>
            <button
              type="button"
              className="ghost-button"
              onClick={handleSyncToBuyer}
              title="Salin data prospek ke transaksi aktif"
            >
              <Database size={14} /> Sinkronkan ke Transaksi
            </button>
          </div>

          <div className="form-grid two ef-form" style={{ marginBottom: 14 }}>
            <label>
              <span>Perusahaan Buyer</span>
              <input
                type="text"
                placeholder="Nama perusahaan importir"
                value={prospectCompany}
                onChange={(e) => updateDraft({ prospectCompany: e.target.value })}
              />
            </label>
            <label>
              <span>Negara Tujuan</span>
              <input
                type="text"
                placeholder="Negara / pelabuhan tujuan"
                value={prospectCountry}
                onChange={(e) => updateDraft({ prospectCountry: e.target.value })}
              />
            </label>
            <label>
              <span>Email Buyer</span>
              <input
                type="email"
                placeholder="procurement@buyer.com"
                value={prospectEmail}
                onChange={(e) => updateDraft({ prospectEmail: e.target.value })}
              />
            </label>
            <label>
              <span>Catatan Khusus (Opsional)</span>
              <input
                type="text"
                placeholder="Ketentuan sampel, MOQ, packing khusus"
                value={customNotes}
                onChange={(e) => updateDraft({ customNotes: e.target.value })}
              />
            </label>
          </div>

          <div className="pretrans-controls-row">
            <div>
              <span className="eyebrow" style={{ display: "block", marginBottom: 6 }}>
                Jenis surat
              </span>
              <div className="space-segmented-track">
                {(
                  [
                    { id: "inquiry", label: "Inquiry" },
                    { id: "quotation", label: "Quotation" },
                    { id: "negotiation", label: "Negosiasi" },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`space-segmented-pill ${docType === item.id ? "active" : ""}`}
                    onClick={() => updateDraft({ docType: item.id })}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="eyebrow" style={{ display: "block", marginBottom: 6 }}>
                Format bahasa
              </span>
              <div className="space-segmented-track">
                {(
                  [
                    { id: "formal", label: "Formal" },
                    { id: "semi_formal", label: "Semi-Formal" },
                    { id: "casual", label: "Ringkas" },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`space-segmented-pill ${tone === item.id ? "active" : ""}`}
                    onClick={() => updateDraft({ tone: item.id })}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div
            style={{
              background: "#f8fafc",
              border: "1px solid var(--line-strong)",
              borderRadius: "var(--radius)",
              padding: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                paddingBottom: 10,
                borderBottom: "1px solid var(--line)",
                marginBottom: 10,
              }}
            >
              <div style={{ fontSize: 12.5, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                <span style={{ color: "var(--muted)", marginRight: 6 }}>Subjek:</span>
                <b>{generatedCopy.subject}</b>
              </div>
              <StatusPill tone="green">Siap Kirim</StatusPill>
            </div>
            <pre
              style={{
                margin: 0,
                whiteSpace: "pre-wrap",
                fontFamily: "var(--font-sans)",
                fontSize: 12.5,
                lineHeight: 1.6,
                color: "var(--ink)",
                background: "transparent",
                border: 0,
                padding: 0,
              }}
            >
              {generatedCopy.body}
            </pre>
            <div className="row-actions" style={{ marginTop: 14 }}>
              <button type="button" className="save-button" onClick={handleCopyDraft}>
                <Copy size={14} /> Salin Surat
              </button>
              <a
                href={mailtoUrl}
                className="ghost-button"
                style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <Send size={14} /> Buka di Email
              </a>
            </div>
          </div>
        </section>

        {/* Kolom Kanan: Checklist Validasi Legalitas Buyer */}
        <section className="panel panel-padding pretrans-check-card">
          <div className="panel-head">
            <div>
              <span className="eyebrow">Verifikasi buyer</span>
              <h3>Checklist Legalitas Importir</h3>
            </div>
            <StatusPill tone={verifiedCount >= 4 ? "green" : verifiedCount >= 2 ? "amber" : "red"}>
              {verifiedCount}/{BUYER_VALIDATION_CHECKS.length} Terverifikasi
            </StatusPill>
          </div>

          <div className="module-stack" style={{ gap: 8, marginTop: 4 }}>
            {BUYER_VALIDATION_CHECKS.map((item) => {
              const checked = checklist.includes(item.id);
              return (
                <label
                  key={item.id}
                  className={`pretrans-check-item ${checked ? "done" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleChecklist(item.id)}
                  />
                  <div className="pretrans-check-content">
                    <div className="pretrans-check-header">
                      <span className="pretrans-check-title">
                        {item.label}
                      </span>
                      <span className="pretrans-check-tag">
                        {item.tag}
                      </span>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>

          <div className="pretrans-btn-stack">
            <button type="button" className="save-button" onClick={() => navigate("documents")}>
              <Building2 size={14} /> Terbitkan PI / Kontrak →
            </button>
            <button type="button" className="ghost-button" onClick={() => navigate("compliance")}>
              Cek HS &amp; Lartas →
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
