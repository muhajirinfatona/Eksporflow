import { createHash } from "node:crypto";

export type DetectedPiiType = "NPWP" | "NIK" | "BANK_ACCOUNT" | "EMAIL" | "API_KEY" | "SECRET";

export interface RedactionResult {
  sanitizedText: string;
  redactionCount: number;
  detectedTypes: DetectedPiiType[];
}

/**
 * Pola regex untuk mendeteksi data sensitif pribadi & keamanan (PII)
 * sesuai standar kepatuhan privasi (UU PDP Indonesia & GDPR)
 * serta OWASP LLM06 (Sensitive Information Disclosure).
 */
const PII_PATTERNS: Array<{
  type: DetectedPiiType;
  replacement: string;
  pattern: RegExp;
}> = [
  // 1. API Keys & Secrets
  {
    type: "API_KEY",
    replacement: "[REDACTED_API_KEY]",
    pattern: /\b(?:sk-[a-zA-Z0-9_-]{20,}|gh[pousr]_[a-zA-Z0-9]{20,}|ai_key_[a-zA-Z0-9]{16,})\b/gi,
  },
  {
    type: "SECRET",
    replacement: "[REDACTED_SECRET]",
    pattern: /\b(?:Bearer\s+[a-zA-Z0-9._~+/-]{20,}=*|eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,})\b/gi,
  },
  {
    type: "SECRET",
    replacement: "$1[REDACTED_SECRET]$3",
    pattern: /(\b(?:api[_-]?key|client[_-]?secret|auth[_-]?token|password|private[_-]?key)\s*[:=]\s*['"]?)([a-zA-Z0-9_\-./+]{12,})(['"]?)/gi,
  },

  // 2. NPWP (Nomor Pokok Wajib Pajak) - 15 atau 16 digit format standar atau dengan konteks
  {
    type: "NPWP",
    replacement: "[REDACTED_NPWP]",
    pattern: /\b\d{2}\.\d{3}\.\d{3}\.\d{1}-\d{3}\.\d{3}\b/g,
  },
  {
    type: "NPWP",
    replacement: "[REDACTED_NPWP]",
    pattern: /\b\d{2}\.\d{3}\.\d{3}\.\d{1}-\d{3}(?:\.\d{3})?\b/g,
  },
  {
    type: "NPWP",
    replacement: "$1[REDACTED_NPWP]",
    pattern: /(\b(?:NPWP|Tax\s*ID|No(?:\.|\s+)NPWP)\s*[:=]?\s*)(?:[0-9.-]{15,22})/gi,
  },

  // 3. NIK (Nomor Induk Kependudukan) - 16 digit dengan kode wilayah provinsi Indonesia
  {
    type: "NIK",
    replacement: "$1[REDACTED_NIK]",
    pattern: /(\b(?:NIK|KTP|No(?:\.|\s+)KTP|Nomor\s+Induk\s+Kependudukan)\s*[:=]?\s*)(?:[1-9]\d{15})/gi,
  },
  {
    type: "NIK",
    replacement: "[REDACTED_NIK]",
    // Deteksi NIK mandiri 16 digit dengan prefix kode provinsi resmi Indonesia (11 - 92)
    pattern: /\b(?:1[1-9]|[2-8][0-9]|9[1-2])(?:0[1-9]|[1-9][0-9])(?:0[1-9]|[1-9][0-9])(?:[0-3][0-9]|[4-7][0-9])(?:0[1-9]|1[0-2])\d{2}\d{4}\b/g,
  },

  // 4. Nomor Rekening Bank
  {
    type: "BANK_ACCOUNT",
    replacement: "$1[REDACTED_BANK_ACCOUNT]",
    pattern: /(\b(?:rekening|no(?:\.|\s+)rek(?:ening)?|acc(?:ount)?(?:\s+no)?|bank\s+acc(?:ount)?|rekening\s+bank|mandiri|bca|bni|bri|cimb|danamon|permata|bsi)\s*[:=]?\s*)(?:(?:\d[-\s]?){8,22}\d)/gi,
  },
  {
    type: "BANK_ACCOUNT",
    replacement: "$1[REDACTED_BANK_ACCOUNT]",
    pattern: /(\b(?:IBAN)\s*[:=]?\s*)(?:[A-Z]{2}\d{2}[A-Z0-9]{11,30})/gi,
  },

  // 5. Alamat Email
  {
    type: "EMAIL",
    replacement: "[REDACTED_EMAIL]",
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  },
];

/**
 * Menyensor data sensitif (PII) dari teks sebelum dikirimkan ke model LLM.
 * Mengembalikan teks yang telah disanitasi, jumlah redaksi yang dilakukan,
 * serta kategori PII yang terdeteksi.
 */
export function redactPii(text: string): RedactionResult {
  if (!text || typeof text !== "string") {
    return { sanitizedText: "", redactionCount: 0, detectedTypes: [] };
  }

  let sanitized = text;
  let totalRedactions = 0;
  const detectedTypesSet = new Set<DetectedPiiType>();

  for (const { type, replacement, pattern } of PII_PATTERNS) {
    // Reset regex state if global
    pattern.lastIndex = 0;
    const matches = sanitized.match(pattern);
    if (matches && matches.length > 0) {
      totalRedactions += matches.length;
      detectedTypesSet.add(type);
      sanitized = sanitized.replace(pattern, replacement);
    }
  }

  return {
    sanitizedText: sanitized,
    redactionCount: totalRedactions,
    detectedTypes: Array.from(detectedTypesSet),
  };
}

/**
 * Menghitung hash SHA-256 dari teks prompt/pertanyaan untuk audit trail
 * tanpa menyimpan teks mentah yang berpotensi mengandung rahasia.
 */
export function computePromptHash(prompt: string): string {
  if (!prompt) return createHash("sha256").update("").digest("hex");
  return createHash("sha256").update(prompt.trim(), "utf8").digest("hex");
}
