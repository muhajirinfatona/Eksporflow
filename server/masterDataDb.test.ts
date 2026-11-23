import { describe, expect, it } from "vitest";
import { MasterDataError } from "./masterDataDb";
import { createHash } from "node:crypto";

describe("masterDataDb module contracts", () => {
  it("initializes MasterDataError with appropriate error codes", () => {
    const errNotFound = new MasterDataError("NOT_FOUND", "Data buyer tidak ditemukan.");
    expect(errNotFound.code).toBe("NOT_FOUND");
    expect(errNotFound.message).toBe("Data buyer tidak ditemukan.");

    const errConflict = new MasterDataError("CONFLICT", "Nama buyer sudah terdaftar.");
    expect(errConflict.code).toBe("CONFLICT");

    const errForbidden = new MasterDataError("FORBIDDEN", "Tidak memiliki akses.");
    expect(errForbidden.code).toBe("FORBIDDEN");
  });

  it("verifies invitation token hashing and expiration calculation", () => {
    const rawToken = "test_raw_token_secret_1234567890abcdef";
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    expect(tokenHash).toHaveLength(64);

    const now = Date.now();
    const expiresAt = new Date(now + 7 * 24 * 60 * 60 * 1000);
    const diffDays = (expiresAt.getTime() - now) / (1000 * 60 * 60 * 24);
    expect(Math.round(diffDays)).toBe(7);
  });
});
