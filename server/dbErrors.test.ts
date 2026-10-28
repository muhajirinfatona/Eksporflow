import { describe, expect, it } from "vitest";
import { isDuplicateEntryError } from "./dbErrors";

describe("isDuplicateEntryError", () => {
  it("mengenali unique violation Postgres (23505) langsung", () => {
    expect(isDuplicateEntryError({ code: "23505" })).toBe(true);
  });

  it("mengenali error yang dibungkus drizzle di cause", () => {
    expect(isDuplicateEntryError(new Error("Failed query", { cause: { code: "23505" } }))).toBe(true);
  });

  it("menolak error lain dan nilai bukan objek", () => {
    expect(isDuplicateEntryError(new Error("boom"))).toBe(false);
    expect(isDuplicateEntryError({ code: "40001" })).toBe(false);
    expect(isDuplicateEntryError({ code: "ER_DUP_ENTRY" })).toBe(false);
    expect(isDuplicateEntryError(null)).toBe(false);
    expect(isDuplicateEntryError("23505")).toBe(false);
  });
});
