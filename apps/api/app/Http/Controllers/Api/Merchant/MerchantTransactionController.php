<?php

namespace App\Http\Controllers\Api\Merchant;

use App\Http\Controllers\Controller;
use App\Queries\UnifiedTransactionQuery;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * The client's money movements, both directions in one feed: sales attributed
 * to them via `transactions.merchant_id` (money in) and the service bills kita
 * issued them (money out). `type=all|sale|service` picks the tab.
 *
 * The projection is deliberately narrow — the client sees its own net sale
 * price, never the platform's markup, the gateway fee, or supplier ids. The
 * query is built with `withPlatformFigures: false`, so those columns are not
 * even selected.
 */
class MerchantTransactionController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $perPage = min(100, max(1, (int) $request->query('per_page', 20)));

        $rows = (new UnifiedTransactionQuery($request->user()->id))
            ->build(
                (string) $request->query('type', UnifiedTransactionQuery::TYPE_ALL),
                $request->query('status'),
                $request->query('search'),
            )
            ->paginate($perPage)
            ->through(fn ($row) => [
                'type' => $row->source,
                // Ids are unique only WITHIN a type — the client must key rows
                // on the pair, not on the id alone.
                'id' => (int) $row->source_id,
                'invoice_number' => $row->invoice_number,
                'title' => $row->title,
                'direction' => $row->direction,
                'amount' => (int) $row->amount,
                'status' => $row->status,
                'payment_channel' => $row->channel,
                'created_at' => $this->iso($row->occurred_at),
            ]);

        return $this->successResponse($rows, 'Transactions retrieved successfully');
    }

    /** Raw rows come back with driver-formatted date strings, not Carbon. */
    private function iso(?string $value): ?string
    {
        return $value ? Carbon::parse($value)->toIso8601String() : null;
    }
}
