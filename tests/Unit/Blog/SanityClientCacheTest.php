<?php

namespace Tests\Unit\Blog;

use App\Domain\Blog\Exceptions\SanityRequestFailed;
use App\Domain\Blog\Support\SanityClient;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/** SanityClient caching (audit 2026-10-12): hits are cached, failures fail fast for a minute, connection errors are one exception type. */
class SanityClientCacheTest extends TestCase
{
    private function client(): SanityClient
    {
        return new SanityClient(['project_id' => 'abc', 'token' => 'x']);
    }

    public function test_a_successful_query_is_cached_and_not_refetched(): void
    {
        Http::fake(fn () => Http::response(['result' => ['a']]));
        $client = $this->client();

        $this->assertSame(['a'], $client->fetch('*[_type == "x"]'));
        $this->assertSame(['a'], $client->fetch('*[_type == "x"]'));
        Http::assertSentCount(1);
    }

    public function test_a_failure_is_remembered_so_the_next_call_fails_fast_without_a_request(): void
    {
        Http::fake(fn () => Http::response('down', 503));
        $client = $this->client();

        try {
            $client->fetch('count(*)');
            $this->fail('expected SanityRequestFailed');
        } catch (SanityRequestFailed $e) {
            $this->assertStringContainsString('503', $e->getMessage());
        }
        $this->expectException(SanityRequestFailed::class);
        $this->expectExceptionMessage('negative cache');
        $client->fetch('count(*)');
        Http::assertSentCount(1);
    }

    public function test_a_connection_error_is_wrapped_and_remembered(): void
    {
        Http::fake(fn () => throw new ConnectionException('cURL error 28: timeout'));
        $client = $this->client();

        try {
            $client->fetch('count(*)');
            $this->fail('expected SanityRequestFailed');
        } catch (SanityRequestFailed $e) {
            $this->assertStringContainsString('unreachable', $e->getMessage());
            $this->assertInstanceOf(ConnectionException::class, $e->getPrevious());
        }
        $this->assertTrue(Cache::has($this->client()->cacheKey('count(*)').':down'));
        $this->assertSame($this->client()->cacheKey('count(*)'), (new SanityClient(['project_id' => 'abc', 'token' => 'x', 'use_cdn' => true]))->cacheKey('count(*)'), 'the key ignores the CDN / live API host');
    }

    public function test_the_warm_command_refreshes_the_public_queries(): void
    {
        config(['services.sanity.project_id' => 'abc', 'services.sanity.token' => 'x']);
        Http::fake(fn () => Http::response(['result' => []]));

        $this->artisan('sanity:warm')->assertSuccessful();
        $this->assertGreaterThanOrEqual(6, count(Http::recorded()));
    }

    public function test_the_warm_command_overwrites_the_cached_values(): void
    {
        config(['services.sanity.project_id' => 'abc', 'services.sanity.token' => 'x']);
        Http::fake(fn () => Http::response(['result' => []]));
        $this->artisan('sanity:warm')->assertSuccessful();
        $warmed = count(Http::recorded());

        // Still cached: a second warm-up fetches everything again (a Studio publish is online within five minutes, 2026-10-14)
        $this->artisan('sanity:warm')->assertSuccessful();
        $this->assertSame($warmed * 2, count(Http::recorded()));
        $this->assertSame('*/5 * * * *', collect(app(Schedule::class)->events())->first(fn ($e) => str_contains($e->command ?? '', 'sanity:warm'))?->expression, 'scheduled every five minutes');
    }

    public function test_the_warm_command_fails_only_when_every_query_fails(): void
    {
        config(['services.sanity.project_id' => 'abc', 'services.sanity.token' => 'x']);
        Http::fake(fn () => Http::response('down', 503)); // a fresh fake per test: Laravel keeps earlier stubs first

        $this->artisan('sanity:warm')->assertFailed();
    }
}
