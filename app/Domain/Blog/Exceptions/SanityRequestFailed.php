<?php

namespace App\Domain\Blog\Exceptions;

use Illuminate\Http\Client\Response;
use RuntimeException;

final class SanityRequestFailed extends RuntimeException
{
    public static function fromResponse(Response $response): self
    {
        return new self('Sanity query failed ('.$response->status().'): '.mb_substr($response->body(), 0, 300));
    }
}
