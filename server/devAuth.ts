import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "./db";
import { sdk } from "./_core/sdk";

export function isDevLoginEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.NODE_ENV !== "production" && env.ALLOW_DEV_LOGIN === "true";
}

/**
 * Endpoint login lokal khusus development agar pengujian dengan Supabase
 * di localhost tetap berjalan tanpa bergantung pada server OAuth Manus.
 * Dinonaktifkan penuh pada NODE_ENV=production atau saat ALLOW_DEV_LOGIN != "true".
 */
export function registerDevAuthRoutes(app: Express) {
  app.get("/api/dev/status", (_req: Request, res: Response) => {
    res.json({ enabled: isDevLoginEnabled() });
  });

  app.post("/api/dev/logout", (_req: Request, res: Response) => {
    if (!isDevLoginEnabled()) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: false,
    });
    res.json({ success: true });
  });

  app.post("/api/dev/login", async (req: Request, res: Response) => {
    if (!isDevLoginEnabled()) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    if (!process.env.DATABASE_URL) {
      res.status(503).json({
        error: "DATABASE_URL belum diatur di .env. Salin .env.example ke .env, isi URI Supabase, lalu jalankan pnpm db:migrate.",
      });
      return;
    }

    if (!process.env.MANUS_PROJECT_ID || !process.env.MANUS_JWT_SECRET) {
      res.status(503).json({
        error: "MANUS_PROJECT_ID dan MANUS_JWT_SECRET wajib diisi di .env untuk menandatangani sesi lokal (lihat .env.example).",
      });
      return;
    }

    const body = (req.body ?? {}) as { name?: unknown; email?: unknown };
    const openId = "dev-local-owner";
    const name = typeof body.name === "string" && body.name.trim() ? body.name.trim().slice(0, 120) : "Developer Lokal";
    const email = typeof body.email === "string" && body.email.trim() ? body.email.trim().slice(0, 320) : "dev@eksporflow.local";

    try {
      await db.upsertUser({
        openId,
        name,
        email,
        loginMethod: "dev-local",
        role: "admin",
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(openId, {
        name,
        expiresInMs: ONE_YEAR_MS,
      });

      // Di localhost HTTP, cookie Secure+SameSite=None dapat ditolak browser tertentu;
      // gunakan SameSite=Lax untuk pengembangan lokal.
      res.cookie(COOKIE_NAME, sessionToken, {
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secure: false,
        maxAge: ONE_YEAR_MS,
      });

      res.json({ success: true, user: { openId, name, email } });
    } catch (error) {
      console.error("[DevAuth] Login lokal gagal:", error);
      res.status(500).json({
        error: "Gagal menyimpan sesi ke database. Pastikan koneksi Supabase aktif dan tabel sudah dimigrasi (pnpm db:migrate).",
      });
    }
  });
}
