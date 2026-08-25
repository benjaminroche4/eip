<?php

namespace App\Domain\Contact\Actions;

use App\Domain\Contact\Data\ContactMessage;
use App\Mail\ContactMessageMail;
use Illuminate\Support\Facades\Mail;

/** Delivers a contact request to the agency inbox (seo.organization.email, fallback mail.from). */
final class SendContactMessage
{
    public function __invoke(ContactMessage $message): void
    {
        $to = config('seo.organization.email') ?: config('mail.from.address');

        Mail::to($to)->send(new ContactMessageMail($message));
    }
}
