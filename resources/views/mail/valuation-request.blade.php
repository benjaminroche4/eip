@php($v = $valuation)
<x-emails::layout :agency="$agency" :title="__('ui.estimate.mail_title')" :preheader="$v->fullName.' — '.$rows[__('ui.estimate.property_type')]">
    <table class="box-grey" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"
        style="background-color:#f6f6f7;border:1px solid #e5e5e5;">
        <tr>
            <td style="padding:10px;">
                <p class="text-heading" style="margin:0;padding:8px 10px 14px;font-size:15px;line-height:22px;font-weight:600;color:#0f1b29;">
                    {{ __('ui.mail.recap_title_internal') }}
                </p>
                <table class="box-white" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#ffffff;">
                    <tr>
                        <td style="padding:12px 20px 16px;">
                            @foreach([
                                __('ui.contact.mail_name') => $v->fullName,
                                __('ui.contact.email') => $v->email,
                                __('ui.contact.phone') => $v->phone,
                                __('ui.contact.locale') => __('ui.mail.language_'.$v->locale),
                                __('ui.contact.mail_sent_at') => $sentAt,
                            ] + $rows as $label => $value)
                                <p style="margin:0;padding:6px 0;font-size:15px;line-height:22px;">
                                    <span class="label-muted" style="color:#545b67;">{{ $label }} :</span> <span class="text-heading" style="color:#0f1b29;">{{ $value }}</span>
                                </p>
                            @endforeach
                            <hr style="width:100%;border:none;border-top:2px solid #eaeaea;margin:12px 0;" />
                            <p class="label-muted" style="margin:0;padding:0 0 4px;font-size:15px;line-height:22px;color:#545b67;">{{ __('ui.estimate.message') }} :</p>
                            <p class="text-heading" style="margin:0;padding:0;font-size:15px;line-height:22px;color:#0f1b29;white-space:pre-line;">{{ $v->message ?: '—' }}</p>
                            <p class="text-heading" style="margin:0;padding:12px 0 0;font-size:13px;line-height:20px;color:#0f1b29;">{{ $v->consentAt ? __('ui.mail.internal_consent') : __('ui.mail.internal_no_consent') }}</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <table border="0" cellpadding="0" cellspacing="0" role="presentation" align="center" style="margin:24px auto 0;">
        <tr>
            <td style="background-color:#202832;">
                <a href="tel:{{ preg_replace('/\s+/', '', $v->phone) }}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:500;color:#ffffff;text-decoration:none;">{{ __('ui.mail.action_call') }}</a>
            </td>
            <td style="width:8px;"></td>
            <td style="border:1px solid #202832;">
                <a href="mailto:{{ $v->email }}" style="display:inline-block;padding:11px 24px;font-size:14px;font-weight:500;color:#202832;text-decoration:none;">{{ __('ui.mail.action_reply') }}</a>
            </td>
        </tr>
    </table>

    <p class="text-muted" style="margin:0;padding:24px 0 0;font-size:12px;line-height:18px;text-align:center;color:#545b67;">
        {{ __('ui.mail.internal_origin', ['ip' => $v->ip ?? '—']) }}
    </p>
</x-emails::layout>
