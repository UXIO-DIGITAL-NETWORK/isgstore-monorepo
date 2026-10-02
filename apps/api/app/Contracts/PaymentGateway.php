<?php

declare(strict_types=1);

namespace App\Contracts;

use App\Services\Payment\MonetapayService;

/**
 * The shape every payment-gateway adapter must wear.
 *
 * Same rule as the supplier seam: the engine knows the SHAPE, never the brand.
 * A client on another gateway implements this and changes one line of config;
 * nothing in checkout, payouts, the callbacks, or the settlement sweeps is
 * touched.
 *
 * The contract is deliberately the ENGINE-CRITICAL subset — charges, payouts,
 * reversals, the status inquiries the scheduler settles with, balance reads,
 * and callback verification. A gateway's admin-only diagnostic toolbox (the
 * ~30 inquiry endpoints an operator can fire by hand) is NOT here: that is
 * vendor tooling, not engine surface.
 *
 * @see MonetapayService the default adapter (driver `monetapay`)
 */
interface PaymentGateway
{
    /* ── Identity ─────────────────────────────────────────────────────────── */

    /** The merchant/sub-merchant this site trades as, as the gateway names it. */
    public function subMchId(): string;

    /* ── Callback verification (the gateway signs what it sends) ──────────── */

    /**
     * Decodes the `en_data` blob from a callback into the flat payload the
     * handlers read.
     *
     * @return array<string,mixed>
     */
    public function decryptPayload(string $encodedContent): array;

    /** Whether the decoded payload really came from the gateway (its own signature). */
    public function verifyCallbackSignature(array $payload): bool;

    /** Whether a callback is addressed to a DIFFERENT merchant and must be ignored. */
    public function callbackTargetsAnotherMerchant(array $decrypted): bool;

    /* ── Charges (money in) ───────────────────────────────────────────────── */

    /**
     * Opens a payment for `$referenceId` on one channel.
     *
     * @param  string  $paymentType  the site's own channel type (virtual_account | ewallet | qris | ...); the adapter maps it to its own endpoint
     * @return array<string,mixed>
     */
    public function createTransaction(string $referenceId, int $amount, string $paymentType, string $channelCode, array $customerData = []): array;

    /**
     * Creates a hosted payment page instead of a per-channel charge.
     *
     * @return array<string,mixed>
     */
    public function createPaymentLink(array $params): array;

    /* ── Payouts (money out) ──────────────────────────────────────────────── */

    /**
     * Sends a bank payout.
     *
     * @return array<string,mixed>
     */
    public function createDisbursement(array $params): array;

    /**
     * Sends an e-wallet payout (a different rail, and a different payload).
     *
     * @return array<string,mixed>
     */
    public function createEwalletPayout(array $params): array;

    /* ── Reversal ─────────────────────────────────────────────────────────── */

    /**
     * @return array<string,mixed>
     */
    public function cancelTransaction(array $params): array;

    /**
     * @return array<string,mixed>
     */
    public function refundTransaction(array $params): array;

    /* ── Status inquiries the settlement sweeps settle with ───────────────── */

    /**
     * @return array<string,mixed>
     */
    public function inquiryVirtualAccount(array $params): array;

    /**
     * @return array<string,mixed>
     */
    public function inquiryEwallet(array $params): array;

    /**
     * @return array<string,mixed>
     */
    public function inquiryQris(array $params): array;

    /**
     * @return array<string,mixed>
     */
    public function inquiryPaymentLink(array $params): array;

    /**
     * @return array<string,mixed>
     */
    public function inquiryDisbursement(array $params): array;

    /* ── Balances ─────────────────────────────────────────────────────────── */

    /**
     * @return array<string,mixed>
     */
    public function inquiryBalance(?string $subMchId = null, ?string $currency = null): array;

    /**
     * @return array<string,mixed>
     */
    public function inquiryBalanceCached(?string $subMchId = null, ?string $currency = null): array;

    /**
     * @return array<string,mixed>
     */
    public function inquiryMainMerchantBalance(?string $currency = null): array;

    /**
     * @return array<string,mixed>
     */
    public function inquiryMainMerchantBalanceCached(?string $currency = null): array;

    /* ── Cache namespaces ─────────────────────────────────────────────────── */

    /**
     * The balance cache key, public so cache-busting callers (integration ping,
     * credential update, the Hub's refresh) forget the SAME entry the adapter
     * writes rather than a stale literal.
     */
    public function balanceCacheKey(?string $subMchId = null, ?string $currency = null): string;

    /** The main-merchant balance cache key, kept apart from the sub-merchant one. */
    public function mainBalanceCacheKey(?string $currency = null): string;
}
