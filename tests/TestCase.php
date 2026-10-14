<?php

namespace Tests;

use App\Domain\Properties\Actions\FetchSanityProperties;
use App\Domain\Properties\Actions\ListProperties;
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
        $this->bindSampleProperties();
    }

    /**
     * The listings come from Sanity (2026-10-14): every test reads the fixture rows of `tests/Fixtures/properties`
     * instead (6 sales, 2 rentals, 1 sold), bound here and again after each `withLocale()`; a test that needs other
     * rows binds its own `ListProperties`, one that exercises the Sanity mapping fakes the HTTP query and binds
     * `new ListProperties(app(FetchSanityProperties::class))`.
     */
    protected function bindSampleProperties(): void
    {
        $this->app->bind(ListProperties::class, fn () => new ListProperties(app(FetchSanityProperties::class), fn (string $locale) => self::sampleProperties($locale)));
    }

    /** @return list<array<string, mixed>> */
    public static function sampleProperties(string $locale): array
    {
        return require __DIR__.'/Fixtures/properties/'.(in_array($locale, ['fr', 'en'], true) ? $locale : 'fr').'.php';
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
        $this->bindSampleProperties();

        return $this;
    }

    protected function tearDown(): void
    {
        putenv(LaravelLocalization::ENV_ROUTE_KEY.'=');
        parent::tearDown();
    }
}
