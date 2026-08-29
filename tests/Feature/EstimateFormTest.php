<?php

namespace Tests\Feature;

use App\Domain\Valuation\Models\ValuationRequest;
use App\Mail\ValuationConfirmationMail;
use App\Mail\ValuationRequestMail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** Valuation page + form: SSR page with the options, server-side validation, honeypot, e-mails to the agency and the owner. */
class EstimateFormTest extends TestCase
{
    use RefreshDatabase;

    /** @return array<string, mixed> */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'property_type' => 'apartment',
            'full_name' => 'Jean Dupont',
            'email' => 'Jean.Dupont@Example.com',
            'phone' => '+33 6 12 34 56 78',
            'address' => '12 rue de Seine, 75006 Paris',
            'surface' => 120,
            'floor' => '3',
            'elevator' => '1',
            'rooms' => 4,
            'bedrooms' => 2,
            'features' => ['bright', 'metro'],
            'condition' => 'good',
            'estimated_value' => 1500000,
            'contact_method' => 'phone',
            'message' => 'Vue sur cour, cave et parking.',
            'consent' => '1',
        ], $overrides);
    }

    public function test_estimate_page_lists_the_options_and_the_texts(): void
    {
        $this->get('/estimation-immobiliere-paris')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->component('estimate')
                ->where('propertyTypes', ['apartment', 'duplex', 'studio', 'mansion', 'house', 'loft', 'building', 'other'])
                ->where('contactMethods', ['phone', 'whatsapp', 'email'])
                ->where('floors.0', 'ground')
                ->where('conditions', ['renovate', 'good', 'new']));

        foreach (['fr', 'en'] as $locale) {
            app()->setLocale($locale);
            foreach (['headline', 'subtitle', 'step_type', 'submit', 'sent', 'property_types.apartment', 'contact_methods.whatsapp'] as $key) {
                $this->assertNotSame("ui.estimate.$key", __("ui.estimate.$key"), "[$locale] missing ui.estimate.$key");
            }
        }
    }

    public function test_a_valid_request_is_stored_emailed_and_confirmed(): void
    {
        Mail::fake();
        config(['seo.organization.email' => 'agence@example.test']);

        $this->from('/estimation-immobiliere-paris')->post('/estimation-immobiliere-paris', $this->payload())
            ->assertRedirect('/estimation-immobiliere-paris')
            ->assertSessionHas('success', __('ui.estimate.sent'))
            ->assertSessionHas('valuation_reference', 'VAL-'.now()->format('Y').'-0001');

        $this->assertDatabaseHas('valuation_requests', [
            'email' => 'jean.dupont@example.com',
            'property_type' => 'apartment',
            'surface' => 120,
            'rooms' => 4,
            'bedrooms' => 2,
            'estimated_value' => 1500000,
            'contact_method' => 'phone',
            'floor' => '3',
            'elevator' => 1,
            'condition' => 'good',
            'locale' => 'fr',
        ]);
        $this->assertSame(['bright', 'metro'], ValuationRequest::first()->features);
        $this->assertNotNull(ValuationRequest::first()->mail_sent_at);
        $this->assertNotNull(ValuationRequest::first()->consent_at);

        Mail::assertSent(ValuationRequestMail::class, function (ValuationRequestMail $mail) {
            $html = $mail->render();

            return $mail->hasTo('agence@example.test')
                && $mail->envelope()->subject === 'Demande d\'estimation — Jean Dupont (Appartement)'
                && $mail->reference === ValuationRequest::first()->reference
                && str_contains($html, ValuationRequest::first()->reference)
                && str_contains($html, '12 rue de Seine, 75006 Paris')
                && str_contains($html, '120 m²')
                && str_contains($html, '3e')
                && str_contains($html, 'Ascenseur')
                && str_contains($html, 'Lumineux, Proche métro')
                && str_contains($html, 'Bon état')
                && str_contains($html, '1 500 000 €');
        });
        Mail::assertSent(ValuationConfirmationMail::class, fn (ValuationConfirmationMail $mail) => $mail->hasTo('jean.dupont@example.com') && str_contains($mail->render(), 'Sous 24 heures ouvrées'));
    }

    public function test_validation_rejects_bad_values_and_the_honeypot(): void
    {
        Mail::fake();

        $this->from('/estimation-immobiliere-paris')
            ->post('/estimation-immobiliere-paris', $this->payload(['property_type' => 'castle', 'surface' => 2, 'rooms' => 11, 'bedrooms' => 12, 'floor' => '99', 'condition' => 'ruin', 'features' => ['pool'], 'contact_method' => 'fax', 'consent' => '0', 'message' => str_repeat('a', 2001)]))
            ->assertSessionHasErrors(['property_type', 'surface', 'rooms', 'bedrooms', 'floor', 'condition', 'features.0', 'contact_method', 'consent', 'message']);

        $this->from('/estimation-immobiliere-paris')->post('/estimation-immobiliere-paris', $this->payload(['surface' => 1000]))->assertSessionHasErrors('surface'); // 999 m² max
        $this->from('/estimation-immobiliere-paris')->post('/estimation-immobiliere-paris', $this->payload(['phone' => '+33 6 12 34 56 78 90 12 34']))->assertSessionHasErrors('phone'); // 17 digits > E.164 (15)
        $this->from('/estimation-immobiliere-paris')->post('/estimation-immobiliere-paris', $this->payload(['website' => 'http://spam']))->assertSessionHasErrors('website');

        $this->assertDatabaseCount('valuation_requests', 0);
        Mail::assertNothingSent();
    }

    public function test_optional_fields_can_be_left_empty(): void
    {
        Mail::fake();

        $this->post('/estimation-immobiliere-paris', $this->payload(['floor' => '', 'condition' => '', 'estimated_value' => '', 'message' => '', 'elevator' => null, 'features' => null]))->assertSessionHasNoErrors();

        $row = ValuationRequest::first();
        $this->assertNull($row->floor);
        $this->assertNull($row->condition);
        $this->assertFalse($row->elevator);
        $this->assertSame([], $row->features);
        $this->assertNull($row->estimated_value);
        $this->assertNull($row->message);
    }

    public function test_requests_are_rate_limited(): void
    {
        Mail::fake();

        for ($i = 0; $i < 5; $i++) {
            $this->post('/estimation-immobiliere-paris', $this->payload(['email' => "user$i@example.com"]))->assertRedirect();
        }

        $this->post('/estimation-immobiliere-paris', $this->payload())->assertStatus(429);
    }

    public function test_the_english_form_posts_to_the_english_url_and_mails_in_english(): void
    {
        $this->withLocale('en'); // re-creates the app (fresh in-memory DB): migrate and fake the mailer afterwards
        $this->artisan('migrate');
        Mail::fake();

        $this->post('/en/property-valuation-paris', $this->payload())->assertRedirect()->assertSessionHas('success', __('ui.estimate.sent'));
        Mail::assertSent(ValuationConfirmationMail::class, fn (ValuationConfirmationMail $mail) => $mail->valuation->locale === 'en' && str_contains($mail->render(), 'Within 24 business hours'));
    }
}
