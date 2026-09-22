<?php

namespace App\Domain\Content\Data;

use App\Domain\Content\Support\ArrayShape;
use Illuminate\Contracts\Support\Arrayable;

/** A success story card of the home (`stories.items`); `photo` holds a `{w}` placeholder for the srcset widths. */
final readonly class SuccessStory implements Arrayable
{
    public function __construct(
        public string $title,
        public string $place,
        public string $duration,
        public string $result,
        public string $photo,
        public string $alt,
    ) {}

    /** @param array<string, mixed> $data */
    public static function fromArray(array $data): self
    {
        ArrayShape::validate(self::class, $data, ['title' => 'string', 'place' => 'string', 'duration' => 'string', 'result' => 'string', 'photo' => 'string', 'alt' => 'string']);

        return new self(title: $data['title'], place: $data['place'], duration: $data['duration'], result: $data['result'], photo: $data['photo'], alt: $data['alt']);
    }

    public function toArray(): array
    {
        return ['title' => $this->title, 'place' => $this->place, 'duration' => $this->duration, 'result' => $this->result, 'photo' => $this->photo, 'alt' => $this->alt];
    }
}
