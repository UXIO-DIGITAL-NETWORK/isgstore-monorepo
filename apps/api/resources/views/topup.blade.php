<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex,nofollow">
    <title>Top Up — {{ config('app.name') }}</title>
    <style>
        :root {
            --bg: #0b1020;
            --panel: #141b31;
            --panel-2: #1b2440;
            --line: #263156;
            --text: #e8ecf8;
            --muted: #93a0c4;
            --accent: #4f7cff;
            --accent-2: #7aa2ff;
            --ok: #22c55e;
            --warn: #f59e0b;
            --err: #ef4444;
            --radius: 14px;
        }

        * { box-sizing: border-box; }

        body {
            margin: 0;
            background: radial-gradient(1200px 600px at 50% -200px, #1c2751 0%, var(--bg) 60%);
            color: var(--text);
            font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            font-size: 15px;
            line-height: 1.5;
            min-height: 100vh;
        }

        .wrap { max-width: 880px; margin: 0 auto; padding: 24px 16px 64px; }

        header.top { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
        header.top h1 { font-size: 20px; margin: 0; letter-spacing: -0.01em; }
        header.top .badge {
            margin-left: auto; font-size: 12px; color: var(--muted);
            border: 1px solid var(--line); padding: 4px 10px; border-radius: 999px;
        }

        .card {
            background: var(--panel);
            border: 1px solid var(--line);
            border-radius: var(--radius);
            padding: 18px;
            margin-bottom: 16px;
        }

        .step-head { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
        .step-no {
            width: 24px; height: 24px; border-radius: 50%;
            background: var(--accent); color: #fff;
            display: grid; place-items: center; font-size: 13px; font-weight: 600; flex: none;
        }
        .step-head h2 { font-size: 15px; margin: 0; font-weight: 600; }
        .step-head .hint { margin-left: auto; font-size: 12px; color: var(--muted); }

        .grid-games {
            display: grid; gap: 10px;
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            max-height: 420px; overflow-y: auto;
        }
        .game {
            display: flex; align-items: center; gap: 10px; text-align: left;
            background: var(--panel-2); border: 1px solid var(--line); color: var(--text);
            border-radius: 12px; padding: 10px; cursor: pointer; font: inherit;
            transition: border-color .15s, transform .15s;
        }
        .game:hover { border-color: var(--accent-2); }
        .game[aria-pressed="true"] { border-color: var(--accent); background: #22305c; }
        .game .thumb {
            width: 38px; height: 38px; border-radius: 9px; flex: none;
            background: linear-gradient(140deg, #3d54a5, #24325f);
            display: grid; place-items: center; font-weight: 700; font-size: 13px; overflow: hidden;
        }
        .game .thumb img { width: 100%; height: 100%; object-fit: cover; }
        .game .meta { min-width: 0; }
        .game .nm { display: block; font-size: 13px; font-weight: 600; line-height: 1.25; }
        .game .sub { display: block; font-size: 11px; color: var(--muted); }

        .grid-products { display: grid; gap: 10px; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); }
        .group-title { font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; margin: 14px 0 8px; }
        .group-title:first-child { margin-top: 0; }
        .product {
            background: var(--panel-2); border: 1px solid var(--line); color: var(--text);
            border-radius: 12px; padding: 12px; cursor: pointer; text-align: left; font: inherit;
            display: flex; flex-direction: column; gap: 6px; min-height: 74px;
            transition: border-color .15s;
        }
        .product:hover { border-color: var(--accent-2); }
        .product[aria-pressed="true"] { border-color: var(--accent); background: #22305c; }
        .product .pn { font-size: 13px; font-weight: 600; line-height: 1.3; }
        .product .pp { font-size: 13px; color: var(--accent-2); font-weight: 700; margin-top: auto; }

        label.field { display: block; margin-bottom: 12px; }
        label.field span.lb { display: block; font-size: 13px; margin-bottom: 6px; color: var(--muted); }
        input[type="text"], input[type="tel"], select, textarea {
            width: 100%; background: var(--panel-2); color: var(--text);
            border: 1px solid var(--line); border-radius: 10px; padding: 11px 12px;
            font: inherit; outline: none;
        }
        input:focus, select:focus, textarea:focus { border-color: var(--accent); }
        select { appearance: none; }

        .channels { display: grid; gap: 8px; }
        .channel {
            display: flex; align-items: center; gap: 12px;
            background: var(--panel-2); border: 1px solid var(--line);
            border-radius: 12px; padding: 12px; cursor: pointer;
        }
        .channel:hover { border-color: var(--accent-2); }
        .channel.selected { border-color: var(--accent); background: #22305c; }
        .channel.disabled { opacity: .45; cursor: not-allowed; }
        .channel input { accent-color: var(--accent); }
        .channel .cn { font-size: 14px; font-weight: 600; }
        .channel .ct { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; }
        .channel .amt { margin-left: auto; text-align: right; font-size: 13px; }
        .channel .amt b { display: block; font-size: 14px; }
        .channel .amt small { color: var(--muted); font-size: 11px; }

        .summary { display: grid; gap: 6px; font-size: 14px; margin-bottom: 14px; }
        .summary div { display: flex; justify-content: space-between; gap: 12px; }
        .summary .total { border-top: 1px solid var(--line); padding-top: 8px; font-weight: 700; font-size: 16px; }
        .summary .k { color: var(--muted); }

        button.primary {
            width: 100%; background: var(--accent); color: #fff; border: 0;
            border-radius: 12px; padding: 14px; font: inherit; font-weight: 700;
            cursor: pointer; font-size: 15px;
        }
        button.primary:hover { background: var(--accent-2); }
        button.primary:disabled { background: #35406b; color: var(--muted); cursor: not-allowed; }

        .alert { border-radius: 10px; padding: 11px 13px; font-size: 13px; margin-bottom: 12px; }
        .alert.err { background: rgba(239, 68, 68, .12); border: 1px solid rgba(239, 68, 68, .4); color: #fecaca; }
        .alert.info { background: rgba(79, 124, 255, .12); border: 1px solid rgba(79, 124, 255, .4); color: #c7d6ff; }
        .alert ul { margin: 6px 0 0; padding-left: 18px; }

        .qr-box { background: #fff; padding: 14px; border-radius: 12px; display: inline-block; }
        .qr-box canvas, .qr-box img { display: block; }

        .va {
            font-size: 24px; font-weight: 700; letter-spacing: .06em;
            background: var(--panel-2); border: 1px dashed var(--line);
            border-radius: 12px; padding: 14px; text-align: center; word-break: break-all;
        }

        .pill { display: inline-block; font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 999px; letter-spacing: .03em; }
        .pill.PENDING { background: rgba(245, 158, 11, .15); color: #fcd34d; }
        .pill.PAID, .pill.PROCESSING { background: rgba(79, 124, 255, .18); color: var(--accent-2); }
        .pill.COMPLETED { background: rgba(34, 197, 94, .15); color: #86efac; }
        .pill.EXPIRED, .pill.FAILED_PROVIDER, .pill.REFUNDED { background: rgba(239, 68, 68, .15); color: #fca5a5; }

        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { text-align: left; color: var(--muted); font-weight: 500; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; padding: 0 8px 8px 0; }
        td { padding: 9px 8px 9px 0; border-top: 1px solid var(--line); vertical-align: top; }
        td.num { text-align: right; white-space: nowrap; }
        .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }

        .muted { color: var(--muted); }
        .empty { color: var(--muted); font-size: 13px; padding: 8px 0; }
        .hidden { display: none !important; }
        .copy {
            background: transparent; border: 1px solid var(--line); color: var(--muted);
            border-radius: 8px; padding: 5px 10px; font: inherit; font-size: 12px; cursor: pointer;
        }
        .copy:hover { color: var(--text); border-color: var(--accent-2); }
        .row-actions { display: flex; gap: 10px; align-items: center; margin-top: 10px; flex-wrap: wrap; }
        a.paylink { color: var(--accent-2); font-weight: 600; }
    </style>
</head>
<body>
<div class="wrap">

    <header class="top">
        <h1>Top Up</h1>
        <span class="badge">{{ config('app.name') }}</span>
    </header>

    @if ($games->isEmpty() || $channels->isEmpty())
        <div class="alert err">
            <b>Katalog belum siap.</b>
            <ul>
                @if ($games->isEmpty())
                    <li>Belum ada game dengan produk aktif yang terhubung ke supplier aktif.</li>
                @endif
                @if ($channels->isEmpty())
                    <li>Belum ada metode pembayaran aktif (tabel <span class="mono">payment_channels</span> kosong).</li>
                @endif
            </ul>
        </div>
    @endif

    {{-- 1. Game --}}
    <section class="card">
        <div class="step-head">
            <span class="step-no">1</span>
            <h2>Pilih Game / Layanan</h2>
            <span class="hint">{{ $games->count() }} tersedia</span>
        </div>
        <div class="grid-games" id="games">
            @foreach ($games as $game)
                <button type="button" class="game" aria-pressed="false"
                        data-id="{{ $game['id'] }}" data-name="{{ $game['name'] }}">
                    <span class="thumb">
                        @if ($game['logo_url'])
                            <img src="{{ $game['logo_url'] }}" alt="">
                        @else
                            {{ $game['initials'] }}
                        @endif
                    </span>
                    <span class="meta">
                        <span class="nm">{{ $game['name'] }}</span>
                        @if ($game['sub_name'])
                            <span class="sub">{{ $game['sub_name'] }}</span>
                        @endif
                    </span>
                </button>
            @endforeach
        </div>
    </section>

    {{-- 2. Nominal --}}
    <section class="card hidden" id="step-product">
        <div class="step-head">
            <span class="step-no">2</span>
            <h2>Pilih Nominal</h2>
        </div>
        <div id="products"></div>
    </section>

    {{-- 3. Data akun --}}
    <section class="card hidden" id="step-account">
        <div class="step-head">
            <span class="step-no">3</span>
            <h2>Data Akun</h2>
        </div>
        <div id="account-fields"></div>
        <label class="field">
            <span class="lb">Nomor WhatsApp <span class="muted">(untuk bukti transaksi)</span></span>
            <input type="tel" id="contact" maxlength="20" placeholder="08xxxxxxxxxx" autocomplete="tel">
        </label>
    </section>

    {{-- 4. Pembayaran --}}
    <section class="card hidden" id="step-payment">
        <div class="step-head">
            <span class="step-no">4</span>
            <h2>Metode Pembayaran</h2>
        </div>
        <div class="channels" id="channels"></div>
    </section>

    {{-- 5. Bayar --}}
    <section class="card hidden" id="step-submit">
        <div id="checkout-error"></div>
        <div class="summary" id="summary"></div>
        <button type="button" class="primary" id="pay" disabled>Lanjutkan Pembayaran</button>
    </section>

    {{-- Hasil --}}
    <section class="card hidden" id="result">
        <div class="step-head"><h2>Instruksi Pembayaran</h2></div>
        <div id="result-body"></div>
    </section>

    {{-- Riwayat --}}
    <section class="card hidden" id="history">
        <div class="step-head">
            <h2>Pesanan Saya</h2>
            <span class="hint">diperbarui otomatis</span>
        </div>
        <table>
            <thead>
            <tr>
                <th>Invoice</th>
                <th>Produk</th>
                <th style="text-align:right">Total</th>
                <th style="text-align:right">Status</th>
            </tr>
            </thead>
            <tbody id="history-rows"></tbody>
        </table>
    </section>

</div>

{{-- qrcodejs 1.0.0 (MIT, davidshimjs) — vendored so the page has no external dependency --}}
<script src="{{ asset('js/qrcode.min.js') }}"></script>
<script>
(function () {
    'use strict';

    var CHANNELS = @json($channels);
    var STORE_KEY = 'topup.invoices';

    var state = { game: null, product: null, fields: [], channel: null };

    var $ = function (id) { return document.getElementById(id); };
    var rupiah = function (n) { return 'Rp ' + Number(n || 0).toLocaleString('id-ID'); };
    var esc = function (s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    };
    var show = function (id, on) { $(id).classList.toggle('hidden', !on); };

    // Mirrors CheckoutAction: fee_flat + round(price * clamp(fee_percent, 0, 100) / 100)
    function feeFor(channel, price) {
        var pct = Math.min(100, Math.max(0, Number(channel.fee_percent) || 0));
        return Number(channel.fee_flat || 0) + Math.round(price * pct / 100);
    }

    // ── Step 1: game ────────────────────────────────────────────────────────
    $('games').addEventListener('click', function (e) {
        var btn = e.target.closest('.game');
        if (!btn) return;

        Array.prototype.forEach.call(this.querySelectorAll('.game'), function (b) {
            b.setAttribute('aria-pressed', String(b === btn));
        });

        state.game = { id: btn.dataset.id, name: btn.dataset.name };
        state.product = null;
        loadGame(btn.dataset.id);
    });

    function loadGame(id) {
        $('products').innerHTML = '<div class="empty">Memuat…</div>';
        show('step-product', true);
        show('step-account', false);
        show('step-payment', false);
        show('step-submit', false);

        fetch('/topup/games/' + encodeURIComponent(id) + '/products', {
            headers: { 'Accept': 'application/json' }
        })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                state.fields = data.fields || [];
                renderProducts(data.products || []);
                renderAccountFields(state.fields);
            })
            .catch(function () {
                $('products').innerHTML = '<div class="alert err">Gagal memuat produk. Coba lagi.</div>';
            });
    }

    // ── Step 2: denominations ───────────────────────────────────────────────
    function renderProducts(products) {
        if (!products.length) {
            $('products').innerHTML = '<div class="empty">Belum ada nominal tersedia untuk layanan ini.</div>';
            return;
        }

        var groups = {}, order = [];
        products.forEach(function (p) {
            if (!groups[p.group]) { groups[p.group] = []; order.push(p.group); }
            groups[p.group].push(p);
        });

        var html = '';
        order.forEach(function (g) {
            html += '<div class="group-title">' + esc(g) + '</div><div class="grid-products">';
            groups[g].forEach(function (p) {
                html += '<button type="button" class="product" aria-pressed="false"' +
                    ' data-id="' + p.id + '" data-price="' + p.price + '" data-name="' + esc(p.name) + '">' +
                    '<span class="pn">' + esc(p.name) + '</span>' +
                    '<span class="pp">' + rupiah(p.price) + '</span>' +
                    '</button>';
            });
            html += '</div>';
        });

        $('products').innerHTML = html;
    }

    $('products').addEventListener('click', function (e) {
        var btn = e.target.closest('.product');
        if (!btn) return;

        Array.prototype.forEach.call(this.querySelectorAll('.product'), function (b) {
            b.setAttribute('aria-pressed', String(b === btn));
        });

        state.product = {
            id: Number(btn.dataset.id),
            price: Number(btn.dataset.price),
            name: btn.dataset.name
        };

        show('step-account', true);
        show('step-payment', true);
        show('step-submit', true);
        renderChannels();
        refresh();
    });

    // ── Step 3: per-game account fields ─────────────────────────────────────
    // Field #1 becomes target_uid and field #2 becomes target_server — the
    // checkout endpoint accepts no other identity fields.
    function renderAccountFields(fields) {
        var html = '';

        fields.forEach(function (f, i) {
            var id = 'f_' + i;
            html += '<label class="field"><span class="lb">' + esc(f.label) +
                (f.required ? '' : ' <span class="muted">(opsional)</span>') + '</span>';

            if (f.type === 'select' && f.options && f.options.length) {
                html += '<select id="' + id + '" data-idx="' + i + '"><option value="">— pilih —</option>';
                f.options.forEach(function (o) {
                    html += '<option value="' + esc(o.value) + '">' + esc(o.label) + '</option>';
                });
                html += '</select>';
            } else {
                html += '<input type="text" id="' + id + '" data-idx="' + i + '" placeholder="' + esc(f.label) + '">';
            }

            html += '</label>';
        });

        $('account-fields').innerHTML = html;
    }

    // ── Step 4: payment channels ────────────────────────────────────────────
    function renderChannels() {
        var price = state.product ? state.product.price : 0;
        var typeLabels = {
            virtual_account: 'Virtual Account',
            qris: 'QRIS',
            ewallet: 'E-Wallet',
            convenience_store: 'Gerai Retail',
            payment_link: 'Payment Link'
        };

        var html = '';
        CHANNELS.forEach(function (c) {
            var fee = feeFor(c, price);
            var total = price + fee;
            var blocked = total < Number(c.min_amount || 0);
            var checked = state.channel && state.channel.id === c.id && !blocked;

            html += '<label class="channel' + (blocked ? ' disabled' : '') + (checked ? ' selected' : '') + '">' +
                '<input type="radio" name="channel" value="' + c.id + '"' +
                (blocked ? ' disabled' : '') + (checked ? ' checked' : '') + '>' +
                '<span><span class="cn">' + esc(c.name) + '</span><br>' +
                '<span class="ct">' + esc(typeLabels[c.payment_type] || c.payment_type) + '</span></span>' +
                '<span class="amt"><b>' + rupiah(total) + '</b>' +
                (blocked
                    ? '<small>min. ' + rupiah(c.min_amount) + '</small>'
                    : '<small>' + (fee > 0 ? 'termasuk biaya ' + rupiah(fee) : 'tanpa biaya admin') + '</small>') +
                '</span></label>';
        });

        $('channels').innerHTML = html || '<div class="empty">Tidak ada metode pembayaran aktif.</div>';

        if (state.channel && !CHANNELS.some(function (c) {
            return c.id === state.channel.id && (price + feeFor(c, price)) >= Number(c.min_amount || 0);
        })) {
            state.channel = null;
        }
    }

    $('channels').addEventListener('change', function (e) {
        if (e.target.name !== 'channel') return;

        var id = Number(e.target.value);
        state.channel = CHANNELS.filter(function (c) { return c.id === id; })[0] || null;

        Array.prototype.forEach.call(this.querySelectorAll('.channel'), function (l) {
            l.classList.toggle('selected', l.contains(e.target));
        });

        refresh();
    });

    document.addEventListener('input', refresh);
    document.addEventListener('change', refresh);

    // ── Summary + validation ────────────────────────────────────────────────
    function readFieldValues() {
        return state.fields.map(function (f, i) {
            var el = $('f_' + i);
            return { field: f, value: el ? el.value.trim() : '' };
        });
    }

    function isReady() {
        if (!state.product || !state.channel) return false;
        if (!$('contact').value.trim()) return false;

        return readFieldValues().every(function (v) {
            return !v.field.required || v.value !== '';
        });
    }

    function refresh() {
        if (!state.product) return;

        var price = state.product.price;
        var fee = state.channel ? feeFor(state.channel, price) : 0;

        $('summary').innerHTML =
            '<div><span class="k">Produk</span><span>' + esc(state.product.name) + '</span></div>' +
            '<div><span class="k">Harga</span><span>' + rupiah(price) + '</span></div>' +
            '<div><span class="k">Biaya admin</span><span>' + (state.channel ? rupiah(fee) : '—') + '</span></div>' +
            '<div class="total"><span>Total</span><span>' + (state.channel ? rupiah(price + fee) : '—') + '</span></div>';

        $('pay').disabled = !isReady();
    }

    // ── Checkout → real POST /api/v1/checkout ───────────────────────────────
    $('pay').addEventListener('click', function () {
        if (!isReady()) return;

        var values = readFieldValues();
        var payload = {
            product_id: state.product.id,
            payment_channel_id: state.channel.id,
            target_uid: values[0] ? values[0].value : '',
            guest_contact: $('contact').value.trim()
        };
        if (values[1] && values[1].value) payload.target_server = values[1].value;

        var btn = this;
        btn.disabled = true;
        btn.textContent = 'Memproses…';
        $('checkout-error').innerHTML = '';

        fetch('/api/v1/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(function (r) {
                return r.json().catch(function () { return {}; }).then(function (body) {
                    return { ok: r.ok, status: r.status, body: body };
                });
            })
            .then(function (res) {
                if (res.ok && res.body && res.body.data) {
                    remember(res.body.data.invoice_number);
                    renderResult(res.body.data);
                    loadHistory();
                    $('result').scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                    showCheckoutError(res);
                }
            })
            .catch(function () {
                $('checkout-error').innerHTML =
                    '<div class="alert err">Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.</div>';
            })
            .then(function () {
                btn.disabled = !isReady();
                btn.textContent = 'Lanjutkan Pembayaran';
            });
    });

    function showCheckoutError(res) {
        var body = res.body || {};
        var msg = body.message || 'Checkout gagal.';

        if (res.status === 429) msg = 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.';

        var html = '<div class="alert err"><b>' + esc(msg) + '</b>';
        if (body.errors) {
            html += '<ul>';
            Object.keys(body.errors).forEach(function (k) {
                [].concat(body.errors[k]).forEach(function (m) { html += '<li>' + esc(m) + '</li>'; });
            });
            html += '</ul>';
        }
        $('checkout-error').innerHTML = html + '</div>';
    }

    // ── Result panel ────────────────────────────────────────────────────────
    function renderResult(data) {
        var pay = data.payment || {};
        var ins = pay.instructions || {};
        var html = '';

        html += '<div class="summary">' +
            '<div><span class="k">Invoice</span><span class="mono">' + esc(data.invoice_number) + '</span></div>' +
            '<div><span class="k">Produk</span><span>' + esc(data.product ? data.product.name : '') + '</span></div>' +
            '<div><span class="k">Metode</span><span>' + esc(pay.channel || '') + '</span></div>' +
            '<div><span class="k">Biaya admin</span><span>' + rupiah(pay.admin_fee) + '</span></div>' +
            '<div class="total"><span>Total bayar</span><span>' + rupiah(pay.amount) + '</span></div>' +
            '</div>';

        html += '<div style="margin-bottom:12px"><span class="pill ' + esc(pay.status) + '">' + esc(pay.status) + '</span></div>';

        if (ins.qr_string) {
            html += '<div class="alert info">Scan QR berikut dengan aplikasi e-wallet atau mobile banking Anda.</div>' +
                '<div class="qr-box" id="qr"></div>' +
                '<div class="row-actions"><button type="button" class="copy" data-copy="' + esc(ins.qr_string) + '">Salin kode QR</button></div>';
        } else if (ins.virtual_account) {
            html += '<div class="alert info">Transfer tepat sejumlah total di atas ke nomor Virtual Account berikut' +
                (ins.bank_code ? ' (' + esc(ins.bank_code) + ')' : '') + '.</div>' +
                '<div class="va">' + esc(ins.virtual_account) + '</div>' +
                '<div class="row-actions"><button type="button" class="copy" data-copy="' + esc(ins.virtual_account) + '">Salin nomor VA</button></div>';
        } else if (ins.checkout_url) {
            html += '<div class="alert info">Lanjutkan pembayaran di halaman berikut.</div>' +
                '<a class="paylink" href="' + esc(ins.checkout_url) + '" target="_blank" rel="noopener">Buka halaman pembayaran →</a>';
        } else if (ins.redirect_url || ins.deeplink_url) {
            html += '<div class="alert info">Lanjutkan pembayaran di aplikasi e-wallet Anda.</div>' +
                '<a class="paylink" href="' + esc(ins.redirect_url || ins.deeplink_url) + '" target="_blank" rel="noopener">Bayar sekarang →</a>';
        } else {
            html += '<div class="alert info">Pesanan dibuat. Status akan diperbarui otomatis pada tabel di bawah.</div>';
        }

        $('result-body').innerHTML = html;
        show('result', true);

        if (ins.qr_string) drawQr(ins.qr_string);
    }

    function drawQr(text) {
        var box = $('qr');
        if (!box) return;

        if (typeof QRCode === 'undefined') {
            // Library missing — fall back to the raw payload so the purchase is still completable.
            box.outerHTML = '<textarea class="mono" rows="4" readonly ' +
                'style="width:100%">' + esc(text) + '</textarea>';
            return;
        }

        new QRCode(box, { text: text, width: 240, height: 240, correctLevel: QRCode.CorrectLevel.M });
    }

    document.addEventListener('click', function (e) {
        var btn = e.target.closest('.copy');
        if (!btn || !navigator.clipboard) return;

        navigator.clipboard.writeText(btn.dataset.copy).then(function () {
            var old = btn.textContent;
            btn.textContent = 'Tersalin ✓';
            setTimeout(function () { btn.textContent = old; }, 1500);
        });
    });

    // ── Order history (this browser only) ───────────────────────────────────
    function stored() {
        try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; } catch (e) { return []; }
    }

    function remember(invoice) {
        if (!invoice) return;
        var list = stored().filter(function (i) { return i !== invoice; });
        list.unshift(invoice);
        try { localStorage.setItem(STORE_KEY, JSON.stringify(list.slice(0, 20))); } catch (e) { /* ignore */ }
    }

    function loadHistory() {
        var list = stored();
        if (!list.length) return;

        fetch('/topup/orders?invoices=' + encodeURIComponent(list.join(',')), {
            headers: { 'Accept': 'application/json' }
        })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                var rows = res.data || [];
                if (!rows.length) return;

                $('history-rows').innerHTML = rows.map(function (o) {
                    return '<tr>' +
                        '<td class="mono">' + esc(o.invoice_number) +
                        (o.sn ? '<br><span class="muted">SN: ' + esc(o.sn) + '</span>' : '') + '</td>' +
                        '<td>' + esc(o.product_name || '—') + '</td>' +
                        '<td class="num">' + rupiah(o.amount_total) + '</td>' +
                        '<td class="num"><span class="pill ' + esc(o.status) + '">' + esc(o.status) + '</span></td>' +
                        '</tr>';
                }).join('');

                show('history', true);
            })
            .catch(function () { /* keep the last known rows */ });
    }

    loadHistory();
    setInterval(loadHistory, 5000);
})();
</script>
</body>
</html>
