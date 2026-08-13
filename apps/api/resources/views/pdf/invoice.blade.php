@php
    $rp = fn ($n) => 'Rp ' . number_format((int) $n, 0, ',', '.');
    $muted = '#9aa0ac';
    $text = '#ECEDEE';

    $rows = array_filter([
        __('receipt.label_invoice') => $invoice,
        __('receipt.label_date') => $date,
        __('receipt.label_game') => $gameName,
        __('receipt.label_product') => $productName,
        __('receipt.label_target') => $target,
        __('receipt.label_payment') => $paymentName,
        __('receipt.label_serial') => $serial,
    ], fn ($v) => filled($v));
@endphp
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        @page { margin: 0; }
        * { font-family: 'DejaVu Sans', sans-serif; }
        body { margin: 0; padding: 28px; background-color: #0A0A0C; color: {{ $text }}; }
        .card { background-color: #0D1117; border: 1px solid #2a2140; border-radius: 12px; }
        .muted { color: {{ $muted }}; font-size: 11px; }
        .val { color: {{ $text }}; font-size: 12px; font-weight: bold; }
        .section { color: #b794f4; font-size: 10px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; }
    </style>
</head>
<body>
    {{-- Header --}}
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#7c3aed; border-radius:14px;">
        <tr>
            <td style="padding:22px 26px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="font-size:20px; font-weight:bold; letter-spacing:1px; color:#ffffff; text-transform:uppercase;">
                            {{ $brand }}
                        </td>
                        <td align="right" style="color:#ffffff; font-size:12px; font-weight:bold;">
                            {{ $statusText }}
                        </td>
                    </tr>
                </table>
                <div style="margin-top:6px; color:#ede9fe; font-size:14px; font-weight:bold;">{{ __('receipt.title') }}</div>
            </td>
        </tr>
    </table>

    {{-- Order details --}}
    <table width="100%" cellpadding="0" cellspacing="0" class="card" style="margin-top:18px;">
        <tr>
            <td style="padding:18px 22px;">
                <div class="section" style="margin-bottom:12px;">{{ __('receipt.section_order') }}</div>
                <table width="100%" cellpadding="0" cellspacing="0">
                    @foreach ($rows as $label => $value)
                        <tr>
                            <td style="padding:6px 0; width:45%;" class="muted">{{ $label }}</td>
                            <td align="right" style="padding:6px 0;" class="val">{{ $value }}</td>
                        </tr>
                    @endforeach
                </table>
            </td>
        </tr>
    </table>

    {{-- Payment summary --}}
    <table width="100%" cellpadding="0" cellspacing="0" class="card" style="margin-top:14px;">
        <tr>
            <td style="padding:18px 22px;">
                <div class="section" style="margin-bottom:12px;">{{ __('receipt.section_payment') }}</div>
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="padding:5px 0;" class="muted">{{ __('receipt.label_subtotal') }}</td>
                        <td align="right" style="padding:5px 0;" class="val">{{ $rp($subtotal) }}</td>
                    </tr>
                    @if (($adminFee ?? 0) > 0)
                        <tr>
                            <td style="padding:5px 0;" class="muted">{{ __('receipt.label_admin_fee') }}</td>
                            <td align="right" style="padding:5px 0;" class="val">{{ $rp($adminFee) }}</td>
                        </tr>
                    @endif
                    @if ($discount > 0)
                        <tr>
                            <td style="padding:5px 0;" class="muted">{{ __('receipt.label_discount') }}</td>
                            <td align="right" style="padding:5px 0; color:#22c55e; font-size:12px; font-weight:bold;">- {{ $rp($discount) }}</td>
                        </tr>
                    @endif
                    <tr><td colspan="2" style="padding:8px 0 0;"><div style="border-top:1px solid #2a2140;"></div></td></tr>
                    <tr>
                        <td style="padding:10px 0 0; font-size:14px; font-weight:bold; color:{{ $text }};">{{ __('receipt.label_total') }}</td>
                        <td align="right" style="padding:10px 0 0; font-size:17px; font-weight:bold; color:#ffffff;">{{ $rp($total) }}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    {{-- Footer --}}
    <div style="margin-top:20px; text-align:center;" class="muted">
        &copy; {{ date('Y') }} {{ $brand }}. {{ __('receipt.footer_rights') }}
    </div>
</body>
</html>
