<?php

namespace App\Http\Controllers\Api\Payment\Monetapay;

use App\Actions\Payment\Monetapay\RdlMonetapayAction;
use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Exception;
use Illuminate\Http\Request;

/**
 * Admin / test surface for the Monetapay RDL (escrow / P2P-lending) API.
 *
 * Thin router: validate → forward to RdlMonetapayAction → return the raw RDL
 * body. RDL responses use response_code/response_msg (not code/message), so the
 * tester sees the gateway's exact payload via passThrough() — matching how the
 * SIT scenarios assert results.
 */
class MonetapayRdlController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly RdlMonetapayAction $rdlAction
    ) {}

    /* ---- 2.1–2.8 Customer --------------------------------------------- */

    public function customerCreate(Request $request)
    {
        $request->validate([
            'mch_customer_id' => ['required', 'string'],
            'type' => ['required', 'string'],
            'customer_accounts' => ['required', 'array', 'min:1'],
            'customer_accounts.*.bank_code' => ['required', 'string'],
            'customer_accounts.*.account_number' => ['required', 'string'],
            'customer_accounts.*.account_type' => ['nullable', 'string'],
            'customer_accounts.*.is_preferred' => ['nullable', 'boolean'],
        ]);

        return $this->passThrough('rdl_customer_create', $request->except(['sign']));
    }

    public function customerInquiry(Request $request)
    {
        $request->validate([
            'mch_customer_id' => ['required_without:customerId', 'nullable', 'string'],
            'customerId' => ['required_without:mch_customer_id', 'nullable', 'string'],
        ]);

        return $this->passThrough('rdl_customer_inquiry', $request->except(['sign']));
    }

    public function customerUpdate(Request $request)
    {
        $request->validate([
            'mch_customer_id' => ['required', 'string'],
            'customerId' => ['required', 'string'],
        ]);

        return $this->passThrough('rdl_customer_update', $request->except(['sign']));
    }

    /* ---- 2.10–2.15 VA / Collection ------------------------------------ */

    public function vaCreate(Request $request)
    {
        $request->validate([
            'mch_order_no' => ['required', 'string'],
            'bank_code' => ['required', 'string'],
            'name' => ['required', 'string'],
            'expected_amount' => ['required'],
            'customer_id' => ['required', 'string'],
        ]);

        return $this->passThrough('rdl_va_create', $request->except(['sign']));
    }

    public function vaInquiry(Request $request)
    {
        $request->validate([
            'order_no' => ['required_without:mch_order_no', 'nullable', 'string'],
            'mch_order_no' => ['required_without:order_no', 'nullable', 'string'],
        ]);

        return $this->passThrough('rdl_va_inquiry', $request->except(['sign']));
    }

    /* ---- 2.17–2.22 Escrow Disbursement -------------------------------- */

    public function disbursementCreate(Request $request)
    {
        $request->validate([
            'mch_order_no' => ['required', 'string'],
            'borrower_id' => ['required', 'string'],
            'lenders' => ['required', 'array', 'min:1'],
            'lenders.*.customer_id' => ['required', 'string'],
            'lenders.*.funded_amount' => ['required'],
            'destination_account_code' => ['required', 'string'],
            'destination_account_number' => ['required', 'string'],
        ]);

        return $this->passThrough('rdl_disbursement_create', $request->except(['sign']));
    }

    public function disbursementInquiry(Request $request)
    {
        $request->validate([
            'order_no' => ['required_without:mch_order_no', 'nullable', 'string'],
            'mch_order_no' => ['required_without:order_no', 'nullable', 'string'],
        ]);

        return $this->passThrough('rdl_disbursement_inquiry', $request->except(['sign']));
    }

    /* ---- helpers ------------------------------------------------------- */

    /**
     * Forward to the RDL dispatcher and return the gateway's raw body (200),
     * or a wrapped error on transport failure. RDL outcome lives in
     * response_code/response_msg, which the caller inspects directly.
     *
     * @param  array<string,mixed>  $params
     */
    private function passThrough(string $resource, array $params)
    {
        try {
            return response()->json($this->rdlAction->execute($resource, $params), 200);
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }
}
