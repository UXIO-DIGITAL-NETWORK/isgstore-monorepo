<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Digiflazz brand → local category code map
    |--------------------------------------------------------------------------
    |
    | Used by the daily product sync when auto-creating products for Digiflazz
    | SKUs that don't exist locally yet. Keys are Digiflazz `brand` values
    | (uppercased before lookup); values are `categories.code`. Unmapped brands
    | fall back to the self-provisioned `uncategorized` category and are listed
    | in the sync report so an admin can extend this map.
    |
    */

    'category_map' => [
        // Games
        'MOBILE LEGENDS' => 'mlbb',
        'FREE FIRE' => 'freefire',
        'FREE FIRE MAX' => 'freefire',
        'VALORANT' => 'valorant',

        // Pulsa
        'TELKOMSEL' => 'pulsa',
        'INDOSAT' => 'pulsa',
        'XL' => 'pulsa',
        'AXIS' => 'pulsa',
        'TRI' => 'pulsa',
        'SMARTFREN' => 'pulsa',
        'BY.U' => 'pulsa',

        // E-Money
        'DANA' => 'emoney',
        'OVO' => 'emoney',
        'GO PAY' => 'emoney',
        'GOPAY' => 'emoney',
        'SHOPEE PAY' => 'emoney',
        'SHOPEEPAY' => 'emoney',
        'LINKAJA' => 'emoney',

        // PPOB
        'PLN' => 'ppob',
        'K-VISION & GOL' => 'ppob',
        'PERTAGAS' => 'ppob',
    ],

    'fallback_category_code' => 'uncategorized',
];
