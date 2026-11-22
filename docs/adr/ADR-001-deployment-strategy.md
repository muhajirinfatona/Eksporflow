# ADR-001: Strategi Deployment Terpadu — Express/Node vs Cloudflare Workers

- **Status:** Proposed
- **Tanggal:** 2026-11-22 | **Reversibility:** Two-way door (host), one-way door ringan (driver DB & API Node-only)

## Context & Constraints (dari repo)
- `package.json`: server Express + tRPC (`server/_core/index.ts`), build `esbuild --platform=node --packages=external`, start `node dist/index.js`; DB `postgres` (postgres-js) + Drizzle; `docx`, `xlsx`, `mammoth`, `tesseract.js`, `pdfjs-dist` terpasang; rate limiter in-memory (`server/rateLimit.ts`).
- `wrangler.jsonc`: hanya `assets` (SPA statis `dist/public`); **tidak ada** `main` Worker, binding, atau Hyperdrive. Artinya Cloudflare saat ini hanya host statis; API tidak berjalan di sana.
- DB: Supabase Postgres via `DATABASE_URL` (pooler 6543, `prepare:false`).
- Skala (lihat ADR-004/capacity): Tahun 1 ≈ 12.5 peak RPS; Tahun 3 ≈ 83 peak RPS. Tim kecil `[Assumed: 1–3 engineer]`.

## Options
1. **A — Satu proses Express/Node (modular monolith) di host Node (Fly/Railway/Render/VPS/Cloud Run) + SPA statis; Cloudflare sebagai CDN/DNS/WAF di depan.**
   - Pros: nol rewrite; seluruh library Node (docx, PDF, OCR) jalan; transaksi DB native; rate-limit bisa dipindah ke Redis/Postgres; satu pipeline CI.
   - Cons: perlu mengelola host/skala; cold-start tergantung platform.
2. **B — Port API ke Cloudflare Workers (Hono/tRPC fetch adapter) + Hyperdrive ke Supabase.**
   - Pros: edge, tanpa server; biaya idle rendah.
   - Cons: banyak dependensi Node-only (`docx`, `tesseract.js`, `express`, `cookie` handling, `node:crypto` penggunaan) perlu audit/port; batas CPU/memori Worker untuk PDF/OCR; rewrite adapter auth/cookie; risiko regresi besar sebelum fondasi v2 stabil.
3. **C — Hibrid: API inti Express/Node + Worker kecil di edge untuk tugas spesifik (mis. signed URL, webhook) bila dibutuhkan.**

## Decision
**Opsi A sekarang, dengan batas modul yang memungkinkan Opsi C kelak.** Rencana: (1) hapus ambiguitas — `wrangler.jsonc` didokumentasikan sebagai “static assets only”, bukan target API; (2) pindahkan rate limit & job ke penyimpanan bersama saat >1 instance; (3) PDF server-side berjalan di proses Node (ADR-003) dengan antrean sederhana.

## Consequences & Re-evaluation Triggers
- Perlu memilih host Node `[Confirm with Owner: provider & anggaran]` dan health check `/api/health` (sudah ada).
- Tinjau ulang bila: p95 latensi global > 800 ms karena jarak pengguna, atau peak RPS > ~300, atau biaya host > biaya setara Workers; maka evaluasi Opsi C/B per-endpoint (mulai dari endpoint tanpa dependensi Node).
- Larangan: jangan menjalankan API dua jalur (Node & Workers) untuk logika yang sama.
