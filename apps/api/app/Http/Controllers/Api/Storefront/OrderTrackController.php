<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Storefront;

use App\Actions\Storefront\TrackOrdersAction;
use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderTrackController extends Controller
{
    use ApiResponse;

    public function __invoke(Request $request, TrackOrdersAction $action): JsonResponse
    {
        $validated = $request->validate([
            'query' => ['required', 'string', 'min:6', 'max:60'],
        ], [
            'query.required' => 'Masukkan nomor invoice atau nomor WhatsApp.',
            'query.min' => 'Masukkan nomor invoice atau nomor WhatsApp yang valid.',
        ]);

        return $this->successResponse(
            $action->execute($validated['query']),
            'Orders retrieved successfully'
        );
    }
}
