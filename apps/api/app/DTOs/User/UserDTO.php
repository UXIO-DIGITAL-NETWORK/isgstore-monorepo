<?php

namespace App\DTOs\User;

use App\Support\DateTime\Wib;

readonly class UserDTO
{
    /**
     * No `balance`/`point`: the columns are written only through
     * WalletLedger/PointLedger, which lock the row and record the movement. An
     * update that carried them here bypassed both.
     *
     * `timezone` is not editable either: the platform displays one wall clock
     * (WIB) and every report window is bucketed on it, so an account created
     * with another zone would show a clock that disagrees with its own figures.
     */
    public function __construct(
        public int $roleId,
        public string $name,
        public string $email,
        public string $phone,
        public ?string $password = null,
        public string $locale = 'id',
        public string $timezone = Wib::TZ
    ) {}

    public static function fromValidated(array $validated): self
    {
        return new self(
            roleId: $validated['role_id'],
            name: $validated['name'],
            email: $validated['email'],
            phone: $validated['phone'],
            password: $validated['password'] ?? null,
            locale: $validated['locale'] ?? 'id',
        );
    }
}
