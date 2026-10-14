<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('sitemap:generate')->daily();
// Keep the Sanity cache warm for the home, the blog and the sitemap (15-minute TTL, refreshed every 5).
Schedule::command('sanity:warm')->everyFiveMinutes();
// Leads first: retry the agency e-mails that failed while the mailer was down (see SendValuationRequest).
Schedule::command('valuations:resend-mails')->hourly();
