<?php

namespace Tests\Feature;

use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** Detail page of a listing (`/nos-biens/{slug}` ↔ `/en/properties/{slug}`, 2026-09-28). */
class PropertyShowTest extends TestCase
{
    public function test_detail_page_serves_the_listing_with_its_similar_ones_district_advisor_and_seo(): void
    {
        $this->get('/nos-biens/appartement-champ-de-mars-7e')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->component('properties/show')
                ->where('property.slug', 'appartement-champ-de-mars-7e')
                ->where('property.arrondissement', 7)
                ->where('property.price', 3150000)
                ->where('property.available', false)
                ->where('property.features', ['elevator', 'view', 'balcony', 'concierge', 'top_floor'])
                ->where('property.floor', 5)
                ->has('similar', 3) // other public sales: none in the 7e, apartments first
                ->where('similar.0.type', 'apartment')
                ->where('similar.0.transaction', 'sale')
                ->where('district.n', 7)
                ->where('district.name', 'Paris 7e')
                ->where('district.url', url('/nos-biens/paris-7e'))
                ->where('district.profileUrl', url('/arrondissements-paris?arrondissement=7'))
                ->where('advisor', ['id' => 3, 'photo' => '/images/advisors/advisor-3.webp'])
                ->where('seo.title', 'Appartement familial, Champ-de-Mars')
                ->where('seo.withSuffix', true)
                ->where('seo.description', 'Vue dégagée sur la tour Eiffel depuis le séjour, trois chambres, calme absolu.')
                // hreflang / switcher: the same listing in the other language (same row of the sample)
                ->where('localization.alternates.fr', url('/nos-biens/appartement-champ-de-mars-7e'))
                ->where('localization.alternates.en', url('/en/properties/apartment-champ-de-mars-7th'))
                ->where('translations.property.contact_cta', 'Demander une visite')
                ->has('map.mapId'));

        // Similar listings never include the listing itself nor a confidential one, and follow the transaction
        $this->get('/nos-biens/location-appartement-meuble-marais-4e')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->has('similar', 1)->where('similar.0.transaction', 'rent')->where('similar.0.slug', 'location-appartement-terrasse-trocadero-16e'));
        $this->get('/nos-biens/appartement-monceau-8e')
            ->assertInertia(fn (Assert $p) => $p->where('similar.0.slug', 'hotel-particulier-triangle-d-or-8e')); // same arrondissement first

        $this->withLocale('en')->get('/en/properties/apartment-champ-de-mars-7th')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->where('property.title', 'Family apartment, Champ-de-Mars')->where('district.name', 'Paris 7th')->where('district.url', url('/en/properties/paris-7th')));
    }

    public function test_unknown_and_confidential_listings_are_not_found(): void
    {
        $this->get('/nos-biens/appartement-inconnu')->assertNotFound();
        // The sample's off-market listing has no public page until the gated area exists
        $this->get('/nos-biens/appartement-saint-germain-des-pres-6e')->assertNotFound();
        // A slug in the district pattern never reaches the detail route
        $this->get('/nos-biens/paris-7e')->assertOk()->assertInertia(fn (Assert $p) => $p->component('properties'));
    }

    public function test_the_contact_form_is_prefilled_from_a_listing(): void
    {
        $this->get('/contact?property=appartement-champ-de-mars-7e')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p
                ->where('prefill.topic', 'buy')
                ->where('prefill.message', fn (string $m) => str_starts_with($m, 'Je souhaite visiter « Appartement familial, Champ-de-Mars » à Paris 7e (référence ')));
        $this->get('/contact?property=location-appartement-meuble-marais-4e')->assertInertia(fn (Assert $p) => $p->where('prefill.topic', 'other'));
        $this->get('/contact?property=appartement-saint-germain-des-pres-6e')->assertInertia(fn (Assert $p) => $p->where('prefill', null)); // confidential: nothing leaks
        $this->get('/contact?property=nope')->assertInertia(fn (Assert $p) => $p->where('prefill', null));
    }

    public function test_detail_pages_are_in_the_properties_sitemap_with_their_twin_as_hreflang(): void
    {
        $this->artisan('sitemap:generate')->assertSuccessful();
        $properties = file_get_contents(public_path('sitemap.properties.xml'));
        $this->assertStringContainsString('<loc>'.url('/nos-biens/appartement-champ-de-mars-7e').'</loc>', $properties);
        $this->assertStringContainsString('<loc>'.url('/en/properties/apartment-champ-de-mars-7th').'</loc>', $properties);
        $this->assertStringContainsString('hreflang="en" href="'.url('/en/properties/apartment-champ-de-mars-7th').'"', $properties);
        $this->assertStringContainsString('<lastmod>2026-08-15', $properties); // the listing's publication date
        $this->assertStringNotContainsString('appartement-saint-germain-des-pres-6e', $properties, 'confidential listings have no public page');
    }
}
