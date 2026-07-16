<?php

namespace App\Http\Controllers\Api;

use App\Actions\Integration\GetIntegrationChannelsAction;
use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;

class IntegrationController extends Controller
{
    use ApiResponse;

    public function channels(GetIntegrationChannelsAction $action)
    {
        return $this->successResponse($action->execute(), 'Integration channels retrieved successfully');
    }
}
