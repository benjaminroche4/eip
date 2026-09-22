<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

/** « Vendre »: intro, wide photo, then the photo mosaic whose alt texts come from `ui.sell.gallery` (2026-09-22); the rest of the page is still to come. */
class SellController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('sell', [
            'gallery' => __('ui.sell.gallery'),
        ]);
    }
}
