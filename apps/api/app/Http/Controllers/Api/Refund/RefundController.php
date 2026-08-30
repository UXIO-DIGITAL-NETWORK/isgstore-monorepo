<?php

namespace App\Http\Controllers\Api\Refund;

use App\Actions\Refund\CompleteRefundRequestAction;
use App\Actions\Refund\ListRefundRequestsAction;
use App\Actions\Refund\ProcessRefundRequestAction;
use App\Actions\Refund\RejectRefundRequestAction;
use App\Actions\Refund\SubmitRefundPayoutDetailsAction;
use App\DTOs\Refund\CompleteRefundDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\Refund\CompleteRefundRequest;
use App\Http\Requests\Refund\ListRefundRequestsRequest;
use App\Http\Requests\Refund\RejectRefundRequest;
use App\Http\Requests\Refund\SubmitPayoutDetailsRequest;
use App\Http\Resources\Api\Refund\RefundRequestResource;
use App\Models\RefundRequest;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use RuntimeException;

/**
 * The admin refund queue: everything an operator does between "we owe this
 * person money" and "we sent it".
 *
 * Every state-changing action can legitimately be refused (already completed,
 * held by another admin, no payout account yet), so each one maps the action's
 * RuntimeException to a 422 rather than letting it 500.
 */
class RefundController extends Controller
{
    use ApiResponse;

    private const RELATIONS = ['transaction.product', 'user', 'processedBy'];

    public function index(ListRefundRequestsRequest $request, ListRefundRequestsAction $action)
    {
        $refunds = $action->execute($request->toDTO());

        return $this->paginatedResponse(
            RefundRequestResource::collection($refunds),
            'Refund requests retrieved successfully'
        );
    }

    public function statusCounts(ListRefundRequestsAction $action)
    {
        return $this->successResponse($action->statusCounts(), 'Refund status counts retrieved successfully');
    }

    public function show(RefundRequest $refundRequest)
    {
        return $this->successResponse(
            new RefundRequestResource($refundRequest->load(self::RELATIONS)),
            'Refund request retrieved successfully'
        );
    }

    /** An admin filling in the payout account on the customer's behalf. */
    public function payoutDetails(SubmitPayoutDetailsRequest $request, RefundRequest $refundRequest, SubmitRefundPayoutDetailsAction $action)
    {
        try {
            $refund = $action->execute($refundRequest, $request->toDTO(), submittedBy: 'admin');
        } catch (RuntimeException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }

        return $this->successResponse(
            new RefundRequestResource($refund->load(self::RELATIONS)),
            'Payout details saved successfully'
        );
    }

    public function process(Request $request, RefundRequest $refundRequest, ProcessRefundRequestAction $action)
    {
        try {
            $refund = $action->execute($refundRequest, $request->user());
        } catch (RuntimeException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }

        return $this->successResponse(
            new RefundRequestResource($refund->load(self::RELATIONS)),
            'Refund claimed for processing'
        );
    }

    public function complete(CompleteRefundRequest $request, RefundRequest $refundRequest, CompleteRefundRequestAction $action)
    {
        // Transfer proof is evidence: stored byte-for-byte as the admin
        // uploaded it, never through ImageOptimizer.
        $proofPath = $request->hasFile('proof')
            ? $request->file('proof')->store('refunds/proofs', 'public')
            : null;

        try {
            $refund = $action->execute($refundRequest, $request->user(), new CompleteRefundDTO(
                proofPath: $proofPath,
                note: $request->validated('note'),
            ));
        } catch (RuntimeException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }

        return $this->successResponse(
            new RefundRequestResource($refund->load(self::RELATIONS)),
            'Refund completed successfully'
        );
    }

    public function reject(RejectRefundRequest $request, RefundRequest $refundRequest, RejectRefundRequestAction $action)
    {
        try {
            $refund = $action->execute($refundRequest, $request->user(), $request->validated('reason'));
        } catch (RuntimeException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }

        return $this->successResponse(
            new RefundRequestResource($refund->load(self::RELATIONS)),
            'Refund rejected'
        );
    }
}
