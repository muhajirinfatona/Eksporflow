import React from "react";
import { Globe, Phone, Mail } from "lucide-react";

export interface GeometricStyleDefinition {
  id: string;
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
    tagline: "Format Geometris Korporat",
    positionDesc: "Sudut Kanan Atas & Kiri Bawah",
    desc: "Trapezoid miring toska & cyan elegan dengan logo bersih di kiri",
    primaryColor: "#005f73",
    secondaryColor: "#0a9396",
  },
  {
    id: "sidebar-spine",
    label: "Sidebar Spine",
    tagline: "Kolom Vertikal Sisi Kiri",
    positionDesc: "Bilah Kolom Kiri Penuh + Kanan Bawah",
    desc: "Bilah vertikal arsitektural tepi kiri dengan aksen emas & navy",
    primaryColor: "#0f2942",
    secondaryColor: "#f59e0b",
  },
  {
    id: "horizon-banner",
    label: "Horizon Banner",
    tagline: "Header Melintang Penuh",
    positionDesc: "Bilah Penuh Melintang Atas + Baris Garis Bawah",
    desc: "Banner horizontal melintang di atas dengan potongan sudut dinamis",
    primaryColor: "#1e3a8a",
    secondaryColor: "#06b6d4",
  },
  {
    id: "angled-badge",
    label: "Angled Badge",
    tagline: "Plakat Sudut Eksekutif",
    positionDesc: "Plakat Kanan Atas & Kiri Bawah",
    desc: "Plakat miring bertingkat di kanan atas selaras dengan judul dokumen",
    primaryColor: "#065f46",
    secondaryColor: "#10b981",
  },
  {
    id: "chevron-ribbon",
    label: "Chevron Ribbon",
    tagline: "Pita Pembatas Logistik",
    positionDesc: "Pita Chevron Melintang di Bawah Kop",
    desc: "Pita geometris chevron presisi tepat di bawah kop surat",
    primaryColor: "#0284c7",
    secondaryColor: "#f97316",
  },
  {
    id: "hexagon-tech",
    label: "Hexagon Tech",
    tagline: "Komoditas & Teknologi",
    positionDesc: "Kluster Heksagonal Kanan Atas & Full Footer Bar",
    desc: "Susunan heksagon geometris sarang lebah modern & footer bar",
    primaryColor: "#1e293b",
    secondaryColor: "#4f46e5",
  },
  {
    id: "nordic-blocks",
    label: "Nordic Blocks",
    tagline: "Bauhaus Studio Modern",
    positionDesc: "Blok Modular Kanan Atas & Kiri Bawah",
    desc: "Blok arsitektural bertingkat grafit & terracotta coral",
    primaryColor: "#334155",
    secondaryColor: "#e11d48",
  },
  {
    id: "speed-stripes",
    label: "Dynamic Stripes",
    tagline: "Garis Cepat Ekspor Global",
    positionDesc: "Garis Miring Dinamis Kanan Atas & Kiri Bawah",
    desc: "Garis dinamis miring melambangkan kecepatan logistik & perdagangan",
    primaryColor: "#0f766e",
    secondaryColor: "#eab308",
  },
  {
    id: "corner-bracket",
    label: "Corner Frame",
    tagline: "Bingkai Siku Studio",
    positionDesc: "Siku Geometris Kanan Atas & Kiri Bawah",
    desc: "Bingkai sudut modern minimalis presisi tinggi",
    primaryColor: "#4338ca",
    secondaryColor: "#a855f7",
  },
  {
    id: "diagonal-slash",
    label: "Diagonal Slash",
    tagline: "Potongan Diagonal Tajam",
    positionDesc: "Potongan Sudut Kanan Atas & Kiri Bawah",
    desc: "Potongan diagonal tegas dengan strip emas pinstripe mewah",
    primaryColor: "#831843",
    secondaryColor: "#f43f5e",
  },
  {
    id: "origami-facet",
    label: "Origami Facets",
    tagline: "Prisma Multi-Dimensi",
    positionDesc: "Faset Poligon Kanan Atas & Kiri Bawah",
    desc: "Segitiga poligon multi-dimensi toska, mint & lime",
    primaryColor: "#044e54",
    secondaryColor: "#14b8a6",
  },
  {
    id: "minimal-crest",
    label: "Minimalist Crest",
    tagline: "Garis Presisi Eksekutif",
    positionDesc: "Garis Geometris Presisi Atas & Bawah",
    desc: "Garis ganda ultra-tipis dengan aksen diamond karbon modern",
    primaryColor: "#18181b",
    secondaryColor: "#71717a",
  },
];

export function normalizeGeometricStyle(raw?: string): string {
  if (!raw) return "teal-slant";
  // Map legacy IDs to canonical IDs
  if (raw === "sidebar-strip" || raw === "navy-arrow") return "sidebar-spine";
  if (raw === "top-banner-slant" || raw === "diagonal-split") return "horizon-banner";
  if (raw === "diagonal-frame" || raw === "minimal-blocks") return "angled-badge";
  if (raw === "ribbon-divider") return "chevron-ribbon";
  if (raw === "creative-wave" || raw === "modern-hex") return "hexagon-tech";
  const found = GEOMETRIC_STYLES.find((s) => s.id === raw);
  return found ? found.id : "teal-slant";
}

/**
 * Top & Body Geometric Decorations
 * Safe-zone designed: Logo on top-left is NEVER intersected or covered!
 */
export function GeometricTopDecorations({
  style = "teal-slant",
  color = "#005f73",
}: {
  style?: string;
  color?: string;
  docMargins?: { top: number; bottom: number; left: number; right: number };
}) {
  const norm = normalizeGeometricStyle(style);

  // 1. Prisma Slant: Top-Right Slant
  if (norm === "teal-slant") {
    return (
      <div className="pointer-events-none select-none absolute top-0 right-0 overflow-hidden z-0" style={{ width: "360px", height: "115px" }}>
        <svg viewBox="0 0 360 115" fill="none" className="w-full h-full" preserveAspectRatio="none">
          <polygon points="110,0 360,0 360,20 95,20" fill="#0ea5e9" opacity="0.3" />
          <polygon points="75,0 360,0 360,82 135,82" fill={color} />
          <polygon points="135,82 360,82 360,92 145,92" fill="#0a9396" />
        </svg>
      </div>
    );
  }

  // 2. Sidebar Spine: Vertical Left Edge (Leaves logo completely unblocked with 20px padding)
  if (norm === "sidebar-spine") {
    return (
      <div className="pointer-events-none select-none absolute top-0 left-0 bottom-0 overflow-hidden z-0" style={{ width: "18px" }}>
        <svg viewBox="0 0 18 1000" fill="none" className="w-full h-full" preserveAspectRatio="none">
          <rect x="0" y="0" width="12" height="1000" fill={color} />
          <rect x="12" y="0" width="3" height="1000" fill="#f59e0b" />
          <rect x="15" y="0" width="3" height="1000" fill="#2563eb" opacity="0.6" />
          <polygon points="0,0 18,0 0,40" fill="#f59e0b" />
        </svg>
      </div>
    );
  }

  // 3. Horizon Banner: Full-Width Top Bar (Above logo with safe clearance)
  if (norm === "horizon-banner") {
    return (
      <div className="pointer-events-none select-none absolute top-0 left-0 right-0 overflow-hidden z-0" style={{ height: "46px" }}>
        <svg viewBox="0 0 800 46" fill="none" className="w-full h-full" preserveAspectRatio="none">
          <polygon points="0,0 800,0 800,32 500,32 460,46 0,46" fill={color} />
          <polygon points="500,32 800,32 800,42 475,42 460,46" fill="#06b6d4" />
          <rect x="0" y="0" width="800" height="3" fill="#38bdf8" opacity="0.7" />
        </svg>
      </div>
    );
  }

  // 4. Angled Badge: Top-Right Badge Frame
  if (norm === "angled-badge") {
    return (
      <div className="pointer-events-none select-none absolute top-0 right-0 overflow-hidden z-0" style={{ width: "290px", height: "85px" }}>
        <svg viewBox="0 0 290 85" fill="none" className="w-full h-full" preserveAspectRatio="none">
          <polygon points="50,0 290,0 290,20 30,20" fill="#10b981" opacity="0.3" />
          <polygon points="40,0 290,0 290,70 90,70" fill={color} />
          <polygon points="90,70 290,70 290,78 100,78" fill="#10b981" />
        </svg>
      </div>
    );
  }

  // 5. Chevron Ribbon: Clean Top-Right Notch
  if (norm === "chevron-ribbon") {
    return (
      <div className="pointer-events-none select-none absolute top-0 right-0 overflow-hidden z-0" style={{ width: "220px", height: "40px" }}>
        <svg viewBox="0 0 220 40" fill="none" className="w-full h-full" preserveAspectRatio="none">
          <polygon points="40,0 220,0 220,28 10,28" fill={color} />
          <polygon points="10,28 220,28 220,34 0,34" fill="#f97316" />
        </svg>
      </div>
    );
  }

  // 6. Hexagon Tech: Top-Right Hexagon Cluster
  if (norm === "hexagon-badge") {
    return (
      <div className="pointer-events-none select-none absolute top-0 right-0 overflow-hidden z-0" style={{ width: "320px", height: "105px" }}>
        <svg viewBox="0 0 320 105" fill="none" className="w-full h-full" preserveAspectRatio="none">
          <polygon points="90,0 320,0 320,90 180,90 135,45" fill={color} />
          <polygon points="40,10 75,10 95,35 75,60 40,60 20,35" fill="#4f46e5" opacity="0.85" />
          <polygon points="105,45 140,45 160,70 140,95 105,95 85,70" fill="#06b6d4" opacity="0.75" />
          <polygon points="180,90 320,90 320,97 188,97" fill="#38bdf8" />
        </svg>
      </div>
    );
  }

  // 7. Nordic Blocks: Stepped Rectangles at Top-Right
  if (norm === "nordic-blocks") {
    return (
      <div className="pointer-events-none select-none absolute top-0 right-0 overflow-hidden z-0" style={{ width: "300px", height: "95px" }}>
        <svg viewBox="0 0 300 95" fill="none" className="w-full h-full" preserveAspectRatio="none">
          <rect x="80" y="0" width="220" height="65" fill={color} />
          <rect x="140" y="65" width="160" height="18" fill={color} opacity="0.75" />
          <rect x="50" y="0" width="25" height="35" fill="#e11d48" />
          <rect x="80" y="62" width="220" height="3" fill="#fb7185" />
        </svg>
      </div>
    );
  }

  // 8. Dynamic Speed Stripes: Angled Multi-Stripe at Top-Right
  if (norm === "speed-stripes") {
    return (
      <div className="pointer-events-none select-none absolute top-0 right-0 overflow-hidden z-0" style={{ width: "320px", height: "85px" }}>
        <svg viewBox="0 0 320 85" fill="none" className="w-full h-full" preserveAspectRatio="none">
          <polygon points="60,0 120,0 40,85 -20,85" fill="#eab308" opacity="0.85" />
          <polygon points="135,0 175,0 95,85 55,85" fill="#0d9488" opacity="0.75" />
          <polygon points="190,0 320,0 320,85 110,85" fill={color} />
          <polygon points="110,85 320,85 320,90 115,90" fill="#eab308" />
        </svg>
      </div>
    );
  }

  // 9. Corner Bracket: Sharp Modern L-Bracket at Top-Right
  if (norm === "corner-bracket") {
    return (
      <div className="pointer-events-none select-none absolute top-0 right-0 overflow-hidden z-0" style={{ width: "260px", height: "90px" }}>
        <svg viewBox="0 0 260 90" fill="none" className="w-full h-full" preserveAspectRatio="none">
          <polygon points="0,0 260,0 260,18 20,18" fill={color} />
          <polygon points="242,18 260,18 260,90 242,90" fill={color} />
          <rect x="226" y="24" width="12" height="12" fill="#a855f7" />
          <line x1="20" y1="24" x2="215" y2="24" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="3 3" />
        </svg>
      </div>
    );
  }

  // 10. Diagonal Slash: High-Impact Angular Slash at Top-Right
  if (norm === "diagonal-slash") {
    return (
      <div className="pointer-events-none select-none absolute top-0 right-0 overflow-hidden z-0" style={{ width: "340px", height: "105px" }}>
        <svg viewBox="0 0 340 105" fill="none" className="w-full h-full" preserveAspectRatio="none">
          <polygon points="40,0 340,0 340,88 115,0" fill={color} />
          <polygon points="115,0 340,88 340,94 107,0" fill="#f43f5e" />
          <polygon points="20,0 35,0 95,94 80,94" fill={color} opacity="0.4" />
        </svg>
      </div>
    );
  }

  // 11. Origami Facets: Faceted Multi-Triangle Mesh at Top-Right
  if (norm === "origami-facet") {
    return (
      <div className="pointer-events-none select-none absolute top-0 right-0 overflow-hidden z-0" style={{ width: "340px", height: "105px" }}>
        <svg viewBox="0 0 340 105" fill="none" className="w-full h-full" preserveAspectRatio="none">
          <polygon points="100,0 230,0 170,75" fill={color} opacity="0.85" />
          <polygon points="230,0 340,0 340,85 170,75" fill={color} />
          <polygon points="45,0 100,0 170,75 115,75" fill="#14b8a6" opacity="0.9" />
          <polygon points="115,75 170,75 190,92 135,92" fill="#84cc16" />
          <polygon points="170,75 340,85 340,92 190,92" fill="#06b6d4" />
        </svg>
      </div>
    );
  }

  // 12. Minimalist Crest: Ultra-Fine Precision Double Line with Diamond at Top-Right
  if (norm === "minimal-crest") {
    return (
      <div className="pointer-events-none select-none absolute top-0 right-0 overflow-hidden z-0" style={{ width: "260px", height: "45px" }}>
        <svg viewBox="0 0 260 45" fill="none" className="w-full h-full" preserveAspectRatio="none">
          <line x1="10" y1="12" x2="260" y2="12" stroke={color} strokeWidth="1.5" />
          <line x1="40" y1="17" x2="260" y2="17" stroke="#71717a" strokeWidth="0.8" />
          <polygon points="25,12 30,7 35,12 30,17" fill={color} />
        </svg>
      </div>
    );
  }

  return null;
}

/**
 * Chevron Ribbon Strip for Model 5
 */
export function GeometricRibbonStrip({ color = "#0284c7" }: { color?: string }) {
  return (
    <div className="w-full my-2 overflow-hidden select-none pointer-events-none" style={{ height: "10px" }}>
      <svg viewBox="0 0 800 10" fill="none" className="w-full h-full" preserveAspectRatio="none">
        <polygon points="0,0 720,0 705,10 0,10" fill={color} />
        <polygon points="725,0 755,0 740,10 710,10" fill="#f97316" />
        <polygon points="760,0 790,0 775,10 745,10" fill={color} opacity="0.8" />
        <polygon points="795,0 800,0 800,10 780,10" fill="#f97316" />
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

  // Models with Bottom-Left Shapes -> Contact Info Aligned Right
  if (
    norm === "teal-slant" ||
    norm === "angled-badge" ||
    norm === "nordic-blocks" ||
    norm === "speed-stripes" ||
    norm === "corner-bracket" ||
    norm === "diagonal-slash" ||
    norm === "origami-facet"
  ) {
    return (
      <div className="relative pt-4 pb-1">
        <div
          className="pointer-events-none select-none absolute bottom-0 left-0 overflow-hidden z-0"
          style={
            docMargins
              ? {
                  marginBottom: `-${docMargins.bottom}mm`,
                  marginLeft: `-${docMargins.left}mm`,
                  width: "320px",
                  height: "85px",
                }
              : { width: "320px", height: "85px" }
          }
        >
          <svg viewBox="0 0 320 85" fill="none" className="w-full h-full" preserveAspectRatio="none">
            <polygon points="0,22 180,22 235,85 0,85" fill={color} />
            <polygon points="0,15 170,15 180,22 0,22" fill="#0a9396" />
            <polygon points="180,22 200,22 250,85 235,85" fill="#2dd4bf" opacity="0.8" />
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

  // Sidebar Spine -> Clean Right-Aligned Contact with subtle cap
  if (norm === "sidebar-spine") {
    return (
      <div className="relative pt-4 pb-1">
        <div
          className="pointer-events-none select-none absolute bottom-0 right-0 overflow-hidden z-0"
          style={
            docMargins
              ? {
                  marginBottom: `-${docMargins.bottom}mm`,
                  marginRight: `-${docMargins.right}mm`,
                  width: "240px",
                  height: "22px",
                }
              : { width: "240px", height: "22px" }
          }
        >
          <svg viewBox="0 0 240 22" fill="none" className="w-full h-full" preserveAspectRatio="none">
            <polygon points="40,0 240,0 240,22 10,22" fill={color} />
            <polygon points="30,0 40,0 10,22 0,22" fill="#f59e0b" />
          </svg>
        </div>
        <div className="relative z-10 flex flex-wrap items-center justify-end gap-x-5 gap-y-1 text-[8.5pt] text-slate-700 font-medium py-1 pr-4">
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

  // Horizon Banner & Chevron Ribbon -> Centered Clean Badges
  if (norm === "horizon-banner" || norm === "chevron-ribbon") {
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
                  height: "10px",
                }
              : { height: "10px" }
          }
        >
          <svg viewBox="0 0 800 10" fill="none" className="w-full h-full" preserveAspectRatio="none">
            <rect x="0" y="3" width="800" height="7" fill={color} />
            <polygon points="0,0 300,0 280,10 0,10" fill="#06b6d4" />
          </svg>
        </div>
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

  // Hexagon Tech -> Full-Width High-Contrast Footer Strip
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
                  height: "20px",
                }
              : { height: "20px" }
          }
        >
          <svg viewBox="0 0 800 20" fill="none" className="w-full h-full" preserveAspectRatio="none">
            <polygon points="0,4 200,4 225,20 0,20" fill="#4f46e5" opacity="0.8" />
            <polygon points="200,4 800,4 800,20 225,20" fill={color} />
            <polygon points="0,0 30,0 20,4 0,4" fill="#06b6d4" />
          </svg>
        </div>
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

  // Minimalist Crest -> Symmetric Hairline Footer
  return (
    <div className="relative pt-4 pb-1">
      <div className="w-full flex items-center justify-center gap-2 mb-2 select-none pointer-events-none">
        <div className="flex-1 h-[1px] bg-slate-300" />
        <div className="w-2 h-2 rotate-45" style={{ backgroundColor: color }} />
        <div className="flex-1 h-[1px] bg-slate-300" />
      </div>
      <div className="relative z-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-[8.5pt] text-slate-700 font-medium py-0.5">
        <div className="flex items-center gap-1.5">
          <Globe size={12} style={{ color }} />
          <span>{web}</span>
        </div>
        <span className="text-slate-300">•</span>
        <div className="flex items-center gap-1.5">
          <Phone size={12} style={{ color }} />
          <span>{tel}</span>
        </div>
        <span className="text-slate-300">•</span>
        <div className="flex items-center gap-1.5">
          <Mail size={12} style={{ color }} />
          <span>{email}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Thumbnail Preview showing real visual composition
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
      {/* 1. Prisma Slant */}
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

      {/* 2. Sidebar Spine */}
      {norm === "sidebar-spine" && (
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

      {/* 3. Horizon Banner */}
      {norm === "horizon-banner" && (
        <>
          <div className="absolute top-0 left-0 right-0 h-3.5 pointer-events-none">
            <svg viewBox="0 0 100 14" fill="none" className="w-full h-full" preserveAspectRatio="none">
              <polygon points="0,0 100,0 100,10 65,10 55,14 0,14" fill={color} />
              <polygon points="65,10 100,10 100,14 55,14" fill="#06b6d4" />
            </svg>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: color }} />
        </>
      )}

      {/* 4. Angled Badge */}
      {norm === "angled-badge" && (
        <>
          <div className="absolute top-0 right-0 w-14 h-6 pointer-events-none">
            <svg viewBox="0 0 56 24" fill="none" className="w-full h-full" preserveAspectRatio="none">
              <polygon points="10,0 56,0 56,20 22,20" fill={color} />
              <polygon points="22,20 56,20 56,24 26,24" fill="#10b981" />
            </svg>
          </div>
          <div className="absolute bottom-0 left-0 w-14 h-5 pointer-events-none">
            <svg viewBox="0 0 56 20" fill="none" className="w-full h-full" preserveAspectRatio="none">
              <polygon points="0,4 32,4 42,20 0,20" fill={color} />
            </svg>
          </div>
        </>
      )}

      {/* 5. Chevron Ribbon */}
      {norm === "chevron-ribbon" && (
        <>
          <div className="absolute top-0 right-0 w-10 h-2 bg-amber-500" style={{ backgroundColor: color }} />
          <div className="absolute top-5 left-1 right-1 h-1.5 pointer-events-none">
            <svg viewBox="0 0 80 6" fill="none" className="w-full h-full" preserveAspectRatio="none">
              <polygon points="0,0 65,0 60,6 0,6" fill={color} />
              <polygon points="66,0 75,0 70,6 61,6" fill="#f97316" />
            </svg>
          </div>
          <div className="absolute bottom-0.5 left-6 right-6 h-1 bg-slate-600 rounded-full" />
        </>
      )}

      {/* 6. Hexagon Tech */}
      {norm === "hexagon-badge" && (
        <>
          <div className="absolute top-0 right-0 w-14 h-6 pointer-events-none">
            <svg viewBox="0 0 56 24" fill="none" className="w-full h-full" preserveAspectRatio="none">
              <polygon points="15,0 56,0 56,20 30,20" fill={color} />
              <polygon points="8,3 15,3 18,8 15,13 8,13 5,8" fill="#4f46e5" />
            </svg>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-indigo-900 pointer-events-none flex">
            <div className="w-5 h-full bg-cyan-400" />
            <div className="flex-1 h-full" style={{ backgroundColor: color }} />
          </div>
        </>
      )}

      {/* 7. Nordic Blocks */}
      {norm === "nordic-blocks" && (
        <>
          <div className="absolute top-0 right-0 w-14 h-5 pointer-events-none">
            <rect x="15" y="0" width="41" height="15" fill={color} />
            <rect x="5" y="0" width="7" height="10" fill="#e11d48" />
          </div>
          <div className="absolute bottom-0 left-0 w-12 h-4 pointer-events-none">
            <rect x="0" y="4" width="36" height="12" fill={color} />
          </div>
        </>
      )}

      {/* 8. Dynamic Stripes */}
      {norm === "speed-stripes" && (
        <>
          <div className="absolute top-0 right-0 w-16 h-5 pointer-events-none">
            <svg viewBox="0 0 64 20" fill="none" className="w-full h-full" preserveAspectRatio="none">
              <polygon points="10,0 20,0 10,20 0,20" fill="#eab308" />
              <polygon points="25,0 35,0 25,20 15,20" fill="#0d9488" />
              <polygon points="40,0 64,0 64,20 30,20" fill={color} />
            </svg>
          </div>
          <div className="absolute bottom-0 left-0 w-12 h-4 pointer-events-none">
            <svg viewBox="0 0 48 16" fill="none" className="w-full h-full" preserveAspectRatio="none">
              <polygon points="0,4 28,4 36,16 0,16" fill={color} />
            </svg>
          </div>
        </>
      )}

      {/* 9. Corner Bracket */}
      {norm === "corner-bracket" && (
        <>
          <div className="absolute top-0 right-0 w-12 h-5 pointer-events-none">
            <svg viewBox="0 0 48 20" fill="none" className="w-full h-full" preserveAspectRatio="none">
              <polygon points="0,0 48,0 48,4 4,4" fill={color} />
              <polygon points="44,4 48,4 48,20 44,20" fill={color} />
            </svg>
          </div>
          <div className="absolute bottom-0 left-0 w-12 h-5 pointer-events-none">
            <svg viewBox="0 0 48 20" fill="none" className="w-full h-full" preserveAspectRatio="none">
              <polygon points="0,16 48,16 48,20 0,20" fill={color} />
              <polygon points="0,0 4,0 4,16 0,16" fill={color} />
            </svg>
          </div>
        </>
      )}

      {/* 10. Diagonal Slash */}
      {norm === "diagonal-slash" && (
        <>
          <div className="absolute top-0 right-0 w-16 h-6 pointer-events-none">
            <svg viewBox="0 0 64 24" fill="none" className="w-full h-full" preserveAspectRatio="none">
              <polygon points="12,0 64,0 64,20 25,0" fill={color} />
              <polygon points="25,0 64,20 64,22 23,0" fill="#f43f5e" />
            </svg>
          </div>
          <div className="absolute bottom-0 left-0 w-12 h-4 pointer-events-none">
            <polygon points="0,4 30,4 38,16 0,16" fill={color} />
          </div>
        </>
      )}

      {/* 11. Origami Facets */}
      {norm === "origami-facet" && (
        <>
          <div className="absolute top-0 right-0 w-16 h-6 pointer-events-none">
            <svg viewBox="0 0 64 24" fill="none" className="w-full h-full" preserveAspectRatio="none">
              <polygon points="18,0 42,0 30,16" fill={color} opacity="0.8" />
              <polygon points="42,0 64,0 64,18 30,16" fill={color} />
              <polygon points="8,0 18,0 30,16 20,16" fill="#14b8a6" />
            </svg>
          </div>
          <div className="absolute bottom-0 left-0 w-12 h-4 pointer-events-none">
            <polygon points="0,4 28,4 36,16 0,16" fill={color} />
          </div>
        </>
      )}

      {/* 12. Minimalist Crest */}
      {norm === "minimal-crest" && (
        <>
          <div className="absolute top-1.5 right-1 w-14 h-2 pointer-events-none flex items-center justify-end">
            <div className="w-2 h-2 rotate-45 mr-1" style={{ backgroundColor: color }} />
            <div className="w-8 h-[1px]" style={{ backgroundColor: color }} />
          </div>
          <div className="absolute bottom-1 left-4 right-4 h-[1px] bg-slate-300" />
        </>
      )}

      {/* Internal Mock Content (Simulating document lines) */}
      <div className={`relative z-10 flex items-center gap-1 ${norm === "sidebar-spine" ? "pl-3.5" : norm === "horizon-banner" ? "pt-2" : ""}`}>
        <div className="w-2.5 h-2.5 rounded-full bg-slate-300 shrink-0" />
        <div className="space-y-0.5">
          <div className="w-8 h-1 bg-slate-700 rounded-xs" />
          <div className="w-5 h-0.5 bg-slate-400 rounded-xs" />
        </div>
      </div>
    </div>
  );
}
