<?php

namespace App\Domain\Blog\Data;

use Illuminate\Http\Request;

/** Immutable description of a blog listing request (locale + page). */
final readonly class BlogQuery
{
    public function __construct(
        public string $locale,
        public int $page = 1,
        public int $perPage = 12,
    ) {}

    public static function fromRequest(Request $request, int $perPage = 12): self
    {
        return new self(
            locale: app()->getLocale(),
            page: max(1, $request->integer('page', 1)),
            perPage: $perPage,
        );
    }

    /** Only the first page of the listing is indexable; deeper pages are `noindex, follow`. */
    public function isIndexable(): bool
    {
        return $this->page === 1;
    }

    public function offset(): int
    {
        return ($this->page - 1) * $this->perPage;
    }

    /** @return array<string, int> */
    public function toRouteParams(?int $page = null): array
    {
        $page ??= $this->page;

        return $page > 1 ? ['page' => $page] : [];
    }
}
