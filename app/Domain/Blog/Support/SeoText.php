<?php

namespace App\Domain\Blog\Support;

/** Title / description clamping for dynamic pages (see CLAUDE.md « Meta title & description »). */
final class SeoText
{
    public const TITLE_MAX = 60;

    public const DESCRIPTION_MAX = 160;

    /** Title that stays ≤ 60 characters once the " · Site" suffix is appended. */
    public static function title(string $title): string
    {
        $suffix = config('seo.title_separator').config('seo.site_name');

        return self::clamp($title, self::TITLE_MAX - mb_strlen($suffix));
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
