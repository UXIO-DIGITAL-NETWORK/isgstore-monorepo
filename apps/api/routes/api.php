<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\User\UserController;
use App\Http\Controllers\Api\User\SyncTimezoneController;
use App\Http\Controllers\Api\ActivityLogController;
use App\Http\Controllers\Api\LeaderboardController;
use App\Http\Controllers\Api\Category\CategoryTypeController;
use App\Http\Controllers\Api\Category\CategoryController;
use App\Http\Controllers\Api\Category\SubCategoryController;
use App\Http\Controllers\Api\Category\ServerCategoryController;
use App\Http\Controllers\Api\Category\ServerCategoryOptionController;
use App\Http\Controllers\Api\Supplier\SupplierController;
use App\Http\Controllers\Api\Supplier\SupplierCategoryController;
use App\Http\Controllers\Api\Product\ProductController;
use App\Http\Controllers\Api\Product\SupplierProductController;
use App\Http\Controllers\Api\Payment\MonetapayCallbackController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PointHistoryController;
use App\Http\Controllers\Api\RatingController;
use App\Http\Controllers\Api\BannerController;
use App\Http\Controllers\Api\AnnouncementController;
use App\Http\Controllers\Api\Digiflazz\WebhookDigiflazzController;

// All Public Routes under v1
Route::prefix('v1')->group(function () {

    // System Routes
    Route::get('/ping', function () {
        return response()->json(['status' => 'success', 'message' => 'pong']);
    });

    Route::get('/health', fn () => response()->json([
        'status' => 'success',
        'message' => 'ok',
        'ping_ms' => (int) round((microtime(true) - LARAVEL_START) * 1000),
    ]));

    // Payment Webhooks (No Auth Required)
    Route::post('/payment/callback', MonetapayCallbackController::class);
    Route::post('/digiflazz/callback', [WebhookDigiflazzController::class, 'handle']);
    Route::post('/checkout', [\App\Http\Controllers\Api\CheckoutController::class, 'store']);

    // Authentication Routes
    Route::prefix('auth')->group(function () {
        Route::post('/login', [AuthController::class, 'login']);
        Route::post('/refresh', [AuthController::class, 'refreshToken']);

        Route::middleware('auth:sanctum')->group(function () {
            Route::post('/logout', [AuthController::class, 'logout']);
        });
    });
});

// Protected Routes (Requires Auth)
Route::prefix('v1')->middleware('auth:sanctum')->group(function () {

    // User Info (Current Auth User)
    Route::get('/user', function (Request $request) {
        return response()->json([
            'status' => 'success',
            'data' => $request->user()
        ]);
    });

    // CRUD Users
    Route::prefix('users')->group(function () {
        Route::patch('/sync-timezone', SyncTimezoneController::class);
        Route::get('/', [UserController::class, 'index']);
        Route::post('/', [UserController::class, 'store']);
        Route::get('/{user}', [UserController::class, 'show']);
        Route::put('/{user}', [UserController::class, 'update']);
        Route::delete('/{user}', [UserController::class, 'destroy']);
    });

    // Activity Logs
    Route::get('/activity-logs', [ActivityLogController::class, 'index']);

    // Leaderboard
    Route::get('/leaderboard', [LeaderboardController::class, 'index']);

    // Master Data: Categories
    Route::prefix('category-types')->group(function () {
        Route::get('/', [CategoryTypeController::class, 'index']);
        Route::post('/', [CategoryTypeController::class, 'store']);
        Route::get('/{categoryType}', [CategoryTypeController::class, 'show']);
        Route::put('/{categoryType}', [CategoryTypeController::class, 'update']);
        Route::delete('/{categoryType}', [CategoryTypeController::class, 'destroy']);
    });

    Route::prefix('categories')->group(function () {
        Route::get('/', [CategoryController::class, 'index']);
        Route::post('/', [CategoryController::class, 'store']);
        Route::get('/{category}', [CategoryController::class, 'show']);
        Route::put('/{category}', [CategoryController::class, 'update']);
        Route::delete('/{category}', [CategoryController::class, 'destroy']);
    });

    Route::prefix('sub-categories')->group(function () {
        Route::get('/', [SubCategoryController::class, 'index']);
        Route::post('/', [SubCategoryController::class, 'store']);
        Route::get('/{subCategory}', [SubCategoryController::class, 'show']);
        Route::put('/{subCategory}', [SubCategoryController::class, 'update']);
        Route::delete('/{subCategory}', [SubCategoryController::class, 'destroy']);
    });

    Route::prefix('server-categories')->group(function () {
        Route::get('/', [ServerCategoryController::class, 'index']);
        Route::post('/', [ServerCategoryController::class, 'store']);
        Route::get('/{serverCategory}', [ServerCategoryController::class, 'show']);
        Route::put('/{serverCategory}', [ServerCategoryController::class, 'update']);
        Route::delete('/{serverCategory}', [ServerCategoryController::class, 'destroy']);
    });

    Route::prefix('server-category-options')->group(function () {
        Route::get('/', [ServerCategoryOptionController::class, 'index']);
        Route::post('/', [ServerCategoryOptionController::class, 'store']);
        Route::get('/{serverCategoryOption}', [ServerCategoryOptionController::class, 'show']);
        Route::put('/{serverCategoryOption}', [ServerCategoryOptionController::class, 'update']);
        Route::delete('/{serverCategoryOption}', [ServerCategoryOptionController::class, 'destroy']);
    });

    // Master Data: Suppliers & Products
    Route::prefix('suppliers')->group(function () {
        Route::get('/', [SupplierController::class, 'index']);
        Route::post('/', [SupplierController::class, 'store']);
        Route::get('/{supplier}', [SupplierController::class, 'show']);
        Route::put('/{supplier}', [SupplierController::class, 'update']);
        Route::delete('/{supplier}', [SupplierController::class, 'destroy']);
    });

    Route::prefix('supplier-categories')->group(function () {
        Route::get('/', [SupplierCategoryController::class, 'index']);
        Route::post('/', [SupplierCategoryController::class, 'store']);
        Route::get('/{supplierCategory}', [SupplierCategoryController::class, 'show']);
        Route::put('/{supplierCategory}', [SupplierCategoryController::class, 'update']);
        Route::delete('/{supplierCategory}', [SupplierCategoryController::class, 'destroy']);
    });

    Route::prefix('products')->group(function () {
        Route::get('/', [ProductController::class, 'index']);
        Route::post('/', [ProductController::class, 'store']);
        Route::get('/{product}', [ProductController::class, 'show']);
        Route::put('/{product}', [ProductController::class, 'update']);
        Route::delete('/{product}', [ProductController::class, 'destroy']);
    });

    Route::prefix('supplier-products')->group(function () {
        Route::get('/', [SupplierProductController::class, 'index']);
        Route::post('/', [SupplierProductController::class, 'store']);
        Route::get('/{supplierProduct}', [SupplierProductController::class, 'show']);
        Route::put('/{supplierProduct}', [SupplierProductController::class, 'update']);
        Route::delete('/{supplierProduct}', [SupplierProductController::class, 'destroy']);
    });

    // Payment Management
    Route::get('/payments', [PaymentController::class, 'index']);
    Route::post('/payments', [PaymentController::class, 'store']);
    Route::get('/payments/{payment}', [PaymentController::class, 'show']);
    Route::put('/payments/{payment}', [PaymentController::class, 'update']);
    Route::delete('/payments/{payment}', [PaymentController::class, 'destroy']);

    // Point History Management
    Route::get('/point-histories', [PointHistoryController::class, 'index']);
    Route::post('/point-histories', [PointHistoryController::class, 'store']);
    Route::get('/point-histories/{pointHistory}', [PointHistoryController::class, 'show']);
    Route::put('/point-histories/{pointHistory}', [PointHistoryController::class, 'update']);
    Route::delete('/point-histories/{pointHistory}', [PointHistoryController::class, 'destroy']);

    // Rating Management
    Route::get('/ratings', [RatingController::class, 'index']);
    Route::post('/ratings', [RatingController::class, 'store']);
    Route::get('/ratings/{rating}', [RatingController::class, 'show']);
    Route::put('/ratings/{rating}', [RatingController::class, 'update']);
    Route::delete('/ratings/{rating}', [RatingController::class, 'destroy']);

    // CMS: Banners
    Route::get('/banners', [BannerController::class, 'index']);
    Route::post('/banners', [BannerController::class, 'store']);
    Route::get('/banners/{banner}', [BannerController::class, 'show']);
    Route::put('/banners/{banner}', [BannerController::class, 'update']);
    Route::delete('/banners/{banner}', [BannerController::class, 'destroy']);

    // CMS: Announcements
    Route::get('/announcements', [AnnouncementController::class, 'index']);
    Route::post('/announcements', [AnnouncementController::class, 'store']);
    Route::get('/announcements/{announcement}', [AnnouncementController::class, 'show']);
    Route::put('/announcements/{announcement}', [AnnouncementController::class, 'update']);
    Route::delete('/announcements/{announcement}', [AnnouncementController::class, 'destroy']);
});
