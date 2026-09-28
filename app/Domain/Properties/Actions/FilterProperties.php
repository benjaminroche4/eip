<?php

namespace App\Domain\Properties\Actions;

use App\Domain\Properties\Data\PropertyListing;
use App\Domain\Properties\Data\PropertyQuery;

/**
 * Applies a `PropertyQuery` (filters + page) on the listing. In memory today (the sample is small); once Sanity is
 * wired, the filters and the slice move into the GROQ query and this action keeps the same signature.
 */
final class FilterProperties
{
    public function __construct(private ListProperties $list) {}

    public function __invoke(PropertyQuery $query, ?string $locale = null): PropertyListing
    {
        $matching = $query->sort(($this->list)($locale)->filter(fn ($property) => $query->matches($property))->values());

        return new PropertyListing(
            items: $matching->slice($query->offset(), $query->perPage)->values(),
            total: $matching->count(),
            page: $query->page,
            perPage: $query->perPage,
        );
    }
}
