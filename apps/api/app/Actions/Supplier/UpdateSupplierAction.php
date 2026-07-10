<?php

namespace App\Actions\Supplier;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\DTOs\Supplier\UpdateSupplierDTO;
use App\Models\Supplier;
use Illuminate\Support\Facades\Auth;

class UpdateSupplierAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(Supplier $supplier, UpdateSupplierDTO $dto): Supplier
    {
        $supplier->update([
            'name' => $dto->name,
            'status' => $dto->status,
        ]);

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Updated Supplier: {$supplier->name}"
        ));

        return $supplier->fresh();
    }
}
