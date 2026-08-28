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

/** Confirmation to the prospect, in their language: what happens next, their request, the advisor, how to reach us. */
class ContactConfirmationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public readonly ContactMessage $contact)
    {
        $this->locale($contact->locale);
    }

    public function envelope(): Envelope
    {
        $agency = config('seo.organization.email') ?: config('mail.from.address');

        return new Envelope(
            subject: __('ui.mail.confirmation_subject', ['name' => config('seo.site_name')]),
            replyTo: [new Address($agency, config('seo.site_name'))],
        );
    }

    public function content(): Content
    {
        return new Content(view: 'mail.contact-confirmation', text: 'mail.contact-confirmation-text', with: [
            'topic' => __('ui.contact.topics.'.$this->contact->topic),
            'agency' => AgencyCard::for($this->contact->locale),
            'sentAt' => now()->locale($this->contact->locale)->isoFormat(__('ui.mail.sent_at_format', [], $this->contact->locale)),
        ]);
    }
}
