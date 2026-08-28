@php($c = $contact)
<x-emails::layout :agency="$agency" :title="__('ui.mail.internal_title')" :preheader="$c->fullName().' — '.$topic">
    {{-- Contact details, two columns like the RIP admin mail --}}
    <table class="box-grey" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"
        style="background-color:#f6f6f7;border:1px solid #e5e5e5;">
        <tr>
            <td style="padding:10px;">
                <p class="text-heading" style="margin:0;padding:8px 10px 14px;font-size:15px;line-height:22px;font-weight:600;color:#0f1b29;">
                    {{ __('ui.mail.recap_title_internal') }}
                </p>
                <table class="box-white" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#ffffff;">
                    <tr>
                        <td width="50%" style="padding:12px 12px 0 20px;vertical-align:top;">
                            <p style="margin:0;padding:6px 0;font-size:15px;line-height:22px;">
                                <span class="label-muted" style="color:#545b67;">{{ __('ui.contact.mail_name') }} :</span> <span class="text-heading" style="color:#0f1b29;">{{ $c->fullName() }}</span>
                            </p>
                            <p style="margin:0;padding:6px 0;font-size:15px;line-height:22px;">
                                <span class="label-muted" style="color:#545b67;">{{ __('ui.contact.email') }} :</span> <a href="mailto:{{ $c->email }}" style="color:#0f1b29;text-decoration:none;">{{ $c->email }}</a>
                            </p>
                            <p style="margin:0;padding:6px 0;font-size:15px;line-height:22px;">
                                <span class="label-muted" style="color:#545b67;">{{ __('ui.contact.mail_sent_at') }} :</span> <span class="text-heading" style="color:#0f1b29;">{{ $sentAt }}</span>
                            </p>
                        </td>
                        <td width="50%" style="padding:12px 20px 0 12px;vertical-align:top;">
                            <p style="margin:0;padding:6px 0;font-size:15px;line-height:22px;">
                                <span class="label-muted" style="color:#545b67;">{{ __('ui.contact.phone') }} :</span> <a href="tel:{{ preg_replace('/\s+/', '', $c->phone) }}" style="color:#0f1b29;text-decoration:none;">{{ $c->phone }}</a>
                            </p>
                            <p style="margin:0;padding:6px 0;font-size:15px;line-height:22px;">
                                <span class="label-muted" style="color:#545b67;">{{ __('ui.contact.locale') }} :</span> <span class="text-heading" style="color:#0f1b29;">{{ __('ui.mail.language_'.$c->locale) }}</span>
                            </p>
                            <p style="margin:0;padding:6px 0;font-size:15px;line-height:22px;">
                                <span class="text-heading" style="color:#0f1b29;">{{ $c->consentAt ? __('ui.mail.internal_consent') : __('ui.mail.internal_no_consent') }}</span>
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="2" style="padding:6px 20px 16px;">
                            <p style="margin:0;padding:6px 0;font-size:15px;line-height:22px;">
                                <span class="label-muted" style="color:#545b67;">{{ __('ui.contact.topic') }} :</span> <span class="text-heading" style="color:#0f1b29;">{{ $topic }}</span>
                            </p>
                            <hr style="width:100%;border:none;border-top:2px solid #eaeaea;margin:12px 0;" />
                            <p class="label-muted" style="margin:0;padding:0 0 4px;font-size:15px;line-height:22px;color:#545b67;">{{ __('ui.contact.message') }} :</p>
                            <p class="text-heading" style="margin:0;padding:0;font-size:15px;line-height:22px;color:#0f1b29;white-space:pre-line;">{{ $c->message ?: '—' }}</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    {{-- Quick actions --}}
    <table border="0" cellpadding="0" cellspacing="0" role="presentation" align="center" style="margin:24px auto 0;">
        <tr>
            <td style="background-color:#202832;padding:0 6px 0 0;">
                <a href="tel:{{ preg_replace('/\s+/', '', $c->phone) }}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:500;color:#ffffff;text-decoration:none;">{{ __('ui.mail.action_call') }}</a>
            </td>
            <td style="width:8px;"></td>
            <td style="border:1px solid #202832;">
                <a href="mailto:{{ $c->email }}" style="display:inline-block;padding:11px 24px;font-size:14px;font-weight:500;color:#202832;text-decoration:none;">{{ __('ui.mail.action_reply') }}</a>
            </td>
        </tr>
    </table>

    <table class="box-success" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"
        style="margin-top:24px;background-color:#effdf4;border:1px solid #dcfce7;">
        <tr>
            <td style="padding:12px 20px;text-align:center;font-size:14px;line-height:22px;color:#14532d;">
                {!! __('ui.mail.internal_response_time') !!}
            </td>
        </tr>
    </table>

    <p class="text-muted" style="margin:0;padding:24px 0 0;font-size:13px;line-height:20px;text-align:center;color:#545b67;">
        <em>{{ __('ui.mail.internal_origin', ['ip' => $c->ip ?: '—']) }}</em>
        @if($c->referer)<br /><em>{{ __('ui.mail.internal_referer') }} {{ $c->referer }}</em>@endif
    </p>
</x-emails::layout>
