<?php

namespace App\Domain\Blog\Support;

use App\Domain\Blog\Exceptions\SanityRequestFailed;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

/**
 * Minimal GROQ client over the Sanity HTTP API (server-side only: the token never reaches the browser).
 * Reads go through the CDN when `services.sanity.use_cdn` is true; every query is cached (`CACHE_TTL_SECONDS`) and the
 * scheduled `sanity:warm` command refreshes the queries the public pages depend on, so a visitor never pays the round
 * trip. A failure is remembered for `FAILURE_TTL_SECONDS` (negative cache): during an outage the home, the blog and the
 * sitemap page fail fast instead of each waiting the 10 s timeout (audit 2026-10-12).
 *
 * `refresh()` makes the following reads skip the cached value and overwrite it (`sanity:warm` every five minutes, so a
 * Studio publish is online within five minutes at most, 2026-10-14).
 */
final class SanityClient
{
    public const CACHE_TTL_SECONDS = 900;

    public const FAILURE_TTL_SECONDS = 60;

    private bool $refresh = false;

    /** @var array{project_id: string, dataset: string, api_version: string, token: string, use_cdn: bool} */
    private readonly array $config;

    /** @param array{project_id?: ?string, dataset?: ?string, api_version?: ?string, token?: ?string, use_cdn?: mixed} $config */
    public function __construct(array $config)
    {
        // Values pasted into a hosting dashboard often carry trailing whitespace: trim everything.
        $this->config = [
            'project_id' => trim((string) ($config['project_id'] ?? '')),
            'dataset' => trim((string) ($config['dataset'] ?? 'production')),
            'api_version' => trim((string) ($config['api_version'] ?? '2025-02-09')),
            'token' => trim((string) ($config['token'] ?? '')),
            'use_cdn' => filter_var($config['use_cdn'] ?? false, FILTER_VALIDATE_BOOL),
        ];

        if ($this->config['project_id'] === '') {
            throw new \InvalidArgumentException('Sanity is not configured: SANITY_PROJECT_ID is empty (check the environment variables and re-run config:cache).');
        }
    }

    /** @param array<string, mixed> $params GROQ params, referenced as `$name` in the query. */
    public function fetch(string $groq, array $params = []): mixed
    {
        $query = ['query' => $groq, 'perspective' => 'published'];
        foreach ($params as $name => $value) {
            $query['$'.$name] = json_encode($value, JSON_THROW_ON_ERROR);
        }

        $url = $this->endpoint();
        $key = $this->cacheKey($groq, $params);

        if (! $this->refresh && ($hit = Cache::get($key)) !== null) {
            return $hit;
        }
        if (Cache::has($key.':down')) {
            throw SanityRequestFailed::recentlyDown();
        }

        try {
            $response = Http::withToken($this->config['token'])
                ->acceptJson()
                ->timeout(10)
                ->get($url, $query);
        } catch (ConnectionException $e) {
            Cache::put($key.':down', true, self::FAILURE_TTL_SECONDS);
            throw SanityRequestFailed::fromThrowable($e);
        }

        if ($response->failed()) {
            Cache::put($key.':down', true, self::FAILURE_TTL_SECONDS);
            throw SanityRequestFailed::fromResponse($response);
        }

        $result = $response->json('result');
        Cache::put($key, $result, self::CACHE_TTL_SECONDS);

        return $result;
    }

    /**
     * The cache entry of a query. It ignores the host: the live API and the CDN answer the same query.
     *
     * @param  array<string, mixed>  $params
     */
    public function cacheKey(string $groq, array $params = []): string
    {
        $query = ['query' => $groq, 'perspective' => 'published'];
        foreach ($params as $name => $value) {
            $query['$'.$name] = json_encode($value, JSON_THROW_ON_ERROR);
        }

        return 'sanity:'.md5($this->projectId().$this->dataset().$this->config['api_version'].serialize($query));
    }

    /** Every following read fetches Sanity and overwrites the cached value (the scheduled warm-up). */
    public function refresh(): void
    {
        $this->refresh = true;
    }

    public function projectId(): string
    {
        return (string) $this->config['project_id'];
    }

    public function dataset(): string
    {
        return (string) $this->config['dataset'];
    }

    private function endpoint(): string
    {
        $host = $this->config['use_cdn'] ? 'apicdn.sanity.io' : 'api.sanity.io';

        return sprintf('https://%s.%s/v%s/data/query/%s', $this->projectId(), $host, $this->config['api_version'], $this->dataset());
    }
}
