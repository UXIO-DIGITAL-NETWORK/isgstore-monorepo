<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Public holidays
    |--------------------------------------------------------------------------
    |
    | `Y-m-d` dates that do not count toward the 2x24 working-hour refund
    | promise, on top of every Saturday and Sunday. Read by
    | `App\Support\Refund\RefundSla`.
    |
    | Kept in config rather than a table on purpose: the list is edited once a
    | year alongside the rest of the deployment's settings, and getting it wrong
    | costs a "late" badge on the admin queue, never a wrong payment.
    |
    */

    'holidays' => array_values(array_filter(
        array_map('trim', explode(',', (string) env('REFUND_HOLIDAYS', '')))
    )),

];
