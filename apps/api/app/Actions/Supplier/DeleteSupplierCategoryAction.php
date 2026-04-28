<?php

namespace App\Actions\Supplier;

use App\Models\SupplierCategory;
use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use Illuminate\Support\Facades\Auth;

class DeleteSupplierCategoryAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(SupplierCategory $supplierCategory): bool
    {
        $templateCode = $supplierCategory->template_code;
        $deleted = $supplierCategory->delete();

        if ($deleted) {
            $this->activityLogAction->execute(new CreateActivityLogDTO(
                userId: Auth::id(),
                ipAddress: request()->ip(),
                userAgent: request()->userAgent(),
                message: "Deleted Supplier Category: {$templateCode}"
            ));
        }

        return $deleted;
    }
}
