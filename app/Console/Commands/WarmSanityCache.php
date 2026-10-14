<?php

namespace App\Console\Commands;

use App\Domain\Blog\Actions\ListBlogCategoryUrls;
use App\Domain\Blog\Actions\ListBlogPosts;
use App\Domain\Blog\Actions\ListBlogUrls;
use App\Domain\Blog\Data\BlogQuery;
use App\Domain\Blog\Exceptions\SanityRequestFailed;
use App\Domain\Blog\Support\SanityClient;
use App\Domain\Properties\Actions\FetchSanityProperties;
use Illuminate\Console\Command;

/**
 * Refreshes the Sanity queries the public pages depend on (home: 3 latest posts per language; blog index page 1;
 * sitemap page and sitemap files: every post and category URL; the listings of « Nos biens », one query for both
 * languages, 2026-10-14) so visitors always hit a warm cache. Each run **overwrites** the cached values (2026-10-14:
 * it used to return the cached hit, so a Studio publish waited for the 15-minute TTL). Scheduled every five minutes,
 * under the 15-minute cache TTL (audit 2026-10-12: the home paid 450 ms on a cold cache).
 */
class WarmSanityCache extends Command
{
    protected $signature = 'sanity:warm';

    protected $description = 'Warm the Sanity cache for the home, the blog index, the listings and the sitemap';

    public function handle(ListBlogPosts $posts, ListBlogUrls $urls, ListBlogCategoryUrls $categories, SanityClient $sanity): int
    {
        $sanity->refresh(); // overwrite, never settle for the cached value: this is how a Studio publish reaches the site
        $failures = 0;
        $jobs = [
            'home fr' => fn () => $posts(new BlogQuery(locale: 'fr', perPage: 3)),
            'home en' => fn () => $posts(new BlogQuery(locale: 'en', perPage: 3)),
            'blog fr' => fn () => $posts(new BlogQuery(locale: 'fr')),
            'blog en' => fn () => $posts(new BlogQuery(locale: 'en')),
            'post urls' => fn () => $urls(),
            'category urls' => fn () => $categories(),
            // The fetch action swallows a failure (empty catalogue): the raw query is run here so the failure is counted
            'properties' => fn () => $sanity->fetch(FetchSanityProperties::query(), FetchSanityProperties::params()),
        ];
        foreach ($jobs as $name => $job) {
            try {
                $job();
                $this->line("$name warmed.");
            } catch (SanityRequestFailed $e) {
                $failures++;
                $this->warn("$name failed: ".$e->getMessage());
            }
        }

        return $failures === count($jobs) ? self::FAILURE : self::SUCCESS;
    }
}
