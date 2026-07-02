<?php

namespace App\Actions\Checkout;

use App\Actions\Digiflazz\ProcessDigiflazzTransactionAction;
use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Checkout\CheckoutDTO;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\Payment;
use App\Models\PaymentChannel;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\User;
use App\Services\Payment\MonetapayService;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CheckoutAction
{
    public function __construct(
        private readonly ProcessDigiflazzTransactionAction $digiflazzAction,
        private readonly CreateActivityLogAction $logAction,
        private readonly MonetapayService $monetapayService
    ) {}

    public function execute(CheckoutDTO $dto): array
    {
        return DB::transaction(function () use ($dto) {

            // ── 1. Resolve entities ──────────────────────────────────────────
            $user = $dto->userId ? User::with('role')->find($dto->userId) : null;
            $product = Product::with([
                'supplierProducts' => fn ($q) => $q->where('is_active', true),
                'category',
                'subCategory',
            ])->findOrFail($dto->productId);
            $channel = PaymentChannel::where('is_active', true)->findOrFail($dto->paymentChannelId);

            // ── 2. Guest guards ──────────────────────────────────────────────
            if (! $user && $channel->channel_code === 'balance') {
                throw new Exception('Saldo internal hanya untuk member. Silakan login atau pilih metode pembayaran lain.');
            }
            if (! $user && empty($dto->guestContact)) {
                throw new Exception('Nomor WhatsApp/Kontak wajib diisi untuk pelanggan tamu.');
            }

            // ── 3. Role-based price ──────────────────────────────────────────
            $roleName = $user ? strtolower($user->role->name) : 'guest';
            $sellingPrice = match ($roleName) {
                'vip' => $product->price_vip,
                'reseller' => $product->price_reseller,
                'agent' => $product->price_agent,
                default => $product->price_member,
            };

            // ── 4. Supplier & margin guard ───────────────────────────────────
            $activeSupplier = $product->supplierProducts->first();
            if (! $activeSupplier) {
                throw new Exception('Produk sedang tidak tersedia (tidak ada supplier aktif).');
            }
            $margin = $sellingPrice - $activeSupplier->price;
            if ($margin < 0) {
                throw new Exception('Transaksi dibatalkan otomatis: harga modal supplier sedang naik.');
            }

            // ── 5. Fee & total ───────────────────────────────────────────────
            $adminFee = $channel->fee_flat + (int) round($sellingPrice * ($channel->fee_percent / 100));
            $grossAmount = $sellingPrice + $adminFee;

            if ($grossAmount < $channel->min_amount) {
                throw new Exception(
                    'Total tagihan Rp '.number_format($grossAmount).
                    ' kurang dari minimum pembayaran Rp '.number_format($channel->min_amount)
                );
            }

            // ── 6. Create Transaction & Payment records ──────────────────────
            $invoiceNumber = 'INV-'.date('Ymd').'-'.strtoupper(Str::random(6));
            $referenceId = 'PAY-'.$invoiceNumber.'-01';

            $transaction = Transaction::create([
                'transaction_type' => 'prepaid',
                'invoice_number' => $invoiceNumber,
                'user_id' => $user?->id,
                'payment_channel_id' => $channel->id,
                'guest_contact' => $user ? null : $dto->guestContact,
                'product_id' => $product->id,
                'supplier_id' => $activeSupplier->supplier_id,
                'target_uid' => $dto->targetUid,
                'target_server' => $dto->targetServer,
                'amount_base' => $sellingPrice,
                'amount_fee' => $adminFee,
                'amount_total' => $grossAmount,
                'margin' => $margin,
                'status' => 'PENDING',
            ]);

            $payment = Payment::create([
                'transaction_id' => $transaction->id,
                'payment_channel_id' => $channel->id,
                'reference_id' => $referenceId,
                'gross_amount' => $grossAmount,
                'admin_fee' => $adminFee,
                'status' => '1', // Pending
            ]);

            // ── 7. Execute payment ───────────────────────────────────────────
            $paymentInstructions = null;
            $transactionStatus = 'PENDING';

            if ($channel->channel_code === 'balance') {
                // ── Balance path ─────────────────────────────────────────────
                // Pessimistic lock: re-fetch the user row FOR UPDATE inside the
                // open transaction so concurrent balance checkouts serialize.
                // Without this, two requests could both read the same balance,
                // both pass the guard, and both decrement (TOCTOU double-spend).
                $user = User::whereKey($user->id)->lockForUpdate()->firstOrFail();

                if ($user->balance < $grossAmount) {
                    throw new Exception('Saldo tidak mencukupi. Sisa saldo: Rp '.number_format($user->balance));
                }

                $user->decrement('balance', $grossAmount);
                $payment->update(['status' => '3', 'paid_at' => now()]);

                $transaction = $this->digiflazzAction->execute($transaction);
                $transactionStatus = $transaction->status; // COMPLETED / PROCESSING / FAILED_PROVIDER

            } elseif ($channel->payment_type === 'payment_link') {
                // ── Payment Link path ────────────────────────────────────────
                $extra = $channel->extra_config ?? [];

                $plResponse = $this->monetapayService->createPaymentLink([
                    'mch_order_no' => $referenceId,
                    'amount' => (string) $grossAmount,
                    'currency' => 'IDR',
                    'regular_bank_codes' => $extra['regular_bank_codes'] ?? 'BNI',
                    'ewallet_bank_codes' => $extra['ewallet_bank_codes'] ?? 'DANA',
                    'qris_bank_code' => $extra['qris_bank_code'] ?? 'QRIS',
                    'terminal_type' => $extra['terminal_type'] ?? 'WAP',
                    'fixed_bank_code' => $extra['fixed_bank_code'] ?? '0',
                    'account_bank_code' => $extra['account_bank_code'] ?? '',
                    'sender_name' => $extra['sender_name'] ?? config('app.name'),
                    'account_name' => $user?->name ?? 'Guest',
                    'account_phone' => $user?->phone ?? $dto->guestContact ?? '',
                    'expire_seconds' => '36000',
                    'success_redirect_url' => config('services.monetapay.success_redirect_url'),
                    'failed_redirect_url' => config('services.monetapay.failed_redirect_url', ''),
                    'product_id' => (string) $product->id,
                    'product_name' => $product->name,
                    'product_category' => $product->category?->name ?? 'General',
                    'product_sub_category' => $product->subCategory?->name ?? '',
                    'product_description' => $product->name,
                    'product_price' => $sellingPrice,
                    'product_quantity' => 1,
                    'product_type' => 'PRODUCT',
                ]);

                if (($plResponse['code'] ?? -1) !== 0) {
                    throw new Exception('Payment Link creation failed: '.($plResponse['message'] ?? 'Unknown error'));
                }

                $plData = $plResponse['data'] ?? [];
                $payment->update(['pg_transaction_id' => (string) ($plData['id'] ?? null)]);
                $paymentInstructions = array_filter([
                    'order_no' => $plData['order_no'] ?? null,
                    'checkout_url' => $plData['checkout_url'] ?? null,
                ]);

            } else {
                // ── Monetapay path ───────────────────────────────────────────
                $monetapayResponse = $this->monetapayService->createTransaction(
                    referenceId: $referenceId,
                    amount: $grossAmount,
                    paymentType: $channel->payment_type,
                    channelCode: $channel->channel_code,
                    customerData: [
                        'customer_name' => $user?->name ?? 'Guest',
                        'customer_email' => $user?->email ?? 'guest@example.com',
                        'customer_phone' => $user?->phone ?? $dto->guestContact,
                        'is_single_use' => $channel->is_single_use ? '1' : '0',
                        'product_id' => (string) $product->id,
                        'product_name' => $product->name,
                        'product_price' => (string) $sellingPrice,
                        'product_category' => $product->category?->name ?? 'General',
                    ]
                );

                $pgData = $monetapayResponse['data'] ?? [];

                // Persist Monetapay's own transaction reference
                $payment->update(['pg_transaction_id' => $pgData['order_no'] ?? null]);

                // Build structured payment instructions for the client
                $paymentInstructions = array_filter([
                    'order_no' => $pgData['order_no'] ?? null,
                    'qr_string' => $pgData['qr_string'] ?? null,
                    'virtual_account' => $pgData['virtual_account'] ?? null,
                    'bank_code' => $pgData['bank_code'] ?? null,
                    'is_single_use' => $channel->payment_type === 'virtual_account'
                                            ? (bool) $channel->is_single_use
                                            : null,
                ]);
            }

            // ── 8. Activity log ──────────────────────────────────────────────
            $this->logAction->execute(new CreateActivityLogDTO(
                userId: $user?->id,
                ipAddress: request()->ip(),
                userAgent: request()->userAgent(),
                message: "Checkout {$invoiceNumber} — {$product->name}".(! $user ? ' (Guest)' : ''),
            ));

            // ── 9. Response ──────────────────────────────────────────────────
            return [
                'invoice_number' => $invoiceNumber,
                'reference_id' => $referenceId,
                'product' => [
                    'name' => $product->name,
                    'price' => $sellingPrice,
                ],
                'payment' => [
                    'channel' => $channel->name,
                    'type' => $channel->payment_type,
                    'amount' => $grossAmount,
                    'admin_fee' => $adminFee,
                    'status' => $transactionStatus,
                    'instructions' => $paymentInstructions ?: null,
                ],
            ];
        });
    }
}
