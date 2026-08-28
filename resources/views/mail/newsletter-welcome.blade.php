<x-emails::layout :agency="$agency" :title="__('ui.mail.newsletter_title')" :preheader="__('ui.mail.newsletter_preheader')">
    <p style="margin:0 0 24px;font-size:15px;line-height:24px;">
        {{ __('ui.mail.newsletter_hello') }} {{ __('ui.mail.newsletter_intro', ['name' => $agency['name']]) }}
    </p>

    {{-- What the subscriber will receive --}}
    <table class="box-grey" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"
        style="background-color:#f6f6f7;border:1px solid #e5e5e5;">
        <tr>
            <td style="padding:10px;">
                <p class="text-heading" style="margin:0;padding:8px 10px 14px;font-size:15px;line-height:22px;font-weight:600;color:#0f1b29;">
                    {{ __('ui.mail.newsletter_recap_title') }}
                </p>
                <table class="box-white" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#ffffff;">
                    <tr>
                        <td style="padding:12px 20px 16px;">
                            @foreach(['opportunities', 'guidance', 'expertise'] as $benefit)
                                <p style="margin:0;padding:6px 0;font-size:15px;line-height:22px;">
                                    <span class="text-heading" style="font-weight:600;color:#0f1b29;">{{ __("ui.newsletter.benefits.$benefit.title") }}</span><br />
                                    <span class="label-muted" style="color:#545b67;">{{ __("ui.newsletter.benefits.$benefit.text") }}</span>
                                </p>
                            @endforeach
                            <hr style="width:100%;border:none;border-top:2px solid #eaeaea;margin:12px 0;" />
                            <p style="margin:0;padding:0;font-size:15px;line-height:22px;">
                                <span class="label-muted" style="color:#545b67;">{{ __('ui.newsletter.email') }} :</span> <span class="text-heading" style="color:#0f1b29;">{{ $subscriber->email }}</span>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <p class="text-muted" style="margin:0;padding:24px 0 0;font-size:13px;line-height:20px;text-align:center;color:#545b67;">
        {{ __('ui.mail.newsletter_optout') }}
    </p>
</x-emails::layout>
