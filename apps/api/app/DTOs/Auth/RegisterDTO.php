<?php

declare(strict_types=1);

namespace App\DTOs\Auth;

readonly class RegisterDTO
{
    public function __construct(
        public string $name,
        public string $email,
        public string $phone,
        public string $password,
        public ?string $username = null,
        public ?string $locale = null,
    ) {}
}
