# EksporFlow v2 — Rencana Eksekusi Tahap 2–4 (Milestone Checklist)

Tahap 1 (fondasi: PRD/BA/ADR/skema/migrasi 0002 — **belum diterapkan ke DB**) ada di commit branch `feat/eksporflow-v2`. Urutan mengikuti WSJF (C1 → A1 → D1 → B2 → C2 → B1) dengan dependensi data. Estimasi dalam person-month dari backlog; **bukan** komitmen jadwal (tim & velocity belum diukur — `velocity_analyzer.py` butuh ≥3 sprint data `[Needs data]`).

## Gerbang Tahap 1 → 2 (WAJIB)
- [ ] Konfirmasi pengguna atas ringkasan + hasil lint migrasi 0002
- [ ] Backup/PITR Supabase terverifikasi (catat titik pemulihan)
- [ ] Terapkan 0002 ke **database dev/staging dulu**, bukan produksi (`pnpm db:migrate`)
- [ ] Verifikasi: 9 tabel ada, `relrowsecurity = true`, tabel lama tidak berubah (jumlah baris sama)
- [ ] Putuskan: provider host Node (ADR-001), storage objek, kebijakan retensi (Legal)

## Tahap 2 — Master Data, Onboarding, UI (≈ C1 1.2 + A1 1.0 + D1 1.2 PM)
**M2.1 Master Data CRUD server-side (C1)**
- [ ] Modul server `masterData.ts` (scoped workspace, role editor+, optimistic lock `version`)
- [ ] tRPC `masterBuyers.*`, `masterProducts.*` + validasi zod
- [ ] Ganti `partners/products` localStorage di `useWorkspaceFlow.ts`; impor sekali dari localStorage
- [ ] Undangan tim: `workspaceInvitations` (token hash, expiry 7 hari, accept flow)
- [ ] Test: tenant isolation, role, konflik versi (butuh `DATABASE_URL` test)
- DoD: TC-MD-01..03, TC-INV-01..02 lulus; tidak ada akses lintas workspace

**M2.2 Guided Onboarding 4 langkah + preset komoditas (A1)**
- [ ] Preset 4 sektor (HS 6 digit, kemasan, susut) sebagai data terkurasi `[Confirm: HS dengan ahli ekspor]`
- [ ] Wizard 4 langkah, empty state terpandu, label “Draft Simulasi” untuk demo
- [ ] Ukur TTFV & completion (instrumentasi)
- DoD: TC-ONB-01..05; data demo tidak mencemari laporan

**M2.3 UI/UX non-generik (D1)**
- [ ] Stepper 9 tahap alur transaksi; indikator simpan (lokal/cloud/konflik)
- [ ] `tabular-nums`, kontras ≥ 4.5:1, status tidak hanya warna
- [ ] Audit visual desktop + layar sempit
- DoD: TC-UX-01..03

## Tahap 3 — Dokumen & Approval (≈ C2 1.5 PM)
**M3.1 Approval server-side & SoD**
- [ ] tRPC `approvals.*` (`shipmentApprovals`), tolak self-approval, supersede saat offer/incoterm/margin berubah
- [ ] Perbarui `deleteShipment` (FK RESTRICT snapshot → `CONFLICT`/arsip)
- DoD: TC-APR-01..03

**M3.2 Snapshot immutable + PDF server (ADR-003)**
- [ ] Serialisasi kanonik + SHA-256, cek 3-way, override beralasan
- [ ] Renderer PDF server + `storagePut` + signed URL
- [ ] Benchmark p95 ≤ 3 s; fixture test kalkulator/muatan/orientasi
- DoD: TC-DOC-01..04, TC-PERF-01

## Tahap 4 — AI Advisor v2 (≈ B2 1.3 + B1 1.5 PM)
**M4.1 Governance dulu (B2)**
- [ ] Redaksi PII, logging ke `aiInteractionLogs`, feedback `aiFeedback`
- [ ] Rate limit ke penyimpanan bersama
- [ ] Baseline eval Copilot saat ini (ukur, jangan asumsi)
**M4.2 RAG + tools (B1)**
- [ ] Ingest/chunk `knowledgeDocuments`→`knowledgeChunks`; retrieval scoped & revoke/expired
- [ ] Tool `calculatePricing/Container/Risk` (read-only), sitasi, abstention
- [ ] Suite 100 kasus di CI; gate ≥95%, 0 klaim legal, 0 PII
- DoD: TC-AI-01..06, TC-PERF-02, TC-SEC-02

## Risiko & Ketergantungan
| Risiko | Mitigasi |
| :--- | :--- |
| Lint migrasi: 19 HIGH (false positive index tabel baru) | Didokumentasikan; tabel kosong; migrator transaksional |
| `DATABASE_URL` belum ada → test integrasi tertunda | Gerbang Tahap 1→2 |
| Render PDF lambat/berat | Benchmark dini; opsi worker terpisah |
| Keputusan Legal/Owner terbuka | Ditandai `[Confirm …]` di BA/ADR |
| Perubahan UI tak terkait di working tree | Dipisahkan dari commit Tahap 1 |

## Cadence
Sprint 1–2 minggu `[Assumed]`; kumpulkan data sprint sejak Sprint 1 agar `velocity_analyzer.py`/`sprint_health_scorer.py` bisa dipakai setelah ≥3 sprint; retro: maksimal 3 action item bila completion <60%.
