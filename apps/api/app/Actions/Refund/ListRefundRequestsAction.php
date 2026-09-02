<?php

declare(strict_types=1);

namespace App\Actions\Refund;

use App\DTOs\Refund\ListRefundRequestsDTO;
use App\Enums\RefundStatus;
use App\Models\RefundRequest;
use App\Support\Phone;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;

/**
 * The admin refund queue.
 *
 * Search spans the four handles an admin is ever given over the phone or in a
 * ticket: the refund number, the invoice number, the customer's email and
 * their phone. Unlike the public lookup this is a LIKE search — the caller is
 * already an authenticated admin, so there is no table to walk that they
 * cannot simply list.
 */
class ListRefundRequestsAction
{
    public function execute(ListRefundRequestsDTO $dto): LengthAwarePaginator
    {
        $search = $dto->search !== null ? trim($dto->search) : null;

        return RefundRequest::query()
            ->with([
                'transaction:id,invoice_number,product_id,user_id,created_at',
                'transaction.product:id,name',
                'user:id,name,email,phone',
                'claimedUser:id,name,email,phone,status',
                'processedBy:id,name',
            ])
            ->when($dto->status, fn (Builder $q, string $status) => $q->where('status', $status))
            ->when($dto->method, fn (Builder $q, string $method) => $q->where('method', $method))
            ->when($search !== null && $search !== '', fn (Builder $q) => $q->where(
                fn (Builder $inner) => $inner
                    ->where('refund_number', 'like', "%{$search}%")
                    ->orWhere('contact_email', 'like', "%{$search}%")
                    ->orWhere('contact_phone', 'like', "%{$search}%")
                    ->orWhereHas('transaction', fn (Builder $t) => $t->where('invoice_number', 'like', "%{$search}%"))
            ))
            ->when($dto->unclaimed, fn (Builder $q) => $q->where('status', RefundStatus::WAITING_ACCOUNT->value))
            // Late is only meaningful once the clock is ours: `verify_due_at`
            // is stamped at the claim, so an unclaimed row can never be overdue.
            ->when($dto->overdue, fn (Builder $q) => $q
                ->whereNotNull('verify_due_at')
                ->where('verify_due_at', '<', now())
                ->whereNotIn('status', array_map(fn (RefundStatus $s) => $s->value, RefundStatus::terminal())))
            ->when($dto->startDate, fn (Builder $q, string $from) => $q->where('created_at', '>=', $from))
            ->when($dto->endDate, fn (Builder $q, string $to) => $q->where('created_at', '<=', $to))
            ->latest('id')
            ->paginate($dto->perPage);
    }

    /**
     * Counts per status for the queue's filter pills, so the admin can see at a
     * glance how many refunds are actually waiting on them.
     *
     * @return array<string, int>
     */
    public function statusCounts(): array
    {
        $counts = RefundRequest::query()
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status')
            ->map(fn ($n) => (int) $n)
            ->all();

        // Two derived buckets the queue is actually worked from. They are not
        // statuses — "overdue" cuts across PENDING and PROCESSING — so they are
        // counted separately rather than faked into the enum.
        $counts['unclaimed'] = (int) ($counts[RefundStatus::WAITING_ACCOUNT->value] ?? 0);
        $counts['overdue'] = RefundRequest::query()
            ->whereNotNull('verify_due_at')
            ->where('verify_due_at', '<', now())
            ->whereNotIn('status', array_map(fn (RefundStatus $s) => $s->value, RefundStatus::terminal()))
            ->count();

        return $counts;
    }

    /**
     * How many other refunds this account has claimed, and how many share the
     * order contact. This is the signal an admin actually verifies against — a
     * second claim from the same account, or several refunds pointing at one
     * email, is what fishing with a leaked invoice number looks like.
     *
     * @return array{by_account: int, by_contact: int}
     */
    public function siblingClaims(RefundRequest $refund): array
    {
        $byAccount = $refund->claimed_user_id === null ? 0 : RefundRequest::query()
            ->where('claimed_user_id', $refund->claimed_user_id)
            ->whereKeyNot($refund->getKey())
            ->count();

        // Every spelling, not just the stored one: contact numbers are canonical
        // only from the E.164 release onward, so one customer's refunds can sit
        // under "0812…" and "+62812…" at once. Matching a single spelling would
        // split their history into two groups on the very screen used to judge
        // fraud. `candidates()` returns [] for anything too short to be a number.
        $email = $refund->contact_email ? strtolower($refund->contact_email) : null;
        $phones = $refund->contact_phone ? Phone::candidates($refund->contact_phone) : [];

        // Decided from what will actually be queried, not from what the row
        // holds: an empty inner closure produces `where ()` and would report the
        // whole table as this refund's siblings.
        if ($email === null && $phones === []) {
            return ['by_account' => $byAccount, 'by_contact' => 0];
        }

        $byContact = RefundRequest::query()
            ->whereKeyNot($refund->getKey())
            ->where(function (Builder $q) use ($email, $phones) {
                if ($email !== null) {
                    $q->orWhereRaw('lower(contact_email) = ?', [$email]);
                }

                if ($phones !== []) {
                    $q->orWhereIn('contact_phone', $phones);
                }
            })
            ->count();

        return ['by_account' => $byAccount, 'by_contact' => $byContact];
    }
}
