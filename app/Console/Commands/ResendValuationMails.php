<?php

namespace App\Console\Commands;

use App\Domain\Valuation\Data\Valuation;
use App\Domain\Valuation\Models\ValuationRequest;
use App\Mail\ValuationRequestMail;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * Retries the agency e-mail of the valuation requests saved while the mailer was down (`mail_sent_at` null), so a
 * lead is never lost silently (user decision 2026-09-22). Scheduled hourly; the owner's confirmation is not resent.
 */
class ResendValuationMails extends Command
{
    protected $signature = 'valuations:resend-mails {--limit=50 : Requests retried per run}';

    protected $description = 'Resend the agency e-mail of the valuation requests whose mail failed';

    public function handle(): int
    {
        $to = config('seo.organization.email') ?: config('mail.from.address');
        $pending = ValuationRequest::query()->whereNull('mail_sent_at')->oldest()->limit((int) $this->option('limit'))->get();
        $sent = 0;

        foreach ($pending as $request) {
            try {
                Mail::to($to)->send(new ValuationRequestMail(Valuation::fromModel($request), $request->reference));
                $request->update(['mail_sent_at' => now()]);
                $sent++;
            } catch (Throwable $e) {
                report($e);
                $this->warn("{$request->reference}: still failing ({$e->getMessage()})");
            }
        }

        $this->info("$sent of {$pending->count()} pending valuation e-mail(s) resent.");

        return self::SUCCESS;
    }
}
