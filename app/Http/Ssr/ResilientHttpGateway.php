<?php

namespace App\Http\Ssr;

use Exception;
use Illuminate\Http\Client\StrayRequestException;
use Illuminate\Support\Facades\Http;
use Inertia\Ssr\HttpGateway;
use Inertia\Ssr\Response;

/**
 * Inertia SSR gateway with short timeouts. The stock gateway posts to the SSR server with Laravel's 30 s default
 * and no connect timeout: when the SSR process is down (or was never started on the host), every request hangs
 * until the proxy gives up (« upstream connect error … connection timeout », seen on Laravel Cloud 2026-09-16).
 * Here an unreachable SSR server degrades to client-side rendering within `inertia.ssr.connect_timeout` seconds.
 */
class ResilientHttpGateway extends HttpGateway
{
    /** @param array<string, mixed> $page */
    public function dispatch(array $page): ?Response
    {
        if (! $this->shouldDispatch()) {
            return null;
        }

        try {
            $response = Http::connectTimeout((float) config('inertia.ssr.connect_timeout', 1))
                ->timeout((float) config('inertia.ssr.timeout', 5))
                ->post($this->getUrl('/render'), $page)
                ->throw()
                ->json();
        } catch (Exception $e) {
            if ($e instanceof StrayRequestException) {
                throw $e;
            }

            return null;
        }

        if (! is_array($response) || ! isset($response['head'], $response['body'])) {
            return null;
        }

        return new Response(implode("\n", $response['head']), $response['body']);
    }
}
