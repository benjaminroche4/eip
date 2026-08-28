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
        $message = ContactMessage::fromRequest($request);
        $send($message);

        // The confirmation shows which number the advisor will call back.
        return back()->with('success', __('ui.contact.sent'))->with('callback_phone', $message->phone);
    }
}
