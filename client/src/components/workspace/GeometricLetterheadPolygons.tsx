import React from "react";
import { Globe, Phone, Mail } from "lucide-react";

export interface GeometricStyleDefinition {
  id:
    | "teal-slant"
    | "sidebar-strip"
    | "top-banner-slant"
    | "diagonal-frame"
    | "ribbon-divider"
    | "hexagon-badge";
  label: string;
  tagline: string;
  positionDesc: string;
  desc: string;
  primaryColor: string;
  secondaryColor: string;
}

export const GEOMETRIC_STYLES: GeometricStyleDefinition[] = [
  {
    id: "teal-slant",
    label: "Prisma Slant",
    tagline: "Sesuai PDF Canva Indico",
    positionDesc: "Sudut Kanan Atas & Kiri Bawah",
    desc: "Trapezoid miring elegan di sudut kanan atas dan kiri bawah",
    primaryColor: "#005f73",
    secondaryColor: "#0a9396",
  },
  {
    id: "sidebar-strip",
    label: "Sidebar Spine",
    tagline: "Bilah Vertikal Sisi Kiri",
    positionDesc: "Garis Kolom Kiri Penuh (Top-to-Bottom)",
    desc: "Bilah vertikal struktural di tepi kiri kertas dengan aksen gold",
    primaryColor: "#0f2942",
    secondaryColor: "#f59e0b",
  },
  {
    id: "top-banner-slant",
    label: "Horizon Banner",
    tagline: "Header Melintang Penuh",
    positionDesc: "Bilah Penuh Kiri-ke-Kanan Atas",
    desc: "Banner horizontal melintang penuh di bagian atas dokumen",
    primaryColor: "#1e3a8a",
    secondaryColor: "#06b6d4",
  },
  {
    id: "diagonal-frame",
    label: "Cross Diagonal",
    tagline: "Sudut Silang Kiri-Atas & Kanan-Bawah",
    positionDesc: "Sudut Kiri Atas & Kanan Bawah",
    desc: "Bingkai sudut diagonal silang (Kiri Atas & Kanan Bawah)",
    primaryColor: "#065f46",
    secondaryColor: "#10b981",
  },
  {
    id: "ribbon-divider",
    label: "Ribbon Divider",
    tagline: "Pita Pembatas Kop Melintang",
    positionDesc: "Pita Pembatas Horizontal Bawah Kop",
    desc: "Pita geometris chevron presisi tepat di bawah kop surat",
    primaryColor: "#334155",
    secondaryColor: "#e11d48",
  },
  {
    id: "hexagon-badge",
    label: "Hexagon Tech",
    tagline: "Kluster Heksagonal Sudut & Footer",
    positionDesc: "Kluster Heksagon Kanan Atas & Bawah Penuh",
    desc: "Susunan heksagon geometris modern di kanan atas & footer bar",
    primaryColor: "#1e293b",
    secondaryColor: "#4f46e5",
  },
];

// Helper to normalize legacy style IDs if drafts used previous names
export function normalizeGeometricStyle(raw?: string): GeometricStyleDefinition["id"] {
  if (!raw) return "teal-slant";
  if (raw === "navy-arrow") return "sidebar-strip";
  if (raw === "diagonal-split") return "top-banner-slant";
  if (raw === "minimal-blocks") return "diagonal-frame";
  if (raw === "creative-wave") return "hexagon-badge";
  if (raw === "modern-hex") return "hexagon-badge";
  const found = GEOMETRIC_STYLES.find((s) => s.id === raw);
  return found ? found.id : "teal-slant";
}

/**
 * Top & Body Geometric Decorations with diverse positional layouts
 */
export function GeometricTopDecorations({
  style = "teal-slant",
  color = "#005f73",
  docMargins,
}: {
  style?: string;
  color?: string;
  docMargins?: { top: number; bottom: number; left: number; right: number };
}) {
  const norm = normalizeGeometricStyle(style);

  // Model 1: "teal-slant" - Top-Right Slanted Polygon
  if (norm === "teal-slant") {
    return (
      <div
        className="pointer-events-none select-none absolute top-0 right-0 overflow-hidden z-0"
        style={{ width: "360px", height: "115px" }}
      >
        <svg viewBox="0 0 360 115" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="none">
          <polygon points="110,0 360,0 360,20 95,20" fill="#0ea5e9" opacity="0.3" />
          <polygon points="75,0 360,0 360,82 135,82" fill={color} />
          <polygon points="135,82 360,82 360,92 145,92" fill="#0a9396" />
        </svg>
      </div>
    );
  }

  // Model 2: "sidebar-strip" - Vertical Full-Height Left Spine + Top Notch
  if (norm === "sidebar-strip") {
    return (
      <>
        {/* Full-Height Left Spine with tiered geometric notches */}
        <div
          className="pointer-events-none select-none absolute top-0 left-0 bottom-0 overflow-hidden z-0"
          style={{ width: "24px" }}
        >
          <svg viewBox="0 0 24 1000" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="none">
            {/* Primary vertical spine */}
            <rect x="0" y="0" width="16" height="1000" fill={color} />
            {/* Secondary accent edge */}
            <rect x="16" y="0" width="4" height="1000" fill="#f59e0b" />
            <rect x="20" y="0" width="3" height="1000" fill="#2563eb" opacity="0.6" />
            {/* Dynamic geometric angle cuts at top */}
            <polygon points="0,0 24,0 0,60" fill="#f59e0b" opacity="0.9" />
            {/* Decorative notch at 30% */}
            <polygon points="16,300 24,320 16,340" fill="#f59e0b" />
            <polygon points="16,650 24,670 16,690" fill="#f59e0b" />
          </svg>
        </div>
        {/* Subtle Top-Left Corner Brand Notch */}
        <div
          className="pointer-events-none select-none absolute top-0 left-0 overflow-hidden z-0"
          style={{ width: "130px", height: "18px" }}
        >
          <svg viewBox="0 0 130 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="none">
            <polygon points="0,0 130,0 100,18 0,18" fill={color} opacity="0.15" />
            <polygon points="0,0 110,0 90,14 0,14" fill={color} />
            <polygon points="90,14 110,0 116,0 94,14" fill="#f59e0b" />
          </svg>
        </div>
      </>
    );
  }

  // Model 3: "top-banner-slant" - Full-Width Edge-to-Edge Top Horizontal Slanted Banner
  if (norm === "top-banner-slant") {
    return (
      <div
        className="pointer-events-none select-none absolute top-0 left-0 right-0 overflow-hidden z-0"
        style={{ height: "64px" }}
      >
        <svg viewBox="0 0 800 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="none">
          {/* Main bold slanted header band */}
          <polygon points="0,0 800,0 800,42 480,42 420,64 0,64" fill={color} />
          {/* Contrast Cyan / Teal Accent Polygon */}
          <polygon points="480,42 800,42 800,56 460,56 438,64 420,64" fill="#06b6d4" />
          {/* Top subtle highlight line */}
          <rect x="0" y="0" width="800" height="4" fill="#38bdf8" opacity="0.6" />
        </svg>
      </div>
    );
  }

  // Model 4: "diagonal-frame" - Top-Left Sharp Geometric Wedge (Opposite Corner from Slant!)
  if (norm === "diagonal-frame") {
    return (
      <div
        className="pointer-events-none select-none absolute top-0 left-0 overflow-hidden z-0"
        style={{ width: "300px", height: "95px" }}
      >
        <svg viewBox="0 0 300 95" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="none">
          {/* Backing accent */}
          <polygon points="0,0 280,0 220,40 0,40" fill="#10b981" opacity="0.25" />
          {/* Main Top-Left Deep Wedge */}
          <polygon points="0,0 230,0 120,95 0,95" fill={color} />
          {/* Mint Contrast Line */}
          <polygon points="230,0 245,0 135,95 120,95" fill="#10b981" />
          <polygon points="0,85 120,85 110,95 0,95" fill="#84cc16" opacity="0.8" />
        </svg>
      </div>
    );
  }

  // Model 5: "ribbon-divider" - Sleek Architectural Header Accents
  if (norm === "ribbon-divider") {
    return (
      <>
        {/* Top-Right Micro Block */}
        <div
          className="pointer-events-none select-none absolute top-0 right-0 overflow-hidden z-0"
          style={{ width: "200px", height: "45px" }}
        >
          <svg viewBox="0 0 200 45" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="none">
            <rect x="40" y="0" width="160" height="24" fill={color} />
            <rect x="0" y="0" width="30" height="24" fill="#e11d48" />
            <polygon points="40,24 200,24 180,45 20,45" fill={color} opacity="0.3" />
            <rect x="40" y="22" width="160" height="3" fill="#e11d48" />
          </svg>
        </div>
      </>
    );
  }

  // Model 6: "hexagon-badge" - Futuristic Floating Hexagons at Top-Right
  if (norm === "hexagon-badge") {
    return (
      <div
        className="pointer-events-none select-none absolute top-0 right-0 overflow-hidden z-0"
        style={{ width: "320px", height: "110px" }}
      >
        <svg viewBox="0 0 320 110" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="none">
          {/* Main angled facet */}
          <polygon points="90,0 320,0 320,95 180,95 135,50" fill={color} />
          {/* Hexagonal facet 1 */}
          <polygon points="40,10 75,10 95,35 75,60 40,60 20,35" fill="#4f46e5" opacity="0.85" />
          {/* Hexagonal facet 2 */}
          <polygon points="105,45 140,45 160,70 140,95 105,95 85,70" fill="#06b6d4" opacity="0.75" />
          {/* Cyan edge */}
          <polygon points="180,95 320,95 320,102 188,102" fill="#38bdf8" />
        </svg>
      </div>
    );
  }

  return null;
}

/**
 * Dedicated Horizontal Chevron Divider for Model 5 (Ribbon Divider)
 */
export function GeometricRibbonStrip({ color = "#334155" }: { color?: string }) {
  return (
    <div className="w-full my-2 overflow-hidden select-none pointer-events-none" style={{ height: "12px" }}>
      <svg viewBox="0 0 800 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="none">
        {/* Main horizontal bar */}
        <polygon points="0,0 720,0 705,12 0,12" fill={color} />
        {/* Interlocking chevron 1 */}
        <polygon points="725,0 755,0 740,12 710,12" fill="#e11d48" />
        {/* Interlocking chevron 2 */}
        <polygon points="760,0 790,0 775,12 745,12" fill={color} opacity="0.8" />
        {/* Accent end */}
        <polygon points="795,0 800,0 800,12 780,12" fill="#e11d48" />
      </svg>
    </div>
  );
}

/**
 * Footer Geometric Decorations & Adaptive Clean Contact Info
 */
export function GeometricFooterDecorations({
  style = "teal-slant",
  color = "#005f73",
  docMargins,
  tel,
  email,
  web,
}: {
  style?: string;
  color?: string;
  docMargins?: { top: number; bottom: number; left: number; right: number };
  tel: string;
  email: string;
  web: string;
}) {
  const norm = normalizeGeometricStyle(style);

  // Model 1: "teal-slant" - Bottom-Left Polygon + Right-Aligned Contact Pillars
  if (norm === "teal-slant") {
    return (
      <div className="relative pt-4 pb-1">
        <div
          className="pointer-events-none select-none absolute bottom-0 left-0 overflow-hidden z-0"
          style={
            docMargins
              ? {
                  marginBottom: `-${docMargins.bottom}mm`,
                  marginLeft: `-${docMargins.left}mm`,
                  width: "330px",
                  height: "95px",
                }
              : { width: "330px", height: "95px" }
          }
        >
          <svg viewBox="0 0 330 95" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="none">
            <polygon points="0,26 190,26 245,95 0,95" fill={color} />
            <polygon points="0,18 180,18 190,26 0,26" fill="#0a9396" />
            <polygon points="190,26 210,26 260,95 245,95" fill="#2dd4bf" opacity="0.85" />
          </svg>
        </div>
        {/* Right-Aligned Contact Information Pillars */}
        <div className="relative z-10 flex flex-wrap items-center justify-end gap-x-5 gap-y-1 text-[8.5pt] text-slate-700 font-medium py-1">
          <div className="flex items-center gap-1.5">
            <Globe size={13} style={{ color }} />
            <span>{web}</span>
          </div>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-1.5">
            <Phone size={13} style={{ color }} />
            <span>{tel}</span>
          </div>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-1.5">
            <Mail size={13} style={{ color }} />
            <span>{email}</span>
          </div>
        </div>
      </div>
    );
  }

  // Model 2: "sidebar-strip" - Bottom-Right Modern Accent Bar + Right-Aligned Contact
  if (norm === "sidebar-strip") {
    return (
      <div className="relative pt-4 pb-1">
        {/* Bottom-Right Clean Angled Cap */}
        <div
          className="pointer-events-none select-none absolute bottom-0 right-0 overflow-hidden z-0"
          style={
            docMargins
              ? {
                  marginBottom: `-${docMargins.bottom}mm`,
                  marginRight: `-${docMargins.right}mm`,
                  width: "280px",
                  height: "28px",
                }
              : { width: "280px", height: "28px" }
          }
        >
          <svg viewBox="0 0 280 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="none">
            <polygon points="40,0 280,0 280,28 0,28" fill={color} opacity="0.12" />
            <polygon points="60,10 280,10 280,28 20,28" fill={color} />
            <polygon points="50,10 60,10 20,28 10,28" fill="#f59e0b" />
          </svg>
        </div>
        {/* Right-Aligned Clean Line */}
        <div className="relative z-10 flex flex-wrap items-center justify-end gap-x-5 gap-y-1 text-[8.5pt] text-slate-700 font-medium py-1 pr-6">
          <div className="flex items-center gap-1.5">
            <Globe size={13} style={{ color }} />
            <span>{web}</span>
          </div>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-1.5">
            <Phone size={13} style={{ color }} />
            <span>{tel}</span>
          </div>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-1.5">
            <Mail size={13} style={{ color }} />
            <span>{email}</span>
          </div>
        </div>
      </div>
    );
  }

  // Model 3: "top-banner-slant" - Full-Width Horizon Stripe + Centered Clean Badge Bar
  if (norm === "top-banner-slant") {
    return (
      <div className="relative pt-4 pb-1">
        <div
          className="pointer-events-none select-none absolute bottom-0 left-0 right-0 overflow-hidden z-0"
          style={
            docMargins
              ? {
                  marginBottom: `-${docMargins.bottom}mm`,
                  marginLeft: `-${docMargins.left}mm`,
                  marginRight: `-${docMargins.right}mm`,
                  height: "14px",
                }
              : { height: "14px" }
          }
        >
          <svg viewBox="0 0 800 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="none">
            <rect x="0" y="4" width="800" height="10" fill={color} />
            <polygon points="0,0 350,0 320,14 0,14" fill="#06b6d4" />
          </svg>
        </div>
        {/* Centered Modern Contact Pills */}
        <div className="relative z-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-[8.5pt] text-slate-700 font-medium py-1">
          <div className="flex items-center gap-1.5 bg-slate-100/90 px-2.5 py-0.5 rounded-full border border-slate-200">
            <Globe size={12} style={{ color }} />
            <span>{web}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-100/90 px-2.5 py-0.5 rounded-full border border-slate-200">
            <Phone size={12} style={{ color }} />
            <span>{tel}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-100/90 px-2.5 py-0.5 rounded-full border border-slate-200">
            <Mail size={12} style={{ color }} />
            <span>{email}</span>
          </div>
        </div>
      </div>
    );
  }

  // Model 4: "diagonal-frame" - Bottom-Right Wedge (Cross-Diagonal) + Left-Aligned Contact Info
  if (norm === "diagonal-frame") {
    return (
      <div className="relative pt-4 pb-1">
        {/* Bottom-Right Cross-Diagonal Wedge */}
        <div
          className="pointer-events-none select-none absolute bottom-0 right-0 overflow-hidden z-0"
          style={
            docMargins
              ? {
                  marginBottom: `-${docMargins.bottom}mm`,
                  marginRight: `-${docMargins.right}mm`,
                  width: "320px",
                  height: "90px",
                }
              : { width: "320px", height: "90px" }
          }
        >
          <svg viewBox="0 0 320 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="none">
            <polygon points="120,90 320,0 320,90" fill={color} />
            <polygon points="90,90 320,0 320,14 110,90" fill="#10b981" />
            <polygon points="60,90 320,14 320,24 80,90" fill="#84cc16" opacity="0.6" />
          </svg>
        </div>
        {/* Left-Aligned Contact Pillars (To avoid colliding with bottom-right shape!) */}
        <div className="relative z-10 flex flex-wrap items-center justify-start gap-x-5 gap-y-1 text-[8.5pt] text-slate-700 font-medium py-1 pl-1">
          <div className="flex items-center gap-1.5">
            <Globe size={13} style={{ color }} />
            <span>{web}</span>
          </div>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-1.5">
            <Phone size={13} style={{ color }} />
            <span>{tel}</span>
          </div>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-1.5">
            <Mail size={13} style={{ color }} />
            <span>{email}</span>
          </div>
        </div>
      </div>
    );
  }

  // Model 5: "ribbon-divider" - Centered Structural Footer Bar + Centered Contact
  if (norm === "ribbon-divider") {
    return (
      <div className="relative pt-4 pb-1">
        <div
          className="pointer-events-none select-none absolute bottom-0 left-1/4 right-1/4 overflow-hidden z-0"
          style={{ height: "6px" }}
        >
          <svg viewBox="0 0 400 6" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="none">
            <rect x="0" y="0" width="340" height="6" fill={color} />
            <rect x="345" y="0" width="55" height="6" fill="#e11d48" />
          </svg>
        </div>
        {/* Clean Centered Contact Info */}
        <div className="relative z-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-[8.5pt] text-slate-700 font-medium py-1">
          <div className="flex items-center gap-1.5">
            <Globe size={13} style={{ color }} />
            <span>{web}</span>
          </div>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-1.5">
            <Phone size={13} style={{ color }} />
            <span>{tel}</span>
          </div>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-1.5">
            <Mail size={13} style={{ color }} />
            <span>{email}</span>
          </div>
        </div>
      </div>
    );
  }

  // Model 6: "hexagon-badge" - Full Footer Strip with Corner Brackets + Right-Aligned Contact
  if (norm === "hexagon-badge") {
    return (
      <div className="relative pt-4 pb-1">
        <div
          className="pointer-events-none select-none absolute bottom-0 left-0 right-0 overflow-hidden z-0"
          style={
            docMargins
              ? {
                  marginBottom: `-${docMargins.bottom}mm`,
                  marginLeft: `-${docMargins.left}mm`,
                  marginRight: `-${docMargins.right}mm`,
                  height: "22px",
                }
              : { height: "22px" }
          }
        >
          <svg viewBox="0 0 800 22" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="none">
            <polygon points="0,6 200,6 230,22 0,22" fill="#4f46e5" opacity="0.8" />
            <polygon points="200,6 800,6 800,22 230,22" fill={color} />
            <polygon points="0,0 30,0 20,6 0,6" fill="#06b6d4" />
          </svg>
        </div>
        {/* Right-Aligned Contact */}
        <div className="relative z-10 flex flex-wrap items-center justify-end gap-x-5 gap-y-1 text-[8.5pt] text-white font-medium py-0.5 pr-4">
          <div className="flex items-center gap-1.5">
            <Globe size={12} className="text-cyan-300" />
            <span>{web}</span>
          </div>
          <span className="text-slate-400">•</span>
          <div className="flex items-center gap-1.5">
            <Phone size={12} className="text-cyan-300" />
            <span>{tel}</span>
          </div>
          <span className="text-slate-400">•</span>
          <div className="flex items-center gap-1.5">
            <Mail size={12} className="text-cyan-300" />
            <span>{email}</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

/**
 * Visual Thumbnail Preview for the Ribbon Popover that clearly shows the DIFFERENT positions
 */
export function GeometricThumbnailPreview({
  style = "teal-slant",
  color = "#005f73",
}: {
  style?: string;
  color?: string;
}) {
  const norm = normalizeGeometricStyle(style);

  return (
    <div className="w-full h-12 bg-white border border-slate-200 rounded relative overflow-hidden flex flex-col justify-between p-1 select-none shadow-xs">
      {/* 1. Teal Slant: Top-Right & Bottom-Left */}
      {norm === "teal-slant" && (
        <>
          <div className="absolute top-0 right-0 w-16 h-6 pointer-events-none">
            <svg viewBox="0 0 64 24" fill="none" className="w-full h-full" preserveAspectRatio="none">
              <polygon points="15,0 64,0 64,20 28,20" fill={color} />
              <polygon points="28,20 64,20 64,24 32,24" fill="#0a9396" />
            </svg>
          </div>
          <div className="absolute bottom-0 left-0 w-14 h-5 pointer-events-none">
            <svg viewBox="0 0 56 20" fill="none" className="w-full h-full" preserveAspectRatio="none">
              <polygon points="0,5 35,5 45,20 0,20" fill={color} />
              <polygon points="0,3 32,3 35,5 0,5" fill="#0a9396" />
            </svg>
          </div>
        </>
      )}

      {/* 2. Sidebar Strip: Full-Height Left Spine */}
      {norm === "sidebar-strip" && (
        <>
          <div className="absolute top-0 left-0 bottom-0 w-3 bg-amber-500 pointer-events-none flex">
            <div className="w-2 h-full" style={{ backgroundColor: color }} />
          </div>
          <div className="absolute bottom-0 right-0 w-12 h-2.5 pointer-events-none">
            <svg viewBox="0 0 48 10" fill="none" className="w-full h-full" preserveAspectRatio="none">
              <polygon points="8,0 48,0 48,10 0,10" fill={color} />
            </svg>
          </div>
        </>
      )}

      {/* 3. Horizon Banner: Full-Width Top Bar */}
      {norm === "top-banner-slant" && (
        <>
          <div className="absolute top-0 left-0 right-0 h-3.5 pointer-events-none">
            <svg viewBox="0 0 100 14" fill="none" className="w-full h-full" preserveAspectRatio="none">
              <polygon points="0,0 100,0 100,10 65,10 55,14 0,14" fill={color} />
              <polygon points="65,10 100,10 100,14 55,14" fill="#06b6d4" />
            </svg>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-cyan-500" style={{ backgroundColor: color }} />
        </>
      )}

      {/* 4. Diagonal Frame: Top-Left & Bottom-Right */}
      {norm === "diagonal-frame" && (
        <>
          <div className="absolute top-0 left-0 w-14 h-6 pointer-events-none">
            <svg viewBox="0 0 56 24" fill="none" className="w-full h-full" preserveAspectRatio="none">
              <polygon points="0,0 45,0 20,24 0,24" fill={color} />
              <polygon points="45,0 48,0 23,24 20,24" fill="#10b981" />
            </svg>
          </div>
          <div className="absolute bottom-0 right-0 w-14 h-6 pointer-events-none">
            <svg viewBox="0 0 56 24" fill="none" className="w-full h-full" preserveAspectRatio="none">
              <polygon points="20,24 56,0 56,24" fill={color} />
              <polygon points="15,24 56,0 56,4 18,24" fill="#10b981" />
            </svg>
          </div>
        </>
      )}

      {/* 5. Ribbon Divider: Under-Header Horizontal Ribbon */}
      {norm === "ribbon-divider" && (
        <>
          <div className="absolute top-0 right-0 w-10 h-2 bg-rose-600" style={{ backgroundColor: color }} />
          <div className="absolute top-5 left-1 right-1 h-1.5 pointer-events-none">
            <svg viewBox="0 0 80 6" fill="none" className="w-full h-full" preserveAspectRatio="none">
              <polygon points="0,0 65,0 60,6 0,6" fill={color} />
              <polygon points="66,0 75,0 70,6 61,6" fill="#e11d48" />
            </svg>
          </div>
          <div className="absolute bottom-0.5 left-6 right-6 h-1 bg-slate-600 rounded-full" />
        </>
      )}

      {/* 6. Hexagon Badge: Top-Right Hexagon & Full Footer Strip */}
      {norm === "hexagon-badge" && (
        <>
          <div className="absolute top-0 right-0 w-14 h-6 pointer-events-none">
            <svg viewBox="0 0 56 24" fill="none" className="w-full h-full" preserveAspectRatio="none">
              <polygon points="15,0 56,0 56,20 30,20" fill={color} />
              <polygon points="8,3 15,3 18,8 15,13 8,13 5,8" fill="#4f46e5" />
            </svg>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-2.5 bg-indigo-900 pointer-events-none flex">
            <div className="w-5 h-full bg-cyan-400" />
            <div className="flex-1 h-full" style={{ backgroundColor: color }} />
          </div>
        </>
      )}

      {/* Internal Mock Content (Simulating document lines) */}
      <div className={`relative z-10 flex items-center gap-1 ${norm === "sidebar-strip" ? "pl-3.5" : norm === "top-banner-slant" ? "pt-2" : ""}`}>
        <div className="w-2.5 h-2.5 rounded-full bg-slate-300 shrink-0" />
        <div className="space-y-0.5">
          <div className="w-8 h-1 bg-slate-700 rounded-xs" />
          <div className="w-5 h-0.5 bg-slate-400 rounded-xs" />
        </div>
      </div>
    </div>
  );
}
