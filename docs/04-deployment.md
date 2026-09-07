# Deployment

## Ringkasan

Keempat aplikasi mendarat di **satu server**, di direktori bersebelahan. Sebelum monorepo, keempatnya di-clone terpisah; sesudahnya, satu repo di-clone dan tiap app hidup di bawah `apps/`.

| App | Cara naik | Tujuan |
|---|---|---|
| API | `git pull` + `composer install` + `migrate` di server | `<repo>/apps/api` |
| Admin | build di CI, `rsync` folder `dist/` | `…/provider/admin` |
| Storefront | idem | `…/provider/fe` |
| Payment | idem | `…/provider/payment` |

Pemicunya `push` ke `main`, dengan **path filter** — mengubah storefront tidak memicu build admin.

---

## Migrasi ke monorepo — yang harus disiapkan di server

Ini **sekali saja**, dan harus dilakukan sebelum deploy pertama dari repo ini.

1. **Clone monorepo** ke `<base>/api` (lihat langkah 6). Deploy juga meng-clone sendiri kalau direktorinya masih kosong.
2. **Arahkan ulang root nginx untuk API** dari `…/provider/api/public` ke `<base>/api/apps/api/public`.
3. **Perbarui path supervisor.** `supervisor/api-prod-worker.conf` menjalankan `php <dir>/artisan queue:work`; `<dir>` harus menunjuk lokasi baru.
4. **Perbarui entri cron** `schedule:run` ke path baru.
5. **Pindahkan berkas yang tidak ikut git**: isi `storage/app/public` (banner, logo kategori, bukti transfer) dan `.env`.
6. **Satukan keempat app di bawah satu induk**, satu subdirektori per app, lalu arahkan ulang `root` tiap vhost ke sana:

   | Direktori | Isi | `root` nginx |
   |---|---|---|
   | `<base>/admin` | isi `dist/` | `<base>/admin` — `admin.<domain>` |
   | `<base>/payment` | isi `dist/` | `<base>/payment` — `pay.<domain>` |
   | `<base>/storefront` | isi `dist/` | `<base>/storefront` — `<domain>`, domain utama |
   | `<base>/api` | **klon monorepo** | `<base>/api/apps/api/public` — `api.<domain>` |

   `api` adalah satu-satunya yang berbeda isinya: Laravel dijalankan dari source, bukan dari hasil build, jadi yang tinggal di sana adalah repo ini seutuhnya — dan `root` nginx-nya menunjuk ke `apps/api/public` **di dalam** direktori itu, bukan ke direktorinya langsung.

   Buat `<base>` dan ketiga direktori frontend lebih dulu (`mkdir -p`) — rsync hanya membuat komponen terakhir, bukan seluruh rantai. `<base>/api` boleh dibiarkan kosong; deploy meng-clone sendiri. Setelah `root` diedit: `nginx -t && systemctl reload nginx`.
7. **Tambahkan satu secret baru** di GitHub: `DEPLOY_BASE_PATH`, berisi `<base>` di atas tanpa nama app. Workflow yang menyusun `<base>/<app>`, jadi nama direktori **wajib** sama persis dengan nama folder di `apps/` — `admin`, `storefront`, `payment`, `api`.
8. **Pindahkan `VITE_GOOGLE_CLIENT_ID` ke secret** — sebelumnya di-hardcode di YAML storefront.
9. **Pasang deploy key di server.** Server meng-clone lewat SSH, jadi user SSH-nya butuh kunci yang terdaftar di repo:

   ```
   ssh-keygen -t ed25519 -C "deploy@<domain>" -f ~/.ssh/id_ed25519 -N ''
   cat ~/.ssh/id_ed25519.pub
   ```

   Tempel isinya ke **Settings → Deploy keys → Add deploy key** di repo (read-only cukup — deploy tidak pernah push). Uji dengan `ssh -T git@github.com`; jawaban "successfully authenticated" berarti beres.

   Host key GitHub tidak perlu disiapkan manual — deploy menuliskannya ke `known_hosts` sendiri.
10. **Pastikan `PasswordAuthentication yes` aktif** di `/etc/ssh/sshd_config`, lalu `sudo systemctl reload ssh`. Deploy memakai autentikasi kata sandi, bukan kunci.

## Secret GitHub

| Secret | Untuk |
|---|---|
| `SSH_HOST`, `SSH_PORT`, `SSH_USERNAME` | Alamat dan pengguna server |
| `SSH_PASSWORD` | Kata sandi SSH |
| `ENV_FILE` | **Seluruh isi `.env` produksi**, bukan satu nilai. Ditulis ulang ke server tiap deploy |
| `DEPLOY_BASE_PATH` | Induk keempat app. Workflow menambahkan `/<app>` sendiri — jangan sertakan nama app |
| `VITE_API_BASE_URL`, `VITE_PUSHER_APP_KEY`, `VITE_PUSHER_APP_CLUSTER` | Build ketiga frontend |
| `VITE_GOOGLE_CLIENT_ID` | Login Google di storefront |
| `DISCORD_WEBHOOK_LOG_URL` | Opsional. Kosong = notifikasi dilewati |

### Catatan tentang autentikasi kata sandi

Deploy memakai kata sandi, bukan kunci privat. Dua akibat yang perlu diketahui:

- **`burnett01/rsync-deployments` tidak bisa dipakai** — action itu hanya menerima kunci. Ketiga frontend memakai `rsync` manual lewat `sshpass`. Kata sandinya diberikan lewat variabel `SSHPASS` dan `sshpass -e`, bukan lewat argumen `-p`, karena argumen baris perintah terbaca di daftar proses runner.
- **Host key server direkam lebih dulu** dengan `ssh-keyscan`, supaya `rsync` tidak perlu dijalankan dengan `StrictHostKeyChecking=no`. Tanpa itu, server palsu yang menyamar di alamat yang sama akan diterima begitu saja.

Kunci privat tetap lebih aman daripada kata sandi untuk deploy otomatis: kunci bisa dibatasi ke satu perintah, tidak bisa dipakai login interaktif, dan dicabut tanpa mengganti kredensial siapa pun. Kalau nanti ingin pindah, yang berubah hanya dua langkah di `deploy-prod.yml`.

Sampai langkah 1–4 selesai, **jangan** jalankan deploy dari repo ini.

---

## Urutan deploy API, dan kenapa tiap langkah ada

```
git pull                    ← gagal di sini membatalkan deploy SEBELUM cache dibuang
tulis .env dari secret
composer install --no-dev
php artisan migrate --force
php artisan pricing:backfill-plan-prices    ← WAJIB, lihat di bawah
php artisan pricing:verify                   ← menggagalkan deploy bila menyimpang
optimize:clear → config:cache → route:cache
storage:link
chown/chmod
reload php-fpm              ← tanpa ini OPcache menyajikan bytecode lama
pasang cron schedule:run    ← deploy GAGAL bila hilang
pasang supervisor + queue:restart
periksa worker RUNNING      ← deploy GAGAL bila tidak
```

**Backfill harga wajib satu langkah dengan migrasi.** Tanpanya `product_plan_prices` kosong, `PlanPrice::for()` jatuh ke `products.price_member`, dan **setiap member dijual di harga tingkat dasar**. Tidak ada error di mana pun — hanya kebocoran pendapatan. Langkah inilah yang **tidak ada** di pipeline lama dan kini ditambahkan.

**Tiga pemeriksaan yang sengaja menggagalkan deploy.** Ketiganya dulu berakhir `|| true`, dan itulah cara sebuah situs bisa berjalan berhari-hari dengan deploy hijau sementara pesanan berbayar tidak pernah diproses:

- Cron `schedule:run` hilang → 13 perintah terjadwal berhenti diam-diam.
- Queue worker tidak `RUNNING` → pembayaran berhasil, job parkir di tabel `jobs`, tidak ada yang error.
- `pricing:verify` menyimpang → harga per paket tidak sinkron.

**Queue worker bukan opsional, dan kegagalannya senyap.** Delapan kelas job bergantung padanya, dan salah satunya menempatkan pesanan pelanggan yang sudah dibayar ke supplier. Supervisor menjalankan **dua** proses: satu tidak cukup, karena order supplier adalah panggilan HTTP keluar yang bisa menahan worker beberapa detik.

---

## Konfigurasi `.env`

Kunci di luar bawaan Laravel, dikelompokkan menurut fungsinya:

**Gateway pembayaran (Monetapay)** — `MONETAPAY_MCH_ID`, `MONETAPAY_COLLECTION_APP_ID`, `MONETAPAY_DISBURSEMENT_APP_ID`, `MONETAPAY_PARTNER_KEY`, `MONETAPAY_TOKEN`, `MONETAPAY_AES_KEY`, `MONETAPAY_AES_IV`, `MONETAPAY_IS_PRODUCTION`, `MONETAPAY_SUCCESS_REDIRECT_URL`, `MONETAPAY_FAILED_REDIRECT_URL`, plus lima varian `MONETAPAY_DISBURSEMENT_*`.

> Tiga identitas yang **jangan dicampur**: `mch_id` adalah identitas merchant, `collection_app_id` untuk jalur pemasukan, `disbursement_app_id` untuk jalur pembayaran keluar. `collection_app_id` **tidak punya nilai cadangan** — kalau tidak diisi, panggilan pemasukan ditandatangani dengan `app_id` kosong.

**Supplier (Uxiolabs)** — `UXIOLABS_API_KEY`, `UXIOLABS_BASE_URL`, `UXIOLABS_CALLBACK_URL`, `UXIOLABS_PRICE_TIER`, `UXIOLABS_CALLBACK_IP`.

> ⚠️ **Kunci-kunci ini dulu bernama `UXIOTOPUP_*` dan sudah diganti nama, tanpa nilai cadangan.** Kalau `.env` produksi masih memakai nama lama, `UXIOLABS_API_KEY` terbaca kosong dan **setiap pesanan gagal di supplier**. Kecuali kuncinya tersimpan lewat halaman Integration di panel admin — kredensial dari basis data menimpa `.env`, dan migrasi `2026_09_04_000001` sudah mengganti nama baris itu. **Periksa yang mana yang berlaku di server Anda sebelum deploy.**

**Penarikan dana** — `WITHDRAWAL_FEE_FLAT` (1500), `WITHDRAWAL_FEE_PERCENT` (11), `WITHDRAWAL_MIN_AMOUNT` (10000), `WITHDRAWAL_HOLD_BUFFER_DAYS` (1).

**Uxio Hub** — `HUB_ENABLED` (default `false` = mandiri, tidak ada yang dijadwalkan), `HUB_SITE_API_KEY`, `HUB_BASE_URL`, `HUB_ALLOWED_IPS`, `HUB_MANAGED_CATALOG`, `HUB_MANAGED_CHANNELS`, `HUB_PUSH_ORDERS`, `HUB_WRITE_ENABLED`, `HUB_WRITE_API_KEY`.

> `HUB_PUSH_ORDERS` **jangan diisi kosong** — nilai kosong terbaca sebagai `false` dan mematikan dorongan pesanan secara diam-diam. Biarkan tidak ada sama sekali agar mengikuti `HUB_ENABLED`.

**Lain-lain** — `PAYMENT_PAGE_URL`, `STOREFRONT_URL`, `STOREFRONT_BRAND`, `STOREFRONT_DEFAULT_COUNTRY_CODE` (62), `SERVICE_INVOICE_DUE_DAYS`, `GOOGLE_CLIENT_ID`, `DISCORD_WEBHOOK_LOG_URL`, `PIWAPI_*` (WhatsApp), `IMAGE_*`, `REFUND_HOLIDAYS`, `CORS_ALLOWED_ORIGINS`.

**Frontend** — hanya empat, semuanya berawalan `VITE_`: `VITE_API_BASE_URL`, `VITE_PUSHER_APP_KEY`, `VITE_PUSHER_APP_CLUSTER`, dan `VITE_GOOGLE_CLIENT_ID` (storefront saja).

> Ketiga app memakai **nama yang sama** untuk `VITE_API_BASE_URL`. Karena itu tiap app menyimpan `.env`-nya sendiri dan Vite selalu dijalankan dengan root app-nya — satu `.env` di akar akan menyuapkan base URL yang sama ke ketiganya.

---

## Perintah terjadwal

Cron memanggil `schedule:run` tiap menit; sisanya diatur di `apps/api/routes/console.php`. Setiap perintah memakai `withoutOverlapping()` dan mengabarkan kegagalannya ke Discord.

| Kadensi | Perintah |
|---|---|
| tiap 5 menit | `payments:sync-expired`, `service-payments:sync-expired`, `withdrawals:sync-processing`, `uxiolabs:sync-processing`, `queue:health`, `uxiolabs:check-prices` |
| tiap 15 menit | `hub:sync-catalog`, `hub:sync-channels` — **hanya bila `HUB_ENABLED`** |
| harian 00:10 | `memberships:renew` |
| harian 00:15 | `memberships:expire` |
| harian 00:20 | `services:expire` |
| harian 01:00 | `monetapay:reconcile-fees` |
| harian 08:00 | `subscriptions:notify-expiring` |

`memberships:renew` sengaja berjalan **sebelum** `memberships:expire`, tapi keduanya **tidak bergantung pada urutan itu**: perpanjangan menulis langganan penerus, sehingga pemeriksaan `$stillCovered` di perintah kedua hanya menutup baris lama. Itu jauh lebih kokoh daripada mengandalkan jeda lima menit.

Perintah manual (tidak terjadwal): `pricing:backfill-plan-prices`, `pricing:verify`, `two-factor:disable {email}`, `uxiolabs:sync-products`, `monetapay:sit`.

---

## Runbook — tiga masalah yang sudah pernah terjadi

### 1. Migrasi berhenti: `errno 1553` di `pricing_rules`

**Gejala:** `Cannot drop index 'pricing_rules_category_id_role_unique': needed in a foreign key constraint`.

**Sebab:** InnoDB menolak menghapus indeks yang masih menopang sebuah foreign key. Sudah diperbaiki — indeks pengganti kini dibuat lebih dulu. Kalau deploy lama sempat berhenti di sini, migrasinya sekarang bisa dijalankan ulang dan akan melanjutkan sendiri dari kondisi setengah jadi.

### 2. Migrasi berhenti: aturan harga bentrok

**Gejala:** `Cannot key pricing rules on membership plan: several roles translated onto the same plan within one category…`

**Sebab:** migrasi hanya membuat paket **Basic**. Role `vip`, `reseller`, `agent` tidak punya paket sendiri, jadi semuanya jatuh ke Basic dan bentrok di indeks unik baru.

**Periksa sebelum deploy:**

```sql
SELECT category_id, COUNT(*) AS aturan, GROUP_CONCAT(role) AS roles
  FROM pricing_rules GROUP BY category_id HAVING COUNT(*) > 1;
SELECT id, name, role_id FROM membership_plans;
```

Kalau kueri pertama ada isinya dan kueri kedua hanya berisi Basic, migrasi **pasti** berhenti. Gabungkan atau hapus aturan yang berlebih, lalu ulangi. Berhentinya disengaja: menghapus aturan harga secara otomatis berarti mengubah harga tanpa sepengetahuan siapa pun.

### 3. Admin terkunci setelah 2FA menyala

**Gejala:** admin yang sudah ada tidak bisa masuk panel.

**Sebab:** disengaja — 2FA wajib untuk role admin. Jalan keluarnya selalu terbuka karena `/2fa/setup` dan `/2fa/confirm` ada di luar grup admin.

**Kalau benar-benar terkunci:** `php artisan two-factor:disable {email}` di server.

> Tidak ada kode pemulihan di rilis ini, dan itu keputusan sadar: tim adminnya kecil dan punya akses shell. Itu berhenti berlaku begitu 2FA diperluas ke `payment-admin` — klien tanpa akses shell — jadi kode pemulihan harus dikirim di rilis **itu**.

> `two_factor_secret` memakai cast `encrypted`. **Memutar `APP_KEY` akan mematikan setiap authenticator yang terdaftar.**

---

## Catatan tentang dependensi

Tiap app menyimpan `package-lock.json` sendiri dan dipasang dengan `npm ci`, bukan lewat npm workspaces yang di-hoist.

Alasannya diuji, bukan diasumsikan: memakai workspaces berarti membuang ketiga lockfile, dan `npm install` segar menaikkan **35 dari 57 dependensi langsung** — axios 1.13→1.20, react-hook-form 7.71→7.87, zod 4.3→4.5, TanStack Router 1.162→1.170. `eslint-plugin-react-hooks` 7.0.1→7.1.1 menyalakan aturan baru dan **mematahkan lint di ketiga app**. Itu upgrade dependensi yang menyamar sebagai migrasi.

Kalau nanti ingin memakai workspaces demi `node_modules` bersama (600 MB alih-alih 1,6 GB), kerjakan sebagai perubahan tersendiri dengan keputusan upgrade yang ditinjau. Nama paket sudah dibedakan (`@uxio/admin`, `@uxio/storefront`, `@uxio/payment`), jadi tidak ada pekerjaan tambahan di sisi itu.
