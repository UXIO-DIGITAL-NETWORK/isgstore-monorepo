<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Classification stored on activity_logs.type.
 *
 * Values match the filter keys the member Activity Log page sends, so the query
 * string needs no translation layer between client and database.
 */
enum ActivityType: string
{
    case LOGIN = 'login';
    case MEMBERSHIP = 'membership';
    case TRANSACTION = 'transaction';
    case SECURITY = 'security';
    case VERIFICATION = 'verification';
    case FAILED = 'failed';
}
