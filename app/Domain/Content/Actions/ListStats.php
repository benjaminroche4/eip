<?php

namespace App\Domain\Content\Actions;

use App\Domain\Content\Data\Stat;

/**
 * The agency's key figures (About manifesto, Buy / Sell heroes, home trust figure), from `about.stats` in
 * lang/{locale}/ui.php. The Google tile carries `:rating` / `:count`, replaced from `seo.reviews` (real figures only,
 * tile dropped without them) so the same number appears everywhere on the site (user decision 2026-10-11).
 */
final class ListStats
{
    /** @return list<Stat> */
    public function __invoke(?string $locale = null): array
    {
        $rating = config('seo.reviews.rating');
        $count = config('seo.reviews.count');
        $decimal = ($locale ?? app()->getLocale()) === 'fr' ? ',' : '.';
        $replace = [':rating' => number_format((float) $rating, 1, $decimal, ''), ':count' => number_format((int) $count, 0, $decimal, ' ')];
        $isGoogleTile = fn (array $stat): bool => str_contains($stat['value'].$stat['title'], ':rating') || str_contains($stat['value'].$stat['title'], ':count');

        $stats = array_values(__('ui.about.stats', [], $locale));
        if (! $rating || ! $count) {
            $stats = array_values(array_filter($stats, fn (array $stat) => ! $isGoogleTile($stat)));
        }

        return array_map(fn (array $stat) => Stat::fromArray(array_map(fn (string $v) => strtr($v, $replace), $stat)), $stats);
    }
}
