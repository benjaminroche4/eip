<?php

namespace App\Http\Controllers;

use App\Domain\Content\Support\ContentList;
use App\Domain\Properties\Actions\ListProperties;
use Inertia\Inertia;
use Inertia\Response;

/**
 * « Biens off-market » (`/biens-off-market` ↔ `/en/off-market-properties`, 2026-09-28): the confidential selection,
 * **to be gated by an access code** (user decision: « il faut un code pour y accéder » — the gate comes after the
 * card design round). Never indexed. Rows = the sample's `off_market` rows until Sanity carries the flag.
 */
class OffMarketController extends Controller
{
    public function __invoke(ListProperties $properties): Response
    {
        $rows = $properties()->where('offMarket', true)->values();

        return Inertia::render('off-market', [
            'properties' => ContentList::toArray($rows->all()),
        ]);
    }
}
