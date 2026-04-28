<?php

namespace App\Http\Requests\Order;

use Illuminate\Contracts\Validation\ValidationRule;
use App\DTOs\Order\CreateOrderDTO;
use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'user_id' => ['required', 'exists:users,id'],
            'product_id' => ['required', 'exists:products,id'],
            'supplier_id' => ['nullable', 'exists:suppliers,id'],
            'target_uid' => ['nullable', 'string', 'max:255'],
            'target_server' => ['nullable', 'string', 'max:255'],
            'total_price' => ['required', 'integer'],
            'margin' => ['required', 'integer'],
            'status' => ['required', 'string', 'max:255'],
            'is_manual' => ['nullable', 'boolean'],
            'sn' => ['nullable', 'string', 'max:255'],
            'supplier_trx_id' => ['nullable', 'string', 'max:255'],
            'supplier_status' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function toDTO(): CreateOrderDTO
    {
        return new CreateOrderDTO(
            userId: (int) $this->validated('user_id'),
            productId: (int) $this->validated('product_id'),
            supplierId: $this->validated('supplier_id') ? (int) $this->validated('supplier_id') : null,
            targetUid: $this->validated('target_uid'),
            targetServer: $this->validated('target_server'),
            totalPrice: (int) $this->validated('total_price'),
            margin: (int) $this->validated('margin'),
            status: $this->validated('status'),
            isManual: (bool) $this->validated('is_manual'),
            sn: $this->validated('sn'),
            supplierTrxId: $this->validated('supplier_trx_id'),
            supplierStatus: $this->validated('supplier_status')
        );
    }
}
