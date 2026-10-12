<?php

namespace App\Domain\Content\Data;

use App\Domain\Content\Support\ArrayShape;
use Illuminate\Contracts\Support\Arrayable;

/** A fact of « Notre bilan » on the Buy page (`buy.record.facts`): `key` picks the corner mark (rating = Google logo, languages = flags). */
final readonly class Fact implements Arrayable
{
    public function __construct(
        public string $key,
        public string $value,
        public string $title,
        public string $text,
    ) {}

    /** @param array<string, mixed> $data */
    public static function fromArray(array $data): self
    {
        ArrayShape::validate(self::class, $data, ['key' => 'string', 'value' => 'string', 'title' => 'string', 'text' => 'string']);

        return new self(key: $data['key'], value: $data['value'], title: $data['title'], text: $data['text']);
    }

    /** @return array{key: string, value: string, title: string, text: string} */
    public function toArray(): array
    {
        return ['key' => $this->key, 'value' => $this->value, 'title' => $this->title, 'text' => $this->text];
    }
}
