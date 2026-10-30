import type { ApprovalDecision, PartnerEntry } from "@/hooks/useWorkspaceFlow";
import { trpc } from "@/lib/trpc";
import {
  convertTemplateCost,
  COUNTRY_REGULATION_PRESETS,
  INCOTERM_TEMPLATES,
  type CountryRegulationPreset,
} from "@shared/costFactors";
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
import { incotermCostKeys, type Pricing } from "@shared/pricing";
import type { ScreenId } from "@shared/risk";
import type { Incoterm, LineItem, Shipment } from "@shared/shipment";
import {
  ArrowRightLeft,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ClipboardCheck,
  FileCheck,
  Globe,
  Info,
  Layers,
  Plus,
  RefreshCw,
  Scale,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  X,
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

  // State untuk Modal Faktor Pembentuk Harga & Regulasi Buyer
  const [showCostFactorsModal, setShowCostFactorsModal] = useState<boolean>(false);
  const [costFactorTab, setCostFactorTab] = useState<"incoterm" | "regulations" | "custom">("incoterm");
  const [customFactorName, setCustomFactorName] = useState<string>("");
  const [customFactorAmount, setCustomFactorAmount] = useState<string>("");
  const [customFactorTarget, setCustomFactorTarget] = useState<keyof Shipment>("customs");

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

  // Subtotal komponen pembentuk harga transaksi ekspor
  const goodsSubtotal = pricing.goods + (shipment.packaging || 0);
  const activeIncotermKeys = incotermCostKeys[shipment.incoterm] || [];
  const logisticsSubtotal = activeIncotermKeys
    .filter((k) => k !== "goods" && k !== "packaging")
    .reduce((sum, key) => sum + (Number(shipment[key]) || 0), 0);

  const directCostTotal = goodsSubtotal + logisticsSubtotal;
  const contingencyAmount = (directCostTotal * Math.max(0, shipment.contingency)) / 100;
  const totalCostWithContingency = directCostTotal + contingencyAmount;
  const targetMargin = shipment.margin / 100;
  const netOfferBeforeDiscount = targetMargin < 1 ? totalCostWithContingency / Math.max(0.0001, 1 - targetMargin) : 0;
  const totalOffer = Math.max(0, netOfferBeforeDiscount - shipment.discount);
  const totalProfit = Math.max(0, totalOffer - totalCostWithContingency);

  const convertedGoods = convertCurrencyValue(goodsSubtotal, shipment.currency, activeDualCurrency, currentFxRate, liveRates?.rates);
  const convertedLogistics = convertCurrencyValue(logisticsSubtotal, shipment.currency, activeDualCurrency, currentFxRate, liveRates?.rates);
  const convertedContingency = convertCurrencyValue(contingencyAmount, shipment.currency, activeDualCurrency, currentFxRate, liveRates?.rates);

  // Auto-apply faktor Incoterm
  const handleApplyIncotermTemplate = (term: Incoterm) => {
    const template = INCOTERM_TEMPLATES[term];
    if (!template) return;
    const costs = template.defaultCostsIdr;
    update("packaging", convertTemplateCost(costs.packaging, shipment.currency, currentFxRate));
    update("inlandTransport", convertTemplateCost(costs.inlandTransport, shipment.currency, currentFxRate));
    update("originHandling", convertTemplateCost(costs.originHandling, shipment.currency, currentFxRate));
    update("customs", convertTemplateCost(costs.customs, shipment.currency, currentFxRate));
    update("freight", convertTemplateCost(costs.freight, shipment.currency, currentFxRate));
    update("insurance", convertTemplateCost(costs.insurance, shipment.currency, currentFxRate));
    update("destinationHandling", convertTemplateCost(costs.destinationHandling, shipment.currency, currentFxRate));
    update("importDuty", convertTemplateCost(costs.importDuty, shipment.currency, currentFxRate));
    update("lastMile", convertTemplateCost(costs.lastMile, shipment.currency, currentFxRate));

    if (shipment.contingency <= 0) {
      update("contingency", template.recommendedContingency);
    }

    toast.success(`Faktor biaya standar ${term} (${template.name}) berhasil diterapkan`, {
      description: `Seluruh pos logistik dan tanggung jawab penjual telah disinkronkan (${shipment.currency}).`,
    });
  };

  // Tambah regulasi preset
  const handleAddRegulationPreset = (preset: CountryRegulationPreset) => {
    const amountInCurrency = convertTemplateCost(preset.defaultAmountIdr, shipment.currency, currentFxRate);
    if (preset.field === "contingency") {
      const nextContingency = Math.min(15, (shipment.contingency || 0) + 2);
      update("contingency", nextContingency);
      toast.success(`Buffer kontinjensi diperbarui menjadi ${nextContingency}%`);
      return;
    }
    const currentVal = Number(shipment[preset.field]) || 0;
    const newVal = Number((currentVal + amountInCurrency).toFixed(2));
    update(preset.field, newVal);
    toast.success(`${preset.name} (+${formatCurrencyAmount(amountInCurrency, shipment.currency)}) berhasil ditambahkan`);
  };

  // Tambah faktor manual kustom
  const handleAddCustomFactor = () => {
    const num = parseFloat(customFactorAmount.replace(/[^0-9.-]+/g, ""));
    if (isNaN(num) || num <= 0) {
      toast.error("Masukkan nominal angka faktor biaya yang valid");
      return;
    }
    const currentVal = Number(shipment[customFactorTarget]) || 0;
    const newVal = Number((currentVal + num).toFixed(2));
    update(customFactorTarget, newVal);
    toast.success(`Faktor "${customFactorName || 'Biaya Khusus Buyer'}" (+${formatCurrencyAmount(num, shipment.currency)}) berhasil ditambahkan ke pos ${customFactorTarget}`);
    setCustomFactorName("");
    setCustomFactorAmount("");
  };

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
                <b>Nilai barang & komoditas</b>
                <small>Basis perhitungan dari seluruh line item ({shipment.currency})</small>
              </div>
              <button
                type="button"
                className="section-factor-btn"
                onClick={() => {
                  setCostFactorTab("regulations");
                  setShowCostFactorsModal(true);
                }}
                title="Buka form faktor regulasi produk & kemasan ekspor"
              >
                <SlidersHorizontal size={12} /> Faktor Regulasi Barang
              </button>
            </div>
            <div className="form-grid four">
              <Field
                label="Produk utama"
                value={shipment.product}
                onChange={(value) => update("product", value)}
              />
              <Field
                label="Quantity total"
                value={shipment.quantity}
                type="number"
                onChange={(value) => updateNumber("quantity", value)}
              />
              <SelectField
                label="Satuan komoditas"
                value={shipment.unit}
                onChange={(val) => {
                  update("unit", val);
                  if (shipment.lineItems.length > 0) {
                    const updated = shipment.lineItems.map((item, idx) =>
                      idx === 0 ? { ...item, unit: val } : item,
                    );
                    updateLineItems(updated);
                  }
                }}
              >
                <option value="kg">kg · Kilogram</option>
                <option value="ton">ton · Ton (Metric Ton)</option>
                <option value="pcs">pcs · Pieces / Biji</option>
                <option value="carton">carton · Karton / Box</option>
                <option value="bag">bag · Karung / Kantong</option>
                <option value="drum">drum · Drum / Barel</option>
                <option value="liter">liter · Liter</option>
                <option value="pack">pack · Kemasan Pack</option>
                <option value="roll">roll · Roll / Gulungan</option>
                {!["kg", "ton", "pcs", "carton", "bag", "drum", "liter", "pack", "roll"].includes(
                  shipment.unit,
                ) && <option value={shipment.unit}>{shipment.unit} (Kustom)</option>}
              </SelectField>
              <Field
                label={`Harga per ${shipment.unit || "unit"}`}
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
              <button
                type="button"
                className="section-factor-btn"
                onClick={() => {
                  setCostFactorTab("incoterm");
                  setShowCostFactorsModal(true);
                }}
                title="Isi otomatis estimasi biaya logistik berdasarkan Incoterm"
              >
                <Zap size={12} /> Auto-Fill Faktor Incoterm ({shipment.incoterm})
              </button>
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
              <button
                type="button"
                className="section-factor-btn highlight"
                onClick={() => {
                  setCostFactorTab("incoterm");
                  setShowCostFactorsModal(true);
                }}
                title="Buka form faktor harga Incoterm dan regulasi buyer"
              >
                <Scale size={12} /> Kelola Faktor Harga & Regulasi
              </button>
            </div>

            {/* KURS BANK INDONESIA (PANEL BERSIH & TERTATA) */}
            <div className="fx-clean-bar">
              <div className="fx-clean-head">
                <div className="fx-clean-title">
                  <span className="fx-pulse-dot" />
                  <b>Kurs Acuan Bank Indonesia (BI Resmi)</b>
                </div>

                <div className="fx-clean-picker">
                  <span className="fx-picker-label">Valas Acuan:</span>
                  <select
                    className="fx-select-sm"
                    value={selectedBiCurrency}
                    onChange={(e) => setSelectedBiCurrency(e.target.value)}
                    title="Pilih valuta asing untuk melihat kurs Bank Indonesia"
                  >
                    {OFFICIAL_BI_RATES.map((r) => (
                      <option key={r.currency} value={r.currency}>
                        {r.currency} · {r.currencyName}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    className="fx-refresh-icon-btn"
                    onClick={() => {
                      refetchRates();
                      toast.info("Menyinkronkan data Kurs Bank Indonesia...");
                    }}
                    disabled={isFetchingRates}
                    title="Segarkan data kurs Bank Indonesia"
                  >
                    <RefreshCw size={13} className={isFetchingRates ? "spin" : ""} />
                  </button>
                </div>
              </div>

              {/* 3 CELL KURS BERSIH, SIMETRIS & TIDAK OVERFLOW */}
              <div className="fx-clean-rates-grid">
                <div
                  className={`fx-rate-cell ${Math.abs(shipment.exchangeRate - biSellRate) < 1 ? "active" : ""}`}
                >
                  <div className="cell-top-row">
                    <span className="cell-label">Kurs Jual ({activeBiRate.currency})</span>
                    {Math.abs(shipment.exchangeRate - biSellRate) < 1 && (
                      <span className="cell-active-tag">Digunakan</span>
                    )}
                  </div>
                  <strong className="cell-value">Rp {formatNumber(biSellRate, 2)}</strong>
                  <button
                    type="button"
                    className="cell-apply-btn"
                    onClick={() => handleApplyBiRate("sell")}
                    title="Terapkan Kurs Jual BI ke transaksi"
                  >
                    <Zap size={11} /> Terapkan Kurs Jual
                  </button>
                </div>

                <div
                  className={`fx-rate-cell ${Math.abs(shipment.exchangeRate - biMiddleRate) < 1 ? "active" : ""}`}
                >
                  <div className="cell-top-row">
                    <span className="cell-label">Kurs Tengah ({activeBiRate.currency})</span>
                    {Math.abs(shipment.exchangeRate - biMiddleRate) < 1 && (
                      <span className="cell-active-tag">Digunakan</span>
                    )}
                  </div>
                  <strong className="cell-value">Rp {formatNumber(biMiddleRate, 2)}</strong>
                  <button
                    type="button"
                    className="cell-apply-btn"
                    onClick={() => handleApplyBiRate("middle")}
                    title="Terapkan Kurs Tengah BI ke transaksi"
                  >
                    Terapkan Kurs Tengah
                  </button>
                </div>

                <div
                  className={`fx-rate-cell ${Math.abs(shipment.exchangeRate - biBuyRate) < 1 ? "active" : ""}`}
                >
                  <div className="cell-top-row">
                    <span className="cell-label">Kurs Beli ({activeBiRate.currency})</span>
                    {Math.abs(shipment.exchangeRate - biBuyRate) < 1 && (
                      <span className="cell-active-tag">Digunakan</span>
                    )}
                  </div>
                  <strong className="cell-value">Rp {formatNumber(biBuyRate, 2)}</strong>
                  <button
                    type="button"
                    className="cell-apply-btn"
                    onClick={() => handleApplyBiRate("buy")}
                    title="Terapkan Kurs Beli BI ke transaksi"
                  >
                    Terapkan Kurs Beli
                  </button>
                </div>
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

              {/* CURRENCY SELECTOR BERSIH DAN RAPI */}
              <div className="field">
                <span>Mata uang transaksi</span>
                <div className="input-shell select-shell">
                  <select
                    value={shipment.currency}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value !== shipment.currency) {
                        setTargetConvertCurrency(value);
                        setShowConvertModal(true);
                      }
                    }}
                  >
                    {SUPPORTED_CURRENCIES.map((cur) => (
                      <option key={cur.code} value={cur.code}>
                        {cur.code} · {cur.name} ({cur.country})
                      </option>
                    ))}
                    {!SUPPORTED_CURRENCIES.some((c) => c.code === shipment.currency) && (
                      <option value={shipment.currency}>{shipment.currency} (Custom)</option>
                    )}
                  </select>
                </div>
                {recommendedCurrency && recommendedCurrency.code !== shipment.currency && (
                  <small className="field-hint-text">
                    💡 Rekomendasi buyer ({shipment.buyerCountry}):{" "}
                    <button
                      type="button"
                      className="inline-convert-btn"
                      onClick={() => {
                        setTargetConvertCurrency(recommendedCurrency.code);
                        setShowConvertModal(true);
                      }}
                    >
                      {recommendedCurrency.code} ({recommendedCurrency.name})
                    </button>
                  </small>
                )}
              </div>

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

            {/* STRIP KONVERSI VALAS TERSTRUKTUR & RAPI */}
            <div className="fx-convert-action-strip">
              <div className="fx-convert-left">
                <ArrowRightLeft size={14} className="text-muted" />
                <span>
                  Mata uang transaksi saat ini: <b>{shipment.currency}</b>. Ingin mengonversi seluruh pos biaya ke mata uang buyer?
                </span>
              </div>
              <button
                type="button"
                className="ghost-button-sm"
                onClick={() => {
                  setTargetConvertCurrency(shipment.currency === "USD" ? "IDR" : "USD");
                  setShowConvertModal(true);
                }}
              >
                <ArrowRightLeft size={13} />
                Konversi Nilai ke Valas Lain
              </button>
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

            {/* DUAL CURRENCY CONVERSION DISPLAY - MENDUKUNG SELURUH MATA UANG DUNIA */}
            <div className="quote-dual-box">
              <div className="quote-dual-header">
                <span className="quote-dual-title">
                  Konversi Valas:
                </span>
                <select
                  className="quote-dual-select"
                  value={activeDualCurrency}
                  onChange={(e) => setBuyerDualCurrency(e.target.value)}
                  title="Pilih mata uang buyer untuk melihat konversi harga"
                >
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.symbol})
                    </option>
                  ))}
                </select>
              </div>
              <div className="quote-dual-amount">
                ≈ {formatCurrencyAmount(convertedOffer, activeDualCurrency)}
              </div>
              <div className="quote-dual-rate-info">
                <span>Acuan: {activeBiRate.currency} = Rp {formatNumber(activeBiRate.sellRate, 2)}</span>
                {rateDiff !== 0 && (
                  <span className="quote-dual-tag">
                    {rateDiff > 0 ? `+Rp ${formatNumber(rateDiff)}` : `-Rp ${formatNumber(Math.abs(rateDiff))}`} buffer
                  </span>
                )}
              </div>
            </div>

            {/* TOTAL TRANSAKSI KESELURUHAN BERDASARKAN FAKTOR HARGA YANG DITAMBAHKAN */}
            <div className="quote-factor-summary-box">
              <div className="quote-factor-header">
                <span className="quote-factor-title">
                  <Layers size={13} /> Rincian Faktor ({shipment.incoterm})
                </span>
                <button
                  type="button"
                  className="quote-manage-factor-btn"
                  onClick={() => {
                    setCostFactorTab("incoterm");
                    setShowCostFactorsModal(true);
                  }}
                  title="Kelola faktor harga otomatis & manual"
                >
                  <SlidersHorizontal size={11} /> Faktor Harga
                </button>
              </div>

              <div className="quote-factor-breakdown">
                <div className="factor-row">
                  <span>📦 Nilai Barang & Kemasan:</span>
                  <b>{formatCurrencyAmount(goodsSubtotal, shipment.currency)}</b>
                </div>
                <div className="factor-row">
                  <span>🚢 Logistik & Regulasi ({shipment.incoterm}):</span>
                  <b>{formatCurrencyAmount(logisticsSubtotal, shipment.currency)}</b>
                </div>
                <div className="factor-row">
                  <span>🛡️ Contingency ({shipment.contingency}%):</span>
                  <b>+ {formatCurrencyAmount(contingencyAmount, shipment.currency)}</b>
                </div>
                <div className="factor-row">
                  <span>📈 Target Margin ({shipment.margin}%):</span>
                  <b className="mint-text">+ {formatCurrencyAmount(pricing.active.profit, shipment.currency)}</b>
                </div>
                {shipment.discount > 0 && (
                  <div className="factor-row">
                    <span>🏷️ Diskon Buyer:</span>
                    <b className="text-amber">- {formatCurrencyAmount(shipment.discount, shipment.currency)}</b>
                  </div>
                )}
                <div className="factor-row status-row">
                  <span>Status Persetujuan:</span>
                  <b>{effectiveApprovalStatus}</b>
                </div>
              </div>

              {/* INFORMASI UNIT SEKUNDER (BUKAN UTAMA) */}
              <div className="quote-unit-footer">
                <span>Ekuivalen per {shipment.unit || "unit"}:</span>
                <b>
                  {formatCurrencyAmount(pricing.active.unit, shipment.currency)}
                </b>
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
                <h4>Konfirmasi Konversi Nilai Transaksi</h4>
                <p>
                  Ubah transaksi dari <b>{shipment.currency}</b> ke mata uang valas pilihan Anda
                </p>
              </div>
            </div>

            <div className="fx-modal-body">
              <div className="fx-modal-target-picker">
                <label className="fx-picker-label">Pilih Mata Uang Valas Tujuan:</label>
                <div className="input-shell select-shell">
                  <select
                    value={targetConvertCurrency}
                    onChange={(e) => setTargetConvertCurrency(e.target.value)}
                  >
                    {SUPPORTED_CURRENCIES.filter((c) => c.code !== shipment.currency).map((cur) => (
                      <option key={cur.code} value={cur.code}>
                        {cur.code} · {cur.name} ({cur.country})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="fx-modal-summary">
                <div className="fx-modal-row">
                  <span>Kurs Acuan BI:</span>
                  <b>
                    {targetConvertCurrency === "IDR"
                      ? `1 USD = Rp ${formatNumber(currentFxRate, 2)}`
                      : `1 ${targetConvertCurrency} = Rp ${formatNumber(getBiRateForCurrency(targetConvertCurrency).sellRate, 2)}`}
                  </b>
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

      {/* MODAL KELOLA FAKTOR PEMBENTUK HARGA & REGULASI BUYER */}
      {showCostFactorsModal && (
        <div className="fx-modal-backdrop" onClick={() => setShowCostFactorsModal(false)}>
          <div className="factors-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="factors-modal-header">
              <div>
                <h4>
                  <Scale size={18} /> Faktor Pembentuk Harga & Regulasi Buyer
                </h4>
                <p>
                  Incoterm: <b>{shipment.incoterm}</b> ({INCOTERM_TEMPLATES[shipment.incoterm]?.name}) · Buyer: <b>{shipment.buyer || "Umum"}</b> ({shipment.buyerCountry || "Internasional"})
                </p>
              </div>
              <button
                type="button"
                className="factors-close-btn"
                onClick={() => setShowCostFactorsModal(false)}
                title="Tutup form"
              >
                <X size={16} />
              </button>
            </div>

            <div className="factors-tabs">
              <button
                type="button"
                className={`factors-tab-btn ${costFactorTab === "incoterm" ? "active" : ""}`}
                onClick={() => setCostFactorTab("incoterm")}
              >
                <Zap size={13} /> Otomatis Incoterm ({shipment.incoterm})
              </button>
              <button
                type="button"
                className={`factors-tab-btn ${costFactorTab === "regulations" ? "active" : ""}`}
                onClick={() => setCostFactorTab("regulations")}
              >
                <FileCheck size={13} /> Regulasi Negara Buyer
              </button>
              <button
                type="button"
                className={`factors-tab-btn ${costFactorTab === "custom" ? "active" : ""}`}
                onClick={() => setCostFactorTab("custom")}
              >
                <Plus size={13} /> Tambah Faktor Manual
              </button>
            </div>

            <div className="factors-modal-body">
              {costFactorTab === "incoterm" && (
                <div className="incoterm-tab-content">
                  <div className="incoterm-summary-card">
                    <div className="incoterm-badge-row">
                      <span className="incoterm-badge">{shipment.incoterm}</span>
                      <span style={{ fontSize: 11.5, color: "#64748b" }}>Standar ICC Incoterms® 2020</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12.5, color: "#334155", lineHeight: 1.4 }}>
                      {INCOTERM_TEMPLATES[shipment.incoterm]?.description}
                    </p>
                    <div className="incoterm-resp-grid">
                      <div className="incoterm-resp-col">
                        <b>Tanggung Jawab Penjual (Eksportir):</b>
                        <ul>
                          {INCOTERM_TEMPLATES[shipment.incoterm]?.sellerResponsibility.map((resp, i) => (
                            <li key={i}>{resp}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="incoterm-resp-col">
                        <b>Tanggung Jawab Buyer:</b>
                        <ul>
                          {INCOTERM_TEMPLATES[shipment.incoterm]?.buyerResponsibility.map((resp, i) => (
                            <li key={i}>{resp}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="incoterm-auto-apply-box">
                    <div>
                      <b>Terapkan Estimasi Biaya Standar {shipment.incoterm}</b>
                      <p>
                        Otomatis mengisi pos logistik, freight, asuransi, THC, dan bea sesuai tanggung jawab {shipment.incoterm} ke dalam mata uang <b>{shipment.currency}</b>.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleApplyIncotermTemplate(shipment.incoterm)}
                    >
                      <Zap size={14} /> Terapkan Otomatis
                    </button>
                  </div>
                </div>
              )}

              {costFactorTab === "regulations" && (
                <div className="regulations-tab-content">
                  <p style={{ margin: "0 0 10px", fontSize: 12.5, color: "#475569" }}>
                    Daftar regulasi dan sertifikasi resmi yang umumnya dipersyaratkan negara buyer ({shipment.buyerCountry || "Internasional"}):
                  </p>
                  <div className="factors-preset-list">
                    {COUNTRY_REGULATION_PRESETS.map((preset) => {
                      const amountInCur = convertTemplateCost(preset.defaultAmountIdr, shipment.currency, currentFxRate);
                      const isRecommended =
                        shipment.buyerCountry &&
                        preset.targetCountry.toLowerCase().includes(shipment.buyerCountry.toLowerCase());
                      const targetFieldLabel =
                        preset.category === "goods"
                          ? "Bagian 01: Nilai Barang (Packaging)"
                          : preset.category === "logistics"
                            ? `Bagian 02: Biaya Logistik (${preset.field})`
                            : "Bagian 03: Strategi (Contingency)";

                      return (
                        <div className="factors-preset-item" key={preset.id}>
                          <div className="preset-info">
                            <div className="preset-title-row">
                              <span className="preset-title">{preset.name}</span>
                              <span className={`preset-tag ${isRecommended ? "rec" : ""}`}>
                                {isRecommended ? `⭐ Diperlukan ${shipment.buyerCountry}` : preset.targetCountry}
                              </span>
                            </div>
                            <p className="preset-desc">{preset.description}</p>
                            <span style={{ fontSize: 11, color: "#64748b" }}>Alokasi: {targetFieldLabel}</span>
                          </div>
                          <div className="preset-action">
                            {preset.field !== "contingency" ? (
                              <span className="preset-amount">
                                + {formatCurrencyAmount(amountInCur, shipment.currency)}
                              </span>
                            ) : (
                              <span className="preset-amount">+2% buffer</span>
                            )}
                            <button
                              type="button"
                              className="preset-add-btn"
                              onClick={() => handleAddRegulationPreset(preset)}
                              title={`Tambahkan ke pos ${preset.field}`}
                            >
                              <Plus size={12} /> Tambahkan
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {costFactorTab === "custom" && (
                <div className="custom-factor-tab-content">
                  <div className="custom-factor-form">
                    <b style={{ fontSize: 13.5, color: "#0f172a" }}>
                      Tambah Faktor Biaya Regulasi / Permintaan Khusus Buyer
                    </b>
                    <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
                      Tambahkan pos biaya khusus yang diminta buyer atau regulasi spesifik pelabuhan negara tujuan.
                    </p>

                    <div className="form-grid two">
                      <div className="field">
                        <span>Nama Faktor / Dokumen</span>
                        <input
                          type="text"
                          placeholder="Contoh: Uji Lab Sucofindo, Pallet Plastik Food Grade..."
                          value={customFactorName}
                          onChange={(e) => setCustomFactorName(e.target.value)}
                        />
                      </div>
                      <div className="field">
                        <span>Nominal Biaya ({shipment.currency})</span>
                        <input
                          type="number"
                          placeholder={`Nominal dalam ${shipment.currency}`}
                          value={customFactorAmount}
                          onChange={(e) => setCustomFactorAmount(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="field">
                      <span>Alokasi Pos Biaya</span>
                      <div className="input-shell select-shell">
                        <select
                          value={customFactorTarget}
                          onChange={(e) => setCustomFactorTarget(e.target.value as keyof Shipment)}
                        >
                          <optgroup label="Bagian 01: Nilai Barang">
                            <option value="packaging">Packaging Ekspor Khusus & Labelling</option>
                          </optgroup>
                          <optgroup label="Bagian 02: Biaya Logistik & Kepabeanan">
                            <option value="customs">Customs Clearance / PEB / Sertifikat Karantina</option>
                            <option value="inlandTransport">Inland Transport / Trucking Origin</option>
                            <option value="originHandling">Origin Handling / THC POL</option>
                            <option value="freight">Ocean / Air Freight Internasional</option>
                            <option value="insurance">Marine Cargo Insurance</option>
                            <option value="destinationHandling">Destination Handling / THC POD</option>
                            <option value="importDuty">Bea Masuk & Pajak Impor Negara Buyer</option>
                            <option value="lastMile">Last-mile Delivery ke Alamat Buyer</option>
                          </optgroup>
                        </select>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="save-button"
                      onClick={handleAddCustomFactor}
                      style={{ alignSelf: "flex-start", marginTop: 4 }}
                    >
                      <Plus size={14} /> Tambahkan Faktor ke Form
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="factors-modal-footer">
              <div style={{ fontSize: 12, color: "#475569" }}>
                Total Biaya Pokok: <b>{formatCurrencyAmount(directCostTotal, shipment.currency)}</b> · Total Penawaran: <b>{formatCurrencyAmount(pricing.active.offer, shipment.currency)}</b>
              </div>
              <button
                type="button"
                className="save-button"
                style={{ width: "auto", minHeight: 34, padding: "0 16px" }}
                onClick={() => setShowCostFactorsModal(false)}
              >
                Selesai & Tutup
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
