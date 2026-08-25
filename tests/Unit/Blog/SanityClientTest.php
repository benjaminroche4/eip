<?php

namespace Tests\Unit\Blog;

use App\Domain\Blog\Support\SanityClient;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use InvalidArgumentException;
use Tests\TestCase;

class SanityClientTest extends TestCase
{
    public function test_trims_whitespace_pasted_around_configuration_values(): void
    {
        Http::fake(fn () => Http::response(['result' => 42]));

        $client = new SanityClient(['project_id' => 'ks9vwq45   ', 'dataset' => ' production ', 'api_version' => '2025-02-09 ', 'token' => "secret  \n", 'use_cdn' => 'true']);

        $this->assertSame(42, $client->fetch('count(*)'));
        Http::assertSent(fn (Request $r) => str_starts_with($r->url(), 'https://ks9vwq45.apicdn.sanity.io/v2025-02-09/data/query/production?')
            && $r->header('Authorization')[0] === 'Bearer secret');
    }

    public function test_fails_loudly_when_the_project_id_is_missing(): void
    {
        $this->expectException(InvalidArgumentException::class);
        new SanityClient(['project_id' => null, 'token' => 'x']);
    }
}
