<?php

namespace App\Domain\Legal\Data;

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Carbon;

/** A legal page (privacy / legal / terms) resolved from lang/{locale}/legal.php. */
final readonly class LegalPage implements Arrayable
{
    public const KEYS = ['privacy', 'legal', 'terms'];

    /** @param list<array{heading: string, body: string}> $sections */
    public function __construct(
        public string $key,
        public string $title,
        public string $description,
        public string $updated,
        public array $sections,
    ) {}

    public static function fromKey(string $key, ?Carbon $updatedAt = null): self
    {
        abort_unless(in_array($key, self::KEYS, true), 404);

        $date = ($updatedAt ?? Carbon::create(2026, 8, 1))->translatedFormat('j F Y');

        return new self(
            key: $key,
            title: __("legal.$key.title"),
            description: __("legal.$key.description"),
            updated: __("legal.$key.updated", ['date' => $date]),
            sections: __("legal.$key.sections"),
        );
    }

    public function toArray(): array
    {
        return ['key' => $this->key, 'title' => $this->title, 'description' => $this->description, 'updated' => $this->updated, 'sections' => $this->sections];
    }
}
