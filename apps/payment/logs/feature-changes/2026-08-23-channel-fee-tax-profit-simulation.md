# channel-fee-tax-profit-simulation — Kolom Pajak & Keuntungan di Biaya Channel

**Date:** 2026-08-23
**Author:** Eka Nata

## What
Halaman **Biaya per Metode Pembayaran** (`ChannelFeePage`) kini menampilkan tiga
kolom simulasi baru — **Fee (Rp)**, **Pajak (Rp)**, **Untung (Rp)** — plus
ringkasan **Total Fee / Total Pajak / Total Keuntungan Bersih** di bawah tabel.
Di atas tabel ada dua kontrol: **Nominal simulasi (Rp)** (default 60.000) dan
**Tarif Pajak / PPN (%)** (default 11). Karena fee persen berubah mengikuti
nominal, semua kolom dihitung ulang otomatis saat nominal, tarif pajak, atau
input fee/gateway baris diubah (memakai nilai draft, jadi berubah bahkan sebelum
Simpan). Ringkasan menjumlahkan hanya channel yang **aktif**.

Rumus (dikonfirmasi user):
- `fee = fee_flat + round(nominal × fee_percent/100)` (biaya admin channel)
- `gatewayFee = gateway_fee_flat + round((nominal + fee) × gateway_fee_percent/100)`
- `pajak = round(fee × tarif/100)` — PPN dikenakan **atas fee channel saja**
- `untung = fee − gatewayFee − pajak`

Contoh: bayar 60.000 via QRIS (0,7%/0,7%, PPN 11%) → fee 420, pajak 46, gateway
423, untung −49 (merah — mengungkap channel yang belum balance).

## Why
Tim finance perlu melihat beban pajak dan keuntungan bersih tiap channel dari
satu tempat agar konfigurasi fee "stabil dan balance". Pajak/keuntungan adalah
nilai **turunan**, jadi dihitung di UI sebagai pratinjau — **tidak disimpan** dan
tidak menyentuh backend. Ini bukan total riil dari transaksi (itu ranah
Dashboard); ini simulasi "1 transaksi per channel pada nominal simulasi".

## Files
- `src/features/finance/lib/channelSimulation.ts` — **baru**, helper murni
  `simulateChannel(ch, amount, taxRatePercent)` → `{ fee, gatewayFee, tax, profit }`;
  input non-finite/negatif di-clamp ke 0. Mirror pola `merchant/lib/adminFee.ts`
  dan fee math backend `CheckoutAction`.
- `src/features/finance/pages/ChannelFeePage.tsx` — state `amount`/`taxRate`,
  kontrol simulasi, 3 kolom computed, ringkasan total (data-testid `sim-total`).
- `src/features/finance/tests/channelSimulation.test.ts` — **baru**, math helper
  (contoh QRIS, channel flat, flat+persen, guard NaN).
- `src/features/finance/tests/ChannelFeePage.test.tsx` — fixture `qris`, tes
  kontrol simulasi, komputasi kolom, recompute saat nominal berubah, total pajak
  hanya channel aktif.

## Verification
- `node node_modules/vitest/vitest.mjs run src/features/finance` — 13 file, 63 test hijau.
  (Catatan: shim `node_modules/.bin/{vitest,tsc,eslint}` di environment ini rusak —
  jalankan entrypoint asli langsung, mis. `node node_modules/typescript/lib/tsc.js -b`.)
- `tsc -b` exit 0, `eslint src/features/finance` exit 0.
- Manual: buka Biaya Channel, set 60.000 / 11% → QRIS Fee Rp 420, Pajak Rp 46,
  Untung merah; ubah nominal → kolom & total ikut berubah; nonaktifkan channel →
  dikecualikan dari total.
