<?php

namespace Tests\Feature;

use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** « Les arrondissements de Paris »: interactive map + table of the 20 arrondissements (2026-09-22). */
class DistrictsPageTest extends TestCase
{
    public function test_districts_page_serves_the_twenty_arrondissements_in_both_languages(): void
    {
        $this->get('/arrondissements-paris')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->component('districts')
                ->has('items', 20)
                ->where('translations.districts.hero_cta', 'Parler à un conseiller')
                ->where('items.0.n', 1)
                ->where('items.5.name', 'Paris 6e')
                ->where('items.5.price', '14 500') // same rounded figure as the Buy districts
                ->where('items.5.profile', 'Prestige')
                ->where('items.18.price', '8 600')
                ->has('items.5.positives', 3)
                ->where('items.5.audience', fn (string $a) => str_contains($a, 'prestige'))
                ->where('translations.pages.districts.intro', fn (string $intro) => str_contains($intro, 'Estate in Paris') && str_contains($intro, 'Paris'))
                ->where('translations.districts.source', fn (string $s) => str_contains($s, 'Notaires du Grand Paris')));

        $this->withLocale('en')->get('/en/paris-districts')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->component('districts')->has('items', 20)->where('items.5.name', 'Paris 6th')->where('items.5.price', '14,500'));

        $this->withLocale('en')->get('/en/arrondissements-paris')->assertNotFound();
    }

    public function test_every_arrondissement_has_the_same_figures_in_both_languages(): void
    {
        $fr = __('ui.districts.items', [], 'fr');
        $en = __('ui.districts.items', [], 'en');
        $this->assertCount(20, $fr);
        $this->assertCount(20, $en);
        foreach ($fr as $i => $item) {
            $this->assertSame($item['n'], $en[$i]['n']);
            $this->assertSame(str_replace(' ', '', $item['price']), str_replace(',', '', $en[$i]['price']), "price of arrondissement {$item['n']} differs between FR and EN");
            $this->assertCount(3, $item['positives']);
            $this->assertCount(3, $en[$i]['positives']);
            foreach (['name', 'areas', 'profile', 'price', 'extra', 'audience', 'housing'] as $key) {
                $this->assertNotSame('', $item[$key]);
                $this->assertNotSame('', $en[$i][$key]);
            }
        }
    }
}
