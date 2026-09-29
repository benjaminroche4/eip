<?php

namespace App\Domain\Properties\Support;

use Illuminate\Contracts\Session\Session;

/**
 * The gate of the confidential listings (2026-09-29): a six-digit code handed by the agency (`OFF_MARKET_CODE`)
 * unlocks, for the visitor's session, the off-market selection and every off-market detail page. Without a configured
 * code nothing unlocks.
 */
final class OffMarketAccess
{
    public const SESSION_KEY = 'off_market_unlocked';

    public const LENGTH = 6;

    public static function isUnlocked(Session $session): bool
    {
        return $session->get(self::SESSION_KEY) === true;
    }

    /** Constant-time comparison with the configured code; false when none is configured. */
    public static function matches(string $code): bool
    {
        $expected = config('properties.off_market_code');

        return is_string($expected) && $expected !== '' && hash_equals($expected, $code);
    }

    public static function unlock(Session $session): void
    {
        $session->put(self::SESSION_KEY, true);
    }
}
