<?php

namespace Tests\Feature;

use App\Domain\Properties\Actions\UnlockOffMarket;
use App\Domain\Properties\Data\Property;
use App\Domain\Properties\Support\OffMarketAccess;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Support\Facades\Cache;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** The four-digit access code of each off-market listing (user decision 2026-09-29; per-listing codes from Sanity, 2026-10-14). */
class OffMarketAccessTest extends TestCase
{
    private const LISTING = '/nos-biens/achat/paris-6e/appartement-saint-germain-des-pres';

    public function test_a_confidential_listing_url_renders_the_gate_with_only_its_kind_until_its_code_unlocks_it(): void
    {
        $this->get(self::LISTING)
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->component('properties/locked')
                ->where('teaser', ['type' => 'apartment', 'transaction' => 'sale', 'arrondissement' => 6, 'slug' => 'appartement-saint-germain-des-pres'])
                ->missing('property')
                ->where('translations.off_market.code_label', "Code d'accès"));
        // Nothing identifying in the HTML either, and never the code
        $html = $this->get(self::LISTING)->getContent();
        $this->assertStringNotContainsString('Saint-Germain-des-Prés', $html);
        $this->assertStringNotContainsString('2468', $html);

        // The listing's own code (fixture `access_code`) unlocks it and sends the visitor back to the page
        $this->from(self::LISTING)->post('/biens-off-market', ['code' => '2468', 'property' => 'appartement-saint-germain-des-pres'])->assertRedirect(url(self::LISTING))->assertSessionHasNoErrors();
        $this->assertSame(['EIP-0601'], OffMarketAccess::unlockedKeys(session()->driver()), 'unlocked by reference: both languages');
        $this->get(self::LISTING)
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->component('properties/show')->where('property.slug', 'appartement-saint-germain-des-pres')->where('property.off_market', true)->where('meta.noindex', true)->missing('property.access_code'));
        // The selection now shows it
        $this->get('/biens-off-market')->assertOk()->assertInertia(fn (Assert $p) => $p->component('off-market')->has('properties', 1)->missing('properties.0.access_code'));
        // And its English twin opens too (same reference)
        $this->withLocale('en')->withSession([OffMarketAccess::SESSION_KEY => ['EIP-0601']])->get('/en/properties/buy/paris-6th/apartment-saint-germain-des-pres')->assertOk()->assertInertia(fn (Assert $p) => $p->component('properties/show'));
    }

    public function test_the_selection_is_gated_and_a_wrong_or_malformed_code_is_refused(): void
    {
        $this->withoutMiddleware(ThrottleRequests::class); // more than five tries here; the throttle has its own test
        $this->get('/biens-off-market')->assertOk()->assertInertia(fn (Assert $p) => $p->component('properties/locked')->where('teaser', null));

        $this->from('/biens-off-market')->post('/biens-off-market', ['code' => '0000'])->assertRedirect(url('/biens-off-market'))->assertSessionHasErrors(['code' => "Ce code n'est pas correct."]);
        $this->from('/biens-off-market')->post('/biens-off-market', ['code' => '246'])->assertSessionHasErrors(['code' => 'Le code comporte 4 chiffres.']);
        $this->from('/biens-off-market')->post('/biens-off-market', ['code' => '24680'])->assertSessionHasErrors(['code' => 'Le code comporte 4 chiffres.']);
        $this->from('/biens-off-market')->post('/biens-off-market', ['code' => 'abcd'])->assertSessionHasErrors('code');
        $this->from('/biens-off-market')->post('/biens-off-market', [])->assertSessionHasErrors(['code' => "Saisissez votre code d'accès."]);
        // The right code of another listing does not open this one
        $this->from(self::LISTING)->post('/biens-off-market', ['code' => '2468', 'property' => 'appartement-champ-de-mars'])->assertSessionHasErrors('code');
        $this->assertSame([], OffMarketAccess::unlockedKeys(session()->driver()));
        $this->get('/biens-off-market')->assertInertia(fn (Assert $p) => $p->component('properties/locked'));

        // From the selection's gate, a code is tried against every confidential listing
        $this->from('/biens-off-market')->post('/biens-off-market', ['code' => '2468'])->assertSessionHasNoErrors();
        $this->get('/biens-off-market')->assertInertia(fn (Assert $p) => $p->component('off-market')->has('properties', 1));

        // English twin (the helper switches the routes for the rest of the test: last)
        $this->withLocale('en')->get('/en/off-market-properties')->assertOk()->assertInertia(fn (Assert $p) => $p->component('properties/locked'));
    }

    public function test_a_listing_without_a_code_never_unlocks_and_the_attempts_are_throttled(): void
    {
        $row = collect(self::sampleProperties('fr'))->firstWhere('slug', 'appartement-saint-germain-des-pres');
        $this->assertFalse(OffMarketAccess::matches(Property::fromArray(array_diff_key($row, ['access_code' => true])), '2468'));
        $this->assertFalse(OffMarketAccess::matches(Property::fromArray($row), ''));
        $this->assertTrue(OffMarketAccess::matches(Property::fromArray($row), '2468'));

        // Five tries a minute per IP against a four-digit code
        foreach (range(1, 5) as $i) {
            $this->post('/biens-off-market', ['code' => '1111'])->assertRedirect();
        }
        $this->post('/biens-off-market', ['code' => '1111'])->assertStatus(429);
    }

    public function test_a_gate_locks_for_an_hour_after_twenty_wrong_codes_from_anyone(): void
    {
        $this->withoutMiddleware(ThrottleRequests::class); // the per-IP throttle is tested above; this is the per-gate lock (review 2026-10-14)
        $unlock = app(UnlockOffMarket::class);
        foreach (range(1, UnlockOffMarket::MAX_FAILURES) as $i) {
            $this->assertNull($unlock('0000', session()->driver(), 'appartement-saint-germain-des-pres'));
        }
        $this->assertNull($unlock('2468', session()->driver(), 'appartement-saint-germain-des-pres'), 'the right code is refused while the gate is locked');
        $this->assertNull($unlock('0000', session()->driver(), 'slug-inconnu'));
        $this->assertNull(Cache::get('off_market:failures:slug-inconnu'), 'an unknown slug never creates a counter');
        $this->assertNotNull($unlock('2468', session()->driver()), 'the selection gate keeps its own counter');
        $this->travel(61)->minutes();
        $this->assertNotNull($unlock('2468', session()->driver(), 'appartement-saint-germain-des-pres'), 'unlocked again after the hour');
    }
}
