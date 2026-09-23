<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['*'],

    'allowed_methods' => ['*'],

    // Restrict to the known frontends (admin, storefront, payment) via a
    // comma-separated env allowlist.
    //
    // There is deliberately no wildcard fallback in production: an unset var
    // would otherwise let any origin read every response an authorised caller
    // can see, and the failure would be silent. An empty list instead breaks
    // cross-origin calls loudly, which is the direction to be wrong in. Local
    // dev keeps '*' so a fresh clone works without configuring anything.
    'allowed_origins' => (function () {
        $configured = array_values(array_filter(
            array_map('trim', explode(',', (string) env('CORS_ALLOWED_ORIGINS', ''))),
            fn ($origin) => $origin !== '',
        ));

        if ($configured !== []) {
            return $configured;
        }

        return env('APP_ENV') === 'production' ? [] : ['*'];
    })(),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];
