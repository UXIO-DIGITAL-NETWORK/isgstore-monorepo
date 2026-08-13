<?php

namespace App\Http\Controllers\Api\Payment;

use App\Actions\Content\DeleteContentAction;
use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\Payment\PaymentChannelResource;
use App\Models\PaymentChannel;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

/**
 * Admin management of payment channels.
 *
 * The public read lives at /v1/storefront/payment-channels — this controller
 * owns /v1/payment-channels, which is admin-gated. The two must never share a
 * URI: Laravel keys its route collection on method+uri, so one would silently
 * replace the other.
 */
class PaymentChannelController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $perPage = min(100, max(1, (int) $request->query('per_page', 15)));
        $search = $request->query('search');

        $channels = PaymentChannel::query()
            ->when($search, fn ($q) => $q->where(
                fn ($q) => $q->where('name', 'like', "%{$search}%")->orWhere('channel_code', 'like', "%{$search}%")
            ))
            ->when($request->query('payment_type'), fn ($q, $type) => $q->where('payment_type', $type))
            ->orderBy('sort_order')
            ->orderBy('name')
            ->paginate($perPage);

        return $this->paginatedResponse(
            PaymentChannelResource::collection($channels),
            'Payment channels retrieved successfully'
        );
    }

    public function store(Request $request, CreateActivityLogAction $log)
    {
        $channel = PaymentChannel::create($this->payload($request));

        $this->log($log, "Admin created payment channel: {$channel->name}");

        return $this->successResponse(
            new PaymentChannelResource($channel),
            'Payment channel created successfully',
            201
        );
    }

    public function show(PaymentChannel $paymentChannel)
    {
        return $this->successResponse(
            new PaymentChannelResource($paymentChannel),
            'Payment channel retrieved successfully'
        );
    }

    public function update(Request $request, PaymentChannel $paymentChannel, CreateActivityLogAction $log)
    {
        $paymentChannel->update($this->payload($request, $paymentChannel));

        $this->log($log, "Admin updated payment channel: {$paymentChannel->name}");

        return $this->successResponse(
            new PaymentChannelResource($paymentChannel->fresh()),
            'Payment channel updated successfully'
        );
    }

    public function destroy(PaymentChannel $paymentChannel, DeleteContentAction $action)
    {
        // Transactions reference the channel, so removing one would orphan
        // historical orders. Deactivating hides it from checkout instead.
        if ($paymentChannel->transactions()->exists()) {
            return $this->errorResponse(
                'This channel has transactions and cannot be deleted. Deactivate it instead.',
                422
            );
        }

        $action->execute($paymentChannel, "payment channel: {$paymentChannel->name}", 'logo_path');

        return $this->successResponse(null, 'Payment channel deleted successfully');
    }

    private function payload(Request $request, ?PaymentChannel $channel = null): array
    {
        // Admins may only manage the offered categories (VA / e-wallet / QRIS),
        // plus the seeded member wallet (`balance`) so its fees stay editable.
        // This keeps a disallowed type (e.g. convenience_store, payment_link)
        // from being reintroduced through the admin CRUD.
        $allowedTypes = array_merge(PaymentChannel::ALLOWED_STOREFRONT_PAYMENT_TYPES, ['balance']);

        $validated = $request->validate([
            'payment_type' => ['required', 'string', 'max:50', Rule::in($allowedTypes)],
            'channel_code' => [
                'required', 'string', 'max:50',
                Rule::unique('payment_channels', 'channel_code')->ignore($channel?->id),
            ],
            'name' => ['required', 'string', 'max:255'],
            'logo' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp,svg', 'max:1024'],
            'description' => ['nullable', 'string', 'max:255'],
            'min_amount' => ['sometimes', 'integer', 'min:0'],
            'fee_flat' => ['sometimes', 'integer', 'min:0'],
            'fee_percent' => ['sometimes', 'numeric', 'between:0,100'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'is_single_use' => ['sometimes', 'boolean'],
        ]);

        unset($validated['logo']);

        if ($request->hasFile('logo')) {
            if ($channel?->logo_path && Storage::disk('public')->exists($channel->logo_path)) {
                Storage::disk('public')->delete($channel->logo_path);
            }
            $validated['logo_path'] = $request->file('logo')->store('payment-channels', 'public');
        }

        return $validated;
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
