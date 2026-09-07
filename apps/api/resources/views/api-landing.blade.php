<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ config('app.name', 'Web Topup') }} · API</title>
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700|jetbrains-mono:400,500" rel="stylesheet" />
    <style>
        :root {
            --bg: #0b0f17;
            --bg-soft: #111725;
            --card: #141b2b;
            --card-hover: #18203344;
            --border: #212b40;
            --border-soft: #1a2234;
            --text: #e6ebf5;
            --muted: #8b98b3;
            --faint: #5d6a86;
            --accent: #4f8cff;
            --accent-soft: #1d2c4d;
            --mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            background: var(--bg);
            color: var(--text);
            line-height: 1.55;
            -webkit-font-smoothing: antialiased;
        }
        a { color: inherit; text-decoration: none; }

        /* ── Layout ── */
        .wrap { max-width: 1180px; margin: 0 auto; padding: 0 24px; }
        header {
            position: relative;
            overflow: hidden;
            border-bottom: 1px solid var(--border-soft);
            background:
                radial-gradient(900px 400px at 80% -10%, #1d3160 0%, transparent 60%),
                radial-gradient(700px 350px at 0% 0%, #16233f 0%, transparent 55%),
                var(--bg-soft);
        }
        .hero { padding: 64px 0 52px; }
        .eyebrow {
            display: inline-flex; align-items: center; gap: 8px;
            font-size: 12px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase;
            color: var(--accent);
            background: var(--accent-soft);
            border: 1px solid #2b4278;
            padding: 5px 12px; border-radius: 999px; margin-bottom: 22px;
        }
        .dot { width: 7px; height: 7px; border-radius: 50%; background: #37d67a; box-shadow: 0 0 8px #37d67a; }
        h1 { font-size: clamp(30px, 4vw, 46px); font-weight: 700; letter-spacing: -0.02em; line-height: 1.1; }
        h1 span { color: var(--accent); }
        .lede { margin-top: 16px; max-width: 640px; color: var(--muted); font-size: 17px; }

        .meta-row { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 28px; }
        .chip {
            font-family: var(--mono); font-size: 13px;
            background: #0e1524; border: 1px solid var(--border);
            padding: 8px 14px; border-radius: 8px; color: var(--text);
        }
        .chip b { color: var(--accent); font-weight: 500; }

        /* ── Legend ── */
        .legend { display: flex; flex-wrap: wrap; gap: 18px; margin-top: 30px; align-items: center; }
        .legend-label { font-size: 12px; color: var(--faint); text-transform: uppercase; letter-spacing: .08em; }
        .badge {
            font-size: 11px; font-weight: 600; letter-spacing: .03em;
            padding: 3px 9px; border-radius: 6px; text-transform: uppercase;
            border: 1px solid transparent; white-space: nowrap;
        }
        .b-public   { background: #0f2a1c; color: #4ade80; border-color: #1c5238; }
        .b-auth     { background: #2a230f; color: #fbbf24; border-color: #52441c; }
        .b-admin    { background: #2a0f18; color: #fb7185; border-color: #521c2c; }
        .b-merchant { background: #0f1f2a; color: #38bdf8; border-color: #1c4152; }
        .b-internal { background: #1c1230; color: #c084fc; border-color: #3a2352; }
        .b-hub      { background: #2a1a0f; color: #fb923c; border-color: #523419; }
        .b-webhook  { background: #12202a; color: #22d3ee; border-color: #1c414f; }

        /* ── Section nav ── */
        nav.toc {
            position: sticky; top: 0; z-index: 20;
            background: rgba(11,15,23,.85); backdrop-filter: blur(10px);
            border-bottom: 1px solid var(--border-soft);
        }
        .toc-inner { display: flex; gap: 6px; overflow-x: auto; padding: 12px 0; scrollbar-width: none; }
        .toc-inner::-webkit-scrollbar { display: none; }
        .toc-inner a {
            font-size: 13px; color: var(--muted); white-space: nowrap;
            padding: 6px 12px; border-radius: 7px; border: 1px solid transparent;
            transition: all .15s;
        }
        .toc-inner a:hover { color: var(--text); background: var(--card); border-color: var(--border); }

        /* ── Sections ── */
        main { padding: 40px 0 80px; }
        section { margin-top: 44px; scroll-margin-top: 70px; }
        section:first-child { margin-top: 8px; }
        .sec-head { display: flex; align-items: baseline; gap: 14px; margin-bottom: 6px; flex-wrap: wrap; }
        .sec-head h2 { font-size: 22px; font-weight: 650; letter-spacing: -0.01em; }
        .sec-head .badge { transform: translateY(-2px); }
        .sec-desc { color: var(--muted); font-size: 15px; max-width: 760px; margin-bottom: 20px; }
        .sec-desc code { font-family: var(--mono); font-size: 13px; background: #0e1524; padding: 1px 6px; border-radius: 5px; color: #b9c6e2; }

        /* ── Endpoint grid ── */
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 14px; }
        .group {
            background: var(--card); border: 1px solid var(--border);
            border-radius: 14px; padding: 18px 18px 8px;
        }
        .group-title { font-size: 14px; font-weight: 600; color: var(--text); margin-bottom: 4px; }
        .group-note { font-size: 12.5px; color: var(--faint); margin-bottom: 14px; line-height: 1.45; }
        .ep { display: flex; align-items: center; gap: 10px; padding: 7px 0; border-top: 1px solid var(--border-soft); }
        .ep:first-of-type { border-top: none; }
        .method {
            font-family: var(--mono); font-size: 10.5px; font-weight: 600;
            width: 52px; text-align: center; padding: 3px 0; border-radius: 5px; flex-shrink: 0;
            letter-spacing: .02em;
        }
        .m-get    { background: #0f2338; color: #56b6ff; }
        .m-post   { background: #0f2e1f; color: #5cd68a; }
        .m-put    { background: #2e260f; color: #f0c445; }
        .m-patch  { background: #2e260f; color: #f0c445; }
        .m-delete { background: #2e1218; color: #ff6b81; }
        .path { font-family: var(--mono); font-size: 12.5px; color: #cdd8f0; word-break: break-all; }
        .path .p-var { color: #c084fc; }

        footer {
            border-top: 1px solid var(--border-soft); padding: 28px 0;
            color: var(--faint); font-size: 13px;
            display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px;
        }
        footer a { color: var(--muted); }
        footer a:hover { color: var(--accent); }
    </style>
</head>
<body>
    @php
        $base = rtrim(config('app.url'), '/');
    @endphp

    <header>
        <div class="wrap hero">
            <span class="eyebrow"><span class="dot"></span> API Online</span>
            <h1>{{ config('app.name', 'Web Topup') }} <span>API</span></h1>
            <p class="lede">
                REST backend for the game top-up storefront, wallet, payment gateway, service-billing
                and multi-site reporting. Every route lives under <code style="font-family:var(--mono)">/api/v1</code>
                and returns a consistent <code style="font-family:var(--mono)">{ status, code, message, data }</code> envelope.
            </p>

            <div class="meta-row">
                <span class="chip">Base URL · <b>{{ $base }}/api/v1</b></span>
                <span class="chip">Auth · <b>Bearer (Sanctum)</b></span>
                <span class="chip">Health · <b><a href="{{ $base }}/api/v1/health">/health</a></b></span>
            </div>

            <div class="legend">
                <span class="legend-label">Access levels</span>
                <span class="badge b-public">Public</span>
                <span class="badge b-webhook">Webhook</span>
                <span class="badge b-auth">Authenticated</span>
                <span class="badge b-admin">Admin</span>
                <span class="badge b-merchant">Merchant</span>
                <span class="badge b-internal">Internal</span>
                <span class="badge b-hub">Hub</span>
            </div>
        </div>
    </header>

    <nav class="toc">
        <div class="wrap">
            <div class="toc-inner">
                <a href="#system">System</a>
                <a href="#webhooks">Webhooks</a>
                <a href="#storefront">Storefront</a>
                <a href="#auth">Auth</a>
                <a href="#member">Member</a>
                <a href="#admin">Admin</a>
                <a href="#merchant">Payment · Merchant</a>
                <a href="#internal">Payment · Internal</a>
                <a href="#hub">Uxio Hub</a>
            </div>
        </div>
    </nav>

    <main class="wrap">

        {{-- ── System ── --}}
        <section id="system">
            <div class="sec-head"><h2>System</h2><span class="badge b-public">Public</span></div>
            <p class="sec-desc">Liveness probes for load balancers and uptime monitors — no auth, no side effects.</p>
            <div class="grid">
                <div class="group">
                    <div class="group-title">Health checks</div>
                    <div class="group-note">Both return <code>200</code> with a tiny JSON body; <code>/health</code> also reports request latency in ms.</div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/ping</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/health</span></div>
                </div>
            </div>
        </section>

        {{-- ── Webhooks ── --}}
        <section id="webhooks">
            <div class="sec-head"><h2>Payment Webhooks</h2><span class="badge b-webhook">Webhook</span></div>
            <p class="sec-desc">
                Inbound callbacks from Monetapay (pay-in, disbursement, subscription) and the uxiolabs supplier.
                Public routes, throttled per IP — the real gate is the signature / source-IP check inside each handler.
            </p>
            <div class="grid">
                <div class="group">
                    <div class="group-title">Monetapay pay-in</div>
                    <div class="group-note">Double-MD5 signed. Point the VA / e-wallet / QRIS callback URL at any of these — same decrypt + verify + dispatch flow.</div>
                    <div class="ep"><span class="method m-post">POST</span><span class="path">/v1/payment/callback</span></div>
                    <div class="ep"><span class="method m-post">POST</span><span class="path">/v1/monetapay/va/callback</span></div>
                    <div class="ep"><span class="method m-post">POST</span><span class="path">/v1/monetapay/ewallet/callback</span></div>
                    <div class="ep"><span class="method m-post">POST</span><span class="path">/v1/monetapay/qris/callback</span></div>
                </div>
                <div class="group">
                    <div class="group-title">Monetapay lifecycle</div>
                    <div class="group-note">Disbursement result drives a withdrawal to SETTLED / FAILED; subscription events drive activation cycles.</div>
                    <div class="ep"><span class="method m-post">POST</span><span class="path">/v1/disbursement/merchant/callback</span></div>
                    <div class="ep"><span class="method m-post">POST</span><span class="path">/v1/monetapay/subscription/callback/active</span></div>
                    <div class="ep"><span class="method m-post">POST</span><span class="path">/v1/monetapay/subscription/callback/deduct/before</span></div>
                    <div class="ep"><span class="method m-post">POST</span><span class="path">/v1/monetapay/subscription/callback/deduct/after</span></div>
                </div>
                <div class="group">
                    <div class="group-title">Uxiolabs supplier</div>
                    <div class="group-note">Order fulfilment result. Authenticated by source IP (no signature) — finalises the transaction to COMPLETED / FAILED_PROVIDER.</div>
                    <div class="ep"><span class="method m-post">POST</span><span class="path">/v1/uxiolabs/callback</span></div>
                </div>
            </div>
        </section>

        {{-- ── Storefront ── --}}
        <section id="storefront">
            <div class="sec-head"><h2>Storefront</h2><span class="badge b-public">Public</span></div>
            <p class="sec-desc">
                The customer-facing catalog and checkout consumed by the React SPA. Anonymous, but each handler reads the
                bearer token when present, so a signed-in member is quoted their own tier price. Projections are deliberately
                narrow — <code>margin</code>, <code>price_modal</code> and supplier ids never leak.
            </p>
            <div class="grid">
                <div class="group">
                    <div class="group-title">Catalog</div>
                    <div class="group-note"><code>{game}</code> resolves by slug, code or id. Prices run through the same role ladder checkout charges.</div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/games</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/games/<span class="p-var">{game}</span></span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/games/<span class="p-var">{game}</span>/products</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/games/<span class="p-var">{game}</span>/reviews</span></div>
                    <div class="ep"><span class="method m-post">POST</span><span class="path">/v1/games/<span class="p-var">{game}</span>/validate-id</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/price-list</span></div>
                </div>
                <div class="group">
                    <div class="group-title">Checkout &amp; receipts</div>
                    <div class="group-note">Checkout is public (guest or member). Invoices are polled every 5s; order tracking takes an invoice number or phone.</div>
                    <div class="ep"><span class="method m-post">POST</span><span class="path">/v1/checkout</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/invoices/<span class="p-var">{invoiceNumber}</span></span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/invoices/<span class="p-var">{invoiceNumber}</span>/download</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/orders/track</span></div>
                    <div class="ep"><span class="method m-post">POST</span><span class="path">/v1/transactions/<span class="p-var">{invoiceNumber}</span>/rating</span></div>
                </div>
                <div class="group">
                    <div class="group-title">Content &amp; marketing</div>
                    <div class="group-note">Prefixed <code>/storefront</code> on purpose — the admin group already owns the un-prefixed paths.</div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/storefront/banners</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/storefront/announcements</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/storefront/leaderboard</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/storefront/articles</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/storefront/faqs</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/storefront/testimonials</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/storefront/settings</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/storefront/pages/<span class="p-var">{slug}</span></span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/storefront/payment-channels</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/storefront/flash-sale</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/storefront/promos</span></div>
                    <div class="ep"><span class="method m-post">POST</span><span class="path">/v1/storefront/promos/validate</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/storefront/membership-plans</span></div>
                </div>
            </div>
        </section>

        {{-- ── Auth ── --}}
        <section id="auth">
            <div class="sec-head"><h2>Authentication</h2><span class="badge b-public">Public</span></div>
            <p class="sec-desc">
                Sanctum token issue and account recovery. Registration always assigns the MEMBER role — role is never settable
                from the body. <code>forgot-password</code> gives the same response whether or not the email exists (no enumeration).
            </p>
            <div class="grid">
                <div class="group">
                    <div class="group-title">Sessions &amp; recovery</div>
                    <div class="group-note">All throttled per IP. <code>logout</code> requires a valid bearer token; <code>reset-password</code> revokes every existing token.</div>
                    <div class="ep"><span class="method m-post">POST</span><span class="path">/v1/auth/login</span></div>
                    <div class="ep"><span class="method m-post">POST</span><span class="path">/v1/auth/google</span></div>
                    <div class="ep"><span class="method m-post">POST</span><span class="path">/v1/auth/register</span></div>
                    <div class="ep"><span class="method m-post">POST</span><span class="path">/v1/auth/refresh</span></div>
                    <div class="ep"><span class="method m-post">POST</span><span class="path">/v1/auth/forgot-password</span></div>
                    <div class="ep"><span class="method m-post">POST</span><span class="path">/v1/auth/reset-password</span></div>
                    <div class="ep"><span class="method m-post">POST</span><span class="path">/v1/auth/logout</span></div>
                </div>
            </div>
        </section>

        {{-- ── Member ── --}}
        <section id="member">
            <div class="sec-head"><h2>Member Self-Service</h2><span class="badge b-auth">Authenticated</span></div>
            <p class="sec-desc">
                Everything a signed-in customer can see or change about themselves under <code>/v1/me</code>. Every query is
                scoped to the caller's <code>user_id</code> before any filter, so no filter combination can reach another
                customer's rows.
            </p>
            <div class="grid">
                <div class="group">
                    <div class="group-title">Profile &amp; activity</div>
                    <div class="group-note">Current user, timezone sync, dashboard, order history and the per-order rating.</div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/user</span></div>
                    <div class="ep"><span class="method m-patch">PATCH</span><span class="path">/v1/users/sync-timezone</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/me</span></div>
                    <div class="ep"><span class="method m-put">PUT</span><span class="path">/v1/me</span></div>
                    <div class="ep"><span class="method m-put">PUT</span><span class="path">/v1/me/password</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/me/dashboard</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/me/transactions</span></div>
                    <div class="ep"><span class="method m-post">POST</span><span class="path">/v1/me/transactions/<span class="p-var">{invoiceNumber}</span>/rating</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/me/activity-logs</span></div>
                </div>
                <div class="group">
                    <div class="group-title">Wallet &amp; membership</div>
                    <div class="group-note">Balance top-ups open a real payment (throttled like checkout), plus loyalty-tier subscription.</div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/me/topups</span></div>
                    <div class="ep"><span class="method m-post">POST</span><span class="path">/v1/me/topups</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/me/topups/<span class="p-var">{reference}</span></span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/me/balance-mutations</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/me/membership</span></div>
                    <div class="ep"><span class="method m-post">POST</span><span class="path">/v1/me/membership/subscribe</span></div>
                </div>
                <div class="group">
                    <div class="group-title">Integration credentials</div>
                    <div class="group-note">Personal API keys for members who resell through their own systems.</div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/me/api-credentials</span></div>
                    <div class="ep"><span class="method m-post">POST</span><span class="path">/v1/me/api-credentials</span></div>
                    <div class="ep"><span class="method m-put">PUT</span><span class="path">/v1/me/api-credentials/<span class="p-var">{id}</span></span></div>
                    <div class="ep"><span class="method m-post">POST</span><span class="path">/v1/me/api-credentials/<span class="p-var">{id}</span>/regenerate</span></div>
                    <div class="ep"><span class="method m-delete">DEL</span><span class="path">/v1/me/api-credentials/<span class="p-var">{id}</span></span></div>
                </div>
            </div>
        </section>

        {{-- ── Admin ── --}}
        <section id="admin">
            <div class="sec-head"><h2>Admin Management</h2><span class="badge b-admin">Admin</span></div>
            <p class="sec-desc">
                The back-office CRUD — <code>auth:sanctum</code> + the <code>admin</code> role gate. Catalog, pricing, content,
                the uxiolabs price checker and the Monetapay operator tools all live here.
            </p>
            <div class="grid">
                <div class="group">
                    <div class="group-title">Users &amp; overview</div>
                    <div class="group-note">User CRUD with audited wallet adjustments, plus dashboard, financial and reporting aggregates.</div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/users</span></div>
                    <div class="ep"><span class="method m-post">POST</span><span class="path">/v1/users/<span class="p-var">{user}</span>/balance-adjustments</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/dashboard/stats</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/dashboard/performance</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/financial/summary</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/reports/summary</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/activity-logs</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/integration/channels</span></div>
                </div>
                <div class="group">
                    <div class="group-title">Master data</div>
                    <div class="group-note">Category taxonomy, suppliers and the product / supplier-product catalog (with bulk pipelines).</div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/category-types</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/categories</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/sub-categories</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/server-categories</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/suppliers</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/products</span></div>
                    <div class="ep"><span class="method m-post">POST</span><span class="path">/v1/products/bulk-create</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/supplier-products</span></div>
                    <div class="ep"><span class="method m-post">POST</span><span class="path">/v1/supplier-products/bulk/promote-publish</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/pricing-rules</span></div>
                </div>
                <div class="group">
                    <div class="group-title">Uxiolabs tools</div>
                    <div class="group-note">Supplier balance, the manual price sync, pooled-SKU onboarding and the auto-repricer audit trail.</div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/uxiolabs/balance</span></div>
                    <div class="ep"><span class="method m-post">POST</span><span class="path">/v1/uxiolabs/sync-products</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/uxiolabs/price-list</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/uxiolabs/pool-candidates</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/uxiolabs/sku-preview</span></div>
                    <div class="ep"><span class="method m-post">POST</span><span class="path">/v1/uxiolabs/products</span></div>
                    <div class="ep"><span class="method m-post">POST</span><span class="path">/v1/uxiolabs/products/import</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/uxiolabs/price-change-logs</span></div>
                </div>
                <div class="group">
                    <div class="group-title">Monetapay operator</div>
                    <div class="group-note">Read-only inquiries mirroring the Monetapay spec, plus state-changing cancel / refund.</div>
                    <div class="ep"><span class="method m-post">POST</span><span class="path">/v1/monetapay/balance</span></div>
                    <div class="ep"><span class="method m-post">POST</span><span class="path">/v1/monetapay/payin/query</span></div>
                    <div class="ep"><span class="method m-post">POST</span><span class="path">/v1/monetapay/disbursement/create</span></div>
                    <div class="ep"><span class="method m-post">POST</span><span class="path">/v1/monetapay/disbursement/query</span></div>
                    <div class="ep"><span class="method m-post">POST</span><span class="path">/v1/monetapay/inquiry-account</span></div>
                    <div class="ep"><span class="method m-post">POST</span><span class="path">/v1/monetapay/cancel</span></div>
                    <div class="ep"><span class="method m-post">POST</span><span class="path">/v1/monetapay/refund</span></div>
                </div>
                <div class="group">
                    <div class="group-title">Transactions &amp; payments</div>
                    <div class="group-note">Full transaction lifecycle control — export, recap, manual review, refund, retry and callback replay.</div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/transactions</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/transactions/export</span></div>
                    <div class="ep"><span class="method m-post">POST</span><span class="path">/v1/transactions/<span class="p-var">{id}</span>/manual-review</span></div>
                    <div class="ep"><span class="method m-post">POST</span><span class="path">/v1/transactions/<span class="p-var">{id}</span>/refund</span></div>
                    <div class="ep"><span class="method m-post">POST</span><span class="path">/v1/transactions/<span class="p-var">{id}</span>/retry</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/payments</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/ratings</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/point-histories</span></div>
                </div>
                <div class="group">
                    <div class="group-title">Content &amp; marketing</div>
                    <div class="group-note">CMS resources plus the storefront's banners, announcements, flash sales and promos.</div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/articles</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/faqs</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/pages</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/testimonials</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/banners</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/announcements</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/flash-sales</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/promos</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/membership-plans</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/payment-channels</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/settings</span></div>
                </div>
            </div>
        </section>

        {{-- ── Payment: Merchant ── --}}
        <section id="merchant">
            <div class="sec-head"><h2>Payment Page · Merchant</h2><span class="badge b-merchant">Merchant</span></div>
            <p class="sec-desc">
                The client's own view under <code>/v1/payment-admin</code> (<code>payment-admin</code> role). Every handler
                additionally scopes to the caller's id, so the role gate is defence-in-depth. A merchant sees its own sales,
                requests withdrawals and pays for the services it subscribes to.
            </p>
            <div class="grid">
                <div class="group">
                    <div class="group-title">Dashboard &amp; money</div>
                    <div class="group-note">Sales, mutations, and the two-stage withdrawal request (holding period applies).</div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/payment-admin/dashboard</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/payment-admin/transactions</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/payment-admin/transactions/summary</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/payment-admin/mutations</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/payment-admin/withdrawals</span></div>
                    <div class="ep"><span class="method m-post">POST</span><span class="path">/v1/payment-admin/withdrawals</span></div>
                </div>
                <div class="group">
                    <div class="group-title">Services &amp; invoices</div>
                    <div class="group-note">Browse the catalog kita sells, view subscriptions and settle bills — a bill can always be re-paid until due.</div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/payment-admin/services</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/payment-admin/service-subscriptions</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/payment-admin/payment-channels</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/payment-admin/service-invoices</span></div>
                    <div class="ep"><span class="method m-post">POST</span><span class="path">/v1/payment-admin/service-invoices</span></div>
                    <div class="ep"><span class="method m-post">POST</span><span class="path">/v1/payment-admin/service-invoices/<span class="p-var">{id}</span>/pay</span></div>
                </div>
                <div class="group">
                    <div class="group-title">Installation &amp; status</div>
                    <div class="group-note">Read-only view of kita's setup work; <code>reveal</code> is POST so credentials aren't proxy-cached.</div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/payment-admin/service-subscriptions/<span class="p-var">{id}</span>/installation</span></div>
                    <div class="ep"><span class="method m-post">POST</span><span class="path">/v1/payment-admin/installation-details/<span class="p-var">{id}</span>/reveal</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/payment-admin/service-status</span></div>
                </div>
            </div>
        </section>

        {{-- ── Payment: Internal ── --}}
        <section id="internal">
            <div class="sec-head"><h2>Payment Page · Internal</h2><span class="badge b-internal">Internal</span></div>
            <p class="sec-desc">
                Kita's cross-merchant view under <code>/v1/payment-internal</code> (<code>payment-internal</code> role):
                every merchant's data, withdrawal verification, per-channel fee settings, the service catalog it sells and
                the installation work behind each subscription.
            </p>
            <div class="grid">
                <div class="group">
                    <div class="group-title">Overview &amp; withdrawals</div>
                    <div class="group-note">Cross-merchant dashboard, notifications, and the approve / reject leg of every payout.</div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/payment-internal/dashboard</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/payment-internal/notifications</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/payment-internal/merchants</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/payment-internal/transactions</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/payment-internal/withdrawals</span></div>
                    <div class="ep"><span class="method m-post">POST</span><span class="path">/v1/payment-internal/withdrawals/<span class="p-var">{id}</span>/approve</span></div>
                    <div class="ep"><span class="method m-post">POST</span><span class="path">/v1/payment-internal/withdrawals/<span class="p-var">{id}</span>/reject</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/payment-internal/platform-balance</span></div>
                </div>
                <div class="group">
                    <div class="group-title">Channels &amp; services</div>
                    <div class="group-note">Per-method fees (the "Biaya Admin"), the service catalog, subscriptions and manual bill verification.</div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/payment-internal/channels</span></div>
                    <div class="ep"><span class="method m-put">PUT</span><span class="path">/v1/payment-internal/channels/<span class="p-var">{id}</span></span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/payment-internal/services</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/payment-internal/service-invoices</span></div>
                    <div class="ep"><span class="method m-post">POST</span><span class="path">/v1/payment-internal/service-invoices/<span class="p-var">{id}</span>/confirm</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/payment-internal/service-subscriptions</span></div>
                </div>
                <div class="group">
                    <div class="group-title">Installation &amp; incidents</div>
                    <div class="group-note">The install window, milestone checklist and stored credentials, plus the incidents driving the status page.</div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/payment-internal/service-subscriptions/<span class="p-var">{id}</span>/installation</span></div>
                    <div class="ep"><span class="method m-post">POST</span><span class="path">/v1/payment-internal/installations/<span class="p-var">{id}</span>/steps</span></div>
                    <div class="ep"><span class="method m-post">POST</span><span class="path">/v1/payment-internal/installations/<span class="p-var">{id}</span>/detail-items</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/payment-internal/incidents</span></div>
                </div>
            </div>
        </section>

        {{-- ── Hub ── --}}
        <section id="hub">
            <div class="sec-head"><h2>Uxio Hub</h2><span class="badge b-hub">Hub</span></div>
            <p class="sec-desc">
                Read-only summaries the central Uxio Hub pulls on a schedule. Gated by <code>X-Hub-Key</code> (+ optional IP
                allowlist) — dead when no key is configured, so a standalone deployment exposes nothing. Additive-only contract:
                fields may be added, never renamed or removed.
            </p>
            <div class="grid">
                <div class="group">
                    <div class="group-title">Reporting contract</div>
                    <div class="group-note">Consolidated per-site figures the Hub aggregates across every deployment.</div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/hub/summary</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/hub/withdrawals</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/hub/service-orders</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/hub/profit</span></div>
                    <div class="ep"><span class="method m-get">GET</span><span class="path">/v1/hub/channels</span></div>
                </div>
            </div>
        </section>

    </main>

    <div class="wrap">
        <footer>
            <span>{{ config('app.name', 'Web Topup') }} · API v1 · Laravel {{ app()->version() }}</span>
            <span>
                <a href="{{ $base }}/api/v1/health">Status</a> ·
                Env: {{ app()->environment() }}
            </span>
        </footer>
    </div>
</body>
</html>
