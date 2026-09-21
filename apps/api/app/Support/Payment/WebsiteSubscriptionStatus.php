<?php

declare(strict_types=1);

namespace App\Support\Payment;

use App\Enums\SubscriptionStatus;
use App\Models\Service;
use App\Models\ServiceSubscription;
use App\Support\PublicUrl;
use App\Support\SiteLicenceState;
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
 * Statuses: `unconfigured` | `none` | `expired` | `expiring_soon` | `active`,
 * plus `suspended` on a Hub-managed site an operator has switched off.
 */
final class WebsiteSubscriptionStatus
{
    /** Below this, the card starts nagging and the Hub flags the site. */
    public const EXPIRING_SOON_DAYS = 14;

    /** @return array<string, mixed> */
    public static function resolve(): array
    {
        // A suspension outranks every date. Without this the client's own admin
        // card reads "aktif, 300 hari tersisa" while their storefront answers
        // 503 to every customer — the one screen that should explain the outage
        // instead denying it.
        if (SiteLicenceState::isManaged() && ! SiteLicenceState::isServing()) {
            $closure = SiteLicenceState::closure();
            $service = WebsiteService::get();

            // `none`/`unknown` mean the Hub holds no term for this site at all —
            // read that as "belum berlangganan" (with its renew CTA), not as a
            // lapsed one. Only a real end date makes it `expired`.
            $cardStatus = match ($closure['status']) {
                'suspended' => 'suspended',
                'none', 'unknown' => 'none',
                default => 'expired',
            };

            // array_merge, not `+`: the union operator keeps the LEFT side's
            // key, so the null default in payload() would win and the client
            // would never see why their site is off.
            return array_merge(
                self::payload(
                    $cardStatus,
                    $service,
                    $closure['ends_at'] ? Carbon::parse($closure['ends_at']) : null,
                    null,
                    $closure['checkout_url'] ?: self::checkoutUrl($service),
                    SiteLicenceState::isLifetime(),
                ),
                ['suspend_reason' => $closure['reason']],
            );
        }

        $merchantId = DefaultMerchant::id();
        $service = WebsiteService::get();

        if (! $merchantId || ! $service) {
            // Nothing to show and nowhere to send them. The sidebar renders
            // nothing rather than a broken link.
            return self::payload('unconfigured');
        }

        $checkoutUrl = self::checkoutUrl($service);

        // A licence bought outright answers before any date does: there is
        // nothing to count down to, and `max(ends_at)` returns null for it — the
        // very null that means "never subscribed", which is the opposite of what
        // a client who has paid in full should read.
        $lifetime = ServiceSubscription::query()
            ->where('merchant_id', $merchantId)
            ->where('service_id', $service->id)
            ->where('status', SubscriptionStatus::ACTIVE)
            ->whereNull('ends_at')
            ->exists();

        if ($lifetime) {
            return self::payload('active', $service, null, null, $checkoutUrl, true);
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

    /**
     * Where the client goes to pay.
     *
     * Null when there is no service to buy — and equally when the payment page
     * base is not an address they could open. The card already handles a null
     * here by showing no button, which beats a button pointing at whoever
     * deployed this.
     */
    private static function checkoutUrl(?Service $service): ?string
    {
        $base = PublicUrl::paymentPage();

        if (! $service || $base === null) {
            return null;
        }

        return $base.'/app/payment-admin/services/'.$service->id.'/checkout';
    }

    /** @return array<string, mixed> */
    private static function payload(
        string $status,
        $service = null,
        ?Carbon $endsAt = null,
        ?int $daysRemaining = null,
        ?string $checkoutUrl = null,
        bool $lifetime = false,
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
            // Paid once, no end date: the card says "Seumur hidup" instead of a
            // date, and never nags about a renewal that will not come.
            'lifetime' => $lifetime,
            // Whether the public side is actually up. Additive to the Hub
            // contract; older readers ignore it.
            'is_serving' => ! SiteLicenceState::isManaged() || SiteLicenceState::isServing(),
            'suspend_reason' => null,
        ];
    }
}
