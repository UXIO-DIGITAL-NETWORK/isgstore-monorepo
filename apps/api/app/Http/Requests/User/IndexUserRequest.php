<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class IndexUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:255'],
            'role_id' => ['nullable', 'integer', 'exists:roles,id'],
            'exclude_role_id' => ['nullable', 'integer', 'exists:roles,id'],

            // Filter Saldo & Poin
            'min_balance' => ['nullable', 'numeric', 'min:0'],
            'max_balance' => ['nullable', 'numeric', 'gte:min_balance'],
            'min_point' => ['nullable', 'integer', 'min:0'],
            'max_point' => ['nullable', 'integer', 'gte:min_point'],

            // Filter Verifikasi (Boolean: true/false)
            'is_email_verified' => ['nullable', 'boolean'],
            'is_phone_verified' => ['nullable', 'boolean'], // Opsional jika nanti ada sistem verif WA

            // Filter Tanggal Registrasi
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],

            // Pagination
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
