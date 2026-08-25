<?php

namespace Tests\Feature;

use App\Mail\ContactMessageMail;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** Contact page + form: SSR page with the topics, server-side validation, honeypot, e-mail to the agency. */
class ContactFormTest extends TestCase
{
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
        ], $overrides);
    }

    public function test_contact_page_lists_the_topics_and_the_geo_answer_texts(): void
    {
        $this->get('/contact')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->component('contact')->where('topics', ['buy', 'sell', 'invest', 'valuation', 'off_market', 'other']));

        foreach (['fr', 'en'] as $locale) {
            app()->setLocale($locale);
            foreach (['headline', 'form_title', 'submit', 'sent', 'benefit_1_title'] as $key) {
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
            ->assertSessionHas('success', __('ui.contact.sent'));

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
            'message' => 'court',
        ]))
            ->assertRedirect('/contact')
            ->assertSessionHasErrors(['first_name', 'email', 'phone', 'topic', 'message']);

        Mail::assertNothingSent();
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
        $this->withLocale('en'); // re-creates the app: fake the mailer afterwards
        Mail::fake();

        $this->post('/en/contact', $this->payload())->assertRedirect()->assertSessionHas('success', __('ui.contact.sent'));
        Mail::assertSent(ContactMessageMail::class, fn (ContactMessageMail $mail) => $mail->contact->locale === 'en');
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
