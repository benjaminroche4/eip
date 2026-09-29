<?php

namespace App\Http\Controllers;

use App\Domain\Content\Support\ContentList;
use App\Domain\Properties\Actions\ListProperties;
use App\Domain\Properties\Actions\UnlockOffMarket;
use App\Domain\Properties\Support\OffMarketAccess;
use App\Http\Requests\OffMarketUnlockRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * « Biens off-market » (`/biens-off-market` ↔ `/en/off-market-properties`, 2026-09-28): the confidential selection,
 * **gated by a six-digit access code** (user decision 2026-09-29): locked, the page renders the gate `properties/locked`;
 * `unlock` (POST, `throttle:off_market`) checks the code and, when right, unlocks the session and sends the visitor
 * back to the page they came from (the selection or an off-market detail page). Never indexed.
 */
class OffMarketController extends Controller
{
    public function __invoke(Request $request, ListProperties $properties): Response
    {
        if (! OffMarketAccess::isUnlocked($request->session())) {
            return Inertia::render('properties/locked', ['teaser' => null]);
        }
        $rows = $properties()->where('offMarket', true)->values();

        return Inertia::render('off-market', [
            'properties' => ContentList::toArray($rows->all()),
        ]);
    }

    public function unlock(OffMarketUnlockRequest $request, UnlockOffMarket $unlock): RedirectResponse
    {
        if (! $unlock($request->string('code')->toString(), $request->session())) {
            throw ValidationException::withMessages(['code' => __('ui.off_market.code_invalid')]);
        }

        return back();
    }
}
