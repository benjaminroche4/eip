<?php

namespace App\Domain\Search\Data;

use Illuminate\Http\Request;

/** Immutable value object describing a search request. */
final readonly class SearchQuery
{
    public function __construct(
        public string $term = '',
        public int $page = 1,
        public int $perPage = 10,
    ) {}

    public static function fromRequest(Request $request, int $perPage = 10): self
    {
        return new self(
            term: trim((string) $request->string('q')),
            page: max(1, $request->integer('page', 1)),
            perPage: $perPage,
        );
    }

    public function isFiltered(): bool
    {
        return $this->term !== '';
    }

    /** Only the canonical, unfiltered first page should be indexed. */
    public function isIndexable(): bool
    {
        return ! $this->isFiltered() && $this->page === 1;
    }

    /** @return array<string, string|int> */
    public function toRouteParams(?int $page = null): array
    {
        return array_filter(['q' => $this->term, 'page' => $page ?? $this->page], fn ($v) => $v !== '' && $v !== 1);
    }
}
