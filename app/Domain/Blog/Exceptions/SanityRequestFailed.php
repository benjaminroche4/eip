<?php

namespace App\Domain\Blog\Exceptions;

use Illuminate\Http\Client\Response;
use RuntimeException;
use Throwable;

final class SanityRequestFailed extends RuntimeException
{
    public static function fromResponse(Response $response): self
    {
        return new self('Sanity query failed ('.$response->status().'): '.mb_substr($response->body(), 0, 300));
    }

    /** A DNS / TLS / timeout failure, so callers only ever catch one exception type (audit 2026-10-12). */
    public static function fromThrowable(Throwable $e): self
    {
        return new self('Sanity unreachable: '.$e->getMessage(), previous: $e);
    }

    /** Served from the short negative cache: the last call failed less than `SanityClient::FAILURE_TTL_SECONDS` ago. */
    public static function recentlyDown(): self
    {
        return new self('Sanity query skipped: the previous call failed recently (negative cache).');
    }
}
