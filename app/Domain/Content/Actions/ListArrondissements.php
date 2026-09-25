<?php

namespace App\Domain\Content\Actions;

use App\Domain\Content\Data\Arrondissement;

/** The 20 arrondissements of the Districts page, from `districts.items` in lang/{locale}/ui.php. */
final class ListArrondissements
{
    /** @return list<Arrondissement> */
    public function __invoke(?string $locale = null): array
    {
        return array_map(Arrondissement::fromArray(...), array_values(__('ui.districts.items', [], $locale)));
    }
}
