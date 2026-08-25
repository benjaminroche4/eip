<?php

namespace App\Mail;

use App\Domain\Contact\Data\ContactMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

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
        return new Content(text: 'mail.contact-message', with: [
            'topic' => __('ui.contact.topics.'.$this->contact->topic),
        ]);
    }
}
