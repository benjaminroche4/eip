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
        return array_map(FaqCategory::fromArray(...), array_values(__('ui.faq.categories', [], $locale)));
    }
}
