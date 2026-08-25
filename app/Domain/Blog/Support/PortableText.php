<?php

namespace App\Domain\Blog\Support;

/**
 * Normalises a Sanity `blog.body` for the front: images get a resolved URL/size, everything else
 * is passed through as-is (the React renderer mirrors the Sanity block types).
 */
final class PortableText
{
    public function __construct(private readonly SanityImage $images) {}

    /**
     * @param  list<array<string, mixed>>|null  $body
     * @return list<array<string, mixed>>
     */
    public function normalize(?array $body): array
    {
        return array_values(array_map(function (array $section) {
            if (isset($section['content']) && is_array($section['content'])) {
                $section['content'] = array_values(array_map(fn (array $node) => $node['_type'] === 'image'
                    ? array_merge($node, ['image' => $this->images->resolve($node)])
                    : $node, $section['content']));
            }

            return $section;
        }, $body ?? []));
    }

    /**
     * FAQ items of every faqBlock, for the FAQPage JSON-LD.
     *
     * @param  list<array<string, mixed>>  $body
     * @return list<array{question: string, answer: string}>
     */
    public function faqs(array $body): array
    {
        $faqs = [];
        foreach ($body as $section) {
            if (($section['_type'] ?? null) !== 'faqBlock') {
                continue;
            }
            foreach ($section['items'] ?? [] as $item) {
                if (! empty($item['question']) && ! empty($item['answer'])) {
                    $faqs[] = ['question' => $item['question'], 'answer' => $item['answer']];
                }
            }
        }

        return $faqs;
    }

    /**
     * Plain text of the first paragraph (used as an excerpt fallback).
     *
     * @param  list<array<string, mixed>>  $body
     */
    public function firstParagraph(array $body): string
    {
        foreach ($body as $section) {
            foreach ($section['content'] ?? [] as $node) {
                if (($node['_type'] ?? null) === 'block' && ($node['style'] ?? 'normal') === 'normal' && empty($node['listItem'])) {
                    return trim(implode('', array_column($node['children'] ?? [], 'text')));
                }
            }
        }

        return '';
    }
}
