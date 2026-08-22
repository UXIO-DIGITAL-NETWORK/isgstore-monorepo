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
 * This is the single place that decides how target_uid and target_server are
 * joined — do not hardcode that expression anywhere else. uxiotopup expects
 * the pipe form "dataId|zoneId" (templates like `{user_id}|{zone_id}`).
 */
class CustomerNumberFormatter
{
    public function forTransaction(Transaction $transaction): string
    {
        // category is needed for the schema; loadMissing keeps this cheap when the
        // caller already eager-loaded it.
        $transaction->loadMissing('product.category');

        return $this->format(
            $transaction->product?->category,
            $transaction->target_uid,
            $transaction->target_server,
        );
    }

    public function format(?Category $category, ?string $targetUid, ?string $targetServer): string
    {
        $schema = OrderFormSchema::forCategory($category);
        $values = [trim((string) $targetUid), trim((string) $targetServer)];

        // Unconfigured category → uxiotopup's default "dataId|zoneId" shape
        // (just dataId when there is no zone/server component).
        if (! $schema) {
            return $values[1] === '' ? $values[0] : $values[0].'|'.$values[1];
        }

        $bindings = [];

        foreach ($schema->fields() as $i => $field) {
            /** @var OrderFormField $field */
            $value = $values[$i] ?? '';

            // Defence in depth: checkout validation should already have caught this,
            // but an admin-created or imported transaction can reach here unvalidated.
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

        return $customerNo;
    }
}
