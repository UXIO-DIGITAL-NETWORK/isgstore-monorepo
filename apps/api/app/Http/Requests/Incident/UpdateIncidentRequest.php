<?php

namespace App\Http\Requests\Incident;

use App\Enums\IncidentSeverity;
use App\Enums\IncidentStatus;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateIncidentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'max:255'],
            'service_id' => ['nullable', 'integer', 'exists:services,id'],
            'payment_channel_id' => ['nullable', 'integer', 'exists:payment_channels,id'],
            'severity' => ['sometimes', Rule::enum(IncidentSeverity::class)],
            'status' => ['sometimes', Rule::enum(IncidentStatus::class)],
            'message' => ['sometimes', 'string', 'max:2000'],
            'started_at' => ['sometimes', 'date'],
            'estimated_resolved_at' => ['nullable', 'date'],
        ];
    }

    /**
     * Only enforced when the caller actually retargets the incident — a status
     * bump that sends neither key must not be rejected.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if (! $this->has('service_id') && ! $this->has('payment_channel_id')) {
                return;
            }

            if ($this->filled('service_id') === $this->filled('payment_channel_id')) {
                $validator->errors()->add(
                    'service_id',
                    'Isi salah satu saja: service_id atau payment_channel_id.'
                );
            }
        });
    }
}
