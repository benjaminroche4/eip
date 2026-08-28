<?php

namespace Tests\Feature;

use App\Domain\Contact\Models\ContactRequest;
use App\Mail\ContactConfirmationMail;
use App\Mail\ContactMessageMail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** Contact page + form: SSR page with the topics, server-side validation, honeypot, e-mail to the agency. */
class ContactFormTest extends TestCase
{
    use RefreshDatabase;

    /** @return array<string, string> */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'first_name' => 'Jean',
            'last_name' => 'Dupont',
            'email' => 'Jean.Dupont@Example.com',
            'phone' => '+33 6 12 34 56 78',
            'topic' => 'buy',
            'message' => 'Je souhaite acheter un appartement dans le Marais.',
            'consent' => '1',
        ], $overrides);
    }

    public function test_contact_page_lists_the_topics_and_the_geo_answer_texts(): void
    {
        $this->get('/contact')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->component('contact')->where('topics', ['buy', 'sell', 'invest', 'valuation', 'off_market', 'other']));

        foreach (['fr', 'en'] as $locale) {
            app()->setLocale($locale);
            foreach (['headline', 'form_title', 'submit', 'sent'] as $key) {
                $this->assertNotSame("ui.contact.$key", __("ui.contact.$key"), "[$locale] missing ui.contact.$key");
            }
        }
    }

    public function test_a_valid_request_emails_the_agency_and_flashes_a_success_message(): void
    {
        Mail::fake();
        config(['seo.organization.email' => 'agence@example.test']);

        $this->from('/contact')->post('/contact', $this->payload())
            ->assertRedirect('/contact')
            ->assertSessionHas('success', __('ui.contact.sent'))
            ->assertSessionHas('callback_phone', '+33 6 12 34 56 78');

        Mail::assertSent(ContactMessageMail::class, function (ContactMessageMail $mail) {
            $envelope = $mail->envelope();

            return $mail->hasTo('agence@example.test')
                && $mail->contact->email === 'jean.dupont@example.com'
                && $mail->contact->fullName() === 'Jean Dupont'
                && $envelope->replyTo[0]->address === 'jean.dupont@example.com'
                && str_contains($envelope->subject, 'Jean Dupont')
                && str_contains($mail->render(), 'Marais');
        });
    }

    public function test_the_prospect_receives_a_styled_confirmation_in_their_language_with_the_agency_details(): void
    {
        Mail::fake();
        config([
            'seo.organization.phone' => '+33 1 84 80 43 44',
            'seo.organization.email' => 'contact@estate-in-paris.fr',
            'seo.organization.whatsapp' => '33184804344',
            'seo.organization.address' => ['street' => '3 rue Grégoire de Tours', 'postal_code' => '75006', 'city' => 'Paris', 'country' => 'FR'],
            'seo.advisor.name' => 'Charles Mata',
            'seo.advisor.role' => ['fr' => 'Conseiller senior', 'en' => 'Senior advisor'],
        ]);

        $this->post('/contact', $this->payload(['message' => "Ligne 1\nLigne 2"]))->assertRedirect();

        Mail::assertSent(ContactConfirmationMail::class, function (ContactConfirmationMail $mail) {
            $html = $mail->render();

            return $mail->hasTo('jean.dupont@example.com')
                && $mail->envelope()->replyTo[0]->address === 'contact@estate-in-paris.fr'
                && $mail->locale === 'fr'
                && str_contains($mail->envelope()->subject, 'Votre demande a bien été reçue')
                && str_contains($html, 'Bonjour Jean,')
                && str_contains($html, '+33 6 12 34 56 78')          // callback number
                && str_contains($html, 'Acheter un bien')             // topic label
                && str_contains($html, 'Ligne 1')
                && str_contains($html, 'Charles Mata')
                && str_contains($html, '3 rue Grégoire de Tours, 75006 Paris, France')
                && str_contains($html, 'tel:+33184804344')
                && str_contains($html, 'mailto:contact@estate-in-paris.fr')
                && str_contains($html, 'https://wa.me/33184804344')
                && str_contains($html, 'google.com/maps')
                && str_contains($html, config('seo.hours.labels.fr'))
                && str_contains($html, 'text/html') === false; // rendered body, not headers
        });

        Mail::assertSent(ContactMessageMail::class, function (ContactMessageMail $mail) {
            $html = $mail->render();

            return str_contains($html, 'tel:+33612345678')
                && str_contains($html, 'mailto:jean.dupont@example.com')
                && str_contains($html, 'Jean Dupont')
                && str_contains($html, 'Ligne 1')
                && str_contains($html, 'Consentement donné');
        });
    }

    public function test_a_valid_request_is_stored_with_its_technical_context(): void
    {
        Mail::fake();

        $this->withHeaders(['User-Agent' => 'PHPUnit/1.0', 'Referer' => 'https://www.example.test/acheter'])
            ->post('/contact', $this->payload())
            ->assertRedirect();

        $this->assertDatabaseCount('contact_requests', 1);
        $stored = ContactRequest::sole();
        $this->assertSame('Jean', $stored->first_name);
        $this->assertSame('jean.dupont@example.com', $stored->email);
        $this->assertSame('buy', $stored->topic);
        $this->assertSame('fr', $stored->locale);
        $this->assertSame('127.0.0.1', $stored->ip);
        $this->assertSame('PHPUnit/1.0', $stored->user_agent);
        $this->assertSame('https://www.example.test/acheter', $stored->referer);
        $this->assertNotNull($stored->consent_at);
        $this->assertNotNull($stored->mail_sent_at);
        $this->assertNull($stored->handled_at);
    }

    public function test_the_request_is_kept_even_when_the_email_cannot_be_sent(): void
    {
        config(['mail.default' => 'failing']);
        config(['mail.mailers.failing' => ['transport' => 'smtp', 'host' => '127.0.0.1', 'port' => 1, 'timeout' => 1]]);

        $this->post('/contact', $this->payload())->assertRedirect()->assertSessionHas('success');

        $stored = ContactRequest::sole();
        $this->assertNull($stored->mail_sent_at);
    }

    public function test_it_falls_back_to_the_mail_from_address_when_no_organization_email_is_set(): void
    {
        Mail::fake();
        config(['seo.organization.email' => null, 'mail.from.address' => 'fallback@example.test']);

        $this->post('/contact', $this->payload())->assertRedirect();

        Mail::assertSent(ContactMessageMail::class, fn (ContactMessageMail $mail) => $mail->hasTo('fallback@example.test'));
    }

    public function test_invalid_input_is_rejected_field_by_field_without_sending_anything(): void
    {
        Mail::fake();

        $this->from('/contact')->post('/contact', $this->payload([
            'first_name' => '',
            'email' => 'not-an-email',
            'phone' => 'abc',
            'topic' => 'hacking',
            'message' => str_repeat('x', 2001),
        ]))
            ->assertRedirect('/contact')
            ->assertSessionHasErrors(['first_name', 'email', 'phone', 'topic', 'message']);

        Mail::assertNothingSent();
        $this->assertDatabaseCount('contact_requests', 0);
    }

    public function test_the_message_is_optional(): void
    {
        Mail::fake();

        $this->post('/contact', $this->payload(['message' => '']))->assertRedirect()->assertSessionHasNoErrors();

        $this->assertNull(ContactRequest::sole()->message);
        Mail::assertSent(ContactMessageMail::class);
    }

    public function test_consent_is_mandatory(): void
    {
        Mail::fake();

        $this->from('/contact')->post('/contact', $this->payload(['consent' => '0']))
            ->assertRedirect('/contact')
            ->assertSessionHasErrors(['consent' => __('ui.contact.consent_required')]);

        Mail::assertNothingSent();
        $this->assertDatabaseCount('contact_requests', 0);
    }

    public function test_the_honeypot_rejects_bots(): void
    {
        Mail::fake();

        $this->post('/contact', $this->payload(['website' => 'https://spam.example']))
            ->assertSessionHasErrors('website');

        Mail::assertNothingSent();
    }

    public function test_the_english_form_posts_to_the_english_url(): void
    {
        $this->withLocale('en'); // re-creates the app (fresh in-memory DB): migrate and fake the mailer afterwards
        $this->artisan('migrate');
        Mail::fake();

        $this->post('/en/contact', $this->payload())->assertRedirect()->assertSessionHas('success', __('ui.contact.sent'));
        Mail::assertSent(ContactMessageMail::class, fn (ContactMessageMail $mail) => $mail->contact->locale === 'en');
        Mail::assertSent(ContactConfirmationMail::class, fn (ContactConfirmationMail $mail) => $mail->contact->locale === 'en'
            && str_contains($mail->envelope()->subject, 'We have received your request')
            && str_contains($mail->render(), 'within 30 minutes'));
    }

    public function test_the_acknowledgement_failure_never_blocks_the_request(): void
    {
        Mail::shouldReceive('to')->once()->andReturnSelf(); // agency mail
        Mail::shouldReceive('send')->once();
        Mail::shouldReceive('to')->once()->andThrow(new \RuntimeException('smtp down')); // acknowledgement

        $this->post('/contact', $this->payload())->assertRedirect()->assertSessionHas('success');
        $this->assertDatabaseCount('contact_requests', 1);
    }

    public function test_the_page_carries_one_callback_promise_in_both_languages(): void
    {
        foreach (['fr', 'en'] as $locale) {
            app()->setLocale($locale);
            foreach (['contact.success_text', 'contact.advisor_delay_value', 'contact.form_text', 'mail.callback_text'] as $key) {
                $this->assertStringNotContainsString('24', __("ui.$key", ['minutes' => 30, 'hours' => 'h']), "[$locale] $key still promises 24 h");
                $this->assertStringContainsString('30', __("ui.$key", ['minutes' => 30, 'hours' => 'h']), "[$locale] $key must carry the 30-minute promise");
            }
        }
    }

    public function test_submissions_are_rate_limited(): void
    {
        Mail::fake();

        foreach (range(1, 5) as $i) {
            $this->post('/contact', $this->payload())->assertRedirect();
        }
        $this->post('/contact', $this->payload())->assertStatus(429);
    }
}
