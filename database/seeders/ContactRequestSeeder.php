<?php

namespace Database\Seeders;

use App\Domain\Contact\Models\ContactRequest;
use Illuminate\Database\Seeder;

/** Local data set: a realistic inbox (answered, pending, one mail failure). */
class ContactRequestSeeder extends Seeder
{
    public function run(): void
    {
        ContactRequest::factory()->count(8)->handled()->create();
        ContactRequest::factory()->count(5)->create();
        ContactRequest::factory()->mailFailed()->create();
    }
}
