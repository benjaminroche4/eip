<?php

namespace App\Http\Controllers;

use App\Domain\Content\Actions\ListArrondissements;
use App\Domain\Content\Support\ContentList;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * « Les arrondissements de Paris » (2026-09-22): interactive map (hover / focus / tap colours the arrondissement) and,
 * under it, the selected arrondissement's detailed profile (summary, strengths, housing, metro / RER / stations,
 * sights, food, green spaces, schools — 2026-09-25). Data from `ui.districts.items` through `Domain/Content`
 * (`Arrondissement` DTO validated by `ArrayShape`; prices rounded from the latest Notaires du Grand Paris figures —
 * to check before each release, real numbers rule). `?arrondissement=14` (FR) / `?district=14` (EN) preselects a
 * profile so a link can be shared (2026-09-25); without it the 6e opens (`DEFAULT`, the URL untouched); the canonical
 * stays the bare page.
 */
class DistrictsController extends Controller
{
    public const PARAMS = ['arrondissement', 'district'];

    /** Opened by default (user decision 2026-09-25): the agency's own arrondissement, the most valued market, also the map's demo. */
    public const DEFAULT = 6;

    public function __invoke(Request $request, ListArrondissements $arrondissements): Response
    {
        return Inertia::render('districts', [
            'items' => ContentList::toArray($arrondissements()),
            'selected' => self::selectedFrom($request) ?? self::DEFAULT,
        ]);
    }

    /** The arrondissement asked for in the query string (either language's parameter), 1-20 or null. */
    public static function selectedFrom(Request $request): ?int
    {
        foreach (self::PARAMS as $param) {
            $value = $request->query($param);
            if (is_string($value) && ctype_digit($value) && (int) $value >= 1 && (int) $value <= 20) {
                return (int) $value;
            }
        }

        return null;
    }
}
