<?php

use App\Http\Controllers\Web\TopupPageController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Public top-up page. Checkout itself is performed by the page against the
// public POST /api/v1/checkout endpoint — these routes only serve the catalog
// and a receipt lookup for invoices the browser already knows.
Route::get('/topup', [TopupPageController::class, 'index']);
Route::get('/topup/games/{category}/products', [TopupPageController::class, 'products']);
Route::get('/topup/orders', [TopupPageController::class, 'orders']);
