<?php

namespace App\Actions\Payment\Monetapay;

use App\Services\Payment\MonetapayRdlService;
use InvalidArgumentException;

/**
 * Monetapay RDL dispatcher.
 *
 * One task: forward a single RDL request to the right service method and return
 * the raw decoded response. Keeps MonetapayRdlController a pure router, mirroring
 * QueryMonetapayAction for the payment API.
 */
class RdlMonetapayAction
{
    /** Resource key => MonetapayRdlService method. */
    private const RESOURCES = [
        'rdl_customer_create' => 'createCustomer',
        'rdl_customer_inquiry' => 'inquiryCustomer',
        'rdl_customer_update' => 'updateCustomer',
        'rdl_va_create' => 'createVa',
        'rdl_va_inquiry' => 'inquiryVa',
        'rdl_disbursement_create' => 'createDisbursement',
        'rdl_disbursement_inquiry' => 'inquiryDisbursement',
    ];

    public function __construct(
        private readonly MonetapayRdlService $rdlService
    ) {}

    /**
     * @param  array<string,mixed>  $params
     * @return array<string,mixed>
     */
    public function execute(string $resource, array $params): array
    {
        if (! isset(self::RESOURCES[$resource])) {
            throw new InvalidArgumentException("Unknown Monetapay RDL resource: {$resource}");
        }

        $method = self::RESOURCES[$resource];

        return $this->rdlService->{$method}($params);
    }
}
