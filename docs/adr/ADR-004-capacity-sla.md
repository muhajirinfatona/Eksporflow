# ADR-004: Kapasitas, Storage & SLA (hasil `capacity_estimator.py`)

- **Status:** Proposed | **Tanggal:** 2026-11-22
- Input: [workload-y1.json](./workload-y1.json), [workload-y3.json](./workload-y3.json). Semua angka input adalah **asumsi** `[Assumed — validasi via metrik produksi]`: 120 request/user/hari, peak ×6, request 6 KB / respons 40 KB, 15% request menulis, 12 KB/tulis, replikasi ×2, overhead index ×1.4, retensi 5 tahun, SLA 99.9%.

| Metrik | Tahun 1 (1.500 DAU) | Tahun 3 (10.000 DAU) |
| :--- | ---: | ---: |
| Request/hari | 180.000 | 1.200.000 |
| Avg / Peak RPS | 2.08 / 12.5 | 13.89 / 83.33 |
| Peak egress | 4.1 Mbps | 27.3 Mbps |
| Egress/bulan | ≈ 206 GB | ≈ 1.373 GB |
| Storage DB/tahun (provisioned) | ≈ 316 GB | ≈ 2.105 GB |
| Storage DB horizon 5 th | ≈ 1.579 GB | ≈ 10.526 GB |
| SLA 99.9% | 43.2 mnt/bln, 525.6 mnt/thn | sama |

## Pembacaan
- RPS rendah → satu–dua instance Node cukup (mendukung ADR-001 Opsi A); bottleneck realistis adalah koneksi DB (gunakan pooler, `max` kecil per instance) dan PDF/LLM, bukan RPS.
- Storage DB **dibesar-besarkan** karena model menganggap tiap tulis menyimpan 12 KB di Postgres; PDF/lampiran masuk object storage (bukan DB), dan `shipments.snapshotJson` diupdate in-place. Ukur nyata setelah 1 bulan produksi; hitung ulang.
- Estimator tidak memodelkan LLM: lihat tabel kuota token di ADR-002. Estimator juga tidak memodelkan PDF: target p95 ≤ 3 s (NFR-003), ukuran ≤ 2.5 MB/PDF → 1.000 PDF/hari ≈ ≤ 2.5 GB/hari object storage (batas atas) `[Assumed]`.
- Error budget 43.2 mnt/bln: satu migrasi/deploy bermasalah dapat menghabiskannya → migrasi aditif + lock timeout + rollback plan; PITR/backup Supabase harus diverifikasi (restore drill) sebelum produksi `[Confirm: plan Supabase]`.
- Tinjau ulang bila peak RPS aktual > 150 atau DB > 70% kapasitas plan.
