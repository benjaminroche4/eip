<?php

namespace Tests\Feature;

use App\Http\Ssr\ResilientHttpGateway;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Inertia\Ssr\Gateway;
use Tests\TestCase;

/** SSR must never take the site down: an unreachable SSR server falls back to client rendering (Laravel Cloud incident 2026-09-16). */
class SsrGatewayTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config(['inertia.ssr.enabled' => true, 'inertia.ssr.ensure_bundle_exists' => false]);
    }

    public function test_the_resilient_gateway_with_short_timeouts_is_bound(): void
    {
        $this->assertInstanceOf(ResilientHttpGateway::class, app(Gateway::class));
        $this->assertLessThanOrEqual(2, config('inertia.ssr.connect_timeout'));
        $this->assertLessThanOrEqual(10, config('inertia.ssr.timeout'));
    }

    public function test_an_unreachable_ssr_server_falls_back_to_client_rendering(): void
    {
        // A throwing fake is not recorded by Http::assertSent: track the call ourselves.
        $called = false;
        Http::fake(function ($request) use (&$called) {
            $called = str_contains($request->url(), '/render');
            throw new ConnectionException('Connection timed out after 1000 ms');
        });

        $this->get('/contact')->assertOk()->assertSee('id="app"', false);
        $this->assertTrue($called, 'the gateway did try the SSR server before falling back');
    }

    public function test_a_healthy_ssr_server_response_is_used(): void
    {
        Http::fake(['127.0.0.1:13714/render' => Http::response(['head' => ['<title inertia>SSR OK</title>'], 'body' => '<div id="app">rendered by ssr</div>'])]);

        $this->get('/contact')->assertOk()->assertSee('rendered by ssr', false)->assertSee('<title inertia>SSR OK</title>', false);
    }

    public function test_a_malformed_ssr_response_falls_back_to_client_rendering(): void
    {
        Http::fake(['127.0.0.1:13714/render' => Http::response('not json', 200)]);

        $this->get('/contact')->assertOk()->assertSee('id="app"', false);
    }
}
