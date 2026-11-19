import React, { useState } from "react";
import {
  Ship,
  Anchor,
  Compass,
  Navigation,
  Globe,
  Share2,
  Copy,
  Check,
  Search,
  ExternalLink,
  MapPin,
  Clock,
  Waves,
  Wind,
  ShieldCheck,
  ArrowRight,
  Radio,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import type { Shipment } from "@shared/shipment";
import type { ScreenId } from "@shared/risk";

interface TrackingModuleProps {
  shipment: Shipment;
  update: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void;
  navigate: (screen: ScreenId) => void;
}

export function TrackingModule({
  shipment,
  update,
  navigate,
}: TrackingModuleProps) {
  const [containerNumber, setContainerNumber] = useState<string>(
    shipment.containerNumber || "MSKU-892014-7"
  );
  const [blNumber, setBlNumber] = useState<string>("MEDU-JKT-892104-E");
  const [carrier, setCarrier] = useState<string>("Maersk Line / Mediterranean Shipping Co");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Marine Telemetry Data
  const vesselName = "MV MAERSK MC-KINNEY MOLLER";
  const voyageNumber = "2408W";
  const speedKnots = "18.4 kts";
  const heading = "312° (North-West)";
  const coordinates = "12° 28' 14\" N, 44° 19' 02\" E";
  const seaZone = "Gulf of Aden / Red Sea Approach";
  const weather = "Sea State: Moderate (Wave 1.4m), Wind: 14 kts ENE";
  const etaDate = "28 November 2026 · 14:00 CET";
  const remainingDistance = "2,640 Nautical Miles (NM)";
  const progressPercent = 68;

  const waypoints = [
    {
      title: "Gate In Port of Loading",
      port: shipment.namedPlace || "Tanjung Priok, Jakarta (IDTPP)",
      date: "08 Nov 2026 · 09:30 WIB",
      status: "completed",
    },
    {
      title: "Bea Cukai & Ekspor Cleared (PEB/NPE)",
      port: "Kantor Pelayanan Utama Bea Cukai Tanjung Priok",
      date: "09 Nov 2026 · 14:15 WIB",
      status: "completed",
    },
    {
      title: "Loaded on Board Vessel",
      port: "Jakarta International Container Terminal (JICT)",
      date: "10 Nov 2026 · 22:00 WIB",
      status: "completed",
    },
    {
      title: "Mid-Sea Navigation (Tengah Laut)",
      port: "Gulf of Aden / Red Sea Transit Corridor",
      date: "Saat Ini · Posisi Terpantau Real-time",
      status: "current",
    },
    {
      title: "Suez Canal Transit Crossing",
      port: "Port Said, Mesir",
      date: "Perkiraan: 23 Nov 2026 · 06:00",
      status: "upcoming",
    },
    {
      title: "Port of Discharge Arrival (POD)",
      port: shipment.destination || "Port of Rotterdam, Belanda (NLRTM)",
      date: "Perkiraan ETA: 28 Nov 2026 · 14:00",
      status: "upcoming",
    },
  ];

  const handleCopyTrackingLink = () => {
    const link = `https://eksporflow.pages.dev/track?container=${containerNumber}&bl=${blNumber}`;
    navigator.clipboard.writeText(link);
    setIsCopied(true);
    toast.success("Tautan Pelacakan Publik Disalin!", {
      description: "Buyer internasional dapat memantau posisi kontainer di laut tanpa perlu login akun.",
    });
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleSearch = () => {
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      toast.success("Data Pelacakan Satelit Diperbarui", {
        description: `Posisi kapal ${vesselName} berhasil disinkronkan melalui sinyal AIS Maritim.`,
      });
    }, 800);
  };

  return (
    <div className="module-stack" style={{ gap: 16 }}>
      {/* Query Bar & Quick Actions */}
      <section className="panel panel-padding">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border pb-3 mb-3">
          <div>
            <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <Ship size={16} className="text-cyan-400" />
              Pelacakan Kontainer Maritim Real-Time (AIS Satelit)
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pemantauan visual posisi dan pergerakan kontainer selama berada di tengah laut berdasarkan nomor kontainer atau B/L.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopyTrackingLink}
            className="px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-medium flex items-center gap-1.5 shadow-sm shrink-0 self-start md:self-auto"
          >
            {isCopied ? <Check size={13} /> : <Share2 size={13} />}
            {isCopied ? "Link Tersalin!" : "Bagi Link Pelacakan ke Buyer"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">
              Nomor Kontainer
            </label>
            <input
              type="text"
              value={containerNumber}
              onChange={(e) => setContainerNumber(e.target.value)}
              placeholder="Contoh: MSKU-892014-7"
              className="w-full text-xs font-mono font-medium bg-background border border-border rounded-md px-2.5 py-1.5 text-foreground"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">
              Nomor Bill of Lading (B/L)
            </label>
            <input
              type="text"
              value={blNumber}
              onChange={(e) => setBlNumber(e.target.value)}
              placeholder="Contoh: MEDU-JKT-892104-E"
              className="w-full text-xs font-mono font-medium bg-background border border-border rounded-md px-2.5 py-1.5 text-foreground"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">
              Shipping Line (Pelayaran)
            </label>
            <select
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              className="w-full text-xs bg-background border border-border rounded-md px-2.5 py-1.5 text-foreground"
            >
              <option value="Maersk Line / Mediterranean Shipping Co">Maersk Line & MSC</option>
              <option value="CMA CGM">CMA CGM</option>
              <option value="COSCO Shipping">COSCO Shipping</option>
              <option value="Ocean Network Express (ONE)">Ocean Network Express (ONE)</option>
              <option value="Hapag-Lloyd">Hapag-Lloyd</option>
              <option value="Evergreen Marine">Evergreen Marine</option>
            </select>
          </div>

          <div>
            <button
              type="button"
              onClick={handleSearch}
              disabled={isSearching}
              className="w-full text-xs font-medium py-1.5 px-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Search size={13} /> Lacak Posisi Samudra
            </button>
          </div>
        </div>
      </section>

      {/* Visual Mid-Sea Marine Map Canvas */}
      <section className="panel panel-padding">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Compass size={17} className="text-cyan-400" />
            <h3 className="font-bold text-sm text-foreground">
              Visualisasi Peta Maritim Samudra (Mid-Sea AIS Telemetry)
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 animate-pulse">
              <Radio size={10} /> SATELIT AIS AKTIF
            </span>
          </div>

          <div className="text-xs text-muted-foreground">
            Progress Pelayaran: <b>{progressPercent}% Selesai</b>
          </div>
        </div>

        {/* Nautical SVG Map Presentation */}
        <div className="relative w-full h-[340px] bg-slate-950 rounded-xl overflow-hidden border border-cyan-500/30 shadow-2xl flex flex-col justify-between p-4 select-none">
          {/* Wave background pattern */}
          <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:24px_24px]" />

          {/* Header overlay on map */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="bg-slate-900/80 backdrop-blur border border-cyan-500/30 px-3 py-1.5 rounded-lg text-xs">
              <span className="text-muted-foreground block text-[10px]">Kapal Pengangkut Kontainer:</span>
              <b className="text-cyan-300 font-mono">{vesselName}</b> · Voyage {voyageNumber}
            </div>

            <div className="bg-slate-900/80 backdrop-blur border border-border px-3 py-1.5 rounded-lg text-xs text-right">
              <span className="text-muted-foreground block text-[10px]">Zona Maritim:</span>
              <b className="text-foreground">{seaZone}</b>
            </div>
          </div>

          {/* Interactive Route Vector Visualization */}
          <div className="relative z-10 my-auto w-full px-8">
            <div className="relative flex items-center justify-between">
              {/* Origin Port */}
              <div className="flex flex-col items-center text-center">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
                  <Anchor size={14} />
                </div>
                <b className="text-xs text-foreground mt-1.5">Tanjung Priok</b>
                <span className="text-[10px] text-muted-foreground">IDTPP (Indonesia)</span>
                <span className="text-[9px] text-emerald-400 font-mono mt-0.5">Departed 10 Nov</span>
              </div>

              {/* Waypoint 1: Malacca Strait */}
              <div className="hidden md:flex flex-col items-center text-center opacity-70">
                <div className="w-4 h-4 rounded-full bg-cyan-400/30 border border-cyan-400" />
                <span className="text-[10px] text-muted-foreground mt-1">Selat Malaka</span>
                <span className="text-[9px] text-muted-foreground">Passed</span>
              </div>

              {/* Current Mid-Sea Ship Location */}
              <div className="flex flex-col items-center text-center relative">
                {/* Ping rings */}
                <span className="absolute -top-1 w-12 h-12 rounded-full bg-cyan-400/20 animate-ping" />
                
                <div className="w-10 h-10 rounded-full bg-cyan-500 border-2 border-white flex items-center justify-center text-slate-950 shadow-xl shadow-cyan-500/50 relative z-10 transform -rotate-12">
                  <Ship size={18} />
                </div>

                <div className="bg-cyan-950/90 border border-cyan-400/50 px-2.5 py-1 rounded text-center mt-2 shadow-lg">
                  <span className="text-[9px] font-bold text-cyan-300 uppercase tracking-widest block">
                    POSISI TENGAH LAUT (MID-SEA)
                  </span>
                  <b className="text-xs text-white font-mono">{coordinates}</b>
                </div>
              </div>

              {/* Waypoint 2: Suez Canal */}
              <div className="hidden md:flex flex-col items-center text-center opacity-70">
                <div className="w-4 h-4 rounded-full bg-slate-700 border border-slate-500" />
                <span className="text-[10px] text-muted-foreground mt-1">Terusan Suez</span>
                <span className="text-[9px] text-muted-foreground">Est. 23 Nov</span>
              </div>

              {/* Destination Port */}
              <div className="flex flex-col items-center text-center">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 border-2 border-blue-400 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/20">
                  <MapPin size={14} />
                </div>
                <b className="text-xs text-foreground mt-1.5">Rotterdam</b>
                <span className="text-[10px] text-muted-foreground">NLRTM (Belanda)</span>
                <span className="text-[9px] text-cyan-400 font-mono mt-0.5">ETA: 28 Nov</span>
              </div>
            </div>

            {/* Connecting Sea Route Line */}
            <div className="absolute top-4 left-14 right-14 h-0.5 -z-0 bg-slate-800">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-cyan-300 shadow-lg shadow-cyan-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Bottom Telemetry Bar on Map */}
          <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg p-2.5 text-xs">
            <div className="flex items-center gap-2">
              <Waves size={15} className="text-cyan-400" />
              <div>
                <span className="text-[10px] text-muted-foreground block">Kecepatan Kapal:</span>
                <b className="text-foreground font-mono">{speedKnots}</b>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Compass size={15} className="text-cyan-400" />
              <div>
                <span className="text-[10px] text-muted-foreground block">Arah Kemudi (Heading):</span>
                <b className="text-foreground font-mono">{heading}</b>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Wind size={15} className="text-cyan-400" />
              <div>
                <span className="text-[10px] text-muted-foreground block">Sisa Jarak Tempuh:</span>
                <b className="text-foreground font-mono">{remainingDistance}</b>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock size={15} className="text-emerald-400" />
              <div>
                <span className="text-[10px] text-muted-foreground block">Perkiraan Tiba (ETA):</span>
                <b className="text-emerald-300 font-mono text-[11px]">{etaDate}</b>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Waypoint Log */}
      <section className="panel panel-padding">
        <h3 className="font-bold text-sm text-foreground mb-3 flex items-center gap-2">
          <Clock size={16} className="text-primary" />
          Linimasa Pergerakan Kontainer & Riwayat Milestone Pengapalan
        </h3>

        <div className="relative border-l-2 border-border ml-3 pl-4 space-y-4 text-xs">
          {waypoints.map((wp, index) => (
            <div key={index} className="relative">
              {/* Dot indicator */}
              <div
                className={`absolute -left-[23px] top-0.5 w-3.5 h-3.5 rounded-full border-2 ${
                  wp.status === "completed"
                    ? "bg-emerald-500 border-background"
                    : wp.status === "current"
                    ? "bg-cyan-400 border-background ring-4 ring-cyan-500/20"
                    : "bg-slate-700 border-background"
                }`}
              />
              <div className="flex items-baseline justify-between flex-wrap gap-1">
                <b
                  className={`text-sm ${
                    wp.status === "current" ? "text-cyan-300 font-bold" : "text-foreground"
                  }`}
                >
                  {wp.title}
                </b>
                <span className="text-[11px] font-mono text-muted-foreground">{wp.date}</span>
              </div>
              <p className="text-muted-foreground text-xs mt-0.5">{wp.port}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
