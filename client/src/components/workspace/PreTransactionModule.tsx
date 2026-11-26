import { StatusPill } from "@/components/workspace/Primitives";
import type { PreTransactionDraftData } from "@shared/exportCompliance";
import { formatMoney } from "@shared/format";
import type { Pricing } from "@shared/pricing";
import type { ScreenId } from "@shared/risk";
import type { Shipment } from "@shared/shipment";
import {
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  Database,
  Download,
  Edit3,
  Eye,
  FileCheck,
  FileText,
  Mail,
  Paperclip,
  Plus,
  Printer,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
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

interface AttachedDoc {
  id: string;
  fileName: string;
  title: string;
  description: string;
  size: string;
  badge: string;
}

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
  refNum: string;
  formattedDate: string;
  attachmentsList: string[];
}): { subject: string; body: string } {
  const buyer = params.companyName || "Procurement Department";
  const countrySuffix = params.country ? ` (${params.country})` : "";
  const exporter = (params.exporter || "PT Nusantara Ekspor Mandiri").replace(/\s*\(Demo\)/gi, "").trim();
  const signatory = (params.signatory || "Export Sales Department").replace(/\s*\(Demo\)/gi, "").trim();
  const product = params.product || "Kopi Arabika Gayo Grade 1";
  const hsRaw = params.hsCode || "0901.11.10";
  const hs = hsRaw ? ` (HS Code: ${hsRaw})` : "";
  const route = params.destination || "Destination Port";
  const notesBlock = params.customNotes ? `\n\nSPECIAL NOTES & REQUIREMENTS:\n${params.customNotes}` : "";

  // Compute realistic volume string
  const volStr =
    params.quantity > 0
      ? `${params.quantity.toLocaleString("en-US")} ${params.unit || "MT"} (Approx. 1 x 20' FCL)`
      : `19.2 MT (1 x 20' FCL / 320 Jute Bags @60kg)`;

  const unitPrice =
    params.quantity > 0
      ? formatMoney(Math.round(parseFloat(params.offerValue.replace(/[^0-9.]/g, "") || "24590") / params.quantity), "USD")
      : "$1,280 / MT";

  // Attachment summary text for email copy
  const attachmentSection =
    params.attachmentsList.length > 0
      ? `\n\nATTACHED OFFICIAL DOCUMENTS:\n${params.attachmentsList.map((att, i) => `[${i + 1}] 📎 ${att}`).join("\n")}`
      : "";

  // -------------------------------------------------------------
  // 1. INQUIRY (Surat Minat & Pengenalan Suplai Komoditas Ekspor)
  // -------------------------------------------------------------
  if (params.docType === "inquiry") {
    if (params.tone === "formal") {
      const subject = `[OFFICIAL EXPORT INQUIRY] Introduction & Commercial Supply Presentation: ${product}${hs} — ${exporter}`;
      const body = `REF NO: ${params.refNum}
DATE: ${params.formattedDate}

TO: Head of Procurement & Global Sourcing
    ${buyer}${countrySuffix}
FROM: Export Sales & Trade Division, ${exporter}
SUBJECT: ${subject}

Dear Sir / Madam,

On behalf of ${exporter}, a licensed and registered Indonesian exporter (NIB & Customs Certified), we have the honor to introduce our company as an accredited commercial supplier of export-grade ${product}${hs}.

We operate under stringent international food safety and phytosanitary quality protocols, maintaining regular supply capacity of ${volStr} per shipping cycle with full traceability.

COMMODITY SPECIFICATIONS:
• Commodity: ${product}
• Harmonized System (HS) Code: ${hsRaw}
• Country of Origin: Indonesia
• Standard Packaging: 60 kg export-grade Jute Bags with inner GrainPro hermetic moisture barrier (or export cartons upon request)
• Standard Batch Size: 1 x 20' FCL (${volStr})
• Pre-Shipment Inspection: Certified by independent surveyor (SGS / Sucofindo) & Quarantine Phytosanitary Office

EXPORT COMPLIANCE & LEGAL ACCREDITATION:
1. Legal Export Licensing (NIB & Ministry of Trade Registered)
2. Electronic Certificate of Origin (e-SKA Form A / Form D / Form AK / Form ICO)
3. Mandatory Phytosanitary and ISPM #15 Fumigation Certification

Should your procurement desk be evaluating reliable Indonesian export partners, we would be privileged to dispatch full product specifications, laboratory assay reports, and commercial samples to your office.${notesBlock}${attachmentSection}

We remain at your disposal for any technical or logistics discussions and look forward to building an enduring commercial partnership.

Respectfully yours,

[Digital Seal & Signature Verified]
${signatory}
Director of Export Operations
${exporter}
Indonesia`;
      return { subject, body };
    }

    if (params.tone === "semi_formal") {
      const subject = `[SUPPLY INTRODUCTION] Commercial Supply Opportunities: ${product} — ${exporter}`;
      const body = `Dear Purchasing Team at ${buyer}${countrySuffix},

Greetings from Indonesia.

We are reaching out from ${exporter} to present our commercial supply capabilities for ${product}${hs}. As an established Indonesian producer-exporter, we support international buyers with consistent quality, transparent pricing, and seamless shipping execution.

KEY SUPPLY HIGHLIGHTS:
• Commodity: ${product}${hs}
• Provenance: Indonesia
• Shipment Volume: ${volStr} (FCL / LCL consolidation available)
• Packaging: Export-grade packaging with moisture-proof GrainPro protection
• Quality Standards: Laboratory tested with verified moisture, defect, and screen size thresholds
• Regulatory Set: Complete Certificate of Origin (COO), Phytosanitary, and Halal / Food Safety documentation

We would be pleased to share our full product catalogue, representative lab analysis, and price estimates tailored to your preferred destination port (${route}).${notesBlock}${attachmentSection}

Please let us know your current sourcing schedule and if we may dispatch representative samples for your quality appraisal.

Warm regards,

${signatory}
Export Sales Department
${exporter}`;
      return { subject, body };
    }

    // casual / ringkas
    const subject = `[INQUIRY / INTRODUCTION] ${product} Export Supply Specs & Capacity — ${exporter}`;
    const body = `Hi ${buyer} Sourcing Team,

Quick introduction from ${exporter} (Indonesia). We specialize in direct commercial supply of premium export-grade ${product}${hs}.

SNAPSHOT FOR YOUR PROCUREMENT DESK:
• Product: ${product} (Origin: Indonesia)
• Volume Capacity: ${volStr} (Standard 20' FCL allocation)
• Packaging: 60kg export bags with GrainPro moisture barrier
• Export Documents: Full export package (COO, Phytosanitary, Surveyor Report, B/L)
• Route: Direct ocean freight to ${route}${notesBlock}${attachmentSection}

Attached please find our technical spec sheet. If your desk has an active tender or requirement for this shipping window, we would be delighted to quote you immediately.

Best regards,
${signatory} | ${exporter}`;
    return { subject, body };
  }

  // -------------------------------------------------------------
  // 2. QUOTATION (Surat Penawaran Harga Resmi / Commercial Offer)
  // -------------------------------------------------------------
  if (params.docType === "quotation") {
    if (params.tone === "formal") {
      const subject = `[OFFICIAL COMMERCIAL QUOTATION] Formal Export Offer: ${product} (${params.incoterm} ${route}) — Ref: ${params.refNum}`;
      const body = `REF NO: ${params.refNum}
DATE: ${params.formattedDate}
VALIDITY: 14 Calendar Days from Date of Issuance

TO: Procurement & Commercial Division
    ${buyer}${countrySuffix}
FROM: Commercial & Export Pricing Desk, ${exporter}
SUBJECT: ${subject}

Dear Sir / Madam,

We thank you for your esteemed inquiry regarding ${product}. On behalf of ${exporter}, we have the pleasure to submit our formal commercial price quotation under the agreed parameters below:

1. COMMERCIAL OFFER SUMMARY:
• Commodity Description: ${product}${hs}
• Contract Quantity: ${volStr}
• Delivery Term (Incoterms 2020): ${params.incoterm} (${route})
• Indicative Unit Price: ${unitPrice}
• Total Commercial Value: ${params.offerValue}
• Packaging: 60 kg export Jute Bags with inner GrainPro liner (Palletized upon request)

2. PAYMENT & BANKING TERMS:
• Payment Structure: ${params.paymentTerms || "30% Advance Down Payment (T/T) upon Sales Contract execution; 70% Balance T/T payable against copy of full shipping documents (Draft B/L, Commercial Invoice, Packing List, Certificate of Origin)"}.
• Currency: Commercial US Dollars (USD) via International Wire Transfer (SWIFT).

3. LOGISTICS & DOCUMENTARY COMPLIANCE:
• Production & Dispatch Lead Time: 14–21 business days from receipt of down payment.
• Port of Loading: Tanjung Priok, Jakarta (IDTPP) / Belawan, Medan (IDBLW).
• Port of Discharge: ${route}.
• Included Export Documentation:
  - Signed Commercial Invoice & Detailed Packing List (3/3 Original)
  - Full Set Clean on Board Ocean Bills of Lading (B/L)
  - Official Electronic Certificate of Origin (e-SKA COO)
  - Phytosanitary Certificate & Fumigation Certificate
  - Independent Surveyor Certificate of Weight & Quality (SGS / Sucofindo)${notesBlock}${attachmentSection}

4. ORDER CONFIRMATION:
To confirm this quotation and lock in vessel container allocation, please counter-sign the attached quotation document or issue your official Purchase Order (PO). We will immediately issue the binding Proforma Invoice (PI) and Sales Contract.

Yours faithfully,

[Digital Seal & Signature Verified]
${signatory}
Head of Commercial & Export Operations
${exporter}`;
      return { subject, body };
    }

    if (params.tone === "semi_formal") {
      const subject = `[COMMERCIAL QUOTATION] Export Price Offer: ${product} (${params.incoterm} ${route}) — Ref: ${params.refNum}`;
      const body = `Dear Purchasing Team at ${buyer}${countrySuffix},

Thank you for your commercial interest in our ${product}. We are pleased to provide our price quotation and commercial terms as detailed below:

COMMERCIAL TERMS:
• Commodity: ${product}${hs}
• Order Quantity: ${volStr}
• Total Indicative Value: ${params.offerValue} (${params.incoterm} ${route})
• Reference Unit Price: ${unitPrice}
• Packaging: Export-grade bags with protective hermetic barrier
• Payment Terms: ${params.paymentTerms || "30% Advance T/T, 70% against full shipping documents copy"}
• Quotation Validity: 14 business days from date of issuance

INCLUDED SHIPPING DOCUMENTATION:
✓ Commercial Invoice & Itemized Packing List
✓ Clean on Board Ocean Bill of Lading (B/L)
✓ Electronic Certificate of Origin (COO) for preferential customs tariff
✓ Official Phytosanitary Certificate & Quarantine Clearance${notesBlock}${attachmentSection}

Please review the attached formal quotation letter. Upon your confirmation, we will reserve shipping space and prepare the formal Proforma Invoice.

Best regards,

${signatory}
Export Sales Management
${exporter}`;
      return { subject, body };
    }

    // casual / ringkas
    const subject = `[PRICE QUOTATION] ${product} (${params.incoterm} ${route}) — Indicative Offer & Terms`;
    const body = `Dear ${buyer} Team,

Following your request, here is our commercial quotation summary for ${product}:

• Commodity: ${product}${hs}
• Volume: ${volStr}
• Indicative Total: ${params.offerValue} (${params.incoterm} ${route}) — ${unitPrice}
• Payment Terms: ${params.paymentTerms || "30% DP T/T, 70% balance vs Draft B/L"}
• Lead Time: 2–3 weeks to container stuffing
• Included Docs: Commercial Invoice, Packing List, B/L, COO, Phytosanitary Certificate${notesBlock}${attachmentSection}

Official quotation PDF and technical data sheet are attached for your review. Let us know if this aligns with your target schedule so we can finalize!

Regards,
${signatory} | ${exporter}`;
    return { subject, body };
  }

  // -------------------------------------------------------------
  // 3. NEGOTIATION (Surat Negosiasi & Penyelarasan Ketentuan Kontrak)
  // -------------------------------------------------------------
  if (params.tone === "formal") {
    const subject = `[COMMERCIAL NEGOTIATION] Terms Alignment & Contract Finalization: ${product} — Ref: ${params.refNum}`;
    const body = `REF NO: ${params.refNum}
DATE: ${params.formattedDate}

TO: Executive Procurement Directorate
    ${buyer}${countrySuffix}
FROM: Commercial Negotiations Directorate, ${exporter}
SUBJECT: ${subject}

Dear Sir / Madam,

We acknowledge receipt of your correspondence and notes concerning our previous quotation for ${product} (${volStr}, ${params.incoterm} ${route} at ${params.offerValue}).

In the interest of fostering a long-term mutually advantageous commercial alliance, our executive board has reviewed your requested terms and proposes the following aligned framework:

1. PRICING & INCOTERM STRUCTURE:
• Option A: Maintained at ${params.incoterm} (${route}) with consolidated ocean freight booking at ${params.offerValue}.
• Option B: Re-quoted at FOB Indonesian Main Port, granting your desk the flexibility to nominate your contracted ocean carrier.

2. PAYMENT SAFETY & CASH FLOW ALIGNMENT:
• Agreed Structure: ${params.paymentTerms || "30% Advance Down Payment upon Sales Contract; 70% Balance payable upon presentation of verified Draft B/L, Commercial Invoice, and Phytosanitary Certificate prior to original surrender"}.
• Optional Instrument: Irrevocable Documentary Letter of Credit (L/C at sight) issued by a top-tier prime international bank.

3. TRANSPARENCY & PRE-SHIPMENT SUPERVISION:
• Comprehensive digital photo & video reporting during container stuffing and customs gate-in.
• Pre-departure seal inspection report and Draft B/L cross-validation to guarantee zero documentary discrepancies.${notesBlock}${attachmentSection}

Kindly confirm which structure best aligns with your financial and logistics calendar so we may proceed to issue the binding Sales Contract (SC).

Respectfully yours,

[Digital Seal & Signature Verified]
${signatory}
Director of Commercial Negotiations
${exporter}`;
    return { subject, body };
  }

  if (params.tone === "semi_formal") {
    const subject = `[TRADE NEGOTIATION] Counter-Offer & Flexible Terms: ${product} — Ref: ${params.refNum}`;
    const body = `Dear Purchasing Team at ${buyer}${countrySuffix},

Thank you for your constructive feedback on our commercial proposal for ${product} (${volStr}).

We are eager to accommodate your operational preferences and reach a mutually beneficial agreement. Here is our proposed alignment:

1. Logistics & Incoterm: We can proceed with ${params.incoterm} ${route}, or switch to FOB Tanjung Priok if you prefer booking ocean freight via your nominated forwarder.
2. Payment Terms: ${params.paymentTerms || "30% Advance T/T upon contract confirmation, with remaining 70% paid against scanned copy of Draft B/L, Packing List, and Phyto Certificate"}.
3. Quality & Cargo Inspection: High-resolution container stuffing photos, seal verification, and independent lab assays will be provided prior to vessel departure.${notesBlock}${attachmentSection}

Please review these adjusted terms and let us know if we can prepare the definitive Proforma Invoice.

Warm regards,

${signatory}
Export Operations & Sales
${exporter}`;
    return { subject, body };
  }

  // casual / ringkas
  const subject = `[TERMS ALIGNMENT] Final Payment & Delivery Terms: ${product} — Ref: ${params.refNum}`;
  const body = `Hi ${buyer} Sourcing Desk,

Thanks for your counter-notes on our ${product} offer. We are happy to adjust terms to close this deal:

• Incoterm Flexibility: We can stick to ${params.incoterm} ${route} or switch to FOB Indonesia if you have preferential carrier rates.
• Payment Terms: ${params.paymentTerms || "30% DP T/T, 70% against Draft B/L copy"}.
• Quality Assurance: Full stuffing photos and surveyor report shared before vessel sail.${notesBlock}${attachmentSection}

Let us know if this works so we can lock in container space!

Best regards,
${signatory} | ${exporter}`;
  return { subject, body };
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

  // Modal Review & Edit state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewTab, setReviewTab] = useState<"letterhead" | "editor">("letterhead");

  // Custom overrides (if user edited text in review editor)
  const [editableSubject, setEditableSubject] = useState<string>("");
  const [editableBody, setEditableBody] = useState<string>("");

  // Attached files state
  const [selectedAttachments, setSelectedAttachments] = useState<string[]>([
    "Official_Quotation_Letter.pdf",
    "Technical_Spec_Sheet.pdf",
    "Company_Profile_PT_Nusantara_Ekspor_Mandiri.pdf",
  ]);

  const [customAttachments, setCustomAttachments] = useState<AttachedDoc[]>([]);
  const [newDocName, setNewDocName] = useState("");
  const [showAddDocForm, setShowAddDocForm] = useState(false);

  const formattedDate = useMemo(() => {
    return new Intl.DateTimeFormat("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());
  }, []);

  const refNum = useMemo(() => {
    const prefix = docType === "inquiry" ? "INQ" : docType === "negotiation" ? "NEG" : "QUO";
    const datePart = new Date().toISOString().slice(0, 7).replace("-", "/");
    return `${prefix}/NEM/${datePart}/088`;
  }, [docType]);

  const defaultAttachments: AttachedDoc[] = useMemo(() => {
    const mainDocName =
      docType === "inquiry"
        ? "Official_Export_Inquiry_INQ-2026.pdf"
        : docType === "negotiation"
        ? "Commercial_Negotiation_Agreement_NEG-2026.pdf"
        : "Official_Commercial_Quotation_QUO-2026.pdf";

    const mainDocTitle =
      docType === "inquiry"
        ? "Surat Pengenalan Suplai Ekspor Resmi"
        : docType === "negotiation"
        ? "Surat Kesepakatan & Negosiasi Komersial"
        : "Surat Penawaran Harga Resmi (Kop Surat)";

    const prodSanitized = (shipment.product || "Kopi_Arabika_Gayo").replace(/\s+/g, "_");

    return [
      {
        id: "doc_main",
        fileName: mainDocName,
        title: mainDocTitle,
        description: "Dokumen resmi berkop surat eksportir, tanda tangan digital & stempel",
        size: "168 KB",
        badge: "Dokumen Utama",
      },
      {
        id: "doc_spec",
        fileName: `Technical_Spec_Sheet_${prodSanitized}.pdf`,
        title: "Lembar Spesifikasi Mutu & Analisis Lab",
        description: "Kadar air ≤ 12.5%, defect max 5%, ukuran screen, dan metode proses",
        size: "115 KB",
        badge: "Standar SNI / ICO",
      },
      {
        id: "doc_profile",
        fileName: "Company_Profile_PT_Nusantara_Ekspor_Mandiri.pdf",
        title: "Profil Perusahaan & Legalitas Eksportir",
        description: "Legalitas NIB, NPWP, sertifikasi e-SKA, dan kesiapan karantina",
        size: "240 KB",
        badge: "Legalitas Terverifikasi",
      },
    ];
  }, [docType, shipment.product]);

  const allAvailableDocs = useMemo(() => {
    return [...defaultAttachments, ...customAttachments];
  }, [defaultAttachments, customAttachments]);

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

  const toggleAttachment = (fileName: string) => {
    setSelectedAttachments((prev) =>
      prev.includes(fileName) ? prev.filter((f) => f !== fileName) : [...prev, fileName]
    );
  };

  const handleAddCustomDoc = () => {
    if (!newDocName.trim()) {
      toast.error("Nama dokumen tidak boleh kosong");
      return;
    }
    const safeName = newDocName.trim().replace(/\s+/g, "_") + (newDocName.endsWith(".pdf") ? "" : ".pdf");
    const newDoc: AttachedDoc = {
      id: `custom_${Date.now()}`,
      fileName: safeName,
      title: newDocName.trim(),
      description: "Dokumen lampiran pendukung khusus yang diminta buyer",
      size: "85 KB",
      badge: "Lampiran Tambahan",
    };
    setCustomAttachments((prev) => [...prev, newDoc]);
    setSelectedAttachments((prev) => [...prev, safeName]);
    setNewDocName("");
    setShowAddDocForm(false);
    toast.success(`Dokumen "${safeName}" berhasil ditambahkan sebagai lampiran`);
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
        refNum,
        formattedDate,
        attachmentsList: selectedAttachments,
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
      refNum,
      formattedDate,
      selectedAttachments,
    ],
  );

  // Active Subject & Body (fallback to generatedCopy if not edited)
  const activeSubject = editableSubject || generatedCopy.subject;
  const activeBody = editableBody || generatedCopy.body;

  const handleCopyDraft = async () => {
    try {
      await navigator.clipboard.writeText(`Subject: ${activeSubject}\n\n${activeBody}`);
      toast.success("Draf Surat Penawaran & Lampiran Berhasil Disalin!");
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

  const handleOpenReviewModal = () => {
    if (!editableSubject) setEditableSubject(generatedCopy.subject);
    if (!editableBody) setEditableBody(generatedCopy.body);
    setIsReviewModalOpen(true);
  };

  const handlePrintOrDownloadPDF = () => {
    window.print();
    toast.success("Membuka dialog cetak / Simpan sebagai PDF resmi");
  };

  const mailtoUrl = `mailto:${encodeURIComponent(prospectEmail)}?subject=${encodeURIComponent(
    activeSubject,
  )}&body=${encodeURIComponent(activeBody)}`;

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
            Penyusunan surat penawaran harga resmi ({shipment.incoterm}), pengelolaan berkas lampiran, dan verifikasi profil calon importir.
          </p>
          <div className="ef-hero-actions">
            <button
              type="button"
              className="ef-hero-btn-primary"
              onClick={handleOpenReviewModal}
              title="Review surat resmi berkop sebelum dikirim ke buyer"
            >
              <Eye size={14} /> Review Surat Resmi
            </button>
            <button type="button" className="ef-hero-btn-ghost" onClick={handleCopyDraft}>
              <Copy size={14} /> Salin Surat
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
              {shipment.incoterm} · {shipment.quantity > 0 ? shipment.quantity.toLocaleString("en-US") : "19.2"} {shipment.unit || "MT"}
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
              <h3>Draf Surat Penawaran &amp; Dokumen</h3>
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
                placeholder="Nama perusahaan importir (e.g. Al-Mansoor Coffee Roastery)"
                value={prospectCompany}
                onChange={(e) => updateDraft({ prospectCompany: e.target.value })}
              />
            </label>
            <label>
              <span>Negara / Pelabuhan Tujuan</span>
              <input
                type="text"
                placeholder="Negara / pelabuhan (e.g. Jeddah Port, Saudi Arabia)"
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
                placeholder="Ketentuan sampel, MOQ, packing khusus GrainPro"
                value={customNotes}
                onChange={(e) => updateDraft({ customNotes: e.target.value })}
              />
            </label>
          </div>

          {/* Controls: Jenis Surat & Format Bahasa */}
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
                    onClick={() => {
                      updateDraft({ docType: item.id });
                      setEditableSubject("");
                      setEditableBody("");
                    }}
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
                    onClick={() => {
                      updateDraft({ tone: item.id });
                      setEditableSubject("");
                      setEditableBody("");
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Letter Preview Box */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid var(--line-strong)",
              borderRadius: "var(--radius)",
              padding: 16,
              marginTop: 14,
            }}
          >
            {/* Header Subject Strip */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 12,
                paddingBottom: 12,
                borderBottom: "1px solid var(--line)",
                marginBottom: 12,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", marginBottom: 2 }}>
                  Subjek Surat ({docType.toUpperCase()} · {tone.toUpperCase()})
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", lineHeight: 1.4 }}>
                  {activeSubject}
                </div>
              </div>
              <StatusPill tone="green">Siap Kirim</StatusPill>
            </div>

            {/* Letter Body Preview */}
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
                maxHeight: 280,
                overflowY: "auto",
              }}
            >
              {activeBody}
            </pre>

            {/* Action Bar */}
            <div
              className="row-actions"
              style={{
                marginTop: 14,
                paddingTop: 12,
                borderTop: "1px solid var(--line)",
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <button
                type="button"
                className="space-btn-primary"
                onClick={handleOpenReviewModal}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "#0F172A",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 8,
                  padding: "7px 14px",
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Eye size={14} /> Review Surat Resmi
              </button>

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

              <button
                type="button"
                className="ghost-button"
                onClick={handlePrintOrDownloadPDF}
                title="Cetak atau Unduh Dokumen Surat sebagai PDF"
              >
                <Printer size={14} /> Cetak / PDF
              </button>
            </div>
          </div>

          {/* Section: Lampiran Berkas Surat Asli (Attachments Manager) */}
          <div
            style={{
              marginTop: 18,
              background: "#FFFFFF",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius)",
              padding: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <div>
                <span className="eyebrow" style={{ display: "block", marginBottom: 2 }}>
                  Berkas resmi &amp; penawaran
                </span>
                <h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>
                  Dokumen Lampiran Surat Asli ({selectedAttachments.length} Terlampir)
                </h4>
              </div>

              <button
                type="button"
                onClick={() => setShowAddDocForm((prev) => !prev)}
                style={{
                  background: "transparent",
                  border: "1px solid #CBD5E1",
                  borderRadius: 6,
                  padding: "5px 10px",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#2563EB",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  cursor: "pointer",
                }}
              >
                <Plus size={13} /> Tambah Lampiran Khusus
              </button>
            </div>

            {/* Quick add custom attachment form */}
            {showAddDocForm && (
              <div
                style={{
                  background: "#F8FAFC",
                  border: "1px dashed #CBD5E1",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 12,
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <input
                  type="text"
                  placeholder="Nama berkas lampiran (e.g. Certificate_of_Analysis_SGS.pdf)"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  style={{
                    flex: 1,
                    fontSize: 12.5,
                    padding: "6px 10px",
                    borderRadius: 6,
                    border: "1px solid #CBD5E1",
                    background: "#FFFFFF",
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddCustomDoc();
                  }}
                />
                <button
                  type="button"
                  className="space-btn-primary"
                  onClick={handleAddCustomDoc}
                  style={{
                    background: "#0F172A",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 6,
                    padding: "6px 12px",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Lampirkan
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddDocForm(false)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#64748B",
                    cursor: "pointer",
                    padding: 4,
                  }}
                >
                  <X size={15} />
                </button>
              </div>
            )}

            {/* List of attachments with toggles */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {allAvailableDocs.map((doc) => {
                const isAttached = selectedAttachments.includes(doc.fileName);
                return (
                  <div
                    key={doc.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "10px 12px",
                      background: isAttached ? "#F8FAFC" : "#FFFFFF",
                      border: isAttached ? "1px solid #94A3B8" : "1px solid #E2E8F0",
                      borderRadius: 8,
                      transition: "all 0.15s ease",
                    }}
                  >
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        cursor: "pointer",
                        flex: 1,
                        margin: 0,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isAttached}
                        onChange={() => toggleAttachment(doc.fileName)}
                        style={{ cursor: "pointer", width: 16, height: 16 }}
                      />
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 6,
                            background: isAttached ? "#EFF6FF" : "#F1F5F9",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: isAttached ? "#2563EB" : "#64748B",
                            flexShrink: 0,
                          }}
                        >
                          <Paperclip size={16} />
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                            <strong style={{ fontSize: 12.5, color: "#0F172A" }}>{doc.fileName}</strong>
                            <span
                              style={{
                                fontSize: 10.5,
                                fontWeight: 600,
                                color: "#059669",
                                background: "#ECFDF5",
                                border: "1px solid #A7F3D0",
                                padding: "1px 6px",
                                borderRadius: 4,
                              }}
                            >
                              {doc.badge}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: 11.5, color: "#64748B", lineHeight: 1.4 }}>
                            {doc.title} · {doc.size}
                          </p>
                        </div>
                      </div>
                    </label>

                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <button
                        type="button"
                        onClick={handleOpenReviewModal}
                        title="Tinjau isi dokumen surat"
                        style={{
                          background: "#FFFFFF",
                          border: "1px solid #CBD5E1",
                          borderRadius: 6,
                          padding: "5px 9px",
                          fontSize: 11.5,
                          fontWeight: 500,
                          color: "#334155",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Eye size={12} /> Tinjau
                      </button>

                      <button
                        type="button"
                        onClick={handlePrintOrDownloadPDF}
                        title="Unduh dokumen lampiran asli"
                        style={{
                          background: "#F1F5F9",
                          border: "1px solid #E2E8F0",
                          borderRadius: 6,
                          padding: "5px 9px",
                          fontSize: 11.5,
                          fontWeight: 500,
                          color: "#0F172A",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Download size={12} /> Unduh
                      </button>
                    </div>
                  </div>
                );
              })}
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

      {/* ========================================================= */}
      {/* MODAL REVIEW SURAT RESMI PRA-TRANSAKSI (KOP SURAT EKSPOR) */}
      {/* ========================================================= */}
      {isReviewModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => setIsReviewModalOpen(false)}
          style={{ zIndex: 9999 }}
        >
          <div
            className="clean-po-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 840, width: "95vw", maxHeight: "92vh" }}
          >
            {/* Modal Header */}
            <div className="clean-po-header" style={{ padding: "16px 20px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span className="clean-po-badge">
                    <ShieldCheck size={12} />
                    {docType === "inquiry" ? "Surat Pengenalan Suplai" : docType === "negotiation" ? "Surat Negosiasi & Ketentuan" : "Surat Penawaran Harga Resmi"}
                  </span>
                  <span style={{ fontSize: 11, color: "#64748B" }}>Ref: {refNum}</span>
                </div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0F172A" }}>
                  Tinjau Surat Resmi Sebelum Dikirim
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748B" }}>
                  Periksa format kop surat eksportir, rincian kuantitas, harga, terms pembayaran, dan lampiran berkas asli.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                style={{
                  background: "#F1F5F9",
                  border: "none",
                  borderRadius: 6,
                  padding: 6,
                  cursor: "pointer",
                  color: "#64748B",
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal View Selector Tabs */}
            <div
              style={{
                display: "flex",
                background: "#F8FAFC",
                borderBottom: "1px solid #E2E8F0",
                padding: "6px 20px 0",
                gap: 8,
              }}
            >
              <button
                type="button"
                onClick={() => setReviewTab("letterhead")}
                style={{
                  border: "none",
                  background: reviewTab === "letterhead" ? "#FFFFFF" : "transparent",
                  borderBottom: reviewTab === "letterhead" ? "2px solid #0F172A" : "2px solid transparent",
                  fontWeight: reviewTab === "letterhead" ? 700 : 500,
                  color: reviewTab === "letterhead" ? "#0F172A" : "#64748B",
                  padding: "8px 14px",
                  fontSize: 12.5,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <FileText size={14} /> Pratinjau Kop Surat Resmi
              </button>

              <button
                type="button"
                onClick={() => setReviewTab("editor")}
                style={{
                  border: "none",
                  background: reviewTab === "editor" ? "#FFFFFF" : "transparent",
                  borderBottom: reviewTab === "editor" ? "2px solid #0F172A" : "2px solid transparent",
                  fontWeight: reviewTab === "editor" ? 700 : 500,
                  color: reviewTab === "editor" ? "#0F172A" : "#64748B",
                  padding: "8px 14px",
                  fontSize: 12.5,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Edit3 size={14} /> Editor Teks &amp; Kustomisasi
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: 20, background: "#F1F5F9" }}>
              {reviewTab === "letterhead" ? (
                /* ======================================================== */
                /* OFFICIAL PRINTABLE EXPORTER LETTERHEAD VIEW              */
                /* ======================================================== */
                <div
                  className="official-letterhead-card"
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #CBD5E1",
                    borderRadius: 8,
                    padding: "36px 42px",
                    maxWidth: 720,
                    margin: "0 auto",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                    fontFamily: "var(--font-sans)",
                    color: "#0F172A",
                  }}
                >
                  {/* Kop Surat Header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 16,
                      paddingBottom: 14,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 8,
                          background: "#0F172A",
                          color: "#F8FAFC",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 800,
                          fontSize: 20,
                          letterSpacing: "0.05em",
                        }}
                      >
                        EF
                      </div>
                      <div>
                        <h2
                          style={{
                            margin: 0,
                            fontSize: 17,
                            fontWeight: 800,
                            color: "#0F172A",
                            letterSpacing: "0.02em",
                          }}
                        >
                          {shipment.exporter || "PT NUSANTARA EKSPOR MANDIRI"}
                        </h2>
                        <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "#475569" }}>
                          Export &amp; International Trade Division · General Exporter License
                        </p>
                        <p style={{ margin: "2px 0 0", fontSize: 10.5, color: "#64748B" }}>
                          NIB: 0220108920194 | NPWP: 81.394.201.8-013.000 | Bea Cukai Reg: 0092/BC/2026
                        </p>
                      </div>
                    </div>

                    <div style={{ textAlign: "right", fontSize: 10.5, color: "#64748B", lineHeight: 1.4 }}>
                      <div>Menara Batavia Lt. 18, Jakarta Pusat</div>
                      <div>DKI Jakarta 10220, Indonesia</div>
                      <div>Tel: +62 21 5790 8820</div>
                      <div style={{ color: "#2563EB", fontWeight: 500 }}>trade@nusantaraekspor.com</div>
                    </div>
                  </div>

                  {/* Double Line Kop Surat */}
                  <div
                    style={{
                      borderTop: "3px double #0F172A",
                      marginBottom: 20,
                    }}
                  />

                  {/* Reference & Metadata Grid */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                      fontSize: 12,
                      marginBottom: 20,
                      background: "#F8FAFC",
                      padding: "10px 14px",
                      borderRadius: 6,
                      border: "1px solid #E2E8F0",
                    }}
                  >
                    <div>
                      <div>
                        <span style={{ color: "#64748B" }}>Nomor Surat: </span>
                        <strong>{refNum}</strong>
                      </div>
                      <div style={{ marginTop: 3 }}>
                        <span style={{ color: "#64748B" }}>Tanggal: </span>
                        <strong>{formattedDate}</strong>
                      </div>
                      <div style={{ marginTop: 3 }}>
                        <span style={{ color: "#64748B" }}>Lampiran: </span>
                        <strong>{selectedAttachments.length} Berkas Dokumen (PDF)</strong>
                      </div>
                    </div>

                    <div>
                      <div>
                        <span style={{ color: "#64748B" }}>Kepada Yth: </span>
                        <strong>{prospectCompany || "Purchasing Directorate"}</strong>
                      </div>
                      <div style={{ marginTop: 3 }}>
                        <span style={{ color: "#64748B" }}>Negara Tujuan: </span>
                        <strong>{prospectCountry || shipment.destination || "Destination Port"}</strong>
                      </div>
                      <div style={{ marginTop: 3 }}>
                        <span style={{ color: "#64748B" }}>Email Kontak: </span>
                        <span>{prospectEmail || "procurement@buyer.com"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Subject Line */}
                  <div
                    style={{
                      padding: "10px 14px",
                      background: "#EFF6FF",
                      borderLeft: "4px solid #2563EB",
                      marginBottom: 18,
                      borderRadius: "0 6px 6px 0",
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#1D4ED8", textTransform: "uppercase" }}>
                      Perihal / Subject:
                    </span>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginTop: 2 }}>
                      {activeSubject}
                    </div>
                  </div>

                  {/* Formatted Letter Body */}
                  <pre
                    style={{
                      whiteSpace: "pre-wrap",
                      fontFamily: "var(--font-sans)",
                      fontSize: 12,
                      lineHeight: 1.7,
                      color: "#1E293B",
                      background: "transparent",
                      border: 0,
                      padding: 0,
                      margin: "0 0 24px 0",
                    }}
                  >
                    {activeBody}
                  </pre>

                  {/* Official Signature & Digital Seal Block */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-end",
                      justifyContent: "space-between",
                      marginTop: 32,
                      paddingTop: 16,
                      borderTop: "1px solid #E2E8F0",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 11.5, color: "#475569", marginBottom: 6 }}>
                        Hormat kami / Yours faithfully,
                      </div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A" }}>
                        {shipment.exporter || "PT Nusantara Ekspor Mandiri"}
                      </div>

                      {/* Digital Seal Stamp Graphic */}
                      <div
                        style={{
                          margin: "10px 0",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "6px 12px",
                          border: "1.5px solid #2563EB",
                          borderRadius: 8,
                          color: "#1D4ED8",
                          background: "#EFF6FF",
                        }}
                      >
                        <ShieldCheck size={18} />
                        <div>
                          <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: "0.05em" }}>
                            VERIFIED DIGITAL SEAL
                          </div>
                          <div style={{ fontSize: 8.5, color: "#2563EB" }}>
                            PT NUSANTARA EKSPOR MANDIRI · EXPORT OPERATIONS
                          </div>
                        </div>
                      </div>

                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
                        {shipment.signatoryName || "Muhajirin Fatona"}
                      </div>
                      <div style={{ fontSize: 11, color: "#64748B" }}>
                        Director of Commercial Operations &amp; Export
                      </div>
                    </div>

                    {/* Attached files summary */}
                    <div style={{ textAlign: "right", maxWidth: 280 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>
                        DOKUMEN LAMPIRAN TERVERIFIKASI:
                      </div>
                      {selectedAttachments.map((att, idx) => (
                        <div key={idx} style={{ fontSize: 10.5, color: "#334155", marginBottom: 2 }}>
                          📎 {att}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* ======================================================== */
                /* TAB 2: EDIT TEXT & CUSTOMIZATION                         */
                /* ======================================================== */
                <div style={{ background: "#FFFFFF", padding: 20, borderRadius: 8, border: "1px solid #CBD5E1" }}>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#0F172A", marginBottom: 4 }}>
                      Edit Subjek Surat:
                    </label>
                    <input
                      type="text"
                      value={activeSubject}
                      onChange={(e) => setEditableSubject(e.target.value)}
                      style={{
                        width: "100%",
                        fontSize: 13,
                        fontWeight: 600,
                        padding: "8px 12px",
                        border: "1px solid #CBD5E1",
                        borderRadius: 6,
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>
                        Edit Isi Surat (Body):
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setEditableSubject(generatedCopy.subject);
                          setEditableBody(generatedCopy.body);
                          toast.success("Teks dikembalikan ke draf template standar");
                        }}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#2563EB",
                          fontSize: 11.5,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <RefreshCw size={12} /> Reset ke Template Standar
                      </button>
                    </div>
                    <textarea
                      rows={14}
                      value={activeBody}
                      onChange={(e) => setEditableBody(e.target.value)}
                      style={{
                        width: "100%",
                        fontSize: 12.5,
                        fontFamily: "var(--font-sans)",
                        lineHeight: 1.6,
                        padding: "10px 12px",
                        border: "1px solid #CBD5E1",
                        borderRadius: 6,
                        resize: "vertical",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Bar */}
            <div
              style={{
                padding: "12px 20px",
                background: "#FFFFFF",
                borderTop: "1px solid #E2E8F0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div style={{ fontSize: 12, color: "#64748B" }}>
                <span>Lampiran aktif: </span>
                <strong style={{ color: "#0F172A" }}>{selectedAttachments.length} berkas</strong>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="space-btn-secondary"
                  onClick={handlePrintOrDownloadPDF}
                  style={{
                    background: "#F1F5F9",
                    border: "1px solid #CBD5E1",
                    borderRadius: 6,
                    padding: "7px 14px",
                    fontSize: 12.5,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Printer size={14} /> Cetak / Unduh PDF
                </button>

                <button
                  type="button"
                  className="space-btn-secondary"
                  onClick={handleCopyDraft}
                  style={{
                    background: "#F1F5F9",
                    border: "1px solid #CBD5E1",
                    borderRadius: 6,
                    padding: "7px 14px",
                    fontSize: 12.5,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Copy size={14} /> Salin Teks
                </button>

                <a
                  href={mailtoUrl}
                  style={{
                    textDecoration: "none",
                    background: "#0F172A",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 6,
                    padding: "7px 16px",
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Send size={14} /> Buka di Email
                </a>

                <button
                  type="button"
                  className="space-btn-secondary"
                  onClick={() => setIsReviewModalOpen(false)}
                  style={{
                    background: "transparent",
                    border: "1px solid #CBD5E1",
                    borderRadius: 6,
                    padding: "7px 12px",
                    fontSize: 12.5,
                    cursor: "pointer",
                  }}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
