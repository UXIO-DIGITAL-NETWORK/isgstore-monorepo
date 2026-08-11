<?php

namespace App\Http\Controllers\Api\Finance;

use App\Http\Controllers\Controller;
use App\Support\Pricing\AdminFeeSetting;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

/**
 * Payment-internal ("kita") reads and sets the global admin-fee markup that is
 * added on top of the per-channel fee at checkout.
 */
class AdminFeeSettingController extends Controller
{
    use ApiResponse;

    public function show()
    {
        return $this->successResponse(AdminFeeSetting::current(), 'Admin fee setting retrieved successfully');
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'type' => ['required', 'string', 'in:percent,fixed'],
            'value' => ['required', 'integer', 'min:0'],
        ]);

        // A percentage over 100 would charge more than the product itself.
        if ($validated['type'] === AdminFeeSetting::TYPE_PERCENT && $validated['value'] > 100) {
            return $this->errorResponse('Biaya admin persen tidak boleh lebih dari 100.', 422);
        }

        AdminFeeSetting::save($validated['type'], (int) $validated['value']);

        return $this->successResponse(AdminFeeSetting::current(), 'Biaya admin berhasil disimpan');
    }
}
