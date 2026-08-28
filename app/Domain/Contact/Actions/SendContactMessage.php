<?php

namespace App\Domain\Contact\Actions;

use App\Domain\Contact\Data\ContactMessage;
use App\Domain\Contact\Models\ContactRequest;
use App\Mail\ContactConfirmationMail;
use App\Mail\ContactMessageMail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * Stores the request, notifies the agency (seo.organization.email, fallback mail.from), then sends the
 * prospect a confirmation in their language. The row is written first so a mail outage never loses a lead:
 * `mail_sent_at` stays null and the error is logged; a failed confirmation never blocks the request.
 */
final class SendContactMessage
{
    public function __invoke(ContactMessage $message): ContactRequest
    {
        $request = ContactRequest::create($message->toArray());

        try {
            $to = config('seo.organization.email') ?: config('mail.from.address');
            Mail::to($to)->send(new ContactMessageMail($message));
            $request->update(['mail_sent_at' => now()]);
        } catch (Throwable $e) {
            Log::error('Contact request #'.$request->id.' saved but agency e-mail failed: '.$e->getMessage());
        }

        try {
            Mail::to($message->email, $message->fullName())->send(new ContactConfirmationMail($message));
        } catch (Throwable $e) {
            Log::warning('Contact request #'.$request->id.': confirmation e-mail failed: '.$e->getMessage());
        }

        return $request;
    }
}
