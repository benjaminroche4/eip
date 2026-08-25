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
        public string $message,
        public string $locale,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            firstName: $request->string('first_name')->trim()->toString(),
            lastName: $request->string('last_name')->trim()->toString(),
            email: $request->string('email')->trim()->lower()->toString(),
            phone: $request->string('phone')->trim()->toString(),
            topic: $request->string('topic')->toString(),
            message: $request->string('message')->trim()->toString(),
            locale: app()->getLocale(),
        );
    }

    public function fullName(): string
    {
        return trim("{$this->firstName} {$this->lastName}");
    }
}
