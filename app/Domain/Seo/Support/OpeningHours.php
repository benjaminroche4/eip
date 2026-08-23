<?php

namespace App\Domain\Seo\Support;

use Carbon\CarbonImmutable;

/**
 * Parses a schema.org openingHours spec ("Mo-Fr 08:00-20:00, Sa 08:00-12:00")
 * and tells whether the business is open at a given instant (Europe/Paris).
 */
final class OpeningHours
{
    private const DAYS = ['Mo' => 1, 'Tu' => 2, 'We' => 3, 'Th' => 4, 'Fr' => 5, 'Sa' => 6, 'Su' => 7];

    public function __construct(private readonly string $spec, private readonly string $timezone = 'Europe/Paris') {}

    public function isOpen(?CarbonImmutable $at = null): bool
    {
        $now = ($at ?? CarbonImmutable::now())->setTimezone($this->timezone);
        $day = $now->isoWeekday();
        $minutes = $now->hour * 60 + $now->minute;

        foreach ($this->rules() as [$from, $to, $open, $close]) {
            if ($day >= $from && $day <= $to && $minutes >= $open && $minutes < $close) {
                return true;
            }
        }

        return false;
    }

    /** @return list<array{0:int,1:int,2:int,3:int}> [firstDay, lastDay, openMinutes, closeMinutes] */
    private function rules(): array
    {
        $rules = [];

        foreach (preg_split('/\s*,\s*/', trim($this->spec)) ?: [] as $part) {
            if (! preg_match('/^(Mo|Tu|We|Th|Fr|Sa|Su)(?:-(Mo|Tu|We|Th|Fr|Sa|Su))?\s+(\d{2}):(\d{2})-(\d{2}):(\d{2})$/', $part, $m)) {
                continue;
            }
            $rules[] = [
                self::DAYS[$m[1]],
                self::DAYS[$m[2] ?: $m[1]],
                (int) $m[3] * 60 + (int) $m[4],
                (int) $m[5] * 60 + (int) $m[6],
            ];
        }

        return $rules;
    }
}
