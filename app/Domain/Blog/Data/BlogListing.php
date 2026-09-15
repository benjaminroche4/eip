<?php

namespace App\Domain\Blog\Data;

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Collection;

/** @implements Arrayable<string, mixed> */
final readonly class BlogListing implements Arrayable
{
    /**
     * @param  Collection<int, BlogPostSummary>  $items
     * @param  list<array{name: string, slug: string, color: string|null, count: int}>  $categories  every category of the locale with at least one article (counts ignore the active filter)
     * @param  int  $totalAll  articles of the locale, ignoring the active filter (the « all » badge)
     * @param  BlogPostSummary|null  $featured  latest article of the locale, ignoring the active filter (always « à la une »)
     */
    public function __construct(
        public Collection $items,
        public int $total,
        public int $currentPage,
        public int $perPage,
        public ?BlogPostSummary $featured = null,
        public array $categories = [],
        public int $totalAll = 0,
        public ?string $category = null,
    ) {}

    public function lastPage(): int
    {
        return max(1, (int) ceil($this->total / $this->perPage));
    }

    public function hasPrevious(): bool
    {
        return $this->currentPage > 1;
    }

    public function hasNext(): bool
    {
        return $this->currentPage < $this->lastPage();
    }

    public function toArray(): array
    {
        return [
            'data' => $this->items->map(fn (BlogPostSummary $p) => $p->toArray())->values()->all(),
            'total' => $this->total,
            'current_page' => $this->currentPage,
            'last_page' => $this->lastPage(),
        ];
    }
}
