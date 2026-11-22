# EksporFlow v2 — Product Audit, Prioritized Backlog, Non-Goals & Guardrail Metrics

## 1. Audit Status `PRD_ALIGNMENT.md` & `TODO.md` (Baseline v1.8 → Gap v2.0)

Berdasarkan audit terhadap [PRD_ALIGNMENT.md](../../PRD_ALIGNMENT.md) dan [TODO.md](../../TODO.md), status fondasi saat ini adalah:

| Domain | Status v1.8 (Selesai) | Gap Kritis Menuju EksporFlow v2 (Target Tahap 1–4) |
| :--- | :--- | :--- |
| **Core Persistence & Multi-Tenancy** | Tabel PostgreSQL/Supabase (`users`, `emailVerificationCodes`, `workspaces`, `workspaceMembers`, `shipments`, `shipmentLineItems`, `shipmentAuditLogs`) + RLS aktif + optimistic locking `version` pada transaksi. | Master Data (`masterBuyers`, `masterProducts`), Approval (`shipmentApprovals`), Knowledge Base (`knowledgeDocuments`, `knowledgeChunks`), Immutable Document Snapshots (`documentSnapshots`), Undangan Tim (`workspaceInvitations`), dan AI Logs (`aiInteractionLogs`, `aiFeedback`) masih di `localStorage` (`useWorkspaceFlow.ts`) atau hanya `console.info`. |
| **(a) Guided Onboarding & Multi-Komoditas** | Checklist 30 hari pasif di Dashboard; data default condong ke satu contoh komoditas (`Organic Coconut Sugar`). | Belum ada **4-Step Guided Onboarding Wizard** interaktif saat user baru masuk (Profil Eksportir & Legalitas → Pilih Preset Multi-Komoditas → Setup Buyer/Katalog Pertama → Simulasi Quote & Dokumen Pertama). |
| **(b) AI Advisor v2 (RAG + Tool Calling + Evals)** | Endpoint `assistant.ask` memakai `gpt-5-mini` dengan JSON snapshot mentah, rate limit in-memory 20/jam, tanpa sitasi dokumen pengetahuan tim, tanpa tool calling deterministik, tanpa redaksi PII/abstention terstruktur. | Membutuhkan **Scoped RAG** berbasis `knowledgeDocuments` + `knowledgeChunks` (hanya status `Published` & belum `expiresAt`), **Deterministic Tool Calling** ke mesin kalkulasi (`shared/pricing.ts`, `shared/container.ts`, `shared/risk.ts`), **PII Redaction & Abstention Gate**, pencatatan ke `aiInteractionLogs` & `aiFeedback`, serta **100-Case Evaluation Suite**. |
| **(c) Document Engine v2 & Master Data CRUD** | Preview HTML/Print browser (PI, SC, CI, PL, SI, Draft B/L), Word-style ribbon, 11 ukuran kertas, 3-way validation di UI. | Membutuhkan **Master Data CRUD Server-Side** (`masterBuyers`, `masterProducts`), **Server-Side Approval & Segregation of Duties (SoD)** (`shipmentApprovals` dengan pencegahan self-approval & auto-invalidation saat nilai offer/incoterm/margin berubah), **Immutable Document Snapshots** (`documentSnapshots` dengan hash SHA-256), serta **Server-Side PDF Generation**. |
| **(d) UI/UX Non-Generik** | Shell 18 layar Clean v2.0 sudah berfungsi dan terhubung ke state transaksi aktif. | Perlu penyempurnaan visual menuju **Trade Command Center** non-generik: hierarki tipografi editorial/monospaced numerik tabular (`font-variant-numeric: tabular-nums`), progressive disclosure agar form tidak membanjiri layar, empty/conflict/loading states kontekstual, dan navigasi alur berurutan yang bebas kebingungan bagi pengguna baru. |

---

## 2. Deterministic Backlog Prioritization (`prioritize_backlog.py`)

Hasil eksekusi deterministik menggunakan `prioritize_backlog.py` pada [initiatives-v2.json](./initiatives-v2.json):

### Ranking Berdasarkan RICE (Product Reach & Impact Efficiency)

| Rank | Initiative | RICE | WSJF | Effort (PM) | Conf. | Quadrant | Discovery / Risk Flags |
| :---: | :--- | ---: | ---: | ---: | ---: | :--- | :--- |
| **1** | **A1.** Guided Onboarding 4-Langkah & Preset Multi-Komoditas (Pertanian, Perikanan, Manufaktur, Kerajinan) | **1012.50** | 8.00 | 1.0 | 90% | Quick Win | Ready for spec |
| **2** | **C1.** Master Data CRUD Server-Side (`masterBuyers`, `masterProducts`, `workspaceInvitations`) + RLS | **791.67** | **8.67** | 1.2 | 95% | Quick Win | Ready for spec |
| **3** | **D1.** UI/UX Non-Generik (Trade Command Center Aesthetic, High-Density Data Tables & Guided Empty/Error States) | **675.00** | 6.67 | 1.2 | 90% | Quick Win | Ready for spec |
| **4** | **C2.** Document Engine v2 (Immutable Snapshots SHA-256, 3-Way Match Gate, Server-Side PDF & Approval SoD) | **646.00** | 5.60 | 1.5 | 85% | Quick Win | Ready for spec |
| **5** | **B1.** AI Advisor v2 Core (Scoped RAG `knowledgeChunks`, Deterministic Pricing/Container/Risk Tool Calling & Citations) | **466.67** | 4.80 | 1.5 | 80% | Quick Win | Ready for spec |
| **6** | **B2.** AI Advisor v2 Governance (PII Redaction, Abstention Gate, `aiInteractionLogs`/`aiFeedback` & 100-Case Eval Suite) | **457.69** | 5.75 | 1.3 | 85% | Quick Win | Ready for spec |

### Ranking Berdasarkan WSJF (Cost of Delay / Engineering Sequencing)

1. **C1 — Master Data CRUD Server-Side + RLS** (`WSJF: 8.67`): Fondasi data utama lintas transaksi; membuka jalan bagi onboarding dan dokumen.
2. **A1 — Guided Onboarding 4-Langkah & Multi-Komoditas** (`WSJF: 8.00`): Mengeliminasi drop-off pengguna baru pada menit pertama.
3. **D1 — UI/UX Non-Generik** (`WSJF: 6.67`): Memperkuat kualitas interaksi di seluruh layar utama.
4. **B2 — AI Advisor v2 Governance & Telemetry** (`WSJF: 5.75`): Mengamankan kepatuhan, redaksi PII, dan logging sebelum fitur RAG dibuka penuh.
5. **C2 — Document Engine v2 & Approval SoD** (`WSJF: 5.60`): Mengunci integritas dokumen ekspor dan persetujuan server-side.
6. **B1 — AI Advisor v2 Core (RAG + Tool Calling)** (`WSJF: 4.80`): Memanfaatkan fondasi knowledge chunks dan telemetry yang sudah siap.

---

## 3. Matriks 4 Fokus Utama: Target Outcomes, Explicit Non-Goals & Guardrail Metrics

> [!IMPORTANT]
> Setiap fokus utama memiliki **Explicit Non-Goals** untuk mencegah scope creep dan **Guardrail Metrics** dengan ambang batas rollback agar optimasi fitur lokal tidak merusak keandalan sistem, kepatuhan hukum, atau unit economics.

### Fokus (a): Guided Onboarding & Multi-Komoditas

- **Target Outcome & Primary Metric:**
  - **Time-to-First-Valid-Quote (TTFV):** `<= 5 menit` (p75) bagi pengguna baru dari Landing/Demo hingga menghasilkan kalkulasi Incoterm dan preview Proforma Invoice pertama.
  - **Onboarding 4-Step Completion Rate:** `>= 75%` pengguna baru menyelesaikan 4 langkah (1. Profil & Legalitas Eksportir → 2. Pilih Preset Komoditas [Pertanian/Kopi/Rempah, Perikanan/Seafood, Manufaktur/Makanan Olahan, Kerajinan/Furnitur] → 3. Buyer & Produk Pertama → 4. Kalkulasi & Preview Dokumen).
- **Guardrail Metrics (Counter-Metrics & Thresholds):**
  - **Dummy Data Pollution Rate:** `0%` data sampel/preset bocor ke laporan keuangan atau disalahartikan sebagai transaksi riil yang sudah disetujui (`isDemoPreset` / badge status `Draft Simulasi` wajib eksplisit).
  - **Step Validation Error Loop:** `< 5%` sesi onboarding mengalami kegagalan validasi berulang (`> 2x` error berturut-turut pada langkah yang sama).
- **Explicit Non-Goals (Out of Scope v2.0):**
  - **Bukan** verifikasi KYC/KYB otomatis real-time ke API AHU/DJP/OSS pemerintah (validasi format NIK/NPWP/NIB dilakukan secara struktural; verifikasi dokumen legal tetap manual/asinkron).
  - **Bukan** katalog HS Code global 10.000+ baris yang di-scrape langsung dari INSW secara live tanpa kurasi; sistem menyediakan preset multi-komoditas terkurasi + input HS Code 6–8 digit fleksibel.

### Fokus (b): AI Advisor v2 (RAG + Tool Calling + Evals)

- **Target Outcome & Primary Metric:**
  - **Grounded Citation Rate:** `>= 90%` jawaban berbasis SOP/regulasi workspace menyertakan sitasi eksplisit (`[Doc: <title> v<version>, Chunk #n]`) dari `knowledgeDocuments` yang berstatus `Published` dan belum kedaluwarsa.
  - **Deterministic Calculation Accuracy:** `100%` pertanyaan kalkulasi harga Incoterm, utilisasi kontainer, dan skor risiko dieksekusi melalui **Tool Calling deterministik** (`calculatePricingTool`, `calculateContainerTool`, `evaluateRiskTool`), bukan aritmetika bebas LLM.
  - **Eval Suite Pass Rate:** `>= 95%` lulus pada **100-Case Evaluation Suite** (mencakup perhitungan Incoterm, 3-way match, abstention hukum/pabean, prompt injection resistance, dan multi-komoditas).
- **Guardrail Metrics (Counter-Metrics & Thresholds):**
  - **Hallucination / Unverified Legal Claim Rate:** `0%` klaim bahwa output AI merupakan "persetujuan resmi Bea Cukai/PEB", "jaminan buyer asli", atau "nasihat hukum mengikat". Jika terdeteksi pada eval suite, build ditolak.
  - **P95 AI Advisor Latency:** `<= 4.5 detik` untuk respons non-streaming / tool-assisted, dengan hard timeout `12 detik` dan fallback deterministik berbasis aturan (`getScreenAdvisorInsight`).
  - **LLM Cost & Quota Guardrail:** Maksimal `20 pertanyaan/jam/user` dan rata-rata `<= 2.200 total tokens/interaksi`; seluruh pemakaian token dan estimasi biaya wajib tercatat di `aiInteractionLogs`.
  - **PII / Secret Leakage Rate:** `0%` nomor rekening penuh, NIK mentah, atau password hash dikirim ke payload prompt LLM eksternal (wajib melewati `redactSensitivePayload` sebelum `invokeLLM`).
- **Explicit Non-Goals (Out of Scope v2.0):**
  - **Bukan** autonomous agent yang mengeksekusi mutasi destruktif atau menyetujui kontrak (`shipmentApprovals`) tanpa klik konfirmasi eksplisit dari manusia.
  - **Bukan** fine-tuning model LLM khusus atau penggunaan infrastruktur vector database eksternal berbayar terpisah (seperti Pinecone/Weaviate dedicated cluster); pencarian RAG v2 menggunakan PostgreSQL/Supabase (`knowledgeChunks` dengan hybrid keyword/tsvector + cosine similarity / JSON embedding ringan di dalam Postgres yang sama).

### Fokus (c): Document Engine v2 & Master Data CRUD

- **Target Outcome & Primary Metric:**
  - **3-Way Consistency Pass Rate:** `100%` dokumen yang di-lock ke `documentSnapshots` telah lulus pemeriksaan konsistensi 3-way (Commercial Invoice vs Packing List vs Draft B/L: kesamaan Buyer, HS Code, Quantity, Net/Gross Weight) atau mencatat alasan override eksplisit di audit log.
  - **Immutable Snapshot Integrity:** Setiap revisi dokumen resmi yang diterbitkan menyimpan `payloadJson`, `contentHashSha256`, `paperSize`, `orientation`, dan `pdfStorageKey` di tabel `documentSnapshots` yang bersifat append-only (tidak dapat di-update/ditimpa).
  - **Approval Segregation of Duties (SoD):** `100%` persetujuan transaksi pada workspace multi-anggota mencegah self-approval (`requesterUserId != reviewerUserId`, kecuali workspace single-owner dengan flag deklarasi eksplisit) dan otomatis berubah ke `Perlu review ulang` bila nilai penawaran (`offer`), `incoterm`, atau `margin` berubah setelah disetujui.
- **Guardrail Metrics (Counter-Metrics & Thresholds):**
  - **Server-Side PDF Generation Latency:** `<= 3.0 detik` (p95) per dokumen standar (1–5 halaman), dengan ukuran file PDF `<= 2.5 MB`.
  - **Optimistic Lock Conflict Data Loss:** `0%` silent overwrite; konflik versi (`version` mismatch) wajib mengembalikan HTTP 409 / tRPC `CONFLICT` dengan opsi resolusi jelas di UI.
- **Explicit Non-Goals (Out of Scope v2.0):**
  - **Bukan** penerbitan Bill of Lading (B/L) asli yang mengikat maskapai pelayaran (semua B/L dari EksporFlow wajib berlabel `DRAFT / SHIPPING INSTRUCTION REFERENCE — NOT CARRIER ISSUED`).
  - **Bukan** pengajuan PEB / COO langsung ke portal CEISA 4.0 Bea Cukai atau e-SKA Kemendag (fokus pada kesiapan dokumen komersial & paket data pra-pengajuan yang akurat).

### Fokus (d): UI/UX Non-Generik

- **Target Outcome & Primary Metric:**
  - **Task Completion Without Navigation Backtracking:** `>= 85%` pengguna menyelesaikan alur `Transaksi -> Kalkulator -> Dokumen -> Screening -> Approval -> Arsip` tanpa tersesat atau kehilangan konteks transaksi aktif.
  - **Visual & Accessibility Compliance:** Rasio kontras teks `>= 4.5:1` (WCAG AA), angka finansial/dimensi menggunakan `tabular-nums`, dan setiap status memiliki ikon + label teks eksplisit (tidak pernah mengandalkan warna saja).
- **Guardrail Metrics (Counter-Metrics & Thresholds):**
  - **Client Bundle & Render Performance:** First Contentful Paint (FCP) `< 1.5 detik`, interaksi tab switching `< 100 ms`, dan modul 3D Three.js dimuat secara terisolasi tanpa memblokir thread kalkulator/dokumen.
- **Explicit Non-Goals (Out of Scope v2.0):**
  - **Bukan** aplikasi mobile native (iOS/Android) atau desain konsumen kasual penuh animasi dekoratif; EksporFlow adalah **Desktop-First B2B Trade Command Center** yang tetap responsif pada tablet/layar sempit untuk inspeksi lapangan/gudang.
  - **Bukan** dark-mode neon/cyberpunk; palet menggunakan estetika editorial korporat perdagangan internasional (Deep Maritime Navy, Warm Paper/Ivory, Crisp Slate Border, Semantic Emerald/Amber/Crimson).

---

## 4. Edge-Case & State Acceptance Criteria (Wajib di Seluruh Modul v2)

| State | Perilaku Sistem yang Diwajibkan (Acceptance Criteria) |
| :--- | :--- |
| **Empty State** | Saat `masterBuyers`, `masterProducts`, `knowledgeDocuments`, atau `documentSnapshots` masih kosong, tampilkan kartu panduan kontekstual dengan CTA spesifik (mis. *"Tambah Buyer Pertama"* atau *"Gunakan Preset Komoditas"*), bukan tabel kosong tanpa penjelasan. |
| **Error / Validation State** | Jika margin `>= 100%` atau `< 0%`, kurs `<= 0`, quantity `<= 0`, atau named place kosong, tampilkan pesan error spesifik per field dan nonaktifkan tombol *"Kunci Penawaran / Terbitkan Snapshot Dokumen"*. |
| **Permission-Denied State (RBAC & SoD)** | Role `viewer` hanya dapat membaca; tombol simpan/hapus/approve dinonaktifkan dengan tooltip *"Membutuhkan hak akses Editor/Admin"*. Approver tidak dapat menyetujui pengajuan miliknya sendiri pada mode SoD aktif. |
| **Partial-Failure / Degraded State** | Jika layanan LLM atau kurs valas live lambat/gagal, UI tetap berfungsi penuh menggunakan fallback kurs referensi terakhir (dengan timestamp sumber) dan insight deterministik tanpa crash halaman. |
| **Concurrency / Offline Draft State** | Saat sesi belum login atau offline, banner status menampilkan `"Draft lokal browser"` secara jujur; saat login dan tersimpan ke Postgres, tampilkan `"Tersimpan di Cloud · v{version}"`; saat terjadi konflik `version`, tampilkan banner `"Konflik versi terdeteksi — Muat ulang data terbaru"`. |
