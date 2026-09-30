<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Release identity
    |--------------------------------------------------------------------------
    |
    | Stamped by the deploy from the release tag and the commit it was cut from,
    | so `GET /v1/version` can answer "what is running here" without opening the
    | server. Both are empty on a local checkout, and an unstamped deployment
    | says so rather than inventing a version.
    |
    */

    'app' => env('APP_VERSION', ''),

    'commit' => env('APP_COMMIT', ''),

    /*
    | The template release this site forked from (the `web-topup-monorepo` tag).
    | This is what tells the Hub — and `hub:status` — how far a site has drifted
    | from the cetakan without diffing two repositories by hand.
    */
    'upstream' => env('APP_UPSTREAM', ''),

    /*
    | The Hub contract version this site speaks. The Hub serves sites at mixed
    | versions, so this is the value it checks against its own minimum supported
    | version. `/v1` is the only contract that exists today.
    */
    'hub_contract' => env('HUB_CONTRACT_VERSION', 'v1'),

];
