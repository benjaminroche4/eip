<?php

namespace Tests\Feature;

use App\Domain\Properties\Actions\FetchSanityProperties;
use App\Domain\Properties\Actions\ListProperties;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;
use Tests\Unit\Domain\Properties\SanityPropertyTest;

/** « Nos biens » read from Sanity (`estateProperty`, 2026-10-14): the GROQ query faked, no network. */
class PropertiesSanityTest extends TestCase
{
    /** @param list<array<string, mixed>>|null $docs null = Sanity down */
    private function fakeSanity(?array $docs): void
    {
        config(['services.sanity.project_id' => 'ks9vwq45', 'services.sanity.token' => 'secret-token', 'services.sanity.use_cdn' => false, 'services.sanity.property_type' => 'estateProperty']);
        Http::fake(function (Request $request) use ($docs) {
            $this->assertStringStartsWith('https://ks9vwq45.api.sanity.io/', $request->url());
            $this->assertSame('published', $request->data()['perspective'] ?? null, 'drafts never reach the site');
            if (($request->data()['$type'] ?? null) !== '"estateProperty"') {
                return Http::response(['result' => []]); // the blog queries of `sanity:warm`
            }
            $this->assertStringContainsString('translation.metadata', (string) $request->data()['query'], 'the twin slugs come with the documents');

            return $docs === null ? Http::response('down', 503) : Http::response(['result' => $docs]);
        });
        // The real action in place of the fixture rows bound by TestCase
        $this->app->bind(ListProperties::class, fn () => new ListProperties(app(FetchSanityProperties::class)));
    }

    /** @return list<array<string, mixed>> the Studio's test listing in French and its English twin, plus a sold one and a draft-looking stray */
    private function docs(): array
    {
        return [
            SanityPropertyTest::doc(['translations' => [['lang' => 'fr', 'slug' => 'test-4-pieces-haussmannien-avec-balcon-paris-7e'], ['lang' => 'en', 'slug' => 'test-4-room-haussmann-apartment-paris-7th']]]),
            SanityPropertyTest::doc(['_id' => 'estateProperty-test-en', 'language' => 'en', 'slug' => 'test-4-room-haussmann-apartment-paris-7th', 'title' => '[TEST] 4-room Haussmann apartment with balcony, Paris 7th', 'propertyType' => 'apartment', 'categories' => [['slug' => 'exclusive', 'name' => 'Exclusive']], 'metaDescription' => 'Haussmann 4-room apartment of 118 sqm with balcony, 3 bedrooms, Paris 7th.']),
            SanityPropertyTest::doc(['_id' => 'sold-fr', 'slug' => 'vendu-paris-6e', 'uniqueId' => 'EP0002', 'status' => 'sold', 'arrondissement' => 6, 'createdAt' => '2026-08-01T00:00:00Z', 'metro' => ['Odéon']]),
            SanityPropertyTest::doc(['_id' => 'sans-langue', 'slug' => 'sans-langue', 'language' => null]),
            SanityPropertyTest::doc(['_id' => 'confidentiel-fr', 'slug' => 'confidentiel-paris-8e', 'uniqueId' => 'EP0003', 'confidential' => true, 'accessCode' => '7351', 'arrondissement' => 8, 'createdAt' => '2026-09-01T00:00:00Z', 'price' => 5400000]),
            SanityPropertyTest::doc(['_id' => 'sur-demande-fr', 'slug' => 'prix-sur-demande-paris-16e', 'uniqueId' => 'EP0004', 'priceOnRequest' => true, 'arrondissement' => 16, 'createdAt' => '2026-08-15T00:00:00Z', 'price' => 7200000, 'metro' => ['Passy'], 'metaDescription' => null]), // no Studio meta: the generated one
        ];
    }

    public function test_the_listing_the_badge_and_the_district_links_read_the_published_documents(): void
    {
        $this->fakeSanity($this->docs());

        $this->get('/nos-biens')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->component('properties')
                ->has('properties', 3) // the French listings: the sold one is out of the catalogue, the English one belongs to /en, the one without a language is ignored
                // The confidential one (Sanity `confidential`) is redacted on the listing: no price, excerpt nor position reaches the browser, one photo only
                ->where('properties.1.slug', 'confidentiel-paris-8e')
                ->where('properties.1.off_market', true)
                ->where('properties.1.price', 0)
                ->where('properties.1.price_on_request', true)
                ->where('properties.1.lat', null)
                ->where('properties.1.excerpt', '')
                ->has('properties.1.photos', 1)
                ->where('properties.0.slug', 'test-4-pieces-haussmannien-avec-balcon-paris-7e')
                ->where('properties.0.price', 1890000)
                ->where('properties.0.advisor.name', 'Charles Mata')
                ->where('properties.0.photos.0', 'https://cdn.sanity.io/images/ks9vwq45/production/0d0f3c13ae6aa78d6f4bed72d5a05cb333435019-1448x1086.webp?w={w}&auto=format&fit=max')
                ->where('properties.0.featured', true)
                ->missing('properties.0.reference') // the card shape leaves the detail-only fields out
                ->where('propertiesCount', 3)
                ->where('districts.0.n', 7)
                ->where('priceBounds.sale', ['min' => 1890000, 'max' => 1890000]) // the undisclosed price stays out of the range
                ->where('areas', ['Passy', 'École Militaire']));

        $this->withLocale('en')->fakeSanity($this->docs());
        $this->get('/en/properties')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->has('properties', 1)->where('properties.0.slug', 'test-4-room-haussmann-apartment-paris-7th')->where('properties.0.type', 'apartment'));
    }

    public function test_the_detail_page_resolves_its_twin_reference_advisor_role_and_sold_state(): void
    {
        $this->fakeSanity($this->docs());

        $this->get('/nos-biens/achat/paris-7e/test-4-pieces-haussmannien-avec-balcon-paris-7e')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->component('properties/show')
                ->where('property.reference', 'EP0001')
                ->where('property.fees', ['paid_by' => 'buyer', 'amount' => 20000])
                ->where('property.description.1', 'Parquet point de Hongrie.')
                ->where('property.transport.0.name', 'École Militaire')
                ->where('property.bathrooms', 2)->where('property.surface_living', 121)->where('property.total_floors', 6)->where('property.tags.0', 'Exclusivité')
                ->where('property.dpe.consumption', 215)->where('property.address', null)
                ->where('property.photo_alts.1', 'Salon')->where('property.photo_sizes.0', ['width' => 1448, 'height' => 1086])
                ->where('meta.description', 'Appartement haussmannien 4 pièces de 118 m² Carrez avec balcon, 3 chambres, Paris 7e Invalides.') // the Studio's `metaDescription`, verbatim
                ->where('advisor.name', 'Charles Mata')
                ->where('advisor.role', 'Conseiller investissement') // the team member of the same first name lends the role
                ->where('meta.title', 'Appartement 4 pièces à vendre, École Militaire · Paris 7e')
                ->where('localization.alternates.en', url('/en/properties/buy/paris-7th/test-4-room-haussmann-apartment-paris-7th'))
                ->has('similar', 1)->where('similar.0.slug', 'prix-sur-demande-paris-16e')->where('similar.0.price', 0)); // the only other public sale, its price undisclosed in the card too

        // Sold: online in noindex, out of the catalogue
        $this->get('/nos-biens/achat/paris-6e/vendu-paris-6e')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->where('property.sold_at', '2026-10-14')->where('property.available', false));
        $this->get('/nos-biens/achat/paris-7e/sans-langue')->assertNotFound();

        // Confidential: the gate without the session code, the full listing (price, position) once unlocked, still noindex
        $this->get('/nos-biens/achat/paris-8e/confidentiel-paris-8e')->assertOk()
            ->assertInertia(fn (Assert $p) => $p->component('properties/locked')->where('teaser.arrondissement', 8)->missing('property'));
        // Its own four-digit code (Sanity `accessCode`) unlocks it; the code itself never reaches the browser
        $this->assertStringNotContainsString('7351', $this->get('/nos-biens/achat/paris-8e/confidentiel-paris-8e')->getContent());
        $this->from('/nos-biens/achat/paris-8e/confidentiel-paris-8e')->post('/biens-off-market', ['code' => '7351', 'property' => 'confidentiel-paris-8e'])->assertSessionHasNoErrors();
        $this->get('/nos-biens/achat/paris-8e/confidentiel-paris-8e')->assertOk()
            ->assertInertia(fn (Assert $p) => $p->component('properties/show')->where('property.price', 5400000)->where('property.lat', 48.8585)->where('meta.noindex', true));
    }

    public function test_a_price_on_request_never_reaches_the_browser(): void
    {
        $this->fakeSanity($this->docs());

        // The card: 0 and the flag, no price per m² nor history; the budget filters never test it, the price sorts rank it last
        $this->get('/nos-biens?sort=price_asc')->assertInertia(fn (Assert $p) => $p->has('properties', 3)
            ->where('properties.2.slug', 'prix-sur-demande-paris-16e')->where('properties.2.price', 0)->where('properties.2.price_on_request', true)
            ->where('properties.2.price_sqm', 0)->where('properties.2.price_history', []));
        $this->get('/nos-biens?sort=price_desc')->assertInertia(fn (Assert $p) => $p->where('properties.2.slug', 'prix-sur-demande-paris-16e'));
        $this->get('/nos-biens?budget=2000000')->assertInertia(fn (Assert $p) => $p->has('properties', 3)); // the undisclosed and the confidential ones always pass a budget
        $this->get('/nos-biens?budget_min=8000000')->assertInertia(fn (Assert $p) => $p->has('properties', 2)->where('properties.0.slug', 'confidentiel-paris-8e')->where('properties.1.slug', 'prix-sur-demande-paris-16e'));

        // A confidential listing (security review 2026-10-14): same answer whatever the budget or the map box, so neither its 5.4 M€ nor its position can be bisected
        $confidential = fn (string $query) => collect($this->get('/nos-biens'.$query)->inertiaProps()['properties'])->pluck('slug')->contains('confidentiel-paris-8e');
        $this->assertTrue($confidential('?budget=5399999'));
        $this->assertTrue($confidential('?budget_min=5400001'));
        $this->assertFalse($confidential('?bounds=48.858,2.303,48.859,2.304'), 'a box around the building');
        $this->assertFalse($confidential('?bounds=48.90,2.40,48.91,2.41'), 'a box far from it');
        $this->get('/nos-biens?sort=price_desc')->assertInertia(fn (Assert $p) => $p->where('properties.0.slug', 'test-4-pieces-haussmannien-avec-balcon-paris-7e')); // the 5.4 M€ confidential one is not first

        // The detail page: no price anywhere, the answer and the meta description say « prix sur demande »
        $this->get('/nos-biens/achat/paris-16e/prix-sur-demande-paris-16e')->assertOk()
            ->assertInertia(fn (Assert $p) => $p->where('property.price', 0)->where('property.price_sqm', 0)->where('property.price_history', [])
                ->where('property.price_on_request', true)
                ->where('meta.description', 'Appartement de 4 pièces, 118 m², 3 chambres à Passy, Paris 16e, prix sur demande. Contactez Estate in Paris pour une visite privée.'));
        $this->assertStringNotContainsString('7200000', $this->get('/nos-biens/achat/paris-16e/prix-sur-demande-paris-16e')->getContent());
        $this->assertStringNotContainsString('7 200 000', $this->get('/nos-biens')->getContent());
    }

    public function test_the_twin_slug_falls_back_on_the_shared_reference_without_translation_metadata(): void
    {
        $docs = $this->docs();
        $docs[0]['translations'] = null;
        $this->fakeSanity($docs);

        $this->get('/nos-biens/achat/paris-7e/test-4-pieces-haussmannien-avec-balcon-paris-7e')
            ->assertInertia(fn (Assert $p) => $p->where('localization.alternates.en', url('/en/properties/buy/paris-7th/test-4-room-haussmann-apartment-paris-7th')));
    }

    public function test_the_catalogue_is_read_once_per_request(): void
    {
        $this->fakeSanity($this->docs());
        $this->get('/nos-biens')->assertOk();
        Http::assertSentCount(1); // filter, areas, price bounds (twice), badge and district links share one scoped read
        $this->get('/nos-biens/achat/paris-7e/test-4-pieces-haussmannien-avec-balcon-paris-7e')->assertOk();
        Http::assertSentCount(1); // and the cache serves the next request
    }

    public function test_sanity_down_leaves_an_empty_catalogue_never_a_500(): void
    {
        $this->fakeSanity(null);

        $this->get('/nos-biens')->assertOk()->assertInertia(fn (Assert $p) => $p->has('properties', 0)->where('propertiesCount', 0));
        $this->get('/')->assertOk();
        $this->get('/nos-biens/achat/paris-7e/test-4-pieces-haussmannien-avec-balcon-paris-7e')->assertNotFound();
    }

    public function test_the_warm_command_refreshes_the_listings_query(): void
    {
        $this->fakeSanity($this->docs());

        $this->artisan('sanity:warm')->expectsOutputToContain('properties warmed.')->assertSuccessful();
    }
}
