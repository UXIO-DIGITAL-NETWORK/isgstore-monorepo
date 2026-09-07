<?php

namespace App\Actions\Wallet;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\DTOs\Wallet\CreateTopupDTO;
use App\Models\BalanceTopup;
use App\Models\PaymentChannel;
use App\Models\User;
use App\Services\Payment\MonetapayService;
use App\Support\Money;
use Exception;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Creates a pending wallet top-up and opens the payment with Monetapay.
 *
 * The balance itself is **not** touched here — it moves only when the gateway
 * confirms payment, in `HandleMonetapayCallbackAction`. Crediting on creation
 * would hand out money for an unpaid invoice.
 *
 * The reference carries a `TOP-` prefix so the shared callback can tell a
 * wallet top-up from a product order without a database lookup.
 */
class CreateBalanceTopupAction
{
    public function __construct(
        private readonly MonetapayService $monetapayService,
        private readonly CreateActivityLogAction $activityLogAction,
    ) {}

    public function execute(CreateTopupDTO $dto): array
    {
        // Same duplicate-submit guard as checkout: a double-tap must not open
        // two payments for the same intent.
        $dedupeKey = 'topup:dedupe:'.md5("{$dto->userId}|{$dto->paymentChannelId}|{$dto->amount}");

        if (! Cache::add($dedupeKey, 1, 15)) {
            throw new Exception('Permintaan duplikat terdeteksi. Mohon tunggu beberapa detik sebelum mencoba lagi.');
        }

        try {
            return $this->process($dto);
        } catch (Exception $e) {
            Cache::forget($dedupeKey);
            throw $e;
        }
    }

    private function process(CreateTopupDTO $dto): array
    {
        $user = User::findOrFail($dto->userId);
        $channel = PaymentChannel::where('is_active', true)->findOrFail($dto->paymentChannelId);

        $feePercent = max(0, min(100, (float) $channel->fee_percent));
        $adminFee = (int) $channel->fee_flat + (int) round($dto->amount * ($feePercent / 100));
        $total = $dto->amount + $adminFee;

        if ($total < $channel->min_amount) {
            throw new Exception(
                'Total pembayaran '.Money::rupiah($total).
                ' kurang dari minimum '.Money::rupiah((int) $channel->min_amount)
            );
        }

        $referenceId = 'TOP-'.date('Ymd').'-'.strtoupper(Str::random(8));

        $topup = DB::transaction(fn () => BalanceTopup::create([
            'user_id' => $user->id,
            'payment_channel_id' => $channel->id,
            'reference_id' => $referenceId,
            'amount' => $dto->amount,
            'admin_fee' => $adminFee,
            'total' => $total,
            'status' => 'PENDING',
        ]));

        $response = $this->monetapayService->createTransaction(
            referenceId: $referenceId,
            amount: $total,
            paymentType: $channel->payment_type,
            channelCode: $channel->channel_code,
            customerData: [
                'customer_name' => $user->name,
                'customer_email' => $user->email,
                'customer_phone' => $user->phone,
                'is_single_use' => $channel->is_single_use ? '1' : '0',
                'product_id' => 'TOPUP',
                'product_name' => 'Isi Saldo',
                'product_price' => (string) $dto->amount,
                'product_category' => 'Wallet',
            ]
        );

        $pgData = $response['data'] ?? [];

        $instructions = array_filter([
            'order_no' => $pgData['order_no'] ?? null,
            'qr_string' => $pgData['qr_string'] ?? null,
            'virtual_account' => $pgData['virtual_account'] ?? null,
            'bank_code' => $pgData['bank_code'] ?? null,
        ], fn ($value) => $value !== null);

        // Persisted so a page refresh still shows the QR or VA number — the
        // same reason checkout stores them.
        $topup->update(['payment_data' => $instructions ?: null]);

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: $user->id,
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Membuka isi saldo Rp {$dto->amount} via {$channel->name}",
        ));

        return [
            'reference_id' => $referenceId,
            'amount' => $dto->amount,
            'admin_fee' => $adminFee,
            'total' => $total,
            'status' => 'PENDING',
            'payment' => [
                'channel' => $channel->name,
                'channel_code' => $channel->channel_code,
                'type' => $channel->payment_type,
                'instructions' => $instructions ?: null,
            ],
        ];
    }
}
