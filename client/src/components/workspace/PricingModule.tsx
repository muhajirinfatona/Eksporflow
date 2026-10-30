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
    field: "traderBuyPrice" | "traderShrinkage" | "traderSourcingFreight" | "traderSortingLabor" | "traderInnerPackaging" | "traderMargin",
    val: number,
  ) => {
    if (field === "traderBuyPrice") setTraderBuyPrice(val);
    else if (field === "traderShrinkage") setTraderShrinkage(val);
    else if (field === "traderSourcingFreight") setTraderSourcingFreight(val);
    else if (field === "traderSortingLabor") setTraderSortingLabor(val);
    else if (field === "traderInnerPackaging") setTraderInnerPackaging(val);
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

          {/* BAGIAN 01: PEMBEDAHAN INDIKATOR HPP & HARGA GUDANG (EXW) */}
          <div className="form-section">
            <div className="form-section-title">
              <span className="section-number">01</span>
              <div>
                <b>Pembedahan Indikator HPP &amp; Harga Gudang (EXW)</b>
                <small>Basis biaya pengadaan komoditas dan penyerahan di gudang/pabrik penjual ({shipment.currency})</small>
              </div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
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

            {/* PEMBEDAHAN INDIKATOR HPP SECARA TERBUKA (TRADER & PRODUSEN) */}
            <div className="hpp-dissection-card">
              <div className="hpp-dissection-head">
                <div className="hpp-dissection-title">
                  <div className="hpp-dissection-icon">
                    <Calculator size={18} />
                  </div>
                  <div className="hpp-dissection-texts">
                    <b>Pembedahan Indikator HPP (Harga Pokok Penjualan)</b>
                    <small>Rincian indikator pembentuk harga komoditas per {shipment.unit || "unit"} sebelum masuk ke tangga ekspor</small>
                  </div>
                </div>

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
              </div>

              {hppMode === "trader" ? (
                <div className="hpp-fields-grid">
                  <Field
                    label={`1. Harga beli supplier/petani (per ${shipment.unit || "unit"})`}
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
                    label={`3. Angkut lokal ke gudang (per ${shipment.unit || "unit"})`}
                    value={traderSourcingFreight}
                    type="number"
                    prefix={shipment.currency}
                    onChange={(val) => handleUpdateTraderHpp("traderSourcingFreight", parseFloat(val) || 0)}
                  />
                  <Field
                    label={`4. Upah sortasi, grading & cleaning (per ${shipment.unit || "unit"})`}
                    value={traderSortingLabor}
                    type="number"
                    prefix={shipment.currency}
                    onChange={(val) => handleUpdateTraderHpp("traderSortingLabor", parseFloat(val) || 0)}
                  />
                  <Field
                    label={`5. Kemasan primer / inner pack (per ${shipment.unit || "unit"})`}
                    value={traderInnerPackaging}
                    type="number"
                    prefix={shipment.currency}
                    onChange={(val) => handleUpdateTraderHpp("traderInnerPackaging", parseFloat(val) || 0)}
                  />
                  <Field
                    label={`6. Fee pengadaan / sourcing margin (per ${shipment.unit || "unit"})`}
                    value={traderMargin}
                    type="number"
                    prefix={shipment.currency}
                    onChange={(val) => handleUpdateTraderHpp("traderMargin", parseFloat(val) || 0)}
                  />

                  {traderShrinkage > 0 && (
                    <div className="hpp-shrinkage-callout">
                      <TrendingUp size={15} />
                      <span>
                        <b>Kompensasi Susut Bobot ({traderShrinkage}%):</b> Untuk menghasilkan 1 {shipment.unit || "unit"} komoditas ekspor, dibutuhkan {(1 / (1 - traderShrinkage / 100)).toFixed(2)} {shipment.unit || "unit"} bahan mentah. Harga bahan efektif menjadi <b>{formatCurrencyAmount(traderHppResult.effectiveMaterialCostPerUnit, shipment.currency)}</b> (dampak susut: +{formatCurrencyAmount(traderHppResult.shrinkageCostImpactPerUnit, shipment.currency)}/{shipment.unit || "unit"}).
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="hpp-fields-grid">
                  <Field
                    label={`1. Bahan baku utama (Raw Material per ${shipment.unit || "unit"})`}
                    value={mfgRawMaterial}
                    type="number"
                    prefix={shipment.currency}
                    onChange={(val) => handleUpdateMfgHpp("mfgRawMaterial", parseFloat(val) || 0)}
                  />
                  <Field
                    label={`2. Bahan penolong / pembantu (Auxiliary per ${shipment.unit || "unit"})`}
                    value={mfgAuxiliary}
                    type="number"
                    prefix={shipment.currency}
                    onChange={(val) => handleUpdateMfgHpp("mfgAuxiliary", parseFloat(val) || 0)}
                  />
                  <Field
                    label={`3. Upah tenaga kerja langsung (Direct Labor per ${shipment.unit || "unit"})`}
                    value={mfgDirectLabor}
                    type="number"
                    prefix={shipment.currency}
                    onChange={(val) => handleUpdateMfgHpp("mfgDirectLabor", parseFloat(val) || 0)}
                  />
                  <Field
                    label={`4. Overhead pabrik & QC (Factory Overhead per ${shipment.unit || "unit"})`}
                    value={mfgOverhead}
                    type="number"
                    prefix={shipment.currency}
                    onChange={(val) => handleUpdateMfgHpp("mfgOverhead", parseFloat(val) || 0)}
                  />
                </div>
              )}

              <div className="hpp-result-banner">
                <div className="hpp-result-summary">
                  <div className="hpp-result-main">
                    <span>Indikator HPP Bersih:</span>
                    <strong>{formatCurrencyAmount(activeHppResult.totalHppPerUnit, shipment.currency)}</strong>
                    <span>/ {shipment.unit || "unit"}</span>
                    <span className="hpp-sync-badge">
                      <Check size={12} /> Otomatis Masuk Nilai Unit
                    </span>
                  </div>
                  <div className="hpp-result-sub">
                    Subtotal Nilai HPP Barang ({formatNumber(shipment.quantity)} {shipment.unit}):{" "}
                    <b>{formatCurrencyAmount(activeHppResult.totalHppOverall, shipment.currency)}</b>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button
                    type="button"
                    className="hpp-apply-btn"
                    onClick={() => handleApplyHppToUnitPrice(activeHppResult.totalHppPerUnit)}
                    title="Terapkan HPP hasil pembedahan indikator ke harga satuan transaksi ekspor"
                  >
                    <Zap size={13} /> Terapkan HPP ({formatCurrencyAmount(activeHppResult.totalHppPerUnit, shipment.currency)}) ke Transaksi
                  </button>
                </div>
              </div>
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
                label={`Harga per ${shipment.unit || "unit"} (HPP / Beli / Pabrik)`}
                value={shipment.unitPrice}
                type="number"
                prefix={shipment.currency}
                onChange={(value) => updateNumber("unitPrice", value)}
              />
              <Field
                label="Kemasan & packaging ekspor master / pallet"
                value={shipment.packaging}
                type="number"
                prefix={shipment.currency}
                onChange={(value) => updateNumber("packaging", value)}
              />

              {/* FORM ISIAN TAMBAHAN NILAI BARANG LANGSUNG DI GRID */}
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
                        title="Ketik nama biaya, lalu tekan Enter atau klik centang untuk konfirmasi"
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
                        title="Simpan / konfirmasi nama biaya ini"
                        aria-label="Simpan nama biaya"
                      >
                        <Check size={13} />
                      </button>
                      <button
                        type="button"
                        className="custom-cost-delete-btn"
                        onClick={() => handleDeleteFactorField(factor.id)}
                        title="Hapus isian ini"
                        aria-label="Hapus isian"
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

            {/* RINGKASAN INDIKATOR HARGA GUDANG (EXW) */}
            <div className="exw-summary-strip">
              <div className="exw-summary-left">
                <span className="exw-summary-label">
                  <Package size={14} /> Indikator Harga Gudang (EXW):
                </span>
                <strong className="exw-summary-value">
                  {formatCurrencyAmount(goodsSubtotal, shipment.currency)}
                </strong>
                <span className="exw-summary-unit">
                  (≈ {formatCurrencyAmount(shipment.quantity > 0 ? goodsSubtotal / shipment.quantity : 0, shipment.currency)} / {shipment.unit || "unit"})
                </span>
              </div>
              <div className="exw-summary-breakdown">
                Total HPP Komoditas: {formatCurrencyAmount(shipment.quantity * shipment.unitPrice, shipment.currency)}
                {shipment.packaging > 0 && <> + Kemasan Ekspor: {formatCurrencyAmount(shipment.packaging, shipment.currency)}</>}
                {additionalGoods > 0 && <> + Biaya Tambahan: {formatCurrencyAmount(additionalGoods, shipment.currency)}</>}
              </div>
            </div>
          </div>

          {/* BAGIAN 02: BIAYA LOGISTIK, KEPABEANAN & PENGAPALAN */}
          <div className="form-section">
            <div className="form-section-title">
              <span className="section-number">02</span>
              <div>
                <b>Biaya logistik, kepabeanan &amp; pengapalan</b>
                <small>Komponen aktif sesuai cakupan Incoterm disepakati: {shipment.incoterm} ({shipment.currency})</small>
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

            {/* PANDUAN CAKUPAN INCOTERM (TANPA AUTO-FILL) */}
            <div className="incoterm-coverage-banner">
              <div className="incoterm-coverage-icon">
                <Truck size={16} />
              </div>
              <div className="incoterm-coverage-content">
                <div className="incoterm-coverage-title">
                  Incoterm Disepakati: <b>{shipment.incoterm}</b> — {INCOTERM_TEMPLATES[shipment.incoterm]?.name || "Incoterms® 2020"}
                </div>
                <p className="incoterm-coverage-desc">
                  {shipment.incoterm === "EXW" && (
                    <>Eksportir hanya menanggung <b>Harga Gudang (EXW)</b> di Bagian 01. Seluruh biaya pengangkutan, customs, dan pengapalan ditanggung oleh buyer.</>
                  )}
                  {(shipment.incoterm === "FCA" || shipment.incoterm === "FOB") && (
                    <>Eksportir menanggung <b>Harga Gudang + Pengantaran ke Pelabuhan Asal &amp; Customs PEB (FOB)</b>. Ocean freight internasional &amp; asuransi ditanggung buyer.</>
                  )}
                  {(shipment.incoterm === "CFR" || shipment.incoterm === "CIF") && (
                    <>Eksportir menanggung <b>FOB + Ocean Freight {shipment.incoterm === "CIF" ? "+ Asuransi Laut (CIF)" : ""}</b> sampai pelabuhan tujuan buyer (POD).</>
                  )}
                  {(shipment.incoterm === "DAP" || shipment.incoterm === "DDP") && (
                    <>Eksportir menanggung <b>sampai alamat gudang buyer (DAP)</b> {shipment.incoterm === "DDP" ? "+ Bea Masuk & Pajak Impor (DDP)" : ""}.</>
                  )}
                </p>
              </div>
            </div>

            {/* TAHAP 1: PENGANTARAN KE PELABUHAN ASAL / POL (FOB / FCA) */}
            <div className="incoterm-stage-block">
              <div className="incoterm-stage-header">
                <span className="incoterm-stage-tag">FOB / FCA</span>
                <span className="incoterm-stage-title">Pengantaran ke Pelabuhan Muat Asal (POL) &amp; Kepabeanan Ekspor</span>
                <span className="incoterm-stage-scope">
                  {["FOB", "FCA", "CFR", "CIF", "DAP", "DDP"].includes(shipment.incoterm) ? "✓ Ditanggung Penjual" : "× Ditanggung Buyer (EXW)"}
                </span>
              </div>
              <div className="form-grid three">
                <Field
                  label="Inland transport (Trucking ke pelabuhan)"
                  value={shipment.inlandTransport}
                  type="number"
                  prefix={shipment.currency}
                  onChange={(value) => updateNumber("inlandTransport", value)}
                />
                <Field
                  label="Origin handling (THC POL pelabuhan muat)"
                  value={shipment.originHandling}
                  type="number"
                  prefix={shipment.currency}
                  onChange={(value) => updateNumber("originHandling", value)}
                />
                <Field
                  label="Customs clearance (PEB ekspor)"
                  value={shipment.customs}
                  type="number"
                  prefix={shipment.currency}
                  onChange={(value) => updateNumber("customs", value)}
                />
              </div>

              <div className="stage-subtotal-bar">
                <span>Indikator Biaya Tambahan POL (FOB):</span>
                <b>
                  + {formatCurrencyAmount(
                    (Number(shipment.inlandTransport) || 0) +
                    (Number(shipment.originHandling) || 0) +
                    (Number(shipment.customs) || 0),
                    shipment.currency
                  )}
                  {" "}· Kumulatif Biaya Pokok FOB: {formatCurrencyAmount(
                    goodsSubtotal +
                    (Number(shipment.inlandTransport) || 0) +
                    (Number(shipment.originHandling) || 0) +
                    (Number(shipment.customs) || 0),
                    shipment.currency
                  )}
                </b>
              </div>
            </div>

            {/* TAHAP 2: PENGAPALAN INTERNASIONAL (CFR / CIF) */}
            <div className="incoterm-stage-block">
              <div className="incoterm-stage-header">
                <span className="incoterm-stage-tag">CFR / CIF</span>
                <span className="incoterm-stage-title">Pengapalan Internasional &amp; Asuransi Pengangkutan Laut</span>
                <span className="incoterm-stage-scope">
                  {["CFR", "CIF", "DAP", "DDP"].includes(shipment.incoterm) ? "✓ Ditanggung Penjual" : "× Ditanggung Buyer (FOB/EXW)"}
                </span>
              </div>
              <div className="form-grid two">
                <Field
                  label="Ocean freight (Pengapalan internasional)"
                  value={shipment.freight}
                  type="number"
                  prefix={shipment.currency}
                  onChange={(value) => updateNumber("freight", value)}
                />
                <Field
                  label="Insurance (Asuransi pengangkutan laut)"
                  value={shipment.insurance}
                  type="number"
                  prefix={shipment.currency}
                  onChange={(value) => updateNumber("insurance", value)}
                />
              </div>

              <div className="stage-subtotal-bar">
                <span>Indikator Biaya Pengapalan &amp; Asuransi (CIF):</span>
                <b>
                  + {formatCurrencyAmount(
                    (Number(shipment.freight) || 0) + (Number(shipment.insurance) || 0),
                    shipment.currency
                  )}
                  {" "}· Kumulatif Biaya Pokok CIF: {formatCurrencyAmount(
                    goodsSubtotal +
                    (Number(shipment.inlandTransport) || 0) +
                    (Number(shipment.originHandling) || 0) +
                    (Number(shipment.customs) || 0) +
                    (Number(shipment.freight) || 0) +
                    (Number(shipment.insurance) || 0),
                    shipment.currency
                  )}
                </b>
              </div>
            </div>

            {/* TAHAP 3: PELABUHAN & TUJUAN NEGARA BUYER (DAP / DDP) */}
            <div className="incoterm-stage-block">
              <div className="incoterm-stage-header">
                <span className="incoterm-stage-tag">DAP / DDP</span>
                <span className="incoterm-stage-title">Bongkar Pelabuhan Tujuan, Last Mile &amp; Bea Masuk Impor</span>
                <span className="incoterm-stage-scope">
                  {["DAP", "DDP"].includes(shipment.incoterm) ? "✓ Ditanggung Penjual" : "× Ditanggung Buyer (CIF/FOB/EXW)"}
                </span>
              </div>
              <div className="form-grid three">
                <Field
                  label="Destination handling (THC POD)"
                  value={shipment.destinationHandling}
                  type="number"
                  prefix={shipment.currency}
                  onChange={(value) => updateNumber("destinationHandling", value)}
                />
                <Field
                  label="Last mile delivery (Ke gudang buyer)"
                  value={shipment.lastMile}
                  type="number"
                  prefix={shipment.currency}
                  onChange={(value) => updateNumber("lastMile", value)}
                />
                <Field
                  label="Import duty (Bea masuk impor - khusus DDP)"
                  value={shipment.importDuty}
                  type="number"
                  prefix={shipment.currency}
                  onChange={(value) => updateNumber("importDuty", value)}
                />
              </div>

              <div className="stage-subtotal-bar">
                <span>Indikator Biaya POD, Last Mile &amp; Pajak (DDP):</span>
                <b>
                  + {formatCurrencyAmount(
                    (Number(shipment.destinationHandling) || 0) +
                    (Number(shipment.lastMile) || 0) +
                    (Number(shipment.importDuty) || 0),
                    shipment.currency
                  )}
                  {" "}· Kumulatif Biaya Pokok DDP: {formatCurrencyAmount(
                    goodsSubtotal +
                    (Number(shipment.inlandTransport) || 0) +
                    (Number(shipment.originHandling) || 0) +
                    (Number(shipment.customs) || 0) +
                    (Number(shipment.freight) || 0) +
                    (Number(shipment.insurance) || 0) +
                    (Number(shipment.destinationHandling) || 0) +
                    (Number(shipment.lastMile) || 0) +
                    (Number(shipment.importDuty) || 0),
                    shipment.currency
                  )}
                </b>
              </div>
            </div>

            {/* FORM ISIAN TAMBAHAN BIAYA LOGISTIK */}
            {(shipment.additionalCostFactors || [])
              .filter((f) => f.section === "logistics").length > 0 && (
              <div className="incoterm-stage-block">
                <div className="incoterm-stage-header">
                  <span className="incoterm-stage-tag custom">Kustom</span>
                  <span className="incoterm-stage-title">Biaya Logistik &amp; Sertifikasi Tambahan</span>
                </div>
                <div className="form-grid three">
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
                            title="Ketik nama biaya, lalu tekan Enter atau klik centang untuk konfirmasi"
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
                            title="Simpan / konfirmasi nama biaya ini"
                            aria-label="Simpan nama biaya"
                          >
                            <Check size={13} />
                          </button>
                          <button
                            type="button"
                            className="custom-cost-delete-btn"
                            onClick={() => handleDeleteFactorField(factor.id)}
                            title="Hapus form isian ini"
                            aria-label="Hapus isian"
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

              {/* ISIAN TAMBAHAN BIAYA STRATEGIS TAMPIL SEPERTI FIELD BIASA DI GRID */}
              {(shipment.additionalCostFactors || [])
                .filter((f) => f.section === "strategy")
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
                        title="Ketik nama biaya, lalu tekan Enter atau klik centang untuk konfirmasi"
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
                        title="Simpan / konfirmasi nama biaya ini"
                        aria-label="Simpan nama biaya"
                      >
                        <Check size={13} />
                      </button>
                      <button
                        type="button"
                        className="custom-cost-delete-btn"
                        onClick={() => handleDeleteFactorField(factor.id)}
                        title="Hapus form isian ini"
                        aria-label="Hapus isian"
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
