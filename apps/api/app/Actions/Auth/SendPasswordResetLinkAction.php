<?php

declare(strict_types=1);

namespace App\Actions\Auth;

use Illuminate\Support\Facades\Password;

/**
 * Start a password reset.
 *
 * Deliberately does NOT report whether the address exists: the caller always
 * gets the same message, so this endpoint cannot be used to enumerate which
 * emails have accounts. Broker failures are swallowed for the same reason and
 * surface in the mail log instead.
 */
class SendPasswordResetLinkAction
{
    public function execute(string $email): void
    {
        Password::sendResetLink(['email' => $email]);
    }
}
