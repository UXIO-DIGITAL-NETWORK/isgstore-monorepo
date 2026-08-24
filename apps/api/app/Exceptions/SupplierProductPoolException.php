<?php

namespace App\Exceptions;

use Exception;

/**
 * Business-rule violation in the provider pool pipeline: pooling a SKU that is
 * not offered, promoting one whose margin has not been decided, publishing one
 * that was never promoted. Controllers translate this to a 422; the bulk actions
 * catch it per row so one bad SKU never aborts a batch.
 */
class SupplierProductPoolException extends Exception {}
