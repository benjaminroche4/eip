<?php

namespace App\Domain\Contact\Models;

use Database\Factories\ContactRequestFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/** A contact request stored before it is e-mailed to the agency (kept even if the e-mail fails). */
class ContactRequest extends Model
{
    /** @use HasFactory<ContactRequestFactory> */
    use HasFactory;

    protected $fillable = [
        'first_name', 'last_name', 'email', 'phone', 'topic', 'message', 'locale',
        'ip', 'user_agent', 'referer', 'consent_at', 'mail_sent_at', 'handled_at',
    ];

    protected static function newFactory(): ContactRequestFactory
    {
        return ContactRequestFactory::new();
    }

    protected function casts(): array
    {
        return [
            'consent_at' => 'datetime',
            'mail_sent_at' => 'datetime',
            'handled_at' => 'datetime',
        ];
    }
}
