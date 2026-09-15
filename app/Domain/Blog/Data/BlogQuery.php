<?php

namespace App\Domain\Blog\Data;

use Illuminate\Http\Request;

/** Immutable description of a blog listing request (locale + page + optional category slug). */
final readonly class BlogQuery
{
    public function __construct(
        public string $locale,
        public int $page = 1,
        public int $perPage = 12,
        public ?string $category = null,
    ) {}

    /** @param  string|null  $category  category slug from the route (`/blog/categorie/{category}`), already validated */
    public static function fromRequest(Request $request, int $perPage = 12, ?string $category = null): self
    {
        return new self(
            locale: app()->getLocale(),
            page: max(1, $request->integer('page', 1)),
            perPage: $perPage,
            category: self::slug($category),
        );
    }

    /** Only the first page of a listing (all articles or one category) is indexable; deeper pages are `noindex, follow`. */
    public function isIndexable(): bool
    {
        return $this->page === 1;
    }

    /** A category slug (lowercase letters, digits, dashes) or null: anything else is ignored rather than sent to Sanity. */
    public static function slug(mixed $value): ?string
    {
        return is_string($value) && preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $value) ? $value : null;
    }

    public function offset(): int
    {
        return ($this->page - 1) * $this->perPage;
    }

    /** Route name + params of this listing (a category has its own clean URL). @return array{0: string, 1: array<string, int|string>} */
    public function route(?int $page = null): array
    {
        $page ??= $this->page;
        $params = $page > 1 ? ['page' => $page] : [];

        return $this->category !== null ? ['blog.category', ['category' => $this->category] + $params] : ['blog.index', $params];
    }
}
