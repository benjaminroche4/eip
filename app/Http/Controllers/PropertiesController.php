<?php

namespace App\Http\Controllers;

use App\Domain\Content\Actions\ListArrondissements;
use App\Domain\Content\Support\ContentList;
use App\Domain\Localization\Support\LocalizedUrls;
use App\Domain\Properties\Actions\FilterProperties;
use App\Domain\Properties\Actions\ListDistrictListings;
use App\Domain\Properties\Actions\ListProperties;
use App\Domain\Properties\Data\PropertyQuery;
use App\Domain\Properties\Support\DistrictSlug;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Mcamara\LaravelLocalization\Facades\LaravelLocalization;

/**
 * « Nos biens » (`/nos-biens` ↔ `/en/properties`): the properties matching the query's filters, **paginated on the
 * server** (`?page=N`, 12 per page, rendered in SSR with `noindex` past page 1 and `rel prev/next`, a page past the
 * last one is a 404). The page's « Voir plus » requests the next page as a partial reload: `properties` is then a
 * merge prop, so the client appends instead of replacing; a filter change requests page 1 and replaces (2026-09-26).
 * **Clean district URLs** (`/nos-biens/paris-6e` ↔ `/en/properties/paris-6th`, 2026-09-28): the same listing narrowed
 * to one arrondissement, indexable on its plain first page, with its own title / h1 / breadcrumb, hreflang to its
 * twin and a `district` prop; a slug in the other language's ordinal is redirected to the canonical one.
 */
class PropertiesController extends Controller
{
    public function __construct(
        private readonly FilterProperties $filter,
        private readonly ListProperties $list,
        private readonly ListArrondissements $arrondissements,
        private readonly ListDistrictListings $districtListings,
        private readonly LocalizedUrls $localizedUrls,
    ) {}

    public function index(Request $request): Response
    {
        $query = PropertyQuery::fromRequest($request);

        return $this->render($query, null, fn (int $page) => route('properties', $query->params($page)), $query->isIndexable());
    }

    public function district(Request $request, string $district): Response|RedirectResponse
    {
        $n = DistrictSlug::parse($district);
        abort_if($n === null, 404);
        $locale = app()->getLocale();
        $canonical = DistrictSlug::make($n, $locale);
        if ($district !== $canonical) {
            return redirect()->route('properties.district', ['district' => $canonical] + $request->query(), 301);
        }
        $query = PropertyQuery::fromRequest($request)->withCities([$n]);
        $arrondissement = collect(($this->arrondissements)())->firstWhere('n', $n);

        // The twin page in every language (hreflang, switcher): same arrondissement, that language's slug
        $this->localizedUrls->override(collect(array_keys(LaravelLocalization::getSupportedLocales()))
            ->mapWithKeys(fn (string $code) => [$code => LaravelLocalization::getURLFromRouteNameTranslated($code, 'routes.properties').'/'.DistrictSlug::make($n, $code)])
            ->all());

        return $this->render(
            $query,
            ['n' => $n, 'slug' => $canonical, 'name' => $arrondissement?->name ?? "Paris $n", 'areas' => $arrondissement?->areas ?? ''],
            fn (int $page) => route('properties.district', ['district' => $canonical] + $query->params($page, withCities: false)),
            $query->isDistrictIndexable(),
        );
    }

    /** @param  array{n: int, slug: string, name: string, areas: string}|null  $district */
    private function render(PropertyQuery $query, ?array $district, \Closure $url, bool $indexable): Response
    {
        $listing = ($this->filter)($query);
        abort_if($query->page > 1 && $query->page > $listing->lastPage(), 404);
        $items = ContentList::toArray($listing->items->all());

        return Inertia::render('properties', [
            'properties' => $query->page > 1 ? Inertia::merge($items) : $items,
            'pagination' => $listing->toArray(),
            'filters' => $query->toArray(),
            'district' => $district,
            'districts' => ($this->districtListings)(),
            // Quartiers to offer in the filters (the `area` of every listing, 2026-09-28)
            'areas' => ($this->list)()->pluck('area')->unique()->sort()->values()->all(),
            'priceBounds' => $this->list->priceBounds(),
            'indexing' => [
                // A district page without a single property is thin: kept out of the index until it has some
                'noindex' => ! $indexable || ($district !== null && $listing->total === 0),
                'canonical' => $url($query->page),
                'prev' => $listing->hasPrevious() ? $url($query->page - 1) : null,
                'next' => $listing->hasNext() ? $url($query->page + 1) : null,
            ],
            'map' => ['key' => config('seo.google_maps.key'), 'mapId' => config('seo.google_maps.map_id')],
        ]);
    }
}
