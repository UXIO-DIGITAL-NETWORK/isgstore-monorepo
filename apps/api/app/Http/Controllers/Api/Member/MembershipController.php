<?php

namespace App\Http\Controllers\Api\Member;

use App\Actions\Membership\SubscribeToMembershipPlanAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Membership\SubscribeMembershipRequest;
use App\Models\MembershipPlan;
use App\Models\MembershipSubscription;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use RuntimeException;

class MembershipController extends Controller
{
    use ApiResponse;

    /** Public plan list. */
    public function plans(Request $request)
    {
        $locale = $request->query('locale', 'id');

        $plans = MembershipPlan::where('is_active', true)
            ->orderBy('sort_order')
            ->get()
            ->map(fn (MembershipPlan $plan) => [
                'id' => $plan->id,
                'code' => $plan->code,
                'name' => $plan->localizedName($locale),
                'benefits' => $plan->localizedBenefits($locale),
                'price' => (int) $plan->price,
                // NULL, not 0 — the storefront reads NULL as "lifetime".
                'duration_days' => $plan->isLifetime() ? null : (int) $plan->duration_days,
                'is_popular' => (bool) $plan->is_popular,
            ]);

        return $this->successResponse($plans, 'Membership plans retrieved successfully');
    }

    /** The caller's current membership, if any. */
    public function current(Request $request)
    {
        $subscription = MembershipSubscription::with('membershipPlan')
            ->where('user_id', $request->user()->id)
            ->currentlyActive()
            ->latest('ends_at')
            ->first();

        return $this->successResponse($subscription ? [
            'plan_code' => $subscription->membershipPlan?->code,
            'plan_name' => $subscription->membershipPlan?->localizedName($request->query('locale', 'id')),
            'starts_at' => $subscription->starts_at,
            'ends_at' => $subscription->ends_at,
        ] : null, 'Membership retrieved successfully');
    }

    /**
     * Buys a plan with the member's wallet balance.
     *
     * Paying from the wallet rather than opening a second gateway flow keeps
     * the purchase atomic: the debit, the subscription and the role change all
     * commit together, so there is no window where money has left the wallet
     * but the membership has not started. Members top the wallet up first.
     */
    /**
     * Turn automatic renewal on or off.
     *
     * Lives on the user, not the subscription: switching it off means "stop
     * billing me", not "skip this one period". Nothing else can debit a wallet
     * without the member asking, so this is the switch that makes the default
     * defensible.
     */
    public function setAutoRenew(Request $request)
    {
        $validated = $request->validate([
            'auto_renew' => ['required', 'boolean'],
        ]);

        $user = $request->user();
        $user->forceFill(['auto_renew' => (bool) $validated['auto_renew']])->save();

        return $this->successResponse(
            ['auto_renew' => (bool) $user->auto_renew],
            $user->auto_renew ? 'Perpanjangan otomatis diaktifkan' : 'Perpanjangan otomatis dimatikan'
        );
    }

    public function subscribe(SubscribeMembershipRequest $request, SubscribeToMembershipPlanAction $action)
    {
        try {
            $subscription = $action->execute($request->user(), $request->toDTO());
        } catch (RuntimeException $e) {
            // Insufficient balance is the expected refusal, not a fault.
            return $this->errorResponse($e->getMessage(), 400);
        }

        return $this->successResponse([
            'plan_id' => $subscription->membership_plan_id,
            'starts_at' => $subscription->starts_at,
            'ends_at' => $subscription->ends_at,
        ], 'Membership berhasil diaktifkan', 201);
    }
}
