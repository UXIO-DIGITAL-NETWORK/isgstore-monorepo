<?php

namespace App\Actions\Content;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

/**
 * Deletes a content row, its uploaded file if it has one, and writes the audit
 * entry.
 *
 * Shared across FAQ / page / testimonial because the three deletions differ
 * only in the label that goes into the log — three near-identical classes
 * would be ceremony, and each would be a separate place to forget the file
 * cleanup.
 */
class DeleteContentAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(Model $model, string $label, ?string $fileColumn = null): bool
    {
        $filePath = $fileColumn ? $model->{$fileColumn} : null;
        $deleted = $model->delete();

        if ($deleted) {
            // Only after the row is gone — a failed delete must not leave a
            // record pointing at a file that no longer exists.
            if ($filePath && Storage::disk('public')->exists($filePath)) {
                Storage::disk('public')->delete($filePath);
            }

            $this->activityLogAction->execute(new CreateActivityLogDTO(
                userId: Auth::id(),
                ipAddress: request()->ip(),
                userAgent: request()->userAgent(),
                message: "Admin deleted {$label}",
            ));
        }

        return $deleted;
    }
}
