<?php

namespace App\Http\Controllers\Api\Storefront;

use App\Http\Controllers\Controller;
use App\Support\Payout\BankCatalog;
use App\Traits\ApiResponse;

/**
 * The payout destination catalogue, served rather than duplicated.
 *
 * `config/banks.php` is the canonical list, and it was already being mirrored
 * by hand into the settlement SPA. The guest refund claim page needs the same
 * list, and a third hand-maintained copy would guarantee the three drift — a
 * customer picking a code the API then rejects.
 *
 * Public on purpose: this is a static list of Indonesian banks and e-wallets
 * with nothing sensitive in it, and the guest claim form is unauthenticated.
 */
class PayoutBankController extends Controller
{
    use ApiResponse;

    public function __invoke()
    {
        $banks = collect(BankCatalog::codes())
            ->map(fn (string $code) => [
                'code' => $code,
                'name' => BankCatalog::name($code),
                // Drives the "account number vs phone number" branch in every
                // payout form, so the client never has to know the e-wallet set.
                'is_ewallet' => BankCatalog::isEwallet($code),
            ])
            ->values()
            ->all();

        return $this->successResponse($banks, 'Payout banks retrieved successfully');
    }
}
