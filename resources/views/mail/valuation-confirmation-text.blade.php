{{ __('ui.mail.confirmation_hello', ['name' => $valuation->fullName]) }} {{ __('ui.estimate.confirmation_intro', ['name' => $agency['name']]) }}

{{ __('ui.estimate.confirmation_delay_label') }} : {{ __('ui.estimate.confirmation_delay_value') }}

{{ __('ui.estimate.confirmation_recap') }}
@foreach($rows as $label => $value)
- {{ $label }} : {{ $value }}
@endforeach

{{ __('ui.estimate.confirmation_reassurance') }}

{{ $agency['name'] }}
@if($agency['phone']){{ $agency['phone'] }}
@endif
@if($agency['email']){{ $agency['email'] }}
@endif
{{ $agency['siteUrl'] }}
