<?php

namespace App\Http\Controllers;

use App\Domain\Blog\Support\SeoText;
use App\Domain\Content\Actions\ListArrondissements;
use App\Domain\Content\Support\ContentList;
use App\Domain\Localization\Support\LocalizedUrls;
use App\Domain\Properties\Actions\ShowProperty;
use App\Domain\Properties\Support\DistrictSlug;
use Inertia\Inertia;
use Inertia\Response;
use Mcamara\LaravelLocalization\Facades\LaravelLocalization;

/**
 * Detail page of a listing (`/nos-biens/{slug}` ↔ `/en/properties/{slug}`, 2026-09-28): the property, its similar
 * listings, its arrondissement (link to the district listing and to the arrondissement profile), the advisor in
 * charge, and the SEO meta derived from the listing (`SeoText`: title ≤ 60 with the suffix when it fits, description
 * ≤ 160 from the excerpt). hreflang / language switcher point to the same listing in the other language. A slug that
 * is not a published listing (unknown, or confidential) is a 404.
 */
class PropertyController extends Controller
{
    public function show(string $slug, ShowProperty $show, ListArrondissements $arrondissements, LocalizedUrls $localizedUrls): Response
    {
        $page = $show($slug);
        abort_if($page === null, 404);
        $property = $page->property;
        $locale = app()->getLocale();

        $localizedUrls->override(collect($page->slugs)
            ->mapWithKeys(fn (string $twin, string $code) => [$code => LaravelLocalization::getURLFromRouteNameTranslated($code, 'routes.properties').'/'.$twin])
            ->all());

        $arrondissement = collect($arrondissements())->firstWhere('n', $property->arrondissement);
        $seoTitle = SeoText::title($property->title);

        return Inertia::render('properties/show', [
            'property' => $property->toArray(),
            'similar' => ContentList::toArray($page->similar),
            'district' => [
                'n' => $property->arrondissement,
                'name' => $arrondissement?->name ?? "Paris {$property->arrondissement}",
                'areas' => $arrondissement?->areas ?? '',
                'url' => route('properties.district', ['district' => DistrictSlug::make($property->arrondissement, $locale)]),
                'profileUrl' => route('districts', [$locale === 'fr' ? 'arrondissement' : 'district' => $property->arrondissement]),
            ],
            'advisor' => ['id' => $property->advisor, 'photo' => "/images/advisors/advisor-{$property->advisor}.webp"],
            'seo' => ['title' => $seoTitle, 'withSuffix' => SeoText::fitsSuffix($seoTitle), 'description' => SeoText::description($property->excerpt)],
            'map' => ['key' => config('seo.google_maps.key'), 'mapId' => config('seo.google_maps.map_id')],
        ]);
    }
}
