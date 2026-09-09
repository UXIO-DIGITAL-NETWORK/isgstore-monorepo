<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Support\Payment\WebsiteSubscriptionStatus;
use App\Traits\ApiResponse;

/**
 * "When does this website's own subscription run out, and where do I renew it?"
 *
 * Feeds the card in the admin sidebar footer, so it is rendered on **every**
 * admin page: it must always answer 200 and never throw. The resolution itself
 * lives in WebsiteSubscriptionStatus because the Hub pulls the same answer
 * through /v1/hub/summary — one site cannot be allowed to tell two stories
 * about its own expiry date.
 *
 * Note the identity mismatch this deliberately accepts: the caller is an
 * `admin`, but the billing data belongs to the site's `payment-admin` merchant
 * (`DefaultMerchant`). Those two roles are kept strictly apart everywhere else
 * in this codebase; here they are the same company looking at its own bill, and
 * the CTA is worthless otherwise.
 */
class WebsiteSubscriptionController extends Controller
{
    use ApiResponse;

    public function show()
    {
        return $this->successResponse(
            WebsiteSubscriptionStatus::resolve(),
            'Website subscription retrieved'
        );
    }
}
