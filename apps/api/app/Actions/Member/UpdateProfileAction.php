<?php

declare(strict_types=1);

namespace App\Actions\Member;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\DTOs\Member\UpdateProfileDTO;
use App\Enums\ActivityType;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class UpdateProfileAction
{
    public function __construct(private readonly CreateActivityLogAction $activityLogAction) {}

    public function execute(User $user, UpdateProfileDTO $dto): User
    {
        $attributes = array_filter([
            'name' => $dto->name,
            'username' => $dto->username,
            'email' => $dto->email,
            'phone' => $dto->phone,
            'locale' => $dto->locale,
        ], fn ($value) => $value !== null);

        if ($dto->avatar) {
            $attributes['avatar'] = $this->storeAvatar($user, $dto->avatar);
        }

        $user->update($attributes);

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: $user->id,
            ipAddress: request()?->ip(),
            userAgent: request()?->userAgent(),
            message: 'Profile updated',
            type: ActivityType::SECURITY,
        ));

        return $user->refresh()->load('role');
    }

    private function storeAvatar(User $user, UploadedFile $avatar): string
    {
        // Replace rather than accumulate — an avatar has exactly one current
        // version and orphaned files would grow the disk forever.
        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
        }

        return $avatar->store('avatars', 'public');
    }
}
