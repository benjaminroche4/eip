<?php

namespace App\Http\Controllers;

use App\Domain\Content\Actions\ExcerptFaqCategory;
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
    public function __invoke(ListStats $stats, ListStrategies $strategies, ExcerptFaqCategory $faq, ListDistricts $districts, ListTestimonials $testimonials): Response
    {
        return Inertia::render('buy', [
            'stats' => ContentList::toArray($stats()),
            'video' => config('seo.videos.buy') ?: null,
            'strategies' => ContentList::toArray($strategies()),
            'faq' => $faq('buying', 6)->toArray(),
            'districts' => ContentList::toArray($districts()),
            'testimonials' => ContentList::toArray($testimonials()),
            'facts' => $this->facts(),
        ]);
    }

    /**
     * « Notre bilan »: four facts distinct from the hero's key figures (rating, reply time, languages, address). The
     * Google rating tile only exists with real figures in `seo.reviews`; `:rating` / `:count` are replaced here.
     *
     * @return list<array{key: string, value: string, title: string, text: string}>
     */
    private function facts(): array
    {
        $rating = config('seo.reviews.rating');
        $count = config('seo.reviews.count');
        $facts = array_values((array) __('ui.buy.record.facts'));
        if (! $rating || ! $count) {
            $facts = array_values(array_filter($facts, fn (array $f) => $f['key'] !== 'rating'));
        }
        $replace = [':rating' => number_format((float) $rating, 1, ',', ''), ':count' => number_format((int) $count, 0, ',', ' ')];

        return array_map(fn (array $f) => array_map(fn (string $v) => strtr($v, $replace), $f), $facts);
    }
}
