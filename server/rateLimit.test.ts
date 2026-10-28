import { describe, expect, it } from "vitest";
import { createRateLimiter } from "./rateLimit";

describe("createRateLimiter", () => {
  it("mengizinkan permintaan sampai batas lalu menolak", () => {
    let time = 0;
    const limiter = createRateLimiter({ limit: 2, windowMs: 1000, now: () => time });
    expect(limiter.check("u1")).toEqual({ allowed: true });
    expect(limiter.check("u1")).toEqual({ allowed: true });
    expect(limiter.check("u1")).toEqual({ allowed: false, retryAfterMs: 1000 });
  });

  it("melaporkan sisa waktu tunggu dan mengizinkan lagi setelah jendela lewat", () => {
    let time = 0;
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000, now: () => time });
    limiter.check("u1");
    time = 400;
    expect(limiter.check("u1")).toEqual({ allowed: false, retryAfterMs: 600 });
    time = 1000;
    expect(limiter.check("u1")).toEqual({ allowed: true });
  });

  it("menghitung tiap key secara terpisah", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000, now: () => 0 });
    expect(limiter.check("u1").allowed).toBe(true);
    expect(limiter.check("u2").allowed).toBe(true);
    expect(limiter.check("u1").allowed).toBe(false);
  });
});
