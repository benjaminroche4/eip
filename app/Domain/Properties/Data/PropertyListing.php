<?php

namespace App\Domain\Properties\Data;

use Illuminate\Support\Collection;

/** One page of filtered properties plus what the pagination needs. */
final readonly class PropertyListing
{
    /** @param Collection<int, Property> $items */
    public function __construct(
        public Collection $items,
        public int $total,
        public int $page,
        public int $perPage,
    ) {}

    public function lastPage(): int
    {
        return max(1, (int) ceil($this->total / $this->perPage));
    }

    public function hasNext(): bool
    {
        return $this->page < $this->lastPage();
    }

    public function hasPrevious(): bool
    {
        return $this->page > 1;
    }

    /** @return array{page: int, lastPage: int, total: int, perPage: int} */
    public function toArray(): array
    {
        return ['page' => $this->page, 'lastPage' => $this->lastPage(), 'total' => $this->total, 'perPage' => $this->perPage];
    }
}
