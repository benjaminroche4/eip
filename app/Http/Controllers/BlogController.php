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

/** Blog listing (/blog, /en/blog) and article page (/blog/{slug}). Content comes from Sanity (Domain/Blog). */
class BlogController extends Controller
{
    public function index(Request $request, ListBlogPosts $list): Response
    {
        $query = BlogQuery::fromRequest($request);
        $listing = $list($query);

        return Inertia::render('blog/index', [
            'posts' => $listing->toArray(),
            'indexing' => [
                'noindex' => ! $query->isIndexable(),
                'prev' => $listing->hasPrevious() ? route('blog.index', $query->toRouteParams($query->page - 1)) : null,
                'next' => $listing->hasNext() ? route('blog.index', $query->toRouteParams($query->page + 1)) : null,
            ],
        ]);
    }

    public function show(string $slug, ShowBlogPost $show, LocalizedUrls $localizedUrls): Response
    {
        $post = $show(app()->getLocale(), $slug) ?? abort(404);

        // Language switcher: the translated article when it exists, otherwise that locale's blog index.
        $urls = $post->localizedUrls();
        $switcher = [];
        foreach (array_keys(LaravelLocalization::getSupportedLocales()) as $locale) {
            $switcher[$locale] = $urls[$locale] ?? LaravelLocalization::getURLFromRouteNameTranslated($locale, 'routes.blog');
        }
        $localizedUrls->override($switcher);

        return Inertia::render('blog/show', [
            'post' => $post->toArray(),
            // hreflang: only real translations (+ x-default = FR when available, else the current page).
            'alternates' => $urls + ['x-default' => $urls[LaravelLocalization::getDefaultLocale()] ?? $urls[app()->getLocale()]],
        ]);
    }
}
