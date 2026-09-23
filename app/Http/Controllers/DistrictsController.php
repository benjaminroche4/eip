<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

/**
 * « Les arrondissements de Paris » (2026-09-22): interactive map (hover / focus / tap colours the arrondissement and
 * fills a card with its key facts) and, under it, the table of the 20 arrondissements with the buyer profile that
 * fits best, the average price per m² and one asset. Data from `ui.districts.items` (prices rounded from the latest
 * Notaires du Grand Paris figures — to check before each release, real numbers rule).
 */
class DistrictsController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('districts', [
            'items' => array_values((array) __('ui.districts.items')),
        ]);
    }
}
