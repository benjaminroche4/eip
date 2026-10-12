<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Baseline security headers on every response (audit of the Buy page, 2026-10-12): no MIME sniffing, no framing by
 * other sites, a referrer policy that keeps the path private cross-origin, the browser features the site never uses
 * switched off, and HSTS once the request comes over HTTPS (production behind Laravel Cloud's TLS). No CSP yet: Google
 * Tag Manager, Google Maps and the YouTube embeds would each need their own allow-list, to be done with a report-only
 * phase first.
 */
final class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');

        if ($request->isSecure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        return $response;
    }
}
