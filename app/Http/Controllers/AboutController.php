<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

/** « À propos »: header, the manifesto + key figures (`about.stats`), the team grid (`team.members` in lang/{locale}/ui.php, portraits in public/images/team) the home testimonials block and the home CTA card. */
class AboutController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('about', ['team' => __('ui.team.members'), 'testimonials' => __('ui.testimonials.items'), 'stats' => __('ui.about.stats')]);
    }
}
