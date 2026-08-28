<?php

namespace Database\Factories;

use App\Domain\Valuation\Data\Valuation;
use App\Domain\Valuation\Models\ValuationRequest;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<ValuationRequest> */
class ValuationRequestFactory extends Factory
{
    protected $model = ValuationRequest::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        $locale = fake()->randomElement(['fr', 'en']);
        $faker = fake($locale === 'fr' ? 'fr_FR' : 'en_GB');
        $sentAt = fake()->dateTimeBetween('-30 days');
        $rooms = fake()->numberBetween(1, 10);
        $surface = fake()->numberBetween(25, 400);

        return [
            'property_type' => fake()->randomElement(Valuation::PROPERTY_TYPES),
            'full_name' => $faker->name(),
            'email' => fake()->unique()->safeEmail(),
            'phone' => $locale === 'fr' ? '+33 6 '.fake()->numerify('## ## ## ##') : '+44 7'.fake()->numerify('### ### ###'),
            'address' => fake()->numberBetween(1, 120).' '.fake('fr_FR')->streetName().', 750'.str_pad((string) fake()->numberBetween(1, 20), 2, '0', STR_PAD_LEFT).' Paris',
            'surface' => $surface,
            'floor' => fake()->boolean(80) ? fake()->randomElement(Valuation::FLOORS) : null,
            'elevator' => fake()->boolean(60),
            'rooms' => $rooms,
            'bedrooms' => fake()->numberBetween(0, max(0, $rooms - 1)),
            'features' => fake()->randomElements(Valuation::FEATURES, fake()->numberBetween(0, 4)),
            'condition' => fake()->boolean(75) ? fake()->randomElement(Valuation::CONDITIONS) : null,
            'estimated_value' => fake()->boolean(60) ? $surface * fake()->numberBetween(9000, 22000) : null,
            'contact_method' => fake()->randomElement(Valuation::CONTACT_METHODS),
            'message' => fake()->boolean(50) ? $faker->sentence(12) : null,
            'locale' => $locale,
            'ip' => fake()->ipv4(),
            'user_agent' => fake()->userAgent(),
            'referer' => fake()->boolean(60) ? config('app.url').'/estimation-immobiliere-paris' : null,
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
