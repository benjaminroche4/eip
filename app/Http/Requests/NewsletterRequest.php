<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class NewsletterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email:rfc', 'max:190'],
            'website' => ['prohibited'], // honeypot: bots fill it, humans never see it
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return ['email.email' => __('ui.newsletter.email_invalid'), 'email.required' => __('ui.newsletter.email_invalid')];
    }

    /** @return array<string, string> */
    public function attributes(): array
    {
        return ['email' => __('ui.newsletter.email')];
    }
}
