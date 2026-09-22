<?php

namespace App\Domain\Content\Data;

use App\Domain\Content\Support\ArrayShape;
use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Str;

/** A question of the FAQ (`faq.categories.*.items`); the slug (from the question) is its URL anchor on the FAQ page. */
final readonly class FaqItem implements Arrayable
{
    public function __construct(
        public string $question,
        public string $answer,
        public string $slug,
    ) {}

    /** @param array<string, mixed> $data */
    public static function fromArray(array $data): self
    {
        ArrayShape::validate(self::class, $data, ['question' => 'string', 'answer' => 'string']);

        return new self(question: $data['question'], answer: $data['answer'], slug: Str::slug($data['question']));
    }

    public function toArray(): array
    {
        return ['question' => $this->question, 'answer' => $this->answer, 'slug' => $this->slug];
    }
}
