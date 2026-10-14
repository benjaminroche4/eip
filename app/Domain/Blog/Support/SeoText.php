<?php

namespace App\Domain\Blog\Support;

/** Title / description clamping for dynamic pages (see CLAUDE.md « Meta title & description »). */
final class SeoText
{
    public const TITLE_MAX = 60;

    public const DESCRIPTION_MAX = 160;

    public const DESCRIPTION_MIN = 120;

    public const TITLE_MIN = 20;

    /**
     * Page title of a dynamic page, ≤ 60 characters with the « Site - » brand prefix. Order of preference: the whole
     * title with the prefix; the head before its last natural break (« : », « ? », « - », « | », « ( ») with the
     * prefix; the whole title without prefix (see `fitsBrand()`); a word-boundary cut at 60 without prefix.
     * Keywords are never sacrificed to the brand.
     */
    public static function title(string $title): string
    {
        $title = trim(preg_replace('/\s+/u', ' ', $title) ?? $title);
        $max = self::TITLE_MAX - mb_strlen(self::brand());
        if (mb_strlen($title) <= $max) {
            return $title;
        }

        // The 30-character minimum applies to the full <title>, brand prefix included.
        $minHead = max(15, self::TITLE_MIN - mb_strlen(self::brand()));
        if (preg_match_all('/\s*[:?|(]|\s[-–—]\s/u', $title, $m, PREG_OFFSET_CAPTURE)) {
            foreach (array_reverse($m[0]) as [$sep, $offset]) {
                $head = rtrim(mb_strcut($title, 0, $offset), ' :?|(-–—');
                if (mb_strlen($head) >= $minHead && mb_strlen($head) <= $max) {
                    return $head;
                }
            }
        }

        return self::clamp($title, self::TITLE_MAX);
    }

    /** Whether the « Site - » brand prefix can be prepended to `title()`'s result while staying ≤ 60 characters. */
    public static function fitsBrand(string $seoTitle): bool
    {
        return mb_strlen(self::brand().$seoTitle) <= self::TITLE_MAX;
    }

    private static function brand(): string
    {
        return config('seo.site_name').config('seo.title_separator');
    }

    public static function description(string $text): string
    {
        return self::clamp($text, self::DESCRIPTION_MAX);
    }

    /** Cuts on a word boundary and appends an ellipsis when truncated. */
    public static function clamp(string $text, int $max): string
    {
        $text = trim(preg_replace('/\s+/u', ' ', $text) ?? $text);
        if (mb_strlen($text) <= $max) {
            return $text;
        }

        // Keep one extra character so a word ending exactly at the limit is not dropped, then drop the (partial) last word.
        $cut = mb_substr($text, 0, $max);
        $cut = preg_replace('/\s*\S*$/u', '', $cut) ?: mb_substr($text, 0, $max - 1);

        return rtrim($cut, ' ,;:.-–—').'…';
    }
}
