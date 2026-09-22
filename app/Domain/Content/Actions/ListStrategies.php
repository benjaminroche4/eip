<?php

namespace App\Domain\Content\Actions;

use App\Domain\Content\Data\Strategy;

/** The investment strategies of the Buy page, from `buy.strategies.items` in lang/{locale}/ui.php. */
final class ListStrategies
{
    /** @return list<Strategy> */
    public function __invoke(?string $locale = null): array
    {
        return array_map(Strategy::fromArray(...), array_values(__('ui.buy.strategies.items', [], $locale)));
    }
}
