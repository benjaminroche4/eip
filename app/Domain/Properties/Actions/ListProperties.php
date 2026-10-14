<?php

namespace App\Domain\Properties\Actions;

use App\Domain\Properties\Data\Property;
use Closure;
use Illuminate\Support\Collection;

/**
 * The properties on offer, newest first. **Source = Sanity** (`FetchSanityProperties`, type `estateProperty`, one
 * cached query for both languages — wired 2026-10-14); the tests pass their rows through `$source` (the fixture of
 * `tests/Fixtures/properties`). `count()` feeds the badge next to « Nos biens »; the page, the sitemap, the off-market
 * selection and the detail pages all read this action.
 */
final class ListProperties
{
    /** @param  (Closure(string): list<array<string, mixed>>)|null  $source  rows provider by locale (tests); null = Sanity */
    public function __construct(private FetchSanityProperties $fetch, private ?Closure $source = null) {}

    /** The catalogue: every listing not sold or let (sold ones only live on their own page, `all()`). @return Collection<int, Property> */
    public function __invoke(?string $locale = null): Collection
    {
        return $this->all($locale)->reject(fn (Property $p) => $p->isSold())->values();
    }

    /** Every row, sold ones included (the detail page keeps them online in noindex, 2026-09-28). @return Collection<int, Property> */
    public function all(?string $locale = null): Collection
    {
        return collect($this->rows($locale ?? app()->getLocale()))->map(fn (array $row) => Property::fromArray($row))->values();
    }

    public function count(): int
    {
        return $this->__invoke()->count();
    }

    /**
     * Lowest and highest price of the listings per transaction (the bounds of the filters' price range, user decision
     * 2026-09-28); off-market listings and undisclosed prices stay out of it. A project without a listing gets `[0, 0]`.
     *
     * @return array{sale: array{min: int, max: int}, rent: array{min: int, max: int}}
     */
    public function priceBounds(): array
    {
        $bounds = [];
        foreach (['sale', 'rent'] as $transaction) {
            $prices = $this->__invoke()->filter(fn (Property $p) => $p->transaction === $transaction && ! $p->hidesPrice())->map(fn (Property $p) => $p->price);
            $bounds[$transaction] = ['min' => (int) ($prices->min() ?? 0), 'max' => (int) ($prices->max() ?? 0)];
        }

        return $bounds;
    }

    /** @return list<array<string, mixed>> */
    private function rows(string $locale): array
    {
        if ($this->source !== null) {
            return array_values(($this->source)($locale));
        }

        return ($this->fetch)()[$locale] ?? [];
    }
}
