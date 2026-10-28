import { useEffect, useMemo, useRef, useState } from "react";
import {
  Anchor,
  Bot,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Box,
  Calculator,
  Check,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Copy,
  Database,
  FileCheck2,
  FileDown,
  FileText,
  FileSearch,
  History,
  LayoutDashboard,
  Menu,
  MailCheck,
  MessageCircle,
  MoreHorizontal,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  PenLine,
  Printer,
  RefreshCcw,
  RotateCcw,
  Save,
  Search,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Ship,
  Sparkles,
  Truck,
  UploadCloud,
  UserRound,
  WandSparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { trpc } from "@/lib/trpc";
import { calculatePricing, type Pricing } from "@shared/pricing";
import { calculateContainer } from "@shared/container";
import { initialShipment, type ContainerCalc, type DocumentOrientation, type DocumentTemplate, type DocumentType, type Incoterm, type LineItem, type PaperSize, type PreviewLanguage, type Shipment, type ShipmentStatus } from "@shared/shipment";

type Tab = "ringkasan" | "harga" | "dokumen" | "muatan" | "operasional" | "risiko" | "master" | "asisten";
type ThreeEngine = { scene: THREE.Scene; camera: THREE.PerspectiveCamera; renderer: THREE.WebGLRenderer; controls: OrbitControls; cargoGroup: THREE.Group };

const formatMoney = (value: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
const formatNumber = (value: number, digits = 0) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value);
const clamp = (value: number, min = 0) => (Number.isFinite(value) ? Math.max(min, value) : min);
const getDocumentNumber = (type: DocumentType, reference: string) => `${type === "Proforma Invoice" ? "PI" : type === "Commercial Invoice" ? "CI" : type === "Packing List" ? "PL" : "BL"}-${reference}`;

function IconButton({ label, children, onClick }: { label: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button className="icon-button" aria-label={label} title={label} onClick={onClick} type="button">
      {children}
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  prefix,
  suffix,
  type = "text",
  step,
  min,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  prefix?: string;
  suffix?: string;
  type?: "text" | "number";
  step?: string;
  min?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className={`input-shell ${prefix ? "has-prefix" : ""} ${suffix ? "has-suffix" : ""}`}>
        {prefix && <b>{prefix}</b>}
        <input type={type} value={value} step={step} min={min} onChange={(event) => onChange(event.target.value)} />
        {suffix && <em>{suffix}</em>}
      </div>
    </label>
  );
}

function SelectField({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="input-shell select-shell">
        <select value={value} onChange={(event) => onChange(event.target.value)}>{children}</select>
      </div>
    </label>
  );
}

function StatusPill({ children, tone = "green" }: { children: React.ReactNode; tone?: "green" | "amber" | "blue" | "gray" }) {
  return <span className={`status-pill ${tone}`}><i />{children}</span>;
}

function MetricCard({ label, value, detail, tone = "navy", icon, trend }: { label: string; value: string; detail: string; tone?: string; icon: React.ReactNode; trend?: string }) {
  return (
    <article className={`metric-card ${tone}`}>
      <div className="metric-top"><span className="metric-label">{label}</span><span className="metric-icon">{icon}</span></div>
      <strong>{value}</strong>
      <div className="metric-foot"><span>{detail}</span>{trend && <span className="metric-trend">{trend}</span>}</div>
    </article>
  );
}

function SectionTitle({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="section-title">
      <div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2>{description && <p>{description}</p>}</div>
      {action}
    </div>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("ringkasan");
  const [shipment, setShipment] = useState<Shipment>(() => {
    try {
      const saved = localStorage.getItem("eksporflow-shipment");
      if (!saved) return initialShipment;
      const parsed = JSON.parse(saved) as Partial<Shipment>;
      const merged = { ...initialShipment, ...parsed } as Shipment;
      const migratedItems = parsed.lineItems?.length ? parsed.lineItems.map((item) => ({ ...initialShipment.lineItems[0], ...item })) : [{ ...initialShipment.lineItems[0], description: merged.product, hsCode: merged.hsCode, quantity: merged.quantity, unit: merged.unit, unitPrice: merged.unitPrice, weight: merged.cartonWeight, length: merged.cartonLength, width: merged.cartonWidth, height: merged.cartonHeight }];
      return {
        ...merged,
        lineItems: migratedItems,
        exporter: !parsed.exporter || parsed.exporter === "PT Nusantara Rasa" ? initialShipment.exporter : parsed.exporter,
        letterheadText: !parsed.letterheadText || parsed.letterheadText.includes("Nusantara Rasa") ? initialShipment.letterheadText : parsed.letterheadText,
      };
    } catch {
      return initialShipment;
    }
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<DocumentType>("Proforma Invoice");
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("eksporflow-shipment", JSON.stringify(shipment));
  }, [shipment]);

  const update = <K extends keyof Shipment>(key: K, value: Shipment[K]) => setShipment((current) => {
    const next = { ...current, [key]: value } as Shipment;
    const revisionKeys: (keyof Shipment)[] = ["reference", "exporter", "buyer", "buyerCountry", "destination", "product", "hsCode", "currency", "incoterm", "paymentTerms", "quantity", "unit", "unitPrice", "packaging", "inlandTransport", "originHandling", "customs", "freight", "insurance", "destinationHandling", "importDuty", "lastMile", "margin", "discount", "contingency", "namedPlace", "lineItems", "paperSize", "documentOrientation", "documentTemplate", "letterheadText", "letterheadImage"];
    if (revisionKeys.includes(key)) next.documentRevision = Math.max(1, current.documentRevision + 1);
    if (current.lineItems.length && (key === "product" || key === "hsCode" || key === "unit")) {
      const lineKey = key === "product" ? "description" : key;
      next.lineItems = current.lineItems.map((item, index) => index === 0 ? { ...item, [lineKey]: value } : item) as LineItem[];
    }
    if (current.lineItems.length && key === "unitPrice") next.lineItems = current.lineItems.map((item, index) => index === 0 ? { ...item, unitPrice: value } : item) as LineItem[];
    return next;
  });
  const updateNumber = (key: keyof Shipment, value: string) => {
    const numericValue = clamp(Number(value));
    setShipment((current) => {
      const next = { ...current, [key]: numericValue } as Shipment;
      // Quantity and carton quantity represent the same export line item.
      // Keeping them linked prevents price, invoice and stuffing plans from drifting apart.
      if (key === "quantity") { next.cartonQty = numericValue; next.lineItems = current.lineItems.map((item, index) => index === 0 ? { ...item, quantity: numericValue } : item); }
      if (key === "unitPrice") next.lineItems = current.lineItems.map((item, index) => index === 0 ? { ...item, unitPrice: numericValue } : item);
      if (key === "cartonQty") next.quantity = numericValue;
      return next;
    });
  };
  const updateLineItems = (items: LineItem[]) => setShipment((current) => {
    const safeItems = (items.length ? items : initialShipment.lineItems).map((item) => ({ ...initialShipment.lineItems[0], ...item }));
    const first = safeItems[0];
    const totalQuantity = safeItems.reduce((sum, item) => sum + item.quantity, 0);
    return { ...current, lineItems: safeItems, product: first.description, hsCode: first.hsCode, quantity: totalQuantity, cartonQty: totalQuantity, unit: first.unit, unitPrice: first.unitPrice, cartonWeight: first.weight, cartonLength: first.length, cartonWidth: first.width, cartonHeight: first.height };
  });

  const pricing = useMemo(() => calculatePricing(shipment), [shipment]);

  const container = useMemo(() => calculateContainer(shipment), [shipment]);

  const saveTransaction = () => toast.success("Transaksi tersimpan", { description: `${shipment.reference} siap dilanjutkan kapan saja.` });
  const resetTransaction = () => { setShipment(initialShipment); toast("Draft dikembalikan ke contoh awal"); };
  const printDocument = () => {
    const printStyle = document.createElement("style");
    const printSize = shipment.paperSize === "Legal" ? "Legal" : shipment.paperSize === "Letter" ? "Letter" : "A4";
    printStyle.id = "eksporflow-print-paper-size";
    printStyle.textContent = `@page { size: ${printSize} ${shipment.documentOrientation.toLowerCase()}; margin: 12mm; }`;
    document.head.appendChild(printStyle);
    const previousLanguage = shipment.previewLanguage;
    setShipment((current) => ({ ...current, previewLanguage: "English" }));
    window.setTimeout(() => {
      window.print();
      setShipment((current) => ({ ...current, previewLanguage: previousLanguage }));
      window.setTimeout(() => printStyle.remove(), 700);
    }, 80);
  };

  const navItems: { key: Tab; label: string; icon: React.ReactNode; meta?: string }[] = [
    { key: "ringkasan", label: "Ringkasan", icon: <LayoutDashboard size={18} /> },
    { key: "asisten", label: "Copilot AI", icon: <Bot size={18} />, meta: "AI" },
    { key: "harga", label: "Kalkulator harga", icon: <Calculator size={18} />, meta: "01" },
    { key: "dokumen", label: "Dokumen ekspor", icon: <FileText size={18} />, meta: "03" },
    { key: "muatan", label: "Muatan kontainer", icon: <Package size={18} />, meta: "02" },
    { key: "operasional", label: "Kontrol shipment", icon: <Truck size={18} />, meta: "04" },
    { key: "risiko", label: "Risk center", icon: <ShieldAlert size={18} />, meta: "05" },
    { key: "master", label: "Master data", icon: <Database size={18} />, meta: "06" },
  ];

  return (
    <div className={`app-shell ${sidebarOpen ? "sidebar-is-open" : "sidebar-is-closed"}`}>
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark"><span /><span /></div>
          <div><strong>ekspor<span>flow</span></strong><small>EXPORT OPERATIONS</small></div>
        </div>
        <div className="workspace-switcher"><div className="workspace-avatar">IE</div><div><b>Indico Export Indonesia</b><small>Workspace utama</small></div><ChevronRight size={15} /></div>
        <nav className="main-nav">
          <span className="nav-caption">WORKSPACE</span>
          {navItems.map((item) => <button type="button" key={item.key} className={activeTab === item.key ? "active" : ""} onClick={() => setActiveTab(item.key)}><span className="nav-icon">{item.icon}</span><span>{item.label}</span>{item.meta && <em>{item.meta}</em>}</button>)}
        </nav>
        <div className="sidebar-divider" />
        <nav className="main-nav">
          <span className="nav-caption">UTILITAS</span>
          <button type="button" onClick={() => toast("Template tersimpan", { description: "Pengaturan template dokumen tersedia pada versi berikutnya." })}><span className="nav-icon"><ClipboardList size={18} /></span><span>Template saya</span></button>
          <button type="button" onClick={() => toast("Pusat bantuan", { description: "Panduan singkat akan membantu tim Anda menyiapkan ekspor." })}><span className="nav-icon"><CircleHelp size={18} /></span><span>Pusat bantuan</span></button>
        </nav>
        <div className="sidebar-bottom"><div className="plan-card"><div className="plan-card-top"><Sparkles size={16} /><span>TRIAL WORKSPACE</span></div><b>Siap naik level?</b><p>Aktifkan arsip dokumen dan kolaborasi tim.</p><button type="button" onClick={() => toast("Fitur segera hadir")}>Lihat paket <ArrowUpRight size={14} /></button></div><div className="user-row"><div className="user-avatar">AD</div><div><b>Ardiansyah D.</b><small>Administrator</small></div><MoreHorizontal size={17} /></div></div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumbs"><span>Workspace</span><ChevronRight size={14} /><b>{navItems.find((item) => item.key === activeTab)?.label}</b></div>
          <div className="topbar-actions">
            {searchOpen && <div className="top-search"><Search size={15} /><input autoFocus placeholder="Cari transaksi..." onKeyDown={(event) => event.key === "Escape" && setSearchOpen(false)} /></div>}
            <IconButton label="Cari transaksi" onClick={() => setSearchOpen((open) => !open)}><Search size={18} /></IconButton>
            <IconButton label="Pengaturan"><Settings2 size={18} /></IconButton>
            <button type="button" className="save-button" onClick={saveTransaction}><Save size={16} /> Simpan transaksi</button>
          </div>
        </header>

        <div className="page-wrap">
          <div className="mobile-toolbar"><button type="button" className="icon-button" onClick={() => setSidebarOpen(true)}><Menu size={19} /></button><span>EksporFlow</span><IconButton label="Simpan" onClick={saveTransaction}><Save size={17} /></IconButton></div>
          <section className="page-heading">
            <div><span className="eyebrow">TRANSACTION WORKSPACE · {shipment.reference}</span><h1>{activeTab === "ringkasan" ? "Siapkan ekspor tanpa pindah-pindah alat." : navItems.find((item) => item.key === activeTab)?.label}</h1><p>{activeTab === "ringkasan" ? "Satu sumber data untuk menghitung penawaran, menyiapkan dokumen, dan merencanakan muatan." : activeTab === "asisten" ? "Tanya EksporFlow tentang transaksi aktif dan dapatkan rekomendasi tindakan yang bisa langsung dijalankan." : activeTab === "harga" ? "Rincikan biaya dari titik asal sampai buyer menerima penawaran." : activeTab === "dokumen" ? "Semua dokumen ekspor, ditarik dari detail transaksi yang sama." : activeTab === "muatan" ? "Pastikan setiap karton terhitung sebelum booking ruang kapal." : activeTab === "operasional" ? "Pantau status, tugas, dokumen, dan lampiran shipment dalam satu timeline." : activeTab === "risiko" ? "Temukan red flag sebelum harga dikirim, dokumen dicetak, atau barang berangkat." : "Simpan buyer dan produk yang sering dipakai agar transaksi berikutnya lebih cepat."}</p></div>
            <div className="heading-actions"><button className="ghost-button" type="button" onClick={resetTransaction}><RefreshCcw size={15} /> Reset draft</button><StatusPill>Draft tersimpan</StatusPill></div>
          </section>

          {activeTab === "ringkasan" && <Overview shipment={shipment} update={update} pricing={pricing} container={container} setActiveTab={setActiveTab} />}
          {activeTab === "asisten" && <AssistantModule shipment={shipment} pricing={pricing} container={container} setActiveTab={setActiveTab} />}
          {activeTab === "harga" && <PricingModule shipment={shipment} update={update} updateNumber={updateNumber} updateLineItems={updateLineItems} pricing={pricing} />}
          {activeTab === "dokumen" && <DocumentsModule shipment={shipment} update={update} pricing={pricing} container={container} selectedDocument={selectedDocument} setSelectedDocument={setSelectedDocument} printDocument={printDocument} />}
          {activeTab === "muatan" && <ContainerModule shipment={shipment} update={update} updateNumber={updateNumber} updateLineItems={updateLineItems} container={container} />}
          {activeTab === "operasional" && <OperationsModule shipment={shipment} update={update} />}
          {activeTab === "risiko" && <RiskModule shipment={shipment} update={update} pricing={pricing} container={container} setActiveTab={setActiveTab} />}
          {activeTab === "master" && <MasterDataModule shipment={shipment} update={update} updateNumber={updateNumber} />}
        </div>
      </main>
      {!sidebarOpen && <button type="button" className="sidebar-reopen" onClick={() => setSidebarOpen(true)} aria-label="Buka navigasi"><PanelLeftOpen size={19} /></button>}
      {sidebarOpen && <button type="button" className="sidebar-collapse" onClick={() => setSidebarOpen(false)} aria-label="Tutup navigasi"><PanelLeftClose size={17} /></button>}
    </div>
  );
}

function TransactionStrip({ shipment, update }: { shipment: Shipment; update: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void }) {
  return (
    <div className="transaction-strip">
      <div className="transaction-cell"><span>REFERENCE</span><b>{shipment.reference}</b></div>
      <div className="transaction-cell"><span>BUYER</span><b>{shipment.buyer}</b><small>{shipment.buyerCountry}</small></div>
      <div className="route-cell"><div className="route-line"><span className="route-dot" /><i /><span className="route-dot filled" /></div><div><small>ORIGIN</small><b>Indonesia</b></div><ArrowDownRight size={18} className="route-arrow" /><div><small>DESTINATION</small><b>{shipment.destination}</b></div></div>
      <div className="transaction-cell incoterm-cell"><span>INCOTERM</span><select value={shipment.incoterm} onChange={(event) => update("incoterm", event.target.value as Incoterm)}>{["EXW", "FCA", "FOB", "CFR", "CIF", "DAP", "DDP"].map((term) => <option key={term}>{term}</option>)}</select><small>Port to door scope</small></div>
      <div className="transaction-status"><StatusPill>On track</StatusPill><small>Updated just now</small></div>
    </div>
  );
}

function Overview({ shipment, update, pricing, container, setActiveTab }: { shipment: Shipment; update: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void; pricing: Pricing; container: ContainerCalc; setActiveTab: (tab: Tab) => void }) {
  return (
    <>
      <TransactionStrip shipment={shipment} update={update} />
      <TransactionProfile shipment={shipment} update={update} />
      <div className="overview-grid">
        <section className="hero-card"><div className="hero-card-copy"><span className="eyebrow light">CURRENT QUOTE · {shipment.incoterm}</span><h2>{formatMoney(pricing.active.offer, shipment.currency)}</h2><p>Estimasi harga penawaran untuk <strong>{formatNumber(shipment.quantity)} {shipment.unit}</strong> {shipment.product.toLowerCase()} ke {shipment.destination}.</p><div className="hero-meta"><span><i className="tiny-dot mint" /> Margin sehat {shipment.margin}%</span><span><i className="tiny-dot saffron" /> {shipment.currency} currency</span></div></div><div className="hero-orbit"><div className="orbit-label">PER UNIT</div><strong>{formatMoney(pricing.active.unit, shipment.currency)}</strong><span>{shipment.incoterm} · {shipment.paymentTerms.split("/")[0]}</span></div><div className="hero-wave" /></section>
        <MetricCard label="COST TO SERVE" value={formatMoney(pricing.active.cost, shipment.currency)} detail={`${formatNumber(pricing.active.cost / Math.max(1, pricing.goods) * 100, 1)}% dari nilai barang`} tone="cream" icon={<BarChart3 size={16} />} />
        <MetricCard label="ESTIMASI PROFIT" value={formatMoney(pricing.active.profit, shipment.currency)} detail={`${shipment.margin}% margin rate`} tone="mint" icon={<ArrowUpRight size={16} />} trend="+12.4%" />
        <MetricCard label="LOAD PLAN" value={`${container.volumeUtilization.toFixed(0)}%`} detail={`${container.containers} × ${shipment.containerType} · ${formatNumber(container.totalVolume, 1)} m³`} tone="sand" icon={<Box size={16} />} />
      </div>
      <div className="content-grid two-thirds">
        <section className="panel panel-padding"><div className="panel-head"><div><span className="eyebrow">NEXT ACTIONS</span><h3>Checklist keberangkatan</h3></div><button className="text-button" type="button" onClick={() => toast("Checklist diperbarui")}>Kelola checklist <ChevronRight size={15} /></button></div><div className="checklist"><ChecklistItem done label="Detail buyer & komoditas" meta="Data dasar lengkap" /><ChecklistItem done label={`Kalkulasi harga ${shipment.incoterm}`} meta={`Margin ${shipment.margin}%`} /><ChecklistItem done label="Rencana muatan kontainer" meta={`${container.containers} kontainer terestimasi`} /><ChecklistItem label="Review dokumen ekspor" meta="3 dokumen siap dibuat" onClick={() => setActiveTab("dokumen")} /></div></section>
        <section className="panel panel-padding"><div className="panel-head"><div><span className="eyebrow">QUICK ACCESS</span><h3>Mulai dari sini</h3></div><Sparkles size={17} className="panel-spark" /></div><div className="quick-links"><QuickLink icon={<Calculator size={17} />} title="Uji skenario harga" caption="Bandingkan 7 Incoterm" onClick={() => setActiveTab("harga")} /><QuickLink icon={<FileCheck2 size={17} />} title="Buat dokumen" caption="Invoice & B/L" onClick={() => setActiveTab("dokumen")} /><QuickLink icon={<Ship size={17} />} title="Atur stuffing" caption="Optimalkan ruang kontainer" onClick={() => setActiveTab("muatan")} /></div></section>
      </div>
      <section className="panel panel-padding scenario-panel"><div className="panel-head"><div><span className="eyebrow">SCENARIO SNAPSHOT</span><h3>Bagaimana biaya bergerak di tiap Incoterm?</h3></div><button className="text-button" type="button" onClick={() => setActiveTab("harga")}>Buka kalkulator <ChevronRight size={15} /></button></div><div className="scenario-table"><div className="scenario-row scenario-header"><span>TERM</span><span>CAKUPAN</span><span>TOTAL PENAWARAN</span><span>DELTA</span><span /></div>{pricing.scenarios.slice(0, 5).map((scenario, index) => <div className={`scenario-row ${scenario.term === shipment.incoterm ? "selected" : ""}`} key={scenario.term}><strong>{scenario.term}</strong><span>{scenario.term === "EXW" ? "Ex-works" : scenario.term === "FCA" ? "First carrier" : scenario.term === "FOB" ? "On board vessel" : scenario.term === "CFR" ? "Freight included" : "Freight + insurance"}</span><b>{formatMoney(scenario.offer, shipment.currency)}</b><span className={index === 0 ? "muted-delta" : "positive-delta"}>{index === 0 ? "Base" : `+${formatMoney(scenario.offer - pricing.scenarios[0].offer, shipment.currency)}`}</span><span>{scenario.term === shipment.incoterm && <StatusPill tone="amber">Aktif</StatusPill>}</span></div>)}</div></section>
      <RecommendationsPanel shipment={shipment} pricing={pricing} container={container} setActiveTab={setActiveTab} />
    </>
  );
}

type Recommendation = { title: string; detail: string; action: string; tab: Tab; tone: "warning" | "info" | "success"; icon: React.ReactNode };

function getRecommendations(shipment: Shipment, pricing: Pricing, container: ContainerCalc): Recommendation[] {
  const recommendations: Recommendation[] = [];
  if (!shipment.bookingNumber) recommendations.push({ title: "Lengkapi referensi booking", detail: "Booking number belum ada. Isi sebelum shipment berpindah ke fase Booked agar jejak forwarder tetap utuh.", action: "Buka kontrol shipment", tab: "operasional", tone: "warning", icon: <Truck size={15} /> });
  if (!shipment.hsCode) recommendations.push({ title: "Review HS Code sebelum quote", detail: "HS Code kosong dapat mengubah duty, dokumen, dan risiko klasifikasi. Konfirmasi dengan broker/customs.", action: "Buka data transaksi", tab: "ringkasan", tone: "warning", icon: <FileSearch size={15} /> });
  if (container.volumeUtilization > 90 || container.weightUtilization > 90) recommendations.push({ title: "Optimalkan rencana stuffing", detail: `Utilisasi ${Math.max(container.volumeUtilization, container.weightUtilization).toFixed(0)}% mendekati batas. Pertimbangkan layout, pallet, atau tambahan kontainer.`, action: "Buka muatan kontainer", tab: "muatan", tone: "warning", icon: <Package size={15} /> });
  if (!shipment.letterheadText || shipment.letterheadText.length < 8) recommendations.push({ title: "Lengkapi identitas kop surat", detail: "Kop surat masih terlalu singkat. Tambahkan alamat dan kontak sebelum membuat dokumen yang dikirim ke buyer.", action: "Atur dokumen", tab: "dokumen", tone: "info", icon: <FileText size={15} /> });
  if (pricing.active.profit <= 0) recommendations.push({ title: "Margin perlu ditinjau", detail: "Estimasi profit tidak positif. Review komponen biaya, margin, dan diskon pada kalkulator harga.", action: "Buka kalkulator harga", tab: "harga", tone: "warning", icon: <ArrowDownRight size={15} /> });
  if (!recommendations.length) recommendations.push({ title: "Tanyakan apa saja ke EksporFlow Copilot", detail: "Data inti terlihat siap. Minta ringkasan risiko, rekomendasi Incoterm, atau checklist dokumen untuk transaksi ini.", action: "Buka Copilot AI", tab: "asisten", tone: "success", icon: <WandSparkles size={15} /> });
  return recommendations.slice(0, 4);
}

function RecommendationsPanel({ shipment, pricing, container, setActiveTab }: { shipment: Shipment; pricing: Pricing; container: ContainerCalc; setActiveTab: (tab: Tab) => void }) {
  const recommendations = getRecommendations(shipment, pricing, container);
  return <section className="panel panel-padding recommendations-panel"><div className="panel-head"><div><span className="eyebrow">ACTIVE RECOMMENDATIONS</span><h3>Langkah berikutnya yang paling berdampak</h3><p className="profile-description">Saran ini dihitung ulang setiap kali data transaksi, dokumen, atau muatan berubah.</p></div><button type="button" className="text-button" onClick={() => setActiveTab("asisten")}><MessageCircle size={14} /> Tanya Copilot</button></div><div className="recommendation-grid">{recommendations.map((recommendation) => <button type="button" key={recommendation.title} className={`recommendation-card ${recommendation.tone}`} onClick={() => setActiveTab(recommendation.tab)}><span className="recommendation-icon">{recommendation.icon}</span><span className="recommendation-copy"><b>{recommendation.title}</b><small>{recommendation.detail}</small><em>{recommendation.action} <ChevronRight size={12} /></em></span></button>)}</div></section>;
}

function AssistantModule({ shipment, pricing, container, setActiveTab }: { shipment: Shipment; pricing: Pricing; container: ContainerCalc; setActiveTab: (tab: Tab) => void }) {
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: `Saya EksporFlow Copilot. Saya siap membantu membaca transaksi **${shipment.reference}** untuk ${shipment.buyer}. Tanyakan tentang Incoterm, harga, dokumen, stuffing, atau risiko yang perlu ditangani terlebih dahulu.` }]);
  const assistant = trpc.assistant.ask.useMutation();
  const snapshot = JSON.stringify({ reference: shipment.reference, buyer: shipment.buyer, country: shipment.buyerCountry, destination: shipment.destination, incoterm: shipment.incoterm, currency: shipment.currency, product: shipment.product, hsCode: shipment.hsCode, quantity: shipment.quantity, offer: pricing.active.offer, profit: pricing.active.profit, margin: shipment.margin, containerType: shipment.containerType, totalVolume: container.totalVolume, totalWeight: container.totalWeight, volumeUtilization: container.volumeUtilization, weightUtilization: container.weightUtilization, status: shipment.shipmentStatus, documents: { po: shipment.poNumber, booking: shipment.bookingNumber, container: shipment.containerNumber, seal: shipment.sealNumber, attachments: shipment.attachments } }).slice(0, 8000);
  const sendMessage = (content: string) => {
    setMessages((current) => [...current, { role: "user", content }]);
    assistant.mutate({ question: content, snapshot }, { onSuccess: (result) => setMessages((current) => [...current, { role: "assistant", content: result.answer }]), onError: (error) => setMessages((current) => [...current, { role: "assistant", content: `Saya belum dapat memproses pertanyaan ini. ${error.message || "Coba lagi sebentar."}` }]) });
  };
  const recommendations = getRecommendations(shipment, pricing, container);
  return <div className="copilot-layout"><section className="panel panel-padding copilot-panel"><div className="panel-head"><div><span className="eyebrow">EKSPORFLOW COPILOT</span><h2 className="ops-title">Asisten yang membaca transaksi aktif</h2><p className="ops-description">Jawaban berbasis snapshot transaksi ini. Untuk keputusan legal, klasifikasi, dan buyer, tetap lakukan verifikasi dengan pihak berwenang.</p></div><StatusPill tone="blue"><Bot size={11} /> Context-aware</StatusPill></div><AIChatBox messages={messages} onSendMessage={sendMessage} isLoading={assistant.isPending} height={470} placeholder="Contoh: risiko terbesar sebelum saya kirim quotation apa?" emptyStateMessage="Mulai percakapan dengan EksporFlow Copilot" suggestedPrompts={["Ringkas risiko transaksi ini", "Incoterm mana yang paling masuk akal?", "Dokumen apa yang masih perlu saya lengkapi?"]} /></section><aside className="copilot-aside"><section className="panel panel-padding"><div className="panel-head"><div><span className="eyebrow">REKOMENDASI AKTIF</span><h3>Gunakan konteks ini</h3></div><WandSparkles size={17} className="panel-spark" /></div><div className="copilot-recommendations">{recommendations.map((recommendation) => <button type="button" key={recommendation.title} onClick={() => setActiveTab(recommendation.tab)}><span className={`copilot-rec-icon ${recommendation.tone}`}>{recommendation.icon}</span><span><b>{recommendation.title}</b><small>{recommendation.detail}</small></span><ChevronRight size={14} /></button>)}</div></section><section className="panel panel-padding copilot-context"><div className="panel-head"><div><span className="eyebrow">TRANSACTION SNAPSHOT</span><h3>Data yang dibaca Copilot</h3></div></div><div className="context-list"><div><span>BUYER</span><b>{shipment.buyer}</b></div><div><span>OFFER</span><b>{formatMoney(pricing.active.offer, shipment.currency)}</b></div><div><span>LOAD</span><b>{container.containers} × {shipment.containerType} · {container.volumeUtilization.toFixed(0)}%</b></div><div><span>STATUS</span><b>{shipment.shipmentStatus}</b></div></div><div className="copilot-disclaimer"><ShieldCheck size={14} /><span>Copilot memberi panduan operasional, bukan opini hukum atau jaminan buyer.</span></div></section></aside></div>;
}

function TransactionProfile({ shipment, update }: { shipment: Shipment; update: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void }) {
  return (
    <section className="panel panel-padding connected-profile">
      <div className="panel-head">
        <div><span className="eyebrow">SINGLE SOURCE OF TRUTH</span><h3>Data transaksi terhubung</h3><p className="profile-description">Perubahan di sini otomatis dipakai oleh kalkulator harga, invoice, B/L, dan rencana stuffing.</p></div>
        <StatusPill tone="blue"><Check size={11} /> 4 modul tersinkron</StatusPill>
      </div>
      <div className="profile-grid">
        <Field label="Nomor transaksi" value={shipment.reference} onChange={(value) => update("reference", value)} />
        <Field label="Nama buyer" value={shipment.buyer} onChange={(value) => update("buyer", value)} />
        <Field label="Negara buyer" value={shipment.buyerCountry} onChange={(value) => update("buyerCountry", value)} />
        <Field label="Tujuan pengiriman" value={shipment.destination} onChange={(value) => update("destination", value)} />
        <Field label="Eksportir" value={shipment.exporter} onChange={(value) => update("exporter", value)} />
        <Field label="HS code" value={shipment.hsCode} onChange={(value) => update("hsCode", value)} />
      </div>
      <div className="connection-rail"><span><Calculator size={13} /> Harga</span><i /><span><FileText size={13} /> Dokumen</span><i /><span><Package size={13} /> Muatan</span><em>Live sync</em></div>
    </section>
  );
}

function ChecklistItem({ done, label, meta, onClick }: { done?: boolean; label: string; meta: string; onClick?: () => void }) {
  return <button type="button" className="checklist-item" onClick={onClick}><span className={`check-circle ${done ? "done" : ""}`}>{done && <Check size={13} />}</span><span className="check-copy"><b>{label}</b><small>{meta}</small></span><ChevronRight size={16} /></button>;
}
function QuickLink({ icon, title, caption, onClick }: { icon: React.ReactNode; title: string; caption: string; onClick: () => void }) { return <button type="button" className="quick-link" onClick={onClick}><span className="quick-icon">{icon}</span><span><b>{title}</b><small>{caption}</small></span><ChevronRight size={15} /></button>; }

function LineItemsEditor({ items, updateItems, currency }: { items: LineItem[]; updateItems: (items: LineItem[]) => void; currency: string }) {
  const packagingOptions = ["Karton box", "Karung goni", "Drum", "Sack", "Crate kayu"];
  const numericFields = ["quantity", "unitPrice", "shrinkageRate", "palletCount", "palletWeight", "length", "width", "height", "weight"];
  const updateItem = (id: string, field: keyof LineItem, value: string) => updateItems(items.map((item) => item.id === id ? { ...item, [field]: numericFields.includes(field) ? clamp(Number(value)) : value } as LineItem : item));
  const updateBoolean = (id: string, field: keyof LineItem, value: boolean) => updateItems(items.map((item) => item.id === id ? { ...item, [field]: value } as LineItem : item));
  const addItem = () => updateItems([...items, { id: `item-${Date.now()}`, description: "Produk baru", hsCode: "", quantity: 1, unit: "carton", unitPrice: 0, weight: 12, length: 40, width: 30, height: 25, packagingType: "Karton box", shrinkageRate: 0, palletEnabled: false, palletCount: 0, palletLength: 120, palletWidth: 100, palletHeight: 15, palletWeight: 22 }]);
  const removeItem = (id: string) => { if (items.length > 1) updateItems(items.filter((item) => item.id !== id)); };
  return <div className="line-items-editor"><div className="line-items-head"><div><b>Line items transaksi</b><small>{items.length} produk · otomatis masuk ke invoice, Packing List, dan simulasi muatan</small></div><button type="button" className="add-line-item" onClick={addItem}><Copy size={13} /> Tambah item</button></div><div className="line-items-table"><div className="line-item-row line-item-header"><span>PRODUK</span><span>HS CODE</span><span>QTY</span><span>HARGA UNIT</span><span>TOTAL</span><span /></div>{items.map((item) => <div className="line-item-card" key={item.id}><div className="line-item-row"><input aria-label="Nama produk" value={item.description} onChange={(event) => updateItem(item.id, "description", event.target.value)} /><input aria-label="HS Code" value={item.hsCode} onChange={(event) => updateItem(item.id, "hsCode", event.target.value)} /><input aria-label="Quantity" type="number" min="0" value={item.quantity} onChange={(event) => updateItem(item.id, "quantity", event.target.value)} /><div className="line-money"><span>{currency}</span><input aria-label="Harga unit" type="number" min="0" value={item.unitPrice} onChange={(event) => updateItem(item.id, "unitPrice", event.target.value)} /></div><b>{formatMoney(item.quantity * item.unitPrice, currency)}</b><button type="button" className="remove-line-item" aria-label="Hapus item" onClick={() => removeItem(item.id)}><X size={13} /></button></div><div className="line-item-detail"><label>Jenis kemasan<select value={packagingOptions.includes(item.packagingType) ? item.packagingType : "__custom"} onChange={(event) => updateItem(item.id, "packagingType", event.target.value === "__custom" ? (packagingOptions.includes(item.packagingType) ? "Kemasan custom" : item.packagingType) : event.target.value)}>{packagingOptions.map((option) => <option key={option}>{option}</option>)}<option value="__custom">Kemasan lain…</option></select></label>{!packagingOptions.includes(item.packagingType) && <label>Nama kemasan<input value={item.packagingType} onChange={(event) => updateItem(item.id, "packagingType", event.target.value)} placeholder="Contoh: Big bag 1 ton" /></label>}<label>Panjang<input type="number" min="0" value={item.length} onChange={(event) => updateItem(item.id, "length", event.target.value)} /><span>cm</span></label><label>Lebar<input type="number" min="0" value={item.width} onChange={(event) => updateItem(item.id, "width", event.target.value)} /><span>cm</span></label><label>Tinggi<input type="number" min="0" value={item.height} onChange={(event) => updateItem(item.id, "height", event.target.value)} /><span>cm</span></label><label>Berat/unit<input type="number" min="0" step="0.1" value={item.weight} onChange={(event) => updateItem(item.id, "weight", event.target.value)} /><span>kg</span></label><label>Susut<input type="number" min="0" max="100" step="0.1" value={item.shrinkageRate} onChange={(event) => updateItem(item.id, "shrinkageRate", event.target.value)} /><span>%</span></label><label className="pallet-toggle"><input type="checkbox" checked={item.palletEnabled} onChange={(event) => updateBoolean(item.id, "palletEnabled", event.target.checked)} /> Tambahkan pallet kayu</label>{item.palletEnabled && <><label>Jumlah pallet<input type="number" min="0" value={item.palletCount} onChange={(event) => updateItem(item.id, "palletCount", event.target.value)} /></label><label>Panjang pallet<input type="number" min="0" value={item.palletLength} onChange={(event) => updateItem(item.id, "palletLength", event.target.value)} /><span>cm</span></label><label>Lebar pallet<input type="number" min="0" value={item.palletWidth} onChange={(event) => updateItem(item.id, "palletWidth", event.target.value)} /><span>cm</span></label><label>Tinggi pallet<input type="number" min="0" value={item.palletHeight} onChange={(event) => updateItem(item.id, "palletHeight", event.target.value)} /><span>cm</span></label><label>Berat pallet<input type="number" min="0" step="0.1" value={item.palletWeight} onChange={(event) => updateItem(item.id, "palletWeight", event.target.value)} /><span>kg</span></label></>}</div>{!packagingOptions.includes(item.packagingType) && <div className="custom-packaging-note"><Check size={13} /> Kemasan custom akan dihitung dengan dimensi, berat kotor, dan warna fallback pada simulasi 3D.</div>}</div>)}</div></div>;
}

function PricingModule({ shipment, update, updateNumber, updateLineItems, pricing }: { shipment: Shipment; update: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void; updateNumber: (key: keyof Shipment, value: string) => void; updateLineItems: (items: LineItem[]) => void; pricing: Pricing }) {
  return (
    <div className="module-stack">
      <div className="module-layout">
        <section className="panel panel-padding input-panel"><SectionTitle eyebrow="INPUT TRANSAKSI" title="Komponen harga" description="Masukkan biaya aktual. Ruleset ditampilkan sebagai Incoterms® 2020; named place tetap harus direview ahli." /><div className="form-section"><div className="form-section-title"><span className="section-number">01</span><div><b>Nilai barang</b><small>Basis perhitungan dari seluruh line item</small></div></div><div className="form-grid three"><Field label="Produk utama" value={shipment.product} onChange={(value) => update("product", value)} /><Field label="Quantity total" value={shipment.quantity} type="number" suffix={shipment.unit} onChange={(value) => updateNumber("quantity", value)} /><Field label="Harga unit utama" value={shipment.unitPrice} type="number" prefix={shipment.currency} onChange={(value) => updateNumber("unitPrice", value)} /></div><LineItemsEditor items={shipment.lineItems} updateItems={updateLineItems} currency={shipment.currency} /></div><div className="form-section"><div className="form-section-title"><span className="section-number">02</span><div><b>Biaya logistik & kepabeanan</b><small>Aktif sesuai cakupan Incoterm</small></div></div><div className="form-grid three"><Field label="Packaging" value={shipment.packaging} type="number" prefix={shipment.currency} onChange={(value) => updateNumber("packaging", value)} /><Field label="Inland transport" value={shipment.inlandTransport} type="number" prefix={shipment.currency} onChange={(value) => updateNumber("inlandTransport", value)} /><Field label="Origin handling" value={shipment.originHandling} type="number" prefix={shipment.currency} onChange={(value) => updateNumber("originHandling", value)} /><Field label="Customs clearance" value={shipment.customs} type="number" prefix={shipment.currency} onChange={(value) => updateNumber("customs", value)} /><Field label="Ocean freight" value={shipment.freight} type="number" prefix={shipment.currency} onChange={(value) => updateNumber("freight", value)} /><Field label="Insurance" value={shipment.insurance} type="number" prefix={shipment.currency} onChange={(value) => updateNumber("insurance", value)} /><Field label="Destination handling" value={shipment.destinationHandling} type="number" prefix={shipment.currency} onChange={(value) => updateNumber("destinationHandling", value)} /><Field label="Import duty" value={shipment.importDuty} type="number" prefix={shipment.currency} onChange={(value) => updateNumber("importDuty", value)} /><Field label="Last mile delivery" value={shipment.lastMile} type="number" prefix={shipment.currency} onChange={(value) => updateNumber("lastMile", value)} /></div></div><div className="form-section"><div className="form-section-title"><span className="section-number">03</span><div><b>Strategi penawaran</b><small>Margin berbeda dari markup; formula net price tersimpan sebagai {shipment.formulaVersion}</small></div></div><div className="form-grid three"><SelectField label="Incoterm disepakati" value={shipment.incoterm} onChange={(value) => update("incoterm", value as Incoterm)}>{["EXW", "FCA", "FOB", "CFR", "CIF", "DAP", "DDP"].map((term) => <option key={term}>{term}</option>)}</SelectField><Field label="Target margin" value={shipment.margin} type="number" suffix="%" step="0.5" onChange={(value) => updateNumber("margin", value)} /><Field label="Diskon buyer" value={shipment.discount} type="number" prefix={shipment.currency} onChange={(value) => updateNumber("discount", value)} /><Field label="Contingency" value={shipment.contingency} type="number" suffix="%" step="0.5" onChange={(value) => updateNumber("contingency", value)} /><Field label="Kurs referensi" value={shipment.exchangeRate} type="number" suffix="IDR / USD" step="0.01" onChange={(value) => updateNumber("exchangeRate", value)} /><Field label="Tanggal kurs" value={shipment.exchangeRateDate} onChange={(value) => update("exchangeRateDate", value)} /><Field label="Sumber kurs" value={shipment.exchangeRateSource} onChange={(value) => update("exchangeRateSource", value)} /><Field label="Named place / port" value={shipment.namedPlace} onChange={(value) => update("namedPlace", value)} /></div></div></section>
        <aside className="pricing-aside"><div className="quote-card"><div className="quote-top"><span className="eyebrow light">OFFER PREVIEW</span><StatusPill tone="amber">{shipment.incoterm}</StatusPill></div><span className="quote-label">TOTAL PENAWARAN</span><strong>{formatMoney(pricing.active.offer, shipment.currency)}</strong><div className="quote-unit"><span>Per {shipment.unit}</span><b>{formatMoney(pricing.active.unit, shipment.currency)}</b></div><div className="quote-breakdown"><div><span>Cost to serve + contingency</span><b>{formatMoney(pricing.active.cost, shipment.currency)}</b></div><div><span>Margin {shipment.margin}%</span><b className="mint-text">+ {formatMoney(pricing.active.profit, shipment.currency)}</b></div><div><span>Diskon</span><b>{shipment.discount ? `- ${formatMoney(shipment.discount, shipment.currency)}` : "—"}</b></div></div><button type="button" className="full-button" disabled={pricing.validationErrors.length > 0} onClick={() => toast.success("Harga siap dipakai di dokumen", { description: "Nilai penawaran telah disinkronkan sebagai draft." })}>Gunakan harga ini <ArrowUpRight size={16} /></button></div><div className="quote-metadata"><span>Formula: {shipment.formulaVersion}</span><span>Kurs: {shipment.exchangeRateSource} · {shipment.exchangeRateDate}</span></div><div className="tip-card"><Sparkles size={17} /><div><b>Catatan kalkulasi</b><p>Dengan {shipment.incoterm}, biaya sampai <strong>{shipment.namedPlace || "named place belum diisi"}</strong> masuk sebagai asumsi quote. Incoterms® tidak menjadi penentu tunggal pengakuan pendapatan atau kepatuhan.</p></div></div></aside>
      </div>
      {pricing.validationErrors.length > 0 && <div className="validation-banner"><ShieldAlert size={16} /><div><b>Perlu diperbaiki sebelum quote dipakai</b>{pricing.validationErrors.map((error) => <small key={error}>{error}</small>)}</div></div>}
      <section className="panel panel-padding"><div className="panel-head"><div><span className="eyebrow">INCOTERM COMPARISON · INCOTERMS® 2020</span><h3>Perbandingan cepat skenario</h3></div><span className="muted-note">Margin tetap {shipment.margin}%</span></div><div className="comparison-cards">{pricing.scenarios.map((scenario) => <button type="button" key={scenario.term} className={`comparison-card ${scenario.term === shipment.incoterm ? "active" : ""}`} onClick={() => update("incoterm", scenario.term)}><div className="comparison-term"><b>{scenario.term}</b>{scenario.term === shipment.incoterm && <Check size={14} />}</div><strong>{formatMoney(scenario.offer, shipment.currency)}</strong><small>{scenario.term === "EXW" ? "Warehouse" : scenario.term === "FCA" ? "First carrier" : scenario.term === "FOB" ? "On vessel" : scenario.term === "CFR" ? "Freight" : scenario.term === "CIF" ? "Freight + insurance" : scenario.term === "DAP" ? "At destination" : "Delivered duty paid"}</small><div className="comparison-bar"><i style={{ width: `${Math.min(100, Math.max(18, (scenario.offer / pricing.scenarios[pricing.scenarios.length - 1].offer) * 100))}%` }} /></div></button>)}</div></section>
    </div>
  );
}

function docCopy(language: PreviewLanguage, english: string, indonesian: string) {
  return language === "Bahasa Indonesia" ? indonesian : english;
}

function DocumentsModule({ shipment, update, pricing, container, selectedDocument, setSelectedDocument, printDocument }: { shipment: Shipment; update: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void; pricing: Pricing; container: ContainerCalc; selectedDocument: DocumentType; setSelectedDocument: (doc: DocumentType) => void; printDocument: () => void }) {
  const documents: { type: DocumentType; caption: string; icon: React.ReactNode; status: string }[] = [{ type: "Proforma Invoice", caption: "Penawaran awal & terms", icon: <FileText size={19} />, status: "Ready" }, { type: "Commercial Invoice", caption: "Dokumen nilai komersial", icon: <FileCheck2 size={19} />, status: "Ready" }, { type: "Packing List", caption: "Rincian koli & berat", icon: <ClipboardList size={19} />, status: "Ready" }, { type: "Bill of Lading", caption: "DRAFT / REFERENCE · bukan carrier-issued", icon: <Ship size={19} />, status: "Draft / Reference" }];
  const handleLetterheadImage = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("File logo/kop harus berupa gambar", { description: "Gunakan PNG, JPG, atau WEBP." }); return; }
    if (file.size > 2_000_000) { toast.error("Ukuran logo terlalu besar", { description: "Maksimal 2 MB agar draft tetap ringan." }); return; }
    const reader = new FileReader();
    reader.onload = () => update("letterheadImage", String(reader.result));
    reader.readAsDataURL(file);
  };
  const finishReview = () => { update("previewLanguage", "English"); update("documentReviewed", true); toast.success("Review dokumen ditandai selesai", { description: "Output PDF/print tetap English dan memakai setelan dokumen aktif." }); };
  return (
    <div className="documents-layout"><aside className="document-sidebar panel"><div className="document-sidebar-head"><div><span className="eyebrow">DOCUMENT CENTER</span><h3>Dokumen transaksi</h3></div><button className="icon-button small" type="button" onClick={() => toast("Dokumen disegarkan")}><RefreshCcw size={15} /></button></div>{documents.map((document) => <button type="button" key={document.type} className={`document-item ${selectedDocument === document.type ? "active" : ""}`} onClick={() => setSelectedDocument(document.type)}><span className="document-icon">{document.icon}</span><span><b>{document.type}</b><small>{document.caption}</small></span><StatusPill tone={document.status === "Ready" ? "green" : "amber"}>{document.status}</StatusPill></button>)}<div className="document-sidebar-footer"><div className="mini-progress"><span><b>4</b> dari 4 dokumen</span><b>100%</b></div><div className="progress-track"><i style={{ width: "100%" }} /></div><small>Draft memakai snapshot transaksi R{shipment.documentRevision}. Terbitkan hanya setelah review manusia.</small></div></aside><section className="document-preview-wrap"><DocumentSettings shipment={shipment} update={update} onLetterheadImage={handleLetterheadImage} /><div className="preview-toolbar"><div><span className="eyebrow">PREVIEW / {selectedDocument.toUpperCase()}</span><h2>{selectedDocument}</h2><div className="document-output-status">Output: English · {shipment.paperSize} · {shipment.documentOrientation} · {shipment.documentTemplate} · R{shipment.documentRevision}</div></div><div className="preview-actions"><button className="ghost-button" type="button" onClick={finishReview}><Check size={15} /> Selesai diperiksa</button><button className="dark-button" type="button" onClick={printDocument}><Printer size={15} /> Print / PDF · English</button></div></div><div className={`paper-document paper-${shipment.paperSize.toLowerCase()} paper-${shipment.documentOrientation.toLowerCase()} paper-template-${shipment.documentTemplate.toLowerCase().replace(" ", "-")}`}><div className="paper-header"><div className="paper-letterhead">{shipment.letterheadImage ? <img src={shipment.letterheadImage} alt="Logo/kop perusahaan eksportir" /> : <div className="paper-no-logo">Logo perusahaan belum dipilih</div>}<div><b>{shipment.exporter}</b><small>{shipment.letterheadText || "Tambahkan alamat, kontak, dan identitas perusahaan"}</small></div></div><div className="paper-title"><span>{selectedDocument === "Bill of Lading" ? "DRAFT / REFERENCE B/L" : selectedDocument.toUpperCase()}</span><strong>{getDocumentNumber(selectedDocument, shipment.reference)}</strong><small>{shipment.paperSize} · {shipment.documentOrientation} · R{shipment.documentRevision}</small></div></div><div className="paper-rule" /><div className="paper-parties"><div><span>{docCopy(shipment.previewLanguage, "EXPORTER / SHIPPER", "EKSPORTIR / PENGIRIM")}</span><b>{shipment.exporter}</b><p>{shipment.letterheadText || "Company address and contact"}</p></div><div><span>{docCopy(shipment.previewLanguage, "BUYER / CONSIGNEE", "BUYER / PENERIMA")}</span><b>{shipment.buyer}</b><p>{shipment.destination}<br />{shipment.buyerCountry}</p></div><div><span>{docCopy(shipment.previewLanguage, "SHIPMENT TERMS", "KETENTUAN PENGIRIMAN")}</span><b>{shipment.incoterm} · {shipment.currency}</b><p>{docCopy(shipment.previewLanguage, "Payment", "Pembayaran")}: {shipment.paymentTerms}<br />{docCopy(shipment.previewLanguage, "Named place", "Named place")}: {shipment.namedPlace}</p></div></div>{selectedDocument === "Bill of Lading" ? <BlContent shipment={shipment} container={container} language={shipment.previewLanguage} /> : selectedDocument === "Packing List" ? <PackingListContent shipment={shipment} container={container} language={shipment.previewLanguage} /> : <InvoiceContent shipment={shipment} pricing={pricing} commercial={selectedDocument === "Commercial Invoice"} language={shipment.previewLanguage} />}</div></section></div>
  );
}
function DocumentSettings({ shipment, update, onLetterheadImage }: { shipment: Shipment; update: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void; onLetterheadImage: (file?: File) => void }) {
  const templates: { name: DocumentTemplate; detail: string }[] = [{ name: "Classic Trade", detail: "Formal · tabel terstruktur" }, { name: "Corporate Clean", detail: "Header identitas · hierarki jelas" }, { name: "Minimal", detail: "Ringkas · whitespace cukup" }];
  const changeLanguage = (value: string) => { update("previewLanguage", value as PreviewLanguage); update("documentReviewed", false); };
  return <section className="document-settings panel panel-padding"><div className="document-settings-head"><div><span className="eyebrow">DOCUMENT APPEARANCE</span><h3>Setelan output & identitas perusahaan</h3><p>Preview mengikuti setelan ini. Print/PDF selalu English dan tidak menyisipkan logo EksporFlow.</p></div><StatusPill tone={shipment.documentReviewed ? "green" : "blue"}><FileText size={11} /> {shipment.documentReviewed ? "Reviewed" : `Draft R${shipment.documentRevision}`}</StatusPill></div><div className="document-settings-grid"><SelectField label="Ukuran kertas" value={shipment.paperSize} onChange={(value) => update("paperSize", value as PaperSize)}><option value="A4">A4 · 210 × 297 mm</option><option value="Letter">US Letter · 8.5 × 11 in</option><option value="Legal">Legal · 8.5 × 14 in</option></SelectField><SelectField label="Orientasi" value={shipment.documentOrientation} onChange={(value) => update("documentOrientation", value as DocumentOrientation)}><option value="Portrait">Portrait · default</option><option value="Landscape">Landscape · tabel lebar</option></SelectField><SelectField label="Bahasa preview" value={shipment.previewLanguage} onChange={changeLanguage}><option value="English">English</option><option value="Bahasa Indonesia">Bahasa Indonesia · preview</option></SelectField><Field label="Named place / port" value={shipment.namedPlace} onChange={(value) => update("namedPlace", value)} /><Field label="Teks kop surat" value={shipment.letterheadText} onChange={(value) => update("letterheadText", value)} /><label className="file-field"><span>Upload logo/kop perusahaan</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => onLetterheadImage(event.target.files?.[0])} /><small>{shipment.letterheadImage ? "Logo perusahaan aktif · pilih file baru untuk mengganti" : "PNG, JPG, WEBP · maksimal 2 MB · opsional"}</small></label>{shipment.letterheadImage && <button type="button" className="remove-letterhead" onClick={() => update("letterheadImage", "")}><X size={14} /> Hapus logo perusahaan</button>}</div><div className="template-gallery"><div><span className="eyebrow">TEMPLATE GALLERY</span><small>Disimpan pada draft dokumen; perubahan berikutnya menjadi revisi.</small></div><div className="template-options">{templates.map((template) => <button type="button" key={template.name} className={shipment.documentTemplate === template.name ? "active" : ""} onClick={() => update("documentTemplate", template.name)}><b>{template.name}</b><small>{template.detail}</small></button>)}</div></div></section>;
}
function InvoiceContent({ shipment, pricing, commercial, language }: { shipment: Shipment; pricing: Pricing; commercial: boolean; language: PreviewLanguage }) { return <><table className="paper-table"><thead><tr><th>{docCopy(language, "DESCRIPTION OF GOODS", "DESKRIPSI BARANG")}</th><th>HS CODE</th><th>{docCopy(language, "QUANTITY", "JUMLAH")}</th><th>{docCopy(language, "UNIT PRICE", "HARGA UNIT")}</th><th>{docCopy(language, "TOTAL", "TOTAL")}</th></tr></thead><tbody>{shipment.lineItems.map((item) => <tr key={item.id}><td><b>{item.description}</b><small>Export grade · Indonesia</small></td><td>{item.hsCode || "—"}</td><td>{formatNumber(item.quantity)} {item.unit}</td><td>{formatMoney(item.unitPrice, shipment.currency)}</td><td><b>{formatMoney(item.quantity * item.unitPrice, shipment.currency)}</b></td></tr>)}<tr><td><b>{docCopy(language, "Export packaging & handling", "Kemasan & handling ekspor")}</b><small>Ready for review</small></td><td>—</td><td>1 lot</td><td>—</td><td><b>{formatMoney(shipment.packaging, shipment.currency)}</b></td></tr></tbody></table><div className="paper-summary"><div><span>{docCopy(language, "Subtotal", "Subtotal")}</span><b>{formatMoney(pricing.active.cost, shipment.currency)}</b></div><div><span>{docCopy(language, commercial ? "Margin / commercial value" : "Margin / offer", commercial ? "Margin / nilai komersial" : "Margin / penawaran")}</span><b>{formatMoney(pricing.active.profit, shipment.currency)}</b></div><div className="paper-total"><span>{commercial ? "TOTAL COMMERCIAL VALUE" : "TOTAL AMOUNT DUE"}</span><strong>{formatMoney(pricing.active.offer, shipment.currency)}</strong></div></div><div className="paper-notes"><div><span>{docCopy(language, "NOTES", "CATATAN")}</span><p>{docCopy(language, "Country of origin", "Negara asal")}: Indonesia<br />Incoterm: {shipment.incoterm} · {docCopy(language, "Named place", "Named place")}: {shipment.namedPlace}<br />All banking charges outside Indonesia are for buyer's account.</p></div><div className="signature-box"><span>AUTHORIZED SIGNATURE</span><div /></div></div></>; }
function BlContent({ shipment, container, language }: { shipment: Shipment; container: { totalVolume: number; totalWeight: number }; language: PreviewLanguage }) { return <><div className="draft-warning"><ShieldAlert size={14} /> {docCopy(language, "DRAFT / REFERENCE ONLY — not carrier-issued and not proof of shipment.", "HANYA DRAFT / REFERENSI — bukan dokumen carrier dan bukan bukti pengiriman.")}</div><div className="bl-grid"><div><span>PORT OF LOADING</span><b>Surabaya, Indonesia</b></div><div><span>PORT OF DISCHARGE</span><b>{shipment.namedPlace}</b></div><div><span>PLACE OF DELIVERY</span><b>{shipment.destination}</b></div><div><span>FREIGHT TERMS</span><b>Prepaid · {shipment.incoterm}</b></div></div><table className="paper-table"><thead><tr><th>MARKS & NUMBERS</th><th>NO. OF PACKAGES</th><th>DESCRIPTION</th><th>GROSS WEIGHT</th><th>MEASUREMENT</th></tr></thead><tbody><tr><td>{shipment.reference}</td><td>{formatNumber(shipment.cartonQty)} CTNS</td><td><b>{shipment.product}</b><small>{shipment.containerType} · {shipment.packageType}</small></td><td>{formatNumber(container.totalWeight, 0)} KG</td><td>{formatNumber(container.totalVolume, 2)} CBM</td></tr></tbody></table><div className="bl-footer-note">Draft prepared from transaction workspace data. Carrier, customs, and operational review required.</div></>; }
function PackingListContent({ shipment, container, language }: { shipment: Shipment; container: { totalVolume: number; totalWeight: number }; language: PreviewLanguage }) { return <><div className="bl-grid"><div><span>{docCopy(language, "PACKING TYPE", "JENIS KEMASAN")}</span><b>{shipment.packageType}</b></div><div><span>CONTAINER</span><b>{shipment.containerType}</b></div><div><span>CONTAINER NUMBER</span><b>{shipment.containerNumber || "To be assigned"}</b></div><div><span>SEAL NUMBER</span><b>{shipment.sealNumber || "To be assigned"}</b></div></div><table className="paper-table"><thead><tr><th>PACKING MARKS</th><th>NO. OF PACKAGES</th><th>DESCRIPTION OF GOODS</th><th>NET / GROSS WEIGHT</th><th>MEASUREMENT</th></tr></thead><tbody>{shipment.lineItems.map((item) => { const itemGross = item.weight * item.quantity; const itemNet = itemGross * (1 - Math.min(100, Math.max(0, item.shrinkageRate || 0)) / 100); const itemVolume = (item.length * item.width * item.height * item.quantity) / 1_000_000; return <tr key={item.id}><td>{shipment.reference}<small>Made in Indonesia</small></td><td>{formatNumber(item.quantity)} {item.unit.toUpperCase()}</td><td><b>{item.description}</b><small>HS Code {item.hsCode || "—"} · {item.packagingType}</small></td><td>{formatNumber(itemNet, 0)} / {formatNumber(itemGross, 0)} KG</td><td>{formatNumber(itemVolume, 2)} CBM</td></tr>; })}</tbody></table><div className="paper-notes"><div><span>{docCopy(language, "PACKING NOTES", "CATATAN KEMASAN")}</span><p>{docCopy(language, "Gross weight excludes no product shrinkage; shrinkage is shown separately in the load plan.", "Berat kotor tidak dikurangi susut produk; susut ditampilkan terpisah di rencana muatan.")}<br />Net/gross weight remains an operational estimate and must be confirmed at stuffing.</p></div><div className="signature-box"><span>WAREHOUSE CHECK</span><div /></div></div></>; }
function OperationsModule({ shipment, update }: { shipment: Shipment; update: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void }) {
  const statuses: ShipmentStatus[] = ["Draft", "Quotation", "Confirmed", "Ready to Ship", "Booked", "Stuffing", "Departed", "In Transit", "Completed"];
  const currentIndex = statuses.indexOf(shipment.shipmentStatus);
  const addAttachment = (file?: File) => { if (file && !shipment.attachments.includes(file.name)) update("attachments", [...shipment.attachments, file.name]); };
  const removeAttachment = (name: string) => update("attachments", shipment.attachments.filter((attachment) => attachment !== name));
  return <div className="module-stack"><section className="panel panel-padding"><div className="panel-head"><div><span className="eyebrow">SHIPMENT CONTROL TOWER</span><h2 className="ops-title">{shipment.reference} · {shipment.buyer}</h2><p className="ops-description">Satu timeline untuk menjaga shipment bergerak dan memastikan setiap handoff punya bukti.</p></div><StatusPill tone={shipment.shipmentStatus === "Completed" ? "green" : "amber"}>{shipment.shipmentStatus}</StatusPill></div><div className="status-track">{statuses.map((status, index) => <button type="button" key={status} className={`status-step ${index <= currentIndex ? "done" : ""} ${status === shipment.shipmentStatus ? "current" : ""}`} onClick={() => update("shipmentStatus", status)}><span>{index + 1}</span><small>{status}</small></button>)}</div></section><div className="content-grid two-thirds"><section className="panel panel-padding"><div className="panel-head"><div><span className="eyebrow">SHIPMENT REFERENCES</span><h3>Master data & booking</h3></div><StatusPill tone="blue">Satu transaksi</StatusPill></div><div className="form-grid two"><Field label="PO buyer" value={shipment.poNumber} onChange={(value) => update("poNumber", value)} /><Field label="Booking number" value={shipment.bookingNumber} onChange={(value) => update("bookingNumber", value)} /><Field label="Container number" value={shipment.containerNumber} onChange={(value) => update("containerNumber", value)} /><Field label="Seal number" value={shipment.sealNumber} onChange={(value) => update("sealNumber", value)} /></div><div className="handoff-note"><Check size={15} /><span><b>Buyer, produk, Incoterm, harga, dan dokumen terhubung.</b><small>Setiap perubahan pada workspace akan tercermin di invoice, Packing List, B/L, dan risk check.</small></span></div></section><section className="panel panel-padding"><div className="panel-head"><div><span className="eyebrow">DOCUMENT ARCHIVE</span><h3>Lampiran transaksi</h3></div><label className="upload-button"><UploadCloud size={15} /> Upload<input type="file" onChange={(event) => addAttachment(event.target.files?.[0])} /></label></div><div className="attachment-list">{shipment.attachments.length ? shipment.attachments.map((attachment) => <div className="attachment-row" key={attachment}><FileText size={15} /><span>{attachment}<small>Terhubung ke {shipment.reference}</small></span><button type="button" onClick={() => removeAttachment(attachment)}><X size={14} /></button></div>) : <div className="empty-attachment"><FileDown size={17} /> Belum ada lampiran. Upload PO, sertifikat, atau draft forwarder.</div>}</div></section></div><section className="panel panel-padding"><div className="panel-head"><div><span className="eyebrow">HANDOFF CHECKLIST</span><h3>Kontrol sebelum berangkat</h3></div><span className="muted-note">Klik status shipment untuk memperbarui fase</span></div><div className="ops-checks"><OpsCheck label="PO buyer dan terms pembayaran" ok={Boolean(shipment.poNumber && shipment.paymentTerms)} /><OpsCheck label="Harga dan Incoterm sudah ditetapkan" ok={Boolean(shipment.incoterm && shipment.unitPrice > 0)} /><OpsCheck label="Packing List dan dokumen komersial" ok={Boolean(shipment.product && shipment.quantity > 0)} /><OpsCheck label="Booking, container, dan seal" ok={Boolean(shipment.bookingNumber && shipment.containerNumber && shipment.sealNumber)} /></div></section></div>;
}
function OpsCheck({ label, ok }: { label: string; ok: boolean }) { return <div className="ops-check"><span className={`check-circle ${ok ? "done" : ""}`}>{ok && <Check size={13} />}</span><b>{label}</b><StatusPill tone={ok ? "green" : "amber"}>{ok ? "Lengkap" : "Perlu isi"}</StatusPill></div>; }

function RiskModule({ shipment, update, pricing, container, setActiveTab }: { shipment: Shipment; update: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void; pricing: Pricing; container: ContainerCalc; setActiveTab: (tab: Tab) => void }) {
  type LegalChecklist = { hsCodeReviewed: boolean; originEvidence: boolean; paymentTermsReviewed: boolean; sanctionsScreened: boolean };
  const [legalChecklist, setLegalChecklist] = useState<LegalChecklist>(() => {
    const defaults: LegalChecklist = { hsCodeReviewed: false, originEvidence: false, paymentTermsReviewed: false, sanctionsScreened: false };
    try { return { ...defaults, ...(JSON.parse(localStorage.getItem(`eksporflow-legal-${shipment.reference}`) || "{}") as Partial<LegalChecklist>) }; } catch { return defaults; }
  });
  useEffect(() => { localStorage.setItem(`eksporflow-legal-${shipment.reference}`, JSON.stringify(legalChecklist)); }, [legalChecklist, shipment.reference]);
  const toggleLegal = (key: keyof LegalChecklist) => setLegalChecklist((current) => ({ ...current, [key]: !current[key] }));
  const hasPoEvidence = shipment.attachments.some((attachment) => /po|purchase|order/i.test(attachment));
  const hasEmailEvidence = shipment.attachments.some((attachment) => /email|mail|confirmation|correspondence/i.test(attachment));
  const addScreeningEvidence = (file?: File) => { if (!file) return; if (!/pdf|image|msword|officedocument|text/.test(file.type)) { toast.error("Format bukti belum didukung", { description: "Gunakan PDF, gambar, DOC/DOCX, atau TXT." }); return; } if (!shipment.attachments.includes(file.name)) update("attachments", [...shipment.attachments, file.name]); toast.success("Bukti screening ditambahkan", { description: `${file.name} tersimpan sebagai lampiran transaksi.` }); };
  const threeWayConsistent = pricing.totalQuantity === shipment.quantity && shipment.quantity === shipment.cartonQty && shipment.lineItems.every((item) => item.quantity > 0 && Boolean(item.hsCode));
  const checks = [
    { label: "Identitas buyer & tujuan", detail: "Buyer, negara, dan lokasi pengiriman terisi.", ok: Boolean(shipment.buyer && shipment.buyerCountry && shipment.destination), action: () => setActiveTab("ringkasan") },
    { label: "HS Code & country of origin", detail: "HS Code tersedia untuk review klasifikasi dan COO.", ok: Boolean(shipment.hsCode), action: () => setActiveTab("ringkasan") },
    { label: "Kapasitas kontainer", detail: `${container.volumeUtilization.toFixed(0)}% volume · ${container.weightUtilization.toFixed(0)}% berat`, ok: container.volumeUtilization <= 100 && container.weightUtilization <= 100, action: () => setActiveTab("muatan") },
    { label: "Kelengkapan dokumen", detail: "Invoice, Packing List, dan B/L dapat dibuat dari data yang sama.", ok: Boolean(shipment.product && shipment.quantity && shipment.letterheadText), action: () => setActiveTab("dokumen") },
    { label: "3-way consistency", detail: "Quantity dan HS Code invoice = Packing List = rencana stuffing.", ok: threeWayConsistent, action: () => setActiveTab("harga") },
    { label: "Booking & seal traceability", detail: "Nomor booking, kontainer, dan seal mencegah salah serah.", ok: Boolean(shipment.bookingNumber && shipment.containerNumber && shipment.sealNumber), action: () => setActiveTab("operasional") },
    { label: "Arsip bukti transaksi", detail: `${shipment.attachments.length} lampiran tersimpan untuk audit trail.`, ok: shipment.attachments.length > 0, action: () => setActiveTab("operasional") },
    { label: "Legal checklist selesai", detail: "Empat checkpoint internal ditandai dan siap direview pihak berwenang.", ok: Object.values(legalChecklist).filter(Boolean).length === 4, action: () => setActiveTab("dokumen") },
    { label: "Buyer screening berbasis bukti", detail: `${hasPoEvidence ? "PO terdeteksi" : "PO belum terdeteksi"} · ${hasEmailEvidence ? "email terdeteksi" : "email belum terdeteksi"}.`, ok: hasPoEvidence && hasEmailEvidence, action: () => setActiveTab("operasional") },
  ];
  const legalItems: { key: keyof LegalChecklist; label: string; detail: string }[] = [
    { key: "hsCodeReviewed", label: "HS Code dikonfirmasi", detail: "Konfirmasi dengan customs/broker, bukan hanya mengandalkan saran otomatis." },
    { key: "originEvidence", label: "Bukti asal barang tersedia", detail: "Siapkan COO, supplier declaration, atau dokumen asal yang relevan." },
    { key: "paymentTermsReviewed", label: "Terms pembayaran direview", detail: "Pastikan DP, jatuh tempo, bank charges, dan trigger release dipahami." },
    { key: "sanctionsScreened", label: "Screening buyer & negara dilakukan", detail: "Catat hasil screening internal dan eskalasi bila ada match atau data kurang." },
  ];
  const passed = checks.filter((check) => check.ok).length;
  const riskLevel = passed === checks.length ? "Review complete — verify" : passed >= 6 ? "Review required" : "High attention";
  return <div className="module-stack"><div className={`risk-hero ${riskLevel === "Review complete — verify" ? "safe" : riskLevel === "Review required" ? "review" : "high"}`}><div><span className="eyebrow light">EXPORT RISK CONTROL</span><h2>{riskLevel}</h2><p>{passed} dari {checks.length} kontrol wajib terpenuhi; hasil ini bukan legal clearance atau izin release otomatis untuk {shipment.reference}.</p></div><div className="risk-score"><strong>{Math.round((passed / checks.length) * 100)}%</strong><span>readiness</span></div></div><div className="content-grid two-thirds"><section className="panel panel-padding"><div className="panel-head"><div><span className="eyebrow">PRE-DEPARTURE CHECKS</span><h3>Temuan & mitigasi</h3></div><ShieldAlert size={19} className="panel-spark" /></div><div className="risk-list">{checks.map((check) => <button type="button" className={`risk-row ${check.ok ? "ok" : "warning"}`} key={check.label} onClick={check.action}><span className="risk-icon">{check.ok ? <Check size={15} /> : <ShieldAlert size={15} />}</span><span><b>{check.label}</b><small>{check.detail}</small></span><StatusPill tone={check.ok ? "green" : "amber"}>{check.ok ? "Passed" : "Action"}</StatusPill><ChevronRight size={15} /></button>)}</div></section><section className="panel panel-padding"><div className="panel-head"><div><span className="eyebrow">RISK PLAYBOOK</span><h3>Guardrails ekspor</h3></div></div><div className="guardrail-list"><div><b>Jangan release tanpa 3-way check</b><p>Invoice, Packing List, dan B/L harus memakai quantity, berat, dan tujuan yang konsisten.</p></div><div><b>Konfirmasi seal saat stuffing</b><p>Foto stuffing dan seal number menjadi bukti jika terjadi dispute atau claim.</p></div><div><b>Review HS Code sebelum quote</b><p>Validasi klasifikasi dan dokumen asal dengan pihak customs/broker sebelum final.</p></div><div><b>Gunakan approval internal</b><p>Jangan kirim harga atau dokumen final sebelum pihak yang berwenang menyetujui.</p></div></div></section></div><div className="content-grid two-thirds"><section className="panel panel-padding"><div className="panel-head"><div><span className="eyebrow">LEGAL REVIEW GATE</span><h3>Checklist validasi sebelum release</h3><p className="profile-description">Checklist ini membantu mitigasi risiko; bukan pengganti review customs, bank, atau penasihat hukum.</p></div><ShieldCheck size={18} className="panel-spark" /></div><div className="legal-checklist">{legalItems.map((item) => <label className="legal-check-row" key={item.key}><input type="checkbox" checked={Boolean(legalChecklist[item.key])} onChange={() => toggleLegal(item.key)} /><span><b>{item.label}</b><small>{item.detail}</small></span><StatusPill tone={legalChecklist[item.key] ? "green" : "amber"}>{legalChecklist[item.key] ? "Checked" : "Review"}</StatusPill></label>)}</div></section><section className="panel panel-padding"><div className="panel-head"><div><span className="eyebrow">BUYER / PO SCREENING</span><h3>Bukti yang bisa diaudit</h3><p className="profile-description">Sistem hanya mencatat bukti yang Anda unggah; tidak menyatakan buyer asli atau bebas sanksi.</p></div><FileSearch size={18} className="panel-spark" /></div><div className="screening-status"><div className={hasPoEvidence ? "verified" : "pending"}><MailCheck size={15} /><span><b>PO / Purchase Order</b><small>{hasPoEvidence ? "Bukti terdeteksi di arsip transaksi." : "Upload PO atau nama file yang jelas."}</small></span><StatusPill tone={hasPoEvidence ? "green" : "amber"}>{hasPoEvidence ? "Ada" : "Belum"}</StatusPill></div><div className={hasEmailEvidence ? "verified" : "pending"}><MessageCircle size={15} /><span><b>Email / buyer confirmation</b><small>{hasEmailEvidence ? "Bukti komunikasi terdeteksi di arsip transaksi." : "Upload export email atau konfirmasi buyer."}</small></span><StatusPill tone={hasEmailEvidence ? "green" : "amber"}>{hasEmailEvidence ? "Ada" : "Belum"}</StatusPill></div></div><label className="upload-button screening-upload"><UploadCloud size={15} /> Tambah bukti screening<input type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt" onChange={(event) => addScreeningEvidence(event.target.files?.[0])} /></label></section></div><section className="panel panel-padding"><div className="panel-head"><div><span className="eyebrow">AUDIT SNAPSHOT</span><h3>Ringkasan kontrol {shipment.reference}</h3></div><span className="muted-note">Harga aktif {formatMoney(pricing.active.offer, shipment.currency)}</span></div><div className="audit-grid"><div><span>STATUS</span><b>{shipment.shipmentStatus}</b></div><div><span>INCOTERM</span><b>{shipment.incoterm}</b></div><div><span>LEGAL CHECK</span><b>{Object.values(legalChecklist).filter(Boolean).length}/4</b></div><div><span>LAST CHECK</span><b>Baru saja</b></div></div></section></div>;
}

function MasterDataModule({ shipment, update, updateNumber }: { shipment: Shipment; update: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void; updateNumber: (key: keyof Shipment, value: string) => void }) {
  const buyers = [{ name: shipment.buyer, country: shipment.buyerCountry, destination: shipment.destination, terms: shipment.paymentTerms }, { name: "Baltic Organics OÜ", country: "Estonia", destination: "Tallinn, Estonia", terms: "50% DP / 50% before shipment" }, { name: "Pacific Wholefoods Pty Ltd", country: "Australia", destination: "Melbourne, Australia", terms: "30 days after B/L" }];
  const products = shipment.lineItems.map((item) => ({ name: item.description, hsCode: item.hsCode, quantity: item.quantity, unit: item.unit, unitPrice: item.unitPrice }));
  const applyBuyer = (buyer: typeof buyers[number]) => { update("buyer", buyer.name); update("buyerCountry", buyer.country); update("destination", buyer.destination); update("paymentTerms", buyer.terms); toast.success("Buyer diterapkan", { description: `${buyer.name} sekarang menjadi buyer transaksi aktif.` }); };
  const applyProduct = (product: typeof products[number]) => { update("product", product.name); update("hsCode", product.hsCode); updateNumber("quantity", String(product.quantity)); updateNumber("unitPrice", String(product.unitPrice)); toast.success("Produk diterapkan", { description: `${product.name} masuk ke transaksi aktif.` }); };
  return <div className="module-stack"><section className="panel panel-padding"><div className="panel-head"><div><span className="eyebrow">MASTER DATA</span><h2 className="ops-title">Library operasional</h2><p className="ops-description">Simpan profil buyer dan produk agar quote berikutnya lebih cepat dan konsisten.</p></div><StatusPill tone="blue"><Database size={11} /> Local workspace</StatusPill></div><div className="master-columns"><div><div className="master-section-head"><span className="eyebrow">BUYER & CONSIGNEE</span><button type="button" className="text-button" onClick={() => toast("Form buyer baru siap ditambahkan pada batch berikutnya")}>+ Tambah buyer</button></div><div className="master-list">{buyers.map((buyer) => <div className={`master-card ${buyer.name === shipment.buyer ? "selected" : ""}`} key={buyer.name}><div className="master-card-icon"><UserRound size={16} /></div><div><b>{buyer.name}</b><small>{buyer.country} · {buyer.destination}</small><em>{buyer.terms}</em></div><button type="button" onClick={() => applyBuyer(buyer)}>{buyer.name === shipment.buyer ? "Aktif" : "Pakai"}</button></div>)}</div></div><div><div className="master-section-head"><span className="eyebrow">PRODUCT CATALOG</span><button type="button" className="text-button" onClick={() => toast("Form produk baru siap ditambahkan pada batch berikutnya")}>+ Tambah produk</button></div><div className="master-list">{products.map((product) => <div className="master-card selected" key={product.name}><div className="master-card-icon product"><Package size={16} /></div><div><b>{product.name}</b><small>HS {product.hsCode || "belum diisi"} · {product.unit}</small><em>{formatNumber(product.quantity)} × {formatMoney(product.unitPrice, shipment.currency)}</em></div><button type="button" onClick={() => applyProduct(product)}>Pakai</button></div>)}</div></div></div></section><section className="panel panel-padding"><div className="panel-head"><div><span className="eyebrow">DATA GOVERNANCE</span><h3>Aturan penggunaan master data</h3></div></div><div className="governance-grid"><div><Check size={15} /><span><b>Satu sumber data</b><small>Buyer dan produk yang dipilih mengisi seluruh dokumen yang terhubung.</small></span></div><div><ShieldAlert size={15} /><span><b>Review sebelum kirim</b><small>Master data membantu konsisten, tetapi HS Code tetap wajib dikonfirmasi dengan broker/customs.</small></span></div><div><History size={15} /><span><b>Versioning berikutnya</b><small>Riwayat perubahan per master record akan ditambahkan pada batch approval.</small></span></div></div></section></div>;
}

function ContainerModule({ shipment, update, updateNumber, updateLineItems, container }: { shipment: Shipment; update: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void; updateNumber: (key: keyof Shipment, value: string) => void; updateLineItems: (items: LineItem[]) => void; container: ContainerCalc }) {
  const overload = container.weightUtilization > 100 || container.volumeUtilization > 100;
  return <div className="module-stack"><div className="container-top-grid"><section className="panel panel-padding"><SectionTitle eyebrow="PACKING INPUT" title="Detail kemasan" description="Ukuran dan jenis kemasan setiap produk bisa diatur langsung di halaman ini." /><div className="form-grid two"><Field label="Jenis kemasan default" value={shipment.packageType} onChange={(value) => update("packageType", value)} /><SelectField label="Tipe kontainer" value={shipment.containerType} onChange={(value) => update("containerType", value as Shipment["containerType"])}><option value="20GP">20' General Purpose</option><option value="40GP">40' General Purpose</option><option value="40HC">40' High Cube</option></SelectField><Field label="Panjang fallback" value={shipment.cartonLength} type="number" suffix="cm" onChange={(value) => updateNumber("cartonLength", value)} /><Field label="Lebar fallback" value={shipment.cartonWidth} type="number" suffix="cm" onChange={(value) => updateNumber("cartonWidth", value)} /><Field label="Tinggi fallback" value={shipment.cartonHeight} type="number" suffix="cm" onChange={(value) => updateNumber("cartonHeight", value)} /><Field label="Berat fallback" value={shipment.cartonWeight} type="number" suffix="kg" step="0.1" onChange={(value) => updateNumber("cartonWeight", value)} /><Field label="Jumlah fallback" value={shipment.cartonQty} type="number" suffix="ctns" onChange={(value) => updateNumber("cartonQty", value)} /></div><div className="container-input-note"><Package size={15} /><span><b>Per produk bisa berbeda</b><small>Edit langsung di sini; perubahan akan mengalir ke kalkulator, invoice, Packing List, dan simulasi 3D.</small></span></div><LineItemsEditor items={shipment.lineItems} updateItems={updateLineItems} currency={shipment.currency} /></section><section className={`load-result ${overload ? "overload" : ""}`}><div className="load-result-head"><span className="eyebrow light">STUFFING ESTIMATE</span><StatusPill tone={overload ? "amber" : "green"}>{overload ? "Melebihi batas input" : "Dalam batas kapasitas terhitung"}</StatusPill></div><div className="container-visual"><div className="container-shell"><div className="container-fill" style={{ width: `${Math.min(100, container.volumeUtilization)}%` }}><span>{container.volumeUtilization.toFixed(0)}%</span></div><div className="container-lines"><i /><i /><i /><i /></div></div><div className="container-end"><span>{shipment.containerType}</span><small>{container.name}</small></div></div><div className="load-numbers"><div><span>EST. CONTAINERS</span><strong>{container.containers}</strong><small>{container.byVolume > 1 ? `Volume meminta ${container.byVolume}` : "1 kontainer cukup"}</small></div><div><span>TOTAL VOLUME</span><strong>{formatNumber(container.totalVolume, 1)} <small>m³</small></strong><small>Kapasitas {formatNumber(container.volume, 1)} m³ / unit</small></div><div><span>TOTAL WEIGHT</span><strong>{formatNumber(container.totalWeight, 0)} <small>kg</small></strong><small>Batas {formatNumber(container.weight / 1000, 1)} ton / unit</small></div></div><div className="load-simulation-strip"><div><span>VOLUME PRODUK</span><b>{formatNumber(container.productVolume, 2)} m³</b></div><div><span>VOLUME PALLET</span><b>{formatNumber(container.palletVolume, 2)} m³</b></div><div><span>BERAT NET</span><b>{formatNumber(container.netWeight, 0)} kg</b></div><div><span>BERAT KOTOR</span><b>{formatNumber(container.grossWeight, 0)} kg</b></div><div><span>BERAT SUSUT</span><b>{formatNumber(container.shrinkageLoss, 0)} kg</b></div></div></section></div><Container3DSimulator shipment={shipment} container={container} /><div className="content-grid two-thirds"><section className="panel panel-padding"><div className="panel-head"><div><span className="eyebrow">CAPACITY USAGE</span><h3>Utilisasi per kontainer</h3></div><span className="muted-note">{container.name}</span></div><UsageBar label="Volume" value={container.volumeUtilization} detail={`${formatNumber(container.totalVolume, 1)} dari ${formatNumber(container.volume * container.containers, 1)} m³`} tone="saffron" /><UsageBar label="Berat kotor" value={container.weightUtilization} detail={`${formatNumber(container.totalWeight, 0)} dari ${formatNumber((container.weight * container.containers) / 1000, 1)} ton`} tone="mint" /><div className={`load-alert ${overload ? "warning" : "ok"}`}>{overload ? <ArrowDownRight size={17} /> : <Check size={17} />}<span><b>{overload ? "Muatan melebihi batas rekomendasi" : "Estimasi dalam batas input"}</b><small>{overload ? "Kurangi quantity, ubah kemasan, atau gunakan lebih dari satu kontainer." : "Susut ditampilkan terpisah; berat kotor tetap memasukkan paket dan pallet kayu jika dipilih. Stacking, lashing, dan distribusi beban wajib direview warehouse."}</small></span></div></section><section className="panel panel-padding"><div className="panel-head"><div><span className="eyebrow">PACKING NOTES</span><h3>Catatan operasional</h3></div><PenLine size={16} className="panel-spark" /></div><div className="packing-notes"><div><span className="note-number">01</span><p>Jenis kemasan dan pallet menentukan footprint aktual; konfirmasi stacking dengan warehouse.</p></div><div><span className="note-number">02</span><p>Susut ditampilkan sebagai metrik terpisah dan tidak otomatis mengurangi berat kotor, volume kemasan, atau jumlah koli.</p></div><div><span className="note-number">03</span><p>Gunakan desiccant dan corner protection untuk rute laut dengan transit panjang.</p></div></div></section></div></div>;
}
function UsageBar({ label, value, detail, tone }: { label: string; value: number; detail: string; tone: string }) { return <div className="usage-row"><div className="usage-label"><b>{label}</b><span>{Math.min(100, value).toFixed(0)}%</span></div><div className="usage-track"><i className={tone} style={{ width: `${Math.min(100, value)}%` }} /></div><small>{detail}</small></div>; }

function Container3DSimulator({ shipment, container }: { shipment: Shipment; container: ContainerCalc }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ThreeEngine | null>(null);
  const [view, setView] = useState<"iso" | "side" | "top">("iso");
  const resetView = () => { setView("iso"); const engine = engineRef.current; if (!engine) return; engine.camera.position.set(container.innerL * 0.95, container.innerH * 1.1, container.innerW * 1.75); engine.controls.target.set(0, container.innerH * 0.3, 0); engine.controls.update(); };
  const palette: Record<string, number> = { "Karton box": 0xf2b84b, "Karung goni": 0xc8914c, Drum: 0x5ca6bd, Sack: 0x8fbd8d, "Crate kayu": 0xb87548, "Kemasan custom": 0x9d7bd9 };
  const items = useMemo(() => shipment.lineItems.map((item) => ({ ...initialShipment.lineItems[0], ...item })), [shipment.lineItems]);
  const previewUnits = Math.min(180, items.reduce((total, item) => total + item.quantity, 0));

  useEffect(() => {
    if (!mountRef.current) return;
    const mount = mountRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1322);
    const camera = new THREE.PerspectiveCamera(42, Math.max(1, mount.clientWidth) / Math.max(1, mount.clientHeight), 1, 5000);
    camera.position.set(container.innerL * 0.95, container.innerH * 1.1, container.innerW * 1.75);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    renderer.setSize(Math.max(1, mount.clientWidth), Math.max(1, mount.clientHeight));
    mount.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.target.set(0, container.innerH * 0.3, 0);
    scene.add(new THREE.AmbientLight(0xffffff, 1.35));
    const light = new THREE.DirectionalLight(0xfff4d6, 1.7);
    light.position.set(container.innerL, container.innerH * 2, container.innerW);
    scene.add(light);
    const cargoGroup = new THREE.Group();
    scene.add(cargoGroup);
    engineRef.current = { scene, camera, renderer, controls, cargoGroup };
    const resize = () => { if (!mountRef.current) return; camera.aspect = Math.max(1, mountRef.current.clientWidth) / Math.max(1, mountRef.current.clientHeight); camera.updateProjectionMatrix(); renderer.setSize(Math.max(1, mountRef.current.clientWidth), Math.max(1, mountRef.current.clientHeight)); };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    let frame = 0;
    const animate = () => { frame = requestAnimationFrame(animate); controls.update(); renderer.render(scene, camera); };
    animate();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); controls.dispose(); renderer.dispose(); mount.removeChild(renderer.domElement); engineRef.current = null; };
  }, [container.innerL, container.innerW, container.innerH]);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    while (engine.cargoGroup.children.length) engine.cargoGroup.remove(engine.cargoGroup.children[0]);
    const { innerL: cL, innerW: cW, innerH: cH } = container;
    const frame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(cL, cH, cW)), new THREE.LineBasicMaterial({ color: 0x6ec9d8 }));
    frame.position.set(0, cH / 2, 0);
    engine.cargoGroup.add(frame);
    const floor = new THREE.GridHelper(Math.max(cL, cW), 24, 0x26404d, 0x172532);
    engine.cargoGroup.add(floor);
    const cellL = Math.max(25, ...items.map((item) => item.length));
    const cellW = Math.max(25, ...items.map((item) => item.width));
    const cellH = Math.max(20, ...items.map((item) => item.height));
    const fitL = Math.max(1, Math.floor(cL / cellL));
    const fitW = Math.max(1, Math.floor(cW / cellW));
    const fitH = Math.max(1, Math.floor(cH / cellH));
    let slot = 0;
    const baseLift = items.some((item) => item.palletEnabled) ? Math.max(...items.map((item) => item.palletEnabled ? item.palletHeight : 0)) : 0;
    items.forEach((item) => {
      const itemUnits = Math.min(item.quantity, Math.max(0, previewUnits - slot));
      for (let index = 0; index < itemUnits; index += 1) {
        const layer = Math.floor(slot / (fitL * fitW));
        const row = Math.floor(slot / fitL) % fitW;
        const col = slot % fitL;
        if (layer >= fitH) break;
        const box = new THREE.Mesh(new THREE.BoxGeometry(Math.max(5, item.length - 2), Math.max(5, item.height - 2), Math.max(5, item.width - 2)), new THREE.MeshLambertMaterial({ color: palette[item.packagingType] || 0xf2b84b, transparent: true, opacity: 0.86 }));
        box.position.set(-cL / 2 + cellL * col + item.length / 2, baseLift + item.height / 2 + cellH * layer, -cW / 2 + cellW * row + item.width / 2);
        engine.cargoGroup.add(box);
        slot += 1;
      }
    });
    let palletSlot = 0;
    items.filter((item) => item.palletEnabled && item.palletCount > 0).forEach((item) => {
      const palletLimit = Math.min(item.palletCount, 36);
      for (let index = 0; index < palletLimit; index += 1) {
        const row = Math.floor(palletSlot / Math.max(1, Math.floor(cL / item.palletLength)));
        const col = palletSlot % Math.max(1, Math.floor(cL / item.palletLength));
        const pallet = new THREE.Mesh(new THREE.BoxGeometry(Math.min(item.palletLength, cL), item.palletHeight, Math.min(item.palletWidth, cW)), new THREE.MeshLambertMaterial({ color: 0x8b5e3c, transparent: true, opacity: 0.75 }));
        pallet.position.set(-cL / 2 + item.palletLength / 2 + col * item.palletLength, item.palletHeight / 2, -cW / 2 + item.palletWidth / 2 + (row % Math.max(1, Math.floor(cW / item.palletWidth))) * item.palletWidth);
        engine.cargoGroup.add(pallet);
        palletSlot += 1;
      }
    });
  }, [container, items, previewUnits]);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const positions: Record<"iso" | "side" | "top", [number, number, number]> = { iso: [container.innerL * 0.95, container.innerH * 1.1, container.innerW * 1.75], side: [0, container.innerH * 0.75, container.innerW * 2.3], top: [0, container.innerH * 2.8, 0] };
    engine.camera.position.set(...positions[view]);
    engine.controls.target.set(0, container.innerH * 0.3, 0);
    engine.controls.update();
  }, [view, container.innerH, container.innerL, container.innerW]);

  return <section className="container-3d-panel panel"><div className="container-3d-head"><div><span className="eyebrow">3D LOAD SIMULATOR</span><h3>Simulasi tata letak kontainer</h3><small>{previewUnits} unit divisualkan · orbit dengan drag · zoom dengan scroll · alat bantu estimasi, bukan sertifikasi keselamatan atau optimizer stuffing</small></div><div className="view-switcher">{(["iso", "side", "top"] as const).map((mode) => <button type="button" className={view === mode ? "active" : ""} key={mode} onClick={() => setView(mode)}>{mode === "iso" ? "Isometric" : mode === "side" ? "Samping" : "Atas"}</button>)}</div><button type="button" className="view-reset" onClick={resetView}><RotateCcw size={13} /> Reset view</button></div><div className="container-3d-viewport" ref={mountRef}><div className="container-3d-legend"><span><i className="legend-swatch amber" />Karton box</span><span><i className="legend-swatch blue" />Drum</span><span><i className="legend-swatch green" />Sack / goni</span><span><i className="legend-swatch wood" />Pallet kayu</span><span><i className="legend-swatch custom" />Custom</span></div><span className="container-3d-badge">{container.innerL} × {container.innerW} × {container.innerH} cm</span></div><div className="container-3d-stats"><div><span>GRID SIMULASI</span><b>{Math.floor(container.innerL / Math.max(25, ...items.map((item) => item.length)))} × {Math.floor(container.innerW / Math.max(25, ...items.map((item) => item.width)))} × {Math.floor(container.innerH / Math.max(20, ...items.map((item) => item.height)))} layer</b></div><div><span>ITEM VISUAL</span><b>{previewUnits} / {formatNumber(items.reduce((total, item) => total + item.quantity, 0))} unit</b></div><div><span>PALLET TERDETEKSI</span><b>{container.palletCount || "Tidak ada"}</b></div></div></section>;
}
