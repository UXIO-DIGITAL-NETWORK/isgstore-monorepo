<?php

namespace App\Http\Requests\Incident;

use App\Enums\IncidentSeverity;
use App\Enums\IncidentStatus;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreIncidentRequest extends FormRequest
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
            'title' => ['required', 'string', 'max:255'],
            'service_id' => ['nullable', 'integer', 'exists:services,id'],
            'payment_channel_id' => ['nullable', 'integer', 'exists:payment_channels,id'],
            'severity' => ['required', Rule::enum(IncidentSeverity::class)],
            'status' => ['required', Rule::enum(IncidentStatus::class)],
            'message' => ['required', 'string', 'max:2000'],
            'started_at' => ['required', 'date'],
            'estimated_resolved_at' => ['nullable', 'date', 'after:started_at'],
        ];
    }

    /**
     * An incident points at exactly one thing. Neither means the status page
     * cannot place it; both means two components would light up from one row.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $hasService = $this->filled('service_id');
            $hasChannel = $this->filled('payment_channel_id');

            if ($hasService === $hasChannel) {
                $validator->errors()->add(
                    'service_id',
                    'Isi salah satu saja: service_id atau payment_channel_id.'
                );
            }
        });
    }
}
