<?php

namespace App\Http\Controllers\Api\Marketing;

use App\Actions\Content\DeleteContentAction;
use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\Marketing\FlashSaleResource;
use App\Models\FlashSale;
use App\Models\FlashSaleItem;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class FlashSaleController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $perPage = min(100, max(1, (int) $request->query('per_page', 15)));
        $search = $request->query('search');

        $sales = FlashSale::query()
            ->with('items.product')
            ->when($search, fn ($q) => $q->where('name', 'like', "%{$search}%"))
            ->latest('starts_at')
            ->paginate($perPage);

        return $this->paginatedResponse(FlashSaleResource::collection($sales), 'Flash sales retrieved successfully');
    }

    public function store(Request $request, CreateActivityLogAction $log)
    {
        $validated = $this->validatePayload($request);

        $sale = DB::transaction(function () use ($validated) {
            $sale = FlashSale::create(collect($validated)->except('items')->all());
            $this->syncItems($sale, $validated['items'] ?? []);

            return $sale;
        });

        $this->log($log, "Admin created flash sale: {$sale->name}");

        return $this->successResponse(
            new FlashSaleResource($sale->load('items.product')),
            'Flash sale created successfully',
            201
        );
    }

    public function show(FlashSale $flashSale)
    {
        return $this->successResponse(
            new FlashSaleResource($flashSale->load('items.product')),
            'Flash sale retrieved successfully'
        );
    }

    public function update(Request $request, FlashSale $flashSale, CreateActivityLogAction $log)
    {
        $validated = $this->validatePayload($request);

        DB::transaction(function () use ($flashSale, $validated) {
            $flashSale->update(collect($validated)->except('items')->all());

            // `items` absent means "leave the line-up alone"; an empty array
            // means "clear it". Conflating the two would silently wipe a sale
            // whenever someone edited only its dates.
            if (array_key_exists('items', $validated)) {
                $this->syncItems($flashSale, $validated['items']);
            }
        });

        $this->log($log, "Admin updated flash sale: {$flashSale->name}");

        return $this->successResponse(
            new FlashSaleResource($flashSale->fresh(['items.product'])),
            'Flash sale updated successfully'
        );
    }

    public function destroy(FlashSale $flashSale, DeleteContentAction $action)
    {
        $action->execute($flashSale, "flash sale: {$flashSale->name}");

        return $this->successResponse(null, 'Flash sale deleted successfully');
    }

    private function syncItems(FlashSale $sale, array $items): void
    {
        $keptIds = [];

        foreach ($items as $index => $item) {
            $row = FlashSaleItem::updateOrCreate(
                ['flash_sale_id' => $sale->id, 'product_id' => $item['product_id']],
                [
                    'sale_price' => $item['sale_price'],
                    'stock_total' => $item['stock_total'] ?? 0,
                    // stock_sold is never taken from the request — it is a
                    // record of real orders, not an editable field.
                    'sort_order' => $item['sort_order'] ?? $index,
                ],
            );

            $keptIds[] = $row->id;
        }

        $sale->items()->whereKeyNot($keptIds)->delete();
    }

    private function validatePayload(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
            'is_active' => ['sometimes', 'boolean'],
            'items' => ['sometimes', 'array'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.sale_price' => ['required', 'integer', 'min:0'],
            'items.*.stock_total' => ['sometimes', 'integer', 'min:0'],
            'items.*.sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);
    }

    private function log(CreateActivityLogAction $log, string $message): void
    {
        $log->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: $message,
        ));
    }
}
