<?php

declare(strict_types=1);

namespace App\Actions\User;

use App\Models\User;

/**
 * Store the language someone picked.
 *
 * `users.locale` rather than a cookie: it is what `SetLocale` reads, and it is
 * what makes the choice follow an admin from their laptop to their phone.
 * `localStorage` in each panel is only the offline echo of this value.
 */
class UpdateUserLocaleAction
{
    public function execute(User $user, string $locale): string
    {
        $user->forceFill(['locale' => $locale])->save();

        return $locale;
    }
}
