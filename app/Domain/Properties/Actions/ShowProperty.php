<?php

namespace App\Domain\Properties\Actions;

use App\Domain\Properties\Data\Property;
use App\Domain\Properties\Data\PropertyPage;
use Illuminate\Support\Collection;
use Mcamara\LaravelLocalization\Facades\LaravelLocalization;

/**
 * The detail page of a listing by its slug (2026-09-28): null when no published listing carries it (a confidential,
 * off-market listing has no public page until the gated area exists; a sold one keeps its page). The twin slugs come
 * from the same row index in the other languages' lists; « similar » = up to six other catalogue listings of the same
 * transaction, same budget ± 20 % and rooms first, then the same arrondissement, then the same type, then the rest;
 * « neighbours » = the previous and next catalogue listings of the same transaction.
 */
final class ShowProperty
{
    public const SIMILAR = 6;

    public function __construct(private ListProperties $properties) {}

    /** @param  bool  $withOffMarket  also resolve a confidential listing (its page is gated by `OffMarketAccess`, 2026-09-29) */
    public function __invoke(string $slug, ?string $locale = null, bool $withOffMarket = false): ?PropertyPage
    {
        $locale ??= app()->getLocale();
        $list = $this->properties->all($locale);
        $index = $list->search(fn (Property $p) => $p->slug === $slug);
        if ($index === false) {
            return null;
        }
        $property = $list[$index];
        if ($property->offMarket && ! $withOffMarket) {
            return null;
        }

        $slugs = [];
        foreach (array_keys(LaravelLocalization::getSupportedLocales()) as $code) {
            $twin = $code === $locale ? $property : $this->properties->all($code)->get($index);
            if ($twin instanceof Property) {
                $slugs[$code] = $twin->slug;
            }
        }

        $catalogue = $list->reject(fn (Property $p) => $p->isSold() || $p->offMarket)->values();

        return new PropertyPage($property, $slugs, $this->similar($catalogue, $property)->all(), ...$this->neighbours($catalogue, $property));
    }

    /**
     * @param  Collection<int, Property>  $list
     * @return Collection<int, Property>
     */
    private function similar(Collection $list, Property $property): Collection
    {
        // Smarter ranking (2026-09-28): same budget ± 20 % and same number of rooms first, then the arrondissement, then the type
        $sameBudget = fn (Property $p) => abs($p->price - $property->price) <= $property->price * 0.2;
        $rank = fn (Property $p) => match (true) {
            $sameBudget($p) && $p->rooms === $property->rooms => 0,
            $p->arrondissement === $property->arrondissement => 1,
            $p->type === $property->type => 2,
            default => 3,
        };

        return $list
            ->filter(fn (Property $p) => $p->slug !== $property->slug && $p->transaction === $property->transaction)
            ->sortBy($rank)
            ->take(self::SIMILAR)
            ->values();
    }

    /**
     * Previous / next listing of the same transaction in the catalogue's order (2026-09-28).
     *
     * @param  Collection<int, Property>  $list
     * @return array{0: ?Property, 1: ?Property}
     */
    private function neighbours(Collection $list, Property $property): array
    {
        $same = $list->filter(fn (Property $p) => $p->transaction === $property->transaction)->values();
        $i = $same->search(fn (Property $p) => $p->slug === $property->slug);
        if ($i === false) {
            return [null, null];
        }

        return [$same->get($i - 1), $same->get($i + 1)];
    }
}
