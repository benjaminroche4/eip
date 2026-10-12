<?php

namespace Tests\Feature;

use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** « Acheter » page: hero with the agency's key figures and an optional presentation video, the content blocks, the home testimonials (2026-09-22) and the FAQ teaser. */
class BuyTest extends TestCase
{
    public function test_buy_page_serves_the_hero_with_the_key_figures(): void
    {
        config(['seo.reviews.rating' => 4.9, 'seo.reviews.count' => 150]);
        $this->get('/acheter-immobilier-paris')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->component('buy')
                ->where('translations.buy.headline', 'Acheter le bien qui vous correspond à Paris')
                ->where('translations.pages.buy.intro', fn (string $intro) => str_contains($intro, 'Paris') && ! str_contains($intro, 'Estate in Paris'))
                ->where('translations.buy.why_intro', fn (string $intro) => str_contains($intro, 'Paris') && ! str_contains($intro, 'Estate in Paris'))
                ->where('translations.buy.why_title', 'Pourquoi acheter à nos côtés ?')
                ->where('translations.buy.why_international_title', "Achat depuis l'étranger")
                ->has('stats', 4)
                ->where('stats.1.value', '300+')
                ->where('video', null)
                ->has('faq.items', 5) // questions 7-11 of « buying » (the home shows 1-6)
                ->where('faq.slug', 'acheter-un-bien')
                ->where('faq.items.0.slug', 'un-acquereur-etranger-peut-il-obtenir-un-pret-en-france') // offset 6 (2026-10-12)
                ->where('faq.items.0.question', 'Un acquéreur étranger peut-il obtenir un prêt en France ?')
                ->has('strategies', 3)
                ->where('strategies.2.title', 'Nous négocions et restons à vos côtés')
                ->has('districts', 4)
                ->has('testimonials', 20)
                ->where('testimonials.0.photo', '/images/testimonials/client-1.webp')
                ->where('districts.0.area', 'Saint-Germain-des-Prés')
                ->where('translations.buy.districts.intro', fn (string $intro) => str_contains($intro, 'Paris') && ! str_contains($intro, 'Estate in Paris'))
                ->where('translations.buy.strategies.intro', fn (string $intro) => str_contains($intro, 'Paris') && ! str_contains($intro, 'Estate in Paris'))
                ->where('translations.buy.record.title', 'Ce qui nous distingue')
                ->has('facts', 4) // rating tile present: seo.reviews set above
                ->where('facts.0.value', '4,9/5')
                ->where('facts.0.text', 'Sur 150 avis clients publiés.')
                ->where('facts.1.value', '30 min') // the contact callback promise, never « garantie » (2026-10-12)
                ->where('translations.buy.record.intro', fn (string $intro) => str_contains($intro, 'Paris') && ! str_contains($intro, 'Estate in Paris')));

        $this->withLocale('en')->get('/en/buy-property-paris')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->component('buy')->where('translations.buy.headline', 'Buy the property that suits you in Paris'));

        foreach ([1, 2, 3] as $i) {
            $this->assertFileExists(public_path("images/buy/process-$i-1600.webp"));
            $this->assertFileExists(public_path("images/buy/process-$i-800.webp"));
        }
        foreach ([1, 2, 3, 4] as $i) {
            $this->assertFileExists(public_path("images/buy/district-$i-1600.webp"));
            $this->assertFileExists(public_path("images/buy/district-$i-800.webp"));
        }
    }

    public function test_buy_hero_clip_files_are_present_and_light(): void
    {
        foreach (['hero-1280.webm', 'hero-1280.mp4', 'hero-720.webm', 'hero-720.mp4'] as $file) {
            $path = public_path("videos/buy/$file");
            $this->assertFileExists($path);
            $this->assertLessThan(3 * 1024 * 1024, filesize($path), "$file must stay under 3 MB (hero background, performance)");
        }
        $this->assertFileExists(public_path('images/buy/hero-poster-1280.webp'));
    }

    public function test_buy_page_exposes_the_configured_video_id(): void
    {
        config(['seo.videos.buy' => 'dQw4w9WgXcQ']);

        $this->get('/acheter-immobilier-paris')
            ->assertInertia(fn (Assert $p) => $p->component('buy')->where('video', 'dQw4w9WgXcQ'));
    }
}
