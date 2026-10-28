# EksporFlow — Panduan Lokal & Supabase

Project ini berada di `D:\Eksporflow` dan sudah dimigrasikan ke **PostgreSQL (Supabase)** dengan Row Level Security (RLS) aktif pada seluruh tabel.

## Struktur Utama

- `client/` — Aplikasi React + TypeScript + Tailwind (Clean v2.0 Shell 18 layar + Kalkulator Harga PRD v1.8, Dokumen Ekspor, Simulator Kontainer 3D, Control Tower, Risk Center, dan Copilot).
- `shared/` — Tipe domain dan logika murni teruji (`pricing.ts`, `container.ts`, `risk.ts`, `shipment.ts`, `format.ts`).
- `server/` — Express, OAuth/Dev-Session, tRPC (`shipments` CRUD dengan optimistic locking & audit trail, `assistant.ask` dengan rate-limit).
- `drizzle/` — Skema PostgreSQL (`drizzle/schema.ts`) dan file migrasi SQL (`drizzle/migrations/0000_init_postgres.sql`). Arsip migrasi MySQL lama disimpan di `drizzle/legacy-mysql/`.

## Persiapan Database Supabase

1. Buat project baru khusus **EksporFlow** di [Supabase Dashboard](https://supabase.com/dashboard).
2. Buka tombol **Connect** di bagian atas dashboard Supabase, pilih **Transaction pooler** (port `6543`) atau **Session pooler** (port `5432`), lalu salin URI PostgreSQL-nya.
3. Salin `.env.example` menjadi `.env`:
   ```powershell
   Copy-Item .env.example .env
   ```
4. Tempel connection string Supabase Anda ke variabel `DATABASE_URL` di dalam `.env` dan isi password database Anda.
5. Jalankan migrasi ke Supabase:
   ```powershell
   pnpm db:migrate
   ```
   *(Migrasi otomatis membuat 6 tabel beserta enum, foreign key, unique index, dan `ENABLE ROW LEVEL SECURITY` pada setiap tabel agar aman dari akses publik API Supabase.)*

## Menjalankan di Komputer Lokal

1. Pastikan Node.js 20+ dan `pnpm` tersedia di `PATH`.
2. Install dependensi (jika belum):
   ```powershell
   pnpm install
   ```
3. Jalankan server development (port 3000):
   ```powershell
   pnpm dev
   ```
4. Buka `http://localhost:3000`. Jika `ALLOW_DEV_LOGIN="true"` aktif di `.env`, klik tombol **Masuk (Dev Lokal)** di kanan atas untuk membuat sesi user lokal di Supabase dan menguji penyimpanan transaksi ke cloud.

## Verifikasi Kode

- Typecheck: `pnpm check`
- Unit test: `pnpm test`
- Production build: `pnpm build`
