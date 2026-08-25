{{ __('ui.contact.mail_intro') }}

{{ __('ui.contact.first_name') }} : {{ $contact->firstName }}
{{ __('ui.contact.last_name') }} : {{ $contact->lastName }}
{{ __('ui.contact.email') }} : {{ $contact->email }}
{{ __('ui.contact.phone') }} : {{ $contact->phone }}
{{ __('ui.contact.topic') }} : {{ $topic }}
{{ __('ui.contact.locale') }} : {{ strtoupper($contact->locale) }}

{{ __('ui.contact.message') }} :
{{ $contact->message }}
