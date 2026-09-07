# Basis Data

88 migrasi, 58 model. Bagian ini hanya memuat yang paling sering disalahpahami.

## Relasi inti

```
users (boleh null) ──── transactions ──── payments ──── payment_channels
                              │
                        products ──── supplier_products ──── suppliers
                              │              │
                      product_plan_prices  price_change_logs
                              │
                      membership_plans
```

- **`transactions.user_id` boleh null** — checkout tamu didukung penuh.
- **`transactions.guest_contact`** menyimpan nomor WhatsApp tamu, dalam bentuk kanonik E.164.
- **`transactions.product_id` NOT NULL**, tapi relasi `product()` memakai `withTrashed()` — produk yang diarsipkan harus tetap bisa dipanggil, atau riwayat yang justru dilindungi oleh pengarsipan itu jadi rusak.

## Kolom uang di `transactions`

Ini yang paling sering keliru dibaca:

| Kolom | Artinya |
|---|---|
| `amount_base` | Harga produk **setelah** diskon promo **dan setelah** potongan poin. Ini basis perhitungan poin |
| `discount_amount` | Nilai diskon promo |
| `points_spent` / `points_spent_amount` | Poin yang ditebus dan nilai rupiahnya |
| `channel_fee` | "Biaya Admin" yang dibayar pelanggan |
| `amount_fee` | Salinan gabungan, untuk kompatibilitas lama |
| `admin_markup` | **Selalu 0.** Dipertahankan agar baris lama tetap bisa direkonstruksi |
| `tax_amount` / `tax_percent` | PPN atas biaya channel. **Beban Uxio, tidak ditambahkan ke tagihan pelanggan** |
| `amount_total` | Yang benar-benar dibayar: `amount_base + channel_fee` |
| `margin` | Dibekukan saat checkout |
| `points_earned` | Ditulis hanya saat `COMPLETED` |

Ringkasnya: **pelanggan membayar `amount_base + channel_fee`; Uxio menyimpan `channel_fee − gateway_fee − tax_amount`.**

> **`amount_base` sudah bersih dari poin.** Ini pernah menimbulkan bug uang: kode pemberian poin mengurangkan `points_spent_amount` sekali lagi, sehingga pesanan yang memakai poin mendapat poin lebih sedikit — dan pesanan yang separuhnya dibayar poin tidak mendapat poin sama sekali. Diperbaiki 7 September 2026; jangan kurangkan poin dua kali.

## Tiga tarif di `payment_channels`

Ketiganya **dibekukan ke baris transaksi saat checkout**, jadi perubahan tarif tidak pernah menulis ulang pesanan yang sudah dibukukan.

| Tarif | Untuk |
|---|---|
| `fee_flat` + `fee_percent` | Biaya admin yang dilihat pelanggan |
| `gateway_fee_flat` + `gateway_fee_percent` | Potongan Monetapay, dicatat di `payments.gateway_fee` |
| `tax_percent` | PPN atas biaya admin saja |

## Harga per paket membership

```
harga modal supplier
  + product_plan_prices.margin_percent (bila ditulis admin)   → menang atas semuanya
  + pricing_rules: (kategori, plan) → (NULL, plan) → (kategori, NULL) → (NULL, NULL)
  + products.price_min / price_max (penjepit)
  → product_plan_prices  (+ salinan ke products.price_member)
```

**`products.price_member` adalah salinan denormalisasi** dari harga paket bawaan. Enam kueri mengurutkan dan menyaring dengannya, jadi mengubahnya menjadi join akan menghabiskan indeks tanpa manfaat. Harganya satu-satunya penulis adalah `WritePlanPricesAction`, dan `pricing:verify` yang membuktikan tidak ada penulis kedua.

**`PlanPrice::for()` punya rung terakhir yang merupakan alarm, bukan fitur:** kalau tidak ada baris `product_plan_prices` sama sekali, ia jatuh ke `price_member` sambil menulis peringatan di log. Itu berarti `pricing:backfill-plan-prices` belum pernah dijalankan, dan **setiap member sedang dijual di harga tingkat dasar.** Tidak ada yang error — hanya kebocoran pendapatan yang senyap.

## Dua siklus status

- **`transactions.status`** — satu-satunya pengambil keputusan. Setiap penjaga status final, `RefundEligibility`, dan `AdminRetryTransactionAction` membacanya.
- **`transactions.provider_status`** — hanya untuk tampilan dan filter. **Tidak boleh dibaca oleh penjaga mana pun.**

`ProviderStatusPolicy` yang memegang matriksnya, dan `TransactionObserver::saving()` menerapkannya ke setiap penyimpanan — jadi penulis yang hanya menyentuh `status` tetap mendapat nilai yang benar. Dua aturan yang menjaganya tetap rapat:

1. **Jangan pernah `saveQuietly()` perubahan `status`** — itu melewati observer, satu-satunya celah yang tersisa.
2. **`REFUNDED` mempertahankan nilai provider sebelumnya**, tidak menimpanya. Refund mencatat uang kembali, bukan apakah supplier berhasil kirim — tanpa aturan ini, "supplier gagal lalu direfund" dan "supplier berhasil lalu direfund sebagai itikad baik" jadi tak terbedakan.

## Buku besar

Tiga tabel yang **hanya boleh disentuh lewat satu kelas**:

| Tabel | Penulis tunggal | Menolak |
|---|---|---|
| `balance_mutations` | `WalletLedger` | saldo negatif |
| `point_ledger` | `PointLedger` | poin negatif |
| `platform_ledger` | `PlatformLedger` | — |

Ketiganya mengunci baris selama baca-ubah-tulis dan mencatat nilai sebelum/sesudah. Alasannya sama: laporan yang menunjukkan kredit refund tanpa debit pasangannya lebih buruk daripada tidak ada laporan sama sekali.

**Kunci keunikan yang menjaga "tepat sekali":** `point_ledger (transaction_id, type)` dan `refund_requests.transaction_id`. Pemeriksaan awal di dalam Action hanyalah jalur cepat — indeks itulah jaminannya.
