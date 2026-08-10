<?php

namespace App\Events;

use App\Actions\Storefront\ShowInvoiceAction;
use App\Models\Transaction;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Broadcast when a Transaction is created or changes status.
 *
 * The payload is deliberately a minimal *signal*, never the model: the public
 * invoice channel is guest-visible, and the codebase's rule is that public
 * projections are built field-by-field so guest_contact / margin / supplier ids
 * cannot leak (see ShowInvoiceAction). Clients receive the signal and refetch
 * through their existing, authorised endpoints.
 *
 * Implements ShouldDispatchAfterCommit because the PAID/EXPIRED transition runs
 * inside HandleMonetapayCallbackAction's DB::transaction() — dispatching before
 * commit could let the broadcast worker read stale rows.
 */
class TransactionStatusUpdated implements ShouldBroadcast, ShouldDispatchAfterCommit
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Transaction $transaction) {}

    /**
     * @return array<int, Channel|PrivateChannel>
     */
    public function broadcastOn(): array
    {
        $channels = [
            // Public: invoice_number is the guest's only credential.
            new Channel("invoice.{$this->transaction->invoice_number}"),
            // Private: back-office live feed.
            new PrivateChannel('admin.transactions'),
        ];

        // Guest checkouts have no user_id — only registered members get a stream.
        if ($this->transaction->user_id) {
            $channels[] = new PrivateChannel("member.{$this->transaction->user_id}.transactions");
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'transaction.updated';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'invoice_number' => $this->transaction->invoice_number,
            'status' => $this->transaction->status?->value,
            'is_terminal' => in_array(
                $this->transaction->status,
                ShowInvoiceAction::TERMINAL_STATUSES,
                true,
            ),
        ];
    }
}
