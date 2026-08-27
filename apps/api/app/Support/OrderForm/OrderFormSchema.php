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
    /** transactions only has target_uid + target_server, so at most two fields. */
    public const MAX_FIELDS = 2;

    /** Columns backing the fields, in declaration order. */
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
        // string; build the default. uxiotopup expects the pipe form
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
