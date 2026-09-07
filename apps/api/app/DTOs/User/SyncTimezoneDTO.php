<?php

namespace App\DTOs\User;

readonly class SyncTimezoneDTO
{
    public function __construct(
        public string $timezone
    ) {}

    public static function fromValidated(array $validated): self
    {
        return new self(
            timezone: $validated['timezone']
        );
    }
}
