<?php

namespace App\Domain\Localization\Support;

use Illuminate\Support\Arr;
use Illuminate\Support\Str;

/**
 * The `translations` Inertia prop, trimmed per route (2026-09-22): `ui.php` weighs ~48 KB and every page used to
 * embed all of it (the FAQ page carried the valuation form's strings and vice versa). Only the sections the page's
 * components read are shared: the layout's sections always, plus the route's own. `SharedTranslationsTest` scans
 * each page's imports for `t('section.…')` calls, so a missing section fails the suite instead of showing raw keys.
 */
final class SharedTranslations
{
    /** Sections read by the layout (header, footer, skip link), the error page and the service-page intro. */
    public const ALWAYS = ['nav', 'footer', 'a11y', 'pages', 'cta', 'errors', 'legal_pages'];

    /** Extra sections per route family (the part of the route name before the first dot: `blog.show` → `blog`). */
    public const ROUTES = [
        'home' => ['home', 'services', 'testimonials', 'stories', 'blog', 'faq', 'about'],
        'buy' => ['buy', 'faq', 'testimonials'],
        'sell' => ['sell', 'faq', 'testimonials', 'stories'], // stories: the home's photo row (arrow labels)
        'estimate' => ['estimate', 'contact'],
        'contact' => ['contact'],
        'newsletter' => ['newsletter', 'contact'],
        'about' => ['about', 'team', 'values', 'testimonials'],
        'faq' => ['faq'],
        'blog' => ['blog', 'faq'],
        'search' => ['search'],
        'privacy' => [],
        'legal' => [],
        'sitemap' => [],
    ];

    /**
     * Content arrays the controllers already pass as page props (FAQ categories, team, testimonials…): never read
     * through `t()`, so they are stripped from the shared strings (the FAQ's 12 KB of questions were sent twice).
     */
    public const EXCLUDE = ['faq.categories', 'testimonials.items', 'team.members', 'stories.items', 'about.stats', 'buy.strategies.items', 'buy.districts.items', 'sell.process.items', 'sell.gallery'];

    /** @return list<string> */
    public static function sectionsFor(?string $routeName): array
    {
        $family = $routeName === null ? null : Str::before($routeName, '.');

        return array_values(array_unique([...self::ALWAYS, ...(self::ROUTES[$family] ?? [])]));
    }

    /** @return array<string, mixed> the `ui` strings of the current locale, limited to the route's sections */
    public static function forRoute(?string $routeName): array
    {
        $all = trans('ui');
        $all = is_array($all) ? $all : [];

        $shared = array_intersect_key($all, array_flip(self::sectionsFor($routeName)));
        Arr::forget($shared, self::EXCLUDE);

        return $shared;
    }
}
