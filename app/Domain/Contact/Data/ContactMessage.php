<?php

namespace App\Domain\Contact\Data;

use Illuminate\Http\Request;

/** A contact request submitted from the public contact page. */
final readonly class ContactMessage
{
    /** Topics offered by the form (keys of ui.contact.topics). */
    public const TOPICS = ['buy', 'sell', 'invest', 'valuation', 'off_market', 'other'];

    public function __construct(
        public string $firstName,
        public string $lastName,
        public string $email,
        public string $phone,
        public string $topic,
        public ?string $message,
        public string $locale,
        public ?string $ip = null,
        public ?string $userAgent = null,
        public ?string $referer = null,
        public ?\DateTimeImmutable $consentAt = null,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            firstName: $request->string('first_name')->trim()->toString(),
            lastName: $request->string('last_name')->trim()->toString(),
            email: $request->string('email')->trim()->lower()->toString(),
            phone: $request->string('phone')->trim()->toString(),
            topic: $request->string('topic')->toString(),
            message: $request->string('message')->trim()->toString() ?: null,
            locale: app()->getLocale(),
            ip: $request->ip(),
            userAgent: mb_substr((string) $request->userAgent(), 0, 500) ?: null,
            referer: mb_substr((string) $request->headers->get('referer'), 0, 2000) ?: null,
            consentAt: $request->boolean('consent') ? now()->toImmutable() : null,
        );
    }

    public function fullName(): string
    {
        return trim("{$this->firstName} {$this->lastName}");
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'first_name' => $this->firstName,
            'last_name' => $this->lastName,
            'email' => $this->email,
            'phone' => $this->phone,
            'topic' => $this->topic,
            'message' => $this->message,
            'locale' => $this->locale,
            'ip' => $this->ip,
            'user_agent' => $this->userAgent,
            'referer' => $this->referer,
            'consent_at' => $this->consentAt,
        ];
    }
}
