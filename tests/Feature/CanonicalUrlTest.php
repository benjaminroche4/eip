<?php

namespace Tests\Feature;

use Tests\TestCase;

class CanonicalUrlTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config(['app.url' => 'https://www.example.test']);
        app()->detectEnvironment(fn () => 'production');
    }

    public function test_https_request_behind_a_tls_terminating_proxy_is_not_redirected(): void
    {
        // Laravel Cloud: the load balancer speaks https to the client and http to the app.
        $response = $this->get('http://www.example.test/', ['X-Forwarded-Proto' => 'https']);

        $response->assertOk();
    }

    public function test_plain_http_request_is_redirected_to_https(): void
    {
        $this->get('http://www.example.test/recherche')
            ->assertRedirect('https://www.example.test/recherche')
            ->assertStatus(301);
    }

    public function test_wrong_host_and_trailing_slash_are_redirected_to_the_canonical_url(): void
    {
        $this->get('https://example.test/recherche/')
            ->assertRedirect('https://www.example.test/recherche')
            ->assertStatus(301);
    }
}
