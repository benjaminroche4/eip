<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Mcamara\LaravelLocalization\LaravelLocalization;

abstract class TestCase extends BaseTestCase
{
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
