<?php

namespace Tests\Unit\Domain\Properties;

use App\Domain\Properties\Support\DistrictSlug;
use PHPUnit\Framework\TestCase;

/** The clean district URLs (`/nos-biens/paris-6e` ↔ `/en/properties/paris-6th`, 2026-09-28). */
class DistrictSlugTest extends TestCase
{
    public function test_slugs_carry_the_language_ordinal_and_parse_back_to_the_arrondissement(): void
    {
        $this->assertSame('paris-1er', DistrictSlug::make(1, 'fr'));
        $this->assertSame('paris-6e', DistrictSlug::make(6, 'fr'));
        $this->assertSame('paris-1st', DistrictSlug::make(1, 'en'));
        $this->assertSame('paris-2nd', DistrictSlug::make(2, 'en'));
        $this->assertSame('paris-3rd', DistrictSlug::make(3, 'en'));
        $this->assertSame('paris-11th', DistrictSlug::make(11, 'en'));
        $this->assertSame('paris-13th', DistrictSlug::make(13, 'en'));
        $this->assertSame('paris-20th', DistrictSlug::make(20, 'en'));

        foreach (['paris-1er' => 1, 'paris-6e' => 6, 'paris-6th' => 6, 'paris-20th' => 20, 'paris-2nd' => 2] as $slug => $n) {
            $this->assertSame($n, DistrictSlug::parse($slug), $slug);
        }
        foreach (['paris-0e', 'paris-21e', 'paris-6', 'lyon-6e', 'paris-6e-'] as $bad) {
            $this->assertNull(DistrictSlug::parse($bad), $bad);
        }
    }

    public function test_route_pattern_matches_every_slug_of_both_languages_and_nothing_else(): void
    {
        foreach (range(1, 20) as $n) {
            foreach (['fr', 'en'] as $locale) {
                $this->assertMatchesRegularExpression('/^'.DistrictSlug::PATTERN.'$/', DistrictSlug::make($n, $locale));
            }
        }
        foreach (['paris-21e', 'paris-6', 'paris-06e', 'nos-biens'] as $bad) {
            $this->assertDoesNotMatchRegularExpression('/^'.DistrictSlug::PATTERN.'$/', $bad, $bad);
        }
    }
}
