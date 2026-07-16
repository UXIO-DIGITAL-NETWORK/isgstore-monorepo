<?php

namespace App\Actions\Transaction;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\DTOs\Transaction\ManualReviewTransactionDTO;
use App\Models\Transaction;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

/**
 * Lightweight admin status override — unlike UpdateTransactionAction (a full
 * record replace requiring every financial field), this only touches
 * status/sn/proof: the "mark this resolved with evidence" quick action.
 */
class ManualReviewTransactionAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(Transaction $transaction, ManualReviewTransactionDTO $dto): Transaction
    {
        $proofPath = $transaction->proof;

        if ($dto->proof instanceof UploadedFile) {
            if ($proofPath && Storage::disk('public')->exists($proofPath)) {
                Storage::disk('public')->delete($proofPath);
            }
            $proofPath = $dto->proof->store('transactions/proofs', 'public');
        }

        $transaction->update([
            'status' => $dto->status,
            'sn' => $dto->sn ?? $transaction->sn,
            'proof' => $proofPath,
        ]);

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Admin manually reviewed Transaction: {$transaction->invoice_number} → status: {$dto->status}"
        ));

        return $transaction->fresh();
    }
}
