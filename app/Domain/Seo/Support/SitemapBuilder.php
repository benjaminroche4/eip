<?php

namespace App\Domain\Seo\Support;

use Mcamara\LaravelLocalization\Facades\LaravelLocalization;
use Spatie\Sitemap\Sitemap;
use Spatie\Sitemap\Tags\Url;

/**
 * Lists every indexable URL in every locale, with xhtml:link alternates (hreflang).
 * Add dynamic pages to `pages()` (return one entry per page with the route name + params).
 */
final class SitemapBuilder
{
    public function build(): Sitemap
    {
        $sitemap = Sitemap::create();
        $locales = array_keys(LaravelLocalization::getSupportedLocales());

        foreach ($this->pages() as $page) {
            foreach ($locales as $locale) {
                $url = Url::create($this->localized($locale, $page['path']))
                    ->setLastModificationDate($page['lastmod'] ?? now())
                    ->setPriority($page['priority'] ?? 0.5)
                    ->setChangeFrequency($page['freq'] ?? Url::CHANGE_FREQUENCY_WEEKLY);

                foreach ($locales as $alt) {
                    $url->addAlternate($this->localized($alt, $page['path']), $alt);
                }
                $url->addAlternate($this->localized(LaravelLocalization::getDefaultLocale(), $page['path']), 'x-default');

                $sitemap->add($url);
            }
        }

        return $sitemap;
    }

    /** @return list<array{path: string, priority?: float, freq?: string, lastmod?: \DateTimeInterface}> */
    private function pages(): array
    {
        return [
            ['path' => '/', 'priority' => 1.0, 'freq' => Url::CHANGE_FREQUENCY_WEEKLY],
            ['path' => 'routes.search', 'priority' => 0.8, 'freq' => Url::CHANGE_FREQUENCY_DAILY],
        ];
    }

    /** Path can be a literal ("/") or a translated route key ("routes.search"). */
    private function localized(string $locale, string $path): string
    {
        if (str_starts_with($path, 'routes.')) {
            return LaravelLocalization::getURLFromRouteNameTranslated($locale, $path);
        }

        return LaravelLocalization::localizeUrl($path, $locale);
    }
}
