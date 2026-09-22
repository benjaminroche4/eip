<?php

namespace App\Http\Controllers;

use App\Domain\Content\Actions\ListSuccessStories;
use App\Domain\Content\Actions\ListTestimonials;
use App\Domain\Content\Support\ContentList;
use Inertia\Inertia;
use Inertia\Response;

/** Home page: hero, trust intro (real figure from `about.stats`), services, testimonials (portraits in public/images/testimonials), success stories (photos in public/images/stories), closing CTA. Content from `Domain/Content`. */
class HomeController extends Controller
{
    public function __invoke(ListTestimonials $testimonials, ListSuccessStories $stories): Response
    {
        return Inertia::render('home', [
            'testimonials' => ContentList::toArray($testimonials()),
            'stories' => ContentList::toArray($stories()),
            // Trust intro headline figure: « properties sold » from about.stats (real numbers only, never a placeholder)
            'figure' => __('ui.about.stats.2.value'),
        ]);
    }
}
