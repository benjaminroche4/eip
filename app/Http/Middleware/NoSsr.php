<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Disable Inertia SSR for the current request (client-side rendering only).
 * Apply to private/authenticated routes that never need to be crawled.
 */
class NoSsr
{
    public function handle(Request $request, Closure $next): Response
    {
        config(['inertia.ssr.enabled' => false]);

        return $next($request);
    }
}
