# withdrawal-monetapay-disbursement — Payout otomatis via Monetapay

**Date:** 2026-08-19
**Author:** Eka Nata

## What
Approval penarikan oleh Internal Finance kini langsung memicu **disbursement
Monetapay** — tidak lagi upload bukti transfer manual. Client mengajukan
penarikan (kini menyertakan **No. HP Penerima** yang diwajibkan Monetapay), kita
verifikasi lalu klik **Setujui**; row berpindah ke `PROCESSING` dan diselesaikan
secara asinkron menjadi `SETTLED`/`FAILED` lewat webhook gateway. Kedua sisi
melakukan polling selama masih ada payout berjalan.

## Why
Sebelumnya settlement dilakukan di luar sistem: kita mengunggah bukti transfer
dan menandai `SETTLED` secara manual. Menghubungkan approval langsung ke
Monetapay menghapus langkah manual itu sehingga uang otomatis masuk ke rekening
client begitu disetujui.

Batas arsitektur: `partner_key`, enkripsi `en_data`, dan `sign` sepenuhnya di
backend (`web-topup-api`). Frontend hanya mengirim `method=monetapay` saat
approve dan menampilkan hasil async — tidak pernah menyentuh kredensial gateway.

## Files
- `src/types/withdrawal.type.ts` — `Withdrawal` dapat `account_phone` +
  `failure_reason`; `CreateWithdrawalPayload` dapat `account_phone`.
- `src/features/merchant/schemas/withdrawal.schema.ts` — validasi `account_phone`
  (format HP Indonesia).
- `src/features/merchant/pages/MerchantWithdrawalsPage.tsx` — input "No. HP
  Penerima".
- `src/features/merchant/hooks/useMerchant.ts` — `useMerchantWithdrawals` polling
  selama ada row `PENDING`/`PROCESSING`.
- `src/features/finance/services/finance.service.ts` — `approve(id)` kirim
  `method: "monetapay"` (JSON, tanpa proof/multipart).
- `src/features/finance/hooks/useFinance.ts` — `useApproveWithdrawal({ id })`,
  toast "diproses ke Monetapay"; `useFinanceWithdrawals` polling saat ada
  `PROCESSING`.
- `src/features/finance/components/ApproveWithdrawalDialog.tsx` — **baru**, dialog
  konfirmasi payout (menggantikan `SettleWithdrawalDialog`).
- `src/features/finance/pages/FinanceWithdrawalsPage.tsx` — kolom Aksi per status
  (`PROCESSING` → "Memproses…", `SETTLED` → `disbursement_ref`, `FAILED` →
  `failure_reason`).
- Dihapus: `SettleWithdrawalDialog.tsx`, `schemas/settleWithdrawal.schema.ts`.
- Tests: `MerchantWithdrawalsPage.test.tsx`, `merchant.service.test.ts`,
  `FinanceWithdrawalsPage.test.tsx`, `ApproveWithdrawalDialog.test.tsx` (baru).

## Kontrak backend (diasumsikan — konfirmasi saat integrasi)
- `POST /v1/payment-admin/withdrawals` menerima `account_phone`.
- `POST /v1/payment-internal/withdrawals/{id}/approve` body `method=monetapay`
  → menyusun & mengirim disbursement Monetapay; balikan `PROCESSING` +
  `disbursement_ref`; webhook memutakhirkan `SETTLED`/`FAILED` (+ `failure_reason`).
- `amount` Monetapay = `nett` (fee milik kita); kode bank `BANK_CODES` harus cocok
  dengan katalog Monetapay.

## Verification
- `npx vitest run` — 30 file, 138 test hijau.
- `tsc -b` bersih untuk file terkait (error `qrcode` yang tersisa hanya
  dependency belum terpasang, tidak berhubungan; sudah di-`npm install`).
- Manual (dua peran): client ajukan penarikan dengan No. HP → `PENDING`; finance
  Setujui → konfirmasi Monetapay → `PROCESSING` → (webhook) `SETTLED` dengan
  `disbursement_ref` atau `FAILED` dengan `failure_reason`. Tidak ada lagi prompt
  upload bukti.
