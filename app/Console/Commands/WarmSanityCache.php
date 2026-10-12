<?php

namespace App\Console\Commands;

use App\Domain\Blog\Actions\ListBlogCategoryUrls;
use App\Domain\Blog\Actions\ListBlogPosts;
use App\Domain\Blog\Actions\ListBlogUrls;
use App\Domain\Blog\Data\BlogQuery;
use App\Domain\Blog\Exceptions\SanityRequestFailed;
use Illuminate\Console\Command;

/**
 * Refreshes the Sanity queries the public pages depend on (home: 3 latest posts per language; blog index page 1;
 * sitemap page and sitemap files: every post and category URL) so visitors always hit a warm cache. Scheduled every
 * ten minutes, under the 15-minute cache TTL (audit 2026-10-12: the home paid 450 ms on a cold cache).
 */
class WarmSanityCache extends Command
{
    protected $signature = 'sanity:warm';

    protected $description = 'Warm the Sanity cache for the home, the blog index and the sitemap';

    public function handle(ListBlogPosts $posts, ListBlogUrls $urls, ListBlogCategoryUrls $categories): int
    {
        $failures = 0;
        $jobs = [
            'home fr' => fn () => $posts(new BlogQuery(locale: 'fr', perPage: 3)),
            'home en' => fn () => $posts(new BlogQuery(locale: 'en', perPage: 3)),
            'blog fr' => fn () => $posts(new BlogQuery(locale: 'fr')),
            'blog en' => fn () => $posts(new BlogQuery(locale: 'en')),
            'post urls' => fn () => $urls(),
            'category urls' => fn () => $categories(),
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
