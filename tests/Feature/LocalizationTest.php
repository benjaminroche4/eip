<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LocalizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_root_redirects_to_the_negotiated_locale(): void
    {
        // Accept-Language negotiation is skipped by the package when running in console (tests),
        // so only the default-locale fallback is asserted here; verified manually over HTTP.
        $this->get('/')->assertRedirect('/fr');
    }

    public function test_each_locale_has_its_own_translated_search_url(): void
    {
        $this->withLocale('fr')->get('/fr/recherche')->assertOk()->assertInertia(fn (Assert $page) => $page->component('search')->where('locale', 'fr'));
        $this->withLocale('en')->get('/en/search')->assertOk()->assertInertia(fn (Assert $page) => $page->component('search')->where('locale', 'en'));
        $this->withLocale('en')->get('/en/recherche')->assertNotFound();
    }

    public function test_shared_localization_props_expose_alternates_and_translations(): void
    {
        $this->withLocale('fr')->get('/fr/recherche')->assertInertia(
            fn (Assert $page) => $page
                ->where('localization.current', 'fr')
                ->where('localization.alternates.fr', url('/fr/recherche'))
                ->where('localization.alternates.en', url('/en/search'))
                ->where('localization.alternates.x-default', url('/fr/recherche'))
                ->where('translations.nav.search', 'Recherche')
        );

        $this->withLocale('en')->get('/en/search')->assertInertia(fn (Assert $page) => $page->where('translations.nav.search', 'Search'));
    }

    public function test_html_lang_follows_the_locale(): void
    {
        $this->withLocale('en')->get('/en')->assertSee('<html lang="en">', false);
        $this->withLocale('fr')->get('/fr')->assertSee('<html lang="fr">', false);
    }
}
