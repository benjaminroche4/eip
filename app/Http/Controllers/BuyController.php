<?php

namespace App\Http\Controllers;

use App\Domain\Content\Actions\ExcerptFaqCategory;
use App\Domain\Content\Actions\ListDistricts;
use App\Domain\Content\Actions\ListStats;
use App\Domain\Content\Actions\ListStrategies;
use App\Domain\Content\Support\ContentList;
use Inertia\Inertia;
use Inertia\Response;

/** « Acheter »: hero (Figma 712-18453 / 712-18766) with the agency's key figures (same real numbers as the About page) and an optional presentation video (`seo.videos.buy`), the three investment strategies, the four prime districts and a teaser of the FAQ's « buying » topic. Content from `Domain/Content`. */
class BuyController extends Controller
{
    public function __invoke(ListStats $stats, ListStrategies $strategies, ExcerptFaqCategory $faq, ListDistricts $districts): Response
    {
        return Inertia::render('buy', [
            'stats' => ContentList::toArray($stats()),
            'video' => config('seo.videos.buy') ?: null,
            'strategies' => ContentList::toArray($strategies()),
            'faq' => $faq('buying', 6)->toArray(),
            'districts' => ContentList::toArray($districts()),
        ]);
    }
}
