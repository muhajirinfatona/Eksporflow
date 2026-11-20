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
}

const STORAGE_KEY = "eksporflow:user_session";

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
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.email === "string") {
      return parsed as UserSession;
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

