<?php

namespace App\Actions\User;

use App\Models\User;
use App\DTOs\User\UserDTO;
use Illuminate\Support\Facades\Hash;

class CreateUserAction
{
    public function execute(UserDTO $dto): User
    {
        return User::create([
            'role_id' => $dto->roleId,
            'name' => $dto->name,
            'email' => $dto->email,
            'phone' => $dto->phone,
            'password' => Hash::make($dto->password),
            'balance' => $dto->balance,
            'point' => $dto->point,
            'locale' => $dto->locale,
            'timezone' => $dto->timezone,
        ]);
    }
}
