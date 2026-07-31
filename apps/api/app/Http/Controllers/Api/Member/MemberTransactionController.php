<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Member;

use App\Actions\Member\GetMemberDashboardAction;
use App\Actions\Member\ListMemberTransactionsAction;
use App\Actions\Member\SubmitTransactionRatingAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Member\ListMemberTransactionsRequest;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MemberTransactionController extends Controller
{
    use ApiResponse;

    public function dashboard(Request $request, GetMemberDashboardAction $action): JsonResponse
    {
        return $this->successResponse(
            $action->execute($request->user()),
            'Dashboard retrieved successfully'
        );
    }

    public function index(ListMemberTransactionsRequest $request, ListMemberTransactionsAction $action): JsonResponse
    {
        // The action emits the public row shape already; the bare JsonResource
        // only supplies the shared {data, links, meta} envelope.
        return $this->paginatedResponse(
            JsonResource::collection($action->execute($request->user(), $request->toDTO())),
            'Transactions retrieved successfully'
        );
    }

    public function rate(Request $request, string $invoiceNumber, SubmitTransactionRatingAction $action): JsonResponse
    {
        $validated = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ]);

        $action->execute(
            $request->user(),
            $invoiceNumber,
            (int) $validated['rating'],
            $validated['comment'] ?? null,
        );

        return $this->successResponse(null, 'Terima kasih atas penilaian Anda', 201);
    }
}
