<?php

namespace Tests\Unit\Blog;

use App\Domain\Blog\Support\SeoText;
use Tests\TestCase;

class SeoTextTest extends TestCase
{
    public function test_long_titles_are_cut_at_their_last_natural_break_keeping_the_keyword_head(): void
    {
        $suffix = config('seo.title_separator').config('seo.site_name');

        $title = SeoText::title('Que faire à Paris quand il pleut : le guide local pour tous les jours');
        $this->assertSame('Que faire à Paris quand il pleut', $title);
        $this->assertLessThanOrEqual(60, mb_strlen($title.$suffix));
        $this->assertTrue(SeoText::fitsSuffix($title));

        $this->assertSame('Vendre un appartement à Paris', SeoText::title('Vendre un appartement à Paris : étapes, coûts et fiscalité en 2026'));
        $this->assertSame('Court', SeoText::title('Court'));
    }

    public function test_without_a_usable_break_the_whole_title_is_kept_and_the_suffix_dropped(): void
    {
        // 60 characters, no break: kept whole, the brand suffix is dropped rather than the keywords.
        $title = SeoText::title('Comment estimer la valeur de son appartement à Paris en 2026');
        $this->assertSame('Comment estimer la valeur de son appartement à Paris en 2026', $title);
        $this->assertFalse(SeoText::fitsSuffix($title));

        // Longer still: word-boundary cut at 60 with an ellipsis.
        $long = SeoText::title('Comment choisir son agence immobilière à Paris quand on habite à Londres ou New York');
        $this->assertLessThanOrEqual(60, mb_strlen($long));
        $this->assertStringEndsWith('…', $long);
    }

    public function test_description_cuts_on_a_word_boundary_at_160(): void
    {
        $description = SeoText::description(str_repeat('mot ', 60));

        $this->assertLessThanOrEqual(160, mb_strlen($description));
        $this->assertStringEndsWith('mot…', $description);
    }
}
