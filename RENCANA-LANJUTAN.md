# Rencana Lanjutan — `web-topup-monorepo` (cetakan)

Handover singkat. Status lengkap ada di [`docs/08-rencana-kerja.md`](docs/08-rencana-kerja.md).

## Posisi sekarang

- Branch kerja: **`development`** (sudah dipush ke `origin`). **`main` belum disentuh.**
- Working tree **bersih**. Hardening deploy + trusted proxy (`64333067`), deploy API sebagai source (`520126e9`, `645c8aeb`, `81ac794e`, `8af30807`) sudah di-commit.
- CI GitHub hijau di `development`: API test + Pint, admin, storefront, payment.
- API lokal: 1319 lulus, 1 skipped, 0 gagal. `pint --test` bersih.

## Sudah selesai (sudah di branch `development`)

- Cetakan disamakan dengan isgstore per 23 Sep, merek klien dinetralkan.
- Colokan: supplier, payment gateway, tiga kanal notifikasi refund/receipt.
- Versi & penjaga deploy: `GET /v1/version`, stempel env, perintah `hub:ping`.
- Pipeline rilis: deploy produksi pakai tag, rollback via tag lama, staging dari `main` + tag rc.
- Dokumentasi: zona, colokan, rilis, dan docs HTML interaktif.
- Higiene: hapus workflow mati, bersihkan `.pyc`, perbaiki nama env di docs.

## Sudah di-commit, menunggu diuji di staging

Sudah mendarat di `development` (`64333067`, lalu `520126e9`), lolos test dan Pint lokal. Yang belum adalah pengujiannya di staging:

1. **Hardening deploy**
   - `deploy-prod.yml` hanya jalan dari tag rilis `vX.Y.Z`, tolak tag rc di beberapa lapisan.
   - `deploy-staging.yml` juga menerima tag rc.
   - Pin SSH host key server lewat secret `SSH_HOST_KEY`.
   - Cek `APP_DEBUG` mati sebelum deploy produksi.
   - `permissions: contents: read` di CI dan deploy.
2. **Trusted proxies**
   - Env baru `TRUSTED_PROXIES` supaya IP asli situs tidak tertutup saat ada proxy/nginx.
3. **Efisiensi deploy API**
   - Klon API jadi **sparse** + partial clone: server hanya menerima `apps/api`, bukan seluruh monorepo.
   - Klon lama dipersempit di tempat (tanpa re-clone, jadi `storage` dan `vendor` aman). Butuh git >= 2.25 di server.
   - **Digantikan** oleh model source + dependensi di server (butir 4): klon sparse tidak lagi menjadi apa yang dilayani.

4. **Deploy API sebagai source, dependensi di server** (`520126e9`, `645c8aeb`, `81ac794e`, `8af30807`)
   - CI meng-`rsync` **source** ke `<base>/api`, sehingga nginx root jadi **`<base>/api/public`** tanpa tingkat `apps/api`.
   - `.env`, `vendor`, `storage/app`, `storage/framework`, `storage/logs`, `bootstrap/cache`, `public/storage` di-exclude karena hanya ada di server.
   - **`vendor` (311 MB / 46.321 berkas) tidak pernah dikirim**: `composer install --no-dev` jalan di server dari `composer.lock`. Server perlu `composer` + akses packagist. Exclude `/vendor/` wajib, kalau tidak `--delete` menghapusnya.
   - `<base>/.api-repo` menyimpan klon git untuk riwayat; best-effort, tidak menahan deploy.
   - Butuh migrasi server sekali (docs/04 §Migrasi): selamatkan `storage/app`, lalu buang pohon lama.

## Langkah lanjutan (urut)

1. **Commit perubahan model deploy API** (workflow + docs), lalu **migrasi server staging sekali** — selamatkan `storage/app` di `<base>/api/apps/api`, buang pohon lama, arahkan root nginx ke `<base>/api/public` (docs/04 §Migrasi). Pastikan `composer` ada di server.
2. **Uji hardening + deploy API di staging** — staging belum pernah berjalan; environment dan servernya belum ada (lihat Peringatan).
3. **Alat distribusi antar fork** — skrip `upstream-sync.sh` dan aturan folder klien vs folder inti.
4. **Keputusan runtime config frontend** — `VITE_*` dipanggang saat build; pilih: terima rebuild per environment, atau pindah ke `config.json` runtime.
5. **Keputusan rilis otomatis** — pakai semantic-release atau tetap manual.
6. Verifikasi visual `docs/interaktif.html`.

## Peringatan

- Jangan merge `development` ke `main` sebelum keputusan adopsi diambil dan staging hidup.
- Jangan aktifkan model tag di produksi sebelum staging berdiri.
- `deploy-staging.yml` belum pernah berjalan — environment staging dan servernya belum ada.

Kalau `docs/*.md` berubah, jalankan ulang `python3 docs/build-interaktif.py`.
