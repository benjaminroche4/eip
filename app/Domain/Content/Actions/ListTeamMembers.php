<?php

namespace App\Domain\Content\Actions;

use App\Domain\Content\Data\TeamMember;

/** The team of the About page, from `team.members` in lang/{locale}/ui.php. */
final class ListTeamMembers
{
    /** @return list<TeamMember> */
    public function __invoke(?string $locale = null): array
    {
        return array_map(TeamMember::fromArray(...), array_values(__('ui.team.members', [], $locale)));
    }
}
