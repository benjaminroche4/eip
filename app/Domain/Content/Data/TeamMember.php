<?php

namespace App\Domain\Content\Data;

use App\Domain\Content\Support\ArrayShape;
use Illuminate\Contracts\Support\Arrayable;

/** One person of the « Notre équipe » grid (`team.members` in lang/{locale}/ui.php, portrait in public/images/team). */
final readonly class TeamMember implements Arrayable
{
    /** @param list<string> $flags ISO country codes rendered as flags (FR, GB…) */
    public function __construct(
        public string $name,
        public string $role,
        public string $languages,
        public array $flags,
        public string $photo,
    ) {}

    /** @param array<string, mixed> $data */
    public static function fromArray(array $data): self
    {
        ArrayShape::validate(self::class, $data, ['name' => 'string', 'role' => 'string', 'languages' => 'string', 'flags' => 'array', 'photo' => 'string']);

        return new self(name: $data['name'], role: $data['role'], languages: $data['languages'], flags: array_values($data['flags']), photo: $data['photo']);
    }

    /** @return array{name: string, role: string, languages: string, flags: list<string>, photo: string} */
    public function toArray(): array
    {
        return ['name' => $this->name, 'role' => $this->role, 'languages' => $this->languages, 'flags' => $this->flags, 'photo' => $this->photo];
    }
}
