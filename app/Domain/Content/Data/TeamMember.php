<?php

namespace App\Domain\Content\Data;

use App\Domain\Content\Support\ArrayShape;
use Illuminate\Contracts\Support\Arrayable;

/** An advisor of the About page (`team.members`): name, unified role, favourite district (replaces the languages, user decision 2026-10-11), portrait. */
final readonly class TeamMember implements Arrayable
{
    public function __construct(
        public string $name,
        public string $role,
        public string $area,
        public string $photo,
    ) {}

    /** @param array<string, mixed> $data */
    public static function fromArray(array $data): self
    {
        ArrayShape::validate(self::class, $data, ['name' => 'string', 'role' => 'string', 'area' => 'string', 'photo' => 'string']);

        return new self(name: $data['name'], role: $data['role'], area: $data['area'], photo: $data['photo']);
    }

    /** @return array{name: string, role: string, area: string, photo: string} */
    public function toArray(): array
    {
        return ['name' => $this->name, 'role' => $this->role, 'area' => $this->area, 'photo' => $this->photo];
    }
}
