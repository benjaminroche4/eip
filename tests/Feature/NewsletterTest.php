<?php

namespace Tests\Feature;

use App\Domain\Newsletter\Models\NewsletterSubscriber;
use App\Mail\NewsletterWelcomeMail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** Newsletter page + subscription form: SSR page with the next issue date, validation, honeypot, idempotent storage. */
class NewsletterTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow(); // the first test freezes time; never leak it into the next one
        parent::tearDown();
    }

    public function test_newsletter_page_exposes_the_next_monday_in_the_visitor_language(): void
    {
        Carbon::setTestNow('2026-08-27 10:00:00'); // a Thursday

        $this->get('/newsletter')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->component('newsletter')->where('nextIssue.iso', '2026-08-31')->where('nextIssue.label', 'lundi 31 août'));

        $this->withLocale('en')->get('/en/newsletter')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->where('nextIssue.label', 'Monday 31 August'));

        foreach (['fr', 'en'] as $locale) {
            app()->setLocale($locale);
            foreach (['headline', 'submit', 'sent', 'no_spam', 'benefits.opportunities.title'] as $key) {
                $this->assertNotSame("ui.newsletter.$key", __("ui.newsletter.$key"), "[$locale] missing ui.newsletter.$key");
            }
        }
    }

    public function test_a_valid_email_is_stored_once_and_flashes_a_success_message(): void
    {
        Mail::fake();

        $this->from('/newsletter')->post('/newsletter', ['email' => 'Jean.Dupont@Example.com'])
            ->assertRedirect('/newsletter')
            ->assertSessionHas('newsletter_success', __('ui.newsletter.sent'));

        $this->assertDatabaseHas('newsletter_subscribers', ['email' => 'jean.dupont@example.com', 'locale' => 'fr']);
        $this->assertNotNull(NewsletterSubscriber::first()->welcome_sent_at);
        Mail::assertSent(NewsletterWelcomeMail::class, function (NewsletterWelcomeMail $mail) {
            $envelope = $mail->envelope();

            return $mail->hasTo('jean.dupont@example.com')
                && $envelope->subject === __('ui.mail.newsletter_subject', ['name' => config('seo.site_name')])
                && str_contains($mail->render(), __('ui.mail.newsletter_title')); // Blade escapes apostrophes: compare a plain string
        });

        // An address already active gets the very same success (nothing leaks), no duplicate row, no second welcome.
        $this->from('/newsletter')->post('/newsletter', ['email' => 'jean.dupont@example.com'])
            ->assertRedirect('/newsletter')
            ->assertSessionHasNoErrors()
            ->assertSessionHas('newsletter_success', __('ui.newsletter.sent'));
        Mail::assertSentCount(1);

        // An unsubscribed address is re-activated on the same row instead of failing on the unique index.
        NewsletterSubscriber::first()->update(['unsubscribed_at' => now()]);
        $this->from('/newsletter')->post('/newsletter', ['email' => 'jean.dupont@example.com'])
            ->assertRedirect('/newsletter')
            ->assertSessionHasNoErrors();

        $this->assertSame(1, NewsletterSubscriber::count());
        $this->assertNull(NewsletterSubscriber::first()->unsubscribed_at);
    }

    public function test_the_visitor_language_is_stored_with_the_subscription(): void
    {
        $this->withLocale('en'); // re-creates the app (fresh in-memory DB): migrate and fake the mailer afterwards
        $this->artisan('migrate');
        Mail::fake();

        $this->from('/en/newsletter')->post('/en/newsletter', ['email' => 'jane@example.com'])
            ->assertRedirect('/en/newsletter')
            ->assertSessionHas('newsletter_success', __('ui.newsletter.sent'));

        $this->assertDatabaseHas('newsletter_subscribers', ['email' => 'jane@example.com', 'locale' => 'en']);
        Mail::assertSent(NewsletterWelcomeMail::class, fn (NewsletterWelcomeMail $mail) => $mail->subscriber->locale === 'en' && str_contains($mail->render(), 'Welcome aboard'));
    }

    public function test_invalid_email_and_honeypot_are_rejected(): void
    {
        $this->from('/newsletter')->post('/newsletter', ['email' => 'not-an-email'])->assertSessionHasErrors('email');
        $this->from('/newsletter')->post('/newsletter', ['email' => 'bot@example.com', 'website' => 'http://spam'])->assertSessionHasErrors('website');

        $this->assertDatabaseCount('newsletter_subscribers', 0);
    }

    public function test_subscriptions_are_rate_limited(): void
    {
        Mail::fake();
        for ($i = 0; $i < 5; $i++) {
            $this->post('/newsletter', ['email' => "user$i@example.com"])->assertRedirect();
        }

        $this->post('/newsletter', ['email' => 'user6@example.com'])->assertStatus(429);
    }

    public function test_the_next_issue_is_today_on_a_monday_and_the_next_monday_otherwise(): void
    {
        Carbon::setTestNow('2026-08-31 09:00:00'); // a Monday
        $this->get('/newsletter')->assertInertia(fn ($page) => $page->where('nextIssue.iso', '2026-08-31'));

        Carbon::setTestNow('2026-09-01 09:00:00'); // Tuesday
        $this->get('/newsletter')->assertInertia(fn ($page) => $page->where('nextIssue.iso', '2026-09-07'));

        Carbon::setTestNow();
    }

    public function test_an_invalid_address_gets_a_human_message(): void
    {
        $this->from('/newsletter')->post('/newsletter', ['email' => 'not-an-email'])
            ->assertRedirect('/newsletter')
            ->assertSessionHasErrors(['email' => __('ui.newsletter.email_invalid')]);
    }
}
