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
  ServerCog,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";

interface PreTransactionModuleProps {
  shipment: Shipment;
  update: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void;
  pricing: Pricing;
  navigate: (screen: ScreenId) => void;
}

const BUYER_VALIDATION_CHECKS: { id: string; label: string; detail: string }[] = [
  {
    id: "reg_checked",
    label: "Verifikasi Legalitas & Registrasi Perusahaan Importir",
    detail: "Pastikan nomor registrasi bisnis / VAT / EORI buyer valid di direktori resmi negara tujuan.",
  },
  {
    id: "domain_checked",
    label: "Kesesuaian Email Korporat vs Domain Publik",
    detail: "Waspadai domain gratis (gmail/yahoo) untuk nilai kontrak besar; utamakan email domain perusahaan.",
  },
  {
    id: "port_sanction_checked",
    label: "Screening Negara Tujuan & Pelabuhan Bebas Sanksi",
    detail: "Periksa pelabuhan bongkar dan negara tujuan tidak masuk daftar pembatasan perdagangan atau embargo.",
  },
  {
    id: "dp_guard_checked",
    label: "Komitmen Skema Pembayaran Aman (DP Min. 30% / T/T / L/C)",
    detail: "Hindari pengiriman tanpa uang muka sebelum barang diproduksi atau dimuat ke kontainer.",
  },
  {
    id: "spec_sample_checked",
    label: "Konfirmasi Spesifikasi Mutu, Kemasan & Sampel Awal",
    detail: "Buyer telah menyepakati kadar air/grade, tipe kemasan ekspor, dan batas minimum order (MOQ).",
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
  const buyer = params.companyName || "Procurement Team";
  const countrySuffix = params.country ? ` (${params.country})` : "";
  const exporter = params.exporter || "PT Eksportir Nusantara Indonesia";
  const signatory = params.signatory || "Export Team";
  const product = params.product || "Indonesian Export Commodity";
  const hs = params.hsCode ? ` (HS Code: ${params.hsCode})` : "";
  const route = params.destination || "Destination Port";
  const notesBlock = params.customNotes ? `\nAdditional Notes:\n${params.customNotes}\n` : "";

  const subjectMap: Record<NonNullable<PreTransactionDraftData["docType"]>, string> = {
    inquiry: `Supply Introduction: ${product}${hs} from ${exporter}`,
    quotation: `Official Export Quotation (${params.incoterm} ${route}) — ${product}`,
    negotiation: `Commercial Terms & T/T Payment Alignment — ${product} (${exporter})`,
  };

  const greetingByTone = {
    formal: `Dear Purchasing & Import Director at ${buyer}${countrySuffix},\n\nWe trust this correspondence finds you well. On behalf of ${exporter}, Indonesia,`,
    semi_formal: `Hello ${buyer}${countrySuffix} Team,\n\nWarm greetings from ${exporter} in Indonesia!`,
    casual: `Hi ${buyer}${countrySuffix} Team,\n\nHope your week is going great! Quick note from ${exporter} in Indonesia —`,
  };

  if (params.docType === "inquiry") {
    const middleByTone = {
      formal: `we are pleased to introduce our export supply capability for ${product}${hs}. With full compliance covering Phytosanitary Certification, e-SKA Certificate of Origin, and quality assurance documentation, we supply consistent commercial shipments of ${params.quantity.toLocaleString("en-US")} ${params.unit} per cycle.`,
      semi_formal: `we specialize in exporting premium ${product}${hs} with complete export compliance (Karantina, COO/e-SKA, and Pre-Shipment Inspection). We can consistently fulfill orders starting around ${params.quantity.toLocaleString("en-US")} ${params.unit}.`,
      casual: `we produce and export ${product}${hs} ready for international retail and wholesale buyers (${params.quantity.toLocaleString("en-US")} ${params.unit} capacity).`,
    };
    const closingByTone = {
      formal: `\nShould your procurement desk be reviewing new qualified suppliers this quarter, we would be honored to dispatch product specifications, COA, and physical samples for evaluation.\n${notesBlock}\nRespectfully yours,\n${signatory}\n${exporter}`,
      semi_formal: `\nLet us know if you would like our latest product catalog, COA lab sheet, or sample dispatch pricing to ${route}.\n${notesBlock}\nBest regards,\n${signatory} · ${exporter}`,
      casual: `\nHappy to send photos, spec sheets, or arrange a quick sample shipment to ${route} whenever you're ready.\n${notesBlock}\nCheers,\n${signatory} (${exporter})`,
    };
    return {
      subject: subjectMap.inquiry,
      body: `${greetingByTone[params.tone]} ${middleByTone[params.tone]}${closingByTone[params.tone]}`,
    };
  }

  if (params.docType === "quotation") {
    const coreDetails = `\n\nQUOTATION SUMMARY\n• Commodity: ${product}${hs}\n• Quantity: ${params.quantity.toLocaleString("en-US")} ${params.unit}\n• Total Indicative Value: ${params.offerValue}\n• Delivery Term: ${params.incoterm} (${route})\n• Payment Terms: ${params.paymentTerms || "30% Deposit T/T, 70% against Scanned Copy B/L & Commercial Docs"}\n• Export Readiness: Full CI, Packing List, COO/e-SKA & Quarantine Certificate`;
    const closingByTone = {
      formal: `${coreDetails}\n${notesBlock}\nUpon your confirmation, we will issue a formal Proforma Invoice and reserve container allocation immediately.\n\nSincerely,\n${signatory}\n${exporter}`,
      semi_formal: `${coreDetails}\n${notesBlock}\nIf the terms above match your landed-cost target, reply with your company details and we will lock the Proforma Invoice today.\n\nWarm regards,\n${signatory} · ${exporter}`,
      casual: `${coreDetails}\n${notesBlock}\nLet me know if this quotation hits your target budget — happy to tweak volume or packing specs to make it work!\n\nBest,\n${signatory} (${exporter})`,
    };
    return {
      subject: subjectMap.quotation,
      body: `${greetingByTone[params.tone]} please find our updated commercial quotation below:${closingByTone[params.tone]}`,
    };
  }

  // negotiation
  const negBodyByTone = {
    formal: `following up on our proposal for ${product} (${params.quantity.toLocaleString("en-US")} ${params.unit}, ${params.incoterm} ${route} at ${params.offerValue}), we appreciate your constructive feedback regarding commercial terms.\n\nTo facilitate an expedited first transaction while maintaining shipment security for both parties:\n1. Trade Term Flexibility: We can quote ${params.incoterm} or adjust to FOB Indonesian Main Port if your nominated forwarder prefers ocean freight control.\n2. Standard Safe Settlement: ${params.paymentTerms || "30% Advance T/T to initiate stuffing, and 70% Balance against Scanned Copy of Final Bill of Lading, Commercial Invoice, Packing List, and NPE."}\n3. Pre-Shipment Assurance: Live stuffing photos, seal numbers, and OCR-verified Draft B/L will be shared before vessel closing.\n${notesBlock}\nWe look forward to finalizing the Sales Contract.\n\nYours faithfully,\n${signatory}\n${exporter}`,
    semi_formal: `thank you for reviewing our quotation for ${product} (${params.offerValue} ${params.incoterm}).\n\nHere is how we can bridge the negotiation smoothly:\n- Delivery option: Stick with ${params.incoterm} (${route}) or switch to FOB if you already have a preferred freight forwarder.\n- Payment structure: ${params.paymentTerms || "30% DP upon PO confirmation, 70% balance against digitally stamped Scanned Copy B/L before telex release"}.\n- Transparency: We send full Draft B/L verification + seal proof so zero demurrage surprises occur at destination.\n${notesBlock}\nWould this structure work for your purchase order this week?\n\nBest regards,\n${signatory} · ${exporter}`,
    casual: `thanks for the feedback on our ${product} quote (${params.offerValue}, ${params.incoterm})!\n\nTo make the first trial order easy:\n• We're open to ${params.incoterm} or FOB depending on your forwarder rate.\n• Standard ${params.paymentTerms || "30% DP / 70% against Scanned Copy B/L"} keeps cashflow balanced and safe for both sides.\n• We share container stuffing photos and pre-checked Draft B/L before sailing.\n${notesBlock}\nLet me know what tweaks you need so we can draft the PI!\n\nCheers,\n${signatory} (${exporter})`,
  };
  return {
    subject: subjectMap.negotiation,
    body: `${greetingByTone[params.tone]} ${negBodyByTone[params.tone]}`,
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
      toast.success("Draf Surat Pra-Transaksi Disalin", {
        description: "Siap ditempel ke Email, WhatsApp Business, atau LinkedIn buyer luar negeri.",
      });
    } catch {
      toast.error("Gagal menyalin ke clipboard.");
    }
  };

  const handleSyncToBuyer = () => {
    if (prospectCompany.trim()) update("buyer", prospectCompany.trim());
    if (prospectCountry.trim()) update("buyerCountry", prospectCountry.trim());
    if (prospectEmail.trim()) update("buyerEmail", prospectEmail.trim());
    toast.success("Data Prospek Disinkronkan ke Transaksi", {
      description: "Nama, negara, dan email prospek kini aktif di dokumen PI, CI, PL & Risk Center.",
    });
  };

  const mailtoUrl = `mailto:${encodeURIComponent(prospectEmail)}?subject=${encodeURIComponent(
    generatedCopy.subject,
  )}&body=${encodeURIComponent(generatedCopy.body)}`;

  const verifiedCount = checklist.length;

  return (
    <div className="module-stack" style={{ gap: 16 }}>
      {/* Hero Banner */}
      <section className="ef-module-hero">
        <div className="ef-module-hero-copy">
          <span className="eyebrow" style={{ color: "#fbbf24" }}>
            AKUSISI BUYER &amp; PRA-TRANSAKSI EKSPOR
          </span>
          <h2>Generator Penawaran AI &amp; Validasi Calon Buyer</h2>
          <p className="lead">
            Susun surat perkenalan (Inquiry), Quotation harga {shipment.incoterm}, maupun draf negosiasi T/T
            dalam 3 gaya bahasa (Formal, Semi-Formal, Casual) sambil memastikan legalitas calon importir
            sebelum menerbitkan Proforma Invoice.
          </p>
          <div className="ef-hero-actions">
            <button type="button" className="ef-hero-btn-primary" onClick={handleCopyDraft}>
              <Copy size={15} /> Salin Surat Penawaran
            </button>
            <a href={mailtoUrl} className="ef-hero-btn-ghost">
              <Mail size={15} /> Buka di Aplikasi Email
            </a>
            <button
              type="button"
              className="ef-hero-btn-ghost"
              onClick={() => navigate("pricing")}
            >
              Sesuaikan Harga {shipment.incoterm} <ArrowRight size={14} />
            </button>
          </div>
        </div>

        <div className="ef-hero-kpis">
          <div className="ef-hero-kpi-card">
            <span>PENAWARAN AKTIF</span>
            <strong>{formatMoney(pricing.active.offer, shipment.currency)}</strong>
            <small>
              {shipment.incoterm} · {shipment.quantity.toLocaleString("en-US")} {shipment.unit}
            </small>
          </div>
          <div className="ef-hero-kpi-card">
            <span>VALIDASI LEGAL BUYER</span>
            <strong>
              {verifiedCount} / {BUYER_VALIDATION_CHECKS.length} Cek
            </strong>
            <small>{verifiedCount >= 4 ? "Siap Lanjut ke PI / Kontrak" : "Lengkapi pengecekan buyer"}</small>
          </div>
        </div>
      </section>

      {/* Banner Status Integrasi VPS (Transparan sesuai scope arsitektur) */}
      <section
        className="panel panel-padding"
        style={{
          background: "#f8fafc",
          borderColor: "#cbd5e1",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, maxWidth: 740 }}>
          <ServerCog size={18} style={{ color: "#0f2942", marginTop: 2, flexShrink: 0 }} />
          <div style={{ fontSize: 12.5, color: "#334155", lineHeight: 1.5 }}>
            <b style={{ color: "#0f172a" }}>Status Konektor Eksternal Pra-Transaksi:</b> Generator surat
            penawaran, 3 gaya AI copywriting, sinkronisasi transaksi, dan 1-klik <code>mailto:</code>{" "}
            berjalan langsung saat ini. Modul <b>Live Web Buyer Scraping</b> &amp; <b>SMTP Bulk Email Blast</b>{" "}
            otomatis dijadwalkan aktif setelah migrasi ke backend VPS khusus agar reputasi domain pengirim tetap terjaga.
          </div>
        </div>
        <StatusPill tone="blue">Bulk SMTP &amp; Scraper: Siap Integrasi VPS</StatusPill>
      </section>

      {/* Workspace 2 Kolom: Pengaturan + Draf Surat & Checklist Validasi */}
      <div className="content-grid two-thirds">
        {/* Kiri: Konfigurator Surat & Live Draft */}
        <section className="panel panel-padding">
          <div className="panel-head">
            <div>
              <span className="eyebrow">GENERATOR SURAT PRA-TRANSAKSI</span>
              <h3>Komposisi Dokumen &amp; Gaya AI Copywriting</h3>
            </div>
            <button
              type="button"
              className="ghost-button"
              onClick={handleSyncToBuyer}
              title="Salin data prospek ke form transaksi aktif"
            >
              <Database size={14} /> Sinkronkan ke Buyer Aktif
            </button>
          </div>

          <div className="form-grid two ef-form" style={{ marginBottom: 14 }}>
            <label>
              <span>Nama Perusahaan Prospek / Buyer</span>
              <input
                type="text"
                placeholder="Contoh: Nordic Pantry AB"
                value={prospectCompany}
                onChange={(e) => updateDraft({ prospectCompany: e.target.value })}
              />
            </label>
            <label>
              <span>Negara Tujuan Prospek</span>
              <input
                type="text"
                placeholder="Contoh: Swedia / Uni Emirat Arab"
                value={prospectCountry}
                onChange={(e) => updateDraft({ prospectCountry: e.target.value })}
              />
            </label>
            <label>
              <span>Email Korespondensi Buyer</span>
              <input
                type="email"
                placeholder="procurement@company.com"
                value={prospectEmail}
                onChange={(e) => updateDraft({ prospectEmail: e.target.value })}
              />
            </label>
            <label>
              <span>Catatan Khusus Penawaran (Opsional)</span>
              <input
                type="text"
                placeholder="Contoh: Free 2kg sample via DHL upon NDA / MOQ trial 1x20ft"
                value={customNotes}
                onChange={(e) => updateDraft({ customNotes: e.target.value })}
              />
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <span className="eyebrow" style={{ display: "block", marginBottom: 6 }}>
                1. Jenis Dokumen Pra-Transaksi
              </span>
              <div className="clean-tabs" style={{ flexWrap: "wrap" }}>
                {(
                  [
                    { id: "inquiry", label: "Inquiry / Intro" },
                    { id: "quotation", label: "Quotation / Offer" },
                    { id: "negotiation", label: "Negosiasi Awal" },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={docType === item.id ? "active" : ""}
                    onClick={() => updateDraft({ docType: item.id })}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="eyebrow" style={{ display: "block", marginBottom: 6 }}>
                2. Gaya Bahasa (AI Tone)
              </span>
              <div className="clean-tabs" style={{ flexWrap: "wrap" }}>
                {(
                  [
                    { id: "formal", label: "Formal" },
                    { id: "semi_formal", label: "Semi-Formal" },
                    { id: "casual", label: "Casual" },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={tone === item.id ? "active" : ""}
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
              border: "1px solid #cbd5e1",
              borderRadius: 10,
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
                borderBottom: "1px solid #e2e8f0",
                marginBottom: 10,
              }}
            >
              <div style={{ fontSize: 12.5, color: "#0f172a" }}>
                <span style={{ color: "#64748b", marginRight: 6 }}>Subjek:</span>
                <b>{generatedCopy.subject}</b>
              </div>
              <StatusPill tone="green">
                <Sparkles size={11} /> Siap Kirim
              </StatusPill>
            </div>
            <pre
              style={{
                margin: 0,
                whiteSpace: "pre-wrap",
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                lineHeight: 1.65,
                color: "#1e293b",
              }}
            >
              {generatedCopy.body}
            </pre>
            <div className="row-actions" style={{ marginTop: 14 }}>
              <button type="button" className="save-button" onClick={handleCopyDraft}>
                <Copy size={14} /> Salin Subjek &amp; Isi Surat
              </button>
              <a
                href={mailtoUrl}
                className="ghost-button"
                style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <Send size={14} /> Kirim via Email Client
              </a>
            </div>
          </div>
        </section>

        {/* Kanan: Checklist Validasi Legalitas Buyer */}
        <section className="panel panel-padding">
          <div className="panel-head">
            <div>
              <span className="eyebrow">VALIDASI CALON BUYER</span>
              <h3>Checklist Legalitas &amp; Anti-Fraud</h3>
            </div>
            <StatusPill tone={verifiedCount >= 4 ? "green" : verifiedCount >= 2 ? "amber" : "red"}>
              {verifiedCount}/{BUYER_VALIDATION_CHECKS.length} Valid
            </StatusPill>
          </div>

          <p className="muted-note" style={{ marginBottom: 12 }}>
            Tandai hasil pengecekan awal calon importir sebelum mengunci stok bahan baku dan menerbitkan
            Proforma Invoice (PI):
          </p>

          <div className="module-stack" style={{ gap: 8 }}>
            {BUYER_VALIDATION_CHECKS.map((item) => {
              const checked = checklist.includes(item.id);
              return (
                <label
                  key={item.id}
                  className={`legal-check-row ${checked ? "done" : ""}`}
                  style={{ cursor: "pointer" }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleChecklist(item.id)}
                  />
                  <div>
                    <b style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {checked && <CheckCircle2 size={13} style={{ color: "#10b981" }} />}
                      {item.label}
                    </b>
                    <small>{item.detail}</small>
                  </div>
                </label>
              );
            })}
          </div>

          <div
            style={{
              marginTop: 14,
              padding: 12,
              borderRadius: 8,
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              fontSize: 12,
              color: "#1e3a8a",
              lineHeight: 1.5,
            }}
          >
            <b style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <ShieldCheck size={14} /> Langkah Berikutnya Setelah Deal
            </b>
            Lanjutkan ke <b>Dokumen Ekspor</b> untuk menerbitkan Proforma Invoice &amp; Sales Contract
            otomatis menggunakan data buyer ini, atau cek kepatuhan <b>HS Code &amp; Lartas</b>.
          </div>

          <div className="row-actions" style={{ marginTop: 12 }}>
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
