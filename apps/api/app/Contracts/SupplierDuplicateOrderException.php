<?php

declare(strict_types=1);

namespace App\Contracts;

use App\Exceptions\UxiolabsDuplicateOrderException;
use Throwable;

/**
 * "That order already exists at the supplier" — a marker any supplier adapter
 * can throw, so the engine can treat it as a KNOWN outcome instead of a failure.
 *
 * It exists so the catch site does not name one supplier. `idtrx sudah ada` is
 * uxiolabs's wording, but the situation is universal: the previous attempt's
 * response was lost, the order is live, and re-ordering would charge twice.
 * The engine settles the row to PROCESSING and waits for the callback.
 *
 * @see UxiolabsDuplicateOrderException the default adapter's implementation
 */
interface SupplierDuplicateOrderException extends Throwable {}
