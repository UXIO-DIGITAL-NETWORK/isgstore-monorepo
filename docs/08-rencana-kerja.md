# 08 — Rencana Kerja & Status

Dokumen ini **status pekerjaan**, bukan deskripsi kode. Aturan yang mengikat ada di [07 — Zona](07-zona-dapur.md); cara menaikkan ke server ada di [04 — Deployment](04-deployment.md).

Semua pekerjaan ada di branch **`development`** (sudah dipush). `main` **belum disentuh**.

## Tujuan

Banyak situs akan lahir dari cetakan ini (`web-topup-monorepo`), masing-masing berbeda di UI, alur, provider top-up, payment gateway, dan kanal notifikasi — sementara **dapur** (engine transaksi + cara lapor ke Hub) tetap sama. Supaya perbedaan itu tidak merusak dapur, dan supaya perbaikan dapur cukup dikerjakan sekali, semua perbedaan dipindah ke **colokan** (adapter + satu baris config).

## Keputusan yang mengikat

- **Satu induk**: `web-topup-monorepo` = cetakan (semua perbaikan dapur lahir di sini); `isgstore-monorepo` = klien pertama. Jangan ada dua induk.
- **Rilis adalah tag** (`vMAJOR.MINOR.PATCH`). `push` ke `main` tidak mendeploy produksi.
- **Staging terpisah penuh**: DB, direktori, kunci, domain, cron, worker sendiri; `HUB_BASE_URL` menunjuk Hub **staging**.
- **Dapur jangan difork.** Provider/gateway/notifikasi pelanggan lewat colokan; jangan menanam percabangan vendor di engine.
- **Notifikasi internal kita bukan colokan.** Discord adalah kanal operasional Uxio, bukan sesuatu yang diganti per situs — jadi sengaja **tidak** dijadikan pendengar yang bisa ditukar.

## Status: selesai (di branch `development`)

| Area | Isi | Commit |
|---|---|---|
| Rekonsiliasi | Cetakan digabung isgstore per 23 Sep; merek klien dinetralkan | `40be523e` |
| Versi & penjaga | `GET /v1/version`, stempel `APP_VERSION`/`APP_COMMIT`/`APP_UPSTREAM`, `VITE_APP_VERSION`, perintah `hub:ping` | `3a3168a7` |
| Pipeline rilis | `deploy-prod.yml` dipicu tag, deploy 4 app, gerbang `hub:ping`, rollback via `ref`, `environment: production` | `5904f858` |
| Staging | `deploy-staging.yml` (kembaran prod) + runbook di docs/04 | `1b2d2dbf`, `d9b60aa2` |
| Colokan supplier | `SupplierGateway` + `SupplierManager` + migrasi 13 titik | `3397cb66` |
| Colokan gateway | `PaymentGateway` + `PaymentManager` + `AdapterResolver`, migrasi 15 titik | `dbbfeb8f` |
| Kanal receipt | `ReceiptChannel` + daftar `notifications.receipt` | `e0bdd721` |
| Kanal refund | `RefundClaimChannel` + `RefundCompletedChannel` + dua daftarnya | `10de41da` |
| Dokumentasi konsep | Zona, stempel, colokan disebar ke README/02/04/06/07 dan `apps/api/CLAUDE.md`; docs HTML interaktif | `6bd17ed0`, `972286c9` |
| Higiene | 7 workflow mati dihapus, 9 `.pyc` dilepas + diabaikan, nama env supplier di docs/04 diperbaiki | `a714c309` |
| Efisiensi deploy | Klon API **sparse** + partial clone — server hanya menerima `apps/api`, bukan seluruh monorepo; plus trusted proxy & penjaga rilis | `64333067` |
| Deploy API source | API di-`rsync` sebagai source ke `<base>/api` (akar Laravel langsung, nginx root `<base>/api/public`); dependensi dipasang di server; klon `.api-repo` hanya riwayat | `520126e9`, `645c8aeb` |
| Vendor di server | `vendor/` (311 MB / 46.321 berkas) tidak pernah dikirim — `composer install --no-dev` jalan di server dari `composer.lock`; exclude `/vendor/` wajib supaya `--delete` tidak menghapusnya. Menggantikan pendekatan penanda hash | `81ac794e`, `8af30807` |

## Terverifikasi

- **CI GitHub hijau** pada branch `development`: keempat job lulus — `API — test + Pint`, `admin`, `storefront`, `payment` (lint + typecheck + test). Ini menutupi sisi frontend, yang tidak bisa dijalankan di mesin pengembang.
- **Suite API lokal**: `php artisan test` → **1319 lulus, 1 skipped, 0 gagal**; **`pint --test` bersih** untuk 1.148 berkas.
- **Resolusi container**: `SupplierGateway` → `UxiolabsService`, `PaymentGateway` → `MonetapayService`, enam kanal notifikasi resolve.
- **Workflow**: YAML valid, skrip SSH lolos `bash -n`; `docs/interaktif.html` struktur tag seimbang dan JS-nya lolos `node --check`.

Temuan yang muncul saat verifikasi dan sudah dibereskan:

- Mock `MonetapayService` di `IntegrationChannelTest` harus menjawab `balanceCacheKey()`, karena cache-busting kini panggilan **instance** lewat kontrak (dulu statis, jadi Mockery tidak mencegatnya).
- **Tiga berkas gagal Pint** — `GoogleLoginAction`, `ReverseMerchantSettlementAction`, `MarketingController`. Ini **drift bawaan, juga ada di `isgstore-monorepo`**, jadi CI isgstore kemungkinan sedang merah pada langkah `pint --test`. Dirapikan di cetakan.
- **`docs/04` menyesatkan**: menyuruh `UXIOLABS_*` padahal kode memakai `UXIOTOPUP_*`. Kalau diikuti, setiap pesanan gagal di supplier. Sudah diperbaiki.

## Cara menguji

```bash
# API (lokal, sekali pasang driver sqlite)
sudo apt-get install -y php8.4-sqlite3
cd apps/api && composer install && php artisan test && ./vendor/bin/pint --test

# Frontend (per app)
cd apps/<admin|storefront|payment> && npm ci && npx tsc -b --noEmit && npm run lint && npm run test
```

## Cara menambah colokan (untuk developer situs)

| Yang ditambah | Yang dibuat | Yang didaftarkan |
|---|---|---|
| Supplier top-up | kelas `implements SupplierGateway` | `config/services.php` → `supplier.adapters`, lalu `SUPPLIER_DRIVER=nama` |
| Payment gateway | kelas `implements PaymentGateway` | `config/services.php` → `payment.adapters`, lalu `PAYMENT_DRIVER=nama` |
| Kanal notifikasi | kelas `implements ReceiptChannel` / `RefundClaimChannel` / `RefundCompletedChannel` | `config/notifications.php` → `notifications.receipt` / `refund_claim` / `refund_completed` |

Engine tidak disentuh di ketiga kasus. Driver/kelas yang tidak sesuai kontrak **gagal keras** saat resolusi (`AdapterResolver`), bukan di jalur uang.

## Belum dikerjakan

- **Alat distribusi antar fork** — skrip `upstream-sync` (menarik rilis cetakan ke repo klien), aturan tertulis folder klien vs folder inti, dan checklist rilis cetakan. Ini bagian yang membuat "update mengalir ke banyak situs" jadi rutin, bukan manual.
- **Rilis otomatis dengan semantic-release** — **ditunda dengan sengaja**: menambahkannya berarti menaruh dependensi npm di root template (yang belum punya lockfile) dan workflow yang mulai membuat tag begitu masuk `main`; belum bisa divalidasi di mesin ini. Untuk sekarang rilis cetakan masih manual (merge ke `main`, tag, tulis catatan rilis).
- **Runtime config frontend** — `VITE_*` masih dipanggang saat build, jadi artifact staging dan produksi tidak identik. Keputusannya belum diambil (terima rebuild per environment, atau pindahkan ke `config.json` runtime).
- **Server**: mendirikan Hub staging + situs staging, mengisi secret environment `staging` — langkahnya di [04 — Deployment §Staging](04-deployment.md).
- **Repo Hub**: `deploy-staging.yml` untuk `uxiotopup-hub` dan `uxiotopup-hub-api`.
- **Sisi Hub**: versioning kontrak (header `X-Site-Version`, kolom `contract_version` di `sites`, `HUB_MIN_CONTRACT_VERSION`, contract test, kolom versi di panel).
- **Adopsi ke isgstore**: merge dari `development`, jalankan CI di sana, dan perbaiki drift Pint-nya.

## Peringatan saat mengadopsi

- **Jangan aktifkan model tag di produksi sebelum staging hidup.** Begitu `deploy-prod.yml` bergantung pada tag, `push` ke `main` tidak lagi mendeploy produksi.
- **Jangan merge `development` ke `main` sebelum CI hijau** dan sebelum keputusan adopsi di atas diambil.
- **`isgstore-monorepo` belum menerima apa pun** dari pekerjaan ini; ia masih berjalan seperti sebelumnya.

## Berkas yang perlu dibaca dulu

1. [07 — Zona](07-zona-dapur.md) — aturan dapur/colokan/pendengar/hiasan.
2. [04 — Deployment](04-deployment.md) — rilis, rollback, penyiapan staging.
3. `CLAUDE.md` di akar dan di `apps/*` — konvensi yang mengikat per aplikasi.
