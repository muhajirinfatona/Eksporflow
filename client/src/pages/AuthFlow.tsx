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
const VERTEX_SHADER_SRC = `
attribute vec2 aPos;
varying vec2 vScreenUv;
void main() {
  vScreenUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SRC = `
precision highp float;
varying vec2 vScreenUv;
uniform sampler2D uTex;
uniform vec2 uResolution;
uniform vec2 uImageSize;
uniform float uTime;

float distToSegment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

void main() {
  float screenAspect = uResolution.x / max(uResolution.y, 1.0);
  float imageAspect = uImageSize.x / max(uImageSize.y, 1.0);

  vec2 focal = screenAspect < 1.0 ? vec2(0.36, 0.58) : vec2(0.35, 0.52);
  vec2 scale = screenAspect > imageAspect
    ? vec2(1.0, imageAspect / screenAspect)
    : vec2(screenAspect / imageAspect, 1.0);

  // Gerakan kamera udara sangat halus di atas laut
  vec2 camDrift = vec2(sin(uTime * 0.22) * 0.012, cos(uTime * 0.18) * 0.008);
  vec2 imgUv = (vScreenUv - focal) * (scale * 0.94) + focal + camDrift;

  // Mask area air laut (langit, dermaga crane kiri atas, dan badan kapal tetap tajam)
  float horizonMask = smoothstep(0.14, 0.24, imgUv.y);
  float pierZone = (1.0 - smoothstep(0.45, 0.53, imgUv.x)) * (1.0 - smoothstep(0.21, 0.27, imgUv.y));
  float shipDist = distToSegment(imgUv, vec2(0.235, 0.535), vec2(0.525, 0.805));
  float shipMask = smoothstep(0.058, 0.105, shipDist);
  float waterMask = horizonMask * (1.0 - pierZone) * shipMask;

  // Perspektif kedalaman laut: riak lebih rapat di cakrawala, lebih lebar di dekat kamera
  float persp = mix(0.42, 1.32, clamp((imgUv.y - 0.14) / 0.86, 0.0, 1.0));

  // Riak-riak gelombang air laut berlapis yang mengalir realistis
  float w1 = sin((imgUv.x * 70.0 / persp + imgUv.y * 150.0 / persp) - uTime * 2.4);
  float w2 = sin((imgUv.x * -52.0 / persp + imgUv.y * 120.0 / persp) - uTime * 1.9 + 1.9);
  float w3 = sin((imgUv.x * 30.0 + imgUv.y * 210.0 / persp) + uTime * 1.6);
  float w4 = sin((imgUv.x * 140.0 / persp + imgUv.y * 260.0 / persp) - uTime * 3.1);

  float wave = w1 * 0.36 + w2 * 0.3 + w3 * 0.2 + w4 * 0.14;

  vec2 rippleOffset = vec2(wave * 0.009, (w1 - w2) * 0.006) * persp * waterMask;
  vec2 sampleUv = clamp(imgUv + rippleOffset, vec2(0.002), vec2(0.998));

  vec3 color = texture2D(uTex, sampleUv).rgb;

  // Eksposur lebih cerah & segar untuk nuansa laut siang hari
  color = pow(color, vec3(0.86)) * 1.14;

  // Bayangan lembah ombak & terang puncak ombak agar riak terlihat jelas bergerak
  color *= 1.0 + wave * 0.085 * waterMask;
  float crest = pow(max(0.0, wave), 3.0) * waterMask;
  color += vec3(0.86, 0.97, 1.0) * crest * 0.42;

  gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

function OceanRippleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
    });
    if (!gl) {
      console.warn("[EksporFlow] WebGL tidak tersedia, riak air memakai lapisan SVG.");
      return undefined;
    }

    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.warn("[EksporFlow] Shader riak air gagal:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
    const fs = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC);
    if (!vs || !fs) return undefined;

    const program = gl.createProgram();
    if (!program) return undefined;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return undefined;
    }

    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const aPos = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uResolution = gl.getUniformLocation(program, "uResolution");
    const uImageSize = gl.getUniformLocation(program, "uImageSize");
    const uTime = gl.getUniformLocation(program, "uTime");

    const texture = gl.createTexture();
    let rafId = 0;
    let disposed = false;
    let imgWidth = 1600;
    let imgHeight = 900;

    const syncSize = () => {
      if (!canvas || disposed) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      const w = Math.max(1, Math.floor(window.innerWidth * dpr));
      const h = Math.max(1, Math.floor(window.innerHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    syncSize();
    window.addEventListener("resize", syncSize, { passive: true });

    const img = new Image();
    img.decoding = "async";
    img.src = "/images/export-backdrop.jpg";

    img.onload = () => {
      if (disposed) return;
      imgWidth = img.naturalWidth || 1600;
      imgHeight = img.naturalHeight || 900;

      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

      setReady(true);
      const start = performance.now();

      const render = (now: number) => {
        if (disposed) return;
        if (!document.hidden) {
          syncSize();
          gl.uniform2f(uResolution, canvas.width, canvas.height);
          gl.uniform2f(uImageSize, imgWidth, imgHeight);
          gl.uniform1f(uTime, (now - start) * 0.001);
          gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
        rafId = window.requestAnimationFrame(render);
      };

      rafId = window.requestAnimationFrame(render);
    };

    return () => {
      disposed = true;
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", syncSize);
      if (texture) gl.deleteTexture(texture);
      if (buffer) gl.deleteBuffer(buffer);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteProgram(program);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`auth-ocean-canvas ${ready ? "ready" : ""}`}
    />
  );
}

function ExportWorldBackdrop() {
  return (
    <div className="auth-export-scene" aria-hidden="true">
      {/* Gambar dasar instan + Kanvas WebGL Riak Air Laut Real-Time 60fps */}
      <div className="auth-export-photo-wrap">
        <img
          src="/images/export-backdrop.jpg"
          alt=""
          className="auth-export-photo"
          decoding="async"
        />
        <OceanRippleCanvas />
      </div>

      {/* Awan Pesisir Tipis yang Berarak */}
      <div className="auth-cloud-drift auth-cloud-drift-a" />
      <div className="auth-cloud-drift auth-cloud-drift-b" />

      {/* Gradasi Sangat Ringan agar Laut Tetap Cerah & Segar */}
      <div className="auth-scene-veil" />

      {/* Riak-Riak Air, Ombak Kecil & Aktivitas Kapal yang Bergerak */}
      <svg
        className="auth-sea-life-svg"
        viewBox="0 0 1600 960"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Pola ombak kecil yang terus mengalir */}
          <pattern id="eksporRippleA" width="120" height="56" patternUnits="userSpaceOnUse">
            <path d="M8 22 q 10 -7 20 0" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M66 46 q 12 -8 24 0" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M92 12 q 7 -5 14 0" stroke="#e0f2fe" strokeOpacity="0.5" strokeWidth="1.3" strokeLinecap="round" />
            <animateTransform attributeName="patternTransform" type="translate" from="0 0" to="120 28" dur="9s" repeatCount="indefinite" />
          </pattern>
          <pattern id="eksporRippleB" width="90" height="44" patternUnits="userSpaceOnUse">
            <path d="M14 30 q 8 -6 16 0" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="1.3" strokeLinecap="round" />
            <path d="M56 12 q 9 -6 18 0" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="1.2" strokeLinecap="round" />
            <animateTransform attributeName="patternTransform" type="translate" from="0 0" to="-90 22" dur="7s" repeatCount="indefinite" />
          </pattern>
          <linearGradient id="eksporSeaFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="22%" stopColor="#ffffff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
          </linearGradient>
          <mask id="eksporSeaMask">
            <rect x="0" y="150" width="1600" height="810" fill="url(#eksporSeaFade)" />
          </mask>

          {/* Kapal kontainer tampak atas (menghadap ke kanan) */}
          <g id="eksporShipTop">
            <path d="M-96 0 L-340 -58" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="3" strokeLinecap="round" />
            <path d="M-96 0 L-340 58" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="3" strokeLinecap="round" />
            <ellipse className="auth-ship-foam" cx="-150" cy="0" rx="62" ry="11" fill="#ffffff" fillOpacity="0.55" />
            <path d="M-92 -17 L58 -17 Q 92 -11 100 0 Q 92 11 58 17 L-92 17 Q -99 0 -92 -17 Z" fill="#1c2c3e" stroke="#0b192c" strokeWidth="2" />
            <rect x="-56" y="-13" width="20" height="12" rx="1.5" fill="#f59e0b" />
            <rect x="-34" y="-13" width="20" height="12" rx="1.5" fill="#1e4976" />
            <rect x="-12" y="-13" width="20" height="12" rx="1.5" fill="#10b981" />
            <rect x="10" y="-13" width="20" height="12" rx="1.5" fill="#f59e0b" />
            <rect x="32" y="-13" width="20" height="12" rx="1.5" fill="#64748b" />
            <rect x="-56" y="1" width="20" height="12" rx="1.5" fill="#10b981" />
            <rect x="-34" y="1" width="20" height="12" rx="1.5" fill="#f59e0b" />
            <rect x="-12" y="1" width="20" height="12" rx="1.5" fill="#64748b" />
            <rect x="10" y="1" width="20" height="12" rx="1.5" fill="#1e4976" />
            <rect x="32" y="1" width="20" height="12" rx="1.5" fill="#10b981" />
            <rect x="-84" y="-13" width="18" height="26" rx="2" fill="#f8fafc" />
            <path d="M92 -8 Q 112 0 92 8" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="2.5" strokeLinecap="round" />
          </g>

          {/* Kapal tunda / feeder kecil */}
          <g id="eksporTugTop">
            <path d="M-26 0 L-150 -26" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M-26 0 L-150 26" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="2.2" strokeLinecap="round" />
            <ellipse className="auth-ship-foam" cx="-48" cy="0" rx="26" ry="6" fill="#ffffff" fillOpacity="0.55" />
            <path d="M-26 -9 L14 -9 Q 30 -5 34 0 Q 30 5 14 9 L-26 9 Q -30 0 -26 -9 Z" fill="#f8fafc" stroke="#0b192c" strokeWidth="1.6" />
            <rect x="-12" y="-6" width="16" height="12" rx="2" fill="#f59e0b" />
          </g>

          <path id="eksporShipLaneA" d="M-420 700 C 300 640, 1000 600, 2050 520" />
          <path id="eksporShipLaneB" d="M2000 300 C 1300 330, 600 345, -400 380" />
          <path id="eksporShipLaneC" d="M1900 960 C 1500 820, 1250 700, 900 560" />
          <path id="eksporShipLaneD" d="M-200 860 C 300 880, 800 900, 1800 840" />
        </defs>

        {/* Lapisan riak air & ombak kecil yang mengalir */}
        <g mask="url(#eksporSeaMask)">
          <rect className="auth-ripple-layer" x="0" y="0" width="1600" height="960" fill="url(#eksporRippleA)" />
          <rect className="auth-ripple-layer auth-ripple-layer-b" x="0" y="0" width="1600" height="960" fill="url(#eksporRippleB)" />
        </g>

        {/* Kapal kontainer utama melintas dari kiri ke kanan */}
        <g>
          <animateMotion dur="46s" repeatCount="indefinite" rotate="auto">
            <mpath href="#eksporShipLaneA" />
          </animateMotion>
          <use href="#eksporShipTop" transform="scale(0.85)" />
        </g>

        {/* Kapal kontainer jauh di dekat cakrawala bergerak ke kiri */}
        <g>
          <animateMotion dur="70s" begin="-25s" repeatCount="indefinite" rotate="auto">
            <mpath href="#eksporShipLaneB" />
          </animateMotion>
          <use href="#eksporShipTop" transform="scale(0.42)" opacity="0.85" />
        </g>

        {/* Kapal feeder menuju pelabuhan dari kanan bawah */}
        <g>
          <animateMotion dur="38s" begin="-12s" repeatCount="indefinite" rotate="auto">
            <mpath href="#eksporShipLaneC" />
          </animateMotion>
          <use href="#eksporShipTop" transform="scale(0.6)" />
        </g>

        {/* Kapal tunda kecil di jalur depan */}
        <g>
          <animateMotion dur="26s" begin="-8s" repeatCount="indefinite" rotate="auto">
            <mpath href="#eksporShipLaneD" />
          </animateMotion>
          <use href="#eksporTugTop" transform="scale(1.1)" />
        </g>
      </svg>

      {/* Koridor Jalur Ekspor Hidup: Pesawat Kargo, Sinyal Rute & Radar Pelabuhan */}
      <svg
        className="auth-export-routes-svg"
        viewBox="0 0 1600 960"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="eksporArcGold" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="eksporArcMint" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.2" />
          </linearGradient>

          <path
            id="eksporPathSky"
            d="M80 285 C 430 48, 1080 42, 1520 245"
          />
          <path
            id="eksporPathSeaLower"
            d="M120 760 C 540 905, 1070 895, 1510 700"
          />
          <path
            id="eksporPathEast"
            d="M1180 910 C 1275 650, 1385 430, 1515 190"
          />
        </defs>

        {/* Jalur Udara Atas + Aliran Garis */}
        <use href="#eksporPathSky" stroke="#ffffff" strokeOpacity="0.24" strokeWidth="1.4" />
        <use
          href="#eksporPathSky"
          className="auth-route-flow-gold"
          stroke="url(#eksporArcGold)"
          strokeWidth="2.4"
          strokeDasharray="10 12"
          strokeLinecap="round"
        />

        {/* Jalur Laut Bawah + Aliran Garis */}
        <use href="#eksporPathSeaLower" stroke="#ffffff" strokeOpacity="0.2" strokeWidth="1.2" />
        <use
          href="#eksporPathSeaLower"
          className="auth-route-flow-mint"
          stroke="url(#eksporArcMint)"
          strokeWidth="2.2"
          strokeDasharray="8 12"
          strokeLinecap="round"
        />

        {/* Jalur Laut Sisi Kanan */}
        <use
          href="#eksporPathEast"
          className="auth-route-flow-gold"
          stroke="url(#eksporArcGold)"
          strokeWidth="2"
          strokeDasharray="7 12"
          strokeLinecap="round"
        />

        {/* Pesawat Kargo Ekspor Melintas Aktif Mengikuti Lengkungan Jalur Atas */}
        <g>
          <animateMotion dur="10s" repeatCount="indefinite" rotate="auto">
            <mpath href="#eksporPathSky" />
          </animateMotion>
          <line x1="-38" y1="0" x2="-8" y2="0" stroke="#fbbf24" strokeWidth="2.4" strokeOpacity="0.8" strokeLinecap="round" />
          <path
            d="M-11 0 L6 0 L12 -2.2 L15 0 L12 2.2 L6 1.5 L-1 9 L-5 9 L-1 1.5 L-9 1.5 L-12 5 L-14.5 5 L-12 0 L-14.5 -5 L-12 -5 L-9 -1.5 L-1 -1.5 L-5 -9 L-1 -9 L6 -1.5 Z"
            fill="#ffffff"
          />
          <circle cx="8" cy="0" r="1.8" fill="#f59e0b" />
        </g>

        {/* Sinyal Kargo Maritim #1 Meluncur di Jalur Laut Bawah */}
        <g>
          <animateMotion dur="8s" repeatCount="indefinite" rotate="auto">
            <mpath href="#eksporPathSeaLower" />
          </animateMotion>
          <line x1="-32" y1="0" x2="0" y2="0" stroke="#34d399" strokeWidth="3" strokeOpacity="0.75" strokeLinecap="round" />
          <circle cx="0" cy="0" r="7" fill="#34d399" fillOpacity="0.38" />
          <circle cx="0" cy="0" r="3.5" fill="#ffffff" />
        </g>

        {/* Sinyal Kargo Maritim #2 Meluncur di Jalur Timur */}
        <g>
          <animateMotion dur="7s" begin="-3s" repeatCount="indefinite" rotate="auto">
            <mpath href="#eksporPathEast" />
          </animateMotion>
          <line x1="-26" y1="0" x2="0" y2="0" stroke="#fbbf24" strokeWidth="2.8" strokeOpacity="0.8" strokeLinecap="round" />
          <circle cx="0" cy="0" r="6.5" fill="#fbbf24" fillOpacity="0.38" />
          <circle cx="0" cy="0" r="3.2" fill="#ffffff" />
        </g>

        {/* Titik Radar Pelabuhan Berdenyut Aktif */}
        <g transform="translate(226 202)">
          <circle className="auth-port-ping" cx="0" cy="0" r="16" stroke="#fbbf24" strokeWidth="1.8" fill="#fbbf24" fillOpacity="0.24" />
          <circle className="auth-port-ping auth-port-ping-delay" cx="0" cy="0" r="16" stroke="#fbbf24" strokeWidth="1.4" fill="none" />
          <circle cx="0" cy="0" r="4.5" fill="#fbbf24" stroke="#ffffff" strokeWidth="1.6" />
        </g>

        <g transform="translate(1412 192)">
          <circle className="auth-port-ping auth-port-ping-delay" cx="0" cy="0" r="16" stroke="#34d399" strokeWidth="1.8" fill="#34d399" fillOpacity="0.24" />
          <circle className="auth-port-ping" cx="0" cy="0" r="16" stroke="#34d399" strokeWidth="1.4" fill="none" />
          <circle cx="0" cy="0" r="4.5" fill="#34d399" stroke="#ffffff" strokeWidth="1.6" />
        </g>

        <g transform="translate(215 802)">
          <circle className="auth-port-ping" cx="0" cy="0" r="14" stroke="#34d399" strokeWidth="1.6" fill="#34d399" fillOpacity="0.22" />
          <circle cx="0" cy="0" r="4" fill="#34d399" stroke="#ffffff" strokeWidth="1.5" />
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

      markHasLoggedInBefore();
      setHasLoggedInBefore(true);
      toast.success(`Selamat datang kembali, ${result.user?.name || "Pengguna"}!`);
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
  const welcomeHeading = isReturningWelcome ? "Selamat Datang Kembali!" : "Selamat Datang!";

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
            <AnimatePresence mode="wait" initial={false}>
              <motion.h1
                key={welcomeHeading}
                className="auth-welcome-heading"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                {welcomeHeading}
              </motion.h1>
            </AnimatePresence>

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
                  <strong className="auth-slide-kicker">{activeSlide.title}</strong>
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
