{{ __('ui.mail.newsletter_hello') }} {{ __('ui.mail.newsletter_intro', ['name' => $agency['name']]) }}

{{ __('ui.mail.newsletter_recap_title') }}
@foreach(['opportunities', 'guidance', 'expertise'] as $benefit)
- {{ __("ui.newsletter.benefits.$benefit.title") }} : {{ __("ui.newsletter.benefits.$benefit.text") }}
@endforeach

{{ __('ui.newsletter.email') }} : {{ $subscriber->email }}

{{ __('ui.mail.newsletter_optout') }}

{{ $agency['name'] }}
@if($agency['addressLine']){{ $agency['addressLine'] }}
@endif
@if($agency['phone']){{ $agency['phone'] }}
@endif
@if($agency['email']){{ $agency['email'] }}
@endif
{{ $agency['siteUrl'] }}
