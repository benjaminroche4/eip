<?php

namespace App\Domain\Properties\Data;

use App\Domain\Content\Support\ArrayShape;
use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Carbon;

/**
 * A property of the « Nos biens » listing. The rows come from the Sanity `estateProperty` documents, mapped to this
 * shape by `Support/SanityProperty` (wired 2026-10-14; the tests bind the fixture rows of `tests/Fixtures/properties`).
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
        /** Advisor in charge (the Sanity `estateAgent`): name and square portrait URL, null without a photo. @var array{name: string, photo: string|null} */
        public array $advisor,
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
        /** Energy labels; the yearly costs, their year, the consumption (kWh/m²/an) and the emissions (kg CO₂/m²/an) are null when the diagnosis does not carry them. @var array{energy: string, climate: string, cost_min: int|null, cost_max: int|null, year: int|null, consumption: int|null, emissions: int|null}|null */
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
        /** Stations near the building; `minutes` on foot is null when unknown (Sanity only names the stations). @var list<array{name: string, kind: string, lines: list<string>, minutes: int|null}> */
        public array $transport = [],
        /** `Y-m-d` once sold or let: the page stays online in noindex with a banner, the listing leaves the catalogue. */
        public ?string $soldAt = null,
        /** Agency reference (Sanity `uniqueId`, « EP0001 »); null = built from the slug by the page. */
        public ?string $reference = null,
        /** The same listing in the other languages, locale → slug (Sanity `translation.metadata` or shared `uniqueId`); empty = resolved by row index. @var array<string, string> */
        public array $slugs = [],
        /** « Prix sur demande »: the price is kept for the sort and the filters but never displayed. */
        public bool $priceOnRequest = false,
        /** Agency fees of the listing when they are the buyer's: `paid_by` buyer|seller and the amount in euros. @var array{paid_by: string, amount: int|null}|null */
        public ?array $fees = null,
        /** Street address, only when the listing does not hide it (`hideExactAddress`). */
        public ?string $address = null,
        /** More Sanity facts (2026-10-14), each shown only when filled: bathrooms, living surface (m²), floors of the building, category names. @var list<string> $tags */
        public ?int $bathrooms = null,
        public ?int $surfaceLiving = null,
        public ?int $totalFloors = null,
        public array $tags = [],
        /** Per-photo alt texts and intrinsic sizes, aligned with `photos` (Sanity `photos[].alt` and asset dimensions, SEO audit 2026-10-14); missing entries fall back to `photoAlt` and the default ratio. @var list<string> $photoAlts @var list<array{width: int, height: int}> $photoSizes */
        public array $photoAlts = [],
        public array $photoSizes = [],
        /** The editor's meta description from the Studio (`metaDescription`, 2026-10-14): used verbatim as the page's meta description when filled. */
        public ?string $metaDescription = null,
        /** The four-digit code that opens a confidential listing (Sanity `accessCode`, 2026-10-14): server-side only, never in `toArray()` / `toCard()`. */
        public ?string $accessCode = null,
    ) {}

    public const FEATURES = ['elevator', 'balcony', 'terrace', 'garden', 'top_floor', 'parking', 'concierge', 'view', 'cellar', 'quiet', 'fireplace', 'air_conditioning'];

    public const CONDITIONS = ['to_renovate', 'good', 'renovated', 'new'];

    /** Days during which a listing is flagged « Nouveau ». */
    public const NEW_FOR_DAYS = 14;

    /** @param array<string, mixed> $data */
    public static function fromArray(array $data): self
    {
        ArrayShape::validate(self::class, $data, [
            'slug' => 'string', 'title' => 'string', 'arrondissement' => 'int', 'area' => 'string', 'type' => 'string', 'transaction' => 'string',
            'price' => 'int', 'surface' => 'int', 'rooms' => 'int', 'bedrooms' => 'int', 'excerpt' => 'string', 'photos' => 'array', 'photo_alt' => 'string', 'advisor' => 'array', 'available' => 'bool', 'lat' => 'float', 'lng' => 'float',
        ], [
            'off_market' => 'bool', 'featured' => 'bool', 'features' => 'array', 'condition' => 'string', 'floor' => 'int', 'furnished' => 'bool', 'charges_included' => 'bool', 'published_at' => 'string',
            'description' => 'array', 'rooms_detail' => 'array', 'year_built' => 'int', 'heating' => 'string', 'orientation' => 'string', 'annual_charges' => 'int', 'property_tax' => 'int',
            'dpe' => 'array', 'lots' => 'int', 'procedure' => 'bool', 'rent_reference' => 'int', 'deposit' => 'int',
            'price_history' => 'array', 'visits' => 'array', 'transport' => 'array', 'sold_at' => 'string',
            'reference' => 'string', 'slugs' => 'array', 'price_on_request' => 'bool', 'fees' => 'array', 'address' => 'string',
            'bathrooms' => 'int', 'surface_living' => 'int', 'total_floors' => 'int', 'tags' => 'array', 'photo_alts' => 'array', 'photo_sizes' => 'array', 'access_code' => 'string', 'meta_description' => 'string',
        ]);
        ArrayShape::validate(self::class.'.advisor', $data['advisor'], ['name' => 'string'], ['photo' => 'string']);

        return new self(
            slug: $data['slug'], title: $data['title'], arrondissement: $data['arrondissement'], area: $data['area'], type: $data['type'], transaction: $data['transaction'],
            price: $data['price'], surface: $data['surface'], rooms: $data['rooms'], bedrooms: $data['bedrooms'],
            excerpt: $data['excerpt'], photos: array_values($data['photos']), photoAlt: $data['photo_alt'],
            advisor: ['name' => $data['advisor']['name'], 'photo' => $data['advisor']['photo'] ?? null], available: $data['available'],
            lat: (float) $data['lat'], lng: (float) $data['lng'], offMarket: (bool) ($data['off_market'] ?? false), featured: (bool) ($data['featured'] ?? false),
            features: array_values(array_intersect((array) ($data['features'] ?? []), self::FEATURES)),
            condition: in_array($data['condition'] ?? null, self::CONDITIONS, true) ? $data['condition'] : null,
            floor: $data['floor'] ?? null, furnished: (bool) ($data['furnished'] ?? false), chargesIncluded: (bool) ($data['charges_included'] ?? true),
            publishedAt: $data['published_at'] ?? null,
            description: array_values(array_filter((array) ($data['description'] ?? []), 'is_string')),
            roomsDetail: array_values((array) ($data['rooms_detail'] ?? [])),
            yearBuilt: $data['year_built'] ?? null, heating: $data['heating'] ?? null, orientation: $data['orientation'] ?? null,
            annualCharges: $data['annual_charges'] ?? null, propertyTax: $data['property_tax'] ?? null,
            dpe: isset($data['dpe']['energy'], $data['dpe']['climate'])
                ? ['energy' => (string) $data['dpe']['energy'], 'climate' => (string) $data['dpe']['climate'], 'cost_min' => $data['dpe']['cost_min'] ?? null, 'cost_max' => $data['dpe']['cost_max'] ?? null, 'year' => $data['dpe']['year'] ?? null, 'consumption' => $data['dpe']['consumption'] ?? null, 'emissions' => $data['dpe']['emissions'] ?? null]
                : null,
            lots: $data['lots'] ?? null, procedure: $data['procedure'] ?? null,
            rentReference: $data['rent_reference'] ?? null, deposit: $data['deposit'] ?? null,
            priceHistory: array_values((array) ($data['price_history'] ?? [])), visits: array_values((array) ($data['visits'] ?? [])),
            transport: array_values((array) ($data['transport'] ?? [])), soldAt: $data['sold_at'] ?? null,
            reference: $data['reference'] ?? null, slugs: array_filter((array) ($data['slugs'] ?? []), 'is_string'),
            priceOnRequest: (bool) ($data['price_on_request'] ?? false),
            fees: isset($data['fees']['paid_by']) ? ['paid_by' => (string) $data['fees']['paid_by'], 'amount' => isset($data['fees']['amount']) ? (int) $data['fees']['amount'] : null] : null,
            address: $data['address'] ?? null,
            bathrooms: $data['bathrooms'] ?? null, surfaceLiving: $data['surface_living'] ?? null, totalFloors: $data['total_floors'] ?? null,
            tags: array_values(array_filter((array) ($data['tags'] ?? []), fn ($t) => is_string($t) && $t !== '')),
            photoAlts: array_values(array_map(fn ($a) => is_string($a) ? $a : '', (array) ($data['photo_alts'] ?? []))),
            photoSizes: array_values(array_map(fn ($s) => ['width' => (int) ($s['width'] ?? 0), 'height' => (int) ($s['height'] ?? 0)], (array) ($data['photo_sizes'] ?? []))),
            accessCode: $data['access_code'] ?? null,
            metaDescription: ($data['meta_description'] ?? '') !== '' ? $data['meta_description'] : null,
        );
    }

    /** Alt text of photo `$i`: its own (Sanity) when it has one, else the main alt numbered as the front does. */
    public function photoAlt(int $i, ?string $locale = null): string
    {
        $own = trim($this->photoAlts[$i] ?? '');
        if ($own !== '') {
            return $own;
        }

        return $i === 0 ? $this->photoAlt : __('ui.properties.photo_n', ['alt' => $this->photoAlt, 'n' => $i + 1, 'count' => count($this->photos)], $locale);
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

    /**
     * The price is secret: « sur demande » (Sanity `priceOnRequest`, user decision 2026-10-14) or a confidential
     * listing (security review 2026-10-14). It never leaves the server, and no filter or sort may test it either, or a
     * visitor could find it by bisection on `?budget=`.
     */
    public function hidesPrice(): bool
    {
        return $this->priceOnRequest || $this->offMarket;
    }

    /** The position is secret (confidential listing): off the map and never tested by `?bounds=`. */
    public function hidesPosition(): bool
    {
        return $this->offMarket;
    }

    /** The price the full shape may carry: 0 when it is « sur demande » (a confidential listing's price is only dropped by `toCard()`: `toArray()` renders behind the gate). */
    public function publicPrice(): int
    {
        return $this->priceOnRequest ? 0 : $this->price;
    }

    /** Price per m² (rent: monthly rent per m²), rounded. */
    public function pricePerSqm(): int
    {
        return $this->surface > 0 ? (int) round($this->price / $this->surface) : 0;
    }

    public function publicPricePerSqm(): int
    {
        return $this->priceOnRequest ? 0 : $this->pricePerSqm();
    }

    /** @return list<array{date: string, price: int}> */
    public function publicPriceHistory(): array
    {
        return $this->priceOnRequest ? [] : $this->priceHistory;
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
     *
     * **A confidential listing is redacted** (2026-10-14, real Sanity data): its card shows one blurred photo, « Prix
     * sur demande » and the facts, so the browser must not receive its price, excerpt, other photos nor position (the
     * map leaves it out). The gated off-market page and the unlocked detail page use `toArray()`.
     */
    public function toCard(): array
    {
        if ($this->offMarket) {
            return [
                'slug' => $this->slug, 'title' => $this->title, 'arrondissement' => $this->arrondissement, 'area' => $this->area, 'type' => $this->type, 'transaction' => $this->transaction,
                'price' => 0, 'surface' => $this->surface, 'rooms' => $this->rooms, 'bedrooms' => $this->bedrooms,
                'excerpt' => '', 'photos' => array_slice($this->photos, 0, 1), 'photo_alt' => $this->photoAlt, 'photo_alts' => array_slice($this->photoAlts, 0, 1), 'photo_sizes' => array_slice($this->photoSizes, 0, 1), 'advisor' => $this->advisor, 'available' => $this->available,
                'lat' => null, 'lng' => null, 'off_market' => true, 'featured' => $this->featured,
                'features' => $this->features, 'condition' => $this->condition, 'floor' => $this->floor, 'furnished' => $this->furnished, 'charges_included' => $this->chargesIncluded,
                'published_at' => $this->publishedAt, 'is_new' => $this->isNew(), 'price_sqm' => 0, 'year_built' => null, 'dpe' => null,
                'price_history' => [], 'sold_at' => $this->soldAt, 'price_on_request' => true,
            ];
        }

        return [
            'slug' => $this->slug, 'title' => $this->title, 'arrondissement' => $this->arrondissement, 'area' => $this->area, 'type' => $this->type, 'transaction' => $this->transaction,
            'price' => $this->publicPrice(), 'surface' => $this->surface, 'rooms' => $this->rooms, 'bedrooms' => $this->bedrooms,
            'excerpt' => $this->excerpt, 'photos' => $this->photos, 'photo_alt' => $this->photoAlt, 'photo_alts' => $this->photoAlts, 'photo_sizes' => $this->photoSizes, 'advisor' => $this->advisor, 'available' => $this->available,
            'lat' => $this->lat, 'lng' => $this->lng, 'off_market' => $this->offMarket, 'featured' => $this->featured,
            'features' => $this->features, 'condition' => $this->condition, 'floor' => $this->floor, 'furnished' => $this->furnished, 'charges_included' => $this->chargesIncluded,
            'published_at' => $this->publishedAt, 'is_new' => $this->isNew(), 'price_sqm' => $this->publicPricePerSqm(), 'year_built' => $this->yearBuilt, 'dpe' => $this->dpe,
            'price_history' => $this->publicPriceHistory(), 'sold_at' => $this->soldAt, 'price_on_request' => $this->priceOnRequest,
        ];
    }

    public function toArray(): array
    {
        return [
            'slug' => $this->slug, 'title' => $this->title, 'arrondissement' => $this->arrondissement, 'area' => $this->area, 'type' => $this->type, 'transaction' => $this->transaction,
            'price' => $this->publicPrice(), 'surface' => $this->surface, 'rooms' => $this->rooms, 'bedrooms' => $this->bedrooms,
            'excerpt' => $this->excerpt, 'photos' => $this->photos, 'photo_alt' => $this->photoAlt, 'photo_alts' => $this->photoAlts, 'photo_sizes' => $this->photoSizes, 'advisor' => $this->advisor, 'available' => $this->available,
            'lat' => $this->lat, 'lng' => $this->lng, 'off_market' => $this->offMarket, 'featured' => $this->featured,
            'features' => $this->features, 'condition' => $this->condition, 'floor' => $this->floor, 'furnished' => $this->furnished, 'charges_included' => $this->chargesIncluded,
            'published_at' => $this->publishedAt, 'is_new' => $this->isNew(), 'price_sqm' => $this->publicPricePerSqm(),
            'description' => $this->description, 'rooms_detail' => $this->roomsDetail, 'year_built' => $this->yearBuilt, 'heating' => $this->heating, 'orientation' => $this->orientation,
            'annual_charges' => $this->annualCharges, 'property_tax' => $this->propertyTax, 'dpe' => $this->dpe, 'lots' => $this->lots, 'procedure' => $this->procedure,
            'rent_reference' => $this->rentReference, 'deposit' => $this->deposit,
            'price_history' => $this->publicPriceHistory(), 'visits' => $this->visits, 'transport' => $this->transport,
            'sold_at' => $this->soldAt, 'days_to_sell' => $this->daysToSell(),
            'reference' => $this->reference, 'price_on_request' => $this->priceOnRequest, 'fees' => $this->fees, 'address' => $this->address,
            'bathrooms' => $this->bathrooms, 'surface_living' => $this->surfaceLiving, 'total_floors' => $this->totalFloors, 'tags' => $this->tags,
        ];
    }
}
