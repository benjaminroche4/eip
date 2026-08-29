<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** GTM is injected from config only (services.gtm.id ← GTM_ID): head snippet + noscript fallback, nothing when unset. */
class GoogleTagManagerTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_container_is_injected_in_head_and_body_when_an_id_is_configured(): void
    {
        config(['services.gtm.id' => 'GTM-TEST123']);

        $html = $this->get('/')->assertOk()->getContent();

        $this->assertStringContainsString("'dataLayer','GTM-TEST123'", $html);
        $this->assertStringContainsString('https://www.googletagmanager.com/ns.html?id=GTM-TEST123', $html);
        $this->assertLessThan(strpos($html, '<link rel="preload"'), strpos($html, 'googletagmanager.com/gtm.js'), 'GTM must sit at the top of <head>');
        $this->assertLessThan(strpos($html, 'data-page='), strpos($html, 'ns.html?id='), 'noscript fallback must open <body>');
    }

    public function test_nothing_is_injected_without_an_id(): void
    {
        config(['services.gtm.id' => null]);

        $this->get('/')->assertOk()->assertDontSee('googletagmanager.com');
    }
}
