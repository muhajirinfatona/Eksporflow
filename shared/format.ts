import type { DocumentType } from "./shipment";

export function formatMoney(value: number, currency = "USD"): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  const code = currency.trim().toUpperCase();
  if (/^[A-Z]{3}$/.test(code)) {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: code,
        maximumFractionDigits: 0,
      }).format(safeValue);
    } catch {
      // Fallback bila kode 3 huruf bukan mata uang ISO 4217 yang dikenali Intl.
    }
  }
  const formatted = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(safeValue);
  return code ? `${code} ${formatted}` : formatted;
}

export function formatNumber(value: number, digits = 0): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(safeValue);
}

export function clamp(value: number, min = 0): number {
  return Number.isFinite(value) ? Math.max(min, value) : min;
}

export function getDocumentNumber(type: DocumentType, reference: string): string {
  const prefix =
    type === "Proforma Invoice"
      ? "PI"
      : type === "Commercial Invoice"
        ? "CI"
        : type === "Packing List"
          ? "PL"
          : "BL";
  return `${prefix}-${reference}`;
}
