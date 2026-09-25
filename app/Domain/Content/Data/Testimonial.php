<?php

namespace App\Domain\Content\Data;

use App\Domain\Content\Support\ArrayShape;
use Illuminate\Contracts\Support\Arrayable;

/** A client review of the testimonials row (`testimonials.items`); the portrait is optional (initials as fallback), the source is `google` (default) or `trustpilot` (logo top right of the card, 2026-09-23). */
final readonly class Testimonial implements Arrayable
{
    public function __construct(
        public string $name,
        public string $context,
        public string $quote,
        public ?string $photo = null,
        public string $source = 'google',
    ) {}

    public const SOURCES = ['google', 'trustpilot'];

    /** @param array<string, mixed> $data */
    public static function fromArray(array $data): self
    {
        ArrayShape::validate(self::class, $data, ['name' => 'string', 'context' => 'string', 'quote' => 'string'], ['photo' => 'string', 'source' => 'string']);
        $source = $data['source'] ?? 'google';
        if (! in_array($source, self::SOURCES, true)) {
            throw new \InvalidArgumentException(sprintf('%s: unknown review source "%s" (expected %s)', self::class, $source, implode(' or ', self::SOURCES)));
        }

        return new self(name: $data['name'], context: $data['context'], quote: $data['quote'], photo: $data['photo'] ?? null, source: $source);
    }

    /** The `photo` key is only present when there is one (the front reads `photo?: string | null`). */
    public function toArray(): array
    {
        $item = ['name' => $this->name, 'context' => $this->context, 'quote' => $this->quote, 'source' => $this->source];
        // `source` before `photo`: the round-trip test compares with the ui.php item key by key

        return $this->photo === null ? $item : [...$item, 'photo' => $this->photo];
    }
}
