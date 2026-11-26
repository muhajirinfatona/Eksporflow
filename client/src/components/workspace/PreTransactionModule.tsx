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
  Eye,
  FileText,
  Mail,
  Paperclip,
  Printer,
  RefreshCw,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useMemo, useRef, useState, useEffect } from "react";
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

interface AttachedFileItem {
  id: string;
  name: string;
  size: string;
}

interface DraftParams {
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
  formattedDateId: string;
  formattedDateEn: string;
  attachmentsList: string[];
}

// =========================================================================
// 1. DRAF DALAM BAHASA INDONESIA (UNTUK REVIEW & EDIT LANGSUNG)
// =========================================================================
function buildDraftCopyId(params: DraftParams): { subject: string; body: string } {
  const buyer = params.companyName || "Divisi Pengadaan Buyer";
  const countrySuffix = params.country ? ` (${params.country})` : "";
  const exporter = (params.exporter || "PT Nusantara Ekspor Mandiri").replace(/\s*\(Demo\)/gi, "").trim();
  const signatory = (params.signatory || "Manajer Penjualan Ekspor").replace(/\s*\(Demo\)/gi, "").trim();
  const product = params.product || "Kopi Arabika Gayo Grade 1";
  const hsRaw = params.hsCode || "0901.11.10";
  const hs = hsRaw ? ` (HS Code: ${hsRaw})` : "";
  const route = params.destination || "Pelabuhan Tujuan";
  const notesBlock = params.customNotes ? `\n\nCATATAN KHUSUS & KETENTUAN TAMBAHAN:\n${params.customNotes}` : "";

  const volStr =
    params.quantity > 0
      ? `${params.quantity.toLocaleString("id-ID")} ${params.unit || "MT"} (Est. 1 x 20' FCL)`
      : `19.2 MT (1 x 20' FCL / 320 Karung Goni @60kg)`;

  const unitPrice =
    params.quantity > 0
      ? formatMoney(Math.round(parseFloat(params.offerValue.replace(/[^0-9.]/g, "") || "24590") / params.quantity), "USD")
      : "$1,280 / MT";

  const attachmentSection =
    params.attachmentsList.length > 0
      ? `\n\nLAMPIRAN DOKUMEN RESMI:\n${params.attachmentsList.map((att, i) => `${i + 1}. ${att}`).join("\n")}`
      : "";

  // 1. INQUIRY
  if (params.docType === "inquiry") {
    if (params.tone === "formal") {
      const subject = `[SURAT MINAT RESMI EKSPOR] Pengenalan & Penawaran Pasokan Komersial: ${product}${hs} — ${exporter}`;
      const body = `NOMOR SURAT: ${params.refNum}
TANGGAL: ${params.formattedDateId}

KEPADA YTH: Pimpinan Divisi Pengadaan & Sourcing Global
            ${buyer}${countrySuffix}
DARI: Divisi Penjualan Ekspor & Perdagangan Internasional, ${exporter}
PERIHAL: ${subject}

Dengan hormat,

Atas nama ${exporter}, eksportir berizin dan terdaftar resmi di Indonesia (NIB & Terdaftar Kepabeanan DJBC), kami bermaksud memperkenalkan perusahaan kami sebagai pemasok komersial terakreditasi untuk komoditas ekspor ${product}${hs}.

Kami menerapkan standar mutu ekspor internasional dan protokol fitosanitari secara ketat, dengan kapasitas pasokan reguler sebesar ${volStr} per siklus pengapalan serta ketertelusuran rantai pasok penuh.

PARAMETER UTAMA PASOKAN & KESEPAKATAN:
1. Komoditas & Grade: ${product}${hs}
2. Kapasitas Pengapalan: ${volStr}
3. Indikasi Basis Penyerahan: ${params.incoterm} (${route})
4. Pelabuhan Muat Asal: Pelabuhan Utama Indonesia (Tanjung Priok / Tanjung Perak / Belawan)
5. Kepatuhan Mutu: Fitosanitari, Certificate of Origin (e-SKA), dan standar jaminan mutu internasional.${notesBlock}

Apabila divisi pengadaan Anda sedang mengevaluasi pemasok komoditas terpercaya dari Indonesia, kami siap mengirimkan spesifikasi teknis lengkap, lembar hasil uji lab, serta sampel produk resmi.${attachmentSection}

Atas perhatian dan kesempatan kerja sama yang baik ini, kami ucapkan terima kasih.

Hormat kami,
${signatory}
Divisi Penjualan Ekspor
${exporter}
Republik Indonesia`;
      return { subject, body };
    }

    if (params.tone === "semi_formal") {
      const subject = `[PENGENALAN PASOKAN EKSPOR] Peluang Suplai Komersial: ${product} — ${exporter}`;
      const body = `Kepada Yth. Tim Pengadaan di ${buyer}${countrySuffix},

Semoga surat ini menjumpai Anda dalam keadaan baik. Kami dari ${exporter}, eksportir berizin dari Indonesia, ingin memperkenalkan pasokan komoditas ekspor unggulan kami: ${product}${hs}.

Kami dapat menyediakan pengapalan komersial secara rutin (${volStr}) dengan dokumen ekspor lengkap, termasuk Sertifikat Fitosanitari, Certificate of Origin (e-SKA), dan sertifikat mutu surveyor independen.

• Komoditas: ${product}${hs}
• Kapasitas Pasokan: ${volStr}
• Basis Penyerahan: ${params.incoterm} (${route})
• Pelabuhan Muat: Pelabuhan Utama Indonesia${notesBlock}

Bila Anda berminat meninjau profil penawaran atau membutuhkan sampel awal, silakan beri tahu kami agar segera kami siapkan.${attachmentSection}

Salam hormat,
${signatory}
${exporter}`;
      return { subject, body };
    }

    const subject = `[PENAWARAN AWAL EKSPOR] Pasokan ${product} (${volStr}) — ${exporter}`;
    const body = `Halo Tim Pengadaan ${buyer},

Berikut rangkuman kapasitas pasokan komoditas ekspor dari ${exporter}:
• Produk: ${product}${hs}
• Kuantitas: ${volStr}
• Basis Penyerahan: ${params.incoterm} (${route})
• Legalitas: Terdaftar NIB & Bea Cukai RI (Fito, e-SKA Ready)${notesBlock}${attachmentSection}

Silakan konfirmasi bila Anda membutuhkan lembar spesifikasi mutu atau draf penawaran harga resmi.

Terima kasih,
${signatory} — ${exporter}`;
    return { subject, body };
  }

  // 2. QUOTATION
  if (params.docType === "quotation") {
    if (params.tone === "formal") {
      const subject = `[SURAT PENAWARAN HARGA RESMI] Penawaran Ekspor: ${product} (${params.incoterm} ${route}) — Ref: ${params.refNum}`;
      const body = `NOMOR SURAT: ${params.refNum}
TANGGAL: ${params.formattedDateId}
MASA BERLAKU: 14 Hari Kalender sejak Tanggal Penerbitan

KEPADA YTH: Divisi Pengadaan & Komersial
            ${buyer}${countrySuffix}
DARI: Meja Penetapan Harga Ekspor & Komersial, ${exporter}
PERIHAL: ${subject}

Dengan hormat,

Terima kasih atas permintaan informasi dan ketertarikan pihak Anda terhadap komoditas ${product}. Atas nama ${exporter}, dengan ini kami menyampaikan penawaran harga komersial resmi dengan rincian parameter kesepakatan sebagai berikut:

1. RINGKASAN PENAWARAN KOMERSIAL:
• Komoditas: ${product}${hs}
• Kuantitas Pesanan: ${volStr}
• Ketentuan Penyerahan: ${params.incoterm} (${route})
• Indikasi Harga Satuan: ${unitPrice}
• Total Nilai Penawaran: ${params.offerValue}

2. KETENTUAN PEMBAYARAN & PROTEKSI DEVISA:
• Struktur Pembayaran: ${params.paymentTerms || "30% Uang Muka (DP) via T/T saat Sales Contract ditandatangani; 70% Pelunasan terhadap salinan dokumen resmi (Draft B/L, Commercial Invoice, Packing List, Certificate of Origin, dan Phyto)"}.
• Alternatif Pembayaran: Irrevocable Documentary Letter of Credit (L/C at sight) yang diterbitkan bank internasional terakreditasi.

3. SPESIFIKASI MUTU & KELENGKAPAN DOKUMEN:
• Standar Kemasan: Standar kemaritiman internasional ekspor.
• Dokumen yang Disertakan: Bill of Lading (B/L), Commercial Invoice, Packing List, Certificate of Origin (e-SKA), Sertifikat Fitosanitari & Fumigasi, dan Certificate of Analysis / Mutu.${notesBlock}

4. KONFIRMASI PEMESANAN:
Untuk menyetujui penawaran ini atau melanjutkan ke penerbitan Proforma Invoice (PI) / Sales Contract, silakan membalas surat ini atau menghubungi kami secara langsung.${attachmentSection}

Atas kerja sama yang terjalin dengan baik, kami ucapkan terima kasih.

Hormat kami,
${signatory}
Manajer Komersial Ekspor
${exporter}`;
      return { subject, body };
    }

    if (params.tone === "semi_formal") {
      const subject = `[PENAWARAN HARGA EKSPOR] Penawaran Komersial: ${product} (${params.incoterm} ${route}) — Ref: ${params.refNum}`;
      const body = `Kepada Yth. Tim Pengadaan di ${buyer}${countrySuffix},

Merujuk pada komunikasi kita mengenai pengadaan ${product}, kami dari ${exporter} dengan senang hati menyampaikan penawaran harga resmi sebagai berikut:

• Produk: ${product}${hs}
• Volume: ${volStr}
• Nilai Penawaran: ${params.offerValue} (${params.incoterm} ${route})
• Syarat Pembayaran: ${params.paymentTerms || "30% DP T/T, 70% Pelunasan terhadap salinan B/L"}
• Dokumen Resmi: B/L, Invoice, Packing List, e-SKA, Sertifikat Fitosanitari.${notesBlock}

Penawaran ini berlaku selama 14 hari kalender. Kami menyertakan dokumen pendukung resmi di bawah ini untuk ditinjau oleh tim Anda.${attachmentSection}

Bila ada detail yang perlu disesuaikan, kami siap berdiskusi lebih lanjut.

Salam hangat,
${signatory}
${exporter}`;
      return { subject, body };
    }

    const subject = `[QUOTATION RINGKAS] ${product} (${volStr}) — ${params.incoterm} ${route}`;
    const body = `Halo Tim Pengadaan ${buyer},

Berikut rincian penawaran harga ekspor untuk ${product}:
• Kuantitas: ${volStr}
• Harga Penawaran: ${params.offerValue} (${params.incoterm} ${route})
• Ketentuan Pembayaran: ${params.paymentTerms || "DP 30% T/T, Pelunasan 70% saat B/L terbit"}
• Legalitas Dokumen: Lengkap (Fito, e-SKA, Surveyor Certificate)${notesBlock}${attachmentSection}

Bila disetujui, kami dapat langsung menerbitkan Proforma Invoice (PI) untuk finalisasi.

Terima kasih,
${signatory} — ${exporter}`;
    return { subject, body };
  }

  // 3. NEGOTIATION
  if (params.tone === "formal") {
    const subject = `[SURAT NEGOSIASI KOMERSIAL] Penyelarasan Ketentuan & Finalisasi Kontrak: ${product} — Ref: ${params.refNum}`;
    const body = `NOMOR SURAT: ${params.refNum}
TANGGAL: ${params.formattedDateId}

KEPADA YTH: Direksi Pengadaan & Komersial
            ${buyer}${countrySuffix}
DARI: Meja Negosiasi Ekspor, ${exporter}
PERIHAL: ${subject}

Dengan hormat,

Kami telah menerima dan mempelajari catatan korespondensi dari pihak Anda terkait penawaran komoditas ${product} (${volStr}, basis ${params.incoterm} ${route} dengan nilai penawaran ${params.offerValue}).

Demi terwujudnya kemitraan dagang yang saling menguntungkan dalam jangka panjang, manajemen kami mengusulkan kerangka kesepakatan yang diselaraskan sebagai berikut:

1. STRUKTUR HARGA & KETENTUAN PENYERAHAN:
• Opsi Utama: Mempertahankan basis ${params.incoterm} (${route}) dengan nilai kesepakatan ${params.offerValue}.
• Alternatif Penyesuaian: Penawaran ulang berbasis FOB Pelabuhan Utama Indonesia bila pihak Anda menghendaki pengelolaan kapal kargo mandiri.

2. KEAMANAN PEMBAYARAN & PROTEKSI ARUS KAS:
• Struktur yang Disepakati: 30% Uang Muka (DP) saat penandatanganan Sales Contract; 70% Pelunasan terhadap salinan dokumen pengapalan lengkap (Draft B/L, Commercial Invoice, Packing List, dan Sertifikat Fitosanitari).
• Opsi Alternatif: Irrevocable Documentary L/C at Sight dari bank internasional terkemuka.

3. KETERTELUSURAN & PENGAWASAN SEBELUM PENGAPALAN:
• Pihak Anda dipersilakan menunjuk surveyor independen (SGS / Sucofindo) untuk melakukan inspeksi mutu dan timbang di gudang muat sebelum stuffing kontainer.${notesBlock}${attachmentSection}

Apabila klausul ini telah sesuai, kami akan segera menerbitkan Sales Contract & Proforma Invoice (PI) resmi untuk ditandatangani bersama.

Hormat kami,
${signatory}
Meja Negosiasi Dagang Ekspor
${exporter}`;
    return { subject, body };
  }

  if (params.tone === "semi_formal") {
    const subject = `[NEGOSIASI KONTRAK EKSPOR] Penyelarasan Syarat & Ketentuan: ${product} — Ref: ${params.refNum}`;
    const body = `Kepada Yth. Tim Pengadaan di ${buyer}${countrySuffix},

Terima kasih atas tanggapan dan masukan Anda terkait penawaran harga kami sebelumnya untuk ${product}.

Kami menghargai diskusi ini dan ingin menawarkan jalan tengah yang fleksibel agar transaksi ini dapat segera terealisasi:

1. Penyesuaian Harga/Volume: Nilai komersial ${params.offerValue} untuk kuantitas ${volStr} (${params.incoterm} ${route}).
2. Skema Pembayaran: DP 30% T/T untuk mengamankan slot kargo dan proses sertifikasi karantina; pelunasan 70% setelah salinan B/L resmi dikirimkan.
3. Jaminan Mutu: Dokumen analisis laboratorium dan inspeksi mutu independen sebelum pengapalan.${notesBlock}${attachmentSection}

Mohon konfirmasi kesesuaian poin di atas agar kami dapat menyiapkan dokumen kontrak final.

Salam hangat,
${signatory}
${exporter}`;
    return { subject, body };
  }

  const subject = `[PENYELARASAN SYARAT] Finalisasi Ketentuan Penyerahan & Pembayaran: ${product} — Ref: ${params.refNum}`;
  const body = `Halo Tim Pengadaan ${buyer},

Menindaklanjuti negosiasi terkait ${product} (${volStr}):
• Harga/Nilai Akhir: ${params.offerValue} (${params.incoterm} ${route})
• Pembayaran: DP 30% T/T, sisa 70% saat salinan B/L terbit
• Dokumen: Lengkap (e-SKA, Phyto, COA)${notesBlock}${attachmentSection}

Silakan beri konfirmasi agar Proforma Invoice (PI) dapat segera kami proses.

Terima kasih,
${signatory} — ${exporter}`;
  return { subject, body };
}

// =========================================================================
// 2. DRAF DALAM BAHASA INGGRIS (UNTUK PENGIRIMAN RESMI KE BUYER)
// =========================================================================
function buildDraftCopyEn(params: DraftParams): { subject: string; body: string } {
  const buyer = params.companyName || "Procurement Department";
  const countrySuffix = params.country ? ` (${params.country})` : "";
  const exporter = (params.exporter || "PT Nusantara Ekspor Mandiri").replace(/\s*\(Demo\)/gi, "").trim();
  const signatory = (params.signatory || "Export Sales Department").replace(/\s*\(Demo\)/gi, "").trim();
  const product = params.product || "Kopi Arabika Gayo Grade 1";
  const hsRaw = params.hsCode || "0901.11.10";
  const hs = hsRaw ? ` (HS Code: ${hsRaw})` : "";
  const route = params.destination || "Destination Port";
  const notesBlock = params.customNotes ? `\n\nSPECIAL NOTES & REQUIREMENTS:\n${params.customNotes}` : "";

  const volStr =
    params.quantity > 0
      ? `${params.quantity.toLocaleString("en-US")} ${params.unit || "MT"} (Approx. 1 x 20' FCL)`
      : `19.2 MT (1 x 20' FCL / 320 Jute Bags @60kg)`;

  const unitPrice =
    params.quantity > 0
      ? formatMoney(Math.round(parseFloat(params.offerValue.replace(/[^0-9.]/g, "") || "24590") / params.quantity), "USD")
      : "$1,280 / MT";

  const attachmentSection =
    params.attachmentsList.length > 0
      ? `\n\nENCLOSURES / ATTACHED DOCUMENTS:\n${params.attachmentsList.map((att, i) => `${i + 1}. ${att}`).join("\n")}`
      : "";

  if (params.docType === "inquiry") {
    if (params.tone === "formal") {
      const subject = `[OFFICIAL EXPORT INQUIRY] Introduction & Commercial Supply Presentation: ${product}${hs} — ${exporter}`;
      const body = `REF NO: ${params.refNum}
DATE: ${params.formattedDateEn}

TO: Head of Procurement & Global Sourcing
    ${buyer}${countrySuffix}
FROM: Export Sales & Trade Division, ${exporter}
SUBJECT: ${subject}

Dear Sir / Madam,

On behalf of ${exporter}, a licensed and registered Indonesian exporter (NIB & Customs Certified), we have the honor to introduce our company as an accredited commercial supplier of export-grade ${product}${hs}.

We operate under stringent international food safety and phytosanitary quality protocols, maintaining regular supply capacity of ${volStr} per shipping cycle with full traceability.

KEY SUPPLY PARAMETERS:
1. Commodity & Grade: ${product}${hs}
2. Commercial Volume: ${volStr}
3. Indicative Delivery Term: ${params.incoterm} (${route})
4. Origin Loading Port: Indonesian Main Port (Tanjung Priok / Tanjung Perak / Belawan)
5. Export Compliance: Phytosanitary Certificate, Certificate of Origin (e-SKA), and quality assurance.${notesBlock}

Should your desk be evaluating qualified Indonesian suppliers, we would be pleased to dispatch our technical specifications and lab analysis sheets.${attachmentSection}

We look forward to establishing a prosperous and enduring trade partnership.

Sincerely,
${signatory}
Export Sales Division
${exporter}
Republic of Indonesia`;
      return { subject, body };
    }

    if (params.tone === "semi_formal") {
      const subject = `[SUPPLY INTRODUCTION] Commercial Supply Opportunities: ${product} — ${exporter}`;
      const body = `Dear Purchasing Team at ${buyer}${countrySuffix},

We are pleased to introduce ${exporter}, an Indonesian exporter specializing in export-ready ${product}${hs}.

We supply consistent commercial shipments (${volStr}) with full export compliance, including Phytosanitary Certification, Certificate of Origin (e-SKA), and independent surveyor inspection.

Delivery Basis: ${params.incoterm} (${route})
Loading Port: Indonesian Main Port${notesBlock}

Should your desk be evaluating qualified Indonesian suppliers, we would be pleased to dispatch specifications and samples.${attachmentSection}

Best regards,
${signatory}
${exporter}`;
      return { subject, body };
    }

    const subject = `[INQUIRY / INTRODUCTION] ${product} Export Supply Specs & Capacity — ${exporter}`;
    const body = `Hi ${buyer} Sourcing Team,

Here is a brief overview of our export supply capabilities for ${product}:
• Commodity: ${product}${hs}
• Volume: ${volStr}
• Basis: ${params.incoterm} (${route})
• Compliance: Fully licensed exporter (Phyto, e-SKA COO Ready)${notesBlock}${attachmentSection}

Please let us know if you require technical spec sheets or sample dispatches.

Best regards,
${signatory} — ${exporter}`;
    return { subject, body };
  }

  if (params.docType === "quotation") {
    if (params.tone === "formal") {
      const subject = `[OFFICIAL COMMERCIAL QUOTATION] Formal Export Offer: ${product} (${params.incoterm} ${route}) — Ref: ${params.refNum}`;
      const body = `REF NO: ${params.refNum}
DATE: ${params.formattedDateEn}
VALIDITY: 14 Calendar Days from Date of Issuance

TO: Procurement & Commercial Division
    ${buyer}${countrySuffix}
FROM: Commercial & Export Pricing Desk, ${exporter}
SUBJECT: ${subject}

Dear Sir / Madam,

We thank you for your esteemed inquiry regarding ${product}. On behalf of ${exporter}, we have the pleasure to submit our formal commercial price quotation under the agreed parameters below:

1. COMMERCIAL OFFER SUMMARY:
• Product / Commodity: ${product}${hs}
• Order Volume: ${volStr}
• Delivery Basis: ${params.incoterm} (${route})
• Unit Price Indication: ${unitPrice}
• Total Commercial Offer Value: ${params.offerValue}

2. PAYMENT & DEVISEN PROTECTION TERMS:
• Payment Structure: ${params.paymentTerms || "30% Advance Down Payment upon Sales Contract; 70% Balance payable upon presentation of verified Draft B/L, Commercial Invoice, Packing List, Certificate of Origin, and Phytosanitary Certificate"}.
• Alternative Instrument: Irrevocable Documentary Letter of Credit (L/C at sight) issued by a top-tier prime international bank.

3. QUALITY STANDARD & DOCUMENTATION:
• Packaging: Standard maritime export packing.
• Enclosed Documents: Bill of Lading (B/L), Commercial Invoice, Packing List, Certificate of Origin (e-SKA), Phytosanitary & Fumigation Certificate, and Surveyor Certificate of Weight & Quality (SGS / Sucofindo).${notesBlock}

4. ORDER CONFIRMATION:
To confirm acceptance of this quotation or initiate a formal Proforma Invoice (PI), kindly endorse this document or contact our export desk.${attachmentSection}

We remain at your disposal for any clarifications.

Yours faithfully,
${signatory}
Commercial Export Manager
${exporter}`;
      return { subject, body };
    }

    if (params.tone === "semi_formal") {
      const subject = `[COMMERCIAL QUOTATION] Export Price Offer: ${product} (${params.incoterm} ${route}) — Ref: ${params.refNum}`;
      const body = `Dear Purchasing Team at ${buyer}${countrySuffix},

Thank you for your interest in our commodities. We are pleased to provide our formal commercial quotation for ${product} under the following parameters:

• Commodity: ${product}${hs}
• Order Volume: ${volStr}
• Total Offer: ${params.offerValue} (${params.incoterm} ${route})
• Payment Terms: ${params.paymentTerms || "30% Advance T/T, 70% Balance against B/L Copy"}
• Documentation: B/L, Commercial Invoice, Packing List, e-SKA (COO), Phytosanitary Certificate.${notesBlock}

This quotation remains valid for 14 calendar days. Please review the enclosed technical documents below.${attachmentSection}

Should you require adjustments to terms or volume, please let us know.

Best regards,
${signatory}
${exporter}`;
      return { subject, body };
    }

    const subject = `[PRICE QUOTATION] ${product} (${params.incoterm} ${route}) — Indicative Offer & Terms`;
    const body = `Dear ${buyer} Team,

Please find our export pricing for ${product}:
• Volume: ${volStr}
• Offer: ${params.offerValue} (${params.incoterm} ${route})
• Payment: ${params.paymentTerms || "30% DP T/T, 70% against B/L copy"}
• Documents: Full export compliance documentation included${notesBlock}${attachmentSection}

Upon your confirmation, we will promptly issue the formal Proforma Invoice (PI).

Best regards,
${signatory} — ${exporter}`;
    return { subject, body };
  }

  // negotiation
  if (params.tone === "formal") {
    const subject = `[COMMERCIAL NEGOTIATION] Terms Alignment & Contract Finalization: ${product} — Ref: ${params.refNum}`;
    const body = `REF NO: ${params.refNum}
DATE: ${params.formattedDateEn}

TO: Executive Procurement Directorate
    ${buyer}${countrySuffix}
FROM: Trade Negotiation Desk, ${exporter}
SUBJECT: ${subject}

Dear Sir / Madam,

We acknowledge receipt of your correspondence and notes concerning our previous quotation for ${product} (${volStr}, ${params.incoterm} ${route} at ${params.offerValue}).

In the interest of fostering a long-term mutually advantageous commercial alliance, our executive board has reviewed your requested terms and proposes the following aligned framework:

1. PRICING & INCOTERM STRUCTURE:
• Option A: Maintained at ${params.incoterm} (${route}) with consolidated ocean freight booking at ${params.offerValue}.
• Option B: Re-quoted at FOB Indonesian Main Port, granting your desk the flexibility to nominate your contracted ocean carrier.

2. PAYMENT SAFETY & CASH FLOW ALIGNMENT:
• Agreed Structure: 30% Advance Down Payment upon Sales Contract; 70% Balance payable upon presentation of verified Draft B/L, Commercial Invoice, and Phytosanitary Certificate prior to original surrender.
• Optional Instrument: Irrevocable Documentary Letter of Credit (L/C at sight) issued by a top-tier prime international bank.

3. TRANSPARENCY & PRE-SHIPMENT SUPERVISION:
• Your desk is warmly invited to deputize an independent inspection surveyor (SGS / Sucofindo) for pre-shipment sampling and container stuffing verification.${notesBlock}${attachmentSection}

Upon your concurrence, we shall immediately issue the bilateral Sales Contract and Proforma Invoice.

Respectfully yours,
${signatory}
Trade Negotiation Desk
${exporter}`;
    return { subject, body };
  }

  if (params.tone === "semi_formal") {
    const subject = `[TRADE NEGOTIATION] Counter-Offer & Flexible Terms: ${product} — Ref: ${params.refNum}`;
    const body = `Dear Purchasing Team at ${buyer}${countrySuffix},

Thank you for your feedback regarding our initial commercial quotation for ${product}.

We appreciate our partnership discussions and would like to propose a flexible middle ground to bring this shipment forward:

1. Pricing/Volume Alignment: ${params.offerValue} for ${volStr} under ${params.incoterm} (${route}).
2. Payment Terms: 30% T/T Advance to initiate production and secure shipping space; 70% balance upon transmission of the official B/L copy.
3. Quality Assurance: Full lab analysis and independent pre-shipment surveyor certification.${notesBlock}${attachmentSection}

Please review this proposal and let us know if we can proceed with issuing the draft Sales Contract.

Warm regards,
${signatory}
${exporter}`;
    return { subject, body };
  }

  const subject = `[TERMS ALIGNMENT] Final Payment & Delivery Terms: ${product} — Ref: ${params.refNum}`;
  const body = `Hi ${buyer} Procurement Team,

Following up on our negotiations for ${product} (${volStr}):
• Final Agreed Value: ${params.offerValue} (${params.incoterm} ${route})
• Payment: 30% DP T/T, 70% against B/L copy
• Compliance: Full export documentation (e-SKA, Phyto, COA)${notesBlock}${attachmentSection}

Kindly confirm your approval so we can finalize the Proforma Invoice (PI).

Best regards,
${signatory} — ${exporter}`;
  return { subject, body };
}

// =========================================================================
// MAIN PRE-TRANSACTION MODULE COMPONENT
// =========================================================================
export function PreTransactionModule({
  shipment,
  update,
  pricing,
  navigate,
}: PreTransactionModuleProps) {
  const draft = shipment.preTransactionData ?? {};
  const docType = draft.docType ?? "quotation";
  const tone = draft.tone ?? "formal";
  const prospectCompany = draft.prospectCompany ?? shipment.buyer ?? "";
  const prospectCountry = draft.prospectCountry ?? shipment.buyerCountry ?? "";
  const prospectEmail = draft.prospectEmail ?? shipment.buyerEmail ?? "";
  const customNotes = draft.customNotes ?? "";
  const checklist = draft.buyerVerifiedChecklist ?? [];

  // Active letter language tab: "id" (Indonesian review/edit) or "en" (English export send)
  const [letterLang, setLetterLang] = useState<"id" | "en">("id");
  const [isTranslated, setIsTranslated] = useState(false);

  // Custom user overrides for Indonesian draft
  const [customSubjectId, setCustomSubjectId] = useState<string>("");
  const [customBodyId, setCustomBodyId] = useState<string>("");

  // Custom user overrides for English draft
  const [customSubjectEn, setCustomSubjectEn] = useState<string>("");
  const [customBodyEn, setCustomBodyEn] = useState<string>("");

  // Native file input ref (Gmail-style attachment button)
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Attached files state (Gmail-style list)
  const [attachedFiles, setAttachedFiles] = useState<AttachedFileItem[]>([
    {
      id: "f_default_quo",
      name:
        docType === "inquiry"
          ? "Official_Export_Inquiry_INQ-2026.pdf"
          : docType === "negotiation"
          ? "Commercial_Negotiation_Agreement_NEG-2026.pdf"
          : "Official_Commercial_Quotation_QUO-2026.pdf",
      size: "168 KB",
    },
    {
      id: "f_default_spec",
      name: `Technical_Spec_Sheet_${(shipment.product || "Export_Commodity").replace(/\s+/g, "_")}.pdf`,
      size: "115 KB",
    },
    {
      id: "f_default_profile",
      name: "Company_Profile_PT_Nusantara_Ekspor_Mandiri.pdf",
      size: "240 KB",
    },
  ]);

  const formattedDateId = useMemo(() => {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());
  }, []);

  const formattedDateEn = useMemo(() => {
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

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: AttachedFileItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const sizeKb = Math.max(1, Math.round(f.size / 1024));
      const sizeStr = sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;
      newItems.push({
        id: `upload_${Date.now()}_${i}`,
        name: f.name,
        size: sizeStr,
      });
    }

    setAttachedFiles((prev) => [...prev, ...newItems]);
    toast.success(`${newItems.length} berkas berhasil dilampirkan`);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveFile = (id: string) => {
    setAttachedFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddPresetFile = (name: string, size: string) => {
    if (attachedFiles.some((f) => f.name === name)) {
      toast.info(`Berkas "${name}" sudah terlampir`);
      return;
    }
    setAttachedFiles((prev) => [...prev, { id: `preset_${Date.now()}`, name, size }]);
    toast.success(`Berkas "${name}" berhasil dilampirkan`);
  };

  const attachmentsList = useMemo(() => {
    return attachedFiles.map((f) => f.name);
  }, [attachedFiles]);

  const draftParams: DraftParams = useMemo(
    () => ({
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
      formattedDateId,
      formattedDateEn,
      attachmentsList,
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
      formattedDateId,
      formattedDateEn,
      attachmentsList,
    ]
  );

  const generatedCopyId = useMemo(() => buildDraftCopyId(draftParams), [draftParams]);
  const generatedCopyEn = useMemo(() => buildDraftCopyEn(draftParams), [draftParams]);

  // Active Subject & Body according to language and user overrides
  const activeSubjectId = customSubjectId || generatedCopyId.subject;
  const activeBodyId = customBodyId || generatedCopyId.body;

  const activeSubjectEn = customSubjectEn || generatedCopyEn.subject;
  const activeBodyEn = customBodyEn || generatedCopyEn.body;

  // Active content currently shown in the editor
  const currentSubject = letterLang === "id" ? activeSubjectId : activeSubjectEn;
  const currentBody = letterLang === "id" ? activeBodyId : activeBodyEn;

  // Simpan draf Bahasa Indonesia dan ubah ke Bahasa Inggris resmi ekspor
  const handleSaveAndChangeToEnglish = () => {
    const freshEn = buildDraftCopyEn(draftParams);
    setCustomSubjectEn(freshEn.subject);
    setCustomBodyEn(freshEn.body);
    setIsTranslated(true);
    setLetterLang("en");
    toast.success("Draf disimpan dan otomatis diubah ke Bahasa Inggris!");
  };

  const handleResetIndonesianDraft = () => {
    setCustomSubjectId("");
    setCustomBodyId("");
    toast.info("Draf Bahasa Indonesia dikembalikan ke format template awal.");
  };

  const handleCopyDraft = async () => {
    try {
      await navigator.clipboard.writeText(`Subject: ${currentSubject}\n\n${currentBody}`);
      toast.success(
        letterLang === "en"
          ? "Draf Surat Ekspor (Bahasa Inggris) Berhasil Disalin!"
          : "Draf Surat (Bahasa Indonesia) Berhasil Disalin!"
      );
    } catch {
      toast.error("Gagal menyalin ke clipboard.");
    }
  };

  const handleSyncToBuyer = () => {
    if (prospectCompany.trim()) update("buyer", prospectCompany.trim());
    if (prospectCountry.trim()) update("buyerCountry", prospectCountry.trim());
    if (prospectEmail.trim()) update("buyerEmail", prospectEmail.trim());
    toast.success("Data Buyer Disinkronkan ke Transaksi Aktif");
  };

  // Direktori Data Buyer Tersimpan (CRM Ekspor)
  const [savedBuyersList, setSavedBuyersList] = useState<{
    id: string;
    companyName: string;
    country: string;
    product: string;
    lastPoRef?: string;
    dealValue?: string;
    container?: string;
    status: string;
    savedAt: string;
    email?: string;
  }[]>(() => {
    try {
      const raw = localStorage.getItem("eksporflow_saved_buyers");
      if (raw) return JSON.parse(raw);
    } catch {}
    return [
      {
        id: "buyer-seed-1",
        companyName: "Al-Barakah Global Trading",
        country: "Uni Emirat Arab",
        product: "Briket Arang Kelapa",
        lastPoRef: "INQ-2026/DXB/03",
        dealValue: "$42,600",
        container: "2 × 40HC",
        status: "Kargo Diterima & Lunas",
        savedAt: "24 Nov 2026",
      },
      {
        id: "buyer-seed-2",
        companyName: "Hamburg Roasters B.V.",
        country: "Belanda",
        product: "Biji Kakao Fermentasi Sulawesi",
        lastPoRef: "PO-2026/DEU/12",
        dealValue: "$71,250",
        container: "1 × 40HC",
        status: "Kargo Diterima & Lunas",
        savedAt: "21 Nov 2026",
      },
      {
        id: "buyer-seed-3",
        companyName: "Marubeni Specialty Foods",
        country: "Jepang",
        product: "Kopi Arabika Gayo Grade 1",
        lastPoRef: "PO-2026/TYO/04",
        dealValue: "$112,000",
        container: "1 × 40HC",
        status: "Kargo Diterima & Lunas",
        savedAt: "19 Nov 2026",
      },
      {
        id: "buyer-seed-4",
        companyName: "Olam International Ltd",
        country: "Singapura",
        product: "Kayu Manis Korintje A",
        lastPoRef: "PO-2026/SIN/01",
        dealValue: "$55,000",
        container: "1 × 20GP",
        status: "Kargo Diterima & Lunas",
        savedAt: "10 Nov 2026",
      },
    ];
  });

  useEffect(() => {
    const handleSyncEvent = () => {
      try {
        const raw = localStorage.getItem("eksporflow_saved_buyers");
        if (raw) setSavedBuyersList(JSON.parse(raw));
      } catch {}
    };
    window.addEventListener("eksporflow_buyer_saved", handleSyncEvent);
    return () => window.removeEventListener("eksporflow_buyer_saved", handleSyncEvent);
  }, []);

  const handleSelectSavedBuyer = (buyerItem: any) => {
    updateDraft({
      prospectCompany: buyerItem.companyName,
      prospectCountry: buyerItem.country,
      prospectEmail: buyerItem.email || `procurement@${buyerItem.companyName.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
      customNotes: `Repeat order / follow up: ${buyerItem.product} (${buyerItem.container || "1 x 40HC"}). Ref PO kargo: ${buyerItem.lastPoRef || "-"}`,
    });
    if (update) {
      update("buyer", buyerItem.companyName);
      update("buyerCountry", buyerItem.country);
    }
    toast.success(`Data buyer ${buyerItem.companyName} (${buyerItem.country}) berhasil dimuat ke draf!`);
  };

  const handlePrintOrDownloadPDF = () => {
    window.print();
    toast.success("Membuka dialog cetak / Simpan sebagai PDF");
  };

  const mailtoUrl = `mailto:${encodeURIComponent(prospectEmail)}?subject=${encodeURIComponent(
    activeSubjectEn
  )}&body=${encodeURIComponent(activeBodyEn)}`;

  const verifiedCount = checklist.length;

  return (
    <div className="module-stack" style={{ gap: 16 }}>
      {/* Space DS Clean Module Hero */}
      <section className="ef-module-hero">
        <div className="ef-module-hero-copy">
          <span className="eyebrow" style={{ color: "var(--navy)" }}>
            Pra-transaksi &amp; buyer
          </span>
          <h2>Penawaran Ekspor &amp; Validasi Buyer</h2>
          <p className="lead">
            Review dan edit surat penawaran dalam Bahasa Indonesia, simpan untuk langsung diubah ke Bahasa Inggris resmi ekspor, dan verifikasi kepatuhan importir.
          </p>
          <div className="ef-hero-actions">
            <button type="button" className="ef-hero-btn-primary" onClick={handleCopyDraft}>
              <Copy size={14} /> Salin Surat ({letterLang.toUpperCase()})
            </button>
            <a href={mailtoUrl} className="ef-hero-btn-ghost">
              <Mail size={14} /> Buka di Email (EN)
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

      {/* Grid 2 Kolom: Kiri (Draf Editor) & Kanan (Checklist & Kepatuhan) */}
      <div className="content-grid pretrans-grid">
        {/* ======================================================== */}
        {/* KOLOM KIRI: FORMULIR PROSPEK & DRAF SURAT                */}
        {/* ======================================================== */}
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

          {/* Quick-fill from Saved Buyer Database (CRM Ekspor) */}
          <div
            style={{
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: 8,
              padding: "10px 12px",
              marginBottom: 14,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Building2 size={14} style={{ color: "#2563EB" }} />
                <strong style={{ fontSize: "12px", color: "#1E293B" }}>
                  Data Buyer Tersimpan ({savedBuyersList.length}) · Hasil Selesai Kargo
                </strong>
              </div>
              <span style={{ fontSize: "10.5px", color: "#64748B" }}>
                Klik nama buyer untuk langsung memuat ke formulir penawaran
              </span>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {savedBuyersList.map((b) => {
                const isSelected = prospectCompany === b.companyName;
                return (
                  <button
                    key={b.id || b.companyName}
                    type="button"
                    onClick={() => handleSelectSavedBuyer(b)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "4px 10px",
                      borderRadius: 99,
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                      border: isSelected ? "1.5px solid #2563EB" : "1px solid #CBD5E1",
                      background: isSelected ? "#EFF6FF" : "#FFFFFF",
                      color: isSelected ? "#1D4ED8" : "#334155",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                      transition: "all 0.15s ease",
                    }}
                    title={`Klik untuk memuat profil ${b.companyName} (${b.country})`}
                  >
                    <span>{b.companyName}</span>
                    <span style={{ fontSize: "10px", color: isSelected ? "#2563EB" : "#64748B" }}>
                      · {b.country}
                    </span>
                    {b.status?.includes("Selesai") && (
                      <span style={{ color: "#10B981", fontSize: "11px", fontWeight: 700 }}>✓</span>
                    )}
                  </button>
                );
              })}
            </div>
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
                      setCustomSubjectId("");
                      setCustomBodyId("");
                      setCustomSubjectEn("");
                      setCustomBodyEn("");
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
                      setCustomSubjectId("");
                      setCustomBodyId("");
                      setCustomSubjectEn("");
                      setCustomBodyEn("");
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* KOTAK EDITOR DRAF SURAT EKSPOR (BERSIH & TERATUR)        */}
          {/* ======================================================== */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: "var(--radius)",
              padding: 16,
              marginTop: 14,
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
            }}
          >
            {/* Header Switcher: Segmented Pill + SATU Tombol Terjemahkan di Kanan */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 10,
                marginBottom: 14,
                paddingBottom: 12,
                borderBottom: "1px solid #F1F5F9",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  background: "#F1F5F9",
                  padding: 3,
                  borderRadius: 8,
                  gap: 3,
                }}
              >
                <button
                  type="button"
                  onClick={() => setLetterLang("id")}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                    background: letterLang === "id" ? "#FFFFFF" : "transparent",
                    color: letterLang === "id" ? "#0F172A" : "#64748B",
                    boxShadow: letterLang === "id" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    transition: "all 0.15s ease",
                  }}
                  title="Review dan edit draf dalam Bahasa Indonesia"
                >
                  <Eye size={13} style={{ color: letterLang === "id" ? "#2563EB" : "#64748B" }} />
                  <span>Review (Bahasa Indonesia)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!isTranslated) {
                      handleSaveAndChangeToEnglish();
                    } else {
                      setLetterLang("en");
                    }
                  }}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                    background: letterLang === "en" ? "#FFFFFF" : "transparent",
                    color: letterLang === "en" ? "#0F172A" : "#64748B",
                    boxShadow: letterLang === "en" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    transition: "all 0.15s ease",
                  }}
                  title="Surat resmi ekspor dalam Bahasa Inggris siap kirim"
                >
                  <span>🇬🇧</span>
                  <span>Bahasa Inggris</span>
                </button>
              </div>

              {/* Tombol Simpan */}
              <button
                type="button"
                onClick={
                  letterLang === "id"
                    ? handleSaveAndChangeToEnglish
                    : () => toast.success("Draf surat ekspor Bahasa Inggris tersimpan!")
                }
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "#0F172A",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                }}
                title={
                  letterLang === "id"
                    ? "Simpan draf dan ubah ke Bahasa Inggris"
                    : "Simpan perubahan draf Bahasa Inggris"
                }
              >
                <Save size={13} />
                <span>Simpan</span>
              </button>
            </div>

            {/* Input Subjek Surat */}
            <div style={{ marginBottom: 12 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: "#475569",
                  marginBottom: 4,
                }}
              >
                Subjek Surat {letterLang === "id" ? "(Review - Bahasa Indonesia)" : "(Resmi Ekspor - Bahasa Inggris)"}:
              </label>
              <input
                type="text"
                value={letterLang === "id" ? activeSubjectId : activeSubjectEn}
                onChange={(e) => {
                  if (letterLang === "id") setCustomSubjectId(e.target.value);
                  else setCustomSubjectEn(e.target.value);
                }}
                className="form-control"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#0F172A",
                  background: "#F8FAFC",
                  border: "1px solid #CBD5E1",
                  borderRadius: 6,
                  padding: "7px 11px",
                }}
              />
            </div>

            {/* Textarea Isi Surat */}
            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 5,
                }}
              >
                <label
                  style={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: "#475569",
                  }}
                >
                  Isi Surat {letterLang === "id" ? "(Review & Edit Langsung)" : "(Siap Kirim ke Buyer)"}:
                </label>
                {letterLang === "id" && (
                  <button
                    type="button"
                    onClick={handleResetIndonesianDraft}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#64748B",
                      fontSize: 11.5,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      whiteSpace: "nowrap",
                    }}
                    title="Kembalikan isi surat ke template awal"
                  >
                    <RefreshCw size={11} /> Reset Template
                  </button>
                )}
              </div>

              <textarea
                value={letterLang === "id" ? activeBodyId : activeBodyEn}
                onChange={(e) => {
                  if (letterLang === "id") setCustomBodyId(e.target.value);
                  else setCustomBodyEn(e.target.value);
                }}
                rows={14}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  fontFamily: "var(--font-sans)",
                  fontSize: 12.5,
                  lineHeight: 1.65,
                  color: "#0F172A",
                  background: "#F8FAFC",
                  border: "1px solid #CBD5E1",
                  borderRadius: 8,
                  padding: "12px 14px",
                  resize: "vertical",
                }}
                placeholder="Ketik atau edit draf surat di sini..."
              />
            </div>

            {/* ======================================================== */}
            {/* GMAIL-STYLE COMPACT ATTACHMENT SECTION                   */}
            {/* ======================================================== */}
            <div
              style={{
                marginTop: 12,
                paddingTop: 12,
                borderTop: "1px solid #E2E8F0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 600, color: "#334155" }}>
                  <Paperclip size={13} style={{ color: "#2563EB" }} />
                  <span>Lampiran Dokumen ({attachedFiles.length}):</span>
                </div>
                <span style={{ fontSize: 11, color: "#94A3B8" }}>Maks. 25 MB</span>
              </div>

              {/* Compact horizontal chips */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                {attachedFiles.map((file) => (
                  <div
                    key={file.id}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      background: "#F8FAFC",
                      border: "1px solid #CBD5E1",
                      borderRadius: 6,
                      padding: "4px 8px",
                      fontSize: 11.5,
                    }}
                  >
                    <FileText size={12} style={{ color: "#2563EB", flexShrink: 0 }} />
                    <span
                      style={{
                        fontWeight: 600,
                        color: "#0F172A",
                        maxWidth: 180,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={file.name}
                    >
                      {file.name}
                    </span>
                    <span style={{ color: "#64748B", fontSize: 10.5 }}>({file.size})</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(file.id)}
                      title="Hapus lampiran"
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: 1,
                        color: "#94A3B8",
                        display: "flex",
                        alignItems: "center",
                        marginLeft: 2,
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Subtle preset links */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", fontSize: 11, color: "#64748B" }}>
                <span>Tambah cepat:</span>
                <button
                  type="button"
                  onClick={() =>
                    handleAddPresetFile(
                      docType === "inquiry"
                        ? "Official_Export_Inquiry_INQ-2026.pdf"
                        : docType === "negotiation"
                        ? "Commercial_Negotiation_Agreement_NEG-2026.pdf"
                        : "Official_Commercial_Quotation_QUO-2026.pdf",
                      "168 KB"
                    )
                  }
                  style={{
                    background: "transparent",
                    border: "1px solid #CBD5E1",
                    borderRadius: 4,
                    padding: "2px 6px",
                    fontSize: 11,
                    color: "#2563EB",
                    cursor: "pointer",
                  }}
                >
                  + Surat Resmi
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleAddPresetFile(
                      `Technical_Spec_Sheet_${(shipment.product || "Export").replace(/\s+/g, "_")}.pdf`,
                      "115 KB"
                    )
                  }
                  style={{
                    background: "transparent",
                    border: "1px solid #CBD5E1",
                    borderRadius: 4,
                    padding: "2px 6px",
                    fontSize: 11,
                    color: "#059669",
                    cursor: "pointer",
                  }}
                >
                  + Spec Mutu
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleAddPresetFile("Company_Profile_PT_Nusantara_Ekspor_Mandiri.pdf", "240 KB")
                  }
                  style={{
                    background: "transparent",
                    border: "1px solid #CBD5E1",
                    borderRadius: 4,
                    padding: "2px 6px",
                    fontSize: 11,
                    color: "#475569",
                    cursor: "pointer",
                  }}
                >
                  + Company Profile
                </button>
              </div>
            </div>

            {/* Bottom Action Bar (Satu Baris Bersih: Lampirkan di Kiri, Aksi di Kanan) */}
            <div
              style={{
                marginTop: 14,
                paddingTop: 12,
                borderTop: "1px solid #E2E8F0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                multiple
                style={{ display: "none" }}
              />

              {/* Kiri: Tombol Lampirkan */}
              <button
                type="button"
                className="space-btn-secondary"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "#FFFFFF",
                  border: "1px solid #CBD5E1",
                  borderRadius: 6,
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#0F172A",
                  cursor: "pointer",
                }}
              >
                <Paperclip size={13} style={{ color: "#2563EB" }} />
                <span>Lampirkan Berkas</span>
              </button>

              {/* Kanan: Aksi Ekspor */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="save-button"
                  onClick={handleCopyDraft}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12 }}
                >
                  <Copy size={13} /> Salin Surat
                </button>

                <a
                  href={mailtoUrl}
                  className="ghost-button"
                  style={{
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    background: "#0F172A",
                    color: "#FFFFFF",
                    border: "none",
                  }}
                  title="Buka di aplikasi email dengan draf Bahasa Inggris resmi"
                >
                  <Send size={13} /> Buka di Email (EN)
                </a>

                <button
                  type="button"
                  className="ghost-button"
                  onClick={handlePrintOrDownloadPDF}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12 }}
                  title="Cetak atau Unduh Dokumen Surat sebagai PDF"
                >
                  <Printer size={13} /> Cetak / PDF
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* KOLOM KANAN: CHECKLIST, PARAMETER TRANSAKSI & PANDUAN    */}
        {/* ======================================================== */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Card 1: Checklist Validasi Legalitas Buyer */}
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
          </section>

          {/* Card 2: Ringkasan Parameter Komersial & Pembayaran Aman */}
          <section className="panel panel-padding" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <ShieldCheck size={16} style={{ color: verifiedCount >= 4 ? "#10B981" : "#F59E0B" }} />
              <strong style={{ fontSize: 13, color: "#0F172A" }}>
                Parameter Transaksi &amp; Proteksi Devisa
              </strong>
            </div>

            <p style={{ margin: "0 0 12px", fontSize: 11.5, color: "#64748B", lineHeight: 1.5 }}>
              {verifiedCount >= 4
                ? "Legalitas importir telah terverifikasi aman. Parameter penawaran di bawah siap dinaikkan ke Sales Contract resmi."
                : "Pastikan komitmen DP minimal 30% dan pelabuhan tujuan bebas sanksi sebelum menyetujui jadwal muat kargo."}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 11.5, marginBottom: 12 }}>
              <div style={{ background: "#FFFFFF", padding: "8px 10px", borderRadius: 6, border: "1px solid #E2E8F0" }}>
                <span style={{ color: "#64748B", display: "block", fontSize: 10.5 }}>Nilai Penawaran:</span>
                <strong style={{ color: "#0F172A" }}>{formatMoney(pricing.active.offer, shipment.currency)}</strong>
              </div>
              <div style={{ background: "#FFFFFF", padding: "8px 10px", borderRadius: 6, border: "1px solid #E2E8F0" }}>
                <span style={{ color: "#64748B", display: "block", fontSize: 10.5 }}>Volume Ekspor:</span>
                <strong style={{ color: "#0F172A" }}>{shipment.quantity > 0 ? `${shipment.quantity} ${shipment.unit || "MT"}` : "19.2 MT (1 FCL)"}</strong>
              </div>
              <div style={{ background: "#FFFFFF", padding: "8px 10px", borderRadius: 6, border: "1px solid #E2E8F0" }}>
                <span style={{ color: "#64748B", display: "block", fontSize: 10.5 }}>Syarat Pembayaran:</span>
                <strong style={{ color: "#0F172A" }}>DP 30% T/T Wajib</strong>
              </div>
              <div style={{ background: "#FFFFFF", padding: "8px 10px", borderRadius: 6, border: "1px solid #E2E8F0" }}>
                <span style={{ color: "#64748B", display: "block", fontSize: 10.5 }}>Incoterm &amp; Rute:</span>
                <strong style={{ color: "#0F172A" }}>{shipment.incoterm} ({shipment.destination || "Pelabuhan Tujuan"})</strong>
              </div>
            </div>

            <div style={{ background: "#FFFFFF", padding: "8px 10px", borderRadius: 6, border: "1px solid #E2E8F0", fontSize: 11 }}>
              <span style={{ color: "#64748B", display: "block", marginBottom: 2 }}>Dokumen Wajib Ekspor:</span>
              <span style={{ color: "#0F172A", fontWeight: 600 }}>Commercial Invoice, Packing List, B/L, e-SKA, Fitosanitari &amp; Lab Analisis</span>
            </div>
          </section>

          {/* Card 3: Panduan Negosiasi & Mitigasi Risiko Buyer (AI Trade Advisor) */}
          <section className="panel panel-padding" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Sparkles size={15} style={{ color: "#2563EB" }} />
              <strong style={{ fontSize: 12.5, color: "#0F172A" }}>Panduan Transaksi Ekspor Aman</strong>
            </div>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11.5, color: "#475569", lineHeight: 1.6 }}>
              <li><strong>Hindari Open Account:</strong> Untuk buyer atau broker baru, jangan pernah menerima terms pelunasan setelah barang tiba tanpa jaminan bank L/C.</li>
              <li><strong>Kunci Toleransi Mutu:</strong> Cantumkan toleransi mutu maks. 5% pada lembar penawaran untuk mencegah penalti sepihak saat kargo tiba.</li>
              <li><strong>Verifikasi Dokumen:</strong> Pastikan seluruh berkas lampiran asli telah cocok dengan persyaratan kepabeanan negara buyer.</li>
            </ul>
          </section>

          {/* Action Button Stack */}
          <div className="pretrans-btn-stack" style={{ marginTop: 2 }}>
            <button type="button" className="save-button" onClick={() => navigate("documents")}>
              <Building2 size={14} /> Terbitkan PI / Kontrak →
            </button>
            <button type="button" className="ghost-button" onClick={() => navigate("compliance")}>
              Cek HS &amp; Lartas →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
