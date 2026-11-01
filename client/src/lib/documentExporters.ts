import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, BorderStyle } from "docx";
import * as XLSX from "xlsx";
import type { Shipment, DocumentType } from "@shared/shipment";

export type ExportFormat = "pdf" | "docx" | "xlsx" | "html" | "txt";

export interface ExportDocData {
  exporterName: string;
  exporterAddress: string;
  buyerName: string;
  buyerAddress: string;
  buyerCountry: string;
  buyerPicName?: string;
  buyerPicRole?: string;
  buyerPhone?: string;
  buyerEmail?: string;
  signatoryName?: string;
  signatoryRole?: string;
  poNumber?: string;
  bankName?: string;
  bankAccountNo?: string;
  bankSwift?: string;
  paymentTerms?: string;
  pol: string;
  pod: string;
  incoterm: string;
  currency: string;
  productName: string;
  hsCode: string;
  bagsCount: number;
  netWeightMT: number;
  unitPricePerMT: number;
  totalAmount: number;
  amountInWords: string;
  contractLayout?: "1-page" | "2-page";
  contractSpecialTerms?: string;
  vesselName?: string;
  blNumber?: string;
  containerNo?: string;
  sealNo?: string;
  sellerSignatureImage?: string;
  sellerSignatureDate?: string;
  sellerVerificationCode?: string;
  buyerSignatureImage?: string;
  buyerSignatureDate?: string;
  buyerVerificationCode?: string;
  includeOfficialStamp?: boolean;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function getDocumentNumber(docType: DocumentType, isId: boolean): string {
  switch (docType) {
    case "Sales Contract":
      return "SC/IEI-ABF/XI/2026/001";
    case "Proforma Invoice":
      return "PI/IEI-ABF/XI/2026/001";
    case "Commercial Invoice":
      return "INV/IEI-DXB/XI/2026/001";
    case "Packing List":
      return "PL/IEI-DXB/XI/2026/001";
    case "Shipping Instruction":
      return "SI/IEI-KMTC/XI/2026/001";
    default:
      return "DOC/IEI/2026/001";
  }
}

export async function exportToDocx(
  docType: DocumentType,
  data: ExportDocData,
  isId: boolean
): Promise<Blob> {
  const docNo = getDocumentNumber(docType, isId);
  const isContract = docType === "Sales Contract";
  const is2Page = data.contractLayout === "2-page";

  const children: (Paragraph | Table)[] = [];

  // Kop Surat Perusahaan
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: data.exporterName.toUpperCase(),
          bold: true,
          size: 28, // 14pt
          color: "0F2942",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: data.exporterAddress,
          size: 19,
          color: "334155",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "Telp: +62 812 3456 7890 · Email: official@indicoexport.com",
          size: 18,
          color: "475569",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: "_________________________________________________________________________________",
          color: "0F2942",
        }),
      ],
    })
  );

  // Title Bar
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 100, after: 100 },
      children: [
        new TextRun({
          text: docType.toUpperCase(),
          bold: true,
          size: 26,
          color: "0F2942",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({ text: `${isId ? "No. Dokumen" : "Doc No"}: `, bold: true, size: 20 }),
        new TextRun({ text: `${docNo}   |   `, size: 20 }),
        new TextRun({ text: `${isId ? "Tanggal" : "Date"}: `, bold: true, size: 20 }),
        new TextRun({ text: `November 20, 2026   |   `, size: 20 }),
        new TextRun({ text: `${isId ? "Ref PO" : "Buyer PO Ref"}: `, bold: true, size: 20 }),
        new TextRun({ text: data.poNumber || "ABF/LOI/2026/108", size: 20 }),
      ],
    })
  );

  // Parties Table (Seller & Buyer)
  const cellBorder = {
    top: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
    left: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
    right: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
  };

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: cellBorder,
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: isId ? "PIHAK PENJUAL (THE SELLER):" : "THE SELLER / EXPORTER:",
                      bold: true,
                      size: 19,
                      color: "0F2942",
                    }),
                  ],
                }),
                new Paragraph({
                  children: [new TextRun({ text: data.exporterName, bold: true, size: 21 })],
                }),
                new Paragraph({ children: [new TextRun({ text: data.exporterAddress, size: 19 })] }),
                new Paragraph({
                  children: [new TextRun({ text: "Telp: +62 812 3456 7890 | Email: official@indicoexport.com", size: 19 })],
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Attn: ${data.signatoryName || "Muhajirin Fatona"} (${data.signatoryRole || "Export Director"})`,
                      size: 19,
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              borders: cellBorder,
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: isId ? "PIHAK PEMBELI (THE BUYER):" : "THE BUYER / CONSIGNEE:",
                      bold: true,
                      size: 19,
                      color: "0F2942",
                    }),
                  ],
                }),
                new Paragraph({
                  children: [new TextRun({ text: data.buyerName, bold: true, size: 21 })],
                }),
                new Paragraph({
                  children: [new TextRun({ text: `${data.buyerAddress}, ${data.buyerCountry}`, size: 19 })],
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Telp: ${data.buyerPhone || "+971 4 223 4567"} | Email: ${data.buyerEmail || "procurement@albarakahfoods.ae"}`,
                      size: 19,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Attn: ${data.buyerPicName || "Mr. Tariq Al-Mansoor"} (${data.buyerPicRole || "Procurement Director"})`,
                      size: 19,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
    new Paragraph({ spacing: { after: 150 } })
  );

  // Content for Sales Contract
  if (isContract) {
    const articles = is2Page
      ? [
          {
            title: isId ? "PASAL 1: KOMODITAS & STANDAR SPESIFIKASI" : "ARTICLE 1: COMMODITY & SPECIFICATION STANDARDS",
            body: isId
              ? `Komoditas: ${data.productName} | HS Code: ${data.hsCode}\nKualitas Mutu Ekspor Grade A (Ekspor Premium), Kadar Air ≤ 2.5%, Granul Mesh 16-18, Kelarutan 99%, Gula Pereduksi Maks 6%, Sukrosa 80-85%, Timbal (Pb) < 0.2 mg/kg, Bebas serangga hidup dan kontaminan.`
              : `Commodity: ${data.productName} | Harmonized System (HS) Code: ${data.hsCode}\nQuality: Grade A Export Quality (Premium Export Grade), Moisture Content ≤ 2.5%, Granule Size Mesh 16-18, Water Solubility 99%, Reducing Sugar Max 6%, Sucrose Content 80-85%, Lead (Pb) < 0.2 mg/kg, Aflatoxin Negative, Free from live insects and foreign contaminants.`,
          },
          {
            title: isId ? "PASAL 2: KUANTITAS, KEMASAN & TOLERANSI" : "ARTICLE 2: QUANTITY, PACKAGING & TOLERANCE",
            body: isId
              ? `Kuantitas Kontrak: ${data.netWeightMT} Metrik Ton (${data.netWeightMT * 1000} Kg neto) toleransi +/- 2% atas diskresi Penjual.\nStandar Kemasan: Karung kertas Kraft 3 lapis dengan kantong PE food-grade 20 kg neto per karung. Total ${data.bagsCount} karung dalam 1 x 20ft FCL Food Grade Dry Container.`
              : `Contract Quantity: ${data.netWeightMT} Metric Tons (${data.netWeightMT * 1000} Kgs net weight) with shipment tolerance of +/- 2% at Seller's discretion.\nPackaging Standard: Packed in 20 kg net weight heavy-duty 3-ply multiwall Kraft paper outer bags with food-grade PE inner liner. Total ${data.bagsCount} bags stowed in 1 x 20ft Full Container Load (FCL Dry Container).`,
          },
          {
            title: isId ? "PASAL 3: NILAI KONTRAK & KETENTUAN KOMERSIAL" : "ARTICLE 3: CONTRACT VALUE & COMMERCIAL TERMS",
            body: isId
              ? `Harga Satuan: ${data.currency} ${data.unitPricePerMT.toLocaleString("id-ID", { minimumFractionDigits: 2 })} / MT ${data.incoterm} Pelabuhan Makassar, Indonesia (Incoterms 2020).\nTotal Nilai: ${data.currency} ${data.totalAmount.toLocaleString("id-ID", { minimumFractionDigits: 2 })} (Terbilang: ${data.amountInWords}).\nHarga mencakup produk, kemasan ekspor, transportasi lokal, fumigasi terminal, dan pengurusan PEB Indonesia.`
              : `Contract Unit Price: ${data.currency} ${data.unitPricePerMT.toLocaleString("en-US", { minimumFractionDigits: 2 })} / MT ${data.incoterm} Port of Makassar, Indonesia (Incoterms 2020).\nTotal Contract Value: ${data.currency} ${data.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} (Say: ${data.amountInWords}).\nThe unit price includes product cost, export packaging, inland transport, fumigation, terminal handling charges, and Indonesian export customs clearance.`,
          },
          {
            title: isId ? "PASAL 4: SYARAT PEMBAYARAN & REKENING BANK" : "ARTICLE 4: TERMS OF PAYMENT & BANKING PROTOCOL",
            body: isId
              ? `Seluruh pembayaran via T/T USD ke ${data.bankName || "Bank Mandiri"}, No. Rek: ${data.bankAccountNo || "152-00-9876543-2"}, SWIFT: ${data.bankSwift || "BMRIIDJA"}, Penerima: ${data.exporterName}.\n1. Uang Muka (50% Down Payment): ${data.currency} ${(data.totalAmount * 0.5).toLocaleString("id-ID", { minimumFractionDigits: 2 })} disetor dalam 3 hari kerja bank setelah penandatanganan.\n2. Pelunasan (50% Balance Payment): ${data.currency} ${(data.totalAmount * 0.5).toLocaleString("id-ID", { minimumFractionDigits: 2 })} disetor dalam 5 hari kerja terhadap salinan B/L dan dokumen ekspor lengkap.`
              : `All payments via T/T USD to ${data.bankName || "Bank Mandiri"}, Acc No: ${data.bankAccountNo || "152-00-9876543-2"}, SWIFT: ${data.bankSwift || "BMRIIDJA"}, Beneficiary: ${data.exporterName}.\n1. Advance Deposit (50% Down Payment): ${data.currency} ${(data.totalAmount * 0.5).toLocaleString("en-US", { minimumFractionDigits: 2 })} payable within 3 banking days following contract execution.\n2. Final Balance (50% Balance Payment): ${data.currency} ${(data.totalAmount * 0.5).toLocaleString("en-US", { minimumFractionDigits: 2 })} payable within 5 working days upon receipt of scanned shipping documents including original Bill of Lading.`,
          },
          {
            title: isId ? "PASAL 5: JADWAL PENGAPALAN & LOGISTIK MARITIM" : "ARTICLE 5: SHIPMENT & MARITIME LOGISTICS SCHEDULE",
            body: isId
              ? `Pelabuhan Muat (POL): ${data.pol} | Pelabuhan Bongkar (POD): ${data.pod}\nBatas Akhir Pengapalan: 25 November 2026 | Pengapalan Parsial: Tidak Diizinkan | Pindah Kapal (Transshipment): Diizinkan.`
              : `Port of Loading (POL): ${data.pol} | Port of Discharge (POD): ${data.pod}\nLatest Shipment Date: November 25, 2026 | Partial Shipment: Not Allowed | Transshipment: Allowed.`,
          },
          {
            title: isId ? "PASAL 6: DOKUMEN PENGAPALAN RESMI" : "ARTICLE 6: OFFICIAL SHIPPING & EXPORT DOCUMENTS",
            body: isId
              ? `Penjual wajib menyerahkan dokumen internasional: (1) 3/3 Full Set Original Clean on Board Ocean Bill of Lading; (2) Faktur Komersial 3 asli; (3) Packing List 3 asli; (4) Certificate of Origin (COO Form AK / e-COO); (5) Sertifikat Fitosanitari Karantina Pertanian; (6) Certificate of Analysis (COA) & Sertifikat Halal.`
              : `Seller shall deliver: (1) Full Set (3/3) Original Clean on Board Ocean Bill of Lading; (2) Signed Commercial Invoice in 3 originals; (3) Signed Packing List in 3 originals; (4) Certificate of Origin (COO / Form AK / e-COO); (5) Phytosanitary Certificate; (6) Certificate of Analysis (COA) and official Halal Certificate.`,
          },
          {
            title: isId ? "PASAL 7: PEMERIKSAAN MUTU & SURVEYOR" : "ARTICLE 7: QUALITY INSPECTION & SURVEYOR VERIFICATION",
            body: isId
              ? `Pemeriksaan kuantitas dan mutu akhir dilakukan di gudang pelabuhan muat sebelum pemuatan peti kemas oleh surveyor independen internasional (Sucofindo / Surveyor Indonesia / SGS). Sertifikat inspeksi menjadi bukti pemenuhan spesifikasi sebelum kapal bertolak.`
              : `Final quantity and quality inspection shall be conducted at Port of Loading warehouse prior to container stuffing by an accredited independent surveyor (such as Sucofindo / Surveyor Indonesia / SGS). The inspection certificate issued serves as prima facie evidence of conformity.`,
          },
          {
            title: isId ? "PASAL 8: PROSEDUR KLAIM & GANTI RUGI" : "ARTICLE 8: CLAIMS PROCEDURE & REMEDIES",
            body: isId
              ? `Setiap klaim perbedaan mutu atau susut kuantitas wajib diajukan secara tertulis paling lambat 14 hari kalender sejak tanggal pembongkaran di pelabuhan tujuan dengan menyertakan Joint Survey Report surveyor internasional terakreditasi.`
              : `Any claims regarding quality discrepancy or quantity shortage must be lodged in writing within 14 calendar days from container discharge date at Port of Discharge, accompanied by accredited Joint Survey Report.`,
          },
          {
            title: isId ? "PASAL 9: KEADAAN KAHAR (FORCE MAJEURE)" : "ARTICLE 9: FORCE MAJEURE & FRUSTRATION OF CONTRACT",
            body: isId
              ? `Tidak ada pihak yang bertanggung jawab atas keterlambatan akibat Keadaan Kahar sesuai ICC Force Majeure Clause 2020 (bencana alam, perang, blokade maritim, embargo darurat pemerintah). Pemberitahuan tertulis wajib disampaikan dalam 7 hari.`
              : `Neither party shall be liable for delay or failure resulting from Force Majeure as defined under ICC Force Majeure Clause 2020 (natural disasters, armed conflicts, maritime blockades, statutory export/import bans). Written notice must be submitted within 7 days.`,
          },
          {
            title: isId ? "PASAL 10: HUKUM YANG BERLAKU & ARBITRASE" : "ARTICLE 10: GOVERNING LAW & DISPUTE RESOLUTION",
            body: isId
              ? `Kontrak tunduk pada Incoterms 2020 dan hukum perdagangan internasional ICC. Sengketa diselesaikan melalui musyawarah mufakat 30 hari, atau diajukan ke Badan Arbitrase Nasional Indonesia (BANI) di Jakarta atau ICC Court of Arbitration.`
              : `This contract shall be construed under Incoterms 2020 and international commercial law. Any disputes shall first be resolved through amicable negotiations within 30 days, failing which the dispute shall be finally settled under the rules of BANI (Jakarta) or ICC International Court of Arbitration.`,
          },
        ]
      : [
          {
            title: isId ? "PASAL 1: KOMODITAS & SPESIFIKASI" : "ARTICLE 1: COMMODITY & SPECIFICATION",
            body: isId
              ? `Komoditas: ${data.productName} | Kode HS: ${data.hsCode}\nKualitas: Mutu Ekspor Grade A, Kadar Air ≤ 2.5%, Mesh 16-18, Kelarutan 99%, Gula Pereduksi Maks 6%, Sukrosa 80-85%, Timbal (Pb) < 0.2 mg/kg.`
              : `Commodity: ${data.productName} | HS Code: ${data.hsCode}\nQuality: Grade A Export Quality, Moisture ≤ 2.5%, Granule Size Mesh 16-18, Solubility 99%, Reducing Sugar Max 6%, Sucrose 80-85%, Lead (Pb) < 0.2 mg/kg.`,
          },
          {
            title: isId ? "PASAL 2: KUANTITAS, KEMASAN & HARGA" : "ARTICLE 2: QUANTITY, PACKING & PRICE",
            body: isId
              ? `Kuantitas: ${data.netWeightMT} MT (${data.netWeightMT * 1000} Kg) toleransi +/- 2% opsi Penjual.\nKemasan: Karung kertas Kraft 3 lapis dengan kantong PE food-grade 20 kg neto. Total ${data.bagsCount} karung dalam 1 x 20ft Kontainer Kering.\nHarga & Nilai: ${data.currency} ${data.unitPricePerMT.toLocaleString("id-ID", { minimumFractionDigits: 2 })} / MT ${data.incoterm} Makassar | Total: ${data.currency} ${data.totalAmount.toLocaleString("id-ID", { minimumFractionDigits: 2 })} (${data.amountInWords}).`
              : `Quantity: ${data.netWeightMT} Metric Tons (${data.netWeightMT * 1000} Kgs) +/- 2% tolerance at Seller's option.\nPacking: Packed in 20 kg net weight food-grade PE inner liner and 3-ply Kraft Paper outer bag. Total ${data.bagsCount} bags loaded in 1 x 20ft Dry Container.\nPrice & Value: ${data.currency} ${data.unitPricePerMT.toLocaleString("en-US", { minimumFractionDigits: 2 })} / MT ${data.incoterm} Makassar | Total Value: ${data.currency} ${data.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} (Say: ${data.amountInWords}).`,
          },
          {
            title: isId ? "PASAL 3: SYARAT PEMBAYARAN" : "ARTICLE 3: TERMS OF PAYMENT",
            body: isId
              ? `Pembayaran melalui Telegraphic Transfer (T/T) ke ${data.bankName || "Bank Mandiri"}, No. Rek: ${data.bankAccountNo || "152-00-9876543-2"}, SWIFT: ${data.bankSwift || "BMRIIDJA"}:\n1. Uang Muka (DP 50%): ${data.currency} ${(data.totalAmount * 0.5).toLocaleString("id-ID", { minimumFractionDigits: 2 })} dalam 3 hari kerja.\n2. Pelunasan Sisa (50%): ${data.currency} ${(data.totalAmount * 0.5).toLocaleString("id-ID", { minimumFractionDigits: 2 })} dalam 5 hari kerja terhadap salinan dokumen B/L.`
              : `Payment by Telegraphic Transfer (T/T) to ${data.bankName || "Bank Mandiri"}, Acc No: ${data.bankAccountNo || "152-00-9876543-2"}, SWIFT: ${data.bankSwift || "BMRIIDJA"}:\n1. 50% Down Payment: ${data.currency} ${(data.totalAmount * 0.5).toLocaleString("en-US", { minimumFractionDigits: 2 })} payable within 3 working days.\n2. 50% Balance Payment: ${data.currency} ${(data.totalAmount * 0.5).toLocaleString("en-US", { minimumFractionDigits: 2 })} payable within 5 working days against scanned shipping documents.`,
          },
          {
            title: isId ? "PASAL 4: KETENTUAN PENGAPALAN" : "ARTICLE 4: SHIPMENT TERMS",
            body: isId
              ? `POL: ${data.pol} | POD: ${data.pod}\nBatas Pengapalan: 25 November 2026 | Partial: Tidak Diizinkan | Transshipment: Diizinkan.`
              : `Port of Loading: ${data.pol} | Port of Discharge: ${data.pod}\nLatest Shipment: November 25, 2026 | Partial Shipment: Not Allowed | Transshipment: Allowed.`,
          },
          {
            title: isId ? "PASAL 5: DOKUMEN YANG DIPERLUKAN" : "ARTICLE 5: REQUIRED DOCUMENTS",
            body: isId
              ? `Penjual wajib menyediakan: (1) 3/3 B/L Clean on Board; (2) Faktur Komersial 3 asli; (3) Packing List 3 asli; (4) COO (Form AK / e-COO); (5) Sertifikat Fitosanitari; (6) COA & Sertifikat Halal.`
              : `Seller shall provide: (1) Full Set (3/3) B/L Clean on Board; (2) Commercial Invoice in 3 originals; (3) Packing List in 3 originals; (4) COO (Form AK / e-COO); (5) Phytosanitary Certificate; (6) COA and Halal Certificate.`,
          },
          {
            title: isId ? "PASAL 6: KEADAAN KAHAR & ARBITRASE" : "ARTICLE 6: FORCE MAJEURE & ARBITRATION",
            body: isId
              ? `Keadaan Kahar (bencana alam, perang, embargo) membebaskan tanggung jawab keterlambatan. Perselisihan diselesaikan secara musyawarah atau diajukan ke BANI sesuai peraturan ICC.`
              : `Neither party shall be liable for delay or failure due to Force Majeure. Any disputes shall be settled amicably, failing which the dispute shall be submitted to BANI in accordance with ICC rules.`,
          },
        ];

    articles.forEach((art) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: art.title,
              bold: true,
              size: 23, // ~11.5pt
              color: "0F2942",
            }),
          ],
          spacing: { before: 120, after: 40 },
        }),
        new Paragraph({
          children: [new TextRun({ text: art.body, size: 21 })], // ~10.5pt
          spacing: { after: 100 },
        })
      );
    });
  } else {
    // Format Tabel Barang untuk Invoice / Packing List
    const tableHeaderBorder = {
      top: { style: BorderStyle.SINGLE, size: 1, color: "0F2942" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "0F2942" },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
    };

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: tableHeaderBorder,
                children: [new Paragraph({ children: [new TextRun({ text: "Marks & Numbers", bold: true, size: 19 })] })],
              }),
              new TableCell({
                borders: tableHeaderBorder,
                children: [new Paragraph({ children: [new TextRun({ text: "Description of Goods", bold: true, size: 19 })] })],
              }),
              new TableCell({
                borders: tableHeaderBorder,
                children: [new Paragraph({ children: [new TextRun({ text: "Quantity", bold: true, size: 19 })] })],
              }),
              new TableCell({
                borders: tableHeaderBorder,
                children: [new Paragraph({ children: [new TextRun({ text: "Unit Price", bold: true, size: 19 })] })],
              }),
              new TableCell({
                borders: tableHeaderBorder,
                children: [new Paragraph({ children: [new TextRun({ text: "Total Amount", bold: true, size: 19 })] })],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                borders: cellBorder,
                children: [new Paragraph({ children: [new TextRun({ text: `IEI / DUBAI / 2026\n1 - ${data.bagsCount}`, size: 19 })] })],
              }),
              new TableCell({
                borders: cellBorder,
                children: [new Paragraph({ children: [new TextRun({ text: `${data.productName}\nHS Code: ${data.hsCode}\nPacking: ${data.bagsCount} bags @ 20 kg`, size: 19 })] })],
              }),
              new TableCell({
                borders: cellBorder,
                children: [new Paragraph({ children: [new TextRun({ text: `${data.netWeightMT} MT\n(${data.bagsCount} Bags)`, size: 19 })] })],
              }),
              new TableCell({
                borders: cellBorder,
                children: [new Paragraph({ children: [new TextRun({ text: `${data.currency} ${data.unitPricePerMT.toFixed(2)}`, size: 19 })] })],
              }),
              new TableCell({
                borders: cellBorder,
                children: [new Paragraph({ children: [new TextRun({ text: `${data.currency} ${data.totalAmount.toFixed(2)}`, bold: true, size: 19 })] })],
              }),
            ],
          }),
        ],
      }),
      new Paragraph({ spacing: { after: 120 } })
    );
  }

  // Witness Clause
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 150 },
      children: [
        new TextRun({
          text: isId
            ? "DEMIKIANLAH, kedua belah pihak telah menyepakati dan menandatangani dokumen ini dengan kekuatan hukum yang sah."
            : "IN WITNESS WHEREOF, both parties have executed this document in duplicate with equal legal force.",
          italics: true,
          bold: true,
          size: 21,
        }),
      ],
    })
  );

  // Signatures Table
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({ children: [new TextRun({ text: isId ? "PIHAK PEMBELI (THE BUYER)" : "THE BUYER", bold: true, size: 19 })] }),
                new Paragraph({ children: [new TextRun({ text: `For ${data.buyerName}`, bold: true, size: 20 })] }),
                data.buyerSignatureImage
                  ? new Paragraph({
                      children: [
                        new TextRun({
                          text: `[DIGITALLY SIGNED BY BUYER · ${data.buyerVerificationCode || "ABF-DIGISIG-1092-DXB"}]`,
                          italics: true,
                          color: "0369a1",
                          size: 17,
                        }),
                      ],
                      spacing: { before: 200, after: 200 },
                    })
                  : new Paragraph({ text: "", spacing: { after: 600 } }),
                new Paragraph({ children: [new TextRun({ text: data.buyerPicName || "Mr. Tariq Al-Mansoor", bold: true, size: 21 })] }),
                new Paragraph({ children: [new TextRun({ text: data.buyerPicRole || "Procurement Director", size: 19 })] }),
              ],
            }),
            new TableCell({
              borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({ children: [new TextRun({ text: isId ? "PIHAK PENJUAL (THE SELLER)" : "THE SELLER", bold: true, size: 19 })] }),
                new Paragraph({ children: [new TextRun({ text: `For ${data.exporterName}`, bold: true, size: 20 })] }),
                data.sellerSignatureImage
                  ? new Paragraph({
                      children: [
                        new TextRun({
                          text: `[DIGITALLY SIGNED & VERIFIED · ${data.sellerVerificationCode || "IEI-DIGISIG-8849-DXB"}]`,
                          italics: true,
                          color: "047857",
                          size: 17,
                        }),
                      ],
                      spacing: { before: 200, after: 200 },
                    })
                  : new Paragraph({ text: "", spacing: { after: 600 } }),
                new Paragraph({ children: [new TextRun({ text: data.signatoryName || "Muhajirin Fatona", bold: true, size: 21 })] }),
                new Paragraph({ children: [new TextRun({ text: data.signatoryRole || "Export Director", size: 19 })] }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1000,
              bottom: 1000,
              left: 1200,
              right: 1200,
            },
          },
        },
        children,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

export function exportToXlsx(
  docType: DocumentType,
  data: ExportDocData,
  isId: boolean
): Blob {
  const docNo = getDocumentNumber(docType, isId);
  const wb = XLSX.utils.book_new();

  // Sheet 1: Ringkasan & Pihak
  const summaryData = [
    ["EKSPORFLOW EXPORT OPERATIONS - OFFICIAL DOCUMENT EXPORT"],
    ["Document Type", docType.toUpperCase()],
    ["Document Number", docNo],
    ["Issue Date", "November 20, 2026"],
    ["Buyer PO Reference", data.poNumber || "ABF/LOI/2026/108"],
    ["Incoterms", `${data.incoterm} Pelabuhan Makassar, Indonesia (Incoterms 2020)`],
    ["Payment Terms", data.paymentTerms || "50% Down Payment, 50% against Copy of B/L"],
    ["Currency", data.currency],
    [],
    ["SELLER / EXPORTER", "BUYER / CONSIGNEE"],
    ["Company Name", data.exporterName, "Company Name", data.buyerName],
    ["Address", data.exporterAddress, "Address", `${data.buyerAddress}, ${data.buyerCountry}`],
    ["Contact", "+62 812 3456 7890 | official@indicoexport.com", "Contact", `${data.buyerPhone || "+971 4 223 4567"} | ${data.buyerEmail || "procurement@albarakahfoods.ae"}`],
    ["Signatory / Contact Person", `${data.signatoryName || "Muhajirin Fatona"} (${data.signatoryRole || "Export Director"})`, "Buyer PIC", `${data.buyerPicName || "Mr. Tariq Al-Mansoor"} (${data.buyerPicRole || "Procurement Director"})`],
    [],
    ["BANKING PROTOCOL"],
    ["Bank Name", data.bankName || "PT. Bank Mandiri (Persero) Tbk"],
    ["Account Number", data.bankAccountNo || "152-00-9876543-2"],
    ["SWIFT Code", data.bankSwift || "BMRIIDJA"],
    ["Beneficiary Name", data.exporterName],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, "Informasi Dokumen");

  // Sheet 2: Rincian Barang & Finansial
  const itemsData = [
    ["No", "Marks & Numbers", "Description of Goods", "HS Code", "Packaging", "Quantity (MT)", "Cartons / Bags", "Unit Price (USD/MT)", "Total Amount (USD)"],
    [
      1,
      `IEI / DUBAI / 2026 / 1-${data.bagsCount}`,
      data.productName,
      data.hsCode,
      "3-ply Kraft Paper + PE food-grade inner (20kg/bag)",
      data.netWeightMT,
      data.bagsCount,
      data.unitPricePerMT,
      data.totalAmount,
    ],
    [],
    ["", "", "", "", "TOTAL NET WEIGHT", `${data.netWeightMT} MT`, "TOTAL BAGS", data.bagsCount, data.totalAmount],
    ["TOTAL VALUE IN WORDS", data.amountInWords],
  ];

  const wsItems = XLSX.utils.aoa_to_sheet(itemsData);
  XLSX.utils.book_append_sheet(wb, wsItems, "Rincian Barang & Finansial");

  // Sheet 3: Logistik & Pengapalan
  const logisticsData = [
    ["LOGISTICS & SHIPMENT SPECIFICATIONS"],
    ["Port of Loading (POL)", data.pol],
    ["Port of Discharge (POD)", data.pod],
    ["Vessel / Voyage", data.vesselName || "KMTC SHIMIZU V.2611N"],
    ["Bill of Lading (B/L) No", data.blNumber || "KMTC-MKS0091827"],
    ["Container & Seal No", `${data.containerNo || "TGHU 2468135"} / Seal: ${data.sealNo || "IDMKS998877"}`],
    ["Container Mode", "1 x 20ft FCL Dry Container (Food Grade)"],
    ["Latest Shipment Date", "November 25, 2026"],
    ["Partial Shipment", "Not Allowed"],
    ["Transshipment", "Allowed"],
  ];

  const wsLogistics = XLSX.utils.aoa_to_sheet(logisticsData);
  XLSX.utils.book_append_sheet(wb, wsLogistics, "Logistik & Pengapalan");

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

export function exportToHtml(
  docType: DocumentType,
  data: ExportDocData,
  isId: boolean
): Blob {
  const docNo = getDocumentNumber(docType, isId);
  const paperElement = document.querySelector(".paper-document");
  const contentHtml = paperElement ? paperElement.outerHTML : `<div>Dokumen ${docType} - ${docNo}</div>`;

  const fullHtml = `<!DOCTYPE html>
<html lang="${isId ? "id" : "en"}">
<head>
  <meta charset="UTF-8">
  <title>${docType} - ${docNo}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; background: #f8fafc; padding: 24px; color: #0f172a; margin: 0; }
    .paper-document { background: #ffffff; max-width: 860px; margin: 0 auto; padding: 40px; box-shadow: 0 4px 14px rgba(0,0,0,0.08); border-radius: 4px; }
    .paper-letterhead-wrap { margin-bottom: 6px; }
    .letterhead-brand { display: flex; align-items: center; gap: 14px; }
    .company-name { font-size: 18px; font-weight: 800; color: #0f2942; margin: 0; text-transform: uppercase; }
    .company-details, .company-contact { font-size: 11px; margin: 2px 0 0; color: #334155; }
    .letterhead-divider-line { border-bottom: 2px solid #0f2942; margin-top: 4px; }
    .doc-title-bar { text-align: center; margin: 6px 0 10px; padding: 6px 14px; background: #0f2942; border-radius: 3px; }
    .doc-title-bar h2 { font-size: 14px; font-weight: 800; color: #ffffff; margin: 0; letter-spacing: 0.08em; }
    .doc-contract-ref-bar { display: flex; justify-content: space-between; font-size: 11.5px; font-weight: 600; color: #0f2942; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 8px; }
    .doc-contract-parties-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 10px; }
    .contract-party-card { border: 1px solid #cbd5e1; border-radius: 4px; padding: 8px 12px; font-size: 11.5px; }
    .contract-party-header { background: #f1f5f9; padding: 3px 8px; margin: -8px -12px 6px; font-size: 9.5px; font-weight: 700; color: #0f2942; }
    .party-name { font-size: 12.5px; font-weight: 700; color: #0f2942; margin-bottom: 2px; }
    .contract-articles-wrapper { display: flex; flex-direction: column; gap: 8px; }
    .contract-article-block { border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
    .article-title { font-size: 12.5px; font-weight: 700; color: #0f2942; margin: 0 0 2px; }
    .contract-article-block p, .article-ordered-list { font-size: 12px; line-height: 1.4; color: #0f172a; margin: 0 0 2px; }
    .doc-witness-clause { font-size: 11.5px; font-style: italic; font-weight: 600; text-align: center; margin: 16px 0 10px; }
    .doc-dual-signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 14px; }
    .sig-side { text-align: left; }
    .sig-header-txt { font-size: 10.5px; font-weight: 700; color: #0f2942; text-transform: uppercase; }
    .sig-company-name { font-size: 12px; font-weight: 700; color: #0f172a; }
    .sig-box-space { height: 54px; }
    .sig-name { font-size: 12.5px; font-weight: 700; color: #0f172a; }
    .sig-sub { font-size: 11.5px; color: #64748b; }
    @media print {
      body { background: transparent; padding: 0; }
      .paper-document { box-shadow: none; padding: 0; max-width: 100%; }
    }
  </style>
</head>
<body>
  ${contentHtml}
</body>
</html>`;

  return new Blob([fullHtml], { type: "text/html;charset=utf-8" });
}

export function exportToTxt(
  docType: DocumentType,
  data: ExportDocData,
  isId: boolean
): Blob {
  const docNo = getDocumentNumber(docType, isId);
  const lines: string[] = [
    `================================================================================`,
    `                      ${data.exporterName.toUpperCase()}`,
    `           ${data.exporterAddress}`,
    `      Telp: +62 812 3456 7890 · Email: official@indicoexport.com`,
    `================================================================================`,
    ``,
    `                              ${docType.toUpperCase()}`,
    `Dokumen No: ${docNo}  |  Tanggal: November 20, 2026  |  PO Ref: ${data.poNumber || "ABF/LOI/2026/108"}`,
    `--------------------------------------------------------------------------------`,
    ``,
    `PIHAK PENJUAL (THE SELLER):`,
    `  Nama Perusahaan : ${data.exporterName}`,
    `  Alamat          : ${data.exporterAddress}`,
    `  Kontak          : Telp +62 812 3456 7890 | official@indicoexport.com`,
    `  Penandatangan   : ${data.signatoryName || "Muhajirin Fatona"} (${data.signatoryRole || "Export Director"})`,
    ``,
    `PIHAK PEMBELI (THE BUYER):`,
    `  Nama Perusahaan : ${data.buyerName}`,
    `  Alamat          : ${data.buyerAddress}, ${data.buyerCountry}`,
    `  Kontak          : Telp ${data.buyerPhone || "+971 4 223 4567"} | ${data.buyerEmail || "procurement@albarakahfoods.ae"}`,
    `  Attn            : ${data.buyerPicName || "Mr. Tariq Al-Mansoor"} (${data.buyerPicRole || "Procurement Director"})`,
    `--------------------------------------------------------------------------------`,
    ``,
    `RINGKASAN KOMERSIAL & FINANSIAL:`,
    `  Komoditas      : ${data.productName}`,
    `  Kode HS        : ${data.hsCode}`,
    `  Kuantitas      : ${data.netWeightMT} Metric Tons (${data.bagsCount} Bags @ 20 kg)`,
    `  Harga Satuan   : ${data.currency} ${data.unitPricePerMT.toFixed(2)} / MT ${data.incoterm} Pelabuhan Makassar`,
    `  Total Nilai    : ${data.currency} ${data.totalAmount.toFixed(2)}`,
    `  Terbilang      : ${data.amountInWords}`,
    `  Syarat Bayar   : ${data.paymentTerms || "50% Down Payment, 50% against Copy of B/L"}`,
    `  Rekening Bank  : ${data.bankName || "Bank Mandiri"}, Acc: ${data.bankAccountNo || "152-00-9876543-2"}, SWIFT: ${data.bankSwift || "BMRIIDJA"}`,
    ``,
    `PENGAPALAN & LOGISTIK:`,
    `  Pelabuhan Muat : ${data.pol}`,
    `  Pelabuhan Tuju : ${data.pod}`,
    `  Batas Kirim    : November 25, 2026 (Partial: Not Allowed | Transshipment: Allowed)`,
    `  Kapal / Voyage : ${data.vesselName || "KMTC SHIMIZU V.2611N"}`,
    `  Nomor B/L      : ${data.blNumber || "KMTC-MKS0091827"}`,
    `  Kontainer/Seal : ${data.containerNo || "TGHU 2468135"} / Seal: ${data.sealNo || "IDMKS998877"}`,
    ``,
    `--------------------------------------------------------------------------------`,
    isId
      ? `DEMIKIANLAH, kedua belah pihak telah menyepakati dan menandatangani dokumen ini.`
      : `IN WITNESS WHEREOF, both parties have executed this document in duplicate.`,
    ``,
    `  [ THE BUYER ]                                   [ THE SELLER ]`,
    `  For ${data.buyerName}        For ${data.exporterName}`,
    ``,
    `  ${data.buyerPicName || "Mr. Tariq Al-Mansoor"}                           ${data.signatoryName || "Muhajirin Fatona"}`,
    `  ${data.buyerPicRole || "Procurement Director"}                            ${data.signatoryRole || "Export Director"}`,
    `================================================================================`,
  ];

  return new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
}
