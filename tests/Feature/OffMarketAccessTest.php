<?php

namespace Tests\Feature;

use App\Domain\Properties\Support\OffMarketAccess;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** The six-digit access code gating the off-market listings (user decision 2026-09-29). */
class OffMarketAccessTest extends TestCase
{
    private const LISTING = '/nos-biens/achat/paris-6e/appartement-saint-germain-des-pres';

    protected function setUp(): void
    {
        parent::setUp();
        config(['properties.off_market_code' => '246810']);
    }

    public function test_a_confidential_listing_url_renders_the_gate_with_only_its_kind_until_the_session_is_unlocked(): void
    {
        $this->get(self::LISTING)
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->component('properties/locked')
                ->where('teaser', ['type' => 'apartment', 'transaction' => 'sale', 'arrondissement' => 6])
                ->missing('property')
                ->where('translations.off_market.code_label', "Code d'accès"));
        // Nothing identifying in the HTML either
        $this->assertStringNotContainsString('Saint-Germain-des-Prés', $this->get(self::LISTING)->getContent());

        // The right code unlocks the session and sends the visitor back to the page
        $this->from(self::LISTING)->post('/biens-off-market', ['code' => '246810'])->assertRedirect(url(self::LISTING))->assertSessionHasNoErrors();
        $this->assertTrue(OffMarketAccess::isUnlocked(session()->driver()));
        $this->get(self::LISTING)
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->component('properties/show')->where('property.slug', 'appartement-saint-germain-des-pres')->where('property.off_market', true)->where('meta.noindex', true));
        // The selection too
        $this->get('/biens-off-market')->assertOk()->assertInertia(fn (Assert $p) => $p->component('off-market')->has('properties', 1));
    }

    public function test_the_selection_is_gated_and_a_wrong_or_malformed_code_is_refused(): void
    {
        $this->get('/biens-off-market')->assertOk()->assertInertia(fn (Assert $p) => $p->component('properties/locked')->where('teaser', null));

        $this->from('/biens-off-market')->post('/biens-off-market', ['code' => '000000'])->assertRedirect(url('/biens-off-market'))->assertSessionHasErrors(['code' => "Ce code n'ouvre pas l'accès. Vérifiez-le ou demandez-en un à votre conseiller."]);
        $this->from('/biens-off-market')->post('/biens-off-market', ['code' => '12345'])->assertSessionHasErrors(['code' => 'Le code comporte 6 chiffres.']);
        $this->from('/biens-off-market')->post('/biens-off-market', ['code' => 'abcdef'])->assertSessionHasErrors('code');
        $this->from('/biens-off-market')->post('/biens-off-market', [])->assertSessionHasErrors(['code' => "Saisissez votre code d'accès."]);
        $this->assertFalse(OffMarketAccess::isUnlocked(session()->driver()));
        $this->get('/biens-off-market')->assertInertia(fn (Assert $p) => $p->component('properties/locked'));
        // English twin (the helper switches the routes for the rest of the test: last)
        $this->withLocale('en')->get('/en/off-market-properties')->assertOk()->assertInertia(fn (Assert $p) => $p->component('properties/locked'));
    }

    public function test_without_a_configured_code_nothing_unlocks_and_the_attempts_are_throttled(): void
    {
        config(['properties.off_market_code' => null]);
        $this->from('/biens-off-market')->post('/biens-off-market', ['code' => '246810'])->assertSessionHasErrors('code');
        $this->assertFalse(OffMarketAccess::matches(''));
        $this->assertFalse(OffMarketAccess::isUnlocked(session()->driver()));

        // Five tries a minute per IP against a six-digit code
        foreach (range(1, 4) as $i) {
            $this->post('/biens-off-market', ['code' => '111111'])->assertRedirect();
        }
        $this->post('/biens-off-market', ['code' => '111111'])->assertStatus(429);
    }
}
