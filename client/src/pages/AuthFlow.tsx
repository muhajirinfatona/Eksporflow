import { trpc } from "@/lib/trpc";
import { AnimatePresence, motion } from "framer-motion";
import {
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  RefreshCw,
  UserRound,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type AuthStep = "login" | "register" | "verify";

const HAS_LOGGED_IN_STORAGE_KEY = "eksporflow:has_logged_in";

function readHasLoggedInBefore(): boolean {
  try {
    if (window.localStorage.getItem(HAS_LOGGED_IN_STORAGE_KEY) === "1") {
      return true;
    }
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (
        key &&
        (key.startsWith("eksporflow:shipment:v2-u") ||
          key.startsWith("eksporflow:workspace-flow:v2-u"))
      ) {
        return true;
      }
    }
  } catch {
    // Abaikan
  }
  return false;
}

function markHasLoggedInBefore(): void {
  try {
    window.localStorage.setItem(HAS_LOGGED_IN_STORAGE_KEY, "1");
  } catch {
    // Abaikan
  }
}

function readInitialAuthStep(): AuthStep {
  try {
    const raw = new URLSearchParams(window.location.search).get("auth");
    if (raw === "register" || raw === "verify" || raw === "login") return raw;
  } catch {
    // Abaikan
  }
  return "login";
}

const SLIDE_INTERVAL_MS = 5200;

const SLIDES = [
  {
    id: "global-vessel",
    titleNew: "Selamat Datang!",
    titleReturning: "Selamat Datang Kembali!",
    subtitle:
      "Jangkau pasar dunia lebih pasti. Pantau kesiapan kargo, jadwal keberangkatan kapal, hingga pengiriman ke pelabuhan tujuan dalam satu kendali yang rapi.",
  },
  {
    id: "smart-docs",
    title: "Hitung Harga & Dokumen Sekejap",
    subtitle:
      "Susun penawaran harga ekspor yang kompetitif dan terbitkan dokumen perdagangan secara konsisten tanpa input berulang.",
  },
  {
    id: "container-shield",
    title: "Muatan Optimal, Transaksi Aman",
    subtitle:
      "Maksimalkan ruang kontainer secara presisi serta jaga keamanan setiap tahap pembayaran dan kepatuhan ekspor Anda.",
  },
] as const;

const SLIDE_VARIANTS = {
  enter: (direction: number) => ({
    x: direction >= 0 ? 44 : -44,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction >= 0 ? -44 : 44,
    opacity: 0,
  }),
};

/**
 * Latar belakang animasi bertema ekspor maritim & jaringan perdagangan global
 * yang mengelilingi kartu login tanpa mengganggu keterbacaan form.
 */
/**
 * Latar belakang Flat Design Kartun: Pelabuhan Kontainer Internasional,
 * Aktifitas Muat Barang Dermaga (STS Crane & Truk), dan Riak Air Ombak Mengalir.
 */
function ExportWorldBackdrop() {
  return (
    <div className="auth-export-scene" aria-hidden="true">
      <svg
        className="auth-flat-seaport-svg"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Langit Pesisir Segar */}
          <linearGradient id="flatSkyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#bae6fd" />
            <stop offset="55%" stopColor="#e0f2fe" />
            <stop offset="100%" stopColor="#f0f9ff" />
          </linearGradient>

          {/* Air Laut Bersih Bergradasi Flat */}
          <linearGradient id="flatOceanGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e588a" />
            <stop offset="30%" stopColor="#154773" />
            <stop offset="70%" stopColor="#0f3659" />
            <stop offset="100%" stopColor="#0a2640" />
          </linearGradient>

          {/* Dermaga Beton Pelabuhan */}
          <linearGradient id="flatQuaySurface" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="85%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          {/* Sorot Lampu Mercusuar Emas */}
          <linearGradient id="flatBeaconBeam" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fde047" stopOpacity="0.85" />
            <stop offset="60%" stopColor="#fef08a" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* Corak Garis Pengaman Bahaya Kuning-Hitam di Pinggir Dermaga */}
          <pattern id="quayHazardStripe" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="12" height="24" fill="#f59e0b" />
            <rect x="12" width="12" height="24" fill="#0f172a" />
          </pattern>
        </defs>

        {/* 1. Langit & Matahari Pagi Pesisir */}
        <rect x="0" y="0" width="1920" height="460" fill="url(#flatSkyGrad)" />

        {/* Matahari Hangat */}
        <circle cx="1520" cy="150" r="50" fill="#fde68a" fillOpacity="0.8" />
        <circle cx="1520" cy="150" r="68" fill="#fef08a" fillOpacity="0.25" />

        {/* Awan-Awan Datar yang Melayang Tenang */}
        <g className="auth-flat-cloud-a">
          <g transform="translate(180 80)" fill="#ffffff" fillOpacity="0.82">
            <rect x="0" y="20" width="140" height="34" rx="17" />
            <circle cx="45" cy="20" r="28" />
            <circle cx="85" cy="14" r="32" />
          </g>
          <g transform="translate(1120 60)" fill="#ffffff" fillOpacity="0.75">
            <rect x="0" y="16" width="160" height="30" rx="15" />
            <circle cx="50" cy="16" r="24" />
            <circle cx="95" cy="10" r="28" />
          </g>
        </g>

        <g className="auth-flat-cloud-b">
          <g transform="translate(680 110)" fill="#ffffff" fillOpacity="0.65">
            <rect x="0" y="14" width="120" height="26" rx="13" />
            <circle cx="40" cy="14" r="20" />
            <circle cx="75" cy="8" r="24" />
          </g>
          <g transform="translate(1620 95)" fill="#ffffff" fillOpacity="0.78">
            <rect x="0" y="18" width="150" height="32" rx="16" />
            <circle cx="48" cy="18" r="26" />
            <circle cx="92" cy="12" r="30" />
          </g>
        </g>

        {/* Jalur Udara & Pesawat Kargo Ekspor di Langit Atas */}
        <path d="M120 180 C 600 40, 1300 40, 1820 170" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="2" strokeDasharray="8 8" />
        <g className="auth-cargo-plane-flight">
          <g transform="translate(80 120)">
            <line x1="-54" y1="0" x2="-10" y2="0" stroke="#ffffff" strokeWidth="2.5" strokeOpacity="0.6" strokeLinecap="round" />
            <path d="M-10 0 L14 0 L20 -3 L24 0 L20 3 L14 2 L-2 12 L-7 12 L-2 2 L-12 2 L-16 7 L-19 7 L-16 0 L-19 -7 L-16 -7 L-12 -2 L-2 -2 L-7 -12 L-2 -12 L14 -2 Z" fill="#ffffff" />
            <circle cx="10" cy="0" r="2" fill="#f59e0b" />
          </g>
        </g>

        {/* Garis Bukit/Pantai di Kejauhan Horizon */}
        <path d="M0 455 Q 320 415, 640 445 T 1280 440 T 1920 445 L 1920 460 L 0 460 Z" fill="#7fa6c8" fillOpacity="0.65" />
        {/* Kincir Angin Pesisir Ramah Lingkungan */}
        <g transform="translate(760 415)" stroke="#64748b" strokeWidth="1.5">
          <line x1="0" y1="0" x2="0" y2="35" />
          <line x1="0" y1="0" x2="9" y2="-12" />
          <line x1="0" y1="0" x2="-14" y2="-4" />
          <line x1="0" y1="0" x2="5" y2="14" />
        </g>
        <g transform="translate(880 412)" stroke="#64748b" strokeWidth="1.5">
          <line x1="0" y1="0" x2="0" y2="38" />
          <line x1="0" y1="0" x2="10" y2="-13" />
          <line x1="0" y1="0" x2="-15" y2="-4" />
          <line x1="0" y1="0" x2="5" y2="15" />
        </g>

        {/* 2. Air Laut Kartun / Flat Design (Lapisan Bergerak) */}
        <rect x="0" y="450" width="1920" height="630" fill="url(#flatOceanGrad)" />

        {/* Lapisan Ombak Horizon #1 */}
        <g className="auth-wave-roll-a">
          <path
            d="M-240 480 Q -180 472, -120 480 T 0 480 T 120 480 T 240 480 T 360 480 T 480 480 T 600 480 T 720 480 T 840 480 T 960 480 T 1080 480 T 1200 480 T 1320 480 T 1440 480 T 1560 480 T 1680 480 T 1800 480 T 1920 480 T 2040 480 T 2160 480 L 2160 1080 L -240 1080 Z"
            fill="#1c4f7c"
            fillOpacity="0.55"
          />
        </g>

        {/* Lapisan Ombak Tengah #2 */}
        <g className="auth-wave-roll-b">
          <path
            d="M-200 620 Q -130 605, -60 620 T 80 620 T 220 620 T 360 620 T 500 620 T 640 620 T 780 620 T 920 620 T 1060 620 T 1200 620 T 1340 620 T 1480 620 T 1620 620 T 1760 620 T 1900 620 T 2040 620 T 2180 620 L 2180 1080 L -200 1080 Z"
            fill="#16436a"
            fillOpacity="0.6"
          />
        </g>

        {/* Lapisan Ombak Depan #3 (Lekukan Ombak Ikonik Kartun dengan Buih Cyan/Mint) */}
        <g className="auth-wave-roll-c">
          <path
            d="M-240 820 C -180 805, -140 835, -80 820 C -20 805, 20 835, 80 820 C 140 805, 180 835, 240 820 C 300 805, 340 835, 400 820 C 460 805, 500 835, 560 820 C 620 805, 660 835, 720 820 C 780 805, 820 835, 880 820 C 940 805, 980 835, 1040 820 C 1100 805, 1140 835, 1200 820 C 1260 805, 1300 835, 1360 820 C 1420 805, 1460 835, 1520 820 C 1580 805, 1620 835, 1680 820 C 1740 805, 1780 835, 1840 820 C 1900 805, 1940 835, 2000 820 C 2060 805, 2100 835, 2160 820 L 2160 1080 L -240 1080 Z"
            fill="#103657"
            fillOpacity="0.72"
          />
          <path
            d="M-240 820 C -180 805, -140 835, -80 820 C -20 805, 20 835, 80 820 C 140 805, 180 835, 240 820 C 300 805, 340 835, 400 820 C 460 805, 500 835, 560 820 C 620 805, 660 835, 720 820 C 780 805, 820 835, 880 820 C 940 805, 980 835, 1040 820 C 1100 805, 1140 835, 1200 820 C 1260 805, 1300 835, 1360 820 C 1420 805, 1460 835, 1520 820 C 1580 805, 1620 835, 1680 820 C 1740 805, 1780 835, 1840 820 C 1900 805, 1940 835, 2000 820"
            stroke="#67e8f9"
            strokeWidth="3.5"
            strokeOpacity="0.75"
            strokeLinecap="round"
          />
        </g>

        {/* Aksen Riak-Riak Air Flat Berdenyut */}
        <g className="auth-flat-ripple" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" fill="none">
          <path d="M620 720 Q 640 714, 660 720 T 700 720" />
          <path d="M880 860 Q 900 854, 920 860 T 960 860" />
          <path d="M1120 760 Q 1140 754, 1160 760 T 1200 760" />
          <path d="M1480 890 Q 1500 884, 1520 890 T 1560 890" />
          <path d="M480 940 Q 500 934, 520 940 T 560 940" />
        </g>

        {/* 3. Sisi Kanan: Dermaga Pemecah Gelombang, Mercusuar & Kapal Channel */}
        <polygon points="1620,530 1920,490 1920,620 1600,650" fill="#334155" />
        <polygon points="1620,530 1920,490 1920,510 1610,545" fill="#475569" />

        {/* Mercusuar Pesisir Klasik Bergaris Merah-Putih */}
        <g transform="translate(1690 350)">
          <rect x="-14" y="140" width="48" height="18" rx="3" fill="#1e293b" />
          <polygon points="0,30 20,30 28,140 -8,140" fill="#f8fafc" />
          <polygon points="2,60 18,60 21,88 -1,88" fill="#ef4444" />
          <polygon points="-4,114 24,114 27,136 -7,136" fill="#ef4444" />
          <rect x="-6" y="24" width="32" height="6" rx="2" fill="#0f172a" />
          <rect x="-2" y="8" width="24" height="16" rx="2" fill="#fef08a" stroke="#0f172a" strokeWidth="2" />
          <path d="M-4 8 Q 10 -4, 24 8 Z" fill="#ef4444" />
          <circle cx="10" cy="16" r="4" fill="#ffffff" />
          <polygon className="auth-lighthouse-beam" points="10,16 520,-90 620,180" fill="url(#flatBeaconBeam)" />
        </g>

        {/* Kapal Kargo Sekunder di Jalur Laut Kanan */}
        <g className="auth-flat-ship-bob" transform="translate(1420 520)">
          <path d="M0 48 L220 48 L195 85 L25 85 Z" fill="#0f2942" stroke="#1e4976" strokeWidth="2" />
          <path d="M12 72 L205 72" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
          <rect x="30" y="28" width="34" height="20" rx="2" fill="#f59e0b" stroke="#0b192c" strokeWidth="1.5" />
          <rect x="68" y="28" width="34" height="20" rx="2" fill="#10b981" stroke="#0b192c" strokeWidth="1.5" />
          <rect x="106" y="28" width="34" height="20" rx="2" fill="#1e4976" stroke="#0b192c" strokeWidth="1.5" />
          <rect x="50" y="8" width="34" height="20" rx="2" fill="#3b82f6" stroke="#0b192c" strokeWidth="1.5" />
          <rect x="88" y="8" width="34" height="20" rx="2" fill="#f59e0b" stroke="#0b192c" strokeWidth="1.5" />
          <rect x="148" y="10" width="32" height="38" rx="3" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
          <rect x="154" y="18" width="20" height="7" rx="1.5" fill="#0284c7" />
          <rect x="156" y="2" width="10" height="8" rx="1" fill="#f59e0b" />
          <path d="M190 85 Q 230 82, 245 92" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" fill="none" />
        </g>

        {/* Kapal Tunda Pelabuhan (Tugboat) Beroperasi Aktif */}
        <g className="auth-flat-tug-bob" transform="translate(1320 730)">
          <path d="M-30 48 Q 40 40, 140 48" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.8" />
          <path d="M10 24 L100 24 Q 125 32, 118 46 L20 46 Q 5 44, 10 24 Z" fill="#1e3a5f" stroke="#0b192c" strokeWidth="2" />
          <path d="M12 36 L112 36" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
          <rect x="104" y="26" width="16" height="14" rx="4" fill="#0f172a" />
          <rect x="36" y="6" width="46" height="18" rx="3" fill="#ffffff" stroke="#0b192c" strokeWidth="2" />
          <rect x="32" y="2" width="54" height="5" rx="2" fill="#f97316" />
          <rect x="44" y="10" width="14" height="6" rx="1.5" fill="#38bdf8" />
          <rect x="62" y="10" width="14" height="6" rx="1.5" fill="#38bdf8" />
          <rect x="48" y="-7" width="8" height="10" rx="1" fill="#0f172a" />
          <line x1="74" y1="2" x2="74" y2="-12" stroke="#64748b" strokeWidth="2" />
          <circle cx="74" cy="-12" r="2" fill="#ef4444" />
        </g>

        {/* Pelampung Navigasi Saluran Laut (Buoy) dengan Lampu Hijau Berkedip */}
        <g transform="translate(1220 870)">
          <ellipse cx="0" cy="18" rx="22" ry="7" fill="#082f49" opacity="0.5" />
          <path d="M-14 16 L14 16 L10 2 Q 0 -12, -10 2 Z" fill="#10b981" stroke="#047857" strokeWidth="2" />
          <rect x="-4" y="-18" width="8" height="12" fill="#0f172a" />
          <circle className="auth-beacon-pulse" cx="0" cy="-22" r="6" fill="#34d399" />
          <circle cx="0" cy="-22" r="3" fill="#ffffff" />
        </g>

        {/* 4. Sisi Kiri: Dermaga Terminal Kontainer Ekspor & Kapal Bersandar */}
        {/* Badan Kapal Kontainer Utama yang Bersandar di Dermaga */}
        <g className="auth-flat-ship-bob" transform="translate(340 485)">
          <path d="M0 48 L380 48 L340 105 L0 105 Z" fill="#0b192c" stroke="#163a5c" strokeWidth="2" />
          <path d="M0 72 L362 72" stroke="#f59e0b" strokeWidth="4.5" />
          <path d="M0 96 L348 96" stroke="#991b1b" strokeWidth="7" />
          <line x1="335" y1="76" x2="335" y2="92" stroke="#ffffff" strokeWidth="2" opacity="0.6" strokeDasharray="2 3" />

          {/* Muatan Kontainer di Atas Kapal */}
          <rect x="30" y="24" width="48" height="24" rx="2" fill="#1e4976" stroke="#071321" strokeWidth="1.8" />
          <rect x="82" y="24" width="48" height="24" rx="2" fill="#f59e0b" stroke="#071321" strokeWidth="1.8" />
          <rect x="134" y="24" width="48" height="24" rx="2" fill="#10b981" stroke="#071321" strokeWidth="1.8" />
          <rect x="186" y="24" width="48" height="24" rx="2" fill="#3b82f6" stroke="#071321" strokeWidth="1.8" />
          <rect x="238" y="24" width="48" height="24" rx="2" fill="#f8fafc" stroke="#071321" strokeWidth="1.8" />

          <rect x="30" y="0" width="48" height="24" rx="2" fill="#10b981" stroke="#071321" strokeWidth="1.8" />
          <rect x="82" y="0" width="48" height="24" rx="2" fill="#3b82f6" stroke="#071321" strokeWidth="1.8" />
          <rect x="134" y="0" width="48" height="24" rx="2" fill="#f59e0b" stroke="#071321" strokeWidth="1.8" />
          <rect x="186" y="0" width="48" height="24" rx="2" fill="#1e4976" stroke="#071321" strokeWidth="1.8" />

          <rect x="82" y="-24" width="48" height="24" rx="2" fill="#10b981" stroke="#071321" strokeWidth="1.8" />
          <rect x="134" y="-24" width="48" height="24" rx="2" fill="#f8fafc" stroke="#071321" strokeWidth="1.8" />

          {/* Anjungan & Radar Kapal Utama */}
          <rect x="296" y="-12" width="42" height="60" rx="4" fill="#ffffff" stroke="#071321" strokeWidth="2" />
          <rect x="304" y="-2" width="26" height="9" rx="2" fill="#0f2942" />
          <rect x="308" y="-22" width="14" height="12" rx="2" fill="#f59e0b" stroke="#071321" strokeWidth="1.8" />
          <line x1="315" y1="-22" x2="315" y2="-34" stroke="#475569" strokeWidth="2" />
          <ellipse cx="315" cy="-34" rx="7" ry="2.5" fill="#38bdf8" />

          {/* Buih & Percikan Air Lambung */}
          <path d="M0 105 Q 180 98, 345 105" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.85" />
          <path d="M12 112 Q 170 106, 320 112" stroke="#67e8f9" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.6" />
        </g>

        {/* Konstruksi Dermaga Pelabuhan (Quay / Wharf) */}
        <polygon points="0,480 370,520 320,1080 0,1080" fill="url(#flatQuaySurface)" />
        <polygon points="356,518 370,520 320,1080 306,1078" fill="url(#quayHazardStripe)" stroke="#0f172a" strokeWidth="1" />
        <line x1="160" y1="498" x2="110" y2="1080" stroke="#64748b" strokeWidth="3" strokeDasharray="16 10" />
        <line x1="340" y1="516" x2="290" y2="1080" stroke="#64748b" strokeWidth="3" strokeDasharray="16 10" />

        {/* Bollard Dermaga (Pancang Tali Kapal) */}
        <g fill="#0f172a" stroke="#475569" strokeWidth="1.5">
          <ellipse cx="350" cy="560" rx="7" ry="4" />
          <ellipse cx="334" cy="700" rx="8" ry="4.5" />
          <ellipse cx="316" cy="850" rx="9" ry="5" />
          <ellipse cx="298" cy="990" rx="10" ry="5.5" />
        </g>
        <line x1="350" y1="560" x2="420" y2="535" stroke="#f8fafc" strokeWidth="2" strokeDasharray="6 3" />
        <line x1="334" y1="700" x2="480" y2="585" stroke="#f8fafc" strokeWidth="2" strokeDasharray="6 3" />

        {/* Tumpukan Kontainer Ekspor di Dermaga */}
        <g transform="translate(40 560)">
          <rect x="0" y="44" width="76" height="30" rx="3" fill="#1e4976" stroke="#0f172a" strokeWidth="2" />
          <rect x="84" y="44" width="76" height="30" rx="3" fill="#f59e0b" stroke="#0f172a" strokeWidth="2" />
          <rect x="12" y="14" width="76" height="30" rx="3" fill="#10b981" stroke="#0f172a" strokeWidth="2" />
          <rect x="96" y="14" width="76" height="30" rx="3" fill="#3b82f6" stroke="#0f172a" strokeWidth="2" />
          <rect x="44" y="-16" width="76" height="30" rx="3" fill="#f59e0b" stroke="#0f172a" strokeWidth="2" />
          <line x1="28" y1="-10" x2="28" y2="8" stroke="#0f172a" strokeWidth="1.5" opacity="0.3" />
          <line x1="60" y1="-10" x2="60" y2="8" stroke="#0f172a" strokeWidth="1.5" opacity="0.3" />
          <line x1="92" y1="-10" x2="92" y2="8" stroke="#0f172a" strokeWidth="1.5" opacity="0.3" />
        </g>

        {/* Truk Pengangkut Kontainer (Terminal Truck) Melintas Aktif di Dermaga */}
        <g className="auth-quay-truck" transform="translate(60 880)">
          <circle cx="20" cy="38" r="9" fill="#0f172a" stroke="#475569" strokeWidth="2" />
          <circle cx="38" cy="38" r="9" fill="#0f172a" stroke="#475569" strokeWidth="2" />
          <circle cx="110" cy="38" r="9" fill="#0f172a" stroke="#475569" strokeWidth="2" />
          <circle cx="128" cy="38" r="9" fill="#0f172a" stroke="#475569" strokeWidth="2" />
          <rect x="10" y="24" width="130" height="8" rx="2" fill="#334155" />
          <path d="M116 28 L148 28 L148 10 L136 0 L116 0 Z" fill="#f59e0b" stroke="#0f172a" strokeWidth="2" />
          <polygon points="122,4 134,4 144,12 122,12" fill="#38bdf8" />
          <circle cx="146" cy="18" r="3" fill="#ffffff" />
          <rect x="14" y="-4" width="96" height="28" rx="3" fill="#10b981" stroke="#0f172a" strokeWidth="2" />
          <line x1="42" y1="-1" x2="42" y2="21" stroke="#065f46" strokeWidth="2" />
          <line x1="70" y1="-1" x2="70" y2="21" stroke="#065f46" strokeWidth="2" />
          <rect x="22" y="2" width="14" height="6" rx="1.5" fill="#f8fafc" opacity="0.75" />
        </g>

        {/* DEREK RAKSASA PELABUHAN (STS Quay Gantry Crane) DENGAN ANIMASI AKTIF MUAT BARANG */}
        <g stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <line x1="170" y1="210" x2="135" y2="520" />
          <line x1="210" y1="210" x2="175" y2="520" />
          <line x1="290" y1="210" x2="330" y2="535" />
          <line x1="330" y1="210" x2="370" y2="535" />
          <line x1="150" y1="360" x2="195" y2="360" stroke="#0f172a" strokeWidth="3" />
          <line x1="310" y1="370" x2="350" y2="370" stroke="#0f172a" strokeWidth="3" />
          <line x1="165" y1="260" x2="140" y2="440" stroke="#0f172a" strokeWidth="2.5" />
          <line x1="300" y1="260" x2="360" y2="450" stroke="#0f172a" strokeWidth="2.5" />
        </g>

        {/* Menara Puncak Derek & Kabel Penyangga */}
        <polygon points="210,210 250,90 290,210" fill="#0f172a" stroke="#f59e0b" strokeWidth="3" />
        <circle cx="250" cy="90" r="5" fill="#f59e0b" />
        <line x1="250" y1="90" x2="110" y2="210" stroke="#94a3b8" strokeWidth="2.5" strokeDasharray="6 4" />
        <line x1="250" y1="90" x2="560" y2="210" stroke="#94a3b8" strokeWidth="2.5" strokeDasharray="6 4" />
        <circle className="auth-beacon-pulse" cx="250" cy="82" r="5" fill="#ef4444" />

        {/* Lengan Derek Horizontal (Cantilever Boom) Melintang ke Atas Kapal */}
        <rect x="90" y="206" width="490" height="14" rx="2" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
        <path d="M100 206 L140 186 L180 206 L220 186 L260 206 L300 186 L340 206 L380 186 L420 206 L460 186 L500 206 L540 186 L570 206" stroke="#f59e0b" strokeWidth="2" fill="none" />
        <line x1="140" y1="186" x2="540" y2="186" stroke="#f59e0b" strokeWidth="2" />

        {/* Rumah Mesin Derek & Kabin Operator */}
        <rect x="180" y="220" width="44" height="26" rx="3" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
        <rect x="186" y="226" width="16" height="10" rx="2" fill="#38bdf8" />
        <rect x="180" y="246" width="18" height="6" fill="#f59e0b" />

        {/* TROLLEY PEMUAT BARANG AKTIF BERGERAK (Cargo Loading Trolley) */}
        <g className="auth-crane-trolley-active" transform="translate(230 216)">
          <rect x="-14" y="0" width="28" height="10" rx="2" fill="#f59e0b" stroke="#0f172a" strokeWidth="2" />
          <circle cx="0" cy="-4" r="3" fill="#ef4444" className="auth-beacon-pulse" />

          {/* KABEL KATROL & KOTAK KONTAINER YANG DITURUNKAN KE KAPAL */}
          <g className="auth-crane-hoist-box">
            <line x1="-8" y1="10" x2="-8" y2="70" stroke="#0f172a" strokeWidth="1.8" />
            <line x1="8" y1="10" x2="8" y2="70" stroke="#0f172a" strokeWidth="1.8" />
            <rect x="-24" y="68" width="48" height="6" rx="1.5" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" />
            <g transform="translate(-24 74)">
              <rect x="0" y="0" width="48" height="24" rx="2" fill="#f59e0b" stroke="#0f172a" strokeWidth="2" />
              <line x1="12" y1="2" x2="12" y2="22" stroke="#d97706" strokeWidth="1.6" />
              <line x1="24" y1="2" x2="24" y2="22" stroke="#d97706" strokeWidth="1.6" />
              <line x1="36" y1="2" x2="36" y2="22" stroke="#d97706" strokeWidth="1.6" />
              <rect x="4" y="3" width="8" height="5" rx="1" fill="#ffffff" opacity="0.8" />
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}

/**
 * Ilustrasi Slide 1: Kapal Kontainer Internasional & Radar Rute Ekspor
 */
function SlideGlobalVesselIllustration() {
  return (
    <svg
      className="auth-split-svg"
      viewBox="0 0 300 230"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Bentuk kapsul latar khas */}
      <rect x="44" y="62" width="182" height="22" rx="11" fill="#1b4368" opacity="0.62" />
      <rect x="30" y="98" width="234" height="26" rx="13" fill="#1b4368" opacity="0.52" />
      <rect x="64" y="138" width="174" height="22" rx="11" fill="#1b4368" opacity="0.62" />

      {/* Lingkaran Globe & Garis Rute di Belakang Kapal */}
      <circle cx="152" cy="104" r="64" fill="#133353" stroke="#2c5b88" strokeWidth="1.6" />
      <ellipse cx="152" cy="104" rx="34" ry="64" stroke="#2c5b88" strokeWidth="1.3" strokeDasharray="4 4" />
      <line x1="88" y1="104" x2="216" y2="104" stroke="#2c5b88" strokeWidth="1.3" strokeDasharray="4 4" />
      <path
        d="M92 84 C 126 52, 184 52, 214 82"
        stroke="#f59e0b"
        strokeWidth="2.2"
        strokeDasharray="5 5"
        strokeLinecap="round"
      />
      <circle cx="92" cy="84" r="4" fill="#34d399" />
      <circle cx="214" cy="82" r="4.5" fill="#f59e0b" />

      {/* Badge Pin Pelabuhan Tujuan */}
      <g transform="translate(194 34)">
        <rect x="0" y="0" width="66" height="24" rx="12" fill="#0b192c" stroke="#f59e0b" strokeWidth="1.6" />
        <circle cx="13" cy="12" r="4" fill="#34d399" />
        <rect x="23" y="9" width="32" height="6" rx="3" fill="#f8fafc" />
      </g>

      {/* Sparkle aksen */}
      <path d="M72 44V52M68 48H76" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
      <circle cx="246" cy="132" r="3.5" fill="#34d399" />
      <circle cx="56" cy="132" r="3" fill="#f8fafc" opacity="0.8" />

      {/* Kapal Kontainer Utama */}
      <g transform="translate(46 92)">
        {/* Anjungan Putih */}
        <rect x="22" y="14" width="34" height="38" rx="4" fill="#ffffff" stroke="#0b192c" strokeWidth="2" />
        <rect x="29" y="22" width="20" height="7" rx="2" fill="#0f2942" />
        <rect x="29" y="34" width="12" height="5" rx="1.5" fill="#94a3b8" />
        <rect x="32" y="3" width="11" height="11" rx="2" fill="#f59e0b" stroke="#0b192c" strokeWidth="2" />

        {/* Tumpukan Kontainer Berwarna Logo */}
        {/* Baris Bawah */}
        <rect x="62" y="32" width="38" height="20" rx="3" fill="#1e4976" stroke="#0b192c" strokeWidth="2" />
        <rect x="102" y="32" width="38" height="20" rx="3" fill="#f59e0b" stroke="#0b192c" strokeWidth="2" />
        <rect x="142" y="32" width="38" height="20" rx="3" fill="#34d399" stroke="#0b192c" strokeWidth="2" />
        {/* Baris Atas */}
        <rect x="78" y="12" width="38" height="20" rx="3" fill="#34d399" stroke="#0b192c" strokeWidth="2" />
        <rect x="118" y="12" width="38" height="20" rx="3" fill="#f59e0b" stroke="#0b192c" strokeWidth="2" />
        {/* Garis rusuk kontainer */}
        <line x1="91" y1="17" x2="91" y2="27" stroke="#0b192c" strokeWidth="1.5" opacity="0.45" />
        <line x1="103" y1="17" x2="103" y2="27" stroke="#0b192c" strokeWidth="1.5" opacity="0.45" />
        <line x1="131" y1="17" x2="131" y2="27" stroke="#0b192c" strokeWidth="1.5" opacity="0.45" />
        <line x1="143" y1="17" x2="143" y2="27" stroke="#0b192c" strokeWidth="1.5" opacity="0.45" />

        {/* Lambung Kapal */}
        <path
          d="M8 52H206L184 86H24L8 52Z"
          fill="#163a5c"
          stroke="#6495bf"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Garis Air Saffron */}
        <path d="M20 73H191" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
        <circle cx="180" cy="62" r="3.5" fill="#ffffff" />

        {/* Gelombang Air & Buih */}
        <path
          d="M-4 86 C 24 78, 46 94, 76 86 C 106 78, 128 94, 158 86 C 184 79, 202 92, 220 85"
          stroke="#34d399"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M16 96 C 46 90, 74 102, 106 96 C 138 90, 166 102, 198 95"
          stroke="#93c5fd"
          strokeOpacity="0.65"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

/**
 * Ilustrasi Slide 2: Kalkulasi Harga & Dokumen Perdagangan Ekspor Sinkron
 */
function SlideTradeDocsIllustration() {
  return (
    <svg
      className="auth-split-svg"
      viewBox="0 0 300 230"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="46" y="66" width="174" height="22" rx="11" fill="#1b4368" opacity="0.65" />
      <rect x="34" y="102" width="222" height="26" rx="13" fill="#1b4368" opacity="0.55" />
      <rect x="68" y="142" width="168" height="22" rx="11" fill="#1b4368" opacity="0.65" />

      <path d="M84 40V48M80 44H88" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M236 160V168M232 164H240" stroke="#34d399" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="242" cy="82" r="9" fill="#f59e0b" opacity="0.24" />

      {/* Lembar Belakang: Packing List / Bill of Lading */}
      <g transform="translate(88 44) rotate(-11)">
        <rect x="0" y="0" width="104" height="132" rx="10" fill="#163a5c" stroke="#6495bf" strokeWidth="2" />
        <rect x="14" y="16" width="44" height="7" rx="3.5" fill="#34d399" />
        <rect x="14" y="32" width="74" height="5" rx="2.5" fill="#93c5fd" opacity="0.6" />
        <rect x="14" y="44" width="60" height="5" rx="2.5" fill="#93c5fd" opacity="0.45" />
        <rect x="14" y="64" width="76" height="36" rx="5" fill="#0f2942" />
        <path d="M22 88L38 76L54 82L78 69" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Lembar Utama: Commercial Invoice & Kalkulasi Harga */}
      <g transform="translate(126 32) rotate(5)">
        <rect x="4" y="8" width="114" height="144" rx="11" fill="#071220" opacity="0.36" />
        <rect x="0" y="0" width="114" height="144" rx="10" fill="#ffffff" stroke="#0b192c" strokeWidth="2" />
        {/* Header Bar Saffron */}
        <rect x="12" y="12" width="90" height="18" rx="5" fill="#0f2942" />
        <rect x="19" y="18" width="38" height="6" rx="3" fill="#f59e0b" />
        <circle cx="91" cy="21" r="3.5" fill="#34d399" />

        {/* Baris Item Terverifikasi */}
        <path d="M16 47L21 52L29 43" stroke="#10b981" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="36" y="43" width="42" height="5" rx="2.5" fill="#0f2942" />
        <rect x="84" y="43" width="18" height="5" rx="2.5" fill="#f59e0b" />

        <path d="M16 69L21 74L29 65" stroke="#10b981" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="36" y="65" width="36" height="5" rx="2.5" fill="#0f2942" />
        <rect x="84" y="65" width="18" height="5" rx="2.5" fill="#10b981" />

        <path d="M16 91L21 96L29 87" stroke="#f59e0b" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="36" y="87" width="44" height="5" rx="2.5" fill="#0f2942" />
        <rect x="84" y="87" width="18" height="5" rx="2.5" fill="#0f2942" />

        {/* Total Nilai Ekspor Box */}
        <rect x="12" y="109" width="90" height="22" rx="6" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1.4" />
        <rect x="20" y="117" width="32" height="6" rx="3" fill="#64748b" />
        <rect x="64" y="116" width="30" height="8" rx="4" fill="#10b981" />
      </g>

      {/* Badge Kalkulator Margin / Valuta Melayang */}
      <g transform="translate(52 132)">
        <rect x="0" y="4" width="76" height="44" rx="10" fill="#071220" opacity="0.35" />
        <rect x="0" y="0" width="76" height="44" rx="10" fill="#f59e0b" stroke="#0b192c" strokeWidth="2" />
        <rect x="10" y="9" width="28" height="6" rx="3" fill="#0b192c" />
        <rect x="10" y="21" width="56" height="13" rx="4" fill="#ffffff" />
        <path d="M16 29L27 24L37 28L56 23" stroke="#10b981" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

/**
 * Ilustrasi Slide 3: Simulasi Kontainer 3D Isometrik & Perisai Keamanan Ekspor
 */
function SlideContainerLoadIllustration() {
  return (
    <svg
      className="auth-split-svg"
      viewBox="0 0 300 230"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="44" y="64" width="180" height="22" rx="11" fill="#1b4368" opacity="0.62" />
      <rect x="32" y="100" width="228" height="26" rx="13" fill="#1b4368" opacity="0.52" />
      <rect x="66" y="140" width="172" height="22" rx="11" fill="#1b4368" opacity="0.62" />

      <path d="M74 44V52M70 48H78" stroke="#34d399" strokeWidth="2" strokeLinecap="round" />
      <circle cx="242" cy="70" r="3.5" fill="#f59e0b" />

      {/* Kontainer 3D Isometrik Terbuka (Cutaway) */}
      <g transform="translate(46 28)">
        {/* Bayangan Lantai */}
        <polygon points="104,174 22,132 104,90 186,132" fill="#071220" opacity="0.38" />

        {/* Dinding Belakang Kiri & Kanan Kontainer */}
        <polygon points="104,22 24,62 24,126 104,86" fill="#163a5c" stroke="#6495bf" strokeWidth="2" strokeLinejoin="round" />
        <polygon points="104,22 184,62 184,126 104,86" fill="#12304e" stroke="#6495bf" strokeWidth="2" strokeLinejoin="round" />

        {/* Lantai Kontainer */}
        <polygon points="104,86 24,126 104,166 184,126" fill="#1e4976" stroke="#93c5fd" strokeWidth="1.8" strokeLinejoin="round" />

        {/* Kargo Kubus 3D #1 (Saffron Besar di Tengah-Belakang) */}
        <g transform="translate(76 54)">
          <polygon points="28,0 0,14 28,28 56,14" fill="#fbbf24" stroke="#0b192c" strokeWidth="1.6" strokeLinejoin="round" />
          <polygon points="0,14 0,46 28,60 28,28" fill="#f59e0b" stroke="#0b192c" strokeWidth="1.6" strokeLinejoin="round" />
          <polygon points="56,14 56,46 28,60 28,28" fill="#d97706" stroke="#0b192c" strokeWidth="1.6" strokeLinejoin="round" />
        </g>

        {/* Kargo Kubus 3D #2 (Mint di Kiri-Depan) */}
        <g transform="translate(44 74)">
          <polygon points="24,0 0,12 24,24 48,12" fill="#6ee7b7" stroke="#0b192c" strokeWidth="1.6" strokeLinejoin="round" />
          <polygon points="0,12 0,40 24,52 24,24" fill="#34d399" stroke="#0b192c" strokeWidth="1.6" strokeLinejoin="round" />
          <polygon points="48,12 48,40 24,52 24,24" fill="#059669" stroke="#0b192c" strokeWidth="1.6" strokeLinejoin="round" />
        </g>

        {/* Kargo Kubus 3D #3 (Putih/Navy di Kanan-Depan) */}
        <g transform="translate(106 76)">
          <polygon points="24,0 0,12 24,24 48,12" fill="#f8fafc" stroke="#0b192c" strokeWidth="1.6" strokeLinejoin="round" />
          <polygon points="0,12 0,38 24,50 24,24" fill="#e2e8f0" stroke="#0b192c" strokeWidth="1.6" strokeLinejoin="round" />
          <polygon points="48,12 48,38 24,50 24,24" fill="#cbd5e1" stroke="#0b192c" strokeWidth="1.6" strokeLinejoin="round" />
        </g>

        {/* Kargo Kubus 3D #4 (Saffron di Atas) */}
        <g transform="translate(78 30)">
          <polygon points="20,0 0,10 20,20 40,10" fill="#fde68a" stroke="#0b192c" strokeWidth="1.6" strokeLinejoin="round" />
          <polygon points="0,10 0,30 20,40 20,20" fill="#f59e0b" stroke="#0b192c" strokeWidth="1.6" strokeLinejoin="round" />
          <polygon points="40,10 40,30 20,40 20,20" fill="#d97706" stroke="#0b192c" strokeWidth="1.6" strokeLinejoin="round" />
        </g>

        {/* Rangka Kawat Depan Kontainer 3D (Isometric Wireframe) */}
        <polygon
          points="104,22 184,62 104,102 24,62"
          stroke="#93c5fd"
          strokeOpacity="0.65"
          strokeWidth="1.6"
          strokeDasharray="5 4"
        />
        <line x1="104" y1="102" x2="104" y2="166" stroke="#93c5fd" strokeOpacity="0.7" strokeWidth="1.6" strokeDasharray="5 4" />
      </g>

      {/* Perisai Verifikasi & Keamanan Transaksi */}
      <g transform="translate(204 114)">
        <path
          d="M28 4L52 14V32C52 49 41 62 28 68C15 62 4 49 4 32V14L28 4Z"
          fill="#0b192c"
          stroke="#34d399"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <path
          d="M28 11L45 18V31C45 44 37 54 28 59C19 54 11 44 11 31V18L28 11Z"
          fill="#10b981"
          fillOpacity="0.22"
        />
        <path
          d="M19 35L25 41L38 27"
          stroke="#f59e0b"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* Pill Indikator Kapasitas */}
      <g transform="translate(42 36)">
        <rect x="0" y="0" width="68" height="22" rx="11" fill="#0b192c" stroke="#34d399" strokeWidth="1.5" />
        <rect x="8" y="8" width="34" height="6" rx="3" fill="#34d399" />
        <circle cx="54" cy="11" r="4" fill="#f59e0b" />
      </g>
    </svg>
  );
}

function ActiveSlideIllustration({ index }: { index: number }) {
  if (index === 1) return <SlideTradeDocsIllustration />;
  if (index === 2) return <SlideContainerLoadIllustration />;
  return <SlideGlobalVesselIllustration />;
}

export function AuthFlow({ onAuthenticated }: { onAuthenticated: () => Promise<void> }) {
  const [step, setStep] = useState<AuthStep>(readInitialAuthStep);
  const [originStep, setOriginStep] = useState<"login" | "register">("login");
  const [hasLoggedInBefore, setHasLoggedInBefore] = useState<boolean>(readHasLoggedInBefore);
  const [[slideIndex, slideDirection], setSlideTuple] = useState<[number, number]>([0, 1]);
  const [isSlidePaused, setIsSlidePaused] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // OTP state
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const registerMutation = trpc.auth.register.useMutation();
  const loginMutation = trpc.auth.login.useMutation();
  const verifyMutation = trpc.auth.verifyEmail.useMutation();
  const resendMutation = trpc.auth.resendVerification.useMutation();

  const goToSlide = useCallback((targetIndex: number) => {
    setSlideTuple(([prev]) => {
      const normalized = ((targetIndex % SLIDES.length) + SLIDES.length) % SLIDES.length;
      if (normalized === prev) return [prev, 1];
      const dir = normalized > prev ? 1 : -1;
      return [normalized, dir];
    });
  }, []);

  const stepSlide = useCallback((delta: number) => {
    setSlideTuple(([prev]) => {
      const next = ((prev + delta) % SLIDES.length + SLIDES.length) % SLIDES.length;
      return [next, delta >= 0 ? 1 : -1];
    });
  }, []);

  useEffect(() => {
    if (isSlidePaused) return undefined;
    const timer = window.setInterval(() => {
      stepSlide(1);
    }, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [isSlidePaused, slideIndex, stepSlide]);

  const switchStep = (next: AuthStep) => {
    setErrorMessage(null);
    setStep(next);
    goToSlide(next === "login" ? 0 : next === "register" ? 1 : 2);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("auth", next);
      window.history.replaceState({}, "", url.toString());
    } catch {
      // Abaikan
    }
  };

  useEffect(() => {
    document.title =
      step === "register"
        ? "EksporFlow · Buat Akun"
        : step === "verify"
          ? "EksporFlow · Verifikasi OTP"
          : "EksporFlow · Masuk";
  }, [step]);

  useEffect(() => {
    if (step === "verify") {
      setTimeout(() => otpRefs.current[0]?.focus(), 60);
    }
  }, [step]);

  const handleRegisterSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);

    if (name.trim().length < 2) {
      setErrorMessage("Nama lengkap minimal 2 karakter.");
      return;
    }
    if (companyName.trim().length < 2) {
      setErrorMessage("Nama perusahaan eksportir minimal 2 karakter.");
      return;
    }
    if (!email.trim().includes("@")) {
      setErrorMessage("Masukkan alamat email yang valid.");
      return;
    }
    if (password.length < 8) {
      setErrorMessage("Kata sandi minimal 8 karakter.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Konfirmasi kata sandi belum sama.");
      return;
    }

    setOriginStep("register");
    try {
      const result = await registerMutation.mutateAsync({
        name: name.trim(),
        companyName: companyName.trim(),
        email: email.trim(),
        password,
      });
      setEmail(result.email);
      setOtpDigits(["", "", "", "", "", ""]);
      setDevOtpHint(result.devOtpCode ?? null);
      switchStep("verify");
      toast.success("Akun berhasil dibuat!", {
        description: `Masukkan 6 digit kode verifikasi untuk mengaktifkan workspace ${companyName.trim()}.`,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Gagal mendaftarkan akun.";
      setErrorMessage(msg);
    }
  };

  const handleLoginSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage("Masukkan email dan kata sandi Anda.");
      return;
    }

    setOriginStep("login");
    try {
      const result = await loginMutation.mutateAsync({
        email: email.trim(),
        password,
      });

      setEmail(result.email);
      setOtpDigits(["", "", "", "", "", ""]);
      setDevOtpHint(result.devOtpCode ?? null);
      switchStep("verify");
      toast.info("Verifikasi akun", {
        description: "Masukkan 6 digit kode verifikasi untuk melanjutkan ke workspace.",
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Gagal masuk ke akun.";
      setErrorMessage(msg);
    }
  };

  const handleVerifySubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);

    const code = otpDigits.join("");
    if (!/^\d{6}$/.test(code)) {
      setErrorMessage("Lengkapi ke-6 digit kode verifikasi terlebih dahulu.");
      return;
    }

    try {
      const result = await verifyMutation.mutateAsync({
        email: email.trim(),
        code,
      });
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete("auth");
        window.history.replaceState({}, "", url.toString());
      } catch {
        // Abaikan
      }
      const wasReturning = hasLoggedInBefore;
      markHasLoggedInBefore();
      setHasLoggedInBefore(true);
      toast.success(
        wasReturning
          ? `Selamat datang kembali, ${result.user.name || "Pengguna"}!`
          : `Selamat datang, ${result.user.name || "Pengguna"}!`,
        {
          description: `Workspace ${result.user.companyName || result.user.name || "EksporFlow"} siap digunakan.`,
        }
      );
      await onAuthenticated();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Kode verifikasi tidak valid.";
      setErrorMessage(msg);
    }
  };

  const handleResendCode = async () => {
    setErrorMessage(null);
    if (!email.trim()) {
      setErrorMessage("Masukkan alamat email Anda terlebih dahulu.");
      return;
    }
    try {
      const result = await resendMutation.mutateAsync({ email: email.trim() });
      setOtpDigits(["", "", "", "", "", ""]);
      setDevOtpHint(result.devOtpCode ?? null);
      otpRefs.current[0]?.focus();
      toast.success("Kode verifikasi 6 digit baru telah dikirim.");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Gagal mengirim ulang kode.";
      setErrorMessage(msg);
    }
  };

  const handleOtpChange = (index: number, raw: string) => {
    const digitsOnly = raw.replace(/\D/g, "");
    if (!digitsOnly) {
      const next = [...otpDigits];
      next[index] = "";
      setOtpDigits(next);
      return;
    }

    if (digitsOnly.length > 1) {
      const next = [...otpDigits];
      for (let offset = 0; offset < digitsOnly.length && index + offset < 6; offset += 1) {
        next[index + offset] = digitsOnly[offset];
      }
      setOtpDigits(next);
      const focusTarget = Math.min(5, index + digitsOnly.length);
      otpRefs.current[focusTarget]?.focus();
      return;
    }

    const next = [...otpDigits];
    next[index] = digitsOnly[0];
    setOtpDigits(next);
    if (index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    event.preventDefault();
    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i += 1) {
      next[i] = pasted[i];
    }
    setOtpDigits(next);
    otpRefs.current[Math.min(5, Math.max(0, pasted.length - 1))]?.focus();
  };

  const fillDevOtp = () => {
    if (!devOtpHint || devOtpHint.length !== 6) return;
    setOtpDigits(devOtpHint.split(""));
    setErrorMessage(null);
  };

  const isBusy =
    registerMutation.isPending ||
    loginMutation.isPending ||
    verifyMutation.isPending ||
    resendMutation.isPending;

  const activeSlide = SLIDES[slideIndex] ?? SLIDES[0];
  const isReturningWelcome = step === "login" && hasLoggedInBefore;
  const activeSlideTitle =
    "titleNew" in activeSlide
      ? isReturningWelcome
        ? activeSlide.titleReturning
        : activeSlide.titleNew
      : activeSlide.title;

  const pointerStartX = useRef<number | null>(null);

  const handleSlidePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    pointerStartX.current = e.clientX;
  };

  const handleSlidePointerUp = (e: React.PointerEvent<HTMLElement>) => {
    if (pointerStartX.current === null) return;
    const deltaX = e.clientX - pointerStartX.current;
    pointerStartX.current = null;
    if (Math.abs(deltaX) > 36) {
      stepSlide(deltaX < 0 ? 1 : -1);
    }
  };

  return (
    <div className="auth-stage-backdrop">
      <ExportWorldBackdrop />

      <div className="auth-split-window">
        {/* Panel Kiri: Identitas & Carousel 3 Slide Ilustrasi EksporFlow */}
        <aside
          className="auth-split-left"
          onMouseEnter={() => setIsSlidePaused(true)}
          onMouseLeave={() => setIsSlidePaused(false)}
          onPointerDown={handleSlidePointerDown}
          onPointerUp={handleSlidePointerUp}
        >
          <div className="auth-split-top-row">
            <div className="auth-split-logo">
              <div className="brand-mark">
                <span />
                <span />
              </div>
              <strong>
                Ekspor<span>Flow</span>
              </strong>
            </div>
          </div>

          <div className="auth-split-art">
            <AnimatePresence mode="wait" custom={slideDirection} initial={false}>
              <motion.div
                key={activeSlide.id}
                className="auth-split-art-frame"
                custom={slideDirection}
                variants={SLIDE_VARIANTS}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="auth-split-art-float">
                  <ActiveSlideIllustration index={slideIndex} />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="auth-split-welcome">
            <div className="auth-split-copy-stage">
              <AnimatePresence mode="wait" custom={slideDirection} initial={false}>
                <motion.div
                  key={`${activeSlide.id}-${activeSlideTitle}`}
                  className="auth-split-copy-slide"
                  custom={slideDirection}
                  variants={SLIDE_VARIANTS}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                >
                  <h1 className="auth-welcome-heading">{activeSlideTitle}</h1>
                  <p>{activeSlide.subtitle}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="auth-slide-footer">
              <div className="auth-slide-dots" role="tablist" aria-label="Sorotan fitur ekspor">
                {SLIDES.map((s, idx) => {
                  const sTitle = "titleNew" in s ? s.titleNew : s.title;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      role="tab"
                      aria-selected={slideIndex === idx}
                      aria-label={`Slide ${idx + 1}: ${sTitle}`}
                      className={slideIndex === idx ? "active" : ""}
                      onClick={() => goToSlide(idx)}
                    />
                  );
                })}
              </div>

              <div className="auth-slide-arrows">
                <button
                  type="button"
                  aria-label="Slide sebelumnya"
                  onClick={() => stepSlide(-1)}
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  type="button"
                  aria-label="Slide berikutnya"
                  onClick={() => stepSlide(1)}
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Panel Kanan: Form Putih Bersih & Minimalis */}
        <main className="auth-split-right">
          <div className="auth-clean-pane">
            {errorMessage && (
              <div className="auth-clean-alert" role="alert">
                {errorMessage}
              </div>
            )}

            {step === "login" && (
              <form className="auth-minimal-form" onSubmit={(e) => void handleLoginSubmit(e)}>
                <div className="auth-minimal-head">
                  <h2>Log In</h2>
                  <p>
                    Belum punya akun?{" "}
                    <button type="button" onClick={() => switchStep("register")}>
                      Buat akun baru
                    </button>
                    <br />
                    Hanya butuh waktu kurang dari satu menit.
                  </p>
                </div>

                <div className="auth-line-fields">
                  <label className="auth-line-input">
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="Email kerja"
                      aria-label="Email kerja"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <UserRound size={16} />
                  </label>

                  <label className="auth-line-input">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      placeholder="Kata sandi"
                      aria-label="Kata sandi"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="auth-line-icon-btn"
                      aria-label={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Lock size={16} />}
                    </button>
                  </label>
                </div>

                <div className="auth-action-bar">
                  <button type="submit" className="auth-primary-btn" disabled={isBusy}>
                    {loginMutation.isPending ? "Memproses..." : "Masuk"}
                  </button>

                  <label className="auth-remember">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span>
                      <Check size={11} />
                    </span>
                    Ingat sesi saya
                  </label>
                </div>
              </form>
            )}

            {step === "register" && (
              <form className="auth-minimal-form" onSubmit={(e) => void handleRegisterSubmit(e)}>
                <div className="auth-minimal-head">
                  <h2>Registrasi</h2>
                  <p>
                    Sudah punya akun?{" "}
                    <button type="button" onClick={() => switchStep("login")}>
                      Masuk di sini
                    </button>
                    <br />
                    Daftarkan perusahaan Anda untuk mulai mengelola ekspor.
                  </p>
                </div>

                <div className="auth-line-fields compact">
                  <label className="auth-line-input">
                    <input
                      type="text"
                      required
                      placeholder="Nama lengkap Anda"
                      aria-label="Nama lengkap"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                    <UserRound size={16} />
                  </label>

                  <label className="auth-line-input">
                    <input
                      type="text"
                      required
                      placeholder="Nama perusahaan eksportir"
                      aria-label="Nama perusahaan eksportir"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                    <Building2 size={16} />
                  </label>

                  <label className="auth-line-input">
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="Email kerja"
                      aria-label="Email kerja"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <Mail size={16} />
                  </label>

                  <div className="auth-line-two-col">
                    <label className="auth-line-input">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={8}
                        autoComplete="new-password"
                        placeholder="Sandi (min. 8)"
                        aria-label="Kata sandi"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="auth-line-icon-btn"
                        aria-label={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </label>

                    <label className="auth-line-input">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={8}
                        autoComplete="new-password"
                        placeholder="Ulangi sandi"
                        aria-label="Ulangi kata sandi"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <KeyRound size={15} />
                    </label>
                  </div>
                </div>

                <div className="auth-action-bar">
                  <button type="submit" className="auth-primary-btn" disabled={isBusy}>
                    {registerMutation.isPending ? "Mendaftarkan..." : "Daftar Akun"}
                  </button>
                </div>
              </form>
            )}

            {step === "verify" && (
              <form className="auth-minimal-form" onSubmit={(e) => void handleVerifySubmit(e)}>
                <div className="auth-minimal-head">
                  <h2>Verifikasi</h2>
                  <p>
                    Bukan email Anda?{" "}
                    <button type="button" onClick={() => switchStep(originStep)}>
                      Ubah alamat email
                    </button>
                    <br />
                    Masukkan 6 digit kode OTP untuk{" "}
                    <strong>{email || "akun Anda"}</strong>.
                  </p>
                </div>

                {!email.trim() && (
                  <div className="auth-line-fields compact">
                    <label className="auth-line-input">
                      <input
                        type="email"
                        required
                        placeholder="Email yang didaftarkan"
                        aria-label="Email yang didaftarkan"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      <Mail size={16} />
                    </label>
                  </div>
                )}

                {devOtpHint && (
                  <div className="auth-sim-pill">
                    <span>
                      Kode verifikasi Anda: <b className="mono-code">{devOtpHint}</b>
                    </span>
                    <button type="button" onClick={fillDevOtp}>
                      <Copy size={12} /> Isi otomatis
                    </button>
                  </div>
                )}

                <div className="auth-otp-clean-row" role="group" aria-label="6 digit kode verifikasi">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        otpRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      aria-label={`Digit ke-${index + 1}`}
                      className="auth-otp-clean-box mono-code"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                    />
                  ))}
                </div>

                <div className="auth-action-bar">
                  <button type="submit" className="auth-primary-btn" disabled={isBusy}>
                    {verifyMutation.isPending ? "Memverifikasi..." : "Verifikasi Akun"}
                  </button>

                  <button
                    type="button"
                    className="auth-resend-inline"
                    disabled={isBusy}
                    onClick={() => void handleResendCode()}
                  >
                    <RefreshCw size={13} /> {resendMutation.isPending ? "Mengirim..." : "Kirim ulang"}
                  </button>
                </div>

                <div className="auth-bottom-link">
                  <button type="button" onClick={() => switchStep(originStep)}>
                    {originStep === "register"
                      ? "Kembali ke halaman Registrasi"
                      : "Kembali ke halaman Log In"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
