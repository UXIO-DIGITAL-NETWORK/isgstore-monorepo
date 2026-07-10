<?php

namespace App\Http\Controllers\Api;

use App\Actions\Transaction\CreateTransactionAction;
use App\Actions\Transaction\DeleteTransactionAction;
use App\Actions\Transaction\GetTransactionsAction;
use App\Actions\Transaction\UpdateTransactionAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Transaction\StoreTransactionRequest;
use App\Http\Requests\Transaction\UpdateTransactionRequest;
use App\Http\Resources\Api\Transaction\TransactionResource;
use App\Models\Transaction;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    use ApiResponse;

    public function index(Request $request, GetTransactionsAction $action)
    {
        $perPage = (int) $request->query('per_page', 15);
        $status = $request->query('status');       // e.g. ?status=PENDING
        $search = $request->query('search');       // e.g. ?search=INV-20260605

        $transactions = $action->execute($perPage, $status, $search);

        return TransactionResource::collection($transactions);
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
}
