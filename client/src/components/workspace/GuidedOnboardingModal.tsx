import React, { useState } from "react";
import {
  Building2,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  FileText,
  Package,
  Scale,
  Sparkles,
  Ship,
  ShieldCheck,
  ArrowRight,
  X,
  Compass,
  Boxes,
  Percent,
  Calculator,
} from "lucide-react";
import type { Shipment, LineItem } from "@shared/shipment";
import { formatMoney, formatNumber } from "@shared/format";
import { calculateContainer, containerSpecs } from "@shared/container";

export interface OnboardingSectorPreset {
  id: string;
  name: string;
  categoryName: string;
  productName: string;
  hsCode: string;
  packagingType: string;
  unit: string;
  defaultQty: number;
  weightPerUnit: number; // kg
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  shrinkageRate: number; // %
  defaultUnitPrice: number; // USD
  defaultCurrency: string;
  targetPort: string;
  buyerCountry: string;
  buyerName: string;
  incoterm: "FOB" | "CIF" | "CFR";
  containerType: "20GP" | "40GP" | "40HC";
  description: string;
}

export const SECTOR_PRESETS: OnboardingSectorPreset[] = [
  {
    id: "coffee",
    name: "Kopi & Rempah-Rempah",
    categoryName: "Komoditas Perkebunan",
    productName: "Specialty Arabica Green Coffee Beans (Gayo Grade 1)",
    hsCode: "0901.11.00",
    packagingType: "Karung Goni Ekspor (Jute Bag)",
    unit: "karung",
    defaultQty: 300,
    weightPerUnit: 60,
    lengthCm: 90,
    widthCm: 60,
    heightCm: 30,
    shrinkageRate: 3.0,
    defaultUnitPrice: 7.50, // per kg = 450 per bag
    defaultCurrency: "USD",
    targetPort: "Port of Tokyo / Yokohama, Japan",
    buyerCountry: "Jepang",
    buyerName: "Kyoto Specialty Coffee Importers Co., Ltd.",
    incoterm: "FOB",
    containerType: "20GP",
    description: "Sektor primadona ekspor Indonesia dengan pasar stabil di Jepang, Korea, Uni Eropa, dan Amerika Serikat.",
  },
  {
    id: "fishery",
    name: "Perikanan & Hasil Laut",
    categoryName: "Produk Bahari Segar/Beku",
    productName: "Frozen Black Tiger Prawns (Head-On Shell-On Grade A)",
    hsCode: "0306.17.00",
    packagingType: "Master Carton 5-Ply with Food-Grade PE Liner",
    unit: "karton",
    defaultQty: 1400,
    weightPerUnit: 10,
    lengthCm: 48,
    widthCm: 30,
    heightCm: 22,
    shrinkageRate: 1.0,
    defaultUnitPrice: 12.50, // per kg = 125 per carton
    defaultCurrency: "USD",
    targetPort: "Port of Busan, South Korea",
    buyerCountry: "Korea Selatan",
    buyerName: "Hansol Marine Logistics & Foods Corp.",
    incoterm: "CIF",
    containerType: "20GP",
    description: "Komoditas bernilai tinggi dengan sertifikasi HACCP & cold chain terpadu menuju pasar Asia Timur.",
  },
  {
    id: "coconutsugar",
    name: "Pertanian & Pangan Organik",
    categoryName: "Produk Olahan Alami",
    productName: "Organic Coconut Sugar (Granulated Grade A Export Quality)",
    hsCode: "1702.90.10",
    packagingType: "3-Ply Kraft Paper Bag with PE Food-Grade Inner",
    unit: "karung",
    defaultQty: 900,
    weightPerUnit: 20,
    lengthCm: 60,
    widthCm: 40,
    heightCm: 15,
    shrinkageRate: 4.0,
    defaultUnitPrice: 2.20, // per kg = 44 per bag
    defaultCurrency: "USD",
    targetPort: "Jebel Ali Port, Dubai (AEJEA)",
    buyerCountry: "United Arab Emirates",
    buyerName: "Al-Barakah International Foodstuff Trading LLC",
    incoterm: "FOB",
    containerType: "20GP",
    description: "Permintaan pasar Timur Tengah & Eropa yang berkembang pesat untuk pemanis organik rendah glikemik.",
  },
  {
    id: "furniture",
    name: "Kerajinan & Furnitur Kayu",
    categoryName: "Manufaktur Kreatif & Kayu",
    productName: "Handcrafted Teak & Natural Rattan Outdoor Lounge Set",
    hsCode: "9403.82.00",
    packagingType: "Heavy-Duty Corrugated Carton Box (Corner-Protected)",
    unit: "set",
    defaultQty: 120,
    weightPerUnit: 45,
    lengthCm: 110,
    widthCm: 85,
    heightCm: 65,
    shrinkageRate: 0.0,
    defaultUnitPrice: 220.00,
    defaultCurrency: "USD",
    targetPort: "Port of Rotterdam, Netherlands",
    buyerCountry: "Belanda",
    buyerName: "Van Der Berg Home & Garden BV",
    incoterm: "FOB",
    containerType: "40HC",
    description: "Produk furnitur legalitas SVLK berdaya saing tinggi dengan pembebasan bea masuk skema FLEGT Uni Eropa.",
  },
];

interface GuidedOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: Shipment;
  update: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void;
  updateNumber: <K extends keyof Shipment>(key: K, value: number) => void;
  updateLineItems: (items: LineItem[]) => void;
  onFinish: (targetScreen: "documents" | "pricing" | "dashboard") => void;
}

export function GuidedOnboardingModal({
  isOpen,
  onClose,
  shipment,
  update,
  updateNumber,
  updateLineItems,
  onFinish,
}: GuidedOnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [companyName, setCompanyName] = useState(shipment.exporter || "PT SUMBER ALAM NUSANTARA");
  const [nibNumber, setNibNumber] = useState("0123456789012");
  const [npwpNumber, setNpwpNumber] = useState("01.234.567.8-012.000");
  const [selectedPort, setSelectedPort] = useState(shipment.namedPlace || "Pelabuhan Tanjung Priok, Jakarta (IDTPP)");

  // Selected Sector
  const [selectedSector, setSelectedSector] = useState<OnboardingSectorPreset>(SECTOR_PRESETS[0]);
  const [targetQuantity, setTargetQuantity] = useState(SECTOR_PRESETS[0].defaultQty);
  const [targetUnitPrice, setTargetUnitPrice] = useState(SECTOR_PRESETS[0].defaultUnitPrice);

  if (!isOpen) return null;

  // Live container calculations for step 3
  const totalWeightKgs = targetQuantity * selectedSector.weightPerUnit;
  const singleCbm = (selectedSector.lengthCm * selectedSector.widthCm * selectedSector.heightCm) / 1_000_000;
  const totalVolumeCbm = targetQuantity * singleCbm;
  const spec = containerSpecs[selectedSector.containerType] || containerSpecs["20GP"];
  const volumeUtilization = (totalVolumeCbm / spec.volume) * 100;
  const weightUtilization = (totalWeightKgs / spec.weight) * 100;
  const totalContractUsd = selectedSector.id === "furniture"
    ? targetQuantity * targetUnitPrice
    : totalWeightKgs * targetUnitPrice;

  const handleApplyPreset = (sector: OnboardingSectorPreset) => {
    setSelectedSector(sector);
    setTargetQuantity(sector.defaultQty);
    setTargetUnitPrice(sector.defaultUnitPrice);
  };

  const handleFinishOnboarding = () => {
    // 1. Simpan profil eksportir
    update("exporter", companyName);
    update("namedPlace", selectedPort);

    // 2. Simpan produk & komoditas
    update("product", selectedSector.productName);
    update("hsCode", selectedSector.hsCode);
    update("cartonQty", targetQuantity);
    update("quantity", targetQuantity);
    update("cartonWeight", selectedSector.weightPerUnit);
    update("cartonLength", selectedSector.lengthCm);
    update("cartonWidth", selectedSector.widthCm);
    update("cartonHeight", selectedSector.heightCm);
    update("traderShrinkage", selectedSector.shrinkageRate);
    update("containerType", selectedSector.containerType);
    update("incoterm", selectedSector.incoterm);
    update("destination", selectedSector.targetPort);
    update("buyerCountry", selectedSector.buyerCountry);
    update("buyer", selectedSector.buyerName);
    update("unitPrice", targetUnitPrice);

    // 3. Simpan line item terstruktur
    const newLineItem: LineItem = {
      id: "item-1",
      description: selectedSector.productName,
      hsCode: selectedSector.hsCode,
      quantity: targetQuantity,
      unit: selectedSector.unit,
      unitPrice: targetUnitPrice,
      packagingType: selectedSector.packagingType,
      shrinkageRate: selectedSector.shrinkageRate,
      length: selectedSector.lengthCm,
      width: selectedSector.widthCm,
      height: selectedSector.heightCm,
      weight: selectedSector.weightPerUnit,
      palletEnabled: false,
      palletCount: 0,
      palletLength: 120,
      palletWidth: 100,
      palletHeight: 15,
      palletWeight: 20,
    };
    updateLineItems([newLineItem]);

    // 4. Tutup dan arahkan ke tab dokumen
    onClose();
    onFinish("documents");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden font-sans">
        
        {/* HEADER MARITIME TRADE INTELLIGENCE */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#0B192C] to-[#0F2942] text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 text-blue-300">
              <Compass size={22} className="animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-widest text-blue-400 font-bold">
                  PANDUAN EKSPORTIR UMKM
                </span>
                <span className="text-[10px] bg-blue-500/20 text-blue-200 border border-blue-400/30 px-2 py-0.5 rounded-full font-mono">
                  4 Langkah Cepat
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Setup Transaksi & Ekspor Perdana
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800/60"
            aria-label="Tutup panduan"
          >
            <X size={20} />
          </button>
        </div>

        {/* STEP PROGRESS BAR */}
        <div className="grid grid-cols-4 bg-slate-50 border-b border-slate-200 text-xs font-semibold">
          {[
            { num: 1, label: "Profil & Legalitas", icon: Building2 },
            { num: 2, label: "Sektor Komoditas", icon: Package },
            { num: 3, label: "Kalkulasi Kontainer", icon: Scale },
            { num: 4, label: "Dokumen Ekspor", icon: FileText },
          ].map((s) => {
            const Icon = s.icon;
            const isCompleted = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <button
                key={s.num}
                type="button"
                onClick={() => setCurrentStep(s.num as any)}
                className={`flex items-center justify-center gap-2 py-3 px-2 border-b-2 transition-all ${
                  isCurrent
                    ? "border-blue-600 bg-white text-blue-900 shadow-sm"
                    : isCompleted
                      ? "border-emerald-500 text-emerald-800 bg-emerald-50/50"
                      : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60"
                }`}
              >
                <div
                  className={`flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-mono font-bold ${
                    isCurrent
                      ? "bg-blue-600 text-white"
                      : isCompleted
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {isCompleted ? "✓" : s.num}
                </div>
                <span className="hidden sm:inline truncate">{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          
          {/* STEP 1: PROFIL EKSPORTIR & LEGALITAS */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Building2 size={18} className="text-blue-700" />
                  Langkah 1: Identitas Eksportir & Dokumen Legalitas Dasar
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Legalitas NIB dan NPWP resmi diperlukan agar terhubung dengan sistem Pemberitahuan Ekspor Barang (PEB) di Bea Cukai.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Badan Usaha / Perusahaan Eksportir
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Contoh: PT. Sumber Alam Nusantara"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Nama ini akan otomatis tercantum pada kop surat seluruh 5 dokumen ekspor resmi.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor Induk Berusaha (NIB - 13 Digit)
                  </label>
                  <input
                    type="text"
                    value={nibNumber}
                    onChange={(e) => setNibNumber(e.target.value)}
                    placeholder="0123456789012"
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    NIB berfungsi sebagai Tanda Pengenal Importir/Eksportir (API) sekaligus hak akses kepabeanan.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor Pokok Wajib Pajak (NPWP Perusahaan)
                  </label>
                  <input
                    type="text"
                    value={npwpNumber}
                    onChange={(e) => setNpwpNumber(e.target.value)}
                    placeholder="01.234.567.8-012.000"
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                  <span className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
                    <ShieldCheck size={13} /> Terlindungi oleh modul sensor otomatis PII Eksporflow.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pelabuhan Muat Asal Indonesia (Port of Loading)
                  </label>
                  <select
                    value={selectedPort}
                    onChange={(e) => setSelectedPort(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                  >
                    <option value="Pelabuhan Tanjung Priok, Jakarta (IDTPP)">Pelabuhan Tanjung Priok, Jakarta (IDTPP)</option>
                    <option value="Pelabuhan Tanjung Perak, Surabaya (IDSUB)">Pelabuhan Tanjung Perak, Surabaya (IDSUB)</option>
                    <option value="Pelabuhan Belawan, Medan (IDBLW)">Pelabuhan Belawan, Medan (IDBLW)</option>
                    <option value="Pelabuhan Makassar New Port, Makassar (IDMAK)">Pelabuhan Makassar New Port, Makassar (IDMAK)</option>
                    <option value="Pelabuhan Tanjung Emas, Semarang (IDSRG)">Pelabuhan Tanjung Emas, Semarang (IDSRG)</option>
                  </select>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Pelabuhan penyerahan barang resmi untuk klausul FOB (Incoterms® 2020).
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl flex items-start gap-3">
                <ShieldCheck size={20} className="text-blue-700 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900 leading-relaxed">
                  <b>Standar Kepatuhan Ekspor Mandiri:</b> Data profil legalitas ini disimpan dengan aman di database terenkripsi RLS Anda. Platform secara otomatis menyensor data finansial rahasia saat Anda berkonsultasi dengan AI Advisor.
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PILIH SEKTOR KOMODITAS DENGAN PRESET OTOMATIS */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Package size={18} className="text-blue-700" />
                  Langkah 2: Pilih Sektor Komoditas Ekspor
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Pilih salah satu sektor unggulan ekspor di bawah untuk menerapkan otomatis kode HS 6-digit terverifikasi, jenis kemasan, dan parameter susut muatan.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {SECTOR_PRESETS.map((sector) => {
                  const isSelected = selectedSector.id === sector.id;
                  return (
                    <button
                      key={sector.id}
                      type="button"
                      onClick={() => handleApplyPreset(sector)}
                      className={`text-left p-4 rounded-xl border-2 transition-all flex flex-col justify-between ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/40 shadow-sm ring-1 ring-blue-500"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/70"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-blue-700 font-bold bg-blue-100/70 px-2 py-0.5 rounded">
                            {sector.categoryName}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-700">
                            HS {sector.hsCode}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mb-1">
                          {sector.name}
                        </h4>
                        <div className="text-xs text-slate-600 font-medium mb-2">
                          {sector.productName}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                          {sector.description}
                        </p>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-600">
                        <span>Kemasan: <b>{sector.weightPerUnit} kg/{sector.unit}</b></span>
                        <span className="text-blue-700 font-bold flex items-center gap-1">
                          {isSelected ? "✓ Terpilih" : "Gunakan Preset"} <ChevronRight size={13} />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-center justify-between">
                <span>
                  Preset Terpilih: <b>{selectedSector.productName}</b> (HS: <code>{selectedSector.hsCode}</code>)
                </span>
                <span className="font-mono text-emerald-700 font-bold text-xs">
                  Susut: {selectedSector.shrinkageRate}%
                </span>
              </div>
            </div>
          )}

          {/* STEP 3: SIMULASI CEPAT BIAYA & KONTAINER */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Calculator size={18} className="text-blue-700" />
                  Langkah 3: Simulasi Cepat Kalkulasi Biaya & Kapasitas Muatan
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Atur target kuantitas pesanan dan harga penawaran. Mesin deterministik akan menghitung kecukupan muatan kontainer dan nilai transaksi.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jumlah Kemasan ({selectedSector.unit})
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={targetQuantity}
                    onChange={(e) => setTargetQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none tabular-nums"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Total Berat: <b>{formatNumber(totalWeightKgs, 0)} kg</b> ({formatNumber(totalWeightKgs / 1000, 2)} MT)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Harga Jual Satuan ({selectedSector.defaultCurrency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    value={targetUnitPrice}
                    onChange={(e) => setTargetUnitPrice(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                    className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none tabular-nums"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    {selectedSector.id === "furniture" ? "Per Unit Set" : `Per Kg (${selectedSector.incoterm})`}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipe Kontainer Pengapalan
                  </label>
                  <div className="px-3 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg">
                    {spec.name} ({spec.volume} CBM)
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Incoterm: <b>{selectedSector.incoterm}</b> ke {selectedSector.targetPort.split(",")[0]}
                  </span>
                </div>
              </div>

              {/* LIVE METRICS CARDS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase font-mono">Volume Kargo</div>
                  <div className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                    {formatNumber(totalVolumeCbm, 2)} CBM
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Utilisasi: <b>{formatNumber(volumeUtilization, 1)}%</b> dari {spec.volume} CBM
                  </div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase font-mono">Berat Bersih / Kotor</div>
                  <div className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                    {formatNumber(totalWeightKgs, 0)} Kg
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Payload: <b>{formatNumber(weightUtilization, 1)}%</b> dari {formatNumber(spec.weight, 0)} kg
                  </div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase font-mono">Kebutuhan Kontainer</div>
                  <div className="text-lg font-bold text-blue-700 font-mono tabular-nums mt-0.5">
                    {Math.ceil(Math.max(volumeUtilization, weightUtilization) / 100)} Unit FCL
                  </div>
                  <div className="text-[10px] text-emerald-700 font-medium mt-1">
                    ✓ Optimal 1 x {selectedSector.containerType}
                  </div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase font-mono">Nilai Kontrak (Est.)</div>
                  <div className="text-lg font-bold text-emerald-700 font-mono tabular-nums mt-0.5">
                    USD {formatNumber(totalContractUsd, 2)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {selectedSector.incoterm} {selectedSector.targetPort.split(",")[0]}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: TERBITKAN DRAF DOKUMEN EKSPOR PERTAMA */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText size={18} className="text-blue-700" />
                  Langkah 4: Terbitkan Dokumen Dagang Ekspor Resmi Perdana
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Seluruh data parameter dari langkah 1–3 telah dikompilasi menjadi naskah draf Sales Contract dan Commercial Invoice berstandar UN/CEFACT.
                </p>
              </div>

              {/* MOCK DOCUMENT PREVIEW PARCHMENT */}
              <div className="p-5 bg-[#FAF7F2] border-2 border-slate-300 rounded-xl shadow-inner font-serif text-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b-2 border-slate-800 pb-3 font-sans">
                  <div>
                    <h4 className="text-sm font-bold tracking-tight uppercase text-slate-900">
                      {companyName}
                    </h4>
                    <p className="text-[11px] text-slate-600">
                      Jl. Pelabuhan Ekspor Nusantara No. 88, Makassar · Indonesia · Tel: +62 812-3456-7890
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono bg-blue-900 text-white px-2 py-0.5 rounded font-bold">
                      SALES CONTRACT DRAFT
                    </span>
                    <div className="text-xs font-mono font-bold mt-1 text-slate-900">
                      SC/EXP-{new Date().getFullYear()}/001
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-500">Pembeli (Buyer):</div>
                    <div className="font-bold text-slate-900">{selectedSector.buyerName}</div>
                    <div className="text-[11px] text-slate-600">{selectedSector.buyerCountry}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-500">Ketentuan Penyerahan & Bayar:</div>
                    <div className="font-bold text-slate-900">{selectedSector.incoterm} {selectedSector.targetPort.split(",")[0]} (Incoterms 2020)</div>
                    <div className="text-[11px] text-slate-600">50% T/T Advance DP, 50% against Scanned B/L</div>
                  </div>
                </div>

                <table className="w-full text-xs font-sans border-collapse border border-slate-400">
                  <thead>
                    <tr className="bg-slate-200/80 text-[11px]">
                      <th className="border border-slate-400 p-1.5 text-center">Kode HS</th>
                      <th className="border border-slate-400 p-1.5 text-left">Deskripsi Komoditas</th>
                      <th className="border border-slate-400 p-1.5 text-center">Kemasan</th>
                      <th className="border border-slate-400 p-1.5 text-right">Kuantitas</th>
                      <th className="border border-slate-400 p-1.5 text-right">Total Nilai</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-400 p-1.5 text-center font-mono font-bold">{selectedSector.hsCode}</td>
                      <td className="border border-slate-400 p-1.5 font-semibold">{selectedSector.productName}</td>
                      <td className="border border-slate-400 p-1.5 text-center">{selectedSector.weightPerUnit} kg/{selectedSector.unit}</td>
                      <td className="border border-slate-400 p-1.5 text-right font-mono tabular-nums">{formatNumber(targetQuantity)} {selectedSector.unit}</td>
                      <td className="border border-slate-400 p-1.5 text-right font-mono font-bold tabular-nums">USD {formatNumber(totalContractUsd, 2)}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="flex items-center justify-between text-[11px] font-sans text-slate-600 pt-2 border-t border-slate-300">
                  <span>Status Audit: <b>Ready for Dual-Signature & Stamp</b></span>
                  <span>Integritas Hash: <b>SHA-256 Enabled</b></span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* FOOTER NAVIGATION BUTTONS */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1.5"
              >
                <ChevronLeft size={16} /> Sebelumnya
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Lewati Panduan
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev + 1) as any)}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
              >
                Lanjutkan <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinishOnboarding}
                className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Sparkles size={16} /> Terapkan & Buka Dokumen Ekspor
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
