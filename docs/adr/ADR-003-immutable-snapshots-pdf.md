# ADR-003: Immutable Document Snapshots & PDF Server-Side

- **Status:** Proposed
- **Tanggal:** 2026-11-22 | **Reversibility:** One-way door (format snapshot & hash dipakai sebagai bukti)

## Context
- Dokumen saat ini dirender di browser (`DocumentsModule.tsx`, print/PDF browser); revisi hanya counter `documentRevision` pada state (`shared/shipment.ts`). Tidak ada bukti isi dokumen yang pernah diterbitkan.
- `server/storage.ts` menyediakan `storagePut`/`storageGetSignedUrl` (Forge presign) — jalur signed file access sudah ada untuk menyimpan PDF.
- Tabel baru `documentSnapshots` (migrasi 0002): append-only, `contentHashSha256`, `UNIQUE(shipmentId, documentType, revision)`, trigger blokir `UPDATE`, FK `shipments` `ON DELETE RESTRICT`.

## Options
1. **A (dipilih) — Snapshot data kanonik (JSON) + hash SHA-256 di Postgres; PDF dirender server dari snapshot, disimpan di object storage, diakses via signed URL.**
   - Render: HTML template bersama (komponen yang sama dengan preview) → PDF di proses Node via headless Chromium (Playwright/Puppeteer) `[Confirm: ukuran image & memori host]`.
2. **B — Hanya simpan PDF** (tanpa data kanonik): tidak bisa diverifikasi ulang/di-diff.
3. **C — PDF di browser, unggah ke server:** hasil bergantung klien; tidak bisa dipercaya sebagai bukti.

## Decision
Alur terbit: (1) server membaca shipment (versi terkini) + master data; (2) menjalankan cek 3-way (invoice vs packing list vs B/L draft: buyer, HS, qty, net/gross); gagal → tolak, kecuali override dengan `overrideReason` (tercatat); (3) serialisasi kanonik (kunci terurut) → `payloadJson` + SHA-256; (4) insert `documentSnapshots` (revision = max+1, transaksi); (5) render PDF dari payload → `storagePut` → baru `INSERT` baris snapshot beserta `pdfStorageKey/pdfSizeBytes` (karena `UPDATE` diblokir trigger, PDF **harus** sudah ada saat insert; bila render gagal, tidak ada snapshot dan pengguna diminta mengulang). Bila kelak butuh render async, tambahkan tabel status terpisah — keputusan di Tahap 3.
Aturan: label B/L tetap `DRAFT / REFERENCE — NOT CARRIER ISSUED`; revisi = baris baru, tidak pernah mengubah baris lama; verifikasi = hitung ulang hash dari `payloadJson`.

## Konsekuensi & Risiko
- `deleteShipment` (`server/shipmentDb.ts`) akan gagal untuk shipment ber-snapshot (FK RESTRICT) → API harus mengembalikan `CONFLICT` jelas atau mengarsipkan; **perubahan kode di Tahap 3**.
- Target `NFR-003`: p95 ≤ 3 s untuk 1–5 halaman; perlu benchmark & antrean bila Chromium lambat (cold start) `[Needs data]`.
- Retensi PDF/snapshot `[Confirm with Legal]`; hash tidak menggantikan tanda tangan digital/hukum.
- Tinjau ulang bila render > 3 s p95 atau memori host tidak cukup → pindah ke worker terpisah (lihat ADR-001 Opsi C).
