<?php

use App\Http\Controllers\Web\TopupPageController;
use Illuminate\Support\Facades\Route;

// Root answers with the service identity and nothing else. It used to render a
// landing page documenting every route group — including the admin,
// payment-internal and Hub ones — to anyone who opened api.<domain>. That map
// now lives in docs/06-referensi-rute-api.md, in the private repo, where
// documentation costs nothing to serve and leaks nothing.
Route::get('/', function () {
    return response()->json([
        'name' => config('app.name'),
        'version' => 'v1',
    ]);
});

// Public top-up page. Checkout itself is performed by the page against the
// public POST /api/v1/checkout endpoint — these routes only serve the catalog
// and a receipt lookup for invoices the browser already knows.
Route::get('/topup', [TopupPageController::class, 'index']);
Route::get('/topup/games/{category}/products', [TopupPageController::class, 'products']);
Route::get('/topup/orders', [TopupPageController::class, 'orders']);
