<?php

namespace Tests\Feature;

use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** « Vendre »: intro + wide photo + photo mosaic (2026-09-22). */
class SellTest extends TestCase
{
    public function test_sell_page_serves_the_intro_and_the_photo_section(): void
    {
        $this->get('/vendre-immobilier-paris')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->component('sell')
                ->where('translations.pages.sell.intro', fn (string $intro) => str_contains($intro, 'Estate in Paris') && str_contains($intro, 'Paris'))
                ->where('translations.sell.photo_alt', fn (string $alt) => str_contains($alt, 'Estate in Paris'))
                ->has('gallery', 4)
                ->where('gallery.0', fn (string $alt) => str_contains($alt, 'Paris')));

        $this->withLocale('en')->get('/en/sell-property-paris')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->component('sell')
                ->where('translations.sell.photo_alt', fn (string $alt) => str_contains($alt, 'Estate in Paris')));

        foreach ([800, 1600] as $w) {
            $this->assertFileExists(public_path("images/sell/photo-$w.jpg"));
            foreach ([1, 2, 3, 4] as $i) {
                $this->assertFileExists(public_path("images/sell/gallery-$i-$w.jpg"));
            }
        }
    }
}
