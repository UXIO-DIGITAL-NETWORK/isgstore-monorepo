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
        'partner_key' => env('MONETAPAY_PARTNER_KEY'),
        'token' => env('MONETAPAY_TOKEN'),
        'aes_key' => env('MONETAPAY_AES_KEY'),
        'aes_iv' => env('MONETAPAY_AES_IV'),
        'is_production' => env('MONETAPAY_IS_PRODUCTION', false),
        'success_redirect_url' => env('MONETAPAY_SUCCESS_REDIRECT_URL', 'https://example.com'),
        'failed_redirect_url' => env('MONETAPAY_FAILED_REDIRECT_URL', ''),
    ],

    /*
     | Monetapay RDL (Rekening Dana Lender — escrow / P2P-lending) API.
     | Distinct product from the payment API above: JSON-encrypted en_data body
     | and a response_code/response_msg envelope. Crypto keys are shared by
     | default but can be overridden. base_url + paths are PLACEHOLDERS — fill
     | from Monetapay's RDL spec before hitting the real sandbox.
     */
    'monetapay_rdl' => [
        'base_url' => env('MONETAPAY_RDL_BASE_URL', 'https://sandbox-api.monetapay.net'),
        'mch_id' => env('MONETAPAY_RDL_MCH_ID', env('MONETAPAY_MCH_ID')),
        'partner_key' => env('MONETAPAY_RDL_PARTNER_KEY', env('MONETAPAY_PARTNER_KEY')),
        'token' => env('MONETAPAY_RDL_TOKEN', env('MONETAPAY_TOKEN')),
        'aes_key' => env('MONETAPAY_RDL_AES_KEY', env('MONETAPAY_AES_KEY')),
        'aes_iv' => env('MONETAPAY_RDL_AES_IV', env('MONETAPAY_AES_IV')),
        'paths' => [
            'customer_create' => env('MONETAPAY_RDL_PATH_CUSTOMER_CREATE', '/v1.0.0/rdl/customer/create'),
            'customer_inquiry' => env('MONETAPAY_RDL_PATH_CUSTOMER_INQUIRY', '/v1.0.0/rdl/customer/inquiry'),
            'customer_update' => env('MONETAPAY_RDL_PATH_CUSTOMER_UPDATE', '/v1.0.0/rdl/customer/update'),
            'va_create' => env('MONETAPAY_RDL_PATH_VA_CREATE', '/v1.0.0/rdl/va/create'),
            'va_inquiry' => env('MONETAPAY_RDL_PATH_VA_INQUIRY', '/v1.0.0/rdl/va/inquiry'),
            'disbursement_create' => env('MONETAPAY_RDL_PATH_DISBURSEMENT_CREATE', '/v1.0.0/rdl/disbursement/create'),
            'disbursement_inquiry' => env('MONETAPAY_RDL_PATH_DISBURSEMENT_INQUIRY', '/v1.0.0/rdl/disbursement/inquiry'),
        ],
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
        'key' => env('DIGIFLAZZ_KEY'),
        'base_url' => env('DIGIFLAZZ_BASE_URL', 'https://api.digiflazz.com/v1'),
        'webhook_secret' => env('DIGIFLAZZ_WEBHOOK_SECRET'),
    ],

    'discord' => [
        'webhook_log_url' => env('DISCORD_WEBHOOK_LOG_URL'),
    ],
];
