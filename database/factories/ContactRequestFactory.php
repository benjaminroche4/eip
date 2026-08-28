<?php

namespace Database\Factories;

use App\Domain\Contact\Data\ContactMessage;
use App\Domain\Contact\Models\ContactRequest;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<ContactRequest> */
class ContactRequestFactory extends Factory
{
    protected $model = ContactRequest::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        $locale = fake()->randomElement(['fr', 'en']);
        $faker = fake($locale === 'fr' ? 'fr_FR' : 'en_GB');
        $sentAt = fake()->dateTimeBetween('-30 days');

        return [
            'first_name' => $faker->firstName(),
            'last_name' => $faker->lastName(),
            'email' => fake()->unique()->safeEmail(),
            'phone' => $locale === 'fr' ? '+33 6 '.fake()->numerify('## ## ## ##') : '+44 7'.fake()->numerify('### ### ###'),
            'topic' => fake()->randomElement(ContactMessage::TOPICS),
            'message' => fake()->boolean(70) ? $faker->paragraph(2) : null,
            'locale' => $locale,
            'ip' => fake()->ipv4(),
            'user_agent' => fake()->userAgent(),
            'referer' => fake()->boolean(60) ? config('app.url').'/'.fake()->randomElement(['', 'acheter-immobilier-paris', 'en/sell-property-paris', 'blog']) : null,
            'consent_at' => $sentAt,
            'mail_sent_at' => $sentAt,
            'handled_at' => null,
            'created_at' => $sentAt,
            'updated_at' => $sentAt,
        ];
    }

    /** Answered by the team. */
    public function handled(): static
    {
        return $this->state(fn (array $attributes) => ['handled_at' => fake()->dateTimeBetween($attributes['created_at'])]);
    }

    /** Saved but the agency e-mail failed (mail_sent_at stays null). */
    public function mailFailed(): static
    {
        return $this->state(fn () => ['mail_sent_at' => null]);
    }
}
