<?php

namespace App\Domain\Content\Data;

use App\Domain\Content\Support\ArrayShape;
use Illuminate\Contracts\Support\Arrayable;

/** A client review of the testimonials row (`testimonials.items`); the portrait is optional (initials as fallback). */
final readonly class Testimonial implements Arrayable
{
    public function __construct(
        public string $name,
        public string $context,
        public string $quote,
        public ?string $photo = null,
    ) {}

    /** @param array<string, mixed> $data */
    public static function fromArray(array $data): self
    {
        ArrayShape::validate(self::class, $data, ['name' => 'string', 'context' => 'string', 'quote' => 'string'], ['photo' => 'string']);

        return new self(name: $data['name'], context: $data['context'], quote: $data['quote'], photo: $data['photo'] ?? null);
    }

    /** The `photo` key is only present when there is one (the front reads `photo?: string | null`). */
    public function toArray(): array
    {
        $item = ['name' => $this->name, 'context' => $this->context, 'quote' => $this->quote];

        return $this->photo === null ? $item : [...$item, 'photo' => $this->photo];
    }
}
