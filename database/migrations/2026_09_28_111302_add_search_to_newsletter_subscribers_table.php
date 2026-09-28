<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // The listing search (its URL query) a subscriber asked to be alerted about (« Recevoir les nouveaux biens », 2026-09-28)
        Schema::table('newsletter_subscribers', function (Blueprint $table) {
            $table->string('search', 500)->nullable()->after('locale');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('newsletter_subscribers', function (Blueprint $table) {
            $table->dropColumn('search');
        });
    }
};
