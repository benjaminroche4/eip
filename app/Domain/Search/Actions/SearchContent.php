<?php

namespace App\Domain\Search\Actions;

use App\Domain\Search\Data\SearchQuery;
use App\Domain\Search\Data\SearchResults;

/**
 * Single-purpose action: run a search and paginate it.
 *
 * Replace the placeholder dataset with your real source (Eloquent query,
 * Laravel Scout, Meilisearch…) while keeping the SearchResults contract.
 */
final class SearchContent
{
    public function __invoke(SearchQuery $query): SearchResults
    {
        $all = collect(range(1, 42))
            ->map(fn (int $i) => [
                'id' => $i,
                'title' => "Résultat n°$i",
                'excerpt' => "Description courte du résultat numéro $i.",
                'url' => "/items/$i",
            ])
            ->when($query->isFiltered(), fn ($c) => $c->filter(
                fn ($r) => str_contains(mb_strtolower($r['title']), mb_strtolower($query->term))
            ));

        return new SearchResults(
            items: $all->forPage($query->page, $query->perPage),
            total: $all->count(),
            currentPage: $query->page,
            perPage: $query->perPage,
        );
    }
}
