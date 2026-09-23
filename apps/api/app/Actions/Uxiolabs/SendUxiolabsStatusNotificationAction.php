<?php

namespace App\Actions\Uxiolabs;

use App\Enums\TransactionStatus;
use App\Models\Transaction;
use App\Services\CustomerNumberFormatter;
use App\Services\DiscordWebhookService;
use Illuminate\Support\Facades\Cache;
use Throwable;

/**
 * The supplier half of the operational channel.
 *
 * Monetapay announced every payment it took, and fulfilment announced nothing
 * unless the supplier callback happened to fire — so the channel read "💳
 * Pembayaran Diterima" and then went silent, whether the customer got their
 * diamonds or the order died on the supplier's side. The callback is the
 * *unreliable* path (PollUxiolabsStatusJob exists precisely because of that),
 * which means the one path that reported was the one least likely to run.
 *
 * Every path that learns something from the supplier now reports it here:
 * order placement, the poll chain, the callback, the manual resend, and the
 * retries-exhausted case. `$source` says which one, because "the callback told
 * us" and "we had to go and ask" are different operational facts.
 *
 * **Deduped per transaction per outcome.** Poll and callback race by design —
 * both resolve the same order to COMPLETED, and both are meant to, since
 * either may be the one that survives. Announcing per writer would double
 * every fulfilment in the channel. The first observation wins and the rest are
 * silent; the window is long enough (24h) that a late callback redelivery does
 * not reopen it.
 */
class SendUxiolabsStatusNotificationAction
{
    /** Source labels — what learned the status, not what changed it. */
    public const SOURCE_ORDER = 'order';

    public const SOURCE_CALLBACK = 'callback';

    public const SOURCE_POLL = 'poll';

    public const SOURCE_MANUAL = 'manual';

    public const SOURCE_TIMEOUT = 'timeout';

    /**
     * Long enough that a supplier redelivering a callback hours later cannot
     * re-announce an order an operator has already read.
     */
    private const DEDUPE_HOURS = 24;

    public function __construct(
        private readonly DiscordWebhookService $discord,
        private readonly CustomerNumberFormatter $customerNumberFormatter,
    ) {}

    /**
     * The order reached the supplier and is now theirs to fulfil.
     *
     * This is the message that closes the gap after "Pembayaran Diterima": it
     * carries `supplier_trx_id`, which is the only key that opens the order on
     * the supplier's own dashboard and appears nowhere else an operator looks.
     * Its absence is itself the signal — a payment with no handoff behind it is
     * an order that never left.
     */
    public function handoff(Transaction $transaction): void
    {
        if (! $this->claim($transaction, 'handoff')) {
            return;
        }

        $this->discord->sendEmbed(
            '[UXIOLABS] 🚀 Order Diteruskan ke Supplier',
            [
                ['name' => '🧾 Invoice', 'value' => '`'.$transaction->invoice_number.'`', 'inline' => true],
                ['name' => '🛒 Produk', 'value' => $transaction->product?->name ?? '-', 'inline' => true],
                ['name' => '📱 Target', 'value' => '`'.$this->target($transaction).'`', 'inline' => true],
                ['name' => '🆔 ID Supplier', 'value' => $transaction->supplier_trx_id
                    ? '`'.$transaction->supplier_trx_id.'`'
                    : '*Belum diberikan supplier*', 'inline' => true],
                ['name' => '📦 Status Supplier', 'value' => '**'.strtoupper((string) ($transaction->supplier_status ?: 'pending')).'**', 'inline' => true],
            ],
            DiscordWebhookService::COLOR_BLUE,
        );
    }

    /**
     * The supplier moved the order, and `$source` is how we found out.
     *
     * Callers pass the transition they observed rather than re-reading the row:
     * by the time this runs the row already holds `$new`, so it cannot tell on
     * its own what it moved from.
     */
    public function statusChanged(
        Transaction $transaction,
        TransactionStatus $old,
        TransactionStatus $new,
        string $source,
    ): void {
        // A redelivered callback reporting the status it already reported is
        // not news. Guarded at every call site too, but repeated here because
        // this is the class that owns what the channel is worth reading for.
        if ($old === $new) {
            return;
        }

        if (! $this->claim($transaction, $new->value)) {
            return;
        }

        [$title, $color] = $this->presentation($new);

        $this->discord->sendEmbed(
            $title,
            [
                ['name' => '🧾 Invoice', 'value' => '`'.$transaction->invoice_number.'`', 'inline' => true],
                ['name' => '🛒 Produk', 'value' => $transaction->product?->name ?? '-', 'inline' => true],
                ['name' => '📱 Target', 'value' => '`'.$this->target($transaction).'`', 'inline' => true],
                ['name' => '📊 Status', 'value' => "~~{$old->value}~~ ➔ **{$new->value}**", 'inline' => false],
                ['name' => '🔑 Serial Number', 'value' => $transaction->sn ? '`'.$transaction->sn.'`' : '*Belum ada SN*', 'inline' => true],
                ['name' => '📡 Sumber', 'value' => $this->sourceLabel($source), 'inline' => true],
            ],
            $color,
        );
    }

    /**
     * @return array{0:string,1:int}
     */
    private function presentation(TransactionStatus $status): array
    {
        return match ($status) {
            TransactionStatus::COMPLETED => ['[UXIOLABS] ✅ Topup Berhasil', DiscordWebhookService::COLOR_GREEN],
            TransactionStatus::FAILED_PROVIDER => ['[UXIOLABS] ❌ Topup Gagal', DiscordWebhookService::COLOR_RED],
            TransactionStatus::REFUNDED => ['[UXIOLABS] ↩️ Topup Dikembalikan', DiscordWebhookService::COLOR_ORANGE],
            TransactionStatus::EXPIRED => ['[UXIOLABS] ⏱️ Topup Kedaluwarsa', DiscordWebhookService::COLOR_ORANGE],
            default => ['[UXIOLABS] 🔔 Update Transaksi Uxiolabs', DiscordWebhookService::COLOR_YELLOW],
        };
    }

    private function sourceLabel(string $source): string
    {
        return match ($source) {
            self::SOURCE_ORDER => 'Respons order',
            self::SOURCE_CALLBACK => 'Callback supplier',
            self::SOURCE_POLL => 'Polling status',
            self::SOURCE_MANUAL => 'Cek manual admin',
            self::SOURCE_TIMEOUT => 'Retry habis',
            default => $source,
        };
    }

    /**
     * Show what was actually sent to the supplier, composed by the same
     * formatter the fulfilment path uses — a second hand-rolled join here would
     * silently drift from the real target. The formatter is data-driven per
     * category and can throw on a malformed row; a notification must never be
     * the thing that fails an order that already succeeded.
     */
    private function target(Transaction $transaction): string
    {
        try {
            return $this->customerNumberFormatter->forTransaction($transaction);
        } catch (Throwable) {
            return $transaction->target_uid.($transaction->target_server ?? '');
        }
    }

    /**
     * First observer of this outcome wins.
     *
     * `Cache::add` is the atomic half: the poll chain and the callback can land
     * on the same transition in different workers at the same moment, and
     * exactly one of them must get through.
     */
    private function claim(Transaction $transaction, string $outcome): bool
    {
        return Cache::add(
            "uxiolabs-announced:{$transaction->id}:{$outcome}",
            true,
            now()->addHours(self::DEDUPE_HOURS),
        );
    }
}
