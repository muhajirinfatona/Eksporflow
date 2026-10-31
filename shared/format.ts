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

function numberToWordsIndonesian(amount: number, currency = "USD"): string {
  const integerPart = Math.floor(Math.abs(amount));
  const decimalPart = Math.round((Math.abs(amount) - integerPart) * 100);

  const angka = [
    "",
    "Satu",
    "Dua",
    "Tiga",
    "Empat",
    "Lima",
    "Enam",
    "Tujuh",
    "Delapan",
    "Sembilan",
    "Sepuluh",
    "Sebelas",
  ];

  function terbilang(n: number): string {
    if (n < 12) return angka[n];
    if (n < 20) return terbilang(n - 10) + " Belas";
    if (n < 100) return terbilang(Math.floor(n / 10)) + " Puluh " + terbilang(n % 10);
    if (n < 200) return "Seratus " + terbilang(n - 100);
    if (n < 1000) return terbilang(Math.floor(n / 100)) + " Ratus " + terbilang(n % 100);
    if (n < 2000) return "Seribu " + terbilang(n - 1000);
    if (n < 1000000) return terbilang(Math.floor(n / 1000)) + " Ribu " + terbilang(n % 1000);
    if (n < 1000000000) return terbilang(Math.floor(n / 1000000)) + " Juta " + terbilang(n % 1000000);
    if (n < 1000000000000) return terbilang(Math.floor(n / 1000000000)) + " Miliar " + terbilang(n % 1000000000);
    return terbilang(Math.floor(n / 1000000000000)) + " Triliun " + terbilang(n % 1000000000000);
  }

  const currencyUpper = currency.toUpperCase();
  const currencyName =
    currencyUpper === "USD"
      ? "Dolar Amerika Serikat"
      : currencyUpper === "EUR"
        ? "Euro"
        : currencyUpper === "IDR"
          ? "Rupiah"
          : currencyUpper;

  if (integerPart === 0) {
    return `NOL ${currencyName.toUpperCase()} SAJA`;
  }

  const words = terbilang(integerPart).replace(/\s+/g, " ").trim();
  let result = `${currencyName} ${words}`;
  if (decimalPart > 0) {
    result += ` Koma ${terbilang(decimalPart).trim()} Sen`;
  }
  return (result + " Saja").toUpperCase();
}

export function numberToWords(amount: number, currency = "USD", lang: "en" | "id" = "en"): string {
  if (lang === "id") {
    return numberToWordsIndonesian(amount, currency);
  }

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
