# saldo-tertahan — kartu Saldo Tertahan di dashboard klien

**Date:** 2026-08-27
**Author:** Claude Code

## What
Dashboard klien kini menampilkan tiga angka saldo: Saldo Aktif (bisa ditarik),
Saldo Pending (menunggu persetujuan penarikan), dan **Saldo Tertahan** — hasil
penjualan yang masih di dalam masa tahan penarikan (settlement channel T+n +
penyangga fraud 1 hari; VA H+1, QRIS H+2, OVO/ShopeePay H+3, retail H+4).

## Why
API memberlakukan masa tahan penarikan per-channel (Fase 0 brief Hub). Tanpa
kartu ketiga, penjualan yang baru dibayar terbaca sebagai "uang hilang" dan
menjadi keluhan support pertama.

## Files
- `src/features/merchant/types/merchant.type.ts` — `saldo_tertahan: number`.
- `src/features/merchant/pages/MerchantDashboardPage.tsx` — StatCard baru.
- `src/features/merchant/tests/MerchantDashboardPage.test.tsx` — fixture + assert.

## Verification
`npm run test` 165 hijau; `tsc -b` bersih. Angka berasal dari
`MerchantBalance::heldSalesTotal` di API (dipin oleh WithdrawalHoldingPeriodTest).
