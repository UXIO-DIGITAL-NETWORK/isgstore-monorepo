<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\User;

use App\Actions\User\UpdateUserLocaleAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\User\UpdateLocaleRequest;
use App\Models\User;
use App\Traits\ApiResponse;

/**
 * Its own endpoint rather than a field on `sync-timezone`.
 *
 * That route's name promises one thing, and the two are not the same kind of
 * fact: a timezone is detected from the browser and synced silently, while a
 * language is chosen by a person.
 */
class UpdateLocaleController extends Controller
{
    use ApiResponse;

    public function __invoke(UpdateLocaleRequest $request, UpdateUserLocaleAction $action)
    {
        /** @var User $user */
        $user = $request->user();

        $locale = $action->execute($user, (string) $request->validated('locale'));

        return $this->successResponse(['locale' => $locale], __('locale.updated'));
    }
}
