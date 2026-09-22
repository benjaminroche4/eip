<?php

namespace App\Domain\Content\Actions;

use App\Domain\Content\Data\Stat;

/** The agency's key figures (About manifesto, Buy hero), from `about.stats` in lang/{locale}/ui.php. */
final class ListStats
{
    /** @return list<Stat> */
    public function __invoke(?string $locale = null): array
    {
        return array_map(Stat::fromArray(...), array_values(__('ui.about.stats', [], $locale)));
    }
}
