<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LegalPagesTest extends TestCase
{
    use RefreshDatabase;

    public function test_legal_pages_are_served_with_translated_slugs(): void
    {
        $this->withLocale('fr')->get('/mentions-legales')->assertOk()->assertInertia(fn (Assert $page) => $page->component('legal')->where('page.key', 'legal')->where('page.title', 'Mentions légales'));
        $this->withLocale('en')->get('/en/privacy-policy')->assertOk()->assertInertia(fn (Assert $page) => $page->where('page.key', 'privacy')->where('page.title', 'Privacy Policy'));
        $this->withLocale('en')->get('/en/terms-and-conditions')->assertOk()->assertInertia(fn (Assert $page) => $page->where('page.key', 'terms'));
        $this->withLocale('en')->get('/en/mentions-legales')->assertNotFound();
    }

    public function test_legal_pages_are_listed_in_the_sitemap(): void
    {
        Http::fake(); // blog entries come from Sanity — not under test here
        $this->artisan('sitemap:generate')->assertSuccessful();
        $xml = file_get_contents(public_path('sitemap.xml'));
        $this->assertStringContainsString('<loc>'.url('/mentions-legales').'</loc>', $xml);
        $this->assertStringContainsString('<loc>'.url('/en/legal-notice').'</loc>', $xml);
    }

    public function test_footer_trust_data_is_shared(): void
    {
        // withLocale() refreshes the application, so the config override must come after it.
        $this->withLocale('fr');
        config(['seo.reviews' => ['rating' => 4.9, 'count' => 128, 'url' => 'https://example.test/reviews']]);
        $this->get('/')->assertInertia(fn (Assert $page) => $page->where('seo.reviews.count', 128)->where('seo.hours.label', config('seo.hours.labels.fr')));
    }
}
