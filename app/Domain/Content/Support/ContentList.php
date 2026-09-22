<?php

namespace App\Domain\Content\Support;

use Illuminate\Contracts\Support\Arrayable;

/** Turns a list of content DTOs into the plain arrays handed to Inertia (explicit, like `LegalPage::toArray()`). */
final class ContentList
{
    /**
     * @param  list<Arrayable<string, mixed>>  $items
     * @return list<array<string, mixed>>
     */
    public static function toArray(array $items): array
    {
        return array_map(fn (Arrayable $item) => $item->toArray(), array_values($items));
    }
}
