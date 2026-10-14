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

    /**
     * `{w}` width template of the image (`?w={w}&auto=format&fit=max`), the shape the property cards, the image
     * sitemap and the JSON-LD expect (they substitute 800 or 1600). Null when the image has no resolvable asset.
     *
     * @param  array{asset?: array{_ref?: string}}|null  $image
     */
    public function template(?array $image): ?string
    {
        $ref = $image['asset']['_ref'] ?? null;
        if (! is_string($ref) || ! preg_match('/^image-([a-f0-9]+)-(\d+)x(\d+)-(\w+)$/', $ref, $m)) {
            return null;
        }

        [, $id, $width, $height, $ext] = $m;

        return sprintf('https://cdn.sanity.io/images/%s/%s/%s-%sx%s.%s?w={w}&auto=format&fit=max', $this->projectId, $this->dataset, $id, $width, $height, $ext);
    }

    /**
     * Intrinsic size of an image asset (`image-{id}-{w}x{h}-{ext}`), for `width` / `height` attributes without CLS.
     *
     * @param  array{asset?: array{_ref?: string}}|null  $image
     * @return array{width: int, height: int}|null
     */
    public function size(?array $image): ?array
    {
        $ref = $image['asset']['_ref'] ?? null;
        if (! is_string($ref) || ! preg_match('/^image-([a-f0-9]+)-(\d+)x(\d+)-(\w+)$/', $ref, $m)) {
            return null;
        }

        return ['width' => (int) $m[2], 'height' => (int) $m[3]];
    }

    /**
     * Square, cropped thumbnail URL (avatars). Null when the image has no resolvable asset.
     *
     * @param  array{asset?: array{_ref?: string}}|null  $image
     */
    public function thumbnail(?array $image, int $size = 64): ?string
    {
        $ref = $image['asset']['_ref'] ?? null;
        if (! is_string($ref) || ! preg_match('/^image-([a-f0-9]+)-(\d+)x(\d+)-(\w+)$/', $ref, $m)) {
            return null;
        }

        [, $id, $width, $height, $ext] = $m;

        return sprintf('https://cdn.sanity.io/images/%s/%s/%s-%sx%s.%s?w=%d&h=%d&fit=crop&auto=format', $this->projectId, $this->dataset, $id, $width, $height, $ext, $size, $size);
    }
}
