<?php

namespace App\Actions\Digiflazz;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Digiflazz\PayBillDTO;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Jobs\ProcessDigiflazzBillPayment;
use App\Models\Payment;
use App\Models\PaymentChannel;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\User;
use App\Services\Payment\MonetapayService;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PayDigiflazzBillAction
{
    public function __construct(
        private readonly DigiflazzService $digiflazzService,
        private readonly ProcessDigiflazzBillPaymentAction $billPaymentAction,
        private readonly CreateActivityLogAction $logAction,
        private readonly MonetapayService $monetapayService,
    ) {}

    public function execute(PayBillDTO $dto): array
    {
        // Generate identifiers before the DB transaction so we can use invoice_number
        // as the Digiflazz inquiry ref_id inside the transaction scope.
        $invoiceNumber = 'INV-' . date('Ymd') . '-' . strtoupper(Str::random(6));
        $referenceId   = 'PAY-' . $invoiceNumber . '-01';

        $paidTransaction = null;

        $result = DB::transaction(function () use ($dto, $invoiceNumber, $referenceId, &$paidTransaction) {

            $user    = $dto->userId ? User::with('role')->find($dto->userId) : null;
            $product = Product::with(['supplierProducts' => fn ($q) => $q->where('is_active', true)])
                ->findOrFail($dto->productId);
            $channel = PaymentChannel::where('is_active', true)->findOrFail($dto->paymentChannelId);

            $supplierProduct = $product->supplierProducts->first();
            if (!$supplierProduct) {
                throw new Exception('Produk postpaid tidak tersedia (tidak ada supplier aktif).');
            }

            if (!$user && $channel->channel_code === 'balance') {
                throw new Exception('Saldo internal hanya untuk member. Silakan login.');
            }
            if (!$user && empty($dto->guestContact)) {
                throw new Exception('Nomor WhatsApp/Kontak wajib diisi untuk pelanggan tamu.');
            }

            // Do a fresh inquiry to get the real bill amount.
            // Using the invoice_number as inquiry ref so Digiflazz can track it.
            $inquiry = $this->digiflazzService->checkBill(
                $supplierProduct->buyer_sku_code,
                $dto->customerNo,
                'INQ-' . $invoiceNumber
            );

            $totalBayar = (int) ($inquiry['total_bayar'] ?? 0);
            if ($totalBayar <= 0) {
                throw new Exception('Gagal mendapatkan tagihan dari Digiflazz. Pastikan nomor pelanggan benar.');
            }

            $adminFee    = $channel->fee_flat + (int) round($totalBayar * ($channel->fee_percent / 100));
            $grossAmount = $totalBayar + $adminFee;

            if ($grossAmount < $channel->min_amount) {
                throw new Exception(
                    'Total tagihan Rp ' . number_format($grossAmount) .
                    ' kurang dari minimum pembayaran Rp ' . number_format($channel->min_amount)
                );
            }

            $transaction = Transaction::create([
                'transaction_type'   => 'postpaid',
                'invoice_number'     => $invoiceNumber,
                'user_id'            => $user?->id,
                'payment_channel_id' => $channel->id,
                'guest_contact'      => $user ? null : $dto->guestContact,
                'product_id'         => $product->id,
                'supplier_id'        => $supplierProduct->supplier_id,
                'target_uid'         => $dto->customerNo,
                'target_server'      => null,
                'amount_base'        => $totalBayar,
                'amount_fee'         => $adminFee,
                'amount_total'       => $grossAmount,
                'margin'             => 0,
                'status'             => 'PENDING',
            ]);

            $payment = Payment::create([
                'transaction_id'     => $transaction->id,
                'payment_channel_id' => $channel->id,
                'reference_id'       => $referenceId,
                'gross_amount'       => $grossAmount,
                'admin_fee'          => $adminFee,
                'status'             => '1',
            ]);

            $paymentInstructions = null;
            $transactionStatus   = 'PENDING';

            if ($channel->channel_code === 'balance') {
                if ($user->balance < $grossAmount) {
                    throw new Exception('Saldo tidak mencukupi. Sisa saldo: Rp ' . number_format($user->balance));
                }

                $user->decrement('balance', $grossAmount);
                $payment->update(['status' => '3', 'paid_at' => now()]);

                $transaction = $this->billPaymentAction->execute($transaction);
                $transactionStatus = $transaction->status;

            } else {
                $monetapayResponse = $this->monetapayService->createTransaction(
                    referenceId:  $referenceId,
                    amount:       $grossAmount,
                    paymentType:  $channel->payment_type,
                    channelCode:  $channel->channel_code,
                    customerData: [
                        'customer_name'  => $user?->name  ?? 'Guest',
                        'customer_email' => $user?->email ?? 'guest@example.com',
                        'customer_phone' => $user?->phone ?? $dto->guestContact,
                    ]
                );

                $pgData = $monetapayResponse['data'] ?? [];
                $payment->update(['pg_transaction_id' => $pgData['order_no'] ?? null]);

                $paymentInstructions = array_filter([
                    'order_no'        => $pgData['order_no']       ?? null,
                    'qr_string'       => $pgData['qr_string']      ?? null,
                    'virtual_account' => $pgData['virtual_account'] ?? null,
                    'bank_code'       => $pgData['bank_code']       ?? null,
                ]);
            }

            $this->logAction->execute(new CreateActivityLogDTO(
                userId:    $user?->id,
                ipAddress: request()->ip(),
                userAgent: request()->userAgent(),
                message:   "Postpaid checkout {$invoiceNumber} — {$product->name}" . (!$user ? ' (Guest)' : ''),
            ));

            return [
                'invoice_number' => $invoiceNumber,
                'reference_id'   => $referenceId,
                'bill'           => [
                    'customer_name' => $inquiry['customer_name'] ?? null,
                    'period'        => $inquiry['period']        ?? null,
                    'nominal'       => $inquiry['nominal']       ?? null,
                ],
                'product'        => ['name' => $product->name],
                'payment'        => [
                    'channel'      => $channel->name,
                    'type'         => $channel->payment_type,
                    'amount'       => $grossAmount,
                    'admin_fee'    => $adminFee,
                    'status'       => $transactionStatus,
                    'instructions' => $paymentInstructions ?: null,
                ],
            ];
        });

        return $result;
    }
}
