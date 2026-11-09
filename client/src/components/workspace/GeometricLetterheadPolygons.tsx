import React from "react";

export interface GeometricStyleDefinition {
  id: "teal-slant" | "navy-arrow" | "modern-hex" | "diagonal-split" | "minimal-blocks" | "creative-wave";
  label: string;
  tagline: string;
  desc: string;
  primaryColor: string;
  secondaryColor: string;
}

export const GEOMETRIC_STYLES: GeometricStyleDefinition[] = [
  {
    id: "teal-slant",
    label: "Prisma Slant",
    tagline: "Sesuai PDF Canva Indico",
    desc: "Trapezoid miring elegan dengan aksen garis cyan & toska",
    primaryColor: "#005f73",
    secondaryColor: "#0a9396",
  },
  {
    id: "navy-arrow",
    label: "Dynamic Chevron",
    tagline: "Inspirasi Logistik Global",
    desc: "Aksen panah forward navy modern & strip aksen amber gold",
    primaryColor: "#0f2942",
    secondaryColor: "#f59e0b",
  },
  {
    id: "modern-hex",
    label: "Hexagon Tech",
    tagline: "Komoditas & Tech Modern",
    desc: "Prisma poligon bersusun slate & gradasi emerald/sky",
    primaryColor: "#1e293b",
    secondaryColor: "#0284c7",
  },
  {
    id: "diagonal-split",
    label: "Diagonal Slash",
    tagline: "Eksekutif Pinterest Modern",
    desc: "Potongan sudut diagonal tegas dengan aksen emas korporat",
    primaryColor: "#1e3a8a",
    secondaryColor: "#eab308",
  },
  {
    id: "minimal-blocks",
    label: "Nordic Blocks",
    tagline: "Bauhaus / Swiss Studio",
    desc: "Blok grafis arsitektural terstruktur & aksen terracotta",
    primaryColor: "#334155",
    secondaryColor: "#e11d48",
  },
  {
    id: "creative-wave",
    label: "Origami Prism",
    tagline: "Faceted Wave Polygonal",
    desc: "Segitiga poligon multi-dimensi toska, mint & lime",
    primaryColor: "#044e54",
    secondaryColor: "#14b8a6",
  },
];

export function GeometricTopPolygon({
  style = "teal-slant",
  color = "#005f73",
}: {
  style?: string;
  color?: string;
}) {
  return (
    <div
      className="pointer-events-none select-none absolute top-0 right-0 overflow-hidden z-0"
      style={{
        width: "360px",
        height: "115px",
      }}
    >
      {style === "navy-arrow" ? (
        <svg viewBox="0 0 360 115" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="none">
          <polygon points="50,0 250,0 310,70 110,70" fill={color} opacity="0.18" />
          <polygon points="90,0 360,0 360,85 160,85" fill={color} />
          <polygon points="62,0 84,0 154,85 132,85" fill="#f59e0b" />
          <polygon points="160,85 360,85 360,93 168,93" fill="#38bdf8" />
        </svg>
      ) : style === "modern-hex" ? (
        <svg viewBox="0 0 360 115" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="none">
          <polygon points="80,0 360,0 360,95 180,95 130,45" fill={color} />
          <polygon points="25,0 70,0 120,45 75,45" fill="#0284c7" opacity="0.85" />
          <polygon points="75,45 125,45 150,70 100,70" fill="#10b981" opacity="0.75" />
          <polygon points="180,95 360,95 360,102 188,102" fill="#38bdf8" />
        </svg>
      ) : style === "diagonal-split" ? (
        <svg viewBox="0 0 380 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="none">
          <polygon points="35,0 380,0 380,30 10,0" fill={color} opacity="0.15" />
          <polygon points="45,0 380,0 380,96 115,0" fill={color} />
          <polygon points="115,0 380,96 380,103 107,0" fill="#eab308" />
          <polygon points="25,0 40,0 100,96 85,96" fill={color} opacity="0.4" />
        </svg>
      ) : style === "minimal-blocks" ? (
        <svg viewBox="0 0 360 115" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="none">
          <rect x="130" y="0" width="230" height="75" fill={color} />
          <rect x="190" y="75" width="170" height="20" fill={color} opacity="0.75" />
          <rect x="100" y="0" width="25" height="40" fill="#e11d48" />
          <rect x="130" y="72" width="230" height="3" fill="#fb7185" />
        </svg>
      ) : style === "creative-wave" ? (
        <svg viewBox="0 0 370 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="none">
          <polygon points="110,0 250,0 190,85" fill={color} opacity="0.85" />
          <polygon points="250,0 370,0 370,95 190,85" fill={color} />
          <polygon points="50,0 110,0 190,85 130,85" fill="#14b8a6" opacity="0.9" />
          <polygon points="130,85 190,85 210,105 150,105" fill="#84cc16" />
          <polygon points="190,85 370,95 370,102 210,105" fill="#06b6d4" />
        </svg>
      ) : (
        /* default: "teal-slant" */
        <svg viewBox="0 0 360 115" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="none">
          <polygon points="110,0 360,0 360,20 95,20" fill="#0ea5e9" opacity="0.3" />
          <polygon points="75,0 360,0 360,82 135,82" fill={color} />
          <polygon points="135,82 360,82 360,92 145,92" fill="#0a9396" />
        </svg>
      )}
    </div>
  );
}

export function GeometricBottomPolygon({
  style = "teal-slant",
  color = "#005f73",
  docMargins,
}: {
  style?: string;
  color?: string;
  docMargins?: { top: number; bottom: number; left: number; right: number };
}) {
  return (
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
      {style === "navy-arrow" ? (
        <svg viewBox="0 0 330 95" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="none">
          <polygon points="0,20 170,20 220,95 0,95" fill={color} />
          <polygon points="170,20 195,20 245,95 220,95" fill="#f59e0b" />
          <polygon points="195,20 210,20 260,95 245,95" fill="#38bdf8" opacity="0.75" />
        </svg>
      ) : style === "modern-hex" ? (
        <svg viewBox="0 0 330 95" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="none">
          <polygon points="0,30 160,30 210,75 180,95 0,95" fill={color} />
          <polygon points="160,30 200,30 250,75 210,75" fill="#0284c7" opacity="0.85" />
          <polygon points="210,75 250,75 270,95 230,95" fill="#10b981" opacity="0.75" />
        </svg>
      ) : style === "diagonal-split" ? (
        <svg viewBox="0 0 330 95" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="none">
          <polygon points="0,18 200,95 0,95" fill={color} />
          <polygon points="0,11 215,95 200,95 0,18" fill="#eab308" />
          <polygon points="0,0 230,95 215,95 0,11" fill={color} opacity="0.25" />
        </svg>
      ) : style === "minimal-blocks" ? (
        <svg viewBox="0 0 330 95" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="none">
          <rect x="0" y="35" width="180" height="60" fill={color} />
          <rect x="0" y="15" width="110" height="20" fill={color} opacity="0.75" />
          <rect x="180" y="55" width="40" height="40" fill="#e11d48" />
        </svg>
      ) : style === "creative-wave" ? (
        <svg viewBox="0 0 330 95" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="none">
          <polygon points="0,20 140,55 0,95" fill="#14b8a6" opacity="0.9" />
          <polygon points="0,20 180,20 140,55" fill={color} opacity="0.85" />
          <polygon points="140,55 230,55 190,95 0,95" fill={color} />
          <polygon points="190,95 230,55 255,95" fill="#84cc16" />
        </svg>
      ) : (
        /* default: "teal-slant" */
        <svg viewBox="0 0 330 95" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="none">
          <polygon points="0,26 190,26 245,95 0,95" fill={color} />
          <polygon points="0,18 180,18 190,26 0,26" fill="#0a9396" />
          <polygon points="190,26 210,26 260,95 245,95" fill="#2dd4bf" opacity="0.85" />
        </svg>
      )}
    </div>
  );
}

export function GeometricThumbnailPreview({
  style = "teal-slant",
  color = "#005f73",
}: {
  style?: string;
  color?: string;
}) {
  return (
    <div className="w-full h-11 bg-slate-50 border border-slate-200 rounded relative overflow-hidden flex flex-col justify-between p-1 select-none">
      {/* Top polygon preview */}
      <div className="absolute top-0 right-0 w-24 h-7 pointer-events-none">
        <GeometricTopPolygon style={style} color={color} />
      </div>
      {/* Mini dummy logo & text */}
      <div className="relative z-10 flex items-center gap-1">
        <div className="w-3.5 h-3.5 rounded-full bg-slate-300 shrink-0" />
        <div className="space-y-0.5">
          <div className="w-10 h-1 bg-slate-700 rounded-xs" />
          <div className="w-6 h-0.5 bg-slate-400 rounded-xs" />
        </div>
      </div>
      {/* Bottom polygon preview */}
      <div className="absolute bottom-0 left-0 w-20 h-6 pointer-events-none">
        <GeometricBottomPolygon style={style} color={color} />
      </div>
    </div>
  );
}
