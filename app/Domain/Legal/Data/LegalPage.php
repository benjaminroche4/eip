<?php

namespace App\Domain\Legal\Data;

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Carbon;

/** A legal page (privacy / legal) resolved from lang/{locale}/legal.php — the terms page was dropped on 2026-09-22 (replaced by the HTML sitemap). */
final readonly class LegalPage implements Arrayable
{
    public const KEYS = ['privacy', 'legal'];

    /** Last revision of each page's text (both written on 2026-09-22). */
    public const UPDATED_AT = ['privacy' => '2026-09-22', 'legal' => '2026-09-22'];

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

        $date = ($updatedAt ?? Carbon::parse(self::UPDATED_AT[$key]))->translatedFormat('j F Y');

        // Entity tokens (:phone / :email / :address) come from config/seo.php so the notice never drifts from the footer and the JSON-LD.
        $org = config('seo.organization');
        $address = implode(', ', array_filter([$org['address']['street'] ?? null, trim(($org['address']['postal_code'] ?? '').' '.($org['address']['city'] ?? ''))]));
        $tokens = [':phone' => (string) ($org['phone'] ?? ''), ':email' => (string) ($org['email'] ?? ''), ':address' => $address];

        return new self(
            key: $key,
            title: __("legal.$key.title"),
            description: __("legal.$key.description"),
            updated: __("legal.$key.updated", ['date' => $date]),
            sections: array_map(fn (array $section) => ['heading' => $section['heading'], 'body' => strtr($section['body'], $tokens)], __("legal.$key.sections")),
        );
    }

    public function toArray(): array
    {
        return ['key' => $this->key, 'title' => $this->title, 'description' => $this->description, 'updated' => $this->updated, 'sections' => $this->sections];
    }
}
