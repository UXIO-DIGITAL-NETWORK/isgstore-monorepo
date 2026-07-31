<?php

declare(strict_types=1);

namespace App\Support\Storefront;

use App\Models\Category;
use App\Support\OrderForm\OrderFormSchema;
use Illuminate\Support\Str;

/**
 * Which identity fields a game asks the customer for.
 *
 * Lifted verbatim from Web\TopupPageController so the Blade page and the JSON
 * API resolve fields through one implementation — a divergence here would mean
 * two storefronts validating the same order differently.
 *
 * Only the first two fields are usable: checkout accepts `target_uid` and
 * `target_server` and nothing else, so field #1 maps to the former and field
 * #2 to the latter.
 *
 * NOTE ON ZONE: a configured `order_form_fields` schema always wins, and every
 * seeded schema declares zone as free-text numeric. That is deliberate — see
 * OrderFormSchemaSeeder: a zone dropdown produced wrong ids that only failed at
 * the supplier, after the customer had already paid.
 */
final class OrderFormFields
{
    public static function for(Category $game): array
    {
        // Configured schema wins. This is also what stops a configured game
        // (MLBB) rendering a zone dropdown out of server_categories.
        if ($schema = OrderFormSchema::forCategory($game)) {
            return $schema->toClientArray();
        }

        $serverFields = $game->serverCategories()
            ->with('options:id,server_category_id,name,value')
            ->orderBy('id')
            ->get()
            ->map(fn ($serverCategory) => self::field([
                'key' => Str::slug($serverCategory->name, '_'),
                'label' => $serverCategory->name,
                'required' => true,
                'type' => $serverCategory->options->isNotEmpty() ? 'select' : 'text',
                'options' => $serverCategory->options
                    ->map(fn ($option) => ['label' => $option->name, 'value' => (string) $option->value])
                    ->values()
                    ->all(),
            ]))
            ->values()
            ->all();

        if ($serverFields !== []) {
            return array_slice($serverFields, 0, OrderFormSchema::MAX_FIELDS);
        }

        return [self::field([
            'key' => 'user_id',
            'label' => 'User ID',
            'required' => true,
            'type' => 'text',
        ])];
    }

    /**
     * Pad a fallback field out to the same shape OrderFormField::toClientArray()
     * emits, so the client's renderer only ever sees one contract.
     */
    private static function field(array $field): array
    {
        return $field + [
            'min_length' => null,
            'max_length' => null,
            'pattern' => null,
            'options' => [],
            'placeholder' => null,
            'help' => null,
        ];
    }
}
