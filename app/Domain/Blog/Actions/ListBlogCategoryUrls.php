<?php

namespace App\Domain\Blog\Actions;

use App\Domain\Blog\Support\SanityClient;

/** Every category (all locales) that has at least one published article — the category pages of the sitemap. */
final class ListBlogCategoryUrls
{
    public function __construct(private readonly SanityClient $sanity) {}

    /** @return list<array{slug: string, language: string}> */
    public function __invoke(): array
    {
        $docs = $this->sanity->fetch('*[_type == $categoryType && defined(slug.current) && defined(language)
            && count(*[_type == $type && language == ^.language && category._ref == ^._id && defined(slug.current) && !(_id in path("drafts.**"))]) > 0]
            { "slug": slug.current, language }', ListBlogPosts::typeParams() + [
            'categoryType' => (string) config('services.sanity.category_type', 'estateCategory'),
        ]) ?? [];

        return array_values(array_map(
            fn (array $d) => ['slug' => (string) $d['slug'], 'language' => (string) $d['language']],
            array_filter($docs, fn ($d) => is_array($d) && ! empty($d['slug']) && ! empty($d['language'])),
        ));
    }
}
