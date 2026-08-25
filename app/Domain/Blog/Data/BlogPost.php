<?php

namespace App\Domain\Blog\Data;

use App\Domain\Blog\Support\PortableText;
use App\Domain\Blog\Support\SanityImage;
use App\Domain\Blog\Support\SeoText;
use Illuminate\Contracts\Support\Arrayable;
use Mcamara\LaravelLocalization\Facades\LaravelLocalization;

/**
 * Full article for the detail page: summary + body + SEO strings + sibling translations.
 *
 * @implements Arrayable<string, mixed>
 */
final readonly class BlogPost implements Arrayable
{
    /**
     * @param  list<array<string, mixed>>  $body  normalised Portable Text sections
     * @param  list<array{question: string, answer: string}>  $faqs
     * @param  array<string, string>  $translations  locale → slug (includes the current locale)
     * @param  list<string>  $tags
     */
    public function __construct(
        public BlogPostSummary $summary,
        public array $body,
        public array $faqs,
        public string $seoTitle,
        public string $seoDescription,
        public array $translations,
        public array $tags,
    ) {}

    /** @param array<string, mixed> $doc */
    public static function fromSanity(array $doc, SanityImage $images, PortableText $portableText): self
    {
        $summary = BlogPostSummary::fromSanity($doc, $images);
        $body = $portableText->normalize($doc['body'] ?? null);

        $translations = [];
        foreach ($doc['translations'] ?? [] as $t) {
            if (! empty($t['lang']) && ! empty($t['slug'])) {
                $translations[$t['lang']] = $t['slug'];
            }
        }
        $translations[$summary->language] = $summary->slug;

        return new self(
            summary: $summary,
            body: $body,
            faqs: $portableText->faqs($body),
            seoTitle: SeoText::title($summary->title),
            seoDescription: SeoText::description((string) ($doc['metaDescription'] ?: $summary->excerpt ?: $portableText->firstParagraph($body))),
            translations: $translations,
            tags: array_values(array_filter($doc['tags'] ?? [], 'is_string')),
        );
    }

    /**
     * Absolute URL of this article in every locale where a translation exists.
     *
     * @return array<string, string> locale → URL
     */
    public function localizedUrls(): array
    {
        $urls = [];
        foreach ($this->translations as $locale => $slug) {
            if (array_key_exists($locale, LaravelLocalization::getSupportedLocales())) {
                $urls[$locale] = LaravelLocalization::getURLFromRouteNameTranslated($locale, 'routes.blog_show', ['slug' => $slug]);
            }
        }

        return array_filter($urls);
    }

    public function toArray(): array
    {
        return [
            ...$this->summary->toArray(),
            'body' => $this->body,
            'faqs' => $this->faqs,
            'seo_title' => $this->seoTitle,
            'seo_description' => $this->seoDescription,
            'tags' => $this->tags,
        ];
    }
}
