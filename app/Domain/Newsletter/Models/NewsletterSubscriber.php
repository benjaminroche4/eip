<?php

namespace App\Domain\Newsletter\Models;

use Database\Factories\NewsletterSubscriberFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/** An e-mail address subscribed from the public newsletter page (one row per address, re-activated on re-subscribe). */
class NewsletterSubscriber extends Model
{
    /** @use HasFactory<NewsletterSubscriberFactory> */
    use HasFactory;

    protected $fillable = ['email', 'locale', 'ip', 'user_agent', 'subscribed_at', 'unsubscribed_at', 'welcome_sent_at'];

    protected static function newFactory(): NewsletterSubscriberFactory
    {
        return NewsletterSubscriberFactory::new();
    }

    protected function casts(): array
    {
        return [
            'subscribed_at' => 'datetime',
            'unsubscribed_at' => 'datetime',
            'welcome_sent_at' => 'datetime',
        ];
    }
}
