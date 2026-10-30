import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import mammoth from "mammoth";

// Set worker URL for pdfjs in Vite
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
} catch (e) {
  console.warn("Could not set pdfjs workerSrc:", e);
}

/**
 * Ekstraksi teks dari file dokumen (PDF, DOCX, TXT) secara asynchronous.
 */
export async function extractTextFromDocument(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();

  // 1. Plain text / Markdown / CSV
  if (fileName.endsWith(".txt") || fileName.endsWith(".csv") || fileName.endsWith(".md") || file.type.startsWith("text/")) {
    return await file.text();
  }

  // 2. Microsoft Word (.docx)
  if (fileName.endsWith(".docx") || file.type.includes("wordprocessingml")) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value.trim();
  }

  // 3. Adobe PDF (.pdf)
  if (fileName.endsWith(".pdf") || file.type === "application/pdf") {
    const arrayBuffer = await file.arrayBuffer();
    return await extractTextFromPdf(arrayBuffer);
  }

  // Fallback default: coba baca text jika memungkinkan
  try {
    const text = await file.text();
    if (text && !text.includes("\x00") && text.length > 20) {
      return text;
    }
  } catch {
    // ignore
  }

  throw new Error(`Format file "${file.name}" tidak didukung. Harap gunakan PDF, Word (.docx), atau file teks (.txt).`);
}

/**
 * Ekstraksi teks dari binary PDF menggunakan PDF.js
 */
async function extractTextFromPdf(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useWorkerFetch: false,
      useSystemFonts: true,
    });
    const pdf = await loadingTask.promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      let pageText = "";
      let lastY: number | null = null;

      for (const rawItem of textContent.items) {
        if (!("str" in rawItem)) continue;
        const item = rawItem as { str: string; transform?: number[]; hasEOL?: boolean };
        const text = item.str;
        if (!text) continue;

        const currentY = item.transform && item.transform.length >= 6 ? item.transform[5] : null;

        // Beda posisi vertikal lebih dari 4 pt menandakan baris baru dalam layout dokumen PDF
        if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 4) {
          pageText += "\n";
        } else if (pageText.length > 0 && !pageText.endsWith("\n") && !pageText.endsWith(" ") && !text.startsWith(" ")) {
          pageText += " ";
        }

        pageText += text;

        if (item.hasEOL) {
          pageText += "\n";
        }

        if (currentY !== null) {
          lastY = currentY;
        }
      }

      if (pageText.trim()) {
        fullText += pageText.trim() + "\n\n";
      }
    }

    if (fullText.trim().length > 10) {
      return fullText.trim();
    }
  } catch (err) {
    console.warn("PDF.js worker extraction failed, falling back to stream parsing:", err);
  }

  // Fallback: jika PDF.js gagal (misal security worker block), coba ekstrak teks mentah dari stream uncompressed
  const fallback = extractRawStringsFromPdfBuffer(arrayBuffer);
  if (fallback && fallback.length > 20) {
    return fallback;
  }

  throw new Error("Dokumen PDF ini tampaknya berupa hasil scan/foto tanpa lapisan teks digital (OCR). Silakan copy-paste teks PO langsung ke kotak teks.");
}

/**
 * Fallback parser teks dari stream PDF mentah
 */
function extractRawStringsFromPdfBuffer(buffer: ArrayBuffer): string {
  try {
    const uint8 = new Uint8Array(buffer);
    const decoder = new TextDecoder("latin1");
    const raw = decoder.decode(uint8);

    const matches: string[] = [];
    // Cari operator teks PDF Tj dan TJ
    const tjRegex = /\(([^)]+)\)\s*Tj/g;
    let m: RegExpExecArray | null;
    while ((m = tjRegex.exec(raw)) !== null) {
      matches.push(m[1]);
    }

    if (matches.length > 10) {
      return matches.join(" ");
    }
  } catch {
    // ignore
  }
  return "";
}
