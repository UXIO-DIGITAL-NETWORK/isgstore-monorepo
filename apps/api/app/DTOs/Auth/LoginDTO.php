<?php

namespace App\DTOs\Auth;

readonly class LoginDTO
{
    public function __construct(
        public string $email,
        public string $password,
        public ?string $timezone = null
    ) {}

    public static function fromValidated(array $validated): self
    {
        return new self(
            email: $validated['email'],
            password: $validated['password'],
            timezone: $validated['timezone'] ?? null
        );
    }
}
