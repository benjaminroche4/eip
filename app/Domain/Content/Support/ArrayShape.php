<?php

namespace App\Domain\Content\Support;

use InvalidArgumentException;

/**
 * The guard `lang/{locale}/ui.php` does not have: an editorial item must carry the keys (and scalar types)
 * its DTO expects, in both languages. A missing key fails loudly here instead of as an undefined index in a view.
 */
final class ArrayShape
{
    /**
     * @param  array<string, mixed>  $data  the raw item from ui.php
     * @param  array<string, 'string'|'array'>  $required  expected key => type
     * @param  array<string, 'string'|'array'>  $optional  keys that may be absent (or null) but must match the type when present
     */
    public static function validate(string $type, array $data, array $required, array $optional = []): void
    {
        $missing = array_keys(array_diff_key($required, $data));
        if ($missing !== []) {
            throw new InvalidArgumentException(sprintf(
                '%s from ui.php is missing the key(s) "%s" (got: %s).',
                $type,
                implode('", "', $missing),
                $data === [] ? 'nothing' : implode(', ', array_keys($data)),
            ));
        }

        foreach ([...$required, ...$optional] as $key => $expected) {
            if (! array_key_exists($key, $data) || ($data[$key] === null && isset($optional[$key]))) {
                continue;
            }
            $valid = $expected === 'array' ? is_array($data[$key]) : is_string($data[$key]);
            if (! $valid) {
                throw new InvalidArgumentException(sprintf('%s from ui.php: "%s" must be a %s, %s given.', $type, $key, $expected, get_debug_type($data[$key])));
            }
        }
    }
}
