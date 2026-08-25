<?php

namespace Tests\Unit\Blog;

use App\Domain\Blog\Support\SeoText;
use Tests\TestCase;

class SeoTextTest extends TestCase
{
    public function test_title_stays_within_60_characters_with_the_site_suffix(): void
    {
        $suffix = config('seo.title_separator').config('seo.site_name');
        $title = SeoText::title('Que faire à Paris quand il pleut : le guide local pour tous les jours');

        $this->assertLessThanOrEqual(60, mb_strlen($title.$suffix));
        $this->assertStringEndsWith('…', $title);
        $this->assertSame('Court', SeoText::title('Court'));
    }

    public function test_description_cuts_on_a_word_boundary_at_160(): void
    {
        $description = SeoText::description(str_repeat('mot ', 60));

        $this->assertLessThanOrEqual(160, mb_strlen($description));
        $this->assertStringEndsWith('mot…', $description);
    }
}
