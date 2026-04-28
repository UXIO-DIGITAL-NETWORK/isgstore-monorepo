<?php

declare(strict_types=1);

namespace App\Actions\Auth;

use Illuminate\Support\Facades\Auth;

class LogoutAction
{
    /**
     * Execute the logout action.
     *
     * @return void
     */
    public function execute(): void
    {
        /** @var \App\Models\User|null $user */
        $user = Auth::user();

        if ($user && $user->currentAccessToken()) {
            // Revoke current access token
            $user->currentAccessToken()->delete();
        }
    }
}
