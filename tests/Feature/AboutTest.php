<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** « À propos » page: served in both languages, listed in the sitemap, llms.txt and the footer. */
class AboutTest extends TestCase
{
    /** Every arrondissement has an advisor (user decision 2026-10-11): the favourite districts of the team cover Paris 1 to 20, in both languages. */
    public function test_the_team_covers_every_arrondissement(): void
    {
        foreach (['fr' => '/(\d+)(?:er|e)\b/', 'en' => '/(\d+)(?:st|nd|rd|th)\b/'] as $locale => $pattern) {
            $covered = [];
            foreach (__('ui.team.members', [], $locale) as $member) {
                preg_match_all($pattern, $member['area'], $m);
                $covered = [...$covered, ...array_map(intval(...), $m[1])];
            }
            sort($covered);
            $this->assertSame(range(1, 20), array_values(array_unique($covered)), "[$locale] every arrondissement must have an advisor");
        }
    }

    public function test_about_page_serves_the_localized_values(): void
    {
        $this->get('/a-propos')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->component('about')
                ->where('translations.about.headline', "L'art du conseil immobilier, au service de vos projets à Paris")
                ->has('team', 8)
                ->where('team.0.name', 'Julien L.')
                ->where('team.0.area', 'Saint-Germain-des-Prés, Paris 5e et 6e')
                ->has('testimonials', 20)
                ->has('stats', 4)
                ->where('stats.0.value', '25 ans')
                ->where('stats.0.title', "d'expérience à Paris")
                ->where('stats.3.value', '4,9/5') // the Google tile reads seo.reviews (phpunit.xml)
                ->where('stats.3.title', 'sur 150 avis Google')
                ->where('translations.about.manifesto_title', 'Qui sommes-nous ?')
                ->where('translations.values.value_1_title', 'Confidentialité')
                ->where('translations.pages.about.intro', fn (string $intro) => str_contains($intro, 'Paris') && str_contains($intro, 'projet'))); // no brand in the hero intro (user decision 2026-10-11), the h1 and the manifesto carry it / address (user decision 2026-10-11)

        $this->withLocale('en')->get('/en/about-us')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->component('about')->where('translations.about.headline', 'The art of property advice, at the service of your projects in Paris'));

        $this->get('/en/a-propos')->assertNotFound();

        $this->assertFileExists(public_path('images/about/hero-1400.jpg'));
        $this->assertFileExists(public_path('images/about/hero-800.jpg'));
        foreach (['hero-856.webm', 'hero-856.mp4', 'hero-640.webm', 'hero-640.mp4'] as $file) {
            $path = public_path("videos/about/$file");
            $this->assertFileExists($path);
            $this->assertLessThan(3 * 1024 * 1024, filesize($path), "$file must stay under 3 MB (hero background, performance)");
        }
        $this->assertFileExists(public_path('images/about/hero-poster-856.jpg'));
        foreach (range(1, 8) as $i) {
            $this->assertFileExists(public_path("images/team/member-$i.webp")); // the eight portraits, matched by name with Relocation in Paris (2026-10-11)
        }
    }

    public function test_about_page_is_in_the_sitemap_and_llms_txt(): void
    {
        Http::fake(); // the blog part of the sitemap is not under test here
        $this->artisan('sitemap:generate')->assertSuccessful();
        $pages = file_get_contents($this->sitemapPath('sitemap.pages.xml'));
        $this->assertStringContainsString('<loc>'.url('/a-propos').'</loc>', $pages);
        $this->assertStringContainsString('<loc>'.url('/en/about-us').'</loc>', $pages);

        $this->get('/llms.txt')->assertOk()->assertSee(url('/a-propos'))->assertSee(url('/en/about-us'));
    }
}
