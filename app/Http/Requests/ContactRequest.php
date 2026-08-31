<?php

namespace App\Http\Requests;

use App\Domain\Contact\Data\ContactMessage;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ContactRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:80'],
            'last_name' => ['required', 'string', 'max:80'],
            'email' => ['required', 'string', 'email:rfc', 'max:190'],
            'phone' => ['required', 'string', 'max:30', 'regex:/^\+?(?:[\s().-]*\d){6,15}[\s().-]*$/'], // 6-15 digits (E.164), separators allowed
            'topic' => ['required', Rule::in(ContactMessage::TOPICS)],
            'message' => ['nullable', 'string', 'max:2000'],
            'consent' => ['accepted'],
            'website' => ['prohibited'], // honeypot: bots fill it, humans never see it
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return ['consent.accepted' => __('ui.contact.consent_required')];
    }

    /** @return array<string, string> */
    public function attributes(): array
    {
        return [
            'first_name' => __('ui.contact.first_name'),
            'last_name' => __('ui.contact.last_name'),
            'email' => __('ui.contact.email'),
            'phone' => __('ui.contact.phone'),
            'topic' => __('ui.contact.topic'),
            'message' => __('ui.contact.message'),
        ];
    }
}
