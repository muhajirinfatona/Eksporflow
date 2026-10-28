import { trpc } from "@/lib/trpc";
import {
  Building2,
  Check,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  RefreshCw,
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

const SLIDES = [
  {
    title: "Selamat Datang!",
    subtitle:
      "Kelola kalkulasi Incoterms® 2020, dokumen ekspor, dan muatan kontainer 3D di atas satu workspace terpadu.",
  },
  {
    title: "Satu Sumber Data",
    subtitle:
      "Perubahan buyer, produk, dan harga langsung tersinkron ke Invoice, Packing List, B/L Draft, dan Keuangan.",
  },
  {
    title: "Aman & Terverifikasi",
    subtitle:
      "Dilindungi verifikasi OTP 6 digit, enkripsi kata sandi, dan penyimpanan PostgreSQL / Supabase ber-RLS.",
  },
];

function ExportClipboardIllustration() {
  return (
    <svg
      className="auth-split-svg"
      viewBox="0 0 300 230"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Ambient pill shapes matching reference style in EksporFlow Navy/Teal/Saffron */}
      <rect x="48" y="68" width="168" height="22" rx="11" fill="#1b4368" opacity="0.65" />
      <rect x="34" y="102" width="218" height="26" rx="13" fill="#1b4368" opacity="0.55" />
      <rect x="70" y="142" width="166" height="22" rx="11" fill="#1b4368" opacity="0.65" />
      <circle cx="244" cy="96" r="10" fill="#f59e0b" opacity="0.22" />
      <circle cx="236" cy="134" r="3.5" fill="#f8fafc" opacity="0.85" />
      <circle cx="62" cy="54" r="2.5" fill="#34d399" opacity="0.85" />

      {/* Sparkle plus icons */}
      <path
        d="M112 34V42M108 38H116"
        stroke="#f59e0b"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M214 166V172M211 169H217"
        stroke="#34d399"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* Tilted Export Checklist Clipboard */}
      <g transform="translate(152 114) rotate(-18) translate(-66 -78)">
        {/* Drop shadow */}
        <rect x="6" y="14" width="124" height="148" rx="12" fill="#071220" opacity="0.38" />
        {/* Clipboard board */}
        <rect
          x="0"
          y="8"
          width="124"
          height="148"
          rx="11"
          fill="#163a5c"
          stroke="#6495bf"
          strokeWidth="2"
        />
        {/* Paper sheet */}
        <rect x="10" y="20" width="104" height="126" rx="6" fill="#ffffff" />
        {/* Top clip */}
        <rect
          x="39"
          y="0"
          width="46"
          height="18"
          rx="5"
          fill="#f59e0b"
          stroke="#0b192c"
          strokeWidth="2"
        />
        <rect x="50" y="5" width="24" height="5" rx="2.5" fill="#fef3c7" />

        {/* Row 1: Checked (Mint) */}
        <path
          d="M24 47L29 52L38 42"
          stroke="#10b981"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="48" y="42" width="52" height="5" rx="2.5" fill="#0f2942" />
        <rect x="48" y="51" width="36" height="4" rx="2" fill="#cbd5e1" />

        {/* Row 2: Saffron highlight */}
        <path
          d="M24 79L29 84L38 74"
          stroke="#f59e0b"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="48" y="74" width="48" height="5" rx="2.5" fill="#0f2942" />
        <rect x="48" y="83" width="40" height="4" rx="2" fill="#cbd5e1" />

        {/* Row 3: Checked (Mint) */}
        <path
          d="M24 111L29 116L38 106"
          stroke="#10b981"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="48" y="106" width="54" height="5" rx="2.5" fill="#0f2942" />
        <rect x="48" y="115" width="30" height="4" rx="2" fill="#cbd5e1" />
      </g>

      {/* Tilted Stylus / Pen on bottom-left */}
      <g transform="translate(88 158) rotate(-42) translate(-10 -44)">
        <rect x="0" y="8" width="18" height="68" rx="5" fill="#34d399" stroke="#0b192c" strokeWidth="2" />
        <rect x="4" y="14" width="4" height="46" rx="2" fill="#a7f3d0" opacity="0.8" />
        <rect x="2" y="0" width="14" height="10" rx="3" fill="#f59e0b" stroke="#0b192c" strokeWidth="2" />
        <path d="M2 76L9 90L16 76H2Z" fill="#f8fafc" stroke="#0b192c" strokeWidth="2" strokeLinejoin="round" />
        <circle cx="9" cy="88" r="2" fill="#0b192c" />
      </g>
    </svg>
  );
}

export function AuthFlow({ onAuthenticated }: { onAuthenticated: () => Promise<void> }) {
  const [step, setStep] = useState<AuthStep>(readInitialAuthStep);
  const [slideIndex, setSlideIndex] = useState<number>(0);

  // Form states
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
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
    setSlideIndex(next === "login" ? 0 : next === "register" ? 1 : 2);
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
        ? "EksporFlow · Buat Akun"
        : step === "verify"
          ? "EksporFlow · Verifikasi OTP"
          : "EksporFlow · Masuk";
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
      toast.success("Akun berhasil dibuat!", {
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
          description: "Kami telah menerbitkan kode verifikasi 6 digit baru untuk akun Anda.",
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

      toast.success(`Selamat datang, ${result.user?.name || "Pengguna"}!`);
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
      setErrorMessage("Masukkan alamat email Anda terlebih dahulu.");
      return;
    }
    try {
      const result = await resendMutation.mutateAsync({ email: email.trim() });
      setOtpDigits(["", "", "", "", "", ""]);
      setDevOtpHint(result.devOtpCode ?? null);
      otpRefs.current[0]?.focus();
      toast.success("Kode verifikasi 6 digit baru telah dikirim.");
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

  const activeSlide = SLIDES[slideIndex] ?? SLIDES[0];

  return (
    <div className="auth-stage-backdrop">
      <div className="auth-split-window">
        {/* Panel Kiri: Identitas & Warna Logo EksporFlow */}
        <aside className="auth-split-left">
          <div className="auth-split-logo">
            <div className="brand-mark">
              <span />
              <span />
            </div>
            <strong>
              Ekspor<span>Flow</span>
            </strong>
          </div>

          <div className="auth-split-art">
            <ExportClipboardIllustration />
          </div>

          <div className="auth-split-welcome">
            <h1>{activeSlide.title}</h1>
            <p>{activeSlide.subtitle}</p>
            <div className="auth-slide-dots" role="tablist" aria-label="Sorotan fitur">
              {SLIDES.map((s, idx) => (
                <button
                  key={s.title}
                  type="button"
                  aria-label={s.title}
                  className={slideIndex === idx ? "active" : ""}
                  onClick={() => setSlideIndex(idx)}
                />
              ))}
            </div>
          </div>
        </aside>

        {/* Panel Kanan: Form Putih Bersih & Minimalis */}
        <main className="auth-split-right">
          <div className="auth-clean-pane">
            {errorMessage && (
              <div className="auth-clean-alert" role="alert">
                {errorMessage}
              </div>
            )}

            {step === "login" && (
              <form className="auth-minimal-form" onSubmit={(e) => void handleLoginSubmit(e)}>
                <div className="auth-minimal-head">
                  <h2>Log In</h2>
                  <p>
                    Belum punya akun?{" "}
                    <button type="button" onClick={() => switchStep("register")}>
                      Buat akun baru
                    </button>
                    <br />
                    Hanya butuh waktu kurang dari satu menit.
                  </p>
                </div>

                <div className="auth-line-fields">
                  <label className="auth-line-input">
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="Email kerja"
                      aria-label="Email kerja"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <UserRound size={16} />
                  </label>

                  <label className="auth-line-input">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      placeholder="Kata sandi"
                      aria-label="Kata sandi"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="auth-line-icon-btn"
                      aria-label={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Lock size={16} />}
                    </button>
                  </label>
                </div>

                <div className="auth-action-bar">
                  <button type="submit" className="auth-primary-btn" disabled={isBusy}>
                    {loginMutation.isPending ? "Memproses..." : "Masuk"}
                  </button>

                  <label className="auth-remember">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span>
                      <Check size={11} />
                    </span>
                    Ingat sesi saya
                  </label>
                </div>

                <div className="auth-bottom-link">
                  <button type="button" onClick={() => switchStep("verify")}>
                    Punya kode verifikasi OTP? Verifikasi akun
                  </button>
                </div>
              </form>
            )}

            {step === "register" && (
              <form className="auth-minimal-form" onSubmit={(e) => void handleRegisterSubmit(e)}>
                <div className="auth-minimal-head">
                  <h2>Registrasi</h2>
                  <p>
                    Sudah punya akun?{" "}
                    <button type="button" onClick={() => switchStep("login")}>
                      Masuk di sini
                    </button>
                    <br />
                    Workspace baru dibuat bersih tanpa data contoh.
                  </p>
                </div>

                <div className="auth-line-fields compact">
                  <label className="auth-line-input">
                    <input
                      type="text"
                      required
                      placeholder="Nama lengkap Anda"
                      aria-label="Nama lengkap"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                    <UserRound size={16} />
                  </label>

                  <label className="auth-line-input">
                    <input
                      type="text"
                      required
                      placeholder="Nama perusahaan eksportir"
                      aria-label="Nama perusahaan eksportir"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                    <Building2 size={16} />
                  </label>

                  <label className="auth-line-input">
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="Email kerja"
                      aria-label="Email kerja"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <Mail size={16} />
                  </label>

                  <div className="auth-line-two-col">
                    <label className="auth-line-input">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={8}
                        autoComplete="new-password"
                        placeholder="Sandi (min. 8)"
                        aria-label="Kata sandi"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="auth-line-icon-btn"
                        aria-label={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </label>

                    <label className="auth-line-input">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={8}
                        autoComplete="new-password"
                        placeholder="Ulangi sandi"
                        aria-label="Ulangi kata sandi"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <KeyRound size={15} />
                    </label>
                  </div>
                </div>

                <div className="auth-action-bar">
                  <button type="submit" className="auth-primary-btn" disabled={isBusy}>
                    {registerMutation.isPending ? "Mendaftarkan..." : "Daftar Akun"}
                  </button>
                </div>
              </form>
            )}

            {step === "verify" && (
              <form className="auth-minimal-form" onSubmit={(e) => void handleVerifySubmit(e)}>
                <div className="auth-minimal-head">
                  <h2>Verifikasi</h2>
                  <p>
                    Bukan email Anda?{" "}
                    <button type="button" onClick={() => switchStep("register")}>
                      Ubah alamat email
                    </button>
                    <br />
                    Masukkan 6 digit kode OTP untuk{" "}
                    <strong>{email || "akun Anda"}</strong>.
                  </p>
                </div>

                {!email.trim() && (
                  <div className="auth-line-fields compact">
                    <label className="auth-line-input">
                      <input
                        type="email"
                        required
                        placeholder="Email yang didaftarkan"
                        aria-label="Email yang didaftarkan"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      <Mail size={16} />
                    </label>
                  </div>
                )}

                {devOtpHint && (
                  <div className="auth-sim-pill">
                    <span>
                      Kode testing lokal: <b className="mono-code">{devOtpHint}</b>
                    </span>
                    <button type="button" onClick={fillDevOtp}>
                      <Copy size={12} /> Isi otomatis
                    </button>
                  </div>
                )}

                <div className="auth-otp-clean-row" role="group" aria-label="6 digit kode verifikasi">
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
                      className="auth-otp-clean-box mono-code"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                    />
                  ))}
                </div>

                <div className="auth-action-bar">
                  <button type="submit" className="auth-primary-btn" disabled={isBusy}>
                    {verifyMutation.isPending ? "Memverifikasi..." : "Verifikasi Akun"}
                  </button>

                  <button
                    type="button"
                    className="auth-resend-inline"
                    disabled={isBusy}
                    onClick={() => void handleResendCode()}
                  >
                    <RefreshCw size={13} /> {resendMutation.isPending ? "Mengirim..." : "Kirim ulang"}
                  </button>
                </div>

                <div className="auth-bottom-link">
                  <button type="button" onClick={() => switchStep("login")}>
                    Kembali ke halaman Log In
                  </button>
                </div>
              </form>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
