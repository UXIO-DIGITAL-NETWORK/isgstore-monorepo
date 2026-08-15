<?php

declare(strict_types=1);

namespace App\Services;

use Google\Client as GoogleClient;

/**
 * Verifies a Google ID token (JWT) against Google's public certificates.
 *
 * Wrapped in its own class — rather than newing the Google client inside the
 * action — so the network-bound verification can be swapped for a fake in tests
 * (bind/mock this class in the container).
 */
class GoogleTokenVerifier
{
    /**
     * Verify the given ID token and return its decoded payload, or null when
     * the token is invalid/expired or the audience does not match our client.
     *
     * @return array<string, mixed>|null
     */
    public function verify(string $credential): ?array
    {
        $clientId = config('services.google.client_id');

        $client = new GoogleClient(['client_id' => $clientId]);

        // verifyIdToken checks the signature, expiry, issuer and audience
        // (aud === our client_id). Returns the payload array or false.
        $payload = $client->verifyIdToken($credential);

        return is_array($payload) ? $payload : null;
    }
}
