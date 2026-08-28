<?php

namespace App\Mail;

use App\Domain\Contact\Support\AgencyCard;
use App\Domain\Newsletter\Models\NewsletterSubscriber;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/** Welcome sent to a new newsletter subscriber, in their language: what they will receive, when, how to opt out. */
class NewsletterWelcomeMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public readonly NewsletterSubscriber $subscriber)
    {
        $this->locale($subscriber->locale);
    }

    public function envelope(): Envelope
    {
        $agency = config('seo.organization.email') ?: config('mail.from.address');

        return new Envelope(
            subject: __('ui.mail.newsletter_subject', ['name' => config('seo.site_name')]),
            replyTo: [new Address($agency, config('seo.site_name'))],
        );
    }

    public function content(): Content
    {
        return new Content(view: 'mail.newsletter-welcome', text: 'mail.newsletter-welcome-text', with: [
            'agency' => AgencyCard::for($this->subscriber->locale),
        ]);
    }
}
