<?php

namespace App\Exceptions;

use Exception;

/**
 * Business-rule violation while creating a product from a Digiflazz SKU
 * (unknown SKU, duplicate mapping, taken product code, invalid cost).
 * Callers translate this to a 422 (single add) or a failed row (import).
 */
class DigiflazzProductException extends Exception {}
