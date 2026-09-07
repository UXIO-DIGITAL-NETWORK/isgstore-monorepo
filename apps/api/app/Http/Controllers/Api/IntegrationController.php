<?php

namespace App\Http\Controllers\Api;

use App\Actions\Integration\GetIntegrationChannelsAction;
use App\Actions\Integration\PingIntegrationChannelAction;
use App\Actions\Integration\ShowIntegrationChannelAction;
use App\Actions\Integration\UpdateIntegrationCredentialAction;
use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class IntegrationController extends Controller
{
    use ApiResponse;

    public function channels(GetIntegrationChannelsAction $action)
    {
        return $this->successResponse($action->execute(), 'Integration channels retrieved successfully');
    }

    public function show(string $provider, ShowIntegrationChannelAction $action)
    {
        $details = $action->execute($provider);

        if (! $details) {
            return $this->errorResponse('Integration channel not found.', 404);
        }

        return $this->successResponse($details, 'Integration channel retrieved successfully');
    }

    public function update(string $provider, Request $request, UpdateIntegrationCredentialAction $action)
    {
        $fields = config("integrations.{$provider}.fields");
        if (! $fields) {
            return $this->errorResponse('Integration channel not found.', 404);
        }

        // Rules from the provider schema: text/secret are nullable strings
        // (blank = keep the stored secret), booleans are booleans.
        $rules = [];
        foreach ($fields as $field) {
            $rules[$field['key']] = $field['type'] === 'boolean'
                ? ['sometimes', 'boolean']
                : ['sometimes', 'nullable', 'string', 'max:255'];
        }
        $validated = $request->validate($rules);

        $action->execute($provider, $validated, $request->user()?->id);

        // Re-read so the response carries the fresh (masked) details.
        return $this->show($provider, app(ShowIntegrationChannelAction::class));
    }

    public function ping(string $provider, PingIntegrationChannelAction $action)
    {
        $channel = $action->execute($provider);

        if (! $channel) {
            return $this->errorResponse('Integration channel not found.', 404);
        }

        return $this->successResponse($channel, 'Integration channel refreshed');
    }
}
