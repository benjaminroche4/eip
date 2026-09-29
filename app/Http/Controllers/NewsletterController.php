<?php

namespace App\Http\Controllers;

use App\Domain\Newsletter\Actions\SubscribeToNewsletter;
use App\Domain\Newsletter\Data\NewsletterSubscription;
use App\Domain\Newsletter\Support\NextIssue;
use App\Http\Requests\NewsletterRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NewsletterController extends Controller
{
    public function show(Request $request): Response
    {
        return Inertia::render('newsletter', [
            'nextIssue' => NextIssue::compute(),
            // « Recevoir les nouveaux biens » from the listing: the search to attach, echoed to the form (2026-09-28)
            'search' => mb_substr(ltrim((string) $request->query('search', ''), '?'), 0, 500) ?: null,
        ]);
    }

    public function store(NewsletterRequest $request, SubscribeToNewsletter $subscribe): RedirectResponse
    {
        $subscribe(NewsletterSubscription::fromRequest($request));

        // Own flash key: a contact `success` left in the session must never show up as a subscription.
        return back()->with('newsletter_success', __('ui.newsletter.sent'));
    }
}
