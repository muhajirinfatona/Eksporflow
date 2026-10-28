# EksporFlow — Outcome

## Dashboard workspace operasional
- [x] Pengguna melihat workspace berbahasa Indonesia dengan navigasi untuk ringkasan, kalkulasi harga, dokumen, dan muatan kontainer.
- [x] Workspace menampilkan nomor transaksi, buyer, tujuan, Incoterm aktif, total penawaran, dan status kesiapan.
- [x] Data transaksi dapat diubah dari panel input dan tersimpan di browser agar kalkulator serta dokumen menggunakan sumber data yang sama.

## Kalkulator harga ekspor berbasis Incoterm
- [x] Pengguna dapat memilih Incoterm dan mata uang serta mengisi nilai barang, kemasan, inland transport, handling, customs, freight, insurance, margin, dan diskon.
- [x] Sistem menghitung komponen biaya, harga penawaran, estimasi profit, margin persentase, serta harga per unit secara otomatis.
- [x] Sistem menampilkan skenario perbandingan untuk EXW, FOB, CIF, dan DDP agar pengguna dapat melihat dampak biaya.

## Generator dokumen ekspor
- [x] Pengguna dapat memilih template Proforma Invoice, Commercial Invoice, atau Bill of Lading.
- [x] Dokumen mengambil data transaksi yang sama, menampilkan identitas pihak, referensi, rincian barang, nilai, Incoterm, dan terms pembayaran/pengiriman.
- [x] Dokumen dapat ditinjau dan dicetak melalui aksi browser print dengan layout profesional.

## Kalkulator muatan kontainer
- [x] Pengguna dapat mengisi dimensi karton, berat, quantity, tipe kemasan, dan tipe kontainer.
- [x] Sistem menghitung volume total, berat total, estimasi jumlah kontainer, pemakaian volume, pemakaian berat, sisa kapasitas, dan peringatan overload.
- [x] Sistem menampilkan visualisasi stuffing sederhana dan catatan packing.

## Kualitas delivery
- [x] Route manifest tersedia di `/manus-routes.json`.
- [x] TypeScript diagnostics aktif untuk proyek.
- [ ] Persistensi multi-user berbasis database dan ekspor PDF server-side disiapkan sebagai fase lanjutan; versi ini menyediakan localStorage dan print-ready preview.

## Batch 1 — kontrol operasional & mitigasi risiko

- [x] Packing List terhubung ke referensi transaksi, produk, HS Code, jumlah karton, berat, volume, kontainer, container number, dan seal number.
- [x] Shipment control tower dengan status Draft sampai Completed, referensi PO/booking/container/seal, arsip lampiran, dan checklist handoff.
- [x] Risk Center dengan pemeriksaan buyer/tujuan, HS Code, kapasitas kontainer, kelengkapan dokumen, traceability booking/seal, dan arsip bukti transaksi.
- [ ] Batch berikutnya: invoice multi-item, master data buyer/produk, penomoran dokumen otomatis, dan validasi 3-way antar invoice/Packing List/B/L.

## Batch 2 — konsistensi komersial & master data

- [x] Invoice multi-item dengan tambah/hapus item, HS Code, quantity, harga unit, dan total per item.
- [x] Packing List menampilkan seluruh line item dan terhubung ke berat/volume item.
- [x] Penomoran otomatis PI, CI, PL, dan BL berbasis nomor transaksi.
- [x] Master data buyer/consignee dan product catalog dengan aksi terapkan ke transaksi aktif.
- [x] Validasi 3-way quantity dan HS Code antara invoice, Packing List, dan rencana stuffing di Risk Center.

## Batch 3 — simulator muatan berbasis kemasan

- [x] Setiap line item dapat memakai jenis kemasan berbeda: karton box, karung goni, drum, sack, atau crate kayu.
- [x] Persentase susut per produk mengurangi berat efektif pada simulasi dan ditampilkan sebagai berat susut.
- [x] Opsi pallet kayu dapat diaktifkan per produk meskipun kemasan utamanya karung goni atau karton box.
- [x] Kalkulator menambahkan volume dan berat pallet, jumlah pallet, utilisasi volume/berat, serta estimasi jumlah kontainer.
- [x] Batch berikutnya: asisten AI, rekomendasi aktif, validasi legal dokumen, dan screening buyer berbasis bukti email/PO.

## Batch 4 — Copilot, rekomendasi aktif, dan kontrol legal

- [x] Copilot AI EksporFlow tersedia sebagai modul workspace dengan chat tRPC/LLM, konteks transaksi aktif, saran prompt, dan disclaimer bahwa jawaban bukan opini hukum atau jaminan buyer.
- [x] Ringkasan transaksi menampilkan rekomendasi aktif yang dihitung ulang dari data buyer, HS Code, booking, dokumen, margin, dan utilisasi muatan serta mengarahkan pengguna ke modul tindakan terkait.
- [x] Risk Center menyediakan legal review gate dengan empat checkpoint yang dapat dicentang dan disimpan per nomor transaksi: konfirmasi HS Code, bukti asal barang, review terms pembayaran, serta screening buyer/negara.
- [x] Risk Center menyediakan screening buyer/PO berbasis arsip bukti PDF, gambar, DOC/DOCX, atau TXT; sistem menandai bukti PO dan email/konfirmasi buyer berdasarkan nama file tanpa mengklaim keaslian atau kepatuhan hukum final.
- [x] Readiness score menggabungkan kontrol operasional, legal review, 3-way consistency, kapasitas kontainer, traceability, dan bukti transaksi; guardrails ekspor tetap menekankan verifikasi customs, bank, forwarder, dan penasihat hukum.

## Batch 3b — simulator 3D

- [x] Menambahkan viewport Three.js interaktif dengan wireframe kontainer dan OrbitControls.
- [x] Menampilkan blok kemasan per line item dengan warna berbeda berdasarkan jenis kemasan.
- [x] Menampilkan pallet kayu pada layout 3D jika opsi pallet diaktifkan.
- [x] Menyediakan sudut pandang Isometric, Samping, dan Atas.
- [x] Menampilkan grid simulasi, jumlah item visual, dimensi internal kontainer, dan jumlah pallet terdeteksi.

## Batch 3c — kemasan custom

- [x] Pilihan kemasan standar per produk tetap tersedia.
- [x] Opsi “Kemasan lain” memungkinkan pengguna memasukkan nama kemasan sendiri.
- [x] Dimensi panjang, lebar, tinggi, dan berat per unit dapat diisi untuk kemasan custom.
- [x] Kemasan custom ikut dihitung dalam volume, berat, dan visualisasi 3D dengan fallback warna khusus.

## Batch 3d — editor kemasan inline

- [x] Jenis kemasan, kemasan custom, dimensi, berat/unit, susut, dan pallet dapat diubah langsung di halaman Muatan Kontainer.
- [x] Perubahan inline tersinkron ke kalkulator harga, Packing List, invoice, dan viewport 3D tanpa pindah halaman.


## PRD v1.8 alignment sprint — workflow correctness dan truthfulness

- [x] Kalkulator harga mengikuti formula net price `cost / (1 - target margin)` dengan guardrail margin `0% <= margin < 100%`; contingency terpisah dari margin; kurs referensi memiliki sumber/tanggal; formula version dan named place terlihat; invalid quantity/kurs/margin/named place/diskon menampilkan validasi dan menonaktifkan aksi memakai quote.
- [x] Modul dokumen tetap terpisah dari Muatan Kontainer dan mendukung A4/Letter/Legal, Portrait/Landscape, tiga pilihan template, preview English/Bahasa Indonesia, Output: English pada Print/PDF, revisi draft, logo/kop perusahaan tanpa wordmark EksporFlow, serta B/L berlabel `DRAFT / REFERENCE` dan bukan carrier-issued.
- [x] Rencana muatan memisahkan product/pallet volume, net/gross/pallet weight, dan shrinkage loss; dimensi pallet dapat diedit per line item; 3D memiliki reset view, jumlah preview terbatas, dan disclaimer bahwa alat bantu bukan sertifikasi keselamatan atau optimizer stuffing.
- [x] Risk Center tidak lagi menyatakan `Ready to ship`; status lengkap tetap memerlukan verifikasi manusia dan bukan legal clearance/release otomatis.
- [ ] P0 cloud persistence: ganti localStorage sebagai source of record dengan tabel workspace/transaksi/line item, protected tRPC CRUD, tenant isolation, role minimum, optimistic locking, audit trail, dan state saved/error yang dapat dibuktikan melalui acceptance test.
- [ ] P1 master data CRUD, approval server-side/self-approval prevention, immutable document snapshot dan PDF server-side, serta fixture tests kalkulator/muatan/orientasi.
- [ ] P1 AI Advisor bersumber dengan knowledge lifecycle, citations, permissions, expiry/revocation, abstention, redaction, model/tool/cost/feedback log, dan evaluasi 100 kasus; current Copilot tetap guidance-only.
- [ ] P2 subscription/entitlement, quota, billing, buyer screening eksternal, dan accounting ledger menunggu keputusan owner bisnis/finance/legal/operations.



## Wireframe Clean v2.0 rebuild

- [x] Shell aktif mengikuti wireframe v2.0 dengan sidebar tetap berisi tujuh grup: Ringkasan, Penjualan, Operasional Ekspor, Advisor & Pengetahuan, Data Utama, Keuangan & Analitik, dan Administrasi; menu aktif, breadcrumb, topbar, pencarian, user/workspace, kartu, tabel, badge berlabel, dan CTA mengikuti design system.
- [x] Seluruh 18 layar wireframe tersedia melalui navigasi klik/query: Dashboard, Asesmen Kesiapan, Transaksi Ekspor, Harga & Order, Persetujuan, Dokumen Ekspor, Rencana Muatan, Logistik & Pengiriman, Risk Center, AI Advisor, Pengetahuan Tim, Mitra & Kontak, Katalog Produk, Keuangan, Rekonsiliasi Bank, Jurnal & Bagan Akun, Laporan & Analitik, dan Pengaturan Workspace.
- [x] Copy UI disesuaikan untuk pekerja ekspor senior: bahasa operasional singkat, CTA spesifik, status eksplisit, dan tidak bergantung pada warna saja.
- [x] Keterbacaan desktop ditingkatkan dari wireframe mentah: body/table text sekitar 13–14px, label sekitar 11–12px, heading halaman sekitar 28px, target interaksi nyaman, kontras tetap profesional, dan layout tetap bersih pada layar sempit.
- [ ] Integrasikan satu per satu data transaksi aktif, kalkulator PRD, dokumen, muatan, Risk Center, Copilot, dan persistence server-side ke layar wireframe baru tanpa menurunkan fidelity visual.



## P0 — persistence server-side foundation

- [x] Migration database menambahkan `workspaces`, `workspaceMembers`, `shipments`, `shipmentLineItems`, dan `shipmentAuditLogs` dengan foreign key, tenant boundary, unique reference per workspace, role workspace, version, dan timestamp.
- [x] Protected tRPC CRUD shipment tersedia dengan limit/offset, validasi input, tenant access check, role minimum viewer/editor, optimistic locking berbasis `version`, dan audit event create/update.
- [ ] Bind shell wireframe aktif ke endpoint protected persistence dan auth flow; localStorage belum boleh dihapus sebelum UI baru dapat membaca/menulis source of record server-side secara terverifikasi.



## Pengembangan lanjutan — 2026-10-28

- [x] Logika harga dan muatan diekstrak dari `Home.tsx` ke `shared/pricing.ts` dan `shared/container.ts`, tipe dan data awal ke `shared/shipment.ts`; fixture test vitest untuk formula net price, Incoterm, diskon, validasi, volume/berat, shrinkage, dan jumlah kontainer.
- [x] Perbaikan bug: net weight tidak lagi jatuh ke gross weight saat shrinkage 100%.
- [x] `assistant.ask` kini protected, dibatasi 20 pertanyaan/jam per user (in-memory, per instance), dan mencatat metadata tanpa isi pertanyaan.
- [x] `createShipment` dan `updateShipment` atomik dalam transaksi DB; reference duplikat menghasilkan `CONFLICT`, bukan error 500.
- [x] Workspace di-resolve lewat membership tertua sehingga anggota non-owner memakai workspace yang mengundangnya; pembuatan workspace dan membership owner dalam satu transaksi.
- [ ] Test integrasi DB (tenant isolation, role, optimistic locking) belum ada karena membutuhkan MySQL; perubahan transaksi baru diverifikasi lewat typecheck.
- [ ] Rate limit multi-instance memerlukan penyimpanan bersama (mis. Redis).
- [ ] Pecah sisa `Home.tsx` (572 baris) menjadi komponen per modul.
