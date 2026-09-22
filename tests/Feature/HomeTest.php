<?php

namespace Tests\Feature;

use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** Home page: full-bleed hero (Figma 712-26754) with the answer-first sentence, in both languages. */
class HomeTest extends TestCase
{
    public function test_home_shares_its_headline_and_intro_in_both_languages(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->component('home')
                ->where('translations.home.hero_title_1', "L'agence de l'exceptionnel")
                ->where('translations.home.hero_text', fn (string $text) => str_contains($text, 'Estate in Paris') && str_contains($text, 'off-market'))
                ->where('figure', '500+')
                ->where('translations.home.trust_text', fn (string $text) => str_contains($text, 'Estate in Paris') && str_contains($text, 'Paris'))
                ->has('testimonials', 10)
                ->has('stories', 2)
                ->where('stories.0.place', 'Paris 16e')
                ->where('testimonials.0.name', 'Sophie M.')
                ->where('testimonials.0.photo', '/images/testimonials/client-1.jpg'));

        foreach (['client-1', 'client-2', 'client-3'] as $portrait) {
            $this->assertFileExists(public_path("images/testimonials/$portrait.jpg"));
        }

        $this->withLocale('en')->get('/en')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->component('home')->where('translations.home.hero_title_2', 'Exceptional in Paris.')->where('testimonials.1.context', 'Sold a penthouse in Paris 16'));
    }
}
