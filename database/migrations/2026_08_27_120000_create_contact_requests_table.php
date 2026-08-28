<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contact_requests', function (Blueprint $table) {
            $table->id();
            $table->string('first_name', 80);
            $table->string('last_name', 80);
            $table->string('email', 190)->index();
            $table->string('phone', 30);
            $table->string('topic', 30)->index();
            $table->text('message')->nullable();
            $table->string('locale', 5);
            $table->string('ip', 45)->nullable();           // IPv4 / IPv6
            $table->string('user_agent', 500)->nullable();
            $table->string('referer', 2000)->nullable();     // page the visitor came from, if any
            $table->timestamp('consent_at')->nullable();     // when the visitor ticked the consent box
            $table->timestamp('mail_sent_at')->nullable();   // null = e-mail delivery failed, request still kept
            $table->timestamp('handled_at')->nullable();     // set by the team once answered
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contact_requests');
    }
};
