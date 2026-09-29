<?php

namespace App\Http\Requests;

use App\Domain\Properties\Support\OffMarketAccess;
use Illuminate\Foundation\Http\FormRequest;

/** The six-digit access code typed on the off-market gate (2026-09-29). */
class OffMarketUnlockRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return ['code' => ['required', 'string', 'digits:'.OffMarketAccess::LENGTH]];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return ['code.required' => __('ui.off_market.code_required'), 'code.digits' => __('ui.off_market.code_format'), 'code.string' => __('ui.off_market.code_format')];
    }
}
