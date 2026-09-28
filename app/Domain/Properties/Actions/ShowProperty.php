<?php

namespace App\Domain\Properties\Actions;

use App\Domain\Properties\Data\Property;
use App\Domain\Properties\Data\PropertyPage;
use Illuminate\Support\Collection;
use Mcamara\LaravelLocalization\Facades\LaravelLocalization;

/**
 * The detail page of a listing by its slug (2026-09-28): null when no published listing carries it (a confidential,
 * off-market listing has no public page until the gated area exists). The twin slugs come from the same row index in
 * the other languages' lists; « similar » = up to three other public listings of the same transaction, those of the
 * same arrondissement first, then the same type, then the rest.
 */
final class ShowProperty
{
    public const SIMILAR = 3;

    public function __construct(private ListProperties $properties) {}

    public function __invoke(string $slug, ?string $locale = null): ?PropertyPage
    {
        $locale ??= app()->getLocale();
        $list = ($this->properties)($locale);
        $index = $list->search(fn (Property $p) => $p->slug === $slug);
        if ($index === false) {
            return null;
        }
        $property = $list[$index];
        if ($property->offMarket) {
            return null;
        }

        $slugs = [];
        foreach (array_keys(LaravelLocalization::getSupportedLocales()) as $code) {
            $twin = $code === $locale ? $property : ($this->properties)($code)->get($index);
            if ($twin instanceof Property) {
                $slugs[$code] = $twin->slug;
            }
        }

        return new PropertyPage($property, $slugs, $this->similar($list, $property)->all());
    }

    /**
     * @param  Collection<int, Property>  $list
     * @return Collection<int, Property>
     */
    private function similar(Collection $list, Property $property): Collection
    {
        $rank = fn (Property $p) => match (true) {
            $p->arrondissement === $property->arrondissement => 0,
            $p->type === $property->type => 1,
            default => 2,
        };

        return $list
            ->filter(fn (Property $p) => $p->slug !== $property->slug && ! $p->offMarket && $p->transaction === $property->transaction)
            ->sortBy($rank)
            ->take(self::SIMILAR)
            ->values();
    }
}
