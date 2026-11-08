import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import mammoth from "mammoth";
import * as XLSX from "xlsx";

// Setup PDF.js worker
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
} catch (e) {
  console.warn("Could not set pdfjs workerSrc:", e);
}

export interface ExtractedLetterhead {
  bannerImage?: string; // Cropped high-res PNG data URI of the top letterhead region
  logoImage?: string;   // Extracted logo PNG data URI
  companyName?: string;
  tagline?: string;
  address?: string;
  contact?: string;
  sourceType: "pdf" | "docx" | "xlsx" | "csv" | "image" | "unknown";
  fileName: string;
}

/**
 * Universal extractor for Letterhead (Kop Surat) from any document or image:
 * PDF, Word (.docx, .doc), Excel (.xlsx, .xls), CSV, or Image (PNG, JPG, WEBP, SVG).
 */
export async function extractLetterheadFromFile(file: File): Promise<ExtractedLetterhead> {
  const fileName = file.name.toLowerCase();

  // 1. Direct Image Files (PNG, JPG, JPEG, WEBP, SVG)
  if (file.type.startsWith("image/") || /\.(png|jpe?g|webp|svg)$/i.test(fileName)) {
    const dataUrl = await readFileAsDataUrl(file);
    return {
      bannerImage: dataUrl,
      logoImage: dataUrl,
      sourceType: "image",
      fileName: file.name,
    };
  }

  // 2. Adobe PDF (.pdf)
  if (file.type === "application/pdf" || fileName.endsWith(".pdf")) {
    const arrayBuffer = await file.arrayBuffer();
    return await extractFromPdf(arrayBuffer, file.name);
  }

  // 3. Microsoft Word (.docx, .doc)
  if (
    fileName.endsWith(".docx") ||
    fileName.endsWith(".doc") ||
    file.type.includes("wordprocessingml") ||
    file.type.includes("msword")
  ) {
    const arrayBuffer = await file.arrayBuffer();
    return await extractFromDocx(arrayBuffer, file.name);
  }

  // 4. Excel / Spreadsheet (.xlsx, .xls, .csv)
  if (
    fileName.endsWith(".xlsx") ||
    fileName.endsWith(".xls") ||
    fileName.endsWith(".csv") ||
    file.type.includes("spreadsheetml") ||
    file.type.includes("excel") ||
    file.type.includes("csv")
  ) {
    const arrayBuffer = await file.arrayBuffer();
    return await extractFromExcel(arrayBuffer, file.name);
  }

  // 5. Fallback Text files
  try {
    const text = await file.text();
    if (text && text.length > 5) {
      return parseTextForLetterhead(text, file.name, "unknown");
    }
  } catch {
    // ignore
  }

  throw new Error(`Format file "${file.name}" tidak didukung. Harap gunakan PDF, Word (.docx), Excel (.xlsx), CSV, atau Gambar.`);
}

/**
 * Extracts letterhead from PDF (Page 1):
 * - Renders Page 1 onto an HTML Canvas at 2x resolution
 * - Intelligently crops the top letterhead region (above Date / Ref / Body)
 * - Extracts embedded logo image if present
 * - Parses company text, address, and contact details
 */
async function extractFromPdf(arrayBuffer: ArrayBuffer, fileName: string): Promise<ExtractedLetterhead> {
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useWorkerFetch: false,
    useSystemFonts: true,
  });

  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);
  const textContent = await page.getTextContent();

  // 1. Text Parsing from Page 1 items
  interface TextItemPos {
    str: string;
    y: number;
    x: number;
    fontSize: number;
  }
  const textItems: TextItemPos[] = [];
  for (const raw of textContent.items) {
    if ("str" in raw && typeof raw.str === "string" && raw.str.trim()) {
      const transform = (raw as any).transform || [1, 0, 0, 1, 0, 0];
      textItems.push({
        str: raw.str.trim(),
        x: transform[4] || 0,
        y: transform[5] || 0, // In PDF, Y=0 is bottom
        fontSize: Math.abs(transform[0]) || 12,
      });
    }
  }

  // Group text items by line (similar Y coordinate within 4pt)
  textItems.sort((a, b) => b.y - a.y); // top to bottom
  const lines: string[] = [];
  let currentY = -9999;
  let currentLine = "";

  for (const it of textItems) {
    if (Math.abs(it.y - currentY) > 4) {
      if (currentLine.trim()) lines.push(currentLine.trim());
      currentY = it.y;
      currentLine = it.str;
    } else {
      currentLine += "  " + it.str;
    }
  }
  if (currentLine.trim()) lines.push(currentLine.trim());

  // Detect cutoff Y coordinate for letterhead
  const rawViewport = page.getViewport({ scale: 1.0 });
  const pageHeight = rawViewport.height;
  let cutoffRatio = 0.24; // Default top 24% of page

  for (const it of textItems) {
    const s = it.str.toLowerCase();
    if (
      s.includes("date:") ||
      s.includes("ref:") ||
      s.includes("ref.:") ||
      s.includes("invoice") ||
      s.includes("proforma") ||
      s.includes("contract") ||
      s.includes("tanggal:") ||
      s.includes("nomor:")
    ) {
      // Y is from bottom. Distance from top = (pageHeight - Y) / pageHeight
      const distFromTop = (pageHeight - it.y) / pageHeight;
      if (distFromTop > 0.12 && distFromTop < 0.40) {
        cutoffRatio = Math.max(0.14, distFromTop - 0.015);
        break;
      }
    }
  }

  let bannerImage: string | undefined;
  let logoImage: string | undefined;

  // 2. Render Page 1 to Canvas and Crop Header
  try {
    const scale = 2.0; // 200 DPI crisp quality
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext("2d");

    if (ctx) {
      await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;

      // Crop top banner
      const cropHeight = Math.round(canvas.height * cutoffRatio);
      const cropCanvas = document.createElement("canvas");
      cropCanvas.width = canvas.width;
      cropCanvas.height = cropHeight;
      const cropCtx = cropCanvas.getContext("2d");

      if (cropCtx) {
        cropCtx.drawImage(canvas, 0, 0, canvas.width, cropHeight, 0, 0, canvas.width, cropHeight);
        bannerImage = cropCanvas.toDataURL("image/png");
      }
    }
  } catch (err) {
    console.warn("Canvas rendering of PDF page 1 header failed:", err);
  }

  // 3. Extract Embedded Logo Image from Operator List
  try {
    const ops = await page.getOperatorList();
    for (let i = 0; i < ops.fnArray.length; i++) {
      if (
        ops.fnArray[i] === pdfjsLib.OPS.paintImageXObject ||
        ops.fnArray[i] === pdfjsLib.OPS.paintInlineImageXObject
      ) {
        const imgName = ops.argsArray[i][0];
        const img = await new Promise<any>((resolve) => page.objs.get(imgName, resolve));

        if (img && img.data && img.width > 20 && img.height > 20) {
          const imgCanvas = document.createElement("canvas");
          imgCanvas.width = img.width;
          imgCanvas.height = img.height;
          const imgCtx = imgCanvas.getContext("2d");

          if (imgCtx) {
            const imgData = imgCtx.createImageData(img.width, img.height);
            if (img.data.length === img.width * img.height * 3) {
              // RGB to RGBA
              for (let src = 0, dest = 0; src < img.data.length; src += 3, dest += 4) {
                imgData.data[dest] = img.data[src];
                imgData.data[dest + 1] = img.data[src + 1];
                imgData.data[dest + 2] = img.data[src + 2];
                imgData.data[dest + 3] = 255;
              }
            } else if (img.data.length === img.width * img.height * 4) {
              imgData.data.set(img.data);
            }
            imgCtx.putImageData(imgData, 0, 0);
            logoImage = imgCanvas.toDataURL("image/png");
            break; // Grab the primary header logo
          }
        }
      }
    }
  } catch (err) {
    console.warn("Could not extract embedded logo from PDF objs:", err);
  }

  // 4. Parse Structured Text Fields
  const parsed = parseLinesForLetterhead(lines);

  return {
    bannerImage,
    logoImage,
    companyName: parsed.companyName,
    tagline: parsed.tagline,
    address: parsed.address,
    contact: parsed.contact,
    sourceType: "pdf",
    fileName,
  };
}

/**
 * Extracts letterhead from Word (.docx) documents:
 * - Extracts images using mammoth HTML conversion
 * - Extracts text lines for company identity
 */
async function extractFromDocx(arrayBuffer: ArrayBuffer, fileName: string): Promise<ExtractedLetterhead> {
  let logoImage: string | undefined;

  try {
    const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
    const imgMatch = htmlResult.value.match(/<img[^>]+src=["'](data:image\/[^"']+)["']/i);
    if (imgMatch) {
      logoImage = imgMatch[1];
    }
  } catch (e) {
    console.warn("Could not extract images from docx:", e);
  }

  const rawTextResult = await mammoth.extractRawText({ arrayBuffer });
  const lines = rawTextResult.value
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 10);

  const parsed = parseLinesForLetterhead(lines);

  return {
    bannerImage: logoImage,
    logoImage,
    companyName: parsed.companyName,
    tagline: parsed.tagline,
    address: parsed.address,
    contact: parsed.contact,
    sourceType: "docx",
    fileName,
  };
}

/**
 * Extracts letterhead from Excel (.xlsx, .xls) or CSV:
 * - Reads top 8 rows of worksheet 1
 */
async function extractFromExcel(arrayBuffer: ArrayBuffer, fileName: string): Promise<ExtractedLetterhead> {
  const wb = XLSX.read(arrayBuffer, { type: "array" });
  const firstSheetName = wb.SheetNames[0];
  const ws = wb.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 });

  const lines: string[] = [];
  for (let r = 0; r < Math.min(8, rows.length); r++) {
    const row = rows[r];
    if (Array.isArray(row)) {
      const rowText = row
        .filter((cell) => cell !== null && cell !== undefined)
        .map((cell) => String(cell).trim())
        .filter(Boolean)
        .join("  ");
      if (rowText) lines.push(rowText);
    }
  }

  const parsed = parseLinesForLetterhead(lines);

  return {
    companyName: parsed.companyName,
    tagline: parsed.tagline,
    address: parsed.address,
    contact: parsed.contact,
    sourceType: fileName.endsWith(".csv") ? "csv" : "xlsx",
    fileName,
  };
}

/**
 * Parses an array of top header lines into companyName, tagline, address, contact
 */
function parseLinesForLetterhead(lines: string[]) {
  let companyName: string | undefined;
  let tagline: string | undefined;
  let address: string | undefined;
  let contact: string | undefined;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect Company Name (First prominent line or has PT, INC, LTD, EXPORT)
    if (!companyName) {
      if (
        line.length >= 4 &&
        !line.toLowerCase().startsWith("tel") &&
        !line.toLowerCase().startsWith("head office")
      ) {
        companyName = line;
        continue;
      }
    }

    // Detect Tagline
    if (
      companyName &&
      !tagline &&
      (line.toUpperCase().includes("EXPORTER") ||
        line.toUpperCase().includes("SUPPLIER") ||
        line.toUpperCase().includes("COMMODITIES") ||
        line.toUpperCase().includes("PRODUCER") ||
        line.toUpperCase().includes("MANUFACTURER") ||
        line.toUpperCase().includes("INDONESIA")) &&
      !line.toUpperCase().includes("HEAD OFFICE") &&
      !line.toUpperCase().includes("CONTACT")
    ) {
      tagline = line;
      continue;
    }

    // Detect Address
    if (
      !address &&
      (line.toUpperCase().includes("HEAD OFFICE") ||
        line.toUpperCase().includes("OFFICE") ||
        line.toUpperCase().includes("JL.") ||
        line.toUpperCase().includes("JALAN") ||
        line.toUpperCase().includes("STREET") ||
        line.toUpperCase().includes("KEC.") ||
        line.toUpperCase().includes("KOTA"))
    ) {
      address = line.replace(/^(Head Office|Kantor Pusat|Alamat|Office)\s*[:\-]?\s*/i, "").trim();
      continue;
    }

    // Detect Contact (Tel, Email, Web)
    if (
      !contact &&
      (line.toUpperCase().includes("CONTACT") ||
        line.toLowerCase().includes("@") ||
        line.toLowerCase().includes("tel") ||
        line.toLowerCase().includes("+62") ||
        line.toLowerCase().includes("www."))
    ) {
      contact = line.replace(/^(Contact|Kontak)\s*[:\-]?\s*/i, "").trim();
      continue;
    }
  }

  return { companyName, tagline, address, contact };
}

function parseTextForLetterhead(text: string, fileName: string, sourceType: "pdf" | "docx" | "xlsx" | "csv" | "image" | "unknown"): ExtractedLetterhead {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 10);
  const parsed = parseLinesForLetterhead(lines);
  return {
    ...parsed,
    sourceType,
    fileName,
  };
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
