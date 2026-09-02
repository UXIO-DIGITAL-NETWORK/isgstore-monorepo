<?php

namespace App\Http\Controllers\Api\Member;

use App\Http\Controllers\Controller;
use App\Models\PointLedgerEntry;
use App\Support\Membership\MembershipResolver;
use App\Support\Points\PointRules;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

/**
 * The member's point balance and statement.
 *
 * Deliberately mirrors `/v1/me/balance-mutations`: a balance that grows and
 * shrinks with no statement behind it is indistinguishable from a bug, and
 * points are worth money.
 */
class MemberPointController extends Controller
{
    use ApiResponse;

    public function summary(Request $request)
    {
        $user = $request->user();
        $plan = MembershipResolver::planFor($user);

        return $this->successResponse([
            'points' => (int) $user->point,
            // The rate is what turns points into a number the customer can
            // reason about at checkout, so it travels with the balance.
            'redeem_rate' => PointRules::redeemRate(),
            'redeem_value' => PointRules::rupiahFor((int) $user->point),
            // Decided here rather than by the client: a plan that already buys
            // a discount does not also get to spend points, and checkout
            // enforces the same rule.
            'allows_point_spending' => $plan?->allows_point_spending ?? true,
        ], 'Points retrieved successfully');
    }

    public function history(Request $request)
    {
        $entries = PointLedgerEntry::where('user_id', $request->user()->id)
            ->latest('id')
            ->paginate(min(100, max(1, (int) $request->query('per_page', 20))));

        $entries->through(fn (PointLedgerEntry $row) => [
            'id' => $row->id,
            'type' => $row->type,
            'amount' => (int) $row->amount,
            'points_before' => (int) $row->points_before,
            'points_after' => (int) $row->points_after,
            'reference' => $row->reference,
            'description' => $row->description,
            'created_at' => $row->created_at,
        ]);

        return $this->successResponse($entries, 'Point history retrieved successfully');
    }
}
