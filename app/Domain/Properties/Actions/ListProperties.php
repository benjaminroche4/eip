<?php

namespace App\Domain\Properties\Actions;

use App\Domain\Properties\Data\Property;
use Closure;
use Illuminate\Support\Collection;

/**
 * The properties on offer, newest first. **Source = the localized sample of `lang/{locale}/properties.php` until the
 * Sanity `estateProperty` type exists** (user decision 2026-09-25): swap `rows()` for a GROQ query then, nothing
 * else changes (page, navigation badge, sitemap all read this action). `count()` feeds the badge next to « Nos biens ».
 */
final class ListProperties
{
    /** @param  (Closure(?string): list<array<string, mixed>>)|null  $source  rows provider (tests, or the Sanity query later); null = the localized sample */
    public function __construct(private ?Closure $source = null) {}

    /** The catalogue: every listing not sold or let (sold ones only live on their own page, `all()`). @return Collection<int, Property> */
    public function __invoke(?string $locale = null): Collection
    {
        return $this->all($locale)->reject(fn (Property $p) => $p->isSold())->values();
    }

    /** Every row, sold ones included (the detail page keeps them online in noindex, 2026-09-28). @return Collection<int, Property> */
    public function all(?string $locale = null): Collection
    {
        return collect($this->rows($locale))->map(fn (array $row) => Property::fromArray($row))->values();
    }

    public function count(): int
    {
        return $this->__invoke()->count();
    }

    /**
     * Lowest and highest price of the listings per transaction (the bounds of the filters' price range, user decision
     * 2026-09-28); off-market listings stay out of it. A project without a listing gets `[0, 0]`.
     *
     * @return array{sale: array{min: int, max: int}, rent: array{min: int, max: int}}
     */
    public function priceBounds(): array
    {
        $bounds = [];
        foreach (['sale', 'rent'] as $transaction) {
            $prices = $this->__invoke()->filter(fn (Property $p) => $p->transaction === $transaction && ! $p->offMarket)->map(fn (Property $p) => $p->price);
            $bounds[$transaction] = ['min' => (int) ($prices->min() ?? 0), 'max' => (int) ($prices->max() ?? 0)];
        }

        return $bounds;
    }

    /** @return list<array<string, mixed>> */
    private function rows(?string $locale = null): array
    {
        if ($this->source !== null) {
            return ($this->source)($locale);
        }
        $rows = __('properties.sample', [], $locale);

        return is_array($rows) ? array_values($rows) : [];
    }
}
