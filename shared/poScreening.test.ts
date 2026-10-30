import { describe, expect, it } from "vitest";
import { parsePoTextAndScreen, SAMPLE_POS } from "./poScreening";

describe("PO Text Parsing & AI Advisor Buyer Screening (4 Pillars)", () => {
  it("mengekstrak parameter Nordic Pantry AB dan memvalidasi 4 pilar identitas", () => {
    const result = parsePoTextAndScreen(SAMPLE_POS[0].text);
    expect(result.reference).toBe("PO-2026/SE-089");
    expect(result.buyer).toContain("Nordic Pantry AB");
    expect(result.buyerCountry).toBe("Swedia");
    expect(result.destination).toContain("Gothenburg");
    expect(result.hsCode).toBe("1702.90");
    expect(result.incoterm).toBe("CIF");

    // 4 Pilar
    const { pillars } = result.validation;
    expect(pillars.companyName.isValid).toBe(true);
    expect(pillars.companyEmail.isValid).toBe(true);
    expect(pillars.companyEmail.value).toContain("@nordicpantry.se");
    expect(pillars.contactNumber.isValid).toBe(true);
    expect(pillars.contactNumber.value).toContain("+46");
    expect(pillars.companyWebsite.isValid).toBe(true);
    expect(pillars.companyWebsite.value).toContain("nordicpantry.se");

    expect(result.validation.status).toBe("verified");
    expect(result.validation.score).toBeGreaterThanOrEqual(85);
  });

  it("mendeteksi peringatan jika email menggunakan domain publik gratisan", () => {
    const poWithGmail = `
      PO Number: PO-TEST-01
      Company Name: Kyoto Trading Co., Ltd.
      Email: kyototrading@gmail.com
      Phone: +81 75 221 8830
      Port of Discharge: Tokyo
    `;
    const result = parsePoTextAndScreen(poWithGmail);
    expect(result.validation.pillars.companyEmail.isValid).toBe(false);
    expect(result.validation.pillars.companyEmail.note).toContain("gratisan");
  });

  it("berhasil membaca PO format bahasa Indonesia dengan kata kunci Pembeli, No. PO, dsb", () => {
    const poIndo = `
      SURAT PESANAN PEMBELIAN (PURCHASE ORDER)
      No. PO: PO/ID/2026/045
      Tanggal: 28 Oktober 2026

      Pembeli: PT Pacific Trade Asia Ltd
      Alamat: Raffles Place, Singapore
      Email: info@pacifictrade.sg
      Telepon: +65 6789 1234
      Website: https://www.pacifictrade.sg

      Pelabuhan Bongkar: Port of Singapore
      Negara Tujuan: Singapura
      Syarat Penyerahan: FOB Tanjung Priok
      Komoditas: Gula Kelapa Organik (Organic Coconut Sugar)
      Kode HS: 1702.90
      Kuantitas: 20 MT
      Harga Satuan: USD 1950 per MT
    `;
    const result = parsePoTextAndScreen(poIndo);
    expect(result.reference).toBe("PO/ID/2026/045");
    expect(result.buyer).toContain("Pacific Trade Asia");
    expect(result.buyerCountry).toBe("Singapura");
    expect(result.destination).toContain("Singapore");
    expect(result.product).toContain("Organic Coconut Sugar");
    expect(result.incoterm).toBe("FOB");
    expect(result.validation.pillars.companyEmail.isValid).toBe(true);
  });

  it("berhasil mengekstrak buyer dari format Bill To / Sold To dan nama file", () => {
    const poBillTo = `
      PURCHASE ORDER
      P.O. # 998822
      Date: October 2026

      Bill To:
      Summit Coffee Importers LLC
      450 Broadway, New York, USA
      Contact: orders@summitcoffee.com

      Ship To:
      Port of New York / New Jersey
      Terms: CIF New York
      Item: Specialty Arabica Coffee Beans
    `;
    const result = parsePoTextAndScreen(poBillTo, "PO-998822-Summit.pdf");
    expect(result.reference).toBe("998822");
    expect(result.buyer).toContain("Summit Coffee Importers");
    expect(result.buyerCountry).toBe("Amerika Serikat");
    expect(result.destination).toContain("New York");
    expect(result.incoterm).toBe("CIF");
  });
});
