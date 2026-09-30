<?php

namespace App\Domain\Properties\Data;

use App\Domain\Content\Support\ArrayShape;
use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Carbon;

/**
 * A property of the « Nos biens » listing. Today the rows come from a localized sample (`lang/{locale}/properties.php`);
 * the shape is the one the Sanity `estateProperty` documents will map to (user decision 2026-09-25: Sanity later).
 */
final readonly class Property implements Arrayable
{
    /** @param list<string> $photos widths `{w}` templates, e.g. `/images/buy/district-1-{w}.webp` (800 and 1600 exist) */
    public function __construct(
        public string $slug,
        public string $title,
        public int $arrondissement,
        public string $area,
        public string $type,
        /** `sale` or `rent` (the price is then a monthly rent). */
        public string $transaction,
        public int $price,
        public int $surface,
        public int $rooms,
        public int $bedrooms,
        public string $excerpt,
        public array $photos,
        public string $photoAlt,
        /** Advisor in charge (1-3, `public/images/advisors/`). */
        public int $advisor,
        public bool $available,
        /** WGS84 position of the building, for the Google map of the listing. */
        public float $lat,
        public float $lng,
        /** Confidential listing: shown on « Nos biens » with its details hidden (2026-09-28); the gated page lists them all. */
        public bool $offMarket = false,
        /** Featured listing: its card stands out in the grid (« Coup de cœur », 2026-09-28). */
        public bool $featured = false,
        /** Amenities (keys of `FEATURES`), state, floor (0 = ground), rental terms and publication date — the richer filters (2026-09-28). @param list<string> $features */
        public array $features = [],
        /** `to_renovate`, `renovated` or `new`; null = unknown. */
        public ?string $condition = null,
        public ?int $floor = null,
        public bool $furnished = false,
        public bool $chargesIncluded = true,
        /** `Y-m-d`; null = unknown. « Nouveau » = published within the last 14 days. */
        public ?string $publishedAt = null,
        /** Detail page content (2026-09-28): paragraphs, rooms with surfaces, building facts, energy labels, co-ownership, rental terms, media, price history, visit slots, transport. */
        /** @var list<string> */
        public array $description = [],
        /** @var list<array{name: string, surface: int}> */
        public array $roomsDetail = [],
        public ?int $yearBuilt = null,
        public ?string $heating = null,
        public ?string $orientation = null,
        public ?int $annualCharges = null,
        public ?int $propertyTax = null,
        /** @var array{energy: string, climate: string, cost_min: int, cost_max: int, year: int}|null */
        public ?array $dpe = null,
        public ?int $lots = null,
        public ?bool $procedure = null,
        /** Rent-control reference (monthly, rentals) and deposit. */
        public ?int $rentReference = null,
        public ?int $deposit = null,
        /** @var list<array{date: string, price: int}> oldest first */
        public array $priceHistory = [],
        /** @var list<string> ISO local datetimes of the next open viewings */
        public array $visits = [],
        /** @var list<array{name: string, kind: string, lines: list<string>, minutes: int}> */
        public array $transport = [],
        /** `Y-m-d` once sold or let: the page stays online in noindex with a banner, the listing leaves the catalogue. */
        public ?string $soldAt = null,
    ) {}

    public const FEATURES = ['elevator', 'balcony', 'terrace', 'top_floor', 'parking', 'concierge', 'view', 'cellar', 'quiet'];

    public const CONDITIONS = ['to_renovate', 'renovated', 'new'];

    /** Days during which a listing is flagged « Nouveau ». */
    public const NEW_FOR_DAYS = 14;

    /** @param array<string, mixed> $data */
    public static function fromArray(array $data): self
    {
        ArrayShape::validate(self::class, $data, [
            'slug' => 'string', 'title' => 'string', 'arrondissement' => 'int', 'area' => 'string', 'type' => 'string', 'transaction' => 'string',
            'price' => 'int', 'surface' => 'int', 'rooms' => 'int', 'bedrooms' => 'int', 'excerpt' => 'string', 'photos' => 'array', 'photo_alt' => 'string', 'advisor' => 'int', 'available' => 'bool', 'lat' => 'float', 'lng' => 'float',
        ], [
            'off_market' => 'bool', 'featured' => 'bool', 'features' => 'array', 'condition' => 'string', 'floor' => 'int', 'furnished' => 'bool', 'charges_included' => 'bool', 'published_at' => 'string',
            'description' => 'array', 'rooms_detail' => 'array', 'year_built' => 'int', 'heating' => 'string', 'orientation' => 'string', 'annual_charges' => 'int', 'property_tax' => 'int',
            'dpe' => 'array', 'lots' => 'int', 'procedure' => 'bool', 'rent_reference' => 'int', 'deposit' => 'int',
            'price_history' => 'array', 'visits' => 'array', 'transport' => 'array', 'sold_at' => 'string',
        ]);

        return new self(
            slug: $data['slug'], title: $data['title'], arrondissement: $data['arrondissement'], area: $data['area'], type: $data['type'], transaction: $data['transaction'],
            price: $data['price'], surface: $data['surface'], rooms: $data['rooms'], bedrooms: $data['bedrooms'],
            excerpt: $data['excerpt'], photos: array_values($data['photos']), photoAlt: $data['photo_alt'], advisor: $data['advisor'], available: $data['available'],
            lat: (float) $data['lat'], lng: (float) $data['lng'], offMarket: (bool) ($data['off_market'] ?? false), featured: (bool) ($data['featured'] ?? false),
            features: array_values(array_intersect((array) ($data['features'] ?? []), self::FEATURES)),
            condition: in_array($data['condition'] ?? null, self::CONDITIONS, true) ? $data['condition'] : null,
            floor: $data['floor'] ?? null, furnished: (bool) ($data['furnished'] ?? false), chargesIncluded: (bool) ($data['charges_included'] ?? true),
            publishedAt: $data['published_at'] ?? null,
            description: array_values(array_filter((array) ($data['description'] ?? []), 'is_string')),
            roomsDetail: array_values((array) ($data['rooms_detail'] ?? [])),
            yearBuilt: $data['year_built'] ?? null, heating: $data['heating'] ?? null, orientation: $data['orientation'] ?? null,
            annualCharges: $data['annual_charges'] ?? null, propertyTax: $data['property_tax'] ?? null,
            dpe: isset($data['dpe']['energy'], $data['dpe']['climate']) ? $data['dpe'] : null,
            lots: $data['lots'] ?? null, procedure: $data['procedure'] ?? null,
            rentReference: $data['rent_reference'] ?? null, deposit: $data['deposit'] ?? null,
            priceHistory: array_values((array) ($data['price_history'] ?? [])), visits: array_values((array) ($data['visits'] ?? [])),
            transport: array_values((array) ($data['transport'] ?? [])), soldAt: $data['sold_at'] ?? null,
        );
    }

    /** Sold or let: out of the catalogue, the page stays online in noindex. */
    public function isSold(): bool
    {
        return $this->soldAt !== null;
    }

    /** Days the listing took to sell (published → sold), for the « Vendu en N jours » banner. */
    public function daysToSell(): ?int
    {
        return $this->soldAt !== null && $this->publishedAt !== null ? (int) Carbon::parse($this->publishedAt)->diffInDays(Carbon::parse($this->soldAt)) : null;
    }

    /** Price per m² (rent: monthly rent per m²), rounded. */
    public function pricePerSqm(): int
    {
        return $this->surface > 0 ? (int) round($this->price / $this->surface) : 0;
    }

    /** « Nouveau »: published within the last `NEW_FOR_DAYS` days. */
    public function isNew(): bool
    {
        return $this->publishedAt !== null && Carbon::parse($this->publishedAt)->diffInDays(Carbon::today(), false) <= self::NEW_FOR_DAYS && ! Carbon::parse($this->publishedAt)->isFuture();
    }

    /**
     * The card's shape (listing, district pages, similar listings — SEO audit 2026-09-30: the full DTO weighed 14 Ko for six
     * cards and 9 Ko for two similar ones on every page): everything the cards, the map, the compare tray and the
     * listing JSON-LD read; the long texts and the detail-only facts stay on the detail page.
     */
    public function toCard(): array
    {
        return [
            'slug' => $this->slug, 'title' => $this->title, 'arrondissement' => $this->arrondissement, 'area' => $this->area, 'type' => $this->type, 'transaction' => $this->transaction,
            'price' => $this->price, 'surface' => $this->surface, 'rooms' => $this->rooms, 'bedrooms' => $this->bedrooms,
            'excerpt' => $this->excerpt, 'photos' => $this->photos, 'photo_alt' => $this->photoAlt, 'advisor' => $this->advisor, 'available' => $this->available,
            'lat' => $this->lat, 'lng' => $this->lng, 'off_market' => $this->offMarket, 'featured' => $this->featured,
            'features' => $this->features, 'condition' => $this->condition, 'floor' => $this->floor, 'furnished' => $this->furnished, 'charges_included' => $this->chargesIncluded,
            'published_at' => $this->publishedAt, 'is_new' => $this->isNew(), 'price_sqm' => $this->pricePerSqm(), 'year_built' => $this->yearBuilt, 'dpe' => $this->dpe,
            'price_history' => $this->priceHistory, 'sold_at' => $this->soldAt,
        ];
    }

    public function toArray(): array
    {
        return [
            'slug' => $this->slug, 'title' => $this->title, 'arrondissement' => $this->arrondissement, 'area' => $this->area, 'type' => $this->type, 'transaction' => $this->transaction,
            'price' => $this->price, 'surface' => $this->surface, 'rooms' => $this->rooms, 'bedrooms' => $this->bedrooms,
            'excerpt' => $this->excerpt, 'photos' => $this->photos, 'photo_alt' => $this->photoAlt, 'advisor' => $this->advisor, 'available' => $this->available,
            'lat' => $this->lat, 'lng' => $this->lng, 'off_market' => $this->offMarket, 'featured' => $this->featured,
            'features' => $this->features, 'condition' => $this->condition, 'floor' => $this->floor, 'furnished' => $this->furnished, 'charges_included' => $this->chargesIncluded,
            'published_at' => $this->publishedAt, 'is_new' => $this->isNew(), 'price_sqm' => $this->pricePerSqm(),
            'description' => $this->description, 'rooms_detail' => $this->roomsDetail, 'year_built' => $this->yearBuilt, 'heating' => $this->heating, 'orientation' => $this->orientation,
            'annual_charges' => $this->annualCharges, 'property_tax' => $this->propertyTax, 'dpe' => $this->dpe, 'lots' => $this->lots, 'procedure' => $this->procedure,
            'rent_reference' => $this->rentReference, 'deposit' => $this->deposit,
            'price_history' => $this->priceHistory, 'visits' => $this->visits, 'transport' => $this->transport,
            'sold_at' => $this->soldAt, 'days_to_sell' => $this->daysToSell(),
        ];
    }
}
