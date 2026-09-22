<?php

namespace App\Domain\Content\Actions;

use App\Domain\Content\Data\District;

/** The prime districts of the Buy page, from `buy.districts.items` in lang/{locale}/ui.php. */
final class ListDistricts
{
    /** @return list<District> */
    public function __invoke(?string $locale = null): array
    {
        return array_map(District::fromArray(...), array_values(__('ui.buy.districts.items', [], $locale)));
    }
}
