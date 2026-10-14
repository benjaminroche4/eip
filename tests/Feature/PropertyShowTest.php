<?php

namespace Tests\Feature;

use App\Domain\Blog\Support\SeoText;
use App\Domain\Properties\Actions\ListProperties;
use App\Domain\Properties\Data\Property;
use App\Domain\Properties\Support\PropertySeo;
use App\Domain\Seo\Support\SitemapBuilder;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** Detail page of a listing (`/nos-biens/paris-6e/{slug}` ↔ `/en/properties/paris-6th/{slug}`, 2026-09-28). */
class PropertyShowTest extends TestCase
{
    public function test_detail_page_serves_the_listing_with_its_similar_ones_district_advisor_and_seo(): void
    {
        $this->get('/nos-biens/achat/paris-7e/appartement-champ-de-mars')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->component('properties/show')
                ->where('property.slug', 'appartement-champ-de-mars')
                ->where('property.arrondissement', 7)
                ->where('property.price', 3150000)
                ->where('property.available', false)
                ->where('property.features', ['elevator', 'view', 'balcony', 'concierge', 'top_floor'])
                ->where('property.floor', 5)
                ->has('similar', 4) // every other public sale (up to six): same budget ± 20 % and rooms first, then the arrondissement, then the type
                ->where('similar.0.slug', 'appartement-passy') // 1 890 000 is out of ± 20 %, but 5 rooms like the listing… no: same-budget wins → see next line
                ->where('similar.0.type', 'apartment')
                ->where('similar.0.transaction', 'sale')
                ->where('district.n', 7)
                ->where('district.name', 'Paris 7e')
                ->where('district.url', url('/nos-biens/paris-7e'))
                ->where('district.profileUrl', url('/arrondissements-paris?arrondissement=7'))
                ->where('advisor', ['name' => 'Charles M.', 'photo' => '/images/advisors/advisor-3.webp', 'role' => 'Conseiller investissement']) // the Sanity agent, the role from the team member of the same name
                ->where('district.price', '13 000') // average price of the 7e, read against the listing's own
                // Meta built from the data, keyword first (type, rooms, quartier, arrondissement), never the editorial title
                ->where('meta.title', 'Appartement 5 pièces à vendre, Champ-de-Mars · Paris 7e') // the full tier with « 165 m² » would pass 60: the next one
                ->where('seo.organization.name', config('seo.organization.name')) // the shared prop survives: a page prop named `seo` shadowed it (blank page 2026-09-28)
                ->where('meta.withBrand', false) // 55 characters: the brand prefix would pass 60, the search intent wins
                ->where('meta.description', 'Appartement de 5 pièces, 165 m², 3 chambres à Champ-de-Mars, Paris 7e, 3 150 000 € honoraires inclus. Contactez Estate in Paris pour une visite privée.') // the excerpt would pass 160: facts + call to action
                ->where('district.metro', ['8', '10', '12', '13'])
                ->where('neighbours.previous.title', "Hôtel particulier, Triangle d'or") // previous / next sale of the catalogue
                ->where('neighbours.next.url', url('/nos-biens/achat/paris-16e/appartement-passy'))
                ->where('property.dpe.energy', 'E')
                ->where('property.rooms_detail.0.name', 'Séjour')
                ->where('property.price_history.1.price', 3150000)
                // hreflang / switcher: the same listing in the other language (same row of the sample)
                ->where('localization.alternates.fr', url('/nos-biens/achat/paris-7e/appartement-champ-de-mars'))
                ->where('localization.alternates.en', url('/en/properties/buy/paris-7th/apartment-champ-de-mars'))
                ->where('translations.property.contact_cta', 'Demander une visite')
                ->has('map.mapId'));

        // Similar listings never include the listing itself nor a confidential one, and follow the transaction
        $this->get('/nos-biens/location/paris-4e/location-appartement-meuble-marais')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->has('similar', 1)->where('similar.0.transaction', 'rent')->where('similar.0.slug', 'location-appartement-terrasse-trocadero'));
        $this->get('/nos-biens/achat/paris-8e/appartement-monceau')
            ->assertInertia(fn (Assert $p) => $p->where('similar.0.slug', 'hotel-particulier-triangle-d-or')); // same arrondissement first

        $this->withLocale('en')->get('/en/properties/buy/paris-7th/apartment-champ-de-mars')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->where('property.title', 'Family apartment, Champ-de-Mars')->where('district.name', 'Paris 7th')->where('district.url', url('/en/properties/paris-7th')));
    }

    public function test_every_listing_meta_respects_the_seo_lengths_in_both_languages(): void
    {
        $brand = config('seo.site_name').config('seo.title_separator');
        foreach (['fr', 'en'] as $locale) {
            foreach (app(ListProperties::class)($locale) as $property) {
                if ($property->offMarket) {
                    continue;
                }
                $seo = PropertySeo::for($property, $locale);
                $title = ($seo['withBrand'] ? $brand : '').$seo['title'];
                $this->assertLessThanOrEqual(SeoText::TITLE_MAX, mb_strlen($title), $title);
                $this->assertGreaterThanOrEqual(SeoText::TITLE_MIN, mb_strlen($title), $title);
                $this->assertStringContainsString('Paris', $seo['description']);
                $this->assertLessThanOrEqual(SeoText::DESCRIPTION_MAX, mb_strlen($seo['description']), $seo['description']);
                $this->assertGreaterThanOrEqual(120, mb_strlen($seo['description']), $seo['description']);
                $this->assertStringNotContainsString('ui.', $seo['description']); // every key resolved
            }
        }

        // Rentals borrow the agency FAQ topic (no « renting » topic yet)
    }

    public function test_the_meta_title_puts_the_search_intent_first_and_picks_the_longest_tier_that_fits(): void
    {
        $row = collect(self::sampleProperties('fr'))->firstWhere('slug', 'appartement-champ-de-mars');
        $make = fn (array $over, string $locale = 'fr') => PropertySeo::for(Property::fromArray(array_merge($row, $over)), $locale);

        $this->assertSame('Appartement 5 pièces à vendre, Champ-de-Mars · Paris 7e', $make([])['title']);
        $this->assertSame('Studio 1 pièce 24 m² à vendre, Odéon · Paris 6e', $make(['type' => 'studio', 'rooms' => 1, 'surface' => 24, 'area' => 'Odéon', 'arrondissement' => 6])['title'], 'the full tier when it fits');
        $this->assertSame('Appartement 5 pièces 165 m² à vendre, Paris 7e', $make(['area' => ''])['title'], 'no quartier: the arrondissement alone');
        $this->assertSame('Appartement 5 pièces à louer, Champ-de-Mars · Paris 7e', $make(['transaction' => 'rent'])['title']);
        $this->assertSame('Hôtel particulier à vendre, Saint-Germain · Paris 6e', $make(['type' => 'mansion', 'rooms' => 12, 'area' => 'Saint-Germain', 'arrondissement' => 6])['title'], 'the short tier');
        $this->assertSame('Hôtel particulier à vendre Paris 6e', $make(['type' => 'mansion', 'rooms' => 12, 'area' => 'Saint-Germain-des-Prés', 'arrondissement' => 6])['title'], '61 characters with the quartier: the minimal tier');
        $this->assertSame('Hôtel particulier à vendre Paris 16e', $make(['type' => 'mansion', 'rooms' => 12, 'area' => 'Chaussée-de-la-Muette-Boulainvilliers', 'arrondissement' => 16])['title'], 'the minimal tier when even the short one passes 60');
        $this->assertSame('5-room apartment 165 sqm for sale, Champ-de-Mars · Paris 7th', $make([], 'en')['title'], 'exactly 60: the full tier');
        // No surface or no room count in the Studio: never « 0 m² » nor « 0 pièce » in the title (review 2026-10-14)
        $this->assertSame('Studio 1 pièce à vendre, Odéon · Paris 6e', $make(['type' => 'studio', 'rooms' => 1, 'surface' => 0, 'area' => 'Odéon', 'arrondissement' => 6])['title']);
        $this->assertSame('Appartement à vendre, Champ-de-Mars · Paris 7e', $make(['rooms' => 0])['title']);
        // The sentences skip a missing room count or bedroom (a building, a studio): never « 0 pièce » / « 0 chambres »
        $this->assertSame('À la vente : immeuble de 420 m² à Champ-de-Mars, Paris 7e, au prix de 3 150 000 €.', $make(['type' => 'building', 'rooms' => 0, 'bedrooms' => 0, 'surface' => 420])['answer']);
        $this->assertSame('À la vente : appartement de 5 pièces (165 m², 3 chambres) à Champ-de-Mars, Paris 7e, au prix de 3 150 000 €.', $make([])['answer']);
        $this->assertStringStartsWith('Immeuble de 420 m² à Champ-de-Mars, Paris 7e, 3 150 000 €', $make(['type' => 'building', 'rooms' => 0, 'bedrooms' => 0, 'surface' => 420, 'meta_description' => ''])['description']); // `SeoText::description()` normalises the spaces
        $this->assertStringStartsWith('Studio de 1 pièce, 25 m² à Odéon', $make(['type' => 'studio', 'rooms' => 1, 'bedrooms' => 0, 'surface' => 25, 'area' => 'Odéon', 'arrondissement' => 6, 'meta_description' => ''])['description']);
        $this->assertSame('For sale: building (420 sqm) in Champ-de-Mars, Paris 7th, priced at €3,150,000.', $make(['type' => 'building', 'rooms' => 0, 'bedrooms' => 0, 'surface' => 420], 'en')['answer']);
        $this->assertStringStartsWith('Building, 420 sqm in Champ-de-Mars', $make(['type' => 'building', 'rooms' => 0, 'bedrooms' => 0, 'surface' => 420, 'meta_description' => ''], 'en')['description']);
        // The editor's meta description wins over the generated one, clamped at 160 on a word
        $this->assertSame('Texte du Studio. Contactez Estate in Paris pour une visite privée.', $make(['meta_description' => 'Texte du Studio.'])['description'], 'a short Studio text gets the call to action');
        $this->assertSame(str_repeat('Texte du Studio. ', 7).'Fin.', $make(['meta_description' => str_repeat('Texte du Studio. ', 7).'Fin.'])['description'], '124 characters: verbatim');
        $this->assertLessThanOrEqual(SeoText::DESCRIPTION_MAX, mb_strlen($make(['meta_description' => str_repeat('Longue phrase du Studio. ', 10)])['description']));
        $this->assertStringStartsWith('Appartement de 5 pièces, 165 m²', $make(['meta_description' => ''])['description'], 'empty = generated');
    }

    public function test_a_sold_listing_keeps_its_page_out_of_the_catalogue_and_says_so(): void
    {
        $this->get('/nos-biens/achat/paris-6e/appartement-luxembourg')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p
                ->where('property.sold_at', '2026-09-12')
                ->where('property.days_to_sell', 23)
                ->where('property.available', false));
        // Out of the listing, the counts and the sitemap; the neighbours skip it
        $this->get('/nos-biens?city[]=6')->assertInertia(fn (Assert $p) => $p->has('properties', 1)->where('properties.0.slug', 'appartement-saint-germain-des-pres')->where('propertiesCount', 8)); // only the confidential card of the 6e, never the sold one
        $this->assertStringNotContainsString('appartement-luxembourg', app(SitemapBuilder::class)->properties()->render());
    }

    public function test_unknown_and_confidential_listings_are_not_found(): void
    {
        $this->get('/nos-biens/achat/paris-7e/appartement-inconnu')->assertNotFound();
        $this->get('/nos-biens/appartement-champ-de-mars')->assertNotFound(); // flat URL: the arrondissement segment is required (2026-09-28)
        $this->get('/nos-biens/achat/lyon-7e/appartement-champ-de-mars')->assertNotFound(); // only Paris
        $this->get('/nos-biens/paris-7e/appartement-champ-de-mars')->assertNotFound(); // the transaction segment is required (2026-09-29)
        // One canonical URL: a wrong transaction or arrondissement, or the other language's words, is redirected (301) to it
        $this->get('/nos-biens/location/paris-7e/appartement-champ-de-mars')->assertRedirect(url('/nos-biens/achat/paris-7e/appartement-champ-de-mars'))->assertStatus(301);
        $this->get('/nos-biens/buy/paris-7e/appartement-champ-de-mars')->assertRedirect(url('/nos-biens/achat/paris-7e/appartement-champ-de-mars'))->assertStatus(301);
        $this->get('/nos-biens/achat/paris-6e/appartement-champ-de-mars')->assertRedirect(url('/nos-biens/achat/paris-7e/appartement-champ-de-mars'))->assertStatus(301);
        $this->get('/nos-biens/achat/paris-7th/appartement-champ-de-mars')->assertRedirect(url('/nos-biens/achat/paris-7e/appartement-champ-de-mars'))->assertStatus(301);
        // The sample's off-market listing renders the access-code gate instead of its page (2026-09-29, `OffMarketAccessTest`)
        $this->get('/nos-biens/achat/paris-6e/appartement-saint-germain-des-pres')->assertOk()->assertInertia(fn (Assert $p) => $p->component('properties/locked'));
        // A slug in the district pattern never reaches the detail route
        $this->get('/nos-biens/paris-7e')->assertOk()->assertInertia(fn (Assert $p) => $p->component('properties'));
    }

    public function test_the_contact_form_is_prefilled_from_a_listing(): void
    {
        $this->get('/contact?property=appartement-champ-de-mars')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p
                ->where('prefill.topic', 'buy')
                ->where('prefill.message', 'Je souhaite visiter « Appartement familial, Champ-de-Mars » à Paris 7e (référence AP-7).')); // the same reference as the page (`Property::displayReference()`, review 2026-10-14)
        $this->get('/contact?property=location-appartement-meuble-marais')->assertInertia(fn (Assert $p) => $p->where('prefill.topic', 'other'));
        $this->get('/contact?property=appartement-saint-germain-des-pres')->assertInertia(fn (Assert $p) => $p->where('prefill', null)); // confidential: nothing leaks
        $this->get('/contact?property=nope')->assertInertia(fn (Assert $p) => $p->where('prefill', null));
    }

    public function test_detail_pages_are_in_the_properties_sitemap_with_their_twin_as_hreflang(): void
    {
        Http::fake(); // the blog part of the sitemap is not under test here
        $this->artisan('sitemap:generate')->assertSuccessful();
        $properties = file_get_contents($this->sitemapPath('sitemap.properties.xml'));
        $this->assertStringContainsString('<loc>'.url('/nos-biens/achat/paris-7e/appartement-champ-de-mars').'</loc>', $properties);
        $this->assertStringContainsString('<loc>'.url('/en/properties/buy/paris-7th/apartment-champ-de-mars').'</loc>', $properties);
        $this->assertStringContainsString('hreflang="en" href="'.url('/en/properties/buy/paris-7th/apartment-champ-de-mars').'"', $properties);
        $this->assertStringContainsString('<lastmod>2026-09-12', $properties); // the listing's last price change (its publication was 2026-08-15) — audit 2026-09-30
        $this->assertStringContainsString('<image:loc>'.url('/images/buy/district-3-1600.webp').'</image:loc>', $properties); // image sitemap
        $this->assertStringContainsString('<image:caption>Vue sur la tour Eiffel depuis un appartement du Champ-de-Mars</image:caption>', $properties);
        $this->assertStringNotContainsString('appartement-saint-germain-des-pres', $properties, 'confidential listings have no public page');
    }
}
