<?php

use App\Http\Controllers\Api\ActivityLogController;
use App\Http\Controllers\Api\AnnouncementController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BannerController;
use App\Http\Controllers\Api\Category\CategoryController;
use App\Http\Controllers\Api\Category\CategoryTypeController;
use App\Http\Controllers\Api\Category\ServerCategoryController;
use App\Http\Controllers\Api\Category\ServerCategoryOptionController;
use App\Http\Controllers\Api\Category\SubCategoryController;
use App\Http\Controllers\Api\CheckoutController;
use App\Http\Controllers\Api\Content\ArticleCategoryController;
use App\Http\Controllers\Api\Content\ArticleController;
use App\Http\Controllers\Api\Content\FaqController;
use App\Http\Controllers\Api\Content\PageController;
use App\Http\Controllers\Api\Content\SettingController;
use App\Http\Controllers\Api\Content\TestimonialController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\Digiflazz\DigiflazzBalanceController;
use App\Http\Controllers\Api\Digiflazz\DigiflazzPostpaidController;
use App\Http\Controllers\Api\Digiflazz\DigiflazzPriceListController;
use App\Http\Controllers\Api\Digiflazz\DigiflazzProductController;
use App\Http\Controllers\Api\Digiflazz\DigiflazzProductImportController;
use App\Http\Controllers\Api\Digiflazz\DigiflazzSkuLookupController;
use App\Http\Controllers\Api\Digiflazz\DigiflazzSyncController;
use App\Http\Controllers\Api\Digiflazz\DigiflazzTransactionStatusController;
use App\Http\Controllers\Api\Digiflazz\PriceAlertController;
use App\Http\Controllers\Api\Digiflazz\WebhookDigiflazzController;
use App\Http\Controllers\Api\FinancialController;
use App\Http\Controllers\Api\IntegrationController;
use App\Http\Controllers\Api\LeaderboardController;
use App\Http\Controllers\Api\Marketing\FlashSaleController;
use App\Http\Controllers\Api\Marketing\PromoController;
use App\Http\Controllers\Api\Member\ApiCredentialController;
use App\Http\Controllers\Api\Member\BalanceTopupController;
use App\Http\Controllers\Api\Member\MemberActivityLogController;
use App\Http\Controllers\Api\Member\MembershipController;
use App\Http\Controllers\Api\Member\MemberTransactionController;
use App\Http\Controllers\Api\Member\ProfileController;
use App\Http\Controllers\Api\Membership\MembershipPlanController;
use App\Http\Controllers\Api\Payment\Monetapay\MonetapayCallbackController;
use App\Http\Controllers\Api\Payment\Monetapay\MonetapayController;
use App\Http\Controllers\Api\Payment\Monetapay\MonetapaySubscriptionCallbackController;
use App\Http\Controllers\Api\Payment\PaymentChannelController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PointHistoryController;
use App\Http\Controllers\Api\Pricing\PricingRuleController;
use App\Http\Controllers\Api\Product\ProductController;
use App\Http\Controllers\Api\Product\SupplierProductController;
use App\Http\Controllers\Api\RatingController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\Storefront\ArticleController as StorefrontArticleController;
use App\Http\Controllers\Api\Storefront\ContentController;
use App\Http\Controllers\Api\Storefront\ContentPageController;
use App\Http\Controllers\Api\Storefront\GameController as StorefrontGameController;
use App\Http\Controllers\Api\Storefront\GameReviewController;
use App\Http\Controllers\Api\Storefront\GuestRatingController;
use App\Http\Controllers\Api\Storefront\InvoiceController;
use App\Http\Controllers\Api\Storefront\InvoiceDownloadController;
use App\Http\Controllers\Api\Storefront\LeaderboardController as StorefrontLeaderboardController;
use App\Http\Controllers\Api\Storefront\MarketingController;
use App\Http\Controllers\Api\Storefront\OrderTrackController;
use App\Http\Controllers\Api\Storefront\PaymentChannelController as StorefrontPaymentChannelController;
use App\Http\Controllers\Api\Storefront\PriceListController;
use App\Http\Controllers\Api\Storefront\ValidateGameIdController;
use App\Http\Controllers\Api\Supplier\SupplierCategoryController;
use App\Http\Controllers\Api\Supplier\SupplierController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\User\SyncTimezoneController;
use App\Http\Controllers\Api\User\UserController;
use App\Http\Resources\User\UserResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

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

    // Payment Webhooks (No Auth Required) — throttled per IP; the real gate is
    // signature verification inside each controller.
    Route::middleware('throttle:webhooks')->group(function () {
        Route::post('/payment/callback', MonetapayCallbackController::class);
        // Method-specific Monetapay callbacks — same decrypt+verify+dispatch flow.
        // Point Monetapay's VA/E-Wallet/QRIS callback URLs at whichever you prefer.
        Route::post('/monetapay/va/callback', MonetapayCallbackController::class);
        Route::post('/monetapay/ewallet/callback', MonetapayCallbackController::class);
        Route::post('/monetapay/qris/callback', MonetapayCallbackController::class);
        // Subscription lifecycle callbacks (EVT_ACTIVE/EVT_INACTIVE/EVT_CYCLE_PREV_TRIGGER/EVT_CYCLE_TRIGGERED)
        Route::post('/monetapay/subscription/callback/active', [MonetapaySubscriptionCallbackController::class, 'active']);
        Route::post('/monetapay/subscription/callback/deduct/before', [MonetapaySubscriptionCallbackController::class, 'beforeDeduct']);
        Route::post('/monetapay/subscription/callback/deduct/after', [MonetapaySubscriptionCallbackController::class, 'afterDeduct']);
        Route::post('/digiflazz/callback', [WebhookDigiflazzController::class, 'handle']);
    });

    // ── Public storefront ────────────────────────────────────────────────
    // Read-only catalog consumed by the customer-facing SPA. Anonymous, but
    // each handler reads the bearer token when one is present so a signed-in
    // member is quoted their own tier price.
    Route::get('/games', [StorefrontGameController::class, 'index']);
    Route::get('/games/{game}', [StorefrontGameController::class, 'show']);
    Route::get('/games/{game}/products', [StorefrontGameController::class, 'products']);
    Route::get('/games/{game}/reviews', [GameReviewController::class, 'index']);
    Route::post('/games/{game}/validate-id', ValidateGameIdController::class);

    Route::get('/price-list', [PriceListController::class, 'index']);

    // These three resources already exist as admin endpoints at /v1/banners,
    // /v1/announcements and /v1/leaderboard. Laravel's route collection is keyed
    // on method+uri, so registering a public route on the same path would
    // silently replace the admin one (or be replaced by it, depending on order)
    // and break the admin dashboard. The public reads therefore live under their
    // own prefix — different audience, different projection, different route.
    Route::prefix('storefront')->group(function () {
        Route::get('/banners', [ContentController::class, 'banners']);
        Route::get('/announcements', [ContentController::class, 'announcements']);
        Route::get('/leaderboard', [StorefrontLeaderboardController::class, 'index']);

        // CMS reads. Prefixed for the same reason as the three above: the
        // admin group already owns /v1/articles, /v1/faqs and /v1/pages, and
        // Laravel keys the route collection on method+uri — a same-path public
        // route would silently replace the admin one.
        Route::get('/articles', [StorefrontArticleController::class, 'index']);
        Route::get('/article-categories', [StorefrontArticleController::class, 'categories']);
        Route::get('/articles/{slug}', [StorefrontArticleController::class, 'show']);
        Route::get('/faqs', [ContentPageController::class, 'faqs']);
        Route::get('/testimonials', [ContentPageController::class, 'testimonials']);
        Route::get('/settings', [ContentPageController::class, 'settings']);
        Route::get('/pages/{slug}', [ContentPageController::class, 'page']);

        // Relocated from /v1/payment-channels so the admin group can own that
        // URI: Laravel keys routes on method+uri, and the admin group is
        // registered last, so it would have silently swallowed the public read.
        Route::get('/payment-channels', [StorefrontPaymentChannelController::class, 'index']);

        Route::get('/flash-sale', [MarketingController::class, 'flashSale']);
        Route::get('/promos', [MarketingController::class, 'promos']);
        Route::get('/membership-plans', [MembershipController::class, 'plans']);
    });

    // Takes a guessable code, so it is throttled like checkout rather than
    // left on the global limiter — otherwise codes are brute-forceable.
    Route::middleware('throttle:checkout')->group(function () {
        Route::post('/storefront/promos/validate', [MarketingController::class, 'validatePromo']);
    });

    // Receipt lookup. Invoice numbers carry six random characters, so they are
    // not enumerable; the projection is narrow regardless — see InvoiceController.
    // Static `/download` before the `{invoiceNumber}` read so it isn't shadowed.
    Route::get('/invoices/{invoiceNumber}/download', InvoiceDownloadController::class);
    Route::get('/invoices/{invoiceNumber}', InvoiceController::class);

    Route::middleware('throttle:checkout')->group(function () {
        Route::post('/checkout', [CheckoutController::class, 'store']);

        // Takes a phone number as input, so it is throttled like checkout
        // rather than left on the global limiter.
        Route::get('/orders/track', OrderTrackController::class);

        // Postpaid — public (guests can inquire/pay bills)
        Route::post('/digiflazz/check-bill', [DigiflazzPostpaidController::class, 'checkBill']);
        Route::post('/digiflazz/pay-bill', [DigiflazzPostpaidController::class, 'payBill']);

        // Guest feedback: reviews a guest's own completed order by invoice number
        // (the member equivalent is POST /v1/me/transactions/{invoiceNumber}/rating).
        // Throttled like checkout since the invoice number is the only credential.
        Route::post('/transactions/{invoiceNumber}/rating', [GuestRatingController::class, 'store']);
    });

    // Authentication Routes
    Route::prefix('auth')->group(function () {
        Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');
        Route::post('/refresh', [AuthController::class, 'refreshToken']);

        // Self-service signup and password recovery. Both are throttled per IP
        // like login: they take an email address and would otherwise be a free
        // account-enumeration and mail-flood surface.
        Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:login');
        Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:login');
        Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:login');

        Route::middleware('auth:sanctum')->group(function () {
            Route::post('/logout', [AuthController::class, 'logout']);
        });
    });
});

// Protected Routes (Requires Auth)
Route::prefix('v1')->middleware('auth:sanctum')->group(function () {

    // User Info (Current Auth User) — any authenticated user, not admin-only
    Route::get('/user', function (Request $request) {
        return response()->json([
            'status' => 'success',
            'code' => 200,
            'message' => 'Success',
            // Role eager-loaded so UserResource emits it — the storefront routes
            // its member/admin guards off that value.
            'data' => new UserResource($request->user()->load('role')),
        ]);
    });

    Route::patch('/users/sync-timezone', SyncTimezoneController::class);

    // ── Member self-service ──────────────────────────────────────────────
    // Everything the signed-in customer can see or change about themselves.
    // Scoped to the caller inside each action — never admin-wide.
    Route::prefix('me')->group(function () {
        Route::get('/', [ProfileController::class, 'show']);
        Route::put('/', [ProfileController::class, 'update']);
        Route::put('/password', [ProfileController::class, 'updatePassword']);

        Route::get('/dashboard', [MemberTransactionController::class, 'dashboard']);
        Route::get('/transactions', [MemberTransactionController::class, 'index']);
        // Keyed on invoice_number — the only order identifier the storefront
        // ever holds — and resolved inside the caller's own transactions.
        Route::post('/transactions/{invoiceNumber}/rating', [MemberTransactionController::class, 'rate']);

        Route::get('/activity-logs', [MemberActivityLogController::class, 'index']);

        // ── Wallet ───────────────────────────────────────────────────────
        // Creating a top-up opens a real payment, so it is throttled like
        // checkout rather than left on the global limiter.
        Route::get('/topups', [BalanceTopupController::class, 'index']);
        Route::post('/topups', [BalanceTopupController::class, 'store'])->middleware('throttle:checkout');
        Route::get('/topups/{reference}', [BalanceTopupController::class, 'show']);
        Route::get('/balance-mutations', [BalanceTopupController::class, 'mutations']);

        // ── Membership ───────────────────────────────────────────────────
        Route::get('/membership', [MembershipController::class, 'current']);
        Route::post('/membership/subscribe', [MembershipController::class, 'subscribe'])
            ->middleware('throttle:checkout');

        // ── Integration credentials ──────────────────────────────────────
        Route::get('/api-credentials', [ApiCredentialController::class, 'index']);
        Route::post('/api-credentials', [ApiCredentialController::class, 'store']);
        Route::put('/api-credentials/{apiCredential}', [ApiCredentialController::class, 'update']);
        Route::post('/api-credentials/{apiCredential}/regenerate', [ApiCredentialController::class, 'regenerate']);
        Route::delete('/api-credentials/{apiCredential}', [ApiCredentialController::class, 'destroy']);
    });
});

// Admin-only management API (requires auth:sanctum + role_id 1 — see EnsureUserIsAdmin)
Route::prefix('v1')->middleware(['auth:sanctum', 'admin'])->group(function () {

    // CRUD Users
    Route::prefix('users')->group(function () {
        Route::get('/', [UserController::class, 'index']);
        Route::post('/', [UserController::class, 'store']);
        Route::get('/{user}', [UserController::class, 'show']);
        Route::put('/{user}', [UserController::class, 'update']);
        Route::delete('/{user}', [UserController::class, 'destroy']);
        // Admin moderation + audited wallet adjustment (money-moving, so a
        // reason is required and the write goes through WalletLedger).
        Route::post('/{user}/status', [UserController::class, 'setStatus']);
        Route::post('/{user}/balance-adjustments', [UserController::class, 'adjustBalance']);
    });

    // Dashboard (admin overview aggregates)
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('/dashboard/performance', [DashboardController::class, 'performance']);

    // Financial Summary
    Route::get('/financial/summary', [FinancialController::class, 'summary']);
    Route::get('/financial/payment-gateways', [FinancialController::class, 'paymentGateways']);
    Route::get('/financial/suppliers', [FinancialController::class, 'suppliers']);

    // Reporting hub (consolidated revenue/transactions/profit + breakdown)
    Route::get('/reports/summary', [ReportController::class, 'summary']);

    // Integration channel connectivity overview
    Route::get('/integration/channels', [IntegrationController::class, 'channels']);

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

    // Pricing Rules (markup config used by the daily Digiflazz price sync)
    Route::apiResource('pricing-rules', PricingRuleController::class);

    // Membership plans (loyalty tiers) — admin CRUD; storefront reads its own
    // GET /v1/storefront/membership-plans.
    Route::apiResource('membership-plans', MembershipPlanController::class);

    // ── Content & marketing ──────────────────────────────────────────────
    // article-categories is registered before articles so neither shadows the
    // other, and both keep their own {id} binding.
    Route::apiResource('article-categories', ArticleCategoryController::class);
    Route::apiResource('articles', ArticleController::class);
    Route::apiResource('faqs', FaqController::class);
    Route::apiResource('pages', PageController::class);
    Route::apiResource('testimonials', TestimonialController::class);
    Route::apiResource('payment-channels', PaymentChannelController::class);
    Route::apiResource('flash-sales', FlashSaleController::class);
    Route::get('/promos/{promo}/redemptions', [PromoController::class, 'redemptions']);
    Route::apiResource('promos', PromoController::class);

    // Settings are one grouped form, not a table: a flat read plus a bulk write.
    Route::get('/settings', [SettingController::class, 'index']);
    Route::put('/settings', [SettingController::class, 'update']);
    Route::post('/settings/upload', [SettingController::class, 'upload']);

    // Digiflazz Admin Tools
    Route::get('/digiflazz/balance', [DigiflazzBalanceController::class, 'index']);
    Route::post('/digiflazz/check-status', [DigiflazzTransactionStatusController::class, 'check']);
    Route::post('/digiflazz/sync-products', [DigiflazzSyncController::class, 'sync']);

    // Digiflazz Manual Product Management (products are never auto-created)
    // Browse the whole Digiflazz price list (Product Provider tab) — reads the
    // shared 5-min cache, so paging/searching never hits Digiflazz upstream.
    Route::get('/digiflazz/price-list', [DigiflazzPriceListController::class, 'index']);
    Route::get('/digiflazz/sku-preview', [DigiflazzSkuLookupController::class, 'show']);
    Route::post('/digiflazz/products', [DigiflazzProductController::class, 'store']);
    Route::post('/digiflazz/products/bulk', [DigiflazzProductController::class, 'bulkStore']);
    Route::get('/digiflazz/products/import-template', [DigiflazzProductImportController::class, 'template']);
    Route::post('/digiflazz/products/import', [DigiflazzProductImportController::class, 'import']);

    // Digiflazz Price Change Alerts (raised by the 5-minute checker)
    Route::get('/digiflazz/price-alerts', [PriceAlertController::class, 'index']);
    Route::post('/digiflazz/price-alerts/acknowledge-all', [PriceAlertController::class, 'acknowledgeAll']);
    Route::post('/digiflazz/price-alerts/{priceChangeAlert}/acknowledge', [PriceAlertController::class, 'acknowledge']);

    // Monetapay Admin / Test Tools — inquiries (read-only) + cancel/refund.
    // Outbound signed calls to Monetapay; mirror the spec's query endpoints.
    Route::prefix('monetapay')->group(function () {
        Route::post('/balance', [MonetapayController::class, 'balance']);              // 5.1
        Route::post('/virtual-account/query', [MonetapayController::class, 'virtualAccount']);      // 6.1.2
        Route::post('/ewallet/query', [MonetapayController::class, 'ewallet']);             // 6.2.2
        Route::post('/qris/query', [MonetapayController::class, 'qris']);                // 6.3.3
        Route::post('/payment-link/create', [MonetapayController::class, 'paymentLinkCreate']);    // 6.4.1
        Route::post('/payment-link/query', [MonetapayController::class, 'paymentLink']);         // 6.4.2
        Route::post('/customer/create', [MonetapayController::class, 'customerCreate']);      // 6.5.1
        Route::post('/customer/update', [MonetapayController::class, 'customerUpdate']);      // 6.5.2
        Route::post('/customer/query', [MonetapayController::class, 'customerQuery']);       // 6.5.3
        Route::post('/subscription/apply', [MonetapayController::class, 'subscriptionApply']);   // 6.5.4
        Route::post('/subscription/create', [MonetapayController::class, 'subscriptionCreate']); // (legacy create)
        Route::post('/subscription/deactivate', [MonetapayController::class, 'subscriptionDeactivate']); // 6.5.6
        Route::post('/subscription/query', [MonetapayController::class, 'subscription']);        // 6.5.5
        Route::post('/subscription/cycle', [MonetapayController::class, 'subscriptionCycle']);   // 6.5.7
        Route::post('/subscription/cycle/attempt', [MonetapayController::class, 'subscriptionCycleAttempt']); // 6.5.8
        Route::post('/refund/query', [MonetapayController::class, 'refundQuery']);         // 6.6.4
        Route::post('/repay/query', [MonetapayController::class, 'repay']);               // 6.6.5
        Route::post('/sub-merchant/query', [MonetapayController::class, 'subMerchant']);         // 6.7.4
        Route::post('/cross-border/query', [MonetapayController::class, 'crossBorder']);         // 6.8.2
        Route::post('/cdm/query', [MonetapayController::class, 'cdm']);                 // 6.9.2
        Route::post('/payin/query', [MonetapayController::class, 'payin']);               // 6.11.2
        Route::post('/disbursement/create', [MonetapayController::class, 'disbursementCreate']); // 7.1.1
        Route::post('/large-payout/create', [MonetapayController::class, 'largePayoutCreate']);  // 7.2.1
        Route::post('/ewallet-payout/create', [MonetapayController::class, 'ewalletPayoutCreate']); // 7.3.1
        Route::post('/disbursement/query', [MonetapayController::class, 'disbursement']);        // 7.4.1
        Route::post('/inquiry-account', [MonetapayController::class, 'accountValidation']);   // 8.1/8.2
        Route::post('/bills/daily', [MonetapayController::class, 'dailyBill']);           // 9.1
        Route::post('/bills/flow', [MonetapayController::class, 'billFlow']);            // 9.2
        Route::post('/transfer/query', [MonetapayController::class, 'transferQuery']);       // 15.2
        Route::post('/permission/query', [MonetapayController::class, 'merchantPermission']);  // 16.1

        // State-changing
        Route::post('/cancel', [MonetapayController::class, 'cancel']);  // 6.6.1
        Route::post('/refund', [MonetapayController::class, 'refund']);  // 6.6.2
    });

    // Transaction Management (Admin CRUD)
    // status-counts must be registered before the apiResource's {transaction}
    // wildcard, or Laravel tries to route-model-bind "status-counts" as an id.
    Route::get('/transactions/status-counts', [TransactionController::class, 'statusCounts']);
    // Static paths before the apiResource wildcard, or "export"/"recap" would
    // route-model-bind as a {transaction} id.
    Route::get('/transactions/export', [TransactionController::class, 'export']);
    Route::get('/transactions/recap', [TransactionController::class, 'recap']);
    Route::apiResource('transactions', TransactionController::class);
    Route::post('/transactions/{transaction}/manual-review', [TransactionController::class, 'manualReview']);
    Route::post('/transactions/{transaction}/refund', [TransactionController::class, 'refund']);
    Route::post('/transactions/{transaction}/resend-callback', [TransactionController::class, 'resendCallback']);
    Route::post('/transactions/{transaction}/resend-receipt', [TransactionController::class, 'resendReceipt']);
    Route::post('/transactions/{transaction}/retry', [TransactionController::class, 'retry']);

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
