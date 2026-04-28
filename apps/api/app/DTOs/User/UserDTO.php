<?php

namespace App\DTOs\User;

readonly class UserDTO
{
    public function __construct(
        public int $roleId,
        public string $name,
        public string $email,
        public string $phone,
        public float $balance = 0,
        public int $point = 0,
        public ?string $password = null,
        public string $locale = 'id',
        public string $timezone = 'Asia/Jakarta'
    ) {}

    public static function fromValidated(array $validated): self
    {
        return new self(
            roleId: $validated['role_id'],
            name: $validated['name'],
            email: $validated['email'],
            phone: $validated['phone'],
            balance: (float) ($validated['balance'] ?? 0),
            point: (int) ($validated['point'] ?? 0),
            password: $validated['password'] ?? null,
            locale: $validated['locale'] ?? 'id',
            timezone: $validated['timezone'] ?? 'Asia/Jakarta'
        );
    }
}
