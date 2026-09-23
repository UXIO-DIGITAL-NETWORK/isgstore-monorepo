<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Enums\ServiceInvoiceStatus;
use App\Enums\WithdrawalStatus;
use App\Models\BalanceTopup;
use App\Models\ServiceInvoice;
use App\Models\Transaction;
use App\Models\Withdrawal;
use App\Services\DiscordWebhookService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\Middleware\RateLimited;
use Illuminate\Queue\SerializesModels;

/**
 * The one door to the operational Discord channel for this site's own activity.
 *
 * A job rather than a direct `sendEmbed()` call, for two reasons. It moves the
 * HTTP off the customer's request — the events that matter most (a checkout
 * being created, an AJAX round-trip) are on the payment page, and nobody should
 * wait on Discord to buy something. And it gives the throttle a place to live:
 * Discord allows roughly thirty messages a minute per webhook, so a burst is
 * smoothed by the worker instead of being turned into 429s and dropped.
 *
 * Rendering lives in the static factories below, so no call site has to know
 * which emoji, colour or field set an event wears. Adding an event means adding
 * one factory; nothing else changes.
 *
 * Never fatal: the service behind it swallows every failure, so a dead webhook
 * cannot fail a sale.
 */
class SendDiscordActivityJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $backoff = 30;

    /**
     * @param  array<int,array{name:string,value:string,inline?:bool}>  $fields
     */
    public function __construct(
        private readonly string $title,
        private readonly array $fields = [],
        private readonly int $color = DiscordWebhookService::COLOR_BLUE,
    ) {}

    public function middleware(): array
    {
        return [new RateLimited('discord')];
    }

    public function handle(DiscordWebhookService $discord): void
    {
        $discord->sendEmbed($this->title, $this->fields, $this->color);
    }

    // ── Transaksi ────────────────────────────────────────────────────────────
    // The payment RECEIVED/EXPIRED pair already notifies from the Monetapay
    // callback. These are the lifecycle facts it does not: that an order was
    // opened, that the supplier gave up on it, that the money went back.

    public static function transactionCreated(Transaction $transaction): void
    {
        self::dispatch('[TRANSAKSI] 🛒 Dibuat', self::transactionFields($transaction), DiscordWebhookService::COLOR_BLUE);
    }

    public static function transactionFailed(Transaction $transaction): void
    {
        self::dispatch('[TRANSAKSI] 🚨 Gagal', self::transactionFields($transaction), DiscordWebhookService::COLOR_RED);
    }

    public static function transactionRefunded(Transaction $transaction): void
    {
        self::dispatch('[TRANSAKSI] ↩️ Refund', self::transactionFields($transaction), DiscordWebhookService::COLOR_ORANGE);
    }

    // ── Saldo ────────────────────────────────────────────────────────────────

    public static function topupCreated(BalanceTopup $topup): void
    {
        self::dispatch('[SALDO] 💳 Top Up Dibuat', [
            ['name' => '🧾 Referensi', 'value' => '`'.$topup->reference_id.'`', 'inline' => true],
            ['name' => '👤 User', 'value' => $topup->user?->name ?? "User #{$topup->user_id}", 'inline' => true],
            ['name' => '💳 Channel', 'value' => $topup->paymentChannel?->name ?? '-', 'inline' => true],
            ['name' => '💰 Nominal', 'value' => 'Rp '.number_format((int) $topup->amount), 'inline' => true],
            ['name' => '📊 Status', 'value' => '**PENDING**', 'inline' => false],
        ], DiscordWebhookService::COLOR_BLUE);
    }

    // ── Layanan ──────────────────────────────────────────────────────────────

    public static function serviceInvoiceCreated(ServiceInvoice $invoice): void
    {
        self::dispatch('[LAYANAN] 📄 Invoice Dibuat', self::serviceInvoiceFields($invoice), DiscordWebhookService::COLOR_BLUE);
    }

    /** A bill the client may pay again — refused or withdrawn before payment. */
    public static function serviceInvoiceClosed(ServiceInvoice $invoice): void
    {
        $verb = $invoice->status === ServiceInvoiceStatus::CANCELLED ? 'Dibatalkan' : 'Ditolak';

        self::dispatch('[LAYANAN] 📄 Invoice '.$verb, self::serviceInvoiceFields($invoice), DiscordWebhookService::COLOR_ORANGE);
    }

    // ── Penarikan ────────────────────────────────────────────────────────────

    public static function withdrawalCreated(Withdrawal $withdrawal): void
    {
        self::dispatch('[PENARIKAN] 🏧 Diajukan', self::withdrawalFields($withdrawal), DiscordWebhookService::COLOR_BLUE);
    }

    public static function withdrawalStatusChanged(Withdrawal $withdrawal): void
    {
        [$title, $color] = match ($withdrawal->status) {
            WithdrawalStatus::SETTLED => ['[PENARIKAN] 🏧 Cair', DiscordWebhookService::COLOR_GREEN],
            WithdrawalStatus::REJECTED => ['[PENARIKAN] 🏧 Ditolak', DiscordWebhookService::COLOR_RED],
            WithdrawalStatus::FAILED => ['[PENARIKAN] 🏧 Gagal', DiscordWebhookService::COLOR_RED],
            WithdrawalStatus::APPROVED => ['[PENARIKAN] 🏧 Disetujui', DiscordWebhookService::COLOR_BLUE],
            WithdrawalStatus::PROCESSING => ['[PENARIKAN] 🏧 Diproses', DiscordWebhookService::COLOR_BLUE],
            default => ['[PENARIKAN] 🏧 '.($withdrawal->status?->value ?? '-'), DiscordWebhookService::COLOR_BLUE],
        };

        self::dispatch($title, self::withdrawalFields($withdrawal), $color);
    }

    // ── Lisensi ──────────────────────────────────────────────────────────────

    /** A licence payment was handed to the Hub, which owns the term. */
    public static function licenceReported(ServiceInvoice $invoice): void
    {
        self::dispatch('[LISENSI] 🔑 Dilaporkan ke Hub', [
            ['name' => '🧾 Invoice', 'value' => '`'.$invoice->invoice_number.'`', 'inline' => true],
            ['name' => '⏳ Masa', 'value' => $invoice->isOneTime() ? 'Seumur hidup' : ((int) $invoice->duration_days).' hari', 'inline' => true],
        ], DiscordWebhookService::COLOR_GREEN);
    }

    /** The Hub moved this site's term — only sent when it actually changed. */
    public static function licenceTermUpdated(?string $endsAt, bool $lifetime, string $status): void
    {
        self::dispatch('[LISENSI] 🔑 Masa Aktif Diperbarui', [
            ['name' => '📅 Berakhir', 'value' => $lifetime ? 'Seumur hidup' : ($endsAt ?: '-'), 'inline' => true],
            ['name' => '📊 Status', 'value' => '**'.$status.'**', 'inline' => true],
        ], DiscordWebhookService::COLOR_BLUE);
    }

    /** The Hub switched this site off, or back on. */
    public static function licenceServingChanged(bool $serving, ?string $reason = null): void
    {
        $fields = $reason !== null && $reason !== ''
            ? [['name' => '📝 Alasan', 'value' => $reason, 'inline' => false]]
            : [];

        self::dispatch(
            $serving ? '[LISENSI] ✅ Situs Dinyalakan' : '[LISENSI] 🚨 Situs Dimatikan',
            $fields,
            $serving ? DiscordWebhookService::COLOR_GREEN : DiscordWebhookService::COLOR_RED,
        );
    }

    /**
     * @return array<int,array{name:string,value:string,inline?:bool}>
     */
    private static function transactionFields(Transaction $transaction): array
    {
        return [
            ['name' => '🧾 Invoice', 'value' => '`'.$transaction->invoice_number.'`', 'inline' => true],
            ['name' => '🏬 Merchant', 'value' => $transaction->merchant?->name ?? '-', 'inline' => true],
            ['name' => '🛒 Produk', 'value' => $transaction->product?->name ?? '-', 'inline' => true],
            ['name' => '💰 Nominal', 'value' => 'Rp '.number_format((int) $transaction->amount_total), 'inline' => true],
            ['name' => '💳 Channel', 'value' => $transaction->paymentChannel?->name ?? '-', 'inline' => true],
            ['name' => '📊 Status', 'value' => '**'.($transaction->status?->value ?? '-').'**', 'inline' => false],
        ];
    }

    /**
     * @return array<int,array{name:string,value:string,inline?:bool}>
     */
    private static function serviceInvoiceFields(ServiceInvoice $invoice): array
    {
        return [
            ['name' => '🧾 Invoice', 'value' => '`'.$invoice->invoice_number.'`', 'inline' => true],
            ['name' => '🏬 Merchant', 'value' => $invoice->merchant?->name ?? ($invoice->merchant_id ? "Client #{$invoice->merchant_id}" : '-'), 'inline' => true],
            ['name' => '📦 Layanan', 'value' => $invoice->service_name ?? '-', 'inline' => true],
            ['name' => '💰 Nominal', 'value' => 'Rp '.number_format((int) $invoice->amount), 'inline' => true],
            ['name' => '📊 Status', 'value' => '**'.($invoice->status?->value ?? '-').'**', 'inline' => false],
        ];
    }

    /**
     * @return array<int,array{name:string,value:string,inline?:bool}>
     */
    private static function withdrawalFields(Withdrawal $withdrawal): array
    {
        return [
            ['name' => '🧾 No. Penarikan', 'value' => '`'.$withdrawal->withdrawal_number.'`', 'inline' => true],
            ['name' => '🏬 Merchant', 'value' => $withdrawal->merchant?->name ?? 'Internal', 'inline' => true],
            ['name' => '💰 Nominal', 'value' => 'Rp '.number_format((int) $withdrawal->amount), 'inline' => true],
            ['name' => '💸 Nett', 'value' => 'Rp '.number_format((int) $withdrawal->nett), 'inline' => true],
            ['name' => '📊 Status', 'value' => '**'.($withdrawal->status?->value ?? '-').'**', 'inline' => false],
        ];
    }
}
