<?php

namespace App\Domain\Blog\Actions;

use App\Domain\Blog\Support\SanityClient;

/** Every published article (all locales) with its translations — feeds the sitemap. */
final class ListBlogUrls
{
    public function __construct(private readonly SanityClient $sanity) {}

    /** @return list<array{slug: string, language: string, updatedAt: string, translations: array<string, string>}> */
    public function __invoke(): array
    {
        $docs = $this->sanity->fetch('*[_type == "blog" && defined(slug.current) && !(_id in path("drafts.**"))] {
            "slug": slug.current, language, "updatedAt": _updatedAt,
            "translations": *[_type == "translation.metadata" && references(^._id)][0].translations[]{ "lang": _key, "slug": value->slug.current }
        }') ?? [];

        return array_values(array_map(function (array $doc) {
            $translations = [$doc['language'] => $doc['slug']];
            foreach ($doc['translations'] ?? [] as $t) {
                if (! empty($t['lang']) && ! empty($t['slug'])) {
                    $translations[$t['lang']] = $t['slug'];
                }
            }

            return ['slug' => $doc['slug'], 'language' => $doc['language'], 'updatedAt' => (string) ($doc['updatedAt'] ?? ''), 'translations' => $translations];
        }, array_filter($docs, fn ($d) => is_array($d) && ! empty($d['slug']) && ! empty($d['language']))));
    }
}
