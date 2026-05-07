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
            // 1. Pengecekan User Opsional (Guest = null)
            $user = $dto->userId ? User::with('role')->find($dto->userId) : null;
            $product = Product::with(['supplierProducts' => fn($q) => $q->where('is_active', true)])
                ->findOrFail($dto->productId);
            $paymentMethod = PaymentMethod::findOrFail($dto->paymentMethodId);

            // Validasi Keamanan Guest
            if (!$user && $paymentMethod->code === 'balance') {
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

            // 3. Buat Invoice & Reference ID
            $invoiceNumber = 'INV-' . date('Ymd') . '-' . strtoupper(Str::random(6));
            $referenceId = 'PAY-' . $invoiceNumber . '-01';

            // Hitung Total Tagihan
            $adminFee = $paymentMethod->fee_flat + (intval($sellingPrice * ($paymentMethod->fee_percent / 100)));
            $grossAmount = $sellingPrice + $adminFee;

            // 4. Simpan Order (Mendukung Nullable User ID dan mengisi Guest Contact)
            $order = Order::create([
                'invoice_number' => $invoiceNumber,
                'user_id' => $user?->id,
                'guest_contact' => $user ? null : $dto->guestContact,
                'product_id' => $product->id,
                'supplier_id' => $activeSupplier->supplier_id,
                'target_uid' => $dto->targetUid,
                'target_server' => $dto->targetServer,
                'total_price' => $sellingPrice,
                'margin' => $margin,
                'status' => 'Pending',
            ]);

            // 5. Simpan Payment
            $payment = Payment::create([
                'order_id' => $order->id,
                'payment_method_id' => $paymentMethod->id,
                'reference_id' => $referenceId,
                'gross_amount' => $grossAmount,
                'admin_fee' => $adminFee,
                'status' => '1', // 1: Pending
            ]);

            // 6. EKSEKUSI PEMBAYARAN (Khusus Internal Balance)
            if ($paymentMethod->code === 'balance' && $user) {
                if ($user->balance < $grossAmount) {
                    throw new Exception("Saldo tidak mencukupi. Sisa saldo: Rp " . number_format($user->balance));
                }

                $user->decrement('balance', $grossAmount);

                $payment->update([
                    'status' => '3', // 3: Success
                    'paid_at' => now(),
                ]);

                // Tembak ke Digiflazz
                $order = $this->digiflazzAction->execute($order);
            }

            // Simpan ke sesi agar guest dapat di-redirect ke halaman sukses
            session()->put('last_order_invoice', $order->invoice_number);

            // Catat Log (Menggunakan user_id opsional)
            $this->logAction->execute(new CreateActivityLogDTO(
                userId: $user?->id,
                ipAddress: request()->ip(),
                userAgent: request()->userAgent(),
                message: "Membuat transaksi {$invoiceNumber} untuk produk {$product->name}" . (!$user ? " (Guest)" : "")
            ));

            return [
                'order' => $order->fresh(),
                'payment' => $payment
            ];
        });
    }
}
