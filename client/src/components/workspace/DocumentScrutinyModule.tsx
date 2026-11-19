import React, { useState } from "react";
import {
  FileSearch,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  FileCheck,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Send,
  Stamp,
  Mail,
  Copy,
  ArrowRight,
  Sparkles,
  Info,
  Building,
  Anchor,
  FileText,
  DollarSign,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import type { Shipment } from "@shared/shipment";
import type { ScreenId } from "@shared/risk";

interface DocumentScrutinyModuleProps {
  shipment: Shipment;
  update: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void;
  navigate: (screen: ScreenId) => void;
}

export interface DiscrepancyItem {
  id: string;
  field: string;
  internalValue: string; // CI / PL
  draftBlValue: string; // Draft BL dari forwarder
  severity: "error" | "warning" | "pass";
  description: string;
  demurrageRisk: string;
}

export function DocumentScrutinyModule({
  shipment,
  update,
  navigate,
}: DocumentScrutinyModuleProps) {
  const [activeTab, setActiveTab] = useState<"ocr_scrutiny" | "tt_billing">("ocr_scrutiny");
  const [isSimulatingOcr, setIsSimulatingOcr] = useState<boolean>(false);
  const [hasScannedDraft, setHasScannedDraft] = useState<boolean>(true);
  const [isEmailSending, setIsEmailSending] = useState<boolean>(false);

  // Bill of Lading Draft mock data
  const [draftBlNumber, setDraftBlNumber] = useState<string>("MEDU-JKT-892104-E");
  const [forwarderName, setForwarderName] = useState<string>("Mediterranean Shipping Company (MSC) / PT Samudera Forwarding");
  const [blGrossWeight, setBlGrossWeight] = useState<string>("24,850 kg");
  const [blSealNumber, setBlSealNumber] = useState<string>("(KOSONG / BELUM TERCANTUM)");
  const [blConsignee, setBlConsignee] = useState<string>(shipment.buyer || "Nordic Specialty Coffee ApS");

  // Discrepancy List
  const [discrepancies, setDiscrepancies] = useState<DiscrepancyItem[]>([
    {
      id: "disc-01",
      field: "Gross Weight (Berat Kotor Total)",
      internalValue: "24,800 kg (Packing List)",
      draftBlValue: "24,850 kg (Draft B/L Forwarder)",
      severity: "error",
      description: "Selisih 50 kg antara Packing List dan draf B/L. Bea Cukai pelabuhan tujuan akan menahan kontainer untuk pemeriksaan timbang ulang (VGM discrepancy).",
      demurrageRisk: "Potensi denda demurrage & detention EUR €150/hari bila dokumen tertahan di bea cukai Rotterdam.",
    },
    {
      id: "disc-02",
      field: "Nomor Segel Kontainer (Seal Number)",
      internalValue: shipment.sealNumber || "ID-SEAL-889102",
      draftBlValue: "TIDAK DITAMPILKAN DI DRAF",
      severity: "warning",
      description: "Forwarder belum mencantumkan nomor seal fisik kontainer pada draf B/L. Wajib dilengkapi sebelum final B/L diterbitkan.",
      demurrageRisk: "Risiko penolakan rilis muatan oleh terminal pelabuhan bongkar.",
    },
    {
      id: "disc-03",
      field: "Nama & Alamat Consignee (Importir)",
      internalValue: shipment.buyer || "Nordic Specialty Coffee ApS",
      draftBlValue: "Nordic Specialty Coffee ApS",
      severity: "pass",
      description: "Nama perusahaan, alamat, dan negara tujuan cocok 100% dengan Commercial Invoice.",
      demurrageRisk: "Aman - Sesuai standar korespondensi perbankan.",
    },
    {
      id: "disc-04",
      field: "Pelabuhan Muat & Pelabuhan Bongkar (POL / POD)",
      internalValue: `${shipment.namedPlace || "Tanjung Priok, Jakarta"} -> ${shipment.destination || "Port of Rotterdam"}`,
      draftBlValue: `${shipment.namedPlace || "Tanjung Priok, Jakarta"} -> ${shipment.destination || "Port of Rotterdam"}`,
      severity: "pass",
      description: "Rute pelayaran laut sesuai kesepakatan Sales Contract & Shipping Instruction.",
      demurrageRisk: "Aman - Tidak ada deviasi rute.",
    },
  ]);

  const handleRunOcrScrutiny = () => {
    setIsSimulatingOcr(true);
    setTimeout(() => {
      setIsSimulatingOcr(false);
      setHasScannedDraft(true);
      toast.success("AI Document Scrutiny Selesai", {
        description: "Ekstraksi OCR draft B/L berhasil dicocokkan silang dengan Commercial Invoice dan Packing List.",
      });
    }, 1400);
  };

  const handleToggleScannedStamp = () => {
    const next = !shipment.includeScannedCopyStamp;
    update("includeScannedCopyStamp", next);
    toast.success(
      next
        ? "Cap Digital 'Scanned Copy' Berhasil Diterapkan!"
        : "Cap Digital 'Scanned Copy' Dinonaktifkan.",
      {
        description: next
          ? "Seluruh dokumen ekspor (PI, CI, PL, SI) kini dilengkapi stempel digital resmi SCANNED COPY untuk penagihan TT."
          : "Stempel SCANNED COPY telah dihapus dari tampilan dokumen.",
      }
    );
  };

  // TT Billing parameters
  const totalValue = 78625; // USD
  const dpPercentage = 30; // 30%
  const dpPaid = (totalValue * dpPercentage) / 100;
  const balanceDue = totalValue - dpPaid;

  const handleSendTtBilling = () => {
    setIsEmailSending(true);
    setTimeout(() => {
      setIsEmailSending(false);
      toast.success("Faktur Penagihan TT Berhasil Dikirim!", {
        description: `Email penagihan pelunasan sisa 70% (USD $${balanceDue.toLocaleString()}) dengan lampiran Scanned Copy telah dikirim ke ${shipment.buyer || "Buyer"}.`,
      });
    }, 1500);
  };

  return (
    <div className="module-stack" style={{ gap: 16 }}>
      {/* Sleek Sub-Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/60">
          <button
            type="button"
            onClick={() => setActiveTab("ocr_scrutiny")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === "ocr_scrutiny"
                ? "bg-background text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileSearch size={13} /> Pemeriksaan Draf B/L (3-Way Matching)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("tt_billing")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === "tt_billing"
                ? "bg-background text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Stamp size={13} /> Cap Scanned Copy & Tagihan TT
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Acuan: <b>{shipment.reference}</b> · Forwarder: MSC / PT Samudera
          </span>
        </div>
      </div>

      {/* TAB 1: OCR SCRUTINY & VALIDASI SILANG */}
      {activeTab === "ocr_scrutiny" && (
        <div className="space-y-4">
          {/* Upload / Simulation Panel */}
          <section className="panel panel-padding">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
              <div>
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <UploadCloud size={16} className="text-indigo-400" />
                  Unggah Draf Dokumen Eksternal (Bill of Lading dari Forwarder)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sistem mengekstrak nomor BL, consignee, bobot kotor/bersih, dan nomor seal untuk dicocokkan otomatis dengan data internal.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRunOcrScrutiny}
                  disabled={isSimulatingOcr}
                  className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium flex items-center gap-1.5 shadow"
                >
                  {isSimulatingOcr ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" /> Menganalisis Dokumen...
                    </>
                  ) : (
                    <>
                      <Sparkles size={13} /> Muat & Jalankan OCR Scrutiny
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Extracted Snapshot Info */}
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-background/50 p-3 rounded-lg border border-border">
              <div>
                <span className="text-[11px] text-muted-foreground block">Nomor Draf B/L:</span>
                <b className="font-mono text-foreground">{draftBlNumber}</b>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">Shipping Line / Forwarder:</span>
                <span className="text-foreground">{forwarderName}</span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">Gross Weight pada B/L:</span>
                <b className="text-amber-400 font-mono">{blGrossWeight}</b>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">Status Verifikasi Silang:</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Perlu Revisi (1 Error, 1 Warning)
                </span>
              </div>
            </div>
          </section>

          {/* 3-Way Matching Comparison Table */}
          <section className="panel panel-padding">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <FileCheck size={16} className="text-emerald-400" />
                Hasil Pencocokan Silang 3-Way (Draft B/L vs Commercial Invoice vs Packing List)
              </h3>
              <span className="text-xs text-muted-foreground">
                Acuan: Transaksi <b>{shipment.reference}</b>
              </span>
            </div>

            <div className="space-y-3">
              {discrepancies.map((disc) => (
                <div
                  key={disc.id}
                  className={`p-3.5 rounded-lg border text-xs transition-all ${
                    disc.severity === "error"
                      ? "border-rose-500/50 bg-rose-950/15"
                      : disc.severity === "warning"
                      ? "border-amber-500/50 bg-amber-950/15"
                      : "border-emerald-500/30 bg-emerald-950/10"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {disc.severity === "error" ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                            <AlertTriangle size={11} /> KETIDAKSESUAIAN KRITIS
                          </span>
                        ) : disc.severity === "warning" ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <Info size={11} /> PERINGATAN REVISI
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 size={11} /> TERVERIFIKASI COCOK
                          </span>
                        )}
                        <b className="text-foreground text-sm">{disc.field}</b>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-1">
                        <div className="bg-background/60 p-2 rounded border border-border/70">
                          <span className="text-muted-foreground block text-[11px]">Data Internal (CI / PL):</span>
                          <span className="font-mono font-medium text-foreground">{disc.internalValue}</span>
                        </div>
                        <div className="bg-background/60 p-2 rounded border border-border/70">
                          <span className="text-muted-foreground block text-[11px]">Draf Dokumen Pihak Ketiga (B/L):</span>
                          <span
                            className={`font-mono font-medium ${
                              disc.severity === "error"
                                ? "text-rose-400"
                                : disc.severity === "warning"
                                ? "text-amber-400"
                                : "text-emerald-400"
                            }`}
                          >
                            {disc.draftBlValue}
                          </span>
                        </div>
                      </div>

                      <p className="text-muted-foreground text-xs mt-2">{disc.description}</p>
                    </div>

                    <div className="text-right shrink-0 max-w-[280px]">
                      <span className="text-[10px] font-semibold text-rose-300 block bg-rose-500/10 p-2 rounded border border-rose-500/20">
                        {disc.demurrageRisk}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Notification & Revision Request Action */}
            <div className="mt-4 pt-3 border-t border-border flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <ShieldAlert size={15} className="text-rose-400" />
                <span>
                  <b>Notifikasi Peringatan Demurrage:</b> Deteksi dini ketidaksesuaian data sebelum proses pengiriman dan final B/L dikunci oleh pihak pelayaran.
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Kepada Yth. Tim Operasional ${forwarderName}\nPerihal: Permintaan Revisi Draf B/L No. ${draftBlNumber} (Ref: ${shipment.reference})\n\nBerdasarkan validasi silang sistem EksporFlow dengan Packing List kami, mohon lakukan koreksi:\n1. Gross Weight tertulis 24,850 kg, seharusnya 24,800 kg sesuai timbangan resmi (Packing List terlampir).\n2. Mohon cantumkan Nomor Segel (Seal No.) resmi: ${shipment.sealNumber || "ID-SEAL-889102"}.\n\nMohon kirimkan draf revisi sebelum vessel cut-off time. Terima kasih.`
                  );
                  toast.success("Draf Permintaan Revisi Disalin!", {
                    description: "Teks permintaan koreksi B/L ke freight forwarder siap dikirim melalui email/WhatsApp.",
                  });
                }}
                className="px-3.5 py-2 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow"
              >
                <Mail size={13} /> Buat Permintaan Revisi B/L ke Forwarder
              </button>
            </div>
          </section>
        </div>
      )}

      {/* TAB 2: OTOMATISASI CAP SCANNED COPY & PENAGIHAN TT */}
      {activeTab === "tt_billing" && (
        <div className="space-y-4">
          <section className="panel panel-padding">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
              <div>
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Stamp size={16} className="text-primary" />
                  Cap Digital "Scanned Copy" & Penagihan Telegraphic Transfer (TT)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Berikan stempel non-negotiable resmi pada dokumen yang lolos verifikasi, lalu kirim faktur pelunasan TT kepada buyer sebelum dokumen original diserahkan.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleScannedStamp}
                  className={`px-3.5 py-2 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all shadow ${
                    shipment.includeScannedCopyStamp
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-primary hover:bg-primary/90 text-primary-foreground"
                  }`}
                >
                  <Stamp size={14} />
                  {shipment.includeScannedCopyStamp
                    ? "✓ Cap Scanned Copy Aktif"
                    : "Aktifkan Cap 'Scanned Copy'"}
                </button>
              </div>
            </div>

            {/* Visual Stamp Card */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Preview Cap Stempel Digital */}
              <div className="bg-background rounded-lg border border-border p-5 flex flex-col justify-between items-center text-center relative overflow-hidden min-h-[220px]">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Simulasi Cap Digital Pada Dokumen Ekspor
                </span>

                <div className="my-auto relative p-4 border-2 border-dashed border-primary/40 rounded-lg max-w-sm">
                  {/* Stempel Fisik Emulasi */}
                  <div className="border-4 border-red-600 rounded-md p-2.5 transform -rotate-6 text-red-600 shadow-md bg-red-500/5 select-none">
                    <div className="text-[11px] font-bold tracking-widest border-b-2 border-red-600 pb-0.5">
                      ★ OFFICIAL EXPORT DOCUMENT ★
                    </div>
                    <div className="text-base font-black tracking-wider py-1">
                      SCANNED COPY
                    </div>
                    <div className="text-[9px] font-semibold tracking-wide border-t-2 border-red-600 pt-0.5 uppercase">
                      NON-NEGOTIABLE · RELEASED FOR TT PAYMENT
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-muted-foreground mt-2">
                  Status Stempel Saat Ini:{" "}
                  <b className={shipment.includeScannedCopyStamp ? "text-emerald-400" : "text-muted-foreground"}>
                    {shipment.includeScannedCopyStamp ? "Diterapkan ke Dokumen Ekspor" : "Belum Diaktifkan"}
                  </b>
                </div>
              </div>

              {/* Financial TT Breakdown */}
              <div className="bg-background rounded-lg border border-border p-5 space-y-3 text-xs">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Perhitungan Sisa Tagihan Pelunasan TT
                </span>

                <div className="space-y-2 border-b border-border pb-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Nilai Kontrak (FOB / CIF):</span>
                    <b className="font-mono text-foreground">USD ${totalValue.toLocaleString()}</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Uang Muka Diterima (Deposit 30%):</span>
                    <span className="font-mono text-emerald-400">- USD ${dpPaid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-1 border-t border-border/60">
                    <b className="text-foreground">Sisa Pelunasan Wajib Bayar (70%):</b>
                    <b className="font-mono text-primary text-base">USD ${balanceDue.toLocaleString()}</b>
                  </div>
                </div>

                <div className="space-y-1 text-muted-foreground text-[11px]">
                  <div>
                    Bank Penerima: <b>Bank Mandiri (Persero) Tbk</b> · Cabang Jakarta Thamrin
                  </div>
                  <div>
                    SWIFT Code: <b className="font-mono">BMRIIDJA</b> · Rekening USD: <b className="font-mono">102-00-889123-9</b>
                  </div>
                  <div>
                    Atas Nama: <b>{shipment.exporter || "PT. INDICO EXPORT NUSANTARA"}</b>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSendTtBilling}
                    disabled={isEmailSending}
                    className="w-full py-2 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow"
                  >
                    {isEmailSending ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" /> Mengirim Tagihan TT...
                      </>
                    ) : (
                      <>
                        <Send size={13} /> Kirim Faktur Penagihan Pelunasan TT ke Buyer
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
