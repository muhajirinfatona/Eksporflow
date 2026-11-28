import { StatusPill } from "@/components/workspace/Primitives";
import {
  evaluatePermitExpiries,
  HS_REFERENCE_CATALOG,
  verifyHsCodeAndLartas,
  type ExportPermitRecord,
} from "@shared/exportCompliance";
import type { ScreenId } from "@shared/risk";
import type { Shipment } from "@shared/shipment";
import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  CheckCircle2,
  FileWarning,
  FolderArchive,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";

interface ComplianceLartasModuleProps {
  shipment: Shipment;
  update: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void;
  navigate: (screen: ScreenId) => void;
}

export function ComplianceLartasModule({
  shipment,
  update,
  navigate,
}: ComplianceLartasModuleProps) {
  const permits: ExportPermitRecord = shipment.exportPermits || {};

  const hsVerification = useMemo(
    () => verifyHsCodeAndLartas(shipment.product, shipment.hsCode, shipment.buyerCountry),
    [shipment.product, shipment.hsCode, shipment.buyerCountry],
  );

  const permitStatuses = useMemo(() => evaluatePermitExpiries(permits), [permits]);

  const criticalAlerts = permitStatuses.filter(
    (p) => p.severity === "expired" || p.severity === "expiring_soon",
  );

  const updatePermitField = (key: keyof ExportPermitRecord, value: string) => {
    update("exportPermits", {
      ...permits,
      [key]: value,
    });
  };

  const applyRecommendedHs = (code: string) => {
    update("hsCode", code);
    toast.success(`HS Code diperbarui ke ${code}`, {
      description: "Perubahan otomatis tersinkron ke seluruh dokumen & matriks pricing.",
    });
  };

  return (
    <div className="module-stack" style={{ gap: 16 }}>
      {/* Space DS Module Header */}
      <section className="ef-module-hero">
        <div className="ef-module-hero-copy">
          <span className="eyebrow" style={{ color: "var(--brand-primary)" }}>
            KEPATUHAN REGULASI &amp; LARTAS
          </span>
          <h2>Verifikasi HS Code &amp; Status Izin Ekspor</h2>
          <p className="lead">
            Validasi uraian barang terhadap BTKI, simulasi tarif preferensi FTA/CEPA, dan pantau masa berlaku izin kementerian teknis sebelum closing PEB.
          </p>
          <div className="ef-hero-actions">
            <button type="button" className="ef-hero-btn-primary" onClick={() => navigate("risk")}>
              Buka Risk Center H-7 <ArrowRight size={15} />
            </button>
            <button type="button" className="ef-hero-btn-ghost" onClick={() => navigate("audit_vault")}>
              <FolderArchive size={15} /> Buka Audit Vault DJBC
            </button>
          </div>
        </div>

        <div className="ef-hero-kpis">
          <div className="ef-hero-kpi-card">
            <span>STATUS HS &amp; LARTAS</span>
            <strong>
              {hsVerification.lartasStatus === "Bebas Ekspor (Non-Lartas)"
                ? "Non-Lartas"
                : hsVerification.lartasRequired
                  ? "Perlu Dokumen Lartas"
                  : "Cek Manual"}
            </strong>
            <small>{shipment.hsCode || "HS belum diisi"}</small>
          </div>
          <div className="ef-hero-kpi-card">
            <span>PERINGATAN IZIN (≤ 30 HARI)</span>
            <strong>{criticalAlerts.length} Item</strong>
            <small>
              {criticalAlerts.length > 0
                ? "Perlu perpanjangan sebelum stuffing"
                : "Tidak ada izin mendekati kedaluwarsa"}
            </small>
          </div>
        </div>
      </section>

      {/* Peringatan Dini Izin Mendekati Kadaluarsa */}
      {criticalAlerts.length > 0 && (
        <section
          className="panel panel-padding"
          style={{
            background: "#fffbeb",
            borderColor: "#f59e0b",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <BellRing size={18} style={{ color: "#d97706", marginTop: 2 }} />
            <div style={{ fontSize: 13, color: "#78350f" }}>
              <b>Peringatan Dini Masa Berlaku Sertifikat:</b>{" "}
              {criticalAlerts.map((a) => `${a.label} (${a.statusLabel})`).join(" · ")}. Segera ajukan
              pembaruan sebelum jadwal stuffing / closing PEB.
            </div>
          </div>
          <StatusPill tone="amber">{criticalAlerts.length} Perlu Perhatian</StatusPill>
        </section>
      )}

      {/* Grid Utama: Verifikator HS & Alternatif Tarif + Pelacak Izin */}
      <div className="content-grid two-thirds">
        {/* Panel Kiri: Verifikator HS Code & Lartas */}
        <section className="panel panel-padding">
          <div className="panel-head">
            <div>
              <span className="eyebrow">SIMULASI &amp; VERIFIKATOR BTKI</span>
              <h3>Pencocokan HS Code, Tarif FTA &amp; Persyaratan Lartas</h3>
            </div>
            <StatusPill tone={hsVerification.alignmentTone}>
              {hsVerification.alignmentStatus}
            </StatusPill>
          </div>

          <div className="form-grid two ef-form" style={{ marginBottom: 14 }}>
            <label>
              <span>Nama Komoditas Ekspor</span>
              <input
                type="text"
                value={shipment.product}
                onChange={(e) => update("product", e.target.value)}
                placeholder="Contoh: Organic Coconut Sugar / Kopi Arabika / Briket Arang"
              />
            </label>
            <label>
              <span>HS Code (BTKI 6–8 Digit)</span>
              <input
                type="text"
                className="mono-code"
                value={shipment.hsCode}
                onChange={(e) => update("hsCode", e.target.value)}
                placeholder="Contoh: 1702.90.91"
              />
            </label>
            <label>
              <span>Negara Tujuan Ekspor</span>
              <input
                type="text"
                value={shipment.buyerCountry}
                onChange={(e) => update("buyerCountry", e.target.value)}
                placeholder="Contoh: Swedia / Jepang / UEA"
              />
            </label>
            <label>
              <span>Preset Uji Cepat Komoditas Populer Indonesia</span>
              <select
                value={hsVerification.matchedEntry?.hsCode || ""}
                onChange={(e) => {
                  const chosen = HS_REFERENCE_CATALOG.find((c) => c.hsCode === e.target.value);
                  if (chosen) {
                    update("product", chosen.title.split("(")[0].trim());
                    update("hsCode", chosen.hsCode);
                  }
                }}
              >
                <option value="">-- Pilih Komoditas Referensi (Opsional) --</option>
                {HS_REFERENCE_CATALOG.map((entry) => (
                  <option key={entry.hsCode} value={entry.hsCode}>
                    {entry.hsCode} · {entry.category}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Hasil Analisis HS Code & Optimasi Legal */}
          <div className="module-stack" style={{ gap: 10 }}>
            <div
              style={{
                padding: 13,
                borderRadius: 10,
                background: "#f8fafc",
                border: "1px solid #cbd5e1",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <b style={{ fontSize: 13.5, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 }}>
                  <Scale size={15} style={{ color: "#0f2942" }} /> Klasifikasi &amp; Status Lartas
                </b>
                <StatusPill tone={hsVerification.lartasRequired ? "amber" : "green"}>
                  {hsVerification.lartasStatus}
                </StatusPill>
              </div>
              <p style={{ margin: "6px 0 8px", fontSize: 12.5, color: "#334155", lineHeight: 1.5 }}>
                {hsVerification.summaryNote}
              </p>
              <div style={{ fontSize: 12, color: "#0369a1", fontWeight: 600 }}>
                Tarif Negara Tujuan &amp; Preferensi FTA: {hsVerification.destinationDutyHint}
              </div>
            </div>

            {hsVerification.alternativeHsCode && (
              <div
                style={{
                  padding: 13,
                  borderRadius: 10,
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <b style={{ fontSize: 13, color: "#14532d", display: "flex", alignItems: "center", gap: 6 }}>
                    <Scale size={14} /> Tinjauan Klasifikasi Alternatif Legal ({hsVerification.alternativeHsCode})
                  </b>
                  {shipment.hsCode !== hsVerification.alternativeHsCode && (
                    <button
                      type="button"
                      className="table-inline-btn"
                      onClick={() => applyRecommendedHs(hsVerification.alternativeHsCode!)}
                    >
                      Pakai {hsVerification.alternativeHsCode}
                    </button>
                  )}
                </div>
                <p style={{ margin: "6px 0 4px", fontSize: 12.5, color: "#166534", lineHeight: 1.5 }}>
                  {hsVerification.alternativeReason}
                </p>
                {hsVerification.estimatedDutySavings && (
                  <small style={{ color: "#15803d", fontWeight: 600 }}>
                    Catatan Optimasi Legal: {hsVerification.estimatedDutySavings} (wajib konfirmasi
                    spek akhir bersama PPJK / INSW sebelum submit PEB).
                  </small>
                )}
              </div>
            )}

            <div
              style={{
                padding: 13,
                borderRadius: 10,
                background: "#ffffff",
                border: "1px solid #e2e8f0",
              }}
            >
              <span className="eyebrow" style={{ display: "block", marginBottom: 8 }}>
                DOKUMEN KEPATUHAN YANG PERLU DISIAPKAN
              </span>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: "#334155", lineHeight: 1.7 }}>
                {hsVerification.requiredPermits.map((doc) => (
                  <li key={doc}>{doc}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Panel Kanan: Masa Berlaku Izin & Early Warning */}
        <section className="panel panel-padding">
          <div className="panel-head">
            <div>
              <span className="eyebrow">PEMANTAU KEDALUWARSA IZIN</span>
              <h3>Karantina, e-SKA/COO, PE/SVLK &amp; Halal</h3>
            </div>
            <ShieldCheck size={18} style={{ color: "#0f2942" }} />
          </div>

          <p className="muted-note" style={{ marginBottom: 12 }}>
            Catat nomor dan tanggal kedaluwarsa izin ekspor Anda. Sistem memberi peringatan otomatis bila masa
            berlaku tinggal ≤ 30 hari:
          </p>

          <div className="module-stack ef-form" style={{ gap: 12 }}>
            {(
              [
                {
                  numKey: "quarantineNumber",
                  expKey: "quarantineExpiry",
                  label: "1. Sertifikat Karantina / Phytosanitary",
                  placeholder: "Contoh: KT-12/2026/MKS-991",
                },
                {
                  numKey: "cooNumber",
                  expKey: "cooExpiry",
                  label: "2. e-SKA / Certificate of Origin (COO)",
                  placeholder: "Contoh: e-SKA-ID-00412",
                },
                {
                  numKey: "lartasLicenseNumber",
                  expKey: "lartasExpiry",
                  label: "3. Izin Lartas / PE / V-Legal SVLK",
                  placeholder: "Contoh: SVLK-045/VL/2026",
                },
                {
                  numKey: "halalOrBpomNumber",
                  expKey: "halalOrBpomExpiry",
                  label: "4. Sertifikat Halal / BPOM / COA Lab",
                  placeholder: "Contoh: BPJPH-ID31110023",
                },
              ] as const
            ).map((item, idx) => {
              const statusItem = permitStatuses[idx];
              const badgeTone =
                statusItem.severity === "valid"
                  ? "green"
                  : statusItem.severity === "expiring_soon"
                    ? "amber"
                    : statusItem.severity === "expired"
                      ? "red"
                      : "blue";

              return (
                <div
                  key={item.numKey}
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    background:
                      statusItem.severity === "expired"
                        ? "#fef2f2"
                        : statusItem.severity === "expiring_soon"
                          ? "#fffbeb"
                          : "#f8fafc",
                    border: "1px solid #cbd5e1",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <b style={{ fontSize: 12.5, color: "#0f172a" }}>{item.label}</b>
                    <StatusPill tone={badgeTone}>
                      {statusItem.severity === "expired" || statusItem.severity === "expiring_soon" ? (
                        <AlertTriangle size={11} />
                      ) : statusItem.severity === "valid" ? (
                        <CheckCircle2 size={11} />
                      ) : (
                        <FileWarning size={11} />
                      )}
                      {statusItem.statusLabel}
                    </StatusPill>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 8 }}>
                    <label style={{ fontSize: 11.5, color: "#475569" }}>
                      Nomor Sertifikat / SK
                      <input
                        type="text"
                        placeholder={item.placeholder}
                        value={permits[item.numKey] || ""}
                        onChange={(e) => updatePermitField(item.numKey, e.target.value)}
                        style={{ marginTop: 4 }}
                      />
                    </label>
                    <label style={{ fontSize: 11.5, color: "#475569" }}>
                      Berlaku Sampai
                      <input
                        type="date"
                        value={permits[item.expKey] || ""}
                        onChange={(e) => updatePermitField(item.expKey, e.target.value)}
                        style={{ marginTop: 4 }}
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
