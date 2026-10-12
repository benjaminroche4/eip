<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Http;
use Mcamara\LaravelLocalization\LaravelLocalization;

abstract class TestCase extends BaseTestCase
{
    /** No test may reach the network (audit 2026-10-12: five Feature tests used to call the real Sanity API): fake what you need. */
    protected function setUp(): void
    {
        parent::setUp();
        Http::preventStrayRequests();
    }

    /** Where `sitemap:generate` writes in tests (`SEO_SITEMAP_DIR` in phpunit.xml), never `public/`. */
    protected function sitemapPath(string $file): string
    {
        return rtrim((string) config('seo.sitemap_dir'), '/').'/'.$file;
    }

    /**
     * Localized routes (/fr/..., /en/...) are registered from the request URL at boot.
     * In tests the app boots before any request, so the locale must be forced through
     * LaravelLocalization::ENV_ROUTE_KEY and the app re-created.
     */
    protected function withLocale(string $locale): static
    {
        // The default locale is hidden from URLs: its routes are the unprefixed ones registered at boot.
        $forced = $locale === config('app.fallback_locale') ? '' : $locale; // app.locale is mutated per request by the package
        putenv(LaravelLocalization::ENV_ROUTE_KEY.'='.$forced);
        $this->refreshApplication();

        return $this;
    }

    protected function tearDown(): void
    {
        putenv(LaravelLocalization::ENV_ROUTE_KEY.'=');
        parent::tearDown();
    }
}
