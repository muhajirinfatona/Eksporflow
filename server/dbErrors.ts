/**
 * Mendeteksi error unique-violation PostgreSQL (SQLSTATE 23505), termasuk yang
 * dibungkus oleh drizzle pada properti `cause`.
 */
export function isDuplicateEntryError(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; current && typeof current === "object" && depth < 5; depth++) {
    const candidate = current as { code?: unknown; cause?: unknown };
    if (candidate.code === "23505") return true;
    current = candidate.cause;
  }
  return false;
}
