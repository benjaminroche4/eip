<?php

namespace App\Http\Controllers;

use App\Domain\Blog\Actions\ListBlogPosts;
use App\Domain\Blog\Data\BlogQuery;
use App\Domain\Content\Actions\ExcerptFaqCategory;
use App\Domain\Content\Actions\ListSuccessStories;
use App\Domain\Content\Actions\ListTestimonials;
use App\Domain\Content\Support\ContentList;
use Inertia\Inertia;
use Inertia\Response;

/** Home page: hero, trust intro (real figure from `about.stats`), services, blog preview (3 latest Sanity articles), testimonials (portraits in public/images/testimonials), success stories (photos in public/images/stories), closing CTA. Content from `Domain/Content`. */
class HomeController extends Controller
{
    public function __invoke(ListTestimonials $testimonials, ListSuccessStories $stories, ListBlogPosts $posts, ExcerptFaqCategory $faq): Response
    {
        // Blog preview: the three latest articles of the locale. Sanity being a third party, a failure is reported
        // but never takes the home page down — the block is simply hidden.
        $latest = rescue(fn () => $posts(new BlogQuery(locale: app()->getLocale(), perPage: 3))->items->map(fn ($p) => $p->toArray())->values()->all(), [], true);

        return Inertia::render('home', [
            'posts' => $latest,
            'testimonials' => ContentList::toArray($testimonials()),
            'stories' => ContentList::toArray($stories()),
            'faq' => $faq('working', 6)->toArray(),
            // Trust intro headline figure: « properties sold » from about.stats (real numbers only, never a placeholder)
            'figure' => __('ui.about.stats.2.value'),
            // Properties on offer under the search bar (config, real figure only; null hides the line)
            'listings' => config('seo.listings_count'),
        ]);
    }
}
