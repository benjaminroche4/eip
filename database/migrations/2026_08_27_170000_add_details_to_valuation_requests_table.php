<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Criteria that weigh on a Paris valuation: floor as a list, lift, outdoor space, cellar/parking, works, condition. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('valuation_requests', function (Blueprint $table) {
            $table->boolean('elevator')->default(false)->after('floor');
            $table->boolean('outdoor')->default(false)->after('bedrooms');
            $table->boolean('cellar_parking')->default(false)->after('outdoor');
            $table->boolean('works')->default(false)->after('cellar_parking');
            $table->string('condition', 20)->nullable()->after('works');
        });
    }

    public function down(): void
    {
        Schema::table('valuation_requests', function (Blueprint $table) {
            $table->dropColumn(['elevator', 'outdoor', 'cellar_parking', 'works', 'condition']);
        });
    }
};
