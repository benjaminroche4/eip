<?php

namespace Tests\Feature;

use Tests\TestCase;

/** Every response carries the baseline security headers; HSTS only over HTTPS (SecurityHeaders middleware, 2026-10-12). */
class SecurityHeadersTest extends TestCase
{
    public function test_public_pages_carry_the_baseline_security_headers(): void
    {
        $response = $this->get('/acheter-immobilier-paris')->assertOk();

        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('X-Frame-Options', 'SAMEORIGIN');
        $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        $this->assertStringContainsString('camera=()', $response->headers->get('Permissions-Policy'));
        $response->assertHeaderMissing('Strict-Transport-Security'); // plain HTTP in tests: no HSTS
    }

    public function test_hsts_is_sent_over_https_only(): void
    {
        $this->get('https://localhost/robots.txt')->assertOk()->assertHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    public function test_robots_and_json_responses_get_the_headers_too(): void
    {
        $this->get('/robots.txt')->assertOk()->assertHeader('X-Content-Type-Options', 'nosniff');
    }
}
