import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type AuthStep = "login" | "register" | "verify";

function readInitialAuthStep(): AuthStep {
  try {
    const raw = new URLSearchParams(window.location.search).get("auth");
    if (raw === "register" || raw === "verify" || raw === "login") return raw;
  } catch {
    // Abaikan
  }
  return "login";
}

export function AuthFlow({ onAuthenticated }: { onAuthenticated: () => Promise<void> }) {
  const [step, setStep] = useState<AuthStep>(readInitialAuthStep);

  // Form states
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // OTP state
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const registerMutation = trpc.auth.register.useMutation();
  const loginMutation = trpc.auth.login.useMutation();
  const verifyMutation = trpc.auth.verifyEmail.useMutation();
  const resendMutation = trpc.auth.resendVerification.useMutation();

  const switchStep = (next: AuthStep) => {
    setErrorMessage(null);
    setStep(next);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("auth", next);
      window.history.replaceState({}, "", url.toString());
    } catch {
      // Abaikan
    }
  };

  useEffect(() => {
    document.title =
      step === "register"
        ? "EksporFlow · Registrasi Akun"
        : step === "verify"
          ? "EksporFlow · Verifikasi Akun"
          : "EksporFlow · Masuk ke Workspace";
  }, [step]);

  useEffect(() => {
    if (step === "verify") {
      setTimeout(() => otpRefs.current[0]?.focus(), 60);
    }
  }, [step]);

  const handleRegisterSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);

    if (name.trim().length < 2) {
      setErrorMessage("Nama lengkap minimal 2 karakter.");
      return;
    }
    if (companyName.trim().length < 2) {
      setErrorMessage("Nama perusahaan eksportir minimal 2 karakter.");
      return;
    }
    if (!email.trim().includes("@")) {
      setErrorMessage("Masukkan alamat email yang valid.");
      return;
    }
    if (password.length < 8) {
      setErrorMessage("Kata sandi minimal 8 karakter.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Konfirmasi kata sandi belum sama.");
      return;
    }

    try {
      const result = await registerMutation.mutateAsync({
        name: name.trim(),
        companyName: companyName.trim(),
        email: email.trim(),
        password,
      });
      setEmail(result.email);
      setOtpDigits(["", "", "", "", "", ""]);
      setDevOtpHint(result.devOtpCode ?? null);
      switchStep("verify");
      toast.success("Akun berhasil didaftarkan!", {
        description: `Masukkan 6 digit kode verifikasi untuk mengaktifkan workspace ${companyName.trim()}.`,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Gagal mendaftarkan akun.";
      setErrorMessage(msg);
    }
  };

  const handleLoginSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage("Masukkan email dan kata sandi Anda.");
      return;
    }

    try {
      const result = await loginMutation.mutateAsync({
        email: email.trim(),
        password,
      });

      if (result.status === "verification_required") {
        setEmail(result.email);
        setOtpDigits(["", "", "", "", "", ""]);
        setDevOtpHint(result.devOtpCode ?? null);
        switchStep("verify");
        toast("Verifikasi email diperlukan", {
          description: "Kami telah membuat kode verifikasi 6 digit baru untuk akun Anda.",
        });
        return;
      }

      try {
        const url = new URL(window.location.href);
        url.searchParams.delete("auth");
        window.history.replaceState({}, "", url.toString());
      } catch {
        // Abaikan
      }

      toast.success(`Selamat datang kembali, ${result.user?.name || "Pengguna"}!`);
      await onAuthenticated();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Gagal masuk ke akun.";
      setErrorMessage(msg);
    }
  };

  const handleVerifySubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);

    const code = otpDigits.join("");
    if (!/^\d{6}$/.test(code)) {
      setErrorMessage("Lengkapi ke-6 digit kode verifikasi terlebih dahulu.");
      return;
    }

    try {
      const result = await verifyMutation.mutateAsync({
        email: email.trim(),
        code,
      });
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete("auth");
        window.history.replaceState({}, "", url.toString());
      } catch {
        // Abaikan
      }
      toast.success("Email berhasil diverifikasi!", {
        description: `Workspace ${result.user.companyName || result.user.name || "EksporFlow"} siap digunakan.`,
      });
      await onAuthenticated();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Kode verifikasi tidak valid.";
      setErrorMessage(msg);
    }
  };

  const handleResendCode = async () => {
    setErrorMessage(null);
    if (!email.trim()) {
      setErrorMessage("Email tidak ditemukan. Silakan kembali ke halaman Login atau Registrasi.");
      return;
    }
    try {
      const result = await resendMutation.mutateAsync({ email: email.trim() });
      setOtpDigits(["", "", "", "", "", ""]);
      setDevOtpHint(result.devOtpCode ?? null);
      otpRefs.current[0]?.focus();
      toast.success("Kode verifikasi 6 digit baru telah diterbitkan.");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Gagal mengirim ulang kode.";
      setErrorMessage(msg);
    }
  };

  const handleOtpChange = (index: number, raw: string) => {
    const digitsOnly = raw.replace(/\D/g, "");
    if (!digitsOnly) {
      const next = [...otpDigits];
      next[index] = "";
      setOtpDigits(next);
      return;
    }

    // Jika paste atau mengetik lebih dari 1 angka sekaligus
    if (digitsOnly.length > 1) {
      const next = [...otpDigits];
      for (let offset = 0; offset < digitsOnly.length && index + offset < 6; offset += 1) {
        next[index + offset] = digitsOnly[offset];
      }
      setOtpDigits(next);
      const focusTarget = Math.min(5, index + digitsOnly.length);
      otpRefs.current[focusTarget]?.focus();
      return;
    }

    const next = [...otpDigits];
    next[index] = digitsOnly[0];
    setOtpDigits(next);
    if (index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    event.preventDefault();
    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i += 1) {
      next[i] = pasted[i];
    }
    setOtpDigits(next);
    otpRefs.current[Math.min(5, Math.max(0, pasted.length - 1))]?.focus();
  };

  const fillDevOtp = () => {
    if (!devOtpHint || devOtpHint.length !== 6) return;
    setOtpDigits(devOtpHint.split(""));
    setErrorMessage(null);
  };

  const isBusy =
    registerMutation.isPending ||
    loginMutation.isPending ||
    verifyMutation.isPending ||
    resendMutation.isPending;

  return (
    <div className="auth-gate-shell">
      <aside className="auth-brand-aside">
        <div className="auth-brand-top">
          <div className="brand-lockup clean-brand-lockup">
            <div className="brand-mark">
              <span />
              <span />
            </div>
            <div className="brand-copy">
              <strong>
                Ekspor<span>Flow</span>
              </strong>
              <small>EXPORT OPERATIONS PLATFORM</small>
            </div>
          </div>

          <div className="auth-brand-hero">
            <span className="auth-hero-pill">
              <Sparkles size={13} /> Workspace Operasional Ekspor Terpadu
            </span>
            <h1>Kelola penawaran, dokumen ekspor, kontainer 3D, dan keuangan dari satu sumber data.</h1>
            <p>
              Dirancang untuk tim eksportir Indonesia dengan kalkulasi 7 skenario Incoterms® 2020, pemeriksaan konsistensi 3-way, serta penyimpanan database PostgreSQL / Supabase ber-RLS.
            </p>
          </div>

          <div className="auth-feature-list">
            <div>
              <CheckCircle2 size={16} />
              <span>
                <b>Workspace bersih &amp; terisolasi per perusahaan</b>
                <small>Data mitra, produk, harga, dokumen, dan jurnal terhubung untuk akun Anda sendiri.</small>
              </span>
            </div>
            <div>
              <CheckCircle2 size={16} />
              <span>
                <b>4 dokumen ekspor siap cetak (English A4/Letter)</b>
                <small>Proforma Invoice, Commercial Invoice, Packing List, dan B/L Reference Draft.</small>
              </span>
            </div>
            <div>
              <CheckCircle2 size={16} />
              <span>
                <b>Keamanan sesi &amp; verifikasi OTP 6 digit</b>
                <small>Password terenkripsi scrypt, optimistic locking, dan audit log setiap revisi.</small>
              </span>
            </div>
          </div>
        </div>

        <div className="auth-brand-footer">
          <ShieldCheck size={15} />
          <span>Terhubung ke PostgreSQL / Supabase · Row Level Security (RLS) Aktif</span>
        </div>
      </aside>

      <main className="auth-form-main">
        <div className="auth-card">
          {/* Progress indicator 3 tahap */}
          <div className="auth-step-pills" role="tablist" aria-label="Tahap akses akun">
            <button
              type="button"
              className={step === "register" ? "active" : ""}
              onClick={() => switchStep("register")}
            >
              1. Registrasi
            </button>
            <button
              type="button"
              className={step === "verify" ? "active" : ""}
              onClick={() => {
                if (email.trim()) {
                  switchStep("verify");
                } else {
                  toast("Masukkan email melalui Registrasi atau Login terlebih dahulu.");
                }
              }}
            >
              2. Verifikasi OTP
            </button>
            <button
              type="button"
              className={step === "login" ? "active" : ""}
              onClick={() => switchStep("login")}
            >
              3. Login
            </button>
          </div>

          {errorMessage && (
            <div className="auth-error-box" role="alert">
              {errorMessage}
            </div>
          )}

          {step === "login" && (
            <form className="auth-form" onSubmit={(e) => void handleLoginSubmit(e)}>
              <div className="auth-card-head">
                <span className="eyebrow">MASUK KE WORKSPACE</span>
                <h2>Selamat datang di EksporFlow</h2>
                <p>Masuk menggunakan akun yang telah terverifikasi, atau buat akun baru untuk mulai menguji dari awal.</p>
              </div>

              <label className="field">
                <span>Email kerja</span>
                <div className="input-shell has-prefix">
                  <b>
                    <Mail size={14} />
                  </b>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="nama@perusahaanekspor.co.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </label>

              <label className="field">
                <span>Kata sandi</span>
                <div className="input-shell has-prefix has-suffix">
                  <b>
                    <Lock size={14} />
                  </b>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    placeholder="Masukkan kata sandi"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="auth-eye-btn"
                    aria-label={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </label>

              <button type="submit" className="save-button auth-submit-btn" disabled={isBusy}>
                {loginMutation.isPending ? "Memeriksa kredensial..." : "Masuk ke Tampilan Utama"}
                <ArrowRight size={15} />
              </button>

              <div className="auth-switch-row">
                <span>Belum punya akun workspace?</span>
                <button type="button" className="text-button" onClick={() => switchStep("register")}>
                  Daftar akun baru dari awal →
                </button>
              </div>
            </form>
          )}

          {step === "register" && (
            <form className="auth-form" onSubmit={(e) => void handleRegisterSubmit(e)}>
              <div className="auth-card-head">
                <span className="eyebrow">REGISTRASI WORKSPACE BARU</span>
                <h2>Buat akun eksportir baru</h2>
                <p>Workspace Anda akan dibuat dalam kondisi bersih (tanpa data contoh mentah) agar siap diuji dengan data baru.</p>
              </div>

              <div className="form-grid two">
                <label className="field">
                  <span>Nama lengkap</span>
                  <div className="input-shell has-prefix">
                    <b>
                      <UserRound size={14} />
                    </b>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Arif Pratama"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </label>

                <label className="field">
                  <span>Nama perusahaan eksportir</span>
                  <div className="input-shell has-prefix">
                    <b>
                      <Building2 size={14} />
                    </b>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: PT Samudra Niaga"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>
                </label>
              </div>

              <label className="field">
                <span>Email kerja</span>
                <div className="input-shell has-prefix">
                  <b>
                    <Mail size={14} />
                  </b>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="arif@perusahaan.co.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </label>

              <div className="form-grid two">
                <label className="field">
                  <span>Kata sandi (min. 8 karakter)</span>
                  <div className="input-shell has-prefix has-suffix">
                    <b>
                      <Lock size={14} />
                    </b>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      placeholder="Minimal 8 karakter"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="auth-eye-btn"
                      aria-label={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </label>

                <label className="field">
                  <span>Ulangi kata sandi</span>
                  <div className="input-shell has-prefix">
                    <b>
                      <KeyRound size={14} />
                    </b>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      placeholder="Ketik ulang sandi"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </label>
              </div>

              <button type="submit" className="save-button auth-submit-btn" disabled={isBusy}>
                {registerMutation.isPending ? "Membuat akun & kode OTP..." : "Daftar & Lanjut Verifikasi"}
                <ArrowRight size={15} />
              </button>

              <div className="auth-switch-row">
                <span>Sudah mendaftar akun sebelumnya?</span>
                <button type="button" className="text-button" onClick={() => switchStep("login")}>
                  Masuk di halaman Login →
                </button>
              </div>
            </form>
          )}

          {step === "verify" && (
            <form className="auth-form" onSubmit={(e) => void handleVerifySubmit(e)}>
              <div className="auth-card-head">
                <span className="eyebrow">VERIFIKASI AKUN · 6 DIGIT OTP</span>
                <h2>Verifikasi alamat email Anda</h2>
                <p>
                  Masukkan 6 digit kode verifikasi untuk mengaktifkan akun{" "}
                  <strong>{email || "Anda"}</strong> sebelum masuk ke tampilan utama.
                </p>
              </div>

              {devOtpHint && (
                <div className="auth-dev-otp-box">
                  <div>
                    <span className="eyebrow">SIMULASI EMAIL LOKAL · MODE TESTING</span>
                    <p>
                      Karena berjalan di server lokal tanpa SMTP eksternal, kode OTP dari database Supabase ditampilkan di sini untuk pengujian:
                    </p>
                    <strong className="mono-code auth-dev-otp-code">{devOtpHint}</strong>
                  </div>
                  <button type="button" className="ghost-button" onClick={fillDevOtp}>
                    <Copy size={13} /> Isi Kode Otomatis
                  </button>
                </div>
              )}

              {!email.trim() && (
                <label className="field">
                  <span>Email yang diverifikasi</span>
                  <div className="input-shell has-prefix">
                    <b>
                      <Mail size={14} />
                    </b>
                    <input
                      type="email"
                      required
                      placeholder="arif@perusahaan.co.id"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </label>
              )}

              <div className="auth-otp-grid" role="group" aria-label="6 digit kode verifikasi">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      otpRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    aria-label={`Digit ke-${index + 1}`}
                    className="auth-otp-input mono-code"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                  />
                ))}
              </div>

              <button type="submit" className="save-button auth-submit-btn" disabled={isBusy}>
                {verifyMutation.isPending ? "Memverifikasi kode..." : "Verifikasi & Masuk ke Workspace"}
                <ArrowRight size={15} />
              </button>

              <div className="auth-verify-actions">
                <button
                  type="button"
                  className="ghost-button"
                  disabled={isBusy}
                  onClick={() => void handleResendCode()}
                >
                  <RefreshCw size={13} /> {resendMutation.isPending ? "Mengirim..." : "Kirim Ulang Kode"}
                </button>
                <button type="button" className="text-button" onClick={() => switchStep("register")}>
                  <ArrowLeft size={13} /> Ganti email / kembali
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
