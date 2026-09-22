<?php

namespace App\Domain\Content\Data;

use App\Domain\Content\Support\ArrayShape;
use App\Domain\Content\Support\ContentList;
use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Str;

/** A topic of the FAQ page (`faq.categories`): stable key, title, slug (URL anchor) and its questions. */
final readonly class FaqCategory implements Arrayable
{
    /** @param list<FaqItem> $items */
    public function __construct(
        public string $key,
        public string $title,
        public string $slug,
        public array $items,
    ) {}

    /** @param array<string, mixed> $data */
    public static function fromArray(array $data): self
    {
        ArrayShape::validate(self::class, $data, ['key' => 'string', 'title' => 'string', 'items' => 'array']);

        return new self(
            key: $data['key'],
            title: $data['title'],
            slug: Str::slug($data['title']),
            items: array_map(FaqItem::fromArray(...), array_values($data['items'])),
        );
    }

    /** The same topic limited to its first questions (teaser blocks on other pages). */
    public function take(int $limit): self
    {
        return new self($this->key, $this->title, $this->slug, array_slice($this->items, 0, $limit));
    }

    public function toArray(): array
    {
        return ['key' => $this->key, 'title' => $this->title, 'items' => ContentList::toArray($this->items), 'slug' => $this->slug];
    }
}
