<?php

namespace App\Http\Controllers;

use App\Domain\Content\Actions\ExcerptFaqCategory;
use App\Domain\Content\Actions\ListSellSteps;
use App\Domain\Content\Actions\ListStats;
use App\Domain\Content\Actions\ListSuccessStories;
use App\Domain\Content\Actions\ListTestimonials;
use App\Domain\Content\Support\ContentList;
use Inertia\Inertia;
use Inertia\Response;

/** « Vendre » (2026-09-22): hero (intro, valuation button, proof line, wide photo), the four reasons to sell with the agency, the three steps of the sale (`sell.process.items`), the confidential-sale text + photo block (`sell.confidential.*`), the home's photo row (`stories.items`), the home testimonials, a teaser of the FAQ's « selling » topic and a valuation-oriented CTA card. Content from `Domain/Content`. */
class SellController extends Controller
{
    public function __invoke(ListSellSteps $steps, ListSuccessStories $stories, ListTestimonials $testimonials, ExcerptFaqCategory $faq, ListStats $stats): Response
    {
        return Inertia::render('sell', [
            'stories' => ContentList::toArray($stories()),
            'stats' => ContentList::toArray($stats()),
            'video' => config('seo.videos.sell') ?: null,
            'steps' => ContentList::toArray($steps()),
            'testimonials' => ContentList::toArray($testimonials()),
            'faq' => $faq('selling', 6)->toArray(),
        ]);
    }
}
