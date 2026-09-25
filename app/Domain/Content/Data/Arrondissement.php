<?php

namespace App\Domain\Content\Data;

use App\Domain\Content\Support\ArrayShape;
use Illuminate\Contracts\Support\Arrayable;
use InvalidArgumentException;

/**
 * One of the 20 arrondissements of the Districts page (`districts.items`): the map's facts (name, districts, buyer
 * profile, price, asset, three strengths, audience, housing) and the detailed profile added on 2026-09-25 (summary,
 * metro / RER lines, railway stations, sights, food, green spaces, schools and universities).
 */
final readonly class Arrondissement implements Arrayable
{
    /**
     * @param  list<string>  $positives
     * @param  list<string>  $metro
     * @param  list<string>  $rer
     * @param  list<string>  $stations
     * @param  list<string>  $attractions
     * @param  list<string>  $dining
     * @param  list<string>  $parks
     * @param  list<string>  $education
     */
    public function __construct(
        public int $n,
        public string $name,
        public string $areas,
        public string $profile,
        public string $price,
        public string $extra,
        public array $positives,
        public string $audience,
        public string $housing,
        public string $summary,
        public array $metro,
        public array $rer,
        public array $stations,
        public array $attractions,
        public array $dining,
        public array $parks,
        public array $education,
    ) {}

    private const LISTS = ['positives', 'metro', 'rer', 'stations', 'attractions', 'dining', 'parks', 'education'];

    private const TEXTS = ['name', 'areas', 'profile', 'price', 'extra', 'audience', 'housing', 'summary'];

    /** @param array<string, mixed> $data */
    public static function fromArray(array $data): self
    {
        if (! array_key_exists('n', $data)) {
            throw new InvalidArgumentException(sprintf('%s from ui.php is missing the key(s) "n" (got: %s).', self::class, $data === [] ? 'nothing' : implode(', ', array_keys($data))));
        }
        if (! is_int($data['n'])) {
            throw new InvalidArgumentException(sprintf('%s from ui.php: "n" must be an int, %s given.', self::class, get_debug_type($data['n'])));
        }
        ArrayShape::validate(self::class, $data, [...array_fill_keys(self::TEXTS, 'string'), ...array_fill_keys(self::LISTS, 'array')]);
        $lists = array_map(fn (string $key) => array_values($data[$key]), array_combine(self::LISTS, self::LISTS));

        return new self(
            n: $data['n'],
            name: $data['name'],
            areas: $data['areas'],
            profile: $data['profile'],
            price: $data['price'],
            extra: $data['extra'],
            positives: $lists['positives'],
            audience: $data['audience'],
            housing: $data['housing'],
            summary: $data['summary'],
            metro: $lists['metro'],
            rer: $lists['rer'],
            stations: $lists['stations'],
            attractions: $lists['attractions'],
            dining: $lists['dining'],
            parks: $lists['parks'],
            education: $lists['education'],
        );
    }

    public function toArray(): array
    {
        return [
            'n' => $this->n,
            'name' => $this->name,
            'areas' => $this->areas,
            'profile' => $this->profile,
            'price' => $this->price,
            'extra' => $this->extra,
            'positives' => $this->positives,
            'audience' => $this->audience,
            'housing' => $this->housing,
            'summary' => $this->summary,
            'metro' => $this->metro,
            'rer' => $this->rer,
            'stations' => $this->stations,
            'attractions' => $this->attractions,
            'dining' => $this->dining,
            'parks' => $this->parks,
            'education' => $this->education,
        ];
    }
}
