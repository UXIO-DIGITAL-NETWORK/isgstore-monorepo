<?php

namespace App\DTOs\Announcement;

use Illuminate\Http\UploadedFile;

readonly class CreateAnnouncementDTO
{
    public function __construct(
        public ?int $categoryId,
        public string $content,
        public UploadedFile|string|null $imagePath,
        public bool $isActive,
    ) {}
}
