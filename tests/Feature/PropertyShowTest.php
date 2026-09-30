<?php

namespace Tests\Feature;

use App\Domain\Blog\Support\SeoText;
use App\Domain\Properties\Actions\ListProperties;
use App\Domain\Properties\Support\PropertySeo;
use App\Domain\Seo\Support\SitemapBuilder;
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
                ->where('advisor', ['id' => 3, 'photo' => '/images/advisors/advisor-3.webp', 'name' => 'Emma Lefèvre', 'role' => 'Conseillère investissement']) // the team member of the same rank
                ->where('district.price', '14 000') // average price of the 7e, read against the listing's own
                // Meta built from the data, keyword first (type, rooms, quartier, arrondissement), never the editorial title
                ->where('meta.title', 'Appartement 5 pièces, Champ-de-Mars · Paris 7e')
                ->where('seo.organization.name', config('seo.organization.name')) // the shared prop survives: a page prop named `seo` shadowed it (blank page 2026-09-28)
                ->where('meta.withSuffix', false) // 46 characters: the suffix would pass 60, the quartier keyword wins
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
        $suffix = config('seo.title_separator').config('seo.site_name');
        foreach (['fr', 'en'] as $locale) {
            foreach ((new ListProperties)($locale) as $property) {
                if ($property->offMarket) {
                    continue;
                }
                $seo = PropertySeo::for($property, $locale);
                $title = $seo['title'].($seo['withSuffix'] ? $suffix : '');
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
                ->where('prefill.message', fn (string $m) => str_starts_with($m, 'Je souhaite visiter « Appartement familial, Champ-de-Mars » à Paris 7e (référence ')));
        $this->get('/contact?property=location-appartement-meuble-marais')->assertInertia(fn (Assert $p) => $p->where('prefill.topic', 'other'));
        $this->get('/contact?property=appartement-saint-germain-des-pres')->assertInertia(fn (Assert $p) => $p->where('prefill', null)); // confidential: nothing leaks
        $this->get('/contact?property=nope')->assertInertia(fn (Assert $p) => $p->where('prefill', null));
    }

    public function test_detail_pages_are_in_the_properties_sitemap_with_their_twin_as_hreflang(): void
    {
        $this->artisan('sitemap:generate')->assertSuccessful();
        $properties = file_get_contents(public_path('sitemap.properties.xml'));
        $this->assertStringContainsString('<loc>'.url('/nos-biens/achat/paris-7e/appartement-champ-de-mars').'</loc>', $properties);
        $this->assertStringContainsString('<loc>'.url('/en/properties/buy/paris-7th/apartment-champ-de-mars').'</loc>', $properties);
        $this->assertStringContainsString('hreflang="en" href="'.url('/en/properties/buy/paris-7th/apartment-champ-de-mars').'"', $properties);
        $this->assertStringContainsString('<lastmod>2026-09-12', $properties); // the listing's last price change (its publication was 2026-08-15) — audit 2026-09-30
        $this->assertStringContainsString('<image:loc>'.url('/images/buy/district-3-1600.webp').'</image:loc>', $properties); // image sitemap
        $this->assertStringContainsString('<image:caption>Vue sur la tour Eiffel depuis un appartement du Champ-de-Mars</image:caption>', $properties);
        $this->assertStringNotContainsString('appartement-saint-germain-des-pres', $properties, 'confidential listings have no public page');
    }
}
