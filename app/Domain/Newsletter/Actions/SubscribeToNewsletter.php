<?php

namespace App\Domain\Newsletter\Actions;

use App\Domain\Newsletter\Data\NewsletterSubscription;
use App\Domain\Newsletter\Models\NewsletterSubscriber;
use App\Mail\NewsletterWelcomeMail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * One row per address: a new address is created, an unsubscribed one is re-activated, an address already
 * active is returned untouched (no second welcome e-mail) — the response is identical in every case so the
 * form never reveals whether an address is subscribed.
 * The subscriber then receives a welcome e-mail in their language; a mail outage never loses the subscription
 * (`welcome_sent_at` stays null and the error is logged).
 */
final class SubscribeToNewsletter
{
    public function __invoke(NewsletterSubscription $subscription): NewsletterSubscriber
    {
        $subscriber = NewsletterSubscriber::firstOrNew(['email' => $subscription->email]);

        if ($subscriber->exists && $subscriber->unsubscribed_at === null) {
            return $subscriber;
        }

        $subscriber->fill([
            'locale' => $subscription->locale,
            'ip' => $subscription->ip,
            'user_agent' => $subscription->userAgent,
            'subscribed_at' => now(),
            'unsubscribed_at' => null,
        ])->save();

        try {
            Mail::to($subscriber->email)->send(new NewsletterWelcomeMail($subscriber));
            $subscriber->update(['welcome_sent_at' => now()]);
        } catch (Throwable $e) {
            Log::warning('Newsletter subscriber #'.$subscriber->id.': welcome e-mail failed: '.$e->getMessage());
        }

        return $subscriber;
    }
}
