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
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\Payment\Monetapay\MonetapayCallbackController;
use App\Http\Controllers\Api\Payment\Monetapay\MonetapayController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PointHistoryController;
use App\Http\Controllers\Api\RatingController;
use App\Http\Controllers\Api\BannerController;
use App\Http\Controllers\Api\AnnouncementController;
use App\Http\Controllers\Api\Digiflazz\DigiflazzBalanceController;
use App\Http\Controllers\Api\Digiflazz\DigiflazzPostpaidController;
use App\Http\Controllers\Api\Digiflazz\DigiflazzSyncController;
use App\Http\Controllers\Api\Digiflazz\DigiflazzTransactionStatusController;
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
    // Method-specific Monetapay callbacks — same decrypt+verify+dispatch flow.
    // Point Monetapay's VA/E-Wallet/QRIS callback URLs at whichever you prefer.
    Route::post('/monetapay/va/callback',      MonetapayCallbackController::class);
    Route::post('/monetapay/ewallet/callback', MonetapayCallbackController::class);
    Route::post('/monetapay/qris/callback',    MonetapayCallbackController::class);
    // Subscription lifecycle callbacks (EVT_ACTIVE/EVT_INACTIVE/EVT_CYCLE_PREV_TRIGGER/EVT_CYCLE_TRIGGERED)
    Route::post('/monetapay/subscription/callback/active',         [\App\Http\Controllers\Api\Payment\Monetapay\MonetapaySubscriptionCallbackController::class, 'active']);
    Route::post('/monetapay/subscription/callback/deduct/before',  [\App\Http\Controllers\Api\Payment\Monetapay\MonetapaySubscriptionCallbackController::class, 'beforeDeduct']);
    Route::post('/monetapay/subscription/callback/deduct/after',   [\App\Http\Controllers\Api\Payment\Monetapay\MonetapaySubscriptionCallbackController::class, 'afterDeduct']);
    Route::post('/digiflazz/callback', [WebhookDigiflazzController::class, 'handle']);
    Route::post('/checkout', [\App\Http\Controllers\Api\CheckoutController::class, 'store']);

    // Postpaid — public (guests can inquire/pay bills)
    Route::post('/digiflazz/check-bill', [DigiflazzPostpaidController::class, 'checkBill']);
    Route::post('/digiflazz/pay-bill',   [DigiflazzPostpaidController::class, 'payBill']);

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

    // Digiflazz Admin Tools
    Route::get('/digiflazz/balance',      [DigiflazzBalanceController::class, 'index']);
    Route::post('/digiflazz/check-status', [DigiflazzTransactionStatusController::class, 'check']);
    Route::post('/digiflazz/sync-products', [DigiflazzSyncController::class, 'sync']);

    // Monetapay Admin / Test Tools — inquiries (read-only) + cancel/refund.
    // Outbound signed calls to Monetapay; mirror the spec's query endpoints.
    Route::prefix('monetapay')->group(function () {
        Route::post('/balance',              [MonetapayController::class, 'balance']);              // 5.1
        Route::post('/virtual-account/query', [MonetapayController::class, 'virtualAccount']);      // 6.1.2
        Route::post('/ewallet/query',         [MonetapayController::class, 'ewallet']);             // 6.2.2
        Route::post('/qris/query',            [MonetapayController::class, 'qris']);                // 6.3.3
        Route::post('/payment-link/create',   [MonetapayController::class, 'paymentLinkCreate']);    // 6.4.1
        Route::post('/payment-link/query',    [MonetapayController::class, 'paymentLink']);         // 6.4.2
        Route::post('/customer/create',       [MonetapayController::class, 'customerCreate']);      // 6.5.1
        Route::post('/customer/update',       [MonetapayController::class, 'customerUpdate']);      // 6.5.2
        Route::post('/customer/query',        [MonetapayController::class, 'customerQuery']);       // 6.5.3
        Route::post('/subscription/apply',    [MonetapayController::class, 'subscriptionApply']);   // 6.5.4
        Route::post('/subscription/create',   [MonetapayController::class, 'subscriptionCreate']); // (legacy create)
        Route::post('/subscription/deactivate', [MonetapayController::class, 'subscriptionDeactivate']); // 6.5.6
        Route::post('/subscription/query',    [MonetapayController::class, 'subscription']);        // 6.5.5
        Route::post('/subscription/cycle',    [MonetapayController::class, 'subscriptionCycle']);   // 6.5.7
        Route::post('/subscription/cycle/attempt', [MonetapayController::class, 'subscriptionCycleAttempt']); // 6.5.8
        Route::post('/refund/query',          [MonetapayController::class, 'refundQuery']);         // 6.6.4
        Route::post('/repay/query',           [MonetapayController::class, 'repay']);               // 6.6.5
        Route::post('/sub-merchant/query',    [MonetapayController::class, 'subMerchant']);         // 6.7.4
        Route::post('/cross-border/query',    [MonetapayController::class, 'crossBorder']);         // 6.8.2
        Route::post('/cdm/query',             [MonetapayController::class, 'cdm']);                 // 6.9.2
        Route::post('/payin/query',           [MonetapayController::class, 'payin']);               // 6.11.2
        Route::post('/disbursement/create',    [MonetapayController::class, 'disbursementCreate']); // 7.1.1
        Route::post('/large-payout/create',   [MonetapayController::class, 'largePayoutCreate']);  // 7.2.1
        Route::post('/ewallet-payout/create', [MonetapayController::class, 'ewalletPayoutCreate']); // 7.3.1
        Route::post('/disbursement/query',    [MonetapayController::class, 'disbursement']);        // 7.4.1
        Route::post('/inquiry-account',       [MonetapayController::class, 'accountValidation']);   // 8.1/8.2
        Route::post('/bills/daily',           [MonetapayController::class, 'dailyBill']);           // 9.1
        Route::post('/bills/flow',            [MonetapayController::class, 'billFlow']);            // 9.2
        Route::post('/transfer/query',        [MonetapayController::class, 'transferQuery']);       // 15.2
        Route::post('/permission/query',      [MonetapayController::class, 'merchantPermission']);  // 16.1

        // State-changing
        Route::post('/cancel', [MonetapayController::class, 'cancel']);  // 6.6.1
        Route::post('/refund', [MonetapayController::class, 'refund']);  // 6.6.2
    });

    // Transaction Management (Admin CRUD)
    Route::apiResource('transactions', TransactionController::class);

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
