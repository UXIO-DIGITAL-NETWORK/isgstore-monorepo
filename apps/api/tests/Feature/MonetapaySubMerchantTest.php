<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Services\Payment\MonetapayService;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * The site trades as ONE Monetapay sub-merchant under the parent `mch_id`,
 * sharing the parent's credentials — `sub_mch_id` is the only thing that tells
 * the gateway which books a call belongs to. It therefore has to ride inside the
 * SIGNED, AES-encrypted TreeMap: a value that never reaches `en_data` is a value
 * Monetapay does not read, and the pay-in silently lands on the parent instead.
 */
class MonetapaySubMerchantTest extends TestCase
{
    private const SUB = 'SUBMCH-001';

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.monetapay.mch_id' => 'MCH-1',
            'services.monetapay.sub_mch_id' => self::SUB,
            'services.monetapay.collection_app_id' => 'COLLECT-1',
            'services.monetapay.disbursement_app_id' => 'PAYOUT-1',
            'services.monetapay.partner_key' => 'partner-key',
            'services.monetapay.token' => 'test-token',
            'services.monetapay.aes_key' => 'aeskey1234567890',
            'services.monetapay.aes_iv' => 'aesiv12345678901',
            // Payout falls back to the collection creds only when its own are
            // blank; a leftover env value would otherwise encrypt with a key
            // this test cannot read back.
            'services.monetapay.disbursement_token' => 'test-token',
            'services.monetapay.disbursement_partner_key' => 'partner-key',
            'services.monetapay.disbursement_aes_key' => 'aeskey1234567890',
            'services.monetapay.disbursement_aes_iv' => 'aesiv12345678901',
        ]);
    }

    /** The signed business params of the last outbound call, decrypted back out of en_data. */
    private function sentParams(MonetapayService $service): array
    {
        $sent = [];

        Http::recorded(function (Request $request) use (&$sent) {
            $sent[] = $request->data();
        });

        $this->assertNotEmpty($sent, 'No request was sent to Monetapay.');

        return $service->decryptPayload(end($sent)['data']['en_data']);
    }

    public function test_checkout_books_the_pay_in_against_the_sub_merchant(): void
    {
        Http::fake(fn () => Http::response(['code' => 0, 'data' => ['order_no' => 'MP-1', 'virtual_account' => '88810001']]));

        $service = app(MonetapayService::class);
        $service->createTransaction('INV-1', 25000, 'virtual_account', 'BNI');

        $params = $this->sentParams($service);

        $this->assertSame(self::SUB, $params['sub_mch_id'] ?? null);
        // app_id stays the COLLECTION app id — the two identifiers are not interchangeable.
        $this->assertSame('COLLECT-1', $params['app_id']);
    }

    public function test_qris_checkout_carries_the_sub_merchant_too(): void
    {
        Http::fake(fn () => Http::response(['code' => 0, 'data' => ['order_no' => 'MP-2', 'qr_string' => '000201...']]));

        $service = app(MonetapayService::class);
        $service->createTransaction('INV-2', 15000, 'qris', 'QRIS');

        $this->assertSame(self::SUB, $this->sentParams($service)['sub_mch_id'] ?? null);
    }

    public function test_the_sign_covers_the_sub_merchant(): void
    {
        Http::fake(fn () => Http::response(['code' => 0, 'data' => ['order_no' => 'MP-3']]));

        $service = app(MonetapayService::class);
        $service->createTransaction('INV-3', 25000, 'virtual_account', 'BNI');

        // Recomputing the signature the way the gateway does must reproduce the
        // one we sent — proof sub_mch_id joined the TreeMap BEFORE it was signed,
        // not after. Appended later, the field would travel but never verify.
        $params = $this->sentParams($service);
        $sign = $params['sign'];
        $timestamp = $params['timestamp'];
        unset($params['sign'], $params['timestamp']);

        $this->assertArrayHasKey('sub_mch_id', $params);

        ksort($params);
        $buffer = '';
        foreach ($params as $key => $value) {
            $buffer .= $key.'='.$value.'__';
        }

        $this->assertSame(
            md5(md5('test-token'.'*|*'.substr($buffer, 0, -2).'@!@'.$timestamp)),
            $sign,
        );
    }

    public function test_payouts_are_debited_from_the_sub_merchant(): void
    {
        Http::fake(fn () => Http::response(['code' => 0, 'data' => ['order_no' => 'PO-1']]));

        $service = app(MonetapayService::class);
        $service->createDisbursement([
            'mch_order_no' => 'WD-1',
            'amount' => '50000',
            'account_bank_code' => 'BCA',
            'account_name' => 'Someone',
            'account_number' => '1234567890',
            'account_phone' => '08123456789',
        ]);

        $params = $this->sentParams($service);

        $this->assertSame(self::SUB, $params['sub_mch_id'] ?? null);
        $this->assertSame('PAYOUT-1', $params['app_id']);
    }

    public function test_inquiries_default_to_the_sub_merchant_but_an_explicit_one_wins(): void
    {
        Http::fake(fn () => Http::response(['code' => 0, 'data' => []]));

        $service = app(MonetapayService::class);

        $service->inquiryQris(['mch_order_no' => 'INV-1']);
        $this->assertSame(self::SUB, $this->sentParams($service)['sub_mch_id'] ?? null);

        // The operator tools may inspect another sub-merchant; that must not be
        // overwritten by the site's own default.
        $service->inquiryQris(['sub_mch_id' => 'OTHER-9', 'mch_order_no' => 'INV-1']);
        $this->assertSame('OTHER-9', $this->sentParams($service)['sub_mch_id'] ?? null);
    }

    public function test_the_sub_merchant_registration_query_is_addressed_to_the_parent(): void
    {
        Http::fake(fn () => Http::response(['code' => 0, 'data' => []]));

        $service = app(MonetapayService::class);
        $service->inquirySubMerchant(['parent_app_id' => 'MCH-1', 'external_id' => 'EXT-1']);

        // This endpoint asks the PARENT about a registration; stamping the site's
        // own sub_mch_id on it would be answering a different question.
        $this->assertArrayNotHasKey('sub_mch_id', $this->sentParams($service));
    }

    public function test_balance_reads_and_cache_busting_agree_on_one_key(): void
    {
        Http::fake(fn () => Http::response(['code' => 0, 'data' => ['current_balance' => '1000']]));

        $service = app(MonetapayService::class);

        // The key an omitted argument resolves to is the sub-merchant's, so the
        // finance panel's read and a ping's cache-bust hit the same entry.
        $this->assertSame(
            app(MonetapayService::class)->balanceCacheKey(self::SUB),
            app(MonetapayService::class)->balanceCacheKey(),
        );

        $service->inquiryBalance();
        $this->assertSame(self::SUB, $this->sentParams($service)['sub_mch_id'] ?? null);
    }

    public function test_an_unset_sub_merchant_leaves_every_call_as_it_was(): void
    {
        config(['services.monetapay.sub_mch_id' => null]);
        Http::fake(fn () => Http::response(['code' => 0, 'data' => ['order_no' => 'MP-4']]));

        $service = app(MonetapayService::class);
        $service->createTransaction('INV-4', 25000, 'virtual_account', 'BNI');

        // Monetapay drops blank fields from the TreeMap it re-signs, so sending
        // `sub_mch_id=` would break the signature outright. Absent is the only
        // safe representation of "main merchant".
        $this->assertArrayNotHasKey('sub_mch_id', $this->sentParams($service));
        $this->assertStringEndsWith(':main:IDR', app(MonetapayService::class)->balanceCacheKey());
    }
}
