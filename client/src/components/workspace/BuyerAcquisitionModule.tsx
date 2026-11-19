import React, { useState } from "react";
import {
  Search,
  ShieldCheck,
  ShieldAlert,
  Building2,
  Mail,
  Send,
  FileText,
  Copy,
  Printer,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Filter,
  Check,
  RefreshCw,
  ExternalLink,
  Users,
  Layers,
  ArrowRight,
  TrendingUp,
  Inbox,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import type { Shipment } from "@shared/shipment";
import type { ScreenId } from "@shared/risk";
import { StatusPill } from "./Primitives";

export interface VerifiedBuyer {
  id: string;
  companyName: string;
  country: string;
  countryCode: string;
  city: string;
  contactPerson: string;
  contactRole: string;
  email: string;
  phone: string;
  commodityInterest: string;
  annualDemandVolume: string;
  trustScore: number; // 0 - 100
  registrationNumber: string;
  verificationSource: string;
  isLegalVerified: boolean;
  isFakeBuyerRisk: boolean;
  riskDetails: string;
  tags: string[];
}

const INITIAL_BUYERS: VerifiedBuyer[] = [
  {
    id: "buyer-01",
    companyName: "Nordic Specialty Coffee ApS",
    country: "Denmark",
    countryCode: "DK",
    city: "Copenhagen",
    contactPerson: "Lars Mikkelsen",
    contactRole: "Head of Green Coffee Sourcing",
    email: "sourcing@nordiccoffee.dk",
    phone: "+45 32 88 91 00",
    commodityInterest: "Kopi Arabika Gayo & Mandheling Specialty",
    annualDemandVolume: "6 x 20ft FCL / Tahun (120 MT)",
    trustScore: 98,
    registrationNumber: "CVR-38910244",
    verificationSource: "Danish Central Business Register (Erhvervsstyrelsen)",
    isLegalVerified: true,
    isFakeBuyerRisk: false,
    riskDetails: "Legalitas terkonfirmasi, riwayat impor kopi aktif 8 tahun tanpa wanprestasi.",
    tags: ["Green Coffee", "Specialty", "EU Organic"],
  },
  {
    id: "buyer-02",
    companyName: "Hamburg Spices & Botanicals GmbH",
    country: "Jerman",
    countryCode: "DE",
    city: "Hamburg",
    contactPerson: "Klaus Von Berg",
    contactRole: "Procurement Director",
    email: "k.vonberg@hamburgspices.de",
    phone: "+49 40 761 9022",
    commodityInterest: "Vanili Gourmet Planifolia, Pala & Cengkeh",
    annualDemandVolume: "4 x 20ft FCL / Tahun (60 MT)",
    trustScore: 96,
    registrationNumber: "HRB 142980",
    verificationSource: "Handelsregister Deutschland & D-U-N-S Verified",
    isLegalVerified: true,
    isFakeBuyerRisk: false,
    riskDetails: "Perusahaan terdaftar di Handelsregister, kepatuhan batas residu pestisida ketat.",
    tags: ["Spices", "Gourmet Vanilla", "Direct Sourcing"],
  },
  {
    id: "buyer-03",
    companyName: "Arabesque Shisha & Biomass Trading LLC",
    country: "Uni Emirat Arab",
    countryCode: "AE",
    city: "Dubai",
    contactPerson: "Tariq Al-Mansoor",
    contactRole: "Managing Director",
    email: "tariq@arabesquetrading.ae",
    phone: "+971 4 390 8821",
    commodityInterest: "Briket Arang Tempurung Kelapa (Coconut Charcoal)",
    annualDemandVolume: "12 x 40ft HC / Tahun (300 MT)",
    trustScore: 94,
    registrationNumber: "DED License 718290",
    verificationSource: "Dubai Chamber of Commerce & Industry",
    isLegalVerified: true,
    isFakeBuyerRisk: false,
    riskDetails: "Legalitas aktif di Dubai Economy, metode pembayaran TT 30% deposit + 70% B/L copy.",
    tags: ["Charcoal Briquettes", "Hookah Grade", "Bulk FCL"],
  },
  {
    id: "buyer-04",
    companyName: "Pacific Organic Cocoa & Oils Inc.",
    country: "Amerika Serikat",
    countryCode: "US",
    city: "San Francisco, CA",
    contactPerson: "Sarah Jenkins",
    contactRole: "Global Supply Chain VP",
    email: "s.jenkins@pacificorganicoils.com",
    phone: "+1 415 620 9940",
    commodityInterest: "Biji Kakao Fermentasi & Virgin Coconut Oil (VCO)",
    annualDemandVolume: "8 x 20ft FCL / Tahun (150 MT)",
    trustScore: 97,
    registrationNumber: "US EIN 82-4190284",
    verificationSource: "California Secretary of State & US FDA Registered",
    isLegalVerified: true,
    isFakeBuyerRisk: false,
    riskDetails: "Terdaftar resmi di FDA dan USDA NOP. Pembayaran via Usance L/C 60 days atau TT.",
    tags: ["Organic Cocoa", "Cold Pressed VCO", "FDA Compliant"],
  },
  {
    id: "buyer-05",
    companyName: "Kanto Craft Rattan & Home Co., Ltd.",
    country: "Jepang",
    countryCode: "JP",
    city: "Yokohama",
    contactPerson: "Kenji Sato",
    contactRole: "Import & Sourcing Manager",
    email: "kenji.sato@kantocraft.co.jp",
    phone: "+81 45 671 4430",
    commodityInterest: "Furnitur Rotan Alami & Kerajinan Serat Bambu",
    annualDemandVolume: "5 x 40ft HC / Tahun (75 MT)",
    trustScore: 92,
    registrationNumber: "JP Corporate ID 0200-01-089123",
    verificationSource: "National Tax Agency Japan & JETRO Directory",
    isLegalVerified: true,
    isFakeBuyerRisk: false,
    riskDetails: "Standar inspeksi kemasan dan sertifikasi fumigasi ketat sebelum keberangkatan.",
    tags: ["Natural Rattan", "Handicrafts", "JAS Compliant"],
  },
  {
    id: "buyer-06",
    companyName: "Global Trade Logistics Int. (Suspicious Entity)",
    country: "Inggris Raya",
    countryCode: "GB",
    city: "London",
    contactPerson: "Unknown / Anonymous",
    contactRole: "Broker",
    email: "exportbuyer.inquiry99@gmail.com",
    phone: "+44 70 1234 5678",
    commodityInterest: "Briket Arang & Kopi Campuran",
    annualDemandVolume: "Tidak disebutkan spesifik",
    trustScore: 32,
    registrationNumber: "Tidak terverifikasi",
    verificationSource: "Companies House (Perusahaan Dorman / Alamat Virtual Mailbox)",
    isLegalVerified: false,
    isFakeBuyerRisk: true,
    riskDetails: "PERINGATAN RISIKO PENIPUAN: Menggunakan email publik gratis, alamat virtual tanpa staf, meminta pengiriman dokumen asli tanpa jaminan pembayaran.",
    tags: ["High Risk", "Fake Buyer Warning", "Unverified"],
  },
];

interface BuyerAcquisitionModuleProps {
  shipment: Shipment;
  update: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void;
  navigate: (screen: ScreenId) => void;
}

export function BuyerAcquisitionModule({
  shipment,
  update,
  navigate,
}: BuyerAcquisitionModuleProps) {
  const [activeTab, setActiveTab] = useState<"discovery" | "proposals" | "bulk_email">("discovery");
  
  // Search & filter state
  const [selectedCommodity, setSelectedCommodity] = useState<string>("all");
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [selectedBuyerIds, setSelectedBuyerIds] = useState<string[]>(["buyer-01", "buyer-02"]);

  // Proposal Generator state
  const [proposalType, setProposalType] = useState<"inquiry" | "quotation" | "negotiation">("quotation");
  const [activeProposalBuyer, setActiveProposalBuyer] = useState<VerifiedBuyer>(INITIAL_BUYERS[0]);
  const [quotePrice, setQuotePrice] = useState<string>("4,250");
  const [quoteIncoterm, setQuoteIncoterm] = useState<string>("FOB");
  const [quotePort, setQuotePort] = useState<string>("Tanjung Priok, Jakarta");
  const [quoteMoq, setQuoteMoq] = useState<string>("1 x 20ft FCL (18.5 Metric Ton)");
  const [quoteValidity, setQuoteValidity] = useState<string>("14 Hari Kerja");
  const [quotePaymentTerms, setQuotePaymentTerms] = useState<string>("30% TT Deposit saat konfirmasi pesanan, 70% pelunasan terhadap copy B/L via Scanned TT");

  // Bulk Email Copywriter state
  const [emailTone, setEmailTone] = useState<"formal" | "semi-formal" | "casual">("semi-formal");
  const [isSendingBulk, setIsSendingBulk] = useState<boolean>(false);
  const [bulkSentSuccess, setBulkSentSuccess] = useState<boolean>(false);

  // Filter buyers
  const filteredBuyers = INITIAL_BUYERS.filter((b) => {
    if (selectedCommodity !== "all" && !b.commodityInterest.toLowerCase().includes(selectedCommodity.toLowerCase())) {
      return false;
    }
    if (selectedCountry !== "all" && b.country !== selectedCountry) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        b.companyName.toLowerCase().includes(q) ||
        b.contactPerson.toLowerCase().includes(q) ||
        b.commodityInterest.toLowerCase().includes(q) ||
        b.city.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSimulateScraping = () => {
    setIsScraping(true);
    setTimeout(() => {
      setIsScraping(false);
      toast.success("AI Buyer Scraping Selesai", {
        description: "Menemukan 5 calon buyer terverifikasi dan 1 indikasi fake buyer yang berhasil disaring.",
      });
    }, 1200);
  };

  const toggleSelectBuyer = (id: string) => {
    setSelectedBuyerIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleApplyToActiveShipment = (buyer: VerifiedBuyer) => {
    update("buyer", buyer.companyName);
    update("buyerCountry", buyer.country);
    update("buyerAddress", `${buyer.city}, ${buyer.country}`);
    update("buyerEmail", buyer.email);
    update("buyerPhone", buyer.phone);
    update("buyerPicName", buyer.contactPerson);
    update("buyerPicRole", buyer.contactRole);
    toast.success("Data Buyer Diterapkan ke Transaksi", {
      description: `${buyer.companyName} disimpan sebagai Importir pada transaksi ${shipment.reference}.`,
    });
  };

  // Generate Proposal Text dynamically
  const getProposalContent = () => {
    const exporter = shipment.exporter || "PT. INDICO EXPORT NUSANTARA";
    const ref = shipment.reference || "EXP-2026-001";
    const today = new Date().toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    if (proposalType === "inquiry") {
      return `SURAT KORESPONDENSI BISNIS: INQUIRY RESPONSE & SPESIFIKASI KOMODITAS
Nomor Referensi: INQ/${ref}/${new Date().getFullYear()}
Tanggal: ${today}

Kepada Yth.
${activeProposalBuyer.contactPerson} (${activeProposalBuyer.contactRole})
${activeProposalBuyer.companyName}
${activeProposalBuyer.city}, ${activeProposalBuyer.country}
Email: ${activeProposalBuyer.email}

Perihal: Tanggapan Minat Impor Komoditas Ekspor Indonesia

Dengan hormat,

Terima kasih atas minat yang disampaikan oleh ${activeProposalBuyer.companyName} terhadap komoditas unggulan kami. Melalui surat resmi ini, kami ${exporter} sebagai eksportir terdaftar resmi di Indonesia ingin menyampaikan spesifikasi teknis dan ketersediaan kapasitas pasokan kami:

1. Kategori Komoditas : ${activeProposalBuyer.commodityInterest}
2. Standar Mutu        : Standar Ekspor Kelas 1 (Grade 1 Premium, Kadar Air < 12%, Sortir Biji/Kualitas Manual & Mesin)
3. Kapasitas Pasokan  : Hingga ${activeProposalBuyer.annualDemandVolume}
4. Pelabuhan Asal     : ${quotePort}
5. Ketentuan Kemasan  : Kemasan ekspor food-grade karung goni berlapis GrainPro 60kg / Master Carton box standar palletized.

Kami melampirkan Certificate of Analysis (COA) dari laboratorium independen dan foto sampel batch terbaru untuk evaluasi tim teknis Anda. Kami siap mengirimkan sampel kurir (air freight sample) 500 gram ke kantor pusat Anda di ${activeProposalBuyer.city} untuk pengujian laboratorium langsung.

Hormat kami,
${exporter}

Muhajirin Fatona
Export Director`;
    }

    if (proposalType === "quotation") {
      return `OFFICIAL EXPORT QUOTATION & OFFER LETTER
Reference No : QUO/${ref}/${new Date().getFullYear()}
Date         : ${today}
Validity     : ${quoteValidity}

TO:
Attn: ${activeProposalBuyer.contactPerson} (${activeProposalBuyer.contactRole})
${activeProposalBuyer.companyName}
${activeProposalBuyer.city}, ${activeProposalBuyer.country}
Official Email: ${activeProposalBuyer.email}

Dear Mr./Ms. ${activeProposalBuyer.contactPerson.split(" ")[0]},

We are pleased to submit our firm commercial quotation for your requested commodity under the following export terms and conditions:

1. COMMODITY & SPECIFICATION:
   - Product Description : ${activeProposalBuyer.commodityInterest}
   - Origin              : Indonesia (Single Origin / Premium Sourced)
   - Quality / Grade     : Export Grade One, Defect Rate < 2%, Moisture Max 12.0%

2. COMMERCIAL PRICING & INCOTERMS:
   - Unit Price          : USD $${quotePrice} per Metric Ton (MT)
   - Trade Terms         : ${quoteIncoterm} - ${quotePort} (Incoterms® 2020)
   - Minimum Order (MOQ) : ${quoteMoq}
   - Total Est. Value    : USD $${(Number(quotePrice.replace(/,/g, "")) * 18.5).toLocaleString("en-US", { minimumFractionDigits: 2 })} (Based on 1x20ft FCL)

3. SHIPMENT & LOGISTICS:
   - Port of Loading     : ${quotePort}
   - Estimated Transit   : 18 - 24 Days to Destination Port
   - Export Packaging    : Export Standard with Heavy-Duty Desiccant & Oxygen Absorber

4. PAYMENT TERMS & BANK GUARANTEE:
   - ${quotePaymentTerms}
   - Official Bank       : Bank Mandiri (Persero) Tbk / Bank Central Asia (BCA)
   - Currency            : United States Dollar (USD)

5. REQUIRED EXPORT DOCUMENTS TO BE PROVIDED:
   - Clean On Board Ocean Bill of Lading (3/3 Originals)
   - Signed Commercial Invoice & Packing List in 3 Originals
   - Certificate of Origin (Form AK / Form D / e-SKA)
   - Phytosanitary Certificate issued by Quarantine Agency
   - Certificate of Analysis (COA) & Weight Certificate

This quotation remains firm and binding for ${quoteValidity}. To confirm this offer, kindly sign and return a duplicate of this quotation, or issue your formal Purchase Order (PO).

Sincerely yours,
For and on behalf of ${exporter}

Muhajirin Fatona
Export Director`;
    }

    return `DRAF DOKUMEN NEGOSIASI AWAL (INITIAL NEGOTIATION DRAFT)
Dokumen Acuan: NEG/${ref}/T-01
Para Pihak:
- Penjual (Exporter) : ${exporter} (Indonesia)
- Pembeli (Importer) : ${activeProposalBuyer.companyName} (${activeProposalBuyer.country})

POKOK KESEPAKATAN AWAL & KLAUSUL TEKNIS:

Pasal 1: Toleransi Mutu & Penyusutan Berat (Weight Tolerance)
Kedua pihak sepakat batas toleransi selisih susut berat wajar selama pelayaran samudra adalah maksimal 0.5% (nol koma lima persen). Berat resmi dihitung berdasarkan jembatan timbang (weighbridge) pelabuhan muat yang tercantum pada Final Packing List dan Bill of Lading.

Pasal 2: Jadwal Pengapalan & Laycan (Loading Period)
Pengapalan dijadwalkan dalam waktu maksimal 21 hari kerja setelah diterimanya uang muka (Deposit) atau pembukaan L/C yang dikonfirmasi oleh bank koresponden Penjual.

Pasal 3: Penagihan Sisa Pembayaran (Telegraphic Transfer Protocol)
Sisa 70% dari total nilai faktur dibayarkan oleh Pembeli maksimal 3 (tiga) hari perbankan setelah Penjual mengirimkan draf dokumen ber-cap digital "Scanned Copy" (termasuk draf Bill of Lading terkonfirmasi dan Packing List tervalidasi). Penjual wajib segera menyerahkan set B/L Asli kepada Pembeli begitu transfer dana efektif masuk.

Disiapkan untuk penelaahan awal kedua belah pihak.`;
  };

  // Generate Bulk Email Copywriting
  const getEmailSubject = () => {
    if (emailTone === "formal") {
      return `[Official Quotation] Supply Proposal for ${shipment.product || "Premium Indonesian Commodities"} - ${shipment.exporter || "PT Indico Export"}`;
    }
    if (emailTone === "semi-formal") {
      return `Reliable Indonesian Export Supply: Certified ${shipment.product || "Quality Products"} for ${selectedBuyerIds.length > 0 ? "Your Sourcing Needs" : "Your Business"}`;
    }
    return `Direct Sourcing Partnership: Fresh ${shipment.product || "Grade-1 Commodities"} from Indonesian Growers`;
  };

  const getEmailBody = () => {
    const exporter = shipment.exporter || "PT. INDICO EXPORT NUSANTARA";
    const commodity = shipment.product || "Specialty Indonesian Agro Commodities";

    if (emailTone === "formal") {
      return `Dear {{ContactPerson}},

On behalf of ${exporter}, I am writing to present our formal corporate introduction and supply capability for ${commodity}.

As a certified export entity accredited by the Indonesian Ministry of Trade, we currently supply international buyers across Europe, the Americas, and Asia with stringent quality control, full traceability, and complete export documentation (including Certificate of Origin, Phytosanitary, and independent COA).

We have reviewed your company profile, ${activeProposalBuyer.companyName}, and noted your high standards in global procurement. We are prepared to offer:
- Prime export grade with guaranteed defect rate below 2%
- Transparent FOB / CIF pricing structure with containerized logistics
- Flexible payment options: 30% TT Deposit + 70% against Scanned B/L Copy

Attached please find our comprehensive Product Catalog and Official Export Quotation for your esteemed review.

We welcome the opportunity to discuss your quarterly requirements at your convenience.

Yours faithfully,

Muhajirin Fatona
Export Director
${exporter}
Jakarta, Indonesia`;
    }

    if (emailTone === "semi-formal") {
      return `Hi {{ContactPerson}},

Hope you're having a productive week!

I’m reaching out from ${exporter} in Indonesia. We specialize in sourcing and processing premium ${commodity}, supplying international buyers who prioritize consistent grade quality and reliable shipping timelines.

Knowing ${activeProposalBuyer.companyName}'s strong market presence in ${activeProposalBuyer.country}, we believe our fresh crop harvest and competitive FOB/CIF terms could be a great fit for your current procurement pipeline.

Quick overview of what we deliver:
1. Direct farm-gate sourcing & strict moisture control (< 12%)
2. Reliable container stuffing from Tanjung Priok & Surabaya ports
3. Full compliance with international food-safety and phytosanitary certificates

Would you be open to a quick 10-minute introductory call next Tuesday to explore sample testing and pricing?

Best regards,

Muhajirin Fatona
Export Director
${exporter}`;
    }

    return `Hello {{ContactPerson}},

Greetings from Indonesia! 

I came across ${activeProposalBuyer.companyName} and was really impressed by your dedication to bringing top-notch ${commodity} to customers in ${activeProposalBuyer.country}.

We are direct exporters based here in Indonesia, working closely with local grower cooperatives to supply clean, high-grade ${commodity} without multiple middlemen markups.

We'd love to send over a complimentary 500g sample box to your office in ${activeProposalBuyer.city} so your team can test the aroma, moisture, and grading firsthand.

Drop me a quick reply if you’d like us to dispatch the samples this week!

Warmly,

Muhajirin Fatona
${exporter}`;
  };

  const handleSendBulkEmail = () => {
    if (selectedBuyerIds.length === 0) {
      toast.error("Pilih minimal satu calon buyer untuk dikirimi penawaran.");
      return;
    }
    setIsSendingBulk(true);
    setTimeout(() => {
      setIsSendingBulk(false);
      setBulkSentSuccess(true);
      toast.success("Bulk Email Penawaran Berhasil Dikirim!", {
        description: `Penawaran berbasis AI dengan gaya bahasa ${emailTone} telah dikirim ke ${selectedBuyerIds.length} calon buyer tervalidasi.`,
      });
    }, 1500);
  };

  return (
    <div className="module-stack space-y-6">
      {/* Overview Banner */}
      <section className="panel panel-padding bg-gradient-to-r from-blue-900/20 via-slate-900/40 to-cyan-950/20 border-blue-500/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Fitur 1 MVP · Pra-Transaksi
              </span>
              <span className="text-xs text-muted-foreground">Spesifikasi Komprehensif Versi 4</span>
            </div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Users size={20} className="text-blue-400" />
              Akuisisi Buyer & Otomasi Penawaran
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5 max-w-2xl">
              Pencarian otomatis calon pembeli luar negeri, mesin penyaring anti-penipuan (fake buyer), generator korespondensi resmi, dan bulk email terpersonalisasi.
            </p>
          </div>

          {/* Quick tab switcher */}
          <div className="flex items-center bg-background/60 p-1 rounded-lg border border-border">
            <button
              type="button"
              onClick={() => setActiveTab("discovery")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === "discovery"
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Search size={14} /> 1.1 Scraping & Validasi
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("proposals")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === "proposals"
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText size={14} /> 1.2 Generator Penawaran
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("bulk_email")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === "bulk_email"
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Mail size={14} /> 1.3 Bulk Email & Copywriting
            </button>
          </div>
        </div>
      </section>

      {/* TAB 1: AI BUYER SCRAPING & VALIDASI PERUSAHAAN (1.1) */}
      {activeTab === "discovery" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <section className="panel panel-padding">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                  Kategori Komoditas Ekspor
                </label>
                <select
                  value={selectedCommodity}
                  onChange={(e) => setSelectedCommodity(e.target.value)}
                  className="w-full text-xs bg-background border border-border rounded-md px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="all">Semua Komoditas Unggulan</option>
                  <option value="Kopi">Kopi Arabika / Robusta</option>
                  <option value="Vanili">Rempah & Vanili Planifolia</option>
                  <option value="Briket">Briket Arang Kelapa (Charcoal)</option>
                  <option value="Kakao">Biji Kakao & Minyak Kelapa</option>
                  <option value="Rotan">Furnitur & Kerajinan Rotan</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                  Negara Tujuan Pembeli
                </label>
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full text-xs bg-background border border-border rounded-md px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="all">Semua Negara Tujuan</option>
                  <option value="Denmark">Denmark (Uni Eropa)</option>
                  <option value="Jerman">Jerman (Uni Eropa)</option>
                  <option value="Uni Emirat Arab">Uni Emirat Arab (Middle East)</option>
                  <option value="Amerika Serikat">Amerika Serikat (USA)</option>
                  <option value="Jepang">Jepang (Asia Timur)</option>
                  <option value="Inggris Raya">Inggris Raya (UK)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                  Cari Nama Perusahaan / Kontak
                </label>
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-2 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Contoh: Nordic, Klaus, Cocoa..."
                    className="w-full text-xs bg-background border border-border rounded-md pl-8 pr-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleSimulateScraping}
                  disabled={isScraping}
                  className="w-full text-xs font-medium py-1.5 px-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-1.5 shadow"
                >
                  {isScraping ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" /> Sedang Menjalankan Scraping...
                    </>
                  ) : (
                    <>
                      <Sparkles size={13} /> Jalankan AI Buyer Discovery
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Anti-Fake Buyer Banner */}
            <div className="mt-3 pt-3 border-t border-border flex flex-wrap items-center justify-between text-xs text-muted-foreground gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-emerald-400" />
                <span>
                  <b>Mesin Verifikasi Legalitas & Anti-Fake Buyer Aktif:</b> Menghubungkan database registrasi bisnis resmi (D&B, SEC, EU Chamber) dan menyaring broker fiktif tanpa rekam jejak.
                </span>
              </div>
              <span className="text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                Ditemukan {filteredBuyers.length} Profil Perusahaan
              </span>
            </div>
          </section>

          {/* Buyers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBuyers.map((buyer) => {
              const isSelected = selectedBuyerIds.includes(buyer.id);
              return (
                <div
                  key={buyer.id}
                  className={`panel panel-padding border transition-all ${
                    buyer.isFakeBuyerRisk
                      ? "border-rose-500/40 bg-rose-950/10"
                      : isSelected
                      ? "border-primary/60 bg-primary/5"
                      : "border-border hover:border-border/80"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectBuyer(buyer.id)}
                        disabled={buyer.isFakeBuyerRisk}
                        className="mt-1 rounded border-border text-primary focus:ring-primary"
                        aria-label={`Pilih buyer ${buyer.companyName}`}
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-sm text-foreground">{buyer.companyName}</h3>
                          <span className="text-[11px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                            {buyer.country} ({buyer.city})
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Kontak: <b>{buyer.contactPerson}</b> · {buyer.contactRole}
                        </div>
                      </div>
                    </div>

                    {/* Trust Score */}
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 justify-end">
                        {buyer.isFakeBuyerRisk ? (
                          <ShieldAlert size={14} className="text-rose-400" />
                        ) : (
                          <ShieldCheck size={14} className="text-emerald-400" />
                        )}
                        <span
                          className={`text-xs font-bold ${
                            buyer.trustScore > 85
                              ? "text-emerald-400"
                              : buyer.trustScore > 60
                              ? "text-amber-400"
                              : "text-rose-400"
                          }`}
                        >
                          Trust: {buyer.trustScore}/100
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground block">
                        {buyer.isLegalVerified ? "Legalitas Sah" : "Risiko Tinggi"}
                      </span>
                    </div>
                  </div>

                  {/* Commodity & Demand */}
                  <div className="mt-3 bg-background/50 p-2.5 rounded border border-border/60 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Minat Komoditas:</span>
                      <b className="text-foreground">{buyer.commodityInterest}</b>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Kebutuhan Impor:</span>
                      <span className="font-medium text-primary">{buyer.annualDemandVolume}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Verifikasi Registrasi:</span>
                      <span className="text-muted-foreground text-[11px] font-mono">{buyer.verificationSource}</span>
                    </div>
                  </div>

                  {/* Risk / Verification Detail */}
                  <div className="mt-2 text-[11px] text-muted-foreground flex items-start gap-1.5">
                    {buyer.isFakeBuyerRisk ? (
                      <AlertTriangle size={13} className="text-rose-400 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                    )}
                    <span className={buyer.isFakeBuyerRisk ? "text-rose-300 font-medium" : ""}>
                      {buyer.riskDetails}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      {buyer.tags.map((tag) => (
                        <span key={tag} className="text-[10px] bg-muted/60 text-muted-foreground px-1.5 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!buyer.isFakeBuyerRisk && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveProposalBuyer(buyer);
                              setActiveTab("proposals");
                            }}
                            className="text-xs px-2.5 py-1 rounded border border-border bg-background hover:bg-muted text-foreground flex items-center gap-1"
                            title="Buat Dokumen Penawaran Khusus"
                          >
                            <FileText size={12} /> Penawaran
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplyToActiveShipment(buyer)}
                            className="text-xs px-2.5 py-1 rounded bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30 flex items-center gap-1"
                            title="Terapkan sebagai Importir pada Transaksi Aktif"
                          >
                            <Check size={12} /> Gunakan Buyer
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: GENERATOR DOKUMEN PENAWARAN (1.2) */}
      {activeTab === "proposals" && (
        <div className="space-y-4">
          <section className="panel panel-padding">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border">
              <div>
                <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <FileText size={16} className="text-primary" />
                  Generator Dokumen Korespondensi & Penawaran Pra-Transaksi
                </h3>
                <p className="text-xs text-muted-foreground">
                  Pembuatan otomatis dokumen terstandarisasi untuk negosiasi awal dengan buyer tervalidasi.
                </p>
              </div>

              {/* Document Type Selector */}
              <div className="flex items-center gap-1.5 bg-background p-1 rounded-md border border-border">
                <button
                  type="button"
                  onClick={() => setProposalType("inquiry")}
                  className={`px-2.5 py-1 text-xs rounded transition-all ${
                    proposalType === "inquiry"
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Inquiry Letter
                </button>
                <button
                  type="button"
                  onClick={() => setProposalType("quotation")}
                  className={`px-2.5 py-1 text-xs rounded transition-all ${
                    proposalType === "quotation"
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Quotation / Offer Letter
                </button>
                <button
                  type="button"
                  onClick={() => setProposalType("negotiation")}
                  className={`px-2.5 py-1 text-xs rounded transition-all ${
                    proposalType === "negotiation"
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Draf Negosiasi Awal
                </button>
              </div>
            </div>

            {/* Quick Parameters form */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-3 border-b border-border text-xs">
              <div>
                <label className="text-[11px] text-muted-foreground block mb-0.5">Target Buyer:</label>
                <select
                  value={activeProposalBuyer.id}
                  onChange={(e) => {
                    const found = INITIAL_BUYERS.find((b) => b.id === e.target.value);
                    if (found) setActiveProposalBuyer(found);
                  }}
                  className="w-full text-xs bg-background border border-border rounded px-2 py-1 text-foreground"
                >
                  {INITIAL_BUYERS.filter((b) => !b.isFakeBuyerRisk).map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.companyName} ({b.country})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-muted-foreground block mb-0.5">Harga Penawaran (USD/MT):</label>
                <input
                  type="text"
                  value={quotePrice}
                  onChange={(e) => setQuotePrice(e.target.value)}
                  className="w-full text-xs bg-background border border-border rounded px-2 py-1 text-foreground"
                />
              </div>

              <div>
                <label className="text-[11px] text-muted-foreground block mb-0.5">Term Perdagangan (Incoterm):</label>
                <select
                  value={quoteIncoterm}
                  onChange={(e) => setQuoteIncoterm(e.target.value)}
                  className="w-full text-xs bg-background border border-border rounded px-2 py-1 text-foreground"
                >
                  <option value="FOB">FOB (Free On Board)</option>
                  <option value="CIF">CIF (Cost, Insurance & Freight)</option>
                  <option value="CFR">CFR (Cost and Freight)</option>
                  <option value="FCA">FCA (Free Carrier)</option>
                  <option value="EXW">EXW (Ex Works)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-muted-foreground block mb-0.5">Pelabuhan Muat (POL):</label>
                <input
                  type="text"
                  value={quotePort}
                  onChange={(e) => setQuotePort(e.target.value)}
                  className="w-full text-xs bg-background border border-border rounded px-2 py-1 text-foreground"
                />
              </div>
            </div>

            {/* Document Preview Paper */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <FileText size={13} /> Pratinjau Naskah Dokumen Terstandarisasi
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(getProposalContent());
                      toast.success("Naskah penawaran berhasil disalin ke clipboard!");
                    }}
                    className="text-xs px-2.5 py-1 rounded border border-border bg-background hover:bg-muted text-foreground flex items-center gap-1"
                  >
                    <Copy size={12} /> Salin Naskah
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      window.print();
                    }}
                    className="text-xs px-2.5 py-1 rounded border border-border bg-background hover:bg-muted text-foreground flex items-center gap-1"
                  >
                    <Printer size={12} /> Cetak / Simpan PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleApplyToActiveShipment(activeProposalBuyer);
                      update("incoterm", quoteIncoterm as any);
                      toast.success("Nilai Penawaran Disinkronkan", {
                        description: `Incoterm ${quoteIncoterm} dan data ${activeProposalBuyer.companyName} ditautkan ke transaksi.`,
                      });
                    }}
                    className="text-xs px-3 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 font-medium flex items-center gap-1 shadow"
                  >
                    <Check size={12} /> Sinkron ke Transaksi
                  </button>
                </div>
              </div>

              <div className="p-6 bg-background rounded-lg border border-border font-mono text-xs text-foreground whitespace-pre-wrap leading-relaxed shadow-inner max-h-[500px] overflow-y-auto">
                {getProposalContent()}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* TAB 3: BULK EMAIL PENAWARAN & AI COPYWRITING (1.3) */}
      {activeTab === "bulk_email" && (
        <div className="space-y-4">
          <section className="panel panel-padding">
            <div className="pb-3 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <Mail size={16} className="text-primary" />
                  Bulk Email Penawaran & AI Copywriting Engine
                </h3>
                <p className="text-xs text-muted-foreground">
                  Personalisasi teks penawaran dengan AI berbasis gaya bahasa formal, semi-formal, atau casual untuk calon buyer tervalidasi.
                </p>
              </div>

              {/* Tone Selector */}
              <div className="flex items-center gap-1 bg-background p-1 rounded-md border border-border">
                <span className="text-[11px] text-muted-foreground px-2 font-medium">Gaya Bahasa:</span>
                <button
                  type="button"
                  onClick={() => setEmailTone("formal")}
                  className={`px-2.5 py-1 text-xs rounded transition-all ${
                    emailTone === "formal"
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Diplomatik & Formal
                </button>
                <button
                  type="button"
                  onClick={() => setEmailTone("semi-formal")}
                  className={`px-2.5 py-1 text-xs rounded transition-all ${
                    emailTone === "semi-formal"
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Semi-Formal & Direct
                </button>
                <button
                  type="button"
                  onClick={() => setEmailTone("casual")}
                  className={`px-2.5 py-1 text-xs rounded transition-all ${
                    emailTone === "casual"
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Casual & Networking
                </button>
              </div>
            </div>

            {/* Target Recipients Badge */}
            <div className="py-3 border-b border-border flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-primary" />
                <span>
                  Calon Buyer Terpilih untuk Eksekusi Massal: <b>{selectedBuyerIds.length} Perusahaan</b>
                </span>
                <span className="text-[11px] text-muted-foreground">
                  ({INITIAL_BUYERS.filter((b) => selectedBuyerIds.includes(b.id)).map((b) => b.companyName).join(", ") || "Belum ada buyer terpilih"})
                </span>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab("discovery")}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                Ubah Pilihan Buyer <ArrowRight size={12} />
              </button>
            </div>

            {/* Subject Line */}
            <div className="pt-3">
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Subjek Email (Direkomendasikan AI):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={getEmailSubject()}
                  className="w-full text-xs font-medium bg-background border border-border rounded px-3 py-2 text-foreground"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(getEmailSubject());
                    toast.success("Subjek email disalin!");
                  }}
                  className="text-xs px-3 py-2 rounded border border-border bg-background hover:bg-muted text-foreground shrink-0"
                >
                  <Copy size={13} />
                </button>
              </div>
            </div>

            {/* Email Body */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Sparkles size={13} className="text-amber-400" /> Naskah Teks Email Berbasis AI:
                </label>
                <span className="text-[11px] text-muted-foreground">
                  Variabel dinamis: <code>{"{{ContactPerson}}"}</code>, <code>{"{{CompanyName}}"}</code>
                </span>
              </div>

              <textarea
                rows={14}
                readOnly
                value={getEmailBody()}
                className="w-full text-xs bg-background border border-border rounded-lg p-3 text-foreground font-mono leading-relaxed focus:outline-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>Format email mematuhi standar CAN-SPAM Act & GDPR International.</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`Subject: ${getEmailSubject()}\n\n${getEmailBody()}`);
                    toast.success("Seluruh konten email disalin ke clipboard!");
                  }}
                  className="text-xs px-3 py-2 rounded border border-border bg-background hover:bg-muted text-foreground flex items-center gap-1.5"
                >
                  <Copy size={13} /> Salin Naskah Lengkap
                </button>

                <button
                  type="button"
                  onClick={handleSendBulkEmail}
                  disabled={isSendingBulk || selectedBuyerIds.length === 0}
                  className="text-xs px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 font-medium flex items-center gap-1.5 shadow"
                >
                  {isSendingBulk ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" /> Mengirim ke {selectedBuyerIds.length} Buyer...
                    </>
                  ) : (
                    <>
                      <Send size={13} /> Kirim Penawaran Massal ({selectedBuyerIds.length} Buyer)
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
