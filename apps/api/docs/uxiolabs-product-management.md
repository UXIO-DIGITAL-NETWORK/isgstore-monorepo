# Manajemen Produk uxiolabs — Panduan Admin & Teknis

> Berlaku sejak Agustus 2026 (migrasi supplier Digiflazz → uxiolabs). Menggantikan alur lama di mana produk baru dibuat otomatis oleh sync harian.

## Ringkasan Konsep

| Dulu | Sekarang |
|---|---|
| Sync harian 04:30 membuat produk baru otomatis | Produk baru **hanya ditambahkan manual** oleh admin (satuan atau import Excel) |
| Harga jual produk `auto_price` dihitung ulang otomatis | Harga jual **tidak pernah diubah otomatis** — admin yang menentukan |
| Perubahan harga supplier baru terlihat besok pagi | **Checker tiap 5 menit**: modal & ketersediaan di-update otomatis, perubahan harga muncul sebagai **Price Alert** + notifikasi lonceng di admin web |

Prinsip: **harga modal = fakta dari supplier (otomatis)**, **harga jual = keputusan admin (manual)**.

---

## 0. Siklus Hidup Produk

Satu SKU berjalan satu arah. Setiap tahap punya satu tempat tinggal — sebuah SKU
tidak pernah muncul di dua daftar sekaligus.

```
price list uxiolabs
   │  Add to pool
   ▼
POOL — halaman "Product Provider"
   │  Needs margin ──(Set Profit Margin)──► Ready
   │
   ├─ Promote ───────────► MAIN PRODUCTS sebagai Draft
   └─ Promote & Publish ─► MAIN PRODUCTS sebagai Published
                              │
                              │  Draft ──(Publish)──► Published
                              │          ◄─(Unpublish)─┘
                              │
                              ├─ Archive ──► SKU balik ke POOL (Ready)
                              └─ Restore ◄── selama SKU-nya belum dipakai produk lain
```

**Begitu dipromote, barisnya hilang dari pool.** Ia jadi Main Product, dan di sanalah
ia dipublish, di-unpublish, dan diarsipkan. Satu-satunya jalan kembali ke pool adalah
Archive.

### Publish, bukan Activate

Produk baru bisa dijual kalau **dua** hal menyala: `products.status` dan mapping supplier
yang aktif (`supplier_products.is_active`). Dulu ada dua tombol berbeda untuk itu —
"Activate" di Main Products hanya menyalakan yang pertama, sehingga produk bisa terlihat
"Active" padahal storefront tetap tidak melihatnya. Sekarang satu verb: **Publish /
Unpublish**, dan ia menggerakkan kedua-duanya.

Publish ditolak, dengan alasannya ditampilkan langsung di menu, kalau:

- produk belum punya mapping supplier
- SKU-nya sedang nonaktif di uxiolabs — mempublikasikannya hanya akan mengiklankan
  order yang pasti gagal saat checkout

### Archive, bukan hapus

Menghapus produk yang pernah terjual dulu **tidak mungkin**: `transactions.product_id`
bersifat RESTRICT, jadi database menolak dan admin dapat error 500. Sekarang Delete
mengarsipkan — barisnya tetap ada, sehingga invoice, riwayat transaksi, dan laporan lama
tetap utuh selamanya. Produk terarsip:

- hilang dari storefront dan dari daftar admin (kecuali filter **Status → Archived**)
- SKU-nya kembali ke pool sebagai **Ready**, margin tetap tersimpan
- bisa dipulihkan lewat **Restore** — ditolak kalau SKU-nya sudah terlanjur dipakai
  produk lain

Karena `products.code` unik dan produk terarsip masih memegang kodenya, mempromote ulang
SKU yang sama akan ditolak selama produk lamanya belum di-restore atau kodenya diganti.

---

## 1. Menambah Produk Satuan

Menu: **Tools & Integrations → Uxiolabs Tools → tab "Tambah Produk"**

1. Masukkan **kode layanan (service id) dari uxiolabs** (contoh: `ML86`), klik **Cek SKU**. (uxiolabs hanya prepaid — tidak ada pilihan tipe lagi.)
2. Sistem menampilkan data dari price list uxiolabs: nama layanan, kategori, **harga modal** (tier sesuai `UXIOTOPUP_PRICE_TIER`), dan status ketersediaan. Jika layanan sudah pernah ditambahkan, muncul peringatan dan tidak bisa disimpan lagi.
3. Pilih **Kategori** (wajib). Nama & kode produk terisi otomatis — boleh diubah.
4. Empat kolom **harga jual** (Member/VIP/Reseller/Agent) terisi otomatis dari aturan markup (Pricing Rules) sebagai saran — **ubah sesuai kebutuhan**. Kolom akan memberi peringatan merah jika harga di bawah modal.
5. Centang **"Langsung aktif di storefront"** jika produk ingin langsung dijual, lalu **Simpan Produk**.

Yang terjadi di belakang layar: sistem membuat `Product` (modal = harga tier uxiolabs) + mapping `SupplierProduct`, dengan status ketersediaan mengikuti uxiolabs (`aktif`/`nonaktif`).

## 2. Import Massal via Excel

Menu: **Tools & Integrations → Uxiolabs Tools → tab "Import Excel"**

### Langkah

1. Klik **Unduh Template Excel** → file `template-import-produk-uxiolabs.xlsx`.
2. Isi sheet **"Produk"** mulai baris 2 (**hapus baris contoh `ML86`**). Sheet **"Petunjuk"** berisi instruksi + daftar `category_code` valid yang diambil langsung dari database.
3. Pilih file, klik **Import**.
4. Sistem menampilkan laporan per-baris: baris berhasil (hijau) dan gagal (merah, dengan alasannya). **Baris gagal tidak membatalkan baris lain.**

### Spesifikasi Kolom

| Kolom | Wajib? | Keterangan |
|---|---|---|
| `buyer_sku_code` | ✅ | Kode layanan (service id) dari uxiolabs. Harus ada di price list uxiolabs. |
| `category_code` | ✅ | Harus cocok dengan kode kategori di sistem (lihat sheet Petunjuk). |
| `name` | — | Kosong = pakai nama layanan dari uxiolabs. |
| `code` | — | Kode produk unik di sistem. Kosong = sama dengan `buyer_sku_code`. |
| `price_member` … `price_agent` | — | Kosong = dihitung otomatis dari modal × aturan markup (Pricing Rules). |
| `status` | — | `1` = langsung aktif, `0`/kosong = nonaktif (disembunyikan sampai diaktifkan admin). |

Batas: **maks 500 baris per file, 2 MB, format .xlsx**.

### Alasan baris gagal yang umum

- `Layanan tidak ditemukan di price list uxiolabs.` — kode salah ketik, atau layanan belum ada di price list.
- `Layanan sudah terhubung ke produk lain.` — produk untuk layanan ini sudah ada.
- `Kode produk '…' sudah dipakai.` — isi kolom `code` dengan nilai lain.
- `category_code '…' tidak dikenal.` — cek sheet Petunjuk untuk daftar valid.

## 3. Price Alerts (Perubahan Harga)

### Cara kerja

- Setiap **5 menit** sistem menarik price list uxiolabs dan membandingkan dengan data lokal.
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
- Update **ketersediaan**: layanan berstatus `nonaktif` di uxiolabs dinonaktifkan; hanya SKU yang dinonaktifkan checker sendiri yang diaktifkan kembali otomatis (nonaktif manual oleh admin **tidak pernah** ditimpa).
- Membuat/memperbarui **Price Alert** untuk setiap perubahan modal.
- Melaporkan produk **margin negatif** (harga member < modal — gagal di pengaman checkout).

Yang **TIDAK pernah** dilakukan checker:
- ❌ Membuat produk baru (SKU tak dikenal hanya dihitung di laporan).
- ❌ Mengubah harga jual.

Tab **"Cek Harga"** di Uxiolabs Tools menjalankan proses yang sama secara manual + mengirim laporan lengkap ke Discord.

## 5. Catatan Teknis

### Endpoint

| Method | Path | Fungsi |
|---|---|---|
| `GET` | `/v1/uxiolabs/sku-preview?buyer_sku_code=&category_id=` | Preview layanan + saran harga |
| `POST` | `/v1/uxiolabs/products` | Tambah produk satuan |
| `GET` | `/v1/uxiolabs/products/import-template` | Unduh template (binary xlsx, tanpa envelope JSON) |
| `POST` | `/v1/uxiolabs/products/import` | Import Excel (multipart: `file`) |
| `GET` | `/v1/uxiolabs/price-alerts?status=&page=&per_page=` | Daftar alert (paginated) |
| `POST` | `/v1/uxiolabs/price-alerts/{id}/acknowledge` | Tandai selesai (idempotent) |
| `POST` | `/v1/uxiolabs/price-alerts/acknowledge-all` | Tandai semua pending selesai |
| `POST` | `/v1/uxiolabs/sync-products` | Cek harga manual (laporan `PriceCheckReportDTO`) |

### Command & Scheduler

- `php artisan uxiolabs:check-prices` — dijadwalkan **tiap 5 menit** (`routes/console.php`), `withoutOverlapping`, alert Discord hanya saat gagal.
- `php artisan uxiolabs:sync-products` — versi manual dengan laporan console + Discord (logika sama, tidak dijadwalkan).

### Data & Cache

- Tabel `price_change_alerts`: `supplier_product_id`, `buyer_sku_code`, `type`, `old_price`, `new_price`, `status` (pending/acknowledged), `acknowledged_at/by`.
- Price list uxiolabs di-cache **5 menit** (`uxiolabs:price-list`); checker menyegarkan cache tiap run, sehingga preview/import hampir tidak pernah memicu fetch tambahan. Catatan: payload price list bisa besar (MB) — jika cache `database` terasa berat, pindahkan `CACHE_STORE` ke `redis`/`file`.
- Kolom `products.auto_price` **dihapus** (tidak ada konsumen lagi). Pricing Rules tetap dipakai untuk: saran harga di preview SKU + default harga saat kolom Excel dikosongkan.
- Kategori selalu eksplisit dari input admin (tidak ada peta brand → kategori otomatis).

### Deploy / Workflow

**Tidak ada perubahan GitHub Actions yang diperlukan**: CI sudah menjalankan test suite, deploy sudah menjalankan `php artisan migrate --force`, dan cron `schedule:run` per menit sudah terpasang otomatis oleh workflow deploy — jadwal 5-menit baru terbaca sendiri dari `routes/console.php`.

## 6. Troubleshooting

| Gejala | Penyebab & solusi |
|---|---|
| "Layanan tidak ditemukan" padahal ada di uxiolabs | Price list cache belum menyertakan layanan baru — tunggu ≤5 menit atau jalankan "Cek Harga". |
| Template gagal dibuka di Excel | Pastikan mengunduh via tombol "Unduh Template Excel" (bukan copy-paste URL tanpa token auth). |
| Import ditolak (422) sebelum laporan muncul | File bukan .xlsx, >2 MB, >500 baris, atau header baris 1 diubah — unduh ulang template. |
| Alert tidak muncul padahal harga berubah | Checker berjalan tiap 5 menit — cek `php artisan schedule:list` di server dan pastikan cron aktif. |
| Produk tiba-tiba tidak bisa di-checkout | Lihat baris merah di Price Alerts: harga jual di bawah modal baru — naikkan harga jual. |
