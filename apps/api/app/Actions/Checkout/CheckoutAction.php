<?php

namespace App\Actions\Checkout;

use App\DTOs\Checkout\CheckoutDTO;
use App\Models\Product;
use App\Models\PaymentMethod;
use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use App\Actions\Digiflazz\ProcessDigiflazzTransactionAction;
use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use Illuminate\Support\Facades\DB;
use Exception;
use Illuminate\Support\Str;

class CheckoutAction
{
    public function __construct(
        private readonly ProcessDigiflazzTransactionAction $digiflazzAction,
        private readonly CreateActivityLogAction $logAction
    ) {}

    public function execute(CheckoutDTO $dto): array
    {
        return DB::transaction(function () use ($dto) {
            $user = User::with('role')->findOrFail($dto->userId);
            $product = Product::with(['supplierProducts' => fn($q) => $q->where('is_active', true)])
                ->findOrFail($dto->productId);
            $paymentMethod = PaymentMethod::findOrFail($dto->paymentMethodId);

            // 1. Tentukan Harga Jual berdasarkan Role User
            $sellingPrice = match (strtolower($user->role->name)) {
                'vip' => $product->price_vip,
                'reseller' => $product->price_reseller,
                'agent' => $product->price_agent,
                default => $product->price_member,
            };

            // Hitung Margin (Harga Jual - Harga Modal/Harga Provider saat ini)
            $activeSupplier = $product->supplierProducts->first();
            if (!$activeSupplier) {
                throw new Exception("Produk sedang tidak tersedia (Tidak ada supplier aktif).");
            }
            $margin = $sellingPrice - $activeSupplier->price;

            // FAIL-SAFE: Jangan proses jika margin minus (harga modal tiba-tiba lebih mahal dari harga jual)
            if ($margin < 0) {
                throw new Exception("Transaksi dibatalkan otomatis: Harga modal supplier sedang naik.");
            }

            // 2. Buat Invoice & Reference ID
            $invoiceNumber = 'INV-' . date('Ymd') . '-' . strtoupper(Str::random(6));
            $referenceId = 'PAY-' . $invoiceNumber . '-01';

            // Hitung Total Tagihan
            $adminFee = $paymentMethod->fee_flat + (intval($sellingPrice * ($paymentMethod->fee_percent / 100)));
            $grossAmount = $sellingPrice + $adminFee;

            // 3. Simpan Order
            $order = Order::create([
                'invoice_number' => $invoiceNumber,
                'user_id' => $user->id,
                'product_id' => $product->id,
                'supplier_id' => $activeSupplier->supplier_id,
                'target_uid' => $dto->targetUid,
                'target_server' => $dto->targetServer,
                'total_price' => $sellingPrice,
                'margin' => $margin,
                'status' => 'Pending',
            ]);

            // 4. Simpan Payment
            $payment = Payment::create([
                'order_id' => $order->id,
                'payment_method_id' => $paymentMethod->id,
                'reference_id' => $referenceId,
                'gross_amount' => $grossAmount,
                'admin_fee' => $adminFee,
                'status' => '1', // 1: Pending
            ]);

            // 5. EKSEKUSI PEMBAYARAN (Khusus Internal Balance / Saldo Akun)
            // PERBAIKAN: Menggunakan kolom 'code' bernilai 'balance'
            if ($paymentMethod->code === 'balance') {
                if ($user->balance < $grossAmount) {
                    throw new Exception("Saldo tidak mencukupi. Sisa saldo: Rp " . number_format($user->balance));
                }

                // Potong Saldo
                $user->decrement('balance', $grossAmount);

                // Update Status Payment
                $payment->update([
                    'status' => '3', // 3: Success
                    'paid_at' => now(),
                ]);

                // TEMBAK KE DIGIFLAZZ (Hanya jika payment success)
                $order = $this->digiflazzAction->execute($order);
            }

            // Catat Log
            $this->logAction->execute(new CreateActivityLogDTO(
                userId: $user->id,
                ipAddress: request()->ip(),
                userAgent: request()->userAgent(),
                message: "Membuat transaksi {$invoiceNumber} untuk produk {$product->name}"
            ));

            return [
                // PERBAIKAN: Gunakan fresh() agar API merespons dengan status terbaru dari Digiflazz
                'order' => $order->fresh(),
                'payment' => $payment
            ];
        });
    }
}
