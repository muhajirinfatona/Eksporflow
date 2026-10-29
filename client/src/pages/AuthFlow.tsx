import { trpc } from "@/lib/trpc";
import { AnimatePresence, motion } from "framer-motion";
import {
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
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

const VERIFY_EMAIL_KEY = "eksporflow:auth_verify_email";
const VERIFY_ORIGIN_KEY = "eksporflow:auth_verify_origin";
const REG_DRAFT_KEY = "eksporflow:auth_reg_draft";

interface InitialAuthData {
  step: AuthStep;
  email: string;
  origin: "login" | "register";
  name: string;
  companyName: string;
}

function readInitialAuthData(): InitialAuthData {
  try {
    const url = new URL(window.location.href);
    const rawStep = url.searchParams.get("auth");
    const paramEmail = url.searchParams.get("email")?.trim() || "";
    const paramFrom = url.searchParams.get("from");
    const sessionEmail = window.sessionStorage.getItem(VERIFY_EMAIL_KEY)?.trim() || "";
    const sessionOrigin = window.sessionStorage.getItem(VERIFY_ORIGIN_KEY);

    let draftName = "";
    let draftCompany = "";
    const rawDraft = window.sessionStorage.getItem(REG_DRAFT_KEY);
    if (rawDraft) {
      try {
        const parsed = JSON.parse(rawDraft);
        if (typeof parsed.name === "string") draftName = parsed.name;
        if (typeof parsed.companyName === "string") draftCompany = parsed.companyName;
      } catch {
        // Abaikan
      }
    }

    const finalEmail = paramEmail || sessionEmail || "";
    const finalOrigin: "login" | "register" =
      paramFrom === "register" || sessionOrigin === "register"
        ? "register"
        : "login";

    let finalStep: AuthStep = "login";
    if (rawStep === "register" || rawStep === "verify" || rawStep === "login") {
      finalStep = rawStep;
    }

    // Jika pengguna membuka halaman verifikasi tanpa email tersimpan,
    // kembalikan ke step asal (login/register) agar tidak tampil form kosong
    if (finalStep === "verify" && !finalEmail) {
      finalStep = finalOrigin;
    }

    return {
      step: finalStep,
      email: finalEmail,
      origin: finalOrigin,
      name: draftName,
      companyName: draftCompany,
    };
  } catch {
    return {
      step: "login",
      email: "",
      origin: "login",
      name: "",
      companyName: "",
    };
  }
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
 * Latar belakang Maritime Digital Aurora & Global Export Trade Mesh
 * Desain eksklusif EksporFlow: Menggabungkan atmosfer laut cerah berkelas,
 * peta rute pelayaran maritim global (Tanjung Priok - Singapore - Rotterdam),
 * garis kontur arus samudera (bathymetric curves), serta pendar cahaya aura dinamis.
 */
function ExportWorldBackdrop() {
  return (
    <div className="auth-export-scene" aria-hidden="true">
      {/* 1. Luminous Ambient Gradient Orbs (Oceanic Azure, Saffron Dawn, Seafoam Mint) */}
      <div className="auth-aurora-glow auth-aurora-1" />
      <div className="auth-aurora-glow auth-aurora-2" />
      <div className="auth-aurora-glow auth-aurora-3" />

      {/* 2. SVG Global Maritime Trade Routes & Bathymetric Ocean Contours */}
      <svg
        className="auth-maritime-mesh-svg"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="routeGlowBlue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="routeGlowGold" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.25" />
          </linearGradient>
          <linearGradient id="contourGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.04" />
          </linearGradient>
          <pattern id="nauticalGridPattern" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#0284c7" strokeWidth="0.75" strokeOpacity="0.07" strokeDasharray="3 3" />
            <circle cx="80" cy="80" r="1.5" fill="#0284c7" fillOpacity="0.14" />
          </pattern>
        </defs>

        {/* Pola Kisi Navigasi Bahari Digital */}
        <rect width="1920" height="1080" fill="url(#nauticalGridPattern)" />

        {/* Garis-Garis Arus Kontur Kedalaman Samudera (Bathymetric Ocean Currents) */}
        <g className="auth-contour-group">
          <path
            className="auth-wave-contour-a"
            d="M-100 240 C 320 160, 680 340, 1140 220 C 1520 120, 1780 260, 2040 180"
            stroke="#38bdf8"
            strokeWidth="1.8"
            strokeOpacity="0.32"
          />
          <path
            className="auth-wave-contour-b"
            d="M-100 380 C 420 280, 840 460, 1280 360 C 1640 280, 1860 410, 2040 340"
            stroke="#0ea5e9"
            strokeWidth="2.2"
            strokeOpacity="0.25"
          />
          <path
            className="auth-wave-contour-c"
            d="M-100 860 C 380 740, 780 920, 1260 820 C 1600 750, 1820 890, 2040 820"
            stroke="#38bdf8"
            strokeWidth="2"
            strokeOpacity="0.28"
          />
          <path
            className="auth-wave-contour-a"
            d="M-100 940 C 460 840, 920 1010, 1420 900 C 1720 840, 1880 960, 2040 910"
            stroke="#0284c7"
            strokeWidth="1.6"
            strokeOpacity="0.22"
          />
        </g>

        {/* Jalur Pelayaran Ekspor Global Utama (Shipping Corridors) dengan Aliran Berpendar */}
        {/* Koridor 1: Tanjung Priok -> Selat Malaka -> Singapore -> Rotterdam */}
        <g className="auth-corridor-lane">
          <path
            className="auth-trade-corridor-gold"
            d="M 160 880 C 420 720, 680 480, 960 410 C 1240 340, 1580 240, 1820 140"
            stroke="url(#routeGlowGold)"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeDasharray="10 14"
          />
          <path
            d="M 160 880 C 420 720, 680 480, 960 410 C 1240 340, 1580 240, 1820 140"
            stroke="#f59e0b"
            strokeWidth="1"
            strokeOpacity="0.2"
          />
        </g>

        {/* Koridor 2: Jalur Samudera Pasifik (Jakarta -> Shanghai -> Tokyo -> Los Angeles) */}
        <g className="auth-corridor-lane">
          <path
            className="auth-trade-corridor-blue"
            d="M 120 760 C 520 660, 820 780, 1180 620 C 1480 480, 1680 320, 1880 360"
            stroke="url(#routeGlowBlue)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="8 12"
          />
        </g>

        {/* Koridor 3: Jalur Feeder Ekspor Intra-Asia & Timur Tengah */}
        <g className="auth-corridor-lane">
          <path
            className="auth-trade-corridor-mint"
            d="M 240 920 C 580 860, 940 760, 1380 720 C 1660 690, 1840 580, 2000 520"
            stroke="#10b981"
            strokeWidth="2"
            strokeOpacity="0.45"
            strokeLinecap="round"
            strokeDasharray="6 10"
          />
        </g>

        {/* Node Pelabuhan Utama Hub Ekspor Dunia dengan Gelombang Denyut (Pulse Rings) */}
        {/* Node A: Tanjung Priok (Jakarta) - Hub Ekspor Utama */}
        <g transform="translate(240 860)">
          <circle cx="0" cy="0" r="18" fill="#f59e0b" fillOpacity="0.15" className="auth-node-ripple" />
          <circle cx="0" cy="0" r="9" fill="#f59e0b" fillOpacity="0.35" />
          <circle cx="0" cy="0" r="4.5" fill="#f59e0b" />
          <circle cx="0" cy="0" r="2" fill="#ffffff" />
          <text x="14" y="4" fill="#0369a1" fontSize="11" fontWeight="700" letterSpacing="1.2">PORT OF JAKARTA (ID)</text>
          <text x="14" y="16" fill="#64748b" fontSize="9.5" fontFamily="monospace">06°06'S • 106°53'E</text>
        </g>

        {/* Node B: Port of Singapore - Global Transshipment Hub */}
        <g transform="translate(680 580)">
          <circle cx="0" cy="0" r="14" fill="#38bdf8" fillOpacity="0.15" className="auth-node-ripple" />
          <circle cx="0" cy="0" r="7" fill="#38bdf8" fillOpacity="0.35" />
          <circle cx="0" cy="0" r="3.5" fill="#0284c7" />
          <circle cx="0" cy="0" r="1.5" fill="#ffffff" />
          <text x="12" y="4" fill="#0369a1" fontSize="10.5" fontWeight="600" letterSpacing="1">SINGAPORE HUB (SG)</text>
        </g>

        {/* Node C: Port of Rotterdam - Gerbang Ekspor Eropa */}
        <g transform="translate(1620 220)">
          <circle cx="0" cy="0" r="16" fill="#10b981" fillOpacity="0.15" className="auth-node-ripple" />
          <circle cx="0" cy="0" r="8" fill="#10b981" fillOpacity="0.35" />
          <circle cx="0" cy="0" r="4" fill="#059669" />
          <circle cx="0" cy="0" r="2" fill="#ffffff" />
          <text x="-155" y="4" fill="#0369a1" fontSize="10.5" fontWeight="600" letterSpacing="1">PORT OF ROTTERDAM (NL)</text>
          <text x="-155" y="16" fill="#64748b" fontSize="9.5" fontFamily="monospace">51°55'N • 04°24'E</text>
        </g>

        {/* Aksen Kompas Bahari Maritim (Nautical Compass Rose) di Sudut Kanan Atas */}
        <g transform="translate(1780 120)" stroke="#0284c7" strokeOpacity="0.22" fill="none">
          <circle cx="0" cy="0" r="42" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="0" cy="0" r="32" strokeWidth="1" />
          <line x1="0" y1="-48" x2="0" y2="48" strokeWidth="1.2" />
          <line x1="-48" y1="0" x2="48" y2="0" strokeWidth="1.2" />
          <polygon points="0,-42 4,-12 0,0 -4,-12" fill="#0284c7" fillOpacity="0.35" stroke="none" />
          <polygon points="0,42 4,12 0,0 -4,12" fill="#64748b" fillOpacity="0.2" stroke="none" />
          <polygon points="42,0 12,4 0,0 12,-4" fill="#64748b" fillOpacity="0.2" stroke="none" />
          <polygon points="-42,0 -12,4 0,0 -12,-4" fill="#64748b" fillOpacity="0.2" stroke="none" />
          <text x="-4" y="-52" fill="#0369a1" fontSize="10" fontWeight="700">N</text>
        </g>

        {/* Siluet Kapal Kontainer Modern Berlayar Anggun di Cakrawala Kiri Bawah */}
        <g transform="translate(120 960)" opacity="0.45">
          <path d="M0 16 L140 16 L124 34 L12 34 Z" fill="#0284c7" />
          <rect x="20" y="4" width="22" height="12" rx="1.5" fill="#f59e0b" />
          <rect x="46" y="4" width="22" height="12" rx="1.5" fill="#10b981" />
          <rect x="72" y="4" width="22" height="12" rx="1.5" fill="#38bdf8" />
          <rect x="33" y="-8" width="22" height="12" rx="1.5" fill="#f59e0b" />
          <rect x="59" y="-8" width="22" height="12" rx="1.5" fill="#0284c7" />
          <rect x="100" y="-4" width="16" height="20" rx="2" fill="#ffffff" stroke="#93c5fd" strokeWidth="1" />
          <line x1="-30" y1="34" x2="160" y2="34" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.7" strokeLinecap="round" />
        </g>

        {/* Geometris Floating Container Micro-Badge di Latar Belakang */}
        <g transform="translate(1540 680)" opacity="0.55" className="auth-floating-badge">
          <rect x="0" y="0" width="148" height="42" rx="8" fill="#ffffff" fillOpacity="0.8" stroke="#bae6fd" strokeWidth="1" />
          <circle cx="18" cy="21" r="5" fill="#10b981" />
          <text x="32" y="18" fill="#0f172a" fontSize="10.5" fontWeight="600">Ocean Freight Verified</text>
          <text x="32" y="32" fill="#0284c7" fontSize="9" fontWeight="500">2,480 TEU • Bill of Lading</text>
        </g>
      </svg>

      {/* 3. Soft Atmospheric Glass Vignette (Clean Center for Card) */}
      <div className="auth-export-veil" />
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
  const [initialData] = useState<InitialAuthData>(readInitialAuthData);
  const [step, setStep] = useState<AuthStep>(initialData.step);
  const [originStep, setOriginStep] = useState<"login" | "register">(initialData.origin);
  const [hasLoggedInBefore, setHasLoggedInBefore] = useState<boolean>(readHasLoggedInBefore);
  const [[slideIndex, slideDirection], setSlideTuple] = useState<[number, number]>([
    initialData.step === "login" ? 0 : initialData.step === "register" ? 1 : 2,
    1,
  ]);
  const [isSlidePaused, setIsSlidePaused] = useState(false);

  // Form states
  const [name, setName] = useState(initialData.name);
  const [companyName, setCompanyName] = useState(initialData.companyName);
  const [email, setEmail] = useState(initialData.email);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // OTP state
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
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

  const switchStep = (
    next: AuthStep,
    meta?: { email?: string; origin?: "login" | "register" }
  ) => {
    setErrorMessage(null);
    setStep(next);
    if (meta?.origin) {
      setOriginStep(meta.origin);
    }
    goToSlide(next === "login" ? 0 : next === "register" ? 1 : 2);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("auth", next);

      if (next === "verify") {
        const activeEmail = meta?.email ?? email;
        const activeOrigin = meta?.origin ?? originStep;
        if (activeEmail) {
          url.searchParams.set("email", activeEmail);
          window.sessionStorage.setItem(VERIFY_EMAIL_KEY, activeEmail);
        }
        if (activeOrigin) {
          url.searchParams.set("from", activeOrigin);
          window.sessionStorage.setItem(VERIFY_ORIGIN_KEY, activeOrigin);
        }
      } else {
        url.searchParams.delete("email");
        url.searchParams.delete("from");
      }

      window.history.replaceState({}, "", url.toString());
    } catch {
      // Abaikan
    }
  };

  const handleChangeEmail = () => {
    setErrorMessage(null);
    switchStep(originStep);
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
      window.sessionStorage.setItem(
        REG_DRAFT_KEY,
        JSON.stringify({ name: name.trim(), companyName: companyName.trim() })
      );
    } catch {
      // Abaikan
    }

    try {
      const result = await registerMutation.mutateAsync({
        name: name.trim(),
        companyName: companyName.trim(),
        email: email.trim(),
        password,
      });
      setEmail(result.email);
      setOtpDigits(["", "", "", "", "", ""]);
      switchStep("verify", { email: result.email, origin: "register" });
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
      switchStep("verify", { email: result.email, origin: "login" });
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
        window.sessionStorage.removeItem(VERIFY_EMAIL_KEY);
        window.sessionStorage.removeItem(VERIFY_ORIGIN_KEY);
        window.sessionStorage.removeItem(REG_DRAFT_KEY);
        const url = new URL(window.location.href);
        url.searchParams.delete("auth");
        url.searchParams.delete("email");
        url.searchParams.delete("from");
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
      await resendMutation.mutateAsync({ email: email.trim() });
      setOtpDigits(["", "", "", "", "", ""]);
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
                  <h2>Verifikasi Akun</h2>
                  <p>
                    Kode verifikasi 6 digit telah dikirimkan ke alamat email:
                    <br />
                    <strong style={{ color: "var(--ink)", fontSize: "14px" }}>{email || "akun Anda"}</strong>
                    <br />
                    <span style={{ fontSize: "12px", color: "var(--muted)", display: "inline-block", marginTop: "4px" }}>
                      Silakan periksa kotak masuk (Inbox) atau folder Spam email Anda.
                    </span>
                  </p>
                  <p style={{ marginTop: "2px" }}>
                    Bukan email Anda?{" "}
                    <button type="button" onClick={handleChangeEmail}>
                      Ubah alamat email
                    </button>
                  </p>
                </div>

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
                  <button type="button" onClick={handleChangeEmail}>
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
