<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\SubscriptionStatus;
use App\Http\Controllers\Controller;
use App\Models\ServiceSubscription;
use App\Support\Payment\DefaultMerchant;
use App\Support\Payment\WebsiteService;
use App\Traits\ApiResponse;
use Illuminate\Support\Carbon;

/**
 * "When does this website's own subscription run out, and where do I renew it?"
 *
 * Feeds the card in the admin sidebar footer, so it is rendered on **every**
 * admin page: it must always answer 200 and never throw. Every failure mode —
 * no default merchant, no matching service, no subscription at all — is a
 * status string, not an exception.
 *
 * Note the identity mismatch this deliberately accepts: the caller is an
 * `admin`, but the billing data belongs to the site's `payment-admin` merchant
 * (`DefaultMerchant`). Those two roles are kept strictly apart everywhere else
 * in this codebase; here they are the same company looking at its own bill, and
 * the CTA is worthless otherwise.
 */
class WebsiteSubscriptionController extends Controller
{
    use ApiResponse;

    /** Below this, the card starts nagging. */
    private const EXPIRING_SOON_DAYS = 14;

    public function show()
    {
        $merchantId = DefaultMerchant::id();
        $service = WebsiteService::get();

        if (! $merchantId || ! $service) {
            // Nothing to show and nowhere to send them. The sidebar renders
            // nothing rather than a broken link.
            return $this->successResponse($this->payload('unconfigured'), 'Website subscription retrieved');
        }

        // The raw maximum, deliberately **not** `scopeActive()`: that scope also
        // filters `ends_at > now()`, which would return nothing for a lapsed
        // subscription and make "expired" indistinguishable from "never
        // subscribed" — the two states this card exists to tell apart.
        // Renewals stack as new rows, so the furthest end date is the answer.
        $endsAt = ServiceSubscription::query()
            ->where('merchant_id', $merchantId)
            ->where('service_id', $service->id)
            ->where('status', SubscriptionStatus::ACTIVE)
            ->max('ends_at');

        $checkoutUrl = rtrim((string) config('services.payment_page.url'), '/')
            .'/app/payment-admin/services/'.$service->id.'/checkout';

        if (! $endsAt) {
            // Never subscribed — the moment the CTA matters most, so the link
            // is still returned.
            return $this->successResponse(
                $this->payload('none', $service, null, null, $checkoutUrl),
                'Website subscription retrieved'
            );
        }

        $endsAt = Carbon::parse($endsAt);
        $daysRemaining = (int) max(0, (int) ceil(now()->diffInDays($endsAt, false)));

        $status = match (true) {
            $endsAt->isPast() => 'expired',
            $daysRemaining <= self::EXPIRING_SOON_DAYS => 'expiring_soon',
            default => 'active',
        };

        return $this->successResponse(
            $this->payload($status, $service, $endsAt, $daysRemaining, $checkoutUrl),
            'Website subscription retrieved'
        );
    }

    /** @return array<string, mixed> */
    private function payload(
        string $status,
        $service = null,
        ?Carbon $endsAt = null,
        ?int $daysRemaining = null,
        ?string $checkoutUrl = null,
    ): array {
        return [
            'status' => $status,
            'service' => $service ? [
                'id' => $service->id,
                'code' => $service->code,
                'name' => $service->name,
            ] : null,
            'ends_at' => $endsAt?->toIso8601String(),
            'days_remaining' => $daysRemaining,
            'checkout_url' => $checkoutUrl,
        ];
    }
}
