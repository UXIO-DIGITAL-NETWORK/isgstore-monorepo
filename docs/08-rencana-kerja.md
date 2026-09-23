# 08 — Rencana Kerja & Status

Dokumen ini **status pekerjaan**, bukan deskripsi kode. Aturan yang mengikat ada di [07 — Zona](07-zona-dapur.md); cara menaikkan ke server ada di [04 — Deployment](04-deployment.md).

## Tujuan

Banyak situs akan lahir dari cetakan ini (`web-topup-monorepo`), masing-masing berbeda di UI, alur, provider top-up, dan payment gateway — sementara **dapur** (engine transaksi + cara lapor ke Hub) tetap sama. Supaya perbedaan itu tidak merusak dapur, dan supaya perbaikan dapur cukup dikerjakan sekali, semua perbedaan dipindah ke **colokan** (adapter + satu baris config).

## Keputusan yang mengikat

- **Satu induk**: `web-topup-monorepo` = cetakan (semua perbaikan dapur lahir di sini); `isgstore-monorepo` = klien pertama. Jangan ada dua induk.
- **Rilis adalah tag** (`vMAJOR.MINOR.PATCH`). `push` ke `main` tidak mendeploy produksi.
- **Staging terpisah penuh**: DB, direktori, kunci, domain, cron, worker sendiri; `HUB_BASE_URL` menunjuk Hub **staging**.
- **Dapur jangan difork.** Provider/gateway/notifikasi lewat colokan; jangan menanam percabangan vendor di engine.

## Status: selesai (lokal, belum dipush)

| Area | Isi | Commit |
|---|---|---|
| Rekonsiliasi | Cetakan digabung isgstore per 23 Sep; merek klien dinetralkan | `40be523e` |
| Versi & penjaga | `GET /v1/version`, stempel `APP_VERSION`/`APP_COMMIT`/`APP_UPSTREAM`, `VITE_APP_VERSION`, perintah `hub:ping` | `3a3168a7` |
| Pipeline rilis | `deploy-prod.yml` dipicu tag, deploy 4 app, gerbang `hub:ping`, rollback via `ref`, `environment: production` | `5904f858` |
| Staging | `deploy-staging.yml` (kembaran prod) + bagian Staging di docs/04 | `1b2d2dbf`, `d9b60aa2` |
| Colokan supplier | `SupplierGateway` + `SupplierManager` + migrasi 13 titik | `3397cb66` |
| Colokan gateway | `PaymentGateway` + `PaymentManager` + `AdapterResolver`, migrasi 15 titik | `dbbfeb8f` |
| Kanal receipt | `ReceiptChannel` + `config/notifications.php`, kanal email & WhatsApp | `e0bdd721` |

## Terverifikasi di mesin pengembang

- **Seluruh suite API hijau**: `php artisan test` → **1317 lulus, 1 skipped, 0 gagal** (4.332 assertion), setelah `pdo_sqlite` dipasang. Ini yang menutupi ketiga refactor jalur uang.
- **`pint --test` bersih** untuk 1.141 berkas.
- `php -l` semua berkas yang diubah.
- **Resolusi container**: `SupplierGateway` → `UxiolabsService`, `PaymentGateway` → `MonetapayService`; kanal receipt resolve.
- **Workflow**: YAML valid, dan skrip SSH di dalamnya lolos `bash -n`.

Dua temuan yang muncul saat verifikasi dan sudah dibereskan:

- Mock `MonetapayService` di `IntegrationChannelTest` harus menjawab `balanceCacheKey()`, karena cache-busting kini panggilan **instance** lewat kontrak (dulu statis, jadi Mockery tidak mencegatnya).
- **Tiga berkas gagal Pint** — `GoogleLoginAction`, `ReverseMerchantSettlementAction`, `MarketingController`. Ini **drift bawaan, juga ada di `isgstore-monorepo`**, jadi CI isgstore kemungkinan sedang merah pada langkah `pint --test`. Sudah dirapikan di cetakan.

## Belum terverifikasi

- **Frontend** (tsc / lint / test) — `node_modules` belum dipasang di mesin ini.
- **Workflow GitHub** itu sendiri — butuh runner; jalankan lewat PR.

Test yang paling relevan dengan pekerjaan ini: `tests/Feature/Uxiolabs/*`, `TransactionReceiptTest`, `WhatsAppReceiptTest`, `Checkout/*`, `PaymentPage/*`, `Hub/*`, `Monetapay*`, `SiteAvailabilityTest`.

## Cara menguji

```bash
# API (lokal, sekali pasang driver sqlite)
sudo apt-get install -y php8.4-sqlite3
cd apps/api && composer install && php artisan test && ./vendor/bin/pint --test

# Frontend (per app)
cd apps/<admin|storefront|payment> && npm ci && npx tsc -b --noEmit && npm run lint && npm run test

# Yang menentukan: buka PR (bukan push ke main) supaya workflow CI jalan.
```

## Cara menambah colokan (untuk developer situs)

**Supplier baru**
1. Buat kelas adapter yang `implements App\Contracts\SupplierGateway`.
2. Daftarkan di `config/services.php` → `supplier.adapters` (`'nama' => Kelas::class`).
3. Set `SUPPLIER_DRIVER=nama` di `.env`. Engine tidak disentuh.

**Payment gateway baru** — sama, dengan `PaymentGateway`, `payment.adapters`, dan `PAYMENT_DRIVER`.

**Kanal notifikasi baru** — buat kelas `implements App\Contracts\ReceiptChannel`, daftarkan di `config/notifications.php` → `notifications.receipt`. `SendTransactionReceiptAction` tidak disentuh.

## Belum dikerjakan

- **Server**: mendirikan Hub staging + situs staging, mengisi secret environment `staging` — langkah lengkapnya di [04 — Deployment §Staging](04-deployment.md).
- **Repo Hub**: `deploy-staging.yml` untuk `uxiotopup-hub` dan `uxiotopup-hub-api`.
- **Kanal untuk alur refund** (klaim & selesai) — saat ini masih memanggil email/WhatsApp langsung.
- **Aktivitas Discord** — masih dipanggil langsung dari observer/action, belum lewat pendengar.

## Peringatan saat mengadopsi

- **Jangan aktifkan model tag di produksi sebelum staging hidup.** Begitu `deploy-prod.yml` bergantung pada tag, `push` ke `main` tidak lagi mendeploy produksi.
- **Jangan push ke `main` sebelum CI hijau.** Sisi API sudah terverifikasi lokal (1.317 lulus, Pint bersih); yang belum: frontend (tsc/lint/test) dan workflow CI itu sendiri.
- Jalankan CI lewat PR dulu; merge ke `main` belakangan.

## Berkas yang perlu dibaca dulu

1. [07 — Zona](07-zona-dapur.md) — aturan dapur/colokan/pendengar/hiasan.
2. [04 — Deployment](04-deployment.md) — rilis, rollback, penyiapan staging.
3. `CLAUDE.md` di akar dan di `apps/*` — konvensi yang mengikat per aplikasi.
