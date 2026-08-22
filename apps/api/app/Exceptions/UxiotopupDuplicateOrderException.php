<?php

namespace App\Exceptions;

use Exception;

/**
 * uxiotopup rejected /order with "idtrx sudah ada" — the order was already
 * accepted on a previous attempt whose response we lost (timeout/retry).
 * NOT a failure: the caller must keep the transaction PROCESSING and let the
 * callback finalise it, because /status cannot look an order up by idtrx.
 */
class UxiotopupDuplicateOrderException extends Exception
{
    public function __construct(public readonly string $idtrx, string $message = 'idtrx sudah ada')
    {
        parent::__construct($message);
    }
}
