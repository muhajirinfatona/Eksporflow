import { StatusPill } from "@/components/workspace/Primitives";
import { calculateContainer } from "@shared/container";
import { formatMoney } from "@shared/format";
import { calculatePricing } from "@shared/pricing";
import type { ScreenId } from "@shared/risk";
import type { Shipment } from "@shared/shipment";
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  Copy,
  FileCheck,
  FileSearch,
  Info,
  Mail,
  RefreshCw,
  Send,
  ShieldAlert,
  Stamp,
  UploadCloud,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

interface DocumentScrutinyModuleProps {
  shipment: Shipment;
  update: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void;
  navigate: (screen: ScreenId) => void;
}

export interface DiscrepancyItem {
  id: string;
  field: string;
  internalValue: string;
  draftBlValue: string;
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
  const [draftBlResolved, setDraftBlResolved] = useState<boolean>(false);
  const [dpPercent, setDpPercent] = useState<number>(30);
  const [forwarderEmail, setForwarderEmail] = useState<string>("docs-ops@forwarder-line.example");
  const [isEmailSending, setIsEmailSending] = useState<boolean>(false);

  const pricing = useMemo(() => calculatePricing(shipment), [shipment]);
  const container = useMemo(() => calculateContainer(shipment), [shipment]);

  const draftBlNumber = shipment.blNumber?.trim() || "MEDU-JKT-892104-E";
  const forwarderName =
    shipment.vesselName?.trim()
      ? `Forwarder · Vessel ${shipment.vesselName.trim()}`
      : "Mediterranean Shipping Company (MSC) / Freight Forwarder";
  const internalGrossWeightKg = Math.round(container.totalWeight || 24800);
  const blGrossWeight = draftBlResolved
    ? `${internalGrossWeightKg.toLocaleString("en-US")} kg`
    : `${(internalGrossWeightKg + 50).toLocaleString("en-US")} kg`;

  const discrepancies: DiscrepancyItem[] = useMemo(
    () => [
      {
        id: "disc-01",
        field: "Gross Weight (Berat Kotor Total)",
        internalValue: `${internalGrossWeightKg.toLocaleString("en-US")} kg (Packing List)`,
        draftBlValue: `${blGrossWeight} (Draft B/L Forwarder)`,
        severity: draftBlResolved ? "pass" : "error",
        description: draftBlResolved
          ? "Berat kotor pada draf B/L revisi telah sesuai 100% dengan Packing List."
          : "Terdeteksi selisih +50 kg antara Packing List dan draf B/L. Bea Cukai pelabuhan tujuan dapat menahan kontainer untuk pemeriksaan VGM.",
        demurrageRisk: draftBlResolved
          ? "Risiko VGM teratasi."
          : "Potensi denda demurrage & detention USD $150/hari bila dokumen tertahan.",
      },
      {
        id: "disc-02",
        field: "Nomor Segel Kontainer (Seal Number)",
        internalValue: shipment.sealNumber || "ID-SEAL-889102",
        draftBlValue: draftBlResolved
          ? shipment.sealNumber || "ID-SEAL-889102"
          : "TIDAK DITAMPILKAN DI DRAF",
        severity: draftBlResolved ? "pass" : "warning",
        description: draftBlResolved
          ? "Nomor segel kontainer sudah tercantum konsisten di final draft B/L."
          : "Forwarder belum mencantumkan nomor seal fisik kontainer pada draf B/L. Wajib dilengkapi sebelum final B/L dikunci.",
        demurrageRisk: draftBlResolved
          ? "Aman - Siap Gate-In."
          : "Risiko penolakan rilis muatan di terminal bongkar tujuan.",
      },
      {
        id: "disc-03",
        field: "Nama & Alamat Consignee (Importir)",
        internalValue: shipment.buyer || "Nordic Pantry AB",
        draftBlValue: shipment.buyer || "Nordic Pantry AB",
        severity: "pass",
        description: "Nama perusahaan, alamat, dan negara tujuan cocok 100% dengan Commercial Invoice.",
        demurrageRisk: "Aman - Sesuai korespondensi perbankan.",
      },
      {
        id: "disc-04",
        field: "Pelabuhan Muat & Pelabuhan Bongkar (POL / POD)",
        internalValue: `${shipment.namedPlace || "Tanjung Priok, Jakarta"} -> ${shipment.destination || "Port of Destination"}`,
        draftBlValue: `${shipment.namedPlace || "Tanjung Priok, Jakarta"} -> ${shipment.destination || "Port of Destination"}`,
        severity: "pass",
        description: "Rute pelayaran laut sesuai kesepakatan Sales Contract & Shipping Instruction.",
        demurrageRisk: "Aman - Tidak ada deviasi rute.",
      },
    ],
    [
      internalGrossWeightKg,
      blGrossWeight,
      draftBlResolved,
      shipment.sealNumber,
      shipment.buyer,
      shipment.namedPlace,
      shipment.destination,
    ],
  );

  const issueCount = discrepancies.filter((d) => d.severity !== "pass").length;

  const revisionRequestText = useMemo(
    () =>
      `Kepada Yth. Tim Operasional ${forwarderName}\nPerihal: Permintaan Revisi Draf B/L No. ${draftBlNumber} (Ref: ${shipment.reference || "Draft"})\n\nBerdasarkan validasi silang sistem EksporFlow (Commercial Invoice & Packing List), mohon lakukan koreksi sebelum B/L dikunci:\n1. Gross Weight tertulis ${(internalGrossWeightKg + 50).toLocaleString("en-US")} kg, mohon sesuaikan menjadi ${internalGrossWeightKg.toLocaleString("en-US")} kg sesuai Packing List resmi.\n2. Mohon cantumkan Nomor Segel (Seal No.) fisik kontainer: ${shipment.sealNumber || "ID-SEAL-889102"}.\n\nMohon kirimkan draf revisi sebelum vessel cut-off time agar terhindar dari biaya amandemen & demurrage.\n\nHormat kami,\n${shipment.signatoryName || "Tim Operasional"} · ${shipment.exporter || "Eksportir"}`,
    [
      forwarderName,
      draftBlNumber,
      shipment.reference,
      internalGrossWeightKg,
      shipment.sealNumber,
      shipment.signatoryName,
      shipment.exporter,
    ],
  );

  const handleRunOcrScrutiny = (resolveIssues: boolean) => {
    setIsSimulatingOcr(true);
    setTimeout(() => {
      setIsSimulatingOcr(false);
      setDraftBlResolved(resolveIssues);
      toast.success(
        resolveIssues
          ? "Draf B/L Revisi Lolos Validasi 3-Way!"
          : "Simulasi AI OCR Scrutiny Selesai — Temuan Terdeteksi",
        {
          description: resolveIssues
            ? "Seluruh field berat, segel, consignee, dan pelabuhan cocok 100%."
            : "Notifikasi revisi otomatis aktif sebelum draf final B/L dikunci.",
        },
      );
    }, 650);
  };

  const handleToggleScannedStamp = () => {
    const next = !shipment.includeScannedCopyStamp;
    update("includeScannedCopyStamp", next);
    toast.success(
      next
        ? "Cap Digital 'Scanned Copy' Diterapkan ke Dokumen!"
        : "Cap Digital 'Scanned Copy' Dinonaktifkan.",
      {
        description: next
          ? "Seluruh dokumen ekspor (PI, CI, PL, SI) kini dilengkapi stempel SCANNED COPY untuk penagihan T/T."
          : "Stempel SCANNED COPY dihapus dari preview dokumen.",
      },
    );
  };

  // TT Billing parameters terhubung langsung ke perhitungan Pricing transaksi aktif
  const totalValue = pricing.active.offer > 0 ? pricing.active.offer : 44400;
  const dpPaid = (totalValue * dpPercent) / 100;
  const balanceDue = Math.max(0, totalValue - dpPaid);

  const ttBillingEmailText = useMemo(
    () =>
      `Dear ${shipment.buyerPicName || shipment.buyer || "Accounts Payable Team"},\n\nPlease find attached the SCANNED COPY of our finalized Commercial Invoice, Packing List, and Bill of Lading (${draftBlNumber}) for shipment reference ${shipment.reference || "Export Order"}.\n\nSETTLEMENT SUMMARY (${shipment.currency}):\n• Total Contract Value (${shipment.incoterm}): ${formatMoney(totalValue, shipment.currency)}\n• Initial Deposit Received (${dpPercent}%): ${formatMoney(dpPaid, shipment.currency)}\n• Remaining T/T Balance Due (${100 - dpPercent}%): ${formatMoney(balanceDue, shipment.currency)}\n\nREMITTANCE BANK ACCOUNT:\n• Bank: ${shipment.bankName || "PT. Bank Mandiri (Persero) Tbk"}\n• SWIFT Code: ${shipment.bankSwift || "BMRIIDJA"}\n• Account Name: ${shipment.exporter || "Indonesian Exporter"}\n• Account No.: ${shipment.bankAccountNo || "152-00-9876543-2"}\n\nUpon receipt of your SWIFT TT copy, we will proceed with Telex Release / courier of original export documents.\n\nBest regards,\n${shipment.signatoryName || "Export Finance"} · ${shipment.exporter || ""}`,
    [
      shipment.buyerPicName,
      shipment.buyer,
      draftBlNumber,
      shipment.reference,
      shipment.currency,
      shipment.incoterm,
      totalValue,
      dpPercent,
      dpPaid,
      balanceDue,
      shipment.bankName,
      shipment.bankSwift,
      shipment.exporter,
      shipment.bankAccountNo,
      shipment.signatoryName,
    ],
  );

  const handleCopyRevision = async () => {
    try {
      await navigator.clipboard.writeText(revisionRequestText);
      toast.success("Notifikasi Permintaan Revisi B/L Disalin", {
        description: "Siap dikirim ke Forwarder sebelum draf final dikunci pelayaran.",
      });
    } catch {
      toast.error("Gagal menyalin ke clipboard.");
    }
  };

  const handleSendTtBilling = async () => {
    setIsEmailSending(true);
    try {
      await navigator.clipboard.writeText(ttBillingEmailText);
    } catch {
      // Abaikan jika browser memblokir clipboard
    }
    setTimeout(() => {
      setIsEmailSending(false);
      toast.success("Draf Tagihan Pelunasan T/T Disiapkan!", {
        description: `Teks penagihan sisa ${formatMoney(balanceDue, shipment.currency)} disalin. Lampirkan PDF berstempel SCANNED COPY pada email Anda.`,
      });
    }, 550);
  };

  return (
    <div className="module-stack" style={{ gap: 16 }}>
      {/* Sub-Navigation Bar */}
      <div
        className="panel panel-padding"
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div className="clean-tabs">
          <button
            type="button"
            className={activeTab === "ocr_scrutiny" ? "active" : ""}
            onClick={() => setActiveTab("ocr_scrutiny")}
          >
            <FileSearch size={14} /> Pemeriksaan Draf B/L (3-Way Matching)
          </button>
          <button
            type="button"
            className={activeTab === "tt_billing" ? "active" : ""}
            onClick={() => setActiveTab("tt_billing")}
          >
            <Stamp size={14} /> Otomatisasi Cap Scanned Copy &amp; Tagihan TT
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <StatusPill tone={issueCount > 0 ? "amber" : "green"}>
            {issueCount > 0 ? `${issueCount} Temuan Perlu Revisi` : "3-Way Lolos Sempurna"}
          </StatusPill>
          <button type="button" className="ghost-button" onClick={() => navigate("audit_vault")}>
            Audit Vault →
          </button>
        </div>
      </div>

      {/* TAB 1: OCR SCRUTINY & NOTIFIKASI REVISI OTOMATIS */}
      {activeTab === "ocr_scrutiny" && (
        <div className="module-stack" style={{ gap: 14 }}>
          {/* Alert Notifikasi Revisi Otomatis Sebelum Kunci Final */}
          {issueCount > 0 && (
            <section
              className="panel panel-padding"
              style={{
                background: "#fef2f2",
                borderColor: "#fca5a5",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, maxWidth: 700 }}>
                <BellRing size={18} style={{ color: "#dc2626", marginTop: 2, flexShrink: 0 }} />
                <div style={{ fontSize: 12.5, color: "#7f1d1d", lineHeight: 1.5 }}>
                  <b>Notifikasi Revisi Otomatis Aktif:</b> Sistem mendeteksi {issueCount}{" "}
                  ketidaksesuaian antara Commercial Invoice / Packing List dengan Draft B/L{" "}
                  <span className="mono-code">{draftBlNumber}</span>. Kirim permintaan koreksi sebelum
                  pelayaran menerbitkan Final B/L guna menghindari denda revisi &amp; demurrage.
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  type="button"
                  className="save-button"
                  style={{ background: "#dc2626" }}
                  onClick={handleCopyRevision}
                >
                  <Copy size={13} /> Salin Surat Revisi Forwarder
                </button>
                <a
                  href={`mailto:${encodeURIComponent(forwarderEmail)}?subject=${encodeURIComponent(
                    `Revisi Draft B/L ${draftBlNumber} (${shipment.reference || "Ekspor"})`,
                  )}&body=${encodeURIComponent(revisionRequestText)}`}
                  className="ghost-button"
                  style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  <Mail size={13} /> Kirim ke Email Forwarder
                </a>
              </div>
            </section>
          )}

          {/* Panel OCR & Snapshot */}
          <section className="panel panel-padding">
            <div className="panel-head">
              <div>
                <span className="eyebrow">AI DOCUMENT SCRUTINY</span>
                <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <UploadCloud size={17} style={{ color: "#0f2942" }} />
                  Validasi Silang Draft B/L vs Commercial Invoice &amp; Packing List
                </h3>
                <p className="muted-note" style={{ marginTop: 4 }}>
                  Mencocokkan nomor B/L, consignee, berat kotor (VGM), dan nomor segel kontainer sebelum
                  finalisasi pelayaran.
                </p>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <button
                  type="button"
                  disabled={isSimulatingOcr}
                  onClick={() => handleRunOcrScrutiny(false)}
                  className="ghost-button"
                >
                  <RefreshCw size={13} className={isSimulatingOcr ? "animate-spin" : ""} />{" "}
                  Uji Simulasi Temuan
                </button>
                <button
                  type="button"
                  disabled={isSimulatingOcr}
                  onClick={() => handleRunOcrScrutiny(true)}
                  className="save-button"
                >
                  <CheckCircle2 size={13} /> Verifikasi Draf Revisi (Lolos 100%)
                </button>
              </div>
            </div>

            <div className="clean-tabs" style={{ marginBottom: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
              <div className="clean-kv">
                <span>Nomor Draft B/L</span>
                <b className="mono-code">{draftBlNumber}</b>
              </div>
              <div className="clean-kv">
                <span>Forwarder / Pelayaran</span>
                <b>{forwarderName}</b>
              </div>
              <div className="clean-kv ef-form">
                <span>Email Forwarder (Notifikasi Revisi)</span>
                <input
                  type="email"
                  className="ef-input-clean"
                  value={forwarderEmail}
                  onChange={(e) => setForwarderEmail(e.target.value)}
                  style={{ marginTop: 4 }}
                />
              </div>
              <div className="clean-kv">
                <span>Status Pencocokan 3-Way</span>
                <b>
                  {issueCount === 0 ? "100% Konsisten (Siap Kunci B/L)" : `${issueCount} Item Perlu Koreksi`}
                </b>
              </div>
            </div>

            <div className="module-stack" style={{ gap: 10 }}>
              {discrepancies.map((disc) => {
                const bg =
                  disc.severity === "error"
                    ? "#fef2f2"
                    : disc.severity === "warning"
                      ? "#fffbeb"
                      : "#f0fdf4";
                const border =
                  disc.severity === "error"
                    ? "#fca5a5"
                    : disc.severity === "warning"
                      ? "#fcd34d"
                      : "#86efac";

                return (
                  <div
                    key={disc.id}
                    style={{
                      padding: 14,
                      borderRadius: 10,
                      background: bg,
                      border: `1px solid ${border}`,
                      display: "flex",
                      flexWrap: "wrap",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 260 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <StatusPill
                          tone={
                            disc.severity === "error"
                              ? "red"
                              : disc.severity === "warning"
                                ? "amber"
                                : "green"
                          }
                        >
                          {disc.severity === "error" ? (
                            <AlertTriangle size={11} />
                          ) : disc.severity === "warning" ? (
                            <Info size={11} />
                          ) : (
                            <CheckCircle2 size={11} />
                          )}
                          {disc.severity === "error"
                            ? "KETIDAKSESUAIAN KRITIS"
                            : disc.severity === "warning"
                              ? "PERINGATAN REVISI"
                              : "TERVERIFIKASI COCOK"}
                        </StatusPill>
                        <b style={{ fontSize: 13.5, color: "#0f172a" }}>{disc.field}</b>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12 }}>
                        <div style={{ background: "#ffffff", padding: 8, borderRadius: 6, border: "1px solid #e2e8f0" }}>
                          <span style={{ color: "#64748b", display: "block", fontSize: 11 }}>
                            Data Internal (CI / PL)
                          </span>
                          <b className="mono-code" style={{ color: "#0f172a" }}>
                            {disc.internalValue}
                          </b>
                        </div>
                        <div style={{ background: "#ffffff", padding: 8, borderRadius: 6, border: "1px solid #e2e8f0" }}>
                          <span style={{ color: "#64748b", display: "block", fontSize: 11 }}>
                            Draft Pihak Ketiga (B/L)
                          </span>
                          <b
                            className="mono-code"
                            style={{
                              color:
                                disc.severity === "error"
                                  ? "#dc2626"
                                  : disc.severity === "warning"
                                    ? "#b45309"
                                    : "#047857",
                            }}
                          >
                            {disc.draftBlValue}
                          </b>
                        </div>
                      </div>
                      <p style={{ margin: "8px 0 0", fontSize: 12, color: "#334155" }}>{disc.description}</p>
                    </div>

                    <div
                      style={{
                        maxWidth: 260,
                        alignSelf: "center",
                        padding: 10,
                        borderRadius: 8,
                        background: "#ffffff",
                        border: "1px solid #e2e8f0",
                        fontSize: 11.5,
                        color: disc.severity === "pass" ? "#047857" : "#991b1b",
                        fontWeight: 600,
                      }}
                    >
                      <ShieldAlert size={13} style={{ display: "inline", marginRight: 5 }} />
                      {disc.demurrageRisk}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* TAB 2: OTOMATISASI CAP SCANNED COPY & PENAGIHAN TT */}
      {activeTab === "tt_billing" && (
        <section className="panel panel-padding">
          <div className="panel-head">
            <div>
              <span className="eyebrow">OTOMATISASI CAP DIGITAL &amp; SETTLEMENT TELEGRAPHIC TRANSFER</span>
              <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Stamp size={17} style={{ color: "#0f2942" }} />
                Stempel &quot;SCANNED COPY&quot; &amp; Draf Email Penagihan Pelunasan T/T
              </h3>
              <p className="muted-note" style={{ marginTop: 4 }}>
                Terapkan stempel non-negotiable ke dokumen CI/PL untuk penagihan sisa pelunasan sebelum
                dokumen original / telex release dikirimkan ke buyer.
              </p>
            </div>

            <button
              type="button"
              onClick={handleToggleScannedStamp}
              className="save-button"
              style={{
                background: shipment.includeScannedCopyStamp ? "#059669" : "#0f2942",
              }}
            >
              <Stamp size={14} />
              {shipment.includeScannedCopyStamp
                ? "✓ Cap Scanned Copy Aktif di Dokumen"
                : "Aktifkan Cap 'SCANNED COPY'"}
            </button>
          </div>

          <div className="content-grid two-thirds" style={{ marginTop: 12 }}>
            {/* Kiri: Preview Stempel & Email Penagihan TT Otomatis */}
            <div className="module-stack" style={{ gap: 12 }}>
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  borderRadius: 10,
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                }}
              >
                <span className="eyebrow" style={{ marginBottom: 10 }}>
                  SIMULASI CAP DIGITAL PADA DOKUMEN EKSPOR (PI / CI / PL / SI)
                </span>
                <div
                  style={{
                    border: "3px solid #dc2626",
                    borderRadius: 6,
                    padding: "8px 14px",
                    transform: "rotate(-5deg)",
                    color: "#dc2626",
                    background: "rgba(254, 242, 242, 0.85)",
                    margin: "8px 0 12px",
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, borderBottom: "1.5px solid #dc2626", paddingBottom: 2 }}>
                    OFFICIAL EXPORT DOCUMENT
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: 1.2, padding: "4px 0" }}>
                    SCANNED COPY
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 700, borderTop: "1.5px solid #dc2626", paddingTop: 2 }}>
                    NON-NEGOTIABLE · RELEASED FOR T/T SETTLEMENT
                  </div>
                </div>
                <small style={{ color: "#475569" }}>
                  Status pada tab Dokumen Ekspor:{" "}
                  <b style={{ color: shipment.includeScannedCopyStamp ? "#059669" : "#b45309" }}>
                    {shipment.includeScannedCopyStamp
                      ? "Aktif & Muncul Saat Cetak / PDF"
                      : "Belum Diaktifkan"}
                  </b>
                </small>
              </div>

              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  borderRadius: 10,
                  padding: 14,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span className="eyebrow">DRAF OTOMATIS EMAIL TAGIHAN PELUNASAN T/T</span>
                  <StatusPill tone="blue">Sinkron dengan Pricing</StatusPill>
                </div>
                <pre
                  style={{
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    fontFamily: "var(--font-sans)",
                    fontSize: 12,
                    lineHeight: 1.55,
                    color: "#1e293b",
                  }}
                >
                  {ttBillingEmailText}
                </pre>
              </div>
            </div>

            {/* Kanan: Kalkulator Tagihan TT & Kirim */}
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #cbd5e1",
                borderRadius: 10,
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                height: "fit-content",
              }}
            >
              <span className="eyebrow">RINCIAN SISA TAGIHAN PELUNASAN T/T</span>

              <label style={{ fontSize: 12, color: "#475569" }}>
                Persentase Uang Muka (DP Telah Diterima %)
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="ef-input-clean"
                  value={dpPercent}
                  onChange={(e) => setDpPercent(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                  style={{ marginTop: 4 }}
                />
              </label>

              <div className="module-stack" style={{ gap: 8, padding: "10px 0", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }}>
                <div className="clean-kv">
                  <span>Nilai Total ({shipment.incoterm})</span>
                  <b>{formatMoney(totalValue, shipment.currency)}</b>
                </div>
                <div className="clean-kv">
                  <span>Deposit Masuk ({dpPercent}%)</span>
                  <b style={{ color: "#059669" }}>- {formatMoney(dpPaid, shipment.currency)}</b>
                </div>
                <div className="clean-kv">
                  <span>Sisa Wajib Lunasi ({100 - dpPercent}%)</span>
                  <b style={{ color: "#0f2942", fontSize: 15 }}>
                    {formatMoney(balanceDue, shipment.currency)}
                  </b>
                </div>
              </div>

              <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.55 }}>
                <div>
                  Bank Penerima: <b>{shipment.bankName || "Bank Mandiri"}</b>
                </div>
                <div>
                  SWIFT: <b className="mono-code">{shipment.bankSwift || "BMRIIDJA"}</b> · Rek:{" "}
                  <b className="mono-code">{shipment.bankAccountNo || "152-00-9876543-2"}</b>
                </div>
                <div>
                  Email Buyer: <b>{shipment.buyerEmail || "(Belum diisi di Pra-Transaksi/Buyer)"}</b>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSendTtBilling}
                disabled={isEmailSending}
                className="save-button"
                style={{ width: "100%", justifyContent: "center" }}
              >
                <Send size={14} />{" "}
                {isEmailSending ? "Menyiapkan Tagihan..." : "Salin Draf Tagihan Pelunasan T/T"}
              </button>
              <a
                href={`mailto:${encodeURIComponent(shipment.buyerEmail || "")}?subject=${encodeURIComponent(
                  `T/T Balance Settlement & Scanned Copy Documents — ${shipment.reference || "Export"}`,
                )}&body=${encodeURIComponent(ttBillingEmailText)}`}
                className="ghost-button"
                style={{ width: "100%", justifyContent: "center", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <Mail size={14} /> Buka Tagihan di Email Client
              </a>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
