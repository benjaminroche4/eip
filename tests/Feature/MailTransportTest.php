<?php

namespace Tests\Feature;

use Illuminate\Mail\Transport\ResendTransport;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/** Transactional mail goes through Resend (config/mail.php `resend` mailer, key in services.resend.key). */
class MailTransportTest extends TestCase
{
    public function test_resend_mailer_is_configured_and_its_transport_resolves(): void
    {
        config(['services.resend.key' => 're_test_key']);

        $this->assertSame('resend', config('mail.mailers.resend.transport'));
        $this->assertInstanceOf(ResendTransport::class, Mail::mailer('resend')->getSymfonyTransport());
    }
}
