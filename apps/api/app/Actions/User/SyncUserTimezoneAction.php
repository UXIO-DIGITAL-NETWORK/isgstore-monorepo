<?php

namespace App\Actions\User;

use App\Models\User;
use App\DTOs\User\SyncTimezoneDTO;
use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use Illuminate\Support\Facades\Auth;

class SyncUserTimezoneAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}
    /**
     * Memperbarui timezone pengguna jika terdapat perbedaan.
     * Mengembalikan true jika diperbarui atau sudah sama, false jika gagal.
     */
    public function execute(User $user, SyncTimezoneDTO $dto): bool
    {
        if ($user->timezone === $dto->timezone) {
            return true; // Tidak perlu query ke database jika datanya sama
        }

        $updated = $user->update(['timezone' => $dto->timezone]);

        if ($updated) {
            $this->activityLogAction->execute(new CreateActivityLogDTO(
                userId: Auth::id() ?? $user->id,
                ipAddress: request()->ip(),
                userAgent: request()->userAgent(),
                message: "Synced user timezone to: {$dto->timezone}"
            ));
        }

        return $updated;
    }
}
