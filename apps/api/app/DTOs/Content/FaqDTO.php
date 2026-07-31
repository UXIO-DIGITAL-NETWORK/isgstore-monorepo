<?php

namespace App\DTOs\Content;

readonly class FaqDTO
{
    public function __construct(
        public string $question,
        public string $answer,
        public ?string $group,
        public string $locale,
        public int $sortOrder,
        public bool $isActive,
    ) {}
}
