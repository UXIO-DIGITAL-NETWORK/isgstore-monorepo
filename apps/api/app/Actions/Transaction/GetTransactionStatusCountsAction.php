<?php

namespace App\Actions\Transaction;

use App\Enums\TransactionStatus;
use App\Models\Transaction;

/**
 * Counts backing the admin table's "needs attention" filter pills — the
 * three real transaction statuses an operator would act on, not a
 * settlement-state taxonomy the backend has no data for.
 */
class GetTransactionStatusCountsAction
{
    public function execute(): array
    {
        $rows = Transaction::query()
            ->selectRaw('status, COUNT(*) as cnt')
            ->groupBy('status')
            ->toBase()
            ->get()
            ->keyBy('status');

        return [
            'pending' => (int) ($rows[TransactionStatus::PENDING->value]->cnt ?? 0),
            'processing' => (int) ($rows[TransactionStatus::PROCESSING->value]->cnt ?? 0),
            'failed_provider' => (int) ($rows[TransactionStatus::FAILED_PROVIDER->value]->cnt ?? 0),
            // A refunded order leaves FAILED_PROVIDER, so without its own pill
            // it would simply vanish from the operator's view — and the failed
            // count would keep shrinking with no visible reason.
            'refunded' => (int) ($rows[TransactionStatus::REFUNDED->value]->cnt ?? 0),
        ];
    }
}
