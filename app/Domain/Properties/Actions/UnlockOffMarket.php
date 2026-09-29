<?php

namespace App\Domain\Properties\Actions;

use App\Domain\Properties\Support\OffMarketAccess;
use Illuminate\Contracts\Session\Session;

/** Tries an access code against the configured one and, when it matches, unlocks the off-market listings for the session (2026-09-29). */
final class UnlockOffMarket
{
    public function __invoke(string $code, Session $session): bool
    {
        if (! OffMarketAccess::matches($code)) {
            return false;
        }
        OffMarketAccess::unlock($session);

        return true;
    }
}
