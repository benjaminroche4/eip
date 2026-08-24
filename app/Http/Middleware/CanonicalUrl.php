<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Mcamara\LaravelLocalization\Facades\LaravelLocalization;
use Symfony\Component\HttpFoundation\Response;

/**
 * 301-redirect duplicate URL variants to the canonical one:
 * - "/fr/..." (default locale prefix, hidden in URLs) → "/..." — every environment;
 * - wrong host (www vs apex), http → https, trailing slashes — production only (from APP_URL).
 */
class CanonicalUrl
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->isMethod('GET')) {
            return $next($request);
        }

        $path = $request->getPathInfo();
        $query = $request->getQueryString();
        $suffix = $query ? '?'.$query : '';

        // Default locale must never appear in the URL (hideDefaultLocaleInURL): permanent redirect, not the package's 302.
        if (config('laravellocalization.hideDefaultLocaleInURL')) {
            $default = LaravelLocalization::getDefaultLocale();
            if ($path === "/$default" || str_starts_with($path, "/$default/")) {
                $stripped = substr($path, strlen("/$default")) ?: '/';

                return redirect()->to($stripped.$suffix, 301);
            }
        }

        if (! app()->isProduction()) {
            return $next($request);
        }

        $canonical = parse_url((string) config('app.url'));
        $host = $canonical['host'] ?? $request->getHost();
        $scheme = $canonical['scheme'] ?? 'https';
        $normalizedPath = $path !== '/' ? rtrim($path, '/') : '/';

        if ($request->getHost() !== $host || $request->getScheme() !== $scheme || $path !== $normalizedPath) {
            return redirect()->to($scheme.'://'.$host.$normalizedPath.$suffix, 301);
        }

        return $next($request);
    }
}
