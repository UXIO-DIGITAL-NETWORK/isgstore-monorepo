<?php

namespace App\Events;

use App\Enums\ServiceInvoiceStatus;
use App\Models\ServiceInvoice;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Broadcast when a ServiceInvoice is created or changes status.
 *
 * Mirrors TransactionStatusUpdated: a minimal signal, two private channels (the
 * owning merchant's stream and the kita aggregate feed). Lets the payment page
 * drop the 5s poll on an UNPAID bill and reflect a webhook-driven PAID instantly.
 *
 * ShouldDispatchAfterCommit: the PAID transition + subscription activation run
 * inside HandleMonetapayCallbackAction's DB::transaction().
 */
class ServiceInvoiceUpdated implements ShouldBroadcast, ShouldDispatchAfterCommit
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /** Terminal outcomes — a fallback poll stops once here. */
    public const TERMINAL_STATUSES = [
        ServiceInvoiceStatus::PAID,
        ServiceInvoiceStatus::CANCELLED,
        ServiceInvoiceStatus::EXPIRED,
    ];

    public function __construct(public ServiceInvoice $invoice) {}

    /**
     * @return array<int, PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return [
            // The merchant that owns this bill (merchant_id references users.id).
            new PrivateChannel("merchant.{$this->invoice->merchant_id}.service-invoices"),
            // The kita team's aggregate feed.
            new PrivateChannel('finance.service-invoices'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'service-invoice.updated';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->invoice->id,
            'status' => $this->invoice->status?->value,
            'is_terminal' => in_array($this->invoice->status, self::TERMINAL_STATUSES, true),
        ];
    }
}
