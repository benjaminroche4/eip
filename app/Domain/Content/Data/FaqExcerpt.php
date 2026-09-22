<?php

namespace App\Domain\Content\Data;

use App\Domain\Content\Support\ContentList;
use Illuminate\Contracts\Support\Arrayable;

/** A few questions of one FAQ topic plus that topic's anchor, for a teaser block linking to the FAQ page (Buy page). */
final readonly class FaqExcerpt implements Arrayable
{
    /** @param list<FaqItem> $items */
    public function __construct(
        public string $slug,
        public array $items,
    ) {}

    public static function of(FaqCategory $category, int $limit): self
    {
        return new self(slug: $category->slug, items: $category->take($limit)->items);
    }

    /** No topic found: an empty block, never a broken page. */
    public static function empty(): self
    {
        return new self(slug: '', items: []);
    }

    /** @return array{slug: string, items: list<array{question: string, answer: string, slug: string}>} */
    public function toArray(): array
    {
        return ['slug' => $this->slug, 'items' => ContentList::toArray($this->items)];
    }
}
