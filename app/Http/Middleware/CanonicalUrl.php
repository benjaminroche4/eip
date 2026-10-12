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
                // Re-rooted on this host: « /fr//evil.com » must become « /evil.com », never the scheme-relative « //evil.com » (open redirect, audit 2026-10-12)
                $stripped = '/'.ltrim(substr($path, strlen("/$default")) ?: '', '/');

                return redirect()->to($stripped.$suffix, 301);
            }
        }

        // The front controller never appears in a URL: « /index.php » and « /index.php/contact » are the bare paths (audit 2026-10-12)
        // Symfony already strips the script name from `getPathInfo()`: the raw request URI is the one to look at
        $raw = (string) parse_url($request->getRequestUri(), PHP_URL_PATH);
        if ($raw === '/index.php' || str_starts_with($raw, '/index.php/')) {
            // Absolute target: a relative one would be generated under the request's base URL, i.e. « /index.php » again (loop)
            return redirect()->to($request->getSchemeAndHttpHost().'/'.ltrim(substr($raw, strlen('/index.php')), '/').$suffix, 301);
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
