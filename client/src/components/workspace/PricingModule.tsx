import type { ApprovalDecision, PartnerEntry } from "@/hooks/useWorkspaceFlow";
import { trpc } from "@/lib/trpc";
import {
  AdditionalCostItem,
  calculateExportPricingModel,
  defaultAdditionalCosts,
  defaultHppInput,
  ExportCalculatorResult,
  HppComponentInput,
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

  // Kuantitas dalam satuan MT (Metric Ton) untuk kalkulasi ekspor
  const isKg = shipment.unit?.toLowerCase() === "kg";
  const quantityInMt = Math.max(
    0.01,
    isKg ? (shipment.quantity || 1) / 1000 : (shipment.quantity || 1)
  );

  // Target persentase keuntungan eksportir (%)
  const markupPercent = shipment.margin > 0 ? shipment.margin : 15;

  // Tawaran harga dari pembeli per MT untuk cek untung/rugi
  const [buyerOfferPerMt, setBuyerOfferPerMt] = useState<number>(
    shipment.unitPrice
      ? (isKg ? shipment.unitPrice * 1000 : shipment.unitPrice)
      : 1850
  );

  // State Bagian A: Biaya Modal Produk (HPP)
  const [hppState, setHppState] = useState<HppComponentInput>(() => {
    const isIdr = shipment.currency === "IDR";
    if (isIdr) {
      return {
        buyPricePerMtRaw: 18000000,
        yieldPercent: 90,
        sourcingFreightPerMtRaw: 350000,
        processingCostPerMt: 650000,
        laborCostPerMt: 450000,
        overheadCostPerMt: 300000,
        packagingCostPerMt: 400000,
        labelCostPerMt: 150000,
        qcLabCostPerMt: 250000,
        otherProdCostPerMt: 0,
        fixedPrepCostOrder: 1500000,
      };
    }
    return { ...defaultHppInput };
  });

  // Komponen biaya modal tambahan
  const [customHppItems, setCustomHppItems] = useState<
    Array<{ id: string; name: string; costPerMt: number }>
  >([]);

  // State Bagian B: Biaya Pengiriman & Dokumen
  const [additionalCosts, setAdditionalCosts] = useState<AdditionalCostItem[]>(() => {
    const isIdr = shipment.currency === "IDR";
    if (isIdr) {
      return [
        {
          id: "fca-trucking",
          name: "Truk dari gudang ke pelabuhan muat (Inland POL)",
          perMt: 350000,
          fixedOrder: 2500000,
          stage: "FCA",
          description: "Truk angkut ke pelabuhan muat asal.",
        },
        {
          id: "fca-customs",
          name: "Izin ekspor Bea Cukai (PEB)",
          perMt: 0,
          fixedOrder: 1750000,
          stage: "FCA",
          description: "Pemberitahuan Ekspor Barang & PPJK.",
        },
        {
          id: "fca-docs",
          name: "Sertifikat ekspor (Karantina, SKA/COO, Fumigasi)",
          perMt: 0,
          fixedOrder: 2200000,
          stage: "FCA",
          description: "Pengurusan sertifikat ekspor.",
        },
        {
          id: "fob-terminal",
          name: "Biaya bongkar muat pelabuhan asal (THC POL)",
          perMt: 120000,
          fixedOrder: 2500000,
          stage: "FOB",
          description: "Biaya pelabuhan muat asal.",
        },
        {
          id: "cfr-freight",
          name: "Ongkos kapal kontainer internasional (Ocean Freight)",
          perMt: 1250000,
          fixedOrder: 7500000,
          stage: "CFR",
          description: "Uang tambang kapal kontainer ke pelabuhan tujuan.",
        },
        {
          id: "cif-insurance",
          name: "Asuransi pengiriman laut (Marine Cargo)",
          perMt: 150000,
          fixedOrder: 1200000,
          stage: "CIF",
          description: "Premi proteksi risiko di laut.",
        },
        {
          id: "dap-lastmile",
          name: "Truk antar ke gudang pembeli (Last-Mile)",
          perMt: 350000,
          fixedOrder: 3500000,
          stage: "DAP",
          description: "Pengantaran pelabuhan tujuan ke alamat pembeli.",
        },
        {
          id: "ddp-duty",
          name: "Pajak & bea masuk negara tujuan (khusus DDP)",
          perMt: 650000,
          fixedOrder: 0,
          stage: "DDP",
          description: "Pajak impor negara pembeli (khusus DDP).",
        },
      ];
    }
    return defaultAdditionalCosts.map((item) => ({ ...item }));
  });

  // Perhitungan Rantai Harga & Keuntungan Ekspor
  const exportCalcResult: ExportCalculatorResult = useMemo(() => {
    const customHppTotalPerMt = customHppItems.reduce(
      (sum, item) => sum + (Number(item.costPerMt) || 0),
      0
    );
    const effectiveHpp: HppComponentInput = {
      ...hppState,
      otherProdCostPerMt: (hppState.otherProdCostPerMt || 0) + customHppTotalPerMt,
    };

    return calculateExportPricingModel({
      currency: shipment.currency,
      quantityMt: quantityInMt,
      targetMarkup: markupPercent / 100,
      buyerPricePerMt: buyerOfferPerMt,
      hpp: effectiveHpp,
      additionalCosts: additionalCosts,
    });
  }, [
    hppState,
    customHppItems,
    additionalCosts,
    quantityInMt,
    markupPercent,
    buyerOfferPerMt,
    shipment.currency,
  ]);

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

  const updateHppField = (key: keyof HppComponentInput, value: number) => {
    setHppState((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddCustomHpp = () => {
    const newItem = {
      id: "hpp-" + Date.now(),
      name: "Biaya Modal Tambahan",
      costPerMt: 0,
    };
    setCustomHppItems((prev) => [...prev, newItem]);
  };

  const handleAddAdditionalCost = () => {
    const newItem: AdditionalCostItem = {
      id: "cost-" + Date.now(),
      name: "Biaya Pengiriman Baru",
      perMt: 0,
      fixedOrder: 0,
      stage: shipment.incoterm === "EXW" ? "FCA" : (shipment.incoterm as any),
      description: "Biaya penyerahan pengiriman",
    };
    setAdditionalCosts((prev) => [...prev, newItem]);
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

    if (shipment.currency === "USD") {
      setHppState({
        buyPricePerMtRaw: 1200,
        yieldPercent: 90,
        sourcingFreightPerMtRaw: 35,
        processingCostPerMt: 65,
        laborCostPerMt: 45,
        overheadCostPerMt: 30,
        packagingCostPerMt: 40,
        labelCostPerMt: 15,
        qcLabCostPerMt: 20,
        otherProdCostPerMt: 0,
        fixedPrepCostOrder: 200,
      });
      setBuyerOfferPerMt(1900);
    } else {
      setHppState({
        buyPricePerMtRaw: 18500000,
        yieldPercent: 90,
        sourcingFreightPerMtRaw: 450000,
        processingCostPerMt: 750000,
        laborCostPerMt: 500000,
        overheadCostPerMt: 350000,
        packagingCostPerMt: 450000,
        labelCostPerMt: 180000,
        qcLabCostPerMt: 280000,
        otherProdCostPerMt: 0,
        fixedPrepCostOrder: 2000000,
      });
      setBuyerOfferPerMt(29500000);
    }
    toast.success("Contoh data simulasi ekspor diterapkan");
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
                label="Satuan"
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
                label="Target Keuntungan / Markup (%)"
                value={shipment.margin}
                type="number"
                suffix="%"
                step="0.5"
                onChange={(value) => updateNumber("margin", value)}
              />

              <Field
                label={`Tawaran Harga Pembeli / MT (${shipment.currency})`}
                value={buyerOfferPerMt}
                type="number"
                prefix={shipment.currency}
                onChange={(value) => setBuyerOfferPerMt(parseFloat(value) || 0)}
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
                  <p>Modal beli bahan baku dari pemasok, penyusutan olah (yield), upah pekerja, kemasan, dan uji mutu.</p>
                </div>
              </div>

              <button
                type="button"
                className="section-factor-btn"
                onClick={handleAddCustomHpp}
              >
                <Plus size={13} /> Tambah Biaya Modal
              </button>
            </div>

            <div className="calc-sheet-table-wrapper">
              <table className="calc-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>No</th>
                    <th>Komponen Modal (HPP)</th>
                    <th style={{ width: 170 }}>Biaya Satuan Awal</th>
                    <th style={{ width: 150, textAlign: "right" }}>Modal per MT Jadi</th>
                    <th style={{ width: 80, textAlign: "right" }}>Porsi Modal</th>
                    <th style={{ width: 220 }}>Hasil Jadi (Yield)</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Row 1: Bahan Baku & Yield */}
                  <tr>
                    <td style={{ textAlign: "center", fontWeight: 700 }}>1</td>
                    <td>
                      <strong>Bahan baku mentah (dari pemasok / petani)</strong>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <input
                          type="number"
                          className="calc-input-compact"
                          value={hppState.buyPricePerMtRaw}
                          onChange={(e) =>
                            updateHppField("buyPricePerMtRaw", parseFloat(e.target.value) || 0)
                          }
                        />
                        <span style={{ fontSize: 11.5, color: "#64748b" }}>/MT</span>
                      </div>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>
                      {formatCurrencyAmount(exportCalcResult.effectiveRawCostPerMt, shipment.currency)}
                    </td>
                    <td style={{ textAlign: "right", color: "#64748b" }}>
                      {exportCalcResult.hppBreakdownPercentages.rawMaterial.toFixed(1)}%
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 11.5 }}>Hasil Jadi:</span>
                        <input
                          type="number"
                          className="calc-input-compact"
                          style={{ width: 55 }}
                          value={hppState.yieldPercent}
                          onChange={(e) =>
                            updateHppField("yieldPercent", parseFloat(e.target.value) || 0)
                          }
                        />
                        <span style={{ fontSize: 11.5, color: "#475569" }}>
                          % → butuh <b>{exportCalcResult.rawMaterialPerMtOutput.toFixed(2)}x</b> bahan
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* Row 2: Angkut Lokal Bahan */}
                  <tr>
                    <td style={{ textAlign: "center", fontWeight: 700 }}>2</td>
                    <td>
                      <strong>Ongkos angkut bahan ke gudang olah</strong>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <input
                          type="number"
                          className="calc-input-compact"
                          value={hppState.sourcingFreightPerMtRaw}
                          onChange={(e) =>
                            updateHppField("sourcingFreightPerMtRaw", parseFloat(e.target.value) || 0)
                          }
                        />
                        <span style={{ fontSize: 11.5, color: "#64748b" }}>/MT</span>
                      </div>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>
                      {formatCurrencyAmount(
                        exportCalcResult.effectiveSourcingFreightPerMt,
                        shipment.currency
                      )}
                    </td>
                    <td style={{ textAlign: "right", color: "#64748b" }}>
                      {exportCalcResult.hppBreakdownPercentages.sourcingFreight.toFixed(1)}%
                    </td>
                    <td style={{ fontSize: 11.5, color: "#64748b" }}>Disesuaikan faktor susut ({hppState.yieldPercent}%)</td>
                  </tr>

                  {/* Row 3: Biaya Olah & Sortir */}
                  <tr>
                    <td style={{ textAlign: "center", fontWeight: 700 }}>3</td>
                    <td>
                      <strong>Biaya olah, sortir &amp; perapian mutu</strong>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <input
                          type="number"
                          className="calc-input-compact"
                          value={hppState.processingCostPerMt}
                          onChange={(e) =>
                            updateHppField("processingCostPerMt", parseFloat(e.target.value) || 0)
                          }
                        />
                        <span style={{ fontSize: 11.5, color: "#64748b" }}>/MT</span>
                      </div>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>
                      {formatCurrencyAmount(hppState.processingCostPerMt, shipment.currency)}
                    </td>
                    <td style={{ textAlign: "right", color: "#64748b" }}>
                      {exportCalcResult.hppBreakdownPercentages.processing.toFixed(1)}%
                    </td>
                    <td style={{ fontSize: 11.5, color: "#64748b" }}>Standarisasi spesifikasi pembeli</td>
                  </tr>

                  {/* Row 4: Upah Pekerja */}
                  <tr>
                    <td style={{ textAlign: "center", fontWeight: 700 }}>4</td>
                    <td>
                      <strong>Upah pekerja olah &amp; packing</strong>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <input
                          type="number"
                          className="calc-input-compact"
                          value={hppState.laborCostPerMt}
                          onChange={(e) =>
                            updateHppField("laborCostPerMt", parseFloat(e.target.value) || 0)
                          }
                        />
                        <span style={{ fontSize: 11.5, color: "#64748b" }}>/MT</span>
                      </div>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>
                      {formatCurrencyAmount(hppState.laborCostPerMt, shipment.currency)}
                    </td>
                    <td style={{ textAlign: "right", color: "#64748b" }}>
                      {exportCalcResult.hppBreakdownPercentages.labor.toFixed(1)}%
                    </td>
                    <td style={{ fontSize: 11.5, color: "#64748b" }}>Tenaga kerja langsung</td>
                  </tr>

                  {/* Row 5: Overhead Gudang */}
                  <tr>
                    <td style={{ textAlign: "center", fontWeight: 700 }}>5</td>
                    <td>
                      <strong>Sewa gudang, listrik &amp; operasional</strong>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <input
                          type="number"
                          className="calc-input-compact"
                          value={hppState.overheadCostPerMt}
                          onChange={(e) =>
                            updateHppField("overheadCostPerMt", parseFloat(e.target.value) || 0)
                          }
                        />
                        <span style={{ fontSize: 11.5, color: "#64748b" }}>/MT</span>
                      </div>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>
                      {formatCurrencyAmount(hppState.overheadCostPerMt, shipment.currency)}
                    </td>
                    <td style={{ textAlign: "right", color: "#64748b" }}>
                      {exportCalcResult.hppBreakdownPercentages.overhead.toFixed(1)}%
                    </td>
                    <td style={{ fontSize: 11.5, color: "#64748b" }}>Biaya operasional tempat olah</td>
                  </tr>

                  {/* Row 6: Kemasan Ekspor */}
                  <tr>
                    <td style={{ textAlign: "center", fontWeight: 700 }}>6</td>
                    <td>
                      <strong>Kemasan ekspor (karung/karton food-grade)</strong>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <input
                          type="number"
                          className="calc-input-compact"
                          value={hppState.packagingCostPerMt}
                          onChange={(e) =>
                            updateHppField("packagingCostPerMt", parseFloat(e.target.value) || 0)
                          }
                        />
                        <span style={{ fontSize: 11.5, color: "#64748b" }}>/MT</span>
                      </div>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>
                      {formatCurrencyAmount(hppState.packagingCostPerMt, shipment.currency)}
                    </td>
                    <td style={{ textAlign: "right", color: "#64748b" }}>
                      {exportCalcResult.hppBreakdownPercentages.packaging.toFixed(1)}%
                    </td>
                    <td style={{ fontSize: 11.5, color: "#64748b" }}>Kemasan pelindung barang</td>
                  </tr>

                  {/* Row 7: Label & Barcode */}
                  <tr>
                    <td style={{ textAlign: "center", fontWeight: 700 }}>7</td>
                    <td>
                      <strong>Label kemasan, stiker &amp; barcode</strong>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <input
                          type="number"
                          className="calc-input-compact"
                          value={hppState.labelCostPerMt}
                          onChange={(e) =>
                            updateHppField("labelCostPerMt", parseFloat(e.target.value) || 0)
                          }
                        />
                        <span style={{ fontSize: 11.5, color: "#64748b" }}>/MT</span>
                      </div>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>
                      {formatCurrencyAmount(hppState.labelCostPerMt, shipment.currency)}
                    </td>
                    <td style={{ textAlign: "right", color: "#64748b" }}>
                      {exportCalcResult.hppBreakdownPercentages.label.toFixed(1)}%
                    </td>
                    <td style={{ fontSize: 11.5, color: "#64748b" }}>Label bahasa negara pembeli</td>
                  </tr>

                  {/* Row 8: Uji Lab Mutu */}
                  <tr>
                    <td style={{ textAlign: "center", fontWeight: 700 }}>8</td>
                    <td>
                      <strong>Uji laboratorium &amp; sertifikat mutu (COA)</strong>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <input
                          type="number"
                          className="calc-input-compact"
                          value={hppState.qcLabCostPerMt}
                          onChange={(e) =>
                            updateHppField("qcLabCostPerMt", parseFloat(e.target.value) || 0)
                          }
                        />
                        <span style={{ fontSize: 11.5, color: "#64748b" }}>/MT</span>
                      </div>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>
                      {formatCurrencyAmount(hppState.qcLabCostPerMt, shipment.currency)}
                    </td>
                    <td style={{ textAlign: "right", color: "#64748b" }}>
                      {exportCalcResult.hppBreakdownPercentages.qcLab.toFixed(1)}%
                    </td>
                    <td style={{ fontSize: 11.5, color: "#64748b" }}>Uji mutu independen resmi</td>
                  </tr>

                  {/* Row 9: Biaya Persiapan Order */}
                  <tr>
                    <td style={{ textAlign: "center", fontWeight: 700 }}>9</td>
                    <td>
                      <strong>Biaya persiapan pesanan (tetap per pesanan)</strong>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <input
                          type="number"
                          className="calc-input-compact"
                          value={hppState.fixedPrepCostOrder}
                          onChange={(e) =>
                            updateHppField("fixedPrepCostOrder", parseFloat(e.target.value) || 0)
                          }
                        />
                        <span style={{ fontSize: 11.5, color: "#64748b" }}>/order</span>
                      </div>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>
                      {formatCurrencyAmount(exportCalcResult.fixedPrepCostPerMt, shipment.currency)}
                    </td>
                    <td style={{ textAlign: "right", color: "#64748b" }}>
                      {exportCalcResult.hppBreakdownPercentages.fixedPrep.toFixed(1)}%
                    </td>
                    <td style={{ fontSize: 11.5, color: "#64748b" }}>
                      Dibagi volume {formatNumber(quantityInMt)} MT
                    </td>
                  </tr>

                  {/* Custom HPP Rows */}
                  {customHppItems.map((customItem, idx) => (
                    <tr key={customItem.id}>
                      <td style={{ textAlign: "center", fontWeight: 700 }}>{10 + idx}</td>
                      <td>
                        <input
                          type="text"
                          className="calc-input-compact"
                          value={customItem.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomHppItems((prev) =>
                              prev.map((it) => (it.id === customItem.id ? { ...it, name: val } : it))
                            );
                          }}
                        />
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <input
                            type="number"
                            className="calc-input-compact"
                            value={customItem.costPerMt}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setCustomHppItems((prev) =>
                                prev.map((it) =>
                                  it.id === customItem.id ? { ...it, costPerMt: val } : it
                                )
                              );
                            }}
                          />
                          <span style={{ fontSize: 11.5, color: "#64748b" }}>/MT</span>
                        </div>
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>
                        {formatCurrencyAmount(customItem.costPerMt, shipment.currency)}
                      </td>
                      <td style={{ textAlign: "right", color: "#64748b" }}>
                        {exportCalcResult.totalHppPerMt > 0
                          ? ((customItem.costPerMt / exportCalcResult.totalHppPerMt) * 100).toFixed(1)
                          : "0.0"}%
                      </td>
                      <td>
                        <button
                          type="button"
                          className="custom-cost-delete-btn"
                          onClick={() =>
                            setCustomHppItems((prev) => prev.filter((it) => it.id !== customItem.id))
                          }
                          title="Hapus baris"
                        >
                          <Trash2 size={13} /> Hapus
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* Total Modal HPP */}
                  <tr className="calc-row-total">
                    <td colSpan={3} style={{ textAlign: "right", paddingRight: 16 }}>
                      TOTAL BIAYA MODAL PRODUK (HPP):
                    </td>
                    <td style={{ textAlign: "right", fontSize: 14 }}>
                      {formatCurrencyAmount(exportCalcResult.totalHppPerMt, shipment.currency)} / MT
                    </td>
                    <td style={{ textAlign: "right" }}>100.0%</td>
                    <td>
                      Total Pesanan: <b>{formatCurrencyAmount(exportCalcResult.totalHppOrder, shipment.currency)}</b>
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
                  <p>Biaya di luar modal produk: truk pelabuhan, izin Bea Cukai, sewa kapal, dan asuransi laut.</p>
                </div>
              </div>

              <button
                type="button"
                className="section-factor-btn"
                onClick={handleAddAdditionalCost}
              >
                <Plus size={13} /> Tambah Biaya Pengiriman
              </button>
            </div>

            <div className="calc-sheet-table-wrapper">
              <table className="calc-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>No</th>
                    <th>Jenis Biaya Pengiriman</th>
                    <th style={{ width: 140 }}>Biaya per MT</th>
                    <th style={{ width: 150 }}>Biaya Tetap per Pesanan</th>
                    <th style={{ width: 160, textAlign: "right" }}>Biaya Riil per MT</th>
                    <th style={{ width: 100 }}>Tahap Serah</th>
                    <th style={{ width: 50, textAlign: "center" }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {additionalCosts.map((item, idx) => {
                    const effectivePerMt =
                      (Number(item.perMt) || 0) + (Number(item.fixedOrder) || 0) / quantityInMt;

                    return (
                      <tr key={item.id}>
                        <td style={{ textAlign: "center", fontWeight: 700 }}>{idx + 1}</td>
                        <td>
                          <input
                            type="text"
                            className="calc-input-compact"
                            value={item.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAdditionalCosts((prev) =>
                                prev.map((it) => (it.id === item.id ? { ...it, name: val } : it))
                              );
                            }}
                          />
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                            <input
                              type="number"
                              className="calc-input-compact"
                              value={item.perMt}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setAdditionalCosts((prev) =>
                                  prev.map((it) => (it.id === item.id ? { ...it, perMt: val } : it))
                                );
                              }}
                            />
                            <span style={{ fontSize: 11, color: "#64748b" }}>/MT</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                            <input
                              type="number"
                              className="calc-input-compact"
                              value={item.fixedOrder}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setAdditionalCosts((prev) =>
                                  prev.map((it) => (it.id === item.id ? { ...it, fixedOrder: val } : it))
                                );
                              }}
                            />
                            <span style={{ fontSize: 11, color: "#64748b" }}>/ord</span>
                          </div>
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 700 }}>
                          {formatCurrencyAmount(effectivePerMt, shipment.currency)}
                        </td>
                        <td>
                          <select
                            className="calc-input-compact"
                            value={item.stage}
                            onChange={(e) => {
                              const val = e.target.value as any;
                              setAdditionalCosts((prev) =>
                                prev.map((it) => (it.id === item.id ? { ...it, stage: val } : it))
                              );
                            }}
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
                        <td style={{ textAlign: "center" }}>
                          <button
                            type="button"
                            className="custom-cost-delete-btn"
                            onClick={() =>
                              setAdditionalCosts((prev) => prev.filter((it) => it.id !== item.id))
                            }
                            title="Hapus baris"
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
                    Perbandingan harga modal impas, rekomendasi harga jual target, dan perkiraan keuntungan bersih.
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
                    <th style={{ width: 100 }}>Lokasi Serah</th>
                    <th style={{ textAlign: "right" }}>Biaya Kirim / MT</th>
                    <th style={{ textAlign: "right" }}>Harga Modal Impas / MT</th>
                    <th style={{ textAlign: "right" }}>Harga Jual Target / MT</th>
                    <th style={{ textAlign: "right" }}>Total Nilai Pesanan</th>
                    <th style={{ textAlign: "right" }}>Keuntungan Bersih / MT</th>
                    <th style={{ textAlign: "center", width: 105 }}>Hasil Penawaran</th>
                    <th style={{ textAlign: "center", width: 125 }}>Kesesuaian Target</th>
                    <th style={{ textAlign: "center", width: 85 }}>Pilih</th>
                  </tr>
                </thead>
                <tbody>
                  {exportCalcResult.chain.map((row: IncotermChainRow) => {
                    const isActive = row.term === shipment.incoterm;

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
                          {formatCurrencyAmount(row.cumulativeCostPerMt, shipment.currency)}
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 600 }}>
                          {formatCurrencyAmount(row.breakEvenPricePerMt, shipment.currency)}
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 800, color: "#0369a1" }}>
                          {formatCurrencyAmount(row.targetPricePerMt, shipment.currency)}
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 700 }}>
                          {formatCurrencyAmount(row.totalTargetOrder, shipment.currency)}
                        </td>
                        <td style={{ textAlign: "right", color: "#059669", fontWeight: 600 }}>
                          +{formatCurrencyAmount(row.targetProfitPerMt, shipment.currency)}
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
                    • <b>Hasil Jadi (Yield {hppState.yieldPercent}%)</b>: 1 MT produk siap kirim butuh{" "}
                    <b>{exportCalcResult.rawMaterialPerMtOutput.toFixed(2)} MT</b> bahan mentah awal.<br />
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
