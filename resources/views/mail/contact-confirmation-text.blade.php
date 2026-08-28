{{ __('ui.mail.confirmation_hello', ['name' => $contact->firstName]) }} {{ __('ui.mail.confirmation_intro', ['name' => $agency['name']]) }}

{{ __('ui.mail.callback_label') }} : {{ $contact->phone }}
{{ __('ui.mail.callback_text', ['minutes' => 30, 'hours' => $agency['hours']]) }}
@if($agency['advisor'])

{{ __('ui.contact.meet_advisor') }} : {{ $agency['advisor']['name'] }}@if($agency['advisor']['role']) — {{ $agency['advisor']['role'] }}@endif
@endif

{{ __('ui.mail.recap_title') }}
- {{ __('ui.contact.first_name') }} / {{ __('ui.contact.last_name') }} : {{ $contact->fullName() }}
- {{ __('ui.contact.email') }} : {{ $contact->email }}
- {{ __('ui.contact.phone') }} : {{ $contact->phone }}
- {{ __('ui.contact.topic') }} : {{ $topic }}
@if($contact->message)
- {{ __('ui.contact.message') }} : {{ $contact->message }}
@endif

{{ __('ui.mail.reassurance', ['name' => $agency['name']]) }}

{{ $agency['name'] }}
@if($agency['addressLine']){{ $agency['addressLine'] }}
@endif
@if($agency['phone']){{ $agency['phone'] }}
@endif
@if($agency['email']){{ $agency['email'] }}
@endif
{{ $agency['hours'] }}
{{ $agency['siteUrl'] }}
