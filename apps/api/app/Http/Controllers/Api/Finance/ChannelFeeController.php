<?php

namespace App\Http\Controllers\Api\Finance;

use App\Http\Controllers\Controller;
use App\Models\PaymentChannel;
use App\Services\DiscordWebhookService;
use App\Support\Payment\MonetapayContractFees;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Payment-internal ("kita") manages the fee per payment method (biaya per
 * metode pembayaran). Only fee fields and the active toggle are editable here —
 * channel creation/deletion stays with the admin PaymentChannelController.
 */
class ChannelFeeController extends Controller
{
    use ApiResponse;

    /** One wording for the refusal and for the banner that prevents it. */
    private const MANAGED_NOTE = 'Channel dikelola di Hub. Ubah biaya, status aktif, dan minimum dari panel Hub — perubahan lokal akan tertimpa sinkronisasi.';

    public function __construct(private readonly DiscordWebhookService $discord) {}

    /**
     * Lets the panel find out it is a viewer BEFORE someone types a number and
     * is refused on save. Deliberately not behind the guard — the same reason
     * ServiceController::catalogMeta() is not behind `catalog-local`.
     */
    public function channelMeta()
    {
        $managed = $this->hubManaged();

        return $this->successResponse([
            'hub_managed' => $managed,
            'managed_note' => $managed ? self::MANAGED_NOTE : null,
        ], 'Channel meta');
    }

    public function index()
    {
        $channels = PaymentChannel::query()
            ->orderBy('payment_type')
            ->orderBy('name')
            ->get()
            ->map(fn (PaymentChannel $c) => $this->present($c));

        return $this->successResponse($channels, 'Channels retrieved successfully');
    }

    public function update(Request $request, PaymentChannel $paymentChannel)
    {
        $validated = $request->validate([
            'fee_flat' => ['sometimes', 'integer', 'min:0'],
            'fee_percent' => ['sometimes', 'numeric', 'between:0,100'],
            // The gateway's cut of each payment through this channel; subtracted
            // from the admin fee to leave kita's profit. Flat (Rp) for VA/retail,
            // percent for QRIS/e-wallet.
            'gateway_fee_flat' => ['sometimes', 'integer', 'min:0'],
            'gateway_fee_percent' => ['sometimes', 'numeric', 'between:0,100'],
            // PPN on the channel fee — kita's expense, netted from profit at
            // settlement (see SettleMerchantTransactionAction).
            'tax_percent' => ['sometimes', 'numeric', 'between:0,100'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        // Hub-managed channels: fee columns AND is_active/min_amount are all set
        // at the Hub (per site) and synced down, so any local edit would be
        // silently overwritten by the next hub:sync-channels. Scoped to the rows
        // the sync actually writes (`hub_managed`) — the Hub's master has no
        // `balance` or `payment_link`, and locking those would leave them
        // uneditable everywhere.
        if ($this->hubManaged() && $paymentChannel->hub_managed) {
            if ($validated !== []) {
                return $this->errorResponse(self::MANAGED_NOTE, 422);
            }
        }

        $paymentChannel->update($validated);

        // The gateway fee is the contract's, not ours to invent — a value that
        // drifts from Monetapay's schedule silently under/over-reports profit at
        // settlement. We do NOT block the save (the contract is "subject to
        // change", so finance must be able to follow a rate change first), but we
        // make the divergence loud: a log line + a Discord alert.
        $contract = $this->contractInfo($paymentChannel);
        if ($contract['mismatch']) {
            $expected = $contract['expected'];
            $detail = $expected === null
                ? "channel '{$paymentChannel->channel_code}' tidak ada di kontrak payment gateway"
                : "gateway fee {$paymentChannel->gateway_fee_flat}+{$paymentChannel->gateway_fee_percent}% "
                    ."≠ kontrak {$expected['gateway_fee_flat']}+{$expected['gateway_fee_percent']}%";

            Log::warning('Channel gateway fee diverges from Monetapay contract', [
                'channel_code' => $paymentChannel->channel_code,
                'gateway_fee_flat' => (int) $paymentChannel->gateway_fee_flat,
                'gateway_fee_percent' => (float) $paymentChannel->gateway_fee_percent,
                'contract_expected' => $expected,
            ]);
            // Keyed on the channel: saving the same one repeatedly while
            // tuning a fee is one divergence, not one per keystroke.
            $this->discord->sendAlertOnce(
                "channel-fee:{$paymentChannel->channel_code}",
                "Fee gateway '{$paymentChannel->name}' menyimpang dari kontrak payment gateway: {$detail}. "
                .'Pastikan ini disengaja (mengikuti perubahan tarif) — kalau tidak, profit akan salah hitung.'
            );
        }

        return $this->successResponse($this->present($paymentChannel), 'Biaya channel berhasil disimpan');
    }

    private function hubManaged(): bool
    {
        return (bool) config('services.hub.enabled') && (bool) config('services.hub.managed_channels');
    }

    /** One shape for both the list and the update response — never edited apart. */
    private function present(PaymentChannel $c): array
    {
        $contract = $this->contractInfo($c);

        return [
            'id' => $c->id,
            'name' => $c->name,
            'channel_code' => $c->channel_code,
            'payment_type' => $c->payment_type,
            'min_amount' => (int) $c->min_amount,
            'fee_flat' => (int) $c->fee_flat,
            'fee_percent' => (float) $c->fee_percent,
            'gateway_fee_flat' => (int) $c->gateway_fee_flat,
            'gateway_fee_percent' => (float) $c->gateway_fee_percent,
            'tax_percent' => (float) $c->tax_percent,
            'is_active' => (bool) $c->is_active,
            // Lets the finance UI flag a channel whose gateway fee no longer
            // matches Monetapay's contracted rate (or an unlisted channel).
            'contract_mismatch' => $contract['mismatch'],
            'contract_expected' => $contract['expected'],
        ];
    }

    /**
     * Compare a channel's configured gateway fee against the Monetapay contract.
     *
     * @return array{mismatch:bool, expected:array{gateway_fee_flat:int, gateway_fee_percent:float}|null}
     */
    private function contractInfo(PaymentChannel $c): array
    {
        if (! MonetapayContractFees::has($c->channel_code)) {
            // Unlisted channel: no contract row to check against.
            return ['mismatch' => true, 'expected' => null];
        }

        $expected = [
            'gateway_fee_flat' => (int) MonetapayContractFees::flatFor($c->channel_code),
            'gateway_fee_percent' => (float) MonetapayContractFees::percentFor($c->channel_code),
        ];

        $mismatch = (int) $c->gateway_fee_flat !== $expected['gateway_fee_flat']
            || abs((float) $c->gateway_fee_percent - $expected['gateway_fee_percent']) > 0.001;

        return ['mismatch' => $mismatch, 'expected' => $expected];
    }
}
