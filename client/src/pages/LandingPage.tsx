import {
  calculateDemurrageSimulation,
  calculatePlanBilling,
  SUBSCRIPTION_PLANS,
  type SubscriptionPlanSpec,
} from "@shared/exportCompliance";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  CreditCard,
  Database,
  FileCheck2,
  FileSearch,
  FileText,
  FolderArchive,
  Globe,
  Layers,
  Lock,
  Package,
  Play,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Ship,
  Smartphone,
  Star,
  Truck,
  Users,
} from "lucide-react";
import React, { useMemo, useState } from "react";

interface LandingPageProps {
  onOpenAuth: (mode: "login" | "register") => void;
  onStartDemo: () => void;
  demoRemainingLabel?: string | null;
}

function formatIdr(amount: number): string {
  return `Rp ${Math.round(amount).toLocaleString("id-ID")}`;
}

// Logo Resmi EksporFlow yang diselaraskan dengan identitas desain sistem
function EksporFlowLogo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      {/* Mark Geometris Dua Bilah Skewed (Saffron Gold & Customs Emerald) */}
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#0B2545] to-[#043873] border border-white/20 flex items-center justify-center p-2 shadow-sm">
        <div className="flex flex-col gap-1 w-5 h-4 justify-center">
          <span className="block h-1.5 w-full rounded-[2px] bg-[#FFE492] -skew-x-[22deg]" />
          <span className="block h-1.5 w-3 rounded-[2px] bg-[#34D399] -skew-x-[22deg] ml-2" />
        </div>
      </div>
      <div className="flex flex-col">
        <span
          className={`font-extrabold text-xl tracking-tight leading-none ${
            light ? "text-white" : "text-[#212529]"
          }`}
        >
          Ekspor<span className="text-[#FFE492]">Flow</span>
        </span>
        <span className="text-[10px] text-white/70 font-semibold tracking-wider uppercase mt-0.5">
          Export Operations
        </span>
      </div>
    </div>
  );
}

// Garis Kuas Kuning Khas Desain Figma Whitepace di Bawah Teks Kunci
function BrushHighlight({
  children,
  color = "#FFE492",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <span className="relative inline-block whitespace-nowrap">
      <span className="relative z-10">{children}</span>
      <svg
        className="absolute -bottom-2.5 left-0 w-full h-3.5 z-0 pointer-events-none overflow-visible"
        viewBox="0 0 250 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <path
          d="M3 11.5C45 4.5 125 3 247 10C180 14 70 15 5 13"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.95"
        />
      </svg>
    </span>
  );
}

// Garis Kontur Gelombang Maritim Elegan Khas Desain Figma Whitepace
function WaveContourBackground({ className = "" }: { className?: string }) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden opacity-15 select-none ${className}`}
      aria-hidden="true"
    >
      <svg
        className="w-full h-full object-cover"
        viewBox="0 0 1440 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <path d="M-200 150C200 400 800 -100 1600 300" stroke="#4F9CF9" strokeWidth="1.5" />
        <path d="M-200 200C200 450 800 -50 1600 350" stroke="#4F9CF9" strokeWidth="1.5" />
        <path d="M-200 250C200 500 800 0 1600 400" stroke="#4F9CF9" strokeWidth="1.5" />
        <path d="M-200 300C200 550 800 50 1600 450" stroke="#4F9CF9" strokeWidth="1.5" />
        <path d="M-200 350C200 600 800 100 1600 500" stroke="#4F9CF9" strokeWidth="1.5" />
        <path d="M-200 400C200 650 800 150 1600 550" stroke="#4F9CF9" strokeWidth="1.5" />
        <path d="M-200 450C200 700 800 200 1600 600" stroke="#4F9CF9" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

export function LandingPage({
  onOpenAuth,
  onStartDemo,
  demoRemainingLabel,
}: LandingPageProps) {
  // Simulasi Demurrage Interaktif
  const [containerCount, setContainerCount] = useState(2);
  const [delayedDays, setDelayedDays] = useState(4);
  const [dailyRateUsd, setDailyRateUsd] = useState(150);
  const [selectedPlanId, setSelectedPlanId] =
    useState<SubscriptionPlanSpec["id"]>("growth");

  // Kalkulator Langganan
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  const demurrage = useMemo(
    () =>
      calculateDemurrageSimulation({
        containerCount,
        delayedDays,
        dailyRateUsd,
        exchangeRateIdr: 16200,
        planId: selectedPlanId,
      }),
    [containerCount, delayedDays, dailyRateUsd, selectedPlanId],
  );

  const testimonials = [
    {
      id: 1,
      quote:
        "Sebelumnya kami sempat menanggung denda demurrage USD 1,800 di Port of Los Angeles karena salah ketik nomor kontainer di B/L dan Packing List. Dengan EksporFlow, seluruh dokumen sinkron otomatis tanpa selisih sepeser pun.",
      author: "Hendra Wijaya",
      role: "Direktur Operasional",
      company: "PT Nusantara Kopi Gayo",
      sector: "Kopi Arabika Ekspor",
      avatar: "HW",
      highlight: false,
    },
    {
      id: 2,
      quote:
        "Penerbitan COO e-SKA dan Health Certificate karantina udang jadi 5x lebih cepat. Buyer kami di Gothenburg Swedia sangat puas dengan kecepatan validasi draft sebelum kapal sandar di pelabuhan tujuan.",
      author: "Siti Rahmawati",
      role: "Head of Export Compliance",
      company: "CV Celebes Seafood Mandiri",
      sector: "Perikanan & Hasil Laut",
      avatar: "SR",
      highlight: true,
    },
    {
      id: 3,
      quote:
        "Kalkulator kontainer 20ft dan 40HC sangat presisi menghitung batas susut bobot kayu jati dan rotan. Tim gudang stuffing kami langsung bekerja berdasarkan lembar instruksi resmi yang diterbitkan sistem.",
      author: "Budi Santoso",
      role: "Managing Director",
      company: "PT Jepara Furniture Global",
      sector: "Furnitur & Kerajinan Kayu",
      avatar: "BS",
      highlight: true,
    },
  ];

  return (
    <div className="min-h-screen bg-white text-[#212529] font-sans antialiased selection:bg-[#4F9CF9] selection:text-white">
      {/* =========================================================
          1. HEADER (Figma Whitepace Deep Navy: #043873)
         ========================================================= */}
      <header className="sticky top-0 z-50 bg-[#043873] border-b border-[#0f4d96]/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 h-20 flex items-center justify-between">
          {/* Logo Resmi EksporFlow */}
          <EksporFlowLogo light />

          {/* Navigasi Utama */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-white/90">
            <a href="#dokumen" className="hover:text-[#FFE492] transition-colors">
              Dokumen UN/CEFACT
            </a>
            <a href="#solusi" className="hover:text-[#FFE492] transition-colors">
              Solusi Ekosistem
            </a>
            <a href="#kalkulator" className="hover:text-[#FFE492] transition-colors">
              Simulasi Demurrage
            </a>
            <a href="#harga" className="hover:text-[#FFE492] transition-colors">
              Paket Harga
            </a>
          </nav>

          {/* Tombol Aksi Kanan (Masuk #FFE492, Coba Demo #4F9CF9) */}
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={() => onOpenAuth("login")}
              className="bg-[#FFE492] hover:bg-[#fed668] text-[#043873] text-sm font-semibold px-5 py-2.5 rounded-lg transition-all shadow-xs"
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={onStartDemo}
              className="inline-flex items-center gap-2 bg-[#4F9CF9] hover:bg-[#3d8ceb] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-all shadow-md group"
            >
              <span>{demoRemainingLabel ? `Lanjut Demo (${demoRemainingLabel})` : "Coba Demo 3 Hari"}</span>
              <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================
          2. HERO SECTION (Whitepace Deep Navy #043873 + Vector Waves)
         ========================================================= */}
      <section className="relative bg-[#043873] text-white pt-16 pb-24 overflow-hidden border-b border-[#0f4d96]/40">
        <WaveContourBackground />

        <div className="relative max-w-7xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Kiri: Headline & Call-To-Action */}
            <div className="lg:col-span-6 space-y-6">
              <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight leading-[1.15]">
                Tuntaskan Operasional Ekspor Bersama{" "}
                <BrushHighlight color="#FFE492">EksporFlow</BrushHighlight>
              </h1>

              <p className="text-base sm:text-lg text-white/85 leading-relaxed max-w-xl">
                Satu workspace terintegrasi untuk eksportir dan UMKM Indonesia: otomatisasi 6 dokumen ekspor berstandar UN/CEFACT (COO e-SKA, Invoice, Packing List, PEB), kalkulasi stuffing kontainer 3D, verifikasi buyer anti-fraud, dan pencegahan denda demurrage pelabuhan.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={onStartDemo}
                  className="inline-flex items-center gap-2.5 bg-[#4F9CF9] hover:bg-[#3d8ceb] text-white font-semibold text-base px-7 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all group"
                >
                  <span>Coba EksporFlow Gratis</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>

                <a
                  href="#kalkulator"
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white border border-white/20 font-semibold text-base px-6 py-4 rounded-lg transition-all"
                >
                  <span>Simulasi Demurrage</span>
                </a>
              </div>

              {/* Tiga Pilar Kepatuhan Ekspor */}
              <div className="pt-6 border-t border-white/15 flex flex-wrap items-center gap-6 text-xs text-white/70">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#FFE492]" />
                  <span>Format COO e-SKA Resmi</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#FFE492]" />
                  <span>Kepatuhan Bea Cukai DJBC</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#FFE492]" />
                  <span>Devisa DHE SDA PP 36/2023</span>
                </div>
              </div>
            </div>

            {/* Kanan: Ilustrasi Editorial Maritim EksporFlow (Bespoke Maritime Trade Artwork) */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="w-full max-w-[560px] relative rounded-2xl bg-[#031C3C]/80 border border-white/15 shadow-2xl overflow-hidden backdrop-blur-xs">
                {/* Visual Telemetry Bar (Technical Nautical Chart Header) */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-[#02152E]/90 text-[11px] font-mono text-white/70">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#FFE492]" />
                    <span className="font-semibold text-white/90">
                      CHART REF: IDJKT-NLRTM // UN/CEFACT
                    </span>
                  </div>
                  <span className="text-[10px] text-white/60">
                    LAT 06°06&apos;S · LON 106°53&apos;E
                  </span>
                </div>

                {/* SVG Bespoke Maritime Artwork */}
                <svg
                  viewBox="0 0 560 380"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-auto select-none block"
                  aria-label="Ilustrasi Kapal Kontainer Samudera EksporFlow dan Rute Perdagangan Maritim Global"
                >
                  <defs>
                    {/* Sky Gradient */}
                    <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="240" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#02142B" />
                      <stop offset="60%" stopColor="#05254A" />
                      <stop offset="100%" stopColor="#0B3766" />
                    </linearGradient>

                    {/* Ocean Depth Gradient */}
                    <linearGradient id="oceanGrad" x1="0" y1="240" x2="0" y2="380" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#072A52" />
                      <stop offset="35%" stopColor="#041E3D" />
                      <stop offset="100%" stopColor="#010D1D" />
                    </linearGradient>

                    {/* Container Shading Gradients */}
                    <linearGradient id="cntGold" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#FFE492" />
                      <stop offset="100%" stopColor="#D97706" />
                    </linearGradient>

                    <linearGradient id="cntEmerald" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#6EE7B7" />
                      <stop offset="100%" stopColor="#047857" />
                    </linearGradient>

                    <linearGradient id="cntAzure" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#93C5FD" />
                      <stop offset="100%" stopColor="#1D4ED8" />
                    </linearGradient>

                    <linearGradient id="cntNavy" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#475569" />
                      <stop offset="100%" stopColor="#0F172A" />
                    </linearGradient>

                    {/* Hull Gradient */}
                    <linearGradient id="hullBodyGrad" x1="0" y1="230" x2="0" y2="300" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#1E3E62" />
                      <stop offset="50%" stopColor="#0E2338" />
                      <stop offset="100%" stopColor="#05101C" />
                    </linearGradient>

                    {/* Glow filter for route lines */}
                    <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="2.5" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* 1. Latar Langit Maritim & Garis Kisi Kartografi */}
                  <rect x="0" y="0" width="560" height="240" fill="url(#skyGrad)" />
                  
                  {/* Garis Lintang & Bujur Kartografi Laut */}
                  <g opacity="0.22" stroke="#4F9CF9" strokeWidth="0.75" strokeDasharray="3 5">
                    <line x1="0" y1="45" x2="560" y2="45" />
                    <line x1="0" y1="105" x2="560" y2="105" />
                    <line x1="0" y1="165" x2="560" y2="165" />
                    <line x1="0" y1="225" x2="560" y2="225" />
                    <line x1="140" y1="0" x2="140" y2="240" />
                    <line x1="280" y1="0" x2="280" y2="240" />
                    <line x1="420" y1="0" x2="420" y2="240" />
                  </g>

                  {/* Koordinat Tepi Kartografi */}
                  <text x="14" y="49" fill="#93C5FD" opacity="0.45" fontSize="8" fontFamily="monospace">10°00&apos;N</text>
                  <text x="14" y="109" fill="#93C5FD" opacity="0.45" fontSize="8" fontFamily="monospace">05°00&apos;N</text>
                  <text x="14" y="169" fill="#93C5FD" opacity="0.45" fontSize="8" fontFamily="monospace">00°00&apos; EQ</text>
                  <text x="14" y="229" fill="#93C5FD" opacity="0.45" fontSize="8" fontFamily="monospace">05°00&apos;S</text>

                  {/* Mawar Kompas (Compass Rose Nautical Marking) Kanan Atas */}
                  <g transform="translate(485, 55)" opacity="0.55">
                    <circle cx="0" cy="0" r="28" stroke="#FFE492" strokeWidth="0.75" fill="none" strokeDasharray="2 2" />
                    <circle cx="0" cy="0" r="20" stroke="#4F9CF9" strokeWidth="0.5" fill="none" />
                    <circle cx="0" cy="0" r="2.5" fill="#FFE492" />
                    {/* Jarum Kompas 4 Arah Mata Angin */}
                    <polygon points="0,-24 3,-5 0,0 -3,-5" fill="#FFE492" />
                    <polygon points="0,24 3,5 0,0 -3,5" fill="#4F9CF9" />
                    <polygon points="24,0 5,3 0,0 5,-3" fill="#4F9CF9" />
                    <polygon points="-24,0 -5,3 0,0 -5,-3" fill="#4F9CF9" />
                    <text x="0" y="-27" fill="#FFE492" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">N</text>
                  </g>

                  {/* Derek Pelabuhan Siluet (Tanjung Priok JICT STS Cranes) di Horison Kiri */}
                  <g opacity="0.3" transform="translate(25, 110)">
                    {/* Crane 1 */}
                    <line x1="30" y1="130" x2="48" y2="35" stroke="#93C5FD" strokeWidth="2" />
                    <line x1="68" y1="130" x2="52" y2="35" stroke="#93C5FD" strokeWidth="2" />
                    <line x1="32" y1="35" x2="115" y2="35" stroke="#93C5FD" strokeWidth="2.5" />
                    <line x1="40" y1="35" x2="105" y2="52" stroke="#93C5FD" strokeWidth="1" />
                    <line x1="45" y1="35" x2="38" y2="85" stroke="#93C5FD" strokeWidth="1" />
                    <line x1="55" y1="35" x2="65" y2="85" stroke="#93C5FD" strokeWidth="1" />
                    <rect x="75" y="38" width="14" height="8" rx="1.5" fill="#FFE492" />
                    <line x1="82" y1="46" x2="82" y2="70" stroke="#FFE492" strokeWidth="0.75" />
                    <rect x="77" y="70" width="10" height="5" rx="1" fill="#34D399" />

                    {/* Crane 2 (Latar Belakang Lebih Kecil) */}
                    <g transform="translate(60, 15) scale(0.85)" opacity="0.7">
                      <line x1="30" y1="130" x2="48" y2="35" stroke="#93C5FD" strokeWidth="2" />
                      <line x1="68" y1="130" x2="52" y2="35" stroke="#93C5FD" strokeWidth="2" />
                      <line x1="32" y1="35" x2="115" y2="35" stroke="#93C5FD" strokeWidth="2.5" />
                      <rect x="72" y="38" width="14" height="8" rx="1.5" fill="#FFE492" />
                    </g>
                  </g>

                  {/* Busur Lintasan Pelayaran Global (Jakarta ➔ Rotterdam) */}
                  <path
                    d="M 75 185 C 160 50, 360 40, 480 145"
                    stroke="#FFE492"
                    strokeWidth="2.2"
                    strokeDasharray="5 5"
                    strokeLinecap="round"
                    filter="url(#routeGlow)"
                  />
                  {/* Waypoint Jakarta */}
                  <circle cx="75" cy="185" r="4.5" fill="#34D399" stroke="#ffffff" strokeWidth="1.5" />
                  <circle cx="75" cy="185" r="8" stroke="#34D399" strokeWidth="0.75" opacity="0.6" />
                  
                  {/* Waypoint Rotterdam */}
                  <circle cx="480" cy="145" r="4.5" fill="#FFE492" stroke="#ffffff" strokeWidth="1.5" />
                  <circle cx="480" cy="145" r="8" stroke="#FFE492" strokeWidth="0.75" opacity="0.6" />

                  {/* Waypoint Labels */}
                  <g transform="translate(42, 198)">
                    <rect width="66" height="17" rx="3.5" fill="#01152C" stroke="#34D399" strokeWidth="0.8" />
                    <text x="33" y="12" fill="#E2E8F0" fontSize="8.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                      POL: JKT
                    </text>
                  </g>
                  <g transform="translate(447, 158)">
                    <rect width="66" height="17" rx="3.5" fill="#01152C" stroke="#FFE492" strokeWidth="0.8" />
                    <text x="33" y="12" fill="#FFE492" fontSize="8.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                      POD: RTM
                    </text>
                  </g>

                  {/* 2. Samudera & Lapisan Ombak */}
                  <rect x="0" y="240" width="560" height="140" fill="url(#oceanGrad)" />
                  <line x1="0" y1="240" x2="560" y2="240" stroke="#FFE492" strokeWidth="0.75" opacity="0.4" />

                  {/* Garis Aliran Air Samudera Dinamis */}
                  <path
                    d="M0 258 C 70 252, 140 264, 210 257 C 280 250, 350 262, 420 256 C 480 251, 520 260, 560 257"
                    stroke="#38BDF8"
                    strokeWidth="1.2"
                    opacity="0.35"
                    fill="none"
                  />
                  <path
                    d="M0 278 C 60 272, 130 284, 200 277 C 270 270, 360 283, 440 276 C 500 271, 535 280, 560 277"
                    stroke="#34D399"
                    strokeWidth="0.9"
                    opacity="0.25"
                    fill="none"
                  />
                  <path
                    d="M0 310 C 80 304, 180 318, 270 310 C 360 302, 450 316, 560 309"
                    stroke="#4F9CF9"
                    strokeWidth="0.8"
                    opacity="0.2"
                    fill="none"
                  />

                  {/* 3. Kapal Kontainer Samudera (Main Oceanic Container Ship) */}
                  <g transform="translate(75, 115)">
                    
                    {/* Anjungan & Bangunan Atas (Superstructure & Bridge) */}
                    {/* Gedung Akomodasi Utama */}
                    <rect x="36" y="60" width="48" height="66" rx="3.5" fill="#F8FAFC" stroke="#041E3A" strokeWidth="1.8" />
                    
                    {/* Dek Anjungan Navigasi (Top Nav Bridge) */}
                    <path d="M30 68 H90 V60 H30 Z" fill="#E2E8F0" stroke="#041E3A" strokeWidth="1.5" />
                    {/* Jendela Anjungan Kaca Gelap */}
                    <rect x="34" y="62" width="52" height="5.5" rx="1.5" fill="#0A2647" />
                    <circle cx="42" cy="65" r="1.2" fill="#FFE492" />
                    <circle cx="52" cy="65" r="1.2" fill="#FFE492" />
                    <circle cx="62" cy="65" r="1.2" fill="#FFE492" />
                    <circle cx="72" cy="65" r="1.2" fill="#FFE492" />
                    <circle cx="80" cy="65" r="1.2" fill="#FFE492" />

                    {/* Dek Tengah & Jendela Kabin */}
                    <rect x="42" y="76" width="36" height="5" rx="1" fill="#CBD5E1" />
                    <rect x="42" y="88" width="36" height="5" rx="1" fill="#CBD5E1" />
                    <rect x="42" y="100" width="36" height="5" rx="1" fill="#CBD5E1" />

                    {/* Cerobong Asap (Funnel) dengan Logo Chevron EksporFlow */}
                    <rect x="48" y="38" width="22" height="22" rx="3" fill="#D97706" stroke="#041E3A" strokeWidth="1.6" />
                    <path d="M48 45H70" stroke="#041E3A" strokeWidth="2.5" />
                    {/* Skewed Dual Bar Logo pada Cerobong */}
                    <line x1="54" y1="52" x2="62" y2="50" stroke="#FFE492" strokeWidth="2" strokeLinecap="round" />
                    <line x1="56" y1="56" x2="64" y2="54" stroke="#34D399" strokeWidth="2" strokeLinecap="round" />

                    {/* Tiang Radar Navigasi & Komunikasi */}
                    <line x1="59" y1="38" x2="59" y2="20" stroke="#E2E8F0" strokeWidth="2" />
                    <line x1="50" y1="26" x2="68" y2="26" stroke="#E2E8F0" strokeWidth="1.5" />
                    <line x1="53" y1="31" x2="65" y2="31" stroke="#E2E8F0" strokeWidth="1.2" />
                    <circle cx="59" cy="20" r="2.2" fill="#EF4444" />
                    {/* Radar Scanner Berputar (Rotary Bar) */}
                    <line x1="52" y1="23" x2="66" y2="23" stroke="#FFE492" strokeWidth="1.8" strokeLinecap="round" />

                    {/* Tumpukan Kontainer Berwarna Berdasarkan Komoditas Ekspor */}
                    {/* Tier 1 (Paling Bawah - Row Bay 1 sampai 5) */}
                    <g stroke="#041E3A" strokeWidth="1.4">
                      <rect x="94" y="105" width="52" height="21" rx="2.5" fill="url(#cntNavy)" />
                      <rect x="150" y="105" width="52" height="21" rx="2.5" fill="url(#cntGold)" />
                      <rect x="206" y="105" width="52" height="21" rx="2.5" fill="url(#cntEmerald)" />
                      <rect x="262" y="105" width="52" height="21" rx="2.5" fill="url(#cntAzure)" />
                      <rect x="318" y="105" width="46" height="21" rx="2.5" fill="url(#cntGold)" />

                      {/* Tier 2 (Tengah) */}
                      <rect x="98" y="82" width="52" height="21" rx="2.5" fill="url(#cntEmerald)" />
                      <rect x="154" y="82" width="52" height="21" rx="2.5" fill="url(#cntAzure)" />
                      <rect x="210" y="82" width="52" height="21" rx="2.5" fill="url(#cntGold)" />
                      <rect x="266" y="82" width="52" height="21" rx="2.5" fill="url(#cntNavy)" />
                      <rect x="322" y="82" width="42" height="21" rx="2.5" fill="url(#cntEmerald)" />

                      {/* Tier 3 (Paling Atas) */}
                      <rect x="158" y="59" width="52" height="21" rx="2.5" fill="url(#cntGold)" />
                      <rect x="214" y="59" width="52" height="21" rx="2.5" fill="url(#cntEmerald)" />
                      <rect x="270" y="59" width="50" height="21" rx="2.5" fill="url(#cntAzure)" />
                    </g>

                    {/* Garis Corrugation Rusuk Kontainer (Nautical Realism) */}
                    <g stroke="#041E3A" strokeWidth="0.9" opacity="0.45">
                      {/* Tier 1 Ribs */}
                      <line x1="110" y1="108" x2="110" y2="123" />
                      <line x1="126" y1="108" x2="126" y2="123" />
                      <line x1="166" y1="108" x2="166" y2="123" />
                      <line x1="182" y1="108" x2="182" y2="123" />
                      <line x1="222" y1="108" x2="222" y2="123" />
                      <line x1="238" y1="108" x2="238" y2="123" />
                      <line x1="278" y1="108" x2="278" y2="123" />
                      <line x1="294" y1="108" x2="294" y2="123" />
                      <line x1="334" y1="108" x2="334" y2="123" />

                      {/* Tier 2 Ribs */}
                      <line x1="114" y1="85" x2="114" y2="100" />
                      <line x1="130" y1="85" x2="130" y2="100" />
                      <line x1="170" y1="85" x2="170" y2="100" />
                      <line x1="186" y1="85" x2="186" y2="100" />
                      <line x1="226" y1="85" x2="226" y2="100" />
                      <line x1="242" y1="85" x2="242" y2="100" />
                      <line x1="282" y1="85" x2="282" y2="100" />
                      <line x1="298" y1="85" x2="298" y2="100" />

                      {/* Tier 3 Ribs */}
                      <line x1="174" y1="62" x2="174" y2="77" />
                      <line x1="190" y1="62" x2="190" y2="77" />
                      <line x1="230" y1="62" x2="230" y2="77" />
                      <line x1="246" y1="62" x2="246" y2="77" />
                      <line x1="286" y1="62" x2="286" y2="77" />
                    </g>

                    {/* Corner Castings Twistlocks (Titik Pengait Sudut ISO) */}
                    <g fill="#041E3A" opacity="0.65">
                      <circle cx="97" cy="108" r="1.2" />
                      <circle cx="143" cy="108" r="1.2" />
                      <circle cx="153" cy="108" r="1.2" />
                      <circle cx="199" cy="108" r="1.2" />
                      <circle cx="209" cy="108" r="1.2" />
                      <circle cx="255" cy="108" r="1.2" />
                      <circle cx="265" cy="108" r="1.2" />
                      <circle cx="311" cy="108" r="1.2" />
                    </g>

                    {/* Lambung Baja Kapal Samudera (Container Vessel Hull) */}
                    <path
                      d="M14 126 H388 L356 172 H38 L14 126 Z"
                      fill="url(#hullBodyGrad)"
                      stroke="#4F9CF9"
                      strokeWidth="2.2"
                      strokeLinejoin="round"
                    />

                    {/* Garis Plimsoll (Plimsoll Waterline Emas Kunyit & Penandaan Draft) */}
                    <path d="M30 154 H368" stroke="#FFE492" strokeWidth="3" strokeLinecap="round" />
                    
                    {/* Lambang & Identitas Kapal di Haluan */}
                    <circle cx="350" cy="140" r="4.5" fill="#021326" stroke="#4F9CF9" strokeWidth="1" />
                    <text x="350" y="143" fill="#FFE492" fontSize="6.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                      EF
                    </text>
                    <text x="325" y="142" fill="#E2E8F0" fontSize="7" fontWeight="bold" fontFamily="monospace" opacity="0.8">
                      EKSPORFLOW NUSANTARA
                    </text>

                    {/* Haluan Pemecah Ombak (Bulbous Bow Wake & Water Spray) */}
                    <path
                      d="M368 158 C 390 156, 420 168, 444 163"
                      stroke="#38BDF8"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <path
                      d="M356 166 C 382 164, 412 174, 432 171"
                      stroke="#34D399"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      fill="none"
                    />
                    {/* Ombak Buritan (Stern Wake Trail) */}
                    <path
                      d="M6 162 C 22 156, 40 166, 62 162"
                      stroke="#38BDF8"
                      strokeWidth="2"
                      strokeLinecap="round"
                      opacity="0.65"
                      fill="none"
                    />
                  </g>
                </svg>

                {/* Footer Strip Kartografi Maritim (Quiet Editorial Meta Bar) */}
                <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-[#02152E]/95 border-t border-white/10 text-[10.5px] font-mono text-white/65">
                  <div className="flex items-center gap-3">
                    <span className="text-white/90 font-semibold">MV EKSPORFLOW NUSANTARA</span>
                    <span className="text-white/40">·</span>
                    <span>IMO 9872140</span>
                    <span className="text-white/40">·</span>
                    <span className="text-[#34D399]">14,800 TEU</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FFE492]" />
                    <span>RUTE: JKT (ID) ➔ RTM (NL)</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================
          3. SECTION: DOKUMEN & OPERASIONAL (White Background)
         ========================================================= */}
      <section id="dokumen" className="py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Kiri: Headline, Penjelasan & Tombol */}
            <div className="lg:col-span-6 space-y-6">
              <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-extrabold text-[#212529] tracking-tight leading-[1.2]">
                Manajemen Dokumen &amp;{" "}
                <BrushHighlight color="#FFE492">Operasional Ekspor</BrushHighlight>
              </h2>

              <p className="text-base text-[#4F5D75] leading-relaxed">
                Terbitkan dokumen ekspor resmi berstandar UN/CEFACT seperti Proforma Invoice, Sales Contract, Commercial Invoice, Packing List, Shipping Instruction, hingga Certificate of Origin (COO e-SKA) secara otomatis. Tidak ada lagi salah ketik nomor segel kontainer atau salah konversi bobot kargo.
              </p>

              <div className="space-y-3 pt-1 text-sm text-slate-700">
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={17} className="text-[#043873] shrink-0 mt-0.5" />
                  <span><b>Editor Dokumen A4:</b> Pengaturan kop surat perusahaan resmi, stempel basah digital, dan tanda tangan sah.</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={17} className="text-[#043873] shrink-0 mt-0.5" />
                  <span><b>Ekspor PDF &amp; DOCX:</b> Siap cetak dan siap kirim ke buyer maupun pihak perbankan L/C.</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={17} className="text-[#043873] shrink-0 mt-0.5" />
                  <span><b>Audit Trail SHA-256:</b> Setiap berkas disegel sidik jari digital untuk kepatuhan audit devisa.</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onStartDemo}
                  className="inline-flex items-center gap-2 bg-[#4F9CF9] hover:bg-[#3d8ceb] text-white font-semibold text-base px-6 py-3.5 rounded-lg shadow-md transition-all group"
                >
                  <span>Mulai Terbitkan Dokumen</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Kanan: Whitepace Visual Container (#C4DEFD) dengan Kalkulator Demurrage Interaktif */}
            <div id="kalkulator" className="lg:col-span-6">
              <div className="rounded-2xl bg-[#F0F6FC] p-6 sm:p-8 border border-[#C4DEFD] shadow-lg space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Scale className="text-[#043873]" size={20} />
                    <span className="font-bold text-[#043873] text-sm">
                      Kalkulator Simulasi Risiko Demurrage Pelabuhan
                    </span>
                  </div>
                  <span className="text-[11px] font-mono bg-[#FFE492] text-[#043873] font-bold px-2 py-0.5 rounded">
                    Incoterms® 2020
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                      <span>Jumlah Kontainer</span>
                      <span className="font-mono text-[#043873] font-bold tabular-nums">{containerCount} Kontainer</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={containerCount}
                      onChange={(e) => setContainerCount(Number(e.target.value))}
                      className="w-full accent-[#4F9CF9] cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                      <span>Hari Tertahan (Revisi Dokumen)</span>
                      <span className="font-mono text-[#043873] font-bold tabular-nums">{delayedDays} Hari</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={14}
                      value={delayedDays}
                      onChange={(e) => setDelayedDays(Number(e.target.value))}
                      className="w-full accent-[#4F9CF9] cursor-pointer"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-mono text-rose-600 font-semibold block uppercase">
                      Estimasi Denda Tertahan di POD
                    </span>
                    <div className="text-2xl font-bold font-mono text-[#043873] tracking-tight tabular-nums">
                      USD ${demurrage.totalLossUsd.toLocaleString("en-US")}
                    </div>
                    <span className="text-xs text-slate-500 font-mono tabular-nums">
                      ≈ {formatIdr(demurrage.totalLossIdr)} per kejadian
                    </span>
                  </div>

                  <div className="border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-5 text-left sm:text-right">
                    <span className="text-[11px] text-slate-500 block">Proteksi Otomatisasi EksporFlow</span>
                    <div className="text-base font-bold font-mono text-emerald-600 tabular-nums">
                      Hemat hingga {demurrage.roiMultiple}x Biaya
                    </div>
                    <span className="text-[11px] text-slate-400">100% Bebas Diskrepansi Sebelum Sandar</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================
          4. SECTION: WORK TOGETHER / ORBIT JARINGAN EKSPOR
         ========================================================= */}
      <section id="solusi" className="py-24 bg-[#F8FAFC] border-t border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Kiri: Diagram Jaringan Orbit Ekosistem Ekspor */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="relative w-80 h-80 sm:w-96 sm:h-96 flex items-center justify-center">
                {/* Lingkaran Orbit Terluar */}
                <div
                  className="absolute inset-0 rounded-full border border-dashed border-[#4F9CF9]/40 animate-spin"
                  style={{ animationDuration: "40s" }}
                />
                {/* Lingkaran Orbit Tengah */}
                <div
                  className="absolute inset-8 rounded-full border border-dashed border-[#FFE492]/70 animate-spin"
                  style={{ animationDuration: "25s", animationDirection: "reverse" }}
                />
                {/* Lingkaran Orbit Terdalam */}
                <div className="absolute inset-16 rounded-full border border-slate-200" />

                {/* Hub Tengah EksporFlow */}
                <div className="relative z-10 w-20 h-20 rounded-2xl bg-[#043873] text-white flex flex-col items-center justify-center shadow-xl border-2 border-white">
                  <Ship size={24} className="text-[#FFE492] mb-1" />
                  <span className="text-[10px] font-extrabold tracking-tight">HUB</span>
                </div>

                {/* Node Orbit Mengelilingi */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-[#4F9CF9] text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md">
                  Buyer Luar Negeri
                </div>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-[#10b981] text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md">
                  Pelayaran &amp; B/L
                </div>
                <div className="absolute left-0 top-1/2 -translate-y-1/2 bg-[#f59e0b] text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md">
                  Karantina Pertanian
                </div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-[#ef4444] text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md">
                  Bea Cukai PEB
                </div>
              </div>
            </div>

            {/* Kanan: Copy Kolaborasi */}
            <div className="lg:col-span-6 space-y-6">
              <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-extrabold text-[#212529] tracking-tight leading-[1.2]">
                Kolaborasi Tim &amp;{" "}
                <BrushHighlight color="#FFE492">Mitra Global</BrushHighlight>
              </h2>

              <p className="text-base text-[#4F5D75] leading-relaxed">
                Bagikan status pengapalan langsung ke buyer internasional, koordinasikan stuffing kontainer bersama freight forwarder, dan pantau masa kedaluwarsa izin karantina dalam satu workspace terpadu. Tak ada lagi berkas tercecer di riwayat obrolan pesan instan.
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onStartDemo}
                  className="inline-flex items-center gap-2 bg-[#4F9CF9] hover:bg-[#3d8ceb] text-white font-semibold text-base px-6 py-3.5 rounded-lg shadow-md transition-all group"
                >
                  <span>Coba Kolaborasi Sekarang</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================
          5. SECTION: KUSTOMISASI KOMODITAS (White Background)
         ========================================================= */}
      <section className="py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Kiri: Copy Kustomisasi */}
            <div className="lg:col-span-6 space-y-6">
              <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-extrabold text-[#212529] tracking-tight leading-[1.2]">
                Disesuaikan untuk{" "}
                <BrushHighlight color="#FFE492">Komoditas Anda</BrushHighlight>
              </h2>

              <p className="text-base text-[#4F5D75] leading-relaxed">
                Kustomisasi format kop surat perusahaan, stempel basah digital, tanda tangan resmi, serta parameter susut bobot untuk berbagai komoditas ekspor: kopi arabika, kelapa &amp; arang briket, hasil laut beku, rempah-rempah, hingga furnitur kayu.
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onStartDemo}
                  className="inline-flex items-center gap-2 bg-[#4F9CF9] hover:bg-[#3d8ceb] text-white font-semibold text-base px-6 py-3.5 rounded-lg shadow-md transition-all group"
                >
                  <span>Atur Komoditas Anda</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Kanan: Whitepace Visual Box (#C4DEFD) */}
            <div className="lg:col-span-6">
              <div className="rounded-2xl bg-[#C4DEFD] p-6 sm:p-8 border border-white/60 shadow-xl space-y-4">
                <div className="bg-white rounded-xl p-5 shadow-xs space-y-4 text-slate-800">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="font-bold text-[#043873] text-sm">
                      Kustomisasi Komoditas &amp; Dokumen
                    </span>
                    <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full font-mono">
                      Auto-Calculate
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="font-bold text-[#043873]">Kopi Arabika Gayo</div>
                      <div className="text-slate-500 mt-0.5 font-mono">HS: 0901.11.10 · 20ft FCL</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="font-bold text-[#043873]">Udang Windu Beku</div>
                      <div className="text-slate-500 mt-0.5 font-mono">HS: 0306.17.00 · Reefer 40ft</div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-blue-50/80 rounded-lg border border-blue-200 text-xs text-blue-900 leading-relaxed">
                    <b>Standar Editor Dokumen:</b> Kustomisasi font resmi, margin cetak A4, stempel digital eksportir, dan klausul pembayaran L/C maupun T/T sesuai kesepakatan dengan buyer.
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================
          6. SECTION: PRICING (Whitepace Layout: Free, Growth, Corp)
         ========================================================= */}
      <section id="harga" className="py-24 bg-[#F8FAFC] border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          {/* Header Pricing */}
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-extrabold text-[#212529] tracking-tight leading-[1.2]">
              Pilih <BrushHighlight color="#FFE492">Paket Layanan</BrushHighlight>
            </h2>
            <p className="text-base text-[#4F5D75]">
              Mulai gratis dengan mode demo 3 hari. Pilih paket yang sesuai dengan volume pengiriman kargo dan kebutuhan operasional ekspor Anda.
            </p>

            {/* Toggle Billing Bulanan / Tahunan */}
            <div className="inline-flex p-1 bg-white rounded-lg border border-slate-300 shadow-2xs mt-4">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${
                  billingCycle === "monthly"
                    ? "bg-[#043873] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Bulanan
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("annual")}
                className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${
                  billingCycle === "annual"
                    ? "bg-[#043873] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Tahunan (Hemat 10%)
              </button>
            </div>
          </div>

          {/* 3 Kartu Pricing Whitepace (Tengah Kartu Navy Highlight) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
            
            {/* Card 1: Free Trial / Starter */}
            <div className="rounded-2xl p-8 bg-white border border-[#FFE492] shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-[#212529]">Free Trial Demo</h3>
                  <p className="text-xs text-[#4F5D75] mt-1">Uji coba komprehensif tanpa komitmen kartu kredit</p>
                </div>

                <div className="pb-6 border-b border-slate-100">
                  <div className="text-4xl font-extrabold text-[#212529] font-mono tabular-nums">Rp 0</div>
                  <span className="text-xs text-slate-500 font-medium">Akses penuh 3 hari kerja</span>
                </div>

                <ul className="space-y-3.5 text-xs text-[#4F5D75]">
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-[#4F9CF9] shrink-0" />
                    <span>1 Shipment aktif tersimpan</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-[#4F9CF9] shrink-0" />
                    <span>Cetak 6 dokumen ekspor (PDF &amp; DOCX)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-[#4F9CF9] shrink-0" />
                    <span>Kalkulator kontainer 20ft &amp; 40HC</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-[#4F9CF9] shrink-0" />
                    <span>Simulasi denda demurrage pelabuhan</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <button
                  type="button"
                  onClick={onStartDemo}
                  className="w-full py-3.5 px-4 rounded-lg text-xs font-bold text-[#043873] border border-[#043873] hover:bg-[#043873] hover:text-white transition-all text-center"
                >
                  Coba Demo Gratis
                </button>
              </div>
            </div>

            {/* Card 2: Growth (Paling Populer - Dark Navy Card #043873) */}
            <div className="rounded-2xl p-8 bg-[#043873] text-white shadow-2xl border-2 border-[#4F9CF9] flex flex-col justify-between transform md:-translate-y-3 relative">
              <div className="space-y-6">
                <div>
                  <div className="inline-block bg-[#FFE492] text-[#043873] text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
                    Paling Banyak Digunakan
                  </div>
                  <h3 className="text-xl font-bold text-white">Eksportir Growth</h3>
                  <p className="text-xs text-white/80 mt-1">Solusi rutin untuk eksportir aktif</p>
                </div>

                <div className="pb-6 border-b border-white/15">
                  <div className="text-4xl font-extrabold text-[#FFE492] font-mono tabular-nums">
                    {billingCycle === "annual" ? "Rp 449.000" : "Rp 499.000"}
                  </div>
                  <span className="text-xs text-white/70 font-medium">per bulan</span>
                </div>

                <ul className="space-y-3.5 text-xs text-white/90">
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-[#4F9CF9] shrink-0" />
                    <span><b>Unlimited</b> dokumen ekspor per bulan</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-[#4F9CF9] shrink-0" />
                    <span>Multi-kontainer stuffing simulator 3D</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-[#4F9CF9] shrink-0" />
                    <span>Deteksi lartas HS Code &amp; karantina Barantin</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-[#4F9CF9] shrink-0" />
                    <span>Brankas arsip digital audit Bea Cukai (SHA-256)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-[#4F9CF9] shrink-0" />
                    <span>Pemantauan kepatuhan DHE SDA PP 36/2023</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <button
                  type="button"
                  onClick={onStartDemo}
                  className="w-full py-3.5 px-4 rounded-lg text-xs font-bold bg-[#4F9CF9] hover:bg-[#3d8ceb] text-white shadow-md transition-all text-center"
                >
                  Pilih Paket Growth
                </button>
              </div>
            </div>

            {/* Card 3: Enterprise / Korporasi */}
            <div className="rounded-2xl p-8 bg-white border border-[#FFE492] shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-[#212529]">Korporasi Global</h3>
                  <p className="text-xs text-[#4F5D75] mt-1">Trading house &amp; korporasi multi-cabang</p>
                </div>

                <div className="pb-6 border-b border-slate-100">
                  <div className="text-4xl font-extrabold text-[#212529] font-mono tabular-nums">
                    {billingCycle === "annual" ? "Rp 1.799.000" : "Rp 1.999.000"}
                  </div>
                  <span className="text-xs text-slate-500 font-medium">per bulan</span>
                </div>

                <ul className="space-y-3.5 text-xs text-[#4F5D75]">
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-[#4F9CF9] shrink-0" />
                    <span>Semua fitur paket Growth</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-[#4F9CF9] shrink-0" />
                    <span>Multi-user &amp; akses hak staf divisi tim</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-[#4F9CF9] shrink-0" />
                    <span>Integrasi API CEISA Bea Cukai &amp; INSW</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-[#4F9CF9] shrink-0" />
                    <span>Dedicated Export Compliance Specialist</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <button
                  type="button"
                  onClick={() => onOpenAuth("register")}
                  className="w-full py-3.5 px-4 rounded-lg text-xs font-bold text-[#043873] border border-[#043873] hover:bg-[#043873] hover:text-white transition-all text-center"
                >
                  Hubungi Tim Penjualan
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================
          7. SECTION: YOUR WORK EVERYWHERE (Navy #043873 Style)
         ========================================================= */}
      <section className="relative bg-[#043873] text-white py-24 overflow-hidden text-center border-b border-[#0f4d96]/40">
        <WaveContourBackground />

        <div className="relative max-w-4xl mx-auto px-6 space-y-6">
          <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-extrabold tracking-tight leading-[1.2]">
            Pantau Kargo Ekspor,{" "}
            <BrushHighlight color="#4F9CF9">Di Mana Saja</BrushHighlight>
          </h2>

          <p className="text-base sm:text-lg text-white/80 leading-relaxed max-w-2xl mx-auto">
            Akses seluruh data transaksi, revisi dokumen, dan jadwal kapal langsung dari laptop, tablet, maupun smartphone Anda saat berada di kantor, gudang pengolahan, atau dermaga pelabuhan.
          </p>

          <div className="pt-4">
            <button
              type="button"
              onClick={onStartDemo}
              className="inline-flex items-center gap-2 bg-[#4F9CF9] hover:bg-[#3d8ceb] text-white font-semibold text-base px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all group"
            >
              <span>Buka EksporFlow Sekarang</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================
          8. SECTION: 100% YOUR DATA (White Background)
         ========================================================= */}
      <section className="py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Kiri: Copy Keamanan Data */}
            <div className="lg:col-span-6 space-y-6">
              <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-extrabold text-[#212529] tracking-tight leading-[1.2]">
                100% <BrushHighlight color="#FFE492">Keamanan Data</BrushHighlight> &amp; Kepatuhan
              </h2>

              <p className="text-base text-[#4F5D75] leading-relaxed">
                Seluruh rahasia dagang, daftar buyer luar negeri, dan harga kontrak CIF dilindungi enkripsi kelas perbankan (AES-256) serta isolasi data PostgreSQL Row-Level Security. Dilengkapi audit trail immutable untuk pemenuhan verifikasi Devisa Hasil Ekspor (DHE SDA PP 36/2023).
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onStartDemo}
                  className="inline-flex items-center gap-2 bg-[#4F9CF9] hover:bg-[#3d8ceb] text-white font-semibold text-base px-6 py-3.5 rounded-lg shadow-md transition-all group"
                >
                  <span>Pelajari Keamanan Kami</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Kanan: Diagram Node Keamanan & Enkripsi */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="relative w-80 h-72 sm:w-96 sm:h-80 flex items-center justify-center bg-[#F0F6FC] rounded-2xl border border-[#C4DEFD] p-6 shadow-md">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-[#043873] text-white flex items-center justify-center shadow-lg">
                    <ShieldCheck size={32} className="text-[#FFE492]" />
                  </div>
                  <h4 className="font-bold text-[#043873] text-base">Enkripsi SHA-256 &amp; Row-Level Security</h4>
                  <p className="text-xs text-slate-600 max-w-xs">
                    Setiap dokumen final ditandatangani dengan fingerprint kriptografi unik yang siap diaudit oleh DJBC dan perbankan devisa.
                  </p>
                  <span className="text-[11px] font-mono font-semibold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                    Standar ISO 27001 &amp; PP 36/2023
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================
          9. SECTION: DIDUKUNG & TERHUBUNG REGULASI EKSPOR RI
         ========================================================= */}
      <section className="py-20 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 text-center space-y-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#212529] tracking-tight">
            Didukung &amp; Terhubung dengan{" "}
            <BrushHighlight color="#FFE492">Ekosistem Ekspor</BrushHighlight>
          </h2>

          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-85">
            <div className="flex items-center gap-2.5 font-bold text-slate-700 text-base">
              <Building2 size={18} className="text-[#043873]" />
              INSW (Indonesia Single Window)
            </div>
            <div className="flex items-center gap-2.5 font-bold text-slate-700 text-base">
              <ShieldCheck size={18} className="text-[#043873]" />
              Bea Cukai DJBC RI (CEISA 4.0)
            </div>
            <div className="flex items-center gap-2.5 font-bold text-slate-700 text-base">
              <FileCheck2 size={18} className="text-[#043873]" />
              Kementerian Perdagangan (e-SKA)
            </div>
            <div className="flex items-center gap-2.5 font-bold text-slate-700 text-base">
              <Ship size={18} className="text-[#043873]" />
              Pelindo (Terminal Petikemas)
            </div>
            <div className="flex items-center gap-2.5 font-bold text-slate-700 text-base">
              <CreditCard size={18} className="text-[#043873]" />
              Bank Devisa DHE SDA
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          10. SECTION: APPS INTEGRATION (Navy #043873)
         ========================================================= */}
      <section className="relative bg-[#043873] text-white py-24 overflow-hidden border-t border-b border-[#0f4d96]/40">
        <WaveContourBackground />

        <div className="relative max-w-7xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Kiri: Diagram Integrasi Apps */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="relative w-80 h-80 sm:w-96 sm:h-96 flex items-center justify-center">
                <div
                  className="absolute inset-4 rounded-full border border-dashed border-white/20 animate-spin"
                  style={{ animationDuration: "35s" }}
                />
                
                {/* Logo Tengah */}
                <div className="w-20 h-20 rounded-2xl bg-[#4F9CF9] text-white flex items-center justify-center shadow-2xl border-2 border-white">
                  <Database size={28} className="text-[#FFE492]" />
                </div>

                {/* App Nodes */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white text-[#043873] text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5">
                  <span>CEISA 4.0</span>
                </div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white text-[#043873] text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5">
                  <span>Notifikasi Ekspor</span>
                </div>
                <div className="absolute left-2 top-1/2 -translate-y-1/2 bg-white text-[#043873] text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5">
                  <span>Excel / CSV</span>
                </div>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-white text-[#043873] text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5">
                  <span>ERP SAP / Odoo</span>
                </div>
              </div>
            </div>

            {/* Kanan: Copy Integrasi */}
            <div className="lg:col-span-6 space-y-6">
              <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-extrabold tracking-tight leading-[1.2]">
                Bekerja dengan Aplikasi Pilihan Anda Lewat{" "}
                <BrushHighlight color="#FFE492">EksporFlow</BrushHighlight>
              </h2>

              <p className="text-base text-white/80 leading-relaxed">
                Sinkronkan draf dokumen langsung ke format pelaporan CEISA Bea Cukai, pantau deadline closing PEB, dan ekspor rekapitulasi realisasi pengapalan ke spreadsheet akuntansi Anda.
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onStartDemo}
                  className="inline-flex items-center gap-2 bg-[#4F9CF9] hover:bg-[#3d8ceb] text-white font-semibold text-base px-6 py-3.5 rounded-lg shadow-md transition-all group"
                >
                  <span>Lihat Seluruh Integrasi</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================
          11. SECTION: TESTIMONIALS (3 Cards: 1 Putih + 2 Biru)
         ========================================================= */}
      <section className="py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-14">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-extrabold text-[#212529] tracking-tight leading-[1.2]">
              Kata Para <BrushHighlight color="#FFE492">Eksportir Sukses</BrushHighlight>
            </h2>
            <p className="text-base text-[#4F5D75]">
              Dengarkan pengalaman eksportir Indonesia yang telah mengotomatisasi dokumen dan mengamankan kontainernya dari denda pelabuhan.
            </p>
          </div>

          {/* Grid 3 Testimonial Cards Khas Desain Figma Whitepace (1 Putih + 2 Biru) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {testimonials.map((item) => (
              <div
                key={item.id}
                className={`rounded-2xl p-8 flex flex-col justify-between transition-all shadow-md ${
                  item.highlight
                    ? "bg-[#4F9CF9] text-white"
                    : "bg-white text-[#212529] border border-slate-200"
                }`}
              >
                <div className="space-y-4">
                  {/* Bintang Rating */}
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={
                          item.highlight
                            ? "fill-[#FFE492] text-[#FFE492]"
                            : "fill-[#F59E0B] text-[#F59E0B]"
                        }
                      />
                    ))}
                  </div>

                  <p
                    className={`text-sm leading-relaxed ${
                      item.highlight ? "text-white/95" : "text-[#4F5D75]"
                    }`}
                  >
                    "{item.quote}"
                  </p>
                </div>

                <div className="flex items-center gap-3.5 pt-6 mt-6 border-t border-black/10">
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm ${
                      item.highlight ? "bg-white text-[#043873]" : "bg-[#043873] text-white"
                    }`}
                  >
                    {item.avatar}
                  </div>
                  <div>
                    <div className="font-bold text-sm">{item.author}</div>
                    <div
                      className={`text-xs ${
                        item.highlight ? "text-white/80" : "text-slate-500"
                      }`}
                    >
                      {item.role} · {item.company}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          12. FOOTER (Figma Whitepace Deep Navy #043873)
         ========================================================= */}
      <footer className="bg-[#043873] text-white pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
            {/* Kolom 1: Logo & Deskripsi */}
            <div className="md:col-span-4 space-y-4">
              <EksporFlowLogo light />
              <p className="text-xs text-white/75 leading-relaxed max-w-sm mt-3">
                Sistem Operasional Ekspor Terstandarisasi untuk Eksportir &amp; UMKM Indonesia. Mencegah denda demurrage, otomatisasi dokumen resmi berstandar UN/CEFACT (COO, B/L, PEB), dan menjamin kepatuhan devisa PP 36/2023.
              </p>
            </div>

            {/* Kolom 2: Produk & Fitur */}
            <div className="md:col-span-2 space-y-3">
              <h4 className="text-xs font-bold text-[#FFE492] tracking-wider uppercase">Produk</h4>
              <ul className="space-y-2 text-xs text-white/80">
                <li><a href="#dokumen" className="hover:text-white transition-colors">Dokumen Multi-Item</a></li>
                <li><a href="#kalkulator" className="hover:text-white transition-colors">Simulasi Demurrage</a></li>
                <li><a href="#solusi" className="hover:text-white transition-colors">Kepatuhan HS Code</a></li>
                <li><a href="#solusi" className="hover:text-white transition-colors">Kalkulator Kontainer</a></li>
              </ul>
            </div>

            {/* Kolom 3: Regulasi */}
            <div className="md:col-span-2 space-y-3">
              <h4 className="text-xs font-bold text-[#FFE492] tracking-wider uppercase">Regulasi</h4>
              <ul className="space-y-2 text-xs text-white/80">
                <li><span className="hover:text-white transition-colors cursor-pointer">Incoterms® 2020 ICC</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">BTKI HS Code DJBC</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">Format COO e-SKA Kemendag</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">Devisa DHE SDA PP 36/2023</span></li>
              </ul>
            </div>

            {/* Kolom 4: Box Coba EksporFlow */}
            <div className="md:col-span-4 space-y-4 bg-white/5 p-6 rounded-2xl border border-white/10">
              <h4 className="text-sm font-bold text-white">Mulai Lindungi Kargo Anda Hari Ini</h4>
              <p className="text-xs text-white/75 leading-relaxed">
                Nikmati akses gratis 3 hari penuh untuk mencoba seluruh modul dan menerbitkan draf dokumen ekspor pertama Anda.
              </p>
              <button
                type="button"
                onClick={onStartDemo}
                className="w-full bg-[#4F9CF9] hover:bg-[#3d8ceb] text-white text-xs font-bold py-3 px-4 rounded-lg transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <span>Coba EksporFlow Gratis</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Bottom Bar: Copyright & Legal */}
          <div className="pt-8 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/60">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1.5 text-white/80">
                <Globe size={14} />
                <span>Bahasa Indonesia (ID)</span>
              </div>
              <span className="hover:text-white cursor-pointer transition-colors">Privasi &amp; Keamanan</span>
              <span className="hover:text-white cursor-pointer transition-colors">Syarat Layanan</span>
            </div>

            <div>
              © 2026 EksporFlow · Platform SaaS Operasional &amp; Anti-Demurrage Ekspor Indonesia.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
