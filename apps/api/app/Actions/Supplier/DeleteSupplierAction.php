<?php

namespace App\Actions\Supplier;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\Supplier;
use Illuminate\Support\Facades\Auth;

class DeleteSupplierAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(Supplier $supplier): bool
    {
        $name = $supplier->name;
        $deleted = $supplier->delete();

        if ($deleted) {
            $this->activityLogAction->execute(new CreateActivityLogDTO(
                userId: Auth::id(),
                ipAddress: request()->ip(),
                userAgent: request()->userAgent(),
                message: "Deleted Supplier: {$name}"
            ));
        }

        return $deleted;
    }
}
