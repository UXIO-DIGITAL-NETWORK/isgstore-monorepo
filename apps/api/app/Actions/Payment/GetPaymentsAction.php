<?php

namespace App\Actions\Payment;

use App\Models\Payment;
use Illuminate\Pagination\LengthAwarePaginator;

class GetPaymentsAction
{
    public function execute(int $perPage = 15): LengthAwarePaginator
    {
        return Payment::with(['transaction', 'paymentChannel'])->latest()->paginate($perPage);
    }
}
