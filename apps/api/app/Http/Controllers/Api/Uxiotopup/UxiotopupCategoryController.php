<?php

namespace App\Http\Controllers\Api\Uxiotopup;

use App\Actions\Uxiotopup\ListUxiotopupCategoriesAction;
use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Throwable;

/**
 * The provider's own `kategori` values, for the Category Provider dropdown.
 */
class UxiotopupCategoryController extends Controller
{
    use ApiResponse;

    public function index(Request $request, ListUxiotopupCategoriesAction $action)
    {
        try {
            $rows = $action->execute($request->boolean('unmapped'));
        } catch (Throwable $e) {
            // Throwable, not Exception: a malformed upstream payload surfaces as a
            // TypeError, which must degrade to a clean 502 rather than a 500.
            return $this->errorResponse('Gagal mengambil kategori uxiotopup: '.$e->getMessage(), 502);
        }

        return $this->successResponse($rows, 'Kategori provider uxiotopup');
    }
}
