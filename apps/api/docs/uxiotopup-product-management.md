# Manajemen Produk uxiotopup — Panduan Admin & Teknis

> Berlaku sejak Agustus 2026 (migrasi supplier Digiflazz → uxiotopup). Menggantikan alur lama di mana produk baru dibuat otomatis oleh sync harian.

## Ringkasan Konsep

| Dulu | Sekarang |
|---|---|
| Sync harian 04:30 membuat produk baru otomatis | Produk baru **hanya ditambahkan manual** oleh admin (satuan atau import Excel) |
| Harga jual produk `auto_price` dihitung ulang otomatis | Harga jual **tidak pernah diubah otomatis** — admin yang menentukan |
| Perubahan harga supplier baru terlihat besok pagi | **Checker tiap 5 menit**: modal & ketersediaan di-update otomatis, perubahan harga muncul sebagai **Price Alert** + notifikasi lonceng di admin web |

Prinsip: **harga modal = fakta dari supplier (otomatis)**, **harga jual = keputusan admin (manual)**.

---

## 1. Menambah Produk Satuan

Menu: **Tools & Integrations → Uxiotopup Tools → tab "Tambah Produk"**

1. Masukkan **kode layanan (service id) dari uxiotopup** (contoh: `ML86`), klik **Cek SKU**. (uxiotopup hanya prepaid — tidak ada pilihan tipe lagi.)
2. Sistem menampilkan data dari price list uxiotopup: nama layanan, kategori, **harga modal** (tier sesuai `UXIOTOPUP_PRICE_TIER`), dan status ketersediaan. Jika layanan sudah pernah ditambahkan, muncul peringatan dan tidak bisa disimpan lagi.
3. Pilih **Kategori** (wajib). Nama & kode produk terisi otomatis — boleh diubah.
4. Empat kolom **harga jual** (Member/VIP/Reseller/Agent) terisi otomatis dari aturan markup (Pricing Rules) sebagai saran — **ubah sesuai kebutuhan**. Kolom akan memberi peringatan merah jika harga di bawah modal.
5. Centang **"Langsung aktif di storefront"** jika produk ingin langsung dijual, lalu **Simpan Produk**.

Yang terjadi di belakang layar: sistem membuat `Product` (modal = harga tier uxiotopup) + mapping `SupplierProduct`, dengan status ketersediaan mengikuti uxiotopup (`aktif`/`nonaktif`).

## 2. Import Massal via Excel

Menu: **Tools & Integrations → Uxiotopup Tools → tab "Import Excel"**

### Langkah

1. Klik **Unduh Template Excel** → file `template-import-produk-uxiotopup.xlsx`.
2. Isi sheet **"Produk"** mulai baris 2 (**hapus baris contoh `ML86`**). Sheet **"Petunjuk"** berisi instruksi + daftar `category_code` valid yang diambil langsung dari database.
3. Pilih file, klik **Import**.
4. Sistem menampilkan laporan per-baris: baris berhasil (hijau) dan gagal (merah, dengan alasannya). **Baris gagal tidak membatalkan baris lain.**

### Spesifikasi Kolom

| Kolom | Wajib? | Keterangan |
|---|---|---|
| `buyer_sku_code` | ✅ | Kode layanan (service id) dari uxiotopup. Harus ada di price list uxiotopup. |
| `category_code` | ✅ | Harus cocok dengan kode kategori di sistem (lihat sheet Petunjuk). |
| `name` | — | Kosong = pakai nama layanan dari uxiotopup. |
| `code` | — | Kode produk unik di sistem. Kosong = sama dengan `buyer_sku_code`. |
| `price_member` … `price_agent` | — | Kosong = dihitung otomatis dari modal × aturan markup (Pricing Rules). |
| `status` | — | `1` = langsung aktif, `0`/kosong = nonaktif (disembunyikan sampai diaktifkan admin). |

Batas: **maks 500 baris per file, 2 MB, format .xlsx**.

### Alasan baris gagal yang umum

- `Layanan tidak ditemukan di price list uxiotopup.` — kode salah ketik, atau layanan belum ada di price list.
- `Layanan sudah terhubung ke produk lain.` — produk untuk layanan ini sudah ada.
- `Kode produk '…' sudah dipakai.` — isi kolom `code` dengan nilai lain.
- `category_code '…' tidak dikenal.` — cek sheet Petunjuk untuk daftar valid.

## 3. Price Alerts (Perubahan Harga)

### Cara kerja

- Setiap **5 menit** sistem menarik price list uxiotopup dan membandingkan dengan data lokal.
- Jika **modal berubah**: modal di sistem **langsung di-update otomatis** (agar pengaman margin di checkout tetap akurat), dan tercatat satu **Price Alert** berisi harga lama → baru.
- **Harga jual tidak pernah diubah otomatis** — itulah gunanya alert: pengingat untuk menyesuaikan.

### Alur kerja admin

1. Ikon **grafik naik (lonceng oranye)** di navbar berdenyut saat ada alert baru (dicek tiap 60 detik, dengan suara notifikasi).
2. Buka **Tools & Integrations → Price Alerts** (atau klik "Kelola Semua Alert" di dropdown lonceng).
3. Tabel menampilkan: produk, modal lama → baru (+persentase), **harga jual member saat ini** — baris merah berarti harga jual sudah **di bawah modal baru** (checkout produk itu otomatis ditolak sampai di-reprice!).
4. Sesuaikan harga jual produk lewat halaman **Products** → edit produk.
5. Kembali ke Price Alerts, klik **Tandai Selesai** (atau **Tandai Semua Selesai**). Alert selesai tersimpan sebagai riwayat di tab "Selesai".

### Perilaku alert (deduplikasi)

- Satu SKU hanya punya **satu alert pending**. Jika harga berubah lagi sebelum ditandai selesai, alert yang sama diperbarui (`harga baru` mengikuti terbaru, `harga lama` tetap dari awal).
- Jika harga **kembali ke semula**, alert pending otomatis dihapus.
- Setelah ditandai selesai, perubahan berikutnya membuat alert pending baru — riwayat tidak hilang.

## 4. Perilaku Checker Otomatis (Tiap 5 Menit)

Yang **dilakukan** checker:
- Update **modal** (`supplier_products.price`) dari tier harga yang dikonfigurasi.
- Update **ketersediaan**: layanan berstatus `nonaktif` di uxiotopup dinonaktifkan; hanya SKU yang dinonaktifkan checker sendiri yang diaktifkan kembali otomatis (nonaktif manual oleh admin **tidak pernah** ditimpa).
- Membuat/memperbarui **Price Alert** untuk setiap perubahan modal.
- Melaporkan produk **margin negatif** (harga member < modal — gagal di pengaman checkout).

Yang **TIDAK pernah** dilakukan checker:
- ❌ Membuat produk baru (SKU tak dikenal hanya dihitung di laporan).
- ❌ Mengubah harga jual.

Tab **"Cek Harga"** di Uxiotopup Tools menjalankan proses yang sama secara manual + mengirim laporan lengkap ke Discord.

## 5. Catatan Teknis

### Endpoint

| Method | Path | Fungsi |
|---|---|---|
| `GET` | `/v1/uxiotopup/sku-preview?buyer_sku_code=&category_id=` | Preview layanan + saran harga |
| `POST` | `/v1/uxiotopup/products` | Tambah produk satuan |
| `GET` | `/v1/uxiotopup/products/import-template` | Unduh template (binary xlsx, tanpa envelope JSON) |
| `POST` | `/v1/uxiotopup/products/import` | Import Excel (multipart: `file`) |
| `GET` | `/v1/uxiotopup/price-alerts?status=&page=&per_page=` | Daftar alert (paginated) |
| `POST` | `/v1/uxiotopup/price-alerts/{id}/acknowledge` | Tandai selesai (idempotent) |
| `POST` | `/v1/uxiotopup/price-alerts/acknowledge-all` | Tandai semua pending selesai |
| `POST` | `/v1/uxiotopup/sync-products` | Cek harga manual (laporan `PriceCheckReportDTO`) |

### Command & Scheduler

- `php artisan uxiotopup:check-prices` — dijadwalkan **tiap 5 menit** (`routes/console.php`), `withoutOverlapping`, alert Discord hanya saat gagal.
- `php artisan uxiotopup:sync-products` — versi manual dengan laporan console + Discord (logika sama, tidak dijadwalkan).

### Data & Cache

- Tabel `price_change_alerts`: `supplier_product_id`, `buyer_sku_code`, `type`, `old_price`, `new_price`, `status` (pending/acknowledged), `acknowledged_at/by`.
- Price list uxiotopup di-cache **5 menit** (`uxiotopup:price-list`); checker menyegarkan cache tiap run, sehingga preview/import hampir tidak pernah memicu fetch tambahan. Catatan: payload price list bisa besar (MB) — jika cache `database` terasa berat, pindahkan `CACHE_STORE` ke `redis`/`file`.
- Kolom `products.auto_price` **dihapus** (tidak ada konsumen lagi). Pricing Rules tetap dipakai untuk: saran harga di preview SKU + default harga saat kolom Excel dikosongkan.
- Kategori selalu eksplisit dari input admin (tidak ada peta brand → kategori otomatis).

### Deploy / Workflow

**Tidak ada perubahan GitHub Actions yang diperlukan**: CI sudah menjalankan test suite, deploy sudah menjalankan `php artisan migrate --force`, dan cron `schedule:run` per menit sudah terpasang otomatis oleh workflow deploy — jadwal 5-menit baru terbaca sendiri dari `routes/console.php`.

## 6. Troubleshooting

| Gejala | Penyebab & solusi |
|---|---|
| "Layanan tidak ditemukan" padahal ada di uxiotopup | Price list cache belum menyertakan layanan baru — tunggu ≤5 menit atau jalankan "Cek Harga". |
| Template gagal dibuka di Excel | Pastikan mengunduh via tombol "Unduh Template Excel" (bukan copy-paste URL tanpa token auth). |
| Import ditolak (422) sebelum laporan muncul | File bukan .xlsx, >2 MB, >500 baris, atau header baris 1 diubah — unduh ulang template. |
| Alert tidak muncul padahal harga berubah | Checker berjalan tiap 5 menit — cek `php artisan schedule:list` di server dan pastikan cron aktif. |
| Produk tiba-tiba tidak bisa di-checkout | Lihat baris merah di Price Alerts: harga jual di bawah modal baru — naikkan harga jual. |
