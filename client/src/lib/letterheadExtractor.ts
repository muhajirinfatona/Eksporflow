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
  footerImage?: string; // Cropped high-res PNG data URI of the bottom letterhead/footer region
  fullPageImage?: string; // Full Page 1 high-res stationery background
  watermarkImage?: string; // Extracted watermark emblem if present
  companyName?: string;
  tagline?: string;
  address?: string;
  contact?: string;
  footerText?: string;
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
  let cutoffRatio = 0.22; // Default top 22% of page

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

  // Detect bottom footer items (Y < 20% from bottom in PDF coordinates)
  const bottomItems = textItems.filter((it) => it.y / pageHeight < 0.20);
  let footerRatio = 0.14; // Default bottom 14% of page for letterhead stationery
  let extractedFooterText: string | undefined;

  if (bottomItems.length > 0) {
    const maxBottomY = Math.max(...bottomItems.map((it) => it.y));
    const distFromBottom = (maxBottomY + 28) / pageHeight;
    footerRatio = Math.max(0.11, Math.min(0.24, distFromBottom));
    extractedFooterText = bottomItems.map((it) => it.str).join("  •  ");
  }

  let bannerImage: string | undefined;
  let footerImage: string | undefined;
  let fullPageImage: string | undefined;
  let logoImage: string | undefined;

  // 2. Render Page 1 to Canvas and Crop Header + Footer
  try {
    const scale = 2.5; // High-res 250 DPI for crisp export & print fidelity
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext("2d");

    if (ctx) {
      await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;

      // 1. Crop Top Header Banner
      const cropHeight = Math.round(canvas.height * cutoffRatio);
      const cropCanvas = document.createElement("canvas");
      cropCanvas.width = canvas.width;
      cropCanvas.height = cropHeight;
      const cropCtx = cropCanvas.getContext("2d");

      if (cropCtx) {
        cropCtx.drawImage(canvas, 0, 0, canvas.width, cropHeight, 0, 0, canvas.width, cropHeight);
        bannerImage = cropCanvas.toDataURL("image/png");
      }

      // 2. Crop Bottom Footer Banner
      const footerCropHeight = Math.round(canvas.height * footerRatio);
      const footerCropY = canvas.height - footerCropHeight;
      const footerCanvas = document.createElement("canvas");
      footerCanvas.width = canvas.width;
      footerCanvas.height = footerCropHeight;
      const footerCtx = footerCanvas.getContext("2d");

      if (footerCtx) {
        footerCtx.drawImage(canvas, 0, footerCropY, canvas.width, footerCropHeight, 0, 0, canvas.width, footerCropHeight);
        footerImage = footerCanvas.toDataURL("image/png");
      }

      // 3. Full-page stationery background
      try {
        fullPageImage = canvas.toDataURL("image/jpeg", 0.92);
      } catch {
        // ignore if memory limited
      }
    }
  } catch (err) {
    console.warn("Canvas rendering of PDF page 1 header/footer failed:", err);
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
  const parsed = parseLinesForLetterhead(lines, bottomItems.map((b) => b.str));

  return {
    bannerImage,
    footerImage,
    fullPageImage,
    logoImage,
    companyName: parsed.companyName,
    tagline: parsed.tagline,
    address: parsed.address,
    contact: parsed.contact,
    footerText: extractedFooterText || parsed.footerText,
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

function cleanSpacedWord(str: string): string {
  const trimmed = str.trim();
  // Handles 'C r e a t i v e   C o m p a n y' -> 'Creative Company'
  if (/(?:[A-Za-z]\s+){3,}/.test(trimmed)) {
    return trimmed.replace(/\b([A-Za-z])\s+(?=[A-Za-z]\b)/g, "$1").replace(/\s{2,}/g, " ").trim();
  }
  return trimmed;
}

/**
 * Parses an array of top header lines and bottom items into companyName, tagline, address, contact
 */
function parseLinesForLetterhead(lines: string[], bottomStrings: string[] = []) {
  let companyName: string | undefined;
  let tagline: string | undefined;
  let address: string | undefined;
  let contact: string | undefined;
  let footerText: string | undefined;

  // Check bottomStrings & lines for contact pillars (web, email, phone)
  const allStrings = [...lines, ...bottomStrings];
  let tel = "";
  let email = "";
  let web = "";

  for (const s of allStrings) {
    const clean = cleanSpacedWord(s);
    if (clean.includes("@") && !email) {
      const m = clean.match(/[\w.-]+@[\w.-]+\.\w+/);
      if (m) email = m[0];
    }
    if ((clean.includes("www.") || clean.includes(".com") || clean.includes(".id") || clean.includes(".co")) && !web && !clean.includes("@")) {
      const m = clean.match(/(?:https?:\/\/)?(?:www\.)?[\w.-]+\.[a-z]{2,}/i);
      if (m) web = m[0];
    }
    if (/(?:\+?\d{1,4}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,6}/.test(clean) && !tel && !clean.includes("202") && !clean.includes("199")) {
      const m = clean.match(/(?:\+?\d{1,4}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,6}/);
      if (m && m[0].length >= 7) tel = m[0];
    }
  }

  if (tel || email || web) {
    const parts: string[] = [];
    if (tel) parts.push(`Tel: ${tel}`);
    if (email) parts.push(`Email: ${email}`);
    if (web) parts.push(`Web: ${web}`);
    contact = parts.join("  |  ");
    footerText = [web, tel, email].filter(Boolean).join("  •  ");
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = cleanSpacedWord(rawLine);

    // Detect Company Name (First prominent line or has PT, INC, LTD, EXPORT)
    if (!companyName) {
      if (
        line.length >= 3 &&
        !line.toLowerCase().startsWith("tel") &&
        !line.toLowerCase().startsWith("head office") &&
        !line.includes("@") &&
        !line.startsWith("www.")
      ) {
        companyName = line;
        continue;
      }
    }

    // Detect Tagline
    if (companyName && !tagline) {
      if (
        !line.toLowerCase().startsWith("tel") &&
        !line.toLowerCase().startsWith("head office") &&
        !line.includes("@") &&
        !line.startsWith("www.") &&
        line !== companyName
      ) {
        tagline = line;
        continue;
      }
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

    // Detect Contact (Tel, Email, Web) if not yet set
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

  return { companyName, tagline, address, contact, footerText };
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
