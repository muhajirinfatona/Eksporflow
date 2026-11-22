import { StatusPill } from "@/components/workspace/Primitives";
import type { WorkspaceFlow } from "@/hooks/useWorkspaceFlow";
import {
  buildAuditVaultSummary,
  type AuditVaultCustomDoc,
  type AuditVaultFolderId,
} from "@shared/exportCompliance";
import type { ScreenId } from "@shared/risk";
import type { Shipment } from "@shared/shipment";
import {
  CheckCircle2,
  Download,
  FilePlus2,
  FolderArchive,
  FolderOpen,
  Printer,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

interface AuditVaultModuleProps {
  shipment: Shipment;
  update: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void;
  flow: WorkspaceFlow;
  version: number;
  navigate: (screen: ScreenId) => void;
}

export function AuditVaultModule({
  shipment,
  update,
  flow,
  version,
  navigate,
}: AuditVaultModuleProps) {
  const [selectedFolder, setSelectedFolder] = useState<AuditVaultFolderId>("03_kepabeanan_lartas");
  const [docTitle, setDocTitle] = useState("");
  const [docNumber, setDocNumber] = useState("");

  const vault = useMemo(
    () =>
      buildAuditVaultSummary(shipment, {
        version,
        approvalStatus: flow.effectiveApprovalStatus,
        dpConfirmed: flow.finance.dpConfirmed,
        settlementConfirmed: flow.finance.settlementConfirmed,
      }),
    [shipment, version, flow.effectiveApprovalStatus, flow.finance.dpConfirmed, flow.finance.settlementConfirmed],
  );

  const customDocs = shipment.auditVaultDocs || [];

  const handleAddArchiveDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim()) {
      toast.error("Masukkan judul atau nama dokumen arsip terlebih dahulu.");
      return;
    }
    const newEntry: AuditVaultCustomDoc = {
      id: `vault_${Date.now()}`,
      folder: selectedFolder,
      title: docTitle.trim(),
      docNumber: docNumber.trim() || undefined,
      addedAt: new Date().toISOString().slice(0, 10),
      source: "manual",
    };
    update("auditVaultDocs", [...customDocs, newEntry]);
    setDocTitle("");
    setDocNumber("");
    toast.success("Dokumen Dicatat ke Brankas Audit DJBC", {
      description: `${newEntry.title} tersimpan dalam indeks folder siap pemeriksaan.`,
    });
  };

  const handleRemoveCustomDoc = (id: string) => {
    update(
      "auditVaultDocs",
      customDocs.filter((d) => d.id !== id),
    );
    toast.info("Catatan arsip manual dihapus dari brankas.");
  };

  const handleDownloadManifest = () => {
    const manifestPayload = {
      generatedAt: new Date().toISOString(),
      standard: "DJBC Export Audit Dossier · EksporFlow MVP",
      shipmentReference: shipment.reference || "Draft",
      exporter: shipment.exporter,
      buyer: shipment.buyer,
      destination: shipment.destination,
      hsCode: shipment.hsCode,
      revision: `v${version}`,
      readinessPercent: vault.readinessPercent,
      folders: vault.folders,
    };
    const blob = new Blob([JSON.stringify(manifestPayload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `DJBC-Audit-Vault-${(shipment.reference || "export").replace(/[^a-zA-Z0-9_-]/g, "_")}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Manifest Dossier Audit DJBC Diunduh", {
      description: "File JSON terstruktur siap dilampirkan pada arsip kepabeanan perusahaan.",
    });
  };

  const handlePrintDossier = () => {
    window.print();
  };

  return (
    <div className="module-stack" style={{ gap: 16 }}>
      {/* Hero Banner */}
      <section className="ef-module-hero">
        <div className="ef-module-hero-copy">
          <span className="eyebrow" style={{ color: "#fbbf24" }}>
            BRANKAS ARSIP DIGITAL SIAP AUDIT (DJBC COMPLIANCE)
          </span>
          <h2>Digital Audit Vault — Pengelompokan Dokumen Ekspor Terstruktur</h2>
          <p className="lead">
            Menggabungkan otomatis PO, riwayat revisi PI/SC/CI/PL, Sertifikat Karantina &amp; e-SKA,
            nomor PEB/NPE Bea Cukai, Shipping Instruction, Draft/Final B/L, serta bukti pelunasan T/T
            ke dalam 5 folder indeks siap audit kepabeanan dan pajak.
          </p>
          <div className="ef-hero-actions">
            <button type="button" className="ef-hero-btn-primary" onClick={handleDownloadManifest}>
              <Download size={15} /> Ekspor Manifest Audit (.JSON)
            </button>
            <button type="button" className="ef-hero-btn-ghost" onClick={handlePrintDossier}>
              <Printer size={15} /> Cetak Indeks Dossier
            </button>
            <button type="button" className="ef-hero-btn-ghost" onClick={() => navigate("documents")}>
              Lengkapi Dokumen Inti →
            </button>
          </div>
        </div>

        <div className="ef-hero-kpis">
          <div className="ef-hero-kpi-card">
            <span>KESIAPAN AUDIT DJBC</span>
            <strong>{vault.readinessPercent}%</strong>
            <small>
              {vault.readyCount} dari {vault.totalItems} bukti tersedia
            </small>
          </div>
          <div className="ef-hero-kpi-card">
            <span>REVISI TRANSAKSI AKTIF</span>
            <strong>v{version}</strong>
            <small>{shipment.reference || "Draft"}</small>
          </div>
        </div>
      </section>

      {/* Panel Tambah Arsip Khusus (PEB / NPE / Bukti PIB / B/L Final) */}
      <section className="panel panel-padding">
        <div className="panel-head">
          <div>
            <span className="eyebrow">INDEKS TAMBAHAN ARSIP KEPABEANAN</span>
            <h3>Catat Nomor Arsip PEB, NPE, Resi Bank, atau Dokumen Pendukung</h3>
          </div>
          <StatusPill tone={vault.readinessPercent >= 80 ? "green" : "amber"}>
            <ShieldCheck size={12} /> Indeks {vault.readinessPercent}% Siap Audit
          </StatusPill>
        </div>

        <form
          onSubmit={handleAddArchiveDoc}
          className="ef-form"
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1.4fr 1fr auto",
            gap: 10,
            alignItems: "end",
          }}
        >
          <label style={{ fontSize: 12, color: "#475569" }}>
            Folder Audit Tujuan
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value as AuditVaultFolderId)}
              style={{ marginTop: 4 }}
            >
              {vault.folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          <label style={{ fontSize: 12, color: "#475569" }}>
            Nama Dokumen (Contoh: NPE Jalur Hijau / Final Original B/L)
            <input
              type="text"
              placeholder="Contoh: PEB & NPE Persetujuan Muat DJBC"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              style={{ marginTop: 4 }}
            />
          </label>
          <label style={{ fontSize: 12, color: "#475569" }}>
            Nomor Referensi / Registrasi
            <input
              type="text"
              className="mono-code"
              placeholder="Contoh: PEB-040300-20260911"
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              style={{ marginTop: 4 }}
            />
          </label>
          <button type="submit" className="save-button" style={{ height: 38 }}>
            <FilePlus2 size={14} /> Simpan ke Vault
          </button>
        </form>
      </section>

      {/* 5 Structured DJBC Audit Folders */}
      <div className="module-stack" style={{ gap: 12 }}>
        {vault.folders.map((folder) => {
          const readyInFolder = folder.items.filter((i) => i.status === "Tersedia").length;
          return (
            <section key={folder.id} className="panel panel-padding">
              <div className="panel-head" style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      background: "#eff6ff",
                      color: "#0f2942",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    {readyInFolder === folder.items.length ? (
                      <FolderOpen size={17} />
                    ) : (
                      <FolderArchive size={17} />
                    )}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 14.5 }}>{folder.label}</h3>
                    <small style={{ color: "#64748b" }}>{folder.description}</small>
                  </div>
                </div>
                <StatusPill tone={readyInFolder === folder.items.length ? "green" : "amber"}>
                  {readyInFolder} / {folder.items.length} Lengkap
                </StatusPill>
              </div>

              <div className="module-stack" style={{ gap: 8 }}>
                {folder.items.map((item) => {
                  const isCustom = item.source === "Arsip Manual";
                  return (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                        padding: "10px 12px",
                        borderRadius: 8,
                        background: item.status === "Tersedia" ? "#f8fafc" : "#fffbeb",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <CheckCircle2
                          size={15}
                          style={{
                            marginTop: 2,
                            color: item.status === "Tersedia" ? "#10b981" : "#d97706",
                          }}
                        />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
                            {item.title}
                          </div>
                          <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>
                            <span className="mono-code">{item.reference}</span> · Sumber:{" "}
                            <b>{item.source}</b> · {item.timestamp}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <StatusPill tone={item.status === "Tersedia" ? "green" : "amber"}>
                          {item.status}
                        </StatusPill>
                        {isCustom && (
                          <button
                            type="button"
                            className="ghost-button"
                            style={{ padding: "4px 8px", color: "#dc2626" }}
                            title="Hapus item arsip manual ini"
                            onClick={() => handleRemoveCustomDoc(item.id)}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
