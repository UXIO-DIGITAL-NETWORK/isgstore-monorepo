<?php

declare(strict_types=1);

namespace App\Http\Requests\Transaction\Concerns;

use App\Models\Product;
use App\Support\OrderForm\OrderFormSchema;

/**
 * Identifier rules for an admin-authored transaction.
 *
 * Checkout resolves these from the game the customer picked; here the operator
 * names the product and the same category schema decides how many identifiers
 * the order needs. Accepting them keyed is what lets a manual order for a game
 * with more identifiers than the two mirrored columns reach fulfilment intact —
 * and refusing an incomplete one *here* is what keeps it from being accepted
 * and then failing at the supplier, after the money has moved.
 *
 * The two mirrored columns (target_uid/target_server) keep working exactly as
 * before for a game that declares one or two fields, which is every game that
 * exists today.
 */
trait ValidatesTransactionIdentifiers
{
    private ?OrderFormSchema $identifierSchema = null;

    private bool $identifierSchemaResolved = false;

    /** @return array<string, array<int, mixed>> */
    protected function identifierRules(): array
    {
        $rules = [
            'order_fields' => ['nullable', 'array'],
            'target_uid' => ['nullable', 'string', 'max:255'],
            'target_server' => ['nullable', 'string', 'max:255'],
        ];

        $schema = $this->identifierSchema();

        if (! $schema) {
            return $rules;
        }

        // One rule per declared identifier, exactly as checkout applies them —
        // required, digits-only, length bounds and pattern included.
        foreach ($schema->fields() as $field) {
            $rules['order_fields.'.$field->key] = $field->validationRules();
        }

        return $rules;
    }

    /**
     * A payload that cannot be fulfilled is refused before it is stored.
     *
     * Without this the order saves cleanly, the supplier call throws inside the
     * fulfilment job, and the failure surfaces on an order that has already been
     * paid for — the one place nobody can fix it.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $schema = $this->identifierSchema();

            if (! $schema || $this->has('order_fields')) {
                return;
            }

            $declared = count($schema->fields());

            if ($declared <= count(OrderFormSchema::COLUMNS)) {
                return;
            }

            $missing = array_slice($schema->keys(), count(OrderFormSchema::COLUMNS));

            $validator->errors()->add(
                'order_fields',
                "Produk ini membutuhkan {$declared} ID. Kirim semuanya sebagai order_fields; "
                .'yang belum tersedia di kolom biasa: '.implode(', ', $missing).'.',
            );
        });
    }

    /**
     * The identifiers as a key ⇒ value map, in the category's declaration order.
     *
     * Empty when the category declares no schema at all — the caller then keeps
     * the positional pair it already had.
     *
     * @return array<string,string>
     */
    public function identifierValues(): array
    {
        $schema = $this->identifierSchema();

        if (! $schema) {
            return [];
        }

        $submitted = $this->input('order_fields');

        if (is_array($submitted) && $submitted !== []) {
            return $schema->bound($submitted);
        }

        return $schema->valuesFromPositional(
            $this->input('target_uid'),
            $this->input('target_server'),
        );
    }

    /**
     * Which category's schema governs this request.
     *
     * A create names the product; an update does not, so the transaction's own
     * product decides — that is the game the order was placed for and the one
     * fulfilment will read.
     */
    private function identifierSchema(): ?OrderFormSchema
    {
        if ($this->identifierSchemaResolved) {
            return $this->identifierSchema;
        }

        $this->identifierSchemaResolved = true;

        $productId = $this->input('product_id');

        if (is_numeric($productId)) {
            return $this->identifierSchema = OrderFormSchema::forCategory(
                Product::with('category')->find((int) $productId)?->category
            );
        }

        $transaction = $this->route('transaction');

        return $this->identifierSchema = $transaction
            ? OrderFormSchema::forCategory($transaction->product?->category)
            : null;
    }
}
