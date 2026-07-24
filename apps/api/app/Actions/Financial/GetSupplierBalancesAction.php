<?php

namespace App\Actions\Financial;

use App\Models\Supplier;
use App\Services\DigiflazzService;
use Exception;
use Illuminate\Support\Facades\Log;

/**
 * Only Digiflazz has a live balance-check integration (DigiflazzService).
 * Other suppliers (e.g. "VIP Reseller", "Internal System" — see
 * SupplierSeeder) have no such API, so their balance is null rather than
 * a fabricated number.
 */
class GetSupplierBalancesAction
{
    public function __construct(private readonly DigiflazzService $digiflazzService) {}

    public function execute(): array
    {
        return Supplier::query()
            ->orderBy('name')
            ->get()
            ->map(fn (Supplier $supplier) => [
                'id' => $supplier->id,
                'name' => $supplier->name,
                'balance' => $this->isDigiflazz($supplier) ? $this->digiflazzBalance() : null,
            ])
            ->all();
    }

    private function isDigiflazz(Supplier $supplier): bool
    {
        return strtolower($supplier->name) === 'digiflazz';
    }

    private function digiflazzBalance(): ?float
    {
        try {
            $data = $this->digiflazzService->getBalance();

            return isset($data['deposit']) && is_numeric($data['deposit']) ? (float) $data['deposit'] : null;
        } catch (Exception $e) {
            Log::warning('GetSupplierBalancesAction: Digiflazz balance check failed', ['message' => $e->getMessage()]);

            return null;
        }
    }
}
