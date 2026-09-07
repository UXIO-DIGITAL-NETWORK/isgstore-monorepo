# channel-fees-hub-managed-banner — Biaya Channel jujur soal siapa pemiliknya

**Date:** 2026-08-28
**Author:** Claude

## What
Halaman **Biaya per Metode Pembayaran** sekarang tahu ketika jadwal biaya dimiliki Hub.
Saat `HUB_MANAGED_CHANNELS` aktif, halaman menampilkan banner penjelasan dan mematikan
seluruh input, tombol Status, dan tombol Simpan — tapi **hanya untuk baris yang benar-benar
disinkronkan Hub**. Sel Fee Gateway juga mulai menampilkan penanda ketika tarifnya menyimpang
dari kontrak Monetapay; data itu sudah dikirim API sejak lama tapi tidak pernah dirender.

## Why
Sebelumnya halaman ini tidak memberi petunjuk apa pun. `ChannelFeeController::update()`
menolak setiap field dengan 422 saat channel dikelola Hub, jadi alurnya adalah: pengguna
mengetik angka, klik Simpan, lalu ditolak — tanpa pernah bisa tahu sebelumnya.

Guard-nya juga terlalu luas. Master Hub hanya berisi kode yang ada di kontrak Monetapay,
sementara situs punya `balance` (dompet internal) dan `payment_link` yang tidak pernah dimiliki
Hub. Akibatnya biaya kedua channel itu **tidak bisa diubah di panel mana pun**. Kolom baru
`payment_channels.hub_managed` (ditulis oleh `hub:sync-channels`) mempersempit guard ke baris
yang memang akan tertimpa sinkronisasi.

## Files
- `src/features/finance/pages/ChannelFeePage.tsx` — banner `hub_managed`, `lockedFor(row)` per
  baris pada semua input + tombol Status + Simpan, penanda drift kontrak di sel Fee Gateway.
- `src/features/finance/services/finance.service.ts` — `channelMeta()` → `GET /v1/payment-internal/channels/meta`.
- `src/features/finance/hooks/useFinance.ts` — `useChannelMeta()`, cermin `useServicesMeta()`.
- `src/features/finance/types/finance.type.ts` — `ChannelMeta`; `ChannelFee` menambah
  `hub_managed`, `contract_mismatch`, `contract_expected`.
- `src/features/finance/tests/ChannelFeePage.test.tsx` — banner + terkunci, baris non-Hub tetap
  bisa diedit, penanda drift, dan deployment standalone tetap penuh.
- `src/features/finance/tests/finance.service.test.ts` — pin URL `channels`, `channels/meta`, `channels/{id}`.

Sisi API (`uxiotopup-api`): migrasi `add_hub_managed_to_payment_channels`,
`ChannelFeeController::channelMeta()`, dan guard `update()` yang kini per-channel.

## Verification
- `npx vitest run` — 34 file, 172 tes lulus.
- `npx tsc --noEmit -p tsconfig.app.json` — bersih.
- `npm run lint` — 0 error (3 warning React Compiler yang sudah ada sebelumnya).
- API: `php artisan test --filter=Hub` — termasuk kasus baru
  `a channel the hub does not own stays editable` dan `channel meta reports hub managed state`.
