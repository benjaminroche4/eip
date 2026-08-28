<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('valuation_requests', function (Blueprint $table) {
            $table->id();
            $table->string('property_type', 30)->index();
            $table->string('full_name', 120);
            $table->string('email', 190)->index();
            $table->string('phone', 30);
            $table->string('address', 255);
            $table->unsignedSmallInteger('surface');            // m²
            $table->string('floor', 10)->nullable();
            $table->unsignedTinyInteger('rooms');
            $table->unsignedTinyInteger('bedrooms');
            $table->unsignedInteger('estimated_value')->nullable(); // € — the owner's own idea, optional
            $table->string('contact_method', 20);
            $table->text('message')->nullable();
            $table->string('locale', 5);
            $table->string('ip', 45)->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->string('referer', 2000)->nullable();
            $table->timestamp('consent_at')->nullable();
            $table->timestamp('mail_sent_at')->nullable();   // null = e-mail delivery failed, request still kept
            $table->timestamp('handled_at')->nullable();     // set by the team once answered
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('valuation_requests');
    }
};
