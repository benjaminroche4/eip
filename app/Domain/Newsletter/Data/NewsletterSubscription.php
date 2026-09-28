<?php

namespace App\Domain\Newsletter\Data;

use Illuminate\Http\Request;

/** A subscription submitted from the public newsletter page. */
final readonly class NewsletterSubscription
{
    public function __construct(
        public string $email,
        public string $locale,
        public ?string $ip = null,
        public ?string $userAgent = null,
        /** Query string of a « Nos biens » search to be alerted about (`city[]=6&budget=2000000`), if any. */
        public ?string $search = null,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            email: $request->string('email')->trim()->lower()->toString(),
            locale: app()->getLocale(),
            ip: $request->ip(),
            userAgent: mb_substr((string) $request->userAgent(), 0, 500) ?: null,
            search: mb_substr(ltrim($request->string('search')->trim()->toString(), '?'), 0, 500) ?: null,
        );
    }
}
