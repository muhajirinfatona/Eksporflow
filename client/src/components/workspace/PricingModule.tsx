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
import { formatNumber } from "@shared/format";
import { INCOTERM_TEMPLATES } from "@shared/costFactors";
import type { ScreenId } from "@shared/risk";
import type { Incoterm, LineItem, Shipment } from "@shared/shipment";
import {
  ArrowRightLeft,
  ArrowUpRight,
  BookOpen,
  Calculator,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  FileSpreadsheet,
  Info,
  Layers,
  Package,
  Plus,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  TrendingUp,
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
  pricing: any;
  navigate: (screen: ScreenId) => void;
  partners: PartnerEntry[];
  applyPartner: (partner: PartnerEntry) => void;
  effectiveApprovalStatus: ApprovalDecision;
}) {
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [targetConvertCurrency, setTargetConvertCurrency] = useState<string>("USD");
  const [showGuide, setShowGuide] = useState(true);

  // Kuantitas dalam satuan MT (Metric Ton) untuk perhitungan resmi
  const isKg = shipment.unit?.toLowerCase() === "kg";
  const quantityInMt = Math.max(
    0.01,
    isKg ? (shipment.quantity || 1) / 1000 : (shipment.quantity || 1)
  );

  // Target markup eksportir (%)
  const markupPercent = shipment.margin > 0 ? shipment.margin : 15;

  // Global buyer offer input per MT (untuk simulasi evaluasi untung/rugi)
  const [buyerOfferPerMt, setBuyerOfferPerMt] = useState<number>(
    shipment.unitPrice
      ? (isKg ? shipment.unitPrice * 1000 : shipment.unitPrice)
      : 1850
  );

  // State Bagian A: HPP Komoditas Siap Ekspor
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

  // Komponen HPP Kustom tambahan yang bisa diketik oleh pengguna
  const [customHppItems, setCustomHppItems] = useState<
    Array<{ id: string; name: string; costPerMt: number; note: string }>
  >([]);

  // State Bagian B: Biaya Tambahan Incoterms
  const [additionalCosts, setAdditionalCosts] = useState<AdditionalCostItem[]>(() => {
    const isIdr = shipment.currency === "IDR";
    if (isIdr) {
      return [
        {
          id: "fca-trucking",
          name: "Truk pengiriman ke pelabuhan muat (Inland Trucking POL)",
          perMt: 350000,
          fixedOrder: 2500000,
          stage: "FCA",
          description: "Truk fuso/trailer dari gudang pengolahan ke depo/pelabuhan muat.",
        },
        {
          id: "fca-customs",
          name: "Customs clearance ekspor (PEB & PPJK)",
          perMt: 0,
          fixedOrder: 1750000,
          stage: "FCA",
          description: "Pemberitahuan Ekspor Barang (PEB) Bea Cukai dan jasa PPJK.",
        },
        {
          id: "fca-docs",
          name: "Dokumen ekspor (COO, Phytosanitary, fumigasi ISPM-15)",
          perMt: 0,
          fixedOrder: 2200000,
          stage: "FCA",
          description: "Pengurusan sertifikat karantina, SKA/COO, dan sertifikat fumigasi.",
        },
        {
          id: "fob-terminal",
          name: "Terminal Handling Charge POL (THC Origin)",
          perMt: 120000,
          fixedOrder: 2500000,
          stage: "FOB",
          description: "Lift on/lift off, penumpukan kontainer di terminal pelabuhan muat.",
        },
        {
          id: "cfr-freight",
          name: "Ocean freight kapal kontainer internasional",
          perMt: 1250000,
          fixedOrder: 7500000,
          stage: "CFR",
          description: "Uang tambang kontainer laut dari POL Indonesia ke pelabuhan tujuan buyer.",
        },
        {
          id: "cif-insurance",
          name: "Asuransi pengangkutan laut (Marine Cargo Insurance)",
          perMt: 150000,
          fixedOrder: 1200000,
          stage: "CIF",
          description: "Premi perlindungan muatan risiko laut Institute Cargo Clauses (A).",
        },
        {
          id: "dap-lastmile",
          name: "Delivery inland tujuan ke alamat gudang buyer",
          perMt: 350000,
          fixedOrder: 3500000,
          stage: "DAP",
          description: "Truk pengantaran dari pelabuhan bongkar (POD) ke pintu gudang buyer.",
        },
        {
          id: "ddp-duty",
          name: "Bea masuk & pajak impor negara tujuan",
          perMt: 650000,
          fixedOrder: 0,
          stage: "DDP",
          description: "Import duty, VAT/GST negara tujuan yang ditanggung penjual (khusus DDP).",
        },
      ];
    }
    return defaultAdditionalCosts.map((item) => ({ ...item }));
  });

  // Kalkulasi Hasil Model Ekspor Berdasarkan Formula Resmi
  const exportCalcResult: ExportCalculatorResult = useMemo(() => {
    // Gabungkan HPP default dengan custom HPP
    const customHppTotalPerMt = customHppItems.reduce((sum, item) => sum + (Number(item.costPerMt) || 0), 0);
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
  }, [hppState, customHppItems, additionalCosts, quantityInMt, markupPercent, buyerOfferPerMt, shipment.currency]);

  // Baris aktif rantai Incoterm yang sedang dipilih
  const activeChainRow = useMemo(() => {
    const term = shipment.incoterm || "CIF";
    return exportCalcResult.chain.find((r) => r.term === term) || exportCalcResult.chain[0];
  }, [exportCalcResult.chain, shipment.incoterm]);

  // Sinkronisasi otomatis nilai unitPrice dan total penawaran ke transaksi ekspor
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

  // Rekomendasi negara buyer & Kurs Bank Indonesia
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

  // Dual Currency Conversion
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

  // Helper ganti parameter HPP
  const updateHppField = (key: keyof HppComponentInput, value: number) => {
    setHppState((prev) => ({ ...prev, [key]: value }));
  };

  // Helper tambah komponen HPP baru
  const handleAddCustomHpp = () => {
    const newItem = {
      id: "hpp-" + Date.now(),
      name: "Biaya Olah Tambahan",
      costPerMt: 0,
      note: "Komponen pengolahan produk ekspor",
    };
    setCustomHppItems((prev) => [...prev, newItem]);
    toast.success("Baris komponen HPP baru ditambahkan ke tabel");
  };

  // Helper tambah form isian biaya tambahan Incoterms
  const handleAddAdditionalCost = () => {
    const newItem: AdditionalCostItem = {
      id: "cost-" + Date.now(),
      name: "Biaya Dokumen / Penanganan Baru",
      perMt: 0,
      fixedOrder: 0,
      stage: shipment.incoterm === "EXW" ? "FCA" : (shipment.incoterm as any),
      description: "Biaya tambahan per tahap penyerahan",
    };
    setAdditionalCosts((prev) => [...prev, newItem]);
    toast.success("Form isian biaya tambahan baru ditambahkan ke tabel");
  };

  // Helper muat contoh kasus gula merah 20 MT
  const handleLoadGulaMerahExample = () => {
    update("product", "Gula Semut Kelapa Organik (Organic Coconut Sugar)");
    update("quantity", 20);
    update("unit", "ton");
    update("incoterm", "CIF");
    update("namedPlace", "Port of Gothenburg, Sweden");
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
    toast.success("Contoh Kasus Trader Gula Merah (20 MT CIF) Dimuat!", {
      description: "Rumus yield 90%, HPP olah, trucking POL, ocean freight, dan asuransi laut telah disinkronkan.",
    });
  };

  // Terapkan kurs Bank Indonesia
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
    toast.success(`${label} diterapkan: 1 ${activeBiRate.currency} = Rp ${formatNumber(rateVal, 2)}`);
  };

  return (
    <div className="tab-pane active pricing-screen">
      <div className="pricing-layout">
        <section className="pricing-main">
          <SectionTitle
            eyebrow="KALKULATOR HARGA EKSPOR & INDIKATOR INCOTERMS® 2020"
            title="Kalkulator Harga Ekspor | HPP → EXW → Incoterms"
            description="Perhitungan bertahap mulai dari beli bahan mentah di petani, susut mutu (yield), HPP olah & kemas, margin keuntungan gudang (EXW), dokumen & truk POL (FOB), ocean freight kapal (CFR), hingga asuransi laut (CIF)."
            action={
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  type="button"
                  className="section-factor-btn"
                  onClick={handleLoadGulaMerahExample}
                  title="Muat contoh kasus perhitungan trader ekspor gula merah 20 MT"
                >
                  <RotateCcw size={13} /> Muat Contoh Gula Merah (20 MT)
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
                )}
              </div>
            }
          />

          {/* PARAMETER TRANSAKSI & PERMINTAAN ORDER BUYER */}
          <div className="form-section">
            <div className="form-section-title">
              <span className="section-number">00</span>
              <div>
                <b>Parameter Transaksi &amp; Permintaan Buyer</b>
                <small>
                  Komoditas ekspor, volume order ({formatNumber(quantityInMt)} MT), Incoterm yang diminta ({shipment.incoterm}), mata uang, dan target markup.
                </small>
              </div>
            </div>

            <div className="form-grid four">
              <Field
                label="Produk ekspor"
                value={shipment.product}
                onChange={(value) => update("product", value)}
              />

              <Field
                label="Kuantitas order"
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
                label="Incoterm diminta buyer"
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
                label="Pelabuhan / Kota Tujuan (Named Place)"
                value={shipment.namedPlace}
                placeholder="Contoh: Port of Gothenburg, Sweden"
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
                label="Target Markup atas Biaya (%)"
                value={shipment.margin}
                type="number"
                suffix="%"
                step="0.5"
                onChange={(value) => updateNumber("margin", value)}
              />

              <Field
                label={`Harga Penawaran Buyer / MT (${shipment.currency})`}
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
                  <b>Kurs Acuan Resmi Bank Indonesia (BI)</b>
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

          {/* BAGIAN A: HPP PRODUK SIAP EKSPOR (PER MT PRODUK JADI) */}
          <div className="calc-sheet-card">
            <div className="calc-sheet-header">
              <div className="calc-sheet-title-group">
                <span className="calc-sheet-badge">BAGIAN A</span>
                <div className="calc-sheet-titles">
                  <h3>HPP PRODUK SIAP EKSPOR (per MT produk jadi)</h3>
                  <p>
                    Perhitungan HPP trader: beli gula mentah dari petani, kompensasi susut olah (Yield), upah masak/sortir, staffing gudang, kemasan ekspor &amp; uji lab.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="section-factor-btn"
                onClick={handleAddCustomHpp}
              >
                <Plus size={13} /> Tambah Komponen HPP
              </button>
            </div>

            <div className="calc-sheet-table-wrapper">
              <table className="calc-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>No</th>
                    <th>Komponen Pembentuk HPP</th>
                    <th style={{ width: 180 }}>Input Biaya &amp; Satuan</th>
                    <th style={{ width: 160, textAlign: "right" }}>Biaya / MT Jadi ({shipment.currency})</th>
                    <th style={{ width: 90, textAlign: "right" }}>% HPP</th>
                    <th>Keterangan &amp; Alur Rumus</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Row 1: Beli Gula Mentah & Yield */}
                  <tr>
                    <td style={{ textAlign: "center", fontWeight: 700 }}>1</td>
                    <td>
                      <strong>Beli gula mentah dari petani</strong>
                      <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                        Bahan baku komoditas sebelum spesifikasi ekspor
                      </div>
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
                          title="Harga beli bahan mentah dari petani per MT"
                        />
                        <span style={{ fontSize: 11.5, color: "#475569", whiteSpace: "nowrap" }}>
                          /MT bahan
                        </span>
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
                        <span style={{ fontSize: 11.5 }}>Yield:</span>
                        <input
                          type="number"
                          className="calc-input-compact"
                          style={{ width: 65 }}
                          value={hppState.yieldPercent}
                          onChange={(e) =>
                            updateHppField("yieldPercent", parseFloat(e.target.value) || 0)
                          }
                        />
                        <span style={{ fontSize: 11.5 }}>
                          % → butuh <b>{exportCalcResult.rawMaterialPerMtOutput.toFixed(3)} MT</b> bahan/MT jadi
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* Row 2: Angkut Pengumpulan Bahan */}
                  <tr>
                    <td style={{ textAlign: "center", fontWeight: 700 }}>2</td>
                    <td>
                      <strong>Angkut / pengumpulan bahan baku</strong>
                      <div style={{ fontSize: 11, color: "#64748b" }}>
                        Transport lokal dari kebun petani ke gudang olah
                      </div>
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
                        <span style={{ fontSize: 11.5, color: "#475569" }}>/MT bahan</span>
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
                    <td style={{ fontSize: 11.5, color: "#475569" }}>
                      Disesuaikan faktor yield ({hppState.yieldPercent}%) = biaya riil per MT output
                    </td>
                  </tr>

                  {/* Row 3: Biaya Pengolahan / Rework */}
                  <tr>
                    <td style={{ textAlign: "center", fontWeight: 700 }}>3</td>
                    <td>
                      <strong>Biaya pengolahan / rework gula</strong>
                      <div style={{ fontSize: 11, color: "#64748b" }}>
                        Sortir, masak, pencetakan, pengeringan kadar air
                      </div>
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
                        <span style={{ fontSize: 11.5, color: "#475569" }}>/MT jadi</span>
                      </div>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>
                      {formatCurrencyAmount(hppState.processingCostPerMt, shipment.currency)}
                    </td>
                    <td style={{ textAlign: "right", color: "#64748b" }}>
                      {exportCalcResult.hppBreakdownPercentages.processing.toFixed(1)}%
                    </td>
                    <td style={{ fontSize: 11.5, color: "#475569" }}>
                      Meningkatkan kualitas gula mentah agar lolos spesifikasi buyer
                    </td>
                  </tr>

                  {/* Row 4: Upah Karyawan Produksi */}
                  <tr>
                    <td style={{ textAlign: "center", fontWeight: 700 }}>4</td>
                    <td>
                      <strong>Upah karyawan produksi &amp; packing</strong>
                      <div style={{ fontSize: 11, color: "#64748b" }}>
                        Tenaga kerja langsung proses olah dan pengemasan
                      </div>
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
                        <span style={{ fontSize: 11.5, color: "#475569" }}>/MT jadi</span>
                      </div>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>
                      {formatCurrencyAmount(hppState.laborCostPerMt, shipment.currency)}
                    </td>
                    <td style={{ textAlign: "right", color: "#64748b" }}>
                      {exportCalcResult.hppBreakdownPercentages.labor.toFixed(1)}%
                    </td>
                    <td style={{ fontSize: 11.5, color: "#475569" }}>
                      Upah borongan / harian tenaga pengolahan
                    </td>
                  </tr>

                  {/* Row 5: Staffing & Overhead Operasional */}
                  <tr>
                    <td style={{ textAlign: "center", fontWeight: 700 }}>5</td>
                    <td>
                      <strong>Staffing &amp; overhead operasional</strong>
                      <div style={{ fontSize: 11, color: "#64748b" }}>
                        Gaji staf, sewa gudang, listrik, utilitas pabrik
                      </div>
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
                        <span style={{ fontSize: 11.5, color: "#475569" }}>/MT jadi</span>
                      </div>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>
                      {formatCurrencyAmount(hppState.overheadCostPerMt, shipment.currency)}
                    </td>
                    <td style={{ textAlign: "right", color: "#64748b" }}>
                      {exportCalcResult.hppBreakdownPercentages.overhead.toFixed(1)}%
                    </td>
                    <td style={{ fontSize: 11.5, color: "#475569" }}>
                      Biaya operasional gudang selama penyiapan lot ekspor
                    </td>
                  </tr>

                  {/* Row 6: Kemasan Ekspor */}
                  <tr>
                    <td style={{ textAlign: "center", fontWeight: 700 }}>6</td>
                    <td>
                      <strong>Kemasan ekspor (Inner &amp; Master bag)</strong>
                      <div style={{ fontSize: 11, color: "#64748b" }}>
                        Karung food-grade / karton box master ekspor
                      </div>
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
                        <span style={{ fontSize: 11.5, color: "#475569" }}>/MT jadi</span>
                      </div>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>
                      {formatCurrencyAmount(hppState.packagingCostPerMt, shipment.currency)}
                    </td>
                    <td style={{ textAlign: "right", color: "#64748b" }}>
                      {exportCalcResult.hppBreakdownPercentages.packaging.toFixed(1)}%
                    </td>
                    <td style={{ fontSize: 11.5, color: "#475569" }}>
                      Masuk HPP produk (bukan biaya pelabuhan FOB)
                    </td>
                  </tr>

                  {/* Row 7: Label Kemasan & Barcode */}
                  <tr>
                    <td style={{ textAlign: "center", fontWeight: 700 }}>7</td>
                    <td>
                      <strong>Label &amp; desain kemasan</strong>
                      <div style={{ fontSize: 11, color: "#64748b" }}>
                        Stiker bahasa buyer, barcode, cetak label batch
                      </div>
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
                        <span style={{ fontSize: 11.5, color: "#475569" }}>/MT jadi</span>
                      </div>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>
                      {formatCurrencyAmount(hppState.labelCostPerMt, shipment.currency)}
                    </td>
                    <td style={{ textAlign: "right", color: "#64748b" }}>
                      {exportCalcResult.hppBreakdownPercentages.label.toFixed(1)}%
                    </td>
                    <td style={{ fontSize: 11.5, color: "#475569" }}>
                      Labeling sesuai regulasi negara tujuan
                    </td>
                  </tr>

                  {/* Row 8: QC, Uji Lab & Sertifikasi Mutu */}
                  <tr>
                    <td style={{ textAlign: "center", fontWeight: 700 }}>8</td>
                    <td>
                      <strong>QC, uji laboratorium &amp; sertifikasi</strong>
                      <div style={{ fontSize: 11, color: "#64748b" }}>
                        Uji mutu kadar air, aflatoksin, residu (COA SGS/Intertek)
                      </div>
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
                        <span style={{ fontSize: 11.5, color: "#475569" }}>/MT jadi</span>
                      </div>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>
                      {formatCurrencyAmount(hppState.qcLabCostPerMt, shipment.currency)}
                    </td>
                    <td style={{ textAlign: "right", color: "#64748b" }}>
                      {exportCalcResult.hppBreakdownPercentages.qcLab.toFixed(1)}%
                    </td>
                    <td style={{ fontSize: 11.5, color: "#475569" }}>
                      Pengujian laboratorium independen untuk sertifikat analisa
                    </td>
                  </tr>

                  {/* Row 9: Biaya Tetap Persiapan Order */}
                  <tr>
                    <td style={{ textAlign: "center", fontWeight: 700 }}>9</td>
                    <td>
                      <strong>Biaya tetap persiapan order (Fixed)</strong>
                      <div style={{ fontSize: 11, color: "#64748b" }}>
                        Setup cetakan, kalibrasi timbangan per batch pesanan
                      </div>
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
                        <span style={{ fontSize: 11.5, color: "#475569" }}>/order</span>
                      </div>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>
                      {formatCurrencyAmount(exportCalcResult.fixedPrepCostPerMt, shipment.currency)}
                    </td>
                    <td style={{ textAlign: "right", color: "#64748b" }}>
                      {exportCalcResult.hppBreakdownPercentages.fixedPrep.toFixed(1)}%
                    </td>
                    <td style={{ fontSize: 11.5, color: "#475569" }}>
                      Dibagi volume order {formatNumber(quantityInMt)} MT = {formatCurrencyAmount(exportCalcResult.fixedPrepCostPerMt, shipment.currency)}/MT
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
                          <span style={{ fontSize: 11.5, color: "#475569" }}>/MT</span>
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
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <input
                            type="text"
                            className="calc-input-compact"
                            value={customItem.note}
                            placeholder="Catatan..."
                            onChange={(e) => {
                              const val = e.target.value;
                              setCustomHppItems((prev) =>
                                prev.map((it) => (it.id === customItem.id ? { ...it, note: val } : it))
                              );
                            }}
                          />
                          <button
                            type="button"
                            className="custom-cost-delete-btn"
                            style={{ marginLeft: 6 }}
                            onClick={() =>
                              setCustomHppItems((prev) => prev.filter((it) => it.id !== customItem.id))
                            }
                            title="Hapus baris ini"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {/* Summary Row: Total HPP */}
                  <tr className="calc-row-total">
                    <td colSpan={3} style={{ textAlign: "right", paddingRight: 16 }}>
                      TOTAL HPP PRODUK SIAP EKSPOR (Basis {formatNumber(quantityInMt)} MT):
                    </td>
                    <td style={{ textAlign: "right", fontSize: 14 }}>
                      {formatCurrencyAmount(exportCalcResult.totalHppPerMt, shipment.currency)} / MT
                    </td>
                    <td style={{ textAlign: "right" }}>100.0%</td>
                    <td>
                      Total Order: <b>{formatCurrencyAmount(exportCalcResult.totalHppOrder, shipment.currency)}</b> (ekuivalen {formatCurrencyAmount(exportCalcResult.totalHppPerMt / 1000, shipment.currency)}/kg)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* BAGIAN B: BIAYA TAMBAHAN PER INCOTERM (DI LUAR HPP) */}
          <div className="calc-sheet-card">
            <div className="calc-sheet-header">
              <div className="calc-sheet-title-group">
                <span className="calc-sheet-badge accent">BAGIAN B</span>
                <div className="calc-sheet-titles">
                  <h3>BIAYA TAMBAHAN PER INCOTERM (di luar HPP)</h3>
                  <p>
                    Biaya operasional ekspor per tahap: trucking depo (FCA), terminal &amp; PEB (FOB), ocean freight (CFR), asuransi laut (CIF), dan pengantaran alamat (DAP/DDP).
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="section-factor-btn"
                onClick={handleAddAdditionalCost}
              >
                <Plus size={13} /> Tambah Form Isian Biaya
              </button>
            </div>

            <div className="calc-sheet-table-wrapper">
              <table className="calc-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>No</th>
                    <th>Komponen Biaya Tambahan</th>
                    <th style={{ width: 140 }}>Biaya / MT (Variabel)</th>
                    <th style={{ width: 150 }}>Biaya Tetap / Order (Fixed)</th>
                    <th style={{ width: 160, textAlign: "right" }}>Biaya Efektif / MT</th>
                    <th style={{ width: 110 }}>Tahap Utama</th>
                    <th>Keterangan / Alokasi Dokumen</th>
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
                        <td>
                          <input
                            type="text"
                            className="calc-input-compact"
                            value={item.description}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAdditionalCosts((prev) =>
                                prev.map((it) => (it.id === item.id ? { ...it, description: val } : it))
                              );
                            }}
                          />
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            type="button"
                            className="custom-cost-delete-btn"
                            onClick={() =>
                              setAdditionalCosts((prev) => prev.filter((it) => it.id !== item.id))
                            }
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

          {/* BAGIAN C: RANTAI HARGA & INDIKATOR PROFITABILITAS */}
          <div className="calc-sheet-card">
            <div className="calc-sheet-header">
              <div className="calc-sheet-title-group">
                <span className="calc-sheet-badge" style={{ background: "#059669" }}>
                  BAGIAN C
                </span>
                <div className="calc-sheet-titles">
                  <h3>RANTAI HARGA &amp; INDIKATOR PROFITABILITAS (Incoterms® 2020)</h3>
                  <p>
                    Evaluasi titik impas (Break-even), harga target dengan markup {markupPercent}%, serta indikator untung/rugi terhadap penawaran buyer ({formatCurrencyAmount(buyerOfferPerMt, shipment.currency)}/MT).
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#64748b" }}>Incoterm Aktif:</span>
                <StatusPill tone="amber">{shipment.incoterm || "CIF"}</StatusPill>
              </div>
            </div>

            <div className="calc-sheet-table-wrapper">
              <table className="calc-table">
                <thead>
                  <tr>
                    <th style={{ width: 70 }}>Term</th>
                    <th style={{ width: 110 }}>Kelompok</th>
                    <th style={{ textAlign: "right" }}>Biaya Tambahan Kumulatif / MT</th>
                    <th style={{ textAlign: "right" }}>Harga Impas / MT (Break-Even)</th>
                    <th style={{ textAlign: "right" }}>Harga Target / MT (+{markupPercent}%)</th>
                    <th style={{ textAlign: "right" }}>Total Target Order</th>
                    <th style={{ textAlign: "right" }}>Laba Target / MT</th>
                    <th style={{ textAlign: "right", width: 130 }}>Penawaran Buyer / MT</th>
                    <th style={{ textAlign: "center", width: 100 }}>Indikator Impas</th>
                    <th style={{ textAlign: "center", width: 130 }}>Status Target</th>
                    <th style={{ textAlign: "center", width: 110 }}>Aksi</th>
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
                        <td style={{ textAlign: "right" }}>
                          <input
                            type="number"
                            className="calc-input-compact"
                            style={{ textAlign: "right", fontWeight: 700 }}
                            value={buyerOfferPerMt}
                            onChange={(e) => setBuyerOfferPerMt(parseFloat(e.target.value) || 0)}
                          />
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
                              style={{ padding: "4px 8px", fontSize: 11 }}
                              onClick={() => {
                                update("incoterm", row.term as Incoterm);
                                toast.success(`Incoterm disetel ke ${row.term}`, {
                                  description: `Penawaran otomatis disesuaikan ke ${formatCurrencyAmount(
                                    row.totalTargetOrder,
                                    shipment.currency
                                  )}.`,
                                });
                              }}
                            >
                              Pilih {row.term}
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

          {/* PANDUAN MODEL HARGA EKSPOR GULA MERAH & RUMUS INCOTERMS */}
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
                <BookOpen size={16} color="#0284c7" />
                <strong style={{ fontSize: 13, color: "#0f172a" }}>
                  Panduan Rumus Kalkulator Ekspor &amp; Indikator Profitabilitas
                </strong>
              </div>
              <button type="button" className="ghost-button" style={{ padding: "2px 8px", fontSize: 11 }}>
                {showGuide ? <ChevronUp size={14} /> : <ChevronDown size={14} />} {showGuide ? "Tutup" : "Buka"} Panduan
              </button>
            </div>

            {showGuide && (
              <div className="calc-guide-grid">
                <div style={{ background: "#ffffff", padding: 12, borderRadius: 6, border: "1px solid #e2e8f0" }}>
                  <b style={{ color: "#0284c7", fontSize: 12 }}>1. Alur Harga Ekspor Berjenjang:</b>
                  <p style={{ fontSize: 11.5, color: "#475569", margin: "4px 0 0" }}>
                    • <b>HPP</b>: Beli gula dari petani + Susut (Yield) + Olah/Rework + Upah + Staffing + Kemasan inner/master + Uji Lab.<br />
                    • <b>EXW</b>: Total HPP + Target Markup Keuntungan (Harga Gudang).<br />
                    • <b>FOB</b>: EXW + Inland Trucking ke POL + Origin THC + Customs PEB &amp; Fumigasi.<br />
                    • <b>CFR</b>: FOB + Ocean Freight Kapal Kontainer Internasional ke Pelabuhan Tujuan.<br />
                    • <b>CIF</b>: CFR + Asuransi Marine Cargo (Perlindungan risiko laut hingga pelabuhan tujuan).<br />
                    • <b>DAP/DDP</b>: CIF + THC POD pelabuhan tujuan + Truk last-mile (+ Pajak impor khusus DDP).
                  </p>
                </div>

                <div style={{ background: "#ffffff", padding: 12, borderRadius: 6, border: "1px solid #e2e8f0" }}>
                  <b style={{ color: "#059669", fontSize: 12 }}>2. Konsep Yield &amp; Markup atas Biaya:</b>
                  <p style={{ fontSize: 11.5, color: "#475569", margin: "4px 0 0" }}>
                    • <b>Yield {hppState.yieldPercent}%</b>: Setiap 1 MT gula siap ekspor butuh{" "}
                    <b>{exportCalcResult.rawMaterialPerMtOutput.toFixed(3)} MT</b> bahan mentah petani. Harga beli dan angkut lokal otomatis dikonversikan.<br />
                    • <b>Markup atas Biaya</b>: Harga Target = Harga Impas × (1 + Markup {markupPercent}%). Laba target terhitung pasti di atas seluruh pengeluaran.<br />
                    • <b>Indikator Profitabilitas</b>: Membandingkan langsung penawaran buyer dengan titik impas dan harga target agar eksportir tidak terjebak rugi di laut.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ASIDE OFFER PREVIEW DENGAN TAMPILAN TOTAL PENAWARAN & DUAL CURRENCY */}
        <aside className="pricing-aside">
          <div className="quote-card">
            <div className="quote-top">
              <span className="eyebrow light">OFFER PREVIEW</span>
              <StatusPill tone="amber">{shipment.incoterm || "CIF"}</StatusPill>
            </div>

            <span className="quote-label">TOTAL PENAWARAN UTAMA ({shipment.incoterm})</span>
            <strong>{formatCurrencyAmount(activeChainRow.totalTargetOrder, shipment.currency)}</strong>

            {/* DUAL CURRENCY CONVERSION PREVIEW */}
            <div className="quote-dual-box">
              <div className="quote-dual-header">
                <span className="quote-dual-title">Konversi Valas Acuan:</span>
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
                ≈ {formatCurrencyAmount(convertedTotalOffer, activeDualCurrency)}
              </div>
              <div className="quote-dual-rate-info">
                <span>
                  Kurs BI: 1 {activeBiRate.currency} = Rp {formatNumber(currentFxRate, 2)}
                </span>
              </div>
            </div>

            {/* RINCIAN KOMPONEN TOTAL TRANSAKSI */}
            <div className="quote-factor-summary-box">
              <div className="quote-factor-header">
                <span className="quote-factor-title">
                  <Layers size={13} /> Rincian Nilai Penawaran ({shipment.incoterm})
                </span>
              </div>

              <div className="quote-factor-breakdown">
                <div className="factor-row">
                  <span>1. Total HPP Produk Siap Ekspor:</span>
                  <b>{formatCurrencyAmount(exportCalcResult.totalHppOrder, shipment.currency)}</b>
                </div>

                <div className="factor-row">
                  <span>2. Target Laba Bersih (+{markupPercent}%):</span>
                  <b className="mint-text">
                    +{formatCurrencyAmount(activeChainRow.totalTargetProfitOrder, shipment.currency)}
                  </b>
                </div>

                {activeChainRow.cumulativeCostPerMt > 0 && (
                  <div className="factor-row">
                    <span>3. Biaya Tambahan {shipment.incoterm}:</span>
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
                <span>Ekuivalen per {shipment.unit || "ton"}:</span>
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
                    description: `Nilai penawaran ${shipment.incoterm} telah disinkronkan ke dokumen ekspor.`,
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
            <span>Formula: Kalkulator Resmi ICC Incoterms® 2020</span>
            <span>
              Kurs: {shipment.exchangeRateSource || "Bank Indonesia"} · {shipment.exchangeRateDate || "Realtime"}
            </span>
          </div>

          <div className="tip-card">
            <Sparkles size={17} />
            <div>
              <b>Kompensasi Fluktuasi Valas &amp; Risiko</b>
              <p>
                {shipment.currency === "IDR"
                  ? "Transaksi dihitung dalam Rupiah. Buyer luar negeri biasanya menerima penawaran dalam USD atau EUR dengan acuan kurs jual Bank Indonesia."
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
                <h4>Konfirmasi Konversi Mata Uang Transaksi</h4>
                <p>
                  Ubah transaksi dari <b>{shipment.currency}</b> ke <b>{targetConvertCurrency}</b>
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
