@php
    // One definition, in App\Support\Money — this closure used to be
    // copy-pasted into all three views while most of app/ used US separators.
    $rp = fn ($n) => \App\Support\Money::rupiah((int) $n);
    $bg = '#0A0A0C';
    $card = '#0D1117';
    $border = 'rgba(147,51,234,0.35)';
    $muted = '#9aa0ac';
    $text = '#ECEDEE';
@endphp
<!DOCTYPE html>
<html lang="{{ app()->getLocale() }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="dark">
    <title>{{ __('receipt.title') }}</title>
</head>
<body style="margin:0; padding:0; background-color:{{ $bg }}; color:{{ $text }}; font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">{{ __('receipt.preheader') }}</div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:{{ $bg }};">
        <tr>
            <td align="center" style="padding:24px 12px;">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px; max-width:100%;">

                    {{-- Header: brand + gradient --}}
                    <tr>
                        <td style="background-color:#7c3aed; background-image:linear-gradient(135deg,#3b82f6 0%,#9234ea 100%); border-radius:16px 16px 0 0; padding:28px 32px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="font-family:'Outfit','Segoe UI',Arial,sans-serif; font-size:22px; font-weight:800; letter-spacing:1px; color:#ffffff; text-transform:uppercase;">
                                        🎮 {{ $brand }}
                                    </td>
                                    <td align="right">
                                        <span style="display:inline-block; background:rgba(255,255,255,0.18); color:#ffffff; font-size:12px; font-weight:700; padding:6px 12px; border-radius:999px;">
                                            ✓ {{ __('receipt.status_badge') }}
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    {{-- Body --}}
                    <tr>
                        <td style="background-color:{{ $card }}; border-left:1px solid {{ $border }}; border-right:1px solid {{ $border }}; padding:32px;">
                            <h1 style="margin:0 0 6px; font-family:'Outfit','Segoe UI',Arial,sans-serif; font-size:24px; font-weight:800; color:{{ $text }};">
                                {{ __('receipt.title') }}
                            </h1>
                            <p style="margin:0 0 4px; font-size:15px; color:{{ $text }};">{{ __('receipt.greeting') }}</p>
                            <p style="margin:0 0 24px; font-size:14px; line-height:22px; color:{{ $muted }};">{{ __('receipt.intro') }}</p>

                            {{-- Order details card --}}
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:12px;">
                                <tr>
                                    <td style="padding:18px 20px;">
                                        <p style="margin:0 0 14px; font-size:12px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#b794f4;">{{ __('receipt.section_order') }}</p>

                                        @php
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

                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                            @foreach ($rows as $label => $value)
                                                <tr>
                                                    <td style="padding:7px 0; font-size:13px; color:{{ $muted }}; vertical-align:top; width:45%;">{{ $label }}</td>
                                                    <td style="padding:7px 0; font-size:13px; color:{{ $text }}; font-weight:600; text-align:right; font-family:'IBM Plex Sans','Segoe UI',Arial,sans-serif;">{{ $value }}</td>
                                                </tr>
                                            @endforeach
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            {{-- Payment summary --}}
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:12px;">
                                <tr>
                                    <td style="padding:18px 20px;">
                                        <p style="margin:0 0 14px; font-size:12px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#b794f4;">{{ __('receipt.section_payment') }}</p>
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="padding:5px 0; font-size:13px; color:{{ $muted }};">{{ __('receipt.label_subtotal') }}</td>
                                                <td style="padding:5px 0; font-size:13px; color:{{ $text }}; text-align:right;">{{ $rp($subtotal) }}</td>
                                            </tr>
                                            @if ($fee > 0)
                                                <tr>
                                                    <td style="padding:5px 0; font-size:13px; color:{{ $muted }};">{{ __('receipt.label_fee') }}</td>
                                                    <td style="padding:5px 0; font-size:13px; color:{{ $text }}; text-align:right;">{{ $rp($fee) }}</td>
                                                </tr>
                                            @endif
                                            @if ($discount > 0)
                                                <tr>
                                                    <td style="padding:5px 0; font-size:13px; color:{{ $muted }};">{{ __('receipt.label_discount') }}</td>
                                                    <td style="padding:5px 0; font-size:13px; color:#22c55e; text-align:right;">- {{ $rp($discount) }}</td>
                                                </tr>
                                            @endif
                                            <tr>
                                                <td colspan="2" style="padding:8px 0 0;"><div style="border-top:1px solid rgba(255,255,255,0.1);"></div></td>
                                            </tr>
                                            <tr>
                                                <td style="padding:10px 0 0; font-size:15px; font-weight:700; color:{{ $text }};">{{ __('receipt.label_total') }}</td>
                                                <td style="padding:10px 0 0; font-size:18px; font-weight:800; color:#ffffff; text-align:right; font-family:'IBM Plex Sans','Segoe UI',Arial,sans-serif;">{{ $rp($total) }}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            {{-- CTA --}}
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
                                <tr>
                                    <td align="center">
                                        <a href="{{ $trackUrl }}" target="_blank"
                                           style="display:inline-block; background-color:#7c3aed; background-image:linear-gradient(90deg,#3b82f6,#9234ea); color:#ffffff; font-family:'Outfit','Segoe UI',Arial,sans-serif; font-size:15px; font-weight:700; text-decoration:none; padding:14px 40px; border-radius:999px;">
                                            🔍 {{ __('receipt.cta') }}
                                        </a>
                                        <p style="margin:12px 0 0; font-size:12px; line-height:18px; color:{{ $muted }};">{{ __('receipt.cta_hint') }}</p>
                                    </td>
                                </tr>
                            </table>

                            {{-- Help --}}
                            <div style="margin-top:28px; padding:16px 18px; border:1px dashed rgba(255,255,255,0.15); border-radius:12px;">
                                <p style="margin:0 0 4px; font-size:13px; font-weight:700; color:{{ $text }};">{{ __('receipt.help_title') }}</p>
                                <p style="margin:0; font-size:13px; line-height:20px; color:{{ $muted }};">{{ __('receipt.help_body') }}</p>
                            </div>
                        </td>
                    </tr>

                    {{-- Footer --}}
                    <tr>
                        <td style="background-color:{{ $card }}; border:1px solid {{ $border }}; border-top:none; border-radius:0 0 16px 16px; padding:20px 32px; text-align:center;">
                            <p style="margin:0 0 4px; font-size:11px; line-height:18px; color:{{ $muted }};">{{ __('receipt.footer_note') }}</p>
                            <p style="margin:0; font-size:11px; color:{{ $muted }};">© {{ date('Y') }} {{ $brand }}. {{ __('receipt.footer_rights') }}</p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
