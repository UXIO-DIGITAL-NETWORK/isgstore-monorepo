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
use App\Http\Controllers\Api\Finance\ChannelFeeController;
use App\Http\Controllers\Api\Finance\FinanceDashboardController;
use App\Http\Controllers\Api\Finance\FinanceMerchantController;
use App\Http\Controllers\Api\Finance\FinanceTransactionController;
use App\Http\Controllers\Api\Finance\FinanceWithdrawalController;
use App\Http\Controllers\Api\Finance\NotificationController;
use App\Http\Controllers\Api\Finance\ServiceController;
use App\Http\Controllers\Api\Finance\ServiceIncidentController;
use App\Http\Controllers\Api\Finance\ServiceInstallationController;
use App\Http\Controllers\Api\Finance\ServiceInstallationDetailController;
use App\Http\Controllers\Api\Finance\ServiceInstallationStepController;
use App\Http\Controllers\Api\Finance\ServiceInvoiceController;
use App\Http\Controllers\Api\Finance\ServiceSubscriptionController;
use App\Http\Controllers\Api\FinancialController;
use App\Http\Controllers\Api\Hub\HubActionController;
use App\Http\Controllers\Api\Hub\HubReportController;
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
use App\Http\Controllers\Api\Merchant\MerchantDashboardController;
use App\Http\Controllers\Api\Merchant\MerchantMutationController;
use App\Http\Controllers\Api\Merchant\MerchantServiceController;
use App\Http\Controllers\Api\Merchant\MerchantServiceInstallationController;
use App\Http\Controllers\Api\Merchant\MerchantServiceInvoiceController;
use App\Http\Controllers\Api\Merchant\MerchantTransactionController;
use App\Http\Controllers\Api\Merchant\ServiceStatusController;
use App\Http\Controllers\Api\Merchant\WithdrawalController as MerchantWithdrawalController;
use App\Http\Controllers\Api\Payment\Monetapay\DisbursementCallbackController;
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
use App\Http\Controllers\Api\Uxiotopup\PriceChangeLogController;
use App\Http\Controllers\Api\Uxiotopup\UxiotopupBalanceController;
use App\Http\Controllers\Api\Uxiotopup\UxiotopupCategoryController;
use App\Http\Controllers\Api\Uxiotopup\UxiotopupPoolController;
use App\Http\Controllers\Api\Uxiotopup\UxiotopupPriceListController;
use App\Http\Controllers\Api\Uxiotopup\UxiotopupProductController;
use App\Http\Controllers\Api\Uxiotopup\UxiotopupProductImportController;
use App\Http\Controllers\Api\Uxiotopup\UxiotopupSkuLookupController;
use App\Http\Controllers\Api\Uxiotopup\UxiotopupSyncController;
use App\Http\Controllers\Api\Uxiotopup\UxiotopupTransactionStatusController;
use App\Http\Controllers\Api\Uxiotopup\WebhookUxiotopupController;
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
        Route::post('/uxiotopup/callback', [WebhookUxiotopupController::class, 'handle']);
        // Payout (disbursement) result callback (7.4.2) — drives a withdrawal to
        // SETTLED/FAILED. Point Monetapay's disbursement callback URL here.
        Route::post('/disbursement/merchant/callback', DisbursementCallbackController::class);
    });

    // ── Public storefront ────────────────────────────────────────────────
    // Read-only catalog consumed by the customer-facing SPA. Anonymous, but
    // each handler reads the bearer token when one is present so a signed-in
    // member is quoted their own tier price.
    Route::get('/games', [StorefrontGameController::class, 'index']);
    Route::get('/games/{game}', [StorefrontGameController::class, 'show']);
    Route::get('/games/{game}/products', [StorefrontGameController::class, 'products']);
    Route::get('/games/{game}/reviews', [GameReviewController::class, 'index']);
    // Throttled: keeps third-party nickname lookups from being hammered
    // from the client.
    Route::post('/games/{game}/validate-id', ValidateGameIdController::class)->middleware('throttle:checkout');

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

        // Guest feedback: reviews a guest's own completed order by invoice number
        // (the member equivalent is POST /v1/me/transactions/{invoiceNumber}/rating).
        // Throttled like checkout since the invoice number is the only credential.
        Route::post('/transactions/{invoiceNumber}/rating', [GuestRatingController::class, 'store']);
    });

    // Authentication Routes
    Route::prefix('auth')->group(function () {
        Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');
        Route::post('/google', [AuthController::class, 'google'])->middleware('throttle:login');
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

    // Integration channel connectivity overview + per-channel manage
    Route::get('/integration/channels', [IntegrationController::class, 'channels']);
    Route::get('/integration/channels/{provider}', [IntegrationController::class, 'show']);
    Route::put('/integration/channels/{provider}', [IntegrationController::class, 'update']);
    Route::post('/integration/channels/{provider}/ping', [IntegrationController::class, 'ping']);

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
        Route::post('/{category}/status', [CategoryController::class, 'setStatus']);
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
        // Bulk routes precede the {product} binding so "bulk" is never a model key.
        Route::post('/bulk-create', [ProductController::class, 'bulkCreate']);
        Route::post('/bulk/lock-price', [ProductController::class, 'bulkLockPrice']);
        Route::post('/bulk/show-price', [ProductController::class, 'bulkShowPrice']);
        Route::post('/bulk/publish', [ProductController::class, 'bulkPublish']);
        Route::post('/bulk/uxiotopup-update', [ProductController::class, 'bulkUxiotopupUpdate']);
        Route::post('/bulk/delete', [ProductController::class, 'bulkDelete']);
        Route::get('/{product}', [ProductController::class, 'show']);
        Route::put('/{product}', [ProductController::class, 'update']);
        Route::delete('/{product}', [ProductController::class, 'destroy']);
        Route::post('/{product}/price-limit', [ProductController::class, 'setPriceLimit']);
        // withTrashed: the target is archived by definition, so the default
        // binding — which applies the soft-delete scope — would 404 every time.
        Route::post('/{product}/restore', [ProductController::class, 'restore'])->withTrashed();
    });

    Route::prefix('supplier-products')->group(function () {
        Route::get('/', [SupplierProductController::class, 'index']);
        Route::post('/', [SupplierProductController::class, 'store']);
        // Bulk routes precede the {supplierProduct} binding so "bulk" is never
        // resolved as a model key.
        Route::post('/bulk/lock-price', [SupplierProductController::class, 'bulkLockPrice']);
        Route::post('/bulk/profit-margin', [SupplierProductController::class, 'bulkSetMargin']);
        Route::post('/bulk/delete', [SupplierProductController::class, 'bulkDelete']);
        // Pool pipeline: a priced pool row becomes a DRAFT product, and publishing
        // it is a separate, deliberate act.
        Route::post('/bulk/promote', [SupplierProductController::class, 'bulkPromote']);
        Route::post('/bulk/publish', [SupplierProductController::class, 'bulkPublish']);
        // Onboarding shortcut: promote and publish without a round trip through
        // the Main Products list.
        Route::post('/bulk/promote-publish', [SupplierProductController::class, 'bulkPromoteAndPublish']);
        Route::get('/{supplierProduct}', [SupplierProductController::class, 'show']);
        Route::put('/{supplierProduct}', [SupplierProductController::class, 'update']);
        Route::delete('/{supplierProduct}', [SupplierProductController::class, 'destroy']);
        Route::post('/{supplierProduct}/lock-price', [SupplierProductController::class, 'lockPrice']);
        Route::post('/{supplierProduct}/profit-margin', [SupplierProductController::class, 'setMargin']);
        Route::post('/{supplierProduct}/promote', [SupplierProductController::class, 'promote']);
        Route::post('/{supplierProduct}/publish', [SupplierProductController::class, 'publish']);
    });

    // Pricing Rules (markup config used by the uxiotopup price sync)
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

    // Uxiotopup Admin Tools
    Route::get('/uxiotopup/balance', [UxiotopupBalanceController::class, 'index']);
    Route::post('/uxiotopup/check-status', [UxiotopupTransactionStatusController::class, 'check']);
    Route::post('/uxiotopup/sync-products', [UxiotopupSyncController::class, 'sync']);

    // Uxiotopup Manual Product Management (products are never auto-created)
    // Browse the whole uxiotopup price list (Product Provider tab) — reads the
    // shared 5-min cache, so paging/searching never hits uxiotopup upstream.
    Route::get('/uxiotopup/price-list', [UxiotopupPriceListController::class, 'index']);
    // The provider's own `kategori` values, for the Category Provider dropdown.
    // Free text upstream, so offering the live list is what stops an admin
    // mapping a category that matches nothing.
    Route::get('/uxiotopup/categories', [UxiotopupCategoryController::class, 'index']);
    // The Add-panel feed: SKUs whose kategori has a configured Category Provider.
    Route::get('/uxiotopup/pool-candidates', [UxiotopupPoolController::class, 'candidates']);
    Route::get('/uxiotopup/pool-summary', [UxiotopupPoolController::class, 'summary']);
    Route::post('/uxiotopup/pool', [UxiotopupPoolController::class, 'store']);
    Route::get('/uxiotopup/sku-preview', [UxiotopupSkuLookupController::class, 'show']);
    Route::post('/uxiotopup/products', [UxiotopupProductController::class, 'store']);
    Route::post('/uxiotopup/products/bulk', [UxiotopupProductController::class, 'bulkStore']);
    Route::get('/uxiotopup/products/import-template', [UxiotopupProductImportController::class, 'template']);
    Route::post('/uxiotopup/products/import', [UxiotopupProductImportController::class, 'import']);

    // Uxiotopup Price Change Log — read-only audit trail of what the 5-minute
    // checker auto-repriced, skipped (locked) or flagged (deactivated / negative margin).
    Route::get('/uxiotopup/price-change-logs', [PriceChangeLogController::class, 'index']);

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

// ── Payment page: payment-admin ("client") ───────────────────────────────────
// The merchant's own view. Every handler additionally scopes to the caller's
// id, so the `payment-admin` gate is defence-in-depth, not the only guard.
Route::prefix('v1/payment-admin')->middleware(['auth:sanctum', 'payment-admin'])->group(function () {
    Route::get('/dashboard', [MerchantDashboardController::class, 'index']);
    // Specific routes before the collection so /summary and /export are not
    // swallowed by a wildcard.
    Route::get('/transactions/summary', [MerchantTransactionController::class, 'summary']);
    Route::get('/transactions/export', [MerchantTransactionController::class, 'export']);
    Route::get('/transactions', [MerchantTransactionController::class, 'index']);
    Route::get('/mutations', [MerchantMutationController::class, 'index']);
    Route::get('/withdrawals', [MerchantWithdrawalController::class, 'index']);
    Route::post('/withdrawals', [MerchantWithdrawalController::class, 'store'])->middleware('throttle:checkout');
    Route::get('/withdrawals/{number}', [MerchantWithdrawalController::class, 'show']);

    // Services the client buys from kita: catalogue, own subscriptions, and
    // the invoice flow — paid through Monetapay, same gateway as checkout.
    Route::get('/services', [MerchantServiceController::class, 'catalog']);
    Route::get('/services/{service}', [MerchantServiceController::class, 'show']);
    Route::get('/service-subscriptions', [MerchantServiceController::class, 'subscriptions']);
    // The methods a client may settle a bill with. Separate from the admin
    // CRUD at /v1/payment-channels, which is payment-internal only.
    Route::get('/payment-channels', [MerchantServiceInvoiceController::class, 'paymentChannels']);
    Route::get('/service-invoices', [MerchantServiceInvoiceController::class, 'index']);
    Route::post('/service-invoices', [MerchantServiceInvoiceController::class, 'store'])->middleware('throttle:checkout');
    Route::get('/service-invoices/{serviceInvoice}', [MerchantServiceInvoiceController::class, 'show']);
    // Re-open payment: a VA expires in 600s while the bill is due in days, so
    // an unpaid invoice must always be payable again.
    Route::post('/service-invoices/{serviceInvoice}/pay', [MerchantServiceInvoiceController::class, 'pay'])
        ->middleware('throttle:checkout');

    // Read-only view of kita's installation work and the credentials handed
    // over. `reveal` is POST so plaintext is neither proxy-cacheable nor
    // recorded in an access-log query string.
    Route::get('/service-subscriptions/{serviceSubscription}/installation',
        [MerchantServiceInstallationController::class, 'show']);
    Route::post('/installation-details/{serviceInstallationDetail}/reveal',
        [MerchantServiceInstallationController::class, 'reveal'])->middleware('throttle:30,1');

    // Which payment methods are disrupted and which services are closed.
    Route::get('/service-status', [ServiceStatusController::class, 'index']);
});

// ── Payment page: payment-internal ("kita") ──────────────────────────────────
// The internal team's cross-merchant view: all data, withdrawal verification,
// per-channel fee settings, and the services it sells to its clients.
Route::prefix('v1/payment-internal')->middleware(['auth:sanctum', 'payment-internal'])->group(function () {
    Route::get('/dashboard', [FinanceDashboardController::class, 'index']);

    // In-app notifications — one fan-out row per internal user; every query is
    // scoped to the caller. The bell polls unread-count; the page reads index.
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markRead']);

    Route::get('/merchants', [FinanceMerchantController::class, 'index']);
    Route::get('/merchants/{user}', [FinanceMerchantController::class, 'show']);
    Route::get('/transactions/summary', [FinanceTransactionController::class, 'summary']);
    Route::get('/transactions/export', [FinanceTransactionController::class, 'export']);
    Route::get('/transactions', [FinanceTransactionController::class, 'index']);
    Route::get('/withdrawals', [FinanceWithdrawalController::class, 'index']);
    // Kita's own payout request ("penarikan internal") — same table/flow as a
    // merchant withdrawal, `type=internal` on the index above lists these.
    Route::post('/withdrawals', [FinanceWithdrawalController::class, 'store'])->middleware('throttle:checkout');
    Route::get('/platform-balance', [FinanceWithdrawalController::class, 'platformBalance']);
    Route::post('/withdrawals/{withdrawal}/approve', [FinanceWithdrawalController::class, 'approve']);
    Route::post('/withdrawals/{withdrawal}/reject', [FinanceWithdrawalController::class, 'reject']);

    // Settings — biaya per metode pembayaran. That fee IS the "Biaya Admin"
    // the customer is charged; there is no separate global markup.
    Route::get('/channels', [ChannelFeeController::class, 'index']);
    Route::put('/channels/{paymentChannel}', [ChannelFeeController::class, 'update']);

    // Services catalogue — what kita sells to its clients, and for how long.
    // Writes are refused when the catalog is Hub-managed (catalog-local):
    // a local edit would be silently overwritten by the next hub:sync-catalog.
    Route::get('/services', [ServiceController::class, 'index']);
    Route::post('/services', [ServiceController::class, 'store'])->middleware('catalog-local');
    Route::get('/services/{service}', [ServiceController::class, 'show']);
    Route::put('/services/{service}', [ServiceController::class, 'update'])->middleware('catalog-local');
    Route::delete('/services/{service}', [ServiceController::class, 'destroy'])->middleware('catalog-local');

    // Service bills — manual bukti-transfer verification.
    Route::get('/service-invoices', [ServiceInvoiceController::class, 'index']);
    Route::get('/service-invoices/{serviceInvoice}', [ServiceInvoiceController::class, 'show']);
    Route::post('/service-invoices/{serviceInvoice}/confirm', [ServiceInvoiceController::class, 'confirm']);
    Route::post('/service-invoices/{serviceInvoice}/reject', [ServiceInvoiceController::class, 'reject']);

    // Who subscribes to what.
    Route::get('/service-subscriptions', [ServiceSubscriptionController::class, 'index']);
    Route::get('/service-subscriptions/{serviceSubscription}', [ServiceSubscriptionController::class, 'show']);
    Route::post('/service-subscriptions/{serviceSubscription}/cancel', [ServiceSubscriptionController::class, 'cancel']);

    // Installation: the window, the milestone checklist, and the credentials.
    Route::get('/service-subscriptions/{serviceSubscription}/installation', [ServiceInstallationController::class, 'show']);
    Route::put('/service-subscriptions/{serviceSubscription}/installation', [ServiceInstallationController::class, 'upsert']);

    // The same installation, reached before confirmation so kita can prepare it
    // first. Keyed on the invoice because that is what the operator has in
    // hand; the row itself is still per (client, service).
    Route::get('/service-invoices/{serviceInvoice}/installation', [ServiceInstallationController::class, 'showForInvoice']);
    Route::put('/service-invoices/{serviceInvoice}/installation', [ServiceInstallationController::class, 'upsertForInvoice']);

    Route::post('/installations/{serviceInstallation}/steps', [ServiceInstallationStepController::class, 'store']);
    Route::put('/installation-steps/{serviceInstallationStep}', [ServiceInstallationStepController::class, 'update']);
    Route::post('/installation-steps/{serviceInstallationStep}/completion', [ServiceInstallationStepController::class, 'setCompletion']);
    Route::delete('/installation-steps/{serviceInstallationStep}', [ServiceInstallationStepController::class, 'destroy']);

    Route::post('/installations/{serviceInstallation}/detail-items', [ServiceInstallationDetailController::class, 'store']);
    Route::put('/installation-details/{serviceInstallationDetail}', [ServiceInstallationDetailController::class, 'update']);
    Route::delete('/installation-details/{serviceInstallationDetail}', [ServiceInstallationDetailController::class, 'destroy']);
    Route::post('/installation-details/{serviceInstallationDetail}/reveal',
        [ServiceInstallationController::class, 'reveal'])->middleware('throttle:60,1');

    // Incidents driving the clients' Status Layanan page.
    Route::get('/incidents', [ServiceIncidentController::class, 'index']);
    Route::post('/incidents', [ServiceIncidentController::class, 'store']);
    Route::get('/incidents/{serviceIncident}', [ServiceIncidentController::class, 'show']);
    Route::put('/incidents/{serviceIncident}', [ServiceIncidentController::class, 'update']);
    Route::delete('/incidents/{serviceIncident}', [ServiceIncidentController::class, 'destroy']);
});

// ── Hub reporting contract ───────────────────────────────────────────────────
// Read-only summaries the Uxio Hub pulls on a schedule. Gated by X-Hub-Key
// (+ optional IP allowlist) via the `hub` middleware — dead when no key is
// configured, so a standalone deployment exposes nothing. ADDITIVE-ONLY
// contract: fields may be added, never renamed or removed (sites run mixed
// deploy versions; see HubReportController).
Route::prefix('v1/hub')->middleware('hub')->group(function () {
    Route::get('/summary', [HubReportController::class, 'summary']);
    Route::get('/withdrawals', [HubReportController::class, 'withdrawals']);
    Route::get('/service-orders', [HubReportController::class, 'serviceOrders']);
    Route::get('/profit', [HubReportController::class, 'profit']);
    Route::get('/channels', [HubReportController::class, 'channels']);
});

// ── Hub money-path WRITE channel ─────────────────────────────────────────────
// Approve/reject withdrawals from the Hub. Gated by `hub` (read key) AND
// `hub-write` (a SEPARATE write key + HUB_WRITE_ENABLED), plus a tight rate
// limit — a leaked read key must never move money. Bound by number (the Hub
// mirror keys on withdrawal_number, not the site's id). Each route wraps the
// same Action the payment-internal panel uses (HubActionController).
Route::prefix('v1/hub')->middleware(['hub', 'hub-write', 'throttle:hub-write'])->group(function () {
    Route::post('/withdrawals/{withdrawal:withdrawal_number}/approve', [HubActionController::class, 'approveWithdrawal']);
    Route::post('/withdrawals/{withdrawal:withdrawal_number}/reject', [HubActionController::class, 'rejectWithdrawal']);
});
