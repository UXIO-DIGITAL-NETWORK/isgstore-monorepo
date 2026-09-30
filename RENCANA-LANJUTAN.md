# Rencana Lanjutan — `isgstore-monorepo` (situs klien, LIVE)

Handover singkat. Aturan sinkronisasi antar-repo ada di
[`docs/09-sync-antar-repo.md`](docs/09-sync-antar-repo.md).

## Posisi sekarang

- Repo ini adalah **turunan cetakan** `web-topup-monorepo`; identitasnya tetap
  **"ISG Store"** (brand, email, seed, kredensial).
- Cabang kerja: branch tugas `mtc-ops-sync-cetakan-30092026` dari `staging`
  (dibuat dari `main`). `main` = produksi; `staging` = calon produksi.
- **Dapur diselaraskan ke cetakan `v1.0.0`** (`.upstream-version`) lewat merge
  3-arah. 56 konflik diselesaikan: berkas dapur hand-merge (logika engine repo ini
  dipertahankan, panggilan diganti ke colokan), brand/seed/kredensial diambil dari
  repo ini.
- Verifikasi lokal hijau: API `1319 passed, 1 skipped` + `pint --test` bersih;
  admin 669 / storefront 121 / payment 263 test lulus; typecheck + lint 0 error.
- **Tidak ada migrasi DB baru** dari cetakan (105 = 105) → merge tidak mengubah skema.

## Model rilis (baru)

- **Produksi = tag `vX.Y.Z`.** `push` ke `main` **tidak** mendeploy apa pun.
- **Staging = tag pra-rilis `vX.Y.Z-rc.N`.** `main` hanya menjalankan CI.
- Rollback = jalankan workflow deploy lewat `workflow_dispatch` dengan `ref` tag lama;
  server checkout ulang tag itu.
- Deploy berbasis **GitHub Environment**: `production` dan `staging`.
  Detail secret ada di [`docs/04-deployment.md`](docs/04-deployment.md) §Secret GitHub.

## Belum selesai / menunggu

1. **Server & environment staging** — isi secret environment `staging`
   (`DEPLOY_BASE_PATH`, `ENV_FILE`, `VITE_*`) dan pastikan `HUB_BASE_URL` menunjuk
   ke **Hub STAGING**, bukan produksi.
2. **Uji deploy pertama di staging** lewat tag rc; pastikan server punya `composer`
   dan `git >= 2.25`.
3. **Promosikan ke produksi** hanya lewat tag rilis; sebelum itu pastikan staging
   sudah terbukti.
4. **Selaraskan `docs/04` & `apps/api/CLAUDE.md`** bila model server di sini berbeda
   dari cetakan (cetakan memakai model API-sebagai-source; repo ini masih meng-clone
   monorepo ke `<base>/api`).

## Peringatan

- **Jangan merge ke `main`** sebelum staging terbukti — produksi ikut naik.
- Merek klien wajib tetap **"ISG Store"** di setiap merge dari cetakan.
- Situs ini **gelap secara default** bila `HUB_MANAGED_LICENCE` aktif dan Hub belum
  menjawab "serving".
- Verifikasi lokal butuh `NODE_ENV=test` (kalau `NODE_ENV=production`, React memakai
  build produksi dan test `.tsx` gagal dengan `React.act is not a function`).
