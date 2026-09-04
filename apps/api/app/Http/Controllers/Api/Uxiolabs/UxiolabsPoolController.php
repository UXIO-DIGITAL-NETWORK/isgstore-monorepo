<?php

namespace App\Http\Controllers\Api\Uxiolabs;

use App\Actions\Uxiolabs\ListUxiolabsPoolCandidatesAction;
use App\Actions\Uxiolabs\PoolUxiolabsSkusAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Uxiolabs\PoolCandidateQueryRequest;
use App\Http\Requests\Uxiolabs\PoolUxiolabsSkusRequest;
use App\Http\Resources\Api\Uxiolabs\UxiolabsPoolCandidateResource;
use App\Traits\ApiResponse;
use Throwable;

/**
 * The Add-panel feed and the act of pulling SKUs into the pool.
 */
class UxiolabsPoolController extends Controller
{
    use ApiResponse;

    public function candidates(PoolCandidateQueryRequest $request, ListUxiolabsPoolCandidatesAction $action)
    {
        try {
            $paginator = $action->execute(
                $request->filters(),
                min(100, max(1, (int) $request->query('per_page', 15))),
                max(1, (int) $request->query('page', 1)),
            );
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal mengambil kandidat pool uxiolabs: '.$e->getMessage(), 502);
        }

        return $this->paginatedResponse(
            UxiolabsPoolCandidateResource::collection($paginator),
            'Kandidat pool provider'
        );
    }

    /**
     * Counts for the pool page badge. A separate endpoint rather than paginator
     * meta because ApiResponse::paginatedResponse() rebuilds the payload and drops
     * anything attached via ->additional().
     */
    public function summary(ListUxiolabsPoolCandidatesAction $action)
    {
        try {
            $summary = $action->summary();
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal menghitung kandidat pool: '.$e->getMessage(), 502);
        }

        return $this->successResponse($summary, 'Ringkasan pool provider');
    }

    public function store(PoolUxiolabsSkusRequest $request, PoolUxiolabsSkusAction $action)
    {
        try {
            $result = $action->execute($request->skuCodes());
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal menarik SKU ke pool: '.$e->getMessage(), 502);
        }

        return $this->successResponse($result, "{$result['pooled']} SKU ditarik ke pool provider");
    }
}
