<?php

declare(strict_types=1);

namespace App\DTOs\Auth;

readonly class RefreshTokenDTO
{
    public function __construct(
        public string $refreshToken,
    ) {
    }
}
