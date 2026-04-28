<?php

namespace App\Actions\User;

use App\Models\User;
use App\DTOs\User\UserDTO;
use Illuminate\Support\Facades\Hash;

class UpdateUserAction
{
    public function execute(User $user, UserDTO $dto): User
    {
        $data = [
            'role_id' => $dto->roleId,
            'name' => $dto->name,
            'email' => $dto->email,
            'phone' => $dto->phone,
            'balance' => $dto->balance,
            'point' => $dto->point,
            'locale' => $dto->locale,
            'timezone' => $dto->timezone,
        ];

        if ($dto->password) {
            $data['password'] = Hash::make($dto->password);
        }

        $user->update($data);

        return $user->fresh();
    }
}
