<?php

namespace App\Http\Controllers;

use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/** « Acheter »: hero (Figma 712-18453 / 712-18766) with the agency's key figures (`about.stats`, same real numbers as the About page) and an optional presentation video (`seo.videos.buy`), then the three investment strategies (`buy.strategies.items`) and the four prime districts (`buy.districts.items`). */
class BuyController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('buy', [
            'stats' => __('ui.about.stats'),
            'video' => config('seo.videos.buy') ?: null,
            'strategies' => __('ui.buy.strategies.items'),
            'faq' => $this->faq(),
            'districts' => __('ui.buy.districts.items'),
        ]);
    }

    /**
     * The first six questions of the FAQ page's « buying » topic (single source of truth in `ui.faq.categories`),
     * with the topic slug so the block can link to that anchor on the FAQ page.
     *
     * @return array{slug: string, items: array<int, array{question: string, answer: string, slug: string}>}
     */
    private function faq(): array
    {
        $category = collect(__('ui.faq.categories'))->firstWhere('key', 'buying') ?? ['title' => '', 'items' => []];

        return [
            'slug' => Str::slug($category['title']),
            'items' => array_map(fn (array $item) => [...$item, 'slug' => Str::slug($item['question'])], array_slice($category['items'], 0, 6)),
        ];
    }
}
