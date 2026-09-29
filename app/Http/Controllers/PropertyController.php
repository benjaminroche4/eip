<?php

namespace App\Http\Controllers;

use App\Domain\Content\Actions\ListArrondissements;
use App\Domain\Content\Actions\ListTeamMembers;
use App\Domain\Content\Support\ContentList;
use App\Domain\Localization\Support\LocalizedUrls;
use App\Domain\Properties\Actions\ShowProperty;
use App\Domain\Properties\Support\DistrictSlug;
use App\Domain\Properties\Support\OffMarketAccess;
use App\Domain\Properties\Support\PropertySeo;
use App\Domain\Properties\Support\PropertyUrl;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Detail page of a listing (`/nos-biens/achat/paris-6e/{slug}` ↔ `/en/properties/buy/paris-6th/{slug}`, 2026-09-28 / 29,
 * transaction and arrondissement in the path for SEO): the property, its similar
 * listings, its arrondissement (link to the district listing and to the arrondissement profile), the advisor in
 * charge, the SEO meta built from the listing's data (`PropertySeo`: « Appartement 5 pièces, Passy · Paris 16e »,
 * description 120-160 with facts, excerpt and call to action) and four FAQ questions of the matching topic. hreflang / language switcher point to the same listing in the other language. A slug that
 * is not a published listing is a 404. A **confidential (off-market) listing** renders the gate `properties/locked`
 * (six-digit access code, `noindex`, nothing but its type and arrondissement) until the session is unlocked
 * (`OffMarketAccess`, user decision 2026-09-29); then the full page, still `noindex`.
 */
class PropertyController extends Controller
{
    public function show(string $transaction, string $district, string $slug, ShowProperty $show, ListArrondissements $arrondissements, ListTeamMembers $team, LocalizedUrls $localizedUrls): Response|RedirectResponse
    {
        $page = $show($slug, withOffMarket: true);
        abort_if($page === null, 404);
        $property = $page->property;
        $locale = app()->getLocale();

        // One canonical URL per listing: a wrong transaction or arrondissement, or the other language's words, is 301'd to it
        if ($transaction !== PropertyUrl::transactionSegment($property->transaction, $locale) || $district !== DistrictSlug::make($property->arrondissement, $locale)) {
            return redirect()->to(PropertyUrl::of($property, $locale), 301);
        }

        if ($property->offMarket && ! OffMarketAccess::isUnlocked(request()->session())) {
            return Inertia::render('properties/locked', [
                // Nothing that identifies the listing: its kind and arrondissement only
                'teaser' => ['type' => $property->type, 'transaction' => $property->transaction, 'arrondissement' => $property->arrondissement],
            ]);
        }

        $localizedUrls->override(collect($page->slugs)
            ->mapWithKeys(fn (string $twin, string $code) => [$code => PropertyUrl::make($property->transaction, $property->arrondissement, $twin, $code)])
            ->all());

        $arrondissement = collect($arrondissements())->firstWhere('n', $property->arrondissement);
        // The advisor in charge by name and role (E-E-A-T): the team member of the same rank, when the team has one
        $member = $team()[$property->advisor - 1] ?? null;

        return Inertia::render('properties/show', [
            'property' => $property->toArray(),
            'similar' => ContentList::toArray($page->similar),
            'district' => [
                'n' => $property->arrondissement,
                'name' => $arrondissement?->name ?? "Paris {$property->arrondissement}",
                'areas' => $arrondissement?->areas ?? '',
                // Average price per m² of the arrondissement, to read the listing's own against it
                'price' => $arrondissement?->price,
                'metro' => $arrondissement?->metro ?? [],
                'rer' => $arrondissement?->rer ?? [],
                'education' => array_slice($arrondissement?->education ?? [], 0, 3),
                'parks' => array_slice($arrondissement?->parks ?? [], 0, 3),
                'url' => route('properties.district', ['district' => DistrictSlug::make($property->arrondissement, $locale)]),
                'profileUrl' => route('districts', [$locale === 'fr' ? 'arrondissement' : 'district' => $property->arrondissement]),
            ],
            'advisor' => ['id' => $property->advisor, 'photo' => "/images/advisors/advisor-{$property->advisor}.webp", 'name' => $member?->name, 'role' => $member?->role],
            // Meta from the data (type, rooms, quartier, arrondissement), not the editorial title (SEO conventions, 2026-09-28)
            // Named `meta`, never `seo`: that name is the shared prop (organization, phone…) and a page prop would shadow it
            // (blank page 2026-09-28, the collision already met on the search page)
            'meta' => PropertySeo::for($property, $locale) + ($property->offMarket ? ['noindex' => true] : []),
            'map' => ['key' => config('seo.google_maps.key'), 'mapId' => config('seo.google_maps.map_id')],
            // Previous / next listing of the same transaction (2026-09-28)
            'neighbours' => [
                'previous' => $page->previous ? ['title' => $page->previous->title, 'url' => PropertyUrl::of($page->previous, $locale)] : null,
                'next' => $page->next ? ['title' => $page->next->title, 'url' => PropertyUrl::of($page->next, $locale)] : null,
            ],
        ]);
    }
}
