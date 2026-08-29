<?php

namespace App\Domain\Valuation\Actions;

use App\Domain\Valuation\Data\Valuation;
use App\Domain\Valuation\Models\ValuationRequest;
use App\Mail\ValuationConfirmationMail;
use App\Mail\ValuationRequestMail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * Stores the request, notifies the agency (seo.organization.email, fallback mail.from), then sends the prospect a
 * confirmation in their language. The row is written first so a mail outage never loses a lead: `mail_sent_at`
 * stays null and the error is logged; a failed confirmation never blocks the request.
 */
final class SendValuationRequest
{
    public function __invoke(Valuation $valuation): ValuationRequest
    {
        $request = ValuationRequest::create($valuation->toArray());

        try {
            $to = config('seo.organization.email') ?: config('mail.from.address');
            Mail::to($to)->send(new ValuationRequestMail($valuation, $request->reference));
            $request->update(['mail_sent_at' => now()]);
        } catch (Throwable $e) {
            Log::error('Valuation request #'.$request->id.' saved but agency e-mail failed: '.$e->getMessage());
        }

        try {
            Mail::to($valuation->email, $valuation->fullName)->send(new ValuationConfirmationMail($valuation, $request->reference));
        } catch (Throwable $e) {
            Log::warning('Valuation request #'.$request->id.': confirmation e-mail failed: '.$e->getMessage());
        }

        return $request;
    }
}
