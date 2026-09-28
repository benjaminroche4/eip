<?php

namespace App\Domain\Properties\Actions;

use App\Domain\Content\Actions\ListArrondissements;
use App\Domain\Properties\Support\DistrictSlug;
use Mcamara\LaravelLocalization\Facades\LaravelLocalization;

/**
 * The clean district listing pages (`/nos-biens/paris-6e`, 2026-09-28) worth linking and indexing: every
 * arrondissement with at least one property for sale, with its localized URL, name and count. Feeds the
 * « Par arrondissement » links of the listing and the properties sitemap.
 */
final class ListDistrictListings
{
    public function __construct(private ListProperties $properties, private ListArrondissements $arrondissements) {}

    /** @return list<array{n: int, slug: string, url: string, name: string, count: int}> */
    public function __invoke(?string $locale = null): array
    {
        $locale ??= app()->getLocale();
        $counts = ($this->properties)($locale)->where('transaction', 'sale')->countBy('arrondissement');
        $names = collect(($this->arrondissements)($locale))->keyBy('n');

        return collect(range(1, 20))
            ->filter(fn (int $n) => ($counts[$n] ?? 0) > 0)
            ->map(fn (int $n) => [
                'n' => $n,
                'slug' => $slug = DistrictSlug::make($n, $locale),
                'url' => LaravelLocalization::getURLFromRouteNameTranslated($locale, 'routes.properties').'/'.$slug,
                'name' => $names[$n]?->name ?? "Paris $n",
                'count' => $counts[$n],
            ])
            ->values()
            ->all();
    }
}
