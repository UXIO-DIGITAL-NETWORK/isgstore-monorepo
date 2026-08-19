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
        // Disbursement apps may have separate credentials from the collection app.
        // Falls back to the collection credentials if not explicitly set.
        'disbursement_partner_key' => env('MONETAPAY_DISBURSEMENT_PARTNER_KEY', env('MONETAPAY_PARTNER_KEY')),
        'disbursement_token' => env('MONETAPAY_DISBURSEMENT_TOKEN', env('MONETAPAY_TOKEN')),
        'disbursement_aes_key' => env('MONETAPAY_DISBURSEMENT_AES_KEY', env('MONETAPAY_AES_KEY')),
        'disbursement_aes_iv' => env('MONETAPAY_DISBURSEMENT_AES_IV', env('MONETAPAY_AES_IV')),
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

    'google' => [
        // OAuth Client ID for "Sign in with Google". Used as the audience when
        // verifying the ID token the storefront posts to /v1/auth/google — the
        // same value the frontend sets as VITE_GOOGLE_CLIENT_ID. No client
        // secret is needed: ID-token verification uses Google's public certs.
        'client_id' => env('GOOGLE_CLIENT_ID'),
    ],

    'piwapi' => [
        // WhatsApp gateway used to deliver the purchase receipt (bukti pembayaran)
        // as a document message. Credentials are usually set via the admin
        // Integration page (DB-backed) and fall back to these env defaults.
        'api_url' => env('PIWAPI_API_URL', 'https://piwapi.com/api/send/whatsapp'),
        'account' => env('PIWAPI_ACCOUNT'),
        'secret' => env('PIWAPI_SECRET'),
    ],

    'storefront' => [
        // Consumer storefront base URL, used to build the "Track Order" link in
        // the receipt email. The tracker lives at /{locale}/cek-pesanan.
        'url' => env('STOREFRONT_URL', 'http://localhost:5173'),
        'brand' => env('STOREFRONT_BRAND', 'TOPUP GAME'),
    ],

    'service_invoice' => [
        // How long a client has to pay before `services:expire` closes an
        // UNPAID service bill. Config rather than a column so the window can be
        // retuned without a migration.
        'due_days' => env('SERVICE_INVOICE_DUE_DAYS', 3),
    ],

    'withdrawal' => [
        // Kita's withdraw fee, charged on every payout. Read by
        // CreateWithdrawalRequestAction::resolveFee() as `flat + round(amount *
        // percent / 100)`; the merchant is disbursed `nett = amount - fee`.
        // Config (not a column) so the schedule can change without a migration.
        'fee_flat' => (int) env('WITHDRAWAL_FEE_FLAT', 1500),
        'fee_percent' => (float) env('WITHDRAWAL_FEE_PERCENT', 11),
        // Floor on the requested amount. Must exceed the fee so `nett` stays
        // positive (Rp 1.000 would otherwise net -610) and clear the gateway's
        // minimum payout. StoreWithdrawalRequest enforces it.
        'min_amount' => (int) env('WITHDRAWAL_MIN_AMOUNT', 10000),
    ],
];
