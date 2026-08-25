<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** Contact / valuation / sell / buy pages: SEO slugs in both locales, no cross-locale duplicates, listed in sitemap + llms.txt. */
class ServicePagesTest extends TestCase
{
    /** @return array<string, array{fr: string, en: string}> */
    private function slugs(): array
    {
        return [
            'contact' => ['fr' => '/contact', 'en' => '/en/contact'],
            'estimate' => ['fr' => '/estimation-immobiliere-paris', 'en' => '/en/property-valuation-paris'],
            'sell' => ['fr' => '/vendre-immobilier-paris', 'en' => '/en/sell-property-paris'],
            'buy' => ['fr' => '/acheter-immobilier-paris', 'en' => '/en/buy-property-paris'],
        ];
    }

    public function test_pages_are_served_in_french_and_english(): void
    {
        foreach ($this->slugs() as $page => $urls) {
            $this->withLocale('fr')->get($urls['fr'])->assertOk()->assertInertia(fn (Assert $p) => $p->component($page)->where('localization.alternates.en', url($urls['en'])));
            $this->withLocale('en')->get($urls['en'])->assertOk()->assertInertia(fn (Assert $p) => $p->component($page)->where('localization.alternates.fr', url($urls['fr'])));
        }
    }

    public function test_french_slugs_do_not_exist_under_the_english_prefix(): void
    {
        $this->withLocale('en')->get('/en/vendre-immobilier-paris')->assertNotFound();
        $this->withLocale('fr')->get('/sell-property-paris')->assertNotFound();
    }

    public function test_pages_have_texts_in_both_locales(): void
    {
        foreach (['fr', 'en'] as $locale) {
            app()->setLocale($locale);
            foreach (array_keys($this->slugs()) as $page) {
                foreach (['title', 'seo_title', 'seo_description', 'intro'] as $key) {
                    $this->assertNotSame("ui.pages.$page.$key", __("ui.pages.$page.$key"), "[$locale] missing ui.pages.$page.$key");
                }
                $this->assertStringContainsString('Estate in Paris', __("ui.pages.$page.intro"), "[$locale] $page intro must name the brand (GEO)");
                $this->assertStringContainsString('Paris', __("ui.pages.$page.intro"));
            }
        }
    }

    public function test_pages_are_in_the_sitemap_and_llms_txt(): void
    {
        Http::fake();
        $this->artisan('sitemap:generate')->assertSuccessful();
        $xml = file_get_contents(public_path('sitemap.xml'));
        $llms = $this->get('/llms.txt')->assertOk()->getContent();

        foreach ($this->slugs() as $urls) {
            foreach ($urls as $url) {
                $this->assertStringContainsString('<loc>'.url($url).'</loc>', $xml);
                $this->assertStringContainsString(url($url), $llms);
            }
        }
    }
}
