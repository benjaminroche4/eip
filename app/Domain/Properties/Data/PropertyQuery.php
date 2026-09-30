<?php

namespace App\Domain\Properties\Data;

use Illuminate\Http\Request;
use Illuminate\Support\Collection;

/**
 * Immutable description of a « Nos biens » request: the filters (achat / location, arrondissements, type, rooms, max
 * budget, map area) cleaned from the query string, the sort order and the page. The home hero's GET sends `city[]` + a grouped `budget`; the
 * page's own bar adds `transaction`, `type[]`, `rooms[]` (multi, 2026-09-28); the list's select adds `sort` (2026-09-28);
 * « Rechercher dans cette zone » adds `bounds=south,west,north,east` (2026-09-28); « Voir plus » adds `page` (hybrid
 * pagination, 2026-09-26). The clean district URLs (`/nos-biens/paris-6e`) force the arrondissement with `withCities()`.
 */
final readonly class PropertyQuery
{
    public const PER_PAGE = 12;

    public const TYPES = ['apartment', 'house', 'mansion', 'loft'];

    /** Sort orders; `recent` = the source order (Sanity will send the newest first), the only indexable one. */
    public const SORTS = ['recent', 'price_asc', 'price_desc', 'sqm_asc', 'surface_asc', 'surface_desc'];

    /** Floor criteria: no ground floor, top floor only. */
    public const FLOORS = ['not_ground', 'top'];

    /**
     * @param  list<int>  $cities  arrondissements 1-20
     * @param  array{0: float, 1: float, 2: float, 3: float}|null  $bounds  map area [south, west, north, east] (WGS84)
     */
    public function __construct(
        public array $cities = [],
        public ?int $budget = null,
        public string $transaction = 'sale',
        /** @param list<string> $types property types kept (empty = all) */
        public array $types = [],
        /** @param list<int> $rooms room counts kept, 5 = « 5 et plus » (empty = all) */
        public array $rooms = [],
        public string $sort = 'recent',
        public ?array $bounds = null,
        public int $page = 1,
        public int $perPage = self::PER_PAGE,
        // Richer criteria (user decision 2026-09-28)
        public ?int $budgetMin = null,
        public ?int $surfaceMin = null,
        /** @param list<int> $bedrooms bedroom counts kept, 5 = « 5 et plus » */
        public array $bedrooms = [],
        /** @param list<string> $features every one required (keys of `Property::FEATURES`) */
        public array $features = [],
        /** @param list<string> $conditions any of `Property::CONDITIONS` */
        public array $conditions = [],
        /** @param list<string> $floors any of `FLOORS` */
        public array $floors = [],
        /** Rentals: furnished only (true), unfurnished only (false), any (null). */
        public ?bool $furnished = null,
        /** Hide the listings under offer. */
        public bool $availableOnly = false,
        /** @param list<string> $areas quartiers kept (the `area` of a property) */
        public array $areas = [],
    ) {}

    public static function fromRequest(Request $request, int $perPage = self::PER_PAGE): self
    {
        $cities = collect((array) $request->query('city', []))
            ->map(fn ($n) => (int) $n)
            ->filter(fn (int $n) => $n >= 1 && $n <= 20)
            ->unique()
            ->values()
            ->all();
        $budget = (int) preg_replace('/\D/', '', (string) $request->query('budget', ''));
        $types = collect((array) $request->query('type', []))
            ->map(fn ($t) => (string) $t)
            ->filter(fn (string $t) => in_array($t, self::TYPES, true))
            ->unique()
            ->values()
            ->all();
        $rooms = collect((array) $request->query('rooms', []))
            ->map(fn ($n) => (int) $n)
            ->filter(fn (int $n) => $n >= 1 && $n <= 5)
            ->unique()
            ->sort()
            ->values()
            ->all();

        $ints = fn (string $key, int $min, int $max) => collect((array) $request->query($key, []))
            ->map(fn ($n) => (int) $n)->filter(fn (int $n) => $n >= $min && $n <= $max)->unique()->sort()->values()->all();
        $among = fn (string $key, array $allowed) => collect((array) $request->query($key, []))
            ->map(fn ($v) => (string) $v)->filter(fn (string $v) => in_array($v, $allowed, true))->unique()->values()->all();
        $budgetMin = (int) preg_replace('/\D/', '', (string) $request->query('budget_min', ''));
        $surfaceMin = (int) preg_replace('/\D/', '', (string) $request->query('surface_min', ''));
        $furnished = $request->query('furnished');

        return new self(
            cities: $cities,
            budget: $budget > 0 ? $budget : null,
            transaction: $request->query('transaction') === 'rent' ? 'rent' : 'sale',
            types: $types,
            rooms: $rooms,
            sort: in_array($sort = (string) $request->query('sort', ''), self::SORTS, true) ? $sort : 'recent',
            bounds: self::boundsFrom((string) $request->query('bounds', '')),
            page: max(1, $request->integer('page', 1)),
            perPage: $perPage,
            budgetMin: $budgetMin > 0 ? $budgetMin : null,
            surfaceMin: $surfaceMin > 0 ? $surfaceMin : null,
            bedrooms: $ints('bedrooms', 1, 5),
            features: $among('features', Property::FEATURES),
            conditions: $among('condition', Property::CONDITIONS),
            floors: $among('floor', self::FLOORS),
            furnished: $furnished === '1' ? true : ($furnished === '0' ? false : null),
            availableOnly: $request->query('available') === '1',
            areas: collect((array) $request->query('area', []))->map(fn ($v) => trim((string) $v))->filter()->unique()->values()->all(),
        );
    }

    /** The same request forced on a transaction (the clean rentals landing `/nos-biens/location`, 2026-09-30). */
    public function withTransaction(string $transaction): self
    {
        return new self($this->cities, $this->budget, $transaction, $this->types, $this->rooms, $this->sort, $this->bounds, $this->page, $this->perPage, $this->budgetMin, $this->surfaceMin, $this->bedrooms, $this->features, $this->conditions, $this->floors, $this->furnished, $this->availableOnly, $this->areas);
    }

    /** The rentals landing is indexable on its plain first page: the transaction is the page, not a filter (2026-09-30). */
    public function isRentIndexable(): bool
    {
        return $this->page === 1 && $this->transaction === 'rent' && $this->cities === [] && $this->sort === 'recent'
            && ! $this->withTransaction('sale')->hasFiltersBesidesCities();
    }

    /** The same request narrowed to one arrondissement (the clean district URLs). @param list<int> $cities */
    public function withCities(array $cities): self
    {
        return new self($cities, $this->budget, $this->transaction, $this->types, $this->rooms, $this->sort, $this->bounds, $this->page, $this->perPage, $this->budgetMin, $this->surfaceMin, $this->bedrooms, $this->features, $this->conditions, $this->floors, $this->furnished, $this->availableOnly, $this->areas);
    }

    /**
     * `south,west,north,east` in degrees, kept only when it is a plausible box around Paris (a typo never filters
     * everything out silently). @return array{0: float, 1: float, 2: float, 3: float}|null
     */
    private static function boundsFrom(string $raw): ?array
    {
        $parts = array_map('floatval', explode(',', $raw));
        if (count($parts) !== 4 || $raw === '' || preg_match('/^-?[\d.]+(,-?[\d.]+){3}$/', $raw) !== 1) {
            return null;
        }
        [$south, $west, $north, $east] = $parts;
        $plausible = $south < $north && $west < $east && $south >= 48 && $north <= 49.5 && $west >= 1.5 && $east <= 3.2;

        return $plausible ? [round($south, 5), round($west, 5), round($north, 5), round($east, 5)] : null;
    }

    public function matches(Property $property): bool
    {
        return $property->transaction === $this->transaction
            && ($this->cities === [] || in_array($property->arrondissement, $this->cities, true))
            && ($this->types === [] || in_array($property->type, $this->types, true))
            && ($this->rooms === [] || in_array(min($property->rooms, 5), $this->rooms, true))
            && ($this->budget === null || $property->price <= $this->budget)
            && ($this->budgetMin === null || $property->price >= $this->budgetMin)
            && ($this->surfaceMin === null || $property->surface >= $this->surfaceMin)
            && ($this->bedrooms === [] || in_array(min($property->bedrooms, 5), $this->bedrooms, true))
            && array_diff($this->features, $property->features) === []
            && ($this->conditions === [] || in_array($property->condition, $this->conditions, true))
            && (! in_array('not_ground', $this->floors, true) || ($property->floor ?? 1) > 0)
            && (! in_array('top', $this->floors, true) || in_array('top_floor', $property->features, true))
            && ($this->furnished === null || $property->transaction !== 'rent' || $property->furnished === $this->furnished)
            && (! $this->availableOnly || $property->available)
            && ($this->areas === [] || in_array($property->area, $this->areas, true))
            && ($this->bounds === null || $this->inBounds($property));
    }

    private function inBounds(Property $property): bool
    {
        [$south, $west, $north, $east] = $this->bounds;

        return $property->lat >= $south && $property->lat <= $north && $property->lng >= $west && $property->lng <= $east;
    }

    public function hasFilters(): bool
    {
        return $this->cities !== [] || $this->hasFiltersBesidesCities();
    }

    /** Everything but the arrondissements: what makes a clean district page non-canonical. */
    public function hasFiltersBesidesCities(): bool
    {
        return $this->budget !== null || $this->transaction !== 'sale' || $this->types !== [] || $this->rooms !== [] || $this->bounds !== null
            || $this->budgetMin !== null || $this->surfaceMin !== null || $this->bedrooms !== [] || $this->features !== [] || $this->conditions !== []
            || $this->floors !== [] || $this->furnished !== null || $this->availableOnly || $this->areas !== [];
    }

    /** Only the unfiltered, default-sorted first page is indexable; filtered or re-sorted results and deeper pages are `noindex, follow`, like the search page. */
    public function isIndexable(): bool
    {
        return $this->page === 1 && ! $this->hasFilters() && $this->sort === 'recent';
    }

    /** A clean district URL is indexable on its plain first page (the arrondissement is the page, not a filter). */
    public function isDistrictIndexable(): bool
    {
        return $this->page === 1 && ! $this->hasFiltersBesidesCities() && $this->sort === 'recent';
    }

    /**
     * Applies the sort order to matching properties: `recent` keeps the source order, prices and surfaces sort stably
     * (equal values keep the source order).
     *
     * @param  Collection<int, Property>  $properties
     * @return Collection<int, Property>
     */
    public function sort(Collection $properties): Collection
    {
        return match ($this->sort) {
            'price_asc' => $properties->sortBy(fn (Property $p) => $p->price, SORT_NUMERIC)->values(),
            'price_desc' => $properties->sortByDesc(fn (Property $p) => $p->price, SORT_NUMERIC)->values(),
            'surface_desc' => $properties->sortByDesc(fn (Property $p) => $p->surface, SORT_NUMERIC)->values(),
            'surface_asc' => $properties->sortBy(fn (Property $p) => $p->surface, SORT_NUMERIC)->values(),
            'sqm_asc' => $properties->sortBy(fn (Property $p) => $p->pricePerSqm(), SORT_NUMERIC)->values(),
            default => $properties,
        };
    }

    public function offset(): int
    {
        return ($this->page - 1) * $this->perPage;
    }

    /**
     * Query params of this request for another page (route params, without the defaults). `withCities` = false leaves
     * the arrondissement out (it is in the path of a clean district URL). @return array<string, mixed>
     */
    public function params(?int $page = null, bool $withCities = true, bool $withTransaction = true): array
    {
        $page ??= $this->page;

        return array_filter([
            'city' => $withCities ? $this->cities : [],
            'budget' => $this->budget,
            'transaction' => $withTransaction && $this->transaction === 'rent' ? 'rent' : null,
            'type' => $this->types,
            'rooms' => $this->rooms,
            'sort' => $this->sort !== 'recent' ? $this->sort : null,
            'bounds' => $this->bounds !== null ? implode(',', $this->bounds) : null,
            'budget_min' => $this->budgetMin,
            'surface_min' => $this->surfaceMin,
            'bedrooms' => $this->bedrooms,
            'features' => $this->features,
            'condition' => $this->conditions,
            'floor' => $this->floors,
            'furnished' => $this->furnished === null ? null : ($this->furnished ? '1' : '0'),
            'available' => $this->availableOnly ? '1' : null,
            'area' => $this->areas,
            'page' => $page > 1 ? $page : null,
        ], fn ($value) => $value !== null && $value !== []);
    }

    /** The filters as the page's search bar and sort select read them. @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'city' => $this->cities, 'budget' => $this->budget, 'transaction' => $this->transaction, 'type' => $this->types, 'rooms' => $this->rooms, 'sort' => $this->sort, 'bounds' => $this->bounds,
            'budget_min' => $this->budgetMin, 'surface_min' => $this->surfaceMin, 'bedrooms' => $this->bedrooms, 'features' => $this->features, 'condition' => $this->conditions,
            'floor' => $this->floors, 'furnished' => $this->furnished, 'available' => $this->availableOnly, 'area' => $this->areas,
        ];
    }
}
