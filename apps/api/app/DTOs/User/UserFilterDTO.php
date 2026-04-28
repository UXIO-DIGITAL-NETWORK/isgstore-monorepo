<?php

namespace App\DTOs\User;

readonly class UserFilterDTO
{
    public function __construct(
        public ?string $search = null,
        public ?int $roleId = null,
        public ?float $minBalance = null,
        public ?float $maxBalance = null,
        public ?int $minPoint = null,
        public ?int $maxPoint = null,
        public ?bool $isEmailVerified = null,
        public ?bool $isPhoneVerified = null,
        public ?string $dateFrom = null,
        public ?string $dateTo = null,
        public int $perPage = 10
    ) {}

    public static function fromValidated(array $validated): self
    {
        return new self(
            search: $validated['search'] ?? null,
            roleId: $validated['role_id'] ?? null,
            minBalance: isset($validated['min_balance']) ? (float) $validated['min_balance'] : null,
            maxBalance: isset($validated['max_balance']) ? (float) $validated['max_balance'] : null,
            minPoint: isset($validated['min_point']) ? (int) $validated['min_point'] : null,
            maxPoint: isset($validated['max_point']) ? (int) $validated['max_point'] : null,
            isEmailVerified: isset($validated['is_email_verified']) ? filter_var($validated['is_email_verified'], FILTER_VALIDATE_BOOLEAN) : null,
            isPhoneVerified: isset($validated['is_phone_verified']) ? filter_var($validated['is_phone_verified'], FILTER_VALIDATE_BOOLEAN) : null,
            dateFrom: $validated['date_from'] ?? null,
            dateTo: $validated['date_to'] ?? null,
            perPage: $validated['per_page'] ?? 10
        );
    }
}
