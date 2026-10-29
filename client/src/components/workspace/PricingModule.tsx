import type { ApprovalDecision, PartnerEntry } from "@/hooks/useWorkspaceFlow";
import { trpc } from "@/lib/trpc";
import {
  convertCurrencyValue,
  formatCurrencyAmount,
  getBiRateForCurrency,
  getRecommendedCurrencyForCountry,
  OFFICIAL_BI_RATES,
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
} from "@shared/currencies";
import { formatMoney, formatNumber } from "@shared/format";
import type { Pricing } from "@shared/pricing";
import type { ScreenId } from "@shared/risk";
import type { Incoterm, LineItem, Shipment } from "@shared/shipment";
import {
  ArrowRightLeft,
  ArrowUpRight,
  Check,
  ClipboardCheck,
  Globe,
  Info,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Field, LineItemsEditor, SectionTitle, SelectField, StatusPill } from "./Primitives";

export function PricingModule({
  shipment,
  update,
  updateNumber,
  updateLineItems,
  pricing,
  navigate,
  partners,
  applyPartner,
  effectiveApprovalStatus,
}: {
  shipment: Shipment;
  update: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void;
  updateNumber: (key: keyof Shipment, value: string) => void;
  updateLineItems: (items: LineItem[]) => void;
  pricing: Pricing;
  navigate: (screen: ScreenId) => void;
  partners: PartnerEntry[];
  applyPartner: (partner: PartnerEntry) => void;
  effectiveApprovalStatus: ApprovalDecision;
}) {
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [targetConvertCurrency, setTargetConvertCurrency] = useState<string>("USD");

  // Rekomendasi negara buyer
  const recommendedCurrency = getRecommendedCurrencyForCountry(shipment.buyerCountry);

  // Valas Bank Indonesia yang dipilih untuk ditampilkan (default ke valas transaksi, atau valas buyer, atau USD)
  const initialBiCur =
    shipment.currency !== "IDR"
      ? shipment.currency
      : (recommendedCurrency?.code && recommendedCurrency.code !== "IDR" ? recommendedCurrency.code : "USD");
  const [selectedBiCurrency, setSelectedBiCurrency] = useState<string>(initialBiCur);

  // Jika mata uang transaksi berganti ke valas, sinkronkan tampilan valas BI
  useEffect(() => {
    if (shipment.currency !== "IDR") {
      setSelectedBiCurrency(shipment.currency);
    }
  }, [shipment.currency]);

  // Query live market exchange rates via tRPC
  const {
    data: liveRates,
    isFetching: isFetchingRates,
    refetch: refetchRates,
  } = trpc.rates.getLatest.useQuery(undefined, {
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  // Ambil data kurs Bank Indonesia spesifik untuk valas yang dipilih
  const activeBiRate = getBiRateForCurrency(selectedBiCurrency);
  const biSellRate = activeBiRate.sellRate;
  const biBuyRate = activeBiRate.buyRate;
  const biMiddleRate = activeBiRate.middleRate;

  // Auto-init kurs referensi jika masih 0 / belum terisi
  useEffect(() => {
    if (!shipment.exchangeRate || shipment.exchangeRate <= 0) {
      update("exchangeRate", biSellRate);
      update("exchangeRateSource", `Bank Indonesia (Kurs Jual ${activeBiRate.currency})`);
      update("exchangeRateDate", new Date().toISOString().slice(0, 10));
    }
  }, [shipment.exchangeRate, biSellRate, activeBiRate.currency, update]);

  const currentFxRate = shipment.exchangeRate > 0 ? shipment.exchangeRate : biSellRate;
  const rateDiff = shipment.exchangeRate > 0 ? Math.round(shipment.exchangeRate - biSellRate) : 0;

  // Buyer target currency for dual currency conversion preview
  const defaultDualTarget =
    shipment.currency === "IDR"
      ? (recommendedCurrency?.code && recommendedCurrency.code !== "IDR" ? recommendedCurrency.code : "USD")
      : "IDR";
  const [buyerDualCurrency, setBuyerDualCurrency] = useState<string>(defaultDualTarget);

  const activeDualCurrency = shipment.currency === "IDR" ? buyerDualCurrency : "IDR";

  // Calculate dual currency values
  const convertedOffer = convertCurrencyValue(
    pricing.active.offer,
    shipment.currency,
    activeDualCurrency,
    currentFxRate,
    liveRates?.rates,
  );

  const convertedUnit = convertCurrencyValue(
    pricing.active.unit,
    shipment.currency,
    activeDualCurrency,
    currentFxRate,
    liveRates?.rates,
  );

  const convertedCost = convertCurrencyValue(
    pricing.active.cost,
    shipment.currency,
    activeDualCurrency,
    currentFxRate,
    liveRates?.rates,
  );

  // Apply Bank Indonesia rate to transaction
  const handleApplyBiRate = (type: "sell" | "middle" | "buy") => {
    const rateVal = type === "sell" ? biSellRate : type === "middle" ? biMiddleRate : biBuyRate;
    const label =
      type === "sell"
        ? `Kurs Jual BI ${activeBiRate.currency}`
        : type === "middle"
          ? `Kurs Tengah BI ${activeBiRate.currency}`
          : `Kurs Beli BI ${activeBiRate.currency}`;
    update("exchangeRate", Number(rateVal.toFixed(2)));
    const today = new Date().toISOString().slice(0, 10);
    update("exchangeRateDate", today);
    update("exchangeRateSource", `Bank Indonesia (${label})`);
    toast.success(`${label} diterapkan: 1 ${activeBiRate.currency} = Rp ${formatNumber(rateVal, 2)}`, {
      description: "Kurs transaksi, tanggal, dan sumber resmi Bank Indonesia berhasil disinkronkan.",
    });
  };

  // Convert all transaction numbers to target currency
  const executeConversion = (targetCur: string) => {
    const fromCur = shipment.currency;
    if (fromCur === targetCur) {
      setShowConvertModal(false);
      return;
    }

    const rate = currentFxRate;
    const isTargetIdr = targetCur === "IDR";

    // 1. Convert unitPrice
    const newUnitPrice = convertCurrencyValue(shipment.unitPrice, fromCur, targetCur, rate, liveRates?.rates);
    update("unitPrice", isTargetIdr ? Math.round(newUnitPrice) : Number(newUnitPrice.toFixed(2)));

    // 2. Convert lineItems
    const updatedLineItems = shipment.lineItems.map((item) => {
      const convUnit = convertCurrencyValue(item.unitPrice, fromCur, targetCur, rate, liveRates?.rates);
      const roundedUnit = isTargetIdr ? Math.round(convUnit) : Number(convUnit.toFixed(2));
      return {
        ...item,
        unitPrice: roundedUnit,
        amount: isTargetIdr ? Math.round(roundedUnit * item.quantity) : Number((roundedUnit * item.quantity).toFixed(2)),
      };
    });
    updateLineItems(updatedLineItems);

    // 3. Convert all cost fields
    const costKeys: (keyof Shipment)[] = [
      "packaging",
      "inlandTransport",
      "originHandling",
      "customs",
      "freight",
      "insurance",
      "destinationHandling",
      "importDuty",
      "lastMile",
      "discount",
    ];

    costKeys.forEach((key) => {
      const val = Number(shipment[key]) || 0;
      if (val > 0) {
        const conv = convertCurrencyValue(val, fromCur, targetCur, rate, liveRates?.rates);
        const rounded = isTargetIdr ? Math.round(conv) : Number(conv.toFixed(2));
        update(key, rounded as any);
      }
    });

    // 4. Update currency
    update("currency", targetCur);
    setShowConvertModal(false);

    toast.success(`Seluruh nominal transaksi berhasil dikonversi ke ${targetCur}`, {
      description: `Rincian harga barang, line items, dan biaya logistik telah disesuaikan berdasarkan kurs acuan.`,
    });
  };

  const maxScenarioOffer = Math.max(
    1,
    pricing.scenarios[pricing.scenarios.length - 1]?.offer ?? 1,
  );

  return (
    <div className="module-stack">
      <div className="module-layout">
        <section className="panel panel-padding input-panel">
          <SectionTitle
            eyebrow="INPUT TRANSAKSI"
            title="Komponen harga & order"
            description="Masukkan biaya aktual atau estimasi. Ruleset ditampilkan sebagai Incoterms® 2020; named place tetap wajib direview tim operasional."
            action={
              partners.length > 0 ? (
                <select
                  className="clean-select"
                  value=""
                  aria-label="Isi cepat dari direktori mitra"
                  onChange={(event) => {
                    const found = partners.find((p) => p.id === event.target.value);
                    if (found) {
                      applyPartner(found);
                      toast.success(`Buyer ${found.name} diterapkan`);
                    }
                  }}
                >
                  <option value="">Isi cepat buyer dari direktori...</option>
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.country})
                    </option>
                  ))}
                </select>
              ) : null
            }
          />

          <div className="form-section">
            <div className="form-section-title">
              <span className="section-number">01</span>
              <div>
                <b>Nilai barang</b>
                <small>Basis perhitungan dari seluruh line item ({shipment.currency})</small>
              </div>
            </div>
            <div className="form-grid three">
              <Field
                label="Produk utama"
                value={shipment.product}
                onChange={(value) => update("product", value)}
              />
              <Field
                label="Quantity total"
                value={shipment.quantity}
                type="number"
                suffix={shipment.unit}
                onChange={(value) => updateNumber("quantity", value)}
              />
              <Field
                label="Harga unit utama"
                value={shipment.unitPrice}
                type="number"
                prefix={shipment.currency}
                onChange={(value) => updateNumber("unitPrice", value)}
              />
            </div>
            <LineItemsEditor
              items={shipment.lineItems}
              updateItems={updateLineItems}
              currency={shipment.currency}
              onOpenCatalog={() => navigate("products")}
            />
          </div>

          <div className="form-section">
            <div className="form-section-title">
              <span className="section-number">02</span>
              <div>
                <b>Biaya logistik & kepabeanan</b>
                <small>Aktif otomatis sesuai cakupan Incoterm ({shipment.currency})</small>
              </div>
            </div>
            <div className="form-grid three">
              <Field
                label="Packaging"
                value={shipment.packaging}
                type="number"
                prefix={shipment.currency}
                onChange={(value) => updateNumber("packaging", value)}
              />
              <Field
                label="Inland transport"
                value={shipment.inlandTransport}
                type="number"
                prefix={shipment.currency}
                onChange={(value) => updateNumber("inlandTransport", value)}
              />
              <Field
                label="Origin handling"
                value={shipment.originHandling}
                type="number"
                prefix={shipment.currency}
                onChange={(value) => updateNumber("originHandling", value)}
              />
              <Field
                label="Customs clearance"
                value={shipment.customs}
                type="number"
                prefix={shipment.currency}
                onChange={(value) => updateNumber("customs", value)}
              />
              <Field
                label="Ocean freight"
                value={shipment.freight}
                type="number"
                prefix={shipment.currency}
                onChange={(value) => updateNumber("freight", value)}
              />
              <Field
                label="Insurance"
                value={shipment.insurance}
                type="number"
                prefix={shipment.currency}
                onChange={(value) => updateNumber("insurance", value)}
              />
              <Field
                label="Destination handling"
                value={shipment.destinationHandling}
                type="number"
                prefix={shipment.currency}
                onChange={(value) => updateNumber("destinationHandling", value)}
              />
              <Field
                label="Import duty"
                value={shipment.importDuty}
                type="number"
                prefix={shipment.currency}
                onChange={(value) => updateNumber("importDuty", value)}
              />
              <Field
                label="Last mile delivery"
                value={shipment.lastMile}
                type="number"
                prefix={shipment.currency}
                onChange={(value) => updateNumber("lastMile", value)}
              />
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">
              <span className="section-number">03</span>
              <div>
                <b>Strategi penawaran, mata uang & kurs pasar</b>
                <small>
                  Formula tersimpan sebagai {shipment.formulaVersion}. Mendukung pemilihan mata uang per negara dan kurs realtime.
                </small>
              </div>
            </div>

            {/* WIDGET KURS TRANSAKSI BANK INDONESIA (BI RESMI) */}
            <div className="fx-market-box">
              <div className="fx-market-top">
                <div className="fx-status-badge">
                  <span className="fx-pulse-dot" />
                  <b>Bank Indonesia · Kurs Transaksi BI</b>
                  <span className="fx-update-time">
                    {liveRates?.lastUpdated ? `· Update ${liveRates.lastUpdated}` : "· Terhubung"}
                  </span>
                </div>

                <div className="fx-top-actions">
                  <div className="fx-currency-picker-wrap">
                    <span className="fx-picker-label">Pilih Valas BI:</span>
                    <select
                      className="fx-currency-picker-select"
                      value={selectedBiCurrency}
                      onChange={(e) => setSelectedBiCurrency(e.target.value)}
                      title="Pilih valuta asing untuk melihat kurs Bank Indonesia"
                    >
                      {OFFICIAL_BI_RATES.map((r) => (
                        <option key={r.currency} value={r.currency}>
                          {r.flag} {r.currency} · {r.currencyName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    className="fx-refresh-btn"
                    onClick={() => {
                      refetchRates();
                      toast.info("Menyinkronkan data Kurs Transaksi Bank Indonesia...");
                    }}
                    disabled={isFetchingRates}
                    title="Segarkan data kurs resmi Bank Indonesia"
                  >
                    <RefreshCw size={13} className={isFetchingRates ? "spin" : ""} />
                    {isFetchingRates ? "..." : "Perbarui"}
                  </button>
                </div>
              </div>

              {/* 3 PILAR KURS BANK INDONESIA UNTUK VALAS TERPILIH */}
              <div className="fx-bi-rates-grid">
                <div className="fx-bi-card sell-card">
                  <div className="fx-bi-card-head">
                    <span className="fx-bi-badge sell">KURS JUAL {activeBiRate.currency}</span>
                    <small className="fx-bi-sub">Proteksi harga penawaran buyer</small>
                  </div>
                  <strong className="fx-bi-val">Rp {formatNumber(biSellRate, 2)}</strong>
                  <button
                    type="button"
                    className="fx-bi-apply-btn primary"
                    onClick={() => handleApplyBiRate("sell")}
                  >
                    <Zap size={13} /> Terapkan Kurs Jual
                  </button>
                </div>

                <div className="fx-bi-card middle-card">
                  <div className="fx-bi-card-head">
                    <span className="fx-bi-badge middle">KURS TENGAH {activeBiRate.currency}</span>
                    <small className="fx-bi-sub">Rata-rata jual & beli</small>
                  </div>
                  <strong className="fx-bi-val">Rp {formatNumber(biMiddleRate, 2)}</strong>
                  <button
                    type="button"
                    className="fx-bi-apply-btn secondary"
                    onClick={() => handleApplyBiRate("middle")}
                  >
                    Terapkan Kurs Tengah
                  </button>
                </div>

                <div className="fx-bi-card buy-card">
                  <div className="fx-bi-card-head">
                    <span className="fx-bi-badge buy">KURS BELI {activeBiRate.currency}</span>
                    <small className="fx-bi-sub">Pencairan devisa bank</small>
                  </div>
                  <strong className="fx-bi-val">Rp {formatNumber(biBuyRate, 2)}</strong>
                  <button
                    type="button"
                    className="fx-bi-apply-btn secondary"
                    onClick={() => handleApplyBiRate("buy")}
                  >
                    Terapkan Kurs Beli
                  </button>
                </div>
              </div>

              {/* STATUS PERBANDINGAN KURS TRANSAKSI SAAT INI */}
              <div className="fx-bi-status-row">
                {Math.abs(shipment.exchangeRate - biSellRate) < 1 ? (
                  <span className="fx-pill-matched">
                    <Check size={14} /> Transaksi memakai <b>Kurs Jual BI {activeBiRate.currency} (Rp {formatNumber(shipment.exchangeRate, 2)})</b>. Aman dari risiko margin devisa murah/rugi kurs.
                  </span>
                ) : (
                  <span className="fx-pill-custom">
                    <Info size={14} /> Kurs aktif transaksi: <b>Rp {formatNumber(shipment.exchangeRate, 2)}</b> (selisih {rateDiff > 0 ? "+" : ""}{formatNumber(rateDiff)} IDR dari Kurs Jual BI {activeBiRate.currency}).
                  </span>
                )}
              </div>
            </div>

            {/* REKOMENDASI MATA UANG SESUAI NEGARA BUYER */}
            {recommendedCurrency && recommendedCurrency.code !== shipment.currency && (
              <div className="fx-buyer-currency-banner">
                <Globe size={16} />
                <div className="fx-buyer-currency-info">
                  <span>
                    Buyer berasal dari <b>{shipment.buyerCountry}</b>. Rekomendasi mata uang kontrak:{" "}
                    <b>{recommendedCurrency.flag} {recommendedCurrency.name} ({recommendedCurrency.code})</b>.
                  </span>
                </div>
                <button
                  type="button"
                  className="fx-buyer-apply-btn"
                  onClick={() => {
                    setTargetConvertCurrency(recommendedCurrency.code);
                    setShowConvertModal(true);
                  }}
                >
                  <ArrowRightLeft size={13} /> Konversi ke {recommendedCurrency.code}
                </button>
              </div>
            )}

            {/* QUICK DUAL CURRENCY CONVERTER BAR */}
            <div className="fx-conversion-helper-bar">
              <div className="fx-conv-text">
                <ArrowRightLeft size={15} />
                {shipment.currency === "IDR" ? (
                  <span>
                    Transaksi Anda saat ini dalam <b>Rupiah (IDR)</b>. Ingin mengonversi seluruh penawaran dan rincian biaya ke <b>USD</b> atau valas buyer?
                  </span>
                ) : (
                  <span>
                    Transaksi Anda saat ini dalam <b>{shipment.currency}</b>. Ingin mengonversi seluruh rincian nominal ke <b>Rupiah (IDR)</b> untuk evaluasi biaya lokal?
                  </span>
                )}
              </div>
              <div className="fx-conv-actions">
                <button
                  type="button"
                  className="fx-quick-convert-btn"
                  onClick={() => {
                    const target = shipment.currency === "IDR" ? "USD" : "IDR";
                    setTargetConvertCurrency(target);
                    setShowConvertModal(true);
                  }}
                >
                  <TrendingUp size={13} />
                  {shipment.currency === "IDR" ? "Konversi Seluruh Nilai ke USD" : "Konversi Seluruh Nilai ke IDR"}
                </button>
              </div>
            </div>

            <div className="form-grid three">
              <SelectField
                label="Incoterm disepakati"
                value={shipment.incoterm}
                onChange={(value) => update("incoterm", value as Incoterm)}
              >
                {["EXW", "FCA", "FOB", "CFR", "CIF", "DAP", "DDP"].map((term) => (
                  <option key={term}>{term}</option>
                ))}
              </SelectField>

              {/* CURRENCY SELECTOR BERDASARKAN NEGARA */}
              <SelectField
                label="Mata uang transaksi"
                value={shipment.currency}
                onChange={(value) => {
                  if (value !== shipment.currency) {
                    setTargetConvertCurrency(value);
                    setShowConvertModal(true);
                  }
                }}
              >
                {SUPPORTED_CURRENCIES.map((cur) => (
                  <option key={cur.code} value={cur.code}>
                    {cur.flag} {cur.code} · {cur.name} ({cur.country})
                  </option>
                ))}
                {!SUPPORTED_CURRENCIES.some((c) => c.code === shipment.currency) && (
                  <option value={shipment.currency}>{shipment.currency} (Custom)</option>
                )}
              </SelectField>

              <Field
                label="Target margin"
                value={shipment.margin}
                type="number"
                suffix="%"
                step="0.5"
                onChange={(value) => updateNumber("margin", value)}
              />
              <Field
                label="Diskon buyer"
                value={shipment.discount}
                type="number"
                prefix={shipment.currency}
                onChange={(value) => updateNumber("discount", value)}
              />
              <Field
                label="Contingency"
                value={shipment.contingency}
                type="number"
                suffix="%"
                step="0.5"
                onChange={(value) => updateNumber("contingency", value)}
              />
              <Field
                label="Kurs referensi"
                value={shipment.exchangeRate}
                type="number"
                suffix="IDR"
                step="0.01"
                onChange={(value) => updateNumber("exchangeRate", value)}
              />
              <Field
                label="Tanggal kurs"
                value={shipment.exchangeRateDate}
                onChange={(value) => update("exchangeRateDate", value)}
              />
              <Field
                label="Sumber kurs"
                value={shipment.exchangeRateSource}
                onChange={(value) => update("exchangeRateSource", value)}
              />
              <Field
                label="Named place / port"
                value={shipment.namedPlace}
                onChange={(value) => update("namedPlace", value)}
              />
            </div>
          </div>
        </section>

        {/* ASIDE OFFER PREVIEW DENGAN DUAL CURRENCY CONVERSION */}
        <aside className="pricing-aside">
          <div className="quote-card">
            <div className="quote-top">
              <span className="eyebrow light">OFFER PREVIEW</span>
              <StatusPill tone="amber">{shipment.incoterm}</StatusPill>
            </div>
            
            <span className="quote-label">TOTAL PENAWARAN UTAMA</span>
            <strong>{formatCurrencyAmount(pricing.active.offer, shipment.currency)}</strong>

            {/* DUAL CURRENCY CONVERSION DISPLAY */}
            <div className="quote-dual-box">
              <div className="quote-dual-header">
                <span className="quote-dual-title">
                  {shipment.currency === "IDR"
                    ? `Konversi Valas Buyer (${activeDualCurrency}):`
                    : "Ekuivalen Rupiah (IDR):"}
                </span>
                {shipment.currency === "IDR" && (
                  <select
                    className="quote-dual-select"
                    value={buyerDualCurrency}
                    onChange={(e) => setBuyerDualCurrency(e.target.value)}
                    title="Pilih mata uang buyer untuk konversi"
                  >
                    <option value="USD">🇺🇸 USD ($)</option>
                    <option value="EUR">🇪🇺 EUR (€)</option>
                    <option value="JPY">🇯🇵 JPY (¥)</option>
                    <option value="SGD">🇸🇬 SGD (S$)</option>
                    <option value="CNY">🇨🇳 CNY (¥)</option>
                    <option value="GBP">🇬🇧 GBP (£)</option>
                    <option value="AUD">🇦🇺 AUD (A$)</option>
                  </select>
                )}
              </div>
              <div className="quote-dual-amount">
                ≈ {formatCurrencyAmount(convertedOffer, activeDualCurrency)}
              </div>
              <div className="quote-dual-rate-info">
                <span>Basis: 1 USD = Rp {formatNumber(currentFxRate)}</span>
                {rateDiff !== 0 && (
                  <span className="quote-dual-tag">
                    {rateDiff > 0 ? `+Rp ${formatNumber(rateDiff)}` : `-Rp ${formatNumber(Math.abs(rateDiff))}`} buffer
                  </span>
                )}
              </div>
            </div>

            <div className="quote-unit">
              <span>Per {shipment.unit}</span>
              <div className="quote-unit-val">
                <b>{formatCurrencyAmount(pricing.active.unit, shipment.currency)}</b>
                <span className="quote-unit-dual">
                  (≈ {formatCurrencyAmount(convertedUnit, activeDualCurrency)})
                </span>
              </div>
            </div>

            <div className="quote-breakdown">
              <div>
                <span>Cost to serve + contingency</span>
                <b>
                  {formatCurrencyAmount(pricing.active.cost, shipment.currency)}
                  <small className="breakdown-dual-sub">
                    {" "}(≈ {formatCurrencyAmount(convertedCost, activeDualCurrency)})
                  </small>
                </b>
              </div>
              <div>
                <span>Margin {shipment.margin}%</span>
                <b className="mint-text">+ {formatCurrencyAmount(pricing.active.profit, shipment.currency)}</b>
              </div>
              <div>
                <span>Diskon</span>
                <b>{shipment.discount ? `- ${formatCurrencyAmount(shipment.discount, shipment.currency)}` : "—"}</b>
              </div>
              <div>
                <span>Status Persetujuan</span>
                <b>{effectiveApprovalStatus}</b>
              </div>
            </div>

            <div className="module-stack" style={{ gap: 8 }}>
              <button
                type="button"
                className="full-button"
                disabled={pricing.validationErrors.length > 0}
                onClick={() => {
                  toast.success("Harga siap dipakai di dokumen", {
                    description: "Membuka Dokumen Ekspor dengan nilai penawaran terbaru.",
                  });
                  navigate("documents");
                }}
              >
                Lanjut ke Dokumen Ekspor <ArrowUpRight size={15} />
              </button>
              <button
                type="button"
                className="quote-secondary-btn"
                onClick={() => navigate("approvals")}
              >
                <ClipboardCheck size={14} /> Buka Review Persetujuan ({effectiveApprovalStatus})
              </button>
            </div>
          </div>

          <div className="quote-metadata">
            <span>Formula: {shipment.formulaVersion}</span>
            <span>
              Kurs: {shipment.exchangeRateSource} · {shipment.exchangeRateDate}
            </span>
          </div>

          <div className="tip-card">
            <Sparkles size={17} />
            <div>
              <b>Kompensasi fluktuasi valas</b>
              <p>
                {shipment.currency === "IDR"
                  ? "Transaksi dihitung dalam Rupiah. Buyer luar negeri biasanya menerima penawaran dalam USD atau valas negara mereka."
                  : `Transaksi disajikan dalam ${shipment.currency}. Ekuivalen Rupiah dihitung dengan kurs acuan Rp ${formatNumber(currentFxRate)}.`}
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* MODAL KONFIRMASI KONVERSI MATA UANG */}
      {showConvertModal && (
        <div className="fx-modal-backdrop" onClick={() => setShowConvertModal(false)}>
          <div className="fx-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="fx-modal-header">
              <div className="fx-modal-icon">
                <ArrowRightLeft size={20} />
              </div>
              <div>
                <h4>Konfirmasi Konversi Mata Uang</h4>
                <p>
                  Ubah transaksi dari <b>{shipment.currency}</b> ke <b>{targetConvertCurrency}</b>
                </p>
              </div>
            </div>

            <div className="fx-modal-body">
              <div className="fx-modal-summary">
                <div className="fx-modal-row">
                  <span>Kurs Acuan:</span>
                  <b>1 USD = Rp {formatNumber(currentFxRate)}</b>
                </div>
                <div className="fx-modal-row">
                  <span>Total Penawaran Saat Ini ({shipment.currency}):</span>
                  <b>{formatCurrencyAmount(pricing.active.offer, shipment.currency)}</b>
                </div>
                <div className="fx-modal-row highlight">
                  <span>Hasil Estimasi Penawaran ({targetConvertCurrency}):</span>
                  <b className="text-emerald">
                    {formatCurrencyAmount(
                      convertCurrencyValue(
                        pricing.active.offer,
                        shipment.currency,
                        targetConvertCurrency,
                        currentFxRate,
                        liveRates?.rates,
                      ),
                      targetConvertCurrency,
                    )}
                  </b>
                </div>
              </div>

              <div className="fx-modal-options">
                <p className="fx-modal-lead">Pilih opsi penyesuaian nominal:</p>
                <div className="fx-modal-choice-cards">
                  <div
                    className="fx-choice-card active"
                    onClick={() => executeConversion(targetConvertCurrency)}
                  >
                    <b>1. Konversi Seluruh Angka (Direkomendasikan)</b>
                    <small>
                      Harga unit barang, line items, dan seluruh komponen biaya logistik (inland, freight, dll.)
                      dihitung ulang secara otomatis ke nilai ekuivalen {targetConvertCurrency}.
                    </small>
                  </div>
                  <div
                    className="fx-choice-card"
                    onClick={() => {
                      update("currency", targetConvertCurrency);
                      setShowConvertModal(false);
                      toast.info(`Simbol mata uang diubah ke ${targetConvertCurrency} tanpa mengubah nominal angka.`);
                    }}
                  >
                    <b>2. Hanya Ganti Kode Mata Uang</b>
                    <small>
                      Pertahankan angka nominal apa adanya tanpa konversi perkalian/pembagian kurs.
                    </small>
                  </div>
                </div>
              </div>
            </div>

            <div className="fx-modal-footer">
              <button
                type="button"
                className="ghost-button"
                onClick={() => setShowConvertModal(false)}
              >
                Batal
              </button>
              <button
                type="button"
                className="save-button"
                onClick={() => executeConversion(targetConvertCurrency)}
              >
                Konversikan Semua Angka ke {targetConvertCurrency}
              </button>
            </div>
          </div>
        </div>
      )}

      {pricing.validationErrors.length > 0 && (
        <div className="validation-banner">
          <ShieldAlert size={16} />
          <div>
            <b>Perlu diperbaiki sebelum quote dipakai</b>
            {pricing.validationErrors.map((error) => (
              <small key={error}>{error}</small>
            ))}
          </div>
        </div>
      )}

      <section className="panel panel-padding">
        <div className="panel-head">
          <div>
            <span className="eyebrow">INCOTERM COMPARISON · INCOTERMS® 2020</span>
            <h3>Perbandingan cepat 7 skenario ({shipment.currency})</h3>
          </div>
          <span className="muted-note">Margin tetap {shipment.margin}%</span>
        </div>
        <div className="comparison-cards">
          {pricing.scenarios.map((scenario) => (
            <button
              type="button"
              key={scenario.term}
              className={`comparison-card ${scenario.term === shipment.incoterm ? "active" : ""}`}
              onClick={() => update("incoterm", scenario.term)}
            >
              <div className="comparison-term">
                <b>{scenario.term}</b>
                {scenario.term === shipment.incoterm && <Check size={14} />}
              </div>
              <strong>{formatCurrencyAmount(scenario.offer, shipment.currency)}</strong>
              <small>
                {scenario.term === "EXW"
                  ? "Warehouse"
                  : scenario.term === "FCA"
                    ? "First carrier"
                    : scenario.term === "FOB"
                      ? "On vessel"
                      : scenario.term === "CFR"
                        ? "Freight"
                        : scenario.term === "CIF"
                          ? "Freight + insurance"
                          : scenario.term === "DAP"
                            ? "At destination"
                            : "Delivered duty paid"}
              </small>
              <div className="comparison-bar">
                <i
                  style={{
                    width: `${Math.min(100, Math.max(18, (scenario.offer / maxScenarioOffer) * 100))}%`,
                  }}
                />
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
