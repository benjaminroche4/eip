{{ __('ui.contact.mail_intro') }}

{{ __('ui.contact.mail_name') }} : {{ $contact->fullName() }}
{{ __('ui.contact.email') }} : {{ $contact->email }}
{{ __('ui.contact.phone') }} : {{ $contact->phone }}
{{ __('ui.contact.topic') }} : {{ $topic }}
{{ __('ui.contact.locale') }} : {{ strtoupper($contact->locale) }}
{{ __('ui.contact.mail_sent_at') }} : {{ $sentAt }}

{{ __('ui.contact.message') }} :
{{ $contact->message }}
