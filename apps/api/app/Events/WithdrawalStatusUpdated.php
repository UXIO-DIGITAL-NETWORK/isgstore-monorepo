<?php

namespace App\Events;

use App\Enums\WithdrawalStatus;
use App\Models\Withdrawal;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Broadcast when a Withdrawal is created or changes status.
 *
 * Mirrors TransactionStatusUpdated: the payload is a minimal signal (never the
 * model), and clients refetch through their own authorised endpoints. Two
 * private channels carry it — the owning merchant's own stream and the kita
 * ("payment-internal") aggregate feed — so both sides of the payout drop the
 * 5s polling and update live.
 *
 * ShouldDispatchAfterCommit: status transitions run inside DB::transaction()
 * (payout job, disbursement callback), so dispatching before commit could let
 * the broadcast worker read a row that never lands.
 */
class WithdrawalStatusUpdated implements ShouldBroadcast, ShouldDispatchAfterCommit
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /** Terminal outcomes — a client polling as a fallback stops once here. */
    public const TERMINAL_STATUSES = [
        WithdrawalStatus::SETTLED,
        WithdrawalStatus::REJECTED,
        WithdrawalStatus::FAILED,
    ];

    public function __construct(public Withdrawal $withdrawal) {}

    /**
     * @return array<int, PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return [
            // The merchant that owns this payout (merchant_id references users.id).
            new PrivateChannel("merchant.{$this->withdrawal->merchant_id}.withdrawals"),
            // The kita team's aggregate feed of every merchant's payouts.
            new PrivateChannel('finance.withdrawals'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'withdrawal.updated';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->withdrawal->id,
            'status' => $this->withdrawal->status?->value,
            'is_terminal' => in_array($this->withdrawal->status, self::TERMINAL_STATUSES, true),
        ];
    }
}
