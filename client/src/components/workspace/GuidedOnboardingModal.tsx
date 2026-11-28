import React, { useState } from "react";
import {
  Building2,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  FileText,
  Package,
  Scale,
  Ship,
  ShieldCheck,
  ArrowRight,
  X,
  Compass,
  Boxes,
  Calculator,
} from "lucide-react";
import type { Shipment, LineItem } from "@shared/shipment";
import { formatMoney, formatNumber } from "@shared/format";
import { containerSpecs } from "@shared/container";

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
}

export const SECTOR_PRESETS: OnboardingSectorPreset[] = [
  {
    id: "coffee",
    name: "Kopi Arabika Gayo",
    categoryName: "Perkebunan",
    productName: "Specialty Arabica Green Coffee Beans (Grade 1)",
    hsCode: "0901.11.00",
    packagingType: "Jute Bag (Karung Goni 60kg)",
    unit: "karung",
    defaultQty: 300,
    weightPerUnit: 60,
    lengthCm: 90,
    widthCm: 60,
    heightCm: 30,
    shrinkageRate: 3.0,
    defaultUnitPrice: 7.50,
    defaultCurrency: "USD",
    targetPort: "Port of Tokyo, Japan",
    buyerCountry: "Jepang",
    buyerName: "Kyoto Specialty Coffee Importers Co., Ltd.",
    incoterm: "FOB",
    containerType: "20GP",
  },
  {
    id: "fishery",
    name: "Udang Windu Beku",
    categoryName: "Perikanan",
    productName: "Frozen Black Tiger Prawns (Head-On Shell-On)",
    hsCode: "0306.17.00",
    packagingType: "Master Carton 10kg with PE Liner",
    unit: "karton",
    defaultQty: 1400,
    weightPerUnit: 10,
    lengthCm: 48,
    widthCm: 30,
    heightCm: 22,
    shrinkageRate: 1.0,
    defaultUnitPrice: 12.50,
    defaultCurrency: "USD",
    targetPort: "Port of Busan, South Korea",
    buyerCountry: "Korea Selatan",
    buyerName: "Hansol Marine Foods Corp.",
    incoterm: "CIF",
    containerType: "20GP",
  },
  {
    id: "coconutsugar",
    name: "Gula Kelapa Organik",
    categoryName: "Pangan Olahan",
    productName: "Organic Granulated Coconut Sugar",
    hsCode: "1702.90.10",
    packagingType: "Kraft Paper Bag 20kg",
    unit: "karung",
    defaultQty: 900,
    weightPerUnit: 20,
    lengthCm: 60,
    widthCm: 40,
    heightCm: 15,
    shrinkageRate: 3.5,
    defaultUnitPrice: 2.20,
    defaultCurrency: "USD",
    targetPort: "Jebel Ali Port, Dubai",
    buyerCountry: "Uni Emirat Arab",
    buyerName: "Al-Barakah Foodstuff Trading LLC",
    incoterm: "FOB",
    containerType: "20GP",
  },
  {
    id: "furniture",
    name: "Mebel Kayu & Rotan",
    categoryName: "Manufaktur",
    productName: "Teak & Natural Rattan Outdoor Lounge Set",
    hsCode: "9403.82.00",
    packagingType: "Corrugated Box with Corner Guard",
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

  // Live calculations
  const totalWeightKgs = targetQuantity * selectedSector.weightPerUnit;
  const singleCbm = (selectedSector.lengthCm * selectedSector.widthCm * selectedSector.heightCm) / 1_000_000;
  const totalVolumeCbm = targetQuantity * singleCbm;
  const spec = containerSpecs[selectedSector.containerType] || containerSpecs["20GP"];
  const volumeUtilization = Math.min(100, (totalVolumeCbm / spec.volume) * 100);
  const weightUtilization = Math.min(100, (totalWeightKgs / spec.weight) * 100);
  const totalContractUsd = selectedSector.id === "furniture"
    ? targetQuantity * targetUnitPrice
    : totalWeightKgs * targetUnitPrice;

  const handleApplyPreset = (sector: OnboardingSectorPreset) => {
    setSelectedSector(sector);
    setTargetQuantity(sector.defaultQty);
    setTargetUnitPrice(sector.defaultUnitPrice);
  };

  const handleFinishOnboarding = () => {
    update("exporter", companyName);
    update("namedPlace", selectedPort);
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

    onClose();
    onFinish("documents");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-[#EAEFF5] overflow-hidden text-[#1B2533]">
        
        {/* Header Bersih & Ringkas ala Space DS */}
        <div className="px-6 py-4 bg-[#131B26] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#F59E0B]/20 border border-[#F59E0B]/40 flex items-center justify-center text-[#F59E0B]">
              <Compass size={16} />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-normal text-white">Panduan Transaksi Ekspor</h2>
              <span className="text-[11px] text-[#8A94A6]">Setup profil, komoditas, dan terbitkan draf dokumen</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stepper Minimalis */}
        <div className="grid grid-cols-4 border-b border-[#EAEFF5] bg-[#F8FAFC] text-xs">
          {[
            { num: 1, label: "1. Profil Eksportir" },
            { num: 2, label: "2. Komoditas & HS" },
            { num: 3, label: "3. Kontainer & Harga" },
            { num: 4, label: "4. Draf Dokumen" },
          ].map((s) => {
            const isCurrent = currentStep === s.num;
            const isDone = currentStep > s.num;
            return (
              <button
                key={s.num}
                type="button"
                onClick={() => setCurrentStep(s.num as any)}
                className={`py-2.5 px-3 text-center border-b-2 font-medium transition-all ${
                  isCurrent
                    ? "border-[#0F2942] text-[#0F2942] bg-white font-semibold"
                    : isDone
                      ? "border-emerald-600 text-emerald-700 font-medium"
                      : "border-transparent text-[#697483] hover:text-[#1B2533]"
                }`}
              >
                <span className="truncate block">{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Isi Modal per Langkah */}
        <div className="p-6 space-y-5 min-h-[360px]">
          
          {/* LANGKAH 1 */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Nama Badan Usaha
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Contoh: PT. Sumber Alam Nusantara"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    NIB (Nomor Induk Berusaha)
                  </label>
                  <input
                    type="text"
                    value={nibNumber}
                    onChange={(e) => setNibNumber(e.target.value)}
                    placeholder="13 Digit NIB"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 font-medium tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    NPWP Perusahaan
                  </label>
                  <input
                    type="text"
                    value={npwpNumber}
                    onChange={(e) => setNpwpNumber(e.target.value)}
                    placeholder="00.000.000.0-000.000"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 font-medium tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Pelabuhan Muat Asal (POL)
                  </label>
                  <select
                    value={selectedPort}
                    onChange={(e) => setSelectedPort(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 bg-white font-medium"
                  >
                    <option value="Pelabuhan Tanjung Priok, Jakarta (IDTPP)">Pelabuhan Tanjung Priok, Jakarta (IDTPP)</option>
                    <option value="Pelabuhan Tanjung Perak, Surabaya (IDSUB)">Pelabuhan Tanjung Perak, Surabaya (IDSUB)</option>
                    <option value="Pelabuhan Belawan, Medan (IDBLW)">Pelabuhan Belawan, Medan (IDBLW)</option>
                    <option value="Pelabuhan Makassar New Port (IDMAK)">Pelabuhan Makassar New Port (IDMAK)</option>
                    <option value="Pelabuhan Tanjung Emas, Semarang (IDSRG)">Pelabuhan Tanjung Emas, Semarang (IDSRG)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                <span>Identitas ini otomatis terisi pada kop surat seluruh 6 dokumen ekspor resmi Anda.</span>
              </div>
            </div>
          )}

          {/* LANGKAH 2 */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SECTOR_PRESETS.map((sector) => {
                  const isSelected = selectedSector.id === sector.id;
                  return (
                    <div
                      key={sector.id}
                      onClick={() => handleApplyPreset(sector)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "border-[#0F2942] bg-[#F0F6FC] shadow-xs ring-1 ring-[#0F2942]"
                          : "border-[#EAEFF5] bg-white hover:border-[#D6DAE1]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-slate-900">{sector.name}</span>
                        <span className="text-[10.5px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium tabular-nums">
                          HS {sector.hsCode}
                        </span>
                      </div>
                      <div className="text-[11.5px] text-slate-600 truncate mb-2">{sector.productName}</div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                        <span>{sector.containerType}</span>
                        <span>•</span>
                        <span>{sector.incoterm}</span>
                        <span>•</span>
                        <span>{sector.buyerCountry}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                Preset otomatis mengisi kode HS 6-digit terverifikasi, spesifikasi kemasan, dan buyer referensi.
              </div>
            </div>
          )}

          {/* LANGKAH 3 */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Kuantitas Pesanan ({selectedSector.unit})
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={targetQuantity}
                    onChange={(e) => setTargetQuantity(Math.max(1, Number(e.target.value) || 0))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 font-medium tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Harga Satuan ({selectedSector.defaultCurrency} / {selectedSector.unit})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={0.01}
                    value={targetUnitPrice}
                    onChange={(e) => setTargetUnitPrice(Math.max(0.01, Number(e.target.value) || 0))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 font-medium tabular-nums"
                  />
                </div>
              </div>

              {/* Status Muatan Kontainer */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">Tipe Kontainer: {selectedSector.containerType}</span>
                  <span className="text-slate-900 font-semibold tabular-nums">
                    Est. Nilai: ${totalContractUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                      <span>Kapasitas Volume ({totalVolumeCbm.toFixed(2)} / {spec.volume} CBM)</span>
                      <span className="font-semibold text-slate-800 tabular-nums">{volumeUtilization.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-sm overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-sm" style={{ width: `${volumeUtilization}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                      <span>Kapasitas Berat ({(totalWeightKgs / 1000).toFixed(2)} / {(spec.weight / 1000).toFixed(1)} Ton)</span>
                      <span className="font-semibold text-slate-800 tabular-nums">{weightUtilization.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-sm overflow-hidden">
                      <div className="bg-emerald-600 h-full rounded-sm" style={{ width: `${weightUtilization}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LANGKAH 4 */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-3">
                <h4 className="text-xs font-semibold text-slate-900 tracking-normal">
                  Ringkasan Setup Transaksi
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 block">Eksportir:</span>
                    <span className="font-semibold text-slate-900">{companyName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Buyer:</span>
                    <span className="font-semibold text-slate-900">{selectedSector.buyerName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Komoditas:</span>
                    <span className="font-semibold text-slate-900">{selectedSector.productName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Incoterm / Tujuan:</span>
                    <span className="font-semibold text-slate-900">{selectedSector.incoterm} · {selectedSector.targetPort}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-900">
                Data akan langsung diterapkan ke modul Dokumen Ekspor (Proforma Invoice, Sales Contract, Commercial Invoice, Packing List, Shipping Instruction, &amp; COO).
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigasi */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep((s) => (s - 1) as any)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                <ChevronLeft size={15} />
                Kembali
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-slate-600 hover:text-slate-800 px-3 py-2 rounded-lg transition-colors"
            >
              Lewati
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((s) => (s + 1) as any)}
                className="inline-flex items-center gap-1.5 bg-[#0F2942] hover:bg-[#163A5C] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all"
              >
                <span>Lanjut</span>
                <ChevronRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinishOnboarding}
                className="inline-flex items-center gap-1.5 bg-[#F59E0B] hover:bg-[#D97706] text-[#0B192C] text-xs font-semibold px-5 py-2 rounded-lg shadow-sm transition-all"
              >
                <FileText size={14} />
                <span>Buka Dokumen Ekspor</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
