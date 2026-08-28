<?php

namespace Database\Seeders;

use App\Domain\Valuation\Models\ValuationRequest;
use Illuminate\Database\Seeder;

/** Local data set: valuation requests (answered, pending, one mail failure). */
class ValuationRequestSeeder extends Seeder
{
    public function run(): void
    {
        ValuationRequest::factory()->count(6)->handled()->create();
        ValuationRequest::factory()->count(4)->create();
        ValuationRequest::factory()->mailFailed()->create();
    }
}
