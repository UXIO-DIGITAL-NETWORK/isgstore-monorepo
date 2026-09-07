<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * The PAYMENT GATEWAY lifecycle as a word — did the customer pay?
 *
 * Not a column. It is a projection over two authoritative columns that answer the
 * same question in different alphabets:
 *
 * - `payments.status`, stored as '1'..'4' (see PaymentStatus). A storage encoding,
 *   never meant to be read by a human — the payment SPA currently shows merchants
 *   raw enum text, and this is what stops that.
 * - `service_invoices.status`, which for a bill IS its payment lifecycle.
 *
 * `UnifiedTransactionQuery` unions those two tables, so the feed needs one
 * vocabulary spanning both. PHP and SQL derivations live together here so they
 * cannot drift apart.
 */
enum GatewayStatus: string
{
    /** Issued, not settled. */
    case PENDING = 'PENDING';

    /** The customer's money arrived. */
    case SUCCESS = 'SUCCESS';

    /** The payment window closed unpaid. */
    case EXPIRED = 'EXPIRED';

    /** The money went back. */
    case REFUNDED = 'REFUNDED';

    /** Withdrawn or refused before payment. Service-invoice leg only. */
    case CANCELLED = 'CANCELLED';

    /**
     * Null when a transaction has no payment row at all — an admin-created or
     * manually recorded order. "No gateway involved" is a real answer, distinct
     * from "not paid yet".
     */
    public static function fromPayment(?PaymentStatus $status): ?self
    {
        return match ($status) {
            PaymentStatus::PENDING => self::PENDING,
            PaymentStatus::SUCCESS => self::SUCCESS,
            PaymentStatus::EXPIRED => self::EXPIRED,
            PaymentStatus::REFUNDED => self::REFUNDED,
            null => null,
        };
    }

    /**
     * A bill's own status read as a payment lifecycle.
     *
     * REJECTED folds into CANCELLED: the merchant's Invoices page still shows the
     * real invoice status, and this column only has to answer "did money move".
     */
    public static function fromServiceInvoice(ServiceInvoiceStatus $status): self
    {
        return match ($status) {
            ServiceInvoiceStatus::UNPAID,
            ServiceInvoiceStatus::WAITING_CONFIRMATION => self::PENDING,
            ServiceInvoiceStatus::PAID => self::SUCCESS,
            ServiceInvoiceStatus::EXPIRED => self::EXPIRED,
            ServiceInvoiceStatus::CANCELLED,
            ServiceInvoiceStatus::REJECTED => self::CANCELLED,
        };
    }

    /** The same mapping as fromPayment(), for use inside a query. */
    public static function sqlCaseForPayments(string $alias): string
    {
        return "CASE {$alias}.status"
            ." WHEN '".PaymentStatus::PENDING->value."' THEN '".self::PENDING->value."'"
            ." WHEN '".PaymentStatus::EXPIRED->value."' THEN '".self::EXPIRED->value."'"
            ." WHEN '".PaymentStatus::SUCCESS->value."' THEN '".self::SUCCESS->value."'"
            ." WHEN '".PaymentStatus::REFUNDED->value."' THEN '".self::REFUNDED->value."'"
            .' ELSE NULL END';
    }

    /** The same mapping as fromServiceInvoice(), for use inside a query. */
    public static function sqlCaseForServiceInvoices(string $alias): string
    {
        return "CASE {$alias}.status"
            ." WHEN '".ServiceInvoiceStatus::UNPAID->value."' THEN '".self::PENDING->value."'"
            ." WHEN '".ServiceInvoiceStatus::WAITING_CONFIRMATION->value."' THEN '".self::PENDING->value."'"
            ." WHEN '".ServiceInvoiceStatus::PAID->value."' THEN '".self::SUCCESS->value."'"
            ." WHEN '".ServiceInvoiceStatus::EXPIRED->value."' THEN '".self::EXPIRED->value."'"
            ." WHEN '".ServiceInvoiceStatus::CANCELLED->value."' THEN '".self::CANCELLED->value."'"
            ." WHEN '".ServiceInvoiceStatus::REJECTED->value."' THEN '".self::CANCELLED->value."'"
            .' ELSE NULL END';
    }
}
