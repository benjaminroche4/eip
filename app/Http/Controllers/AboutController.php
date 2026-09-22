<?php

namespace App\Http\Controllers;

use App\Domain\Content\Actions\ListStats;
use App\Domain\Content\Actions\ListTeamMembers;
use App\Domain\Content\Actions\ListTestimonials;
use App\Domain\Content\Support\ContentList;
use Inertia\Inertia;
use Inertia\Response;

/** « À propos »: header, the manifesto + key figures, the team grid (portraits in public/images/team), the home testimonials block and the home CTA card. Content from `Domain/Content`. */
class AboutController extends Controller
{
    public function __invoke(ListTeamMembers $team, ListTestimonials $testimonials, ListStats $stats): Response
    {
        return Inertia::render('about', [
            'team' => ContentList::toArray($team()),
            'testimonials' => ContentList::toArray($testimonials()),
            'stats' => ContentList::toArray($stats()),
        ]);
    }
}
