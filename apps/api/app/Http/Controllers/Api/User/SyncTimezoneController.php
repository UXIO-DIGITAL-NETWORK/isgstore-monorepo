<?php

namespace App\Http\Controllers\Api\User;

use App\Actions\User\SyncUserTimezoneAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\User\SyncTimezoneRequest;
use App\Models\User;
use App\Support\DateTime\Wib;
use Illuminate\Http\JsonResponse;

class SyncTimezoneController extends Controller
{
    /**
     * Kept as a compatibility endpoint: the platform displays one wall clock
     * (WIB), so the zone in the payload is ignored and the account is
     * normalised onto it. See SyncUserTimezoneAction.
     */
    public function __invoke(SyncTimezoneRequest $request, SyncUserTimezoneAction $action): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $action->execute($user);

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'message' => 'Zona waktu berhasil disinkronisasi.',
            'data' => [
                'timezone' => Wib::TZ,
            ],
        ], 200);
    }
}
