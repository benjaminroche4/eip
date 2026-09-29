<?php

namespace Tests\Feature;

use App\Domain\Properties\Actions\ListProperties;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** « Nos biens » (2026-09-25): the listing page with its filters, the navigation badge, the sitemap family and the llms entry. */
class PropertiesTest extends TestCase
{
    /** The richer criteria (2026-09-28) at rest, as the `filters` prop sends them. */
    private const REST = ['budget_min' => null, 'surface_min' => null, 'bedrooms' => [], 'features' => [], 'condition' => [], 'floor' => [], 'furnished' => null, 'available' => false, 'area' => []];

    public function test_price_bounds_follow_the_listings_per_transaction(): void
    {
        $this->get('/nos-biens')->assertInertia(fn (Assert $page) => $page
            ->where('priceBounds.sale.min', 1_650_000)
            ->where('priceBounds.sale.max', 9_800_000)
            ->where('priceBounds.rent.min', 6_500)
            ->where('priceBounds.rent.max', 9_800)
        );
    }

    public function test_properties_page_serves_the_listing_in_both_languages(): void
    {
        $this->get('/nos-biens')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->component('properties')
                ->has('properties', 6) // the 6 sales of the sample (the 2 rentals are behind « Location »)
                ->where('pagination', ['page' => 1, 'lastPage' => 1, 'total' => 6, 'perPage' => 12])
                ->where('indexing', ['noindex' => false, 'canonical' => url('/nos-biens'), 'prev' => null, 'next' => null])
                ->where('properties.0.slug', 'appartement-saint-germain-des-pres')
                ->where('properties.0.arrondissement', 6)
                ->where('properties.0.transaction', 'sale')
                ->where('properties.0.price', 2450000)
                ->where('properties.0.type', 'apartment')
                ->where('properties.0.advisor', 1)
                ->where('properties.0.available', true)
                ->where('properties.2.available', false)
                ->where('properties.0.photos.0', '/images/buy/district-1-{w}.webp')
                ->where('properties.0.lat', 48.8539)
                ->where('properties.0.off_market', true) // the sample's confidential one, shown with its details hidden
                ->where('properties.2.featured', true) // the sample's « Coup de cœur » (Champ-de-Mars), its card stands out
                ->where('properties.0.featured', false)
                ->where('properties.1.off_market', false)
                ->has('map', fn ($map) => $map->where('mapId', 'DEMO_MAP_ID')->has('key'))
                ->where('filters', ['city' => [], 'budget' => null, 'transaction' => 'sale', 'type' => [], 'rooms' => [], 'sort' => 'recent', 'bounds' => null] + self::REST)
                ->where('district', null)
                ->where('districts.0', ['n' => 3, 'slug' => 'paris-3e', 'url' => url('/nos-biens/paris-3e'), 'name' => 'Paris 3e', 'count' => 1]) // the clean district pages with properties (2026-09-28)
                ->where('districts.1.n', 6)
                ->where('propertiesCount', 8) // the badge next to « Nos biens », shared on every page
                ->where('translations.pages.properties.intro', fn (string $intro) => str_contains($intro, 'Estate in Paris') && str_contains($intro, 'Paris'))
                ->where('translations.properties.types.mansion', 'Hôtel particulier')
                ->where('translations.properties.transaction.rent', 'Location')
                ->where('translations.nav.properties_count', ':count biens'));

        $this->withLocale('en')->get('/en/properties')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->component('properties')->has('properties', 6)->where('properties.1.title', 'Private mansion, Golden Triangle'));

        $this->withLocale('en')->get('/en/nos-biens')->assertNotFound();
    }

    public function test_filters_are_read_from_the_query_applied_on_the_server_and_make_the_page_noindex(): void
    {
        // The home hero's GET (city[] + a grouped budget) and the page's own criteria
        $this->get('/nos-biens?city[]=16&city[]=6&city[]=42&city[]=16&budget=1+500+000&transaction=rent&type[]=loft&rooms[]=3')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p
                ->where('filters', ['city' => [16, 6], 'budget' => 1500000, 'transaction' => 'rent', 'type' => ['loft'], 'rooms' => [3], 'sort' => 'recent', 'bounds' => null] + self::REST)
                ->has('properties', 0)
                ->where('pagination.total', 0)
                ->where('indexing.noindex', true));

        $this->get('/nos-biens?transaction=rent')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->has('properties', 2)->where('properties.0.price', 6500)->where('pagination.total', 2)->where('indexing.noindex', true));

        // Junk falls back to the defaults (an indexable first page)
        $this->get('/nos-biens?transaction=lease&type[]=castle&rooms[]=9&budget=abc')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->where('filters', ['city' => [], 'budget' => null, 'transaction' => 'sale', 'type' => [], 'rooms' => [], 'sort' => 'recent', 'bounds' => null] + self::REST)->where('indexing.noindex', false));

        // « Rechercher dans cette zone » (2026-09-28): the map frame filters by position, noindex, kept in the pagination links
        $this->get('/nos-biens?bounds=48.85,2.33,48.86,2.35')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p
                ->where('filters.bounds', [48.85, 2.33, 48.86, 2.35])
                ->has('properties', 1)
                ->where('properties.0.arrondissement', 6)
                ->where('indexing.noindex', true)
                ->where('indexing.canonical', url('/nos-biens?bounds=48.85%2C2.33%2C48.86%2C2.35')));

        // The list's sort select (2026-09-28): applied on the server, kept in the URL of the pagination links, noindex
        $this->get('/nos-biens?sort=price_asc')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p
                ->where('filters.sort', 'price_asc')
                ->where('properties.0.price', 1650000) // the loft, cheapest sale of the sample
                ->where('properties.5.price', 9800000)
                ->where('indexing.noindex', true)
                ->where('indexing.canonical', url('/nos-biens?sort=price_asc')));
        $this->get('/nos-biens?sort=price_desc')->assertInertia(fn (Assert $p) => $p->where('properties.0.price', 9800000));
        $this->get('/nos-biens?sort=surface_desc')->assertInertia(fn (Assert $p) => $p->where('properties.0.surface', 420));
        $this->get('/nos-biens?sort=cheapest')->assertInertia(fn (Assert $p) => $p->where('filters.sort', 'recent')->where('indexing.noindex', false));
    }

    public function test_listing_is_paginated_on_the_server_with_a_merge_prop_past_page_one(): void
    {
        // 30 sales: the sample repeated with distinct slugs (the Sanity catalogue will be bigger than the sample)
        $sample = collect(__('properties.sample'))->where('transaction', 'sale')->reject(fn (array $r) => isset($r['sold_at']))->values(); // the sold one stays out
        $this->app->bind(ListProperties::class, fn () => new ListProperties(
            fn () => collect(range(0, 29))->map(fn (int $i) => ['slug' => "bien-$i"] + $sample[$i % $sample->count()])->all(),
        ));

        $this->get('/nos-biens')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p
                ->has('properties', 12)
                ->where('pagination', ['page' => 1, 'lastPage' => 3, 'total' => 30, 'perPage' => 12])
                ->where('indexing', ['noindex' => false, 'canonical' => url('/nos-biens'), 'prev' => null, 'next' => url('/nos-biens?page=2')]));

        // rooms 3 or « 5 et plus »: 5 of the 6 sample sales → 25 rows, 3 pages
        $page2 = $this->get('/nos-biens?page=2&rooms[]=3&rooms[]=5')->assertOk();
        $page2->assertInertia(fn (Assert $p) => $p
            ->has('properties', 12)
            ->where('pagination.page', 2)
            ->where('indexing.noindex', true)
            ->where('pagination.total', 25)
            ->where('indexing.prev', url('/nos-biens?rooms%5B0%5D=3&rooms%5B1%5D=5'))
            ->where('indexing.next', url('/nos-biens?rooms%5B0%5D=3&rooms%5B1%5D=5&page=3')));
        // « Voir plus » appends: past page 1 the properties are a merge prop
        $this->assertContains('properties', $page2->viewData('page')['mergeProps'] ?? []);
        $this->assertArrayNotHasKey('mergeProps', $this->get('/nos-biens')->viewData('page'));

        $this->get('/nos-biens?page=3')->assertOk()->assertInertia(fn (Assert $p) => $p->has('properties', 6)->where('indexing.next', null));
        $this->get('/nos-biens?page=4')->assertNotFound();
    }

    public function test_clean_district_pages_narrow_the_listing_to_one_arrondissement_in_both_languages(): void
    {
        // The same page as the listing, narrowed to the 6e: indexable, its own canonical, the twin page as hreflang
        $this->get('/nos-biens/paris-6e')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->component('properties')
                ->has('properties', 1)
                ->where('properties.0.arrondissement', 6)
                ->where('filters.city', [6])
                ->where('district', ['n' => 6, 'slug' => 'paris-6e', 'name' => 'Paris 6e', 'areas' => 'Saint-Germain-des-Prés, Luxembourg'])
                ->where('indexing', ['noindex' => false, 'canonical' => url('/nos-biens/paris-6e'), 'prev' => null, 'next' => null])
                ->where('localization.alternates.fr', url('/nos-biens/paris-6e'))
                ->where('localization.alternates.en', url('/en/properties/paris-6th'))
                ->where('translations.properties.district_headline', 'Nos biens à vendre à :name'));

        // The other language's ordinal is redirected to the canonical slug, the query string kept
        $this->get('/nos-biens/paris-6th?type[]=loft')->assertRedirect(url('/nos-biens/paris-6e?type%5B0%5D=loft'));

        // Other criteria on a district page: still the district, but a non-canonical variant (noindex)
        $this->get('/nos-biens/paris-8e?type[]=mansion')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->where('filters.city', [8])->has('properties', 1)->where('indexing.noindex', true)->where('indexing.canonical', url('/nos-biens/paris-8e?type%5B0%5D=mansion')));

        // An arrondissement without a single property is thin: served, but kept out of the index
        $this->get('/nos-biens/paris-20e')->assertOk()->assertInertia(fn (Assert $p) => $p->has('properties', 0)->where('indexing.noindex', true));

        $this->get('/nos-biens/paris-21e')->assertNotFound();
        $this->get('/nos-biens/lyon-6e')->assertNotFound();

        // English twin (routes are registered per locale before the request: the English ones last)
        $this->withLocale('en')->get('/en/properties/paris-6th')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->where('district.slug', 'paris-6th')->where('district.name', 'Paris 6th')->where('indexing.canonical', url('/en/properties/paris-6th')));
        $this->withLocale('en')->get('/en/properties/paris-6e')->assertRedirect(url('/en/properties/paris-6th'));
    }

    public function test_properties_count_is_shared_with_every_page(): void
    {
        $this->get('/contact')->assertInertia(fn (Assert $p) => $p->where('propertiesCount', 8));
    }

    public function test_properties_have_their_own_sitemap_file_and_a_llms_entry(): void
    {
        $this->artisan('sitemap:generate')->assertSuccessful();

        $this->assertStringContainsString('<loc>'.url('/sitemap.properties.xml').'</loc>', file_get_contents(public_path('sitemap.xml')));
        $properties = file_get_contents(public_path('sitemap.properties.xml'));
        $this->assertStringContainsString('<loc>'.url('/nos-biens').'</loc>', $properties);
        $this->assertStringContainsString('<loc>'.url('/en/properties').'</loc>', $properties);
        $this->assertStringContainsString('hreflang="x-default"', $properties);
        // The clean district pages with properties, in both languages, each with its twin as hreflang (2026-09-28)
        $this->assertStringContainsString('<loc>'.url('/nos-biens/paris-6e').'</loc>', $properties);
        $this->assertStringContainsString('<loc>'.url('/en/properties/paris-6th').'</loc>', $properties);
        $this->assertStringContainsString('hreflang="en" href="'.url('/en/properties/paris-6th').'"', $properties);
        $this->assertStringNotContainsString('/nos-biens/paris-20e', $properties, 'no property in the 20e: no page to index');
        $this->assertStringNotContainsString('/nos-biens', file_get_contents(public_path('sitemap.pages.xml')), 'the listing lives in its own family, not in the pages file');

        $llms = $this->get('/llms.txt')->assertOk()->getContent();
        $this->assertStringContainsString(url('/nos-biens'), $llms);
        $this->assertStringContainsString(url('/en/properties'), $llms);
    }
}
