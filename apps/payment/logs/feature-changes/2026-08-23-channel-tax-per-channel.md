# channel-tax-per-channel — Pajak (PPN) per channel diterapkan sungguhan

**Date:** 2026-08-23
**Author:** Eka Nata

## What
Pajak (PPN) kini **setelan nyata per channel** yang benar-benar diterapkan pada
tiap transaksi, menggantikan pendekatan **simulasi** sebelumnya (yang sempat
di-commit hari ini lalu ditolak user). Di halaman **Biaya per Metode Pembayaran**:
- Kolom **Pajak (%)** per channel — bisa diedit & disimpan (tombol Simpan), default 11%.
- Kolom **Status** aktif/nonaktif diperjelas: badge + label teks "Aktif"/"Nonaktif",
  tersimpan bersama edit lain saat Simpan.
- Semua UI simulasi (input nominal, kolom Fee/Pajak/Untung, ringkasan total, helper
  `channelSimulation.ts`) dihapus.
- Dashboard finance menambah kartu **Total Pajak**; caption Saldo → "biaya admin −
  fee gateway − pajak".

Rumus (backend, dikonfirmasi user): `pajak = round(fee_channel × tax_percent/100)`,
dikenakan atas fee channel; **beban kita** → `untung = fee − fee_gateway − pajak`;
**tidak** menambah tagihan customer (`amount_total` tetap).

## Why
User menolak simulasi ("langsung terapkan pajak sesuai rumus"). Pajak harus
terhitung nyata di tiap transaksi dan tercermin di keuntungan & dashboard supaya
keuangan "stabil dan balance".

## Files — frontend (web-payment-fe)
- `src/features/finance/types/finance.type.ts` — `ChannelFee.tax_percent`, `FinanceDashboard.total_tax`.
- `src/features/finance/services/finance.service.ts` + `hooks/useFinance.ts` — payload `updateChannel` dapat `tax_percent`.
- `src/features/finance/pages/ChannelFeePage.tsx` — kolom Pajak (%), toggle status diperjelas, hapus semua UI simulasi.
- `src/features/finance/pages/FinanceDashboardPage.tsx` — kartu Total Pajak.
- Dihapus: `src/features/finance/lib/channelSimulation.ts` + `tests/channelSimulation.test.ts`.
- Tests: `tests/ChannelFeePage.test.tsx` (kolom Pajak simpan, toggle status), `tests/FinanceDashboardPage.test.tsx` (kartu Total Pajak).

## Files — backend (web-topup-api)
- Migrasi: `payment_channels.tax_percent` (default 11), `transactions.{tax_amount,tax_percent}`, `payments.{tax_amount,tax_percent}` (default 0).
- `app/Actions/Checkout/CheckoutAction.php` — hitung `taxAmount` (tak ubah `grossAmount`), simpan ke transaction & payment.
- `app/Actions/Settlement/SettleMerchantTransactionAction.php` — `platformProfit = adminFee − gatewayFee − taxAmount`.
- `app/Queries/UnifiedTransactionQuery.php` — `platform_profit` feed ikut kurangi `pay.tax_amount`.
- `app/Http/Controllers/Api/Finance/ChannelFeeController.php` — validasi + present `tax_percent`.
- `app/Http/Controllers/Api/Finance/FinanceDashboardController.php` — agregat `total_tax`.
- `database/factories/PaymentChannelFactory.php` — `tax_percent` default 0 (jaga test lama deterministik).
- Test: `tests/Feature/PaymentPage/ChannelTaxTest.php` (update tarif, checkout membekukan pajak, profit net pajak, dashboard total_tax).

## Verification
- Backend: `php artisan test` — 574 hijau (2116 assertions); `./vendor/bin/pint` passed.
- Frontend: `node node_modules/vitest/vitest.mjs run src/features/finance` — 12 file / 59 test hijau;
  `tsc -b` exit 0; `eslint src/features/finance` exit 0.
  (Shim `.bin` rusak di environment ini — jalankan entrypoint asli; lihat memory.)
- Manual: `php artisan migrate`; set Pajak QRIS 11% & Simpan; checkout QRIS 60.000 →
  `payments.tax_amount`=46, `amount_total`=60.420 (tanpa pajak); dashboard Total Pajak terisi;
  toggle nonaktif → channel hilang dari checkout.
