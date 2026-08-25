<?php

namespace App\Domain\Blog\Support;

use App\Domain\Blog\Exceptions\SanityRequestFailed;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

/**
 * Minimal GROQ client over the Sanity HTTP API (server-side only: the token never reaches the browser).
 * Reads go through the CDN when `services.sanity.use_cdn` is true; every query is cached briefly.
 */
final class SanityClient
{
    public const CACHE_TTL_SECONDS = 300;

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
        $key = 'sanity:'.md5($url.serialize($query));

        return Cache::remember($key, self::CACHE_TTL_SECONDS, function () use ($url, $query) {
            $response = Http::withToken($this->config['token'])
                ->acceptJson()
                ->timeout(10)
                ->get($url, $query);

            if ($response->failed()) {
                throw SanityRequestFailed::fromResponse($response);
            }

            return $response->json('result');
        });
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
