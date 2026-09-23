# Rencana Lanjutan — `web-topup-monorepo` (cetakan)

Handover untuk dilanjutkan besok. **Status lengkap ada di [`docs/08-rencana-kerja.md`](docs/08-rencana-kerja.md)** — berkas ini hanya pintu masuknya.

## Posisi sekarang

- Semua pekerjaan ada di branch **`development`** (sudah dipush ke `origin`). **`main` belum disentuh.**
- **CI GitHub hijau**: keempat job lulus (`API — test + Pint`, `admin`, `storefront`, `payment`).
- Suite API lokal: 1319 lulus, 1 skipped, 0 gagal. `pint --test` bersih.

## Sudah selesai (jangan dikerjakan ulang)

- Rekonsiliasi: cetakan setara isgstore per 23 Sep, merek klien dinetralkan.
- **Colokan**: supplier (`SupplierGateway`), payment gateway (`PaymentGateway`), dan tiga momen notifikasi (`ReceiptChannel`, `RefundClaimChannel`, `RefundCompletedChannel`) — semuanya kontrak + config, engine tidak disentuh.
- **Versi & gerbang**: `GET /v1/version`, stempel `APP_VERSION`/`APP_COMMIT`/`APP_UPSTREAM`, `VITE_APP_VERSION`, perintah `hub:ping` sebagai gerbang deploy.
- **Rilis = tag**: `deploy-prod.yml` dipicu tag (deploy 4 app, gerbang sebelum migrate, rollback via `ref`) + `deploy-staging.yml`.
- **Dokumentasi**: `docs/07` (zona), `docs/08` (status), bagian Rilis/Staging di `docs/04`, dan `docs/interaktif.html` (HTML mandiri, ada pencarian).
- **Higiene**: 7 workflow mati dihapus, 9 `.pyc` dilepas + diabaikan, nama env supplier di `docs/04` diperbaiki.

## Langkah lanjutan besok (urut)

1. **Alat distribusi antar fork** — ini yang paling menentukan, karena membuat "update mengalir ke banyak situs" jadi rutin:
   - `scripts/upstream-sync.sh`: dari repo klien, ambil rilis cetakan (fetch tag upstream, merge, laporkan konflik).
   - Aturan tertulis **folder klien vs folder inti** (path mana yang boleh disunting fork) — ringkas, tegas, bisa ditegakkan saat review.
   - Checklist **rilis cetakan**: merge ke `main`, tag `vX.Y.Z`, tulis catatan rilis + langkah migrasi (env baru, migration).
2. **Keputusan runtime config frontend**: `VITE_*` masih dipanggang saat build, jadi artifact staging ≠ produksi. Pilih: terima rebuild per environment, atau pindahkan ke `config.json` yang dibaca saat runtime.
3. **Keputusan rilis otomatis**: semantic-release (butuh dependensi npm di root + workflow yang membuat tag) atau tetap manual.
4. Opsional: verifikasi visual `docs/interaktif.html` (perlu memasang browser).

Kalau `docs/*.md` berubah, jalankan ulang `python3 docs/build-interaktif.py`.

## Peringatan

- **Jangan merge `development` ke `main`** sebelum keputusan adopsi diambil dan staging hidup.
- **Jangan aktifkan model tag di produksi** sebelum staging berdiri: begitu `deploy-prod.yml` bergantung pada tag, `push` ke `main` berhenti mendeploy produksi.
- `deploy-staging.yml` belum pernah berjalan — environment `staging` dan servernya belum ada.
