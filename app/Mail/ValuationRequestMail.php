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

/** Internal notification: every field of the valuation request, one-click reply / call actions. */
class ValuationRequestMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public readonly Valuation $valuation, public readonly string $reference) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: __('ui.estimate.mail_subject', ['name' => $this->valuation->fullName, 'type' => __('ui.estimate.property_types.'.$this->valuation->propertyType)]),
            replyTo: [new Address($this->valuation->email, $this->valuation->fullName)],
        );
    }

    public function content(): Content
    {
        return new Content(view: 'mail.valuation-request', text: 'mail.valuation-request-text', with: [
            'agency' => AgencyCard::for(app()->getLocale()),
            'rows' => [__('ui.estimate.reference') => $this->reference] + self::rows($this->valuation),
            'sentAt' => now()->locale(app()->getLocale())->isoFormat(__('ui.mail.sent_at_format', [], app()->getLocale())),
        ]);
    }

    /** Label → value pairs of the property, shared by the HTML and text views. @return array<string, string> */
    public static function rows(Valuation $v): array
    {
        return array_filter([
            __('ui.estimate.property_type') => __('ui.estimate.property_types.'.$v->propertyType),
            __('ui.estimate.address') => $v->address,
            __('ui.estimate.surface') => $v->surface.' m²',
            __('ui.estimate.floor') => $v->floor ? __('ui.estimate.floors.'.$v->floor) : null,
            __('ui.estimate.elevator') => $v->elevator ? __('ui.estimate.yes') : null,
            __('ui.estimate.rooms') => (string) $v->rooms,
            __('ui.estimate.bedrooms') => (string) $v->bedrooms,
            __('ui.estimate.features') => implode(', ', array_map(fn ($f) => __('ui.estimate.features_list.'.$f), $v->features)) ?: null,
            __('ui.estimate.condition') => $v->condition ? __('ui.estimate.conditions.'.$v->condition) : null,
            __('ui.estimate.estimated_value') => $v->estimatedValue ? number_format($v->estimatedValue, 0, ',', ' ').' €' : null,
            __('ui.estimate.contact_method') => __('ui.estimate.contact_methods.'.$v->contactMethod),
        ]);
    }
}
