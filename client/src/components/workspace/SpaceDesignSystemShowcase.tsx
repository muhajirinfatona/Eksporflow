import type React from "react";
import { useState } from "react";
import {
  SpaceAvatar,
  SpaceBadge,
  SpaceButton,
  SpaceCheckbox,
  SpaceInput,
  SpacePagination,
  SpaceProgressBar,
  SpaceRadio,
  SpaceSelect,
  SpaceSkeleton,
  SpaceStatCard,
  SpaceTabs,
  SpaceToggle,
  SpaceTooltip,
} from "./Primitives";
import {
  Activity,
  Anchor,
  ArrowRight,
  BarChart3,
  Bell,
  Box,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Eye,
  EyeOff,
  FileText,
  Filter,
  FolderArchive,
  Globe,
  HelpCircle,
  Layers,
  LayoutGrid,
  Lock,
  LogOut,
  Mail,
  Package,
  Plus,
  Search,
  ShieldCheck,
  Ship,
  TrendingUp,
  Truck,
  User,
  Users,
} from "lucide-react";
import type { ScreenId } from "@shared/risk";

export function SpaceDesignSystemShowcase({
  navigate,
}: {
  navigate?: (screen: ScreenId) => void;
}) {
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>("all");
  const [demoInput, setDemoInput] = useState("Kopi Arabika Gayo Grade 1");
  const [demoSelect, setDemoSelect] = useState("fob");
  const [demoCheckbox, setDemoCheckbox] = useState(true);
  const [demoRadio, setDemoRadio] = useState("fcl");
  const [demoToggle, setDemoToggle] = useState(true);
  const [demoPage, setDemoPage] = useState(2);
  const [demoTabPill, setDemoTabPill] = useState("t1");
  const [demoTabUnderline, setDemoTabUnderline] = useState("u1");

  // Sign In / Sign Up Demo State
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin");
  const [authEmail, setAuthEmail] = useState("arif.ekspor@nusantara.id");
  const [authPassword, setAuthPassword] = useState("••••••••••••");
  const [showPassword, setShowPassword] = useState(false);
  const [authRemember, setAuthRemember] = useState(true);
  const [authName, setAuthName] = useState("Arif Pratama");
  const [authCompany, setAuthCompany] = useState("PT Nusantara Ekspor Mandiri");

  return (
    <div className="space-crm-container" style={{ gap: 24, paddingBottom: 48 }}>
      {/* 1. Header Banner */}
      <section
        className="ef-module-hero"
        style={{
          background: "linear-gradient(135deg, #0B192C 0%, #0F2942 100%)",
          color: "#ffffff",
          padding: "24px 28px",
          borderRadius: "var(--space-radius-lg)",
          boxShadow: "var(--space-shadow-md)",
        }}
      >
        <div className="ef-module-hero-copy">
          <span
            className="space-badge space-badge-warning"
            style={{ marginBottom: 10, display: "inline-flex" }}
          >
            FIGMA SPACE DESIGN SYSTEM SPECIFICATION
          </span>
          <h2 style={{ color: "#ffffff", margin: "4px 0 8px", fontSize: 24, fontWeight: 700 }}>
            Design System &amp; Komponen UI EksporFlow
          </h2>
          <p
            style={{
              color: "#cbd5e1",
              margin: 0,
              fontSize: 13.5,
              lineHeight: 1.6,
              maxWidth: 760,
            }}
          >
            Spesifikasi resmi Space Design System yang telah diselaraskan dengan identitas merek
            maritim EksporFlow (Deep Navy <code>#0B192C</code>, Saffron Gold <code>#F59E0B</code>,
            Mint Emerald <code>#10B981</code>). Komprehensif meliputi CRM, Kanban Drag &amp; Drop, Kalender,
            Dual Comparison Chart, Sign In/Up, Form Inputs, Badges, Typography, Shadows, dan Micro-interactions.
          </p>
        </div>

        <div className="ef-hero-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
          {navigate && (
            <>
              <SpaceButton
                variant="accent"
                size="sm"
                icon={<Layers size={14} />}
                onClick={() => navigate("transactions")}
              >
                Lihat CRM &amp; Pipeline Ekspor →
              </SpaceButton>
              <SpaceButton
                variant="outline"
                size="sm"
                icon={<FileText size={14} />}
                onClick={() => navigate("pre_transaction")}
                style={{ borderColor: "rgba(255,255,255,0.25)", color: "#ffffff" }}
              >
                Pra-Transaksi &amp; Validasi
              </SpaceButton>
            </>
          )}
        </div>
      </section>

      {/* 2. Top Summary KPI Stats Grid (SpaceStatCard) */}
      <div className="space-crm-stats-grid">
        <SpaceStatCard
          label="Komponen sistem"
          value="28+"
          badgeText="Lengkap"
          badgeTone="success"
          trend="Atomic primitives & views"
          icon={<Box size={18} />}
        />
        <SpaceStatCard
          label="Status badges & pills"
          value="6 Varian"
          badgeText="Accessible"
          badgeTone="primary"
          trend="Contrast ratio 4.5:1 WCAG"
          icon={<ShieldCheck size={18} />}
        />
        <SpaceStatCard
          label="Aplikasi CRM & alur"
          value="4 Modul"
          badgeText="Active"
          badgeTone="warning"
          trend="Table, Kanban, Cal, Charts"
          icon={<Activity size={18} />}
        />
        <SpaceStatCard
          label="Elevasi & bayangan"
          value="5 Tingkat"
          badgeText="Tokens"
          badgeTone="purple"
          trend="xs, sm, md, lg, xl & blur"
          icon={<Layers size={18} />}
        />
      </div>

      {/* 3. Section: Buttons Showcase */}
      <section className="panel panel-padding">
        <div className="panel-head">
          <div>
            <span className="eyebrow">Tombol &amp; varian aksi</span>
            <h3 style={{ margin: "2px 0 0", fontSize: 17, fontWeight: 600 }}>
              Tombol Space DS (Variants, Sizes &amp; States)
            </h3>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <small style={{ color: "var(--space-gray-500)", display: "block", marginBottom: 8, fontWeight: 500 }}>
              Varian gaya tombol:
            </small>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
              <SpaceButton variant="primary" icon={<Plus size={14} />}>
                Primary Navy
              </SpaceButton>
              <SpaceButton variant="accent" icon={<Compass size={14} />}>
                Accent Gold
              </SpaceButton>
              <SpaceButton variant="secondary" icon={<Filter size={14} />}>
                Secondary Gray
              </SpaceButton>
              <SpaceButton variant="outline" icon={<Ship size={14} />}>
                Outline Stroke
              </SpaceButton>
              <SpaceButton variant="ghost" icon={<Clock size={14} />}>
                Ghost Soft
              </SpaceButton>
              <SpaceButton variant="danger">
                Danger Action
              </SpaceButton>
            </div>
          </div>

          <div>
            <small style={{ color: "var(--space-gray-500)", display: "block", marginBottom: 8, fontWeight: 600 }}>
              SKALA UKURAN &amp; STATUS:
            </small>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
              <SpaceButton size="sm">Ukuran Kecil (sm)</SpaceButton>
              <SpaceButton size="md">Ukuran Standar (md)</SpaceButton>
              <SpaceButton size="lg">Ukuran Besar (lg)</SpaceButton>
              <SpaceButton disabled>Disabled State</SpaceButton>
              <SpaceButton loading>Memproses Data...</SpaceButton>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Section: Inputs, Selects, Checkboxes, Radios, Toggles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 18 }}>
        <section className="panel panel-padding">
          <div className="panel-head">
            <div>
              <span className="eyebrow">TEKS FIELD &amp; FORM INPUT</span>
              <h3 style={{ margin: "2px 0 0", fontSize: 17, fontWeight: 700 }}>
                Input Teks (SpaceInput)
              </h3>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <SpaceInput
              label="Nama Komoditas Ekspor"
              required
              value={demoInput}
              onChange={(e) => setDemoInput(e.target.value)}
              placeholder="Contoh: Kopi Arabika Gayo"
              helperText="Kode HS 6-digit terverifikasi BTKI"
            />
            <SpaceInput
              label="Pencarian Cepat Buyer"
              placeholder="Ketik nama perusahaan importir atau pelabuhan..."
              iconLeft={<Search size={15} />}
            />
            <SpaceInput
              label="Contoh Input Error State"
              value="0901"
              error="Kode HS tidak lengkap. Diperlukan minimal 6 digit angka."
            />
          </div>
        </section>

        <section className="panel panel-padding">
          <div className="panel-head">
            <div>
              <span className="eyebrow">SELECTS, CHECKBOXES &amp; TOGGLES</span>
              <h3 style={{ margin: "2px 0 0", fontSize: 17, fontWeight: 700 }}>
                Pilihan &amp; Sakelar Form
              </h3>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <SpaceSelect
              label="Syarat Penyerahan Barang (Incoterms 2020)"
              value={demoSelect}
              onChange={(e) => setDemoSelect(e.target.value)}
              options={[
                { value: "fob", label: "FOB — Free On Board (Pelabuhan Muat Asal)" },
                { value: "cif", label: "CIF — Cost, Insurance & Freight (Pelabuhan Tujuan)" },
                { value: "cfr", label: "CFR — Cost and Freight" },
                { value: "dap", label: "DAP — Delivered At Place" },
              ]}
            />

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <SpaceCheckbox
                label="Verifikasi Legalitas e-SKA Form AK"
                description="Otomatis validasi melalui INSW dan Kementerian Perdagangan"
                checked={demoCheckbox}
                onChange={setDemoCheckbox}
              />

              <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
                <SpaceRadio
                  name="demo-cargo"
                  label="Kargo FCL (Full Container)"
                  checked={demoRadio === "fcl"}
                  onChange={() => setDemoRadio("fcl")}
                />
                <SpaceRadio
                  name="demo-cargo"
                  label="Kargo LCL (Konsolidasi)"
                  checked={demoRadio === "lcl"}
                  onChange={() => setDemoRadio("lcl")}
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: 10,
                borderTop: "1px solid var(--space-gray-200)",
              }}
            >
              <SpaceToggle
                label="Pelacakan Otomatis Satelit Kapal"
                checked={demoToggle}
                onChange={setDemoToggle}
              />
              <SpaceBadge tone={demoToggle ? "success" : "neutral"} showDot>
                {demoToggle ? "Aktif" : "Nonaktif"}
              </SpaceBadge>
            </div>
          </div>
        </section>
      </div>

      {/* 5. Section: Badges, Avatars, Tooltips, Progress & Skeletons */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 18 }}>
        <section className="panel panel-padding">
          <div className="panel-head">
            <div>
              <span className="eyebrow">BADGES &amp; AVATARS</span>
              <h3 style={{ margin: "2px 0 0", fontSize: 17, fontWeight: 700 }}>
                Status Pills, Avatar &amp; Tooltips
              </h3>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <small style={{ color: "var(--space-gray-500)", display: "block", marginBottom: 8, fontWeight: 600 }}>
                STATUS BADGES:
              </small>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <SpaceBadge tone="primary" showDot>Draft Quotation</SpaceBadge>
                <SpaceBadge tone="success" showDot>Selesai &amp; Lunas</SpaceBadge>
                <SpaceBadge tone="warning" showDot>Menunggu DP 30%</SpaceBadge>
                <SpaceBadge tone="danger" showDot>Revisi B/L</SpaceBadge>
                <SpaceBadge tone="purple" showDot>Dalam Pelayaran</SpaceBadge>
                <SpaceBadge tone="neutral">Incoterms 2020</SpaceBadge>
              </div>
            </div>

            <div>
              <small style={{ color: "var(--space-gray-500)", display: "block", marginBottom: 8, fontWeight: 600 }}>
                AVATAR &amp; STATUS INDIKATOR:
              </small>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <SpaceAvatar name="Nordic Pantry" size="xs" status="online" />
                <SpaceAvatar name="Marubeni Foods" size="sm" status="online" />
                <SpaceAvatar name="PT Nusantara Ekspor" size="md" status="busy" />
                <SpaceAvatar name="Van Dijk" size="lg" status="offline" />
                <SpaceTooltip content="Tooltip micro-interaction Space DS dengan elevation drop shadow">
                  <SpaceButton variant="secondary" size="sm">
                    Hover Tooltip
                  </SpaceButton>
                </SpaceTooltip>
              </div>
            </div>
          </div>
        </section>

        <section className="panel panel-padding">
          <div className="panel-head">
            <div>
              <span className="eyebrow">PROGRESS &amp; SKELETON</span>
              <h3 style={{ margin: "2px 0 0", fontSize: 17, fontWeight: 700 }}>
                Progress Bar &amp; Loading State
              </h3>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <SpaceProgressBar
              value={82}
              label="Kelengkapan Dokumen Ekspor (6/6)"
              detail="82% Selesai"
              tone="primary"
            />
            <SpaceProgressBar
              value={100}
              label="Verifikasi Muatan Kontainer 40HC"
              detail="100% Terverifikasi"
              tone="success"
            />

            <div>
              <small style={{ color: "var(--space-gray-500)", display: "block", marginBottom: 6, fontWeight: 600 }}>
                SHIMMER PULSE SKELETON:
              </small>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <SpaceSkeleton width="100%" height={16} />
                <SpaceSkeleton width="75%" height={14} />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 6. Section: Pagination & Tabs */}
      <section className="panel panel-padding">
        <div className="panel-head">
          <div>
            <span className="eyebrow">TABS &amp; PAGINATION</span>
            <h3 style={{ margin: "2px 0 0", fontSize: 17, fontWeight: 700 }}>
              Tab Segmented Control &amp; Pagination Bar
            </h3>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <small style={{ color: "var(--space-gray-500)", display: "block", marginBottom: 8, fontWeight: 600 }}>
              TAB BAR (PILLS &amp; UNDERLINE):
            </small>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <SpaceTabs
                variant="pills"
                activeTab={demoTabPill}
                onChange={setDemoTabPill}
                tabs={[
                  { id: "t1", label: "Ringkasan Ekspor", count: 12 },
                  { id: "t2", label: "Kontainer & Muatan", count: 4 },
                  { id: "t3", label: "Kepatuhan Lartas" },
                ]}
              />

              <SpaceTabs
                variant="underline"
                activeTab={demoTabUnderline}
                onChange={setDemoTabUnderline}
                tabs={[
                  { id: "u1", label: "Tabel Pesanan (CRM)" },
                  { id: "u2", label: "Papan Kanban Drag & Drop" },
                  { id: "u3", label: "Kalender Ekspor & Milestones" },
                  { id: "u4", label: "Comparison Chart Analitik" },
                ]}
              />
            </div>
          </div>

          <div>
            <small style={{ color: "var(--space-gray-500)", display: "block", marginBottom: 8, fontWeight: 600 }}>
              PAGINATION BAR (INTERAKTIF):
            </small>
            <div style={{ border: "1px solid var(--space-gray-200)", borderRadius: 10, overflow: "hidden" }}>
              <SpacePagination
                currentPage={demoPage}
                totalItems={64}
                pageSize={10}
                onPageChange={setDemoPage}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 7. Section: Sign In & Sign Up Component (Space DS Login-1 Layout) */}
      <section className="panel panel-padding">
        <div className="panel-head">
          <div>
            <span className="eyebrow">AUTENTIKASI &amp; GERBANG MASUK</span>
            <h3 style={{ margin: "2px 0 0", fontSize: 17, fontWeight: 700 }}>
              Tampilan Sign In &amp; Sign Up (Space DS Layout)
            </h3>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <SpaceButton
              size="sm"
              variant={authTab === "signin" ? "primary" : "secondary"}
              onClick={() => setAuthTab("signin")}
            >
              Sign In (Masuk)
            </SpaceButton>
            <SpaceButton
              size="sm"
              variant={authTab === "signup" ? "primary" : "secondary"}
              onClick={() => setAuthTab("signup")}
            >
              Sign Up (Daftar)
            </SpaceButton>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center", padding: "16px 0" }}>
          <div
            style={{
              width: "100%",
              maxWidth: 440,
              background: "#ffffff",
              border: "1px solid var(--space-gray-200)",
              borderRadius: "var(--space-radius-lg)",
              padding: "32px 28px",
              boxShadow: "var(--space-shadow-md)",
            }}
          >
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #0B192C 0%, #0F2942 100%)",
                  color: "#F59E0B",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                  boxShadow: "0 4px 12px rgba(11, 25, 44, 0.2)",
                }}
              >
                <Ship size={24} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--space-navy-900)", margin: "0 0 6px" }}>
                {authTab === "signin" ? "Sign In to EksporFlow" : "Create EksporFlow Account"}
              </h3>
              <p style={{ fontSize: 13, color: "var(--space-gray-500)", margin: 0 }}>
                {authTab === "signin"
                  ? "Enter your corporate credentials to access workspace"
                  : "Start managing compliant export transactions & shipments"}
              </p>
            </div>

            {/* Quick Demo Social Button */}
            <div style={{ marginBottom: 18 }}>
              <button
                type="button"
                className="space-btn space-btn-secondary"
                style={{ width: "100%", justifyContent: "center", gap: 10, height: 42 }}
                onClick={() => alert("Simulasi: Masuk melalui Single Sign-On")}
              >
                <Globe size={16} />
                <span>Continue with Corporate SSO</span>
              </button>
            </div>

            {/* Divider */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                margin: "18px 0",
                color: "var(--space-gray-400)",
                fontSize: 12,
              }}
            >
              <div style={{ flex: 1, height: 1, background: "var(--space-gray-200)" }} />
              <span>or continue with email</span>
              <div style={{ flex: 1, height: 1, background: "var(--space-gray-200)" }} />
            </div>

            {/* Form Fields */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert(`Simulasi ${authTab === "signin" ? "Login" : "Registrasi"} berhasil!`);
              }}
              style={{ display: "flex", flexDirection: "column", gap: 14 }}
            >
              {authTab === "signup" && (
                <>
                  <SpaceInput
                    label="Full Name"
                    required
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="Nama Lengkap Eksportir"
                    iconLeft={<User size={15} />}
                  />
                  <SpaceInput
                    label="Company Name"
                    required
                    value={authCompany}
                    onChange={(e) => setAuthCompany(e.target.value)}
                    placeholder="PT / CV Nama Perusahaan"
                    iconLeft={<Anchor size={15} />}
                  />
                </>
              )}

              <SpaceInput
                label="Work Email Address"
                required
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="eksportir@perusahaan.co.id"
                iconLeft={<Mail size={15} />}
              />

              <div style={{ position: "relative" }}>
                <SpaceInput
                  label="Password"
                  required
                  type={showPassword ? "text" : "password"}
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="Min. 8 karakter"
                  iconLeft={<Lock size={15} />}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: 32,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--space-gray-500)",
                    display: "flex",
                    alignItems: "center",
                  }}
                  title={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {authTab === "signin" ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
                  <SpaceCheckbox
                    label="Remember me"
                    checked={authRemember}
                    onChange={setAuthRemember}
                  />
                  <a
                    href="#forgot"
                    onClick={(e) => {
                      e.preventDefault();
                      alert("Gunakan menu reset sandi di halaman autentikasi.");
                    }}
                    style={{ fontSize: 12.5, color: "var(--space-navy-700)", fontWeight: 600, textDecoration: "none" }}
                  >
                    Forgot password?
                  </a>
                </div>
              ) : (
                <div style={{ marginTop: 2 }}>
                  <SpaceCheckbox
                    label="I agree to Terms of Service & Privacy Policy"
                    checked={authRemember}
                    onChange={setAuthRemember}
                  />
                </div>
              )}

              <div style={{ marginTop: 6 }}>
                <SpaceButton
                  variant="primary"
                  size="lg"
                  type="submit"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  {authTab === "signin" ? "Sign In to Workspace" : "Create Account"}
                </SpaceButton>
              </div>

              <div style={{ textAlign: "center", marginTop: 8, fontSize: 13, color: "var(--space-gray-500)" }}>
                {authTab === "signin" ? (
                  <span>
                    Don&apos;t have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setAuthTab("signup")}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--space-navy-800)",
                        fontWeight: 600,
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      Sign up
                    </button>
                  </span>
                ) : (
                  <span>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setAuthTab("signin")}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--space-navy-800)",
                        fontWeight: 600,
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      Sign in
                    </button>
                  </span>
                )}
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* 8. Section: CRM Application Suite & Navigation Bar Preview */}
      <section className="panel panel-padding">
        <div className="panel-head">
          <div>
            <span className="eyebrow">CRM SUITE &amp; TOP MENU BAR</span>
            <h3 style={{ margin: "2px 0 0", fontSize: 17, fontWeight: 700 }}>
              Layout CRM, Menu Bar, &amp; Sidebar Navigation
            </h3>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Menu Bar Mock */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid var(--space-gray-200)",
              borderRadius: "var(--space-radius-md)",
              padding: "10px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              boxShadow: "var(--space-shadow-xs)",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "var(--space-navy-900)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ship size={16} />
              </div>
              <span style={{ fontWeight: 700, fontSize: 14, color: "var(--space-navy-900)" }}>
                EksporFlow Workspace
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, maxWidth: 360 }}>
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Search size={14} style={{ position: "absolute", left: 10, color: "var(--space-gray-400)" }} />
                <input
                  type="text"
                  readOnly
                  value="Cari pesanan, buyer, dokumen (Ctrl + K)..."
                  style={{
                    width: "100%",
                    padding: "6px 10px 6px 30px",
                    fontSize: 12.5,
                    border: "1px solid var(--space-gray-200)",
                    borderRadius: 6,
                    background: "var(--space-gray-50)",
                    color: "var(--space-gray-500)",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  position: "relative",
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  border: "1px solid var(--space-gray-200)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--space-gray-600)",
                  cursor: "pointer",
                }}
              >
                <Bell size={15} />
                <span
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "var(--space-mint-500)",
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "4px 10px 4px 6px",
                  borderRadius: 20,
                  border: "1px solid var(--space-gray-200)",
                  background: "#ffffff",
                }}
              >
                <SpaceAvatar name="PT Nusantara Ekspor" size="xs" status="online" />
                <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--space-navy-900)" }}>
                  PT Nusantara Ekspor
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "1px 6px",
                    borderRadius: 4,
                    background: "var(--space-gold-50)",
                    color: "var(--space-gold-800)",
                    border: "1px solid var(--space-gold-300)",
                  }}
                >
                  PRO
                </span>
              </div>
            </div>
          </div>

          {/* 4 CRM Sub-Applications Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
            <div
              style={{
                border: "1px solid var(--space-gray-200)",
                borderRadius: "var(--space-radius-md)",
                padding: "16px",
                background: "#ffffff",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--space-navy-800)" }}>
                <FileText size={18} />
                <span style={{ fontWeight: 700, fontSize: 14 }}>Tabel Pesanan (Orders)</span>
              </div>
              <p style={{ margin: 0, fontSize: 12.5, color: "var(--space-gray-600)", lineHeight: 1.5 }}>
                Filter status, pencarian pembeli, avatar buyer, progress kontainer, dan pagination 10 per halaman.
              </p>
              {navigate && (
                <button
                  type="button"
                  onClick={() => navigate("transactions")}
                  style={{
                    alignSelf: "flex-start",
                    background: "none",
                    border: "none",
                    padding: 0,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--space-navy-800)",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    marginTop: 4,
                  }}
                >
                  Buka Tabel Pesanan <ArrowRight size={12} />
                </button>
              )}
            </div>

            <div
              style={{
                border: "1px solid var(--space-gray-200)",
                borderRadius: "var(--space-radius-md)",
                padding: "16px",
                background: "#ffffff",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--space-navy-800)" }}>
                <LayoutGrid size={18} />
                <span style={{ fontWeight: 700, fontSize: 14 }}>Kanban Pipeline (Drag &amp; Drop)</span>
              </div>
              <p style={{ margin: 0, fontSize: 12.5, color: "var(--space-gray-600)", lineHeight: 1.5 }}>
                5 tahapan ekspor (Inquiry, Quotation, Negosiasi, Kontrak, Produksi) dengan HTML5 drag-and-drop.
              </p>
              {navigate && (
                <button
                  type="button"
                  onClick={() => navigate("transactions")}
                  style={{
                    alignSelf: "flex-start",
                    background: "none",
                    border: "none",
                    padding: 0,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--space-navy-800)",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    marginTop: 4,
                  }}
                >
                  Buka Papan Kanban <ArrowRight size={12} />
                </button>
              )}
            </div>

            <div
              style={{
                border: "1px solid var(--space-gray-200)",
                borderRadius: "var(--space-radius-md)",
                padding: "16px",
                background: "#ffffff",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--space-navy-800)" }}>
                <Calendar size={18} />
                <span style={{ fontWeight: 700, fontSize: 14 }}>Kalender Ekspor &amp; Milestones</span>
              </div>
              <p style={{ margin: 0, fontSize: 12.5, color: "var(--space-gray-600)", lineHeight: 1.5 }}>
                Kalender bulanan dengan chips jadwal kapal (ETD Vessel, Stuffing, Closing PEB, L/C issue).
              </p>
              {navigate && (
                <button
                  type="button"
                  onClick={() => navigate("transactions")}
                  style={{
                    alignSelf: "flex-start",
                    background: "none",
                    border: "none",
                    padding: 0,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--space-navy-800)",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    marginTop: 4,
                  }}
                >
                  Buka Kalender Ekspor <ArrowRight size={12} />
                </button>
              )}
            </div>

            <div
              style={{
                border: "1px solid var(--space-gray-200)",
                borderRadius: "var(--space-radius-md)",
                padding: "16px",
                background: "#ffffff",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--space-navy-800)" }}>
                <BarChart3 size={18} />
                <span style={{ fontWeight: 700, fontSize: 14 }}>Comparison Chart Analitik</span>
              </div>
              <p style={{ margin: 0, fontSize: 12.5, color: "var(--space-gray-600)", lineHeight: 1.5 }}>
                Grafik perbandingan dual-bar (Realisasi vs Target vs Tahun Lalu) dan breakdown komoditas.
              </p>
              {navigate && (
                <button
                  type="button"
                  onClick={() => navigate("transactions")}
                  style={{
                    alignSelf: "flex-start",
                    background: "none",
                    border: "none",
                    padding: 0,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--space-navy-800)",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    marginTop: 4,
                  }}
                >
                  Buka Analitik Chart <ArrowRight size={12} />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 9. Section: Shadows, Elevations & Spacing Scale */}
      <section className="panel panel-padding">
        <div className="panel-head">
          <div>
            <span className="eyebrow">TOKENS: ELEVASI &amp; SHADOWS</span>
            <h3 style={{ margin: "2px 0 0", fontSize: 17, fontWeight: 700 }}>
              Skala Shadow, Elevation &amp; Blur
            </h3>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
          <div
            style={{
              padding: "20px 14px",
              background: "#ffffff",
              borderRadius: 8,
              boxShadow: "var(--space-shadow-xs)",
              textAlign: "center",
              border: "1px solid var(--space-gray-100)",
            }}
          >
            <b style={{ display: "block", fontSize: 13, color: "var(--space-navy-900)" }}>Shadow XS</b>
            <code style={{ fontSize: 11, color: "var(--space-gray-500)" }}>0 1px 2px rgba(0,0,0,0.05)</code>
          </div>

          <div
            style={{
              padding: "20px 14px",
              background: "#ffffff",
              borderRadius: 8,
              boxShadow: "var(--space-shadow-sm)",
              textAlign: "center",
              border: "1px solid var(--space-gray-100)",
            }}
          >
            <b style={{ display: "block", fontSize: 13, color: "var(--space-navy-900)" }}>Shadow SM</b>
            <code style={{ fontSize: 11, color: "var(--space-gray-500)" }}>0 1px 3px rgba(0,0,0,0.08)</code>
          </div>

          <div
            style={{
              padding: "20px 14px",
              background: "#ffffff",
              borderRadius: 8,
              boxShadow: "var(--space-shadow-md)",
              textAlign: "center",
              border: "1px solid var(--space-gray-100)",
            }}
          >
            <b style={{ display: "block", fontSize: 13, color: "var(--space-navy-900)" }}>Shadow MD</b>
            <code style={{ fontSize: 11, color: "var(--space-gray-500)" }}>0 4px 6px rgba(0,0,0,0.07)</code>
          </div>

          <div
            style={{
              padding: "20px 14px",
              background: "#ffffff",
              borderRadius: 8,
              boxShadow: "var(--space-shadow-lg)",
              textAlign: "center",
              border: "1px solid var(--space-gray-100)",
            }}
          >
            <b style={{ display: "block", fontSize: 13, color: "var(--space-navy-900)" }}>Shadow LG</b>
            <code style={{ fontSize: 11, color: "var(--space-gray-500)" }}>0 10px 15px rgba(0,0,0,0.06)</code>
          </div>

          <div
            style={{
              padding: "20px 14px",
              background: "#ffffff",
              borderRadius: 8,
              boxShadow: "var(--space-shadow-xl)",
              textAlign: "center",
              border: "1px solid var(--space-gray-100)",
            }}
          >
            <b style={{ display: "block", fontSize: 13, color: "var(--space-navy-900)" }}>Shadow XL</b>
            <code style={{ fontSize: 11, color: "var(--space-gray-500)" }}>0 20px 25px rgba(0,0,0,0.08)</code>
          </div>
        </div>
      </section>
    </div>
  );
}
