<?php

namespace App\Http\Controllers;

use App\Domain\Contact\Actions\SendContactMessage;
use App\Domain\Contact\Data\ContactMessage;
use App\Domain\Content\Actions\ListArrondissements;
use App\Domain\Properties\Actions\ShowProperty;
use App\Http\Requests\ContactRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ContactController extends Controller
{
    public function show(Request $request, ListArrondissements $arrondissements): Response
    {
        return Inertia::render('contact', ['topics' => ContactMessage::TOPICS, 'prefill' => $this->prefill($request, $arrondissements)]);
    }

    /**
     * From an arrondissement profile (`?district=14`, 2026-09-25): the topic and a message naming the arrondissement,
     * so the visitor lands on a form that already says what they came for. Null without a valid parameter.
     *
     * @return array{topic: string, message: string}|null
     */
    private function prefill(Request $request, ListArrondissements $arrondissements): ?array
    {
        // From a listing's detail page (`?property=slug`, 2026-09-28): the listing named in the message
        $slug = (string) $request->query('property', '');
        if ($slug !== '' && ($page = app(ShowProperty::class)($slug)) !== null) {
            $p = $page->property;
            $name = collect($arrondissements())->firstWhere('n', $p->arrondissement)?->name ?? "Paris {$p->arrondissement}";

            return [
                'topic' => $p->transaction === 'rent' ? 'other' : 'buy',
                'message' => __('ui.contact.property_prefill', ['title' => $p->title, 'name' => $name, 'reference' => strtoupper(substr(md5($p->slug), 0, 6))]),
            ];
        }
        $n = DistrictsController::selectedFrom($request);
        if ($n === null) {
            return null;
        }
        foreach ($arrondissements() as $a) {
            if ($a->n === $n) {
                return ['topic' => 'buy', 'message' => __('ui.contact.district_prefill', ['name' => $a->name, 'areas' => $a->areas])];
            }
        }

        return null;
    }

    public function store(ContactRequest $request, SendContactMessage $send): RedirectResponse
    {
        $message = ContactMessage::fromRequest($request);
        $send($message);

        // The confirmation shows which number the advisor will call back.
        return back()->with('success', __('ui.contact.sent'))->with('callback_phone', $message->phone);
    }
}
