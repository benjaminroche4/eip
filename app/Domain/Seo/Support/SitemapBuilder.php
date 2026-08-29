<?php

namespace App\Domain\Seo\Support;

use App\Domain\Blog\Actions\ListBlogUrls;
use App\Domain\Blog\Exceptions\SanityRequestFailed;
use Illuminate\Support\Facades\Log;
use Mcamara\LaravelLocalization\Facades\LaravelLocalization;
use Spatie\Sitemap\Sitemap;
use Spatie\Sitemap\SitemapIndex;
use Spatie\Sitemap\Tags\Sitemap as SitemapTag;
use Spatie\Sitemap\Tags\Url;

/**
 * One sitemap per content family, listed by an index (`sitemap.xml` → `sitemap.pages.xml`, `sitemap.blog.xml`):
 * every indexable URL in every locale, with xhtml:link alternates (hreflang). Add static pages to `pages()`;
 * a future catalogue gets its own `FILES` entry and builder method.
 */
final class SitemapBuilder
{
    /** Sub-sitemaps written next to the index, in public/. */
    public const FILES = ['pages' => 'sitemap.pages.xml', 'blog' => 'sitemap.blog.xml'];

    public function __construct(private readonly ListBlogUrls $blogUrls) {}

    /**
     * Builds the index and the sub-sitemaps. Returns them keyed by file name (`sitemap.xml` first),
     * each with its `lastmod`: the date of the freshest content of the family, not the generation time.
     *
     * @return array<string, Sitemap|SitemapIndex>
     */
    public function build(): array
    {
        $blog = $this->blog();
        $files = [
            self::FILES['pages'] => ['sitemap' => $this->pages(), 'lastmod' => $this->pagesLastmod()],
            self::FILES['blog'] => ['sitemap' => $blog['sitemap'], 'lastmod' => $blog['lastmod']],
        ];

        $index = SitemapIndex::create();
        foreach ($files as $file => $entry) {
            $index->add(SitemapTag::create(url('/'.$file))->setLastModificationDate($entry['lastmod']));
        }

        return ['sitemap.xml' => $index] + array_map(fn ($entry) => $entry['sitemap'], $files);
    }

    /** Static pages in every locale. */
    public function pages(): Sitemap
    {
        $sitemap = Sitemap::create();
        $locales = array_keys(LaravelLocalization::getSupportedLocales());

        foreach ($this->pageList() as $page) {
            foreach ($locales as $locale) {
                $url = Url::create($this->localized($locale, $page['path']))
                    ->setPriority($page['priority'] ?? 0.5)
                    ->setChangeFrequency($page['freq'] ?? Url::CHANGE_FREQUENCY_WEEKLY);
                if (isset($page['lastmod'])) {
                    $url->setLastModificationDate($page['lastmod']);
                }

                foreach ($locales as $alt) {
                    $url->addAlternate($this->localized($alt, $page['path']), $alt);
                }
                $url->addAlternate($this->localized(LaravelLocalization::getDefaultLocale(), $page['path']), 'x-default');

                $sitemap->add($url);
            }
        }

        return $sitemap;
    }

    /** Static pages change with deployments: their lastmod is the date of the current release (the app's own files). */
    private function pagesLastmod(): \DateTimeImmutable
    {
        $timestamp = max(filemtime(base_path('routes/web.php')) ?: 0, filemtime(base_path('lang/fr/ui.php')) ?: 0) ?: time();

        return (new \DateTimeImmutable)->setTimestamp($timestamp);
    }

    /** Blog posts in every language they exist in; lastmod = most recent update. @return array{sitemap: Sitemap, lastmod: \DateTimeImmutable} */
    public function blog(): array
    {
        $sitemap = Sitemap::create();
        $locales = array_keys(LaravelLocalization::getSupportedLocales());
        $lastmod = null;

        foreach ($this->blogPosts() as $post) {
            $url = Url::create($this->blogUrl($post['language'], $post['slug']))
                ->setPriority(0.6)
                ->setChangeFrequency(Url::CHANGE_FREQUENCY_MONTHLY);
            if ($post['updatedAt']) {
                $updated = new \DateTimeImmutable($post['updatedAt']);
                $url->setLastModificationDate($updated);
                $lastmod = $lastmod && $lastmod > $updated ? $lastmod : $updated;
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

        return ['sitemap' => $sitemap, 'lastmod' => $lastmod ?? new \DateTimeImmutable];
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
    private function pageList(): array
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
