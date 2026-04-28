<?php

namespace App\Actions\User;

use App\Models\User;
use App\DTOs\User\SyncTimezoneDTO;

class SyncUserTimezoneAction
{
    /**
     * Memperbarui timezone pengguna jika terdapat perbedaan.
     * Mengembalikan true jika diperbarui atau sudah sama, false jika gagal.
     */
    public function execute(User $user, SyncTimezoneDTO $dto): bool
    {
        if ($user->timezone === $dto->timezone) {
            return true; // Tidak perlu query ke database jika datanya sama
        }

        return $user->update(['timezone' => $dto->timezone]);
    }
}
