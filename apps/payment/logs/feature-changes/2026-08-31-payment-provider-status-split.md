# payment-provider-status-split — Pembayaran dan Provider jadi dua kolom

**Date:** 2026-08-31
**Author:** you

## What

Kolom **Status** tunggal di halaman Transaksi (tampilan merchant dan internal)
diganti dua kolom: **Pembayaran** dan **Provider**. Keduanya membaca field baru
`payment_status` dan `provider_status` dari feed, dengan turunan dari `status`
sebagai fallback.

`src/lib/transactionStatus.ts` (baru) memegang seluruh kosakata: label untuk
kedua siklus, dua audiens, plus `resolvePaymentStatus`/`resolveProviderStatus`
yang menurunkan nilainya kalau API belum mengirimnya.

`StatusBadge` dapat prop `label?` opsional yang default-nya status mentah —
14 halaman lain yang memakainya tidak berubah sama sekali. Dua badge tipis di
`TransactionStatusBadges.tsx` merender lewatnya.

## Why

- **Halaman ini mencetak string enum mentah ke merchant.** Seorang klien benar-benar
  membaca tulisan `FAILED_PROVIDER` dan `PROCESSING` di tabelnya. `StatusBadge`
  merender `{status}` apa adanya dan tidak punya kamus label sama sekali.
- **Status gateway tidak pernah sampai ke halaman ini.** `UnifiedTransactionQuery`
  hanya memilih `transactions.status`; `payments` cuma di-join saat angka platform
  diminta. Jadi merchant tidak punya cara melihat apakah pelanggannya sudah bayar.
- **Kosakata dibedakan per audiens.** Merchant melihat lipatan empat nilai;
  tampilan internal melihat kedelapan-delapannya. Merchant yang membaca "Belum
  Terkonfirmasi" hanya akan membuka tiket — itu mekanika fulfilment kita, dan
  kita yang harus mengejarnya.
- **Baris tagihan layanan tidak punya provider.** Em-dash di kolom Provider itu
  fakta, bukan data hilang. Tapi `si.status` memang siklus pembayarannya sendiri,
  jadi kolom Pembayaran tetap terisi.

## Files

- `src/lib/transactionStatus.ts` + `.test.ts` (baru)
- `src/components/common/TransactionStatusBadges.tsx` (baru)
- `src/components/common/StatusBadge.tsx` — prop `label?` opsional + tone untuk kosakata baru
- `src/types/transaction.type.ts` — `PaymentLifecycle`, `ProviderLifecycle`, dua field opsional
- `src/features/{merchant,finance}/pages/*TransactionsPage.tsx`
- `src/features/{merchant,finance}/tests/*TransactionsPage.test.tsx`

## Verification

- [x] Test-first: `transactionStatus.test.ts` ditulis merah sebelum implementasinya
- [x] `npm run test` — 204 passed (37 file), naik dari 185
- [x] `npx tsc -b --force` bersih
- [x] `npm run lint` — 0 error (3 warning `react-hooks/incompatible-library` yang sudah ada)
- [x] Token saja; tidak ada warna baru di luar success/warning/destructive/muted

## Notes

- Berjalan benar melawan API yang belum merilis pemisahan ini: kedua field
  opsional dan diturunkan dari `status` bila absen. Pembeda untuk baris layanan
  adalah `type`, bukan `status` — `PAID` berarti "tagihan lunas" di satu leg dan
  "sudah bayar, menunggu supplier" di leg lain.
- Filter `status_group` dan pill ringkasan sengaja tidak diubah: keduanya bekerja
  lintas dua kosakata dan perilakunya dipatok `UnifiedTransactionListTest` di API.
  Memecahnya jadi dua filter adalah pekerjaan lanjutan.
