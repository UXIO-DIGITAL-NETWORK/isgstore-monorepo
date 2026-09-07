<?php

namespace App\Http\Requests\Category\Concerns;

use App\Support\OrderForm\OrderFormSchema;

/**
 * Rules for categories.order_form_fields, which accepts two shapes:
 *
 *   new    → {"customer_no_template": "{user_id}{zone_id}", "fields": [ ... ]}
 *   legacy → [ {"key": "user_id", "label": "User ID", "required": true}, ... ]
 *
 * Both are still parsed by OrderFormSchema, so both stay valid here.
 */
trait ValidatesOrderFormFields
{
    /**
     * The admin form posts as multipart (it carries a logo file), so the nested
     * `order_form_fields` array arrives JSON-encoded as a single string. Decode
     * it back to an array before validation; a malformed string is left as-is so
     * the `array` rule rejects it with a clear message.
     */
    protected function normalizeOrderFormFieldsInput(): void
    {
        $value = $this->input('order_form_fields');

        if (is_string($value)) {
            $decoded = json_decode($value, true);
            $this->merge(['order_form_fields' => is_array($decoded) ? $decoded : $value]);
        }
    }

    protected function orderFormFieldRules(): array
    {
        $submitted = $this->input('order_form_fields');
        $isObjectShape = is_array($submitted) && $submitted !== [] && ! array_is_list($submitted);

        $rules = ['order_form_fields' => ['nullable', 'array']];

        if ($isObjectShape) {
            $rules['order_form_fields.customer_no_template'] = ['nullable', 'string', 'max:255'];
            $rules['order_form_fields.fields'] = ['required', 'array', 'min:1', 'max:'.OrderFormSchema::MAX_FIELDS];
            $prefix = 'order_form_fields.fields.*';
            $keyRule = 'required';
        } else {
            $prefix = 'order_form_fields.*';
            $keyRule = 'required_with:order_form_fields';
        }

        return $rules + [
            $prefix.'.key' => [$keyRule, 'string', 'max:255'],
            $prefix.'.label' => ['nullable', 'string', 'max:255'],
            $prefix.'.required' => ['nullable', 'boolean'],
            $prefix.'.type' => ['nullable', 'string', 'in:text,number,select'],
            $prefix.'.min_length' => ['nullable', 'integer', 'min:1', 'max:255'],
            $prefix.'.max_length' => ['nullable', 'integer', 'min:1', 'max:255'],
            // Regex body without delimiters — CustomerNumberFormatter wraps it.
            $prefix.'.pattern' => ['nullable', 'string', 'max:255'],
            $prefix.'.placeholder' => ['nullable', 'string', 'max:255'],
            $prefix.'.help' => ['nullable', 'string', 'max:255'],
            $prefix.'.options' => ['nullable', 'array'],
            $prefix.'.options.*.label' => ['required_with:'.$prefix.'.options', 'string', 'max:255'],
            $prefix.'.options.*.value' => ['required_with:'.$prefix.'.options', 'string', 'max:255'],
        ];
    }
}
