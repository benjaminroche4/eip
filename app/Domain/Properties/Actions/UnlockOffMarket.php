<?php

namespace App\Domain\Properties\Actions;

use App\Domain\Properties\Data\Property;
use App\Domain\Properties\Support\OffMarketAccess;
use Illuminate\Contracts\Session\Session;

/**
 * Tries an access code against the off-market listings and, when one matches, unlocks it for the session (2026-09-29,
 * per-listing codes 2026-10-14). From a listing's gate (`$slug`) only that listing is tried; from the selection's gate
 * every confidential listing is. Returns the listing opened, null otherwise.
 */
final class UnlockOffMarket
{
    public function __construct(private ListProperties $properties) {}

    public function __invoke(string $code, Session $session, ?string $slug = null): ?Property
    {
        $candidates = $this->properties->all()->filter(fn (Property $p) => $p->offMarket && ($slug === null || $p->slug === $slug));
        $match = $candidates->first(fn (Property $p) => OffMarketAccess::matches($p, $code));
        if ($match === null) {
            return null;
        }
        OffMarketAccess::unlock($session, $match);

        return $match;
    }
}
