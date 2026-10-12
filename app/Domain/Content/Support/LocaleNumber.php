<?php

namespace App\Domain\Content\Support;

/** Numbers written the French or English way (audit 2026-10-12: four `number_format` copies, one with the comma hard-coded for EN). */
final class LocaleNumber
{
    /** « 4,9 » / « 4.9 ». */
    public static function decimal(float $value, string $locale, int $decimals = 1): string
    {
        return number_format($value, $decimals, $locale === 'fr' ? ',' : '.', '');
    }

    /** « 1 250 » (narrow no-break space) / « 1,250 ». */
    public static function integer(int $value, string $locale): string
    {
        return $locale === 'fr' ? number_format($value, 0, ',', "\u{202F}") : number_format($value, 0, '.', ',');
    }
}
