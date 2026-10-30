import type { ApprovalDecision, PartnerEntry } from "@/hooks/useWorkspaceFlow";
import { trpc } from "@/lib/trpc";
import {
  calculateManufacturerHpp,
  calculateTraderHpp,
} from "@shared/hpp";
import {
  convertTemplateCost,
  INCOTERM_TEMPLATES,
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
  Package,
  Plus,
  RefreshCw,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  TrendingUp,
  Truck,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Field, SectionTitle, SelectField, StatusPill } from "./Primitives";

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

  // State Pembedahan Indikator HPP (Trader Sourcing & Produsen Pabrik)
  const [hppMode, setHppMode] = useState<"trader" | "manufacturer">(
    shipment.hppMode === "manufacturer" ? "manufacturer" : "trader"
  );
  const [traderBuyPrice, setTraderBuyPrice] = useState<number>(
    shipment.traderBuyPrice ?? (shipment.unitPrice || 0)
  );
  const [traderShrinkage, setTraderShrinkage] = useState<number>(
    shipment.traderShrinkage ?? 5
  );
  const [traderSourcingFreight, setTraderSourcingFreight] = useState<number>(
    shipment.traderSourcingFreight ?? 0
  );
  const [traderSortingLabor, setTraderSortingLabor] = useState<number>(
    shipment.traderSortingLabor ?? 0
  );
  const [traderInnerPackaging, setTraderInnerPackaging] = useState<number>(
    shipment.traderInnerPackaging ?? 0
  );
  const [traderLabelPackaging, setTraderLabelPackaging] = useState<number>(
    shipment.traderLabelPackaging ?? 0
  );
  const [traderStaffingOverhead, setTraderStaffingOverhead] = useState<number>(
    shipment.traderStaffingOverhead ?? 0
  );
  const [traderMargin, setTraderMargin] = useState<number>(
    shipment.traderMargin ?? 0
  );

  const [mfgRawMaterial, setMfgRawMaterial] = useState<number>(
    shipment.mfgRawMaterial ?? (shipment.unitPrice || 0)
  );
  const [mfgAuxiliary, setMfgAuxiliary] = useState<number>(
    shipment.mfgAuxiliary ?? 0
  );
  const [mfgDirectLabor, setMfgDirectLabor] = useState<number>(
    shipment.mfgDirectLabor ?? 0
  );
  const [mfgOverhead, setMfgOverhead] = useState<number>(
    shipment.mfgOverhead ?? 0
  );

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
    labelPackagingPerUnit: traderLabelPackaging,
    staffingOverheadPerUnit: traderStaffingOverhead,
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

  // Sinkronisasi HPP per unit ke harga satuan transaksi ekspor
  const handleApplyHppToUnitPrice = (val?: number) => {
    const finalVal = typeof val === "number" ? val : activeHppResult.totalHppPerUnit;
    update("unitPrice", finalVal);
    if (shipment.lineItems && shipment.lineItems.length > 0) {
      const updated = shipment.lineItems.map((item, idx) =>
        idx === 0 ? { ...item, unitPrice: finalVal } : item
      );
      updateLineItems(updated);
    }
    toast.success(
      `HPP ${hppMode === "trader" ? "Trader" : "Produsen"} diterapkan: ${formatCurrencyAmount(finalVal, shipment.currency)} per ${shipment.unit || "unit"}`,
      {
        description: "Nilai unit transaksi diperbarui dan langsung disinkronkan ke seluruh tangga perhitungan harga ekspor.",
      }
    );
  };

  // Helper simpan indikator HPP ke shipment agar tersimpan persisten
  const handleUpdateTraderHpp = (
    field: "traderBuyPrice" | "traderShrinkage" | "traderSourcingFreight" | "traderSortingLabor" | "traderInnerPackaging" | "traderLabelPackaging" | "traderStaffingOverhead" | "traderMargin",
    val: number,
  ) => {
    if (field === "traderBuyPrice") setTraderBuyPrice(val);
    else if (field === "traderShrinkage") setTraderShrinkage(val);
    else if (field === "traderSourcingFreight") setTraderSourcingFreight(val);
    else if (field === "traderSortingLabor") setTraderSortingLabor(val);
    else if (field === "traderInnerPackaging") setTraderInnerPackaging(val);
    else if (field === "traderLabelPackaging") setTraderLabelPackaging(val);
    else if (field === "traderStaffingOverhead") setTraderStaffingOverhead(val);
    else if (field === "traderMargin") setTraderMargin(val);
    update(field, val);
  };

  const handleUpdateMfgHpp = (
    field: "mfgRawMaterial" | "mfgAuxiliary" | "mfgDirectLabor" | "mfgOverhead",
    val: number,
  ) => {
    if (field === "mfgRawMaterial") setMfgRawMaterial(val);
    else if (field === "mfgAuxiliary") setMfgAuxiliary(val);
    else if (field === "mfgDirectLabor") setMfgDirectLabor(val);
    else if (field === "mfgOverhead") setMfgOverhead(val);
    update(field, val);
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

  // Skenario Indikator Harga Ekspor Berjenjang
  const exwScenario = pricing.scenarios.find((s) => s.term === "EXW") || { offer: 0, unit: 0, cost: 0, profit: 0, term: "EXW" as const };
  const fcaScenario = pricing.scenarios.find((s) => s.term === "FCA") || { offer: 0, unit: 0, cost: 0, profit: 0, term: "FCA" as const };
  const fobScenario = pricing.scenarios.find((s) => s.term === "FOB") || { offer: 0, unit: 0, cost: 0, profit: 0, term: "FOB" as const };
  const cfrScenario = pricing.scenarios.find((s) => s.term === "CFR") || { offer: 0, unit: 0, cost: 0, profit: 0, term: "CFR" as const };
  const cifScenario = pricing.scenarios.find((s) => s.term === "CIF") || { offer: 0, unit: 0, cost: 0, profit: 0, term: "CIF" as const };
  const dapScenario = pricing.scenarios.find((s) => s.term === "DAP") || { offer: 0, unit: 0, cost: 0, profit: 0, term: "DAP" as const };
  const ddpScenario = pricing.scenarios.find((s) => s.term === "DDP") || { offer: 0, unit: 0, cost: 0, profit: 0, term: "DDP" as const };

  // Fungsi tambah form isian kustom (langsung di grid seperti isian standar)
  const handleAddFactorField = (
    section: "goods" | "logistics" | "strategy",
    defaultName?: string,
    defaultAmount?: number,
  ) => {
    const factorName = defaultName ?? "";
    const newFactor: AdditionalCostFactor = {
      id: "factor-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
      name: factorName,
      amount: defaultAmount || 0,
      section,
    };
    const current = shipment.additionalCostFactors || [];
    update("additionalCostFactors", [...current, newFactor]);
    toast.success(factorName ? `Form isian "${factorName}" ditambahkan` : "Form isian biaya baru ditambahkan ke grid", {
      description: `Kolom isian baru kini siap diketik nama biaya dan nominalnya di Bagian ${section === "goods" ? "01 Nilai Barang" : section === "logistics" ? "02 Logistik" : "03 Strategi"}.`,
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
            eyebrow="PENENTUAN HARGA EKSPOR BERJENJANG"
            title="Alur Penetapan Harga Ekspor & Indikator Incoterms"
            description="Perhitungan bertahap mulai dari bedah HPP komoditas di petani/gudang olah, penentuan margin (EXW), pengantaran ke pelabuhan (FOB), ocean freight (CFR), hingga asuransi laut (CIF)."
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

          {/* PARAMETER TRANSAKSI & PERMINTAAN BUYER */}
          <div className="form-section">
            <div className="form-section-title">
              <span className="section-number">00</span>
              <div>
                <b>Parameter Order &amp; Target Permintaan Buyer</b>
                <small>Komoditas, volume permintaan (misal 20 ton), mata uang, dan titik serah ({shipment.currency})</small>
              </div>
            </div>

            <div className="form-grid four">
              <Field
                label="Produk ekspor"
                value={shipment.product}
                onChange={(value) => update("product", value)}
              />
              <Field
                label="Volume permintaan buyer"
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
                <option value="ton">ton · Metric Ton</option>
                <option value="carton">carton · Karton / Box</option>
                <option value="bag">bag · Karung / Kantong</option>
                <option value="drum">drum · Drum / Barel</option>
                <option value="liter">liter · Liter</option>
                <option value="pack">pack · Kemasan Pack</option>
                <option value="pcs">pcs · Pieces / Biji</option>
                {!["kg", "ton", "carton", "bag", "drum", "liter", "pack", "pcs"].includes(shipment.unit) && (
                  <option value={shipment.unit}>{shipment.unit} (Kustom)</option>
                )}
              </SelectField>

              <SelectField
                label="Incoterm yang diminta buyer"
                value={shipment.incoterm}
                onChange={(value) => update("incoterm", value as Incoterm)}
              >
                {["EXW", "FCA", "FOB", "CFR", "CIF", "DAP", "DDP"].map((term) => (
                  <option key={term}>{term}</option>
                ))}
              </SelectField>

              <Field
                label="Pelabuhan / Gudang Tujuan (Named place)"
                value={shipment.namedPlace}
                onChange={(value) => update("namedPlace", value)}
              />

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
                  </select>
                </div>
              </div>

              <Field
                label="Kurs referensi BI"
                value={shipment.exchangeRate}
                type="number"
                suffix="IDR"
                step="0.01"
                onChange={(value) => updateNumber("exchangeRate", value)}
              />
              <Field
                label="Sumber kurs"
                value={shipment.exchangeRateSource}
                onChange={(value) => update("exchangeRateSource", value)}
              />
            </div>

            {/* KURS BANK INDONESIA CEPAT */}
            <div className="fx-clean-bar" style={{ marginTop: 12 }}>
              <div className="fx-clean-head">
                <div className="fx-clean-title">
                  <span className="fx-pulse-dot" />
                  <b>Kurs Resmi Bank Indonesia (BI)</b>
                </div>

                <div className="fx-clean-picker">
                  <span className="fx-picker-label">Valas Acuan:</span>
                  <select
                    className="fx-select-sm"
                    value={selectedBiCurrency}
                    onChange={(e) => setSelectedBiCurrency(e.target.value)}
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

              <div className="fx-clean-rates-grid">
                <div className={`fx-rate-cell ${Math.abs(shipment.exchangeRate - biSellRate) < 1 ? "active" : ""}`}>
                  <div className="cell-top-row">
                    <span className="cell-label">Kurs Jual ({activeBiRate.currency})</span>
                    {Math.abs(shipment.exchangeRate - biSellRate) < 1 && <span className="cell-active-tag">Digunakan</span>}
                  </div>
                  <strong className="cell-value">Rp {formatNumber(biSellRate, 2)}</strong>
                  <button type="button" className="cell-apply-btn" onClick={() => handleApplyBiRate("sell")}>
                    <Zap size={11} /> Terapkan Kurs Jual
                  </button>
                </div>

                <div className={`fx-rate-cell ${Math.abs(shipment.exchangeRate - biMiddleRate) < 1 ? "active" : ""}`}>
                  <div className="cell-top-row">
                    <span className="cell-label">Kurs Tengah ({activeBiRate.currency})</span>
                    {Math.abs(shipment.exchangeRate - biMiddleRate) < 1 && <span className="cell-active-tag">Digunakan</span>}
                  </div>
                  <strong className="cell-value">Rp {formatNumber(biMiddleRate, 2)}</strong>
                  <button type="button" className="cell-apply-btn" onClick={() => handleApplyBiRate("middle")}>
                    Terapkan Kurs Tengah
                  </button>
                </div>

                <div className={`fx-rate-cell ${Math.abs(shipment.exchangeRate - biBuyRate) < 1 ? "active" : ""}`}>
                  <div className="cell-top-row">
                    <span className="cell-label">Kurs Beli ({activeBiRate.currency})</span>
                    {Math.abs(shipment.exchangeRate - biBuyRate) < 1 && <span className="cell-active-tag">Digunakan</span>}
                  </div>
                  <strong className="cell-value">Rp {formatNumber(biBuyRate, 2)}</strong>
                  <button type="button" className="cell-apply-btn" onClick={() => handleApplyBiRate("buy")}>
                    Terapkan Kurs Beli
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* LANGKAH 01: BEDAH HPP KOMODITAS SIAP EKSPOR (DARI PETANI KE GUDANG OLAH) */}
          <div className="export-flow-step">
            <div className="export-step-head">
              <div className="export-step-title-group">
                <span className="export-step-number-pill">LANGKAH 01</span>
                <div className="export-step-texts">
                  <b>Bedah HPP Komoditas Siap Ekspor (Dari Petani ke Gudang Olah)</b>
                  <p>
                    Komoditas dari petani belum memenuhi spesifikasi ekspor. Hitung seluruh pengeluaran untuk mengolah, menyortir, mengemas, dan memberi label agar barang siap diekspor:
                  </p>
                </div>
              </div>

              <div className="export-step-actions">
                <div className="hpp-mode-switch">
                  <button
                    type="button"
                    className={`hpp-mode-btn ${hppMode === "trader" ? "active" : ""}`}
                    onClick={() => {
                      setHppMode("trader");
                      update("hppMode", "trader");
                    }}
                  >
                    🏢 Mode Trader / Sourcing Petani
                  </button>
                  <button
                    type="button"
                    className={`hpp-mode-btn ${hppMode === "manufacturer" ? "active" : ""}`}
                    onClick={() => {
                      setHppMode("manufacturer");
                      update("hppMode", "manufacturer");
                    }}
                  >
                    🏭 Mode Produsen / Pabrik
                  </button>
                </div>

                <button
                  type="button"
                  className="section-factor-btn"
                  onClick={() => handleAddFactorField("goods")}
                  title="Tambah baris biaya pengolahan atau sertifikasi barang"
                >
                  <Plus size={12} /> Tambah Biaya Olah Lain
                </button>
              </div>
            </div>

            {hppMode === "trader" ? (
              <div className="hpp-fields-grid">
                <Field
                  label={`1. Beli gula mentah dari petani (per ${shipment.unit || "kg"})`}
                  value={traderBuyPrice}
                  type="number"
                  prefix={shipment.currency}
                  onChange={(val) => handleUpdateTraderHpp("traderBuyPrice", parseFloat(val) || 0)}
                />
                <Field
                  label="2. Estimasi susut sortasi & kadar air"
                  value={traderShrinkage}
                  type="number"
                  suffix="%"
                  step="0.5"
                  onChange={(val) => handleUpdateTraderHpp("traderShrinkage", parseFloat(val) || 0)}
                />
                <Field
                  label={`3. Kemasan produk siap ekspor (per ${shipment.unit || "kg"})`}
                  value={traderInnerPackaging}
                  type="number"
                  prefix={shipment.currency}
                  onChange={(val) => handleUpdateTraderHpp("traderInnerPackaging", parseFloat(val) || 0)}
                />
                <Field
                  label={`4. Label kemasan, stiker & barcode (per ${shipment.unit || "kg"})`}
                  value={traderLabelPackaging}
                  type="number"
                  prefix={shipment.currency}
                  onChange={(val) => handleUpdateTraderHpp("traderLabelPackaging", parseFloat(val) || 0)}
                />
                <Field
                  label={`5. Gaji karyawan olah & packing (per ${shipment.unit || "kg"})`}
                  value={traderSortingLabor}
                  type="number"
                  prefix={shipment.currency}
                  onChange={(val) => handleUpdateTraderHpp("traderSortingLabor", parseFloat(val) || 0)}
                />
                <Field
                  label={`6. Staffing, listrik gudang & QC (per ${shipment.unit || "kg"})`}
                  value={traderStaffingOverhead}
                  type="number"
                  prefix={shipment.currency}
                  onChange={(val) => handleUpdateTraderHpp("traderStaffingOverhead", parseFloat(val) || 0)}
                />
                <Field
                  label={`7. Angkut lokal petani ke gudang (per ${shipment.unit || "kg"})`}
                  value={traderSourcingFreight}
                  type="number"
                  prefix={shipment.currency}
                  onChange={(val) => handleUpdateTraderHpp("traderSourcingFreight", parseFloat(val) || 0)}
                />

                {/* FORM ISIAN TAMBAHAN LEVEL HPP */}
                {(shipment.additionalCostFactors || [])
                  .filter((f) => f.section === "goods")
                  .map((factor) => (
                    <div className="field custom-cost-field" key={factor.id}>
                      <div className="custom-cost-label-row">
                        <input
                          type="text"
                          className="custom-cost-label-input"
                          value={factor.name}
                          placeholder="Ketik nama biaya..."
                          onChange={(e) => handleUpdateFactorField(factor.id, "name", e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.currentTarget.blur();
                              toast.success(factor.name ? `Nama biaya tersimpan: "${factor.name}"` : "Isian biaya diperbarui");
                            }
                          }}
                          autoFocus={!factor.name}
                        />
                        <button
                          type="button"
                          className="custom-cost-confirm-btn"
                          onClick={(e) => {
                            const input = e.currentTarget.parentElement?.querySelector("input");
                            input?.blur();
                            toast.success(factor.name ? `Nama biaya tersimpan: "${factor.name}"` : "Isian biaya diperbarui");
                          }}
                          title="Simpan nama biaya"
                        >
                          <Check size={13} />
                        </button>
                        <button
                          type="button"
                          className="custom-cost-delete-btn"
                          onClick={() => handleDeleteFactorField(factor.id)}
                          title="Hapus isian ini"
                        >
                          <X size={13} />
                        </button>
                      </div>
                      <div className={`input-shell ${shipment.currency ? "has-prefix" : ""}`}>
                        {shipment.currency && <b>{shipment.currency}</b>}
                        <input
                          type="number"
                          value={factor.amount || ""}
                          placeholder="0"
                          onChange={(e) => handleUpdateFactorField(factor.id, "amount", parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  ))}

                {traderShrinkage > 0 && (
                  <div className="hpp-shrinkage-callout">
                    <TrendingUp size={15} />
                    <span>
                      <b>Kompensasi Susut Bobot ({traderShrinkage}%):</b> 1 {shipment.unit || "kg"} gula siap ekspor butuh {(1 / (1 - traderShrinkage / 100)).toFixed(2)} {shipment.unit || "kg"} gula mentah dari petani. Harga bahan baku efektif menjadi <b>{formatCurrencyAmount(traderHppResult.effectiveMaterialCostPerUnit, shipment.currency)}</b> (dampak susut: +{formatCurrencyAmount(traderHppResult.shrinkageCostImpactPerUnit, shipment.currency)}/{shipment.unit || "kg"}).
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="hpp-fields-grid">
                <Field
                  label={`1. Bahan baku utama (per ${shipment.unit || "kg"})`}
                  value={mfgRawMaterial}
                  type="number"
                  prefix={shipment.currency}
                  onChange={(val) => handleUpdateMfgHpp("mfgRawMaterial", parseFloat(val) || 0)}
                />
                <Field
                  label={`2. Bahan penolong / kemasan (per ${shipment.unit || "kg"})`}
                  value={mfgAuxiliary}
                  type="number"
                  prefix={shipment.currency}
                  onChange={(val) => handleUpdateMfgHpp("mfgAuxiliary", parseFloat(val) || 0)}
                />
                <Field
                  label={`3. Tenaga kerja langsung pabrik (per ${shipment.unit || "kg"})`}
                  value={mfgDirectLabor}
                  type="number"
                  prefix={shipment.currency}
                  onChange={(val) => handleUpdateMfgHpp("mfgDirectLabor", parseFloat(val) || 0)}
                />
                <Field
                  label={`4. Overhead pabrik, listrik & QC (per ${shipment.unit || "kg"})`}
                  value={mfgOverhead}
                  type="number"
                  prefix={shipment.currency}
                  onChange={(val) => handleUpdateMfgHpp("mfgOverhead", parseFloat(val) || 0)}
                />
              </div>
            )}

            {/* KOTAK INDIKATOR HASIL LANGKAH 1 */}
            <div className="export-step-indicator">
              <div className="indicator-left">
                <div className="indicator-title-row">
                  <span className="indicator-term-tag">HPP</span>
                  <span className="indicator-name">Total HPP Komoditas Siap Ekspor</span>
                </div>
                <span className="indicator-formula-text">
                  Beli Petani + Susut + Kemasan + Label + Gaji Karyawan + Staffing + Angkut Lokal
                </span>
              </div>

              <div className="indicator-right">
                <div className="indicator-price-box">
                  <span className="indicator-total-label">Total Nilai HPP ({formatNumber(shipment.quantity)} {shipment.unit})</span>
                  <strong className="indicator-total-val">
                    {formatCurrencyAmount(activeHppResult.totalHppOverall, shipment.currency)}
                  </strong>
                  <span className="indicator-unit-val">
                    {formatCurrencyAmount(activeHppResult.totalHppPerUnit, shipment.currency)} / {shipment.unit || "kg"}
                  </span>
                </div>

                <button
                  type="button"
                  className="hpp-apply-btn"
                  onClick={() => handleApplyHppToUnitPrice(activeHppResult.totalHppPerUnit)}
                  title="Terapkan HPP hasil perhitungan ke harga satuan transaksi ekspor"
                >
                  <Zap size={13} /> Terapkan HPP ({formatCurrencyAmount(activeHppResult.totalHppPerUnit, shipment.currency)}) ke Transaksi
                </button>
              </div>
            </div>
          </div>

          {/* LANGKAH 02: TENTUKAN MARGIN -> HARGA JUAL GUDANG / EXW (Ex Works) */}
          <div className={`export-flow-step ${shipment.incoterm === "EXW" ? "active-incoterm-step" : ""}`}>
            <div className="export-step-head">
              <div className="export-step-title-group">
                <span className="export-step-number-pill">LANGKAH 02</span>
                <div className="export-step-texts">
                  <b>Tentukan Margin Keuntungan &rarr; Harga Jual Gudang (EXW / Ex Works)</b>
                  <p>
                    HPP komoditas di atas ditambah dengan target margin keuntungan yang ingin Anda peroleh. Inilah harga jika buyer mengambil barang langsung di gudang Anda:
                  </p>
                </div>
              </div>

              <div className="export-step-actions">
                <button
                  type="button"
                  className="section-factor-btn"
                  onClick={() => handleAddFactorField("strategy", "Biaya Gudang Tambahan")}
                >
                  <Plus size={12} /> Tambah Biaya Gudang Lain
                </button>
              </div>
            </div>

            <div className="form-grid three">
              <Field
                label="Target margin keuntungan eksportir"
                value={shipment.margin}
                type="number"
                suffix="%"
                step="0.5"
                onChange={(value) => updateNumber("margin", value)}
              />
              <Field
                label="Kemasan ekspor master & pallet kayu ISPM-15"
                value={shipment.packaging}
                type="number"
                prefix={shipment.currency}
                onChange={(value) => updateNumber("packaging", value)}
              />
              <Field
                label="Contingency (Cadangan risiko fluktuasi)"
                value={shipment.contingency}
                type="number"
                suffix="%"
                step="0.5"
                onChange={(value) => updateNumber("contingency", value)}
              />
            </div>

            {/* KOTAK INDIKATOR HASIL LANGKAH 2 */}
            <div className="export-step-indicator">
              <div className="indicator-left">
                <div className="indicator-title-row">
                  <span className="indicator-term-tag">EXW</span>
                  <span className="indicator-name">Harga Jual Gudang (Ex Works)</span>
                  {shipment.incoterm === "EXW" && <span className="cell-active-tag">Incoterm Aktif</span>}
                </div>
                <span className="indicator-formula-text">
                  Total HPP + Kemasan Ekspor Master + Margin {shipment.margin}% + Contingency {shipment.contingency}%
                </span>
              </div>

              <div className="indicator-right">
                <div className="indicator-price-box">
                  <span className="indicator-total-label">Total Penawaran Gudang (EXW)</span>
                  <strong className="indicator-total-val">
                    {formatCurrencyAmount(exwScenario.offer, shipment.currency)}
                  </strong>
                  <span className="indicator-unit-val">
                    {formatCurrencyAmount(exwScenario.unit, shipment.currency)} / {shipment.unit || "kg"}
                  </span>
                </div>

                {shipment.incoterm === "EXW" ? (
                  <span className="indicator-btn-active">
                    <Check size={13} /> Incoterm Disepakati
                  </span>
                ) : (
                  <button
                    type="button"
                    className="indicator-btn-select"
                    onClick={() => {
                      update("incoterm", "EXW");
                      toast.success("Incoterm disetel ke EXW (Harga Gudang)");
                    }}
                  >
                    Pilih EXW sebagai Penawaran
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* LANGKAH 03: PENGANTARAN KE PELABUHAN ASAL & KEPABEANAN -> HARGA FOB (Free On Board) */}
          <div className={`export-flow-step ${shipment.incoterm === "FOB" ? "active-incoterm-step" : ""}`}>
            <div className="export-step-head">
              <div className="export-step-title-group">
                <span className="export-step-number-pill">LANGKAH 03</span>
                <div className="export-step-texts">
                  <b>Pengantaran ke Pelabuhan Asal &amp; Kepabeanan &rarr; Harga FOB (Free On Board)</b>
                  <p>
                    Buyer meminta penyerahan di atas kapal (on vessel) pelabuhan muat asal (POL). Mulai dari Harga Jual Gudang (EXW) ditambah ongkos truk ke pelabuhan, dokumen forwarder, dan PEB Bea Cukai:
                  </p>
                </div>
              </div>

              <div className="export-step-actions">
                <button
                  type="button"
                  className="section-factor-btn"
                  onClick={() => handleAddFactorField("logistics", "Biaya Dokumen Pelabuhan")}
                >
                  <Plus size={12} /> Tambah Biaya Pelabuhan Lain
                </button>
              </div>
            </div>

            <div className="form-grid three">
              <Field
                label="Inland transport (Truk dari gudang ke pelabuhan)"
                value={shipment.inlandTransport}
                type="number"
                prefix={shipment.currency}
                onChange={(value) => updateNumber("inlandTransport", value)}
              />
              <Field
                label="Customs clearance ekspor (PEB & Bea Cukai)"
                value={shipment.customs}
                type="number"
                prefix={shipment.currency}
                onChange={(value) => updateNumber("customs", value)}
              />
              <Field
                label="Origin handling & THC POL (Terminal pelabuhan muat)"
                value={shipment.originHandling}
                type="number"
                prefix={shipment.currency}
                onChange={(value) => updateNumber("originHandling", value)}
              />

              {/* FORM ISIAN TAMBAHAN LEVEL LOGISTIK/FOB */}
              {(shipment.additionalCostFactors || [])
                .filter((f) => f.section === "logistics")
                .map((factor) => (
                  <div className="field custom-cost-field" key={factor.id}>
                    <div className="custom-cost-label-row">
                      <input
                        type="text"
                        className="custom-cost-label-input"
                        value={factor.name}
                        placeholder="Ketik nama biaya..."
                        onChange={(e) => handleUpdateFactorField(factor.id, "name", e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.currentTarget.blur();
                            toast.success(factor.name ? `Nama biaya tersimpan: "${factor.name}"` : "Isian biaya diperbarui");
                          }
                        }}
                        autoFocus={!factor.name}
                      />
                      <button
                        type="button"
                        className="custom-cost-confirm-btn"
                        onClick={(e) => {
                          const input = e.currentTarget.parentElement?.querySelector("input");
                          input?.blur();
                          toast.success(factor.name ? `Nama biaya tersimpan: "${factor.name}"` : "Isian biaya diperbarui");
                        }}
                        title="Simpan nama biaya"
                      >
                        <Check size={13} />
                      </button>
                      <button
                        type="button"
                        className="custom-cost-delete-btn"
                        onClick={() => handleDeleteFactorField(factor.id)}
                        title="Hapus isian ini"
                      >
                        <X size={13} />
                      </button>
                    </div>
                    <div className={`input-shell ${shipment.currency ? "has-prefix" : ""}`}>
                      {shipment.currency && <b>{shipment.currency}</b>}
                      <input
                        type="number"
                        value={factor.amount || ""}
                        placeholder="0"
                        onChange={(e) => handleUpdateFactorField(factor.id, "amount", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                ))}
            </div>

            {/* KOTAK INDIKATOR HASIL LANGKAH 3 */}
            <div className="export-step-indicator">
              <div className="indicator-left">
                <div className="indicator-title-row">
                  <span className="indicator-term-tag">FOB</span>
                  <span className="indicator-name">Harga Di Atas Kapal Pelabuhan Asal (Free On Board)</span>
                  {shipment.incoterm === "FOB" && <span className="cell-active-tag">Incoterm Aktif</span>}
                </div>
                <span className="indicator-formula-text">
                  Harga EXW + Truk Pelabuhan + Customs PEB + THC POL (Uang tambang kapal ditanggung buyer)
                </span>
              </div>

              <div className="indicator-right">
                <div className="indicator-price-box">
                  <span className="indicator-total-label">Total Penawaran FOB</span>
                  <strong className="indicator-total-val">
                    {formatCurrencyAmount(fobScenario.offer, shipment.currency)}
                  </strong>
                  <span className="indicator-unit-val">
                    {formatCurrencyAmount(fobScenario.unit, shipment.currency)} / {shipment.unit || "kg"}
                  </span>
                </div>

                {shipment.incoterm === "FOB" ? (
                  <span className="indicator-btn-active">
                    <Check size={13} /> Incoterm Disepakati
                  </span>
                ) : (
                  <button
                    type="button"
                    className="indicator-btn-select"
                    onClick={() => {
                      update("incoterm", "FOB");
                      toast.success("Incoterm disetel ke FOB (Pelabuhan Asal)");
                    }}
                  >
                    Pilih FOB sebagai Penawaran
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* LANGKAH 04: UANG TAMBANG KAPAL -> HARGA CFR (Cost and Freight) */}
          <div className={`export-flow-step ${shipment.incoterm === "CFR" ? "active-incoterm-step" : ""}`}>
            <div className="export-step-head">
              <div className="export-step-title-group">
                <span className="export-step-number-pill">LANGKAH 04</span>
                <div className="export-step-texts">
                  <b>Uang Tambang Kapal ke Pelabuhan Tujuan &rarr; Harga CFR (Cost and Freight)</b>
                  <p>
                    Buyer meminta pengiriman kapal sampai ke pelabuhan tujuan (misal Port of Gothenburg). Mulai dari Harga FOB ditambah ocean freight forwarder:
                  </p>
                </div>
              </div>

              <div className="export-step-actions">
                <button
                  type="button"
                  className="section-factor-btn"
                  onClick={() => handleAddFactorField("logistics", "Surcharge Freight Kapal")}
                >
                  <Plus size={12} /> Tambah Surcharge Kapal
                </button>
              </div>
            </div>

            <div className="form-grid two">
              <Field
                label="Ocean freight (Uang tambang kapal kontainer ke pelabuhan buyer)"
                value={shipment.freight}
                type="number"
                prefix={shipment.currency}
                onChange={(value) => updateNumber("freight", value)}
              />
            </div>

            {/* KOTAK INDIKATOR HASIL LANGKAH 4 */}
            <div className="export-step-indicator">
              <div className="indicator-left">
                <div className="indicator-title-row">
                  <span className="indicator-term-tag">CFR</span>
                  <span className="indicator-name">Harga Sampai Pelabuhan Tujuan (Cost and Freight)</span>
                  {shipment.incoterm === "CFR" && <span className="cell-active-tag">Incoterm Aktif</span>}
                </div>
                <span className="indicator-formula-text">
                  Harga FOB + Ocean Freight Kapal Kontainer ke Pelabuhan Bongkar Tujuan (Belum termasuk asuransi)
                </span>
              </div>

              <div className="indicator-right">
                <div className="indicator-price-box">
                  <span className="indicator-total-label">Total Penawaran CFR</span>
                  <strong className="indicator-total-val">
                    {formatCurrencyAmount(cfrScenario.offer, shipment.currency)}
                  </strong>
                  <span className="indicator-unit-val">
                    {formatCurrencyAmount(cfrScenario.unit, shipment.currency)} / {shipment.unit || "kg"}
                  </span>
                </div>

                {shipment.incoterm === "CFR" ? (
                  <span className="indicator-btn-active">
                    <Check size={13} /> Incoterm Disepakati
                  </span>
                ) : (
                  <button
                    type="button"
                    className="indicator-btn-select"
                    onClick={() => {
                      update("incoterm", "CFR");
                      toast.success("Incoterm disetel ke CFR (Freight Kapal)");
                    }}
                  >
                    Pilih CFR sebagai Penawaran
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* LANGKAH 05: BELI ASURANSI LAUT -> HARGA CIF (Cost, Insurance, and Freight) */}
          <div className={`export-flow-step ${shipment.incoterm === "CIF" ? "active-incoterm-step" : ""}`}>
            <div className="export-step-head">
              <div className="export-step-title-group">
                <span className="export-step-number-pill">LANGKAH 05</span>
                <div className="export-step-texts">
                  <b>Beli Asuransi Pengangkutan Laut &rarr; Harga CIF (Cost, Insurance &amp; Freight)</b>
                  <p>
                    Seperti contoh Anda, buyer meminta harga CIF (termasuk asuransi proteksi muatan di laut). Mulai dari Harga CFR ditambah premi asuransi:
                  </p>
                </div>
              </div>

              <div className="export-step-actions">
                <button
                  type="button"
                  className="section-factor-btn"
                  onClick={() => handleAddFactorField("logistics", "Polis Tambahan Asuransi")}
                >
                  <Plus size={12} /> Tambah Biaya Asuransi Lain
                </button>
              </div>
            </div>

            <div className="form-grid two">
              <Field
                label="Asuransi pengangkutan laut (Marine Cargo Insurance)"
                value={shipment.insurance}
                type="number"
                prefix={shipment.currency}
                onChange={(value) => updateNumber("insurance", value)}
              />
            </div>

            {/* KOTAK INDIKATOR HASIL LANGKAH 5 */}
            <div className="export-step-indicator">
              <div className="indicator-left">
                <div className="indicator-title-row">
                  <span className="indicator-term-tag">CIF</span>
                  <span className="indicator-name">Harga Lengkap Sampai Pelabuhan Buyer + Asuransi (CIF)</span>
                  {shipment.incoterm === "CIF" && <span className="cell-active-tag">⭐ Permintaan Buyer</span>}
                </div>
                <span className="indicator-formula-text">
                  Harga CFR + Marine Cargo Insurance (Proteksi risiko pengapalan laut hingga pelabuhan tujuan)
                </span>
              </div>

              <div className="indicator-right">
                <div className="indicator-price-box">
                  <span className="indicator-total-label">Total Penawaran CIF</span>
                  <strong className="indicator-total-val">
                    {formatCurrencyAmount(cifScenario.offer, shipment.currency)}
                  </strong>
                  <span className="indicator-unit-val">
                    {formatCurrencyAmount(cifScenario.unit, shipment.currency)} / {shipment.unit || "kg"}
                  </span>
                </div>

                {shipment.incoterm === "CIF" ? (
                  <span className="indicator-btn-active">
                    <Check size={13} /> Incoterm Disepakati (CIF)
                  </span>
                ) : (
                  <button
                    type="button"
                    className="indicator-btn-select"
                    onClick={() => {
                      update("incoterm", "CIF");
                      toast.success("Incoterm disetel ke CIF (Sesuai Permintaan Buyer)");
                    }}
                  >
                    Pilih CIF sebagai Penawaran
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* LANGKAH 06: PENYERAHAN KE ALAMAT GUDANG BUYER (DAP / DDP - OPSIONAL) */}
          <div className={`export-flow-step ${["DAP", "DDP"].includes(shipment.incoterm) ? "active-incoterm-step" : ""}`}>
            <div className="export-step-head">
              <div className="export-step-title-group">
                <span className="export-step-number-pill">LANGKAH 06</span>
                <div className="export-step-texts">
                  <b>Penyerahan Lanjutan ke Alamat Gudang Buyer (DAP / DDP - Opsional)</b>
                  <p>
                    Jika buyer meminta penyerahan diantar sampai ke pintu gudang di negara tujuan pembeli:
                  </p>
                </div>
              </div>
            </div>

            <div className="form-grid three">
              <Field
                label="Destination handling (THC POD Pelabuhan Bongkar)"
                value={shipment.destinationHandling}
                type="number"
                prefix={shipment.currency}
                onChange={(value) => updateNumber("destinationHandling", value)}
              />
              <Field
                label="Last mile delivery (Truk dari pelabuhan ke gudang buyer)"
                value={shipment.lastMile}
                type="number"
                prefix={shipment.currency}
                onChange={(value) => updateNumber("lastMile", value)}
              />
              <Field
                label="Import duty (Bea masuk & pajak impor - khusus DDP)"
                value={shipment.importDuty}
                type="number"
                prefix={shipment.currency}
                onChange={(value) => updateNumber("importDuty", value)}
              />
            </div>

            {/* KOTAK INDIKATOR HASIL LANGKAH 6 */}
            <div className="export-step-indicator">
              <div className="indicator-left">
                <div className="indicator-title-row">
                  <span className="indicator-term-tag">DAP / DDP</span>
                  <span className="indicator-name">Penyerahan Bersih ke Alamat Gudang Pembeli</span>
                  {["DAP", "DDP"].includes(shipment.incoterm) && <span className="cell-active-tag">Incoterm Aktif</span>}
                </div>
                <span className="indicator-formula-text">
                  CIF + THC POD + Last Mile ke Gudang Buyer {shipment.incoterm === "DDP" ? "+ Bea Masuk Impor (DDP)" : "(DAP tanpa pajak impor)"}
                </span>
              </div>

              <div className="indicator-right">
                <div className="indicator-price-box">
                  <span className="indicator-total-label">DAP: {formatCurrencyAmount(dapScenario.offer, shipment.currency)} · DDP: {formatCurrencyAmount(ddpScenario.offer, shipment.currency)}</span>
                  <span className="indicator-unit-val">
                    DAP: {formatCurrencyAmount(dapScenario.unit, shipment.currency)}/kg · DDP: {formatCurrencyAmount(ddpScenario.unit, shipment.currency)}/kg
                  </span>
                </div>

                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    type="button"
                    className={`indicator-btn-select ${shipment.incoterm === "DAP" ? "active" : ""}`}
                    onClick={() => update("incoterm", "DAP")}
                  >
                    Pilih DAP
                  </button>
                  <button
                    type="button"
                    className={`indicator-btn-select ${shipment.incoterm === "DDP" ? "active" : ""}`}
                    onClick={() => update("incoterm", "DDP")}
                  >
                    Pilih DDP
                  </button>
                </div>
              </div>
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
                  <span>1. HPP Komoditas Siap Ekspor:</span>
                  <b>{formatCurrencyAmount(activeHppResult.totalHppOverall, shipment.currency)}</b>
                </div>
                <div className="factor-row">
                  <span>2. Margin Keuntungan ({shipment.margin}%):</span>
                  <b className="mint-text">+ {formatCurrencyAmount(pricing.active.profit, shipment.currency)}</b>
                </div>
                {["FOB", "FCA", "CFR", "CIF", "DAP", "DDP"].includes(shipment.incoterm) && (
                  <div className="factor-row">
                    <span>3. Truk &amp; Dokumen Pelabuhan (FOB):</span>
                    <b>
                      + {formatCurrencyAmount(
                        (Number(shipment.inlandTransport) || 0) +
                        (Number(shipment.originHandling) || 0) +
                        (Number(shipment.customs) || 0),
                        shipment.currency
                      )}
                    </b>
                  </div>
                )}
                {["CFR", "CIF", "DAP", "DDP"].includes(shipment.incoterm) && (
                  <div className="factor-row">
                    <span>4. Ocean Freight Kapal Laut (CFR):</span>
                    <b>+ {formatCurrencyAmount(Number(shipment.freight) || 0, shipment.currency)}</b>
                  </div>
                )}
                {["CIF", "DAP", "DDP"].includes(shipment.incoterm) && (
                  <div className="factor-row">
                    <span>5. Asuransi Marine Cargo (CIF):</span>
                    <b>+ {formatCurrencyAmount(Number(shipment.insurance) || 0, shipment.currency)}</b>
                  </div>
                )}
                {["DAP", "DDP"].includes(shipment.incoterm) && (
                  <div className="factor-row">
                    <span>6. Bongkar POD &amp; Last Mile Buyer:</span>
                    <b>
                      + {formatCurrencyAmount(
                        (Number(shipment.destinationHandling) || 0) + (Number(shipment.lastMile) || 0),
                        shipment.currency
                      )}
                    </b>
                  </div>
                )}
                {shipment.incoterm === "DDP" && (
                  <div className="factor-row">
                    <span>7. Bea Masuk &amp; Pajak Impor (DDP):</span>
                    <b>+ {formatCurrencyAmount(Number(shipment.importDuty) || 0, shipment.currency)}</b>
                  </div>
                )}
                {contingencyAmount > 0 && (
                  <div className="factor-row">
                    <span>🛡️ Contingency ({shipment.contingency}%):</span>
                    <b>+ {formatCurrencyAmount(contingencyAmount, shipment.currency)}</b>
                  </div>
                )}
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

      {/* TANGGA INDIKATOR HARGA EKSPOR SESUAI RUMUS RESMI INCOTERMS® 2020 */}
      <section className="panel panel-padding">
        <div className="panel-head">
          <div>
            <span className="eyebrow">RUMUS PERHITUNGAN HARGA EKSPOR &amp; TANGGA INCOTERMS® 2020</span>
            <h3>Tangga Indikator Harga Ekspor (Incoterms Waterfall)</h3>
          </div>
          <span className="muted-note">Target Margin: {shipment.margin}% · Contingency: {shipment.contingency}% · Basis: {formatNumber(shipment.quantity)} {shipment.unit || "unit"}</span>
        </div>

        <div className="ladder-container">
          {/* STEP 0: HPP (HARGA POKOK KOMODITAS) */}
          <div className="ladder-step-card hpp-step">
            <div className="ladder-badge-col">
              <span className="ladder-term-badge">HPP</span>
              <small style={{ fontSize: 10, color: "#64748b" }}>Basis Sourcing</small>
            </div>
            <div className="ladder-desc-col">
              <span className="ladder-desc-name">Harga Pokok Penjualan (HPP Komoditas)</span>
              <span className="ladder-desc-formula">
                {hppMode === "trader"
                  ? "Bahan baku (setelah susut) + angkut lokal + upah sortasi + kemasan primer"
                  : "Bahan baku utama + bahan penolong + tenaga kerja langsung + overhead pabrik"}
              </span>
            </div>
            <div className="ladder-offer-col">
              <span className="ladder-offer-label">Total Nilai HPP</span>
              <strong className="ladder-offer-amount">{formatCurrencyAmount(activeHppResult.totalHppOverall, shipment.currency)}</strong>
            </div>
            <div className="ladder-unit-col">
              <span className="ladder-unit-label">HPP Bersih / Unit</span>
              <span className="ladder-unit-amount">{formatCurrencyAmount(activeHppResult.totalHppPerUnit, shipment.currency)} / {shipment.unit || "unit"}</span>
            </div>
            <div className="ladder-action-col">
              <span className="ladder-active-pill" style={{ background: "#475569" }}>
                Basis Pokok
              </span>
            </div>
          </div>

          {/* STEP 1 HINGGA 7: INCOTERMS LADDER WATERFALL */}
          {pricing.scenarios.map((scenario) => {
            const isActive = scenario.term === shipment.incoterm;
            const termMeta = INCOTERM_TEMPLATES[scenario.term];
            const formulaDesc =
              scenario.term === "EXW"
                ? "Total HPP + Kemasan Ekspor Master & Pallet ISPM-15"
                : scenario.term === "FCA"
                  ? "EXW + Inland Transport Trucking ke POL"
                  : scenario.term === "FOB"
                    ? "FCA + Origin Handling THC POL + Customs Clearance PEB Ekspor"
                    : scenario.term === "CFR"
                      ? "FOB + Uang Tambang Ocean Freight Internasional POL ke POD"
                      : scenario.term === "CIF"
                        ? "CFR + Marine Cargo Insurance (Asuransi Pengangkutan Laut)"
                        : scenario.term === "DAP"
                          ? "CIF + Destination THC POD + Last Mile Trucking ke Alamat Gudang Buyer"
                          : "DAP + Bea Masuk Impor (Import Duty) & Pajak Negara Buyer";

            return (
              <div
                key={scenario.term}
                className={`ladder-step-card ${isActive ? "active" : ""}`}
              >
                <div className="ladder-badge-col">
                  <span className="ladder-term-badge">{scenario.term}</span>
                  {isActive && <small style={{ fontSize: 10, color: "#0284c7", fontWeight: 700 }}>Disepakati</small>}
                </div>
                <div className="ladder-desc-col">
                  <span className="ladder-desc-name">
                    {termMeta?.name || scenario.term}
                  </span>
                  <span className="ladder-desc-formula">{formulaDesc}</span>
                </div>
                <div className="ladder-offer-col">
                  <span className="ladder-offer-label">Total Penawaran Utama</span>
                  <strong className="ladder-offer-amount">
                    {formatCurrencyAmount(scenario.offer, shipment.currency)}
                  </strong>
                </div>
                <div className="ladder-unit-col">
                  <span className="ladder-unit-label">Harga per {shipment.unit || "unit"}</span>
                  <span className="ladder-unit-amount">
                    {formatCurrencyAmount(scenario.unit, shipment.currency)}
                  </span>
                </div>
                <div className="ladder-action-col">
                  {isActive ? (
                    <span className="ladder-active-pill">
                      <Check size={13} /> Incoterm Aktif
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="ladder-select-btn"
                      onClick={() => {
                        update("incoterm", scenario.term);
                        toast.success(`Incoterm diubah ke ${scenario.term}`, {
                          description: `Penawaran otomatis disesuaikan ke ${formatCurrencyAmount(scenario.offer, shipment.currency)}.`,
                        });
                      }}
                      title={`Terapkan penawaran berbasis ${scenario.term}`}
                    >
                      Pilih {scenario.term}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
