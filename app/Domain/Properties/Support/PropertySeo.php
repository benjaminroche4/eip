<?php

namespace App\Domain\Properties\Support;

use App\Domain\Blog\Support\SeoText;
use App\Domain\Properties\Data\Property;

/**
 * Meta title and description of a listing's detail page (2026-09-28), built from its data as the SEO conventions ask
 * (« {Type} {pièces} {quartier} · Estate in Paris », keyword first, place next) rather than from the editorial title:
 * title ≤ 60 with the suffix when it fits (`SeoText`), description 120-160 = the facts, the excerpt, then the call
 * to action, clamped on a word.
 */
final class PropertySeo
{
    /** @return array{title: string, withSuffix: bool, description: string} */
    public static function for(Property $property, string $locale): array
    {
        $title = SeoText::title(__('ui.property.seo_title', self::values($property, $locale), $locale));

        // The excerpt is kept only when the whole description fits: the call to action must stay at the end, whole
        $values = self::values($property, $locale) + ['excerpt' => $property->excerpt];
        $description = __('ui.property.seo_description', $values, $locale);
        if (mb_strlen($description) > SeoText::DESCRIPTION_MAX) {
            $description = __('ui.property.seo_description_short', $values, $locale);
        }

        return [
            'title' => $title,
            'withSuffix' => SeoText::fitsSuffix($title),
            'description' => SeoText::description($description),
        ];
    }

    /** @return array<string, string|int> */
    public static function values(Property $property, string $locale): array
    {
        $type = __("ui.properties.types.{$property->type}", [], $locale);

        return [
            'type' => $type,
            'type_lower' => mb_strtolower(mb_substr($type, 0, 1)).mb_substr($type, 1),
            'rooms' => $property->rooms,
            'bedrooms' => $property->bedrooms,
            'surface' => $property->surface,
            'area' => $property->area,
            'arrondissement' => 'Paris '.DistrictSlug::ordinal($property->arrondissement, $locale),
            'price' => __('ui.districts.price_format', ['price' => self::number($property->price, $locale)], $locale),
        ];
    }

    /** « 1 890 000 » / « 1,890,000 » (as `lib/format-price.ts`, narrow no-break space in French). */
    private static function number(int $amount, string $locale): string
    {
        return $locale === 'fr' ? number_format($amount, 0, ',', "\u{202F}") : number_format($amount);
    }
}
