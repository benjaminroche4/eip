<?php

namespace App\Domain\Properties\Actions;

use App\Domain\Properties\Data\Property;
use App\Domain\Properties\Support\OffMarketAccess;
use Illuminate\Contracts\Session\Session;
use Illuminate\Support\Facades\Cache;

/**
 * Tries an access code against the off-market listings and, when one matches, unlocks it for the session (2026-09-29,
 * per-listing codes 2026-10-14). From a listing's gate (`$slug`) only that listing is tried; from the selection's gate
 * every confidential listing is. Returns the listing opened, null otherwise.
 *
 * A four-digit code is small: on top of the per-IP throttle of the route, each gate (one listing, or the selection)
 * accepts at most `MAX_FAILURES` wrong codes per hour from everyone, then refuses every code until the hour has passed
 * (review 2026-10-14: 10 000 codes ÷ N listings and rotating IPs would otherwise find one in hours).
 */
final class UnlockOffMarket
{
    public const MAX_FAILURES = 20;

    public const LOCK_SECONDS = 3600;

    public function __construct(private ListProperties $properties) {}

    public function __invoke(string $code, Session $session, ?string $slug = null): ?Property
    {
        $candidates = $this->properties->all()->filter(fn (Property $p) => $p->offMarket && ($slug === null || $p->slug === $slug));
        if ($candidates->isEmpty()) {
            return null; // an unknown slug counts nothing: no cache entry per made-up slug
        }
        // One counter per listing across its languages (its reference), one for the selection's gate
        $gate = 'off_market:failures:'.($slug === null ? '*' : OffMarketAccess::key($candidates->first()));
        if ((int) Cache::get($gate, 0) >= self::MAX_FAILURES) {
            return null;
        }
        $match = $candidates->first(fn (Property $p) => OffMarketAccess::matches($p, $code));
        if ($match === null) {
            Cache::add($gate, 0, self::LOCK_SECONDS);
            Cache::increment($gate);

            return null;
        }
        OffMarketAccess::unlock($session, $match);

        return $match;
    }
}
