<?php

namespace App\Http\Controllers\Api\Uxiotopup;

use App\Actions\Uxiotopup\ListUxiotopupPoolCandidatesAction;
use App\Actions\Uxiotopup\PoolUxiotopupSkusAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Uxiotopup\PoolCandidateQueryRequest;
use App\Http\Requests\Uxiotopup\PoolUxiotopupSkusRequest;
use App\Http\Resources\Api\Uxiotopup\UxiotopupPoolCandidateResource;
use App\Traits\ApiResponse;
use Throwable;

/**
 * The Add-panel feed and the act of pulling SKUs into the pool.
 */
class UxiotopupPoolController extends Controller
{
    use ApiResponse;

    public function candidates(PoolCandidateQueryRequest $request, ListUxiotopupPoolCandidatesAction $action)
    {
        try {
            $paginator = $action->execute(
                $request->filters(),
                min(100, max(1, (int) $request->query('per_page', 15))),
                max(1, (int) $request->query('page', 1)),
            );
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal mengambil kandidat pool uxiotopup: '.$e->getMessage(), 502);
        }

        return $this->paginatedResponse(
            UxiotopupPoolCandidateResource::collection($paginator),
            'Kandidat pool provider'
        );
    }

    /**
     * Counts for the pool page badge. A separate endpoint rather than paginator
     * meta because ApiResponse::paginatedResponse() rebuilds the payload and drops
     * anything attached via ->additional().
     */
    public function summary(ListUxiotopupPoolCandidatesAction $action)
    {
        try {
            $summary = $action->summary();
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal menghitung kandidat pool: '.$e->getMessage(), 502);
        }

        return $this->successResponse($summary, 'Ringkasan pool provider');
    }

    public function store(PoolUxiotopupSkusRequest $request, PoolUxiotopupSkusAction $action)
    {
        try {
            $result = $action->execute($request->skuCodes());
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal menarik SKU ke pool: '.$e->getMessage(), 502);
        }

        return $this->successResponse($result, "{$result['pooled']} SKU ditarik ke pool provider");
    }
}
