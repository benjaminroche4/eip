<?php

namespace App\Domain\Content\Data;

use App\Domain\Content\Support\ArrayShape;
use Illuminate\Contracts\Support\Arrayable;

/** A key figure of the agency (`about.stats`, shared by the About manifesto and the Buy hero): real numbers only. */
final readonly class Stat implements Arrayable
{
    public function __construct(
        public string $value,
        public string $title,
        public string $text,
    ) {}

    /** @param array<string, mixed> $data */
    public static function fromArray(array $data): self
    {
        ArrayShape::validate(self::class, $data, ['value' => 'string', 'title' => 'string', 'text' => 'string']);

        return new self(value: $data['value'], title: $data['title'], text: $data['text']);
    }

    public function toArray(): array
    {
        return ['value' => $this->value, 'title' => $this->title, 'text' => $this->text];
    }
}
