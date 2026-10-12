<?php

namespace App\Domain\Content\Actions;

use App\Domain\Content\Data\Fact;
use App\Domain\Content\Support\LocaleNumber;

/**
 * « Notre bilan » of the Buy page: four facts distinct from the hero's key figures (rating, callback, languages,
 * address) from `buy.record.facts`. The Google tile carries `:rating` / `:count`, replaced from `seo.reviews` in the
 * page's language and dropped without real figures (moved out of BuyController, audit 2026-10-12).
 */
final class ListBuyFacts
{
    /** @return list<Fact> */
    public function __invoke(?string $locale = null): array
    {
        $locale ??= app()->getLocale();
        $rating = config('seo.reviews.rating');
        $count = config('seo.reviews.count');
        $facts = array_values(__('ui.buy.record.facts', [], $locale));
        if (! $rating || ! $count) {
            $facts = array_values(array_filter($facts, fn (array $f) => ($f['key'] ?? null) !== 'rating'));
        }
        $replace = [':rating' => LocaleNumber::decimal((float) $rating, $locale), ':count' => LocaleNumber::integer((int) $count, $locale)];

        return array_map(fn (array $f) => Fact::fromArray(array_map(fn (string $v) => strtr($v, $replace), $f)), $facts);
    }
}
