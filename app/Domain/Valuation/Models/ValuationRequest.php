<?php

namespace App\Domain\Valuation\Models;

use Database\Factories\ValuationRequestFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/** A valuation request stored before it is e-mailed to the agency (kept even if the e-mail fails). */
class ValuationRequest extends Model
{
    /** @use HasFactory<ValuationRequestFactory> */
    use HasFactory;

    protected $fillable = [
        'property_type', 'full_name', 'email', 'phone', 'address', 'surface', 'floor', 'elevator', 'rooms', 'bedrooms',
        'features', 'condition',
        'estimated_value', 'contact_method', 'message', 'locale', 'ip', 'user_agent', 'referer',
        'consent_at', 'mail_sent_at', 'handled_at',
    ];

    protected static function newFactory(): ValuationRequestFactory
    {
        return ValuationRequestFactory::new();
    }

    protected function casts(): array
    {
        return [
            'surface' => 'integer',
            'rooms' => 'integer',
            'bedrooms' => 'integer',
            'estimated_value' => 'integer',
            'elevator' => 'boolean',
            'features' => 'array',
            'consent_at' => 'datetime',
            'mail_sent_at' => 'datetime',
            'handled_at' => 'datetime',
        ];
    }
}
