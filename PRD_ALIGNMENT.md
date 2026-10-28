# EksporFlow — PRD v1.8 alignment

Sumber requirement: `/home/ubuntu/upload/EksporFlow_PRD_v1.8.pdf` dan ekstraksi kerja di `/tmp/text_editor_extracts/EksporFlow_PRD_v1.8-dae1c15e8dfb-p1-18.txt`.

## Perubahan yang ditutup pada sprint ini

- Kalkulator harga memakai formula net price `offer sebelum diskon = cost / (1 - target margin)` dengan guardrail margin `0% <= margin < 100%`. Contingency dipisahkan dari margin. Kurs referensi, sumber/tanggal kurs, formula version, named place, dan validation errors terlihat pada workspace.
- Dokumen mendukung A4, Letter, Legal, Portrait, Landscape, tiga pilihan template, preview English/Bahasa Indonesia, output print/PDF berlabel English, revisi draft, upload logo/kop perusahaan, dan label B/L `DRAFT / REFERENCE` yang bukan carrier-issued. Saat logo belum dipilih, preview tidak menampilkan wordmark/logo EksporFlow.
- Rencana muatan memisahkan product volume, pallet volume, net weight, gross weight, pallet weight, dan shrinkage loss. Dimensi pallet dapat diedit per line item. 3D diberi label alat bantu estimasi, membatasi jumlah unit yang divisualisasikan, menyediakan reset view, dan tidak menyatakan aman/optimal/sertifikasi.
- Risk Center menggunakan status `Review complete — verify`, bukan `Ready to ship`, dan tetap menegaskan bahwa hasil bukan legal clearance atau release otomatis.

## Masih terbuka dan tidak diklaim selesai

- P0 SaaS: tenant/workspace isolation, RBAC server-side, protected CRUD transaksi/line item, optimistic locking, audit trail immutable, backup/restore, dan signed file access belum selesai. LocalStorage masih menjadi persistence UI.
- P1/P2: master data CRUD nyata, approval server-side, PDF server-side/snapshot immutable, knowledge-base bersumber dan berizin untuk AI, AI logs/abstention/evaluation, buyer screening eksternal, subscription/entitlements, dan accounting ledger masih membutuhkan keputusan arsitektur serta owner proses.
- Estimasi kontainer, AI, screening nama file, Incoterms, dan preview dokumen tidak memberikan jaminan kepatuhan, keselamatan stuffing, keaslian buyer, penerimaan customs, pembayaran, atau laba aktual.

## Bukti teknis

- `client/src/pages/Home.tsx`: state transaksi, formula, dokumen, muatan, dan risk copy.
- `client/src/index.css`: styling tambahan PRD v1.8.
- `TODO.md`: outcome dan acceptance clauses yang masih terbuka.
