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

    /** @param array{project_id: ?string, dataset: string, api_version: string, token: ?string, use_cdn: bool} $config */
    public function __construct(private readonly array $config) {}

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
            $response = Http::withToken((string) $this->config['token'])
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
