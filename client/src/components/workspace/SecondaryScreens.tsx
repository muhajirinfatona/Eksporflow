import type { PersistenceSaveState } from "@/hooks/useActiveShipment";
import { formatMoney, formatNumber } from "@shared/format";
import type { Pricing } from "@shared/pricing";
import type { ScreenId } from "@shared/risk";
import type { ContainerCalc, LineItem, Shipment } from "@shared/shipment";
import {
  ArrowUpRight,
  BarChart3,
  Box,
  Calculator,
  Check,
  ChevronRight,
  Download,
  FileCheck2,
  History,
  Package,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Ship,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  ChecklistItem,
  Field,
  MetricCard,
  QuickLink,
  RecommendationsPanel,
  StatusPill,
  TransactionProfile,
  TransactionStrip,
} from "./Primitives";

export function DashboardView({
  shipment,
  update,
  pricing,
  container,
  navigate,
}: {
  shipment: Shipment;
  update: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void;
  pricing: Pricing;
  container: ContainerCalc;
  navigate: (screen: ScreenId) => void;
}) {
  return (
    <>
      <TransactionStrip shipment={shipment} update={update} />
      <TransactionProfile shipment={shipment} update={update} />

      <div className="overview-grid">
        <section className="hero-card">
          <div className="hero-card-copy">
            <span className="eyebrow light">CURRENT QUOTE · {shipment.incoterm}</span>
            <h2>{formatMoney(pricing.active.offer, shipment.currency)}</h2>
            <p>
              Estimasi harga penawaran untuk{" "}
              <strong>
                {formatNumber(shipment.quantity)} {shipment.unit}
              </strong>{" "}
              {shipment.product.toLowerCase()} ke {shipment.destination}.
            </p>
            <div className="hero-meta">
              <span>
                <i className="tiny-dot mint" /> Target margin {shipment.margin}%
              </span>
              <span>
                <i className="tiny-dot saffron" /> {shipment.currency} · {shipment.formulaVersion}
              </span>
            </div>
          </div>
          <div className="hero-orbit">
            <div className="orbit-label">PER UNIT</div>
            <strong>{formatMoney(pricing.active.unit, shipment.currency)}</strong>
            <span>
              {shipment.incoterm} · {shipment.paymentTerms.split("/")[0]}
            </span>
          </div>
          <div className="hero-wave" />
        </section>

        <MetricCard
          label="COST TO SERVE"
          value={formatMoney(pricing.active.cost, shipment.currency)}
          detail={`${formatNumber((pricing.active.cost / Math.max(1, pricing.goods)) * 100, 1)}% dari nilai barang`}
          tone="cream"
          icon={<BarChart3 size={16} />}
        />
        <MetricCard
          label="ESTIMASI PROFIT"
          value={formatMoney(pricing.active.profit, shipment.currency)}
          detail={`${shipment.margin}% net margin`}
          tone="mint"
          icon={<ArrowUpRight size={16} />}
        />
        <MetricCard
          label="LOAD PLAN"
          value={`${container.volumeUtilization.toFixed(0)}%`}
          detail={`${container.containers} × ${shipment.containerType} · ${formatNumber(container.totalVolume, 1)} m³`}
          tone="sand"
          icon={<Box size={16} />}
        />
      </div>

      <div className="content-grid two-thirds">
        <section className="panel panel-padding">
          <div className="panel-head">
            <div>
              <span className="eyebrow">NEXT ACTIONS</span>
              <h3>Prioritas &amp; checklist hari ini</h3>
            </div>
            <button
              className="text-button"
              type="button"
              onClick={() => navigate("risk")}
            >
              Buka Risk Center <ChevronRight size={15} />
            </button>
          </div>
          <div className="checklist">
            <ChecklistItem
              done={Boolean(shipment.buyer.trim() && shipment.destination.trim())}
              label="Detail buyer & komoditas"
              meta={`${shipment.buyer} · HS ${shipment.hsCode || "belum diisi"}`}
              onClick={() => navigate("pricing")}
            />
            <ChecklistItem
              done={pricing.validationErrors.length === 0}
              label={`Kalkulasi harga ${shipment.incoterm}`}
              meta={`Margin ${shipment.margin}% · ${formatMoney(pricing.active.offer, shipment.currency)}`}
              onClick={() => navigate("pricing")}
            />
            <ChecklistItem
              done={container.volumeUtilization <= 100 && container.weightUtilization <= 100}
              label="Rencana muatan kontainer"
              meta={`${container.containers} × ${shipment.containerType} terestimasi`}
              onClick={() => navigate("cargo")}
            />
            <ChecklistItem
              done={shipment.documentReviewed}
              label="Review dokumen ekspor"
              meta={shipment.documentReviewed ? "Ditandai selesai review" : "4 draft dokumen siap diperiksa"}
              onClick={() => navigate("documents")}
            />
          </div>
        </section>

        <section className="panel panel-padding">
          <div className="panel-head">
            <div>
              <span className="eyebrow">QUICK ACCESS</span>
              <h3>Mulai dari sini</h3>
            </div>
            <Sparkles size={17} className="panel-spark" />
          </div>
          <div className="quick-links">
            <QuickLink
              icon={<Calculator size={17} />}
              title="Uji skenario harga"
              caption="Bandingkan 7 skenario Incoterms® 2020"
              onClick={() => navigate("pricing")}
            />
            <QuickLink
              icon={<FileCheck2 size={17} />}
              title="Siapkan dokumen ekspor"
              caption="Invoice, Packing List & B/L draft"
              onClick={() => navigate("documents")}
            />
            <QuickLink
              icon={<Ship size={17} />}
              title="Atur rencana muatan 3D"
              caption="Kemasan, pallet kayu, dan kapasitas"
              onClick={() => navigate("cargo")}
            />
          </div>
        </section>
      </div>

      <section className="panel panel-padding scenario-panel">
        <div className="panel-head">
          <div>
            <span className="eyebrow">SCENARIO SNAPSHOT</span>
            <h3>Bagaimana harga bergerak di tiap Incoterm?</h3>
          </div>
          <button className="text-button" type="button" onClick={() => navigate("pricing")}>
            Buka kalkulator <ChevronRight size={15} />
          </button>
        </div>
        <div className="scenario-table">
          <div className="scenario-row scenario-header">
            <span>TERM</span>
            <span>CAKUPAN</span>
            <span>TOTAL PENAWARAN</span>
            <span>DELTA DARI EXW</span>
            <span />
          </div>
          {pricing.scenarios.slice(0, 5).map((scenario, index) => (
            <div
              className={`scenario-row ${scenario.term === shipment.incoterm ? "selected" : ""}`}
              key={scenario.term}
            >
              <strong>{scenario.term}</strong>
              <span>
                {scenario.term === "EXW"
                  ? "Ex-works gudang eksportir"
                  : scenario.term === "FCA"
                    ? "Serah ke pengangkut pertama"
                    : scenario.term === "FOB"
                      ? "Muat di atas kapal (on board)"
                      : scenario.term === "CFR"
                        ? "Termasuk ocean freight"
                        : "Termasuk freight + insurance"}
              </span>
              <b>{formatMoney(scenario.offer, shipment.currency)}</b>
              <span className={index === 0 ? "muted-delta" : "positive-delta"}>
                {index === 0
                  ? "Basis"
                  : `+${formatMoney(scenario.offer - pricing.scenarios[0].offer, shipment.currency)}`}
              </span>
              <span>
                {scenario.term === shipment.incoterm && <StatusPill tone="amber">Aktif</StatusPill>}
              </span>
            </div>
          ))}
        </div>
      </section>

      <RecommendationsPanel
        shipment={shipment}
        pricing={pricing}
        container={container}
        navigate={navigate}
      />
    </>
  );
}

export function ReadinessView({
  shipment,
  update,
  navigate,
}: {
  shipment: Shipment;
  update: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void;
  navigate: (screen: ScreenId) => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [experience, setExperience] = useState("Pernah 1–3 kali");
  const [certReady, setCertReady] = useState(false);

  const score =
    (shipment.product.trim() ? 25 : 0) +
    (shipment.hsCode.trim() ? 20 : 0) +
    (shipment.buyerCountry.trim() ? 20 : 0) +
    (shipment.packaging > 0 ? 15 : 0) +
    (certReady ? 20 : 0);

  return (
    <div className="module-stack">
      <section className="panel panel-padding">
        <div className="clean-tabs">
          {[
            [1, "1 · Produk"],
            [2, "2 · Pasar tujuan"],
            [3, "3 · Operasional"],
            [4, "4 · Rencana kerja"],
          ].map(([num, label]) => (
            <button
              key={num}
              type="button"
              className={step === num ? "active" : ""}
              onClick={() => setStep(num as 1 | 2 | 3 | 4)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="content-grid two-thirds" style={{ marginTop: 14, marginBottom: 0 }}>
          <div className="form-grid two">
            <Field
              label="Produk yang diekspor"
              value={shipment.product}
              onChange={(v) => update("product", v)}
            />
            <Field
              label="HS Code referensi"
              value={shipment.hsCode}
              onChange={(v) => update("hsCode", v)}
            />
            <Field
              label="Negara tujuan target"
              value={shipment.buyerCountry}
              onChange={(v) => update("buyerCountry", v)}
            />
            <Field
              label="Pengalaman ekspor tim"
              value={experience}
              onChange={setExperience}
            />
            <label className="legal-check-row" style={{ gridColumn: "1 / -1" }}>
              <input
                type="checkbox"
                checked={certReady}
                onChange={(e) => setCertReady(e.target.checked)}
              />
              <span>
                <b>Dokumen mutu / COO / sertifikat pendukung sudah dipetakan</b>
                <small>Tandai bila daftar persyaratan dari buyer atau broker sudah dikonfirmasi.</small>
              </span>
            </label>
          </div>

          <div className="panel panel-padding" style={{ background: "#fbfcfa" }}>
            <span className="eyebrow">INDIKATOR AWAL</span>
            <h3 style={{ fontSize: 28, margin: "6px 0" }}>
              {score} <small style={{ fontSize: 13, color: "#78818d" }}>/ 100 · indikatif</small>
            </h3>
            <div className="progress-track" style={{ margin: "10px 0 14px" }}>
              <i style={{ width: `${score}%` }} />
            </div>
            <div className="clean-kv">
              <span>Spesifikasi produk &amp; HS Code</span>
              <StatusPill tone={shipment.product && shipment.hsCode ? "green" : "amber"}>
                {shipment.product && shipment.hsCode ? "Terisi" : "Lengkapi"}
              </StatusPill>
            </div>
            <div className="clean-kv">
              <span>Negara &amp; pelabuhan tujuan</span>
              <StatusPill tone={shipment.buyerCountry ? "green" : "amber"}>
                {shipment.buyerCountry ? shipment.buyerCountry : "Perlu isi"}
              </StatusPill>
            </div>
            <div className="clean-notice warn" style={{ marginTop: 12 }}>
              Asesmen ini panduan kesiapan awal, bukan penetapan kepatuhan hukum atau izin ekspor resmi.
            </div>
          </div>
        </div>
      </section>

      <div className="content-grid two-thirds">
        <section className="panel panel-padding">
          <div className="panel-head">
            <div>
              <span className="eyebrow">WORKPLAN</span>
              <h3>Rencana kerja persiapan ekspor</h3>
            </div>
          </div>
          <div className="clean-table-wrap">
            <table className="clean-table">
              <thead>
                <tr>
                  <th>Langkah Persiapan</th>
                  <th>Pemilik</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <b>Lengkapi spesifikasi kemasan &amp; dimensi produk</b>
                  </td>
                  <td>Operasional</td>
                  <td>
                    <StatusPill tone={shipment.cartonLength > 0 ? "green" : "amber"}>
                      {shipment.cartonLength > 0 ? "Siap" : "To do"}
                    </StatusPill>
                  </td>
                </tr>
                <tr>
                  <td>
                    <b>Konfirmasi HS Code {shipment.hsCode || "—"} dengan PPJK / bea cukai</b>
                  </td>
                  <td>Compliance</td>
                  <td>
                    <StatusPill tone="amber">Verifikasi ahli</StatusPill>
                  </td>
                </tr>
                <tr>
                  <td>
                    <b>Hitung struktur biaya Incoterm {shipment.incoterm}</b>
                  </td>
                  <td>Sales</td>
                  <td>
                    <StatusPill tone="blue">Buka Harga &amp; Order</StatusPill>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel panel-padding">
          <span className="eyebrow">NEXT STEP</span>
          <h3 style={{ margin: "6px 0 8px" }}>Lanjutkan ke workspace</h3>
          <p className="profile-description" style={{ marginBottom: 14 }}>
            Gunakan AI Advisor untuk memetakan pertanyaan dokumen pasar tujuan, atau langsung susun quotation.
          </p>
          <div className="row-actions">
            <button type="button" className="save-button" onClick={() => navigate("pricing")}>
              Susun Harga &amp; Order
            </button>
            <button type="button" className="ghost-button" onClick={() => navigate("advisor")}>
              Tanya AI Advisor
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export function ApprovalsView({
  shipment,
  pricing,
  navigate,
}: {
  shipment: Shipment;
  pricing: Pricing;
  navigate: (screen: ScreenId) => void;
}) {
  const [comment, setComment] = useState("");
  const [decisionState, setDecisionState] = useState<"Menunggu review" | "Revisi diminta" | "Dicatat internal">(
    "Menunggu review",
  );

  const handleDecision = (next: "Revisi diminta" | "Dicatat internal") => {
    if (next === "Revisi diminta" && !comment.trim()) {
      toast.error("Komentar reviewer wajib diisi untuk meminta revisi.");
      return;
    }
    setDecisionState(next);
    toast.success(`Status review: ${next}`, {
      description: "Pada rilis P1 server-side, persetujuan di atas threshold wajib dilakukan oleh user berbeda.",
    });
  };

  return (
    <div className="content-grid two-thirds">
      <section className="panel panel-padding">
        <div className="panel-head">
          <div>
            <span className="eyebrow">SALES · REVIEW &amp; CONTROL</span>
            <h3>Antrian persetujuan perubahan material</h3>
          </div>
          <StatusPill tone="amber">{decisionState}</StatusPill>
        </div>
        <div className="clean-table-wrap">
          <table className="clean-table">
            <thead>
              <tr>
                <th>Referensi</th>
                <th>Jenis</th>
                <th>Nilai Penawaran</th>
                <th>Margin</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="active-row">
                <td>
                  <b>
                    {shipment.reference} · Rev R{shipment.documentRevision}
                  </b>
                  <span className="row-sub">{shipment.buyer}</span>
                </td>
                <td>Quotation {shipment.incoterm}</td>
                <td>
                  <b>{formatMoney(pricing.active.offer, shipment.currency)}</b>
                </td>
                <td>{shipment.margin}%</td>
                <td>
                  <StatusPill tone={decisionState === "Dicatat internal" ? "green" : "amber"}>
                    {decisionState}
                  </StatusPill>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="clean-notice warn" style={{ marginTop: 14 }}>
          <b>Guardrail Pemisahan Tugas:</b> Approver wajib berbeda dari pemohon ketika nilai transaksi atau diskon melewati threshold organisasi.
        </div>
      </section>

      <section className="panel panel-padding">
        <span className="eyebrow">DETAIL SNAPSHOT · {shipment.reference}</span>
        <h3 style={{ margin: "6px 0 12px" }}>Ringkasan yang ditinjau</h3>
        <div className="clean-kv">
          <span>Incoterm &amp; Named Place</span>
          <b>
            {shipment.incoterm} · {shipment.namedPlace}
          </b>
        </div>
        <div className="clean-kv">
          <span>Cost to serve + contingency</span>
          <b>{formatMoney(pricing.active.cost, shipment.currency)}</b>
        </div>
        <div className="clean-kv">
          <span>Harga jual penawaran</span>
          <b>{formatMoney(pricing.active.offer, shipment.currency)}</b>
        </div>
        <div style={{ marginTop: 12 }}>
          <Field
            label="Catatan reviewer (wajib bila meminta revisi)"
            value={comment}
            onChange={setComment}
          />
        </div>
        <div className="row-actions" style={{ marginTop: 14 }}>
          <button
            type="button"
            className="ghost-button"
            onClick={() => handleDecision("Revisi diminta")}
          >
            Minta Revisi
          </button>
          <button
            type="button"
            className="save-button"
            onClick={() => handleDecision("Dicatat internal")}
          >
            Catat Review Internal
          </button>
          <button type="button" className="ghost-button" onClick={() => navigate("pricing")}>
            Buka Harga
          </button>
        </div>
      </section>
    </div>
  );
}

export function KnowledgeView({ navigate }: { navigate: (screen: ScreenId) => void }) {
  const [filter, setFilter] = useState<"ALL" | "Published" | "In review">("ALL");
  const sources = [
    {
      title: "SOP Dokumen Ekspor & Pemeriksaan 3-Way",
      scope: "Organisasi · Global",
      version: "v2.1 · Berlaku s/d Jan 2027",
      governance: "Rina → Dimas (Compliance)",
      status: "Published" as const,
    },
    {
      title: "Checklist Freight Booking & Cut-Off Pelabuhan",
      scope: "Organisasi · Operasional",
      version: "v1.4 · Review Des 2026",
      governance: "Bayu → Sari",
      status: "In review" as const,
    },
    {
      title: "Panduan Label Pangan Pasar Eropa / Nordik",
      scope: "Uni Eropa · Food Grade",
      version: "v3.0 · Berlaku s/d Jun 2027",
      governance: "Admin → Dimas",
      status: "Published" as const,
    },
  ];
  const visible = sources.filter((s) => filter === "ALL" || s.status === filter);

  return (
    <div className="module-stack">
      <div className="content-grid two-thirds">
        <section className="panel panel-padding">
          <div className="panel-head">
            <div>
              <span className="eyebrow">ADVISOR · GOVERNANCE SUMBER</span>
              <h3>Daftar pengetahuan tim</h3>
            </div>
            <button type="button" className="ghost-button" onClick={() => navigate("advisor")}>
              Buka AI Advisor
            </button>
          </div>
          <div className="clean-tabs" style={{ marginBottom: 12 }}>
            {(["ALL", "Published", "In review"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                className={filter === tab ? "active" : ""}
                onClick={() => setFilter(tab)}
              >
                {tab === "ALL" ? "Semua (3)" : tab}
              </button>
            ))}
          </div>
          <div className="clean-table-wrap">
            <table className="clean-table">
              <thead>
                <tr>
                  <th>Judul Sumber</th>
                  <th>Scope</th>
                  <th>Versi &amp; Masa Berlaku</th>
                  <th>Uploader → Reviewer</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <tr key={row.title}>
                    <td>
                      <b>{row.title}</b>
                    </td>
                    <td>{row.scope}</td>
                    <td>{row.version}</td>
                    <td>{row.governance}</td>
                    <td>
                      <StatusPill tone={row.status === "Published" ? "green" : "amber"}>
                        {row.status}
                      </StatusPill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel panel-padding">
          <span className="eyebrow">ATURAN TATA KELOLA</span>
          <h3 style={{ margin: "6px 0 10px" }}>Kontrol kualitas rujukan AI</h3>
          <div className="guardrail-list">
            <div>
              <b>Hanya sumber Published yang dipakai Advisor</b>
              <p>Dokumen berstatus Draft atau Expired tidak disertakan sebagai rujukan aktif.</p>
            </div>
            <div>
              <b>Uploader berbeda dari reviewer</b>
              <p>Setiap pedoman internal wajib memiliki tanggal kedaluwarsa dan penanggung jawab review.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

type PartnerEntry = {
  name: string;
  country: string;
  destination: string;
  terms: string;
};

export function PartnersView({
  shipment,
  update,
  navigate,
}: {
  shipment: Shipment;
  update: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void;
  navigate: (screen: ScreenId) => void;
}) {
  const [customBuyers, setCustomBuyers] = useState<PartnerEntry[]>([
    {
      name: "Nordic Pantry AB",
      country: "Swedia",
      destination: "Gothenburg, Swedia",
      terms: "30% DP / 70% before shipment",
    },
    {
      name: "Global Foods Sdn Bhd",
      country: "Malaysia",
      destination: "Port Klang, Malaysia",
      terms: "T/T 30% advance / 70% copy B/L",
    },
    {
      name: "Baltic Organics OÜ",
      country: "Estonia",
      destination: "Tallinn, Estonia",
      terms: "50% DP / 50% before shipment",
    },
    {
      name: "Kyoto Trading Co.",
      country: "Jepang",
      destination: "Osaka, Jepang",
      terms: "Irrevocable L/C at sight",
    },
  ]);
  const [newName, setNewName] = useState("");
  const [newCountry, setNewCountry] = useState("");
  const [newDest, setNewDest] = useState("");

  const applyBuyer = (buyer: PartnerEntry) => {
    update("buyer", buyer.name);
    update("buyerCountry", buyer.country);
    update("destination", buyer.destination);
    update("paymentTerms", buyer.terms);
    toast.success("Buyer diterapkan ke transaksi aktif", {
      description: `${buyer.name} kini terhubung ke ${shipment.reference}.`,
    });
  };

  const addPartner = () => {
    if (!newName.trim() || !newCountry.trim()) {
      toast.error("Isi minimal nama perusahaan dan negara buyer.");
      return;
    }
    const entry: PartnerEntry = {
      name: newName.trim(),
      country: newCountry.trim(),
      destination: newDest.trim() || newCountry.trim(),
      terms: "30% DP / 70% before shipment",
    };
    setCustomBuyers((prev) => [entry, ...prev]);
    setNewName("");
    setNewCountry("");
    setNewDest("");
    toast.success("Mitra ditambahkan ke direktori sesi ini");
  };

  return (
    <div className="module-stack">
      <div className="content-grid two-thirds">
        <section className="panel panel-padding">
          <div className="panel-head">
            <div>
              <span className="eyebrow">DATA UTAMA · BUYER &amp; KONTAK</span>
              <h3>Direktori mitra transaksi</h3>
              <p className="profile-description">
                Pilih mitra agar nama, negara, tujuan, dan terms pembayaran mengisi transaksi aktif secara konsisten.
              </p>
            </div>
            <button type="button" className="ghost-button" onClick={() => navigate("transactions")}>
              Lihat Transaksi
            </button>
          </div>
          <div className="master-list">
            {customBuyers.map((buyer) => (
              <div
                className={`master-card ${buyer.name === shipment.buyer ? "selected" : ""}`}
                key={buyer.name}
              >
                <div className="master-card-icon">
                  <UserRound size={16} />
                </div>
                <div>
                  <b>{buyer.name}</b>
                  <small>
                    {buyer.country} · {buyer.destination}
                  </small>
                  <em>{buyer.terms}</em>
                </div>
                <button type="button" onClick={() => applyBuyer(buyer)}>
                  {buyer.name === shipment.buyer ? "Sedang Dipakai" : "Pakai di Transaksi"}
                </button>
              </div>
            ))}
          </div>
          <div className="clean-notice" style={{ marginTop: 12 }}>
            Profil master data tidak menilai apakah buyer aman. Bukti PO dan screening ditampilkan terpisah pada Risk Center.
          </div>
        </section>

        <section className="panel panel-padding">
          <span className="eyebrow">TAMBAH MITRA CEPAT</span>
          <h3 style={{ margin: "6px 0 12px" }}>Profil buyer baru</h3>
          <div className="module-stack" style={{ gap: 10 }}>
            <Field label="Nama legal perusahaan" value={newName} onChange={setNewName} />
            <Field label="Negara" value={newCountry} onChange={setNewCountry} />
            <Field label="Kota / pelabuhan tujuan" value={newDest} onChange={setNewDest} />
            <button type="button" className="save-button" onClick={addPartner}>
              <Plus size={14} /> Simpan ke Direktori
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

type CatalogProduct = {
  name: string;
  sku: string;
  hsCode: string;
  unit: string;
  unitPrice: number;
  packagingType: string;
  weight: number;
};

export function ProductsView({
  shipment,
  updateLineItems,
  navigate,
}: {
  shipment: Shipment;
  updateLineItems: (items: LineItem[]) => void;
  navigate: (screen: ScreenId) => void;
}) {
  const [catalog, setCatalog] = useState<CatalogProduct[]>([
    {
      name: "Organic Coconut Sugar",
      sku: "CS-01",
      hsCode: "1702.90",
      unit: "carton",
      unitPrice: 18.5,
      packagingType: "Karton box",
      weight: 12,
    },
    {
      name: "Java Robusta Green Bean",
      sku: "RC-03",
      hsCode: "0901.11",
      unit: "bag",
      unitPrice: 145,
      packagingType: "Karung goni",
      weight: 60,
    },
    {
      name: "Cassia Cinnamon Powder",
      sku: "CP-02",
      hsCode: "0906.20",
      unit: "carton",
      unitPrice: 32,
      packagingType: "Karton box",
      weight: 10,
    },
  ]);

  const [prodName, setProdName] = useState("");
  const [prodHs, setProdHs] = useState("");
  const [prodPrice, setProdPrice] = useState("20");

  const addToActiveTransaction = (prod: CatalogProduct) => {
    const base = shipment.lineItems[0];
    const nextItem: LineItem = {
      ...base,
      id: `item-${Date.now()}`,
      description: prod.name,
      hsCode: prod.hsCode,
      quantity: 100,
      unit: prod.unit,
      unitPrice: prod.unitPrice,
      packagingType: prod.packagingType,
      weight: prod.weight,
    };
    updateLineItems([...shipment.lineItems, nextItem]);
    toast.success(`${prod.name} ditambahkan ke line items`, {
      description: "Anda dapat menyesuaikan quantity di halaman Harga & Order atau Rencana Muatan.",
    });
  };

  const createCatalogItem = () => {
    if (!prodName.trim()) {
      toast.error("Nama produk wajib diisi.");
      return;
    }
    setCatalog((prev) => [
      {
        name: prodName.trim(),
        sku: `SKU-${prev.length + 1}`,
        hsCode: prodHs.trim(),
        unit: "carton",
        unitPrice: Math.max(0, Number(prodPrice) || 0),
        packagingType: "Karton box",
        weight: 12,
      },
      ...prev,
    ]);
    setProdName("");
    setProdHs("");
    toast.success("Produk ditambahkan ke katalog sesi ini");
  };

  return (
    <div className="module-stack">
      <div className="content-grid two-thirds">
        <section className="panel panel-padding">
          <div className="panel-head">
            <div>
              <span className="eyebrow">DATA UTAMA · SPESIFIKASI PRODUK</span>
              <h3>Katalog produk ekspor</h3>
              <p className="profile-description">
                Spesifikasi standar memudahkan pembuatan quote; setiap transaksi tetap menyimpan snapshot revisinya sendiri.
              </p>
            </div>
            <button type="button" className="ghost-button" onClick={() => navigate("pricing")}>
              Buka Harga &amp; Order
            </button>
          </div>
          <div className="master-list">
            {catalog.map((prod) => (
              <div className="master-card" key={prod.sku + prod.name}>
                <div className="master-card-icon product">
                  <Package size={16} />
                </div>
                <div>
                  <b>
                    {prod.name} · {prod.sku}
                  </b>
                  <small>
                    HS ref. {prod.hsCode || "belum diisi"}* · {prod.packagingType} ({prod.weight} kg)
                  </small>
                  <em>
                    {formatMoney(prod.unitPrice, shipment.currency)} / {prod.unit}
                  </em>
                </div>
                <button type="button" onClick={() => addToActiveTransaction(prod)}>
                  + Tambah ke Transaksi
                </button>
              </div>
            ))}
          </div>
          <div className="clean-notice warn" style={{ marginTop: 12 }}>
            *HS Code hanya referensi input dan wajib dikonfirmasi dengan PPJK/bea cukai yang berwenang. Sistem tidak melakukan klasifikasi resmi otomatis.
          </div>
        </section>

        <section className="panel panel-padding">
          <span className="eyebrow">TAMBAH SPESIFIKASI</span>
          <h3 style={{ margin: "6px 0 12px" }}>Produk baru</h3>
          <div className="module-stack" style={{ gap: 10 }}>
            <Field label="Nama produk" value={prodName} onChange={setProdName} />
            <Field label="HS Code referensi" value={prodHs} onChange={setProdHs} />
            <Field
              label="Harga referensi"
              type="number"
              prefix={shipment.currency}
              value={prodPrice}
              onChange={setProdPrice}
            />
            <button type="button" className="save-button" onClick={createCatalogItem}>
              <Plus size={14} /> Tambah ke Katalog
            </button>
          </div>
        </section>
      </div>

      <section className="panel panel-padding">
        <div className="governance-grid">
          <div>
            <Check size={15} />
            <span>
              <b>Satu sumber data</b>
              <small>Line item produk langsung mengalir ke invoice, Packing List, dan simulasi 3D.</small>
            </span>
          </div>
          <div>
            <ShieldAlert size={15} />
            <span>
              <b>Verifikasi klasifikasi</b>
              <small>Tarif bea masuk tujuan bergantung pada konfirmasi resmi broker/customs.</small>
            </span>
          </div>
          <div>
            <History size={15} />
            <span>
              <b>Snapshot terisolasi</b>
              <small>Perubahan katalog di masa depan tidak menimpa dokumen shipment lama.</small>
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

export function FinanceView({
  shipment,
  pricing,
  navigate,
}: {
  shipment: Shipment;
  pricing: Pricing;
  navigate: (screen: ScreenId) => void;
}) {
  return (
    <div className="module-stack">
      <div className="clean-notice">
        <div>
          <b>Kontrol Akuntansi Inti (Fase P2):</b> Commercial Invoice perdagangan tidak membuat jurnal pendapatan otomatis. Pengakuan piutang/pendapatan memerlukan verifikasi dokumen dan persetujuan Finance.
        </div>
      </div>

      <div className="clean-grid-4">
        <section className="panel panel-padding clean-stat-card">
          <span className="eyebrow">NILAI QUOTE AKTIF</span>
          <strong>{formatMoney(pricing.active.offer, shipment.currency)}</strong>
          <small>{shipment.reference} · {shipment.buyer}</small>
        </section>
        <section className="panel panel-padding clean-stat-card">
          <span className="eyebrow">ESTIMASI BIAYA</span>
          <strong>{formatMoney(pricing.active.cost, shipment.currency)}</strong>
          <small>Termasuk contingency {shipment.contingency}%</small>
        </section>
        <section className="panel panel-padding clean-stat-card">
          <span className="eyebrow">TERMS PEMBAYARAN</span>
          <strong style={{ fontSize: 17 }}>{shipment.paymentTerms}</strong>
          <small>Kورس ref. IDR {formatNumber(shipment.exchangeRate)}</small>
        </section>
        <section className="panel panel-padding clean-stat-card">
          <span className="eyebrow">STATUS LEDGER</span>
          <strong style={{ fontSize: 18 }}>Pratinjau P2</strong>
          <small>Terhubung ke Rekonsiliasi &amp; Jurnal</small>
        </section>
      </div>

      <div className="content-grid two-thirds">
        <section className="panel panel-padding">
          <div className="panel-head">
            <div>
              <span className="eyebrow">ACCOUNTS RECEIVABLE · SIMULASI</span>
              <h3>Rencana tagihan transaksi aktif</h3>
            </div>
          </div>
          <div className="clean-table-wrap">
            <table className="clean-table">
              <thead>
                <tr>
                  <th>Transaksi / Buyer</th>
                  <th>Dokumen</th>
                  <th>Nilai</th>
                  <th>Tahap Operasional</th>
                  <th>Status Akuntansi</th>
                </tr>
              </thead>
              <tbody>
                <tr className="active-row">
                  <td>
                    <b>{shipment.reference}</b>
                    <span className="row-sub">{shipment.buyer}</span>
                  </td>
                  <td>CI-{shipment.reference}</td>
                  <td>
                    <b>{formatMoney(pricing.active.offer, shipment.currency)}</b>
                  </td>
                  <td>{shipment.shipmentStatus}</td>
                  <td>
                    <StatusPill tone="amber">Menunggu posting Finance</StatusPill>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel panel-padding">
          <span className="eyebrow">MODUL TERKAIT</span>
          <h3 style={{ margin: "6px 0 12px" }}>Alur keuangan ekspor</h3>
          <div className="quick-links">
            <QuickLink
              icon={<BarChart3 size={16} />}
              title="Rekonsiliasi Bank"
              caption="Cocokkan mutasi masuk DP / pelunasan"
              onClick={() => navigate("bank")}
            />
            <QuickLink
              icon={<FileCheck2 size={16} />}
              title="Jurnal & Bagan Akun"
              caption="Double-entry seimbang & reversal"
              onClick={() => navigate("journals")}
            />
            <QuickLink
              icon={<ArrowUpRight size={16} />}
              title="Laporan & Analitik Margin"
              caption="Bandingkan estimasi quote vs aktual"
              onClick={() => navigate("reports")}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

export function BankView({
  shipment,
  pricing,
}: {
  shipment: Shipment;
  pricing: Pricing;
}) {
  const dpEstimate = pricing.active.offer * 0.3;
  return (
    <div className="module-stack">
      <div className="clean-notice warn">
        Saran pencocokan mutasi bank bersifat bantu; sistem tidak memposting jurnal otomatis sampai dikonfirmasi oleh tim Finance.
      </div>
      <div className="content-grid two-thirds">
        <section className="panel panel-padding">
          <span className="eyebrow">P2 · BANK MATCHING</span>
          <h3 style={{ margin: "6px 0 12px" }}>Simulasi pencocokan pembayaran masuk</h3>
          <div className="clean-table-wrap">
            <table className="clean-table">
              <thead>
                <tr>
                  <th>Referensi Bank</th>
                  <th>Deskripsi Mutasi</th>
                  <th>Nilai Masuk</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>TRX-DP-{shipment.reference}</td>
                  <td>Incoming Remittance · {shipment.buyer} (est. 30% DP)</td>
                  <td>
                    <b>{formatMoney(dpEstimate, shipment.currency)}</b>
                  </td>
                  <td>
                    <StatusPill tone="amber">Menunggu konfirmasi</StatusPill>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel panel-padding">
          <span className="eyebrow">KURS &amp; SELISIH</span>
          <h3 style={{ margin: "6px 0 12px" }}>Parameter transaksi aktif</h3>
          <div className="clean-kv">
            <span>Total Penawaran</span>
            <b>{formatMoney(pricing.active.offer, shipment.currency)}</b>
          </div>
          <div className="clean-kv">
            <span>Estimasi Uang Muka (30%)</span>
            <b>{formatMoney(dpEstimate, shipment.currency)}</b>
          </div>
          <div className="clean-kv">
            <span>Kurs Referensi Quote</span>
            <b>
              IDR {formatNumber(shipment.exchangeRate)} · {shipment.exchangeRateDate}
            </b>
          </div>
        </section>
      </div>
    </div>
  );
}

export function JournalsView({
  shipment,
  pricing,
}: {
  shipment: Shipment;
  pricing: Pricing;
}) {
  return (
    <div className="module-stack">
      <div className="content-grid two-thirds">
        <section className="panel panel-padding">
          <span className="eyebrow">P2 · LEDGER CONTROL</span>
          <h3 style={{ margin: "6px 0 12px" }}>Pratinjau struktur jurnal double-entry</h3>
          <div className="clean-table-wrap">
            <table className="clean-table">
              <thead>
                <tr>
                  <th>Akun</th>
                  <th>Posisi</th>
                  <th>Nilai ({shipment.currency})</th>
                  <th>Sumber</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <b>1100 · Piutang Usaha Ekspor</b>
                  </td>
                  <td>Debit</td>
                  <td>{formatMoney(pricing.active.offer, shipment.currency)}</td>
                  <td>Draft CI-{shipment.reference}</td>
                </tr>
                <tr>
                  <td>
                    <b>4100 · Penjualan Ekspor</b>
                  </td>
                  <td>Kredit</td>
                  <td>{formatMoney(pricing.active.offer, shipment.currency)}</td>
                  <td>Draft CI-{shipment.reference}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="clean-notice" style={{ marginTop: 12 }}>
            Debit = Kredit seimbang. Pada ledger P2 penuh, jurnal berstatus Posted bersifat immutable dan hanya dapat dikoreksi melalui jurnal pembalik (reversal) ber-audit log.
          </div>
        </section>

        <section className="panel panel-padding">
          <span className="eyebrow">BAGAN AKUN STANDAR EKSPOR</span>
          <h3 style={{ margin: "6px 0 12px" }}>Kelompok akun utama</h3>
          <div className="clean-kv">
            <span>1000 · Aset</span>
            <b>Bank Valas · Piutang Ekspor</b>
          </div>
          <div className="clean-kv">
            <span>2000 · Liabilitas</span>
            <b>Utang Forwarder · Uang Muka Buyer</b>
          </div>
          <div className="clean-kv">
            <span>4000 · Pendapatan</span>
            <b>Penjualan Barang Ekspor</b>
          </div>
          <div className="clean-kv">
            <span>5000 · Beban Pokok &amp; Logistik</span>
            <b>HPP · Ocean Freight · Kepabeanan</b>
          </div>
        </section>
      </div>
    </div>
  );
}

export function ReportsView({
  shipment,
  pricing,
}: {
  shipment: Shipment;
  pricing: Pricing;
}) {
  return (
    <div className="module-stack">
      <div className="clean-grid-4">
        <section className="panel panel-padding clean-stat-card">
          <span className="eyebrow">NILAI BARANG</span>
          <strong>{formatMoney(pricing.goods, shipment.currency)}</strong>
          <small>{formatNumber(pricing.totalQuantity)} unit total</small>
        </section>
        <section className="panel panel-padding clean-stat-card">
          <span className="eyebrow">ESTIMASI COST TO SERVE</span>
          <strong>{formatMoney(pricing.active.cost, shipment.currency)}</strong>
          <small>Incoterm {shipment.incoterm}</small>
        </section>
        <section className="panel panel-padding clean-stat-card">
          <span className="eyebrow">HARGA PENAWARAN</span>
          <strong>{formatMoney(pricing.active.offer, shipment.currency)}</strong>
          <small>Diskon {formatMoney(shipment.discount, shipment.currency)}</small>
        </section>
        <section className="panel panel-padding clean-stat-card">
          <span className="eyebrow">ESTIMASI MARGIN BERSIH</span>
          <strong>{formatMoney(pricing.active.profit, shipment.currency)}</strong>
          <small>Target {shipment.margin}% · pra-realisasi</small>
        </section>
      </div>

      <section className="panel panel-padding">
        <div className="panel-head">
          <div>
            <span className="eyebrow">P2 · ANALITIK BIAYA TRANSAKSI AKTIF</span>
            <h3>Komposisi biaya penawaran {shipment.reference}</h3>
          </div>
        </div>
        <div className="clean-table-wrap">
          <table className="clean-table">
            <thead>
              <tr>
                <th>Komponen</th>
                <th>Nilai Estimasi</th>
                <th>Status Data</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Nilai Barang ({shipment.lineItems.length} line item)</td>
                <td>
                  <b>{formatMoney(pricing.goods, shipment.currency)}</b>
                </td>
                <td>
                  <StatusPill tone="green">Tercatat di Quote</StatusPill>
                </td>
              </tr>
              <tr>
                <td>Packaging &amp; Origin Handling</td>
                <td>
                  <b>
                    {formatMoney(
                      shipment.packaging + shipment.inlandTransport + shipment.originHandling + shipment.customs,
                      shipment.currency,
                    )}
                  </b>
                </td>
                <td>
                  <StatusPill tone="blue">Estimasi Operasional</StatusPill>
                </td>
              </tr>
              <tr>
                <td>Ocean Freight &amp; Insurance</td>
                <td>
                  <b>{formatMoney(shipment.freight + shipment.insurance, shipment.currency)}</b>
                </td>
                <td>
                  <StatusPill tone="amber">Belum tagihan aktual</StatusPill>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="clean-notice warn" style={{ marginTop: 12 }}>
          Angka di atas berasal dari estimasi quotation dan dipisahkan secara tegas dari realisasi biaya aktual ledger (P2).
        </div>
      </section>
    </div>
  );
}

export function SettingsView({
  user,
  shipment,
  version,
  saveState,
  activeShipmentId,
  login,
  logout,
}: {
  user: { name?: string | null; email?: string | null; role?: string | null } | null;
  shipment: Shipment;
  version: number;
  saveState: PersistenceSaveState;
  activeShipmentId: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}) {
  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ shipment, version, exportedAt: new Date().toISOString() }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${shipment.reference}-snapshot.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Snapshot JSON berhasil diunduh");
  };

  return (
    <div className="module-stack">
      <div className="content-grid two-thirds">
        <section className="panel panel-padding">
          <div className="panel-head">
            <div>
              <span className="eyebrow">P0 · ADMIN &amp; GOVERNANCE</span>
              <h3>Sesi pengguna &amp; database workspace</h3>
            </div>
            <StatusPill tone={user ? "green" : "amber"}>
              {user ? "Terautentikasi" : "Mode Tamu Lokal"}
            </StatusPill>
          </div>

          <div className="clean-kv">
            <span>Organisasi Eksportir</span>
            <b>{shipment.exporter}</b>
          </div>
          <div className="clean-kv">
            <span>Pengguna Aktif</span>
            <b>{user ? `${user.name || "Pengguna"} (${user.email || "akun aktif"})` : "Belum masuk akun"}</b>
          </div>
          <div className="clean-kv">
            <span>Mesin Database Server</span>
            <b>PostgreSQL / Supabase (RLS Diaktifkan)</b>
          </div>
          <div className="clean-kv">
            <span>Status Transaksi Aktif</span>
            <b>
              {activeShipmentId
                ? `Cloud ID terhubung · v${version} (${saveState})`
                : "Draft browser lokal"}
            </b>
          </div>

          <div className="row-actions" style={{ marginTop: 14 }}>
            {user ? (
              <button type="button" className="ghost-button" onClick={() => void logout()}>
                Keluar Sesi Akun
              </button>
            ) : (
              <button type="button" className="save-button" onClick={() => void login()}>
                Masuk ke Workspace Cloud
              </button>
            )}
            <button type="button" className="ghost-button" onClick={exportJson}>
              <Download size={14} /> Ekspor JSON Transaksi
            </button>
          </div>
          <p className="profile-description" style={{ marginTop: 12 }}>
            Sesuai prinsip portabilitas data EksporFlow, Anda selalu dapat mengunduh snapshot data transaksi kapan saja tanpa dikunci oleh status paket.
          </p>
        </section>

        <section className="panel panel-padding">
          <div className="panel-head">
            <div>
              <span className="eyebrow">KEAMANAN &amp; HAK AKSES</span>
              <h3>Perlindungan workspace</h3>
            </div>
            <ShieldCheck size={18} className="panel-spark" />
          </div>
          <div className="guardrail-list">
            <div>
              <b>Row Level Security (RLS) aktif di seluruh tabel</b>
              <p>
                Akses publik PostgREST ditutup secara default; seluruh pembacaan dan penulisan transaksi diverifikasi melalui keanggotaan workspace di server.
              </p>
            </div>
            <div>
              <b>Optimistic locking &amp; transaksi database atomik</b>
              <p>
                Header shipment, line item, dan audit log ditulis dalam satu transaksi database sehingga tidak meninggalkan data setengah tersimpan.
              </p>
            </div>
            <div>
              <b>Proteksi endpoint AI Advisor</b>
              <p>
                AI Advisor mewajibkan sesi terautentikasi dan pembatasan kuota per jam untuk mencegah penyalahgunaan.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
