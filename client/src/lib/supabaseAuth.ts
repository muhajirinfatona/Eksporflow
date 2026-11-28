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

export const DEFAULT_PRODUCTION_USER: UserSession = {
  id: 4,
  openId: "supabase_workspace_admin",
  name: "PT Nusantara Ekspor Mandiri",
  email: "operasional@nusantaraekspor.com",
  companyName: "PT Nusantara Ekspor Mandiri",
  role: "admin",
  emailVerifiedAt: "2026-01-01T00:00:00.000Z",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  lastSignedIn: "2026-11-24T00:00:00.000Z",
  isDemo: false,
};

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
      // Jika tersimpan sesi mock lawas 'supabase_workspace_admin', bersihkan agar Landing Page dapat tampil
      if (parsed.openId === "supabase_workspace_admin") {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
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

export async function registerWithSupabase(params: {
  name: string;
  email: string;
  companyName?: string;
  password?: string;
}): Promise<UserSession> {
  const now = new Date().toISOString();
  const passwordHash = params.password ? await hashPassword(params.password) : null;
  const company = params.companyName?.trim() || "PT Nusantara Ekspor Mandiri";

  const { data, error } = await supabase
    .from("users")
    .insert([
      {
        openId: "usr_" + Math.random().toString(36).slice(2, 11),
        name: params.name.trim(),
        email: params.email.trim().toLowerCase(),
        companyName: company,
        role: "admin",
        passwordHash,
        emailVerifiedAt: now,
        createdAt: now,
        updatedAt: now,
        lastSignedIn: now,
      },
    ])
    .select()
    .single();

  if (error || !data) {
    const fallbackUser: UserSession = {
      id: Date.now(),
      openId: "usr_" + Math.random().toString(36).slice(2, 11),
      name: params.name.trim(),
      email: params.email.trim().toLowerCase(),
      companyName: company,
      role: "admin",
      emailVerifiedAt: now,
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
      isDemo: false,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fallbackUser));
    } catch {
      // Abaikan
    }
    return fallbackUser;
  }

  const session: UserSession = {
    id: data.id,
    openId: data.openId,
    name: data.name,
    email: data.email,
    companyName: data.companyName,
    role: data.role || "admin",
    emailVerifiedAt: data.emailVerifiedAt || now,
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now,
    lastSignedIn: data.lastSignedIn || now,
    isDemo: false,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Abaikan
  }
  return session;
}

export async function loginWithSupabase(params: {
  email: string;
  password?: string;
}): Promise<UserSession> {
  const email = params.email.trim().toLowerCase();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (error || !data) {
    return registerWithSupabase({
      name: email.split("@")[0].toUpperCase(),
      email,
      password: params.password,
    });
  }

  const session: UserSession = {
    id: data.id,
    openId: data.openId,
    name: data.name,
    email: data.email,
    companyName: data.companyName,
    role: data.role || "admin",
    emailVerifiedAt: data.emailVerifiedAt || now,
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now,
    lastSignedIn: now,
    isDemo: false,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Abaikan
  }
  return session;
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

export async function logoutFromSupabase(): Promise<void> {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(DEMO_EXPIRES_STORAGE_KEY);
  } catch {
    // Abaikan
  }
}
