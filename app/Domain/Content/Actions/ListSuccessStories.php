<?php

namespace App\Domain\Content\Actions;

use App\Domain\Content\Data\SuccessStory;

/** The success stories of the home, from `stories.items` in lang/{locale}/ui.php. */
final class ListSuccessStories
{
    /** @return list<SuccessStory> */
    public function __invoke(?string $locale = null): array
    {
        return array_map(SuccessStory::fromArray(...), array_values(__('ui.stories.items', [], $locale)));
    }
}
