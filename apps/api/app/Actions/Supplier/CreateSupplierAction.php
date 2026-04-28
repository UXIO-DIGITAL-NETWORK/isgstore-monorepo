<?php

namespace App\Actions\Supplier;

use App\Models\Supplier;
use App\DTOs\Supplier\CreateSupplierDTO;
use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use Illuminate\Support\Facades\Auth;

class CreateSupplierAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(CreateSupplierDTO $dto): Supplier
    {
        $supplier = Supplier::create([
            'name' => $dto->name,
            'status' => $dto->status,
        ]);

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Created new Supplier: {$supplier->name}"
        ));

        return $supplier;
    }
}
