<?php

return [
    // WhatsApp receipt caption. Kept short — the invoice PDF is attached as the
    // document; this is just the accompanying message.
    'receipt_caption' => "*:brand* — Payment Receipt\n\n".
        "Hi, your order is *complete*. Here is a summary:\n\n".
        "Invoice: *:invoice*\n".
        ":product\n".
        "Account ID: :target\n".
        "Total: *:total*\n\n".
        'Your full receipt is attached as a PDF. Thank you! 🙏',

    'receipt_caption_no_target' => "*:brand* — Payment Receipt\n\n".
        "Hi, your order is *complete*. Here is a summary:\n\n".
        "Invoice: *:invoice*\n".
        ":product\n".
        "Total: *:total*\n\n".
        'Your full receipt is attached as a PDF. Thank you! 🙏',
];
