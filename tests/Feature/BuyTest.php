<?php

namespace Tests\Feature;

use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** « Acheter » page: hero with the agency's key figures and an optional presentation video. */
class BuyTest extends TestCase
{
    public function test_buy_page_serves_the_hero_with_the_key_figures(): void
    {
        $this->get('/acheter-immobilier-paris')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->component('buy')
                ->where('translations.buy.headline', 'Bâtissez un patrimoine durable à Paris')
                ->where('translations.pages.buy.intro', fn (string $intro) => str_contains($intro, 'Estate in Paris') && str_contains($intro, 'Paris'))
                ->where('translations.buy.why_intro', fn (string $intro) => str_contains($intro, 'Estate in Paris') && str_contains($intro, 'Paris'))
                ->where('translations.buy.why_title', 'Pourquoi acheter avec Estate in Paris ?')
                ->where('translations.buy.why_international_title', 'Acheteurs internationaux')
                ->has('stats', 4)
                ->where('stats.1.value', '25+')
                ->where('video', null)
                ->has('faq.items', 6)
                ->where('faq.slug', 'acheter-un-bien')
                ->where('faq.items.0.slug', 'un-etranger-peut-il-acheter-un-bien-immobilier-a-paris')
                ->where('faq.items.0.question', 'Un étranger peut-il acheter un bien immobilier à Paris ?')
                ->has('strategies', 3)
                ->where('strategies.2.title', 'Opportunités hors marché')
                ->has('districts', 4)
                ->where('districts.0.area', 'Saint-Germain-des-Prés')
                ->where('translations.buy.districts.intro', fn (string $intro) => str_contains($intro, 'Estate in Paris') && str_contains($intro, 'Paris'))
                ->where('translations.buy.strategies.intro', fn (string $intro) => str_contains($intro, 'Estate in Paris') && str_contains($intro, 'Paris'))
                ->where('translations.buy.record.title', 'La confiance des propriétaires et acquéreurs à Paris')
                ->where('translations.buy.record.intro', fn (string $intro) => str_contains($intro, 'Estate in Paris') && str_contains($intro, 'Paris')));

        $this->withLocale('en')->get('/en/buy-property-paris')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->component('buy')->where('translations.buy.headline', 'Build lasting wealth in Paris'));

        $this->assertFileExists(public_path('images/home/hero-2000.jpg')); // the home hero photo, for now
        foreach ([1, 2, 3] as $i) {
            $this->assertFileExists(public_path("images/buy/strategies-$i-1600.jpg"));
            $this->assertFileExists(public_path("images/buy/strategies-$i-800.jpg"));
        }
        foreach ([1, 2, 3, 4] as $i) {
            $this->assertFileExists(public_path("images/buy/district-$i-1600.jpg"));
            $this->assertFileExists(public_path("images/buy/district-$i-800.jpg"));
        }
    }

    public function test_buy_page_exposes_the_configured_video_id(): void
    {
        config(['seo.videos.buy' => 'dQw4w9WgXcQ']);

        $this->get('/acheter-immobilier-paris')
            ->assertInertia(fn (Assert $p) => $p->component('buy')->where('video', 'dQw4w9WgXcQ'));
    }
}
