<?php

namespace Tests\Feature;

use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** « Vendre » (2026-09-22): hero (intro, valuation button, proof line, photo), the four reasons, the three steps, the mosaic, the testimonials, the FAQ « selling » teaser and the valuation CTA card. */
class SellTest extends TestCase
{
    public function test_sell_page_serves_the_hero_and_every_content_block(): void
    {
        $geo = fn (string $text) => str_contains($text, 'Estate in Paris') && str_contains($text, 'Paris');

        $this->get('/vendre-immobilier-paris')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->component('sell')
                ->where('translations.pages.sell.intro', $geo)
                ->where('translations.sell.photo_alt', fn (string $alt) => str_contains($alt, 'Estate in Paris'))
                ->where('translations.sell.hero_cta', 'Faire estimer mon bien')
                ->where('translations.sell.headline', 'Vendez votre bien de prestige à Paris au juste prix')
                ->has('stats', 4)
                ->where('video', null)
                // Reasons: h2 as a question, answer-first intro, four cards, outline valuation button
                ->where('translations.sell.why_title', 'Pourquoi vendre avec Estate in Paris ?')
                ->where('translations.sell.why_intro', $geo)
                ->where('translations.sell.why_valuation_title', 'Estimation fondée sur les ventes réelles')
                ->where('translations.sell.why_negotiation_title', "Négociation jusqu'à l'acte")
                ->where('translations.sell.why_cta', 'Faire estimer mon bien')
                // Process: three steps read by ListSellSteps
                ->where('translations.sell.process.title', 'Comment vendons-nous votre bien ?')
                ->where('translations.sell.process.intro', $geo)
                ->has('steps', 3)
                ->missing('districts')
                ->where('translations.sell.confidential.intro', fn (string $intro) => str_contains($intro, 'Estate in Paris') && str_contains($intro, 'Paris'))
                ->where('steps.0.title', 'Estimation')
                ->where('steps.2.title', 'Négociation et signature')
                ->has('stories', 6) // the home's photo row
                ->has('testimonials', 10)
                // FAQ: the first six questions of the « selling » topic
                ->where('translations.sell.faq.title', 'Vos questions avant de vendre à Paris')
                ->where('translations.sell.faq.intro', $geo)
                ->where('faq.slug', 'vendre-un-bien')
                ->has('faq.items', 6)
                ->where('faq.items.0.question', 'Combien de temps faut-il pour vendre un bien de prestige à Paris ?')
                // Closing card pointed at the valuation
                ->where('translations.sell.cta_title', 'Combien vaut votre bien à Paris ?')
                ->where('translations.sell.cta_button', 'Demander une estimation'));

        $this->withLocale('en')->get('/en/sell-property-paris')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->component('sell')
                ->where('translations.sell.photo_alt', fn (string $alt) => str_contains($alt, 'Estate in Paris'))
                ->where('translations.sell.why_title', 'Why sell with Estate in Paris?')
                ->where('steps.0.title', 'Valuation')
                ->where('faq.slug', 'selling-property')
                ->has('faq.items', 6));

        foreach ([800, 1600] as $w) {
            $this->assertFileExists(public_path("images/sell/photo-$w.jpg"));
        }
    }
}
