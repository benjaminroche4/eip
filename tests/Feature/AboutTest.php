<?php

namespace Tests\Feature;

use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** « À propos » page: served in both languages, listed in the sitemap, llms.txt and the footer. */
class AboutTest extends TestCase
{
    public function test_about_page_serves_the_localized_values(): void
    {
        $this->get('/a-propos')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->component('about')
                ->where('translations.about.headline', "L'agence immobilière de prestige à Paris")
                ->has('team', 6)
                ->where('team.0.name', 'Alexandre Moreau')
                ->where('team.0.flags', ['FR', 'GB'])
                ->has('testimonials', 10)
                ->has('stats', 4)
                ->where('stats.0.value', '250 M€+')
                ->where('stats.0.title', 'Transactions réalisées')
                ->where('translations.about.manifesto_title', 'Qui sommes-nous ?')
                ->where('translations.values.value_1_title', 'Confidentialité')
                ->where('translations.pages.about.intro', fn (string $intro) => str_contains($intro, 'Estate in Paris') && str_contains($intro, 'Paris 6e')));

        $this->withLocale('en')->get('/en/about-us')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->component('about')->where('translations.about.headline', 'The luxury real estate agency in Paris'));

        $this->get('/en/a-propos')->assertNotFound();

        $this->assertFileExists(public_path('images/about/hero-1400.jpg'));
        $this->assertFileExists(public_path('images/about/hero-800.jpg'));
        foreach (['hero-856.webm', 'hero-856.mp4', 'hero-640.webm', 'hero-640.mp4'] as $file) {
            $path = public_path("videos/about/$file");
            $this->assertFileExists($path);
            $this->assertLessThan(3 * 1024 * 1024, filesize($path), "$file must stay under 3 MB (hero background, performance)");
        }
        $this->assertFileExists(public_path('images/about/hero-poster-856.jpg'));
        foreach (range(1, 6) as $i) {
            $this->assertFileExists(public_path("images/team/member-$i.jpg"));
        }
    }

    public function test_about_page_is_in_the_sitemap_and_llms_txt(): void
    {
        $this->artisan('sitemap:generate')->assertSuccessful();
        $pages = file_get_contents(public_path('sitemap.pages.xml'));
        $this->assertStringContainsString('<loc>'.url('/a-propos').'</loc>', $pages);
        $this->assertStringContainsString('<loc>'.url('/en/about-us').'</loc>', $pages);

        $this->get('/llms.txt')->assertOk()->assertSee(url('/a-propos'))->assertSee(url('/en/about-us'));
    }
}
