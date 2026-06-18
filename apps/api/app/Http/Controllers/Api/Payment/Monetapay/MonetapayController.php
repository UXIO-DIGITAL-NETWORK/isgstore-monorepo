<?php

namespace App\Http\Controllers\Api\Payment\Monetapay;

use App\Actions\Payment\Monetapay\CancelTransactionAction;
use App\Actions\Payment\Monetapay\QueryMonetapayAction;
use App\Actions\Payment\Monetapay\RefundTransactionAction;
use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Exception;
use Illuminate\Http\Request;

/**
 * Admin / test surface for Monetapay's read-only inquiries plus cancel & refund.
 *
 * Validation is intentionally inline here (not via FormRequest): these are
 * thin operator tools whose payloads are just id pairs forwarded verbatim to
 * Monetapay. app_id defaults to the configured merchant id where the gateway
 * expects it, so testers only need to supply the order identifiers.
 */
class MonetapayController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly QueryMonetapayAction $queryAction,
        private readonly CancelTransactionAction $cancelAction,
        private readonly RefundTransactionAction $refundAction
    ) {}

    /* ---- 5. Balance ---------------------------------------------------- */

    public function balance(Request $request)
    {
        return $this->run('balance', [
            'sub_mch_id' => $request->input('sub_mch_id'),
            'currency' => $request->input('currency'),
        ]);
    }

    /* ---- 6. Pay-in inquiries ------------------------------------------ */

    public function virtualAccount(Request $request)
    {
        $request->validate([
            'order_no' => ['required_without:mch_order_no', 'nullable', 'string'],
            'mch_order_no' => ['required_without:order_no', 'nullable', 'string'],
        ]);

        return $this->passThrough('virtual_account', $this->orderParams($request));
    }

    public function ewallet(Request $request)
    {
        $request->validate([
            'order_no' => ['required_without:mch_order_no', 'nullable', 'string'],
            'mch_order_no' => ['required_without:order_no', 'nullable', 'string'],
        ]);

        return $this->run('ewallet', $this->orderParams($request));
    }

    public function qris(Request $request)
    {
        $request->validate([
            'order_no' => ['required_without:mch_order_no', 'nullable', 'string'],
            'mch_order_no' => ['required_without:order_no', 'nullable', 'string'],
        ]);

        return $this->run('qris', $this->orderParams($request));
    }

    public function paymentLink(Request $request)
    {
        $request->validate([
            'order_no' => ['required_without:mch_order_no', 'nullable', 'string'],
            'mch_order_no' => ['required_without:order_no', 'nullable', 'string'],
        ]);

        return $this->run('payment_link', $this->orderParams($request));
    }

    public function crossBorder(Request $request)
    {
        $request->validate([
            'order_no' => ['required_without:mch_order_no', 'nullable', 'string'],
            'mch_order_no' => ['required_without:order_no', 'nullable', 'string'],
        ]);

        return $this->run('cross_border', $this->orderParams($request));
    }

    public function repay(Request $request)
    {
        $request->validate([
            'order_no' => ['required_without:mch_order_no', 'nullable', 'string'],
            'mch_order_no' => ['required_without:order_no', 'nullable', 'string'],
        ]);

        return $this->run('repay', $this->orderParams($request));
    }

    public function refundQuery(Request $request)
    {
        $request->validate([
            'payment_order_no' => ['required_without_all:refund_order_no,payment_trade_no', 'nullable', 'string'],
            'refund_order_no' => ['required_without_all:payment_order_no,payment_trade_no', 'nullable', 'string'],
            'payment_trade_no' => ['required_without_all:payment_order_no,refund_order_no', 'nullable', 'string'],
        ]);

        return $this->run('refund', $this->withAppId([
            'payment_order_no' => $request->input('payment_order_no'),
            'refund_order_no' => $request->input('refund_order_no'),
            'payment_trade_no' => $request->input('payment_trade_no'),
        ]));
    }

    public function payin(Request $request)
    {
        // Plain body endpoint — forward all provided fields, default app_id.
        return $this->run('payin', $this->withAppId($request->except(['sign'])));
    }

    public function cdm(Request $request)
    {
        return $this->run('cdm', $request->all());
    }

    /* ---- 6.5 Subscriptions -------------------------------------------- */

    public function subscription(Request $request)
    {
        $request->validate([
            'order_no' => ['required_without:mch_order_no', 'nullable', 'string'],
            'mch_order_no' => ['required_without:order_no', 'nullable', 'string'],
        ]);

        return $this->run('subscription', $this->orderParams($request));
    }

    public function subscriptionCycle(Request $request)
    {
        $request->validate([
            'order_no' => ['required', 'string'],
        ]);

        return $this->run('subscription_cycle', $this->withAppId([
            'order_no' => $request->input('order_no'),
            'page' => $request->input('page'),
            'page_size' => $request->input('page_size'),
            'after_cycle_period_index' => $request->input('after_cycle_period_index'),
        ]));
    }

    /* ---- 6.7 Sub-merchant --------------------------------------------- */

    public function subMerchant(Request $request)
    {
        $request->validate([
            'external_id' => ['required_without:mch_external_id', 'nullable', 'string'],
            'mch_external_id' => ['required_without:external_id', 'nullable', 'string'],
        ]);

        return $this->run('sub_merchant', [
            'parent_app_id' => $request->input('parent_app_id', config('services.monetapay.mch_id')),
            'external_id' => $request->input('external_id'),
            'mch_external_id' => $request->input('mch_external_id'),
        ]);
    }

    /* ---- 6.4 Payment Link Create --------------------------------------- */

    public function paymentLinkCreate(Request $request)
    {
        $request->validate(['mch_order_no' => ['required', 'string']]);

        // Pass all caller-supplied fields through to Monetapay; only app_id/sign are managed here.
        return $this->run('payment_link_create', $this->withAppId($request->except(['sign', 'app_id'])));
    }

    /* ---- 6.5 Subscription Create / Deactivate ------------------------- */

    public function customerCreate(Request $request)
    {
        $request->validate(['mch_customer_id' => ['required', 'string']]);

        return $this->run('customer_create', $this->withAppId($request->except(['sign', 'app_id'])));
    }

    public function subscriptionCreate(Request $request)
    {
        // Monetapay uses `interval` (not `interval_unit`) for the billing cycle unit.
        $request->validate([
            'mch_order_no' => ['required', 'string'],
            'mch_customer_id' => ['required', 'string'],
            'amount' => ['required'],
            'interval' => ['required', 'string'],
            'interval_count' => ['required'],
        ]);

        return $this->run('subscription_create', $this->withAppId($request->except(['sign', 'app_id'])));
    }

    public function subscriptionDeactivate(Request $request)
    {
        $request->validate([
            'order_no' => ['required_without:mch_order_no', 'nullable', 'string'],
            'mch_order_no' => ['required_without:order_no', 'nullable', 'string'],
        ]);

        return $this->run('subscription_deactivate', $this->withAppId($this->orderParams($request)));
    }

    /* ---- 7. Pay-out Create --------------------------------------------- */

    public function disbursementCreate(Request $request)
    {
        // Monetapay uses `account_bank_code` (not `bank_code`).
        // `account_number` is nullable so the "field required" error scenario (7.2) reaches Monetapay.
        $request->validate([
            'mch_order_no' => ['required', 'string'],
            'amount' => ['required'],
            'account_bank_code' => ['required', 'string'],
            'account_name' => ['required', 'string'],
        ]);

        return $this->run('disbursement_create', $this->withAppId($request->except(['sign', 'app_id'])));
    }

    public function largePayoutCreate(Request $request)
    {
        $request->validate([
            'mch_order_no' => ['required', 'string'],
            'amount' => ['required'],
            'account_bank_code' => ['required', 'string'],
            'account_name' => ['required', 'string'],
        ]);

        return $this->run('large_payout_create', $this->withAppId($request->except(['sign', 'app_id'])));
    }

    public function ewalletPayoutCreate(Request $request)
    {
        // Monetapay uses `account_bank_code` for the e-wallet provider (e.g. DANA, GOPAY)
        // and `account_phone` for the recipient phone number.
        $request->validate([
            'mch_order_no' => ['required', 'string'],
            'amount' => ['required'],
            'account_bank_code' => ['required', 'string'],
        ]);

        return $this->run('ewallet_payout_create', $this->withAppId($request->except(['sign', 'app_id'])));
    }

    /* ---- 7. Pay-out Inquiry -------------------------------------------- */

    public function disbursement(Request $request)
    {
        $request->validate([
            'order_no' => ['required_without:mch_order_no', 'nullable', 'string'],
            'mch_order_no' => ['required_without:order_no', 'nullable', 'string'],
        ]);

        return $this->run('disbursement', $this->orderParams($request, withAppId: false));
    }

    /* ---- 8. Account Validation ---------------------------------------- */

    public function accountValidation(Request $request)
    {
        $validated = $request->validate([
            'mch_order_no' => ['required', 'string'],
            'account_bank_code' => ['required', 'string'],
            'account_number' => ['required', 'string'],
            'account_type' => ['nullable', 'string'],
            'ori_account_name' => ['nullable', 'string'],
        ]);

        return $this->run('account_validation', $this->withAppId(array_merge($validated, [
            'account_type' => $validated['account_type'] ?? '1',
        ])));
    }

    /* ---- 9. Transaction records --------------------------------------- */

    public function dailyBill(Request $request)
    {
        return $this->passThrough('daily_bill', $request->only([
            'start_date', 'end_date', 'currency', 'page', 'page_size',
        ]));
    }

    public function billFlow(Request $request)
    {
        return $this->passThrough('bill_flow', $request->only([
            'start_time', 'end_time', 'page', 'page_size', 'type', 'currency',
            'mch_order_no', 'order_no', 'trade_no',
        ]));
    }

    /* ---- 15. Transfer -------------------------------------------------- */

    public function transferQuery(Request $request)
    {
        $request->validate([
            'transfer_order_no' => ['required_without:mch_order_no', 'nullable', 'string'],
            'mch_order_no' => ['required_without:transfer_order_no', 'nullable', 'string'],
        ]);

        return $this->run('transfer', [
            'transfer_order_no' => $request->input('transfer_order_no'),
            'mch_order_no' => $request->input('mch_order_no'),
        ]);
    }

    /* ---- 16. Merchant permission -------------------------------------- */

    public function merchantPermission(Request $request)
    {
        return $this->run('merchant_permission', [
            'mch_id' => $request->input('mch_id', config('services.monetapay.mch_id')),
            'external_id' => $request->input('external_id'),
        ]);
    }

    /* ---- 6.6 Cancel & Refund (state-changing) ------------------------- */

    public function cancel(Request $request)
    {
        $request->validate([
            'order_no' => ['required_without:mch_order_no', 'nullable', 'string'],
            'mch_order_no' => ['required_without:order_no', 'nullable', 'string'],
        ]);

        $params = $this->withAppId([
            'sub_mch_id' => $request->input('sub_mch_id'),
            'order_no' => $request->input('order_no'),
            'mch_order_no' => $request->input('mch_order_no'),
        ]);

        try {
            return $this->successResponse($this->cancelAction->execute($params), 'Monetapay cancel sent.');
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }

    public function refund(Request $request)
    {
        $validated = $request->validate([
            'refund_mch_order_no' => ['required', 'string'],
            'payment_order_no' => ['required', 'string'],
            'payment_trade_no' => ['nullable', 'string'],
            'amount' => ['required'],
            'reason' => ['nullable', 'string'],
            'additional_info' => ['nullable', 'string'],
        ]);

        try {
            return $this->successResponse(
                $this->refundAction->execute($this->withAppId($validated)),
                'Monetapay refund sent.'
            );
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }

    /* ---- helpers ------------------------------------------------------- */

    /**
     * Pass through the raw Monetapay response without ApiResponse wrapping.
     * Used for endpoints (bill flow, daily bill) where the SIT test validates
     * the exact Monetapay JSON body including top-level code/message/data/meta.
     *
     * @param  array<string,mixed>  $params
     */
    private function passThrough(string $resource, array $params)
    {
        try {
            $response = $this->queryAction->execute($resource, $params);

            return response()->json($response, 200);
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }

    /**
     * Run a read-only inquiry through the dispatcher and wrap the response.
     *
     * @param  array<string,mixed>  $params
     */
    private function run(string $resource, array $params)
    {
        try {
            $response = $this->queryAction->execute($resource, $params);
            $code = $response['code'] ?? null;

            if ($code !== null && (int) $code !== 0) {
                return $this->errorResponse($response['message'] ?? 'Monetapay error', 400, $response);
            }

            return $this->successResponse($response);
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }

    /**
     * Standard order-lookup params (order_no | mch_order_no) with optional app_id.
     *
     * @return array<string,mixed>
     */
    private function orderParams(Request $request, bool $withAppId = true): array
    {
        $params = [
            'sub_mch_id' => $request->input('sub_mch_id'),
            'order_no' => $request->input('order_no'),
            'mch_order_no' => $request->input('mch_order_no'),
        ];

        return $withAppId ? $this->withAppId($params) : $params;
    }

    /**
     * Default app_id to the configured merchant id when the caller omits it.
     *
     * @param  array<string,mixed>  $params
     * @return array<string,mixed>
     */
    private function withAppId(array $params): array
    {
        $params['app_id'] ??= config('services.monetapay.mch_id');

        return $params;
    }
}
