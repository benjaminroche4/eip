<?php

namespace App\Domain\Properties\Support;

use App\Domain\Properties\Data\Property;
use Illuminate\Contracts\Session\Session;

/**
 * The gate of the confidential listings (2026-09-29): **each off-market listing has its own four-digit code** in the Studio
 * (Sanity `accessCode`, user decision 2026-10-14, replacing the agency-wide `OFF_MARKET_CODE`). A right code unlocks that
 * listing, in both languages, for the visitor's session (the session keeps the keys of the unlocked listings); the
 * off-market selection shows the unlocked ones. A listing without a code cannot be opened.
 */
final class OffMarketAccess
{
    public const SESSION_KEY = 'off_market_unlocked';

    public const LENGTH = 4;

    /** What identifies a listing across its languages: its reference, else its slug. */
    public static function key(Property $property): string
    {
        return $property->reference ?? $property->slug;
    }

    public static function isUnlocked(Session $session, Property $property): bool
    {
        return in_array(self::key($property), self::unlockedKeys($session), true);
    }

    /** @return list<string> */
    public static function unlockedKeys(Session $session): array
    {
        return array_values(array_filter((array) $session->get(self::SESSION_KEY, []), 'is_string'));
    }

    /** Constant-time comparison with the listing's own code; false when it has none. */
    public static function matches(Property $property, string $code): bool
    {
        return is_string($property->accessCode) && $property->accessCode !== '' && hash_equals($property->accessCode, $code);
    }

    public static function unlock(Session $session, Property $property): void
    {
        $session->put(self::SESSION_KEY, array_values(array_unique([...self::unlockedKeys($session), self::key($property)])));
    }
}
