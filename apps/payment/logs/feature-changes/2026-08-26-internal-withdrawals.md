# internal-withdrawals — Penarikan Internal (payment-internal)

**Date:** 2026-08-26
**Author:** Claude Code

## What
Halaman baru "Penarikan Internal" khusus `payment-internal`: kita bisa membuat
penarikan sendiri (rekening/nomor telepon diisi bebas, tidak terikat merchant)
dan memverifikasinya sendiri — skema sama seperti penarikan merchant, di tabel
`withdrawals` yang sama, dengan `merchant_id` null dan `requested_by` menandai
siapa yang mengajukan. "Verifikasi Penarikan" lama tidak berubah (tetap
merchant-only via filter `type=merchant` default di backend).

Saldo yang menjadi batas penarikan ("Saldo Platform Tersedia") dihitung dari
akumulasi `platform_mutations` (`markup` dari margin transaksi, `withdrawal_fee`
dari fee penarikan merchant, dan `service_revenue` — tipe baru untuk revenue
langganan/service invoice, yang sebelumnya belum pernah dibukukan) dikurangi
penarikan internal yang masih berjalan/selesai.

Dialog approve finance kini juga mendukung jalur manual (transfer di luar
Monetapay + upload bukti via `ImageDropzone`), sebelumnya hanya Monetapay.

## Why
Tim finance internal butuh cara menarik profit platform sendiri tanpa
memerlukan akun merchant palsu, dengan jejak audit dan alur approval yang sama
seperti penarikan client.

## Files (frontend)
- `src/constants/bankCodes.ts`, `src/components/common/BankCombobox.tsx`,
  `src/lib/withdrawalFee.ts` — dipromosikan dari fitur `merchant` (feature
  isolation) agar bisa dipakai fitur `finance` juga.
- `src/types/withdrawal.type.ts` — `Withdrawal.merchant`/`requester` nullable,
  `CreateInternalWithdrawalPayload` baru.
- `src/features/finance/schemas/internalWithdrawal.schema.ts` — baru.
- `src/features/finance/services/finance.service.ts` —
  `createInternalWithdrawal`, `platformBalance`, `approve` mendukung
  `method`/`proof` (multipart saat ada proof).
- `src/features/finance/hooks/useFinance.ts` — `usePlatformBalance`,
  `useCreateInternalWithdrawal`, `useApproveWithdrawal` diperluas.
- `src/features/finance/components/ApproveWithdrawalDialog.tsx` — prop
  `allowManual` (default `false`, halaman lama tidak berubah).
- `src/features/finance/pages/InternalWithdrawalsPage.tsx` — baru.
- `src/routes/app/_protected/payment-internal/internal-withdrawals/index.tsx` —
  baru.
- `src/features/dashboard/components/DashboardSidebar.tsx` — menu "Penarikan
  Internal".
- Tests: `InternalWithdrawalsPage.test.tsx` (baru), `finance.service.test.ts`,
  `ApproveWithdrawalDialog.test.tsx`, `FinanceWithdrawalsPage.test.tsx`.

## Files (backend — `uxiotopup-api`)
- Migration `2026_08_26_000001_allow_internal_withdrawals.php` — `merchant_id`
  nullable, `requested_by` baru.
- `App\Support\Wallet\PlatformBalance`, `App\Support\Ledger\ServiceRevenueLedger`
  (+ dipanggil dari `HandleMonetapayCallbackAction` dan
  `ConfirmServiceInvoiceAction`), `App\Support\Withdrawal\WithdrawalFeeCalculator`
  (ekstraksi dari `CreateWithdrawalRequestAction`) — baru.
- `CreateInternalWithdrawalDTO`, `StoreInternalWithdrawalRequest`,
  `CreateInternalWithdrawalRequestAction` — baru.
- `FinanceWithdrawalController` — `store`, `platformBalance`, filter `type`
  (`merchant` default | `internal` | `all`) di `index`.
- `WithdrawalResource` — null-guard `merchant`, blok `requester` baru.
- `Withdrawal` model — relasi `requester()`.
- `WithdrawalStatusUpdated` — tidak broadcast ke channel merchant saat
  `merchant_id` null.
- Tests: `InternalWithdrawalTest.php` (baru),
  `ServiceInvoiceWebhookTest.php`/`ServiceInvoicePaymentTest.php` (assert
  `service_revenue` dibukukan sekali).

## Verification
- Frontend: `npx tsc -b` bersih, `npm run lint` 0 error, `npm run test` — 34
  file, 164 test hijau.
- Backend: `php -l` bersih di semua file baru/ubahan, `./vendor/bin/pint`
  bersih, `php artisan route:list` menampilkan route baru dengan benar.
- **Belum dijalankan**: `composer run test` di `uxiotopup-api` — sandbox ini
  tidak punya akses DB (MySQL butuh kredensial root yang tidak tersedia, PDO
  SQLite tidak terpasang). Test baru (`InternalWithdrawalTest.php` dan
  penambahan di `ServiceInvoiceWebhookTest.php`/`ServiceInvoicePaymentTest.php`)
  perlu dijalankan di environment dengan akses DB sebelum merge.
