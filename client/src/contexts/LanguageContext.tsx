import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ScreenId } from "@shared/risk";
import {
  BarChart3,
  BookOpen,
  Bot,
  Box,
  Building2,
  Calculator,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  FileSpreadsheet,
  FileText,
  FolderArchive,
  Landmark,
  Layers,
  LayoutGrid,
  Package,
  PlusCircle,
  Scale,
  Settings2,
  ShieldAlert,
  Ship,
  Sparkles,
  Truck,
  Users,
  Wallet,
} from "lucide-react";

export type SupportedLocale = "ID" | "EN";

export type ScreenMeta = {
  id: ScreenId;
  label: string;
  group: string;
  phase: string;
  title: string;
  description: string;
  icon: React.ReactNode;
};

export type NavGroup = {
  group: string;
  items: ScreenMeta[];
};

interface LanguageContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (key: string, fallback?: string) => string;
  navGroups: NavGroup[];
  screens: ScreenMeta[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const TRANSLATIONS: Record<SupportedLocale, Record<string, string>> = {
  ID: {
    // Topbar
    "topbar.search_placeholder": "Cari transaksi, B/L...",
    "topbar.search_mobile_placeholder": "Cari transaksi, B/L, dokumen...",
    "topbar.help": "Bantuan",
    "topbar.notifications": "Notifikasi",
    "topbar.notifications_empty": "Belum ada notifikasi baru",
    "topbar.notifications_empty_desc": "Semua pembaruan sistem, dokumen kepabeanan, dan jadwal kapal akan muncul di sini.",
    "topbar.mark_all_read": "Tandai sudah dibaca",
    "topbar.save_shipment": "Simpan Transaksi",
    "topbar.download_summary": "Unduh Laporan",
    "topbar.new_shipment": "Transaksi Baru",
    "topbar.filter_range": "Filter Periode",
    "topbar.conflict_detected": "Konflik versi terdeteksi:",
    "topbar.conflict_desc": "Transaksi telah diperbarui dari sesi lain. Muat versi terbaru sebelum menyimpan kembali agar tidak menimpa data tim.",
    "topbar.reload_latest": "Muat Versi Terbaru",
    "topbar.support_title": "Pusat Bantuan & Konsultasi Ekspor",
    "topbar.language_changed": "Bahasa sistem diubah ke",

    // Sidebar footer & auth
    "sidebar.cloud_active": "Cloud Supabase Aktif",
    "sidebar.cloud_active_sub": "Cloud aktif · Transaksi Ekspor",
    "sidebar.logout": "Keluar sesi",
    "sidebar.login": "Masuk akun",

    // Navigation Groups
    "nav.group.summary": "Ringkasan",
    "nav.group.sales": "Penjualan",
    "nav.group.operations": "Operasional Ekspor",
    "nav.group.knowledge": "Advisor & Pengetahuan",
    "nav.group.master_data": "Data Utama",
    "nav.group.finance": "Keuangan & Analitik",
    "nav.group.admin": "Administrasi",

    // Screens
    "screen.dashboard.label": "Dashboard",
    "screen.dashboard.title": "Dashboard Ekspor",
    "screen.dashboard.desc": "Ringkasan operasional transaksi ekspor aktif & kepatuhan devisa",

    "screen.readiness.label": "Asesmen Kesiapan",
    "screen.readiness.title": "Asesmen Kesiapan Ekspor",
    "screen.readiness.desc": "Evaluasi legalitas badan usaha, sertifikasi komoditas, dan perizinan ekspor.",

    "screen.pre_transaction.label": "Pra-Transaksi & Buyer",
    "screen.pre_transaction.title": "Akuisisi Buyer & Pra-Transaksi",
    "screen.pre_transaction.desc": "Penyusunan penawaran harga (Quotation), surat minat (Inquiry), dan verifikasi buyer.",

    "screen.transactions.label": "Pesanan Ekspor",
    "screen.transactions.title": "Pesanan Ekspor",
    "screen.transactions.desc": "Daftar pesanan ekspor, tracking invoice, dan tahapan operasional pengapalan.",

    "screen.po_intake.label": "Input PO",
    "screen.po_intake.title": "Input Purchase Order",
    "screen.po_intake.desc": "Catat pesanan baru atau pindai dokumen PO/LOI buyer.",

    "screen.pricing.label": "Harga & Order",
    "screen.pricing.title": "Harga & Order",
    "screen.pricing.desc": "Kalkulasi struktur HPP, freight forwarder, dan penetapan harga per Incoterm (FOB, CIF).",

    "screen.approvals.label": "Persetujuan",
    "screen.approvals.title": "Persetujuan",
    "screen.approvals.desc": "Tinjau perubahan harga, margin, atau Incoterm secara terstruktur sebelum quotation dikirim ke buyer.",

    "screen.compliance.label": "HS Code & Lartas",
    "screen.compliance.title": "HS Code & Kepatuhan Lartas",
    "screen.compliance.desc": "Verifikasi BTKI, tarif FTA/CEPA, dan status lartas kementerian teknis.",

    "screen.documents.label": "Dokumen Ekspor",
    "screen.documents.title": "Dokumen Ekspor",
    "screen.documents.desc": "Penerbitan 6 dokumen ekspor resmi (PI, SC, CI, PL, SI, COO) berstandar internasional.",

    "screen.cargo.label": "Rencana Muatan",
    "screen.cargo.title": "Rencana Muatan Kontainer",
    "screen.cargo.desc": "Kalkulasi kubikasi CBM, kapasitas kontainer 20ft/40ft/40HC, dan susut muatan.",

    "screen.tracking.label": "Pelacakan Kontainer",
    "screen.tracking.title": "Pelacakan Kontainer Maritim",
    "screen.tracking.desc": "Pemantauan posisi kontainer dan jadwal kapal selama pelayaran.",

    "screen.shipment.label": "Logistik & Pengiriman",
    "screen.shipment.title": "Logistik & Pengiriman",
    "screen.shipment.desc": "Status booking kapal, nomor kontainer/seal, dan checklist serah terima barang.",

    "screen.scrutiny.label": "Validasi Dokumen (B/L)",
    "screen.scrutiny.title": "Validasi Silang Draft B/L",
    "screen.scrutiny.desc": "Pemeriksaan OCR 3-way antara Draft B/L, Commercial Invoice, dan Packing List.",

    "screen.risk.label": "Risk Center & H-7 PEB",
    "screen.risk.title": "Risk Center & Timeline PEB",
    "screen.risk.desc": "Monitoring kepatuhan dokumen pra-pengapalan dan countdown closing PEB.",

    "screen.audit_vault.label": "Audit Vault DJBC",
    "screen.audit_vault.title": "Arsip Digital Audit DJBC",
    "screen.audit_vault.desc": "Pengelompokan arsip transaksi 5 folder siap audit kepabeanan Bea Cukai.",

    "screen.advisor.label": "AI Advisor",
    "screen.advisor.title": "AI Advisor",
    "screen.advisor.desc": "Tanyakan risiko, skenario Incoterm, atau kelengkapan dokumen berdasarkan snapshot transaksi yang sedang dibuka.",

    "screen.knowledge.label": "Pengetahuan Tim",
    "screen.knowledge.title": "Pengetahuan Tim",
    "screen.knowledge.desc": "Kelola SOP internal dan panduan pasar dengan batas scope, masa berlaku, dan pemisahan uploader vs reviewer.",

    "screen.partners.label": "Mitra & Kontak",
    "screen.partners.title": "Mitra & Kontak",
    "screen.partners.desc": "Simpan identitas buyer, negara tujuan, dan terms pembayaran agar tidak diketik berulang kali.",

    "screen.products.label": "Katalog Produk",
    "screen.products.title": "Katalog Produk",
    "screen.products.desc": "Kelola spesifikasi kemasan standar dan HS Code referensi untuk ditambahkan cepat ke transaksi.",

    "screen.finance.label": "Keuangan",
    "screen.finance.title": "Keuangan (AR / AP)",
    "screen.finance.desc": "Pantau rencana piutang dan kontrol pemisahan antara dokumen perdagangan dengan pengakuan pendapatan akuntansi.",

    "screen.bank.label": "Rekonsiliasi Bank",
    "screen.bank.title": "Rekonsiliasi Bank",
    "screen.bank.desc": "Tinjau saran pencocokan pembayaran uang muka/pelunasan dan kurs realisasi sebelum posting Finance.",

    "screen.journals.label": "Jurnal & Bagan Akun",
    "screen.journals.title": "Jurnal & Bagan Akun",
    "screen.journals.desc": "Pratinjau jurnal double-entry seimbang dengan kontrol jejak sumber dan kebijakan koreksi via reversal.",

    "screen.reports.label": "Laporan & Analitik",
    "screen.reports.title": "Laporan & Analitik",
    "screen.reports.desc": "Evaluasi struktur biaya, estimasi margin per shipment, dan pemisahan tegas antara asumsi quote vs realisasi.",

    "screen.settings.label": "Pengaturan Workspace",
    "screen.settings.title": "Pengaturan Workspace",
    "screen.settings.desc": "Kelola sesi autentikasi, status koneksi PostgreSQL / Supabase, keamanan RLS, dan ekspor portabilitas data.",
  },

  EN: {
    // Topbar
    "topbar.search_placeholder": "Search shipment, B/L...",
    "topbar.search_mobile_placeholder": "Search shipment, B/L, documents...",
    "topbar.help": "Help",
    "topbar.notifications": "Notifications",
    "topbar.notifications_empty": "No new notifications yet",
    "topbar.notifications_empty_desc": "All system updates, customs clearance documents, and vessel schedules will appear here.",
    "topbar.mark_all_read": "Mark all as read",
    "topbar.save_shipment": "Save Shipment",
    "topbar.download_summary": "Download Report",
    "topbar.new_shipment": "New Shipment",
    "topbar.filter_range": "Filter Period",
    "topbar.conflict_detected": "Version conflict detected:",
    "topbar.conflict_desc": "Transaction was updated in another session. Reload the latest version before saving to avoid overwriting team data.",
    "topbar.reload_latest": "Reload Latest Version",
    "topbar.support_title": "Help Center & Export Advisory",
    "topbar.language_changed": "System language changed to",

    // Sidebar footer & auth
    "sidebar.cloud_active": "Cloud Supabase Active",
    "sidebar.cloud_active_sub": "Cloud Active · Export Workspace",
    "sidebar.logout": "Log out",
    "sidebar.login": "Log in",

    // Navigation Groups
    "nav.group.summary": "Overview",
    "nav.group.sales": "Sales & Orders",
    "nav.group.operations": "Export Operations",
    "nav.group.knowledge": "Advisor & Knowledge",
    "nav.group.master_data": "Master Data",
    "nav.group.finance": "Finance & Analytics",
    "nav.group.admin": "Administration",

    // Screens
    "screen.dashboard.label": "Dashboard",
    "screen.dashboard.title": "Export Dashboard",
    "screen.dashboard.desc": "Operational overview of active export shipments and foreign exchange compliance",

    "screen.readiness.label": "Readiness Assessment",
    "screen.readiness.title": "Export Readiness Assessment",
    "screen.readiness.desc": "Evaluation of business legality, commodity certification, and export licensing.",

    "screen.pre_transaction.label": "Pre-Transaction & Buyer",
    "screen.pre_transaction.title": "Buyer Acquisition & Pre-Transaction",
    "screen.pre_transaction.desc": "Drafting commercial quotation, inquiry correspondence, and buyer verification.",

    "screen.transactions.label": "Export Orders",
    "screen.transactions.title": "Export Orders Management",
    "screen.transactions.desc": "List of export contracts, invoice tracking, and shipping execution lifecycle.",

    "screen.po_intake.label": "PO Intake",
    "screen.po_intake.title": "Purchase Order Intake",
    "screen.po_intake.desc": "Record new purchase orders or scan buyer PO/LOI documents.",

    "screen.pricing.label": "Pricing & Costing",
    "screen.pricing.title": "Export Pricing & Costing",
    "screen.pricing.desc": "COGS structure calculation, ocean freight forwarding, and Incoterm pricing (FOB, CIF).",

    "screen.approvals.label": "Approvals",
    "screen.approvals.title": "Approvals & Sign-Off",
    "screen.approvals.desc": "Structured review of price variations, margins, or Incoterms prior to sending quotes.",

    "screen.compliance.label": "HS Code & Regulatory",
    "screen.compliance.title": "HS Code & Regulatory Compliance",
    "screen.compliance.desc": "Customs tariff BTKI verification, FTA/CEPA preference rates, and export restrictions.",

    "screen.documents.label": "Export Documents",
    "screen.documents.title": "Export Documentation Desk",
    "screen.documents.desc": "Issuance of 6 official export documents (PI, SC, CI, PL, SI, COO) under international standards.",

    "screen.cargo.label": "Container Stowage",
    "screen.cargo.title": "Container Load & Stowage Plan",
    "screen.cargo.desc": "CBM volume calculation, 20ft/40ft/40HC container capacity, and moisture/weight shrinkage.",

    "screen.tracking.label": "Container Tracking",
    "screen.tracking.title": "Maritime Container Tracking",
    "screen.tracking.desc": "Real-time vessel AIS monitoring, milestone tracking, and arrival schedules.",

    "screen.shipment.label": "Logistics & Dispatch",
    "screen.shipment.title": "Logistics & Shipment Dispatch",
    "screen.shipment.desc": "Ocean carrier booking status, container/seal serial numbers, and cargo handover checklist.",

    "screen.scrutiny.label": "Doc Validation (B/L)",
    "screen.scrutiny.title": "Draft B/L Cross-Validation",
    "screen.scrutiny.desc": "3-way automated discrepancy audit between Draft B/L, Commercial Invoice, and Packing List.",

    "screen.risk.label": "Risk Center & PEB",
    "screen.risk.title": "Export Risk Center & PEB Timeline",
    "screen.risk.desc": "Pre-shipment legal compliance monitoring and customs export declaration (PEB) countdown.",

    "screen.audit_vault.label": "Audit Vault DJBC",
    "screen.audit_vault.title": "Customs Digital Audit Archive",
    "screen.audit_vault.desc": "5-folder structured transaction archive ready for customs compliance audit.",

    "screen.advisor.label": "AI Advisor",
    "screen.advisor.title": "AI Export Advisor",
    "screen.advisor.desc": "Real-time advice on trade risks, Incoterm scenarios, and document sufficiency.",

    "screen.knowledge.label": "Team Knowledge",
    "screen.knowledge.title": "Team Knowledge Base",
    "screen.knowledge.desc": "Internal SOP repository, market guides, and regulatory document standards.",

    "screen.partners.label": "Partners & Contacts",
    "screen.partners.title": "Directory of Partners & Buyers",
    "screen.partners.desc": "Store buyer profiles, destination countries, and payment terms for fast reuse.",

    "screen.products.label": "Product Catalog",
    "screen.products.title": "Export Product Catalog",
    "screen.products.desc": "Standard packaging specifications and verified reference HS Codes for quick lookup.",

    "screen.finance.label": "Finance",
    "screen.finance.title": "Finance (AR / AP)",
    "screen.finance.desc": "Monitor receivables schedule and revenue recognition segregation from commercial shipping docs.",

    "screen.bank.label": "Bank Reconciliation",
    "screen.bank.title": "Bank Reconciliation",
    "screen.bank.desc": "Review auto-match suggestions for advance/settlement payments and realized FX rates.",

    "screen.journals.label": "Journals & COA",
    "screen.journals.title": "Journals & Chart of Accounts",
    "screen.journals.desc": "Balanced double-entry journal preview with audit trail and reversal correction policies.",

    "screen.reports.label": "Reports & Analytics",
    "screen.reports.title": "Reports & Analytics",
    "screen.reports.desc": "Cost breakdown analysis, realized shipment margins, and variance tracking vs quoted estimates.",

    "screen.settings.label": "Workspace Settings",
    "screen.settings.title": "Workspace Settings",
    "screen.settings.desc": "Manage auth sessions, Supabase PostgreSQL sync status, RLS policies, and data portability exports.",
  },
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>(() => {
    try {
      const saved = localStorage.getItem("eksporflow_locale");
      if (saved === "EN" || saved === "ID") {
        return saved;
      }
      // If legacy AR was saved in user's browser, reset it to ID and fix dir
      if (saved === "AR") {
        localStorage.setItem("eksporflow_locale", "ID");
      }
    } catch {
      // ignore
    }
    return "ID";
  });

  const setLocale = (newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem("eksporflow_locale", newLocale);
      document.documentElement.lang = newLocale.toLowerCase();
      document.documentElement.dir = "ltr";
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    document.documentElement.lang = locale.toLowerCase();
    document.documentElement.dir = "ltr";
  }, [locale]);

  const t = (key: string, fallback?: string): string => {
    return TRANSLATIONS[locale]?.[key] || TRANSLATIONS.ID?.[key] || fallback || key;
  };

  const navGroups = useMemo<NavGroup[]>(() => {
    return [
      {
        group: t("nav.group.summary", "Ringkasan"),
        items: [
          {
            id: "dashboard",
            label: t("screen.dashboard.label", "Dashboard"),
            group: t("nav.group.summary", "Ringkasan"),
            phase: t("nav.group.summary", "Ringkasan"),
            title: t("screen.dashboard.title", "Dashboard Ekspor"),
            description: t("screen.dashboard.desc", "Ringkasan operasional transaksi ekspor aktif & kepatuhan devisa"),
            icon: <LayoutGrid size={16} />,
          },
          {
            id: "readiness",
            label: t("screen.readiness.label", "Asesmen Kesiapan"),
            group: t("nav.group.summary", "Ringkasan"),
            phase: t("nav.group.summary", "Ringkasan"),
            title: t("screen.readiness.title", "Asesmen Kesiapan Ekspor"),
            description: t("screen.readiness.desc", "Evaluasi legalitas badan usaha, sertifikasi komoditas, dan perizinan ekspor."),
            icon: <CheckCircle2 size={16} />,
          },
        ],
      },
      {
        group: t("nav.group.sales", "Penjualan"),
        items: [
          {
            id: "pre_transaction",
            label: t("screen.pre_transaction.label", "Pra-Transaksi & Buyer"),
            group: t("nav.group.sales", "Penjualan"),
            phase: t("nav.group.sales", "Penjualan"),
            title: t("screen.pre_transaction.title", "Akuisisi Buyer & Pra-Transaksi"),
            description: t("screen.pre_transaction.desc", "Penyusunan penawaran harga (Quotation), surat minat (Inquiry), dan verifikasi buyer."),
            icon: <Sparkles size={16} />,
          },
          {
            id: "po_intake",
            label: t("screen.po_intake.label", "Input PO"),
            group: t("nav.group.sales", "Penjualan"),
            phase: t("nav.group.sales", "Penjualan"),
            title: t("screen.po_intake.title", "Input Purchase Order"),
            description: t("screen.po_intake.desc", "Catat pesanan baru atau pindai dokumen PO/LOI buyer."),
            icon: <PlusCircle size={16} />,
          },
          {
            id: "transactions",
            label: t("screen.transactions.label", "Pesanan Ekspor"),
            group: t("nav.group.sales", "Penjualan"),
            phase: t("nav.group.sales", "Penjualan"),
            title: t("screen.transactions.title", "Pesanan Ekspor"),
            description: t("screen.transactions.desc", "Daftar pesanan ekspor, tracking invoice, dan tahapan operasional pengapalan."),
            icon: <Layers size={16} />,
          },
          {
            id: "pricing",
            label: t("screen.pricing.label", "Harga & Order"),
            group: t("nav.group.sales", "Penjualan"),
            phase: t("nav.group.sales", "Penjualan"),
            title: t("screen.pricing.title", "Harga & Order"),
            description: t("screen.pricing.desc", "Kalkulasi struktur HPP, freight forwarder, dan penetapan harga per Incoterm (FOB, CIF)."),
            icon: <Calculator size={16} />,
          },
          {
            id: "approvals",
            label: t("screen.approvals.label", "Persetujuan"),
            group: t("nav.group.sales", "Penjualan"),
            phase: t("nav.group.sales", "Penjualan"),
            title: t("screen.approvals.title", "Persetujuan"),
            description: t("screen.approvals.desc", "Tinjau perubahan harga, margin, atau Incoterm secara terstruktur sebelum quotation dikirim ke buyer."),
            icon: <ClipboardCheck size={16} />,
          },
        ],
      },
      {
        group: t("nav.group.operations", "Operasional Ekspor"),
        items: [
          {
            id: "compliance",
            label: t("screen.compliance.label", "HS Code & Lartas"),
            group: t("nav.group.operations", "Operasional Ekspor"),
            phase: t("nav.group.operations", "Operasional Ekspor"),
            title: t("screen.compliance.title", "HS Code & Kepatuhan Lartas"),
            description: t("screen.compliance.desc", "Verifikasi BTKI, tarif FTA/CEPA, dan status lartas kementerian teknis."),
            icon: <Scale size={16} />,
          },
          {
            id: "documents",
            label: t("screen.documents.label", "Dokumen Ekspor"),
            group: t("nav.group.operations", "Operasional Ekspor"),
            phase: t("nav.group.operations", "Operasional Ekspor"),
            title: t("screen.documents.title", "Dokumen Ekspor"),
            description: t("screen.documents.desc", "Penerbitan 6 dokumen ekspor resmi (PI, SC, CI, PL, SI, COO) berstandar internasional."),
            icon: <FileText size={16} />,
          },
          {
            id: "cargo",
            label: t("screen.cargo.label", "Rencana Muatan"),
            group: t("nav.group.operations", "Operasional Ekspor"),
            phase: t("nav.group.operations", "Operasional Ekspor"),
            title: t("screen.cargo.title", "Rencana Muatan Kontainer"),
            description: t("screen.cargo.desc", "Kalkulasi kubikasi CBM, kapasitas kontainer 20ft/40ft/40HC, dan susut muatan."),
            icon: <Box size={16} />,
          },
          {
            id: "tracking",
            label: t("screen.tracking.label", "Pelacakan Kontainer"),
            group: t("nav.group.operations", "Operasional Ekspor"),
            phase: t("nav.group.operations", "Operasional Ekspor"),
            title: t("screen.tracking.title", "Pelacakan Kontainer Maritim"),
            description: t("screen.tracking.desc", "Pemantauan posisi kontainer dan jadwal kapal selama pelayaran."),
            icon: <Ship size={16} />,
          },
          {
            id: "shipment",
            label: t("screen.shipment.label", "Logistik & Pengiriman"),
            group: t("nav.group.operations", "Operasional Ekspor"),
            phase: t("nav.group.operations", "Operasional Ekspor"),
            title: t("screen.shipment.title", "Logistik & Pengiriman"),
            description: t("screen.shipment.desc", "Status booking kapal, nomor kontainer/seal, dan checklist serah terima barang."),
            icon: <Truck size={16} />,
          },
          {
            id: "scrutiny",
            label: t("screen.scrutiny.label", "Validasi Dokumen (B/L)"),
            group: t("nav.group.operations", "Operasional Ekspor"),
            phase: t("nav.group.operations", "Operasional Ekspor"),
            title: t("screen.scrutiny.title", "Validasi Silang Draft B/L"),
            description: t("screen.scrutiny.desc", "Pemeriksaan OCR 3-way antara Draft B/L, Commercial Invoice, dan Packing List."),
            icon: <FileSearch size={16} />,
          },
          {
            id: "risk",
            label: t("screen.risk.label", "Risk Center & H-7 PEB"),
            group: t("nav.group.operations", "Operasional Ekspor"),
            phase: t("nav.group.operations", "Operasional Ekspor"),
            title: t("screen.risk.title", "Risk Center & Timeline PEB"),
            description: t("screen.risk.desc", "Monitoring kepatuhan dokumen pra-pengapalan dan countdown closing PEB."),
            icon: <ShieldAlert size={16} />,
          },
          {
            id: "audit_vault",
            label: t("screen.audit_vault.label", "Audit Vault DJBC"),
            group: t("nav.group.operations", "Operasional Ekspor"),
            phase: t("nav.group.operations", "Operasional Ekspor"),
            title: t("screen.audit_vault.title", "Arsip Digital Audit DJBC"),
            description: t("screen.audit_vault.desc", "Pengelompokan arsip transaksi 5 folder siap audit kepabeanan Bea Cukai."),
            icon: <FolderArchive size={16} />,
          },
        ],
      },
      {
        group: t("nav.group.knowledge", "Advisor & Pengetahuan"),
        items: [
          {
            id: "advisor",
            label: t("screen.advisor.label", "AI Advisor"),
            group: t("nav.group.knowledge", "Advisor & Pengetahuan"),
            phase: t("nav.group.knowledge", "Advisor & Pengetahuan"),
            title: t("screen.advisor.title", "AI Advisor"),
            description: t("screen.advisor.desc", "Tanyakan risiko, skenario Incoterm, atau kelengkapan dokumen berdasarkan snapshot transaksi yang sedang dibuka."),
            icon: <Bot size={16} />,
          },
          {
            id: "knowledge",
            label: t("screen.knowledge.label", "Pengetahuan Tim"),
            group: t("nav.group.knowledge", "Advisor & Pengetahuan"),
            phase: t("nav.group.knowledge", "Advisor & Pengetahuan"),
            title: t("screen.knowledge.title", "Pengetahuan Tim"),
            description: t("screen.knowledge.desc", "Kelola SOP internal dan panduan pasar dengan batas scope, masa berlaku, dan pemisahan uploader vs reviewer."),
            icon: <BookOpen size={16} />,
          },
        ],
      },
      {
        group: t("nav.group.master_data", "Data Utama"),
        items: [
          {
            id: "partners",
            label: t("screen.partners.label", "Mitra & Kontak"),
            group: t("nav.group.master_data", "Data Utama"),
            phase: t("nav.group.master_data", "Data Utama"),
            title: t("screen.partners.title", "Mitra & Kontak"),
            description: t("screen.partners.desc", "Simpan identitas buyer, negara tujuan, dan terms pembayaran agar tidak diketik berulang kali."),
            icon: <Users size={16} />,
          },
          {
            id: "products",
            label: t("screen.products.label", "Katalog Produk"),
            group: t("nav.group.master_data", "Data Utama"),
            phase: t("nav.group.master_data", "Data Utama"),
            title: t("screen.products.title", "Katalog Produk"),
            description: t("screen.products.desc", "Kelola spesifikasi kemasan standar dan HS Code referensi untuk ditambahkan cepat ke transaksi."),
            icon: <Package size={16} />,
          },
        ],
      },
      {
        group: t("nav.group.finance", "Keuangan & Analitik"),
        items: [
          {
            id: "finance",
            label: t("screen.finance.label", "Keuangan"),
            group: t("nav.group.finance", "Keuangan & Analitik"),
            phase: t("nav.group.finance", "Keuangan & Analitik"),
            title: t("screen.finance.title", "Keuangan (AR / AP)"),
            description: t("screen.finance.desc", "Pantau rencana piutang dan kontrol pemisahan antara dokumen perdagangan dengan pengakuan pendapatan akuntansi."),
            icon: <Wallet size={16} />,
          },
          {
            id: "bank",
            label: t("screen.bank.label", "Rekonsiliasi Bank"),
            group: t("nav.group.finance", "Keuangan & Analitik"),
            phase: t("nav.group.finance", "Keuangan & Analitik"),
            title: t("screen.bank.title", "Rekonsiliasi Bank"),
            description: t("screen.bank.desc", "Tinjau saran pencocokan pembayaran uang muka/pelunasan dan kurs realisasi sebelum posting Finance."),
            icon: <Landmark size={16} />,
          },
          {
            id: "journals",
            label: t("screen.journals.label", "Jurnal & Bagan Akun"),
            group: t("nav.group.finance", "Keuangan & Analitik"),
            phase: t("nav.group.finance", "Keuangan & Analitik"),
            title: t("screen.journals.title", "Jurnal & Bagan Akun"),
            description: t("screen.journals.desc", "Pratinjau jurnal double-entry seimbang dengan kontrol jejak sumber dan kebijakan koreksi via reversal."),
            icon: <FileSpreadsheet size={16} />,
          },
          {
            id: "reports",
            label: t("screen.reports.label", "Laporan & Analitik"),
            group: t("nav.group.finance", "Keuangan & Analitik"),
            phase: t("nav.group.finance", "Keuangan & Analitik"),
            title: t("screen.reports.title", "Laporan & Analitik"),
            description: t("screen.reports.desc", "Evaluasi struktur biaya, estimasi margin per shipment, dan pemisahan tegas antara asumsi quote vs realisasi."),
            icon: <BarChart3 size={16} />,
          },
        ],
      },
      {
        group: t("nav.group.admin", "Administrasi"),
        items: [
          {
            id: "settings",
            label: t("screen.settings.label", "Pengaturan Workspace"),
            group: t("nav.group.admin", "Administrasi"),
            phase: t("nav.group.admin", "Administrasi"),
            title: t("screen.settings.title", "Pengaturan Workspace"),
            description: t("screen.settings.desc", "Kelola sesi autentikasi, status koneksi PostgreSQL / Supabase, keamanan RLS, dan ekspor portabilitas data."),
            icon: <Settings2 size={16} />,
          },
        ],
      },
    ];
  }, [locale]);

  const screens = useMemo<ScreenMeta[]>(() => {
    return navGroups.flatMap((group) => group.items);
  }, [navGroups]);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, navGroups, screens }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
