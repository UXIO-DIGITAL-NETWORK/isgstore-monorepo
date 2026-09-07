<?php

namespace App\Http\Controllers\Api\User;

use App\Actions\User\SyncUserTimezoneAction;
use App\DTOs\User\SyncTimezoneDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\User\SyncTimezoneRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class SyncTimezoneController extends Controller
{
    /**
     * (Asumsi: Menggunakan trait ApiResponse yang sama dengan standar arsitektur kita)
     */
    public function __invoke(SyncTimezoneRequest $request, SyncUserTimezoneAction $action): JsonResponse
    {
        $dto = SyncTimezoneDTO::fromValidated($request->validated());

        /** @var User $user */
        $user = $request->user();

        $action->execute($user, $dto);

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'message' => 'Zona waktu berhasil disinkronisasi.',
            'data' => [
                'timezone' => $dto->timezone,
            ],
        ], 200);
    }
}
