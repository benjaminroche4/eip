@php($c = $contact)
<x-emails::layout :agency="$agency" :title="__('ui.mail.confirmation_title')" :preheader="__('ui.mail.confirmation_preheader', ['minutes' => 30])">
    <p style="margin:0 0 24px;font-size:15px;line-height:24px;">
        {{ __('ui.mail.confirmation_hello', ['name' => $c->firstName]) }} {{ __('ui.mail.confirmation_intro', ['name' => $agency['name']]) }}
    </p>

    {{-- Advisor card: photo, name, role, callback promise, number we will call --}}
    <table class="box-grey" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"
        style="background-color:#f6f6f7;border:1px solid #e5e5e5;">
        <tr>
            <td style="padding:10px;">
                <table class="box-white" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#ffffff;">
                    <tr>
                        <td style="padding:20px;">
                            @if($agency['advisor'])
                                <h3 class="text-heading" style="margin:0;padding:0 0 16px;font-family:'Montserrat',Helvetica,Arial,sans-serif;font-size:18px;line-height:26px;font-weight:600;text-align:center;color:#0f1b29;">
                                    {{ __('ui.contact.meet_advisor') }}
                                </h3>
                                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" align="center">
                                    <tr>
                                        <td align="center">
                                            <img src="{{ $agency['advisor']['photoUrl'] }}" alt="" width="120" height="120"
                                                style="display:block;outline:none;border:none;text-decoration:none;width:120px;height:120px;border-radius:60px;" />
                                        </td>
                                    </tr>
                                </table>
                                <p class="text-heading" style="margin:0;padding:12px 0 2px;font-size:16px;text-align:center;font-weight:600;color:#0f1b29;">
                                    {{ $agency['advisor']['name'] }}
                                </p>
                                @if($agency['advisor']['role'])
                                    <p class="text-muted" style="margin:0;padding:0;font-size:14px;text-align:center;color:#545b67;">{{ $agency['advisor']['role'] }}</p>
                                @endif
                                <p class="text-muted" style="margin:0;padding:4px 0 0;font-size:13px;text-align:center;color:#a19481;">{{ __('ui.contact.advisor_languages') }}</p>

                                <hr style="width:100%;border:none;border-top:2px solid #eaeaea;margin:20px 0;" />
                            @endif

                            <table class="box-success" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"
                                style="background-color:#effdf4;border:1px solid #bbf7d0;">
                                <tr>
                                    <td style="padding:12px;text-align:center;color:#14532d;">
                                        <span style="font-size:12px;line-height:18px;">{{ __('ui.contact.advisor_delay_label') }}</span><br />
                                        <strong style="font-size:16px;line-height:24px;">{{ __('ui.contact.advisor_delay_value') }}</strong><br />
                                        <span style="font-size:12px;line-height:18px;">{{ __('ui.contact.advisor_delay_hours') }} {{ $agency['hours'] }}</span>
                                    </td>
                                </tr>
                            </table>

                            <table class="box-grey" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"
                                style="margin-top:12px;background-color:#f6f6f7;border:1px solid #e5e5e5;">
                                <tr>
                                    <td style="padding:12px;text-align:center;">
                                        <span class="text-muted" style="font-size:12px;line-height:18px;color:#545b67;">{{ __('ui.contact.callback_on') }}</span><br />
                                        <strong class="text-heading" style="font-size:18px;line-height:26px;color:#0f1b29;">{{ $c->phone }}</strong>
                                    </td>
                                </tr>
                            </table>

                            <p class="text-muted" style="margin:0;padding:12px 0 0;font-size:12px;line-height:18px;text-align:center;color:#545b67;">
                                <em>{{ __('ui.contact.advisor_unavailable') }}</em>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    {{-- Recap of the request --}}
    <table class="box-grey" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"
        style="margin-top:24px;background-color:#f6f6f7;border:1px solid #e5e5e5;">
        <tr>
            <td style="padding:10px;">
                <p class="text-heading" style="margin:0;padding:8px 10px 14px;font-size:15px;line-height:22px;font-weight:600;color:#0f1b29;">
                    {{ __('ui.mail.recap_title') }}
                </p>
                <table class="box-white" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#ffffff;">
                    <tr>
                        <td style="padding:12px 20px 16px;">
                            @foreach([
                                __('ui.contact.mail_name') => $c->fullName(),
                                __('ui.contact.phone') => $c->phone,
                                __('ui.contact.email') => $c->email,
                                __('ui.contact.locale') => __('ui.mail.language_'.$c->locale),
                                __('ui.contact.mail_sent_at') => $sentAt,
                                __('ui.contact.topic') => $topic,
                            ] as $label => $value)
                                <p style="margin:0;padding:6px 0;font-size:15px;line-height:22px;">
                                    <span class="label-muted" style="color:#545b67;">{{ $label }} :</span> <span class="text-heading" style="color:#0f1b29;">{{ $value }}</span>
                                </p>
                            @endforeach
                            @if($c->message)
                                <hr style="width:100%;border:none;border-top:2px solid #eaeaea;margin:12px 0;" />
                                <p class="label-muted" style="margin:0;padding:0 0 4px;font-size:15px;line-height:22px;color:#545b67;">{{ __('ui.contact.message') }} :</p>
                                <p class="text-heading" style="margin:0;padding:0;font-size:15px;line-height:22px;color:#0f1b29;white-space:pre-line;">{{ $c->message }}</p>
                            @endif
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <p class="text-muted" style="margin:0;padding:24px 0 0;font-size:13px;line-height:20px;text-align:center;color:#545b67;">
        {{ __('ui.mail.reassurance', ['name' => $agency['name']]) }}
    </p>
</x-emails::layout>
