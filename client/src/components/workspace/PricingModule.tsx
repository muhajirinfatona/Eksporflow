import type { ApprovalDecision, PartnerEntry } from "@/hooks/useWorkspaceFlow";
import { trpc } from "@/lib/trpc";
import {
  calculateEffectiveCostPerMt,
  calculateExportPricingModel,
  CostUnit,
  DynamicHppItem,
  ExportCalculatorResult,
  IncotermChainRow,
} from "@shared/exportCalculator";
import {
  convertCurrencyValue,
  formatCurrencyAmount,
  getBiRateForCurrency,
  getRecommendedCurrencyForCountry,
  OFFICIAL_BI_RATES,
  SUPPORTED_CURRENCIES,
} from "@shared/currencies";
import { INCOTERM_TEMPLATES } from "@shared/costFactors";
import { formatNumber } from "@shared/format";
import type { ScreenId } from "@shared/risk";
import type { Incoterm, LineItem, Shipment } from "@shared/shipment";
import {
  ArrowRightLeft,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Layers,
  Plus,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Field, SectionTitle, SelectField, StatusPill } from "./Primitives";

export type DynamicLogisticRow = {
  id: string;
  name: string;
  amount: number;
  unit: CostUnit;
  stage: "FCA" | "FOB" | "CFR" | "CIF" | "DAP" | "DPU" | "DDP";
};

export function PricingModule({
  shipment,
  update,
  updateNumber,
  updateLineItems,
  pricing: _pricing,
  navigate,
  partners,
  applyPartner,
  effectiveApprovalStatus,
}: {
  shipment: Shipment;
  update: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void;
  updateNumber: (key: keyof Shipment, value: string) => void;
  updateLineItems: (items: LineItem[]) => void;
  pricing: any;
  navigate: (screen: ScreenId) => void;
  partners: PartnerEntry[];
  applyPartner: (partner: PartnerEntry) => void;
  effectiveApprovalStatus: ApprovalDecision;
}) {
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [targetConvertCurrency, setTargetConvertCurrency] = useState<string>("USD");
  const [showGuide, setShowGuide] = useState(false);

  // Satuan aktif transaksi (kg atau ton/MT)
  const isKg = shipment.unit?.toLowerCase() === "kg";
  const [displayUnit, setDisplayUnit] = useState<"kg" | "MT">(isKg ? "kg" : "MT");

  // Jika satuan shipment diubah di form atas, sinkronkan opsi tampilan
  useEffect(() => {
    setDisplayUnit(isKg ? "kg" : "MT");
  }, [isKg]);

  // Kuantitas dalam satuan MT (Metric Ton) untuk perhitungan resmi
  const quantityInMt = Math.max(
    0.01,
    isKg ? (shipment.quantity || 1) / 1000 : (shipment.quantity || 1)
  );

  // Target persentase keuntungan eksportir (%)
  const markupPercent = shipment.margin > 0 ? shipment.margin : 15;

  // Persentase Hasil Jadi (Yield) bahan baku
  const [yieldPercent, setYieldPercent] = useState<number>(90);

  // Penawaran dari pembeli per MT
  const [buyerOfferPerMt, setBuyerOfferPerMt] = useState<number>(
    shipment.unitPrice
      ? (isKg ? shipment.unitPrice * 1000 : shipment.unitPrice)
      : 1850
  );

  // State Bagian A: Daftar Komponen Biaya Modal (HPP) Fleksibel & Dinamis
  const [hppItems, setHppItems] = useState<DynamicHppItem[]>(() => {
    const isIdr = shipment.currency === "IDR";
    if (isIdr) {
      return [
        {
          id: "hpp-raw",
          name: "Bahan baku mentah (dari pemasok / petani)",
          amount: 18000,
          unit: "kg",
          applyYield: true,
        },
        {
          id: "hpp-freight",
          name: "Ongkos angkut bahan ke gudang olah",
          amount: 350,
          unit: "kg",
          applyYield: false,
        },
        {
          id: "hpp-process",
          name: "Biaya olah, sortir & perapian mutu",
          amount: 650,
          unit: "kg",
          applyYield: false,
        },
        {
          id: "hpp-labor",
          name: "Upah pekerja olah & packing",
          amount: 450,
          unit: "kg",
          applyYield: false,
        },
        {
          id: "hpp-overhead",
          name: "Sewa gudang, listrik & operasional",
          amount: 300,
          unit: "kg",
          applyYield: false,
        },
        {
          id: "hpp-pack",
          name: "Kemasan ekspor (karung/karton food-grade)",
          amount: 400,
          unit: "kg",
          applyYield: false,
        },
        {
          id: "hpp-label",
          name: "Label kemasan, stiker & barcode",
          amount: 150,
          unit: "kg",
          applyYield: false,
        },
        {
          id: "hpp-qc",
          name: "Uji laboratorium mutu (COA)",
          amount: 2500000,
          unit: "dokumen",
          applyYield: false,
        },
        {
          id: "hpp-prep",
          name: "Biaya persiapan pesanan (tetap)",
          amount: 1500000,
          unit: "order",
          applyYield: false,
        },
      ];
    }
    return [
      {
        id: "hpp-raw",
        name: "Bahan baku mentah (Sourcing / Supplier)",
        amount: 1.2,
        unit: "kg",
        applyYield: true,
      },
      {
        id: "hpp-freight",
        name: "Ongkos angkut bahan ke gudang",
        amount: 35,
        unit: "MT",
        applyYield: false,
      },
      {
        id: "hpp-process",
        name: "Biaya pengolahan & standarisasi mutu",
        amount: 65,
        unit: "MT",
        applyYield: false,
      },
      {
        id: "hpp-labor",
        name: "Upah pekerja olah & packing",
        amount: 45,
        unit: "MT",
        applyYield: false,
      },
      {
        id: "hpp-overhead",
        name: "Sewa tempat & utilitas gudang",
        amount: 30,
        unit: "MT",
        applyYield: false,
      },
      {
        id: "hpp-pack",
        name: "Kemasan ekspor",
        amount: 40,
        unit: "MT",
        applyYield: false,
      },
      {
        id: "hpp-label",
        name: "Label & stiker barcode",
        amount: 15,
        unit: "MT",
        applyYield: false,
      },
      {
        id: "hpp-qc",
        name: "Uji lab sertifikasi mutu (COA)",
        amount: 200,
        unit: "dokumen",
        applyYield: false,
      },
      {
        id: "hpp-prep",
        name: "Biaya persiapan pesanan (tetap)",
        amount: 200,
        unit: "order",
        applyYield: false,
      },
    ];
  });

  // State Bagian B: Biaya Pengiriman & Dokumen Fleksibel & Dinamis
  const [logisticItems, setLogisticItems] = useState<DynamicLogisticRow[]>(() => {
    const isIdr = shipment.currency === "IDR";
    if (isIdr) {
      return [
        {
          id: "fca-trucking",
          name: "Truk dari gudang ke pelabuhan muat (Inland POL)",
          amount: 350000,
          unit: "MT",
          stage: "FCA",
        },
        {
          id: "fca-customs",
          name: "Izin ekspor Bea Cukai (PEB)",
          amount: 1750000,
          unit: "dokumen",
          stage: "FCA",
        },
        {
          id: "fca-docs",
          name: "Sertifikat ekspor (Karantina, SKA/COO, Fumigasi)",
          amount: 2200000,
          unit: "dokumen",
          stage: "FCA",
        },
        {
          id: "fob-terminal",
          name: "Biaya bongkar muat pelabuhan asal (THC POL)",
          amount: 120000,
          unit: "MT",
          stage: "FOB",
        },
        {
          id: "cfr-freight",
          name: "Ongkos kapal kontainer internasional (Ocean Freight)",
          amount: 1250000,
          unit: "MT",
          stage: "CFR",
        },
        {
          id: "cif-insurance",
          name: "Asuransi pengiriman laut (Marine Cargo)",
          amount: 150000,
          unit: "MT",
          stage: "CIF",
        },
        {
          id: "dap-lastmile",
          name: "Truk antar ke gudang pembeli (Last-Mile)",
          amount: 350000,
          unit: "MT",
          stage: "DAP",
        },
        {
          id: "ddp-duty",
          name: "Pajak & bea masuk negara tujuan (khusus DDP)",
          amount: 650000,
          unit: "MT",
          stage: "DDP",
        },
      ];
    }
    return [
      {
        id: "fca-trucking",
        name: "Truk ke pelabuhan muat (Inland POL)",
        amount: 25,
        unit: "MT",
        stage: "FCA",
      },
      {
        id: "fca-customs",
        name: "Izin ekspor Bea Cukai (PEB)",
        amount: 150,
        unit: "dokumen",
        stage: "FCA",
      },
      {
        id: "fca-docs",
        name: "Sertifikat ekspor (COO, Fumigasi)",
        amount: 180,
        unit: "dokumen",
        stage: "FCA",
      },
      {
        id: "fob-terminal",
        name: "Biaya bongkar muat pelabuhan muat (THC POL)",
        amount: 20,
        unit: "MT",
        stage: "FOB",
      },
      {
        id: "cfr-freight",
        name: "Ocean freight kapal kontainer",
        amount: 110,
        unit: "MT",
        stage: "CFR",
      },
      {
        id: "cif-insurance",
        name: "Asuransi pengiriman laut",
        amount: 12,
        unit: "MT",
        stage: "CIF",
      },
      {
        id: "dap-lastmile",
        name: "Truk antar ke gudang pembeli",
        amount: 25,
        unit: "MT",
        stage: "DAP",
      },
      {
        id: "ddp-duty",
        name: "Pajak & bea masuk (DDP)",
        amount: 45,
        unit: "MT",
        stage: "DDP",
      },
    ];
  });

  // Konversi logisticItems ke format AdditionalCostItem untuk kalkulator resmi
  const normalizedAdditionalCosts = useMemo(() => {
    return logisticItems.map((item) => {
      const isFixed = item.unit === "order" || item.unit === "dokumen";
      const isPerContainer = item.unit === "kontainer";
      const isPerKg = item.unit === "kg";

      if (isFixed) {
        return {
          id: item.id,
          name: item.name,
          perMt: 0,
          fixedOrder: item.amount,
          stage: item.stage,
          description: "",
        };
      }
      if (isPerContainer) {
        const numContainers = Math.max(1, Math.ceil(quantityInMt / 20));
        return {
          id: item.id,
          name: item.name,
          perMt: (item.amount * numContainers) / quantityInMt,
          fixedOrder: 0,
          stage: item.stage,
          description: "",
        };
      }
      if (isPerKg) {
        return {
          id: item.id,
          name: item.name,
          perMt: item.amount * 1000,
          fixedOrder: 0,
          stage: item.stage,
          description: "",
        };
      }
      return {
        id: item.id,
        name: item.name,
        perMt: item.amount,
        fixedOrder: 0,
        stage: item.stage,
        description: "",
      };
    });
  }, [logisticItems, quantityInMt]);

  // Perhitungan Rantai Harga & Profitabilitas
  const exportCalcResult: ExportCalculatorResult = useMemo(() => {
    return calculateExportPricingModel({
      currency: shipment.currency,
      quantityMt: quantityInMt,
      targetMarkup: markupPercent / 100,
      buyerPricePerMt: buyerOfferPerMt,
      dynamicHppItems: hppItems,
      yieldPercent: yieldPercent,
      additionalCosts: normalizedAdditionalCosts,
    });
  }, [hppItems, yieldPercent, normalizedAdditionalCosts, quantityInMt, markupPercent, buyerOfferPerMt, shipment.currency]);

  // Baris aktif Incoterm yang dipilih
  const activeChainRow = useMemo(() => {
    const term = shipment.incoterm || "CIF";
    return exportCalcResult.chain.find((r) => r.term === term) || exportCalcResult.chain[0];
  }, [exportCalcResult.chain, shipment.incoterm]);

  // Sinkronisasi otomatis nilai unitPrice ke data transaksi
  useEffect(() => {
    if (!activeChainRow) return;
    const unitPriceConverted = isKg
      ? Number((activeChainRow.targetPricePerMt / 1000).toFixed(4))
      : Number(activeChainRow.targetPricePerMt.toFixed(2));

    if (Math.abs((shipment.unitPrice || 0) - unitPriceConverted) > 0.01) {
      update("unitPrice", unitPriceConverted);
      if (shipment.lineItems && shipment.lineItems.length > 0) {
        const updated = shipment.lineItems.map((item, idx) =>
          idx === 0 ? { ...item, unitPrice: unitPriceConverted } : item
        );
        updateLineItems(updated);
      }
    }
  }, [activeChainRow, isKg, shipment.unitPrice, update, updateLineItems, shipment.lineItems]);

  // Kurs Bank Indonesia & Konversi Valas
  const recommendedCurrency = getRecommendedCurrencyForCountry(shipment.buyerCountry);
  const initialBiCur =
    shipment.currency !== "IDR"
      ? shipment.currency
      : recommendedCurrency?.code && recommendedCurrency.code !== "IDR"
      ? recommendedCurrency.code
      : "USD";
  const [selectedBiCurrency, setSelectedBiCurrency] = useState<string>(initialBiCur);

  const {
    data: liveRates,
    isFetching: isFetchingRates,
    refetch: refetchRates,
  } = trpc.rates.getLatest.useQuery(undefined, {
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  const activeBiRate = getBiRateForCurrency(selectedBiCurrency);
  const biSellRate = activeBiRate.sellRate;
  const biBuyRate = activeBiRate.buyRate;
  const biMiddleRate = activeBiRate.middleRate;
  const currentFxRate = shipment.exchangeRate > 0 ? shipment.exchangeRate : biSellRate;

  // Konversi Mata Uang Acuan
  const defaultDualTarget =
    shipment.currency === "IDR"
      ? recommendedCurrency?.code && recommendedCurrency.code !== "IDR"
        ? recommendedCurrency.code
        : "USD"
      : "IDR";
  const [buyerDualCurrency, setBuyerDualCurrency] = useState<string>(defaultDualTarget);
  const activeDualCurrency = shipment.currency === "IDR" ? buyerDualCurrency : "IDR";

  const convertedTotalOffer = convertCurrencyValue(
    activeChainRow.totalTargetOrder,
    shipment.currency,
    activeDualCurrency,
    currentFxRate,
    liveRates?.rates
  );

  // Helper HPP Handlers
  const handleUpdateHppItem = (
    id: string,
    field: "name" | "amount" | "unit" | "applyYield",
    val: any
  ) => {
    setHppItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: val } : it))
    );
  };

  const handleDeleteHppItem = (id: string) => {
    setHppItems((prev) => prev.filter((it) => it.id !== id));
    toast.success("Baris biaya modal dihapus");
  };

  const handleAddHppItem = () => {
    const newItem: DynamicHppItem = {
      id: "hpp-" + Date.now(),
      name: "Biaya Modal Baru",
      amount: 0,
      unit: isKg ? "kg" : "MT",
      applyYield: false,
    };
    setHppItems((prev) => [...prev, newItem]);
    toast.success("Baris biaya modal baru ditambahkan");
  };

  // Helper Logistic Handlers
  const handleUpdateLogisticItem = (
    id: string,
    field: "name" | "amount" | "unit" | "stage",
    val: any
  ) => {
    setLogisticItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: val } : it))
    );
  };

  const handleDeleteLogisticItem = (id: string) => {
    setLogisticItems((prev) => prev.filter((it) => it.id !== id));
    toast.success("Baris biaya pengiriman dihapus");
  };

  const handleAddLogisticItem = () => {
    const newItem: DynamicLogisticRow = {
      id: "log-" + Date.now(),
      name: "Biaya Pengiriman Baru",
      amount: 0,
      unit: "dokumen",
      stage: (shipment.incoterm as any) || "FOB",
    };
    setLogisticItems((prev) => [...prev, newItem]);
    toast.success("Baris biaya pengiriman baru ditambahkan");
  };

  // Muat contoh simulasi data
  const handleLoadSampleData = () => {
    if (!shipment.product || shipment.product === "Produk Ekspor") {
      update("product", "Komoditas Ekspor Siap Kirim");
    }
    update("quantity", 20);
    update("unit", "ton");
    update("incoterm", "CIF");
    update("margin", 15);
    setYieldPercent(90);

    if (shipment.currency === "USD") {
      setBuyerOfferPerMt(1900);
    } else {
      setBuyerOfferPerMt(29500000);
    }
    toast.success("Contoh simulasi angka diterapkan");
  };

  const handleApplyBiRate = (type: "sell" | "middle" | "buy") => {
    const rateVal = type === "sell" ? biSellRate : type === "middle" ? biMiddleRate : biBuyRate;
    const label =
      type === "sell"
        ? `Kurs Jual BI ${activeBiRate.currency}`
        : type === "middle"
        ? `Kurs Tengah BI ${activeBiRate.currency}`
        : `Kurs Beli BI ${activeBiRate.currency}`;
    update("exchangeRate", Number(rateVal.toFixed(2)));
    update("exchangeRateDate", new Date().toISOString().slice(0, 10));
    update("exchangeRateSource", `Bank Indonesia (${label})`);
    toast.success(`${label} diterapkan: Rp ${formatNumber(rateVal, 2)}`);
  };

  return (
    <div className="tab-pane active pricing-screen">
      <div className="pricing-layout">
        <section className="pricing-main">
          <SectionTitle
            eyebrow="PENETAPAN HARGA EKSPOR"
            title="Kalkulator Harga Ekspor &amp; Incoterms"
            description="Hitung modal produk (HPP), tentukan keuntungan, dan hitung biaya kirim sampai ke negara pembeli."
            action={
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  type="button"
                  className="section-factor-btn"
                  onClick={handleLoadSampleData}
                  title="Terapkan contoh angka acuan"
                >
                  <RotateCcw size={13} /> Muat Contoh Simulasi
                </button>

                {partners.length > 0 && (
                  <select
                    className="clean-select"
                    value=""
                    aria-label="Isi cepat dari direktori mitra"
                    onChange={(event) => {
                      const found = partners.find((p) => p.id === event.target.value);
                      if (found) {
                        applyPartner(found);
                        toast.success(`Pembeli ${found.name} diterapkan`);
                      }
                    }}
                  >
                    <option value="">Pilih pembeli dari direktori...</option>
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.country})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            }
          />

          {/* PARAMETER PESANAN */}
          <div className="form-section">
            <div className="form-section-title">
              <span className="section-number">00</span>
              <div>
                <b>Parameter Pesanan &amp; Penawaran</b>
              </div>
            </div>

            <div className="form-grid four">
              <Field
                label="Nama produk"
                value={shipment.product}
                onChange={(value) => update("product", value)}
              />

              <Field
                label="Jumlah pesanan"
                value={shipment.quantity}
                type="number"
                onChange={(value) => updateNumber("quantity", value)}
              />

              <SelectField
                label="Satuan pesanan"
                value={shipment.unit}
                onChange={(val) => {
                  update("unit", val);
                  if (shipment.lineItems.length > 0) {
                    const updated = shipment.lineItems.map((item, idx) =>
                      idx === 0 ? { ...item, unit: val } : item
                    );
                    updateLineItems(updated);
                  }
                }}
              >
                <option value="ton">ton · Metric Ton (MT)</option>
                <option value="kg">kg · Kilogram</option>
                <option value="carton">carton · Karton</option>
                <option value="bag">bag · Karung</option>
              </SelectField>

              <SelectField
                label="Syarat penyerahan (Incoterm)"
                value={shipment.incoterm}
                onChange={(value) => update("incoterm", value as Incoterm)}
              >
                {["EXW", "FCA", "FAS", "FOB", "CFR", "CIF", "CPT", "CIP", "DAP", "DPU", "DDP"].map(
                  (term) => (
                    <option key={term} value={term}>
                      {term} · {(INCOTERM_TEMPLATES as any)[term]?.name || term}
                    </option>
                  )
                )}
              </SelectField>

              <Field
                label="Pelabuhan / Kota Tujuan"
                value={shipment.namedPlace}
                placeholder="Contoh: Port of Destination"
                onChange={(value) => update("namedPlace", value)}
              />

              <div className="field">
                <span>Mata uang</span>
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
                        {cur.code} · {cur.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Field
                label="Target Keuntungan (%)"
                value={shipment.margin}
                type="number"
                suffix="%"
                step="0.5"
                onChange={(value) => updateNumber("margin", value)}
              />

              <Field
                label={`Tawaran Pembeli (${displayUnit === "kg" ? "/kg" : "/MT"})`}
                value={
                  displayUnit === "kg"
                    ? Number((buyerOfferPerMt / 1000).toFixed(2))
                    : buyerOfferPerMt
                }
                type="number"
                prefix={shipment.currency}
                onChange={(value) => {
                  const val = parseFloat(value) || 0;
                  setBuyerOfferPerMt(displayUnit === "kg" ? val * 1000 : val);
                }}
              />
            </div>

            {/* KURS BANK INDONESIA CEPAT */}
            <div className="fx-clean-bar" style={{ marginTop: 12 }}>
              <div className="fx-clean-head">
                <div className="fx-clean-title">
                  <span className="fx-pulse-dot" />
                  <b>Kurs Acuan Bank Indonesia (BI)</b>
                </div>

                <div className="fx-clean-picker">
                  <span className="fx-picker-label">Mata Uang:</span>
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
                      toast.info("Menyinkronkan kurs Bank Indonesia...");
                    }}
                    disabled={isFetchingRates}
                    title="Segarkan data kurs BI"
                  >
                    <RefreshCw size={13} className={isFetchingRates ? "spin" : ""} />
                  </button>
                </div>
              </div>

              <div className="fx-clean-rates-grid">
                <div
                  className={`fx-rate-cell ${
                    Math.abs(shipment.exchangeRate - biSellRate) < 1 ? "active" : ""
                  }`}
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
                  >
                    <Zap size={11} /> Terapkan Kurs Jual
                  </button>
                </div>

                <div
                  className={`fx-rate-cell ${
                    Math.abs(shipment.exchangeRate - biMiddleRate) < 1 ? "active" : ""
                  }`}
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
                  >
                    Terapkan Kurs Tengah
                  </button>
                </div>

                <div
                  className={`fx-rate-cell ${
                    Math.abs(shipment.exchangeRate - biBuyRate) < 1 ? "active" : ""
                  }`}
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
                  >
                    Terapkan Kurs Beli
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* BAGIAN A: BIAYA MODAL PRODUK (HPP) */}
          <div className="calc-sheet-card">
            <div className="calc-sheet-header">
              <div className="calc-sheet-title-group">
                <span className="calc-sheet-badge">BAGIAN A</span>
                <div className="calc-sheet-titles">
                  <h3>Biaya Modal Produk Siap Ekspor (HPP)</h3>
                  <p>Bebas tentukan satuan tiap biaya (/kilo, /MT, /dokumen, /order) dan hapus biaya yang tidak diperlukan.</p>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {/* Unit Display Segmented Toggle */}
                <div className="calc-unit-display-toggle">
                  <button
                    type="button"
                    className={`calc-unit-toggle-btn ${displayUnit === "kg" ? "active" : ""}`}
                    onClick={() => setDisplayUnit("kg")}
                    title="Tampilkan rincian dalam satuan per Kilogram"
                  >
                    Per kg
                  </button>
                  <button
                    type="button"
                    className={`calc-unit-toggle-btn ${displayUnit === "MT" ? "active" : ""}`}
                    onClick={() => setDisplayUnit("MT")}
                    title="Tampilkan rincian dalam satuan per Metric Ton"
                  >
                    Per MT
                  </button>
                </div>

                <button
                  type="button"
                  className="section-factor-btn"
                  onClick={handleAddHppItem}
                >
                  <Plus size={13} /> Tambah Biaya Modal
                </button>
              </div>
            </div>

            <div className="calc-sheet-table-wrapper">
              <table className="calc-table">
                <thead>
                  <tr>
                    <th style={{ width: 36, textAlign: "center" }}>#</th>
                    <th>Komponen Modal Produk</th>
                    <th style={{ width: 195 }}>Biaya &amp; Satuan Bebas</th>
                    <th style={{ width: 160, textAlign: "right" }}>
                      Modal Jadi ({displayUnit === "kg" ? "/kg" : "/MT"})
                    </th>
                    <th style={{ width: 85, textAlign: "right" }}>Porsi</th>
                    <th style={{ width: 44, textAlign: "center" }}>Hapus</th>
                  </tr>
                </thead>
                <tbody>
                  {hppItems.map((item, idx) => {
                    const eff = calculateEffectiveCostPerMt(
                      item.amount,
                      item.unit,
                      quantityInMt,
                      item.applyYield,
                      yieldPercent
                    );
                    const formattedUnitVal =
                      displayUnit === "kg"
                        ? formatCurrencyAmount(eff.perKg, shipment.currency)
                        : formatCurrencyAmount(eff.perMt, shipment.currency);

                    const porsiPercent =
                      exportCalcResult.totalHppPerMt > 0
                        ? ((eff.perMt / exportCalcResult.totalHppPerMt) * 100).toFixed(1)
                        : "0.0";

                    return (
                      <tr key={item.id}>
                        <td style={{ textAlign: "center", color: "#94a3b8", fontWeight: 600 }}>
                          {idx + 1}
                        </td>
                        <td>
                          <input
                            type="text"
                            className="calc-input-compact"
                            style={{ fontWeight: 600, border: "none", background: "transparent", padding: 0 }}
                            value={item.name}
                            onChange={(e) => handleUpdateHppItem(item.id, "name", e.target.value)}
                          />

                          {/* Inline Yield Setting khusus baris bahan baku */}
                          {item.applyYield && (
                            <div className="calc-yield-inline-pill">
                              <span>🌾 Hasil Jadi (Yield):</span>
                              <input
                                type="number"
                                value={yieldPercent}
                                onChange={(e) => setYieldPercent(parseFloat(e.target.value) || 0)}
                              />
                              <span>% → butuh <b>{(1 / (Math.max(1, yieldPercent) / 100)).toFixed(2)}x</b> bahan</span>
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="calc-input-group">
                            <input
                              type="number"
                              value={item.amount || ""}
                              placeholder="0"
                              onChange={(e) =>
                                handleUpdateHppItem(item.id, "amount", parseFloat(e.target.value) || 0)
                              }
                            />
                            <select
                              value={item.unit}
                              onChange={(e) =>
                                handleUpdateHppItem(item.id, "unit", e.target.value as CostUnit)
                              }
                              title="Pilih satuan biaya"
                            >
                              <option value="kg">/kg</option>
                              <option value="MT">/MT</option>
                              <option value="dokumen">/dokumen</option>
                              <option value="order">/order</option>
                              <option value="kontainer">/kontainer</option>
                              <option value="pcs">/pcs</option>
                            </select>
                          </div>
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 700 }}>
                          {formattedUnitVal}
                        </td>
                        <td style={{ textAlign: "right", color: "#64748b" }}>
                          {porsiPercent}%
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            type="button"
                            className="calc-row-del-btn"
                            onClick={() => handleDeleteHppItem(item.id)}
                            title="Hapus baris biaya ini"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Total Modal HPP */}
                  <tr className="calc-row-total">
                    <td colSpan={3} style={{ textAlign: "right", paddingRight: 16 }}>
                      TOTAL BIAYA MODAL PRODUK (HPP):
                    </td>
                    <td style={{ textAlign: "right", fontSize: 13.5, whiteSpace: "nowrap" }}>
                      {displayUnit === "kg"
                        ? `${formatCurrencyAmount(exportCalcResult.totalHppPerMt / 1000, shipment.currency)} / kg`
                        : `${formatCurrencyAmount(exportCalcResult.totalHppPerMt, shipment.currency)} / MT`}
                    </td>
                    <td style={{ textAlign: "right" }}>100%</td>
                    <td style={{ textAlign: "center" }}>
                      <span style={{ fontSize: 11, color: "#0369a1", fontWeight: 700 }}>
                        {formatCurrencyAmount(exportCalcResult.totalHppOrder, shipment.currency)}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* BAGIAN B: BIAYA PENGIRIMAN & DOKUMEN */}
          <div className="calc-sheet-card">
            <div className="calc-sheet-header">
              <div className="calc-sheet-title-group">
                <span className="calc-sheet-badge accent">BAGIAN B</span>
                <div className="calc-sheet-titles">
                  <h3>Biaya Pengiriman &amp; Dokumen Ekspor</h3>
                  <p>Truk pelabuhan, izin Bea Cukai, ocean freight, dan asuransi laut. Satuan bebas disesuaikan.</p>
                </div>
              </div>

              <button
                type="button"
                className="section-factor-btn"
                onClick={handleAddLogisticItem}
              >
                <Plus size={13} /> Tambah Biaya Kirim
              </button>
            </div>

            <div className="calc-sheet-table-wrapper">
              <table className="calc-table">
                <thead>
                  <tr>
                    <th style={{ width: 36, textAlign: "center" }}>#</th>
                    <th>Jenis Biaya Pengiriman</th>
                    <th style={{ width: 195 }}>Biaya &amp; Satuan Bebas</th>
                    <th style={{ width: 100 }}>Tahap Serah</th>
                    <th style={{ width: 160, textAlign: "right" }}>
                      Biaya Riil ({displayUnit === "kg" ? "/kg" : "/MT"})
                    </th>
                    <th style={{ width: 44, textAlign: "center" }}>Hapus</th>
                  </tr>
                </thead>
                <tbody>
                  {logisticItems.map((item, idx) => {
                    const eff = calculateEffectiveCostPerMt(
                      item.amount,
                      item.unit,
                      quantityInMt,
                      false,
                      100
                    );
                    const formattedUnitVal =
                      displayUnit === "kg"
                        ? formatCurrencyAmount(eff.perKg, shipment.currency)
                        : formatCurrencyAmount(eff.perMt, shipment.currency);

                    return (
                      <tr key={item.id}>
                        <td style={{ textAlign: "center", color: "#94a3b8", fontWeight: 600 }}>
                          {idx + 1}
                        </td>
                        <td>
                          <input
                            type="text"
                            className="calc-input-compact"
                            style={{ fontWeight: 600, border: "none", background: "transparent", padding: 0 }}
                            value={item.name}
                            onChange={(e) =>
                              handleUpdateLogisticItem(item.id, "name", e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <div className="calc-input-group">
                            <input
                              type="number"
                              value={item.amount || ""}
                              placeholder="0"
                              onChange={(e) =>
                                handleUpdateLogisticItem(
                                  item.id,
                                  "amount",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                            />
                            <select
                              value={item.unit}
                              onChange={(e) =>
                                handleUpdateLogisticItem(
                                  item.id,
                                  "unit",
                                  e.target.value as CostUnit
                                )
                              }
                            >
                              <option value="MT">/MT</option>
                              <option value="kg">/kg</option>
                              <option value="dokumen">/dokumen</option>
                              <option value="order">/order</option>
                              <option value="kontainer">/kontainer</option>
                            </select>
                          </div>
                        </td>
                        <td>
                          <select
                            className="calc-input-compact"
                            style={{ padding: "4px 6px" }}
                            value={item.stage}
                            onChange={(e) =>
                              handleUpdateLogisticItem(item.id, "stage", e.target.value as any)
                            }
                          >
                            <option value="FCA">FCA</option>
                            <option value="FOB">FOB</option>
                            <option value="CFR">CFR</option>
                            <option value="CIF">CIF</option>
                            <option value="DAP">DAP</option>
                            <option value="DPU">DPU</option>
                            <option value="DDP">DDP</option>
                          </select>
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 700 }}>
                          {formattedUnitVal}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            type="button"
                            className="calc-row-del-btn"
                            onClick={() => handleDeleteLogisticItem(item.id)}
                            title="Hapus baris biaya ini"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* BAGIAN C: DAFTAR HARGA INCOTERMS & SIMULASI KEUNTUNGAN */}
          <div className="calc-sheet-card">
            <div className="calc-sheet-header">
              <div className="calc-sheet-title-group">
                <span className="calc-sheet-badge" style={{ background: "#059669" }}>
                  BAGIAN C
                </span>
                <div className="calc-sheet-titles">
                  <h3>Daftar Harga Incoterms &amp; Simulasi Keuntungan</h3>
                  <p>
                    Perbandingan harga modal impas, rekomendasi harga jual target (+keuntungan {markupPercent}%), dan keuntungan bersih.
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#64748b" }}>Pilihan Aktif:</span>
                <StatusPill tone="amber">{shipment.incoterm || "CIF"}</StatusPill>
              </div>
            </div>

            <div className="calc-sheet-table-wrapper">
              <table className="calc-table">
                <thead>
                  <tr>
                    <th style={{ width: 70 }}>Syarat Serah</th>
                    <th style={{ width: 110 }}>Lokasi Serah</th>
                    <th style={{ textAlign: "right" }}>
                      Biaya Kirim ({displayUnit === "kg" ? "/kg" : "/MT"})
                    </th>
                    <th style={{ textAlign: "right" }}>
                      Modal Impas ({displayUnit === "kg" ? "/kg" : "/MT"})
                    </th>
                    <th style={{ textAlign: "right" }}>
                      Harga Jual ({displayUnit === "kg" ? "/kg" : "/MT"})
                    </th>
                    <th style={{ textAlign: "right" }}>Total Nilai Pesanan</th>
                    <th style={{ textAlign: "right" }}>
                      Untung Bersih ({displayUnit === "kg" ? "/kg" : "/MT"})
                    </th>
                    <th style={{ textAlign: "center", width: 105 }}>Hasil Penawaran</th>
                    <th style={{ textAlign: "center", width: 125 }}>Kesesuaian Target</th>
                    <th style={{ textAlign: "center", width: 80 }}>Pilih</th>
                  </tr>
                </thead>
                <tbody>
                  {exportCalcResult.chain.map((row: IncotermChainRow) => {
                    const isActive = row.term === shipment.incoterm;

                    const cumCost =
                      displayUnit === "kg"
                        ? row.cumulativeCostPerMt / 1000
                        : row.cumulativeCostPerMt;

                    const breakEvenVal =
                      displayUnit === "kg"
                        ? row.breakEvenPricePerMt / 1000
                        : row.breakEvenPricePerMt;

                    const targetPriceVal =
                      displayUnit === "kg"
                        ? row.targetPricePerMt / 1000
                        : row.targetPricePerMt;

                    const profitVal =
                      displayUnit === "kg"
                        ? row.targetProfitPerMt / 1000
                        : row.targetProfitPerMt;

                    return (
                      <tr key={row.term} className={isActive ? "active-term-row" : ""}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <strong style={{ fontSize: 13, color: isActive ? "#0284c7" : "#0f172a" }}>
                              {row.term}
                            </strong>
                            {isActive && <span className="cell-active-tag">Dipilih</span>}
                          </div>
                        </td>
                        <td style={{ fontSize: 11.5, color: "#64748b" }}>{row.group}</td>
                        <td style={{ textAlign: "right" }}>
                          {formatCurrencyAmount(cumCost, shipment.currency)}
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 600 }}>
                          {formatCurrencyAmount(breakEvenVal, shipment.currency)}
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 800, color: "#0369a1" }}>
                          {formatCurrencyAmount(targetPriceVal, shipment.currency)}
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 700 }}>
                          {formatCurrencyAmount(row.totalTargetOrder, shipment.currency)}
                        </td>
                        <td style={{ textAlign: "right", color: "#059669", fontWeight: 600 }}>
                          +{formatCurrencyAmount(profitVal, shipment.currency)}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {row.breakEvenIndicator === "UNTUNG" ? (
                            <span className="badge-profit untung">UNTUNG</span>
                          ) : row.breakEvenIndicator === "IMPAS" ? (
                            <span className="badge-profit impas">IMPAS</span>
                          ) : (
                            <span className="badge-profit rugi">RUGI</span>
                          )}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {row.targetStatus === "TARGET TERCAPAI" ? (
                            <span className="badge-profit target-ok">TARGET TERCAPAI</span>
                          ) : row.targetStatus === "DI BAWAH TARGET" ? (
                            <span className="badge-profit impas">DI BAWAH TARGET</span>
                          ) : (
                            <span className="badge-profit rugi">RUGI</span>
                          )}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {isActive ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                color: "#0284c7",
                                fontSize: 11.5,
                                fontWeight: 700,
                              }}
                            >
                              <Check size={13} /> Aktif
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="ladder-select-btn"
                              style={{ padding: "3px 8px", fontSize: 11 }}
                              onClick={() => {
                                update("incoterm", row.term as Incoterm);
                                toast.success(`Syarat penyerahan diubah ke ${row.term}`);
                              }}
                            >
                              Pilih
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* PANDUAN RINGKAS RUMUS HARGA (OPSIONAL - COLLAPSIBLE) */}
          <div className="calc-guide-box">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
              }}
              onClick={() => setShowGuide(!showGuide)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <BookOpen size={15} color="#0284c7" />
                <span style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a" }}>
                  Panduan Singkat Alur Harga Ekspor
                </span>
              </div>
              <button type="button" className="ghost-button" style={{ padding: "2px 8px", fontSize: 11 }}>
                {showGuide ? <ChevronUp size={13} /> : <ChevronDown size={13} />} {showGuide ? "Tutup" : "Buka"}
              </button>
            </div>

            {showGuide && (
              <div className="calc-guide-grid">
                <div style={{ background: "#ffffff", padding: 10, borderRadius: 6, border: "1px solid #e2e8f0" }}>
                  <b style={{ color: "#0284c7", fontSize: 12 }}>Alur Penentuan Harga:</b>
                  <p style={{ fontSize: 11.5, color: "#475569", margin: "4px 0 0" }}>
                    • <b>HPP</b>: Modal beli bahan mentah + susut olah + upah + kemasan + uji mutu.<br />
                    • <b>EXW</b>: Modal HPP + Target Keuntungan (Harga ambil di gudang Anda).<br />
                    • <b>FOB</b>: EXW + Truk ke pelabuhan + Izin Bea Cukai (Barang naik ke atas kapal).<br />
                    • <b>CFR</b>: FOB + Ongkos kapal laut ke pelabuhan negara pembeli.<br />
                    • <b>CIF</b>: CFR + Asuransi perlindungan barang di laut.<br />
                    • <b>DAP/DDP</b>: Diantar sampai ke pintu gudang pembeli.
                  </p>
                </div>

                <div style={{ background: "#ffffff", padding: 10, borderRadius: 6, border: "1px solid #e2e8f0" }}>
                  <b style={{ color: "#059669", fontSize: 12 }}>Hasil Jadi &amp; Modal Impas:</b>
                  <p style={{ fontSize: 11.5, color: "#475569", margin: "4px 0 0" }}>
                    • <b>Hasil Jadi (Yield {yieldPercent}%)</b>: 1 MT produk siap kirim butuh{" "}
                    <b>{(1 / (Math.max(1, yieldPercent) / 100)).toFixed(2)} MT</b> bahan mentah awal.<br />
                    • <b>Harga Modal Impas</b>: Titik impas di mana modal dan seluruh biaya kirim tertutupi.<br />
                    • <b>Harga Target</b>: Harga impas ditambah target keuntungan {markupPercent}%.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ASIDE OFFER PREVIEW */}
        <aside className="pricing-aside">
          <div className="quote-card">
            <div className="quote-top">
              <span className="eyebrow light">RINGKASAN PENAWARAN</span>
              <StatusPill tone="amber">{shipment.incoterm || "CIF"}</StatusPill>
            </div>

            <span className="quote-label">TOTAL HARGA PENAWARAN ({shipment.incoterm})</span>
            <strong>{formatCurrencyAmount(activeChainRow.totalTargetOrder, shipment.currency)}</strong>

            {/* DUAL CURRENCY CONVERSION */}
            <div className="quote-dual-box">
              <div className="quote-dual-header">
                <span className="quote-dual-title">Konversi Mata Uang:</span>
                <select
                  className="quote-dual-select"
                  value={activeDualCurrency}
                  onChange={(e) => setBuyerDualCurrency(e.target.value)}
                  title="Pilih mata uang untuk melihat konversi"
                >
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.symbol})
                    </option>
                  ))}
                </select>
              </div>
              <div className="quote-dual-amount">
                ≈ {formatCurrencyAmount(convertedTotalOffer, activeDualCurrency)}
              </div>
              <div className="quote-dual-rate-info">
                <span>
                  Kurs BI: 1 {activeBiRate.currency} = Rp {formatNumber(currentFxRate, 2)}
                </span>
              </div>
            </div>

            {/* RINCIAN KOMPONEN NILAI */}
            <div className="quote-factor-summary-box">
              <div className="quote-factor-header">
                <span className="quote-factor-title">
                  <Layers size={13} /> Rincian Biaya Penawaran ({shipment.incoterm})
                </span>
              </div>

              <div className="quote-factor-breakdown">
                <div className="factor-row">
                  <span>1. Total Modal Produk (HPP):</span>
                  <b>{formatCurrencyAmount(exportCalcResult.totalHppOrder, shipment.currency)}</b>
                </div>

                <div className="factor-row">
                  <span>2. Keuntungan Bersih Target:</span>
                  <b className="mint-text">
                    +{formatCurrencyAmount(activeChainRow.totalTargetProfitOrder, shipment.currency)}
                  </b>
                </div>

                {activeChainRow.cumulativeCostPerMt > 0 && (
                  <div className="factor-row">
                    <span>3. Biaya Kirim &amp; Dokumen:</span>
                    <b>
                      +{formatCurrencyAmount(
                        activeChainRow.cumulativeCostPerMt * quantityInMt,
                        shipment.currency
                      )}
                    </b>
                  </div>
                )}

                <div className="factor-row status-row">
                  <span>Status Persetujuan:</span>
                  <b>{effectiveApprovalStatus}</b>
                </div>
              </div>

              <div className="quote-unit-footer">
                <span>Harga per {shipment.unit || "ton"}:</span>
                <b>
                  {formatCurrencyAmount(
                    isKg ? activeChainRow.targetPricePerMt / 1000 : activeChainRow.targetPricePerMt,
                    shipment.currency
                  )}
                </b>
              </div>
            </div>

            <div className="module-stack" style={{ gap: 8 }}>
              <button
                type="button"
                className="full-button"
                onClick={() => {
                  toast.success("Harga siap dipakai di dokumen", {
                    description: `Nilai penawaran ${shipment.incoterm} disinkronkan ke dokumen ekspor.`,
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
                <ClipboardCheck size={14} /> Review Persetujuan ({effectiveApprovalStatus})
              </button>
            </div>
          </div>

          <div className="quote-metadata">
            <span>Standar: Incoterms® 2020</span>
            <span>
              Kurs: {shipment.exchangeRateSource || "Bank Indonesia"} · {shipment.exchangeRateDate || "Realtime"}
            </span>
          </div>

          <div className="tip-card">
            <Sparkles size={17} />
            <div>
              <b>Tips untuk Eksportir Pemula</b>
              <p>
                {shipment.currency === "IDR"
                  ? "Transaksi dihitung dalam Rupiah. Pembeli luar negeri umumnya meminta penawaran resmi dalam mata uang valas (seperti USD atau EUR)."
                  : `Transaksi dihitung dalam ${shipment.currency}. Ekuivalen Rupiah dihitung dengan kurs acuan resmi Bank Indonesia Rp ${formatNumber(currentFxRate)}.`}
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
                  Ubah mata uang transaksi dari <b>{shipment.currency}</b> ke <b>{targetConvertCurrency}</b>
                </p>
              </div>
            </div>

            <div className="fx-modal-body">
              <div className="fx-modal-target-picker">
                <label className="fx-picker-label">Pilih Mata Uang Tujuan:</label>
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
                  <span>Kurs Acuan Bank Indonesia:</span>
                  <b>
                    {targetConvertCurrency === "IDR"
                      ? `1 USD = Rp ${formatNumber(currentFxRate, 2)}`
                      : `1 ${targetConvertCurrency} = Rp ${formatNumber(
                          getBiRateForCurrency(targetConvertCurrency).sellRate,
                          2
                        )}`}
                  </b>
                </div>
                <div className="fx-modal-row">
                  <span>Total Penawaran Saat Ini ({shipment.currency}):</span>
                  <b>{formatCurrencyAmount(activeChainRow.totalTargetOrder, shipment.currency)}</b>
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
                onClick={() => {
                  update("currency", targetConvertCurrency);
                  setShowConvertModal(false);
                  toast.success(`Mata uang transaksi diubah ke ${targetConvertCurrency}`);
                }}
              >
                Terapkan {targetConvertCurrency}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
