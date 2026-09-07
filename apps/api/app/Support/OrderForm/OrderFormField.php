<?php

namespace App\Support\OrderForm;

use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * One input declared by a category's order_form_fields schema.
 *
 * The same object produces both the server-side validation rules and the
 * client-side attributes, so the storefront can never drift from the API.
 */
class OrderFormField
{
    public function __construct(
        public readonly string $key,
        public readonly string $label,
        public readonly string $type,          // text | number | select
        public readonly bool $required,
        public readonly ?int $minLength,
        public readonly ?int $maxLength,
        public readonly ?string $pattern,      // regex body, no delimiters
        public readonly array $options,        // [['label' => ..., 'value' => ...], ...]
        public readonly ?string $placeholder,
        public readonly ?string $help,
    ) {}

    public static function fromArray(array $f): self
    {
        $type = $f['type'] ?? 'text';

        return new self(
            key: (string) $f['key'],
            label: (string) ($f['label'] ?? Str::headline($f['key'])),
            // Unknown types degrade to text rather than throwing — a bad admin entry
            // must not take checkout down.
            type: in_array($type, ['text', 'number', 'select'], true) ? $type : 'text',
            required: (bool) ($f['required'] ?? false),
            minLength: isset($f['min_length']) ? (int) $f['min_length'] : null,
            maxLength: isset($f['max_length']) ? (int) $f['max_length'] : null,
            pattern: $f['pattern'] ?? null,
            options: array_values($f['options'] ?? []),
            placeholder: $f['placeholder'] ?? null,
            help: $f['help'] ?? null,
        );
    }

    /**
     * Laravel rules for the transaction column backing this field.
     */
    public function validationRules(): array
    {
        $rules = [$this->required ? 'required' : 'nullable', 'string'];

        if ($this->type === 'number') {
            // Digits only — NOT `numeric`, which would accept "1e5", "-1", "1.5" and
            // strip leading zeros that some supplier ids actually carry.
            $rules[] = 'regex:/^\d+$/';
        }

        if ($this->type === 'select' && $this->options !== []) {
            $rules[] = Rule::in(array_column($this->options, 'value'));
        }

        if ($this->pattern) {
            $rules[] = 'regex:/'.$this->pattern.'/';
        }

        $rules[] = 'min:'.($this->minLength ?? 1);
        $rules[] = 'max:'.($this->maxLength ?? 50);   // hard ceiling; column is string(255)

        return $rules;
    }

    /**
     * Client-side mirror of the same rules, consumed by the /topup page.
     */
    public function toClientArray(): array
    {
        return [
            'key' => $this->key,
            'label' => $this->label,
            'type' => $this->type,
            'required' => $this->required,
            'min_length' => $this->minLength,
            'max_length' => $this->maxLength,
            'pattern' => $this->type === 'number' ? '[0-9]*' : $this->pattern,
            'options' => $this->options,
            'placeholder' => $this->placeholder,
            'help' => $this->help,
        ];
    }
}
