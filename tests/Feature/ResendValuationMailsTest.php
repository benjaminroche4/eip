<?php

namespace Tests\Feature;

use App\Domain\Valuation\Models\ValuationRequest;
use App\Mail\ValuationRequestMail;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ResendValuationMailsTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_resends_only_the_agency_mails_that_failed_and_marks_them_sent(): void
    {
        Mail::fake();
        $failed = ValuationRequest::factory()->mailFailed()->create();
        $sent = ValuationRequest::factory()->create(['mail_sent_at' => now()->subDay()]);

        $this->artisan('valuations:resend-mails')->assertSuccessful()->expectsOutputToContain('1 of 1');

        Mail::assertSent(ValuationRequestMail::class, fn (ValuationRequestMail $mail) => $mail->reference === $failed->reference && $mail->valuation->email === $failed->email);
        Mail::assertSent(ValuationRequestMail::class, 1);
        $this->assertNotNull($failed->fresh()->mail_sent_at);
        $this->assertSame($sent->mail_sent_at->toDateTimeString(), $sent->fresh()->mail_sent_at->toDateTimeString());
    }

    public function test_it_is_scheduled_hourly(): void
    {
        $events = collect(app(Schedule::class)->events())->map(fn ($e) => [$e->command, $e->expression]);
        $this->assertTrue($events->contains(fn ($e) => str_contains((string) $e[0], 'valuations:resend-mails') && $e[1] === '0 * * * *'));
    }
}
