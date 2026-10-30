import type { ApprovalDecision, PartnerEntry } from "@/hooks/useWorkspaceFlow";
import { trpc } from "@/lib/trpc";
import {
  calculateManufacturerHpp,
  calculateTraderHpp,
} from "@shared/hpp";
import {
  convertTemplateCost,
  COUNTRY_REGULATION_PRESETS,
  getAiRecommendedRegulations,
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
import type { AdditionalCostFactor, Incoterm, LineItem, Shipment } from "@shared/shipment";
import {
  ArrowRightLeft,
  ArrowUpRight,
  Check,
  Calculator,
  ClipboardCheck,
  Info,
  Layers,
  Plus,
  RefreshCw,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Trash2,
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

  // State Kalkulator HPP (Trader & Produsen)
  const [showHppCalculator, setShowHppCalculator] = useState(false);
  const [hppMode, setHppMode] = useState<"trader" | "manufacturer">("trader");
  const [traderBuyPrice, setTraderBuyPrice] = useState<number>(shipment.unitPrice || 0);
  const [traderShrinkage, setTraderShrinkage] = useState<number>(5);
  const [traderSourcingFreight, setTraderSourcingFreight] = useState<number>(0);
  const [traderSortingLabor, setTraderSortingLabor] = useState<number>(0);
  const [traderInnerPackaging, setTraderInnerPackaging] = useState<number>(0);
  const [traderMargin, setTraderMargin] = useState<number>(0);

  const [mfgRawMaterial, setMfgRawMaterial] = useState<number>(shipment.unitPrice || 0);
  const [mfgAuxiliary, setMfgAuxiliary] = useState<number>(0);
  const [mfgDirectLabor, setMfgDirectLabor] = useState<number>(0);
  const [mfgOverhead, setMfgOverhead] = useState<number>(0);

  // Sinkronisasi awal harga beli dari unitPrice transaksi jika traderBuyPrice masih 0
  useEffect(() => {
    if (shipment.unitPrice > 0 && traderBuyPrice === 0) {
      setTraderBuyPrice(shipment.unitPrice);
      setMfgRawMaterial(shipment.unitPrice);
    }
  }, [shipment.unitPrice, traderBuyPrice]);

  const traderHppResult = calculateTraderHpp({
    supplierBuyPrice: traderBuyPrice,
    shrinkageRatePercent: traderShrinkage,
    sourcingFreightPerUnit: traderSourcingFreight,
    sortingLaborPerUnit: traderSortingLabor,
    innerPackagingPerUnit: traderInnerPackaging,
    traderMarginPerUnit: traderMargin,
    quantity: shipment.quantity || 1,
  });

  const mfgHppResult = calculateManufacturerHpp({
    rawMaterialPerUnit: mfgRawMaterial,
    auxiliaryMaterialPerUnit: mfgAuxiliary,
    directLaborPerUnit: mfgDirectLabor,
    factoryOverheadPerUnit: mfgOverhead,
    quantity: shipment.quantity || 1,
  });

  const activeHppResult = hppMode === "trader" ? traderHppResult : mfgHppResult;

  const handleApplyHppToUnitPrice = () => {
    const val = activeHppResult.totalHppPerUnit;
    update("unitPrice", val);
    if (shipment.lineItems && shipment.lineItems.length > 0) {
      const updated = shipment.lineItems.map((item, idx) =>
        idx === 0 ? { ...item, unitPrice: val } : item
      );
      updateLineItems(updated);
    }
    toast.success(
      `HPP ${hppMode === "trader" ? "Trader" : "Produsen"} diterapkan: ${formatCurrencyAmount(val, shipment.currency)} per ${shipment.unit || "unit"}`,
      {
        description: "Harga pokok komoditas telah diperbarui dan langsung disinkronkan ke seluruh kalkulasi penawaran.",
      }
    );
  };

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

  const convertedCost = convertCurrencyValue(
    pricing.active.cost,
    shipment.currency,
    activeDualCurrency,
    currentFxRate,
    liveRates?.rates,
  );

  // Subtotal komponen pembentuk harga transaksi ekspor (termasuk isian kustom)
  const additionalGoods = (shipment.additionalCostFactors || [])
    .filter((f) => f.section === "goods")
    .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  const goodsSubtotal = pricing.goods + (shipment.packaging || 0) + additionalGoods;

  const activeIncotermKeys = incotermCostKeys[shipment.incoterm] || [];
  const additionalLogistics = (shipment.additionalCostFactors || [])
    .filter((f) => f.section === "logistics")
    .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  const logisticsSubtotal =
    activeIncotermKeys
      .filter((k) => k !== "goods" && k !== "packaging")
      .reduce((sum, key) => sum + (Number(shipment[key]) || 0), 0) + additionalLogistics;

  const additionalStrategy = (shipment.additionalCostFactors || [])
    .filter((f) => f.section === "strategy")
    .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

  const directCostTotal = goodsSubtotal + logisticsSubtotal + additionalStrategy;
  const contingencyAmount = (directCostTotal * Math.max(0, shipment.contingency)) / 100;
  const totalCostWithContingency = directCostTotal + contingencyAmount;
  const targetMargin = shipment.margin / 100;
  const netOfferBeforeDiscount = targetMargin < 1 ? totalCostWithContingency / Math.max(0.0001, 1 - targetMargin) : 0;
  const totalOffer = Math.max(0, netOfferBeforeDiscount - shipment.discount);
  const totalProfit = Math.max(0, totalOffer - totalCostWithContingency);

  // AI Advisor secara otomatis menganalisis negara buyer & komoditas
  const aiRegulations = getAiRecommendedRegulations(shipment.buyerCountry, shipment.product);

  // Fungsi tambah form isian kustom (tanpa pop up)
  const handleAddFactorField = (
    section: "goods" | "logistics" | "strategy",
    defaultName?: string,
    defaultAmount?: number,
  ) => {
    const defaultLabel =
      defaultName ||
      (section === "goods"
        ? "Biaya Tambahan Barang / Uji Lab"
        : section === "logistics"
          ? "Biaya Logistik Tambahan / Sertifikasi"
          : "Biaya Tambahan Strategis");
    const newFactor: AdditionalCostFactor = {
      id: "factor-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
      name: defaultLabel,
      amount: defaultAmount || 0,
      section,
    };
    const current = shipment.additionalCostFactors || [];
    update("additionalCostFactors", [...current, newFactor]);
    toast.success(`Form isian "${defaultLabel}" ditambahkan`, {
      description: `Kolom baru kini aktif di Bagian ${section === "goods" ? "01 Nilai Barang" : section === "logistics" ? "02 Logistik" : "03 Strategi"}.`,
    });
  };

  // Fungsi update isian form kustom
  const handleUpdateFactorField = (id: string, key: "name" | "amount", value: string | number) => {
    const current = shipment.additionalCostFactors || [];
    const updated = current.map((f) => (f.id === id ? { ...f, [key]: value } : f));
    update("additionalCostFactors", updated);
  };

  // Fungsi hapus isian form kustom
  const handleDeleteFactorField = (id: string) => {
    const current = shipment.additionalCostFactors || [];
    const updated = current.filter((f) => f.id !== id);
    update("additionalCostFactors", updated);
  };

  // Klik rekomendasi AI langsung menambahkan form isian ke bagian yang sesuai
  const handleAddAiRegulationToForm = (reg: CountryRegulationPreset) => {
    const amountInCur = convertTemplateCost(reg.defaultAmountIdr, shipment.currency, currentFxRate);
    handleAddFactorField(reg.category, reg.name, amountInCur);
  };

  // Auto-apply faktor Incoterm secara langsung (tanpa popup)
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

    toast.success(`Estimasi biaya standar ${term} (${template.name}) berhasil diterapkan`, {
      description: `Seluruh pos logistik dan tanggung jawab penjual telah disinkronkan (${shipment.currency}).`,
    });
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

    const newUnitPrice = convertCurrencyValue(shipment.unitPrice, fromCur, targetCur, rate, liveRates?.rates);
    update("unitPrice", isTargetIdr ? Math.round(newUnitPrice) : Number(newUnitPrice.toFixed(2)));

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
        const converted = convertCurrencyValue(val, fromCur, targetCur, rate, liveRates?.rates);
        update(key, isTargetIdr ? Math.round(converted) : Number(converted.toFixed(2)));
      }
    });

    if (shipment.additionalCostFactors && shipment.additionalCostFactors.length > 0) {
      const convertedFactors = shipment.additionalCostFactors.map((f) => ({
        ...f,
        amount: isTargetIdr
          ? Math.round(convertCurrencyValue(f.amount, fromCur, targetCur, rate, liveRates?.rates))
          : Number(convertCurrencyValue(f.amount, fromCur, targetCur, rate, liveRates?.rates).toFixed(2)),
      }));
      update("additionalCostFactors", convertedFactors);
    }

    if (shipment.lineItems && shipment.lineItems.length > 0) {
      const updatedItems = shipment.lineItems.map((item) => {
        const itemPrice = convertCurrencyValue(item.unitPrice, fromCur, targetCur, rate, liveRates?.rates);
        return {
          ...item,
          unitPrice: isTargetIdr ? Math.round(itemPrice) : Number(itemPrice.toFixed(2)),
        };
      });
      updateLineItems(updatedItems);
    }

    update("currency", targetCur);
    setShowConvertModal(false);

    toast.success(`Transaksi berhasil dikonversi ke ${targetCur}`, {
      description: `Seluruh nilai barang dan rincian biaya telah disesuaikan dengan kurs pasar aktif.`,
    });
  };

  const maxScenarioOffer = Math.max(...pricing.scenarios.map((s) => s.offer), 1);

  return (
    <div className="tab-pane active pricing-screen">
      <div className="pricing-layout">
        <section className="pricing-main">
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

          {/* BAGIAN 01: NILAI BARANG */}
          <div className="form-section">
            <div className="form-section-title">
              <span className="section-number">01</span>
              <div>
                <b>Nilai barang & komoditas</b>
                <small>Basis perhitungan dari seluruh line item ({shipment.currency})</small>
              </div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  className={`section-factor-btn ${showHppCalculator ? "highlight" : ""}`}
                  onClick={() => setShowHppCalculator((prev) => !prev)}
                  title="Buka kalkulator HPP untuk menghitung harga pokok trader atau produsen"
                >
                  <Calculator size={12} /> {showHppCalculator ? "Tutup Kalkulator HPP" : "Kalkulator HPP (Trader / Produsen)"}
                </button>
                <button
                  type="button"
                  className="section-factor-btn"
                  onClick={() => handleAddFactorField("goods")}
                  title="Tambah baris form isian untuk biaya atau sertifikasi barang"
                >
                  <Plus size={12} /> Tambah Form Isian Barang
                </button>
              </div>
            </div>

            {/* EXPANDABLE KALKULATOR HPP (TRADER & PRODUSEN) */}
            {showHppCalculator && (
              <div className="hpp-calculator-card">
                <div className="hpp-calculator-head">
                  <div className="hpp-calculator-title">
                    <Calculator size={16} />
                    <span>Kalkulator HPP ({hppMode === "trader" ? "Eksportir Trader / Sourcing" : "Produsen Langsung"})</span>
                  </div>
                  <div className="hpp-mode-switch">
                    <button
                      type="button"
                      className={`hpp-mode-btn ${hppMode === "trader" ? "active" : ""}`}
                      onClick={() => setHppMode("trader")}
                    >
                      🏢 Mode Trader / Sourcing Petani
                    </button>
                    <button
                      type="button"
                      className={`hpp-mode-btn ${hppMode === "manufacturer" ? "active" : ""}`}
                      onClick={() => setHppMode("manufacturer")}
                    >
                      🏭 Mode Produsen / Pabrik
                    </button>
                  </div>
                </div>

                {hppMode === "trader" ? (
                  <div className="hpp-fields-grid">
                    <Field
                      label={`Harga beli supplier/petani (per ${shipment.unit || "unit"})`}
                      value={traderBuyPrice}
                      type="number"
                      prefix={shipment.currency}
                      onChange={(val) => setTraderBuyPrice(parseFloat(val) || 0)}
                    />
                    <Field
                      label="Estimasi susut sortasi / kadar air"
                      value={traderShrinkage}
                      type="number"
                      suffix="%"
                      step="0.5"
                      onChange={(val) => setTraderShrinkage(parseFloat(val) || 0)}
                    />
                    <Field
                      label={`Angkut lokal ke gudang (per ${shipment.unit || "unit"})`}
                      value={traderSourcingFreight}
                      type="number"
                      prefix={shipment.currency}
                      onChange={(val) => setTraderSourcingFreight(parseFloat(val) || 0)}
                    />
                    <Field
                      label={`Upah sortasi & grading (per ${shipment.unit || "unit"})`}
                      value={traderSortingLabor}
                      type="number"
                      prefix={shipment.currency}
                      onChange={(val) => setTraderSortingLabor(parseFloat(val) || 0)}
                    />
                    <Field
                      label={`Kemasan primer/inner (per ${shipment.unit || "unit"})`}
                      value={traderInnerPackaging}
                      type="number"
                      prefix={shipment.currency}
                      onChange={(val) => setTraderInnerPackaging(parseFloat(val) || 0)}
                    />
                    <Field
                      label={`Fee / margin pengadaan (per ${shipment.unit || "unit"})`}
                      value={traderMargin}
                      type="number"
                      prefix={shipment.currency}
                      onChange={(val) => setTraderMargin(parseFloat(val) || 0)}
                    />
                  </div>
                ) : (
                  <div className="hpp-fields-grid">
                    <Field
                      label={`Bahan baku utama (per ${shipment.unit || "unit"})`}
                      value={mfgRawMaterial}
                      type="number"
                      prefix={shipment.currency}
                      onChange={(val) => setMfgRawMaterial(parseFloat(val) || 0)}
                    />
                    <Field
                      label={`Bahan penolong/tambahan (per ${shipment.unit || "unit"})`}
                      value={mfgAuxiliary}
                      type="number"
                      prefix={shipment.currency}
                      onChange={(val) => setMfgAuxiliary(parseFloat(val) || 0)}
                    />
                    <Field
                      label={`Tenaga kerja langsung (per ${shipment.unit || "unit"})`}
                      value={mfgDirectLabor}
                      type="number"
                      prefix={shipment.currency}
                      onChange={(val) => setMfgDirectLabor(parseFloat(val) || 0)}
                    />
                    <Field
                      label={`Overhead pabrik & QC (per ${shipment.unit || "unit"})`}
                      value={mfgOverhead}
                      type="number"
                      prefix={shipment.currency}
                      onChange={(val) => setMfgOverhead(parseFloat(val) || 0)}
                    />
                  </div>
                )}

                <div className="hpp-result-banner">
                  <div className="hpp-result-summary">
                    <div className="hpp-result-main">
                      <span>HPP Bersih:</span>
                      <strong>{formatCurrencyAmount(activeHppResult.totalHppPerUnit, shipment.currency)}</strong>
                      <span>/ {shipment.unit || "unit"}</span>
                    </div>
                    <div className="hpp-result-sub">
                      {hppMode === "trader" ? (
                        <>
                          Bahan efektif setelah susut {traderShrinkage}%: {formatCurrencyAmount(traderHppResult.effectiveMaterialCostPerUnit, shipment.currency)}
                          {traderHppResult.shrinkageCostImpactPerUnit > 0 && (
                            <> (Dampak susut: +{formatCurrencyAmount(traderHppResult.shrinkageCostImpactPerUnit, shipment.currency)})</>
                          )}
                          {" · "}Total HPP ({formatNumber(shipment.quantity)} {shipment.unit}): {formatCurrencyAmount(activeHppResult.totalHppOverall, shipment.currency)}
                        </>
                      ) : (
                        <>Total HPP Produksi ({formatNumber(shipment.quantity)} {shipment.unit}): {formatCurrencyAmount(activeHppResult.totalHppOverall, shipment.currency)}</>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button
                      type="button"
                      className="hpp-apply-btn"
                      onClick={handleApplyHppToUnitPrice}
                      title={`Terapkan HPP hasil perhitungan ke harga satuan transaksi ekspor`}
                    >
                      <Zap size={13} /> Terapkan HPP ke Harga per {shipment.unit || "unit"}
                    </button>
                    <button
                      type="button"
                      className="hpp-close-link"
                      onClick={() => setShowHppCalculator(false)}
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              </div>
            )}
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

            {/* FORM ISIAN TAMBAHAN NILAI BARANG */}
            {(shipment.additionalCostFactors || []).filter((f) => f.section === "goods").length > 0 && (
              <div className="custom-factors-group">
                <div className="custom-factors-head">
                  <span className="custom-factors-title">
                    <SlidersHorizontal size={13} /> Form Isian Tambahan: Nilai Barang & Sertifikasi
                  </span>
                  <small style={{ color: "#64748b", fontSize: 11 }}>
                    Otomatis dihitung ke subtotal nilai barang
                  </small>
                </div>
                {(shipment.additionalCostFactors || [])
                  .filter((f) => f.section === "goods")
                  .map((factor) => (
                    <div className="custom-factor-row" key={factor.id}>
                      <input
                        type="text"
                        value={factor.name}
                        placeholder="Nama faktor barang / uji lab..."
                        onChange={(e) => handleUpdateFactorField(factor.id, "name", e.target.value)}
                        aria-label="Nama faktor barang"
                      />
                      <Field
                        label=""
                        value={factor.amount}
                        type="number"
                        prefix={shipment.currency}
                        onChange={(val) => handleUpdateFactorField(factor.id, "amount", parseFloat(val) || 0)}
                      />
                      <button
                        type="button"
                        className="factor-delete-btn"
                        onClick={() => handleDeleteFactorField(factor.id)}
                        title="Hapus form isian ini"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
              </div>
            )}

            <LineItemsEditor
              items={shipment.lineItems}
              updateItems={updateLineItems}
              currency={shipment.currency}
              onOpenCatalog={() => navigate("products")}
            />
          </div>

          {/* AI ADVISOR REKOMENDASI REGULASI SECARA LANGSUNG DARI NEGARA BUYER (TANPA POPUP) */}
          <div className="ai-advisor-reg-banner">
            <div className="ai-advisor-reg-head">
              <div>
                <div className="ai-advisor-reg-title">
                  <Sparkles size={16} />
                  <span>AI Advisor · Rekomendasi Regulasi Negara Buyer ({shipment.buyerCountry || "Internasional"})</span>
                </div>
                <p className="ai-advisor-reg-meta">
                  AI membaca negara buyer <b>{shipment.buyerCountry || "Tujuan Ekspor"}</b>. Klik tombol rekomendasi di bawah untuk langsung memunculkan baris form isian biayanya:
                </p>
              </div>
            </div>

            <div className="ai-advisor-chips-grid">
              {aiRegulations.map((reg) => {
                const isAdded = (shipment.additionalCostFactors || []).some((f) =>
                  f.name.toLowerCase().includes(reg.name.toLowerCase().slice(0, 15))
                );
                const costInCur = convertTemplateCost(reg.defaultAmountIdr, shipment.currency, currentFxRate);
                return (
                  <div className={`ai-reg-chip ${isAdded ? "added" : ""}`} key={reg.id}>
                    <div className="ai-reg-info">
                      <span className="ai-reg-name" title={reg.name}>{reg.name}</span>
                      <span className="ai-reg-cost">+{formatCurrencyAmount(costInCur, shipment.currency)}</span>
                      <span className="ai-reg-target-badge">
                        Alokasi: {reg.category === "goods" ? "Bagian 01 (Barang)" : "Bagian 02 (Logistik)"}
                      </span>
                    </div>
                    {isAdded ? (
                      <span className="ai-reg-added-badge">
                        <Check size={12} /> Di Form
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="ai-reg-add-btn"
                        onClick={() => handleAddAiRegulationToForm(reg)}
                        title={`Tambahkan isian form untuk ${reg.name}`}
                      >
                        <Plus size={11} /> Tambah ke Form
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* BAGIAN 02: BIAYA LOGISTIK & KEPABEANAN */}
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
                onClick={() => handleAddFactorField("logistics")}
                title="Tambah baris form isian biaya logistik khusus"
              >
                <Plus size={12} /> Tambah Form Isian Logistik
              </button>
            </div>

            {/* HELPER BAR OTOMATIS SESUAI INCOTERM */}
            <div className="incoterm-inline-helper">
              <div className="incoterm-helper-text">
                <Zap size={14} />
                <span>
                  Incoterm aktif: <b>{shipment.incoterm}</b> ({INCOTERM_TEMPLATES[shipment.incoterm]?.name || "Incoterms® 2020"})
                </span>
              </div>
              <button
                type="button"
                className="incoterm-helper-btn"
                onClick={() => handleApplyIncotermTemplate(shipment.incoterm)}
                title={`Isi otomatis estimasi biaya standar untuk Incoterm ${shipment.incoterm}`}
              >
                <Zap size={12} /> Auto-Fill Estimasi Biaya {shipment.incoterm}
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

            {/* FORM ISIAN TAMBAHAN BIAYA LOGISTIK */}
            {(shipment.additionalCostFactors || []).filter((f) => f.section === "logistics").length > 0 && (
              <div className="custom-factors-group">
                <div className="custom-factors-head">
                  <span className="custom-factors-title">
                    <SlidersHorizontal size={13} /> Form Isian Tambahan: Biaya Logistik & Regulasi
                  </span>
                  <small style={{ color: "#64748b", fontSize: 11 }}>
                    Otomatis dihitung ke subtotal logistik
                  </small>
                </div>
                {(shipment.additionalCostFactors || [])
                  .filter((f) => f.section === "logistics")
                  .map((factor) => (
                    <div className="custom-factor-row" key={factor.id}>
                      <input
                        type="text"
                        value={factor.name}
                        placeholder="Nama faktor logistik / regulasi..."
                        onChange={(e) => handleUpdateFactorField(factor.id, "name", e.target.value)}
                        aria-label="Nama faktor logistik"
                      />
                      <Field
                        label=""
                        value={factor.amount}
                        type="number"
                        prefix={shipment.currency}
                        onChange={(val) => handleUpdateFactorField(factor.id, "amount", parseFloat(val) || 0)}
                      />
                      <button
                        type="button"
                        className="factor-delete-btn"
                        onClick={() => handleDeleteFactorField(factor.id)}
                        title="Hapus form isian ini"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* BAGIAN 03: STRATEGI PENAWARAN & KURS PASAR */}
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
                className="section-factor-btn"
                onClick={() => handleAddFactorField("strategy")}
                title="Tambah baris form isian untuk biaya strategis lainnya"
              >
                <Plus size={12} /> Tambah Form Isian Strategis
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

            {/* FORM ISIAN TAMBAHAN STRATEGI */}
            {(shipment.additionalCostFactors || []).filter((f) => f.section === "strategy").length > 0 && (
              <div className="custom-factors-group">
                <div className="custom-factors-head">
                  <span className="custom-factors-title">
                    <SlidersHorizontal size={13} /> Form Isian Tambahan: Biaya Strategis & Cadangan
                  </span>
                  <small style={{ color: "#64748b", fontSize: 11 }}>
                    Otomatis dihitung ke biaya langsung transaksi
                  </small>
                </div>
                {(shipment.additionalCostFactors || [])
                  .filter((f) => f.section === "strategy")
                  .map((factor) => (
                    <div className="custom-factor-row" key={factor.id}>
                      <input
                        type="text"
                        value={factor.name}
                        placeholder="Nama faktor strategis..."
                        onChange={(e) => handleUpdateFactorField(factor.id, "name", e.target.value)}
                        aria-label="Nama faktor strategis"
                      />
                      <Field
                        label=""
                        value={factor.amount}
                        type="number"
                        prefix={shipment.currency}
                        onChange={(val) => handleUpdateFactorField(factor.id, "amount", parseFloat(val) || 0)}
                      />
                      <button
                        type="button"
                        className="factor-delete-btn"
                        onClick={() => handleDeleteFactorField(factor.id)}
                        title="Hapus form isian ini"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
              </div>
            )}

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

        {/* ASIDE OFFER PREVIEW DENGAN TAMPILAN TOTAL TRANSAKSI KESELURUHAN (BUKAN PER CARTON) */}
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

            {/* RINCIAN TOTAL TRANSAKSI BERDASARKAN SELURUH FAKTOR HARGA YANG DITAMBAHKAN */}
            <div className="quote-factor-summary-box">
              <div className="quote-factor-header">
                <span className="quote-factor-title">
                  <Layers size={13} /> Komponen Total Transaksi ({shipment.incoterm})
                </span>
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
                {additionalStrategy > 0 && (
                  <div className="factor-row">
                    <span>⚡ Biaya Strategis Tambahan:</span>
                    <b>+ {formatCurrencyAmount(additionalStrategy, shipment.currency)}</b>
                  </div>
                )}
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

              <div className="fx-modal-choices">
                <p className="fx-modal-lead">Pilih Metode Konversi:</p>
                <div className="fx-modal-choice-cards">
                  <div className="fx-choice-card active">
                    <b>Konversi Proporsional (Sesuai Kurs Realtime)</b>
                    <small>
                      Harga unit dan seluruh rincian biaya disesuaikan otomatis dengan kurs BI{" "}
                      {targetConvertCurrency === "IDR" ? "IDR" : targetConvertCurrency}.
                    </small>
                  </div>
                  <div className="fx-choice-card" onClick={() => update("currency", targetConvertCurrency)}>
                    <b>Ganti Simbol Saja Tanpa Ubah Angka</b>
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
