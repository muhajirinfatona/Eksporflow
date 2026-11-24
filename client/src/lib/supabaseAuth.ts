import { supabase } from "./supabaseClient";

export interface UserSession {
  id: number;
  openId: string;
  name: string;
  email: string;
  companyName: string | null;
  role: string;
  emailVerifiedAt: string;
  createdAt: string;
  updatedAt: string;
  lastSignedIn: string;
  isDemo?: boolean;
  demoExpiresAt?: string;
}

const STORAGE_KEY = "eksporflow:user_session";
export const DEMO_DURATION_MS = 3 * 24 * 60 * 60 * 1000;
export const DEMO_EXPIRES_STORAGE_KEY = "eksporflow:demo_expires_at";

async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`eksporflow_salt_v1:${password}`);
  const hashBuf = await crypto.subtle.digest("SHA-256", data);
  const hashArr = Array.from(new Uint8Array(hashBuf));
  return "sha256$" + hashArr.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function getCurrentUser(): UserSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserSession;
    if (parsed && typeof parsed.email === "string") {
      if (parsed.isDemo && parsed.demoExpiresAt) {
        const expMs = new Date(parsed.demoExpiresAt).getTime();
        if (!Number.isNaN(expMs) && expMs <= Date.now()) {
          localStorage.removeItem(STORAGE_KEY);
          return null;
        }
      }
      return parsed;
    }
  } catch {
    // Abaikan
  }
  return null;
}

export function getDemoRemainingMs(user?: Partial<UserSession> | null, nowMs: number = Date.now()): number {
  const expiresAt = user?.demoExpiresAt || (() => {
    try {
      return localStorage.getItem(DEMO_EXPIRES_STORAGE_KEY) || "";
    } catch {
      return "";
    }
  })();
  if (!expiresAt) return 0;
  const diff = new Date(expiresAt).getTime() - nowMs;
  return Math.max(0, diff);
}

export function formatDemoRemainingLabel(remainingMs: number): string {
  if (remainingMs <= 0) return "Masa Demo Berakhir";
  const totalMinutes = Math.floor(remainingMs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const mins = totalMinutes % 60;
  if (days > 0) return `${days} Hari ${hours} Jam`;
  if (hours > 0) return `${hours} Jam ${mins} Menit`;
  return `${Math.max(1, mins)} Menit`;
}

export function startDemoSession(companyName = "PT Nusantara Ekspor Mandiri"): UserSession {
  const now = new Date();
  let expiresAt = "";
  try {
    const existingExp = localStorage.getItem(DEMO_EXPIRES_STORAGE_KEY);
    if (existingExp && new Date(existingExp).getTime() > now.getTime()) {
      expiresAt = existingExp;
    }
  } catch {
    // Abaikan
  }
  if (!expiresAt) {
    expiresAt = new Date(now.getTime() + DEMO_DURATION_MS).toISOString();
    try {
      localStorage.setItem(DEMO_EXPIRES_STORAGE_KEY, expiresAt);
    } catch {
      // Abaikan
    }
  }

  const nowIso = now.toISOString();
  const demoSession: UserSession = {
    id: -999,
    openId: "demo_trial_3d",
    name: "Pengunjung Demo UMKM",
    email: "demo-3hari@eksporflow.id",
    companyName,
    role: "demo",
    emailVerifiedAt: nowIso,
    createdAt: nowIso,
    updatedAt: nowIso,
    lastSignedIn: nowIso,
    isDemo: true,
    demoExpiresAt: expiresAt,
  };
  setCurrentUser(demoSession);
  return demoSession;
}

export function setCurrentUser(user: UserSession | null): void {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Abaikan
  }
}

export async function registerWithSupabase(params: {
  name: string;
  companyName: string;
  email: string;
  password: string;
}): Promise<UserSession> {
  const normalizedEmail = params.email.trim().toLowerCase();
  const hashedPassword = await hashPassword(params.password);
  const now = new Date().toISOString();

  // Periksa apakah user dengan email ini sudah ada di Supabase
  const { data: existingUser, error: checkError } = await supabase
    .from("users")
    .select("*")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (checkError) {
    console.warn("[Supabase Auth] Check user error:", checkError);
  }

  if (existingUser) {
    // Jika sudah ada, perbarui kata sandi, nama, dan companyName
    const updated = {
      name: params.name.trim() || existingUser.name,
      companyName: params.companyName.trim() || existingUser.companyName,
      passwordHash: hashedPassword,
      updatedAt: now,
      lastSignedIn: now,
      emailVerifiedAt: existingUser.emailVerifiedAt || now,
    };

    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update(updated)
      .eq("id", existingUser.id)
      .select()
      .single();

    if (updateError || !updatedUser) {
      throw new Error(updateError?.message || "Gagal memperbarui akun pengguna.");
    }

    const session: UserSession = {
      id: updatedUser.id,
      openId: updatedUser.openId || "usr_" + crypto.randomUUID().replace(/-/g, ""),
      name: updatedUser.name,
      email: updatedUser.email,
      companyName: updatedUser.companyName,
      role: updatedUser.role || "admin",
      emailVerifiedAt: updatedUser.emailVerifiedAt || now,
      createdAt: updatedUser.createdAt || now,
      updatedAt: updatedUser.updatedAt || now,
      lastSignedIn: updatedUser.lastSignedIn || now,
    };

    setCurrentUser(session);
    return session;
  }

  // Jika belum ada, buat user baru di tabel users Supabase
  const newRecord = {
    openId: "usr_" + crypto.randomUUID().replace(/-/g, "").slice(0, 24),
    name: params.name.trim(),
    companyName: params.companyName.trim(),
    email: normalizedEmail,
    passwordHash: hashedPassword,
    role: "admin",
    emailVerifiedAt: now,
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
  };

  const { data: newUser, error: insertError } = await supabase
    .from("users")
    .insert([newRecord])
    .select()
    .single();

  if (insertError || !newUser) {
    throw new Error(insertError?.message || "Gagal mendaftarkan akun ke database Supabase.");
  }

  const session: UserSession = {
    id: newUser.id,
    openId: newUser.openId,
    name: newUser.name,
    email: newUser.email,
    companyName: newUser.companyName,
    role: newUser.role || "admin",
    emailVerifiedAt: newUser.emailVerifiedAt || now,
    createdAt: newUser.createdAt || now,
    updatedAt: newUser.updatedAt || now,
    lastSignedIn: newUser.lastSignedIn || now,
  };

  setCurrentUser(session);
  return session;
}

export async function loginWithSupabase(params: {
  email: string;
  password: string;
}): Promise<UserSession> {
  const normalizedEmail = params.email.trim().toLowerCase();
  const hashedPassword = await hashPassword(params.password);
  const now = new Date().toISOString();

  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (error || !user) {
    throw new Error("Akun dengan email tersebut tidak ditemukan. Silakan lakukan pendaftaran.");
  }

  // Cek kecocokan password jika disimpan dengan sha256
  if (user.passwordHash && user.passwordHash.startsWith("sha256$")) {
    if (user.passwordHash !== hashedPassword) {
      throw new Error("Kata sandi yang Anda masukkan salah.");
    }
  } else {
    // Jika password lama dari dev (scrypt), perbarui ke hash baru saat login berhasil
    await supabase
      .from("users")
      .update({ passwordHash: hashedPassword, lastSignedIn: now })
      .eq("id", user.id);
  }

  // Update lastSignedIn
  await supabase.from("users").update({ lastSignedIn: now }).eq("id", user.id);

  const session: UserSession = {
    id: user.id,
    openId: user.openId || "usr_" + crypto.randomUUID().replace(/-/g, ""),
    name: user.name,
    email: user.email,
    companyName: user.companyName,
    role: user.role || "admin",
    emailVerifiedAt: user.emailVerifiedAt || now,
    createdAt: user.createdAt || now,
    updatedAt: user.updatedAt || now,
    lastSignedIn: now,
  };

  setCurrentUser(session);
  return session;
}

export function logoutFromSupabase(): void {
  setCurrentUser(null);
}

export async function resetPasswordWithSupabase(email: string, newPassword: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  const hashedPassword = await hashPassword(newPassword);
  const now = new Date().toISOString();

  const { data: user, error } = await supabase
    .from("users")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (error || !user) {
    throw new Error("Email tidak ditemukan di sistem.");
  }

  const { error: updateError } = await supabase
    .from("users")
    .update({ passwordHash: hashedPassword, updatedAt: now })
    .eq("id", user.id);

  if (updateError) {
    throw new Error(updateError.message || "Gagal memperbarui kata sandi.");
  }
}

