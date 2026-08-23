<?php

namespace Tests\Unit;

use App\Domain\Seo\Support\OpeningHours;
use Carbon\CarbonImmutable;
use PHPUnit\Framework\TestCase;

class OpeningHoursTest extends TestCase
{
    private OpeningHours $hours;

    protected function setUp(): void
    {
        $this->hours = new OpeningHours('Mo-Fr 08:00-20:00, Sa 08:00-12:00');
    }

    private function at(string $datetime): CarbonImmutable
    {
        return CarbonImmutable::parse($datetime, 'Europe/Paris');
    }

    public function test_open_during_weekday_hours(): void
    {
        $this->assertTrue($this->hours->isOpen($this->at('2026-08-24 08:00'))); // Monday, opening minute
        $this->assertTrue($this->hours->isOpen($this->at('2026-08-28 19:59'))); // Friday, last minute
    }

    public function test_closed_outside_weekday_hours(): void
    {
        $this->assertFalse($this->hours->isOpen($this->at('2026-08-24 07:59')));
        $this->assertFalse($this->hours->isOpen($this->at('2026-08-24 20:00'))); // closing minute is closed
    }

    public function test_saturday_morning_only(): void
    {
        $this->assertTrue($this->hours->isOpen($this->at('2026-08-29 11:30')));
        $this->assertFalse($this->hours->isOpen($this->at('2026-08-29 12:00')));
    }

    public function test_closed_on_sunday(): void
    {
        $this->assertFalse($this->hours->isOpen($this->at('2026-08-30 10:00')));
    }

    public function test_uses_paris_time_whatever_the_input_timezone(): void
    {
        // 06:30 UTC in summer = 08:30 Paris → open
        $this->assertTrue($this->hours->isOpen(CarbonImmutable::parse('2026-08-24 06:30', 'UTC')));
    }

    public function test_malformed_spec_never_opens(): void
    {
        $this->assertFalse((new OpeningHours('whenever'))->isOpen($this->at('2026-08-24 10:00')));
    }
}
