<?php

namespace App\Http\Controllers\Api;

use App\Actions\Transaction\AdminRefundTransactionAction;
use App\Actions\Transaction\AdminResendCallbackAction;
use App\Actions\Transaction\AdminRetryTransactionAction;
use App\Actions\Transaction\CreateTransactionAction;
use App\Actions\Transaction\DeleteTransactionAction;
use App\Actions\Transaction\GetTransactionsAction;
use App\Actions\Transaction\GetTransactionStatusCountsAction;
use App\Actions\Transaction\ManualReviewTransactionAction;
use App\Actions\Transaction\UpdateTransactionAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Transaction\ManualReviewTransactionRequest;
use App\Http\Requests\Transaction\RefundTransactionRequest;
use App\Http\Requests\Transaction\StoreTransactionRequest;
use App\Http\Requests\Transaction\UpdateTransactionRequest;
use App\Http\Resources\Api\Transaction\TransactionResource;
use App\Models\Transaction;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class TransactionController extends Controller
{
    use ApiResponse;

    public function statusCounts(GetTransactionStatusCountsAction $action)
    {
        return $this->successResponse($action->execute(), 'Transaction status counts retrieved successfully');
    }

    public function index(Request $request, GetTransactionsAction $action)
    {
        $perPage = min(100, max(1, (int) $request->query('per_page', 15)));
        $status = $request->query('status');       // e.g. ?status=PENDING
        $search = $request->query('search');       // e.g. ?search=INV-20260605

        $transactions = $action->execute($perPage, $status, $search);

        return $this->paginatedResponse(TransactionResource::collection($transactions), 'Transactions retrieved successfully');
    }

    public function store(StoreTransactionRequest $request, CreateTransactionAction $action)
    {
        $transaction = $action->execute($request->toDTO());

        return $this->successResponse(
            new TransactionResource($transaction->load(['user', 'product', 'supplier', 'payment', 'paymentChannel'])),
            'Transaction created successfully',
            201
        );
    }

    public function show(Transaction $transaction)
    {
        return $this->successResponse(
            new TransactionResource($transaction->load(['user', 'product', 'supplier', 'payment', 'paymentChannel'])),
            'Transaction retrieved successfully'
        );
    }

    public function update(UpdateTransactionRequest $request, Transaction $transaction, UpdateTransactionAction $action)
    {
        $transaction = $action->execute($transaction, $request->toDTO());

        return $this->successResponse(
            new TransactionResource($transaction->load(['user', 'product', 'supplier', 'payment', 'paymentChannel'])),
            'Transaction updated successfully'
        );
    }

    public function destroy(Transaction $transaction, DeleteTransactionAction $action)
    {
        $action->execute($transaction);

        return $this->successResponse(null, 'Transaction deleted successfully');
    }

    public function manualReview(ManualReviewTransactionRequest $request, Transaction $transaction, ManualReviewTransactionAction $action)
    {
        $transaction = $action->execute($transaction, $request->toDTO());

        return $this->successResponse(
            new TransactionResource($transaction->load(['user', 'product', 'supplier', 'payment', 'paymentChannel'])),
            'Transaction reviewed successfully'
        );
    }

    public function refund(RefundTransactionRequest $request, Transaction $transaction, AdminRefundTransactionAction $action)
    {
        $transaction = $action->execute($transaction, $request->validated('reason'));

        return $this->successResponse(
            new TransactionResource($transaction->load(['user', 'product', 'supplier', 'payment', 'paymentChannel'])),
            'Transaction refunded successfully'
        );
    }

    public function resendCallback(Transaction $transaction, AdminResendCallbackAction $action)
    {
        try {
            $transaction = $action->execute($transaction);
        } catch (InvalidArgumentException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }

        return $this->successResponse(
            new TransactionResource($transaction->load(['user', 'product', 'supplier', 'payment', 'paymentChannel'])),
            'Callback resent successfully'
        );
    }

    public function retry(Transaction $transaction, AdminRetryTransactionAction $action)
    {
        $transaction = $action->execute($transaction);

        return $this->successResponse(
            new TransactionResource($transaction->load(['user', 'product', 'supplier', 'payment', 'paymentChannel'])),
            'Transaction retried successfully'
        );
    }
}
