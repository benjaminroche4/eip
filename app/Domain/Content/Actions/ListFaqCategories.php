<?php

namespace App\Domain\Content\Actions;

use App\Domain\Content\Data\FaqCategory;

/**
 * The FAQ topics and their questions, from `faq.categories` in lang/{locale}/ui.php: one list feeds the HTML
 * and the FAQPage JSON-LD. Each topic and question gets a stable slug (from its title) used as URL anchor.
 */
final class ListFaqCategories
{
    /** @return list<FaqCategory> */
    public function __invoke(?string $locale = null): array
    {
        // « :hours » in an answer = the configured opening hours of that locale (SEO_OPENING_HOURS_FR / _EN), the footer's label (2026-10-12)
        $hours = (string) config('seo.hours.labels.'.($locale ?? app()->getLocale()), config('seo.hours.spec'));
        $categories = array_map(function (array $category) use ($hours) {
            $category['items'] = array_map(fn (array $item) => ['answer' => str_replace(':hours', $hours, (string) ($item['answer'] ?? ''))] + $item, $category['items'] ?? []);

            return $category;
        }, array_values(__('ui.faq.categories', [], $locale)));

        return array_map(FaqCategory::fromArray(...), $categories);
    }
}
