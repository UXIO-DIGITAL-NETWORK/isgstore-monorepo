<?php

declare(strict_types=1);

namespace App\DTOs\Auth;

readonly class GoogleLoginDTO
{
    public function __construct(
        // The Google ID token (a JWT) issued to the storefront by Google
        // Identity Services and posted here for server-side verification.
        public string $credential,
    ) {}
}
