<?php

namespace App\DTOs\Announcement;

readonly class CreateAnnouncementDTO
{
    public function __construct(
        public ?int $categoryId,
        public string $content,
        public ?string $imagePath,
        public bool $isActive,
    ) {}
}
