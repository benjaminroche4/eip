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
        $this->withLocale('en')->get('/en/terms-and-conditions')->assertNotFound(); // dropped on 2026-09-22, replaced by the sitemap page
        $this->withLocale('en')->get('/en/mentions-legales')->assertNotFound();
    }

    public function test_legal_notice_is_real_and_resolves_the_organisation_tokens(): void
    {
        // withLocale() refreshes the application, so the config override must come after it.
        $this->withLocale('fr');
        config(['seo.organization.phone' => '+33 1 00 00 00 00', 'seo.organization.email' => 'legal@example.test', 'seo.organization.address.street' => '1 rue Test', 'seo.organization.address.postal_code' => '75006', 'seo.organization.address.city' => 'Paris']);

        $this->get('/mentions-legales')->assertOk()->assertInertia(function (Assert $page) {
            $sections = collect($page->toArray()['props']['page']['sections']);
            $bodies = $sections->pluck('body')->implode("\n");
            $this->assertCount(9, $sections);
            $this->assertStringContainsString('Téléphone : +33 1 00 00 00 00', $bodies); // tokens replaced from config/seo.php
            $this->assertStringContainsString('E-mail : legal@example.test', $bodies);
            $this->assertStringContainsString('Adresse : 1 rue Test, 75006 Paris', $bodies);
            $this->assertStringContainsString('Laravel Cloud', $bodies); // real host, not a placeholder
            $this->assertStringContainsString('Localisation des serveurs : Munich, Allemagne', $bodies); // EU data location
            $this->assertStringNotContainsString('À compléter', $bodies);
            $this->assertStringNotContainsString(':phone', $bodies);
            $page->where('page.updated', 'Dernière mise à jour : 22 septembre 2026');
        });

        $this->withLocale('en')->get('/en/legal-notice')->assertOk()->assertInertia(fn (Assert $page) => $page->where('page.updated', 'Last updated: 22 September 2026')->where('page.sections.1.heading', 'Hosting provider'));
    }

    public function test_privacy_policy_is_real_and_names_the_actual_processors(): void
    {
        $this->withLocale('fr');
        config(['seo.organization.phone' => '+33 1 00 00 00 00', 'seo.organization.email' => 'privacy@example.test', 'seo.organization.address.street' => '1 rue Test', 'seo.organization.address.postal_code' => '75006', 'seo.organization.address.city' => 'Paris']);

        $this->get('/politique-de-confidentialite')->assertOk()->assertInertia(function (Assert $page) {
            $sections = collect($page->toArray()['props']['page']['sections']);
            $bodies = $sections->pluck('body')->implode("\n");
            $this->assertCount(12, $sections);
            $this->assertStringContainsString('Veylam OÜ', $bodies); // the real controller
            $this->assertStringContainsString('E-mail : privacy@example.test', $bodies); // tokens replaced from config/seo.php
            $this->assertStringContainsString('Estate in Paris, 1 rue Test, 75006 Paris', $bodies);
            foreach (['Laravel Cloud', 'Resend', 'Google Tag Manager', 'Google Places', 'CNIL'] as $name) {
                $this->assertStringContainsString($name, $bodies); // the processors the site actually uses
            }
            $this->assertStringNotContainsString('À compléter', $bodies);
            $this->assertStringNotContainsString('Relocation', $bodies); // adapted, not copied
            $this->assertStringNotContainsString(':email', $bodies);
            $page->where('page.updated', 'Dernière mise à jour : 22 septembre 2026');
        });

        $this->withLocale('en')->get('/en/privacy-policy')->assertOk()->assertInertia(fn (Assert $page) => $page->where('page.updated', 'Last updated: 22 September 2026')->where('page.sections.1.heading', 'Data controller')->has('page.sections', 12));
    }

    public function test_legal_pages_are_listed_in_the_sitemap(): void
    {
        Http::fake(); // blog entries come from Sanity — not under test here
        $this->artisan('sitemap:generate')->assertSuccessful();
        $xml = file_get_contents(public_path('sitemap.pages.xml'));
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
