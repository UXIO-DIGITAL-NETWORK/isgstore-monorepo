# Deployment

## Ringkasan

Keempat aplikasi mendarat di **satu server**, di direktori bersebelahan. Sebelum monorepo, keempatnya di-clone terpisah; sesudahnya, satu repo di-clone dan tiap app hidup di bawah `apps/`.

| App | Cara naik | Tujuan |
|---|---|---|
| API | `git checkout <tag>` + `composer install` + `migrate` di server | `<repo>/apps/api` |
| Admin | build di CI, `rsync` folder `dist/` | `…/provider/admin` |
| Storefront | idem | `…/provider/fe` |
| Payment | idem | `…/provider/payment` |

Pemicunya **push tag `v*`**, dan satu tag mendeploy keempat app sekaligus. Cabang `main` tidak lagi mendeploy produksi — jalur itu disiapkan untuk staging.

---

## Rilis: tag, stempel, rollback

**Sebuah rilis adalah tag.** `deploy-prod.yml` berjalan saat tag `v*` di-push, dan mendeploy keempat app dalam satu jalan. Alasannya bukan gaya: satu nomor versi harus menunjuk satu keadaan kode yang diketahui, supaya pertanyaan "situs ini versi berapa" punya jawaban, dan supaya rilis yang sama bisa dipasang ulang.

- **Nomor** — tag Semver `vMAJOR.MINOR.PATCH`. MAJOR untuk perubahan yang bisa merusak situs lain (skema DB, kontrak Hub), MINOR untuk fitur, PATCH untuk perbaikan.
- **Stempel** — deploy menulis `APP_VERSION` (tag), `APP_COMMIT` (commit hasil checkout), dan `APP_UPSTREAM` (dibaca dari `.upstream-version`, bila ada) ke `.env`, **sesudah** `.env` ditulis dari secret. `GET /v1/version` dan `VITE_APP_VERSION` melaporkan nilai yang sama.
- **Gerbang** — `php artisan hub:ping` dijalankan tepat sebelum `migrate`. Bila `HUB_ENABLED=true` dan Hub tidak terjangkau, deploy berhenti sebelum skema tersentuh. Di deploy standalone (`HUB_ENABLED=false`) perintah ini lulus sendiri.
- **Rollback** — jalankan workflow `Deploy Production` lewat *Run workflow*, isi `ref` dengan tag lama (mis. `v1.3.0`). Server checkout tag itu dan memasangnya kembali.

**Migrasi harus aditif supaya rollback aman.** Rollback kode tidak membalik migrasi: kalau sebuah rilis menghapus kolom, kode lama akan mencarinya dan gagal. Urutannya: tambah kolom → deploy kode baru → backfill → baru hapus kolom di rilis *berikutnya*.

---

## Staging

`deploy-staging.yml` adalah kembaran `deploy-prod.yml`: pemicunya `push` ke `main`, dan `environment: staging` yang menentukan secret mana (host SSH, `DEPLOY_BASE_PATH`, `ENV_FILE`, `VITE_*`) yang dipakai. Langkah-langkahnya sengaja identik dengan produksi — staging yang memakai jalur berbeda tidak membuktikan apa pun tentang produksi.

Staging adalah **deployment terpisah sepenuhnya**: DB, direktori, kunci, domain, cron, dan queue worker sendiri. Berbagi salah satu di antaranya membuat staging berhenti menjadi latihan yang jujur.

| | Produksi | Staging |
|---|---|---|
| API | `api.<domain>` | `api-staging.<domain>` |
| Storefront / Admin / Payment | `<domain>`, `admin.`, `pay.` | `staging.`, `admin-staging.`, `pay-staging.` |
| Database | `uxiotopup` | `uxiotopup_staging` |
| `.env` | environment `production` | environment `staging` |
| Hub | Hub produksi | **Hub staging** |

### Yang harus berdiri lebih dulu: Hub staging

Situs staging butuh Hub staging, jadi Hub didirikan dulu:

1. **Instance Hub terpisah** (direktori, `DEPLOY_PATH`, vhost sendiri) — boleh di VPS yang sama, tapi jangan berbagi DB atau direktori.
2. **DB `uxiotopup_hub_staging`** dari `migrate` + seeder, **bukan salinan data produksi**.
3. **`APP_KEY` sendiri.**
4. Env Hub staging mengikuti `uxiotopup-hub-api/.env.example`, dengan `APP_ENV=staging`, `FRONTEND_URL` = panel staging, `DISCORD_SEND_OUTSIDE_PRODUCTION=false`, dan `MONETAPAY_IS_PRODUCTION=false`.
5. **Daftarkan situs staging sebagai *site* terpisah di Hub staging** (`code` mis. `isgstore-staging`, `base_url` = `https://api-staging.<domain>`, `allowed_ips` = IP server situs staging). Kunci yang diterbitkan Hub staging inilah yang dipasang di `.env` situs staging.
6. **Jawab "serving" untuk situs itu.** Situs yang dikelola Hub gelap secara default; tanpa jawaban "serving", situs staging membalas 503 di semua rute publik dan orang akan mengira staging-nya rusak.

### Env situs staging yang wajib benar

- `APP_ENV=staging`, `APP_URL` = domain staging.
- **`HUB_BASE_URL` = Hub STAGING**, bukan produksi. Ini yang paling sering salah, dan salahnya paling merusak: situs staging yang menunjuk Hub produksi mengotori data kantor pusat dan mengganggu situs lain.
- `HUB_ENABLED=true`, `HUB_SITE_API_KEY` = kunci dari Hub staging.
- `MONETAPAY_IS_PRODUCTION=false`.
- `STOREFRONT_URL` dan `PAYMENT_PAGE_URL` = domain staging. Kalau dibiarkan kosong atau menunjuk `localhost`, `urls:verify` **menggagalkan deploy** — memang disengaja.

Data awal dari `migrate --seed` (seeder dev), bukan salinan produksi.

### Secret environment `staging` (di GitHub)

| Secret | Isi |
|---|---|
| `SSH_HOST`, `SSH_PORT`, `SSH_USERNAME`, `SSH_PRIVATE_KEY` | akses ke server staging |
| `DEPLOY_BASE_PATH` | base path **staging**, bukan path produksi |
| `ENV_FILE` | seluruh isi `.env` staging |
| `VITE_API_BASE_URL` | `https://api-staging.<domain>/api` |
| `VITE_PUSHER_APP_KEY`, `VITE_PUSHER_APP_CLUSTER` | kanal staging, atau kosong (fallback polling) |
| `VITE_GOOGLE_CLIENT_ID` | client OAuth staging, atau kosong |
| `DISCORD_WEBHOOK_LOG_URL` | webhook staging (opsional) |

### Cara memastikan rantainya benar-benar tersambung

1. `php artisan hub:ping` di situs staging → lulus. Gagal berarti `HUB_BASE_URL`, kunci, atau `allowed_ips` salah.
2. `php artisan hub:status` → tabel konfigurasi + probe live ke Hub.
3. Situs staging muncul di panel Hub staging, dan `GET /v1/version` menjawab versinya.
4. `push` ke `main` → **hanya staging yang berubah**, produksi tidak tersentuh.

### Urutan, dan jebakannya

```
1. Hub staging hidup + site staging terdaftar + licence "serving"
2. Situs staging hidup, HUB_BASE_URL ke Hub staging, hub:ping lulus
3. Isi secret environment `staging`, aktifkan deploy-staging.yml
4. Uji: push ke main -> hanya staging yang berubah
5. BARU pindahkan produksi ke model tag (rilis = tag)
```

**Jebakan:** langkah 5 harus terakhir. Begitu `deploy-prod.yml` bergantung pada tag, `push` ke `main` tidak lagi mendeploy produksi — tanpa staging, tidak ada tempat menguji sebelum memberi tag.

**Worker dan cron wajib terpisah.** Bila staging menumpang VPS yang sama, queue worker dan cron staging harus punya direktori sendiri. Worker yang salah membaca tabel `jobs` akan memproses pekerjaan lingkungan lain, dan kegagalannya senyap.

---

## Migrasi ke monorepo — yang harus disiapkan di server

Ini **sekali saja**, dan harus dilakukan sebelum deploy pertama dari repo ini.

1. **Clone monorepo (sparse) ke `<base>/api`** (lihat langkah 6). Deploy juga meng-clone sendiri kalau direktorinya masih kosong — sparse, hanya `apps/api`. Server butuh **git >= 2.25**; versi lebih tua menggagalkan deploy dengan pesan jelas.
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
   | `<base>/api` | **klon monorepo (sparse)** | `<base>/api/apps/api/public` — `api.<domain>` |

   `api` adalah satu-satunya yang berbeda isinya: Laravel dijalankan dari source, bukan dari hasil build, jadi yang tinggal di sana adalah klon repo ini — tetapi **sparse**: hanya `apps/api` yang di-materialize ke working tree. Source ketiga frontend tidak ikut (mereka disajikan dari `<base>/<app>` sebagai hasil build). `root` nginx-nya menunjuk ke `apps/api/public` **di dalam** direktori itu, bukan ke direktorinya langsung. Klon sparse ini butuh **git >= 2.25** di server.

   Buat `<base>` dan ketiga direktori frontend lebih dulu (`mkdir -p`) — rsync hanya membuat komponen terakhir, bukan seluruh rantai. `<base>/api` boleh dibiarkan kosong; deploy meng-clone sendiri. Setelah `root` diedit: `nginx -t && systemctl reload nginx`.

   **Server yang sudah punya klon penuh:** deploy berikutnya mempersempitnya di tempat (`git sparse-checkout set --cone apps/api`) — tanpa re-clone, jadi `apps/api/storage` (unggahan) dan `apps/api/vendor` tetap aman. Yang belum mengecil dengan cara itu adalah folder `.git`; untuk itu perlu re-clone manual sekali (di luar alur deploy) yang **mempertahankan** `apps/api/storage` dan `.env`.
7. **Tambahkan satu secret baru** di GitHub: `DEPLOY_BASE_PATH`, berisi `<base>` di atas tanpa nama app. Workflow yang menyusun `<base>/<app>`, jadi nama direktori **wajib** sama persis dengan nama folder di `apps/` — `admin`, `storefront`, `payment`, `api`.
8. **Pindahkan `VITE_GOOGLE_CLIENT_ID` ke secret** — sebelumnya di-hardcode di YAML storefront.
9. **Pasang deploy key di server.** Server meng-clone lewat SSH, jadi user SSH-nya butuh kunci yang terdaftar di repo:

   ```
   ssh-keygen -t ed25519 -C "deploy@<domain>" -f ~/.ssh/id_ed25519 -N ''
   cat ~/.ssh/id_ed25519.pub
   ```

   Tempel isinya ke **Settings → Deploy keys → Add deploy key** di repo (read-only cukup — deploy tidak pernah push). Uji dengan `ssh -T git@github.com`; jawaban "successfully authenticated" berarti beres.

   Host key GitHub tidak perlu disiapkan manual — deploy menuliskannya ke `known_hosts` sendiri, dan juga memasang `~/.ssh/config` yang melewatkan `github.com` ke `ssh.github.com:443`. Port 22 keluar diblokir di server ini; tanpa jalur 443 itu `git pull` menggantung sampai *Connection timed out*. Uji dengan `ssh -T git@github.com` — kalau menjawab "successfully authenticated", keduanya beres sekaligus.
10. **Beri user SSH sudo tanpa kata sandi.** Deploy memakai `sudo` untuk `chown`, reload php-fpm, dan seluruh pengelolaan supervisor. Sesi non-interaktif tidak bisa mengetik kata sandi, jadi tanpa ini deploy berhenti di preflight dengan *"User … butuh sudo tanpa kata sandi"* — sebelum `.env` ditulis dan migrasi dijalankan, jadi tidak ada deploy setengah jadi yang perlu dibereskan.

    Periksa: `sudo -n true && echo OK`. Kalau belum, buat berkas drop-in — **selalu lewat `visudo`**, karena sintaks yang salah di sudoers bisa mengunci Anda dari sudo sepenuhnya:

    ```bash
    sudo visudo -f /etc/sudoers.d/deploy
    ```

    Isinya satu baris (ganti `<SSH_USERNAME>` dengan isi `SSH_USERNAME` Anda — kalau nama user-nya salah, gejalanya identik dengan tidak punya sudo sama sekali):

    ```
    <SSH_USERNAME> ALL=(root) NOPASSWD: ALL
    ```

    Lalu `sudo chmod 0440 /etc/sudoers.d/deploy`, dan periksa ulang dengan `sudo -n true && echo OK`.

    **Kenapa `ALL`, bukan daftar perintah terbatas?** Karena untuk akun deploy murni daftar terbatas tidak menambah keamanan yang berarti — alasannya di [§Catatan keamanan](#catatan-keamanan). Kalau user itu memang dipakai untuk hal lain juga sehingga harus dibatasi, daftarnya seperti ini:

    ```
    <SSH_USERNAME> ALL=(root) NOPASSWD: /usr/bin/true, /usr/bin/chown, /usr/bin/chmod, \
      /usr/bin/tee /etc/supervisor/conf.d/api-prod-worker.conf, \
      /usr/bin/mkdir -p /etc/supervisor/conf.d, \
      /usr/bin/supervisorctl, /usr/bin/systemctl, \
      /usr/bin/apt-get
    ```

    Dua hal yang membuat daftar semacam ini gagal, dan keduanya gagal dengan pesan yang menyesatkan:

    - **`true` wajib ikut terdaftar.** Preflight di `deploy-prod.yml` menjalankan `sudo -n true`, dan sudoers menolak perintah yang tidak ada di daftar. Tanpa entri itu deploy tetap berhenti di preflight walaupun `chown`, `supervisorctl`, dan sisanya sudah diizinkan.
    - **Path harus persis seperti yang dijalankan.** Pastikan dengan `command -v true chown chmod tee mkdir supervisorctl systemctl apt-get`. Di Debian/Ubuntu modern `/bin` hanyalah symlink ke `/usr/bin`, dan sudoers **tidak** mengikuti symlink — `/bin/chown` di sudoers tidak cocok dengan `/usr/bin/chown` yang benar-benar dieksekusi.

11. **Pasang kunci SSH untuk GitHub Actions.** Deploy masuk ke server dengan kunci, bukan kata sandi. Ini kunci **kedua**, dan arahnya berlawanan dengan langkah 9: yang di langkah 9 dipakai *server* untuk menarik dari GitHub, yang ini dipakai *GitHub Actions* untuk masuk ke server. Jangan pakai ulang kunci yang sama untuk keduanya.

    Buat pasangannya **di mesin Anda**, bukan di server — privat-nya tidak boleh pernah tinggal di server:

    ```bash
    ssh-keygen -t ed25519 -C "github-actions@<domain>" -f ~/.ssh/github_actions_deploy -N ''
    ```

    Pasang yang publik ke user deploy di server. Ini langkah terakhir yang masih memerlukan kata sandi user tersebut:

    ```bash
    ssh-copy-id -i ~/.ssh/github_actions_deploy.pub -p <SSH_PORT> <SSH_USERNAME>@<SSH_HOST>
    ```

    Uji dari mesin Anda — harus masuk tanpa ditanya apa pun:

    ```bash
    ssh -i ~/.ssh/github_actions_deploy -o IdentitiesOnly=yes -p <SSH_PORT> <SSH_USERNAME>@<SSH_HOST> 'echo OK'
    ```

    Lalu tempel **seluruh isi berkas privat** ke secret `SSH_PRIVATE_KEY` — `cat ~/.ssh/github_actions_deploy`, termasuk baris `-----BEGIN…`, `-----END…`, dan baris kosong di akhirnya. Kunci yang terpotong adalah penyebab paling sering dari `Permission denied (publickey)` di langkah ini.
12. **Matikan autentikasi kata sandi** — setelah satu deploy dengan kunci benar-benar berhasil, dan setelah memastikan Anda masih punya jalan masuk lain (sesi SSH yang sedang terbuka, atau konsol VPS dari panel penyedia). Di `/etc/ssh/sshd_config`:

    ```
    PasswordAuthentication no
    ```

    Lalu `sudo sshd -t && sudo systemctl reload ssh`. Urutannya penting: `sshd -t` hanya memeriksa sintaks, bukan apakah kunci Anda benar-benar terpasang, jadi mematikan kata sandi sebelum kunci terbukti jalan bisa mengunci Anda dari server sendiri. Sekalian batasi `AllowUsers <SSH_USERNAME>` dan pasang `fail2ban`; lihat [§Catatan keamanan](#catatan-keamanan).

## Secret GitHub

Sebelas secret, **sepuluh di antaranya wajib**. Dipasang di
**Settings → Secrets and variables → Actions → New repository secret**.

Daftar ini lengkap: tidak ada nilai lain yang dibaca `deploy-prod.yml` maupun
`ci.yml`. Untuk membuktikannya kembali setelah repo berubah:

```bash
grep -oh 'secrets\.[A-Z_0-9]*' .github/workflows/*.yml | sort -u
```

| # | Secret | Wajib | Dipakai | Isi / contoh |
|---|---|---|---|---|
| 1 | `SSH_HOST` | ✅ | API + 3 frontend | IP atau hostname server. `203.0.113.10` |
| 2 | `SSH_PORT` | ✅ | API + 3 frontend | Port sshd. `22` |
| 3 | `SSH_USERNAME` | ✅ | API + 3 frontend | User SSH, pemilik direktori deploy. `deployer` |
| 4 | `SSH_PRIVATE_KEY` | ✅ | API + 3 frontend | **Seluruh isi** kunci privat OpenSSH dari langkah 11, `-----BEGIN…` sampai `-----END…`. Pasangan publiknya ada di `authorized_keys` server. Bukan deploy key langkah 9 — lihat catatan di bawah |
| 5 | `DEPLOY_BASE_PATH` | ✅ | API + 3 frontend | Induk keempat app, **tanpa** nama app. `/home/<SSH_USERNAME>/<nama-situs>/dist` |
| 6 | `ENV_FILE` | ✅ | API | **Seluruh isi `.env` produksi**, bukan satu nilai. Ditulis ulang ke server tiap deploy — server bukan sumber kebenarannya, secret ini yang jadi sumber |
| 7 | `VITE_API_BASE_URL` | ✅ | 3 frontend | Base URL API, dipakai ketiganya. `https://api.contoh.id` |
| 8 | `VITE_PUSHER_APP_KEY` | ✅ | 3 frontend | Key Pusher |
| 9 | `VITE_PUSHER_APP_CLUSTER` | ✅ | 3 frontend | Cluster Pusher. `ap1` |
| 10 | `VITE_GOOGLE_CLIENT_ID` | ✅ | 3 frontend | OAuth client ID Google. Dulu di-hardcode di YAML storefront |
| 11 | `DISCORD_WEBHOOK_LOG_URL` | — | API + 3 frontend | Opsional. Kosong = notifikasi dilewati, deploy tetap jalan |

Beberapa hal yang tidak terlihat dari tabel dan pernah memakan waktu:

- **Nomor 1–4 dibaca dua jalur berbeda.** API memakainya lewat
  `appleboy/ssh-action`; ketiga frontend lewat `rsync` manual dengan kunci
  yang ditulis ke `~/.ssh/deploy_key` di runner. Satu nilai salah
  menggagalkan keempatnya.
- **Nomor 7–10 adalah variabel *build-time*.** Vite memanggangnya ke dalam
  bundle, jadi mengubahnya di server tidak berpengaruh apa pun — harus
  diubah di sini lalu di-deploy ulang.
- **Nomor 6 ditimpa tiap deploy.** Mengedit `.env` langsung di server akan
  hilang pada deploy berikutnya tanpa peringatan.
- **Tidak ada secret untuk akses Git.** Server meng-clone dengan deploy key
  miliknya sendiri (langkah 9 di atas), bukan dengan kredensial dari sini.

### Catatan tentang autentikasi SSH

Deploy masuk ke server dengan kunci privat (`SSH_PRIVATE_KEY`), bukan kata sandi. Tiga hal yang perlu diketahui:

- **Ada dua kunci berbeda dan arahnya berlawanan.** Langkah 9 memasang deploy key milik *server*, supaya server bisa `git clone` dari GitHub. Langkah 11 memasang kunci milik *GitHub Actions*, supaya Actions bisa masuk ke server. Menukar keduanya adalah kekeliruan yang paling mudah terjadi di sini, dan gejalanya sama persis: `Permission denied (publickey)`.
- **`rsync` tetap dijalankan manual**, walaupun `burnett01/rsync-deployments` sekarang sudah bisa dipakai. Alasannya bukan lagi soal autentikasi, melainkan supaya penyiapan `known_hosts` tetap terlihat di `deploy-prod.yml` — action itu mengurusnya sendiri, di luar jangkauan berkas ini. Kunci ditulis ke `~/.ssh/deploy_key` lewat variabel (argumen baris perintah terbaca di daftar proses runner) dan dihapus di langkah `Bersihkan kunci SSH` yang berjalan `if: always()`.
- **Host key server direkam lebih dulu** dengan `ssh-keyscan`, supaya `rsync` tidak perlu dijalankan dengan `StrictHostKeyChecking=no`. Ketahui batasnya: `ssh-keyscan` mempercayai apa pun yang menjawab saat itu juga, jadi ini merapikan bentuk perintahnya — bukan perlindungan terhadap server palsu — dan tiap run mempercayai ulang dari nol. Bandingkan dengan job API, yang menuliskan host key GitHub secara tetap justru karena alasan ini. Untuk benar-benar menutupnya, simpan host key server sebagai secret (mis. `SSH_HOST_KEY`) dan tulis langsung ke `known_hosts`.

`rsync` dijalankan dengan `BatchMode=yes`, jadi kunci yang salah gagal seketika alih-alih menggantung menunggu prompt sampai job timeout, dan `IdentitiesOnly=yes`, supaya hanya `deploy_key` yang ditawarkan.

Sampai langkah 1–4 selesai, **jangan** jalankan deploy dari repo ini.

---

## Catatan keamanan

Empat hal yang perlu diketahui siapa pun yang menyentuh deploy ini, diurutkan
dari yang paling berdampak.

### Sudo tanpa kata sandi bukan titik lemahnya

Daftar `NOPASSWD` yang dibatasi terasa lebih aman daripada `ALL`, tapi di kasus
ini tidak: perintah yang memang dibutuhkan script sudah setara akses root satu
sama lain.

| Diizinkan | Jalan pintas ke root |
|---|---|
| `systemctl` | membuat lalu menyalakan unit apa pun sebagai root |
| `apt-get` | `-o APT::Update::Pre-Invoke::=…`, atau paket dengan skrip `postinst` |
| `chown` / `chmod` dengan argumen bebas | mengambil alih `/etc/sudoers.d`, membuka `/etc/shadow` |
| `tee` ke conf supervisor | supervisord berjalan sebagai root; `user=root` di conf menjalankan apa pun |

Jadi memperketat daftarnya menaikkan effort penyerang beberapa detik, sementara
ia rutin mematahkan deploy setiap kali script berubah. Batas keamanan yang
sesungguhnya bukan isi sudoers, melainkan **siapa yang bisa memicu `sudo` itu**
— dua bagian berikutnya.

### Autentikasi SSH: CI sudah pakai kunci, sisanya di sisi server

Deploy dulu memakai kata sandi, yang berarti satu kata sandi tertebak sama
dengan root produksi — dan sshd yang terbuka ke internet menerima percobaan
brute force tanpa henti. Sejak deploy memakai `SSH_PRIVATE_KEY`, jalur itu
tertutup dari sisi CI. Yang masih harus dikerjakan di server:

- **`PasswordAuthentication no`** (langkah 12). Selama masih `yes`, memindahkan
  CI ke kunci belum menutup apa pun — pintunya tetap terbuka bagi penebak, dan
  user itu sekarang punya root tanpa kata sandi.
- **`AllowUsers <user-deploy>`** dan **`fail2ban`**, supaya sisa permukaan yang
  memang harus terbuka tidak dibiarkan bebas.
- **Kunci deploy belum dibatasi ke satu perintah.** `command=` di
  `authorized_keys` bisa menguncinya, tapi isi script deploy ikut berubah tiap
  kali workflow berubah, jadi belum dipasang. `from=` tidak bisa dipakai:
  alamat runner GitHub berubah-ubah.

### Akses push ke `main` sama dengan root di server

`deploy-prod.yml` ikut dalam path filter-nya sendiri, dan blok `script:`-nya
berjalan dengan sudo tanpa kata sandi. Siapa pun yang bisa push atau merge ke
`main` karena itu bisa menjalankan perintah apa pun sebagai root di server
produksi, sekaligus membaca seluruh secret. Ini berlaku pada desain deploy mana
pun yang memberi CI akses ke server; yang penting kontrolnya ada:

- **Branch protection** di `main`: wajib lewat PR, minimal satu review, tanpa
  force-push.
- **GitHub Environment** `production` dengan *required reviewers*, dipasang
  sebagai `environment:` di job `api-deploy` dan `frontend`, dengan secret
  dipindahkan ke environment itu — sehingga tidak ada workflow lain di repo ini
  yang bisa membacanya.

### Dua hal yang masih terbuka di `deploy-prod.yml`

- **`.env` ditulis dengan permission default.** Langkah 3
  (`echo "$ENV_FILE_CONTENT" > .env`) menghasilkan mode 644 pada umask biasa,
  sehingga kredensial database, `APP_KEY`, dan kunci gateway pembayaran terbaca
  oleh setiap user di server — langkah 8 hanya meng-`chmod` `storage` dan
  `bootstrap/cache`. Perbaikannya satu baris tepat setelah penulisan:
  `chmod 640 .env && sudo chown "$(id -un):www-data" .env`.
- **`ssh-keyscan` di job frontend tidak menutup MITM.** Lihat
  [§Catatan tentang autentikasi SSH](#catatan-tentang-autentikasi-ssh).

---

## Urutan deploy API, dan kenapa tiap langkah ada

```
git fetch --tags --force       ← gagal di sini membatalkan deploy SEBELUM apa pun berubah
git checkout --force <tag>     ← rilis adalah TAG, bukan ujung `main`
tulis .env dari secret
stempel APP_VERSION/APP_COMMIT/APP_UPSTREAM ke .env
composer install --no-dev
optimize:clear                 ← buang config cache lama, supaya gerbang membaca .env baru
php artisan hub:ping           ← GAGAL bila Hub tersambung tapi tak terjangkau (standalone: lulus)
php artisan migrate --force
php artisan pricing:backfill-plan-prices    ← WAJIB, lihat di bawah
php artisan pricing:verify                   ← menggagalkan deploy bila menyimpang
php artisan urls:verify                      ← menggagalkan deploy bila tautan tak bisa dibuka pelanggan
optimize:clear → config:cache → route:cache
storage:link
chown/chmod
tulis batas unggah PHP      ← upload_max_filesize 8M, post_max_size 10M
reload php-fpm              ← tanpa ini OPcache menyajikan bytecode lama
tulis batas body nginx      ← client_max_body_size 8m di conf.d (konteks `http` saja), lalu `nginx -t`
pasang cron schedule:run    ← deploy GAGAL bila hilang
pasang supervisor + queue:restart
periksa worker RUNNING      ← deploy GAGAL bila tidak
```

**Backfill harga wajib satu langkah dengan migrasi.** Tanpanya `product_plan_prices` kosong, `PlanPrice::for()` jatuh ke `products.price_member`, dan **setiap member dijual di harga tingkat dasar**. Tidak ada error di mana pun — hanya kebocoran pendapatan. Langkah inilah yang **tidak ada** di pipeline lama dan kini ditambahkan.

**Empat pemeriksaan yang sengaja menggagalkan deploy.** Beberapa di antaranya dulu berakhir `|| true`, dan itulah cara sebuah situs bisa berjalan berhari-hari dengan deploy hijau sementara pesanan berbayar tidak pernah diproses:

- `hub:ping` gagal → situs tersambung ke Hub tapi Hub tidak terjangkau, jadi seluruh loop pelaporan mati (deploy standalone lulus sendiri).
- Cron `schedule:run` hilang → 13 perintah terjadwal berhenti diam-diam.
- Queue worker tidak `RUNNING` → pembayaran berhasil, job parkir di tabel `jobs`, tidak ada yang error.
- `pricing:verify` menyimpang → harga per paket tidak sinkron.

**Queue worker bukan opsional, dan kegagalannya senyap.** Delapan kelas job bergantung padanya, dan salah satunya menempatkan pesanan pelanggan yang sudah dibayar ke supplier. Supervisor menjalankan **dua** proses: satu tidak cukup, karena order supplier adalah panggilan HTTP keluar yang bisa menahan worker beberapa detik.

**Batas unggah ikut diatur deploy, karena aplikasi sudah menjanjikannya.** Halaman Settings menawarkan logo GIF sampai 5 MB (`SettingController::maxKilobytes()`), dan GIF animasi memang sengaja tidak dikompresi — baik di browser maupun di `ImageOptimizer`, karena GD tidak bisa menulis animated WebP. Tapi tanpa dua langkah di atas, yang berlaku adalah default server: nginx `client_max_body_size 1m` dan PHP `upload_max_filesize 2m`. Keduanya menolak berkas sebelum Laravel sempat memeriksanya, dan yang tertolak justru berkas yang paling besar — GIF animasi. Gejalanya menyesatkan: unggahan gagal, pesannya generik, dan tidak ada satu pun log aplikasi karena permintaannya tidak pernah sampai.

Keduanya ditulis sebagai drop-in (`/etc/php/<versi>/fpm/conf.d/99-uploads.ini` dan `/etc/nginx/conf.d/uploads.conf`), bukan suntingan berkas utama, supaya pembaruan paket tidak menghapusnya.

**`conf.d/uploads.conf` hanya boleh berisi direktif konteks `http`.** `conf.d/*.conf` di-include dari dalam blok `http`, dan `location` tidak sah di sana. Sebuah blok `location` yang pernah ditulis ke berkas ini membuat `nginx -t` gagal dengan `"location" directive is not allowed here` dan menggagalkan deploy. Karena itu header per-lokasi — CSP untuk berkas `.svg` yang diunggah, yang disajikan dari origin API itu sendiri — **tidak** ikut masuk drop-in. Pasang manual di blok `server` vhost API:

```nginx
# di dalam server { } vhost api.topupgame.id, sebelum location ~ \.php$
location ~* \.svg$ {
    add_header Content-Security-Policy "default-src 'none'; style-src 'unsafe-inline'; sandbox" always;
    add_header X-Content-Type-Options "nosniff" always;
}
```

Sebuah SVG bisa membawa `<script>`, dan berkas unggahan disajikan dari origin yang sama dengan tempat kredensial panel dipakai. Policy di atas tetap membuat SVG tampil sebagai gambar, tapi melarangnya menjalankan apa pun.

Kalau `nginx -t` gagal sesudah drop-in ditulis, deploy **membuang berkas itu** sebelum keluar. Ini disengaja: nginx yang konfigurasinya tidak bisa diuji juga tidak bisa di-reload maupun di-restart, jadi berkas buruk yang dibiarkan akan mematikan seluruh situs pada reboot atau perpanjangan sertifikat berikutnya — bukan sekadar menggagalkan satu deploy.

Periksa sesudah deploy:

```bash
php -i | grep -E 'upload_max_filesize|post_max_size'
sudo nginx -T | grep client_max_body_size
sudo nginx -T | grep -c "default-src 'none'"   # 0 = CSP SVG belum dipasang manual
```

---

## Konfigurasi `.env`

Kunci di luar bawaan Laravel, dikelompokkan menurut fungsinya:

**Gateway pembayaran (Monetapay)** — `MONETAPAY_MCH_ID`, `MONETAPAY_COLLECTION_APP_ID`, `MONETAPAY_DISBURSEMENT_APP_ID`, `MONETAPAY_PARTNER_KEY`, `MONETAPAY_TOKEN`, `MONETAPAY_AES_KEY`, `MONETAPAY_AES_IV`, `MONETAPAY_IS_PRODUCTION`, `MONETAPAY_SUCCESS_REDIRECT_URL`, `MONETAPAY_FAILED_REDIRECT_URL`, plus lima varian `MONETAPAY_DISBURSEMENT_*`.

> Tiga identitas yang **jangan dicampur**: `mch_id` adalah identitas merchant, `collection_app_id` untuk jalur pemasukan, `disbursement_app_id` untuk jalur pembayaran keluar. `collection_app_id` **tidak punya nilai cadangan** — kalau tidak diisi, panggilan pemasukan ditandatangani dengan `app_id` kosong.

**Supplier (Uxiotopup)** — `UXIOTOPUP_API_KEY`, `UXIOTOPUP_BASE_URL`, `UXIOTOPUP_CALLBACK_URL`, `UXIOTOPUP_PRICE_TIER`, `UXIOTOPUP_CALLBACK_IP`.

> ⚠️ **Nama kunci ini pernah berputar arah.** Providernya sempat dinamai "Uxiolabs" sehingga kuncinya ikut menjadi `UXIOLABS_*`, lalu dikembalikan ke "Uxiotopup". Yang berlaku **sekarang** adalah `UXIOTOPUP_*` — itu yang dibaca `config/services.php` dan yang ada di `.env.example`. Nama `UXIOLABS_*` **tidak** dibaca: `.env` produksi yang masih memakainya akan terbaca kosong dan **setiap pesanan gagal di supplier**. Yang benar-benar berlaku di server bisa diperiksa dari halaman Integration di panel admin, karena kredensial dari basis data menimpa `.env`. **Pastikan `.env` memakai `UXIOTOPUP_*` sebelum deploy.**

**Penarikan dana** — `WITHDRAWAL_FEE_FLAT` (1500), `WITHDRAWAL_FEE_PERCENT` (11), `WITHDRAWAL_MIN_AMOUNT` (10000), `WITHDRAWAL_HOLD_BUFFER_DAYS` (1).

**Uxio Hub** — `HUB_ENABLED` (default `false` = mandiri, tidak ada yang dijadwalkan), `HUB_SITE_API_KEY`, `HUB_BASE_URL`, `HUB_ALLOWED_IPS`, `HUB_MANAGED_CATALOG`, `HUB_MANAGED_CHANNELS`, `HUB_MANAGED_LICENCE`, `HUB_MANAGED_PLAN`, `HUB_PUSH_ORDERS`, `HUB_SYNC_INTERVAL_MINUTES`, `HUB_WRITE_ENABLED`, `HUB_WRITE_API_KEY`, `HUB_CONTRACT_VERSION`.

**Colokan integrasi** — `SUPPLIER_DRIVER` (default `uxiolabs`) dan `PAYMENT_DRIVER` (default `monetapay`) memilih adapter mana yang dipakai situs ini; daftar adapter-nya di `config/services.php`. Lihat [07 — Zona](07-zona-dapur.md).

**Stempel rilis** — `APP_VERSION`, `APP_COMMIT`, `APP_UPSTREAM`, ditulis deploy sendiri dari tag (lihat [§Rilis](#rilis-tag-stempel-rollback)); jangan diisi manual di secret `ENV_FILE`, karena akan ditimpa.

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
| tiap 1 menit | `hub:sync-catalog`, `hub:sync-channels`, `hub:sync-licence`, `hub:sync-plan` — **hanya bila `HUB_ENABLED`** (`hub:sync-plan` juga butuh `HUB_MANAGED_PLAN`) |
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
