<?php

namespace App\Http\Controllers;

use App\Domain\Content\Support\ContentList;
use App\Domain\Properties\Actions\ListProperties;
use App\Domain\Properties\Actions\UnlockOffMarket;
use App\Domain\Properties\Data\Property;
use App\Domain\Properties\Support\OffMarketAccess;
use App\Http\Requests\OffMarketUnlockRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * « Biens off-market » (`/biens-off-market` ↔ `/en/off-market-properties`, 2026-09-28): the confidential selection,
 * **gated by the listings' own four-digit access codes** (user decision 2026-09-29, per-listing codes from Sanity
 * 2026-10-14): without an unlocked listing the page renders the gate `properties/locked`, otherwise the listings the
 * session has opened; `unlock` (POST, `throttle:off_market`) tries the code (against one listing when `property` names
 * it, else all) and sends the visitor back to the page they came from. Never indexed.
 */
class OffMarketController extends Controller
{
    public function __invoke(Request $request, ListProperties $properties): Response
    {
        $rows = $properties()->filter(fn (Property $p) => $p->offMarket && OffMarketAccess::isUnlocked($request->session(), $p))->values();
        if ($rows->isEmpty()) {
            return Inertia::render('properties/locked', ['teaser' => null]);
        }

        return Inertia::render('off-market', [
            'properties' => ContentList::toArray($rows->all()),
        ]);
    }

    public function unlock(OffMarketUnlockRequest $request, UnlockOffMarket $unlock): RedirectResponse
    {
        if ($unlock($request->string('code')->toString(), $request->session(), $request->input('property')) === null) {
            throw ValidationException::withMessages(['code' => __('ui.off_market.code_invalid')]);
        }

        return back();
    }
}
