<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Storefront;

use App\Actions\Storefront\ValidateGameIdAction;
use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ValidateGameIdController extends Controller
{
    use ApiResponse;

    public function __invoke(Request $request, Category $game, ValidateGameIdAction $action): JsonResponse
    {
        $validated = $request->validate([
            'target_uid' => ['required', 'string', 'max:50'],
            'target_server' => ['nullable', 'string', 'max:50'],
        ]);

        // Always 200: "no nickname available" is a valid answer, not a failure.
        // A 4xx here would let a missing lookup provider read as a broken order
        // form on the client.
        return $this->successResponse(
            $action->execute($game, $validated['target_uid'], $validated['target_server'] ?? null),
            'Validation completed'
        );
    }
}
