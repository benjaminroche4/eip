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
                // Detailed profile (2026-09-25): summary, metro / RER lines, stations, sights, food, green spaces, schools
                ->where('items.5.summary', fn (string $s) => str_contains($s, 'Saint-Germain-des-Prés') && str_contains($s, 'Grégoire de Tours'))
                ->where('items.5.metro', ['4', '10', '12'])
                ->where('items.5.rer', ['B'])
                ->where('items.5.stations', [])
                ->where('items.9.stations', ['Gare du Nord', "Gare de l'Est"])
                ->where('items.5.attractions', fn ($a) => collect($a)->contains('Église Saint-Germain-des-Prés'))
                ->where('items.5.dining', fn ($a) => collect($a)->contains('Café de Flore'))
                ->where('items.5.parks', fn ($a) => collect($a)->contains('Jardin du Luxembourg'))
                ->where('items.5.education', fn ($a) => collect($a)->contains('Lycée Fénelon'))
                ->where('translations.pages.districts.intro', fn (string $intro) => str_contains($intro, 'Estate in Paris') && str_contains($intro, 'Paris'))
                ->where('translations.districts.source', fn (string $s) => str_contains($s, 'Notaires du Grand Paris')));

        $this->withLocale('en')->get('/en/paris-districts')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->component('districts')->has('items', 20)->where('items.5.name', 'Paris 6th')->where('items.5.price', '14,500'));

        $this->withLocale('en')->get('/en/arrondissements-paris')->assertNotFound();
    }

    public function test_the_query_string_preselects_an_arrondissement_in_either_language(): void
    {
        $this->get('/arrondissements-paris')->assertInertia(fn (Assert $p) => $p->where('selected', 6)); // the agency's arrondissement opens by default
        $this->get('/arrondissements-paris?arrondissement=14')->assertOk()->assertInertia(fn (Assert $p) => $p->where('selected', 14));
        $this->get('/arrondissements-paris?district=3')->assertInertia(fn (Assert $p) => $p->where('selected', 3)); // the EN parameter works on the FR page too
        foreach (['0', '21', 'abc', '6e', ''] as $bad) {
            $this->get("/arrondissements-paris?arrondissement=$bad")->assertOk()->assertInertia(fn (Assert $p) => $p->where('selected', 6)); // invalid → the default, never an error
        }
        $this->withLocale('en')->get('/en/paris-districts?district=7')->assertInertia(fn (Assert $p) => $p->where('selected', 7));
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
            foreach (['name', 'areas', 'profile', 'price', 'extra', 'audience', 'housing', 'summary'] as $key) {
                $this->assertNotSame('', $item[$key]);
                $this->assertNotSame('', $en[$i][$key]);
            }
            // Facts are language-independent: same lines and stations in FR and EN, every line known to the badges' palette
            foreach (['metro', 'rer', 'stations'] as $key) {
                $this->assertSame($item[$key], $en[$i][$key], "$key of arrondissement {$item['n']} differs between FR and EN");
            }
            $this->assertNotEmpty($item['metro']);
            foreach ($item['metro'] as $line) {
                $this->assertContains($line, ['1', '2', '3', '3bis', '4', '5', '6', '7', '7bis', '8', '9', '10', '11', '12', '13', '14']);
            }
            foreach ($item['rer'] as $line) {
                $this->assertContains($line, ['A', 'B', 'C', 'D', 'E']);
            }
            foreach (['attractions', 'dining', 'parks', 'education'] as $key) {
                $this->assertGreaterThanOrEqual(3, count($item[$key]), "$key of arrondissement {$item['n']}");
                $this->assertCount(count($item[$key]), $en[$i][$key], "$key of arrondissement {$item['n']} differs in length between FR and EN");
            }
        }
    }
}
