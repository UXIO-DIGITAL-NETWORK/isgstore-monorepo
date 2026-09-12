<?php

/**
 * Per-provider credential field schema. Single source of truth for:
 *  - which keys make up a provider's effective config,
 *  - which are secret (masked in the API, password inputs in the UI),
 *  - the dynamic "Edit connection" form the admin renders.
 *
 * Field shape: ['key','label','type' => text|password|boolean,'secret' => bool].
 * The `type` mirrors `config('services.<provider>')` keys so a saved value maps
 * straight onto the existing service config (DB overrides env — see
 * App\Support\Integration\IntegrationConfig).
 */
return [
    'monetapay' => [
        'label' => 'Payment Gateway',
        'type' => 'payment_gateway',
        'fields' => [
            ['key' => 'mch_id', 'label' => 'Merchant ID', 'type' => 'text', 'secret' => false],
            ['key' => 'sub_mch_id', 'label' => 'Sub-Merchant ID', 'type' => 'text', 'secret' => false],
            ['key' => 'collection_app_id', 'label' => 'Collection App ID', 'type' => 'text', 'secret' => false],
            ['key' => 'disbursement_app_id', 'label' => 'Disbursement App ID', 'type' => 'text', 'secret' => false],
            ['key' => 'partner_key', 'label' => 'Partner Key', 'type' => 'password', 'secret' => true],
            ['key' => 'token', 'label' => 'Token', 'type' => 'password', 'secret' => true],
            ['key' => 'aes_key', 'label' => 'AES Key', 'type' => 'password', 'secret' => true],
            ['key' => 'aes_iv', 'label' => 'AES IV', 'type' => 'password', 'secret' => true],
            ['key' => 'is_production', 'label' => 'Production Mode', 'type' => 'boolean', 'secret' => false],
        ],
    ],

    'uxiolabs' => [
        'label' => 'Uxiolabs',
        'type' => 'supplier',
        'fields' => [
            ['key' => 'api_key', 'label' => 'API Key', 'type' => 'password', 'secret' => true],
            ['key' => 'base_url', 'label' => 'Base URL', 'type' => 'text', 'secret' => false],
            ['key' => 'price_tier', 'label' => 'Price Tier', 'type' => 'text', 'secret' => false],
        ],
    ],

    'piwapi' => [
        'label' => 'PiWAPI (WhatsApp)',
        'type' => 'whatsapp_gateway',
        'fields' => [
            ['key' => 'account', 'label' => 'Account ID', 'type' => 'text', 'secret' => false],
            ['key' => 'secret', 'label' => 'API Secret', 'type' => 'password', 'secret' => true],
            ['key' => 'api_url', 'label' => 'API URL', 'type' => 'text', 'secret' => false],
        ],
    ],
];
