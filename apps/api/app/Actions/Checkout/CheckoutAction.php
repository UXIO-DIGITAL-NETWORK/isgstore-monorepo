<?php

namespace App\Actions\Checkout;

use App\DTOs\Checkout\CheckoutDTO;
use App\Models\Product;
use App\Models\PaymentChannel;
use App\Models\Transaction;
use App\Models\Payment;
use App\Models\User;
use App\Actions\Digiflazz\ProcessDigiflazzTransactionAction;
use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Services\Payment\MonetapayService;
use Illuminate\Support\Facades\DB;
use Exception;
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
            // 1. Pengecekan User Opsional (Guest = null)
            $user = $dto->userId ? User::with('role')->find($dto->userId) : null;
            $product = Product::with(['supplierProducts' => fn($q) => $q->where('is_active', true)])
                ->findOrFail($dto->productId);
            $paymentChannel = PaymentChannel::where('is_active', true)->findOrFail($dto->paymentChannelId);

            // Validasi Keamanan Guest
            if (!$user && $paymentChannel->channel_code === 'balance') {
                throw new Exception("Saldo internal hanya untuk member. Silakan login atau pilih metode pembayaran E-Wallet/QRIS.");
            }

            // Validasi Kontak Guest (Pastikan DTO memiliki properti guestContact)
            if (!$user && empty($dto->guestContact)) {
                throw new Exception("Nomor WhatsApp/Kontak wajib diisi untuk pelanggan tamu.");
            }

            // 2. Tentukan Harga Jual (Guest mendapat harga standar member)
            $roleName = $user ? strtolower($user->role->name) : 'guest';
            $sellingPrice = match ($roleName) {
                'vip' => $product->price_vip,
                'reseller' => $product->price_reseller,
                'agent' => $product->price_agent,
                default => $product->price_member,
            };

            // Hitung Margin
            $activeSupplier = $product->supplierProducts->first();
            if (!$activeSupplier) {
                throw new Exception("Produk sedang tidak tersedia (Tidak ada supplier aktif).");
            }
            $margin = $sellingPrice - $activeSupplier->price;

            // FAIL-SAFE: Jangan proses jika margin minus
            if ($margin < 0) {
                throw new Exception("Transaksi dibatalkan otomatis: Harga modal supplier sedang naik.");
            }

            // fee_flat / fee_percent columns are not on payment_channels; extend here when the schema adds them
            $adminFee    = 0;
            $grossAmount = $sellingPrice + $adminFee;

            if ($grossAmount < $paymentChannel->min_amount) {
                throw new Exception("Total tagihan Rp " . number_format($grossAmount) . " kurang dari minimum pembayaran Rp " . number_format($paymentChannel->min_amount));
            }

            // 3. Buat Invoice & Reference ID
            $invoiceNumber = 'INV-' . date('Ymd') . '-' . strtoupper(Str::random(6));
            $referenceId = 'PAY-' . $invoiceNumber . '-01';

            // 4. Simpan Transaction (Mendukung Nullable User ID dan mengisi Guest Contact)
            $transaction = Transaction::create([
                'invoice_number' => $invoiceNumber,
                'user_id' => $user?->id,
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

            // 5. Simpan Payment
            $payment = Payment::create([
                'transaction_id' => $transaction->id,
                'payment_channel_id' => $paymentChannel->id,
                'reference_id' => $referenceId,
                'gross_amount' => $grossAmount,
                'admin_fee' => $adminFee,
                'status' => '1', // 1: Pending
            ]);

            $actionData = null;

            // 6. EKSEKUSI PEMBAYARAN
            if ($paymentChannel->channel_code === 'balance' && $user) {
                if ($user->balance < $grossAmount) {
                    throw new Exception("Saldo tidak mencukupi. Sisa saldo: Rp " . number_format($user->balance));
                }

                $user->decrement('balance', $grossAmount);

                $payment->update([
                    'status' => '3', // 3: Success
                    'paid_at' => now(),
                ]);

                // Tembak ke Digiflazz
                $transaction = $this->digiflazzAction->execute($transaction);
            } else {
                // Hit Monetapay
                $monetapayResponse = $this->monetapayService->createTransaction(
                    referenceId: $referenceId,
                    amount: $grossAmount,
                    paymentType: $paymentChannel->payment_type,
                    channelCode: $paymentChannel->channel_code,
                    customerData: [
                        'customer_name' => $user ? $user->name : 'Guest',
                        'customer_email' => $user ? $user->email : 'guest@example.com',
                        'customer_phone' => $user ? $user->phone : $dto->guestContact,
                    ]
                );

                $actionData = $monetapayResponse['data'] ?? [];
            }

            // Catat Log
            $this->logAction->execute(new CreateActivityLogDTO(
                userId: $user?->id,
                ipAddress: request()->ip(),
                userAgent: request()->userAgent(),
                message: "Membuat transaksi {$invoiceNumber} untuk produk {$product->name}" . (!$user ? " (Guest)" : "")
            ));

            return [
                'invoice_number' => $transaction->invoice_number,
                'payment_type' => $paymentChannel->payment_type,
                'action_data' => $actionData,
            ];
        });
    }
}
