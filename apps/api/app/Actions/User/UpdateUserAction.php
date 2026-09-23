<?php

namespace App\Actions\User;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\DTOs\User\UserDTO;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class UpdateUserAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(User $user, UserDTO $dto): User
    {
        $data = [
            'role_id' => $dto->roleId,
            'name' => $dto->name,
            'email' => $dto->email,
            'phone' => $dto->phone,
            // balance/point are not here on purpose — money moves through
            // WalletLedger, which locks the row and writes the ledger entry.
            'locale' => $dto->locale,
            'timezone' => $dto->timezone,
        ];

        if ($dto->password) {
            $data['password'] = Hash::make($dto->password);
        }

        $user->update($data);

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id() ?? $user->id,
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Updated user details: {$user->email}"
        ));

        return $user->fresh();
    }
}
