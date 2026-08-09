<?php

declare(strict_types=1);

namespace App\Actions\Storefront;

use App\Models\Transaction;
use App\Support\Storefront\MediaUrl;
use Illuminate\Database\Eloquent\Builder;

/**
 * "Cek Pesanan" — look up your own orders without logging in.
 *
 * Matches an exact invoice number, an exact contact number (the guest's
 * WhatsApp, or a registered user's phone), or an exact email (the checkout
 * `contact_email`, or a registered user's email). Exact match only: a LIKE
 * search on phone/email would let someone walk the table by prefix.
 */
class TrackOrdersAction
{
    private const LIMIT = 50;

    /** @return list<array<string, mixed>> */
    public function execute(string $query): array
    {
        $query = trim($query);

        if ($query === '') {
            return [];
        }

        $contacts = $this->phoneCandidates($query);
        $email = $this->emailCandidate($query);

        return Transaction::query()
            ->where(function (Builder $q) use ($query, $contacts, $email) {
                $q->where('invoice_number', $query);

                if ($contacts !== []) {
                    $q->orWhereIn('guest_contact', $contacts)
                        ->orWhereHas('user', fn (Builder $u) => $u->whereIn('phone', $contacts));
                }

                if ($email !== null) {
                    // Case-insensitive exact match — emails are stored as typed.
                    $q->orWhereRaw('lower(contact_email) = ?', [$email])
                        ->orWhereHas('user', fn (Builder $u) => $u->whereRaw('lower(email) = ?', [$email]));
                }
            })
            ->with([
                'product:id,category_id,name',
                'product.category:id,name,slug,code,logo',
            ])
            ->latest('id')
            ->limit(self::LIMIT)
            ->get(['id', 'invoice_number', 'product_id', 'amount_total', 'status', 'created_at'])
            ->map(fn (Transaction $transaction) => [
                'invoice_number' => $transaction->invoice_number,
                'service' => $transaction->product?->name,
                'amount' => (int) $transaction->amount_total,
                'status' => $transaction->status?->value,
                'game_id' => $transaction->product?->category_id,
                'game_name' => $transaction->product?->category?->name,
                'game_slug' => $transaction->product?->category?->slug ?: $transaction->product?->category?->code,
                'game_logo_url' => MediaUrl::for($transaction->product?->category?->logo),
                'created_at' => $transaction->created_at?->toIso8601String(),
            ])
            ->values()
            ->all();
    }

    /**
     * The forms a phone number may have been stored in.
     *
     * `guest_contact` is persisted exactly as the customer typed it at checkout,
     * so "0812…", "62812…" and "+62812…" all exist in the table. Rather than
     * normalising the column (which would need a backfill and a functional
     * index), the small set of equivalent spellings is matched exactly — still
     * index-friendly, and no prefix search that could be walked.
     *
     * Returns [] for anything too short to be a phone number, which leaves the
     * query on the invoice_number branch alone.
     *
     * @return list<string>
     */
    private function phoneCandidates(string $value): array
    {
        $digits = preg_replace('/\D/', '', $value) ?? '';

        if (strlen($digits) < 8) {
            return [];
        }

        $national = str_starts_with($digits, '62') ? '0'.substr($digits, 2) : $digits;
        $international = str_starts_with($digits, '0') ? '62'.substr($digits, 1) : $digits;

        return array_values(array_unique([
            $value,
            $digits,
            $national,
            $international,
            '+'.$international,
        ]));
    }

    /** The lowercased email if the query is a valid email address, else null. */
    private function emailCandidate(string $value): ?string
    {
        return filter_var($value, FILTER_VALIDATE_EMAIL) ? strtolower($value) : null;
    }
}
