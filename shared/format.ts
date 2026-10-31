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
      : type === "Sales Contract"
        ? "SC"
        : type === "Commercial Invoice"
          ? "CI"
          : type === "Packing List"
            ? "PL"
            : type === "Shipping Instruction"
              ? "SI"
              : "BL";
  return `${prefix}-${reference}`;
}

export function numberToWords(amount: number, currency = "USD"): string {
  const integerPart = Math.floor(Math.abs(amount));
  const decimalPart = Math.round((Math.abs(amount) - integerPart) * 100);

  const units = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
  ];
  const scales = ["", "Thousand", "Million", "Billion", "Trillion"];

  function convertGroup(n: number): string {
    let out = "";
    if (n >= 100) {
      out += units[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n >= 20) {
      out += tens[Math.floor(n / 10)] + (n % 10 > 0 ? "-" + units[n % 10] : "") + " ";
    } else if (n > 0) {
      out += units[n] + " ";
    }
    return out.trim();
  }

  if (integerPart === 0) {
    return `Zero ${currency} Only`.toUpperCase();
  }

  let words = "";
  let scaleIndex = 0;
  let remaining = integerPart;

  while (remaining > 0) {
    const chunk = remaining % 1000;
    if (chunk !== 0) {
      const chunkWords = convertGroup(chunk);
      words = chunkWords + (scales[scaleIndex] ? " " + scales[scaleIndex] : "") + (words ? " " + words : "");
    }
    remaining = Math.floor(remaining / 1000);
    scaleIndex++;
  }

  const currencyUpper = currency.toUpperCase();
  const currencyName =
    currencyUpper === "USD"
      ? "United States Dollars"
      : currencyUpper === "EUR"
        ? "Euros"
        : currencyUpper === "IDR"
          ? "Indonesian Rupiah"
          : currencyUpper;

  let result = `${currencyName} ${words.trim()}`;
  if (decimalPart > 0) {
    result += ` and ${decimalPart}/100 Cents`;
  }
  return (result + " Only").toUpperCase();
}
