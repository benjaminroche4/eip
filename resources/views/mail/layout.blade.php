{{--
    Shared shell of the transactional e-mails (<x-emails::layout>), same structure as the RIP template
    adapted to the Estate in Paris identity: 600px white card, logo, centred title, content slot, footer
    (tagline, address, contact links, social). Square corners, no shadow, brand palette (tokens.css).
--}}
@props(['agency', 'title', 'preheader' => null])
@php($font = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Helvetica, Arial, sans-serif")
@php($heading = "'Montserrat', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif")
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="{{ app()->getLocale() }}">
<head>
    <meta charset="UTF-8" />
    <meta content="width=device-width" name="viewport" />
    <meta content="IE=edge" http-equiv="X-UA-Compatible" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta content="telephone=no,address=no,email=no,date=no,url=no" name="format-detection" />
    <meta name="color-scheme" content="light dark" />
    <meta name="supported-color-schemes" content="light dark" />
    <title>{{ $title }}</title>
    <style>
        @media (prefers-color-scheme: dark) {
            body, .email-body { background-color: #111418 !important; }
            .email-card { background-color: #1b2027 !important; border-color: #2c333d !important; }
            .email-card td, .email-card p { color: #e6e8eb !important; }
            .email-card h1, .email-card h2, .email-card h3, .text-heading { color: #f5f6f7 !important; }
            .box-grey { background-color: #242a33 !important; border-color: #343c47 !important; }
            .box-white { background-color: #1b2027 !important; border-color: #343c47 !important; }
            .box-success { background-color: #0f2a1c !important; border-color: #1f5a3b !important; }
            .box-success * { color: #bbf7d0 !important; }
            .text-muted, .label-muted { color: #a3aab4 !important; }
            .email-card a { color: #e6e8eb !important; }
            hr { border-top-color: #343c47 !important; }
        }
    </style>
</head>
<body class="email-body" style="margin:0;padding:0;background-color:#f4f4f4;">
    @if($preheader)
        <div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#f4f4f4;">{{ $preheader }}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
    @endif
    <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" align="center" style="background-color:#f4f4f4;">
        <tr>
            <td align="center" style="padding:32px 12px;">
                <table class="email-card" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" align="center"
                    style="max-width:600px;width:100%;border:1px solid #e2e2e2;background-color:#ffffff;font-family:{{ $font }};font-size:15px;line-height:155%;color:#545b67;">
                    <tr>
                        <td style="padding:40px 28px;">
                            <a href="{{ $agency['siteUrl'] }}" style="text-decoration:none;">
                                <img src="{{ $agency['logoUrl'] }}" alt="{{ $agency['name'] }}" width="205" height="24"
                                    style="display:block;outline:none;border:none;text-decoration:none;max-width:100%;height:auto;" />
                            </a>

                            <h2 class="text-heading" style="margin:28px 0 24px;padding:0;font-family:{{ $heading }};font-size:24px;line-height:32px;font-weight:600;text-align:center;color:#0f1b29;">
                                {{ $title }}
                            </h2>

                            {{ $slot }}

                            {{-- Footer --}}
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" align="center" style="margin-top:32px;">
                                <tr>
                                    <td align="center">
                                        <img src="{{ $agency['logoUrl'] }}" alt="" width="137" height="16"
                                            style="display:block;outline:none;border:none;text-decoration:none;max-width:100%;height:auto;" />
                                    </td>
                                </tr>
                            </table>

                            <p class="text-muted" style="margin:0;padding:16px 0;font-size:14px;text-align:center;color:#545b67;">
                                {{ __('ui.mail.tagline') }}
                            </p>

                            <hr style="width:100%;border:none;border-top:2px solid #eaeaea;margin:8px 0 0;" />

                            <p class="text-muted" style="margin:0;padding:24px 0 8px;font-size:14px;line-height:22px;text-align:center;color:#545b67;">
                                @if($agency['addressLine'])
                                    @if($agency['mapsUrl'])<a href="{{ $agency['mapsUrl'] }}" style="color:#545b67;text-decoration:none;">{{ $agency['addressLine'] }}</a>@else{{ $agency['addressLine'] }}@endif<br />
                                @endif
                                {{ $agency['hours'] }}
                            </p>

                            <p style="margin:0;padding:0 0 24px;font-size:14px;line-height:22px;text-align:center;">
                                @if($agency['phone'])<a href="{{ $agency['phoneHref'] }}" style="color:#0f1b29;text-decoration:none;font-weight:500;">{{ $agency['phone'] }}</a>@endif
                                @if($agency['phone'] && $agency['email']) <span class="text-muted" style="color:#a19481;">·</span> @endif
                                @if($agency['email'])<a href="mailto:{{ $agency['email'] }}" style="color:#0f1b29;text-decoration:none;font-weight:500;">{{ $agency['email'] }}</a>@endif
                                @if($agency['whatsappUrl']) <span class="text-muted" style="color:#a19481;">·</span> <a href="{{ $agency['whatsappUrl'] }}" style="color:#0f1b29;text-decoration:none;font-weight:500;">WhatsApp</a>@endif
                            </p>

                            @if($agency['social'])
                                <p style="margin:0;padding:0;font-size:13px;line-height:20px;text-align:center;">
                                    @foreach($agency['social'] as $network => $url)
                                        @if(! $loop->first)<span class="text-muted" style="color:#a19481;">·</span> @endif<a href="{{ $url }}" rel="noopener noreferrer" target="_blank" style="color:#545b67;text-decoration:underline;">{{ ucfirst($network) }}</a>
                                    @endforeach
                                </p>
                            @endif
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
