<?php

namespace App\Domain\Properties\Data;

/**
 * Everything the detail page of a listing needs (2026-09-28): the property, its slug in every locale (the rows of the
 * sample sit at the same index in each language; Sanity will carry the translations) and up to three similar
 * listings (same transaction, same arrondissement first, then same type).
 */
final readonly class PropertyPage
{
    /**
     * @param  array<string, string>  $slugs  locale → slug of the same listing
     * @param  list<Property>  $similar
     */
    public function __construct(
        public Property $property,
        public array $slugs,
        public array $similar,
    ) {}
}
