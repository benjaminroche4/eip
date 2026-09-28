<?php

namespace Tests\Feature;

use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** « Biens off-market » (2026-09-28): the confidential selection, never indexed, to be gated by an access code. */
class OffMarketTest extends TestCase
{
    public function test_off_market_page_serves_the_selection_in_both_languages_and_is_never_indexed(): void
    {
        $this->get('/biens-off-market')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->component('off-market')
                ->has('properties', 1)
                ->where('properties.0.off_market', true)
                ->where('translations.off_market.price_on_request', 'Prix sur demande')
                ->where('translations.pages.off_market.intro', fn (string $intro) => str_contains($intro, 'Estate in Paris') && str_contains($intro, 'off-market')));

        $this->withLocale('en')->get('/en/off-market-properties')->assertOk()->assertInertia(fn (Assert $p) => $p->component('off-market')->has('properties', 1));
        $this->withLocale('en')->get('/en/biens-off-market')->assertNotFound();

        // Confidential: absent from the sitemap and llms.txt
        $this->artisan('sitemap:generate')->assertSuccessful();
        $this->assertStringNotContainsString('biens-off-market', file_get_contents(public_path('sitemap.pages.xml')));
        $this->assertStringNotContainsString(url('/biens-off-market'), $this->get('/llms.txt')->getContent());
    }
}
