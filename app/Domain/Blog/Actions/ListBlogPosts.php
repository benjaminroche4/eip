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
        mainPhoto{alt, asset}, "category": category->{name, "slug": slug.current}, "authors": authors[]->{fullName, "slug": slug.current}';

    public function __construct(private readonly SanityClient $sanity, private readonly SanityImage $images) {}

    public function __invoke(BlogQuery $query): BlogListing
    {
        $groq = sprintf(
            '{ "items": *[%1$s] | order(coalesce(publishedAt, createdAt, _createdAt) desc) [$from...$to] { %2$s }, "total": count(*[%1$s]) }',
            self::FILTER,
            self::SUMMARY,
        );

        $result = $this->sanity->fetch($groq, self::typeParams() + [
            'lang' => $query->locale,
            'from' => $query->offset(),
            'to' => $query->offset() + $query->perPage,
        ]) ?? [];

        return new BlogListing(
            items: collect($result['items'] ?? [])->map(fn (array $doc) => BlogPostSummary::fromSanity($doc, $this->images)),
            total: (int) ($result['total'] ?? 0),
            currentPage: $query->page,
            perPage: $query->perPage,
        );
    }
}
