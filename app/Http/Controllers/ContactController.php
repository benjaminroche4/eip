<?php

namespace App\Http\Controllers;

use App\Domain\Contact\Actions\SendContactMessage;
use App\Domain\Contact\Data\ContactMessage;
use App\Http\Requests\ContactRequest;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ContactController extends Controller
{
    public function show(): Response
    {
        return Inertia::render('contact', ['topics' => ContactMessage::TOPICS]);
    }

    public function store(ContactRequest $request, SendContactMessage $send): RedirectResponse
    {
        $send(ContactMessage::fromRequest($request));

        return back()->with('success', __('ui.contact.sent'));
    }
}
