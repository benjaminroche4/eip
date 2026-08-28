<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** The three yes/no flags become one list of selling points (Valuation::FEATURES); "works needed" lives in `condition`. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('valuation_requests', function (Blueprint $table) {
            $table->dropColumn(['outdoor', 'cellar_parking', 'works']);
            $table->json('features')->nullable()->after('bedrooms');
        });
    }

    public function down(): void
    {
        Schema::table('valuation_requests', function (Blueprint $table) {
            $table->dropColumn('features');
            $table->boolean('outdoor')->default(false)->after('bedrooms');
            $table->boolean('cellar_parking')->default(false)->after('outdoor');
            $table->boolean('works')->default(false)->after('cellar_parking');
        });
    }
};
