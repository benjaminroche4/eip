<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * Guards the SEO title / description length conventions (see CLAUDE.md « Meta title & description »).
 * Title: 30–60 characters including the " · Site" suffix when applied. Description: 120–160 characters.
 */
class SeoMetaLengthTest extends TestCase
{
    /** @return array<string, array{0: string, 1: string, 2: bool}> page → [title key, description key, suffixed] */
    private function pages(): array
    {
        return [
            'home' => ['ui.home.seo_title', 'ui.home.seo_description', false],
            'search' => ['ui.search.seo_title', 'ui.search.seo_description', true],
            'privacy' => ['legal.privacy.title', 'legal.privacy.description', true],
            'legal' => ['legal.legal.title', 'legal.legal.description', true],
            'terms' => ['legal.terms.title', 'legal.terms.description', true],
        ];
    }

    public function test_seo_titles_and_descriptions_respect_length_limits(): void
    {
        $suffix = config('seo.title_separator').config('seo.site_name');

        foreach (['fr', 'en'] as $locale) {
            app()->setLocale($locale);

            foreach ($this->pages() as $page => [$titleKey, $descriptionKey, $suffixed]) {
                $title = __($titleKey).($suffixed ? $suffix : '');
                $description = __($descriptionKey);

                $this->assertNotSame($titleKey, __($titleKey), "[$locale] $page: missing $titleKey");
                $this->assertNotSame($descriptionKey, $description, "[$locale] $page: missing $descriptionKey");

                $titleLength = mb_strlen($title);
                $descriptionLength = mb_strlen($description);

                $this->assertGreaterThanOrEqual(30, $titleLength, "[$locale] $page title too short ($titleLength): $title");
                $this->assertLessThanOrEqual(60, $titleLength, "[$locale] $page title too long ($titleLength): $title");
                $this->assertGreaterThanOrEqual(120, $descriptionLength, "[$locale] $page description too short ($descriptionLength)");
                $this->assertLessThanOrEqual(160, $descriptionLength, "[$locale] $page description too long ($descriptionLength)");
            }
        }
    }

    public function test_home_exposes_seo_keys_to_the_front(): void
    {
        $this->withLocale('fr');

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('home')
                ->where('translations.home.seo_title', __('ui.home.seo_title'))
                ->where('translations.home.seo_description', __('ui.home.seo_description')));
    }
}
