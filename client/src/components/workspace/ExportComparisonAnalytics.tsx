import React, { useState } from "react";
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Package,
  ArrowUpRight,
  Download,
  Info,
  DollarSign,
  ChevronRight,
  Layers,
  Sparkles,
} from "lucide-react";
import { SpaceBadge } from "./Primitives";

export type ComparisonTimeframe = "weekly" | "monthly" | "quarterly" | "semester" | "yearly";

interface PeriodDataPoint {
  id: string;
  label: string;
  fullLabel: string;
  realization: number; // in USD
  target: number; // in USD
  previousYear: number; // in USD
  unitLabel: string;
}

interface TimeframeConfig {
  id: ComparisonTimeframe;
  tabLabel: string;
  tabLabelEn: string;
  title: string;
  titleEn: string;
  subtitle: string;
  subtitleEn: string;
  badge: string;
  badgeEn: string;
  yMax: number;
  yStep: number;
  data: PeriodDataPoint[];
  commodityBreakdown: {
    name: string;
    nameEn: string;
    sharePercent: number;
    amountUsd: number;
    tone: "primary" | "success" | "warning" | "neutral";
  }[];
  insights: {
    target: { title: string; titleEn: string; desc: string; descEn: string };
    growth: { title: string; titleEn: string; desc: string; descEn: string };
    strategy: { title: string; titleEn: string; desc: string; descEn: string };
  };
}

const COMPARISON_DATASETS: Record<ComparisonTimeframe, TimeframeConfig> = {
  weekly: {
    id: "weekly",
    tabLabel: "Per Minggu (Weekly)",
    tabLabelEn: "Weekly",
    title: "Perbandingan Realisasi Ekspor Mingguan vs Target (November 2026)",
    titleEn: "Weekly Export Realization vs Target Comparison (Nov 2026)",
    subtitle: "Analisis performa mingguan pengapalan kontainer dalam USD (Minggu 1 – 4)",
    subtitleEn: "Weekly container shipping performance analysis in USD (Weeks 1 – 4)",
    badge: "Siklus Mingguan (4 Minggu)",
    badgeEn: "Weekly Cycle (4 Weeks)",
    yMax: 90000,
    yStep: 18000,
    data: [
      { id: "w1", label: "M-1", fullLabel: "Minggu 1 (1–7 Nov 2026)", realization: 48500, target: 45000, previousYear: 38000, unitLabel: "4 Kontainer" },
      { id: "w2", label: "M-2", fullLabel: "Minggu 2 (8–14 Nov 2026)", realization: 56200, target: 50000, previousYear: 42000, unitLabel: "5 Kontainer" },
      { id: "w3", label: "M-3", fullLabel: "Minggu 3 (15–21 Nov 2026)", realization: 62800, target: 58000, previousYear: 46000, unitLabel: "6 Kontainer" },
      { id: "w4", label: "M-4", fullLabel: "Minggu 4 (22–28 Nov 2026)", realization: 77500, target: 67000, previousYear: 49000, unitLabel: "7 Kontainer" },
    ],
    commodityBreakdown: [
      { name: "Kopi Arabika Gayo", nameEn: "Gayo Arabica Coffee", sharePercent: 42, amountUsd: 102900, tone: "primary" },
      { name: "Udang Windu Beku", nameEn: "Frozen Black Tiger Shrimp", sharePercent: 28, amountUsd: 68600, tone: "success" },
      { name: "Organic Coconut Sugar", nameEn: "Organic Coconut Sugar", sharePercent: 18, amountUsd: 44100, tone: "primary" },
      { name: "Mebel Kayu & Rotan", nameEn: "Wood & Rattan Furniture", sharePercent: 12, amountUsd: 29400, tone: "warning" },
    ],
    insights: {
      target: {
        title: "1. Realisasi Mingguan Melampaui Target (+11.4%)",
        titleEn: "1. Weekly Performance Outperforms Target (+11.4%)",
        desc: "Total realisasi 4 minggu November mencapai $245,000 USD (target $220,000 USD). Minggu ke-4 membukukan rekor volume tertinggi ($77,500 USD) berkat akselerasi stuffing kargo kopi ke Pelabuhan Hamburg.",
        descEn: "Total realization for the 4 weeks of November reached $245,000 USD (target $220,000 USD). Week 4 recorded highest volume ($77,500 USD) driven by accelerated coffee cargo stuffing to Hamburg Port.",
      },
      growth: {
        title: "2. Lonjakan Mingguan +40.0% YoY",
        titleEn: "2. Weekly Surge of +40.0% YoY",
        desc: "Dibandingkan periode mingguan November 2025 ($175,000 USD), pengapalan melonjak +$70,000 USD berkat penambahan slot kontainer reefer untuk buyer di Busan.",
        descEn: "Compared to the same weekly period in Nov 2025 ($175,000 USD), shipments increased by +$70,000 USD supported by new reefer container slot allocations for Busan buyers.",
      },
      strategy: {
        title: "3. Rekomendasi Booking Feeder Minggu Ini",
        titleEn: "3. Feeder Booking Recommendation This Week",
        desc: "Disarankan mengamankan alokasi space feeder vessel rute JKT - SIN lebih awal untuk mengantisipasi kepadatan antrean pelabuhan Tanjung Priok pada minggu pertama Desember.",
        descEn: "Secure feeder vessel allocations on JKT - SIN route early to anticipate Tanjung Priok port congestion heading into early December.",
      },
    },
  },

  monthly: {
    id: "monthly",
    tabLabel: "Per Bulan (Monthly)",
    tabLabelEn: "Monthly",
    title: "Perbandingan Realisasi Ekspor Bulanan vs Target (Mei – Oktober 2026)",
    titleEn: "Monthly Export Realization vs Target Comparison (May – Oct 2026)",
    subtitle: "Nilai transaksi bulanan per komoditas dalam USD (Periode Semester II 2026)",
    subtitleEn: "Monthly transaction value per commodity in USD (Semester II 2026 Period)",
    badge: "Evaluasi Semester II (Mei – Oktober 2026)",
    badgeEn: "Semester II Evaluation (May – Oct 2026)",
    yMax: 260000,
    yStep: 52000,
    data: [
      { id: "m5", label: "Mei", fullLabel: "Mei 2026", realization: 140000, target: 120000, previousYear: 105000, unitLabel: "14 Shipment" },
      { id: "m6", label: "Jun", fullLabel: "Juni 2026", realization: 165000, target: 140000, previousYear: 115000, unitLabel: "16 Shipment" },
      { id: "m7", label: "Jul", fullLabel: "Juli 2026", realization: 180000, target: 160000, previousYear: 130000, unitLabel: "18 Shipment" },
      { id: "m8", label: "Agu", fullLabel: "Agustus 2026", realization: 195000, target: 180000, previousYear: 145000, unitLabel: "19 Shipment" },
      { id: "m9", label: "Sep", fullLabel: "September 2026", realization: 210000, target: 200000, previousYear: 160000, unitLabel: "21 Shipment" },
      { id: "m10", label: "Okt", fullLabel: "Oktober 2026", realization: 245000, target: 220000, previousYear: 175000, unitLabel: "25 Shipment" },
    ],
    commodityBreakdown: [
      { name: "Kopi Arabika Gayo", nameEn: "Gayo Arabica Coffee", sharePercent: 42, amountUsd: 476700, tone: "primary" },
      { name: "Udang Windu Beku", nameEn: "Frozen Black Tiger Shrimp", sharePercent: 28, amountUsd: 317800, tone: "success" },
      { name: "Organic Coconut Sugar", nameEn: "Organic Coconut Sugar", sharePercent: 18, amountUsd: 204300, tone: "primary" },
      { name: "Mebel Kayu & Rotan", nameEn: "Wood & Rattan Furniture", sharePercent: 12, amountUsd: 136200, tone: "warning" },
    ],
    insights: {
      target: {
        title: "1. Realisasi Konsisten Melampaui Target (+11.3%)",
        titleEn: "1. Consistent Target Outperformance (+11.3%)",
        desc: "Total realisasi kumulatif mencapai $1,135,000 USD melampaui target korporasi ($1,020,000 USD). Bulan Oktober mencatat rekor tertinggi ($245,000 USD) berkat peningkatan volume pesanan dari Marubeni Specialty dan Van Dijk Furniture.",
        descEn: "Total cumulative realization reached $1,135,000 USD, surpassing the corporate target ($1,020,000 USD). October recorded highest performance ($245,000 USD) driven by order volume increases from Marubeni and Van Dijk.",
      },
      growth: {
        title: "2. Pertumbuhan Signifikan Tahunan (+36.7% YoY)",
        titleEn: "2. Significant Year-on-Year Growth (+36.7% YoY)",
        desc: "Dibandingkan periode yang sama pada tahun 2025 ($830,000 USD), ekspor melonjak +$305,000 USD didorong oleh stabilitas pasokan komoditas kopi dan ekspansi rute buyer baru di Belanda dan Korea Selatan.",
        descEn: "Compared to the same period in 2025 ($830,000 USD), exports surged by +$305,000 USD, propelled by coffee supply stability and new buyer route expansions in the Netherlands and South Korea.",
      },
      strategy: {
        title: "3. Komoditas Unggulan & Rekomendasi Q4",
        titleEn: "3. Leading Commodities & Q4 Recommendations",
        desc: "Kopi Arabika Gayo (42%) dan Udang Windu Beku (28%) menyumbang 70% total omzet. Disarankan segera mengamankan alokasi kontainer reefer dan 40HC lebih awal guna mengantisipasi kenaikan freight rate akhir tahun.",
        descEn: "Gayo Arabica Coffee (42%) and Frozen Black Tiger Shrimp (28%) account for 70% of total revenue. Securing early reefer and 40HC container allocations is recommended to hedge against year-end freight rate increases.",
      },
    },
  },

  quarterly: {
    id: "quarterly",
    tabLabel: "Per 3 Bulan (Kuartal / Q1–Q4)",
    tabLabelEn: "Quarterly (3 Months)",
    title: "Perbandingan Kinerja Ekspor Kuartalan (Triwulan Q1 – Q4 2026)",
    titleEn: "Quarterly Export Performance Comparison (Q1 – Q4 2026)",
    subtitle: "Akumulasi nilai ekspor per triwulan vs Rencana Kerja & Anggaran Perusahaan (RKAP)",
    subtitleEn: "Accumulated quarterly export values vs corporate annual business plan",
    badge: "Analisis Kuartalan (4 Triwulan 2026)",
    badgeEn: "Quarterly Analysis (4 Quarters 2026)",
    yMax: 760000,
    yStep: 152000,
    data: [
      { id: "q1", label: "Q1", fullLabel: "Kuartal 1 (Jan–Mar 2026)", realization: 380000, target: 350000, previousYear: 280000, unitLabel: "38 Pengapalan" },
      { id: "q2", label: "Q2", fullLabel: "Kuartal 2 (Apr–Jun 2026)", realization: 475000, target: 420000, previousYear: 345000, unitLabel: "47 Pengapalan" },
      { id: "q3", label: "Q3", fullLabel: "Kuartal 3 (Jul–Sep 2026)", realization: 585000, target: 540000, previousYear: 435000, unitLabel: "58 Pengapalan" },
      { id: "q4", label: "Q4*", fullLabel: "Kuartal 4 (Okt–Des 2026 Est.)", realization: 710000, target: 650000, previousYear: 510000, unitLabel: "70 Pengapalan" },
    ],
    commodityBreakdown: [
      { name: "Kopi Arabika Gayo", nameEn: "Gayo Arabica Coffee", sharePercent: 44, amountUsd: 946000, tone: "primary" },
      { name: "Udang Windu Beku", nameEn: "Frozen Black Tiger Shrimp", sharePercent: 27, amountUsd: 580500, tone: "success" },
      { name: "Organic Coconut Sugar", nameEn: "Organic Coconut Sugar", sharePercent: 17, amountUsd: 365500, tone: "primary" },
      { name: "Mebel Kayu & Rotan", nameEn: "Wood & Rattan Furniture", sharePercent: 12, amountUsd: 258000, tone: "warning" },
    ],
    insights: {
      target: {
        title: "1. Ketercapaian Kuartalan Solid Rata-rata 109.8%",
        titleEn: "1. Solid Quarterly Target Attainment Averaging 109.8%",
        desc: "Seluruh kuartal berhasil ditutup di atas batas target minimal korporasi. Total akumulasi tahun berjalan (YTD) mencapai $2,150,000 USD dari target tahunan $1,960,000 USD.",
        descEn: "Every quarter closed above the corporate threshold. Cumulative year-to-date (YTD) realization reached $2,150,000 USD against the $1,960,000 USD full-year target.",
      },
      growth: {
        title: "2. Akselerasi Berkelanjutan QoQ (+21.4%)",
        titleEn: "2. Continuous Quarter-on-Quarter Acceleration (+21.4%)",
        desc: "Pertumbuhan antar-kuartal bergerak naik stabil dari $380k (Q1) menuju estimasi $710k (Q4) ditopang ekspansi buyer Uni Eropa pasca pemenuhan regulasi EUDR.",
        descEn: "QoQ growth accelerated steadily from $380k in Q1 toward estimated $710k in Q4, supported by EU buyer expansions following EUDR compliance readiness.",
      },
      strategy: {
        title: "3. Lindung Nilai Devisa & Kontrak Jangka Panjang",
        titleEn: "3. FX Hedging & Multi-Quarter Long Term Contracts",
        desc: "Disarankan mengunci nilai tukar lindung nilai (hedging forward contract) USD/IDR serta mengonversi pesanan ad-hoc buyer Jepang ke kontrak tahunan Q1 2027.",
        descEn: "Recommended to lock FX forward contracts for USD/IDR currency risk and convert ad-hoc Japanese buyer orders into annual supply agreements for Q1 2027.",
      },
    },
  },

  semester: {
    id: "semester",
    tabLabel: "Per Semester (6 Bulan)",
    tabLabelEn: "Semi-Annual (6 Months)",
    title: "Perbandingan Kinerja Ekspor Semesteran (Semester I vs Semester II 2026)",
    titleEn: "Semi-Annual Export Performance Comparison (Semester I vs Semester II 2026)",
    subtitle: "Evaluasi kinerja per semester (Semester 1: Jan–Jun vs Semester 2: Jul–Des 2026)",
    subtitleEn: "Semi-annual evaluation (Semester 1: Jan–Jun vs Semester 2: Jul–Dec 2026)",
    badge: "Evaluasi Semesteran (6 Bulan)",
    badgeEn: "Semi-Annual Evaluation (6 Months)",
    yMax: 1400000,
    yStep: 280000,
    data: [
      { id: "s1", label: "Semester I", fullLabel: "Semester I (Jan – Jun 2026)", realization: 855000, target: 770000, previousYear: 625000, unitLabel: "85 Kontainer" },
      { id: "s2", label: "Semester II*", fullLabel: "Semester II (Jul – Des 2026 Est.)", realization: 1295000, target: 1190000, previousYear: 945000, unitLabel: "128 Kontainer" },
    ],
    commodityBreakdown: [
      { name: "Kopi Arabika Gayo", nameEn: "Gayo Arabica Coffee", sharePercent: 43, amountUsd: 924500, tone: "primary" },
      { name: "Udang Windu Beku", nameEn: "Frozen Black Tiger Shrimp", sharePercent: 28, amountUsd: 602000, tone: "success" },
      { name: "Organic Coconut Sugar", nameEn: "Organic Coconut Sugar", sharePercent: 17, amountUsd: 365500, tone: "primary" },
      { name: "Mebel Kayu & Rotan", nameEn: "Wood & Rattan Furniture", sharePercent: 12, amountUsd: 258000, tone: "warning" },
    ],
    insights: {
      target: {
        title: "1. Semester II Melonjak +51.5% dibanding Semester I",
        titleEn: "1. Semester II Surges +51.5% compared to Semester I",
        desc: "Peningkatan volume Semester II ($1,295,000 USD) dipicu oleh siklus panen raya kopi Gayo di Aceh Tengah dan pembukaan kuota ekspor perikanan cold-storage ke Korea Selatan.",
        descEn: "Semester II volume expansion ($1,295,000 USD) was driven by Gayo coffee harvest cycles in Central Aceh and new fishery cold-storage quotas to South Korea.",
      },
      growth: {
        title: "2. Ketercapaian Semester I 111.0% & Semester II 108.8%",
        titleEn: "2. Target Attainment S1 111.0% & S2 108.8%",
        desc: "Kedua semester secara konsisten melampaui target anggaran tahunan. Total devisa hasil ekspor (DHE SDA) telah memenuhi kepatuhan penempatan 30% di bank domestik sesuai PP 36/2023.",
        descEn: "Both semesters reliably exceeded target budgets. Total export proceeds (DHE SDA) fully complied with the 30% domestic bank placement requirement per PP 36/2023.",
      },
      strategy: {
        title: "3. Kesiapan Perjanjian Dagang Preferensial 2027",
        titleEn: "3. Preferential Trade Agreement Readiness for 2027",
        desc: "Maksimalkan pemanfaatan COO e-SKA Form D (ASEAN) dan Form IJEPA (Jepang) agar buyer luar negeri menikmati tarif bea masuk 0% secara penuh.",
        descEn: "Maximize utilization of electronic COO Form D (ASEAN) and Form IJEPA (Japan) so overseas buyers enjoy zero import tariff duties.",
      },
    },
  },

  yearly: {
    id: "yearly",
    tabLabel: "Per Tahun (Tahunan / Multi-Year)",
    tabLabelEn: "Yearly (Multi-Year)",
    title: "Tren Perbandingan Kinerja Ekspor Tahunan (2023 – 2027 Rencana Kerja)",
    titleEn: "Multi-Year Annual Export Performance Trend (2023 – 2027 Projections)",
    subtitle: "Pertumbuhan historis ekspor dan target Rencana Kerja Anggaran Perusahaan jangka panjang",
    subtitleEn: "Historical export growth track record and long-term corporate budget targets",
    badge: "Tren Historis & Rencana Kerja 5 Tahun",
    badgeEn: "5-Year Historical Trend & Business Plan",
    yMax: 3000000,
    yStep: 600000,
    data: [
      { id: "y23", label: "2023", fullLabel: "Tahun 2023 (Realisasi Historis)", realization: 980000, target: 950000, previousYear: 750000, unitLabel: "98 Shipment" },
      { id: "y24", label: "2024", fullLabel: "Tahun 2024 (Realisasi Historis)", realization: 1250000, target: 1200000, previousYear: 980000, unitLabel: "125 Shipment" },
      { id: "y25", label: "2025", fullLabel: "Tahun 2025 (Realisasi Penuh)", realization: 1570000, target: 1500000, previousYear: 1250000, unitLabel: "157 Shipment" },
      { id: "y26", label: "2026*", fullLabel: "Tahun 2026 (Berjalan & Est.)", realization: 2150000, target: 1960000, previousYear: 1570000, unitLabel: "213 Shipment" },
      { id: "y27", label: "2027*", fullLabel: "Tahun 2027 (Target RKAP)", realization: 2800000, target: 2800000, previousYear: 2150000, unitLabel: "280 Target" },
    ],
    commodityBreakdown: [
      { name: "Kopi Arabika Gayo", nameEn: "Gayo Arabica Coffee", sharePercent: 45, amountUsd: 3937500, tone: "primary" },
      { name: "Udang Windu Beku", nameEn: "Frozen Black Tiger Shrimp", sharePercent: 26, amountUsd: 2275000, tone: "success" },
      { name: "Organic Coconut Sugar", nameEn: "Organic Coconut Sugar", sharePercent: 17, amountUsd: 1487500, tone: "primary" },
      { name: "Mebel Kayu & Rotan", nameEn: "Wood & Rattan Furniture", sharePercent: 12, amountUsd: 1050000, tone: "warning" },
    ],
    insights: {
      target: {
        title: "1. CAGR Pertumbuhan Ekspor Mencapai +30.0% Per Tahun",
        titleEn: "1. Export CAGR Reaches +30.0% Annually",
        desc: "Kinerja ekspor berkembang pesat dari $980,000 USD (2023) menjadi estimasi $2,150,000 USD (2026), memperlihatkan model bisnis ekspor yang teruji dan tangguh terhadap fluktuasi global.",
        descEn: "Export revenue expanded from $980,000 USD (2023) to estimated $2,150,000 USD (2026), proving a resilient and scalable export business model.",
      },
      growth: {
        title: "2. Efisiensi Biaya Berkat Standardisasi Dokumen Digital",
        titleEn: "2. Cost Efficiency via Digital Trade Standardization",
        desc: "Sejak adopsi platform otomatisasi dokumen ekspor (COO, Packing List, Invoice, PEB), insiden demurrage pelabuhan terpangkas 92%, menghemat rata-rata $18,400 USD per kuartal.",
        descEn: "Adopting automated trade document workflows (COO, Packing List, Invoice, PEB) cut demurrage incidents by 92%, saving an average of $18,400 USD per quarter.",
      },
      strategy: {
        title: "3. Peta Jalan 2027: Target Devisa $2.80 Juta USD",
        titleEn: "3. 2027 Strategic Roadmap: $2.80M USD Target",
        desc: "Target tahun 2027 difokuskan pada sertifikasi Fairtrade & BRCGS untuk penetrasi langsung ke jaringan supermarket retail modern di Inggris dan Jerman.",
        descEn: "The 2027 milestone focuses on Fairtrade & BRCGS certifications for direct supply access into modern retail supermarket chains in the UK and Germany.",
      },
    },
  },
};

function formatCompactUsd(num: number): string {
  if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `$${Math.round(num / 1000)}k`;
  return `$${num.toLocaleString("en-US")}`;
}

function formatFullUsd(num: number): string {
  return `$${num.toLocaleString("en-US")}`;
}

export function ExportComparisonAnalytics({ isEn = false }: { isEn?: boolean }) {
  const [activeTimeframe, setActiveTimeframe] = useState<ComparisonTimeframe>("monthly");
  const [hoveredPointId, setHoveredPointId] = useState<string | null>(null);

  const currentConfig = COMPARISON_DATASETS[activeTimeframe];

  // Calculate totals for active timeframe
  const totalRealization = currentConfig.data.reduce((sum, d) => sum + d.realization, 0);
  const totalTarget = currentConfig.data.reduce((sum, d) => sum + d.target, 0);
  const totalPreviousYear = currentConfig.data.reduce((sum, d) => sum + d.previousYear, 0);

  const attainmentPercent = totalTarget > 0 ? ((totalRealization / totalTarget) * 100).toFixed(1) : "0";
  const yoyPercent = totalPreviousYear > 0 ? (((totalRealization - totalPreviousYear) / totalPreviousYear) * 100).toFixed(1) : "0";
  const varianceUsd = totalRealization - totalTarget;

  // Active or hovered data point (default to last point)
  const activePoint = currentConfig.data.find((d) => d.id === hoveredPointId) || currentConfig.data[currentConfig.data.length - 1];

  // SVG Chart Dimensions
  const svgWidth = 840;
  const svgHeight = 280;
  const paddingLeft = 65;
  const paddingRight = 30;
  const paddingTop = 35;
  const paddingBottom = 45;
  const plotWidth = svgWidth - paddingLeft - paddingRight;
  const plotHeight = svgHeight - paddingTop - paddingBottom;
  const baseY = paddingTop + plotHeight;

  // Grid steps (5 horizontal lines)
  const gridSteps = 5;
  const stepValue = currentConfig.yMax / gridSteps;
  const gridLines = Array.from({ length: gridSteps + 1 }, (_, i) => {
    const val = currentConfig.yMax - i * stepValue;
    const y = paddingTop + (i * plotHeight) / gridSteps;
    return { val, y };
  });

  const numItems = currentConfig.data.length;
  const groupWidth = plotWidth / numItems;
  const barWidth = Math.min(22, Math.max(12, groupWidth * 0.22));
  const barSpacing = Math.min(5, barWidth * 0.25);

  return (
    <div className="space-crm-container" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* CARD UTAMA ANALITIK PERBANDINGAN */}
      <div
        className="space-chart-card"
        style={{
          padding: "24px",
          background: "#FFFFFF",
          borderRadius: 14,
          border: "1px solid #E2E8F0",
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.03)",
        }}
      >
        {/* HEADER SECTION DENGAN TAB WAKTU */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, borderBottom: "1px solid #F1F5F9", paddingBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "#EFF6FF",
                    border: "1px solid #DBEAFE",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#2563EB",
                  }}
                >
                  <BarChart3 size={18} />
                </div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.01em" }}>
                  {isEn ? currentConfig.titleEn : currentConfig.title}
                </h3>
              </div>
              <p style={{ margin: 0, color: "#64748B", fontSize: "13px", lineHeight: 1.4 }}>
                {isEn ? currentConfig.subtitleEn : currentConfig.subtitle}
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "4px 10px",
                  borderRadius: 999,
                  background: "#F0FDF4",
                  border: "1px solid #DCFCE7",
                  color: "#15803D",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                <CheckCircle2 size={13} />
                {isEn ? currentConfig.badgeEn : currentConfig.badge}
              </span>
            </div>
          </div>

          {/* 5 PILIHAN PERIODE (PER MINGGU, PER BULAN, PER 3 BULAN, PER SEMESTER, PER TAHUN) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#F8FAFC",
              padding: "4px",
              borderRadius: 10,
              border: "1px solid #E2E8F0",
              overflowX: "auto",
              scrollbarWidth: "none",
            }}
          >
            {(["weekly", "monthly", "quarterly", "semester", "yearly"] as ComparisonTimeframe[]).map((tf) => {
              const cfg = COMPARISON_DATASETS[tf];
              const isActive = activeTimeframe === tf;
              return (
                <button
                  key={tf}
                  type="button"
                  onClick={() => {
                    setActiveTimeframe(tf);
                    setHoveredPointId(null);
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 14px",
                    borderRadius: 7,
                    fontSize: "12.5px",
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? "#FFFFFF" : "#475569",
                    background: isActive ? "#043873" : "transparent",
                    border: "none",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.15s ease",
                    boxShadow: isActive ? "0 2px 6px rgba(4, 56, 115, 0.2)" : "none",
                  }}
                >
                  <Calendar size={13} opacity={isActive ? 1 : 0.65} />
                  <span>{isEn ? cfg.tabLabelEn : cfg.tabLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4 KARTU METRIK EKSEKUTIF (TOP KPI HIGHLIGHTS) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12, marginTop: 4 }}>
          {/* KPI 1: Total Realisasi */}
          <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>
                {isEn ? "Total Export Realization" : "Total Realisasi Ekspor"}
              </span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: varianceUsd >= 0 ? "#15803D" : "#B91C1C",
                  background: varianceUsd >= 0 ? "#DCFCE7" : "#FEE2E2",
                  padding: "1px 6px",
                  borderRadius: 4,
                }}
              >
                {varianceUsd >= 0 ? `+${formatCompactUsd(varianceUsd)}` : formatCompactUsd(varianceUsd)}
              </span>
            </div>
            <div style={{ fontSize: "21px", fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>
              {formatFullUsd(totalRealization)}
            </div>
            <small style={{ color: "#64748B", fontSize: "11px" }}>
              {isEn ? `vs Target ${formatCompactUsd(totalTarget)} USD` : `vs Target ${formatCompactUsd(totalTarget)} USD`}
            </small>
          </div>

          {/* KPI 2: Target Korporasi & Pencapaian */}
          <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>
                {isEn ? "Target Attainment" : "Ketercapaian Target"}
              </span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#1D4ED8",
                  background: "#DBEAFE",
                  padding: "1px 6px",
                  borderRadius: 4,
                }}
              >
                {attainmentPercent}%
              </span>
            </div>
            <div style={{ fontSize: "21px", fontWeight: 800, color: "#1E293B", letterSpacing: "-0.02em" }}>
              {formatFullUsd(totalTarget)}
            </div>
            <div style={{ width: "100%", height: 5, background: "#E2E8F0", borderRadius: 99, marginTop: 6, overflow: "hidden" }}>
              <div
                style={{
                  width: `${Math.min(100, Number(attainmentPercent))}%`,
                  height: "100%",
                  background: Number(attainmentPercent) >= 100 ? "#10B981" : "#2563EB",
                  borderRadius: 99,
                }}
              />
            </div>
          </div>

          {/* KPI 3: Pertumbuhan YoY */}
          <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>
                {isEn ? "YoY Period Growth" : "Pertumbuhan Periode YoY"}
              </span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#15803D",
                  background: "#DCFCE7",
                  padding: "1px 6px",
                  borderRadius: 4,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <TrendingUp size={11} /> +{yoyPercent}%
              </span>
            </div>
            <div style={{ fontSize: "21px", fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>
              +{formatCompactUsd(totalRealization - totalPreviousYear)}
            </div>
            <small style={{ color: "#64748B", fontSize: "11px" }}>
              {isEn ? `Baseline 2025: ${formatCompactUsd(totalPreviousYear)} USD` : `Baseline 2025: ${formatCompactUsd(totalPreviousYear)} USD`}
            </small>
          </div>

          {/* KPI 4: Komoditas Terbesar */}
          <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>
                {isEn ? "Top Export Commodity" : "Komoditas Terbesar"}
              </span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#6D28D9",
                  background: "#EDE9FE",
                  padding: "1px 6px",
                  borderRadius: 4,
                }}
              >
                {currentConfig.commodityBreakdown[0]?.sharePercent}% Share
              </span>
            </div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#0F172A", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {isEn ? currentConfig.commodityBreakdown[0]?.nameEn : currentConfig.commodityBreakdown[0]?.name}
            </div>
            <small style={{ color: "#64748B", fontSize: "11px" }}>
              {formatFullUsd(currentConfig.commodityBreakdown[0]?.amountUsd || 0)} USD
            </small>
          </div>
        </div>

        {/* GRAFIK UTAMA: HIGH-RESOLUTION SVG CHART DENGAN HOVER & TOOLTIP */}
        <div style={{ marginTop: 8, background: "#FAFBFD", border: "1px solid #E2E8F0", borderRadius: 12, padding: "16px 20px 12px 14px", position: "relative" }}>
          {/* LEGEND DI ATAS GRAFIK */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: "12px", color: "#334155" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: "#2563EB", display: "inline-block" }} />
                <span style={{ fontWeight: 600 }}>{isEn ? "Actual Realization" : "Realisasi Ekspor 2026"}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: "#10B981", display: "inline-block" }} />
                <span style={{ fontWeight: 600 }}>{isEn ? "Corporate Target" : "Target Perusahaan"}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: "#CBD5E1", display: "inline-block" }} />
                <span style={{ fontWeight: 600 }}>{isEn ? "Previous Year (2025)" : "Tahun Lalu (2025)"}</span>
              </div>
            </div>

            <div style={{ fontSize: "11px", color: "#64748B", display: "flex", alignItems: "center", gap: 4 }}>
              <Info size={12} />
              <span>{isEn ? "Hover bar to inspect specific period metrics" : "Arahkan kursor pada batang untuk melihat detail"}</span>
            </div>
          </div>

          {/* SVG RENDERING */}
          <div style={{ width: "100%", height: 300, position: "relative" }}>
            <svg width="100%" height="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
              <defs>
                <linearGradient id="realizationGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#1D4ED8" />
                </linearGradient>
                <linearGradient id="targetGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34D399" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                <linearGradient id="prevGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E2E8F0" />
                  <stop offset="100%" stopColor="#94A3B8" />
                </linearGradient>
              </defs>

              {/* Grid lines horizontal & Y-Axis Labels */}
              {gridLines.map((gl) => (
                <g key={gl.val}>
                  <line
                    x1={paddingLeft}
                    y1={gl.y}
                    x2={svgWidth - paddingRight}
                    y2={gl.y}
                    stroke="#E2E8F0"
                    strokeWidth={gl.val === 0 ? 1.5 : 1}
                    strokeDasharray={gl.val === 0 ? "none" : "3 4"}
                  />
                  <text
                    x={paddingLeft - 10}
                    y={gl.y + 4}
                    textAnchor="end"
                    fontSize="11"
                    fill="#64748B"
                    fontWeight="600"
                  >
                    {formatCompactUsd(gl.val)}
                  </text>
                </g>
              ))}

              {/* Grouped Bars per Data Point */}
              {currentConfig.data.map((item, idx) => {
                const groupCenterX = paddingLeft + (idx + 0.5) * groupWidth;
                const isHovered = hoveredPointId === item.id;

                const hPrev = Math.max(3, (item.previousYear / currentConfig.yMax) * plotHeight);
                const hTgt = Math.max(3, (item.target / currentConfig.yMax) * plotHeight);
                const hReal = Math.max(3, (item.realization / currentConfig.yMax) * plotHeight);

                const xPrev = groupCenterX - (barWidth * 1.5 + barSpacing);
                const xTgt = groupCenterX - barWidth * 0.5;
                const xReal = groupCenterX + (barWidth * 0.5 + barSpacing);

                const attainment = ((item.realization / item.target) * 100).toFixed(0);

                return (
                  <g
                    key={item.id}
                    onMouseEnter={() => setHoveredPointId(item.id)}
                    onMouseLeave={() => setHoveredPointId(null)}
                    style={{ cursor: "pointer" }}
                  >
                    {/* Hover highlight background column */}
                    {isHovered && (
                      <rect
                        x={paddingLeft + idx * groupWidth}
                        y={paddingTop}
                        width={groupWidth}
                        height={plotHeight}
                        fill="#EFF6FF"
                        opacity="0.45"
                        rx="6"
                      />
                    )}

                    {/* Bar 1: Previous Year (Slate) */}
                    <rect
                      x={xPrev}
                      y={baseY - hPrev}
                      width={barWidth}
                      height={hPrev}
                      fill={isHovered ? "#94A3B8" : "url(#prevGradient)"}
                      rx="3"
                    >
                      <title>{isEn ? `Previous Year: $${item.previousYear.toLocaleString()}` : `Tahun Lalu: $${item.previousYear.toLocaleString()}`}</title>
                    </rect>

                    {/* Bar 2: Target (Emerald) */}
                    <rect
                      x={xTgt}
                      y={baseY - hTgt}
                      width={barWidth}
                      height={hTgt}
                      fill={isHovered ? "#059669" : "url(#targetGradient)"}
                      rx="3"
                    >
                      <title>{isEn ? `Target: $${item.target.toLocaleString()}` : `Target: $${item.target.toLocaleString()}`}</title>
                    </rect>

                    {/* Bar 3: Realization (Royal Blue) */}
                    <rect
                      x={xReal}
                      y={baseY - hReal}
                      width={barWidth}
                      height={hReal}
                      fill={isHovered ? "#1D4ED8" : "url(#realizationGradient)"}
                      rx="3"
                      filter={isHovered ? "drop-shadow(0 2px 5px rgba(29, 78, 216, 0.4))" : undefined}
                    >
                      <title>{isEn ? `Realization: $${item.realization.toLocaleString()}` : `Realisasi: $${item.realization.toLocaleString()}`}</title>
                    </rect>

                    {/* Floating Value Tag above Realization Bar */}
                    <text
                      x={xReal + barWidth / 2}
                      y={baseY - hReal - 7}
                      textAnchor="middle"
                      fontSize={isHovered ? "11.5" : "10"}
                      fill="#1E40AF"
                      fontWeight="800"
                    >
                      {formatCompactUsd(item.realization)}
                    </text>

                    {/* X-Axis Label */}
                    <text
                      x={groupCenterX}
                      y={baseY + 18}
                      textAnchor="middle"
                      fontSize="12"
                      fill={isHovered ? "#0F172A" : "#334155"}
                      fontWeight={isHovered ? "700" : "600"}
                    >
                      {item.label}
                    </text>

                    {/* Sub-label (Ketercapaian % atau Unit) */}
                    <text
                      x={groupCenterX}
                      y={baseY + 32}
                      textAnchor="middle"
                      fontSize="10"
                      fill={Number(attainment) >= 100 ? "#16A34A" : "#64748B"}
                      fontWeight="600"
                    >
                      {attainment}% Tgt
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* ACTIVE HOVER DETAIL PANEL (INFO CARD) */}
          {activePoint && (
            <div
              style={{
                marginTop: 10,
                background: "#FFFFFF",
                border: "1px solid #DBEAFE",
                borderRadius: 8,
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 12,
                boxShadow: "0 1px 4px rgba(37, 99, 235, 0.08)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#2563EB",
                  }}
                />
                <span style={{ fontWeight: 700, color: "#0F172A", fontSize: "13px" }}>
                  {activePoint.fullLabel}:
                </span>
                <span style={{ color: "#64748B", fontSize: "12px" }}>
                  {activePoint.unitLabel}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: "12.5px" }}>
                <span>
                  <strong style={{ color: "#2563EB" }}>Realisasi:</strong> {formatFullUsd(activePoint.realization)} USD
                </span>
                <span>
                  <strong style={{ color: "#059669" }}>Target:</strong> {formatFullUsd(activePoint.target)} USD
                </span>
                <span>
                  <strong style={{ color: "#64748B" }}>Tahun Lalu:</strong> {formatFullUsd(activePoint.previousYear)} USD
                </span>
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontSize: "11.5px",
                    fontWeight: 700,
                    background: activePoint.realization >= activePoint.target ? "#DCFCE7" : "#FEF3C7",
                    color: activePoint.realization >= activePoint.target ? "#15803D" : "#B45309",
                  }}
                >
                  {activePoint.realization >= activePoint.target ? "✓ Melampaui Target" : "Under Target"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* DISTRIBUSI KOMODITAS TERKAIT PERIODE (COMMODITY BREAKDOWN) */}
        <div style={{ marginTop: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <Package size={15} color="#2563EB" />
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#1E293B" }}>
              {isEn ? "Commodity Revenue Contribution in Selected Period" : "Kontribusi Komoditas Ekspor pada Periode Ini"}
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            {currentConfig.commodityBreakdown.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: "#F8FAFC",
                  padding: "12px 14px",
                  borderRadius: 8,
                  border: "1px solid #E2E8F0",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12.5px" }}>
                  <span style={{ fontWeight: 600, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {isEn ? item.nameEn : item.name}
                  </span>
                  <span style={{ fontWeight: 700, color: "#2563EB" }}>
                    {item.sharePercent}%
                  </span>
                </div>
                <div style={{ width: "100%", height: 6, background: "#E2E8F0", borderRadius: 99, overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${item.sharePercent}%`,
                      height: "100%",
                      borderRadius: 99,
                      background: item.tone === "success" ? "#10B981" : item.tone === "warning" ? "#F59E0B" : "#2563EB",
                    }}
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748B" }}>
                  <span>{formatFullUsd(item.amountUsd)} USD</span>
                  <span>Port of Discharge</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* KESIMPULAN & ANALISIS EKSEKUTIF BERDASARKAN PERIODE PILIHAN */}
        <div
          style={{
            marginTop: 8,
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: 12,
            padding: "18px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <TrendingUp size={18} color="#2563EB" />
              <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0F172A" }}>
                {isEn ? "Executive Insights & Operational Recommendations" : "Kesimpulan & Analisis Kinerja Realisasi Ekspor"}
              </h4>
            </div>
            <SpaceBadge tone="primary">
              {isEn ? currentConfig.badgeEn : currentConfig.badge}
            </SpaceBadge>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
            {/* Insight 1: Ketercapaian Target */}
            <div style={{ background: "#FFFFFF", padding: "14px 16px", borderRadius: 8, border: "1px solid #E2E8F0" }}>
              <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#059669", display: "flex", alignItems: "center", gap: 6 }}>
                <CheckCircle2 size={15} />
                {isEn ? currentConfig.insights.target.titleEn : currentConfig.insights.target.title}
              </span>
              <p style={{ margin: "6px 0 0 0", fontSize: "12px", color: "#475569", lineHeight: 1.5 }}>
                {isEn ? currentConfig.insights.target.descEn : currentConfig.insights.target.desc}
              </p>
            </div>

            {/* Insight 2: Pertumbuhan YoY */}
            <div style={{ background: "#FFFFFF", padding: "14px 16px", borderRadius: 8, border: "1px solid #E2E8F0" }}>
              <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#2563EB", display: "flex", alignItems: "center", gap: 6 }}>
                <TrendingUp size={15} />
                {isEn ? currentConfig.insights.growth.titleEn : currentConfig.insights.growth.title}
              </span>
              <p style={{ margin: "6px 0 0 0", fontSize: "12px", color: "#475569", lineHeight: 1.5 }}>
                {isEn ? currentConfig.insights.growth.descEn : currentConfig.insights.growth.desc}
              </p>
            </div>

            {/* Insight 3: Rekomendasi Strategis */}
            <div style={{ background: "#FFFFFF", padding: "14px 16px", borderRadius: 8, border: "1px solid #E2E8F0" }}>
              <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#0284C7", display: "flex", alignItems: "center", gap: 6 }}>
                <Package size={15} />
                {isEn ? currentConfig.insights.strategy.titleEn : currentConfig.insights.strategy.title}
              </span>
              <p style={{ margin: "6px 0 0 0", fontSize: "12px", color: "#475569", lineHeight: 1.5 }}>
                {isEn ? currentConfig.insights.strategy.descEn : currentConfig.insights.strategy.desc}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
