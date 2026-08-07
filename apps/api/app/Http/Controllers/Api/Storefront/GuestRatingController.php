<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Storefront;

use App\Actions\Storefront\SubmitGuestTransactionRatingAction;
use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GuestRatingController extends Controller
{
    use ApiResponse;

    /**
     * Public: a guest reviews their own completed order by invoice number.
     * Validates inline like MemberTransactionController::rate; the guest name is
     * generated server-side and returned so the client can echo it.
     */
    public function store(Request $request, string $invoiceNumber, SubmitGuestTransactionRatingAction $action): JsonResponse
    {
        $validated = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ]);

        $rating = $action->execute(
            $invoiceNumber,
            (int) $validated['rating'],
            $validated['comment'] ?? null,
        );

        return $this->successResponse(
            ['guest_name' => $rating->guest_name],
            'Terima kasih atas penilaian Anda',
            201,
        );
    }
}
