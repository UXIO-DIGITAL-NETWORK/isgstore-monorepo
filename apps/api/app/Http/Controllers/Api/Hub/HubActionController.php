<?php

namespace App\Http\Controllers\Api\Hub;

use App\Actions\Service\ConfirmServiceInvoiceAction;
use App\Actions\Service\RejectServiceInvoiceAction;
use App\Actions\Withdrawal\ApproveWithdrawalAction;
use App\Actions\Withdrawal\RejectWithdrawalAction;
use App\DTOs\Service\ConfirmServiceInvoiceDTO;
use App\Http\Controllers\Controller;
use App\Models\ServiceInvoice;
use App\Models\Withdrawal;
use App\Support\Hub\HubSystemUser;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use RuntimeException;

/**
 * The site's money-path WRITE endpoints the Uxio Hub drives (gated by `hub` +
 * `hub-write` — read key AND a separate write key). Each method wraps the SAME
 * Action the payment-internal panel uses, attributed to the HubSystemUser, so
 * the business logic (locks, ledger, idempotency) is never forked.
 *
 * Idempotency: the wrapped actions guard on status (lockForUpdate + PENDING
 * check). A replay of an already-processed row throws — we surface it as 422 so
 * the Hub treats "already done" as a benign terminal state and re-pulls.
 */
class HubActionController extends Controller
{
    use ApiResponse;

    public function approveWithdrawal(Withdrawal $withdrawal, ApproveWithdrawalAction $action)
    {
        try {
            // Hub-driven approvals are async disbursement only — a manual
            // (transfer-proof) approval needs evidence uploaded on-site.
            $updated = $action->execute($withdrawal, HubSystemUser::resolve(), 'monetapay');
        } catch (RuntimeException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }

        return $this->successResponse($this->present($updated), 'Penarikan disetujui');
    }

    public function rejectWithdrawal(Request $request, Withdrawal $withdrawal, RejectWithdrawalAction $action)
    {
        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        try {
            $updated = $action->execute($withdrawal, HubSystemUser::resolve(), $validated['reason'] ?? null);
        } catch (RuntimeException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }

        return $this->successResponse($this->present($updated), 'Penarikan ditolak');
    }

    public function confirmInvoice(Request $request, ServiceInvoice $serviceInvoice, ConfirmServiceInvoiceAction $action)
    {
        $validated = $request->validate([
            'notes' => ['nullable', 'string', 'max:255'],
        ]);

        try {
            $updated = $action->execute(new ConfirmServiceInvoiceDTO(
                invoiceId: $serviceInvoice->id,
                verifierId: HubSystemUser::resolve()->id,
                notes: $validated['notes'] ?? null,
            ));
        } catch (RuntimeException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }

        return $this->successResponse($this->presentInvoice($updated), 'Pembayaran layanan dikonfirmasi');
    }

    public function rejectInvoice(Request $request, ServiceInvoice $serviceInvoice, RejectServiceInvoiceAction $action)
    {
        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        try {
            $updated = $action->execute($serviceInvoice, HubSystemUser::resolve(), $validated['reason'] ?? null);
        } catch (RuntimeException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }

        return $this->successResponse($this->presentInvoice($updated), 'Pembayaran layanan ditolak');
    }

    /** @return array<string, mixed> */
    private function present(Withdrawal $w): array
    {
        return [
            'withdrawal_number' => $w->withdrawal_number,
            'status' => $w->status->value,
        ];
    }

    /** @return array<string, mixed> */
    private function presentInvoice(ServiceInvoice $i): array
    {
        return [
            'invoice_number' => $i->invoice_number,
            'status' => $i->status->value,
        ];
    }
}
