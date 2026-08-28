<?php

namespace App\Domain\Valuation\Data;

use Illuminate\Http\Request;

/** A valuation request submitted from the public estimate page (Figma 696-13105). */
final readonly class Valuation
{
    /** Property types offered by the form (keys of ui.estimate.property_types). */
    public const PROPERTY_TYPES = ['apartment', 'duplex', 'studio', 'mansion', 'house', 'loft', 'building', 'other'];

    /** How the prospect wants to be reached (keys of ui.estimate.contact_methods). */
    public const CONTACT_METHODS = ['phone', 'whatsapp', 'email'];

    /** Floors offered by the form (keys of ui.estimate.floors). */
    public const FLOORS = ['ground', '1', '2', '3', '4', '5', '6', '7_plus', 'top'];

    /** Selling points the owner can tick (keys of ui.estimate.features_list). */
    public const FEATURES = ['bright', 'view', 'quiet', 'outdoor', 'metro', 'central', 'parking', 'cellar'];

    /** General condition (keys of ui.estimate.conditions). */
    public const CONDITIONS = ['renovate', 'good', 'new'];

    public function __construct(
        public string $propertyType,
        public string $fullName,
        public string $email,
        public string $phone,
        public string $address,
        public int $surface,
        public ?string $floor,
        public bool $elevator,
        public int $rooms,
        public int $bedrooms,
        /** @var list<string> */
        public array $features,
        public ?string $condition,
        public ?int $estimatedValue,
        public string $contactMethod,
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
            propertyType: $request->string('property_type')->toString(),
            fullName: $request->string('full_name')->trim()->toString(),
            email: $request->string('email')->trim()->lower()->toString(),
            phone: $request->string('phone')->trim()->toString(),
            address: $request->string('address')->trim()->toString(),
            surface: $request->integer('surface'),
            floor: $request->string('floor')->toString() ?: null,
            elevator: $request->boolean('elevator'),
            rooms: $request->integer('rooms'),
            bedrooms: $request->integer('bedrooms'),
            features: array_values(array_intersect(self::FEATURES, (array) $request->input('features', []))),
            condition: $request->string('condition')->toString() ?: null,
            estimatedValue: $request->filled('estimated_value') ? $request->integer('estimated_value') : null,
            contactMethod: $request->string('contact_method')->toString(),
            message: $request->string('message')->trim()->toString() ?: null,
            locale: app()->getLocale(),
            ip: $request->ip(),
            userAgent: mb_substr((string) $request->userAgent(), 0, 500) ?: null,
            referer: mb_substr((string) $request->headers->get('referer'), 0, 2000) ?: null,
            consentAt: $request->boolean('consent') ? now()->toImmutable() : null,
        );
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'property_type' => $this->propertyType,
            'full_name' => $this->fullName,
            'email' => $this->email,
            'phone' => $this->phone,
            'address' => $this->address,
            'surface' => $this->surface,
            'floor' => $this->floor,
            'elevator' => $this->elevator,
            'rooms' => $this->rooms,
            'bedrooms' => $this->bedrooms,
            'features' => $this->features,
            'condition' => $this->condition,
            'estimated_value' => $this->estimatedValue,
            'contact_method' => $this->contactMethod,
            'message' => $this->message,
            'locale' => $this->locale,
            'ip' => $this->ip,
            'user_agent' => $this->userAgent,
            'referer' => $this->referer,
            'consent_at' => $this->consentAt,
        ];
    }
}
