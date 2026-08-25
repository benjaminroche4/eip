<?php

namespace App\Domain\Blog\Actions;

use App\Domain\Blog\Data\BlogPost;
use App\Domain\Blog\Support\PortableText;
use App\Domain\Blog\Support\SanityClient;
use App\Domain\Blog\Support\SanityImage;

/** One published article by locale + slug, with its body and sibling translations. Null when unknown. */
final class ShowBlogPost
{
    public function __construct(
        private readonly SanityClient $sanity,
        private readonly SanityImage $images,
        private readonly PortableText $portableText,
    ) {}

    public function __invoke(string $locale, string $slug): ?BlogPost
    {
        $groq = sprintf(
            '*[%s && slug.current == $slug][0] { %s, body, metaDescription, tags,
                "translations": *[_type == "translation.metadata" && references(^._id)][0].translations[]{ "lang": _key, "slug": value->slug.current } }',
            ListBlogPosts::FILTER,
            ListBlogPosts::SUMMARY,
        );

        $doc = $this->sanity->fetch($groq, ['lang' => $locale, 'slug' => $slug]);

        return is_array($doc) && ! empty($doc['_id']) ? BlogPost::fromSanity($doc, $this->images, $this->portableText) : null;
    }
}
