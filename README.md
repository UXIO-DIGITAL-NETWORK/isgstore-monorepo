# Website Topup — Monorepo

Platform top-up game: satu API Laravel dan tiga frontend React, dalam satu repositori.

| Direktori | Aplikasi | Stack |
|---|---|---|
| `apps/api` | API — melayani ketiga frontend | Laravel 13 · PHP 8.4 · MySQL |
| `apps/admin` | Panel admin | React 19 · Vite 7 · Tailwind v4 |
| `apps/storefront` | Etalase pelanggan | React 19 · i18n (id/en) |
| `apps/payment` | Uxiolabs Pay — penagihan & penarikan dana | React 19 |

## Mulai

```bash
# API
cd apps/api
composer install
cp .env.example .env && php artisan key:generate
php artisan migrate --seed
php artisan serve

# Frontend — tiap app punya lockfile sendiri
npm run install:all      # dari akar: npm ci untuk ketiganya
npm run dev:storefront   # atau dev:admin / dev:payment
```

## Perintah dari akar

```bash
npm run build            # build ketiga frontend
npm run test             # test ketiga frontend
npm run lint
npm run test:admin       # satu app saja
```

API punya perintahnya sendiri:

```bash
cd apps/api
composer run test        # 1.016 test
./vendor/bin/pint        # format
```

## Dokumentasi

Baca [`docs/`](docs/) — alur website, arsitektur kode, referensi API, deployment, dan basis data. Mulai dari [`docs/README.md`](docs/README.md).

Tiap app juga membawa `CLAUDE.md`-nya sendiri; `apps/api/CLAUDE.md` adalah dokumen paling rinci di repo ini.

## Cetakan & situs klien

Repo ini adalah **cetakan**: setiap situs klien lahir dari sini, dan setiap perbaikan **dapur** (engine transaksi + integrasi Hub) juga lahir di sini. Yang berbeda antar situs — UI, alur, provider top-up, payment gateway, kanal notifikasi — hidup sebagai **colokan** (kontrak + driver), bukan sebagai cabang kode di dalam engine. Aturannya di [`docs/07-zona-dapur.md`](docs/07-zona-dapur.md); status pekerjaannya di [`docs/08-rencana-kerja.md`](docs/08-rencana-kerja.md).

## Rilis & versi

Rilis adalah **tag** `vX.Y.Z`: `push` ke `main` **tidak** mendeploy produksi (itu jalur staging). Setiap deploy menstempel versi ke `.env`, dan identitasnya bisa dibaca dari `GET /v1/version` serta sidebar admin (`VITE_APP_VERSION`). Rollback = jalankan workflow deploy dengan tag lama. Cara, urutan, dan penyiapan staging ada di [`docs/04-deployment.md`](docs/04-deployment.md).

## Kenapa satu repo

Keempat aplikasi memakai backend yang sama dan mendarat di server yang sama. Dari 46 hari kerja sejak Juli 2026, **33 hari menyentuh lebih dari satu repo** — hanya 13 hari yang benar-benar satu aplikasi saja. Memisahkannya berarti satu perubahan butuh empat PR, empat CI, dan empat deploy yang tidak pernah menguji kontrak di antara mereka.

## Yang tidak ada di sini

Uxio Hub (`uxiotopup-hub`, `uxiotopup-hub-api`) tetap terpisah — beda server, beda siklus rilis, dan mengawasi banyak situs sekaligus. Sisi situs dari integrasinya ada di `apps/api` (`/v1/hub/*`).
