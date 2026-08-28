<?php

namespace App\Domain\Seo\Support;

use App\Domain\Blog\Actions\ListBlogUrls;
use App\Domain\Blog\Exceptions\SanityRequestFailed;
use Illuminate\Support\Facades\Log;
use Mcamara\LaravelLocalization\Facades\LaravelLocalization;
use Spatie\Sitemap\Sitemap;
use Spatie\Sitemap\Tags\Url;

/**
 * Lists every indexable URL in every locale, with xhtml:link alternates (hreflang).
 * Add dynamic pages to `pages()` (return one entry per page with the route name + params).
 */
final class SitemapBuilder
{
    public function __construct(private readonly ListBlogUrls $blogUrls) {}

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

        foreach ($this->blogPosts() as $post) {
            $url = Url::create($this->blogUrl($post['language'], $post['slug']))
                ->setPriority(0.6)
                ->setChangeFrequency(Url::CHANGE_FREQUENCY_MONTHLY);
            if ($post['updatedAt']) {
                $url->setLastModificationDate(new \DateTimeImmutable($post['updatedAt']));
            }
            foreach ($post['translations'] as $alt => $slug) {
                if (in_array($alt, $locales, true)) {
                    $url->addAlternate($this->blogUrl($alt, $slug), $alt);
                }
            }
            $default = LaravelLocalization::getDefaultLocale();
            $url->addAlternate($this->blogUrl($default, $post['translations'][$default] ?? $post['slug']), 'x-default');
            $sitemap->add($url);
        }

        return $sitemap;
    }

    /** @return list<array{slug: string, language: string, updatedAt: string, translations: array<string, string>}> */
    private function blogPosts(): array
    {
        try {
            return ($this->blogUrls)();
        } catch (SanityRequestFailed $e) {
            Log::warning('Sitemap: blog posts skipped — '.$e->getMessage());

            return [];
        }
    }

    private function blogUrl(string $locale, string $slug): string
    {
        return LaravelLocalization::getURLFromRouteNameTranslated($locale, 'routes.blog_show', ['slug' => $slug]);
    }

    /** @return list<array{path: string, priority?: float, freq?: string, lastmod?: \DateTimeInterface}> */
    private function pages(): array
    {
        return [
            ['path' => '/', 'priority' => 1.0, 'freq' => Url::CHANGE_FREQUENCY_WEEKLY],
            ['path' => 'routes.search', 'priority' => 0.8, 'freq' => Url::CHANGE_FREQUENCY_DAILY],
            ['path' => 'routes.buy', 'priority' => 0.9, 'freq' => Url::CHANGE_FREQUENCY_WEEKLY],
            ['path' => 'routes.sell', 'priority' => 0.9, 'freq' => Url::CHANGE_FREQUENCY_MONTHLY],
            ['path' => 'routes.estimate', 'priority' => 0.9, 'freq' => Url::CHANGE_FREQUENCY_MONTHLY],
            ['path' => 'routes.contact', 'priority' => 0.6, 'freq' => Url::CHANGE_FREQUENCY_YEARLY],
            ['path' => 'routes.newsletter', 'priority' => 0.5, 'freq' => Url::CHANGE_FREQUENCY_YEARLY],
            ['path' => 'routes.faq', 'priority' => 0.6, 'freq' => Url::CHANGE_FREQUENCY_MONTHLY],
            ['path' => 'routes.blog', 'priority' => 0.7, 'freq' => Url::CHANGE_FREQUENCY_DAILY],
            ['path' => 'routes.privacy', 'priority' => 0.2, 'freq' => Url::CHANGE_FREQUENCY_YEARLY],
            ['path' => 'routes.legal', 'priority' => 0.2, 'freq' => Url::CHANGE_FREQUENCY_YEARLY],
            ['path' => 'routes.terms', 'priority' => 0.2, 'freq' => Url::CHANGE_FREQUENCY_YEARLY],
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
