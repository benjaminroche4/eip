<?php

namespace App\Http\Requests;

use App\Domain\Valuation\Data\Valuation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EstimateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'property_type' => ['required', Rule::in(Valuation::PROPERTY_TYPES)],
            'full_name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'string', 'email:rfc', 'max:190'],
            'phone' => ['required', 'string', 'max:30', 'regex:/^\+?(?:[\s().-]*\d){6,15}[\s().-]*$/'], // 6-15 digits (E.164), separators allowed
            'address' => ['required', 'string', 'max:255'],
            'surface' => ['required', 'integer', 'min:5', 'max:999'],
            'floor' => ['nullable', Rule::in(Valuation::FLOORS)],
            'elevator' => ['nullable', 'boolean'],
            'rooms' => ['required', 'integer', 'min:1', 'max:10'],
            'bedrooms' => ['required', 'integer', 'min:0', 'max:10', 'lte:rooms'],
            'features' => ['nullable', 'array'],
            'features.*' => [Rule::in(Valuation::FEATURES)],
            'condition' => ['nullable', Rule::in(Valuation::CONDITIONS)],
            'estimated_value' => ['nullable', 'integer', 'min:10000', 'max:500000000'],
            'contact_method' => ['required', Rule::in(Valuation::CONTACT_METHODS)],
            'message' => ['nullable', 'string', 'max:2000'],
            'consent' => ['accepted'],
            'website' => ['prohibited'], // honeypot: bots fill it, humans never see it
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return ['consent.accepted' => __('ui.estimate.consent_required')];
    }

    /** @return array<string, string> */
    public function attributes(): array
    {
        return [
            'property_type' => __('ui.estimate.property_type'),
            'full_name' => __('ui.estimate.full_name'),
            'email' => __('ui.estimate.email'),
            'phone' => __('ui.estimate.phone'),
            'address' => __('ui.estimate.address'),
            'surface' => __('ui.estimate.surface'),
            'floor' => __('ui.estimate.floor'),
            'condition' => __('ui.estimate.condition'),
            'rooms' => __('ui.estimate.rooms'),
            'bedrooms' => __('ui.estimate.bedrooms'),
            'estimated_value' => __('ui.estimate.estimated_value'),
            'contact_method' => __('ui.estimate.contact_method'),
            'message' => __('ui.estimate.message'),
        ];
    }
}
