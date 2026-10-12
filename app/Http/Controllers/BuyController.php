<?php

namespace App\Http\Controllers;

use App\Domain\Content\Actions\ExcerptFaqCategory;
use App\Domain\Content\Actions\ListBuyFacts;
use App\Domain\Content\Actions\ListDistricts;
use App\Domain\Content\Actions\ListStats;
use App\Domain\Content\Actions\ListStrategies;
use App\Domain\Content\Actions\ListTestimonials;
use App\Domain\Content\Support\ContentList;
use Inertia\Inertia;
use Inertia\Response;

/** « Acheter »: hero (Figma 712-18453 / 712-18766) with the agency's key figures (same real numbers as the About page) and an optional presentation video (`seo.videos.buy`), the three investment strategies, the four prime districts, the home testimonials, a teaser of the FAQ's « buying » topic and « Notre bilan » (four facts distinct from the hero figures, `facts()`). Content from `Domain/Content`. */
class BuyController extends Controller
{
    public function __invoke(ListStats $stats, ListStrategies $strategies, ExcerptFaqCategory $faq, ListDistricts $districts, ListTestimonials $testimonials, ListBuyFacts $facts): Response
    {
        return Inertia::render('buy', [
            'stats' => ContentList::toArray($stats()),
            'video' => config('seo.videos.buy') ?: null,
            'strategies' => ContentList::toArray($strategies()),
            'faq' => $faq('buying', 6, null, 6)->toArray(), // questions 7-11: the home teaser shows 1-6, fees included (2026-10-12)
            'districts' => ContentList::toArray($districts()),
            'testimonials' => ContentList::toArray($testimonials()),
            'facts' => ContentList::toArray($facts()),
        ]);
    }
}
