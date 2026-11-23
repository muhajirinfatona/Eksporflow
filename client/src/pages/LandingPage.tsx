import {
  calculateDemurrageSimulation,
  calculatePlanBilling,
  SUBSCRIPTION_PLANS,
  type SubscriptionPlanSpec,
} from "@shared/exportCompliance";
import {
  ArrowRight,
  Calculator,
  Check,
  CheckCircle2,
  ChevronRight,
  FileText,
  FolderArchive,
  LogIn,
  Play,
  Scale,
  ShieldCheck,
  Ship,
} from "lucide-react";
import { useMemo, useState } from "react";

interface LandingPageProps {
  onOpenAuth: (mode: "login" | "register") => void;
  onStartDemo: () => void;
  demoRemainingLabel?: string | null;
}

function formatIdr(amount: number): string {
  return `Rp ${Math.round(amount).toLocaleString("id-ID")}`;
}

export function LandingPage({
  onOpenAuth,
  onStartDemo,
  demoRemainingLabel,
}: LandingPageProps) {
  // Simulasi Demurrage
  const [containerCount, setContainerCount] = useState(2);
  const [delayedDays, setDelayedDays] = useState(4);
  const [dailyRateUsd, setDailyRateUsd] = useState(150);
  const [selectedPlanId, setSelectedPlanId] = useState<SubscriptionPlanSpec["id"]>("growth");

  // Kalkulator Langganan
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [docVolume, setDocVolume] = useState(40);

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

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1B2533] font-sans antialiased selection:bg-[#017EF3] selection:text-white">
      {/* 1. Header Minimalis & Berwibawa ala Space DS */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EAEFF5]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#131B26] flex items-center justify-center text-white font-bold text-sm tracking-tight border border-slate-800">
              EF
            </div>
            <div>
              <span className="font-bold text-[#1B2533] text-base tracking-tight">EksporFlow</span>
              <span className="text-[11px] text-[#697483] font-mono ml-2 hidden sm:inline">TRADE OS</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-[#445164]">
            <a href="#kalkulator" className="hover:text-[#017EF3] transition-colors">Simulasi Biaya</a>
            <a href="#fitur" className="hover:text-[#017EF3] transition-colors">Fitur Utama</a>
            <a href="#harga" className="hover:text-[#017EF3] transition-colors">Harga & Paket</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onOpenAuth("login")}
              className="text-xs font-semibold text-[#445164] hover:text-[#1B2533] px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={onStartDemo}
              className="inline-flex items-center gap-1.5 bg-[#017EF3] hover:bg-[#0171DB] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-sm"
            >
              <Play size={13} />
              <span>{demoRemainingLabel ? `Lanjutkan Demo (${demoRemainingLabel})` : "Coba Demo 3 Hari"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section: Bersih, Tegas, Space DS */}
      <section className="pt-16 pb-20 border-b border-[#EAEFF5] bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E6F2FE] border border-[#CCE5FD] text-[#0165C2] text-xs font-semibold mb-6">
              <span className="w-2 h-2 rounded-full bg-[#017EF3]" />
              Sistem Operasional Ekspor Terstandarisasi
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#1B2533] tracking-tight leading-[1.15] mb-5">
              Otomatisasi Dokumen Ekspor &amp; Pencegahan Denda Demurrage.
            </h1>

            <p className="text-base sm:text-lg text-[#445164] leading-relaxed mb-8 max-w-2xl">
              Platform terpadu untuk eksportir dan UMKM Indonesia. Dari simulasi kontainer dan kepatuhan HS Code hingga penerbitan dokumen resmi (COO, PI, SC, CI, PL, SI) dengan audit trail Bea Cukai.
            </p>

            <div className="flex flex-wrap items-center gap-3 mb-10">
              <button
                type="button"
                onClick={onStartDemo}
                className="inline-flex items-center gap-2 bg-[#017EF3] hover:bg-[#0171DB] text-white font-medium text-sm px-5 py-2.5 rounded-lg shadow-sm transition-all"
              >
                <span>Buka Sandbox Demo (Gratis)</span>
                <ArrowRight size={16} />
              </button>

              <button
                type="button"
                onClick={() => onOpenAuth("register")}
                className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-[#1B2533] font-medium text-sm px-5 py-2.5 rounded-lg transition-all border border-[#D6DAE1]"
              >
                <span>Daftar Akun Perusahaan</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-[#EAEFF5] text-xs text-[#445164] font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                <span>Dokumen Multi-Item</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                <span>Format COO / SKA Resmi</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                <span>AI Advisor Terverifikasi</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                <span>Audit DJBC Terisolasi</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Interactive Demurrage Risk Instrument */}
      <section id="kalkulator" className="py-16 bg-[#131B26] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-5 space-y-4">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                KALKULATOR RISIKO PELABUHAN
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
                Berapa Biaya Typo Dokumen di Pelabuhan Tujuan?
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Ketidaksesuaian nomor kontainer, selisih berat kotor, atau HS Code yang keliru dapat menahan kontainer 3-7 hari. Hitung potensi denda demurrage Anda sebelum kapal berlayar.
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onStartDemo}
                  className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
                >
                  <span>Mulai Uji Coba Pencegahan di Eksporflow</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 bg-[#1E293B] rounded-2xl border border-slate-700/80 p-6 space-y-6 shadow-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-300 mb-1.5">
                    <span>Jumlah Kontainer</span>
                    <span className="font-mono text-white font-bold">{containerCount} Kontainer</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={containerCount}
                    onChange={(e) => setContainerCount(Number(e.target.value))}
                    className="w-full accent-[#017EF3] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-300 mb-1.5">
                    <span>Hari Tertahan (Revisi Dokumen)</span>
                    <span className="font-mono text-white font-bold">{delayedDays} Hari</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={14}
                    value={delayedDays}
                    onChange={(e) => setDelayedDays(Number(e.target.value))}
                    className="w-full accent-[#017EF3] cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Tarif Demurrage (USD / Kontainer / Hari)
                  </label>
                  <input
                    type="number"
                    min={50}
                    max={600}
                    step={10}
                    value={dailyRateUsd}
                    onChange={(e) => setDailyRateUsd(Math.max(10, Number(e.target.value) || 0))}
                    className="w-full px-3 py-2 bg-[#131B26] border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#017EF3]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Paket Perlindungan Eksporflow
                  </label>
                  <select
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#131B26] border border-slate-700 rounded-lg text-xs font-medium text-white focus:outline-none focus:border-[#017EF3]"
                  >
                    {SUBSCRIPTION_PLANS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({formatIdr(p.monthlyPriceIdr)}/bln)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#131B26] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-rose-400 font-semibold block">
                    POTENSI DENDA DEMURRAGE
                  </span>
                  <div className="text-2xl font-extrabold font-mono text-white tracking-tight">
                    USD ${demurrage.totalLossUsd.toLocaleString("en-US")}
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    ≈ {formatIdr(demurrage.totalLossIdr)} per kejadian
                  </span>
                </div>

                <div className="text-left sm:text-right border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-5">
                  <span className="text-[11px] text-slate-400 block mb-0.5">Rasio Proteksi Biaya</span>
                  <div className="text-base font-bold font-mono text-emerald-400">
                    {demurrage.roiMultiple}x Lebih Hemat
                  </div>
                  <span className="text-[11px] text-slate-500">
                    dibanding {SUBSCRIPTION_PLANS.find((p) => p.id === selectedPlanId)?.name}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. 4 Pilar Sistem Operasional (Tersusun Rapi & Padat) */}
      <section id="fitur" className="py-20 border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-xl mb-12">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-700">
              ARSITEKTUR PLATFORM
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight mt-1 mb-3">
              Fungsionalitas Inti untuk Setiap Transaksi
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Dirancang tanpa jargon berlebih. Semua modul bekerja terpadu dari satu sumber data transaksi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-blue-100 border border-blue-200 text-blue-800 flex items-center justify-center font-bold mb-4">
                <FileText size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">
                Dokumen Ekspor Multi-Barang
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Terbitkan 6 dokumen resmi (Proforma Invoice, Sales Contract, Commercial Invoice, Packing List, Shipping Instruction, Certificate of Origin) dengan tabel multi-item dan bobot terkalibrasi.
              </p>
              <span className="text-[11px] font-mono text-slate-500">Format: PDF A4 Resmi &amp; DOCX</span>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 border border-emerald-200 text-emerald-800 flex items-center justify-center font-bold mb-4">
                <Scale size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">
                HS Code &amp; Kepatuhan Lartas
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Pencarian kode HS terverifikasi, verifikasi izin lartas kementerian teknis, serta pengingat masa kedaluwarsa karantina tumbuhan/hewan sebelum closing PEB.
              </p>
              <span className="text-[11px] font-mono text-slate-500">Standar: BTKI &amp; Regulasi Kemendag</span>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center font-bold mb-4">
                <Calculator size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">
                Kalkulator Kontainer &amp; 7 Incoterms
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Simulasi muatan kontainer 20ft, 40ft, 40HC, perhitungan susut bobot komoditas, dan kalkulasi harga jual akurat di skenario FOB, CIF, CFR, hingga DDP.
              </p>
              <span className="text-[11px] font-mono text-slate-500">Mesin: Kalkulator Deterministik</span>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 border border-indigo-200 text-indigo-800 flex items-center justify-center font-bold mb-4">
                <FolderArchive size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">
                Snapshot Audit &amp; Brankas DJBC
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Kunci versi dokumen final dengan hash SHA-256 yang tidak dapat diubah (immutable), terorganisir dalam 5 indeks siap audit Bea Cukai.
              </p>
              <span className="text-[11px] font-mono text-slate-500">Keamanan: PostgreSQL Row-Level Security</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Paket Langganan: Bersih, Transparan, Bebas Klaim Berlebihan */}
      <section id="harga" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-700">
              TRANSPARANSI BIAYA
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight mt-1 mb-2">
              Paket Sederhana Sesuai Volume Ekspor
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Mulai gratis 3 hari. Pembayaran tahunan mendapatkan potongan 10%.
            </p>

            <div className="inline-flex p-1 bg-white rounded-lg border border-slate-300 mt-6 shadow-sm">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  billingCycle === "monthly" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Bulanan
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("annual")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  billingCycle === "annual" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Tahunan (-10%)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {SUBSCRIPTION_PLANS.map((plan) => {
              const calc = calculatePlanBilling(plan.id, billingCycle, docVolume);
              const isHighlight = plan.id === "growth";
              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl p-6 bg-white border transition-all flex flex-col justify-between ${
                    isHighlight
                      ? "border-[#017EF3] shadow-md ring-1 ring-[#017EF3]"
                      : "border-[#EAEFF5] shadow-sm"
                  }`}
                >
                  <div>
                    {isHighlight && (
                      <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#0165C2] bg-[#E6F2FE] px-2.5 py-0.5 rounded-full border border-[#CCE5FD] inline-block mb-3">
                        Paling Banyak Digunakan
                      </span>
                    )}
                    <h3 className="text-base font-bold text-[#1B2533]">{plan.name}</h3>
                    <p className="text-xs text-[#697483] mt-0.5 mb-4">{plan.tagline}</p>

                    <div className="mb-5 pb-5 border-b border-[#EAEFF5]">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl sm:text-3xl font-extrabold text-[#1B2533] font-mono tracking-tight">
                          {formatIdr(calc.effectiveMonthlyIdr)}
                        </span>
                        <span className="text-xs text-[#697483] font-medium">/bln</span>
                      </div>
                      <span className="text-[11px] text-[#697483] font-mono block mt-1">
                        Kuota: {plan.monthlyDocQuota} dokumen / bulan
                      </span>
                    </div>

                    <ul className="space-y-2.5 text-xs text-[#445164] mb-6">
                      {plan.features.slice(0, 5).map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <Check size={14} className="text-[#017EF3] shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-[#EAEFF5]">
                    <button
                      type="button"
                      onClick={onStartDemo}
                      className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                        isHighlight
                          ? "bg-[#017EF3] hover:bg-[#0171DB] text-white shadow-sm"
                          : "bg-white hover:bg-slate-50 text-[#1B2533] border border-[#D6DAE1]"
                      }`}
                    >
                      Coba Demo 3 Hari
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenAuth("register")}
                      className="w-full text-center text-xs font-semibold text-[#697483] hover:text-[#1B2533] py-1.5 transition-colors"
                    >
                      Daftar Langsung
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. Footer Sederhana & Bersih */}
      <footer className="py-12 bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">EksporFlow</span>
            <span>·</span>
            <span>Platform Kepatuhan &amp; Operasional Ekspor</span>
          </div>

          <div className="flex items-center gap-6">
            <button type="button" onClick={onStartDemo} className="hover:text-slate-900">
              Demo 3 Hari
            </button>
            <button type="button" onClick={() => onOpenAuth("login")} className="hover:text-slate-900">
              Masuk
            </button>
            <button type="button" onClick={() => onOpenAuth("register")} className="hover:text-slate-900">
              Daftar
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
