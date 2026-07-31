<?php

declare(strict_types=1);

namespace App\DTOs\Member;

use Illuminate\Http\UploadedFile;

readonly class UpdateProfileDTO
{
    public function __construct(
        public ?string $name = null,
        public ?string $username = null,
        public ?string $email = null,
        public ?string $phone = null,
        public ?string $locale = null,
        public ?UploadedFile $avatar = null,
    ) {}
}
