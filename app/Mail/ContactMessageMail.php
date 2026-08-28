<?php

namespace App\Mail;

use App\Domain\Contact\Data\ContactMessage;
use App\Domain\Contact\Support\AgencyCard;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/** Internal notification: every field of the request, one-click reply / call actions. */
class ContactMessageMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public readonly ContactMessage $contact) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: __('ui.contact.mail_subject', ['name' => $this->contact->fullName(), 'topic' => __('ui.contact.topics.'.$this->contact->topic)]),
            replyTo: [new Address($this->contact->email, $this->contact->fullName())],
        );
    }

    public function content(): Content
    {
        return new Content(view: 'mail.contact-message', text: 'mail.contact-message-text', with: [
            'topic' => __('ui.contact.topics.'.$this->contact->topic),
            'agency' => AgencyCard::for(app()->getLocale()),
            'sentAt' => now()->locale(app()->getLocale())->isoFormat(__('ui.mail.sent_at_format', [], app()->getLocale())),
        ]);
    }
}
