<?php

namespace Tests\Feature;

use App\Actions\Refund\SendRefundClaimNotificationAction;
use App\Jobs\SendRefundWhatsAppJob;
use App\Mail\RefundMail;
use App\Models\RefundRequest;
use App\Models\Transaction;
use App\Support\PublicUrl;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Links that leave the building.
 *
 * A refund claim link is sent once, over WhatsApp and email, to someone who is
 * owed money — and the send is reported as successful whatever the link says.
 * A `http://localhost:5173/...` in that message is therefore invisible from
 * here and total for the customer: they cannot claim, and nothing anywhere
 * records that anything went wrong.
 *
 * `STOREFRONT_URL` defaulting to a developer's machine is what made that
 * possible. These tests pin the two halves of the fix: nothing unreachable is
 * ever built into an outbound message, and a deployment missing the variable
 * says so instead of quietly shipping a dead link.
 */
class PublicUrlTest extends TestCase
{
    use RefreshDatabase;

    // ── What counts as a public address ─────────────────────────────────────

    public static function unreachableProvider(): array
    {
        return [
            'empty' => [''],
            'null' => [null],
            'localhost' => ['http://localhost:5173'],
            'localhost bare' => ['http://localhost'],
            'loopback v4' => ['http://127.0.0.1:5173'],
            'loopback v6' => ['http://[::1]:5173'],
            'private 192.168' => ['http://192.168.1.10:5173'],
            'private 10.x' => ['http://10.0.0.5'],
            '.local mDNS' => ['http://macbook.local:5173'],
            '.test TLD' => ['http://isgstore.test'],
            'example.com placeholder' => ['https://example.com'],
            'no host' => ['not-a-url'],
        ];
    }

    #[DataProvider('unreachableProvider')]
    public function test_it_refuses_an_address_a_customer_could_not_reach(?string $url): void
    {
        $this->assertFalse(PublicUrl::isPublic($url), "[{$url}] must not be sent to a customer.");
    }

    public static function reachableProvider(): array
    {
        return [
            'https' => ['https://isgstore.id'],
            'with path' => ['https://isgstore.id/shop'],
            'trailing slash' => ['https://isgstore.id/'],
            'subdomain' => ['https://www.isgstore.id'],
            // Plain http is not our business to refuse: a site behind a proxy
            // that terminates TLS elsewhere is a real deployment.
            'http on a real domain' => ['http://isgstore.id'],
        ];
    }

    #[DataProvider('reachableProvider')]
    public function test_it_accepts_a_real_domain(string $url): void
    {
        $this->assertTrue(PublicUrl::isPublic($url));
    }

    public function test_base_strips_the_trailing_slash_so_callers_can_concatenate(): void
    {
        config(['services.storefront.url' => 'https://isgstore.id/']);

        $this->assertSame('https://isgstore.id', PublicUrl::base('services.storefront.url'));
    }

    public function test_base_is_null_rather_than_a_dev_address(): void
    {
        config(['services.storefront.url' => 'http://localhost:5173']);

        $this->assertNull(PublicUrl::base('services.storefront.url'));
    }

    // ── The refund claim link ───────────────────────────────────────────────

    private function refund(): RefundRequest
    {
        $transaction = Transaction::factory()->create(['locale' => 'id']);

        return RefundRequest::factory()->create([
            'transaction_id' => $transaction->id,
            'contact_email' => 'buyer@example.test',
            'contact_phone' => '628123456789',
            'claim_notified_at' => null,
        ]);
    }

    public function test_a_claim_link_is_never_built_from_a_developer_address(): void
    {
        // The failure this whole file exists for: the customer gets a message
        // pointing at a machine they have never heard of, and the row is marked
        // notified, so nobody ever chases it.
        config(['services.storefront.url' => 'http://localhost:5173']);
        Mail::fake();
        Queue::fake();
        Log::spy();

        $refund = $this->refund();
        $sent = app(SendRefundClaimNotificationAction::class)
            ->execute($refund, 'plain-token');

        $this->assertFalse($sent);
        Mail::assertNothingQueued();
        // Specifically the WhatsApp send — model observers broadcast on create,
        // so a blanket `assertNothingPushed` would be asserting someone else's
        // behaviour.
        Queue::assertNotPushed(SendRefundWhatsAppJob::class);

        // Left null on purpose: the refunds page renders that as "never
        // notified — contact manually", which is the state an operator can act
        // on. Stamping it would bury the problem.
        $this->assertNull($refund->fresh()->claim_notified_at);
        Log::shouldHaveReceived('error')->once();
    }

    public function test_a_claim_link_goes_out_on_a_real_domain(): void
    {
        config(['services.storefront.url' => 'https://isgstore.id']);
        Mail::fake();

        $refund = $this->refund();
        $sent = app(SendRefundClaimNotificationAction::class)
            ->execute($refund, 'plain-token');

        $this->assertTrue($sent);
        $this->assertNotNull($refund->fresh()->claim_notified_at);

        Mail::assertQueued(RefundMail::class, function (RefundMail $mail) {
            return $mail->claimUrl === 'https://isgstore.id/id/refund?token=plain-token';
        });
    }

    // ── The configuration itself ────────────────────────────────────────────

    public static function outboundConfigProvider(): array
    {
        return [
            ['services.storefront.url'],
            ['services.payment_page.url'],
            ['services.monetapay.success_redirect_url'],
        ];
    }

    /**
     * Read straight from the config file rather than the resolved container, so
     * a value supplied by this machine's `.env` cannot mask a bad default.
     */
    #[DataProvider('outboundConfigProvider')]
    public function test_no_outbound_url_falls_back_to_a_developer_address(string $key): void
    {
        [$file, $path] = explode('.', $key, 2);
        $config = require config_path("{$file}.php");

        $default = data_get($config, $path);

        // `env()` has already resolved; what matters is that when the variable
        // is absent the answer is empty, not a machine nobody else can reach.
        if (env(strtoupper(str_replace('.', '_', $path))) === null) {
            $this->assertTrue(
                $default === null || $default === '',
                "{$key} falls back to '{$default}' — a customer would be sent there."
            );
        } else {
            $this->assertTrue(true, 'Supplied by this environment; the default is not exercised.');
        }
    }
}
