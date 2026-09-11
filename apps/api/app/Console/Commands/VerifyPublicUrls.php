<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Support\PublicUrl;
use Illuminate\Console\Command;

/**
 * Proves that every link this deployment can put in front of a customer points
 * somewhere they could actually open.
 *
 * The guards in `PublicUrl` stop a dead link from being *sent*, which is the
 * right behaviour at the moment of sending but a bad way to find out: the first
 * signal is a refund nobody can claim. This is the check that turns a missing
 * `STOREFRONT_URL` into a failed deploy instead.
 *
 * Exits non-zero, so it can gate one — same contract as `pricing:verify`.
 */
class VerifyPublicUrls extends Command
{
    protected $signature = 'urls:verify';

    protected $description = 'Check that every customer-facing base URL is set to a publicly reachable address';

    /**
     * Config key → what breaks when it is wrong, in the operator's terms.
     *
     * `required` means a customer-facing flow is broken without it. The
     * optional ones degrade — the link is withheld — but are still worth
     * reporting, because "withheld" was almost certainly not the intent.
     *
     * @var array<string, array{env: string, required: bool, breaks: string}>
     */
    private const URLS = [
        'app.url' => [
            'env' => 'APP_URL',
            'required' => true,
            // Laravel keeps its own `http://localhost` default here, which is
            // right for a framework and wrong for this deployment: the public
            // disk builds every uploaded image's URL from it, so a localhost
            // value breaks every category logo and avatar for every customer.
            'breaks' => 'the URL of every uploaded image (category logos, avatars) the storefront renders',
        ],
        'services.storefront.url' => [
            'env' => 'STOREFRONT_URL',
            'required' => true,
            'breaks' => 'refund claim links (WhatsApp + email) and the receipt "track order" button',
        ],
        'services.payment_page.url' => [
            'env' => 'PAYMENT_PAGE_URL',
            'required' => true,
            'breaks' => "the admin sidebar's renew-subscription link",
        ],
        'services.monetapay.success_redirect_url' => [
            'env' => 'MONETAPAY_SUCCESS_REDIRECT_URL',
            'required' => false,
            'breaks' => 'where an e-wallet payer lands after paying (the gateway default applies without it)',
        ],
    ];

    public function handle(): int
    {
        $failed = false;

        foreach (self::URLS as $key => $meta) {
            $value = config($key);
            $ok = PublicUrl::isPublic(is_string($value) ? $value : null);

            if ($ok) {
                $this->line("  <fg=green>✓</> {$meta['env']} = {$value}");

                continue;
            }

            $shown = ($value === null || $value === '') ? '(not set)' : $value;

            if ($meta['required']) {
                $failed = true;
                $this->error("  ✗ {$meta['env']} = {$shown} — breaks {$meta['breaks']}.");
            } else {
                $this->warn("  ! {$meta['env']} = {$shown} — affects {$meta['breaks']}.");
            }
        }

        if ($failed) {
            $this->newLine();
            $this->error('Set these to the live domain. A localhost or private address is reachable from this server and from nobody else.');

            return self::FAILURE;
        }

        $this->info('Every customer-facing URL is publicly reachable.');

        return self::SUCCESS;
    }
}
