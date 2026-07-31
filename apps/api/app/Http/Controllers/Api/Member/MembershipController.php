<?php

namespace App\Http\Controllers\Api\Member;

use App\Http\Controllers\Controller;
use App\Models\MembershipPlan;
use App\Models\MembershipSubscription;
use App\Models\User;
use App\Support\Wallet\WalletLedger;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
                'duration_days' => (int) $plan->duration_days,
                'is_popular' => (bool) $plan->is_popular,
            ]);

        return $this->successResponse($plans, 'Membership plans retrieved successfully');
    }

    /** The caller's current membership, if any. */
    public function current(Request $request)
    {
        $subscription = MembershipSubscription::with('membershipPlan')
            ->where('user_id', $request->user()->id)
            ->where('status', 'active')
            ->where('ends_at', '>', now())
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
    public function subscribe(Request $request)
    {
        $validated = $request->validate([
            'membership_plan_id' => ['required', 'exists:membership_plans,id'],
        ]);

        try {
            $result = DB::transaction(function () use ($request, $validated) {
                /** @var MembershipPlan $plan */
                $plan = MembershipPlan::where('is_active', true)->findOrFail($validated['membership_plan_id']);

                /** @var User $user */
                $user = User::whereKey($request->user()->id)->lockForUpdate()->firstOrFail();

                if ((int) $user->balance < (int) $plan->price) {
                    throw new RuntimeException(
                        'Saldo tidak mencukupi. Silakan isi saldo terlebih dahulu. Sisa saldo: Rp '
                        .number_format($user->balance)
                    );
                }

                WalletLedger::record(
                    user: $user->id,
                    amount: -1 * (int) $plan->price,
                    type: 'purchase',
                    reference: 'MEMBERSHIP-'.$plan->code,
                    description: 'Upgrade membership: '.$plan->localizedName(),
                );

                // Extends an existing membership rather than truncating it —
                // renewing early must not cost the member the days they have
                // already paid for.
                $active = MembershipSubscription::where('user_id', $user->id)
                    ->where('status', 'active')
                    ->where('ends_at', '>', now())
                    ->latest('ends_at')
                    ->first();

                $startsAt = $active?->ends_at ?? now();

                $subscription = MembershipSubscription::create([
                    'user_id' => $user->id,
                    'membership_plan_id' => $plan->id,
                    'starts_at' => $startsAt,
                    'ends_at' => $startsAt->copy()->addDays($plan->duration_days),
                    'status' => 'active',
                ]);

                // The role is what actually prices the member's orders —
                // without it the plan would grant nothing.
                $user->forceFill([
                    'role_id' => $plan->role_id ?? $user->role_id,
                    'membership_expires_at' => $subscription->ends_at,
                ])->save();

                return $subscription;
            });

            return $this->successResponse([
                'plan_id' => $result->membership_plan_id,
                'starts_at' => $result->starts_at,
                'ends_at' => $result->ends_at,
            ], 'Membership berhasil diaktifkan', 201);
        } catch (RuntimeException $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }
}
