<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

/** Local development data: one login + realistic contact / valuation requests and newsletter subscribers. Never run in production. */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        $this->call([
            ContactRequestSeeder::class,
            NewsletterSubscriberSeeder::class,
            ValuationRequestSeeder::class,
        ]);
    }
}
