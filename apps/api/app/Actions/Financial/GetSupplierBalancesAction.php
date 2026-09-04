<?php

namespace App\Actions\Financial;

use App\Models\Supplier;
use App\Services\UxiolabsService;
use Exception;
use Illuminate\Support\Facades\Log;

/**
 * Only uxiolabs has a live balance-check integration (UxiolabsService).
 * Other suppliers (e.g. "VIP Reseller", "Internal System" — see
 * SupplierSeeder) have no such API, so their balance is null rather than
 * a fabricated number.
 */
class GetSupplierBalancesAction
{
    public function __construct(private readonly UxiolabsService $uxiolabsService) {}

    public function execute(): array
    {
        return Supplier::query()
            ->orderBy('name')
            ->get()
            ->map(fn (Supplier $supplier) => [
                'id' => $supplier->id,
                'name' => $supplier->name,
                'balance' => $this->isUxiolabs($supplier) ? $this->uxiolabsBalance() : null,
            ])
            ->all();
    }

    private function isUxiolabs(Supplier $supplier): bool
    {
        return strtolower($supplier->name) === 'uxiolabs';
    }

    private function uxiolabsBalance(): ?float
    {
        try {
            // Cached (60s) so the admin panel + integration poll never hit uxiolabs
            // live on every request — that live call is what hangs the server.
            $data = $this->uxiolabsService->getBalanceCached();

            return isset($data['saldo']) && is_numeric($data['saldo']) ? (float) $data['saldo'] : null;
        } catch (Exception $e) {
            Log::warning('GetSupplierBalancesAction: uxiolabs balance check failed', ['message' => $e->getMessage()]);

            return null;
        }
    }
}
