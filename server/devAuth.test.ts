import { describe, expect, it } from "vitest";
import { isDevLoginEnabled } from "./devAuth";

describe("isDevLoginEnabled", () => {
  it("hanya aktif di luar production ketika ALLOW_DEV_LOGIN bernilai true", () => {
    expect(isDevLoginEnabled({ NODE_ENV: "development", ALLOW_DEV_LOGIN: "true" })).toBe(true);
    expect(isDevLoginEnabled({ NODE_ENV: "test", ALLOW_DEV_LOGIN: "true" })).toBe(true);
  });

  it("selalu nonaktif di production meskipun ALLOW_DEV_LOGIN bernilai true", () => {
    expect(isDevLoginEnabled({ NODE_ENV: "production", ALLOW_DEV_LOGIN: "true" })).toBe(false);
  });

  it("nonaktif bila ALLOW_DEV_LOGIN tidak diatur atau bukan true", () => {
    expect(isDevLoginEnabled({ NODE_ENV: "development" })).toBe(false);
    expect(isDevLoginEnabled({ NODE_ENV: "development", ALLOW_DEV_LOGIN: "false" })).toBe(false);
    expect(isDevLoginEnabled({ NODE_ENV: "development", ALLOW_DEV_LOGIN: "1" })).toBe(false);
  });
});
