<?php

namespace App\Domain\Properties\Actions;

use App\Domain\Blog\Exceptions\SanityRequestFailed;
use App\Domain\Blog\Support\SanityClient;
use App\Domain\Properties\Support\SanityProperty;

/**
 * The published `estateProperty` documents of **every language in one GROQ query** (cached by `SanityClient`, 15 min,
 * warmed by `sanity:warm`), mapped to the row shape of `Property::fromArray()` and grouped by locale (2026-10-14).
 * One fetch serves both languages and lets the twin slugs be resolved here: the `translation.metadata` document of
 * the internationalization plugin when the Studio created one, else the documents sharing the same `uniqueId`.
 * Sanity down = an empty catalogue (reported, never a 500: the listing shows its empty state, the badge disappears).
 */
final class FetchSanityProperties
{
    public const FILTER = '_type == $type && defined(slug.current) && defined(language) && !(_id in path("drafts.**"))';

    public const PROJECTION = '_id, _updatedAt, language, status, confidential, accessCode, featured, title, "slug": slug.current, uniqueId,
        "createdAt": coalesce(createdAt, _createdAt),
        "agent": agent->{fullName, "slug": slug.current, photo{asset}},
        "categories": categories[]->{"slug": slug.current, name}, "propertyType": propertyType->slug.current,
        description, main, surfaces, floors, equipment, condition, address, hideExactAddress, arrondissement, location, metro,
        mainPhoto{alt, asset}, photos[]{alt, asset}, price, priceOnRequest, fees, dpe{notRequired, energyClass, energyConsumption, gesClass, gesEmissions}, condominium{ongoingProcedure}, metaDescription,
        "translations": *[_type == "translation.metadata" && references(^._id)][0].translations[]{ "lang": _key, "slug": value->slug.current }';

    /** @var array<string, list<array<string, mixed>>>|null the rows of this request (scoped binding: the listing page, its badge, its bounds and its district links share one read, 2026-10-14) */
    private ?array $memo = null;

    public function __construct(private readonly SanityClient $sanity, private readonly SanityProperty $mapper) {}

    /** @return array<string, list<array<string, mixed>>> locale → rows, newest first */
    public function __invoke(): array
    {
        return $this->memo ??= $this->rows();
    }

    /** @return array<string, list<array<string, mixed>>> */
    private function rows(): array
    {
        try {
            $docs = $this->sanity->fetch(
                sprintf('*[%s] | order(coalesce(createdAt, _createdAt) desc) { %s }', self::FILTER, self::PROJECTION),
                ['type' => (string) config('services.sanity.property_type', 'estateProperty')],
            );
        } catch (SanityRequestFailed $e) {
            report($e);

            return [];
        }

        $docs = array_values(array_filter(is_array($docs) ? $docs : [], fn ($doc) => is_array($doc) && SanityProperty::publishable($doc)));
        $byReference = [];
        foreach ($docs as $doc) {
            if (! empty($doc['uniqueId'])) {
                $byReference[$doc['uniqueId']][$doc['language']] = $doc['slug'];
            }
        }

        $rows = [];
        foreach ($docs as $doc) {
            $slugs = [];
            foreach ((array) ($doc['translations'] ?? []) as $translation) {
                if (is_array($translation) && is_string($translation['slug'] ?? null) && is_string($translation['lang'] ?? null)) {
                    $slugs[$translation['lang']] = $translation['slug'];
                }
            }
            $slugs += $byReference[$doc['uniqueId'] ?? ''] ?? [];
            $slugs[$doc['language']] = $doc['slug'];
            $rows[$doc['language']][] = $this->mapper->row($doc, $slugs);
        }

        return $rows;
    }
}
