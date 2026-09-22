<?php

namespace App\Domain\Content\Data;

use App\Domain\Content\Support\ArrayShape;
use Illuminate\Contracts\Support\Arrayable;

/** An investment strategy of the Buy page (`buy.strategies.items`). */
final readonly class Strategy implements Arrayable
{
    public function __construct(
        public string $title,
        public string $text,
    ) {}

    /** @param array<string, mixed> $data */
    public static function fromArray(array $data): self
    {
        ArrayShape::validate(self::class, $data, ['title' => 'string', 'text' => 'string']);

        return new self(title: $data['title'], text: $data['text']);
    }

    public function toArray(): array
    {
        return ['title' => $this->title, 'text' => $this->text];
    }
}
