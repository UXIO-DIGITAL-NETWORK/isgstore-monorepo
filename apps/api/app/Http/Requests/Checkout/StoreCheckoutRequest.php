<?php

namespace App\Http\Requests\Checkout;

use App\Models\Product;
use App\Support\OrderForm\OrderFormSchema;
use Illuminate\Foundation\Http\FormRequest;

class StoreCheckoutRequest extends FormRequest
{
    private ?OrderFormSchema $schema = null;

    private bool $schemaResolved = false;

    public function authorize(): bool
    {
        return true; // auth guard handled at route level; guests are allowed
    }

    public function rules(): array
    {
        $rules = [
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'payment_channel_id' => ['required', 'integer', 'exists:payment_channels,id'],
            // Required for guests; optional for authenticated members
            'guest_contact' => $this->user() ? ['nullable', 'string', 'max:20'] : ['required', 'string', 'max:20'],
        ];

        $schema = $this->orderFormSchema();

        // Category not configured → previous behaviour, so existing games keep selling.
        if (! $schema) {
            $rules['target_uid'] = ['required', 'string', 'max:50'];
            $rules['target_server'] = ['nullable', 'string', 'max:50'];

            return $rules;
        }

        foreach (OrderFormSchema::COLUMNS as $column) {
            $field = $schema->fieldForColumn($column);

            // A column the schema doesn't declare (e.g. Free Fire has no zone) is
            // accepted but ignored — the formatter never reads it.
            $rules[$column] = $field
                ? $field->validationRules()
                : ['nullable', 'string', 'max:50'];
        }

        return $rules;
    }

    /**
     * Error messages carry the game's own field label, e.g. "Zone ID wajib diisi."
     */
    public function attributes(): array
    {
        $attributes = [];

        if ($schema = $this->orderFormSchema()) {
            foreach (OrderFormSchema::COLUMNS as $column) {
                if ($field = $schema->fieldForColumn($column)) {
                    $attributes[$column] = $field->label;
                }
            }
        }

        return $attributes;
    }

    public function messages(): array
    {
        return [
            'guest_contact.required' => 'Nomor WhatsApp/Kontak wajib diisi untuk pelanggan tamu.',
            // :attribute resolves to the game's own field label via attributes().
            'target_uid.required' => ':attribute wajib diisi.',
            'target_server.required' => ':attribute wajib diisi.',
            'target_uid.regex' => 'Format :attribute tidak valid.',
            'target_server.regex' => 'Format :attribute tidak valid.',
            'target_uid.min' => ':attribute minimal :min karakter.',
            'target_server.min' => ':attribute minimal :min karakter.',
            'target_uid.max' => ':attribute maksimal :max karakter.',
            'target_server.max' => ':attribute maksimal :max karakter.',
            'target_uid.in' => ':attribute yang dipilih tidak tersedia.',
            'target_server.in' => ':attribute yang dipilih tidak tersedia.',
        ];
    }

    /**
     * Resolve the schema from the requested product's category, once per request.
     */
    private function orderFormSchema(): ?OrderFormSchema
    {
        if ($this->schemaResolved) {
            return $this->schema;
        }

        $this->schemaResolved = true;

        $productId = $this->input('product_id');

        // product_id itself may be absent/invalid — that's the `exists` rule's job,
        // not ours; just fall through to the legacy branch.
        if (! is_numeric($productId)) {
            return $this->schema = null;
        }

        $product = Product::with('category')->find((int) $productId);

        return $this->schema = OrderFormSchema::forCategory($product?->category);
    }
}
