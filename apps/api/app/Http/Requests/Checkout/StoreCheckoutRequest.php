<?php

namespace App\Http\Requests\Checkout;

use App\Http\Requests\Concerns\NormalizesPhoneInput;
use App\Models\Product;
use App\Models\User;
use App\Support\OrderForm\OrderFormSchema;
use Illuminate\Foundation\Http\FormRequest;

class StoreCheckoutRequest extends FormRequest
{
    use NormalizesPhoneInput;

    private ?OrderFormSchema $schema = null;

    private bool $schemaResolved = false;

    public function authorize(): bool
    {
        return true; // auth guard handled at route level; guests are allowed
    }

    protected function prepareForValidation(): void
    {
        // Only ever rewrites a value that was actually sent: `guest_contact` is
        // required for a guest and nullable for a member, and materialising the
        // key would turn "a member omitted it" into "a member cleared it".
        $this->normalizePhoneFields(['guest_contact']);
    }

    public function rules(): array
    {
        $rules = [
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'payment_channel_id' => ['required', 'integer', 'exists:payment_channels,id'],
            // Required for guests; optional for authenticated members
            // Canonical E.164, rewritten by prepareForValidation(). The storefront
            // already submits this shape; the rule is what makes an admin-authored
            // order and a non-browser API caller agree with it.
            'guest_contact' => $this->checkoutUser()
                ? ['nullable', 'string', 'max:20', self::E164_RULE]
                : ['required', 'string', 'max:20', self::E164_RULE],
            // Email is required for everyone: it is where the purchase receipt is
            // sent and lets the buyer track the order by email later.
            'email' => ['required', 'email', 'max:255'],
            // Storefront language, used to localise the receipt email (id|en).
            'locale' => ['nullable', 'string', 'in:id,en'],
            // Display-only echo of what validate-id returned. Never trusted for
            // fulfilment — uxiolabs is sent target_uid/target_server only.
            'target_nickname' => ['nullable', 'string', 'max:100'],
            'promo_code' => ['nullable', 'string', 'max:64'],
            // Members only, capped server-side. An over-large figure is clamped
            // rather than refused: the customer asked to spend what they had.
            'points_to_spend' => ['nullable', 'integer', 'min:0'],
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
            'email.required' => 'Email wajib diisi untuk mengirim bukti pembelian.',
            'email.email' => 'Format email tidak valid.',
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
     * The authenticated customer, if any.
     *
     * `POST /v1/checkout` is a public route with no `auth:sanctum` middleware,
     * so the default (`web`) guard is what `$this->user()` consults — and it
     * never sees the bearer token. Resolving through the `sanctum` guard
     * explicitly is what makes a signed-in member's checkout behave like one
     * instead of silently degrading to a guest order.
     */
    public function checkoutUser(): ?User
    {
        return $this->user() ?? $this->user('sanctum');
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
