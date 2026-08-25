<?php

namespace App\Domain\Blog\Data;

use App\Domain\Blog\Support\SanityImage;
use Illuminate\Contracts\Support\Arrayable;
use Mcamara\LaravelLocalization\Facades\LaravelLocalization;

/**
 * Card data for the listing. Mirrors the GROQ projection in ListBlogPosts.
 *
 * @implements Arrayable<string, mixed>
 */
final readonly class BlogPostSummary implements Arrayable
{
    /**
     * @param  array{url: string, srcset: string, width: int, height: int, alt: string}|null  $image
     * @param  array{name: string, slug: string}|null  $category
     * @param  list<array{name: string, slug: string}>  $authors
     */
    public function __construct(
        public string $id,
        public string $title,
        public string $slug,
        public string $language,
        public string $excerpt,
        public ?int $readTime,
        public string $publishedAt,
        public string $updatedAt,
        public ?array $image,
        public ?array $category,
        public array $authors,
    ) {}

    /** @param array<string, mixed> $doc */
    public static function fromSanity(array $doc, SanityImage $images): self
    {
        return new self(
            id: $doc['_id'],
            title: (string) ($doc['title'] ?? ''),
            slug: (string) ($doc['slug'] ?? ''),
            language: (string) ($doc['language'] ?? 'fr'),
            excerpt: (string) ($doc['shortDescription'] ?? ''),
            readTime: isset($doc['readTime']) ? (int) $doc['readTime'] : null,
            publishedAt: (string) ($doc['publishedAt'] ?? $doc['_createdAt'] ?? ''),
            updatedAt: (string) ($doc['updatedAt'] ?? $doc['publishedAt'] ?? ''),
            image: $images->resolve($doc['mainPhoto'] ?? null),
            category: self::category($doc['category'] ?? null),
            authors: array_values(array_filter(array_map(
                fn ($a) => is_array($a) && ! empty($a['fullName']) ? ['name' => $a['fullName'], 'slug' => (string) ($a['slug'] ?? '')] : null,
                $doc['authors'] ?? [],
            ))),
        );
    }

    public function url(): string
    {
        return LaravelLocalization::getURLFromRouteNameTranslated($this->language, 'routes.blog_show', ['slug' => $this->slug]) ?: route('blog.show', ['slug' => $this->slug]);
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'url' => $this->url(),
            'excerpt' => $this->excerpt,
            'read_time' => $this->readTime,
            'published_at' => $this->publishedAt,
            'updated_at' => $this->updatedAt,
            'image' => $this->image,
            'category' => $this->category,
            'authors' => $this->authors,
        ];
    }

    /** @return array{name: string, slug: string}|null */
    private static function category(mixed $category): ?array
    {
        return is_array($category) && ! empty($category['name'])
            ? ['name' => $category['name'], 'slug' => (string) ($category['slug'] ?? '')]
            : null;
    }
}
