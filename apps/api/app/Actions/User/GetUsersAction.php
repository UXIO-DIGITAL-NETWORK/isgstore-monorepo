<?php

namespace App\Actions\User;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\DTOs\User\UserFilterDTO;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;

class GetUsersAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(UserFilterDTO $dto): LengthAwarePaginator
    {
        $query = User::query();

        // 1. Pencarian Global (Nama, Email, HP)
        if ($dto->search) {
            $query->where(function (Builder $q) use ($dto) {
                $q->where('name', 'like', "%{$dto->search}%")
                    ->orWhere('email', 'like', "%{$dto->search}%")
                    ->orWhere('phone', 'like', "%{$dto->search}%");
            });
        }

        // 2. Filter Role (Sesuai Dropdown UI)
        if ($dto->roleId) {
            $query->where('role_id', $dto->roleId);
        }
        if ($dto->excludeRoleId) {
            $query->where('role_id', '!=', $dto->excludeRoleId);
        }

        // 3. Filter Range Saldo
        if ($dto->minBalance !== null) {
            $query->where('balance', '>=', $dto->minBalance);
        }
        if ($dto->maxBalance !== null) {
            $query->where('balance', '<=', $dto->maxBalance);
        }

        // 4. Filter Range Poin
        if ($dto->minPoint !== null) {
            $query->where('point', '>=', $dto->minPoint);
        }
        if ($dto->maxPoint !== null) {
            $query->where('point', '<=', $dto->maxPoint);
        }

        // 5. Filter Verifikasi Email
        if ($dto->isEmailVerified !== null) {
            if ($dto->isEmailVerified) {
                $query->whereNotNull('email_verified_at');
            } else {
                $query->whereNull('email_verified_at');
            }
        }

        // 6. Filter Tanggal Registrasi (created_at)
        if ($dto->dateFrom) {
            $query->whereDate('created_at', '>=', $dto->dateFrom);
        }
        if ($dto->dateTo) {
            $query->whereDate('created_at', '<=', $dto->dateTo);
        }

        // Return hasil yang sudah di-paginate dan diurutkan dari yang terbaru
        $result = $query->latest()->paginate($dto->perPage);

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: 'Fetched users list with filters'
        ));

        return $result;
    }
}
