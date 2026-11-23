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
  Clock,
  FileCheck2,
  FolderArchive,
  LogIn,
  Play,
  Radar,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Ship,
  Sparkles,
  TrendingUp,
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
  // Kalkulator Simulasi Kerugian Demurrage
  const [containerCount, setContainerCount] = useState(2);
  const [delayedDays, setDelayedDays] = useState(5);
  const [dailyRateUsd, setDailyRateUsd] = useState(150);
  const [selectedSimPlan, setSelectedSimPlan] = useState<SubscriptionPlanSpec["id"]>("growth");

  // Kalkulator Harga Langganan 3 Tingkat
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [monthlyDocsEstimate, setMonthlyDocsEstimate] = useState(40);

  const demurrageResult = useMemo(
    () =>
      calculateDemurrageSimulation({
        containerCount,
        delayedDays,
        dailyRateUsd,
        exchangeRateIdr: 16200,
        planId: selectedSimPlan,
      }),
    [containerCount, delayedDays, dailyRateUsd, selectedSimPlan],
  );

  return (
    <div className="ef-landing-root">
      {/* 1. Sticky Navigation Header */}
      <header className="ef-landing-nav">
        <div className="ef-landing-container ef-landing-nav-inner">
          <div className="ef-landing-brand">
            <div className="brand-mark">
              <span />
              <span />
            </div>
            <div>
              <strong>
                Ekspor<span>Flow</span>
              </strong>
              <small>Platform Operasional Ekspor UMKM</small>
            </div>
          </div>

          <nav className="ef-landing-links" aria-label="Navigasi halaman utama">
            <a href="#kalkulator-demurrage">Kalkulator Demurrage</a>
            <a href="#fitur-unggulan">6 Pilar Ekspor</a>
            <a href="#paket-harga">Paket &amp; Kuota Hibrida</a>
          </nav>

          <div className="ef-landing-nav-actions">
            <button
              type="button"
              className="ef-btn-demo-nav"
              onClick={onStartDemo}
            >
              <Play size={14} />
              {demoRemainingLabel ? `Lanjutkan Demo (${demoRemainingLabel})` : "Coba Demo 3 Hari"}
            </button>
            <button
              type="button"
              className="ef-btn-login-nav"
              onClick={() => onOpenAuth("login")}
            >
              <LogIn size={14} /> Masuk / Daftar
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Showcase */}
      <section className="ef-landing-hero">
        <div className="ef-landing-hero-glow" aria-hidden="true" />
        <div className="ef-landing-container ef-landing-hero-grid">
          <div className="ef-hero-copy">
            <div className="ef-hero-badge" style={{ background: "linear-gradient(90deg, #0b192c, #163a5c)", border: "1px solid #3b82f6" }}>
              <Sparkles size={13} className="text-amber-400" />
              <span>EksporFlow v2 · Platform Ekspor Institusional &amp; AI Trade Intelligence</span>
            </div>
            <h1>
              Eliminasi Risiko Denda <span>Demurrage</span> &amp; Otomatisasi Dokumen Ekspor Resmi UMKM.
            </h1>
            <p className="ef-hero-subtitle">
              Solusi end-to-end terintegrasi bagi eksportir Indonesia: Panduan Onboarding 4 Langkah, AI Advisor anti-halusinasi terverifikasi, kalkulator HPP &amp; kontainer presisi, serta penerbitan dokumen resmi (COO, PI, SC, CI, PL, SI) dengan audit snapshot immutable Bea Cukai.
            </p>

            <div className="ef-hero-cta-row">
              <button type="button" className="ef-cta-primary" onClick={onStartDemo} style={{ background: "linear-gradient(135deg, #0284c7, #0369a1)", boxShadow: "0 4px 14px rgba(2, 132, 199, 0.35)" }}>
                <Play size={16} />
                Buka Workspace Eksporflow v2 (Demo 3 Hari)
              </button>
              <button
                type="button"
                className="ef-cta-secondary"
                onClick={() => onOpenAuth("login")}
              >
                Masuk ke Akun Perusahaan <ArrowRight size={15} />
              </button>
            </div>

            <div className="ef-hero-trust-row">
              <div>
                <CheckCircle2 size={14} className="text-emerald-500" /> <span>Panduan Interaktif 4 Langkah UMKM</span>
              </div>
              <div>
                <CheckCircle2 size={14} className="text-emerald-500" /> <span>Dokumen Multi-Item &amp; COO Resmi</span>
              </div>
              <div>
                <CheckCircle2 size={14} className="text-emerald-500" /> <span>AI Advisor dengan Deterministic Tools</span>
              </div>
            </div>
          </div>

          {/* 3. Widget Interaktif: Kalkulator Simulasi Kerugian Demurrage */}
          <div id="kalkulator-demurrage" className="ef-demurrage-card">
            <div className="ef-demurrage-head">
              <div>
                <span className="eyebrow" style={{ color: "#fbbf24" }}>
                  SIMULASI KERUGIAN DEMURRAGE
                </span>
                <h2>Hitung Potensi Denda Pelabuhan Anda</h2>
              </div>
              <Calculator size={20} style={{ color: "#fbbf24" }} />
            </div>

            <p className="ef-demurrage-desc">
              Satu typo berat kotor di Draft B/L atau izin karantina kedaluwarsa dapat menahan kontainer 3–7 hari di
              pelabuhan tujuan. Simulasikan dampaknya dibanding biaya langganan bulanan:
            </p>

            <div className="ef-demurrage-inputs">
              <label>
                <span>Jumlah Kontainer (Shipment)</span>
                <div className="ef-range-row">
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={containerCount}
                    onChange={(e) => setContainerCount(Number(e.target.value))}
                  />
                  <b>{containerCount} Kontainer</b>
                </div>
              </label>

              <label>
                <span>Estimasi Hari Tertahan (Hold / Revisi B/L)</span>
                <div className="ef-range-row">
                  <input
                    type="range"
                    min={1}
                    max={14}
                    value={delayedDays}
                    onChange={(e) => setDelayedDays(Number(e.target.value))}
                  />
                  <b>{delayedDays} Hari</b>
                </div>
              </label>

              <div className="ef-demurrage-two-col">
                <label>
                  <span>Tarif Demurrage (USD / Kontainer / Hari)</span>
                  <input
                    type="number"
                    min={50}
                    max={600}
                    step={10}
                    value={dailyRateUsd}
                    onChange={(e) => setDailyRateUsd(Math.max(10, Number(e.target.value) || 0))}
                  />
                </label>

                <label>
                  <span>Pembanding Paket EksporFlow</span>
                  <select
                    value={selectedSimPlan}
                    onChange={(e) => setSelectedSimPlan(e.target.value as SubscriptionPlanSpec["id"])}
                  >
                    {SUBSCRIPTION_PLANS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({formatIdr(p.monthlyPriceIdr)}/bln)
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="ef-demurrage-results">
              <div className="ef-result-danger">
                <span>Potensi Kerugian Demurrage &amp; Detention</span>
                <strong>USD ${demurrageResult.totalLossUsd.toLocaleString("en-US")}</strong>
                <small>≈ {formatIdr(demurrageResult.totalLossIdr)} per kejadian hold</small>
              </div>

              <div className="ef-result-metrics">
                <div>
                  <span>Biaya Paket {SUBSCRIPTION_PLANS.find((p) => p.id === selectedSimPlan)?.name}</span>
                  <b>{formatIdr(demurrageResult.subscriptionMonthlyIdr)} / bln</b>
                </div>
                <div>
                  <span>Rasio Proteksi Biaya</span>
                  <b className="ef-roi-badge">{demurrageResult.roiMultiple}x Lipat lebih hemat</b>
                </div>
              </div>
            </div>

            <button type="button" className="ef-demurrage-cta" onClick={onStartDemo}>
              Cegah Kerugian {formatIdr(demurrageResult.totalLossIdr)} · Coba Demo Sekarang{" "}
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* 4. Enam Pilar Fitur EksporFlow */}
      <section id="fitur-unggulan" className="ef-landing-section">
        <div className="ef-landing-container">
          <div className="ef-section-heading">
            <span className="eyebrow">ALUR KERJA TERINTEGRASI HULU KE HILIR</span>
            <h2>6 Pilar Operasional &amp; Kepatuhan Ekspor</h2>
            <p>
              Dirancang khusus untuk menjawab kendala utama eksportir pemula maupun perusahaan berkembang:
              konsistensi data, kecepatan dokumen, kepatuhan regulasi, dan keamanan pembayaran T/T.
            </p>
          </div>

          <div className="ef-pillars-grid">
            <article className="ef-pillar-card">
              <div className="ef-pillar-icon navy">
                <Sparkles size={18} />
              </div>
              <h3>1. Akuisisi Buyer &amp; Pra-Transaksi</h3>
              <p>
                Generator Inquiry, Quotation, &amp; Offer Letter otomatis dengan 3 gaya AI copywriting
                (Formal, Semi-Formal, Casual) plus checklist validasi legalitas calon buyer.
              </p>
            </article>

            <article className="ef-pillar-card">
              <div className="ef-pillar-icon amber">
                <Scale size={18} />
              </div>
              <h3>2. Verifikator HS Code &amp; Lartas</h3>
              <p>
                Deteksi potensi Lartas komoditas, opsi tarif FTA/CEPA yang lebih efisien, serta pengingat
                kedaluwarsa Karantina, e-SKA/COO, SVLK, Halal &amp; BPOM secara dini.
              </p>
            </article>

            <article className="ef-pillar-card">
              <div className="ef-pillar-icon blue">
                <FileCheck2 size={18} />
              </div>
              <h3>3. 5 Dokumen Inti + Word Editor</h3>
              <p>
                Sekali input untuk Proforma Invoice, Sales Contract, Commercial Invoice, Packing List, dan
                Shipping Instruction yang konsisten, siap PDF A4/Folio/Letter &amp; ekspor .docx.
              </p>
            </article>

            <article className="ef-pillar-card">
              <div className="ef-pillar-icon red">
                <ShieldAlert size={18} />
              </div>
              <h3>4. AI OCR B/L Scrutiny &amp; H-7 PEB</h3>
              <p>
                Pencocokan silang 3-Way Draft B/L vs CI/PL sebelum finalisasi pelayaran, notifikasi revisi
                ke forwarder, dan timeline countdown H-7 hingga closing PEB.
              </p>
            </article>

            <article className="ef-pillar-card">
              <div className="ef-pillar-icon green">
                <Ship size={18} />
              </div>
              <h3>5. Muatan 3D, HPP &amp; Penagihan TT</h3>
              <p>
                Kalkulator HPP Trader/Manufaktur, 7 skenario Incoterms® 2020, visualisasi 3D kontainer
                20ft/40HC, cap digital <i>Scanned Copy</i> &amp; draf email pelunasan T/T otomatis.
              </p>
            </article>

            <article className="ef-pillar-card">
              <div className="ef-pillar-icon indigo">
                <FolderArchive size={18} />
              </div>
              <h3>6. Audit Vault DJBC &amp; Tracking</h3>
              <p>
                Arsip digital 5 folder siap pemeriksaan Bea Cukai (PO, Komersial, PEB/NPE, B/L, Bukti T/T),
                peta pelacakan pelayaran laut, dan panduan onboarding 30 hari.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* 5. Skema Langganan 3 Tingkat & Kuota Hibrida */}
      <section id="paket-harga" className="ef-landing-section ef-pricing-band">
        <div className="ef-landing-container">
          <div className="ef-section-heading">
            <span className="eyebrow">SKEMA LANGGANAN 3 TINGKAT &amp; KUOTA HIBRIDA</span>
            <h2>Mulai dari Gratis 3 Hari, Tumbuh Sesuai Volume Ekspor</h2>
            <p>
              Setiap paket sudah mencakup kuota dokumen bulanan. Saat shipment sedang tinggi, sistem kuota
              hibrida memungkinkan Anda membayar selisih ekstra per dokumen saja tanpa harus paksa upgrade.
            </p>
          </div>

          {/* Toggle Siklus Tagihan & Simulasi Volume Dokumen */}
          <div className="ef-pricing-controls">
            <div className="ef-billing-toggle" role="group" aria-label="Pilih siklus penagihan">
              <button
                type="button"
                className={billingCycle === "monthly" ? "active" : ""}
                onClick={() => setBillingCycle("monthly")}
              >
                Tagihan Bulanan
              </button>
              <button
                type="button"
                className={billingCycle === "annual" ? "active" : ""}
                onClick={() => setBillingCycle("annual")}
              >
                Tahunan (Hemat 10%)
              </button>
            </div>

            <div className="ef-quota-slider-box">
              <label htmlFor="landing-quota-slider">
                Simulasi Volume Dokumen Anda: <b>{monthlyDocsEstimate} dokumen / bulan</b>
              </label>
              <input
                id="landing-quota-slider"
                type="range"
                min={10}
                max={300}
                step={5}
                value={monthlyDocsEstimate}
                onChange={(e) => setMonthlyDocsEstimate(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="ef-pricing-grid">
            {SUBSCRIPTION_PLANS.map((plan) => {
              const calc = calculatePlanBilling(plan.id, billingCycle, monthlyDocsEstimate);
              return (
                <article
                  key={plan.id}
                  className={`ef-plan-card ${plan.highlighted ? "highlighted" : ""}`}
                >
                  {plan.highlighted && <div className="ef-plan-ribbon">REKOMENDASI UMKM AKTIF</div>}
                  <div className="ef-plan-top">
                    <h3>{plan.name}</h3>
                    <p>{plan.tagline}</p>
                    <div className="ef-plan-price">
                      <strong>{formatIdr(calc.effectiveMonthlyIdr)}</strong>
                      <span>/ bulan</span>
                    </div>
                    {billingCycle === "annual" && (
                      <small className="ef-plan-annual-note">
                        Total {formatIdr(calc.annualTotalIdr)}/thn · Hemat{" "}
                        {formatIdr(calc.annualDiscountSavedIdr)}
                      </small>
                    )}
                  </div>

                  <div className="ef-plan-quota-summary">
                    <div>
                      <span>Kuota Termasuk</span>
                      <b>{plan.monthlyDocQuota} dokumen / bln</b>
                    </div>
                    <div>
                      <span>Maks. Pengguna / RBAC</span>
                      <b>{plan.maxUsers} akun</b>
                    </div>
                    <div>
                      <span>Simulasi ({monthlyDocsEstimate} dok/bln)</span>
                      <b>
                        {calc.extraDocsCount === 0
                          ? "Masuk Kuota (Rp 0 ekstra)"
                          : `+${calc.extraDocsCount} dok (${formatIdr(calc.overageChargeIdr)})`}
                      </b>
                    </div>
                  </div>

                  <ul className="ef-plan-features">
                    {plan.features.map((feat) => (
                      <li key={feat}>
                        <Check size={14} /> <span>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="ef-plan-actions">
                    <button
                      type="button"
                      className={plan.highlighted ? "ef-plan-btn primary" : "ef-plan-btn"}
                      onClick={onStartDemo}
                    >
                      Coba Demo 3 Hari Dulu
                    </button>
                    <button
                      type="button"
                      className="ef-plan-btn ghost"
                      onClick={() => onOpenAuth("register")}
                    >
                      Daftar Paket {plan.name}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. Footer CTA Banner */}
      <footer className="ef-landing-footer">
        <div className="ef-landing-container ef-landing-footer-inner">
          <div>
            <div className="ef-footer-pill">
              <Clock size={13} /> Akses Uji Coba Gratis 72 Jam (3 Hari)
            </div>
            <h2>Siap Mengirim Ekspor Pertama Anda Tanpa Cemas Revisi B/L?</h2>
            <p>
              Masuk ke Sandbox Demo secara instan dengan 1 klik—uji coba seluruh kalkulator harga, AI Lartas,
              dokumen ekspor, hingga Audit Vault DJBC.
            </p>
          </div>
          <div className="ef-footer-cta-col">
            <button type="button" className="ef-cta-primary" onClick={onStartDemo}>
              <TrendingUp size={16} /> Luncurkan Demo 3 Hari
            </button>
            <button
              type="button"
              className="ef-cta-secondary"
              onClick={() => onOpenAuth("login")}
            >
              <ShieldCheck size={16} /> Masuk ke Workspace Perusahaan
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
