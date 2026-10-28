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
    badge: "Jalur Perdagangan Dunia",
    title: "Jangkau Pasar Dunia Lebih Pasti",
    subtitle:
      "Pantau kesiapan kargo, jadwal keberangkatan kapal, hingga pengiriman ke pelabuhan tujuan dalam satu kendali yang rapi.",
  },
  {
    id: "smart-docs",
    badge: "Kalkulasi & Dokumen Otomatis",
    title: "Hitung Harga & Dokumen Sekejap",
    subtitle:
      "Susun penawaran harga ekspor yang kompetitif dan terbitkan dokumen perdagangan secara konsisten tanpa input berulang.",
  },
  {
    id: "container-shield",
    badge: "Muatan Presisi & Terlindungi",
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
function ExportWorldBackdrop() {
  return (
    <div className="auth-export-scene" aria-hidden="true">
      <div className="auth-scene-glow auth-scene-glow-navy" />
      <div className="auth-scene-glow auth-scene-glow-mint" />
      <div className="auth-scene-glow auth-scene-glow-saffron" />

      <svg
        className="auth-export-scene-svg"
        viewBox="0 0 1600 960"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="eksporRouteGold" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.18" />
            <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.82" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0.28" />
          </linearGradient>
          <linearGradient id="eksporRouteMint" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.22" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.72" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.26" />
          </linearGradient>
          <linearGradient id="eksporHullNavy" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#173d62" />
            <stop offset="100%" stopColor="#091626" />
          </linearGradient>
          <linearGradient id="eksporWaveBack" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#355b82" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#1e3b5a" stopOpacity="0.68" />
          </linearGradient>
          <linearGradient id="eksporWaveMid" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1c3b5b" stopOpacity="0.58" />
            <stop offset="100%" stopColor="#122840" stopOpacity="0.78" />
          </linearGradient>
          <linearGradient id="eksporWaveFront" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10253c" stopOpacity="0.72" />
            <stop offset="100%" stopColor="#091626" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* Grid garis lintang & bujur maritim halus */}
        <g stroke="#cbd5e1" strokeOpacity="0.08" strokeWidth="1">
          <line x1="0" y1="160" x2="1600" y2="160" strokeDasharray="5 7" />
          <line x1="0" y1="320" x2="1600" y2="320" strokeDasharray="5 7" />
          <line x1="0" y1="480" x2="1600" y2="480" strokeDasharray="5 7" />
          <line x1="0" y1="640" x2="1600" y2="640" strokeDasharray="5 7" />
          <line x1="240" y1="0" x2="240" y2="840" strokeDasharray="5 7" />
          <line x1="520" y1="0" x2="520" y2="840" strokeDasharray="5 7" />
          <line x1="800" y1="0" x2="800" y2="840" strokeDasharray="5 7" />
          <line x1="1080" y1="0" x2="1080" y2="840" strokeDasharray="5 7" />
          <line x1="1360" y1="0" x2="1360" y2="840" strokeDasharray="5 7" />
        </g>

        {/* Siluet abstrak benua & kepulauan perdagangan dunia */}
        <g fill="#93c5fd" fillOpacity="0.08">
          {/* Eropa & Timur Tengah (kiri atas) */}
          <path d="M120 118C158 102 214 98 262 114C295 125 322 148 308 174C292 198 242 204 202 196C155 186 98 172 92 146C88 128 102 125 120 118Z" />
          <path d="M254 222C288 214 334 228 348 258C362 288 342 332 308 338C276 344 246 312 238 278C232 252 234 228 254 222Z" />
          {/* Nusantara / Asia Tenggara (sisi kiri tengah) */}
          <path d="M118 358C152 350 198 358 224 378C240 390 232 410 204 414C168 418 122 406 106 386C96 372 102 362 118 358Z" />
          <path d="M242 388C268 382 304 390 318 406C326 416 314 428 292 428C268 428 240 418 234 404C230 396 234 390 242 388Z" />
          {/* Asia Timur (kanan tengah) */}
          <path d="M1268 238C1306 222 1364 228 1396 254C1422 276 1418 312 1386 326C1352 340 1296 328 1268 298C1248 276 1246 248 1268 238Z" />
          {/* Amerika Utara (kanan atas) */}
          <path d="M1245 104C1298 88 1378 92 1432 118C1468 136 1476 168 1444 188C1408 210 1338 206 1286 186C1242 168 1212 114 1245 104Z" />
        </g>

        {/* Kompas Maritim Berputar Halus di Kanan Atas */}
        <g transform="translate(1476 142)">
          <g className="auth-compass-spin">
            <circle cx="0" cy="0" r="46" stroke="#cbd5e1" strokeOpacity="0.22" strokeWidth="1.5" strokeDasharray="3 5" />
            <circle cx="0" cy="0" r="32" stroke="#cbd5e1" strokeOpacity="0.16" strokeWidth="1" />
            <path d="M0 -38L6 -8L36 0L6 8L0 38L-6 8L-36 0L-6 -8Z" fill="#cbd5e1" fillOpacity="0.16" />
            <path d="M0 -38L4 -6L0 0L-4 -6Z" fill="#f59e0b" fillOpacity="0.75" />
            <path d="M0 38L4 6L0 0L-4 6Z" fill="#34d399" fillOpacity="0.65" />
          </g>
          <circle cx="0" cy="0" r="4" fill="#e2e8f0" fillOpacity="0.55" />
        </g>

        {/* Lengkungan Jalur Ekspor Dunia (Animated Trade Routes) */}
        <g fill="none" strokeLinecap="round">
          {/* Jalur Utama 1: Indonesia -> Eropa -> Amerika (Melengkung di atas kartu) */}
          <path
            d="M174 374 C 190 148, 560 54, 920 86 C 1145 106, 1280 124, 1368 152"
            stroke="#93c5fd"
            strokeOpacity="0.14"
            strokeWidth="2"
          />
          <path
            className="auth-route-flow-gold"
            d="M174 374 C 190 148, 560 54, 920 86 C 1145 106, 1280 124, 1368 152"
            stroke="url(#eksporRouteGold)"
            strokeWidth="2.6"
            strokeDasharray="10 12"
          />

          {/* Jalur Utama 2: Eropa (Rotterdam) -> Asia Timur (Tokyo) */}
          <path
            d="M236 148 C 520 34, 1020 38, 1344 278"
            stroke="#93c5fd"
            strokeOpacity="0.12"
            strokeWidth="1.8"
          />
          <path
            className="auth-route-flow-mint"
            d="M236 148 C 520 34, 1020 38, 1344 278"
            stroke="url(#eksporRouteMint)"
            strokeWidth="2.2"
            strokeDasharray="8 12"
          />

          {/* Jalur Maritim Bawah: Pelabuhan Kiri -> Pelabuhan Kanan */}
          <path
            className="auth-route-flow-gold"
            d="M210 690 C 520 790, 1080 795, 1410 675"
            stroke="url(#eksporRouteGold)"
            strokeWidth="2"
            strokeDasharray="7 11"
          />
        </g>

        {/* Pesawat Kargo Udara Melintas Halus di Jalur Atas */}
        <g className="auth-cargo-plane">
          <g transform="translate(590 73) rotate(4)">
            <ellipse cx="0" cy="12" rx="18" ry="4" fill="#091626" fillOpacity="0.25" />
            <path
              d="M-16 0 L8 0 L15 -3 L19 0 L15 3 L8 2 L-2 11 L-7 11 L-2 2 L-13 2 L-17 6 L-20 6 L-17 0 L-20 -6 L-17 -6 L-13 -1 L-2 -1 L-7 -10 L-2 -10 L8 -1 Z"
              fill="#e2e8f0"
              fillOpacity="0.78"
            />
            <circle cx="11" cy="0" r="2" fill="#f59e0b" />
          </g>
        </g>

        {/* Titik Hub Pelabuhan Dunia & Label Kode Pelabuhan (Dark Glass agar Tidak Silau) */}
        {/* Hub 1: IDN · Tanjung Priok */}
        <g transform="translate(174 374)">
          <circle className="auth-port-ping" cx="0" cy="0" r="14" fill="#f59e0b" fillOpacity="0.34" />
          <circle cx="0" cy="0" r="5.5" fill="#f59e0b" stroke="#0f2942" strokeWidth="2" />
          <g transform="translate(-16 -36)">
            <rect x="0" y="0" width="134" height="22" rx="11" fill="#0d2137" fillOpacity="0.76" stroke="#3b6088" strokeOpacity="0.65" />
            <circle cx="11" cy="11" r="3.5" fill="#f59e0b" />
            <text x="20" y="14.5" fill="#e2e8f0" fontSize="9.5" fontWeight="700" fontFamily="Plus Jakarta Sans, sans-serif">
              IDN · TANJUNG PRIOK
            </text>
          </g>
        </g>

        {/* Hub 2: EUR · Rotterdam */}
        <g transform="translate(236 148)">
          <circle className="auth-port-ping auth-port-ping-delay" cx="0" cy="0" r="13" fill="#34d399" fillOpacity="0.32" />
          <circle cx="0" cy="0" r="5" fill="#34d399" stroke="#0f2942" strokeWidth="2" />
          <g transform="translate(-14 -34)">
            <rect x="0" y="0" width="118" height="22" rx="11" fill="#0d2137" fillOpacity="0.74" stroke="#3b6088" strokeOpacity="0.65" />
            <circle cx="11" cy="11" r="3.5" fill="#34d399" />
            <text x="20" y="14.5" fill="#e2e8f0" fontSize="9.5" fontWeight="700" fontFamily="Plus Jakarta Sans, sans-serif">
              NLD · ROTTERDAM
            </text>
          </g>
        </g>

        {/* Hub 3: USA · Los Angeles */}
        <g transform="translate(1368 152)">
          <circle className="auth-port-ping" cx="0" cy="0" r="13" fill="#f59e0b" fillOpacity="0.32" />
          <circle cx="0" cy="0" r="5" fill="#f59e0b" stroke="#0f2942" strokeWidth="2" />
          <g transform="translate(-108 -34)">
            <rect x="0" y="0" width="124" height="22" rx="11" fill="#0d2137" fillOpacity="0.74" stroke="#3b6088" strokeOpacity="0.65" />
            <circle cx="11" cy="11" r="3.5" fill="#f59e0b" />
            <text x="20" y="14.5" fill="#e2e8f0" fontSize="9.5" fontWeight="700" fontFamily="Plus Jakarta Sans, sans-serif">
              USA · LOS ANGELES
            </text>
          </g>
        </g>

        {/* Hub 4: JPN · Tokyo */}
        <g transform="translate(1344 278)">
          <circle className="auth-port-ping auth-port-ping-delay" cx="0" cy="0" r="13" fill="#34d399" fillOpacity="0.32" />
          <circle cx="0" cy="0" r="5" fill="#34d399" stroke="#0f2942" strokeWidth="2" />
          <g transform="translate(-82 12)">
            <rect x="0" y="0" width="102" height="22" rx="11" fill="#0d2137" fillOpacity="0.74" stroke="#3b6088" strokeOpacity="0.65" />
            <circle cx="11" cy="11" r="3.5" fill="#34d399" />
            <text x="20" y="14.5" fill="#e2e8f0" fontSize="9.5" fontWeight="700" fontFamily="Plus Jakarta Sans, sans-serif">
              JPN · TOKYO
            </text>
          </g>
        </g>

        {/* Siluet Pelabuhan Peti Kemas & Gantry Crane di Sisi Kiri */}
        <g opacity="0.58" transform="translate(26 510)">
          {/* Dermaga */}
          <rect x="0" y="258" width="290" height="16" rx="3" fill="#0c1d31" />
          {/* Tumpukan Kontainer di Dermaga */}
          <rect x="18" y="236" width="34" height="22" rx="2" fill="#0f2942" />
          <rect x="55" y="236" width="34" height="22" rx="2" fill="#d97706" />
          <rect x="36" y="212" width="34" height="22" rx="2" fill="#10b981" />
          <rect x="192" y="236" width="36" height="22" rx="2" fill="#1e4976" />
          <rect x="231" y="236" width="36" height="22" rx="2" fill="#d97706" />

          {/* Menara STS Gantry Crane Utama */}
          <path d="M96 258L112 78H146L162 258" stroke="#0e243d" strokeWidth="6" strokeLinejoin="round" />
          <line x1="102" y1="186" x2="156" y2="186" stroke="#0e243d" strokeWidth="4" />
          <line x1="107" y1="132" x2="151" y2="132" stroke="#0e243d" strokeWidth="4" />
          {/* Boom Lengan Crane */}
          <path d="M44 96H272L244 74H96L44 96Z" fill="#0e243d" />
          <line x1="128" y1="36" x2="252" y2="92" stroke="#0e243d" strokeWidth="2.5" />
          <line x1="128" y1="36" x2="64" y2="92" stroke="#0e243d" strokeWidth="2.5" />
          <rect x="122" y="32" width="12" height="46" fill="#0e243d" />

          {/* Trolley Kontainer Bergerak */}
          <g className="auth-crane-trolley">
            <rect x="196" y="96" width="18" height="7" rx="2" fill="#091626" />
            <line x1="201" y1="103" x2="201" y2="146" stroke="#cbd5e1" strokeOpacity="0.5" strokeWidth="1.8" />
            <line x1="209" y1="103" x2="209" y2="146" stroke="#cbd5e1" strokeOpacity="0.5" strokeWidth="1.8" />
            <rect x="186" y="146" width="38" height="22" rx="2.5" fill="#f59e0b" stroke="#091626" strokeWidth="1.8" />
          </g>
        </g>

        {/* Siluet Mercusuar & Terminal Pelabuhan Tujuan di Sisi Kanan */}
        <g opacity="0.52" transform="translate(1335 565)">
          <rect x="15" y="205" width="235" height="14" rx="3" fill="#0c1d31" />
          <rect x="42" y="183" width="36" height="22" rx="2" fill="#10b981" />
          <rect x="82" y="183" width="36" height="22" rx="2" fill="#163a5c" />
          <rect x="62" y="160" width="36" height="22" rx="2" fill="#d97706" />
          {/* Menara Suar Pelabuhan */}
          <path d="M188 205L195 106H211L218 205Z" fill="#0e243d" />
          <rect x="191" y="94" width="24" height="12" rx="3" fill="#f59e0b" />
          <path d="M191 100L95 66V122L191 104Z" fill="#fbbf24" fillOpacity="0.2" />
        </g>

        {/* Ombak Belakang */}
        <path
          className="auth-wave-slow"
          d="M-120 792 C 180 762, 420 818, 740 788 C 1060 758, 1340 816, 1720 784 L 1720 960 L -120 960 Z"
          fill="url(#eksporWaveBack)"
        />

        {/* Kapal Kontainer Jarak Jauh (Sisi Kanan Berlayar Halus) */}
        <g className="auth-ship-far" opacity="0.72">
          <g transform="translate(1285 758)">
            <rect x="26" y="12" width="24" height="12" rx="1.5" fill="#f59e0b" />
            <rect x="52" y="12" width="24" height="12" rx="1.5" fill="#10b981" />
            <rect x="78" y="12" width="24" height="12" rx="1.5" fill="#1e4976" />
            <rect x="40" y="0" width="24" height="12" rx="1.5" fill="#38bdf8" />
            <rect x="66" y="0" width="24" height="12" rx="1.5" fill="#f59e0b" />
            <rect x="108" y="4" width="22" height="20" rx="2" fill="#e2e8f0" stroke="#0f2942" strokeWidth="1.5" />
            <rect x="113" y="9" width="12" height="4" rx="1" fill="#0f2942" />
            <path d="M6 24H142L130 42H20L6 24Z" fill="url(#eksporHullNavy)" />
            <line x1="16" y1="35" x2="133" y2="35" stroke="#f59e0b" strokeWidth="2" />
          </g>
        </g>

        {/* Ombak Tengah */}
        <path
          className="auth-wave-mid"
          d="M-120 828 C 210 802, 530 854, 860 824 C 1190 794, 1450 848, 1720 820 L 1720 960 L -120 960 Z"
          fill="url(#eksporWaveMid)"
        />

        {/* Kapal Kontainer Utama EksporFlow (Berlayar di Jalur Depan Kiri) */}
        <g className="auth-ship-main" opacity="0.88">
          <g transform="translate(110 784)">
            {/* Anjungan Kapal */}
            <rect x="20" y="6" width="30" height="32" rx="3" fill="#e2e8f0" stroke="#091626" strokeWidth="2" />
            <rect x="26" y="12" width="18" height="6" rx="1.5" fill="#0f2942" />
            <rect x="28" y="-4" width="8" height="10" rx="1.5" fill="#f59e0b" />

            {/* Tumpukan Peti Kemas */}
            <rect x="56" y="22" width="34" height="16" rx="2" fill="#1e4976" stroke="#091626" strokeWidth="1.2" />
            <rect x="92" y="22" width="34" height="16" rx="2" fill="#f59e0b" stroke="#091626" strokeWidth="1.2" />
            <rect x="128" y="22" width="34" height="16" rx="2" fill="#10b981" stroke="#091626" strokeWidth="1.2" />
            <rect x="72" y="6" width="34" height="16" rx="2" fill="#34d399" stroke="#091626" strokeWidth="1.2" />
            <rect x="108" y="6" width="34" height="16" rx="2" fill="#f59e0b" stroke="#091626" strokeWidth="1.2" />

            {/* Lambung Kapal Maritim */}
            <path d="M6 38H192L172 64H20L6 38Z" fill="url(#eksporHullNavy)" />
            <path d="M16 54H179" stroke="#f59e0b" strokeWidth="2.8" />
            <circle cx="170" cy="46" r="2.5" fill="#f8fafc" />
            {/* Buih Haluan */}
            <path d="M0 64 Q 24 59, 48 64 T 96 64" stroke="#93c5fd" strokeOpacity="0.45" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        </g>

        {/* Ombak Depan */}
        <path
          className="auth-wave-fast"
          d="M-120 868 C 260 842, 610 894, 960 864 C 1280 838, 1510 886, 1720 862 L 1720 960 L -120 960 Z"
          fill="url(#eksporWaveFront)"
        />
      </svg>

      {/* Lapisan Kabut & Soft Blur untuk Memperkuat Kontras Kartu Form di Depannya */}
      <div className="auth-scene-veil" />
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

    try {
      const result = await loginMutation.mutateAsync({
        email: email.trim(),
        password,
      });

      if (result.status === "verification_required") {
        setEmail(result.email);
        setOtpDigits(["", "", "", "", "", ""]);
        setDevOtpHint(result.devOtpCode ?? null);
        switchStep("verify");
        toast("Verifikasi email diperlukan", {
          description: "Kami telah menerbitkan kode verifikasi 6 digit baru untuk akun Anda.",
        });
        return;
      }

      try {
        const url = new URL(window.location.href);
        url.searchParams.delete("auth");
        window.history.replaceState({}, "", url.toString());
      } catch {
        // Abaikan
      }

      toast.success(`Selamat datang, ${result.user?.name || "Pengguna"}!`);
      await onAuthenticated();
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
      toast.success("Email berhasil diverifikasi!", {
        description: `Workspace ${result.user.companyName || result.user.name || "EksporFlow"} siap digunakan.`,
      });
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
          <div className="auth-split-left-orb" aria-hidden="true" />

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
            <span className="auth-slide-counter mono-code">
              0{slideIndex + 1} / 0{SLIDES.length}
            </span>
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
                  key={activeSlide.id}
                  className="auth-split-copy-slide"
                  custom={slideDirection}
                  variants={SLIDE_VARIANTS}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span className="auth-slide-kicker">{activeSlide.badge}</span>
                  <h1>{activeSlide.title}</h1>
                  <p>{activeSlide.subtitle}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="auth-slide-footer">
              <div className="auth-slide-dots" role="tablist" aria-label="Sorotan fitur ekspor">
                {SLIDES.map((s, idx) => (
                  <button
                    key={s.id}
                    type="button"
                    role="tab"
                    aria-selected={slideIndex === idx}
                    aria-label={`Slide ${idx + 1}: ${s.title}`}
                    className={slideIndex === idx ? "active" : ""}
                    onClick={() => goToSlide(idx)}
                  />
                ))}
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

                <div className="auth-bottom-link">
                  <button type="button" onClick={() => switchStep("verify")}>
                    Punya kode verifikasi OTP? Verifikasi akun
                  </button>
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
                    Workspace baru dibuat bersih tanpa data contoh.
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
                    <button type="button" onClick={() => switchStep("register")}>
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
                      Kode testing lokal: <b className="mono-code">{devOtpHint}</b>
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
                  <button type="button" onClick={() => switchStep("login")}>
                    Kembali ke halaman Log In
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
