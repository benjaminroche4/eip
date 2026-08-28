@php($v = $valuation)
<x-emails::layout :agency="$agency" :title="__('ui.estimate.confirmation_title')" :preheader="__('ui.estimate.confirmation_preheader')">
    <p style="margin:0 0 24px;font-size:15px;line-height:24px;">
        {{ __('ui.mail.confirmation_hello', ['name' => $v->fullName]) }} {{ __('ui.estimate.confirmation_intro', ['name' => $agency['name']]) }}
    </p>

    <table class="box-success" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"
        style="background-color:#effdf4;border:1px solid #bbf7d0;">
        <tr>
            <td style="padding:12px;text-align:center;color:#14532d;">
                <span style="font-size:12px;line-height:18px;">{{ __('ui.estimate.confirmation_delay_label') }}</span><br />
                <strong style="font-size:16px;line-height:24px;">{{ __('ui.estimate.confirmation_delay_value') }}</strong><br />
                <span style="font-size:12px;line-height:18px;">{{ __('ui.estimate.confirmation_delay_via', ['method' => $rows[__('ui.estimate.contact_method')]]) }}</span>
            </td>
        </tr>
    </table>

    <table class="box-grey" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"
        style="margin-top:24px;background-color:#f6f6f7;border:1px solid #e5e5e5;">
        <tr>
            <td style="padding:10px;">
                <p class="text-heading" style="margin:0;padding:8px 10px 14px;font-size:15px;line-height:22px;font-weight:600;color:#0f1b29;">
                    {{ __('ui.estimate.confirmation_recap') }}
                </p>
                <table class="box-white" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#ffffff;">
                    <tr>
                        <td style="padding:12px 20px 16px;">
                            @foreach($rows as $label => $value)
                                <p style="margin:0;padding:6px 0;font-size:15px;line-height:22px;">
                                    <span class="label-muted" style="color:#545b67;">{{ $label }} :</span> <span class="text-heading" style="color:#0f1b29;">{{ $value }}</span>
                                </p>
                            @endforeach
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <p class="text-muted" style="margin:0;padding:24px 0 0;font-size:13px;line-height:20px;text-align:center;color:#545b67;">
        {{ __('ui.estimate.confirmation_reassurance') }}
    </p>
</x-emails::layout>
