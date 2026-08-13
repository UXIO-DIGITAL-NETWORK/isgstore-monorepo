<?php

namespace App\Http\Controllers\Api\Finance;

use App\Http\Controllers\Controller;
use App\Queries\UnifiedTransactionQuery;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * Every client's money movements, full financial breakdown — kita sees the
 * split the merchant projection deliberately hides (admin fee, gateway fee,
 * own profit). `type=all|sale|service` picks the tab; `merchant_id` narrows to
 * one client.
 *
 * `direction` stays client-relative here too ("in" = money into the client),
 * matching what the "Nett Merchant" column has always meant on this screen.
 */
class FinanceTransactionController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $perPage = min(100, max(1, (int) $request->query('per_page', 20)));
        $merchantId = $request->query('merchant_id');

        $rows = (new UnifiedTransactionQuery(
            merchantId: $merchantId !== null ? (int) $merchantId : null,
            withPlatformFigures: true,
        ))
            ->build(
                (string) $request->query('type', UnifiedTransactionQuery::TYPE_ALL),
                $request->query('status'),
                $request->query('search'),
            )
            ->paginate($perPage)
            ->through(fn ($row) => [
                'type' => $row->source,
                'id' => (int) $row->source_id,
                'invoice_number' => $row->invoice_number,
                'title' => $row->title,
                'merchant' => $row->merchant_id
                    ? ['id' => (int) $row->merchant_id, 'name' => $row->merchant_name]
                    : null,
                'direction' => $row->direction,
                'amount' => (int) $row->amount,
                'amount_total' => (int) $row->amount_total,
                // "Biaya Admin" = the payment method's fee. Genuinely 0 on a
                // service bill, which has no channel behind it.
                'admin_fee' => (int) $row->admin_fee,
                'gateway_fee' => (int) $row->gateway_fee,
                'platform_profit' => (int) $row->platform_profit,
                'status' => $row->status,
                'payment_channel' => $row->channel,
                'created_at' => $row->occurred_at ? Carbon::parse($row->occurred_at)->toIso8601String() : null,
            ]);

        return $this->successResponse($rows, 'Transactions retrieved successfully');
    }
}
