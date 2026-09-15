<?php

namespace App\Domain\Blog\Actions;

use App\Domain\Blog\Data\BlogListing;
use App\Domain\Blog\Data\BlogPostSummary;
use App\Domain\Blog\Data\BlogQuery;
use App\Domain\Blog\Support\SanityClient;
use App\Domain\Blog\Support\SanityImage;

/** Published articles of one locale, newest first, paginated. */
final class ListBlogPosts
{
    /** Published articles of the site's document type (services.sanity.blog_type, passed as $type) in one locale. */
    public const FILTER = '_type == $type && language == $lang && defined(slug.current) && !(_id in path("drafts.**"))';

    /** GROQ params shared by every article query. @return array<string, string> */
    public static function typeParams(): array
    {
        return ['type' => (string) config('services.sanity.blog_type', 'estateBlog')];
    }

    public const SUMMARY = '_id, _createdAt, title, "slug": slug.current, language, shortDescription, readTime,
        "publishedAt": coalesce(publishedAt, createdAt, _createdAt), "updatedAt": _updatedAt,
        mainPhoto{alt, asset}, "category": category->{name, "slug": slug.current, "color": color.hex}, "authors": authors[]->{fullName, "slug": slug.current, photo{asset}}';

    public function __construct(private readonly SanityClient $sanity, private readonly SanityImage $images) {}

    /** Category filter appended to FILTER when the listing is narrowed to one category slug. */
    public const CATEGORY_FILTER = ' && category->slug.current == $category';

    public function __invoke(BlogQuery $query): BlogListing
    {
        $filter = self::FILTER.($query->category !== null ? self::CATEGORY_FILTER : '');
        $groq = sprintf(
            '{ "items": *[%1$s] | order(coalesce(publishedAt, createdAt, _createdAt) desc) [$from...$to] { %2$s }, "total": count(*[%1$s]), "all": count(*[%3$s]),
              "featured": *[%3$s] | order(coalesce(publishedAt, createdAt, _createdAt) desc) [0] { %2$s },
              "categories": *[_type == $categoryType && language == $lang && defined(slug.current)] { name, "slug": slug.current, "color": color.hex, "count": count(*[%3$s && category._ref == ^._id]) } | order(name asc) }',
            $filter,
            self::SUMMARY,
            self::FILTER,
        );

        $result = $this->sanity->fetch($groq, self::typeParams() + [
            'categoryType' => (string) config('services.sanity.category_type', 'estateCategory'),
            'lang' => $query->locale,
            'from' => $query->offset(),
            'to' => $query->offset() + $query->perPage,
        ] + ($query->category !== null ? ['category' => $query->category] : [])) ?? [];

        return new BlogListing(
            items: collect($result['items'] ?? [])->map(fn (array $doc) => BlogPostSummary::fromSanity($doc, $this->images)),
            total: (int) ($result['total'] ?? 0),
            currentPage: $query->page,
            perPage: $query->perPage,
            featured: is_array($result['featured'] ?? null) ? BlogPostSummary::fromSanity($result['featured'], $this->images) : null,
            categories: self::categories($result['categories'] ?? []),
            totalAll: (int) ($result['all'] ?? 0),
            category: $query->category,
        );
    }

    /**
     * Categories with at least one article, in the shape of the card's `category` (+ count).
     *
     * @param  list<array<string, mixed>>  $docs
     * @return list<array{name: string, slug: string, color: string|null, count: int}>
     */
    private static function categories(array $docs): array
    {
        return array_values(array_filter(array_map(
            fn (array $c) => BlogPostSummary::category($c) !== null && (int) ($c['count'] ?? 0) > 0
                ? BlogPostSummary::category($c) + ['count' => (int) $c['count']]
                : null,
            $docs,
        )));
    }
}
