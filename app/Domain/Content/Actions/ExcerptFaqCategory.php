<?php

namespace App\Domain\Content\Actions;

use App\Domain\Content\Data\FaqExcerpt;

/** The first questions of one FAQ topic (by its stable `key`) for a teaser block; an unknown key yields an empty block. */
final class ExcerptFaqCategory
{
    public function __construct(private readonly ListFaqCategories $categories) {}

    public function __invoke(string $key, int $limit = 6, ?string $locale = null): FaqExcerpt
    {
        foreach (($this->categories)($locale) as $category) {
            if ($category->key === $key) {
                return FaqExcerpt::of($category, $limit);
            }
        }

        return FaqExcerpt::empty();
    }
}
