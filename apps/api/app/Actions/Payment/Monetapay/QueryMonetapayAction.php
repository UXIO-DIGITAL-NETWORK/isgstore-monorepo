<?php

namespace App\Actions\Payment\Monetapay;

use App\Services\Payment\MonetapayService;
use InvalidArgumentException;

/**
 * Read-only Monetapay inquiry dispatcher.
 *
 * One task: run a single, side-effect-free inquiry against Monetapay and return
 * the raw decoded response. The controller picks the resource; this Action owns
 * the resource → service-method mapping so controllers stay pure routers.
 */
class QueryMonetapayAction
{
    /** Resource key => MonetapayService method. */
    private const RESOURCES = [
        'balance' => 'inquiryBalance',         // handled specially (string arg)
        'virtual_account' => 'inquiryVirtualAccount',
        'ewallet' => 'inquiryEwallet',
        'qris' => 'inquiryQris',
        'payment_link' => 'inquiryPaymentLink',
        'cross_border' => 'inquiryCrossBorderQr',
        'repay' => 'inquiryRepay',
        'refund' => 'inquiryRefund',
        'subscription' => 'inquirySubscription',
        'subscription_cycle' => 'fetchSubscriptionCycle',
        'sub_merchant' => 'inquirySubMerchant',
        'cdm' => 'inquiryCdm',
        'payin' => 'inquiryPayin',
        'disbursement' => 'inquiryDisbursement',
        'account_validation' => 'accountValidation',
        'daily_bill' => 'dailyBillInquiry',
        'bill_flow' => 'billFlowInquiry',
        'transfer' => 'transferQuery',
        'merchant_permission' => 'merchantPermissionQuery',
    ];

    public function __construct(
        private readonly MonetapayService $monetapayService
    ) {}

    /**
     * @param  array<string,mixed>  $params
     * @return array<string,mixed>
     */
    public function execute(string $resource, array $params): array
    {
        if (! isset(self::RESOURCES[$resource])) {
            throw new InvalidArgumentException("Unknown Monetapay inquiry resource: {$resource}");
        }

        // Balance takes an optional sub-merchant id rather than a params array.
        if ($resource === 'balance') {
            return $this->monetapayService->inquiryBalance($params['sub_mch_id'] ?? null);
        }

        $method = self::RESOURCES[$resource];

        return $this->monetapayService->{$method}($params);
    }
}
