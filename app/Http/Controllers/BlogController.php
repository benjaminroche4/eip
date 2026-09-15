<?php

namespace App\Http\Controllers;

use App\Domain\Blog\Actions\ListBlogPosts;
use App\Domain\Blog\Actions\ShowBlogPost;
use App\Domain\Blog\Data\BlogQuery;
use App\Domain\Localization\Support\LocalizedUrls;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Mcamara\LaravelLocalization\Facades\LaravelLocalization;

/** Blog listing (/blog, /en/blog), category listing (/blog/categorie/{category}) and article page (/blog/{slug}). Content comes from Sanity (Domain/Blog). */
class BlogController extends Controller
{
    public function index(Request $request, ListBlogPosts $list): Response
    {
        return $this->listing(BlogQuery::fromRequest($request), $list);
    }

    /** Indexable category page (clean URL, page 1 only); an unknown category or an invalid slug is a 404. */
    public function category(Request $request, string $category, ListBlogPosts $list, LocalizedUrls $localizedUrls): Response
    {
        $query = BlogQuery::fromRequest($request, category: BlogQuery::slug($category) ?? abort(404));

        // Categories are not mapped between locales: the language switcher / hreflang point at the other locale's blog index.
        $switcher = [];
        foreach (array_keys(LaravelLocalization::getSupportedLocales()) as $locale) {
            $switcher[$locale] = $locale === app()->getLocale()
                ? route('blog.category', ['category' => $query->category])
                : LaravelLocalization::getURLFromRouteNameTranslated($locale, 'routes.blog');
        }
        $localizedUrls->override($switcher);

        return $this->listing($query, $list, requireCategory: true);
    }

    private function listing(BlogQuery $query, ListBlogPosts $list, bool $requireCategory = false): Response
    {
        $listing = $list($query);

        // Soft-404 guard: a page past the last one, or a category with no article, is a real 404.
        abort_if($query->page > 1 && $query->page > $listing->lastPage(), 404);
        abort_if($requireCategory && ! collect($listing->categories)->contains('slug', $query->category), 404);

        $url = fn (int $page) => route(...$query->route($page));

        return Inertia::render('blog/index', [
            'posts' => $listing->toArray(),
            'featured' => $listing->featured?->toArray(),
            'filter' => [
                'categories' => $listing->categories,
                'total_all' => $listing->totalAll,
                'active' => $listing->category,
                'urls' => ['all' => route('blog.index')] + collect($listing->categories)
                    ->mapWithKeys(fn (array $c) => [$c['slug'] => route('blog.category', ['category' => $c['slug']])])
                    ->all(),
            ],
            'indexing' => [
                'noindex' => ! $query->isIndexable(),
                'canonical' => $url($query->page),
                'prev' => $listing->hasPrevious() ? $url($query->page - 1) : null,
                'next' => $listing->hasNext() ? $url($query->page + 1) : null,
            ],
        ]);
    }

    public function show(string $slug, ShowBlogPost $show, ListBlogPosts $list, LocalizedUrls $localizedUrls): Response
    {
        $post = $show(app()->getLocale(), $slug) ?? abort(404);

        // « Nos derniers articles »: the 3 latest articles, never the one being read.
        $related = $list(new BlogQuery(locale: app()->getLocale(), perPage: 4))
            ->items
            ->reject(fn ($p) => $p->id === $post->summary->id)
            ->take(3)
            ->map(fn ($p) => $p->toArray())
            ->values()
            ->all();

        // Language switcher: the translated article when it exists, otherwise that locale's blog index.
        $urls = $post->localizedUrls();
        $switcher = [];
        foreach (array_keys(LaravelLocalization::getSupportedLocales()) as $locale) {
            $switcher[$locale] = $urls[$locale] ?? LaravelLocalization::getURLFromRouteNameTranslated($locale, 'routes.blog');
        }
        $localizedUrls->override($switcher);

        return Inertia::render('blog/show', [
            'post' => $post->toArray(),
            'related' => $related,
            // hreflang: only real translations (+ x-default = FR when available, else the current page).
            'alternates' => $urls + ['x-default' => $urls[LaravelLocalization::getDefaultLocale()] ?? $urls[app()->getLocale()]],
        ]);
    }
}
