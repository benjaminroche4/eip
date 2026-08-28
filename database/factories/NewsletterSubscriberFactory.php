<?php

namespace Database\Factories;

use App\Domain\Newsletter\Models\NewsletterSubscriber;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<NewsletterSubscriber> */
class NewsletterSubscriberFactory extends Factory
{
    protected $model = NewsletterSubscriber::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        $subscribedAt = fake()->dateTimeBetween('-90 days');

        return [
            'email' => fake()->unique()->safeEmail(),
            'locale' => fake()->randomElement(['fr', 'fr', 'en']),
            'ip' => fake()->ipv4(),
            'user_agent' => fake()->userAgent(),
            'subscribed_at' => $subscribedAt,
            'unsubscribed_at' => null,
            'welcome_sent_at' => $subscribedAt,
            'created_at' => $subscribedAt,
            'updated_at' => $subscribedAt,
        ];
    }

    /** Opted out after subscribing. */
    public function unsubscribed(): static
    {
        return $this->state(fn (array $attributes) => ['unsubscribed_at' => fake()->dateTimeBetween($attributes['subscribed_at'])]);
    }

    /** Subscribed but the welcome e-mail failed (welcome_sent_at stays null). */
    public function welcomeFailed(): static
    {
        return $this->state(fn () => ['welcome_sent_at' => null]);
    }
}
