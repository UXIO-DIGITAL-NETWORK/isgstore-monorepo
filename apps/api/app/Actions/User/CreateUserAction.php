<?php

namespace App\Actions\User;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\DTOs\User\UserDTO;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class CreateUserAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(UserDTO $dto): User
    {
        $user = User::create([
            'role_id' => $dto->roleId,
            'name' => $dto->name,
            'email' => $dto->email,
            'phone' => $dto->phone,
            'password' => Hash::make($dto->password),
            // The columns default to 0; an opening balance is an audited
            // adjustment, not a create-time field.
            'locale' => $dto->locale,
            'timezone' => $dto->timezone,
        ]);

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(), // ID of the admin who created the user
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Created new user: {$user->email}"
        ));

        return $user;
    }
}
