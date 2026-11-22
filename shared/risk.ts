import type { Pricing } from "./pricing";
import type { ContainerCalc, Shipment } from "./shipment";

export type ScreenId =
  | "dashboard"
  | "readiness"
  | "transactions"
  | "pre_transaction"
  | "po_intake"
  | "pricing"
  | "approvals"
  | "compliance"
  | "documents"
  | "cargo"
  | "tracking"
  | "shipment"
  | "scrutiny"
  | "risk"
  | "audit_vault"
  | "advisor"
  | "knowledge"
  | "partners"
  | "products"
  | "finance"
  | "bank"
  | "journals"
  | "reports"
  | "settings";

export type LegalChecklist = {
  hsCodeReviewed: boolean;
  originEvidence: boolean;
  paymentTermsReviewed: boolean;
  sanctionsScreened: boolean;
};

export const defaultLegalChecklist: LegalChecklist = {
  hsCodeReviewed: false,
  originEvidence: false,
  paymentTermsReviewed: false,
  sanctionsScreened: false,
};

export type RiskLevel = "Review complete — verify" | "Review required" | "High attention";

export type RiskCheckItem = {
  key: string;
  label: string;
  detail: string;
  ok: boolean;
  targetScreen: ScreenId;
};

export type RiskEvaluation = {
  checks: RiskCheckItem[];
  passed: number;
  total: number;
  readinessPercent: number;
  riskLevel: RiskLevel;
  hasPoEvidence: boolean;
  hasEmailEvidence: boolean;
  threeWayConsistent: boolean;
};

export function evaluateRiskChecks(
  shipment: Shipment,
  pricing: Pricing,
  container: ContainerCalc,
  legalChecklist: LegalChecklist = defaultLegalChecklist,
): RiskEvaluation {
  const hasPoEvidence = shipment.attachments.some((attachment) => /po|purchase|order/i.test(attachment));
  const hasEmailEvidence = shipment.attachments.some((attachment) => /email|mail|confirmation|correspondence/i.test(attachment));
  const threeWayConsistent =
    pricing.totalQuantity === shipment.quantity &&
    shipment.quantity === shipment.cartonQty &&
    shipment.lineItems.length > 0 &&
    shipment.lineItems.every((item) => item.quantity > 0 && Boolean(item.hsCode.trim()));

  const checks: RiskCheckItem[] = [
    {
      key: "buyer",
      label: "Identitas buyer & tujuan",
      detail: "Buyer, negara, dan lokasi pengiriman terisi.",
      ok: Boolean(shipment.buyer.trim() && shipment.buyerCountry.trim() && shipment.destination.trim()),
      targetScreen: "pricing",
    },
    {
      key: "hsCode",
      label: "HS Code & country of origin",
      detail: "HS Code tersedia untuk review klasifikasi dan COO.",
      ok: Boolean(shipment.hsCode.trim()),
      targetScreen: "pricing",
    },
    {
      key: "capacity",
      label: "Kapasitas kontainer",
      detail: `${container.volumeUtilization.toFixed(0)}% volume · ${container.weightUtilization.toFixed(0)}% berat`,
      ok: container.volumeUtilization <= 100 && container.weightUtilization <= 100,
      targetScreen: "cargo",
    },
    {
      key: "documents",
      label: "Kelengkapan dokumen",
      detail: "Invoice, Packing List, dan B/L dapat dibuat dari data yang sama.",
      ok: Boolean(shipment.product.trim() && shipment.quantity > 0 && shipment.letterheadText.trim()),
      targetScreen: "documents",
    },
    {
      key: "threeWay",
      label: "3-way consistency",
      detail: "Quantity dan HS Code invoice = Packing List = rencana stuffing.",
      ok: threeWayConsistent,
      targetScreen: "pricing",
    },
    {
      key: "traceability",
      label: "Booking & seal traceability",
      detail: "Nomor booking, kontainer, dan seal mencegah salah serah.",
      ok: Boolean(shipment.bookingNumber.trim() && shipment.containerNumber.trim() && shipment.sealNumber.trim()),
      targetScreen: "shipment",
    },
    {
      key: "attachments",
      label: "Arsip bukti transaksi",
      detail: `${shipment.attachments.length} lampiran tersimpan untuk audit trail.`,
      ok: shipment.attachments.length > 0,
      targetScreen: "shipment",
    },
    {
      key: "legal",
      label: "Legal checklist selesai",
      detail: "Empat checkpoint internal ditandai dan siap direview pihak berwenang.",
      ok: Object.values(legalChecklist).filter(Boolean).length === 4,
      targetScreen: "risk",
    },
    {
      key: "screening",
      label: "Buyer screening berbasis bukti",
      detail: `${hasPoEvidence ? "PO terdeteksi" : "PO belum terdeteksi"} · ${hasEmailEvidence ? "email terdeteksi" : "email belum terdeteksi"}.`,
      ok: hasPoEvidence && hasEmailEvidence,
      targetScreen: "risk",
    },
  ];

  const passed = checks.filter((check) => check.ok).length;
  const total = checks.length;
  const readinessPercent = Math.round((passed / total) * 100);
  // PRD v1.8: tidak boleh mengklaim "Ready to ship"; status lengkap tetap butuh verifikasi manusia.
  const riskLevel: RiskLevel =
    passed === total ? "Review complete — verify" : passed >= 6 ? "Review required" : "High attention";

  return {
    checks,
    passed,
    total,
    readinessPercent,
    riskLevel,
    hasPoEvidence,
    hasEmailEvidence,
    threeWayConsistent,
  };
}

export type RecommendationKind = "booking" | "hsCode" | "stuffing" | "letterhead" | "margin" | "copilot";

export type RecommendationItem = {
  kind: RecommendationKind;
  title: string;
  detail: string;
  action: string;
  screen: ScreenId;
  tone: "warning" | "info" | "success";
};

export function computeRecommendations(
  shipment: Shipment,
  pricing: Pricing,
  container: ContainerCalc,
): RecommendationItem[] {
  const recommendations: RecommendationItem[] = [];
  if (!shipment.bookingNumber.trim()) {
    recommendations.push({
      kind: "booking",
      title: "Lengkapi referensi booking",
      detail: "Booking number belum ada. Isi sebelum shipment berpindah ke fase Booked agar jejak forwarder tetap utuh.",
      action: "Buka Logistik & Pengiriman",
      screen: "shipment",
      tone: "warning",
    });
  }
  if (!shipment.hsCode.trim()) {
    recommendations.push({
      kind: "hsCode",
      title: "Review HS Code sebelum quote",
      detail: "HS Code kosong dapat mengubah duty, dokumen, dan risiko klasifikasi. Konfirmasi dengan broker/customs.",
      action: "Buka Harga & Order",
      screen: "pricing",
      tone: "warning",
    });
  }
  if (container.volumeUtilization > 90 || container.weightUtilization > 90) {
    recommendations.push({
      kind: "stuffing",
      title: "Optimalkan rencana stuffing",
      detail: `Utilisasi ${Math.max(container.volumeUtilization, container.weightUtilization).toFixed(0)}% mendekati batas. Pertimbangkan layout, pallet, atau tambahan kontainer.`,
      action: "Buka Rencana Muatan",
      screen: "cargo",
      tone: "warning",
    });
  }
  if (!shipment.letterheadText || shipment.letterheadText.trim().length < 8) {
    recommendations.push({
      kind: "letterhead",
      title: "Lengkapi identitas kop surat",
      detail: "Kop surat masih terlalu singkat. Tambahkan alamat dan kontak sebelum membuat dokumen yang dikirim ke buyer.",
      action: "Buka Dokumen Ekspor",
      screen: "documents",
      tone: "info",
    });
  }
  if (pricing.active.profit <= 0) {
    recommendations.push({
      kind: "margin",
      title: "Margin perlu ditinjau",
      detail: "Estimasi profit tidak positif. Review komponen biaya, margin, dan diskon pada kalkulator harga.",
      action: "Buka Harga & Order",
      screen: "pricing",
      tone: "warning",
    });
  }
  if (!recommendations.length) {
    recommendations.push({
      kind: "copilot",
      title: "Tanyakan apa saja ke AI Advisor",
      detail: "Data inti terlihat siap. Minta ringkasan risiko, rekomendasi Incoterm, atau checklist dokumen untuk transaksi ini.",
      action: "Buka AI Advisor",
      screen: "advisor",
      tone: "success",
    });
  }
  return recommendations.slice(0, 4);
}
