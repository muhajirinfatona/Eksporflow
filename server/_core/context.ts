import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Di mode pengembangan (dev), bila sesi cookie belum ada atau database Supabase
    // sedang jeda (paused), berikan fallback sesi developer lokal agar pengguna
    // langsung masuk ke workspace tanpa terhambat login berulang kali.
    if (process.env.NODE_ENV !== "production" && process.env.ALLOW_DEV_LOGIN === "true") {
      user = {
        id: 1,
        openId: "dev-local-owner",
        name: "Muhajirin Fatona",
        companyName: "PT. INDICO EXPORT INDONESIA",
        email: "dev@eksporflow.local",
        passwordHash: "",
        emailVerifiedAt: new Date("2026-01-01"),
        loginMethod: "dev-local",
        role: "admin",
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-01"),
        lastSignedIn: new Date(),
      };
    } else {
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
