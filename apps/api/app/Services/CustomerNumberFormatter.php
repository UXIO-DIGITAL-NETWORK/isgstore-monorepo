<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Transaction;
use App\Support\OrderForm\OrderFormField;
use App\Support\OrderForm\OrderFormSchema;
use RuntimeException;

/**
 * Composes the target sent to the supplier.
 *
 * This is the single place that decides how the identifiers are joined — do not
 * hardcode that expression anywhere else. uxiolabs expects the pipe form
 * "dataId|zoneId" (templates like `{user_id}|{zone_id}`), and a game may declare
 * more identifiers than that; the whole set lives in `transactions.target_values`
 * and is bound to the category's template by key.
 *
 * Rows written before that column existed — and anything an admin typed into the
 * two mirrored columns — have no map, so the positional entry point stays.
 */
class CustomerNumberFormatter
{
    public function forTransaction(Transaction $transaction): string
    {
        // category is needed for the schema; loadMissing keeps this cheap when the
        // caller already eager-loaded it.
        $transaction->loadMissing('product.category');

        $category = $transaction->product?->category;
        $stored = $transaction->target_values;

        if (is_array($stored) && $stored !== []) {
            return $this->formatMap($category, $stored);
        }

        return $this->format($category, $transaction->target_uid, $transaction->target_server);
    }

    /**
     * The keyed form: as many identifiers as the category declares.
     *
     * @param  array<string,mixed>  $values
     */
    public function formatMap(?Category $category, array $values): string
    {
        $trimmed = array_map(static fn ($value) => trim((string) $value), $values);
        $schema = OrderFormSchema::forCategory($category);

        // Nothing declares the keys, so the positional shape is all there is.
        if (! $schema) {
            return $this->pipe($trimmed[0] ?? '', $trimmed[1] ?? '');
        }

        return $this->render($schema, $trimmed);
    }

    public function format(?Category $category, ?string $targetUid, ?string $targetServer): string
    {
        $uid = trim((string) $targetUid);
        $server = trim((string) $targetServer);

        $schema = OrderFormSchema::forCategory($category);

        // Unconfigured category → uxiolabs's default "dataId|zoneId" shape
        // (just dataId when there is no zone/server component).
        if (! $schema) {
            return $this->pipe($uid, $server);
        }

        return $this->render($schema, $schema->valuesFromPositional($uid, $server));
    }

    /** uxiolabs's default shape, for when no template describes the join. */
    private function pipe(string $uid, string $server): string
    {
        return $server === '' ? $uid : $uid.'|'.$server;
    }

    /**
     * Bind the declared fields into the category's template.
     *
     * @param  array<string,string>  $values  key ⇒ value, already trimmed
     */
    private function render(OrderFormSchema $schema, array $values): string
    {
        $bindings = [];

        foreach ($schema->fields() as $field) {
            /** @var OrderFormField $field */
            $value = $values[$field->key] ?? '';

            // Defence in depth: checkout validation should already have caught this,
            // but an admin-created or imported transaction can reach here unvalidated
            // — and a target missing a required identifier is either rejected by the
            // supplier or, worse, resolves to somebody else's account.
            if ($field->required && $value === '') {
                throw new RuntimeException("{$field->label} wajib diisi untuk produk ini.");
            }

            $bindings['{'.$field->key.'}'] = $value;
        }

        $customerNo = strtr($schema->template(), $bindings);

        // A leftover {token} means the template names a field the schema doesn't
        // declare — fail loudly rather than sending a broken id to the supplier.
        if (preg_match('/\{[A-Za-z0-9_]+\}/', $customerNo)) {
            throw new RuntimeException(
                'Template customer_no tidak valid untuk kategori ini: '.$schema->template()
            );
        }

        // Drop empty pipe segments so an optional field left blank (e.g. no
        // zone/server) never emits a dangling separator like "dataId|" — uxiolabs
        // wants "dataId|zoneId" or just "dataId", never a trailing pipe.
        if (str_contains($customerNo, '|')) {
            $customerNo = implode('|', array_filter(
                explode('|', $customerNo),
                static fn (string $segment) => $segment !== '',
            ));
        }

        return $customerNo;
    }
}
