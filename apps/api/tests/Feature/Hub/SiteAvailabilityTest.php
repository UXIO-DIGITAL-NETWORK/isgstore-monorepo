<?php

declare(strict_types=1);

namespace Tests\Feature\Hub;

use App\Enums\RoleType;
use App\Models\Role;
use App\Models\Setting;
use App\Models\User;
use App\Support\SiteLicenceState;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * The kill switch, and the doors that must never close with it.
 *
 * Every assertion here is a way the feature could fail catastrophically rather
 * than annoyingly: locking the Hub out of the site it just suspended, locking
 * the client out of the panel where they would pay to come back, or refusing a
 * gateway callback for money already in flight.
 */
class SiteAvailabilityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.hub.enabled' => true,
            'services.hub.managed_licence' => true,
            'services.hub.api_key' => 'hub-read-key',
        ]);

        $this->suspend();
    }

    private function suspend(): void
    {
        foreach ([
            'is_serving' => '0',
            'status' => 'suspended',
            'suspend_reason' => 'Belum bayar',
        ] as $key => $value) {
            Setting::updateOrCreate(
                ['group' => SiteLicenceState::GROUP, 'key' => $key],
                ['value' => $value, 'type' => $key === 'is_serving' ? 'boolean' : 'string', 'is_public' => false],
            );
        }

        SiteLicenceState::forget();
    }

    private function signInAs(string $role): User
    {
        $user = User::factory()->create([
            'role_id' => Role::firstOrCreate(['name' => $role])->id,
        ]);
        Sanctum::actingAs($user, ['access-api']);

        return $user;
    }

    // ── Closed ───────────────────────────────────────────────────────────────

    public function test_the_storefront_stops_answering(): void
    {
        $this->getJson('/api/v1/games')
            ->assertStatus(503)
            ->assertJsonPath('data.licence.status', 'suspended')
            ->assertJsonPath('data.licence.reason', 'Belum bayar')
            ->assertHeader('Retry-After');
    }

    public function test_customers_cannot_check_out(): void
    {
        $this->postJson('/api/v1/checkout', [])->assertStatus(503);
    }

    public function test_a_lapsed_licence_closes_it_too_with_its_own_message(): void
    {
        Setting::where('group', SiteLicenceState::GROUP)->where('key', 'status')->update(['value' => 'expired']);
        SiteLicenceState::forget();

        $this->getJson('/api/v1/games')
            ->assertStatus(503)
            ->assertJsonPath('data.licence.status', 'expired')
            ->assertJsonFragment(['message' => 'Masa aktif situs telah berakhir. Perpanjang untuk mengaktifkan kembali.']);
    }

    // ── Open, and load-bearing ───────────────────────────────────────────────

    public function test_the_hub_can_always_reach_in(): void
    {
        // Otherwise switching a site back on would be impossible from the panel
        // that switched it off. This is THE invariant of the whole feature.
        $this->getJson('/api/v1/hub/summary', ['X-Hub-Key' => 'hub-read-key'])->assertOk();
    }

    public function test_the_client_can_still_log_in(): void
    {
        // A billing lever that locks the client out of the panel where they
        // would pay is a hostage situation, not a lever.
        // Wrong credentials, so it is refused — but by the credential check,
        // not by the gate. That distinction is the whole assertion.
        $this->assertNotSame(
            503,
            $this->postJson('/api/v1/auth/login', ['email' => 'nobody@test', 'password' => 'wrong'])->status(),
        );
    }

    public function test_the_admin_panel_stays_open(): void
    {
        $this->signInAs(RoleType::ADMIN->value);

        // Not a 503. (2FA may still gate it — what matters is the kill switch
        // is not what refused.)
        $this->assertNotSame(503, $this->getJson('/api/v1/website-subscription')->status());
    }

    public function test_the_payment_panel_stays_open(): void
    {
        $this->signInAs(RoleType::PAYMENT_ADMIN->value);

        $this->getJson('/api/v1/payment-admin/services')->assertOk();
    }

    public function test_gateway_callbacks_still_land(): void
    {
        // Money already in flight must settle, and this is the path a renewal
        // arrives on — closing it would make a suspended site impossible to
        // un-suspend by paying.
        $this->assertNotSame(503, $this->postJson('/api/v1/payment/callback', [])->status());
        $this->assertNotSame(503, $this->postJson('/api/v1/disbursement/merchant/callback', [])->status());
    }

    public function test_the_down_page_can_still_read_the_sites_branding(): void
    {
        // So the storefront renders the client's own name instead of a raw error.
        $this->getJson('/api/v1/storefront/settings')->assertOk();
    }

    public function test_monitoring_does_not_go_dark(): void
    {
        $this->getJson('/api/v1/ping')->assertOk();
        // /health reads LARAVEL_START, which the test bootstrap never defines,
        // so it 500s here for reasons of its own. What matters is that the gate
        // is not what stopped it.
        $this->assertNotSame(503, $this->getJson('/api/v1/health')->status());
    }

    // ── Rollback + standalone ────────────────────────────────────────────────

    public function test_the_gate_is_inert_when_the_hub_does_not_own_the_licence(): void
    {
        // HUB_MANAGED_LICENCE=false is the rollback switch for this whole
        // mechanism, and a standalone deployment must never see the gate.
        config(['services.hub.managed_licence' => false]);

        $this->getJson('/api/v1/games')->assertOk();

        config(['services.hub.enabled' => false, 'services.hub.managed_licence' => true]);

        $this->getJson('/api/v1/games')->assertOk();
    }

    /**
     * The reason the gate is applied globally rather than route group by route
     * group: a public route added later would silently escape a per-group gate,
     * and a kill switch with a hole in it is not a lever.
     *
     * This walks the whole route table so a route on the wrong side of the
     * exception list fails here instead of surprising a client. If this fails,
     * decide deliberately which side the new route belongs on — do not widen
     * the allowlist to make it pass.
     */
    public function test_every_api_route_is_either_gated_or_deliberately_exempt(): void
    {
        $exempt = [];

        foreach (Route::getRoutes() as $route) {
            $uri = $route->uri();

            if (! str_starts_with($uri, 'api/')) {
                continue;
            }

            $middleware = $route->gatherMiddleware();

            // Panel routes are exempt by design and grow with every ordinary
            // admin feature — they are already gated by a role, so they are not
            // the risk surface. The PATH allowlist is: every entry there is
            // reachable without a login while the site is switched off.
            if (array_intersect(['admin', 'payment-admin', 'payment-internal'], $middleware) !== []) {
                continue;
            }

            if (! preg_match(
                '#^api/(v1/(ping|health|hub/|auth/|payment/callback|monetapay/(va|ewallet|qris)/callback'
                    .'|monetapay/subscription/callback/|uxiolabs/callback|uxiotopup/callback'
                    .'|disbursement/merchant/callback|storefront/settings)|broadcasting/)#',
                $uri,
            )) {
                continue; // Gated — the default, and the safe side.
            }

            $exempt[] = $route->methods()[0].' '.$uri;
        }

        // The unauthenticated exemptions, listed exactly. This is the hole
        // through which a switched-off site can still be reached, so it should
        // be read one line at a time when it changes — never widened to make a
        // test pass.
        sort($exempt);
        $this->assertSame([
            'GET api/broadcasting/auth',
            'GET api/v1/health',
            'GET api/v1/hub/channels',
            // A live sub-merchant balance reading. Read-only and key-gated like
            // its neighbours; it asserts nothing the Hub cannot already see, and
            // a switched-off site's balance is exactly what an operator needs
            // while deciding whether to switch it back on.
            'GET api/v1/hub/gateway-balance',
            'GET api/v1/hub/profit',
            'GET api/v1/hub/service-orders',
            // What this site's owner holds, per service. Same standing.
            'GET api/v1/hub/subscriptions',
            'GET api/v1/hub/summary',
            'GET api/v1/hub/withdrawal-context',
            'GET api/v1/hub/withdrawals',
            'GET api/v1/ping',
            'GET api/v1/storefront/settings',
            'POST api/v1/auth/2fa/confirm',
            'POST api/v1/auth/2fa/disable',
            // Same standing as setup/confirm above: still behind
            // `auth:sanctum`, and an admin has to be able to move their
            // authenticator to reach the panel where they pay to switch the
            // site back on.
            'POST api/v1/auth/2fa/rotate',
            'POST api/v1/auth/2fa/rotate/confirm',
            'POST api/v1/auth/2fa/setup',
            'POST api/v1/auth/2fa/verify',
            'POST api/v1/auth/forgot-password',
            'POST api/v1/auth/google',
            'POST api/v1/auth/login',
            'POST api/v1/auth/logout',
            'POST api/v1/auth/refresh',
            'POST api/v1/auth/register',
            'POST api/v1/auth/reset-password',
            'POST api/v1/disbursement/merchant/callback',
            'POST api/v1/hub/internal-withdrawals',
            'POST api/v1/hub/service-invoices/{serviceInvoice}/confirm',
            'POST api/v1/hub/service-invoices/{serviceInvoice}/reject',
            'POST api/v1/hub/sync',
            'POST api/v1/hub/withdrawals/{withdrawal}/approve',
            'POST api/v1/hub/withdrawals/{withdrawal}/reject',
            'POST api/v1/monetapay/ewallet/callback',
            'POST api/v1/monetapay/qris/callback',
            'POST api/v1/monetapay/subscription/callback/active',
            'POST api/v1/monetapay/subscription/callback/deduct/after',
            'POST api/v1/monetapay/subscription/callback/deduct/before',
            'POST api/v1/monetapay/va/callback',
            'POST api/v1/payment/callback',
            'POST api/v1/uxiolabs/callback',
            'POST api/v1/uxiotopup/callback',
        ], $exempt);
    }
}
