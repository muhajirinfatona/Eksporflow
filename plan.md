# EksporFlow — Rencana Implementasi

## Tujuan produk
EksporFlow adalah workspace operasional berbahasa Indonesia yang menyatukan kalkulasi harga berbasis Incoterm, pembuatan dokumen ekspor, dan perencanaan muatan kontainer agar eksportir dapat menyiapkan transaksi dengan cepat dan konsisten.

## Pendekatan implementasi
- React + TypeScript + Tailwind pada starter web-db-user, dengan server Express/tRPC tetap tersedia untuk pengembangan lanjutan.
- Versi awal berfokus pada satu workspace interaktif: data transaksi tersimpan di localStorage agar kalkulator dan dokumen tetap dapat dipakai tanpa login; struktur backend/database starter dipertahankan untuk persistensi multi-user pada iterasi berikutnya.
- Kalkulasi harga memetakan komponen biaya umum dari EXW hingga DDP, menampilkan margin, total penawaran, dan perbandingan skenario Incoterm.
- Dokumen dibuat sebagai pratinjau siap cetak dari data transaksi yang sama, dengan template Proforma Invoice, Commercial Invoice, dan Bill of Lading.
- Kalkulator kontainer menghitung volume, berat, estimasi jumlah kontainer, pemakaian kapasitas, dan peringatan overload.
- Route manifest hanya mendeklarasikan halaman utama karena semua modul berada di workspace yang sama.

## Struktur proyek
- `client/src/pages/Home.tsx`: shell dashboard, navigasi modul, state transaksi, kalkulasi dan pratinjau dokumen.
- `client/src/index.css`: token warna, tipografi, layout responsif, dan komponen visual workspace.
- `client/src/App.tsx`: routing halaman utama.
- `public/manus-routes.json`: manifest route untuk platform.
- `drizzle/schema.ts`, `server/`: fondasi data dan API terkelola untuk fase persistensi berikutnya.

## Design system

### Tiga opsi awal
1. **Harbor Ledger / 0.06** — workspace editorial dengan navy maritim, aksen saffron, dan kartu data bertingkat.
2. **Carbon Terminal / 0.04** — dashboard gelap industrial dengan neon hijau dan grid teknis.
3. **Paperwork Atelier / 0.08** — antarmuka terang seperti meja dokumen dengan aksen merah bata.

### Pilihan: Harbor Ledger
**Design Movement:** editorial maritime operations — perpaduan logbook pelabuhan, kartu manifest, dan dashboard data modern.

**Core Principles:** hirarki data yang tegas; aksen warna hanya untuk keputusan dan status; input terasa seperti lembar kerja; dokumen selalu satu klik dari kalkulasi.

**Color Philosophy:** deep navy memberi rasa kendali dan kepercayaan; putih hangat menjaga workspace tetap manusiawi; saffron menjadi warna sinyal untuk nilai dan aksi penting; mint/teal menandai kondisi sehat.

**Layout Paradigm:** sidebar kompak sebagai rail navigasi, top bar yang tenang, dan konten asimetris dengan hero ringkasan besar di kiri serta metrik cepat di kanan.

**Signature Elements:** nomor transaksi bergaya logbook; garis rute tipis sebagai motif visual; label status berbentuk pill dengan aksen saffron.

**Interaction Philosophy:** setiap perubahan input langsung memperbarui ringkasan; tab modular menjaga fokus; aksi utama selalu memiliki label konteks, bukan ikon saja.

**Animation:** transisi 160–220ms ease-out; angka total menggunakan fade/slide singkat; panel dan tab masuk dengan opacity ringan tanpa gerakan dekoratif berlebihan.

**Typography System:** Inter untuk UI dan angka, DM Serif Display untuk headline pendek/label editorial; ukuran besar dipakai untuk total nilai, bukan dekorasi.

**Brand Essence:** pusat kendali ekspor untuk tim dagang yang ingin menghitung, menyiapkan, dan mengirim dokumen tanpa berpindah alat — teliti, tenang, siap kirim.

**Brand Voice:** headline singkat dan operasional; CTA selalu menjelaskan hasil. Contoh: “Siapkan penawaran yang siap dikirim.” dan “Semua dokumen, satu sumber data.”

**Wordmark & Logo:** wordmark `eksporflow` lower-case dengan simbol dua garis peti yang membentuk panah ke kanan.

**Signature Brand Color:** saffron `#F2B84B`, dipakai sebagai penanda nilai, fokus, dan tindakan berikutnya.

## Batch 4 — Copilot dan kontrol risiko aktif
- `AssistantModule` memakai endpoint tRPC `assistant.ask` yang sudah tersedia, mengirim snapshot transaksi yang dibatasi panjangnya, menampilkan percakapan Markdown, prompt cepat, dan batasan penggunaan yang aman.
- `RecommendationsPanel` menghitung saran deterministik dari data transaksi aktif sehingga perubahan booking, HS Code, margin, kop surat, atau utilisasi kontainer langsung memengaruhi langkah berikutnya.
- `RiskModule` memperluas kontrol dasar dengan legal review gate yang tersimpan di localStorage per nomor transaksi, screening bukti PO/email melalui arsip lampiran, dan readiness score gabungan.
- Semua panel tetap memakai sumber data transaksi yang sama; modul AI memberi panduan operasional dan tidak menggantikan verifikasi customs, bank, forwarder, atau penasihat hukum.


## PRD v1.8 alignment sprint

Prioritas sprint ini adalah correctness dan truthfulness pada workflow yang sudah terlihat pengguna, bukan menambah klaim produksi. Formula quote diubah dari markup implisit menjadi net-price margin dengan contingency terpisah; Incoterms® 2020, named place, kurs sumber/tanggal, dan formula version menjadi metadata wajib. Dokumen mempertahankan satu data transaksi tetapi menambah paper size, orientation, template gallery, bahasa preview, output English untuk print, revisi draft, dan label B/L draft/reference. Rencana muatan menampilkan gross/net/pallet weight dan volume secara terpisah; shrinkage tidak mengurangi gross weight; 3D dianggap alat bantu estimasi dengan disclaimer.

P0 SaaS, multi-tenant authorization, server-side persistence, audit trail, immutable snapshot, PDF renderer, approval, AI knowledge base, screening eksternal, billing, dan ledger accounting sengaja tetap outcome terbuka karena membutuhkan desain data, security review, dan keputusan owner. UI localStorage tidak boleh dipresentasikan sebagai cloud source of record. Semua copy AI, screening, Incoterms, dokumen, dan 3D harus menghindari jaminan legal, buyer, customs, payment, safety, atau profit.



## Wireframe Clean v2.0 rebuild

UI aktif akan direbuild mengikuti `EksporFlow_Wireframe_Clean_v2.0.html` dan design system v2.0 sebagai sumber visual utama: satu shell global, sidebar tujuh grup, topbar dengan pencarian dan identitas user, breadcrumb, kartu tipis, tabel operasional, badge berlabel teks, dan progressive disclosure. Sebanyak 18 view wireframe dipertahankan dengan navigasi query `?screen=`: Dashboard, Asesmen Kesiapan, Transaksi Ekspor, Harga & Order, Persetujuan, Dokumen Ekspor, Rencana Muatan, Logistik & Pengiriman, Risk Center, AI Advisor, Pengetahuan Tim, Mitra & Kontak, Katalog Produk, Keuangan, Rekonsiliasi Bank, Jurnal & Bagan Akun, Laporan & Analitik, dan Pengaturan Workspace.

Arah copy akan tetap berbahasa Indonesia operasional yang relevan untuk pekerja ekspor senior. Ukuran teks kerja dinaikkan dibanding wireframe mentah: isi dan tabel minimum sekitar 13–14px, label 11–12px, judul halaman 28px, target klik nyaman, kontras jelas, dan status selalu memiliki teks bukan hanya warna. Struktur bisnis PRD v1.8 tidak dihapus; UI wireframe menjadi shell/review flow, sementara kalkulator, dokumen, muatan, risk, dan Copilot aktif tetap dipertahankan di source React untuk diintegrasikan bertahap ke layar baru.

Untuk iterasi visual ini, HTML wireframe dipakai sebagai baseline navigasi yang dapat diklik agar fidelity terhadap referensi terjaga, dengan CSS override aksesibilitas dan copy customer-facing. Penyimpanan cloud, approval server-side, audit trail, dan PDF immutable tetap mengikuti outcome P0/P1 yang sudah tercatat di TODO dan tidak diklaim selesai oleh rebuild visual.



## P0 persistence foundation — 2026-10-28

Database sekarang memiliki boundary workspace dan membership role owner/admin/editor/viewer. Shipment disimpan sebagai snapshot JSON yang versioned, line item disimpan terpisah agar dapat di-query dan diaudit, dan setiap create/update menulis audit log. Endpoint protected tRPC memvalidasi payload, membatasi pagination, memeriksa membership/role, dan menolak update stale melalui optimistic locking.

Langkah lanjutan yang sengaja belum diklaim selesai adalah menghubungkan shell wireframe aktif ke session/auth dan endpoint shipment ini. Sampai binding UI terverifikasi, localStorage pada implementasi React lama dipertahankan sebagai fallback kompatibilitas dan tidak dipresentasikan sebagai cloud source of record.
