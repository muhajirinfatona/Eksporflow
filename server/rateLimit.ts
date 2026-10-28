export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterMs: number };

export type RateLimiterOptions = {
  /** Jumlah maksimum permintaan per key dalam satu jendela waktu. */
  limit: number;
  windowMs: number;
  /** Dapat diganti pada test agar waktu bisa dikontrol. */
  now?: () => number;
};

/**
 * Sliding-window rate limiter di memori proses.
 * Cukup untuk satu instance server; untuk multi-instance gunakan penyimpanan bersama (mis. Redis).
 */
export function createRateLimiter({ limit, windowMs, now = Date.now }: RateLimiterOptions) {
  const hits = new Map<string, number[]>();

  return {
    check(key: string): RateLimitResult {
      const current = now();
      const recent = (hits.get(key) ?? []).filter((timestamp) => current - timestamp < windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return { allowed: false, retryAfterMs: windowMs - (current - recent[0]) };
      }
      recent.push(current);
      hits.set(key, recent);
      // Bersihkan key lain yang sudah kedaluwarsa agar Map tidak tumbuh tanpa batas.
      if (hits.size > 1000) {
        hits.forEach((timestamps, otherKey) => {
          if (!timestamps.some((timestamp) => current - timestamp < windowMs)) hits.delete(otherKey);
        });
      }
      return { allowed: true };
    },
  };
}
