<?php

namespace App\Domain\Properties\Support;

/**
 * Clean listing URL per arrondissement (2026-09-28): `/nos-biens/paris-6e` ↔ `/en/properties/paris-6th`. The slug
 * carries the language's ordinal; `parse()` accepts any of them (a French slug on the English page is redirected to
 * the canonical one by the controller).
 */
final class DistrictSlug
{
    /** Route constraint: « paris- » + 1-20 + an ordinal suffix of either language. */
    public const PATTERN = 'paris-(?:[1-9]|1[0-9]|20)(?:er|e|st|nd|rd|th)';

    public static function make(int $n, string $locale): string
    {
        return 'paris-'.self::ordinal($n, $locale);
    }

    /** The arrondissement of a slug, or null when it is not one (the route constraint already filters most). */
    public static function parse(string $slug): ?int
    {
        if (preg_match('/^paris-(\d{1,2})(?:er|e|st|nd|rd|th)$/', $slug, $m) !== 1) {
            return null;
        }
        $n = (int) $m[1];

        return $n >= 1 && $n <= 20 ? $n : null;
    }

    /** « 1er » / « 2e » in French, « 1st » / « 2nd » / « 3rd » / « 4th » in English (as `lib/ordinal.ts`). */
    public static function ordinal(int $n, string $locale): string
    {
        if ($locale === 'fr') {
            return $n === 1 ? '1er' : "{$n}e";
        }
        $mod100 = $n % 100;
        if ($mod100 >= 11 && $mod100 <= 13) {
            return "{$n}th";
        }

        return $n.match ($n % 10) {
            1 => 'st',
            2 => 'nd',
            3 => 'rd',
            default => 'th',
        };
    }
}
