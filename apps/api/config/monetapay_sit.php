<?php

/*
|--------------------------------------------------------------------------
| Monetapay SIT scenario registry
|--------------------------------------------------------------------------
| Drives `php artisan monetapay:sit`. Each row mirrors a line in the official
| "Monetapay Test Scenario Template" and declares HOW it is executed against
| the deployed API.
|
| exec types:
|   http            -> real HTTP call to {base}/api/v1{path}
|   manual          -> cannot be forced automatically (stateful / sandbox-only); recorded as MANUAL
|   not_implemented -> endpoint not built in this API; recorded as NOT_IMPLEMENTED
|
| http fields:
|   method, path, auth(bool), body{}, expect_code, expect_http
|   capture{as, from{field => dot.path.in.response}}   (optional — stash ids for later rows)
|   body values may reference captured ids: "{{qris.order_no}}"
|
| `route` + `files` are surfaced in the HTML report ("which route is hit / which file is used").
*/

// Staging seeded payment_channel ids (confirmed): 1=bca_va, 3=bni_va, 5=qris, 6=gopay.
// VA channels enforce min Rp 10,000 → use a pricier product (id 4, Rp 33,596).
$VA   = 1;            // bca_va  (virtual_account)
$VA2  = 3;            // bni_va  (virtual_account)
$EW   = 6;            // gopay   (ewallet)
$QR   = 5;            // qris
$PROD_VA  = 4;        // VA-eligible product (>= Rp 10,000)
$PROD_LOW = 1;        // QRIS/e-wallet product (>= Rp 1,000)

return [

    /* ============================ Balance Inquiry ============================ */
    ['no' => '1.1', 'sheet' => 'Balance Inquiry', 'service' => 'Balance Inquiry', 'scenario' => 'Success Balance Inquiry',
     'exec' => 'http', 'method' => 'POST', 'path' => '/monetapay/balance', 'auth' => true, 'body' => [],
     'expect_code' => '0', 'expect_http' => 200,
     'route' => 'POST /api/v1/monetapay/balance',
     'files' => ['MonetapayController@balance', 'QueryMonetapayAction', 'MonetapayService::inquiryBalance']],

    ['no' => '1.2', 'sheet' => 'Balance Inquiry', 'service' => 'Balance Inquiry', 'scenario' => 'Disabled Support Currency',
     'exec' => 'manual', 'expect_code' => '4019', 'expect_http' => 400,
     'route' => 'POST /api/v1/monetapay/balance', 'files' => ['MonetapayService::inquiryBalance'],
     'note' => 'Our balance route exposes no currency param; the 4019 path is a Monetapay-side merchant config and cannot be triggered from our API.'],

    ['no' => '1.3', 'sheet' => 'Balance Inquiry', 'service' => 'Bill Flow Inquiry', 'scenario' => 'Successful Bill Flow Inquiry',
     'exec' => 'http', 'method' => 'POST', 'path' => '/monetapay/bills/flow', 'auth' => true,
     'body' => ['start_time' => '{{now.month_start}}', 'end_time' => '{{now.today}}', 'page' => '1', 'page_size' => '20'],
     'expect_code' => '0', 'expect_http' => 200,
     'route' => 'POST /api/v1/monetapay/bills/flow', 'files' => ['MonetapayController@billFlow', 'MonetapayService::billFlowInquiry']],

    ['no' => '1.4', 'sheet' => 'Balance Inquiry', 'service' => 'Bill Flow Inquiry', 'scenario' => 'Datetime Range Required',
     'exec' => 'http', 'method' => 'POST', 'path' => '/monetapay/bills/flow', 'auth' => true, 'body' => [],
     'expect_code' => '-1', 'expect_http' => 400,
     'route' => 'POST /api/v1/monetapay/bills/flow', 'files' => ['MonetapayService::billFlowInquiry']],

    ['no' => '1.5', 'sheet' => 'Balance Inquiry', 'service' => 'Bill Flow Inquiry', 'scenario' => 'Invalid Date Format',
     'exec' => 'http', 'method' => 'POST', 'path' => '/monetapay/bills/flow', 'auth' => true,
     'body' => ['start_time' => '01-2026-99', 'end_time' => 'not-a-date'],
     'expect_code' => '-1', 'expect_http' => 400,
     'route' => 'POST /api/v1/monetapay/bills/flow', 'files' => ['MonetapayService::billFlowInquiry']],

    ['no' => '1.6', 'sheet' => 'Balance Inquiry', 'service' => 'Daily Bill Inquiry', 'scenario' => 'Successful Daily Bill Inquiry',
     'exec' => 'http', 'method' => 'POST', 'path' => '/monetapay/bills/daily', 'auth' => true,
     'body' => ['start_date' => '{{now.month_start_date}}', 'end_date' => '{{now.today_date}}', 'currency' => 'IDR', 'page' => '1', 'page_size' => '20'],
     'expect_code' => '0', 'expect_http' => 200,
     'route' => 'POST /api/v1/monetapay/bills/daily', 'files' => ['MonetapayController@dailyBill', 'MonetapayService::dailyBillInquiry']],

    ['no' => '1.7', 'sheet' => 'Balance Inquiry', 'service' => 'Daily Bill Inquiry', 'scenario' => 'Date Range Required',
     'exec' => 'http', 'method' => 'POST', 'path' => '/monetapay/bills/daily', 'auth' => true, 'body' => [],
     'expect_code' => '-1', 'expect_http' => 400,
     'route' => 'POST /api/v1/monetapay/bills/daily', 'files' => ['MonetapayController@dailyBill'],
     'note' => 'Our controller validates start_date/end_date locally — expect a 422 from our API before Monetapay is reached.'],

    ['no' => '1.8', 'sheet' => 'Balance Inquiry', 'service' => 'Daily Bill Inquiry', 'scenario' => 'Invalid Date Format',
     'exec' => 'http', 'method' => 'POST', 'path' => '/monetapay/bills/daily', 'auth' => true,
     'body' => ['start_date' => '2026/99/99', 'end_date' => 'xx'],
     'expect_code' => '-1', 'expect_http' => 400,
     'route' => 'POST /api/v1/monetapay/bills/daily', 'files' => ['MonetapayService::dailyBillInquiry']],

    /* ============================ Virtual Account ============================ */
    ['no' => '2.1', 'sheet' => 'Virtual Account', 'service' => 'VA Create', 'scenario' => 'Successful Dynamic VA Creation',
     'exec' => 'http', 'method' => 'POST', 'path' => '/checkout', 'auth' => false,
     'body' => ['product_id' => $PROD_VA, 'payment_channel_id' => $VA, 'target_uid' => '08123456789', 'guest_contact' => '08123456789'],
     'capture' => ['as' => 'va', 'from' => ['order_no' => 'data.payment.instructions.order_no', 'mch_order_no' => 'data.reference_id']],
     'expect_code' => '0', 'expect_http' => 201,
     'route' => 'POST /api/v1/checkout', 'files' => ['CheckoutController', 'CheckoutAction', 'MonetapayService::createTransaction']],

    ['no' => '2.2', 'sheet' => 'Virtual Account', 'service' => 'VA Create', 'scenario' => 'Successful Static VA Creation',
     'exec' => 'http', 'method' => 'POST', 'path' => '/checkout', 'auth' => false,
     'body' => ['product_id' => $PROD_VA, 'payment_channel_id' => $VA2, 'target_uid' => '08123456789', 'guest_contact' => '08123456789'],
     'expect_code' => '0', 'expect_http' => 201,
     'route' => 'POST /api/v1/checkout', 'files' => ['CheckoutAction', 'MonetapayService::createTransaction'],
     'note' => 'Checkout creates a dynamic VA by default; is_single_use=0 (static) is not parameterised in createTransaction.'],

    ['no' => '2.3', 'sheet' => 'Virtual Account', 'service' => 'VA Create', 'scenario' => 'Not support VA bank codes',
     'exec' => 'manual', 'expect_code' => '4012', 'expect_http' => 400,
     'route' => 'POST /api/v1/checkout', 'files' => ['CheckoutAction'],
     'note' => 'All seeded channels are valid; an unsupported bank code is rejected by our channel lookup before Monetapay returns 4012.'],

    ['no' => '2.4', 'sheet' => 'Virtual Account', 'service' => 'VA Create', 'scenario' => 'Unexpected Bank Error',
     'exec' => 'manual', 'expect_code' => '7003', 'expect_http' => 200,
     'route' => 'POST /api/v1/checkout', 'files' => ['MonetapayService::createTransaction'],
     'note' => 'Sandbox-only fault injection (bank error 7003) cannot be forced from the client.'],

    ['no' => '2.5', 'sheet' => 'Virtual Account', 'service' => 'VA Inquiry', 'scenario' => 'Successful VA Inquiry',
     'exec' => 'http', 'method' => 'POST', 'path' => '/monetapay/virtual-account/query', 'auth' => true,
     'body' => ['mch_order_no' => '{{va.mch_order_no}}'],
     'expect_code' => '0', 'expect_http' => 200,
     'route' => 'POST /api/v1/monetapay/virtual-account/query', 'files' => ['MonetapayController@virtualAccount', 'MonetapayService::inquiryVirtualAccount']],

    ['no' => '2.6', 'sheet' => 'Virtual Account', 'service' => 'VA Inquiry', 'scenario' => 'Processing Inquiry',
     'exec' => 'manual', 'expect_code' => '0', 'expect_http' => 200,
     'route' => 'POST /api/v1/monetapay/virtual-account/query', 'files' => ['MonetapayService::inquiryVirtualAccount'],
     'note' => 'Requires a VA mid-payment (status processing); pay the VA in the sandbox then inquire.'],

    ['no' => '2.7', 'sheet' => 'Virtual Account', 'service' => 'VA Inquiry', 'scenario' => 'Expired VA Inquiry',
     'exec' => 'manual', 'expect_code' => '0', 'expect_http' => 200,
     'route' => 'POST /api/v1/monetapay/virtual-account/query', 'files' => ['MonetapayService::inquiryVirtualAccount'],
     'note' => 'Requires waiting out the VA expiry window; cannot be forced synchronously.'],

    ['no' => '2.8', 'sheet' => 'Virtual Account', 'service' => 'VA Inquiry', 'scenario' => 'Create Fail VA inquiry',
     'exec' => 'http', 'method' => 'POST', 'path' => '/monetapay/virtual-account/query', 'auth' => true,
     'body' => ['mch_order_no' => 'INV-DOES-NOT-EXIST-0001'],
     'expect_code' => '4010', 'expect_http' => 200,
     'route' => 'POST /api/v1/monetapay/virtual-account/query', 'files' => ['MonetapayService::inquiryVirtualAccount']],

    ['no' => '2.9', 'sheet' => 'Virtual Account', 'service' => 'VA Merchant Callback', 'scenario' => 'Successful Callback',
     'exec' => 'manual', 'expect_code' => '0', 'expect_http' => 200,
     'route' => 'POST /api/v1/monetapay/va/callback', 'files' => ['MonetapayCallbackController', 'HandleMonetapayCallbackAction'],
     'note' => 'Inbound callback is invoked by Monetapay with a server-signed en_data; cannot be forged without the production AES key/token.'],

    /* ================================ eWallet ================================ */
    ['no' => '3.1', 'sheet' => 'eWallet', 'service' => 'eWallet Create', 'scenario' => 'Successful eWallet Creation',
     'exec' => 'http', 'method' => 'POST', 'path' => '/checkout', 'auth' => false,
     'body' => ['product_id' => $PROD_LOW, 'payment_channel_id' => $EW, 'target_uid' => '08123456789', 'guest_contact' => '08123456789'],
     'capture' => ['as' => 'ewallet', 'from' => ['order_no' => 'data.payment.instructions.order_no', 'mch_order_no' => 'data.reference_id']],
     'expect_code' => '0', 'expect_http' => 201,
     'route' => 'POST /api/v1/checkout', 'files' => ['CheckoutAction', 'MonetapayService::createTransaction']],

    ['no' => '3.2', 'sheet' => 'eWallet', 'service' => 'eWallet Create', 'scenario' => 'Invalid Amount',
     'exec' => 'manual', 'expect_code' => '-1', 'expect_http' => 400,
     'route' => 'POST /api/v1/checkout', 'files' => ['CheckoutAction'],
     'note' => 'Amount is derived from the product price (valid); a sub-minimum amount cannot be supplied through checkout.'],

    ['no' => '3.3', 'sheet' => 'eWallet', 'service' => 'eWallet Create', 'scenario' => 'Invalid Channel Code',
     'exec' => 'manual', 'expect_code' => '-1', 'expect_http' => 400,
     'route' => 'POST /api/v1/checkout', 'files' => ['CheckoutAction'],
     'note' => 'Seeded channels are valid; invalid channel rejected by our lookup before Monetapay.'],

    ['no' => '3.4', 'sheet' => 'eWallet', 'service' => 'eWallet Create', 'scenario' => 'Creation Failed',
     'exec' => 'manual', 'expect_code' => '0', 'expect_http' => 200,
     'route' => 'POST /api/v1/checkout', 'files' => ['MonetapayService::createTransaction'],
     'note' => 'Sandbox-only failure injection.'],

    ['no' => '3.5', 'sheet' => 'eWallet', 'service' => 'eWallet Inquiry', 'scenario' => 'eWallet Processing Payment',
     'exec' => 'http', 'method' => 'POST', 'path' => '/monetapay/ewallet/query', 'auth' => true,
     'body' => ['mch_order_no' => '{{ewallet.mch_order_no}}'],
     'expect_code' => '0', 'expect_http' => 200,
     'route' => 'POST /api/v1/monetapay/ewallet/query', 'files' => ['MonetapayController@ewallet', 'MonetapayService::inquiryEwallet']],

    ['no' => '3.6', 'sheet' => 'eWallet', 'service' => 'eWallet Inquiry', 'scenario' => 'Expired eWallet Payment',
     'exec' => 'manual', 'expect_code' => '0', 'expect_http' => 200,
     'route' => 'POST /api/v1/monetapay/ewallet/query', 'files' => ['MonetapayService::inquiryEwallet'],
     'note' => 'Requires waiting out the e-wallet charge expiry.'],

    ['no' => '3.7', 'sheet' => 'eWallet', 'service' => 'eWallet Inquiry', 'scenario' => 'Successful eWallet Inquiry',
     'exec' => 'http', 'method' => 'POST', 'path' => '/monetapay/ewallet/query', 'auth' => true,
     'body' => ['mch_order_no' => '{{ewallet.mch_order_no}}'],
     'expect_code' => '0', 'expect_http' => 200,
     'route' => 'POST /api/v1/monetapay/ewallet/query', 'files' => ['MonetapayService::inquiryEwallet'],
     'note' => 'Same order as 3.5; status will read pending until paid in the sandbox.'],

    ['no' => '3.8', 'sheet' => 'eWallet', 'service' => 'eWallet Merchant Callback', 'scenario' => 'Successful Callback',
     'exec' => 'manual', 'expect_code' => '0', 'expect_http' => 200,
     'route' => 'POST /api/v1/monetapay/ewallet/callback', 'files' => ['MonetapayCallbackController'],
     'note' => 'Inbound, server-signed by Monetapay.'],

    /* ================================= QRIS ================================= */
    ['no' => '4.1', 'sheet' => 'QRIS', 'service' => 'QRIS Create', 'scenario' => 'Successful QRIS Creation',
     'exec' => 'http', 'method' => 'POST', 'path' => '/checkout', 'auth' => false,
     'body' => ['product_id' => $PROD_LOW, 'payment_channel_id' => $QR, 'target_uid' => '08123456789', 'guest_contact' => '08123456789'],
     'capture' => ['as' => 'qris', 'from' => ['order_no' => 'data.payment.instructions.order_no', 'mch_order_no' => 'data.reference_id']],
     'expect_code' => '0', 'expect_http' => 201,
     'route' => 'POST /api/v1/checkout', 'files' => ['CheckoutAction', 'MonetapayService::createTransaction']],

    ['no' => '4.2', 'sheet' => 'QRIS', 'service' => 'QRIS Create', 'scenario' => 'Invalid Amount',
     'exec' => 'manual', 'expect_code' => '4008', 'expect_http' => 400,
     'route' => 'POST /api/v1/checkout', 'files' => ['CheckoutAction'],
     'note' => 'Amount from product price (valid); cannot supply an out-of-range amount via checkout.'],

    ['no' => '4.3', 'sheet' => 'QRIS', 'service' => 'QRIS Cancel', 'scenario' => 'Successful QRIS Cancellation',
     'exec' => 'http', 'method' => 'POST', 'path' => '/monetapay/cancel', 'auth' => true,
     'body' => ['order_no' => '{{qris.order_no}}', 'mch_order_no' => '{{qris.mch_order_no}}'],
     'expect_code' => '0', 'expect_http' => 200,
     'route' => 'POST /api/v1/monetapay/cancel', 'files' => ['MonetapayController@cancel', 'CancelTransactionAction', 'MonetapayService::cancelTransaction']],

    ['no' => '4.4', 'sheet' => 'QRIS', 'service' => 'QRIS Cancel', 'scenario' => 'Already Paid QRIS',
     'exec' => 'manual', 'expect_code' => '', 'expect_http' => 400,
     'route' => 'POST /api/v1/monetapay/cancel', 'files' => ['MonetapayService::cancelTransaction'],
     'note' => 'Requires a paid QRIS order to attempt cancellation.'],

    ['no' => '4.5', 'sheet' => 'QRIS', 'service' => 'QRIS inquiry', 'scenario' => 'Successful Inquiry',
     'exec' => 'http', 'method' => 'POST', 'path' => '/monetapay/qris/query', 'auth' => true,
     'body' => ['mch_order_no' => '{{qris.mch_order_no}}'],
     'expect_code' => '0', 'expect_http' => 200,
     'route' => 'POST /api/v1/monetapay/qris/query', 'files' => ['MonetapayController@qris', 'MonetapayService::inquiryQris']],

    ['no' => '4.6', 'sheet' => 'QRIS', 'service' => 'QRIS inquiry', 'scenario' => 'Processing Inquiry',
     'exec' => 'manual', 'expect_code' => '0', 'expect_http' => 200,
     'route' => 'POST /api/v1/monetapay/qris/query', 'files' => ['MonetapayService::inquiryQris'], 'note' => 'Requires a QR being paid.'],

    ['no' => '4.7', 'sheet' => 'QRIS', 'service' => 'QRIS inquiry', 'scenario' => 'Expired QR Code',
     'exec' => 'manual', 'expect_code' => '0', 'expect_http' => 200,
     'route' => 'POST /api/v1/monetapay/qris/query', 'files' => ['MonetapayService::inquiryQris'], 'note' => 'Requires QR expiry.'],

    ['no' => '4.8', 'sheet' => 'QRIS', 'service' => 'QRIS inquiry', 'scenario' => 'Invalid QR Code',
     'exec' => 'http', 'method' => 'POST', 'path' => '/monetapay/qris/query', 'auth' => true,
     'body' => ['mch_order_no' => 'INV-QRIS-NOPE-0001'],
     'expect_code' => '4010', 'expect_http' => 400,
     'route' => 'POST /api/v1/monetapay/qris/query', 'files' => ['MonetapayService::inquiryQris']],

    ['no' => '4.9', 'sheet' => 'QRIS', 'service' => 'QRIS Callback', 'scenario' => 'Successful Callback',
     'exec' => 'manual', 'expect_code' => '0', 'expect_http' => 200,
     'route' => 'POST /api/v1/monetapay/qris/callback', 'files' => ['MonetapayCallbackController'], 'note' => 'Inbound, server-signed.'],

    ['no' => '4.10', 'sheet' => 'QRIS', 'service' => 'QRIS Refund', 'scenario' => 'Successful QRIS Refund',
     'exec' => 'manual', 'expect_code' => '0', 'expect_http' => 200,
     'route' => 'POST /api/v1/monetapay/refund', 'files' => ['RefundTransactionAction', 'MonetapayService::refundTransaction'],
     'note' => 'Refund requires a settled (paid) QRIS order; our created QR is unpaid.'],

    ['no' => '4.11', 'sheet' => 'QRIS', 'service' => 'QRIS Refund', 'scenario' => 'Processing Refund',
     'exec' => 'manual', 'expect_code' => '0', 'expect_http' => 202,
     'route' => 'POST /api/v1/monetapay/refund', 'files' => ['MonetapayService::refundTransaction'], 'note' => 'Needs settled order.'],

    ['no' => '4.12', 'sheet' => 'QRIS', 'service' => 'QRIS Refund', 'scenario' => 'Refund Exceeds Limit',
     'exec' => 'manual', 'expect_code' => '-1', 'expect_http' => 400,
     'route' => 'POST /api/v1/monetapay/refund', 'files' => ['MonetapayService::refundTransaction'], 'note' => 'Needs settled order.'],

    ['no' => '4.13', 'sheet' => 'QRIS', 'service' => 'QRIS Refund', 'scenario' => 'Insufficient Balance',
     'exec' => 'manual', 'expect_code' => '0', 'expect_http' => 200,
     'route' => 'POST /api/v1/monetapay/refund', 'files' => ['MonetapayService::refundTransaction'], 'note' => 'Sandbox balance state.'],

    ['no' => '4.14', 'sheet' => 'QRIS', 'service' => 'QRIS Refund Inquiry', 'scenario' => 'Successful Refund Inquiry',
     'exec' => 'http', 'method' => 'POST', 'path' => '/monetapay/refund/query', 'auth' => true,
     'body' => ['payment_order_no' => '{{qris.order_no}}'],
     'expect_code' => '0', 'expect_http' => 200,
     'route' => 'POST /api/v1/monetapay/refund/query', 'files' => ['MonetapayController@refundQuery', 'MonetapayService::inquiryRefund']],

    ['no' => '4.15', 'sheet' => 'QRIS', 'service' => 'QRIS Refund Inquiry', 'scenario' => 'Processing Refund Inquiry',
     'exec' => 'manual', 'expect_code' => '0', 'expect_http' => 200,
     'route' => 'POST /api/v1/monetapay/refund/query', 'files' => ['MonetapayService::inquiryRefund'], 'note' => 'Needs an in-progress refund.'],

    ['no' => '4.16', 'sheet' => 'QRIS', 'service' => 'QRIS Refund Inquiry', 'scenario' => 'Invalid Refund Request',
     'exec' => 'http', 'method' => 'POST', 'path' => '/monetapay/refund/query', 'auth' => true,
     'body' => ['payment_order_no' => 'NO-SUCH-ORDER-0001'],
     'expect_code' => '4010', 'expect_http' => 400,
     'route' => 'POST /api/v1/monetapay/refund/query', 'files' => ['MonetapayService::inquiryRefund']],

    ['no' => '4.17', 'sheet' => 'QRIS', 'service' => 'QRIS Refund Merchant Callback', 'scenario' => 'Successful Refund Callback',
     'exec' => 'manual', 'expect_code' => '0', 'expect_http' => 200,
     'route' => 'POST /api/v1/payment/callback', 'files' => ['MonetapayCallbackController'], 'note' => 'Inbound, server-signed.'],

    /* ============================== Payment Link ============================== */
    ['no' => '5.1', 'sheet' => 'Payment Link', 'service' => 'Payment Link Create', 'scenario' => 'Successful Payment Link Creation',
     'exec' => 'not_implemented', 'expect_code' => '0', 'expect_http' => 200,
     'route' => '(none)', 'files' => ['—'], 'note' => 'Payment Link create (/v1.0.0/payment-link/create) is not built in this API.'],

    ['no' => '5.2', 'sheet' => 'Payment Link', 'service' => 'Payment Link Create', 'scenario' => 'Invalid Amount',
     'exec' => 'not_implemented', 'expect_code' => '4009', 'expect_http' => 400,
     'route' => '(none)', 'files' => ['—'], 'note' => 'Payment Link create not built.'],

    ['no' => '5.3', 'sheet' => 'Payment Link', 'service' => 'Payment Link Inquiry', 'scenario' => 'Successful Payment',
     'exec' => 'manual', 'expect_code' => '0', 'expect_http' => 200,
     'route' => 'POST /api/v1/monetapay/payment-link/query', 'files' => ['MonetapayService::inquiryPaymentLink'],
     'note' => 'Inquiry route exists but there is no Payment Link create to produce an order to query.'],

    ['no' => '5.4', 'sheet' => 'Payment Link', 'service' => 'Payment Link Inquiry', 'scenario' => 'Processing Payment',
     'exec' => 'manual', 'expect_code' => '0', 'expect_http' => 200,
     'route' => 'POST /api/v1/monetapay/payment-link/query', 'files' => ['MonetapayService::inquiryPaymentLink'], 'note' => 'No link to query.'],

    ['no' => '5.5', 'sheet' => 'Payment Link', 'service' => 'Payment Link Inquiry', 'scenario' => 'Expired Payment Link',
     'exec' => 'manual', 'expect_code' => '0', 'expect_http' => 200,
     'route' => 'POST /api/v1/monetapay/payment-link/query', 'files' => ['MonetapayService::inquiryPaymentLink'], 'note' => 'No link to query.'],

    ['no' => '5.6', 'sheet' => 'Payment Link', 'service' => 'Payment Link Inquiry', 'scenario' => 'Payment Link Failed',
     'exec' => 'manual', 'expect_code' => '1000', 'expect_http' => 400,
     'route' => 'POST /api/v1/monetapay/payment-link/query', 'files' => ['MonetapayService::inquiryPaymentLink'], 'note' => 'No link to query.'],

    /* ================================ Subscribe ============================== */
    ['no' => '6.1', 'sheet' => 'Subscribe', 'service' => 'Customer', 'scenario' => 'Create Customer Success',
     'exec' => 'not_implemented', 'expect_code' => '0', 'expect_http' => 200, 'route' => '(none)', 'files' => ['—'],
     'note' => 'Customer create (/v1.0.0/customer/create) not built.'],
    ['no' => '6.2', 'sheet' => 'Subscribe', 'service' => 'Customer', 'scenario' => 'Mch Customer Id Exists',
     'exec' => 'not_implemented', 'expect_code' => '-1', 'expect_http' => 400, 'route' => '(none)', 'files' => ['—'], 'note' => 'Customer create not built.'],
    ['no' => '6.3', 'sheet' => 'Subscribe', 'service' => 'Subscribe', 'scenario' => 'Create Subscription Success',
     'exec' => 'not_implemented', 'expect_code' => '0', 'expect_http' => 200, 'route' => '(none)', 'files' => ['—'], 'note' => 'Subscription create not built.'],
    ['no' => '6.4', 'sheet' => 'Subscribe', 'service' => 'Subscribe', 'scenario' => 'Mch Order No Exists',
     'exec' => 'not_implemented', 'expect_code' => '4001', 'expect_http' => 200, 'route' => '(none)', 'files' => ['—'], 'note' => 'Subscription create not built.'],
    ['no' => '6.5', 'sheet' => 'Subscribe', 'service' => 'Subscribe', 'scenario' => 'Invalid interval unit',
     'exec' => 'not_implemented', 'expect_code' => '-1', 'expect_http' => 400, 'route' => '(none)', 'files' => ['—'], 'note' => 'Subscription create not built.'],
    ['no' => '6.6', 'sheet' => 'Subscribe', 'service' => 'Subscribe Inquiry', 'scenario' => 'Subscribe Inquiry Request Success',
     'exec' => 'manual', 'expect_code' => '0', 'expect_http' => 200, 'route' => 'POST /api/v1/monetapay/subscription/query',
     'files' => ['MonetapayService::inquirySubscription'], 'note' => 'Inquiry route exists but no subscription create to produce an order_no.'],
    ['no' => '6.7', 'sheet' => 'Subscribe', 'service' => 'Subscribe', 'scenario' => 'Subscription Cancellation Successful',
     'exec' => 'not_implemented', 'expect_code' => '0', 'expect_http' => 200, 'route' => '(none)', 'files' => ['—'], 'note' => 'Subscription deactivate not built.'],
    ['no' => '6.8', 'sheet' => 'Subscribe', 'service' => 'Subscribe', 'scenario' => 'Subscription Cancellation Fail',
     'exec' => 'not_implemented', 'expect_code' => '4023', 'expect_http' => 200, 'route' => '(none)', 'files' => ['—'], 'note' => 'Subscription deactivate not built.'],
    ['no' => '6.9', 'sheet' => 'Subscribe', 'service' => 'Subscribe', 'scenario' => 'Merchant Callback First Active Success',
     'exec' => 'manual', 'expect_code' => '0', 'expect_http' => 200, 'route' => '(callback)', 'files' => ['—'], 'note' => 'Inbound subscription callback, server-signed.'],
    ['no' => '6.10', 'sheet' => 'Subscribe', 'service' => 'Subscribe', 'scenario' => 'Merchant Callback Cancel',
     'exec' => 'manual', 'expect_code' => '0', 'expect_http' => 200, 'route' => '(callback)', 'files' => ['—'], 'note' => 'Inbound callback.'],
    ['no' => '6.11', 'sheet' => 'Subscribe', 'service' => 'Subscribe', 'scenario' => 'Merchant Callback Before Deduction',
     'exec' => 'manual', 'expect_code' => '0', 'expect_http' => 200, 'route' => '(callback)', 'files' => ['—'], 'note' => 'Inbound callback.'],
    ['no' => '6.12', 'sheet' => 'Subscribe', 'service' => 'Subscribe', 'scenario' => 'Merchant Callback After Deduction Result',
     'exec' => 'manual', 'expect_code' => '0', 'expect_http' => 200, 'route' => '(callback)', 'files' => ['—'], 'note' => 'Inbound callback.'],

    /* ============================ Pay-out Services =========================== */
    ['no' => '7.1', 'sheet' => 'Pay-out Services', 'service' => 'Disbursement', 'scenario' => 'Processing Disbursement',
     'exec' => 'not_implemented', 'expect_code' => '0', 'expect_http' => 200, 'route' => '(none)', 'files' => ['—'], 'note' => 'Disbursement create (/v1.0.0/disbursement) not built.'],
    ['no' => '7.2', 'sheet' => 'Pay-out Services', 'service' => 'Disbursement', 'scenario' => 'Field required',
     'exec' => 'not_implemented', 'expect_code' => '4004', 'expect_http' => 200, 'route' => '(none)', 'files' => ['—'], 'note' => 'Disbursement create not built.'],
    ['no' => '7.3', 'sheet' => 'Pay-out Services', 'service' => 'Disbursement', 'scenario' => 'Insufficient Balance',
     'exec' => 'not_implemented', 'expect_code' => '0', 'expect_http' => 200, 'route' => '(none)', 'files' => ['—'], 'note' => 'Disbursement create not built.'],
    ['no' => '7.4', 'sheet' => 'Pay-out Services', 'service' => 'Large Payout', 'scenario' => 'Processing Large Payout',
     'exec' => 'not_implemented', 'expect_code' => '0', 'expect_http' => 200, 'route' => '(none)', 'files' => ['—'], 'note' => 'Large payout create not built.'],
    ['no' => '7.5', 'sheet' => 'Pay-out Services', 'service' => 'Large Payout', 'scenario' => 'Minimum, Maximum Amount Limited',
     'exec' => 'not_implemented', 'expect_code' => '4008', 'expect_http' => 200, 'route' => '(none)', 'files' => ['—'], 'note' => 'Large payout create not built.'],
    ['no' => '7.6', 'sheet' => 'Pay-out Services', 'service' => 'Large Payout', 'scenario' => 'Field Invalid',
     'exec' => 'not_implemented', 'expect_code' => '-1', 'expect_http' => 200, 'route' => '(none)', 'files' => ['—'], 'note' => 'Large payout create not built.'],
    ['no' => '7.7', 'sheet' => 'Pay-out Services', 'service' => 'Payout to EWallet', 'scenario' => 'Processing Disbursement',
     'exec' => 'not_implemented', 'expect_code' => '0', 'expect_http' => 200, 'route' => '(none)', 'files' => ['—'], 'note' => 'EWallet payout create not built.'],
    ['no' => '7.8', 'sheet' => 'Pay-out Services', 'service' => 'Payout to EWallet', 'scenario' => 'Wrong Recipient Info',
     'exec' => 'not_implemented', 'expect_code' => '4005', 'expect_http' => 200, 'route' => '(none)', 'files' => ['—'], 'note' => 'EWallet payout create not built.'],
    ['no' => '7.9', 'sheet' => 'Pay-out Services', 'service' => 'Payout to EWallet', 'scenario' => 'Unsupported Bank',
     'exec' => 'not_implemented', 'expect_code' => '-1', 'expect_http' => 200, 'route' => '(none)', 'files' => ['—'], 'note' => 'EWallet payout create not built.'],
    ['no' => '7.10', 'sheet' => 'Pay-out Services', 'service' => 'Payout Order Inquiry', 'scenario' => 'Successful Payout Inquiry',
     'exec' => 'manual', 'expect_code' => '0', 'expect_http' => 200, 'route' => 'POST /api/v1/monetapay/disbursement/query',
     'files' => ['MonetapayService::inquiryDisbursement'], 'note' => 'Inquiry route exists but no payout create to produce an order_no.'],
    ['no' => '7.11', 'sheet' => 'Pay-out Services', 'service' => 'Payout Order Inquiry', 'scenario' => 'Payout Still Processing',
     'exec' => 'manual', 'expect_code' => '0', 'expect_http' => 200, 'route' => 'POST /api/v1/monetapay/disbursement/query',
     'files' => ['MonetapayService::inquiryDisbursement'], 'note' => 'No payout order available.'],
    ['no' => '7.12', 'sheet' => 'Pay-out Services', 'service' => 'Payout Order Inquiry', 'scenario' => 'SYSTEM_ERROR',
     'exec' => 'manual', 'expect_code' => '9999', 'expect_http' => 200, 'route' => 'POST /api/v1/monetapay/disbursement/query',
     'files' => ['MonetapayService::inquiryDisbursement'], 'note' => 'Sandbox fault injection.'],
    ['no' => '7.13', 'sheet' => 'Pay-out Services', 'service' => 'Payout Merchant Callback', 'scenario' => 'Successful Merchant Callback',
     'exec' => 'manual', 'expect_code' => '0', 'expect_http' => 200, 'route' => '(callback)', 'files' => ['—'], 'note' => 'Inbound payout callback (route not built).'],
    ['no' => '7.14', 'sheet' => 'Pay-out Services', 'service' => 'Payout Merchant Callback', 'scenario' => 'Failure in Merchant Callback',
     'exec' => 'manual', 'expect_code' => '0', 'expect_http' => 200, 'route' => '(callback)', 'files' => ['—'], 'note' => 'Inbound payout callback (route not built).'],

    /* =========================== Account Validation ========================= */
    ['no' => '8.1', 'sheet' => 'Account Validation', 'service' => 'Account Validation', 'scenario' => 'Successful Account Validation',
     'exec' => 'http', 'method' => 'POST', 'path' => '/monetapay/inquiry-account', 'auth' => true,
     'body' => ['mch_order_no' => '{{run.uid}}-AV1', 'account_bank_code' => 'BNI', 'account_number' => '1234567890', 'account_type' => '1'],
     'expect_code' => '0', 'expect_http' => 200,
     'route' => 'POST /api/v1/monetapay/inquiry-account', 'files' => ['MonetapayController@accountValidation', 'MonetapayService::accountValidation']],

    ['no' => '8.2', 'sheet' => 'Account Validation', 'service' => 'Account Validation', 'scenario' => 'Invalid Account Number',
     'exec' => 'http', 'method' => 'POST', 'path' => '/monetapay/inquiry-account', 'auth' => true,
     'body' => ['mch_order_no' => '{{run.uid}}-AV2', 'account_bank_code' => 'BNI', 'account_number' => '0000', 'account_type' => '1'],
     'expect_code' => '0', 'expect_http' => 200,
     'route' => 'POST /api/v1/monetapay/inquiry-account', 'files' => ['MonetapayService::accountValidation']],

    ['no' => '8.3', 'sheet' => 'Account Validation', 'service' => 'Account Validation', 'scenario' => 'Bank Internal Error',
     'exec' => 'http', 'method' => 'POST', 'path' => '/monetapay/inquiry-account', 'auth' => true,
     'body' => ['mch_order_no' => '{{run.uid}}-AV3', 'account_bank_code' => 'BCA', 'account_number' => '5150383218', 'account_type' => '1'],
     'expect_code' => '0', 'expect_http' => 200,
     'route' => 'POST /api/v1/monetapay/inquiry-account', 'files' => ['MonetapayService::accountValidation'],
     'note' => 'Bank-internal-error path is sandbox-dependent; recorded response is whatever the sandbox returns.'],

    ['no' => '8.4', 'sheet' => 'Account Validation', 'service' => 'Account Validation (Phase II)', 'scenario' => 'Successful Card Validation (Name & Number)',
     'exec' => 'http', 'method' => 'POST', 'path' => '/monetapay/inquiry-account', 'auth' => true,
     'body' => ['mch_order_no' => '{{run.uid}}-AV4', 'account_bank_code' => 'BNI', 'account_number' => '0315747263', 'account_type' => '1', 'ori_account_name' => 'MOCK MOCK'],
     'expect_code' => '0', 'expect_http' => 200,
     'route' => 'POST /api/v1/monetapay/inquiry-account', 'files' => ['MonetapayService::accountValidation']],

    ['no' => '8.5', 'sheet' => 'Account Validation', 'service' => 'Account Validation (Phase II)', 'scenario' => 'Name Mismatch Error',
     'exec' => 'http', 'method' => 'POST', 'path' => '/monetapay/inquiry-account', 'auth' => true,
     'body' => ['mch_order_no' => '{{run.uid}}-AV5', 'account_bank_code' => 'BNI', 'account_number' => '0315747263', 'account_type' => '1', 'ori_account_name' => 'WRONG NAME'],
     'expect_code' => '0', 'expect_http' => 200,
     'route' => 'POST /api/v1/monetapay/inquiry-account', 'files' => ['MonetapayService::accountValidation'],
     'note' => 'Phase II returns account_name_match_result=2 (not matching) within a code 0 envelope.'],

    ['no' => '8.6', 'sheet' => 'Account Validation', 'service' => 'Account Validation (Phase II)', 'scenario' => 'Card Expired',
     'exec' => 'manual', 'expect_code' => '0', 'expect_http' => 200,
     'route' => 'POST /api/v1/monetapay/inquiry-account', 'files' => ['MonetapayService::accountValidation'], 'note' => 'Sandbox-specific card state.'],

    ['no' => '8.7', 'sheet' => 'Account Validation', 'service' => 'Account Validation (Phase II)', 'scenario' => 'Bank System Maintenance',
     'exec' => 'manual', 'expect_code' => '0', 'expect_http' => 200,
     'route' => 'POST /api/v1/monetapay/inquiry-account', 'files' => ['MonetapayService::accountValidation'], 'note' => 'Sandbox-specific maintenance window.'],
];
