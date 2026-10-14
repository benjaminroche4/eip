<?php

namespace App\Domain\Properties\Support;

use App\Domain\Blog\Support\SeoText;
use App\Domain\Content\Support\LocaleNumber;
use App\Domain\Properties\Data\Property;

/**
 * Meta title and description of a listing's detail page (2026-09-28, reworked 2026-10-14 on user request):
 * - **title** = the search intent first (« Appartement 4 pièces 118 m² à vendre, École Militaire · Paris 7e »): type,
 *   rooms, surface, « à vendre » / « à louer », quartier and arrondissement; the longest of four tiers (`TITLE_TIERS`)
 *   that fits in 60 characters, never clamped mid-sentence, brand prefix added when it still fits (`SeoText`);
 * - **description** = the editor's `metaDescription` from the Studio, verbatim (clamped at 160 on a word); without one,
 *   the facts, the excerpt and the call to action, 120-160.
 */
final class PropertySeo
{
    /** @return array{title: string, withBrand: bool, description: string} */
    /** Longest first; `_min` has no place but the arrondissement and always fits. */
    public const TITLE_TIERS = ['seo_title_full', 'seo_title', 'seo_title_short', 'seo_title_min'];

    public static function for(Property $property, string $locale): array
    {
        $title = self::title($property, $locale);
        if ($property->metaDescription !== null) {
            return ['title' => $title, 'withBrand' => SeoText::fitsBrand($title), 'description' => SeoText::description($property->metaDescription)];
        }

        // The excerpt is kept only when the whole description fits: the call to action must stay at the end, whole
        $values = self::values($property, $locale) + ['excerpt' => $property->excerpt];
        // An undisclosed price (« sur demande ») never reaches the meta description either (2026-10-14); a rental says « par mois », never « honoraires inclus » (SEO audit 2026-10-14)
        [$long, $short] = match (true) {
            $property->priceOnRequest => ['seo_description_on_request', 'seo_description_on_request'],
            $property->transaction === 'rent' => ['seo_description_rent', 'seo_description_short_rent'],
            default => ['seo_description', 'seo_description_short'],
        };
        $description = __("ui.property.$long", $values, $locale);
        if (mb_strlen($description) > SeoText::DESCRIPTION_MAX) {
            $description = __("ui.property.$short", $values, $locale);
        }

        return [
            'title' => $title,
            'withBrand' => SeoText::fitsBrand($title),
            'description' => SeoText::description($description),
        ];
    }

    /** The longest title tier within 60 characters (the keyword and the place stay whole: no clamp). */
    public static function title(Property $property, string $locale): string
    {
        $values = self::values($property, $locale);
        foreach (self::TITLE_TIERS as $key) {
            $candidate = trim(__("ui.property.$key", $values, $locale));
            if (mb_strlen($candidate) <= SeoText::TITLE_MAX) {
                return $candidate;
            }
        }

        return SeoText::title(__('ui.property.seo_title_min', $values, $locale));
    }

    /** @return array<string, string|int> */
    public static function values(Property $property, string $locale): array
    {
        $type = __("ui.properties.types.{$property->type}", [], $locale);
        // A listing without a quartier (Sanity has no such field yet): the arrondissement takes its place, « Paris » the arrondissement's
        $arrondissement = 'Paris '.DistrictSlug::ordinal($property->arrondissement, $locale);
        $area = $property->area !== '' ? $property->area : $arrondissement;

        return [
            'type' => $type,
            'type_lower' => mb_strtolower(mb_substr($type, 0, 1)).mb_substr($type, 1),
            'rooms' => $property->rooms,
            'rooms_label' => trans_choice('ui.property.rooms_count', $property->rooms, ['count' => $property->rooms], $locale),
            'bedrooms' => $property->bedrooms,
            'surface' => $property->surface,
            'area' => $area,
            'arrondissement' => $area === $arrondissement ? 'Paris' : $arrondissement,
            // Title parts: « École Militaire · Paris 7e » (or the arrondissement alone) and the transaction keyword
            'place' => $area === $arrondissement ? $arrondissement : "$area · $arrondissement",
            'district' => $arrondissement,
            'intent' => __('ui.property.'.($property->transaction === 'rent' ? 'intent_rent' : 'intent_sale'), [], $locale),
            'price' => $property->priceOnRequest ? '' : __('ui.districts.price_format', ['price' => self::number($property->price, $locale)], $locale),
        ];
    }

    /** « 1 890 000 » / « 1,890,000 » (as `lib/format-price.ts`, narrow no-break space in French). */
    private static function number(int $amount, string $locale): string
    {
        return LocaleNumber::integer($amount, $locale);
    }
}
