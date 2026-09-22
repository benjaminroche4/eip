<?php

namespace App\Domain\Content\Actions;

use App\Domain\Content\Data\Strategy;

/** The three steps of a sale on the Sell page (« Comment vendons-nous votre bien ? »), from `sell.process.items` in lang/{locale}/ui.php — same `Strategy` DTO as the Buy strategies, rendered by the same block. */
final class ListSellSteps
{
    /** @return list<Strategy> */
    public function __invoke(?string $locale = null): array
    {
        return array_map(Strategy::fromArray(...), array_values(__('ui.sell.process.items', [], $locale)));
    }
}
