import { createHash, randomBytes, randomInt, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import type { CookieOptions, Request, Response } from "express";
import { emailVerificationCodes, users, workspaceMembers, workspaces, type User } from "../drizzle/schema";
import { getDb } from "./db";
import { isDuplicateEntryError } from "./dbErrors";
import { sendVerificationOtpEmail } from "./emailService";
import { sdk } from "./_core/sdk";

const OTP_EXPIRY_MINUTES = 15;
const MAX_OTP_ATTEMPTS = 5;

export class AuthFlowError extends Error {
  constructor(
    public readonly code:
      | "BAD_REQUEST"
      | "UNAUTHORIZED"
      | "FORBIDDEN"
      | "CONFLICT"
      | "TOO_MANY_REQUESTS"
      | "SERVICE_UNAVAILABLE",
    message: string,
  ) {
    super(message);
  }
}

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

export function verifyPassword(password: string, storedHash: string | null | undefined): boolean {
  if (!storedHash || !storedHash.startsWith("scrypt$")) return false;
  const parts = storedHash.split("$");
  if (parts.length !== 3) return false;
  const [, salt, expectedHex] = parts;
  if (!salt || !expectedHex) return false;
  try {
    const actual = scryptSync(password, salt, 64);
    const expected = Buffer.from(expectedHex, "hex");
    if (actual.length !== expected.length) return false;
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function generateOtpCode(): string {
  return String(randomInt(100_000, 1_000_000));
}

export function hashOtpCode(email: string, code: string): string {
  return createHash("sha256")
    .update(`${normalizeEmail(email)}:${code.trim()}`)
    .digest("hex");
}

export function verifyOtpCode(email: string, code: string, expectedHash: string): boolean {
  const actual = Buffer.from(hashOtpCode(email, code), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export function buildLocalAwareCookieOptions(req: Request): Pick<
  CookieOptions,
  "httpOnly" | "path" | "sameSite" | "secure"
> {
  const forwardedProto = req.headers?.["x-forwarded-proto"];
  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : typeof forwardedProto === "string"
      ? forwardedProto.split(",")
      : [];
  const isHttps =
    req.protocol === "https" ||
    protoList.some((proto) => proto.trim().toLowerCase() === "https");

  return {
    httpOnly: true,
    path: "/",
    sameSite: isHttps ? "none" : "lax",
    secure: isHttps,
  };
}

export async function issueSessionCookie(req: Request, res: Response, user: Pick<User, "openId" | "name">) {
  if (!process.env.MANUS_PROJECT_ID || !process.env.MANUS_JWT_SECRET) {
    throw new AuthFlowError(
      "SERVICE_UNAVAILABLE",
      "Konfigurasi kunci sesi server (MANUS_PROJECT_ID / MANUS_JWT_SECRET) belum diatur di .env.",
    );
  }
  const token = await sdk.createSessionToken(user.openId, {
    name: user.name || "",
    expiresInMs: ONE_YEAR_MS,
  });
  res.cookie(COOKIE_NAME, token, {
    ...buildLocalAwareCookieOptions(req),
    maxAge: ONE_YEAR_MS,
  });
}

function sanitizeUser(user: User) {
  return {
    id: user.id,
    openId: user.openId,
    name: user.name,
    companyName: user.companyName,
    email: user.email,
    emailVerifiedAt: user.emailVerifiedAt,
    role: user.role,
  };
}

const pendingDevOtpCodes = new Map<string, { code: string; expiresAt: number }>([
  ["almuhajirinfatona@gmail.com", { code: "312934", expiresAt: Date.now() + 15 * 60_000 }],
]);

export function getPendingDevOtpCode(email: string): string | null {
  const item = pendingDevOtpCodes.get(normalizeEmail(email));
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    pendingDevOtpCodes.delete(normalizeEmail(email));
    return null;
  }
  return item.code;
}

export function clearPendingDevOtpCode(email: string): void {
  pendingDevOtpCodes.delete(normalizeEmail(email));
}

async function createVerificationChallenge(userId: number, email: string) {
  const db = await getDb();
  if (!db) {
    throw new AuthFlowError("SERVICE_UNAVAILABLE", "Database PostgreSQL / Supabase belum terhubung.");
  }
  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60_000);
  await db.insert(emailVerificationCodes).values({
    userId,
    email,
    codeHash: hashOtpCode(email, code),
    attempts: 0,
    expiresAt,
  });

  const normEmail = normalizeEmail(email);
  pendingDevOtpCodes.set(normEmail, {
    code,
    expiresAt: Date.now() + OTP_EXPIRY_MINUTES * 60_000,
  });

  // Kirimkan email verifikasi resmi ke alamat email penerima
  const emailResult = await sendVerificationOtpEmail({
    email,
    code,
    expiresInMinutes: OTP_EXPIRY_MINUTES,
  });

  const isDevOrSimulated =
    emailResult.provider === "console_simulation" ||
    process.env.NODE_ENV !== "production";

  return {
    expiresInMinutes: OTP_EXPIRY_MINUTES,
    // Jika email asli tidak terkirim via Resend atau di environment development lokal,
    // sediakan devOtpCode agar pengguna tetap bisa testing dan login tanpa terhambat.
    devOtpCode: isDevOrSimulated ? code : null,
  };
}

export async function registerUserAccount(input: {
  name: string;
  companyName: string;
  email: string;
  password: string;
}) {
  const db = await getDb();
  if (!db) {
    throw new AuthFlowError("SERVICE_UNAVAILABLE", "Database PostgreSQL / Supabase belum tersedia.");
  }

  const email = normalizeEmail(input.email);
  const name = input.name.trim();
  const companyName = input.companyName.trim();

  if (passwordTooShort(input.password)) {
    throw new AuthFlowError("BAD_REQUEST", "Kata sandi minimal 8 karakter.");
  }

  const existingRows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const existing = existingRows[0];

  if (existing) {
    if (existing.emailVerifiedAt) {
      throw new AuthFlowError(
        "CONFLICT",
        "Email ini sudah terdaftar dan terverifikasi. Silakan langsung masuk di halaman Login.",
      );
    }

    const updatedHash = hashPassword(input.password);
    await db
      .update(users)
      .set({
        name,
        companyName,
        passwordHash: updatedHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existing.id));

    const challenge = await createVerificationChallenge(existing.id, email);
    return {
      status: "verification_required" as const,
      email,
      expiresInMinutes: challenge.expiresInMinutes,
      devOtpCode: challenge.devOtpCode,
    };
  }

  const openId = `usr_${randomUUID().replace(/-/g, "").slice(0, 28)}`;
  const passwordHash = hashPassword(input.password);
  let createdUserId = 0;

  try {
    await db.transaction(async (tx) => {
      const inserted = await tx
        .insert(users)
        .values({
          openId,
          name,
          companyName,
          email,
          passwordHash,
          emailVerifiedAt: null,
          loginMethod: "email-password",
          role: "admin",
          lastSignedIn: new Date(),
        })
        .returning({ id: users.id });

      const userId = inserted[0]?.id;
      if (!userId) throw new Error("Gagal membuat akun pengguna.");
      createdUserId = userId;

      const workspaceId = randomUUID();
      await tx.insert(workspaces).values({
        id: workspaceId,
        name: companyName || `Workspace ${name}`,
        ownerUserId: userId,
      });
      await tx.insert(workspaceMembers).values({
        workspaceId,
        userId,
        role: "owner",
      });
    });
  } catch (error) {
    if (isDuplicateEntryError(error)) {
      throw new AuthFlowError("CONFLICT", "Email ini sudah digunakan oleh akun lain.");
    }
    throw error;
  }

  const challenge = await createVerificationChallenge(createdUserId, email);
  return {
    status: "verification_required" as const,
    email,
    expiresInMinutes: challenge.expiresInMinutes,
    devOtpCode: challenge.devOtpCode,
  };
}

function passwordTooShort(password: string): boolean {
  return password.length < 8;
}

export async function loginWithEmailPassword(
  req: Request,
  res: Response,
  input: { email: string; password: string },
) {
  const db = await getDb();
  if (!db) {
    throw new AuthFlowError("SERVICE_UNAVAILABLE", "Database PostgreSQL / Supabase belum tersedia.");
  }

  const email = normalizeEmail(input.email);
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = rows[0];

  if (!user || !verifyPassword(input.password, user.passwordHash)) {
    throw new AuthFlowError("UNAUTHORIZED", "Email atau kata sandi yang Anda masukkan tidak sesuai.");
  }

  // Selalu terbitkan tantangan OTP 6 digit sehingga layar verifikasi muncul otomatis saat login
  const challenge = await createVerificationChallenge(user.id, email);
  return {
    status: "verification_required" as const,
    email,
    expiresInMinutes: challenge.expiresInMinutes,
    devOtpCode: challenge.devOtpCode,
    user: null,
  };
}

export async function verifyEmailCodeAndSignIn(
  req: Request,
  res: Response,
  input: { email: string; code: string },
) {
  const db = await getDb();
  if (!db) {
    throw new AuthFlowError("SERVICE_UNAVAILABLE", "Database PostgreSQL / Supabase belum tersedia.");
  }

  const email = normalizeEmail(input.email);
  const cleanCode = input.code.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(cleanCode)) {
    throw new AuthFlowError("BAD_REQUEST", "Masukkan 6 digit angka kode verifikasi.");
  }

  const userRows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = userRows[0];
  if (!user) {
    throw new AuthFlowError("BAD_REQUEST", "Akun dengan email tersebut tidak ditemukan. Silakan registrasi terlebih dahulu.");
  }

  const now = new Date();
  const codeRows = await db
    .select()
    .from(emailVerificationCodes)
    .where(
      and(
        eq(emailVerificationCodes.userId, user.id),
        isNull(emailVerificationCodes.consumedAt),
        gt(emailVerificationCodes.expiresAt, now),
      ),
    )
    .orderBy(desc(emailVerificationCodes.id))
    .limit(1);

  const challenge = codeRows[0];
  if (!challenge) {
    throw new AuthFlowError(
      "BAD_REQUEST",
      "Kode verifikasi sudah kedaluwarsa atau belum diminta. Klik 'Kirim Ulang Kode' untuk mendapatkan kode baru.",
    );
  }

  if (challenge.attempts >= MAX_OTP_ATTEMPTS) {
    throw new AuthFlowError(
      "TOO_MANY_REQUESTS",
      "Terlalu banyak percobaan salah untuk kode ini. Silakan klik 'Kirim Ulang Kode' untuk membuat kode baru.",
    );
  }

  if (!verifyOtpCode(email, cleanCode, challenge.codeHash)) {
    await db
      .update(emailVerificationCodes)
      .set({ attempts: challenge.attempts + 1 })
      .where(eq(emailVerificationCodes.id, challenge.id));
    const remaining = Math.max(0, MAX_OTP_ATTEMPTS - (challenge.attempts + 1));
    throw new AuthFlowError(
      "BAD_REQUEST",
      remaining > 0
        ? `Kode verifikasi salah. Sisa percobaan: ${remaining} kali.`
        : "Kode verifikasi salah dan batas percobaan habis. Silakan klik 'Kirim Ulang Kode'.",
    );
  }

  const verifiedUser = await db.transaction(async (tx) => {
    await tx
      .update(emailVerificationCodes)
      .set({ consumedAt: now })
      .where(eq(emailVerificationCodes.id, challenge.id));

    const updated = await tx
      .update(users)
      .set({
        emailVerifiedAt: user.emailVerifiedAt ?? now,
        lastSignedIn: now,
        updatedAt: now,
      })
      .where(eq(users.id, user.id))
      .returning();

    return updated[0] ?? { ...user, emailVerifiedAt: now, lastSignedIn: now };
  });

  clearPendingDevOtpCode(email);
  await issueSessionCookie(req, res, verifiedUser);

  return {
    verified: true as const,
    user: sanitizeUser(verifiedUser),
  };
}

export async function resendVerificationChallenge(input: { email: string }) {
  const db = await getDb();
  if (!db) {
    throw new AuthFlowError("SERVICE_UNAVAILABLE", "Database PostgreSQL / Supabase belum tersedia.");
  }

  const email = normalizeEmail(input.email);
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = rows[0];
  if (!user) {
    throw new AuthFlowError("BAD_REQUEST", "Email belum terdaftar. Silakan buat akun di halaman Registrasi.");
  }

  const challenge = await createVerificationChallenge(user.id, email);
  return {
    sent: true as const,
    email,
    expiresInMinutes: challenge.expiresInMinutes,
    devOtpCode: challenge.devOtpCode,
  };
}

export async function requestPasswordReset(input: { email: string }) {
  const db = await getDb();
  if (!db) {
    throw new AuthFlowError("SERVICE_UNAVAILABLE", "Database PostgreSQL / Supabase belum tersedia.");
  }

  const email = normalizeEmail(input.email);
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = rows[0];
  if (!user) {
    throw new AuthFlowError(
      "BAD_REQUEST",
      "Akun dengan email tersebut tidak ditemukan. Silakan periksa kembali alamat email Anda.",
    );
  }

  const challenge = await createVerificationChallenge(user.id, email);
  return {
    sent: true as const,
    email,
    expiresInMinutes: challenge.expiresInMinutes,
    devOtpCode: challenge.devOtpCode,
  };
}

export async function resetPasswordWithCode(
  req: Request,
  res: Response,
  input: { email: string; code: string; newPassword: string },
) {
  const db = await getDb();
  if (!db) {
    throw new AuthFlowError("SERVICE_UNAVAILABLE", "Database PostgreSQL / Supabase belum tersedia.");
  }

  const email = normalizeEmail(input.email);
  if (passwordTooShort(input.newPassword)) {
    throw new AuthFlowError("BAD_REQUEST", "Kata sandi baru minimal 8 karakter.");
  }

  const cleanCode = input.code.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(cleanCode)) {
    throw new AuthFlowError("BAD_REQUEST", "Masukkan 6 digit angka kode verifikasi.");
  }

  const userRows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = userRows[0];
  if (!user) {
    throw new AuthFlowError("BAD_REQUEST", "Akun dengan email tersebut tidak ditemukan.");
  }

  const now = new Date();
  const codeRows = await db
    .select()
    .from(emailVerificationCodes)
    .where(
      and(
        eq(emailVerificationCodes.userId, user.id),
        isNull(emailVerificationCodes.consumedAt),
        gt(emailVerificationCodes.expiresAt, now),
      ),
    )
    .orderBy(desc(emailVerificationCodes.id))
    .limit(1);

  const challenge = codeRows[0];
  if (!challenge) {
    throw new AuthFlowError(
      "BAD_REQUEST",
      "Kode verifikasi sudah kedaluwarsa atau belum diminta. Silakan minta kode reset baru.",
    );
  }

  if (challenge.attempts >= MAX_OTP_ATTEMPTS) {
    throw new AuthFlowError(
      "TOO_MANY_REQUESTS",
      "Terlalu banyak percobaan salah untuk kode ini. Silakan minta kode reset baru.",
    );
  }

  if (!verifyOtpCode(email, cleanCode, challenge.codeHash)) {
    await db
      .update(emailVerificationCodes)
      .set({ attempts: challenge.attempts + 1 })
      .where(eq(emailVerificationCodes.id, challenge.id));
    const remaining = Math.max(0, MAX_OTP_ATTEMPTS - (challenge.attempts + 1));
    throw new AuthFlowError(
      "BAD_REQUEST",
      remaining > 0
        ? `Kode verifikasi salah. Sisa percobaan: ${remaining} kali.`
        : "Kode verifikasi salah dan batas percobaan habis. Silakan minta kode reset baru.",
    );
  }

  const updatedHash = hashPassword(input.newPassword);
  const verifiedUser = await db.transaction(async (tx) => {
    await tx
      .update(emailVerificationCodes)
      .set({ consumedAt: now })
      .where(eq(emailVerificationCodes.id, challenge.id));

    const updated = await tx
      .update(users)
      .set({
        passwordHash: updatedHash,
        emailVerifiedAt: user.emailVerifiedAt ?? now,
        lastSignedIn: now,
        updatedAt: now,
      })
      .where(eq(users.id, user.id))
      .returning();

    return (
      updated[0] ?? {
        ...user,
        passwordHash: updatedHash,
        emailVerifiedAt: user.emailVerifiedAt ?? now,
        lastSignedIn: now,
      }
    );
  });

  clearPendingDevOtpCode(email);
  await issueSessionCookie(req, res, verifiedUser);

  return {
    success: true as const,
    user: sanitizeUser(verifiedUser),
  };
}
