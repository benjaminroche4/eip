<?php

namespace App\Domain\Blog\Data;

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Collection;

/** @implements Arrayable<string, mixed> */
final readonly class BlogListing implements Arrayable
{
    /** @param Collection<int, BlogPostSummary> $items */
    public function __construct(
        public Collection $items,
        public int $total,
        public int $currentPage,
        public int $perPage,
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
