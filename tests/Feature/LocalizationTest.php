<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LocalizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_default_locale_is_served_at_the_root_and_its_prefix_redirects(): void
    {
        // French (default) lives at the root; the prefixed variant is a permanent redirect.
        $this->get('/')->assertOk();
        $this->get('/fr')->assertRedirect('/')->assertStatus(301);
        $this->get('/fr/recherche?q=2')->assertRedirect('/recherche?q=2')->assertStatus(301);
    }

    public function test_switching_back_to_french_is_never_overridden_by_a_remembered_locale(): void
    {
        // A visitor who picked English must still reach the French root by clicking "FR".
        $this->withLocale('en')->get('/en')->assertOk();
        $this->withLocale('fr')->withCookie('locale', 'en')->withSession(['locale' => 'en'])->get('/')->assertOk();
    }

    public function test_each_locale_has_its_own_translated_search_url(): void
    {
        $this->withLocale('fr')->get('/recherche')->assertOk()->assertInertia(fn (Assert $page) => $page->component('search')->where('locale', 'fr'));
        $this->withLocale('en')->get('/en/search')->assertOk()->assertInertia(fn (Assert $page) => $page->component('search')->where('locale', 'en'));
        $this->withLocale('en')->get('/en/recherche')->assertNotFound();
    }

    public function test_shared_localization_props_expose_alternates_and_translations(): void
    {
        $this->withLocale('fr')->get('/recherche')->assertInertia(
            fn (Assert $page) => $page
                ->where('localization.current', 'fr')
                ->where('localization.alternates.fr', url('/recherche'))
                ->where('localization.alternates.en', url('/en/search'))
                ->where('localization.alternates.x-default', url('/recherche'))
                ->where('translations.nav.search', 'Recherche')
        );

        $this->withLocale('en')->get('/en/search')->assertInertia(fn (Assert $page) => $page->where('translations.nav.search', 'Search'));
    }

    public function test_html_lang_follows_the_locale(): void
    {
        $this->withLocale('en')->get('/en')->assertSee('<html lang="en">', false);
        $this->withLocale('fr')->get('/')->assertSee('<html lang="fr">', false);
    }
}
