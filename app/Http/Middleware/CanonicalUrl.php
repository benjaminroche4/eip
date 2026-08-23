<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * 301-redirect duplicate URL variants to the canonical one (production only):
 * wrong host (www vs apex), http → https, uppercase paths, trailing slashes.
 * Canonical host/scheme come from APP_URL.
 */
class CanonicalUrl
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! app()->isProduction() || ! $request->isMethod('GET')) {
            return $next($request);
        }

        $canonical = parse_url((string) config('app.url'));
        $host = $canonical['host'] ?? $request->getHost();
        $scheme = $canonical['scheme'] ?? 'https';
        $path = $request->getPathInfo();
        $normalizedPath = $path !== '/' ? rtrim($path, '/') : '/';

        $needsRedirect = $request->getHost() !== $host
            || $request->getScheme() !== $scheme
            || $path !== $normalizedPath;

        if ($needsRedirect) {
            $query = $request->getQueryString();

            return redirect()->to($scheme.'://'.$host.$normalizedPath.($query ? '?'.$query : ''), 301);
        }

        return $next($request);
    }
}
