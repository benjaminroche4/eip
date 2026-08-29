<?php

namespace App\Http\Controllers;

use App\Domain\Valuation\Actions\SendValuationRequest;
use App\Domain\Valuation\Data\Valuation;
use App\Http\Requests\EstimateRequest;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class EstimateController extends Controller
{
    public function show(): Response
    {
        return Inertia::render('estimate', [
            'propertyTypes' => Valuation::PROPERTY_TYPES,
            'contactMethods' => Valuation::CONTACT_METHODS,
            'floors' => Valuation::FLOORS,
            'features' => Valuation::FEATURES,
            'conditions' => Valuation::CONDITIONS,
        ]);
    }

    public function store(EstimateRequest $request, SendValuationRequest $send): RedirectResponse
    {
        $stored = $send(Valuation::fromRequest($request));

        return back()->with('success', __('ui.estimate.sent'))->with('valuation_reference', $stored->reference);
    }
}
