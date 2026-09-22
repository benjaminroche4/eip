<?php

namespace App\Domain\Content\Data;

use App\Domain\Content\Support\ArrayShape;
use Illuminate\Contracts\Support\Arrayable;

/** A prime district card of the Buy page (`buy.districts.items`): arrondissement, neighbourhood, average price, tags. */
final readonly class District implements Arrayable
{
    /** @param list<string> $tags */
    public function __construct(
        public string $name,
        public string $area,
        public string $text,
        public string $price,
        public array $tags,
        public string $photoAlt,
    ) {}

    /** @param array<string, mixed> $data */
    public static function fromArray(array $data): self
    {
        ArrayShape::validate(self::class, $data, ['name' => 'string', 'area' => 'string', 'text' => 'string', 'price' => 'string', 'tags' => 'array', 'photo_alt' => 'string']);

        return new self(name: $data['name'], area: $data['area'], text: $data['text'], price: $data['price'], tags: array_values($data['tags']), photoAlt: $data['photo_alt']);
    }

    public function toArray(): array
    {
        return ['name' => $this->name, 'area' => $this->area, 'text' => $this->text, 'price' => $this->price, 'tags' => $this->tags, 'photo_alt' => $this->photoAlt];
    }
}
