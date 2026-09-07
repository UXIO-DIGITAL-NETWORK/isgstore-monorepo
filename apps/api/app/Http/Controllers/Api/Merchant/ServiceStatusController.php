<?php

namespace App\Http\Controllers\Api\Merchant;

use App\Actions\Status\BuildServiceStatusAction;
use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;

/** Which payment methods are disrupted and which services are closed. */
class ServiceStatusController extends Controller
{
    use ApiResponse;

    public function index(BuildServiceStatusAction $action)
    {
        return $this->successResponse($action->execute(), 'Service status retrieved successfully');
    }
}
