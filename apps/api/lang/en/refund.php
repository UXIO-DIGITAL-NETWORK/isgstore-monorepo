<?php

return [
    // ── Claim email: "your money is waiting, tell us where to send it" ──
    'claim_subject' => 'Refund · :invoice',
    'claim_preheader' => 'Your order failed. Tell us where to send your refund.',
    'claim_title' => 'Refund',
    'claim_greeting' => 'Hi,',
    'claim_intro' => 'We are sorry — your order could not be processed. You will be refunded in full.',
    'claim_action_intro' => 'Because you ordered without an account, we need a bank account or e-wallet to send it to. Tap the button below to enter it — it takes less than a minute.',
    'claim_cta' => 'Enter Payout Details',
    'claim_fallback' => 'If the button does not work, copy this link into your browser:',

    // ── Completed email: "we have sent it" ──
    'done_subject' => 'Refund Completed · :invoice',
    'done_preheader' => 'Your refund has been transferred.',
    'done_title' => 'Refund Completed',
    'done_intro' => 'The refund for your order has been transferred to the account you gave us.',
    'done_note' => 'Funds usually arrive within minutes, but can take up to 24 hours depending on the receiving bank.',

    // ── Shared rows ──
    'label_invoice' => 'Invoice Number',
    'label_amount' => 'Refund Amount',
    'label_product' => 'Product',
    'label_destination' => 'Destination Account',

    'help' => 'Need help? Reply to this email or contact our support team.',

    // ── WhatsApp ──
    'wa_claim' => "*:brand* — Refund\n\n".
        "Hi, we are sorry that order *:invoice* could not be processed.\n".
        "You will be refunded *:amount* in full.\n\n".
        "Enter your payout details here:\n:url\n\n".
        'Thank you for your patience. 🙏',

    'wa_done' => "*:brand* — Refund Completed\n\n".
        "Your refund of *:amount* for order *:invoice* has been transferred to :destination.\n\n".
        'Thank you for your patience. 🙏',
];
