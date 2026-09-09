<?php

declare(strict_types=1);

namespace App\Support\Payment;

use App\Enums\SubscriptionStatus;
use App\Models\ServiceSubscription;
use Illuminate\Support\Carbon;

/**
 * "When does this website's own subscription run out, and where do I renew it?"
 *
 * Two callers, one answer: the card in the admin sidebar footer
 * (WebsiteSubscriptionController) and the Hub's summary pull
 * (HubReportController). Keeping the resolution here is the point — a Hub that
 * disagrees with the site's own panel about the site's own expiry date is worse
 * than a Hub that does not show the date at all.
 *
 * It must ALWAYS answer, never throw: the sidebar renders it on every admin
 * page, and a summary pull must not fail because billing is unconfigured. Every
 * failure mode — no default merchant, no matching service, no subscription at
 * all — is a status string.
 *
 * Statuses: `unconfigured` | `none` | `expired` | `expiring_soon` | `active`.
 */
final class WebsiteSubscriptionStatus
{
    /** Below this, the card starts nagging and the Hub flags the site. */
    public const EXPIRING_SOON_DAYS = 14;

    /** @return array<string, mixed> */
    public static function resolve(): array
    {
        $merchantId = DefaultMerchant::id();
        $service = WebsiteService::get();

        if (! $merchantId || ! $service) {
            // Nothing to show and nowhere to send them. The sidebar renders
            // nothing rather than a broken link.
            return self::payload('unconfigured');
        }

        // The raw maximum, deliberately **not** `scopeActive()`: that scope also
        // filters `ends_at > now()`, which would return nothing for a lapsed
        // subscription and make "expired" indistinguishable from "never
        // subscribed" — the two states this exists to tell apart.
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
            return self::payload('none', $service, null, null, $checkoutUrl);
        }

        $endsAt = Carbon::parse($endsAt);
        $daysRemaining = (int) max(0, (int) ceil(now()->diffInDays($endsAt, false)));

        $status = match (true) {
            $endsAt->isPast() => 'expired',
            $daysRemaining <= self::EXPIRING_SOON_DAYS => 'expiring_soon',
            default => 'active',
        };

        return self::payload($status, $service, $endsAt, $daysRemaining, $checkoutUrl);
    }

    /** @return array<string, mixed> */
    private static function payload(
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
                // The site's own name for it, not the Hub's — see
                // WebsiteService::label().
                'name' => WebsiteService::label(),
            ] : null,
            'ends_at' => $endsAt?->toIso8601String(),
            'days_remaining' => $daysRemaining,
            'checkout_url' => $checkoutUrl,
        ];
    }
}
