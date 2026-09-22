<?php

namespace App\Http\Controllers;

use App\Domain\Blog\Actions\ListBlogPosts;
use App\Domain\Blog\Data\BlogListing;
use App\Domain\Blog\Data\BlogQuery;
use Inertia\Inertia;
use Inertia\Response;

/**
 * HTML sitemap (« Plan du site », 2026-09-22, replaces the former terms page): every public page of the current
 * locale in three groups (services, site pages, legal — the placeholder search page is left out on purpose), labels
 * from `ui.nav` / `ui.footer`, URLs from the named routes, then the blog's articles grouped by category (Sanity,
 * under `rescue()`: a CMS failure hides the blog, never the page).
 */
class SitemapPageController extends Controller
{
    /** Upper bound of articles listed per locale (one Sanity query, no pagination on a sitemap page). */
    private const MAX_POSTS = 200;

    public function __invoke(ListBlogPosts $posts): Response
    {
        $link = fn (string $label, string $route) => ['label' => __($label), 'href' => route($route)];
        $listing = rescue(fn () => $posts(new BlogQuery(locale: app()->getLocale(), perPage: self::MAX_POSTS)), null, true);

        return Inertia::render('sitemap', [
            'groups' => [
                ['title' => __('ui.footer.navigation'), 'links' => [
                    $link('ui.nav.buy', 'buy'),
                    $link('ui.nav.sell', 'sell'),
                    $link('ui.nav.estimate', 'estimate'),
                    $link('ui.nav.contact_page', 'contact'),
                ]],
                ['title' => __('ui.pages.sitemap.group_pages'), 'links' => [
                    $link('ui.nav.home', 'home'),
                    $link('ui.nav.about', 'about'),
                    $link('ui.nav.blog', 'blog.index'),
                    $link('ui.nav.faq', 'faq'),
                    $link('ui.nav.newsletter', 'newsletter'),
                ]],
                ['title' => __('ui.footer.legal_nav'), 'links' => [
                    $link('ui.footer.legal', 'legal'),
                    $link('ui.footer.privacy', 'privacy'),
                    $link('ui.footer.sitemap', 'sitemap'),
                ]],
            ],
            'blog' => $this->blog($listing),
        ]);
    }

    /**
     * Articles grouped by category (categories in Sanity order, only those with articles), the uncategorised ones last.
     *
     * @return array{categories: list<array{label: string, href: string, posts: list<array{label: string, href: string}>}>, other: list<array{label: string, href: string}>}
     */
    private function blog(?BlogListing $listing): array
    {
        if ($listing === null) {
            return ['categories' => [], 'other' => []];
        }

        $items = $listing->items->map(fn ($p) => ['label' => $p->title, 'href' => $p->toArray()['url'], 'category' => $p->category['slug'] ?? null]);
        $categories = [];
        foreach ($listing->categories as $c) {
            $posts = $items->where('category', $c['slug'])->map(fn (array $i) => ['label' => $i['label'], 'href' => $i['href']])->values()->all();
            if ($posts !== []) {
                $categories[] = ['label' => $c['name'], 'href' => route('blog.category', ['category' => $c['slug']]), 'posts' => $posts];
            }
        }
        $known = array_column($listing->categories, 'slug');

        return [
            'categories' => $categories,
            'other' => $items->reject(fn (array $i) => in_array($i['category'], $known, true))->map(fn (array $i) => ['label' => $i['label'], 'href' => $i['href']])->values()->all(),
        ];
    }
}
