<?php

namespace App\Support\OrderForm;

use App\Models\Category;

/**
 * Parsed view of categories.order_form_fields.
 *
 * A null schema means the category is not configured, and every caller must then
 * fall back to the pre-existing behaviour (uid required, server optional, joined
 * by bare concatenation). That is what keeps this change safe to deploy.
 */
class OrderFormSchema
{
    /**
     * How many identifiers a category may declare.
     *
     * A transaction keeps the whole set in `target_values` and mirrors only the
     * first two into the columns below, so this is a readability cap rather than
     * a storage one: the supplier receives a single composed string, and each
     * field's own rule defaults to 50 characters.
     */
    public const MAX_FIELDS = 5;

    /**
     * The mirrored columns, in declaration order — the first two fields only.
     *
     * They exist because the invoice PDF, the receipt email, the WhatsApp
     * message and the member transaction list all read them by name. A category
     * declaring more than two identifiers is composed from `target_values`.
     */
    public const COLUMNS = ['target_uid', 'target_server'];

    /** @param  OrderFormField[]  $fields */
    private function __construct(
        private readonly array $fields,
        private readonly string $template,
    ) {}

    public static function forCategory(?Category $category): ?self
    {
        return $category ? self::fromArray($category->order_form_fields) : null;
    }

    public static function fromArray(mixed $raw): ?self
    {
        if (! is_array($raw) || $raw === []) {
            return null;   // unconfigured → caller falls back to legacy behaviour
        }

        // Two accepted shapes:
        //   new    → {"customer_no_template": "...", "fields": [...]}
        //   legacy → [{"key": ..., "label": ..., "required": ...}, ...]
        $isLegacyList = array_is_list($raw);
        $rawFields = $isLegacyList ? $raw : ($raw['fields'] ?? []);

        if (! is_array($rawFields)) {
            return null;
        }

        $fields = [];
        foreach (array_slice($rawFields, 0, self::MAX_FIELDS) as $f) {
            if (is_array($f) && ! empty($f['key'])) {
                $fields[] = OrderFormField::fromArray($f);
            }
        }

        if ($fields === []) {
            return null;
        }

        // A legacy list (or a schema without an explicit template) has no template
        // string; build the default. uxiolabs expects the pipe form
        // "dataId|zoneId" — the same separator the unconfigured fallback uses — so
        // join with "|", NOT bare concatenation (which sent "dataId zoneId" glued
        // together and made every multi-field order fail at the supplier).
        $template = $isLegacyList ? '' : trim((string) ($raw['customer_no_template'] ?? ''));

        if ($template === '') {
            $template = implode('|', array_map(fn (OrderFormField $f) => '{'.$f->key.'}', $fields));
        }

        return new self($fields, $template);
    }

    /** @return OrderFormField[] */
    public function fields(): array
    {
        return $this->fields;
    }

    /** The declared keys, in declaration order. */
    public function keys(): array
    {
        return array_map(static fn (OrderFormField $f) => $f->key, $this->fields);
    }

    /** The declared key backing a column position, or null when there is none. */
    public function keyAt(int $index): ?string
    {
        return $this->fields[$index]->key ?? null;
    }

    /**
     * Keep only the declared keys, in declaration order, as trimmed strings.
     *
     * Everything downstream — validation, storage, the composed target — reads
     * one shape, so a key the schema does not declare is dropped here rather
     * than travelling further.
     *
     * @param  array<string,mixed>  $values
     * @return array<string,string>
     */
    public function bound(array $values): array
    {
        $bound = [];

        foreach ($this->fields as $field) {
            $bound[$field->key] = trim((string) ($values[$field->key] ?? ''));
        }

        return $bound;
    }

    /**
     * The identifiers derived from the legacy positional pair.
     *
     * Only the two column-backed fields can be addressed this way; a caller with
     * more to say must send them keyed. Fields past the second are left out
     * entirely, so a schema declaring a third required identifier cannot be
     * satisfied positionally — and the formatter says so, rather than composing
     * a target with a piece missing.
     *
     * @return array<string,string>
     */
    public function valuesFromPositional(?string $uid, ?string $server): array
    {
        $columns = [trim((string) $uid), trim((string) $server)];
        $bound = [];

        foreach ($this->fields as $index => $field) {
            if (! array_key_exists($index, self::COLUMNS)) {
                break;
            }

            $bound[$field->key] = $columns[$index];
        }

        return $bound;
    }

    public function template(): string
    {
        return $this->template;
    }

    /** The field backing a given column, or null when the schema doesn't declare it. */
    public function fieldForColumn(string $column): ?OrderFormField
    {
        $index = array_search($column, self::COLUMNS, true);

        return $index === false ? null : ($this->fields[$index] ?? null);
    }

    /** Field definitions in the shape the storefront consumes. */
    public function toClientArray(): array
    {
        return array_map(fn (OrderFormField $f) => $f->toClientArray(), $this->fields);
    }
}
