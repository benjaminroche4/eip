<?php

namespace Tests\Feature;

use App\Domain\Contact\Models\ContactRequest;
use App\Domain\Newsletter\Models\NewsletterSubscriber;
use App\Domain\Valuation\Models\ValuationRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Factories + seeders: every entity has a fixture that produces valid rows and the documented states. */
class DatabaseSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_seeder_fills_every_entity(): void
    {
        $this->seed();

        $this->assertSame(1, User::count());
        $this->assertSame(14, ContactRequest::count());
        $this->assertSame(8, ContactRequest::whereNotNull('handled_at')->count());
        $this->assertSame(1, ContactRequest::whereNull('mail_sent_at')->count());
        $this->assertSame(24, NewsletterSubscriber::count());
        $this->assertSame(3, NewsletterSubscriber::whereNotNull('unsubscribed_at')->count());
        $this->assertSame(1, NewsletterSubscriber::whereNull('welcome_sent_at')->count());
        $this->assertSame(11, ValuationRequest::count());
        $this->assertSame(6, ValuationRequest::whereNotNull('handled_at')->count());
        $this->assertSame(1, ValuationRequest::whereNull('mail_sent_at')->count());
    }

    public function test_factories_produce_consistent_rows(): void
    {
        $request = ContactRequest::factory()->handled()->create();
        $this->assertContains($request->locale, ['fr', 'en']);
        $this->assertMatchesRegularExpression('/^\+(33|44)/', $request->phone);
        $this->assertTrue($request->handled_at->greaterThanOrEqualTo($request->created_at));

        $valuation = ValuationRequest::factory()->create();
        $this->assertLessThanOrEqual($valuation->rooms, $valuation->bedrooms);
        $this->assertStringEndsWith('Paris', $valuation->address);
        $this->assertIsArray($valuation->features);

        $subscriber = NewsletterSubscriber::factory()->unsubscribed()->create();
        $this->assertTrue($subscriber->unsubscribed_at->greaterThanOrEqualTo($subscriber->subscribed_at));
        $this->assertSame($subscriber->email, strtolower($subscriber->email));
    }
}
