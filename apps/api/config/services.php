<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'monetapay' => [
        'mch_id' => env('MONETAPAY_MCH_ID'),
        'collection_app_id' => env('MONETAPAY_COLLECTION_APP_ID'),
        'disbursement_app_id' => env('MONETAPAY_DISBURSEMENT_APP_ID', env('MONETAPAY_MCH_ID')),
        'partner_key' => env('MONETAPAY_PARTNER_KEY'),
        'token' => env('MONETAPAY_TOKEN'),
        'aes_key' => env('MONETAPAY_AES_KEY'),
        'aes_iv' => env('MONETAPAY_AES_IV'),
        'is_production' => env('MONETAPAY_IS_PRODUCTION', false),
        'success_redirect_url' => env('MONETAPAY_SUCCESS_REDIRECT_URL', 'https://example.com'),
        'failed_redirect_url' => env('MONETAPAY_FAILED_REDIRECT_URL', ''),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],
    'digiflazz' => [
        'username' => env('DIGIFLAZZ_USERNAME'),
        // apiKey is bound to the account's API mode. Legacy DIGIFLAZZ_KEY is kept
        // as the fallback for both so existing dev/staging envs keep working.
        'production' => env('DIGIFLAZZ_PRODUCTION', false),
        'dev_key' => env('DIGIFLAZZ_DEV_KEY', env('DIGIFLAZZ_KEY')),
        'prod_key' => env('DIGIFLAZZ_PROD_KEY', env('DIGIFLAZZ_KEY')),
        'base_url' => env('DIGIFLAZZ_BASE_URL', 'https://api.digiflazz.com/v1'),
        'webhook_secret' => env('DIGIFLAZZ_WEBHOOK_SECRET'),
    ],

    'discord' => [
        'webhook_log_url' => env('DISCORD_WEBHOOK_LOG_URL'),
    ],
];
