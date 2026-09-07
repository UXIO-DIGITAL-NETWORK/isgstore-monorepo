<?php

namespace App\Http\Controllers\Api\Marketing;

use App\Actions\Content\DeleteContentAction;
use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\Marketing\PromoRedemptionResource;
use App\Http\Resources\Api\Marketing\PromoResource;
use App\Models\Promo;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class PromoController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $perPage = min(100, max(1, (int) $request->query('per_page', 15)));
        $search = $request->query('search');

        $promos = Promo::query()
            ->when($search, fn ($q) => $q->where(
                fn ($q) => $q->where('code', 'like', "%{$search}%")->orWhere('name', 'like', "%{$search}%")
            ))
            ->latest('id')
            ->paginate($perPage);

        return $this->paginatedResponse(PromoResource::collection($promos), 'Promos retrieved successfully');
    }

    public function store(Request $request, CreateActivityLogAction $log)
    {
        $promo = Promo::create($this->validatePayload($request));

        $this->log($log, "Admin created promo: {$promo->code}");

        return $this->successResponse(new PromoResource($promo), 'Promo created successfully', 201);
    }

    public function show(Promo $promo)
    {
        return $this->successResponse(new PromoResource($promo), 'Promo retrieved successfully');
    }

    public function update(Request $request, Promo $promo, CreateActivityLogAction $log)
    {
        $promo->update($this->validatePayload($request, $promo));

        $this->log($log, "Admin updated promo: {$promo->code}");

        return $this->successResponse(new PromoResource($promo->fresh()), 'Promo updated successfully');
    }

    public function destroy(Promo $promo, DeleteContentAction $action)
    {
        $action->execute($promo, "promo: {$promo->code}");

        return $this->successResponse(null, 'Promo deleted successfully');
    }

    /** Redemption history — what the discount actually cost, per order. */
    public function redemptions(Request $request, Promo $promo)
    {
        $redemptions = $promo->redemptions()
            ->with(['user:id,name,email', 'transaction:id,invoice_number'])
            ->latest('id')
            ->paginate(min(100, max(1, (int) $request->query('per_page', 15))));

        return $this->paginatedResponse(
            PromoRedemptionResource::collection($redemptions),
            'Promo redemptions retrieved successfully'
        );
    }

    private function validatePayload(Request $request, ?Promo $promo = null): array
    {
        return $request->validate([
            'code' => ['required', 'string', 'max:64', Rule::unique('promos', 'code')->ignore($promo?->id)],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'type' => ['required', Rule::in(['percentage', 'fixed'])],
            // A percentage over 100 would pay the customer to order.
            'value' => ['required', 'integer', 'min:1', $request->input('type') === 'percentage' ? 'max:100' : 'max:100000000'],
            'max_discount' => ['nullable', 'integer', 'min:0'],
            'min_purchase' => ['sometimes', 'integer', 'min:0'],
            'scope' => ['sometimes', Rule::in(['global', 'category', 'product'])],
            'scope_id' => ['nullable', 'integer'],
            'quota_total' => ['nullable', 'integer', 'min:0'],
            'quota_per_user' => ['nullable', 'integer', 'min:0'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'is_public' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
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
