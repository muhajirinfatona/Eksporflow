import { describe, expect, it } from "vitest";
import {
  buildLocalAwareCookieOptions,
  generateOtpCode,
  hashOtpCode,
  hashPassword,
  normalizeEmail,
  verifyOtpCode,
  verifyPassword,
} from "./authService";

describe("authService crypto & cookie helpers", () => {
  it("hashes and verifies passwords with scrypt and timing-safe comparison", () => {
    const hash = hashPassword("EksporAman2026!");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(verifyPassword("EksporAman2026!", hash)).toBe(true);
    expect(verifyPassword("SalahSandi123!", hash)).toBe(false);
    expect(verifyPassword("EksporAman2026!", null)).toBe(false);
  });

  it("generates 6-digit OTP codes and validates email-bound hashes", () => {
    const code = generateOtpCode();
    expect(code).toMatch(/^\d{6}$/);

    const email = normalizeEmail("  Eksportir@Perusahaan.co.id ");
    expect(email).toBe("eksportir@perusahaan.co.id");

    const codeHash = hashOtpCode(email, code);
    expect(verifyOtpCode("eksportir@perusahaan.co.id", code, codeHash)).toBe(true);
    expect(verifyOtpCode("other@perusahaan.co.id", code, codeHash)).toBe(false);
    expect(verifyOtpCode(email, "000000", codeHash)).toBe(code === "000000");
  });

  it("adapts session cookie flags cleanly between localhost HTTP and HTTPS proxy", () => {
    expect(
      buildLocalAwareCookieOptions({ protocol: "http", headers: {} } as never),
    ).toEqual({
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: false,
    });

    expect(
      buildLocalAwareCookieOptions({
        protocol: "http",
        headers: { "x-forwarded-proto": "https" },
      } as never),
    ).toEqual({
      httpOnly: true,
      path: "/",
      sameSite: "none",
      secure: true,
    });
  });
});
