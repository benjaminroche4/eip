<?php

namespace Database\Seeders;

use App\Domain\Newsletter\Models\NewsletterSubscriber;
use Illuminate\Database\Seeder;

/** Local data set: active subscribers in both languages, a few opt-outs, one welcome failure. */
class NewsletterSubscriberSeeder extends Seeder
{
    public function run(): void
    {
        NewsletterSubscriber::factory()->count(20)->create();
        NewsletterSubscriber::factory()->count(3)->unsubscribed()->create();
        NewsletterSubscriber::factory()->welcomeFailed()->create();
    }
}
