<?php

namespace App\Http\Controllers;

use App\Domain\Search\Actions\SearchContent;
use App\Domain\Search\Data\SearchQuery;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Search page. SSR on first hit, then refined client-side through Inertia
 * partial reloads (`only: ['results', 'indexing']`).
 */
class SearchController extends Controller
{
    public function __invoke(Request $request, SearchContent $search): Response
    {
        $query = SearchQuery::fromRequest($request);

        return Inertia::render('search', [
            'filters' => ['q' => $query->term],
            'results' => fn () => $search($query)->toArray(),
            'indexing' => function () use ($query, $search) {
                $results = $search($query);

                return [
                    'noindex' => ! $query->isIndexable(),
                    'prev' => $results->hasPrevious() ? route('search', $query->toRouteParams($query->page - 1)) : null,
                    'next' => $results->hasNext() ? route('search', $query->toRouteParams($query->page + 1)) : null,
                ];
            },
        ]);
    }
}
