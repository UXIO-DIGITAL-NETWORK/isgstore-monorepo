<?php

namespace App\Actions\Financial;

use App\Models\Supplier;
use App\Services\UxiotopupService;
use Exception;
use Illuminate\Support\Facades\Log;

/**
 * Only uxiotopup has a live balance-check integration (UxiotopupService).
 * Other suppliers (e.g. "VIP Reseller", "Internal System" — see
 * SupplierSeeder) have no such API, so their balance is null rather than
 * a fabricated number.
 */
class GetSupplierBalancesAction
{
    public function __construct(private readonly UxiotopupService $uxiotopupService) {}

    public function execute(): array
    {
        return Supplier::query()
            ->orderBy('name')
            ->get()
            ->map(fn (Supplier $supplier) => [
                'id' => $supplier->id,
                'name' => $supplier->name,
                'balance' => $this->isUxiotopup($supplier) ? $this->uxiotopupBalance() : null,
            ])
            ->all();
    }

    private function isUxiotopup(Supplier $supplier): bool
    {
        return strtolower($supplier->name) === 'uxiotopup';
    }

    private function uxiotopupBalance(): ?float
    {
        try {
            // Cached (60s) so the admin panel + integration poll never hit uxiotopup
            // live on every request — that live call is what hangs the server.
            $data = $this->uxiotopupService->getBalanceCached();

            return isset($data['saldo']) && is_numeric($data['saldo']) ? (float) $data['saldo'] : null;
        } catch (Exception $e) {
            Log::warning('GetSupplierBalancesAction: uxiotopup balance check failed', ['message' => $e->getMessage()]);

            return null;
        }
    }
}
