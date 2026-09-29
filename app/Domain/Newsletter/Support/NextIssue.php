<?php

namespace App\Domain\Newsletter\Support;

use Illuminate\Support\Carbon;

/** The next newsletter issue: every Monday morning (today counts when it is a Monday). Shared by the newsletter page and the listings' alert form. */
final class NextIssue
{
    /** @return array{iso: string, label: string} */
    public static function compute(): array
    {
        $today = Carbon::today();
        $next = $today->isMonday() ? $today : $today->next(Carbon::MONDAY);

        return ['iso' => $next->toDateString(), 'label' => $next->isoFormat('dddd D MMMM')];
    }
}
