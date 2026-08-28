{{ __('ui.estimate.mail_title') }}

{{ __('ui.contact.mail_name') }} : {{ $valuation->fullName }}
{{ __('ui.contact.email') }} : {{ $valuation->email }}
{{ __('ui.contact.phone') }} : {{ $valuation->phone }}
{{ __('ui.contact.locale') }} : {{ strtoupper($valuation->locale) }}
{{ __('ui.contact.mail_sent_at') }} : {{ $sentAt }}
@foreach($rows as $label => $value)
{{ $label }} : {{ $value }}
@endforeach

{{ __('ui.estimate.message') }} :
{{ $valuation->message ?: '—' }}
