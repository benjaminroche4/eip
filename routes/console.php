<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('sitemap:generate')->daily();
// Leads first: retry the agency e-mails that failed while the mailer was down (see SendValuationRequest).
Schedule::command('valuations:resend-mails')->hourly();
