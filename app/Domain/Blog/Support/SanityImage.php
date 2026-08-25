<?php

namespace App\Domain\Blog\Support;

/**
 * Builds cdn.sanity.io URLs from an asset reference (`image-{id}-{w}x{h}-{ext}`), with the
 * intrinsic size so the front can render <SeoImage width height srcSet> without CLS.
 */
final class SanityImage
{
    public const WIDTHS = [480, 800, 1200, 1600];

    public function __construct(private readonly string $projectId, private readonly string $dataset) {}

    /**
     * @param  array{asset?: array{_ref?: string}, alt?: string}|null  $image
     * @return array{url: string, srcset: string, width: int, height: int, alt: string}|null
     */
    public function resolve(?array $image): ?array
    {
        $ref = $image['asset']['_ref'] ?? null;
        if (! is_string($ref) || ! preg_match('/^image-([a-f0-9]+)-(\d+)x(\d+)-(\w+)$/', $ref, $m)) {
            return null;
        }

        [, $id, $width, $height, $ext] = $m;
        $base = sprintf('https://cdn.sanity.io/images/%s/%s/%s-%sx%s.%s', $this->projectId, $this->dataset, $id, $width, $height, $ext);
        $widths = array_filter(self::WIDTHS, fn (int $w) => $w <= (int) $width) ?: [(int) $width];

        return [
            'url' => $base.'?w=1200&auto=format&fit=max',
            'srcset' => implode(', ', array_map(fn (int $w) => "{$base}?w={$w}&auto=format&fit=max {$w}w", $widths)),
            'width' => (int) $width,
            'height' => (int) $height,
            'alt' => (string) ($image['alt'] ?? ''),
        ];
    }
}
