<?php

namespace Tests\Unit\Domain\Properties;

use App\Domain\Properties\Actions\FilterProperties;
use App\Domain\Properties\Actions\ListProperties;
use App\Domain\Properties\Data\Property;
use App\Domain\Properties\Data\PropertyQuery;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Tests\TestCase;

/** The listing request (filters + page) and the in-memory filter / slice (hybrid pagination, 2026-09-26). */
class PropertyQueryTest extends TestCase
{
    /** The richer criteria (2026-09-28) at rest, as `toArray()` sends them. */
    private const REST = ['budget_min' => null, 'surface_min' => null, 'bedrooms' => [], 'features' => [], 'condition' => [], 'floor' => [], 'furnished' => null, 'available' => false, 'area' => []];

    public function test_query_is_cleaned_from_the_request_and_knows_when_it_is_indexable(): void
    {
        $query = PropertyQuery::fromRequest(Request::create('/nos-biens', 'GET', ['city' => ['16', '6', '42', '16'], 'budget' => '1 500 000', 'transaction' => 'rent', 'type' => ['loft', 'castle', 'loft'], 'rooms' => ['3', '9', '5'], 'sort' => 'price_desc', 'page' => '2']));
        $this->assertSame(['city' => [16, 6], 'budget' => 1500000, 'transaction' => 'rent', 'type' => ['loft'], 'rooms' => [3, 5], 'sort' => 'price_desc', 'bounds' => null] + self::REST, $query->toArray());
        $this->assertSame(2, $query->page);
        $this->assertSame(12, $query->offset());
        $this->assertFalse($query->isIndexable());
        $this->assertSame(['city' => [16, 6], 'budget' => 1500000, 'transaction' => 'rent', 'type' => ['loft'], 'rooms' => [3, 5], 'sort' => 'price_desc', 'page' => 3], $query->params(3));
        $this->assertArrayNotHasKey('page', $query->params(1));

        $default = PropertyQuery::fromRequest(Request::create('/nos-biens', 'GET', ['transaction' => 'lease', 'type' => 'castle', 'rooms' => '9', 'budget' => 'abc', 'sort' => 'cheapest', 'page' => '0']));
        $this->assertSame(['city' => [], 'budget' => null, 'transaction' => 'sale', 'type' => [], 'rooms' => [], 'sort' => 'recent', 'bounds' => null] + self::REST, $default->toArray());
        $this->assertSame(1, $default->page);
        $this->assertTrue($default->isIndexable());
        $this->assertSame([], $default->params());
        $this->assertFalse(PropertyQuery::fromRequest(Request::create('/nos-biens', 'GET', ['page' => '2']))->isIndexable());
        // A sort order other than the default is a variant of the same list: noindex, like a filter (2026-09-28)
        $this->assertFalse(PropertyQuery::fromRequest(Request::create('/nos-biens', 'GET', ['sort' => 'price_asc']))->isIndexable());
        $this->assertSame([], PropertyQuery::fromRequest(Request::create('/nos-biens', 'GET', ['sort' => 'recent']))->params());
    }

    public function test_map_area_is_read_as_a_plausible_box_around_paris_and_filters_by_position(): void
    {
        // « Rechercher dans cette zone » (2026-09-28): south,west,north,east
        $query = PropertyQuery::fromRequest(Request::create('/nos-biens', 'GET', ['bounds' => '48.85,2.33,48.86,2.35']));
        $this->assertSame([48.85, 2.33, 48.86, 2.35], $query->bounds);
        $this->assertSame('48.85,2.33,48.86,2.35', $query->params()['bounds']);
        $this->assertFalse($query->isIndexable());
        $this->assertTrue($query->hasFilters());
        $this->assertSame(1, app(FilterProperties::class)($query, 'fr')->total); // the 6e sale (48.8539, 2.3338) alone

        // Junk, an inverted box or one far from Paris never filters everything out silently
        foreach (['abc', '48.86,2.33,48.85,2.35', '40,2,41,3', '48.85,2.33,48.86'] as $bad) {
            $this->assertNull(PropertyQuery::fromRequest(Request::create('/nos-biens', 'GET', ['bounds' => $bad]))->bounds, $bad);
        }
    }

    public function test_a_district_page_forces_its_arrondissement_and_is_indexable_when_nothing_else_is_set(): void
    {
        $plain = PropertyQuery::fromRequest(Request::create('/nos-biens/paris-6e', 'GET'))->withCities([6]);
        $this->assertSame([6], $plain->cities);
        $this->assertTrue($plain->isDistrictIndexable());
        $this->assertFalse($plain->isIndexable()); // the same criteria on the plain listing are a filter
        $this->assertSame([], $plain->params(withCities: false)); // the arrondissement lives in the path
        $this->assertSame(['city' => [6]], $plain->params());

        $filtered = PropertyQuery::fromRequest(Request::create('/nos-biens/paris-6e', 'GET', ['type' => ['loft']]))->withCities([6]);
        $this->assertFalse($filtered->isDistrictIndexable());
        $this->assertSame(['type' => ['loft']], $filtered->params(withCities: false));
        $this->assertFalse(PropertyQuery::fromRequest(Request::create('/nos-biens/paris-6e', 'GET', ['page' => '2']))->withCities([6])->isDistrictIndexable());
    }

    public function test_sort_orders_the_matching_properties_before_the_slice_and_keeps_the_source_order_by_default(): void
    {
        $filter = app(FilterProperties::class);
        $source = app(ListProperties::class)('fr')->where('transaction', 'sale')->pluck('slug')->all();
        $slugs = fn (PropertyQuery $q) => $filter($q, 'fr')->items->pluck('slug')->all();

        $this->assertSame($source, $slugs(new PropertyQuery)); // « recent » = the source order (Sanity: newest first)
        $prices = fn (PropertyQuery $q) => $filter($q, 'fr')->items->pluck('price')->all();
        $asc = $prices(new PropertyQuery(sort: 'price_asc'));
        $this->assertSame(collect($asc)->sort()->values()->all(), $asc);
        $this->assertSame(array_reverse($asc), $prices(new PropertyQuery(sort: 'price_desc')));
        $surfaces = $filter(new PropertyQuery(sort: 'surface_desc'), 'fr')->items->pluck('surface')->all();
        $this->assertSame(collect($surfaces)->sortDesc()->values()->all(), $surfaces);
        // The sort applies to the whole match, then the page is sliced: the cheapest sale opens page 1, the dearest closes page 2
        $this->assertSame(min($asc), $filter(new PropertyQuery(sort: 'price_asc', perPage: 4), 'fr')->items->first()->price);
        $this->assertSame(max($asc), $filter(new PropertyQuery(sort: 'price_asc', page: 2, perPage: 4), 'fr')->items->last()->price);
    }

    public function test_filter_matches_transaction_arrondissements_type_rooms_and_budget_then_slices_the_page(): void
    {
        $filter = app(FilterProperties::class);

        $sales = $filter(new PropertyQuery, 'fr');
        $this->assertSame(6, $sales->total);
        $this->assertCount(6, $sales->items);
        $this->assertSame(1, $sales->lastPage());
        $this->assertFalse($sales->hasNext());

        $this->assertSame(2, $filter(new PropertyQuery(transaction: 'rent'), 'fr')->total);
        $this->assertSame(2, $filter(new PropertyQuery(cities: [8]), 'fr')->total);
        $this->assertSame(1, $filter(new PropertyQuery(types: ['loft']), 'fr')->total);
        $this->assertSame(2, $filter(new PropertyQuery(types: ['loft', 'mansion']), 'fr')->total);
        $this->assertSame(2, $filter(new PropertyQuery(rooms: [5], budget: 3200000), 'fr')->total); // « 5 et plus » under 3.2 M: 7e (5 rooms, 3.15 M) + 16e (5 rooms, 1.89 M)
        $this->assertSame(5, $filter(new PropertyQuery(rooms: [3, 5]), 'fr')->total); // 3 rooms (the loft) + « 5 et plus » (7e, 16e, Monceau, the mansion)
        $this->assertSame(0, $filter(new PropertyQuery(cities: [20]), 'fr')->total);

        $page2 = $filter(new PropertyQuery(page: 2, perPage: 4), 'fr');
        $this->assertSame(['page' => 2, 'lastPage' => 2, 'total' => 6, 'perPage' => 4], $page2->toArray());
        $this->assertCount(2, $page2->items);
        $this->assertTrue($page2->hasPrevious());
        $this->assertFalse($page2->hasNext());
        $this->assertSame(app(ListProperties::class)('fr')[4]->slug, $page2->items[0]->slug);
    }

    public function test_richer_criteria_filter_the_sample_and_travel_in_the_query_string(): void
    {
        $filter = app(FilterProperties::class);
        $query = PropertyQuery::fromRequest(Request::create('/nos-biens', 'GET', [
            'budget_min' => '2 000 000', 'surface_min' => '150', 'bedrooms' => ['3', '9', '5'], 'features' => ['elevator', 'pool', 'view'],
            'condition' => ['renovated', 'ruin'], 'floor' => ['top', 'basement'], 'furnished' => '1', 'available' => '1', 'area' => ['Passy', ' '],
        ]));
        $this->assertSame(2000000, $query->budgetMin);
        $this->assertSame(150, $query->surfaceMin);
        $this->assertSame([3, 5], $query->bedrooms);
        $this->assertSame(['elevator', 'view'], $query->features);
        $this->assertSame(['renovated'], $query->conditions);
        $this->assertSame(['top'], $query->floors);
        $this->assertTrue($query->furnished);
        $this->assertTrue($query->availableOnly);
        $this->assertSame(['Passy'], $query->areas);
        $this->assertFalse($query->isIndexable());
        $this->assertSame(['budget_min' => 2000000, 'surface_min' => 150, 'bedrooms' => [3, 5], 'features' => ['elevator', 'view'], 'condition' => ['renovated'], 'floor' => ['top'], 'furnished' => '1', 'available' => '1', 'area' => ['Passy']], $query->params());

        $this->assertSame(3, $filter(new PropertyQuery(budgetMin: 3000000), 'fr')->total); // 3.15 M, 9.8 M, 4.3 M
        $this->assertSame(3, $filter(new PropertyQuery(surfaceMin: 160), 'fr')->total); // 165, 420, 210
        $this->assertSame(3, $filter(new PropertyQuery(bedrooms: [3]), 'fr')->total); // 7e, Passy, Monceau
        $this->assertSame(2, $filter(new PropertyQuery(features: ['elevator', 'view']), 'fr')->total); // every feature required: 7e, Monceau
        $this->assertSame(2, $filter(new PropertyQuery(conditions: ['to_renovate']), 'fr')->total);
        $this->assertSame(5, $filter(new PropertyQuery(floors: ['not_ground']), 'fr')->total); // the mansion sits on the ground
        $this->assertSame(2, $filter(new PropertyQuery(floors: ['top']), 'fr')->total); // 7e, the loft
        $this->assertSame(5, $filter(new PropertyQuery(availableOnly: true), 'fr')->total); // the 7e is under offer
        $this->assertSame(1, $filter(new PropertyQuery(areas: ['Passy']), 'fr')->total);
        $this->assertSame(1, $filter(new PropertyQuery(transaction: 'rent', furnished: true), 'fr')->total);
        $this->assertSame(6, $filter(new PropertyQuery(furnished: true), 'fr')->total); // furnished means nothing for a sale

        $sqm = $filter(new PropertyQuery(sort: 'sqm_asc'), 'fr')->items->map(fn (Property $p) => $p->pricePerSqm())->all();
        $this->assertSame($sqm, collect($sqm)->sort()->values()->all());
        $surfaces = $filter(new PropertyQuery(sort: 'surface_asc'), 'fr')->items->pluck('surface')->all();
        $this->assertSame($surfaces, collect($surfaces)->sort()->values()->all());
    }

    public function test_a_listing_is_new_for_fourteen_days_after_its_publication(): void
    {
        Carbon::setTestNow('2026-09-28');
        $sample = app(ListProperties::class)('fr');
        $this->assertTrue($sample[0]->isNew()); // published 2026-09-22
        $this->assertFalse($sample[1]->isNew()); // 2026-09-01
        $this->assertSame(19141, $sample[0]->pricePerSqm());
        $this->assertTrue($sample[0]->toArray()['is_new']);
        Carbon::setTestNow();
    }

    public function test_a_property_knows_when_it_is_sold_and_how_long_it_took(): void
    {
        $rows = collect(__('properties.sample', [], 'fr'));
        $sold = Property::fromArray($rows->firstWhere('slug', 'appartement-luxembourg'));
        $this->assertTrue($sold->isSold());
        $this->assertSame(23, $sold->daysToSell());
        $this->assertSame('2026-09-12', $sold->toArray()['sold_at']);
        $live = Property::fromArray($rows->firstWhere('slug', 'appartement-passy'));
        $this->assertFalse($live->isSold());
        $this->assertNull($live->daysToSell());
        // The richer fields ride along, optional and typed
        $this->assertSame('C', $live->dpe['energy']);
        $this->assertCount(2, $live->description);
        $this->assertSame(1931, $live->toArray()['year_built']);
        // The catalogue leaves the sold one out, `all()` keeps it
        $list = new ListProperties;
        $this->assertNull($list()->firstWhere('slug', 'appartement-luxembourg'));
        $this->assertNotNull($list->all()->firstWhere('slug', 'appartement-luxembourg'));
        $this->assertSame(8, $list->count());
    }
}
