<?php

namespace App\Observers;

use App\Events\NotificationCreated;
use App\Models\Notification;

/**
 * Fires a realtime signal to the recipient when a notification lands, so the
 * navbar badge updates live instead of polling every 20s.
 */
class NotificationObserver
{
    public function created(Notification $notification): void
    {
        NotificationCreated::dispatch($notification);
    }
}
