<?php

namespace App\Http\Controllers\Api;

use App\Actions\Financial\GetFinancialSummaryAction;
use App\Actions\Financial\GetPaymentGatewayBalancesAction;
use App\Actions\Financial\GetSupplierBalancesAction;
use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class FinancialController extends Controller
{
    use ApiResponse;

    public function summary(Request $request, GetFinancialSummaryAction $action)
    {
        return $this->successResponse($action->execute($request->user()?->timezone), 'Financial summary retrieved successfully');
    }

    public function paymentGateways(GetPaymentGatewayBalancesAction $action)
    {
        return $this->successResponse($action->execute(), 'Payment gateway balances retrieved successfully');
    }

    public function suppliers(GetSupplierBalancesAction $action)
    {
        return $this->successResponse($action->execute(), 'Supplier balances retrieved successfully');
    }
}
