<?php

namespace App\Domain\Properties\Support;

use App\Domain\Blog\Support\SanityImage;
use App\Domain\Properties\Data\Property;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * Maps one Sanity `estateProperty` document (the projection of `FetchSanityProperties::PROJECTION`) to the row shape
 * of `Property::fromArray()` (wired 2026-10-14). The Studio schema and the site do not speak the same words: this is
 * the single place where they meet.
 *
 * - `status` forSale | underOffer | sold → `available` (forSale only) and `sold_at` (sold: the document's last update);
 * - `confidential` → `off_market`, `featured` or the « Coup de cœur » category → `featured`;
 * - `propertyType->slug` (FR or EN slug) → the site's type keys (`TYPE_SLUGS`), unknown = apartment;
 * - `main.rooms / bedrooms` (« studio » = 0, « 9+ » = 9), `surfaces.carrez` (then `living`) rounded;
 * - `equipment.*` booleans, the floors and the categories → the `Property::FEATURES` keys (`top_floor` when the floor
 *   is the building's last, `view` from the « Vue dégagée » category, `quiet` has no source);
 * - `condition` toRenovate | good | renovated | new → `to_renovate` | `good` | `renovated` | `new`;
 * - `mainPhoto` then `photos[]` → cdn.sanity.io `{w}` templates (`SanityImage::template()`), the alt of the main photo;
 * - `agent->` → the advisor's name and 64 px square portrait; `metaDescription` → the excerpt (and the meta description);
 * - `description` (Portable Text) → one plain paragraph per block; `metro[]` → stations without lines nor minutes;
 * - `location` geopoint → `lat` / `lng`, the arrondissement's centroid when the document has none;
 * - `address` → one line, only when `hideExactAddress` is false; `uniqueId` → `reference`; `fees`, `dpe` (classes, consumption, emissions), `priceOnRequest`;
 * - `main.bathrooms`, `surfaces.living`, `floors.totalFloors` and the category names (`tags`) travel as they are, each shown only when filled.
 *
 * The Studio has no neighbourhood field: `area` is the first metro station named, else the arrondissement (user to
 * decide whether a `neighbourhood` field joins the schema).
 */
final class SanityProperty
{
    /** Sanity `estatePropertyType` slugs (FR and EN documents) → the site's type keys (`PropertyQuery::TYPES`). */
    public const TYPE_SLUGS = [
        'appartement' => 'apartment', 'apartment' => 'apartment',
        'maison' => 'house', 'house' => 'house',
        'hotel-particulier' => 'mansion',
        'loft' => 'loft',
        'studio' => 'studio',
        'duplex' => 'duplex',
        'immeuble' => 'building', 'building' => 'building',
        'local-commercial' => 'commercial', 'commercial-premises' => 'commercial',
    ];

    /** Types sold without a room count (the texts then skip it). */
    public const NO_ROOM_COUNT = ['building', 'commercial'];

    public const CONDITIONS = ['toRenovate' => 'to_renovate', 'good' => 'good', 'renovated' => 'renovated', 'new' => 'new'];

    /** `equipment.*` keys → `Property::FEATURES` keys. */
    public const EQUIPMENT = [
        'elevator' => 'elevator', 'balcony' => 'balcony', 'terrace' => 'terrace', 'garden' => 'garden', 'parking' => 'parking',
        'concierge' => 'concierge', 'cellar' => 'cellar', 'fireplace' => 'fireplace', 'airConditioning' => 'air_conditioning',
    ];

    /** Category slugs (FR / EN documents) that carry a feature or a flag. */
    public const CATEGORY_VIEW = ['vue-degagee', 'unobstructed-view'];

    public const CATEGORY_FEATURED = ['coup-de-cur', 'coup-de-coeur', 'featured'];

    public const CATEGORY_TOP_FLOOR = ['dernier-etage', 'top-floor'];

    /** Centroids of the 20 arrondissements (WGS84), for a document without a geopoint. */
    public const CENTROIDS = [
        1 => [48.8626, 2.3364], 2 => [48.8683, 2.3429], 3 => [48.8630, 2.3601], 4 => [48.8543, 2.3576], 5 => [48.8445, 2.3507],
        6 => [48.8491, 2.3329], 7 => [48.8562, 2.3121], 8 => [48.8728, 2.3125], 9 => [48.8772, 2.3376], 10 => [48.8761, 2.3607],
        11 => [48.8591, 2.3800], 12 => [48.8350, 2.4213], 13 => [48.8283, 2.3624], 14 => [48.8291, 2.3266], 15 => [48.8402, 2.2927],
        16 => [48.8604, 2.2620], 17 => [48.8874, 2.3068], 18 => [48.8925, 2.3484], 19 => [48.8871, 2.3848], 20 => [48.8634, 2.4012],
    ];

    public function __construct(private readonly SanityImage $images) {}

    /**
     * @param  array<string, mixed>  $doc
     * @param  array<string, string>  $slugs  locale → slug of the same listing (resolved across the whole fetch)
     * @return array<string, mixed> the row shape of `Property::fromArray()`
     */
    public function row(array $doc, array $slugs = []): array
    {
        $status = (string) ($doc['status'] ?? 'forSale');
        $arrondissement = max(1, min(20, (int) ($doc['arrondissement'] ?? 0)));
        // `categories[]->{slug, name}`: the slugs drive the flags, the names are shown as tags
        $categoryDocs = array_values(array_filter((array) ($doc['categories'] ?? []), 'is_array'));
        $categories = array_values(array_filter(array_map(fn (array $c) => $c['slug'] ?? null, $categoryDocs), 'is_string'));
        $tags = array_values(array_filter(array_map(fn (array $c) => is_string($c['name'] ?? null) ? trim($c['name']) : '', $categoryDocs)));
        $metro = array_values(array_filter(array_map(fn ($s) => is_string($s) ? trim($s) : '', (array) ($doc['metro'] ?? []))));
        $floor = self::int($doc['floors']['floor'] ?? null);
        $totalFloors = self::int($doc['floors']['totalFloors'] ?? null);
        $published = self::date($doc['createdAt'] ?? null);
        $price = (int) round((float) ($doc['price'] ?? 0));
        // The exact position only when the editor shows the address: a hidden address sits on the arrondissement centroid
        // (the map pin, the JSON-LD `geo` and the `?bounds=` filter would otherwise give the building away, review 2026-10-14)
        $hideAddress = ! empty($doc['hideExactAddress']);
        $type = self::TYPE_SLUGS[(string) ($doc['propertyType'] ?? '')] ?? 'apartment';
        [$lat, $lng] = ! $hideAddress && isset($doc['location']['lat'], $doc['location']['lng'])
            ? [(float) $doc['location']['lat'], (float) $doc['location']['lng']]
            : self::CENTROIDS[$arrondissement];

        $features = [];
        foreach (self::EQUIPMENT as $key => $feature) {
            if (! empty($doc['equipment'][$key])) {
                $features[] = $feature;
            }
        }
        if (($floor !== null && $totalFloors !== null && $floor > 0 && $floor === $totalFloors) || array_intersect($categories, self::CATEGORY_TOP_FLOOR) !== []) {
            $features[] = 'top_floor';
        }
        if (array_intersect($categories, self::CATEGORY_VIEW) !== []) {
            $features[] = 'view';
        }

        // Main photo first, then the gallery: URL template, own alt and intrinsic size, aligned (unresolvable assets dropped)
        $photos = $alts = $sizes = [];
        foreach ([$doc['mainPhoto'] ?? null, ...array_values((array) ($doc['photos'] ?? []))] as $image) {
            $template = is_array($image) ? $this->images->template($image) : null;
            if ($template === null) {
                continue;
            }
            $photos[] = $template;
            $alts[] = trim((string) ($image['alt'] ?? ''));
            $sizes[] = $this->images->size($image) ?? ['width' => 1600, 'height' => 1200];
        }
        $address = $hideAddress ? null : self::address((array) ($doc['address'] ?? []));

        return [
            'slug' => (string) ($doc['slug'] ?? ''),
            'title' => trim((string) ($doc['title'] ?? '')),
            'arrondissement' => $arrondissement,
            'area' => $metro[0] ?? __('ui.districts.items.'.($arrondissement - 1).'.name', [], $doc['language'] ?? null),
            'type' => $type,
            // The Studio only lists sales today: a rental type would map here
            'transaction' => 'sale',
            'price' => $price,
            'surface' => (int) round((float) ($doc['surfaces']['carrez'] ?? $doc['surfaces']['living'] ?? 0)),
            // A studio counts as one room (the Studio may leave `rooms` empty for it): « 0 pièce » never shows (review 2026-10-14)
            'rooms' => max((int) ($doc['main']['rooms'] ?? 0), $type === 'studio' || ($doc['main']['bedrooms'] ?? null) === 'studio' ? 1 : 0),
            'bedrooms' => self::bedrooms($doc['main']['bedrooms'] ?? null),
            'excerpt' => trim((string) ($doc['metaDescription'] ?? '')),
            'meta_description' => trim((string) ($doc['metaDescription'] ?? '')),
            'photos' => $photos,
            'photo_alt' => trim((string) ($doc['mainPhoto']['alt'] ?? $doc['title'] ?? '')),
            'photo_alts' => $alts,
            'photo_sizes' => $sizes,
            'advisor' => [
                'name' => trim((string) ($doc['agent']['fullName'] ?? '')), // empty without an agent: the card then says « Votre conseiller » (review 2026-10-14)
                'photo' => $this->images->thumbnail($doc['agent']['photo'] ?? null),
            ],
            'available' => $status === 'forSale',
            'lat' => $lat,
            'lng' => $lng,
            'off_market' => (bool) ($doc['confidential'] ?? false),
            'featured' => (bool) ($doc['featured'] ?? false) || array_intersect($categories, self::CATEGORY_FEATURED) !== [],
            'features' => array_values(array_unique($features)),
            'condition' => self::CONDITIONS[(string) ($doc['condition'] ?? '')] ?? null,
            'floor' => $floor,
            'published_at' => $published,
            'description' => self::paragraphs((array) ($doc['description'] ?? [])),
            'dpe' => isset($doc['dpe']['energyClass'], $doc['dpe']['gesClass']) && empty($doc['dpe']['notRequired'])
                ? [
                    'energy' => (string) $doc['dpe']['energyClass'], 'climate' => (string) $doc['dpe']['gesClass'], 'cost_min' => null, 'cost_max' => null, 'year' => null,
                    'consumption' => isset($doc['dpe']['energyConsumption']) ? (int) round((float) $doc['dpe']['energyConsumption']) : null,
                    'emissions' => isset($doc['dpe']['gesEmissions']) ? (int) round((float) $doc['dpe']['gesEmissions']) : null,
                ]
                : null,
            'procedure' => isset($doc['condominium']['ongoingProcedure']) ? (bool) $doc['condominium']['ongoingProcedure'] : null,
            'price_history' => $published !== null && $price > 0 ? [['date' => $published, 'price' => $price]] : [],
            'transport' => array_map(fn (string $name) => ['name' => $name, 'kind' => 'metro', 'lines' => [], 'minutes' => null], $metro),
            'sold_at' => $status === 'sold' ? self::date($doc['_updatedAt'] ?? null) : null,
            'reference' => trim((string) ($doc['uniqueId'] ?? '')) ?: null,
            // The listing's own access code (four digits in the Studio); anything else = the listing cannot be opened
            'access_code' => preg_match('/^\d{4}$/', (string) ($doc['accessCode'] ?? '')) ? (string) $doc['accessCode'] : null,
            'slugs' => $slugs,
            'price_on_request' => (bool) ($doc['priceOnRequest'] ?? false),
            'fees' => isset($doc['fees']['paidBy'])
                ? ['paid_by' => (string) $doc['fees']['paidBy'], 'amount' => isset($doc['fees']['amount']) ? (int) round((float) $doc['fees']['amount']) : null]
                : null,
            'address' => $address,
            'bathrooms' => isset($doc['main']['bathrooms']) ? (int) $doc['main']['bathrooms'] : null,
            'surface_living' => isset($doc['surfaces']['living']) ? (int) round((float) $doc['surfaces']['living']) : null,
            'total_floors' => $totalFloors,
            'tags' => $tags,
        ];
    }

    /** « studio » = 0, « 9+ » = 9, else the number. */
    public static function bedrooms(mixed $value): int
    {
        if ($value === null || $value === '' || $value === 'studio') {
            return 0;
        }

        return max(0, (int) preg_replace('/\D/', '', (string) $value));
    }

    /** Plain text of each Portable Text block, in order (links and marks dropped). @param list<mixed> $blocks @return list<string> */
    public static function paragraphs(array $blocks): array
    {
        $paragraphs = [];
        foreach ($blocks as $block) {
            if (! is_array($block) || ($block['_type'] ?? null) !== 'block') {
                continue;
            }
            $text = trim(implode('', array_map(fn ($span) => (string) ($span['text'] ?? ''), (array) ($block['children'] ?? []))));
            if ($text !== '') {
                $paragraphs[] = $text;
            }
        }

        return $paragraphs;
    }

    /** « 14 avenue Bosquet, 75007 Paris », from the parts the document carries. @param array<string, mixed> $address */
    public static function address(array $address): ?string
    {
        $street = trim(implode(' ', array_filter([(string) ($address['number'] ?? ''), (string) ($address['street'] ?? '')])));
        $city = trim(implode(' ', array_filter([(string) ($address['postalCode'] ?? ''), (string) ($address['city'] ?? '')])));
        $line = implode(', ', array_filter([$street, $city]));

        return $line !== '' ? $line : null;
    }

    private static function int(mixed $value): ?int
    {
        return $value === null || $value === '' ? null : (int) $value;
    }

    /** `Y-m-d` of an ISO datetime, null when absent or unreadable. */
    private static function date(mixed $value): ?string
    {
        if (! is_string($value) || $value === '') {
            return null;
        }
        try {
            return Carbon::parse($value)->toDateString();
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * What the site cannot render without (review 2026-10-14): the name of the first missing fact, null when complete. The
     * Studio only requires title, slug, language and reference; a listing without a photo, a Paris arrondissement, a room
     * count, a surface or a price (unless « sur demande ») would show « 0 pièce », « 0 m² », « 0 € » or a wrong district.
     *
     * @param  array<string, mixed>  $doc
     * @param  array<string, mixed>  $row
     */
    public static function missing(array $doc, array $row): ?string
    {
        return match (true) {
            $row['photos'] === [] => 'photo',
            (int) ($doc['arrondissement'] ?? 0) < 1 || (int) ($doc['arrondissement'] ?? 0) > 20 => 'arrondissement',
            $row['rooms'] < 1 && ! in_array($row['type'], self::NO_ROOM_COUNT, true) => 'rooms',
            $row['surface'] < 1 => 'surface',
            $row['price'] < 1 && ! $row['price_on_request'] => 'price',
            default => null,
        };
    }

    /** The row is only usable with a slug and a language (`Str::slug` keeps the URL safe). @param array<string, mixed> $doc */
    public static function publishable(array $doc): bool
    {
        return is_string($doc['slug'] ?? null) && Str::slug($doc['slug']) === $doc['slug'] && in_array($doc['language'] ?? null, ['fr', 'en'], true);
    }
}
