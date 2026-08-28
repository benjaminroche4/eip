<?php

namespace App\Mail;

use App\Domain\Contact\Support\AgencyCard;
use App\Domain\Valuation\Data\Valuation;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/** Confirmation to the owner, in their language: what happens next (valuation within 24 business hours), their request. */
class ValuationConfirmationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public readonly Valuation $valuation)
    {
        $this->locale($valuation->locale);
    }

    public function envelope(): Envelope
    {
        $agency = config('seo.organization.email') ?: config('mail.from.address');

        return new Envelope(
            subject: __('ui.estimate.confirmation_subject', ['name' => config('seo.site_name')]),
            replyTo: [new Address($agency, config('seo.site_name'))],
        );
    }

    public function content(): Content
    {
        return new Content(view: 'mail.valuation-confirmation', text: 'mail.valuation-confirmation-text', with: [
            'agency' => AgencyCard::for($this->valuation->locale),
            'rows' => ValuationRequestMail::rows($this->valuation),
        ]);
    }
}
